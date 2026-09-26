# StockSense — Implementation Plan

> [!IMPORTANT]
> Read [REQUIREMENTS.md](./REQUIREMENTS.md), [API_CONTRACT.md](./API_CONTRACT.md), and [wireframe.md](./wireframe.md) before starting any task. All behaviour is spec'd in those documents.

---

## Doc Consistency Issues Fixed Before Implementation

| # | Location | Issue | Resolution |
|---|----------|-------|------------|
| 1 | `REQUIREMENTS.md` & `wireframe.md` | **Duplicate content** — both files are nearly identical (same text, same mock-up link). `wireframe.md` should contain screen layouts, not a copy of the requirements. | Keep `REQUIREMENTS.md` as the source of truth. `wireframe.md` should be updated to reference Excalidraw only. |
| 2 | `REQUIREMENTS.md` L37–49 | **Navigation item listed twice** — "Products" appears before and after the heading "## Navigation". | The block before `## Navigation` is a stray duplicate and should be removed. |
| 3 | `REQUIREMENTS.md` L52–53 | **"2. Operations" duplicated** on consecutive lines. | Remove one occurrence. |
| 4 | `REQUIREMENTS.md` L87–89 / L133–135 | **"Process:" and "Steps:" section headings duplicated** immediately below their `##` heading. | Remove the inline text duplicates. |
| 5 | `REQUIREMENTS.md` L122–124 | **"Each movement is logged in the ledger." duplicated.** | Remove duplicate. |
| 6 | `wireframe.md` L166 | **Broken Excalidraw link** — trailing `]` causes a broken markdown link (`https://...o8R]`). | Remove trailing `]`. |
| 7 | `REQUIREMENTS.md` / `wireframe.md` | **"Waiting" status listed in Dynamic Filters** (`By status: Draft, Waiting, Ready, Done, Canceled`) but Receipts and Transfers have no `WAITING` status in the API contract. Only Deliveries have `WAITING`. | Receipts: `DRAFT → READY → DONE / CANCELED`. Transfers: `DRAFT → READY → DONE / CANCELED`. Deliveries: `DRAFT → WAITING → READY → DONE / CANCELED`. The filter UI should only show `WAITING` when scoped to Deliveries. |
| 8 | `REQUIREMENTS.md` L32 | **"Internal Transfers" listed under Dynamic Filters doc-type** as "Internal" but the API references it as "transfer". | Align UI label to "Internal Transfer" and API type to `transfer`. |
| 9 | `API_CONTRACT.md` §14 `GET /profile` | **Duplicates `GET /auth/me`** — both return the same user profile. | `/auth/me` is the auth check (used with the JWT on app load). `/profile` is the user-settings endpoint. They can coexist but must not be confused. `/profile` should return editable fields; `/auth/me` is read-only identity. |
| 10 | `API_CONTRACT.md` §5 `POST /categories` | **Missing `message` field** in the `201` response — all other create endpoints include it. | Add `"message": "Category created successfully"` to the response. |
| 11 | `API_CONTRACT.md` §6 `GET /stock` | **Field name mismatch** — response uses `"unitCost"` but `GET /products` and `POST /products` use `"costPerUnit"`. | Standardise to `"costPerUnit"` everywhere. |
| 12 | `API_CONTRACT.md` §13 `POST /reordering-rules` | **`enabled` field missing from create request** but present in list response. | Add `"enabled": true` (default) to the create schema, making it optional with a server default of `true`. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query v5, React Hook Form, Zod, React Router v6, Recharts, Lucide React |
| **Backend** | Node.js, TypeScript, Express, Zod (request validation), Drizzle ORM, JWT, Argon2id, Nodemailer, Helmet, CORS, express-rate-limit |
| **Database** | PostgreSQL |
| **Infrastructure** | Docker, Docker Compose, Nginx (reverse proxy), GitHub Actions (CI) |

---

## Repository Structure

```
stocksense/
├── apps/
│   ├── frontend/          # Vite + React app
│   └── backend/           # Express API
├── packages/
│   └── shared-types/      # Shared Zod schemas & TS types (optional)
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

## Database Schema (Drizzle ORM / PostgreSQL)

```
users
  id uuid PK
  login_id varchar(12) UNIQUE NOT NULL
  email varchar UNIQUE NOT NULL
  password_hash text NOT NULL
  created_at, updated_at, created_by, updated_by

password_reset_otps
  id uuid PK
  user_id uuid FK -> users
  otp_hash text NOT NULL
  expires_at timestamptz NOT NULL
  used boolean DEFAULT false
  created_at

reset_tokens
  id uuid PK
  user_id uuid FK -> users
  token_hash text NOT NULL
  expires_at timestamptz NOT NULL
  used boolean DEFAULT false

warehouses
  id uuid PK
  name varchar NOT NULL
  short_code varchar UNIQUE NOT NULL
  address text
  is_active boolean DEFAULT true
  created_at, updated_at, created_by, updated_by

locations
  id uuid PK
  warehouse_id uuid FK -> warehouses
  name varchar NOT NULL
  short_code varchar NOT NULL
  is_active boolean DEFAULT true
  UNIQUE(warehouse_id, short_code)
  created_at, updated_at, created_by, updated_by

categories
  id uuid PK
  name varchar UNIQUE NOT NULL
  is_active boolean DEFAULT true
  created_at, updated_at, created_by, updated_by

products
  id uuid PK
  sku varchar UNIQUE NOT NULL
  name varchar NOT NULL
  category_id uuid FK -> categories
  unit_of_measure varchar NOT NULL
  cost_per_unit numeric(12,2)
  reorder_point integer DEFAULT 0
  reorder_quantity integer DEFAULT 0
  is_active boolean DEFAULT true
  created_at, updated_at, created_by, updated_by

stock_levels
  id uuid PK
  product_id uuid FK -> products
  location_id uuid FK -> locations
  on_hand integer NOT NULL DEFAULT 0
  reserved integer NOT NULL DEFAULT 0
  CHECK (on_hand >= 0)
  CHECK (reserved >= 0)
  CHECK (on_hand >= reserved)
  UNIQUE(product_id, location_id)
  updated_at

reordering_rules
  id uuid PK
  product_id uuid FK -> products
  warehouse_id uuid FK -> warehouses
  location_id uuid FK -> locations
  reorder_point integer NOT NULL
  reorder_quantity integer NOT NULL
  enabled boolean DEFAULT true
  created_at, updated_at, created_by, updated_by

receipts
  id uuid PK
  reference varchar UNIQUE NOT NULL
  warehouse_id uuid FK -> warehouses
  destination_location_id uuid FK -> locations
  supplier_name varchar
  scheduled_at timestamptz
  responsible_user_id uuid FK -> users
  status varchar CHECK IN ('DRAFT','READY','DONE','CANCELED')
  validated_at timestamptz
  created_at, updated_at, created_by, updated_by

receipt_items
  id uuid PK
  receipt_id uuid FK -> receipts
  product_id uuid FK -> products
  quantity integer NOT NULL CHECK (quantity > 0)
  received_quantity integer DEFAULT 0

delivery_orders
  id uuid PK
  reference varchar UNIQUE NOT NULL
  warehouse_id uuid FK -> warehouses
  source_location_id uuid FK -> locations
  delivery_address text
  scheduled_at timestamptz
  responsible_user_id uuid FK -> users
  status varchar CHECK IN ('DRAFT','WAITING','READY','DONE','CANCELED')
  validated_at timestamptz
  created_at, updated_at, created_by, updated_by

delivery_items
  id uuid PK
  delivery_id uuid FK -> delivery_orders
  product_id uuid FK -> products
  requested_quantity integer NOT NULL CHECK (requested_quantity > 0)

transfers
  id uuid PK
  reference varchar UNIQUE NOT NULL
  warehouse_id uuid FK -> warehouses
  source_location_id uuid FK -> locations
  destination_location_id uuid FK -> locations
  scheduled_at timestamptz
  responsible_user_id uuid FK -> users
  status varchar CHECK IN ('DRAFT','READY','DONE','CANCELED')
  validated_at timestamptz
  created_at, updated_at, created_by, updated_by

transfer_items
  id uuid PK
  transfer_id uuid FK -> transfers
  product_id uuid FK -> products
  quantity integer NOT NULL CHECK (quantity > 0)

inventory_ledger  (APPEND-ONLY)
  id uuid PK
  reference varchar NOT NULL
  movement_type varchar CHECK IN ('IN','OUT','TRANSFER_OUT','TRANSFER_IN','ADJUSTMENT')
  product_id uuid FK -> products
  from_location_id uuid FK -> locations NULLABLE
  to_location_id uuid FK -> locations NULLABLE
  quantity integer NOT NULL
  source_document_id uuid NULLABLE
  source_document_type varchar NULLABLE
  contact varchar NULLABLE
  performed_by uuid FK -> users
  performed_at timestamptz NOT NULL DEFAULT now()
  created_at

idempotency_keys
  key varchar PK
  response_body jsonb
  created_at
```

---

## Phases

### Phase 0 — Project Bootstrap

**Both teams in parallel.**

- [ ] Monorepo scaffolding (npm workspaces)
- [ ] Backend: Express + TypeScript skeleton, Drizzle config, Zod setup, Helmet/CORS/rate-limit middleware
- [ ] Frontend: Vite + React + TypeScript, Tailwind + shadcn/ui init, React Router scaffold
- [ ] Docker Compose (postgres + backend + frontend + nginx)
- [ ] GitHub Actions CI skeleton (lint + typecheck + build)
- [ ] Shared environment variables documented in `.env.example`

---

### Phase 1 — Auth

- [ ] **BE** — `POST /auth/signup`, `POST /auth/login` (Argon2id hashing, JWT issue)
- [ ] **BE** — `GET /auth/me`, `POST /auth/logout` (token blocklist in DB or Redis)
- [ ] **BE** — `POST /auth/password-reset/request` (OTP via Nodemailer), `POST /auth/password-reset/verify`, `POST /auth/password-reset`
- [ ] **FE** — Login page, Signup page
- [ ] **FE** — Forgot password → OTP entry → New password flow
- [ ] **FE** — Auth context / TanStack Query auth hooks, protected routes, token refresh strategy
- [ ] **FE** — Sidebar shell with profile menu (My Profile, Logout)

---

### Phase 2 — Configuration (Warehouses, Locations, Categories)

- [ ] **BE** — CRUD for `/warehouses`, `/locations`, `/categories`
- [ ] **BE** — Soft-delete guards (no delete if stock or history exists)
- [ ] **FE** — Settings page: Warehouse list + create/edit form
- [ ] **FE** — Settings page: Location list per warehouse + create/edit form
- [ ] **FE** — Settings page: Category list + create/edit form

---

### Phase 3 — Products & Stock Availability

- [ ] **BE** — `GET /products`, `POST /products` (with initial stock → ledger entry), `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id` (soft deactivate)
- [ ] **BE** — `GET /stock`, `GET /stock/:productId`
- [ ] **BE** — `GET /reordering-rules`, `POST /reordering-rules`, `PATCH`, `DELETE`
- [ ] **FE** — Products list page (table, filters by category/warehouse/stockStatus, SKU search)
- [ ] **FE** — Product create/edit form (React Hook Form + Zod)
- [ ] **FE** — Stock availability sub-page per product (location breakdown)
- [ ] **FE** — Reordering rules UI inside product detail

---

### Phase 4 — Operations Core

#### Receipts

- [ ] **BE** — Full receipts CRUD + status transitions (`/ready`, `/validate`, `/cancel`) with atomic DB transaction
- [ ] **FE** — Receipts list + create/edit form + detail view with status action buttons

#### Deliveries

- [ ] **BE** — Full deliveries CRUD + status transitions (`/confirm`, `/ready`, `/validate`, `/cancel`) — stock reservation + WAITING logic
- [ ] **FE** — Deliveries list + create/edit form + detail view

#### Internal Transfers

- [ ] **BE** — Full transfers CRUD + status transitions (`/ready`, `/validate`, `/cancel`) — atomic dual ledger entry
- [ ] **FE** — Transfers list + create/edit form + detail view

#### Stock Adjustments

- [ ] **BE** — `POST /stock/adjustments` with idempotency key, ledger entry, `WH/ADJ/XXXX` reference
- [ ] **FE** — Inventory Adjustment form (product + location + counted qty + reason)

---

### Phase 5 — Inventory Ledger & Move History

- [ ] **BE** — `GET /inventory/moves`, `GET /inventory/moves/:moveId` (paginated, filtered)
- [ ] **FE** — Move History page (filterable by type, product, warehouse, date range)

---

### Phase 6 — Dashboard

- [ ] **BE** — `GET /dashboard` KPIs (total, low stock, out of stock, pending receipts/deliveries, scheduled transfers)
- [ ] **BE** — `GET /dashboard/operations` (receipts/deliveries stats)
- [ ] **FE** — Dashboard page: KPI cards, operations stats panel, Recharts chart (stock by category or movement trend)

---

### Phase 7 — Global Search & Profile

- [ ] **BE** — `GET /search` across products, receipts, deliveries, transfers, ledger
- [ ] **BE** — `GET /profile`, `PATCH /profile`
- [ ] **FE** — Global search bar (TanStack Query debounced)
- [ ] **FE** — Profile settings page

---

### Phase 8 — Idempotency, Rate Limiting & Hardening

- [ ] **BE** — Idempotency key middleware for validate/adjustment endpoints
- [ ] **BE** — express-rate-limit on auth endpoints (stricter) + global limit
- [ ] **BE** — Comprehensive error codes (§20 of API contract)
- [ ] **BE** — Input sanitisation review
- [ ] **FE** — Error boundary, toast notifications (shadcn/ui `Sonner`), loading skeletons
- [ ] **FE** — Low-stock alert badge in sidebar

---

### Phase 9 — CI/CD & Deployment Prep

- [ ] GitHub Actions: lint, typecheck, test (Jest/Vitest), Docker build
- [ ] Nginx config: SSL termination, proxy to backend + frontend
- [ ] Docker Compose production profile
- [ ] `.env` secrets management

---

## Key Engineering Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| JWT strategy | Short-lived access token (15 min) + server-side token blocklist for logout | API contract requires server-side session invalidation |
| OTP storage | Hashed OTP in DB + `reset_token` after verify | Security: never store raw OTP |
| Stock mutations | Drizzle transactions only | Guarantee atomicity per §18 of API contract |
| Ledger | Append-only table, no UPDATE/DELETE allowed at ORM layer | Per §10 of API contract |
| Soft delete | `is_active` flag on products, warehouses, locations, categories | Historical references must remain valid |
| Reference numbers | DB sequence per (warehouse, operation_type) | Uniqueness + correct ordering |
| Frontend state | TanStack Query for server state; React Context only for auth | Avoid unnecessary global state |
| Form validation | Zod schema shared between FE (React Hook Form) and BE request validation | Single source of truth |
