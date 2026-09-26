# StockSense — Frontend Work Split
**Team: 2 developers (FE-1 = you, FE-2 = teammate)**

All frontend code lives in `apps/frontend/`. Stack: React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query v5 · React Hook Form · Zod · React Router v6 · Recharts · Lucide React.

---

## Shared Responsibilities (Both)

- Code review each other's PRs before merge.
- Agree on folder structure and component naming conventions early.
- Maintain `apps/frontend/src/lib/api.ts` (Axios/fetch client with auth header injection) together.
- Share Zod schemas for form validation in `apps/frontend/src/schemas/`.

---

## FE-1 — You

### Phase 0 — Bootstrap
- [x] Scaffold Vite project with TypeScript
- [x] Configure Tailwind CSS + shadcn/ui init
- [x] Set up React Router v6 (route tree, protected route wrapper, layout shell with top navigation bar)
- [x] Auth context (`useAuth` hook, JWT storage, token expiry handling)
- [x] TanStack Query client setup (`QueryClientProvider`, global error handling)
- [x] `.env` setup and API base URL config

### Phase 1 — Auth Pages
- [x] **Login page** (`/login`) — React Hook Form + Zod, login mutation, redirect on success
- [x] **Signup page** (`/signup`) — form validation (loginId 6–12 chars, password strength)
- [x] **Forgot Password flow** — 3-step:
  - Step 1: Email entry (`POST /auth/password-reset/request`)
  - Step 2: OTP verification (`POST /auth/password-reset/verify`)
  - Step 3: New password form (`POST /auth/password-reset`)
- [x] **Protected route** — redirect unauthenticated users to `/login`
- [x] **Top Navigation Bar layout** — navigation links, hover dropdowns, Profile Menu (My Profile, Logout)

### Phase 2 — Settings: Warehouses & Locations
- [x] **Settings / Warehouses page** (`/settings/warehouses`)
  - Table: name, short code, address, location count
  - Create / Edit modal (React Hook Form + Zod)
  - Soft-delete guard toast when deletion blocked
- [x] **Settings / Locations page** (`/settings/warehouses/:warehouseId/locations`)
  - Location list per warehouse
  - Create / Edit inline or modal

### Phase 3 — Products
- [x] **Products list page** (`/products`)
  - Table with columns: SKU, Name, Category, UoM, On Hand, Free to Use, Reorder Point
  - Filters: search (SKU/name), category dropdown, warehouse/location, stock status (`all|low|out|available`)
  - Sort by any column
  - Pagination
- [x] **Product create page** (`/products/new`) — full form with: name, SKU, category, UoM, cost per unit, initial stock (optional + location picker), reorder point, reorder qty
- [x] **Product detail / edit page** (`/products/:productId`) — metadata edit (stock not editable here), stock breakdown table by location, reordering rules sub-section

### Phase 4 — Operations: Receipts
- [x] **Receipts list page** (`/operations/receipts`) — table, filters (status, warehouse, date range, search), pagination
- [x] **Receipt create page** (`/operations/receipts/new`) — warehouse + destination location picker, supplier name, scheduled date, line items (product + qty)
- [x] **Receipt detail page** (`/operations/receipts/:receiptId`) — full info, line items, status badge, action buttons: **Mark Ready** / **Validate** / **Cancel** (conditional per status)

### Phase 6 — Dashboard
- [x] **Dashboard page** (`/dashboard`) — default landing after login
  - KPI cards: Total Products, Low Stock, Out of Stock, Pending Receipts, Pending Deliveries, Scheduled Transfers
  - Operations stats panel (receipts / deliveries: toReceive, late, waiting)
  - **Recharts** chart: stock movement trend (IN vs OUT quantities — derive from `/inventory/moves` or a dedicated aggregate)

### Phase 7 — Global Search & Profile
- [ ] **Global search bar** in header — debounced `GET /search`, shows categorised results (products, receipts, deliveries, transfers), navigate on select
- [ ] **My Profile page** (`/profile`) — display loginId, email; update email form

### Phase 8 — Polish
- [ ] Low-stock alert badge on sidebar "Products" link (red dot when `lowStockItems > 0`)
- [ ] Error boundary component (fallback UI for crashed routes)
- [ ] Loading skeletons for all list pages
- [ ] Toast notifications (shadcn/ui Sonner) for all mutations

---

## FE-2 — Teammate

### Phase 0 — Bootstrap
- [x] Set up React Router page stubs for every route (empty components — unblocks routing)
- [x] Set up shared API query hooks structure (`apps/frontend/src/hooks/`)
- [x] Configure ESLint + Prettier + Husky pre-commit
- [x] Vitest + Testing Library scaffold (`apps/frontend/src/tests/`)

### Phase 2 — Settings: Categories
- [x] **Settings / Categories page** (`/settings/categories`)
  - Table: name, product count
  - Create / Edit modal
  - Cannot delete if products assigned — show error toast

### Phase 3 — Stock Availability
- [x] **Stock page** (`/stock`) — inventory availability table
  - Columns: SKU, Product, Warehouse, Location, On Hand, Reserved, Free to Use, Cost/Unit
  - Filters: warehouse, location, category, product, stockStatus
  - Pagination
- [x] **Reordering Rules** sub-page or modal within Product detail — list rules, create/edit/delete rule form

### Phase 4 — Operations: Deliveries & Transfers
- [x] **Deliveries list page** (`/operations/deliveries`) — table, filters, pagination
- [x] **Delivery create page** (`/operations/deliveries/new`) — warehouse + source location picker, delivery address, scheduled date, line items
- [x] **Delivery detail page** (`/operations/deliveries/:deliveryId`) — details, `WAITING` stock-insufficient banner, action buttons: **Confirm** / **Mark Ready** / **Validate** / **Cancel**
- [x] **Transfers list page** (`/operations/transfers`) — table, filters, pagination
- [x] **Transfer create page** (`/operations/transfers/new`) — warehouse, source location, destination location, scheduled date, line items
- [x] **Transfer detail page** (`/operations/transfers/:transferId`) — details, action buttons: **Mark Ready** / **Validate** / **Cancel**

### Phase 4 — Stock Adjustments
- [x] **Inventory Adjustment page** (`/operations/adjustments/new`)
  - Product picker + location picker
  - "Counted Quantity" input
  - System shows current On Hand + calculated difference
  - Reason field
  - Submit → `POST /stock/adjustments`
- [x] **Adjustments history list** (`/operations/adjustments`) — read from `/inventory/moves?movementType=ADJUSTMENT`

### Phase 5 — Move History
- [x] **Move History page** (`/history`)
  - Table: reference, type badge (IN/OUT/TRANSFER/ADJUSTMENT), product, qty, from/to location, contact, date
  - Filters: movement type, product (search), warehouse, date range
  - Pagination
  - Click row → detail modal or `/history/:moveId` page

### Phase 8 — Polish
- [x] Consistent empty-state illustrations / messages for all list pages
- [x] Responsive layout check on all pages (tablet min-width)
- [x] Form accessibility: ARIA labels, keyboard navigation, focus management on modals
- [x] Write Vitest unit tests for all Zod form schemas and critical utility functions

---

## Suggested Folder Structure

```
apps/frontend/src/
├── components/
│   ├── ui/          # shadcn/ui generated components
│   └── shared/      # Shared app-level components (PageHeader, DataTable, StatusBadge…)
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── stock/
│   ├── receipts/
│   ├── deliveries/
│   ├── transfers/
│   ├── adjustments/
│   ├── history/
│   ├── settings/
│   └── profile/
├── hooks/           # Shared TanStack Query hooks
├── lib/
│   ├── api.ts       # HTTP client
│   └── utils.ts
├── schemas/         # Zod schemas (form + shared)
├── router/          # Route definitions
└── types/           # TypeScript types mirroring API contract
```
