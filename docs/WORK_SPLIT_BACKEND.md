# StockSense — Backend & Database Work Split
**Team: 2 developers (BE-1, BE-2)**

All backend code lives in `apps/backend/`. Database migrations and schema in `apps/backend/src/db/`. Stack: Node.js · TypeScript · Express · Zod · Drizzle ORM · PostgreSQL · JWT · Argon2id · Nodemailer · Helmet · CORS · express-rate-limit.

---

## Shared Responsibilities (Both)

- Code review each other's PRs before merge.
- Both own the database schema — discuss table changes together.
- Maintain `apps/backend/src/middleware/` together (auth middleware, error handler, rate limiter).
- Any stock-changing operation must use a Drizzle transaction — enforce this in PR reviews.
- Ledger is append-only — no UPDATE/DELETE allowed on `inventory_ledger`.

---

## BE-1

### Phase 0 — Bootstrap ✅
- [x] Express + TypeScript project skeleton (`apps/backend/`)
- [x] Helmet, CORS, express-rate-limit global middleware
- [x] Zod request validation middleware
- [x] Centralized error handler (maps to error codes from §20 of API contract)
- [x] Drizzle ORM config + PostgreSQL connection
- [x] Docker Compose: `postgres` + `backend` services
- [x] `.env.example` with all required env vars

### Phase 0 — Database Schema ✅ (both together, BE-1 executes)
- [x] Write and run initial Drizzle migration with all tables from the schema in `IMPLEMENTATION_PLAN.md`
- [x] DB constraints: `CHECK (on_hand >= 0)`, `CHECK (on_hand >= reserved)`, unique indexes
- [x] Seed script: default admin user + one warehouse + one location

### Phase 1 — Auth ✅
- [x] `POST /auth/signup` — Argon2id hash, loginId unique check, JWT issue
- [x] `POST /auth/login` — credential validation, JWT issue
- [x] `GET /auth/me` — auth middleware protected
- [x] `POST /auth/logout` — server-side token blocklist (store JWT `jti` in DB or `revoked_tokens` table)
- [x] `POST /auth/password-reset/request` — generate 6-digit OTP, hash + store in `password_reset_otps`, send via Nodemailer (never reveal email existence)
- [x] `POST /auth/password-reset/verify` — verify OTP hash, mark used, issue `reset_token`
- [x] `POST /auth/password-reset` — verify reset token, Argon2id hash new password, mark token used
- [x] Auth middleware (`requireAuth`) — verify JWT, attach user to `req.user`
- [x] Rate limiter on auth routes: 10 requests / 15 min per IP

### Phase 2 — Configuration: Warehouses & Locations ✅
- [x] `GET /warehouses`, `POST /warehouses` (`shortCode` unique)
- [x] `GET /warehouses/:id`, `PATCH /warehouses/:id` (short code change does not affect historical refs)
- [x] `DELETE /warehouses/:id` — soft delete, blocked if stock or ops exist
- [x] `GET /locations?warehouseId=`, `POST /locations`
- [x] `GET /locations/:id`, `PATCH /locations/:id`, `DELETE /locations/:id` (soft delete guard)
- [x] Reference number generator utility: `<WAREHOUSE_CODE>/IN/<SEQ>`, `/OUT/`, `/INT/`, `/ADJ/` — DB sequence per (warehouse_id, type)

### Phase 3 — Products ✅
- [x] `GET /products` — paginated, filterable (search, sku, categoryId, warehouseId, locationId, stockStatus, sort)
- [x] `POST /products` — create product; if `initialStock > 0`, open transaction: insert `stock_levels` + insert `inventory_ledger` (type=`IN`, reference=`WH/ADJ/XXXX`)
- [x] `GET /products/:id`
- [x] `PATCH /products/:id` — metadata only, SKU cannot change, stock not updated here
- [x] `DELETE /products/:id` — soft deactivate, blocked if movements exist

### Phase 4 — Operations: Receipts ✅
- [x] `GET /receipts` — paginated, filterable
- [x] `POST /receipts` — create `DRAFT`, generate reference
- [x] `GET /receipts/:id` — with line items
- [x] `PATCH /receipts/:id` — blocked if DONE/CANCELED
- [x] `POST /receipts/:id/ready` — `DRAFT → READY`
- [x] `POST /receipts/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - for each item: `stock_levels.on_hand += quantity` (INSERT or UPDATE with conflict)
  - insert `inventory_ledger` entries (type=`IN`)
  - set `validated_at`, mark DONE
  - idempotency key check
- [x] `POST /receipts/:id/cancel` — `DRAFT|READY → CANCELED`

### Phase 5 — Inventory Ledger ✅
- [x] `GET /inventory/moves` — paginated, filterable (reference, productId, warehouseId, locationId, movementType, dateFrom, dateTo)
- [x] `GET /inventory/moves/:id`

### Phase 6 — Dashboard ✅
- [x] `GET /dashboard` — KPI aggregation query (total products in stock, low/out stock, pending receipts/deliveries, scheduled transfers); supports warehouseId/locationId/categoryId filters
- [x] `GET /dashboard/operations` — receipts stats (toReceive, late, operations) + deliveries stats (toDeliver, late, waiting, operations)

### Phase 7 — Global Search & Profile ✅
- [x] `GET /search?q=&type=&limit=` — fuzzy search across products (SKU/name), receipts (reference), deliveries, transfers, ledger moves
- [x] `GET /profile` — return current user's editable profile
- [x] `PATCH /profile` — update email only; cannot change loginId or password here

### Phase 8 — Hardening ✅
- [x] Idempotency middleware: check `idempotency_keys` table, return cached response on duplicate key
- [x] Apply idempotency to: `POST /receipts/:id/validate`, `POST /deliveries/:id/validate`, `POST /transfers/:id/validate`, `POST /stock/adjustments`
- [x] Audit field middleware: auto-populate `created_by`, `updated_by` from `req.user`
- [x] Full error code coverage (§20 of API contract) — all handlers must return typed error codes

---

## BE-2

### Phase 0 — Bootstrap ✅
- [x] Nginx config (`nginx/nginx.conf`): reverse proxy `/api` → backend, `/` → frontend static
- [x] GitHub Actions CI (`.github/workflows/ci.yml`): lint + typecheck + build on push to `main` / PR
- [x] Vitest config for backend unit tests
- [x] `apps/backend/src/utils/` helpers: pagination helper, async handler wrapper, logger

### Phase 2 — Configuration: Categories ✅
- [x] `GET /categories` — paginated, searchable, with `productCount`
- [x] `POST /categories` — unique name
- [x] `PATCH /categories/:id`
- [x] `DELETE /categories/:id` — blocked if products assigned

### Phase 3 — Stock Availability & Reordering Rules ✅
- [x] `GET /stock` — paginated, filterable, computed `freeToUse = onHand - reserved`, `costPerUnit`
- [x] `GET /stock/:productId` — total + per-location breakdown
- [x] `POST /stock/adjustments` — **atomic transaction**:
  - compute `difference = countedQuantity - currentOnHand`
  - update `stock_levels.on_hand`
  - insert `inventory_ledger` (type=`ADJUSTMENT`, reference=`WH/ADJ/XXXX`)
  - idempotency key check
  - enforce `on_hand >= 0`
- [x] `GET /reordering-rules` — filterable by productId, warehouseId, locationId
- [x] `POST /reordering-rules` — default `enabled: true`
- [x] `PATCH /reordering-rules/:id`
- [x] `DELETE /reordering-rules/:id`

### Phase 4 — Operations: Deliveries ✅
- [x] `GET /deliveries` — paginated, filterable
- [x] `POST /deliveries` — create `DRAFT`, generate reference `WH/OUT/XXXX`
- [x] `GET /deliveries/:id` — with line items + `availableQuantity` per item
- [x] `PATCH /deliveries/:id` — blocked if DONE/CANCELED
- [x] `POST /deliveries/:id/confirm` — `DRAFT → READY` or `DRAFT → WAITING`:
  - for each item, check `stock_levels.freeToUse >= requestedQuantity`
  - if all OK → READY
  - if any insufficient → WAITING
- [x] `POST /deliveries/:id/ready` — `WAITING → READY`, recheck all items have sufficient free stock
- [x] `POST /deliveries/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - verify sufficient stock for each item
  - `stock_levels.on_hand -= quantity` for each item (enforce `on_hand >= 0`)
  - insert `inventory_ledger` entries (type=`OUT`)
  - set `validated_at`, mark DONE
  - idempotency key check
- [x] `POST /deliveries/:id/cancel` — allowed before DONE

### Phase 4 — Operations: Internal Transfers ✅
- [x] `GET /transfers` — paginated, filterable
- [x] `POST /transfers` — create `DRAFT`, generate reference `WH/INT/XXXX`
- [x] `GET /transfers/:id` — with line items
- [x] `PATCH /transfers/:id` — blocked if DONE/CANCELED
- [x] `POST /transfers/:id/ready` — `DRAFT → READY`:
  - verify sufficient `freeToUse` at source location for each item
- [x] `POST /transfers/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - verify sufficient stock
  - for each item: `source.on_hand -= quantity`, `destination.on_hand += quantity`
  - insert two `inventory_ledger` entries per item: `TRANSFER_OUT` (source) and `TRANSFER_IN` (destination)
  - set `validated_at`, mark DONE
  - Partial transfers not permitted — all items or none
  - idempotency key check
- [x] `POST /transfers/:id/cancel`

### Phase 8 — Hardening
- [ ] Input sanitisation review: no SQL injection possible via Drizzle (parameterized), but review any raw queries
- [ ] Comprehensive Vitest unit tests for:
  - Reference number generator
  - Stock invariant checks
  - Status transition logic
  - OTP hash / verify
- [ ] Integration tests for atomic operations (validate receipt, delivery, transfer, adjustment)
- [x] Rate limit tuning (global: 100 req/min, auth: 10 req/15min)

---

## Database Ownership

Both BE-1 and BE-2 co-own the schema. **Convention:**

- All schema changes go through a Drizzle migration file.
- Never edit the DB directly in production.
- Migration naming: `NNNN_description.sql` (e.g., `0001_initial_schema.sql`).
- Run `drizzle-kit generate` to create migrations, `drizzle-kit push` (dev) / migration runner (prod).

### Key Invariants to Enforce in Code (not just DB constraints)

| Invariant | Where enforced |
|-----------|---------------|
| `on_hand >= 0` | DB CHECK + application before update |
| `reserved >= 0` | DB CHECK |
| `on_hand >= reserved` | DB CHECK |
| Stock change only via transaction | Code review gate |
| Ledger is append-only | No UPDATE/DELETE in ledger service |
| Status transitions are server-controlled | Dedicated transition endpoints, not PATCH status |
| Repeated validation idempotent | Idempotency key middleware |
| Historical references immutable | Reference stored at creation, not derived dynamically |

---

## Suggested Folder Structure

```
apps/backend/src/
├── db/
│   ├── schema/         # Drizzle table definitions
│   ├── migrations/     # Generated SQL migrations
│   └── index.ts        # DB client
├── middleware/
│   ├── auth.ts         # requireAuth
│   ├── validate.ts     # Zod body/query validation
│   ├── errorHandler.ts
│   ├── rateLimiter.ts
│   └── idempotency.ts
├── modules/
│   ├── auth/
│   ├── warehouses/
│   ├── locations/
│   ├── categories/
│   ├── products/
│   ├── stock/
│   ├── receipts/
│   ├── deliveries/
│   ├── transfers/
│   ├── ledger/
│   ├── dashboard/
│   ├── search/
│   └── profile/
├── utils/
│   ├── pagination.ts
│   ├── referenceGenerator.ts
│   ├── asyncHandler.ts
│   └── logger.ts
├── config/
│   └── env.ts          # Zod-validated env vars
└── app.ts
```
