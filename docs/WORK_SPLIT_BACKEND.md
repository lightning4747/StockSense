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

### Phase 0 — Bootstrap
- [ ] Express + TypeScript project skeleton (`apps/backend/`)
- [ ] Helmet, CORS, express-rate-limit global middleware
- [ ] Zod request validation middleware
- [ ] Centralized error handler (maps to error codes from §20 of API contract)
- [ ] Drizzle ORM config + PostgreSQL connection
- [ ] Docker Compose: `postgres` + `backend` services
- [ ] `.env.example` with all required env vars

### Phase 0 — Database Schema (both together, BE-1 executes)
- [ ] Write and run initial Drizzle migration with all tables from the schema in `IMPLEMENTATION_PLAN.md`
- [ ] DB constraints: `CHECK (on_hand >= 0)`, `CHECK (on_hand >= reserved)`, unique indexes
- [ ] Seed script: default admin user + one warehouse + one location

### Phase 1 — Auth
- [ ] `POST /auth/signup` — Argon2id hash, loginId unique check, JWT issue
- [ ] `POST /auth/login` — credential validation, JWT issue
- [ ] `GET /auth/me` — auth middleware protected
- [ ] `POST /auth/logout` — server-side token blocklist (store JWT `jti` in DB or `revoked_tokens` table)
- [ ] `POST /auth/password-reset/request` — generate 6-digit OTP, hash + store in `password_reset_otps`, send via Nodemailer (never reveal email existence)
- [ ] `POST /auth/password-reset/verify` — verify OTP hash, mark used, issue `reset_token`
- [ ] `POST /auth/password-reset` — verify reset token, Argon2id hash new password, mark token used
- [ ] Auth middleware (`requireAuth`) — verify JWT, attach user to `req.user`
- [ ] Rate limiter on auth routes: 10 requests / 15 min per IP

### Phase 2 — Configuration: Warehouses & Locations
- [ ] `GET /warehouses`, `POST /warehouses` (`shortCode` unique)
- [ ] `GET /warehouses/:id`, `PATCH /warehouses/:id` (short code change does not affect historical refs)
- [ ] `DELETE /warehouses/:id` — soft delete, blocked if stock or ops exist
- [ ] `GET /locations?warehouseId=`, `POST /locations`
- [ ] `GET /locations/:id`, `PATCH /locations/:id`, `DELETE /locations/:id` (soft delete guard)
- [ ] Reference number generator utility: `<WAREHOUSE_CODE>/IN/<SEQ>`, `/OUT/`, `/INT/`, `/ADJ/` — DB sequence per (warehouse_id, type)

### Phase 3 — Products
- [ ] `GET /products` — paginated, filterable (search, sku, categoryId, warehouseId, locationId, stockStatus, sort)
- [ ] `POST /products` — create product; if `initialStock > 0`, open transaction: insert `stock_levels` + insert `inventory_ledger` (type=`IN`, reference=`WH/ADJ/XXXX`)
- [ ] `GET /products/:id`
- [ ] `PATCH /products/:id` — metadata only, SKU cannot change, stock not updated here
- [ ] `DELETE /products/:id` — soft deactivate, blocked if movements exist

### Phase 4 — Operations: Receipts
- [ ] `GET /receipts` — paginated, filterable
- [ ] `POST /receipts` — create `DRAFT`, generate reference
- [ ] `GET /receipts/:id` — with line items
- [ ] `PATCH /receipts/:id` — blocked if DONE/CANCELED
- [ ] `POST /receipts/:id/ready` — `DRAFT → READY`
- [ ] `POST /receipts/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - for each item: `stock_levels.on_hand += quantity` (INSERT or UPDATE with conflict)
  - insert `inventory_ledger` entries (type=`IN`)
  - set `validated_at`, mark DONE
  - idempotency key check
- [ ] `POST /receipts/:id/cancel` — `DRAFT|READY → CANCELED`

### Phase 5 — Inventory Ledger
- [ ] `GET /inventory/moves` — paginated, filterable (reference, productId, warehouseId, locationId, movementType, dateFrom, dateTo)
- [ ] `GET /inventory/moves/:id`

### Phase 6 — Dashboard
- [ ] `GET /dashboard` — KPI aggregation query (total products in stock, low/out stock, pending receipts/deliveries, scheduled transfers); supports warehouseId/locationId/categoryId filters
- [ ] `GET /dashboard/operations` — receipts stats (toReceive, late, operations) + deliveries stats (toDeliver, late, waiting, operations)

### Phase 7 — Global Search & Profile
- [ ] `GET /search?q=&type=&limit=` — fuzzy search across products (SKU/name), receipts (reference), deliveries, transfers, ledger moves
- [ ] `GET /profile` — return current user's editable profile
- [ ] `PATCH /profile` — update email only; cannot change loginId or password here

### Phase 8 — Hardening
- [ ] Idempotency middleware: check `idempotency_keys` table, return cached response on duplicate key
- [ ] Apply idempotency to: `POST /receipts/:id/validate`, `POST /deliveries/:id/validate`, `POST /transfers/:id/validate`, `POST /stock/adjustments`
- [ ] Audit field middleware: auto-populate `created_by`, `updated_by` from `req.user`
- [ ] Full error code coverage (§20 of API contract) — all handlers must return typed error codes

---

## BE-2

### Phase 0 — Bootstrap
- [ ] Nginx config (`nginx/nginx.conf`): reverse proxy `/api` → backend, `/` → frontend static
- [ ] GitHub Actions CI (`.github/workflows/ci.yml`): lint + typecheck + build on push to `main` / PR
- [ ] Vitest config for backend unit tests
- [ ] `apps/backend/src/utils/` helpers: pagination helper, async handler wrapper, logger

### Phase 2 — Configuration: Categories
- [ ] `GET /categories` — paginated, searchable, with `productCount`
- [ ] `POST /categories` — unique name
- [ ] `PATCH /categories/:id`
- [ ] `DELETE /categories/:id` — blocked if products assigned

### Phase 3 — Stock Availability & Reordering Rules
- [ ] `GET /stock` — paginated, filterable, computed `freeToUse = onHand - reserved`, `costPerUnit`
- [ ] `GET /stock/:productId` — total + per-location breakdown
- [ ] `POST /stock/adjustments` — **atomic transaction**:
  - compute `difference = countedQuantity - currentOnHand`
  - update `stock_levels.on_hand`
  - insert `inventory_ledger` (type=`ADJUSTMENT`, reference=`WH/ADJ/XXXX`)
  - idempotency key check
  - enforce `on_hand >= 0`
- [ ] `GET /reordering-rules` — filterable by productId, warehouseId, locationId
- [ ] `POST /reordering-rules` — default `enabled: true`
- [ ] `PATCH /reordering-rules/:id`
- [ ] `DELETE /reordering-rules/:id`

### Phase 4 — Operations: Deliveries
- [ ] `GET /deliveries` — paginated, filterable
- [ ] `POST /deliveries` — create `DRAFT`, generate reference `WH/OUT/XXXX`
- [ ] `GET /deliveries/:id` — with line items + `availableQuantity` per item
- [ ] `PATCH /deliveries/:id` — blocked if DONE/CANCELED
- [ ] `POST /deliveries/:id/confirm` — `DRAFT → READY` or `DRAFT → WAITING`:
  - for each item, check `stock_levels.freeToUse >= requestedQuantity`
  - if all OK → READY
  - if any insufficient → WAITING
- [ ] `POST /deliveries/:id/ready` — `WAITING → READY`, recheck all items have sufficient free stock
- [ ] `POST /deliveries/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - verify sufficient stock for each item
  - `stock_levels.on_hand -= quantity` for each item (enforce `on_hand >= 0`)
  - insert `inventory_ledger` entries (type=`OUT`)
  - set `validated_at`, mark DONE
  - idempotency key check
- [ ] `POST /deliveries/:id/cancel` — allowed before DONE

### Phase 4 — Operations: Internal Transfers
- [ ] `GET /transfers` — paginated, filterable
- [ ] `POST /transfers` — create `DRAFT`, generate reference `WH/INT/XXXX`
- [ ] `GET /transfers/:id` — with line items
- [ ] `PATCH /transfers/:id` — blocked if DONE/CANCELED
- [ ] `POST /transfers/:id/ready` — `DRAFT → READY`:
  - verify sufficient `freeToUse` at source location for each item
- [ ] `POST /transfers/:id/validate` — `READY → DONE`, **atomic transaction**:
  - verify status
  - verify sufficient stock
  - for each item: `source.on_hand -= quantity`, `destination.on_hand += quantity`
  - insert two `inventory_ledger` entries per item: `TRANSFER_OUT` (source) and `TRANSFER_IN` (destination)
  - set `validated_at`, mark DONE
  - Partial transfers not permitted — all items or none
  - idempotency key check
- [ ] `POST /transfers/:id/cancel`

### Phase 8 — Hardening
- [ ] Input sanitisation review: no SQL injection possible via Drizzle (parameterized), but review any raw queries
- [ ] Comprehensive Vitest unit tests for:
  - Reference number generator
  - Stock invariant checks
  - Status transition logic
  - OTP hash / verify
- [ ] Integration tests for atomic operations (validate receipt, delivery, transfer, adjustment)
- [ ] Rate limit tuning (global: 100 req/min, auth: 10 req/15min)

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
