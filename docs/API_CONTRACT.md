# StockSense API Contract

## 1. API Conventions

Base URL:

```text
/api/v1
```

Protocol: HTTPS
Format: JSON
Authentication: Bearer JWT

Request:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Standard success response:

```json
{
  "data": {},
  "message": "Success"
}
```

Standard error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

Pagination:

```text
?page=1&limit=20
```

Paginated response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Dates use ISO 8601:

```text
2026-09-26T10:30:00Z
```

Quantities are positive numbers unless explicitly stated otherwise.

---

# 2. Authentication

## POST /auth/signup

Create a new user.

Request:

```json
{
  "loginId": "inventory01",
  "email": "user@example.com",
  "password": "Strong@Password1"
}
```

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "loginId": "inventory01",
      "email": "user@example.com"
    },
    "accessToken": "jwt"
  },
  "message": "Account created successfully"
}
```

Validation:

* `loginId` must be unique.
* `loginId` length: 6–12 characters.
* Password must contain:

  * lowercase character
  * uppercase character
  * special character
  * minimum 9 characters
* Email must be valid and unique.

---

## POST /auth/login

Authenticate a user.

Request:

```json
{
  "loginId": "inventory01",
  "password": "Strong@Password1"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "loginId": "inventory01",
      "email": "user@example.com"
    },
    "accessToken": "jwt"
  },
  "message": "Login successful"
}
```

Invalid credentials:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid Login Id or Password"
  }
}
```

---

## POST /auth/password-reset/request

Request an OTP for password reset.

Request:

```json
{
  "email": "user@example.com"
}
```

Response:

```json
{
  "data": {
    "message": "If the account exists, an OTP has been sent."
  }
}
```

The API must not reveal whether an email exists.

---

## POST /auth/password-reset/verify

Verify the password-reset OTP.

Request:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:

```json
{
  "data": {
    "resetToken": "temporary-token"
  }
}
```

---

## POST /auth/password-reset

Set a new password.

Request:

```json
{
  "resetToken": "temporary-token",
  "newPassword": "NewStrong@Password1"
}
```

Response:

```json
{
  "data": null,
  "message": "Password updated successfully"
}
```

---

## POST /auth/logout

Invalidate the current session/token where server-side token/session invalidation is implemented.

Response:

```json
{
  "data": null,
  "message": "Logged out successfully"
}
```

---

## GET /auth/me

Return the authenticated user's profile.

Response:

```json
{
  "data": {
    "id": "uuid",
    "loginId": "inventory01",
    "email": "user@example.com",
    "createdAt": "2026-09-26T10:30:00Z"
  }
}
```

---

# 3. Dashboard

## GET /dashboard

Return dashboard KPIs.

Query parameters:

```text
warehouseId
locationId
categoryId
```

Response:

```json
{
  "data": {
    "totalProductsInStock": 1250,
    "lowStockItems": 12,
    "outOfStockItems": 4,
    "pendingReceipts": 4,
    "pendingDeliveries": 4,
    "scheduledTransfers": 3
  }
}
```

---

## GET /dashboard/operations

Return operational statistics.

Query parameters:

```text
warehouseId
dateFrom
dateTo
```

Response:

```json
{
  "data": {
    "receipts": {
      "toReceive": 4,
      "late": 1,
      "operations": 6
    },
    "deliveries": {
      "toDeliver": 4,
      "late": 1,
      "waiting": 2,
      "operations": 6
    }
  }
}
```

---

# 4. Products

## GET /products

List products.

Query parameters:

```text
page
limit
search
sku
categoryId
warehouseId
locationId
stockStatus=all|low|out|available
sortBy
sortOrder=asc|desc
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "DESK001",
      "name": "Desk",
      "category": {
        "id": "uuid",
        "name": "Furniture"
      },
      "unitOfMeasure": "unit",
      "onHand": 50,
      "freeToUse": 45,
      "reorderPoint": 10,
      "costPerUnit": 3000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## POST /products

Create a product.

Request:

```json
{
  "name": "Desk",
  "sku": "DESK001",
  "categoryId": "uuid",
  "unitOfMeasure": "unit",
  "initialStock": 50,
  "initialLocationId": "uuid",
  "costPerUnit": 3000,
  "reorderPoint": 10,
  "reorderQuantity": 25
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "name": "Desk",
    "sku": "DESK001",
    "unitOfMeasure": "unit",
    "onHand": 50
  },
  "message": "Product created successfully"
}
```

If initial stock is provided, the stock increase must create a corresponding inventory ledger entry.

---

## GET /products/:productId

Return product details.

Response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Desk",
    "sku": "DESK001",
    "category": {
      "id": "uuid",
      "name": "Furniture"
    },
    "unitOfMeasure": "unit",
    "costPerUnit": 3000,
    "reorderPoint": 10,
    "reorderQuantity": 25,
    "createdAt": "2026-09-26T10:30:00Z",
    "updatedAt": "2026-09-26T10:30:00Z"
  }
}
```

---

## PATCH /products/:productId

Update product metadata.

Request:

```json
{
  "name": "Office Desk",
  "categoryId": "uuid",
  "unitOfMeasure": "unit",
  "costPerUnit": 3200,
  "reorderPoint": 15,
  "reorderQuantity": 30
}
```

Stock must not be changed through this endpoint.

---

## DELETE /products/:productId

Deactivate a product.

Products with historical inventory movements should not be physically deleted.

Response:

```json
{
  "data": null,
  "message": "Product deactivated successfully"
}
```

---

# 5. Product Categories

## GET /categories

List categories.

Query parameters:

```text
page
limit
search
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Furniture",
      "productCount": 15
    }
  ]
}
```

---

## POST /categories

Request:

```json
{
  "name": "Furniture"
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "name": "Furniture"
  }
}
```

---

## PATCH /categories/:categoryId

Request:

```json
{
  "name": "Office Furniture"
}
```

---

## DELETE /categories/:categoryId

A category containing products cannot be deleted unless its products are reassigned.

---

# 6. Stock Availability

## GET /stock

Return inventory availability.

Query parameters:

```text
page
limit
search
warehouseId
locationId
categoryId
productId
stockStatus=all|available|low|out
```

Response:

```json
{
  "data": [
    {
      "productId": "uuid",
      "sku": "DESK001",
      "product": "Desk",
      "warehouseId": "uuid",
      "locationId": "uuid",
      "onHand": 50,
      "reserved": 5,
      "freeToUse": 45,
      "unitCost": 3000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

`freeToUse`:

```text
freeToUse = onHand - reserved
```

---

## GET /stock/:productId

Return stock across all warehouses and locations.

Response:

```json
{
  "data": {
    "productId": "uuid",
    "totalOnHand": 100,
    "totalReserved": 20,
    "totalFreeToUse": 80,
    "locations": [
      {
        "warehouseId": "uuid",
        "locationId": "uuid",
        "onHand": 60,
        "reserved": 10,
        "freeToUse": 50
      },
      {
        "warehouseId": "uuid",
        "locationId": "uuid",
        "onHand": 40,
        "reserved": 10,
        "freeToUse": 30
      }
    ]
  }
}
```

---

## POST /stock/adjustments

Manual stock updates must use the adjustment workflow rather than directly modifying stock.

Request:

```json
{
  "productId": "uuid",
  "locationId": "uuid",
  "countedQuantity": 47,
  "reason": "Damaged items"
}
```

The system calculates:

```text
difference = countedQuantity - currentOnHand
```

The adjustment must create a ledger entry.

Response:

```json
{
  "data": {
    "adjustmentId": "uuid",
    "previousQuantity": 50,
    "countedQuantity": 47,
    "difference": -3
  },
  "message": "Stock adjusted successfully"
}
```

---

# 7. Receipts

Receipt statuses:

```text
DRAFT
READY
DONE
CANCELED
```

## GET /receipts

Query parameters:

```text
page
limit
search
status
warehouseId
locationId
dateFrom
dateTo
sortBy
sortOrder
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "WH/IN/0001",
      "from": "Vendor",
      "to": "WH/Stock1",
      "contact": "Azure Interior",
      "scheduledAt": "2026-09-26T10:00:00Z",
      "status": "READY",
      "responsible": {
        "id": "uuid",
        "loginId": "inventory01"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## POST /receipts

Create a receipt in `DRAFT`.

Request:

```json
{
  "warehouseId": "uuid",
  "destinationLocationId": "uuid",
  "supplierName": "Azure Interior",
  "scheduledAt": "2026-09-26T10:00:00Z",
  "items": [
    {
      "productId": "uuid",
      "quantity": 50
    }
  ]
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/IN/0001",
    "status": "DRAFT",
    "items": [
      {
        "productId": "uuid",
        "quantity": 50
      }
    ]
  }
}
```

Reference generation must be server-side.

---

## GET /receipts/:receiptId

Return complete receipt details.

Response:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/IN/0001",
    "warehouseId": "uuid",
    "destinationLocationId": "uuid",
    "supplierName": "Azure Interior",
    "scheduledAt": "2026-09-26T10:00:00Z",
    "responsibleUserId": "uuid",
    "status": "DRAFT",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "sku": "DESK001",
        "productName": "Desk",
        "quantity": 6
      }
    ],
    "createdAt": "2026-09-26T10:00:00Z",
    "updatedAt": "2026-09-26T10:00:00Z"
  }
}
```

---

## PATCH /receipts/:receiptId

Update a receipt while it is editable.

Request:

```json
{
  "supplierName": "Azure Interior",
  "scheduledAt": "2026-09-27T10:00:00Z",
  "destinationLocationId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10
    }
  ]
}
```

Receipts in `DONE` or `CANCELED` cannot be modified.

---

## POST /receipts/:receiptId/ready

Transition:

```text
DRAFT -> READY
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "status": "READY"
  },
  "message": "Receipt is ready"
}
```

---

## POST /receipts/:receiptId/validate

Transition:

```text
READY -> DONE
```

Validation atomically:

1. verifies receipt state;
2. verifies all line items;
3. increases stock at the destination location;
4. creates inventory ledger entries;
5. marks receipt `DONE`.

Response:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/IN/0001",
    "status": "DONE"
  },
  "message": "Receipt validated successfully"
}
```

Repeated validation must be rejected and must never increase stock twice.

---

## POST /receipts/:receiptId/cancel

Cancel a receipt.

Allowed:

```text
DRAFT -> CANCELED
READY -> CANCELED
```

A `DONE` receipt cannot be canceled through this endpoint.

---

# 8. Delivery Orders

Delivery statuses:

```text
DRAFT
WAITING
READY
DONE
CANCELED
```

## GET /deliveries

Query parameters:

```text
page
limit
search
status
warehouseId
locationId
dateFrom
dateTo
```

Response structure follows `/receipts`.

---

## POST /deliveries

Create a delivery order.

Request:

```json
{
  "warehouseId": "uuid",
  "sourceLocationId": "uuid",
  "deliveryAddress": "Customer Address",
  "scheduledAt": "2026-09-26T15:00:00Z",
  "items": [
    {
      "productId": "uuid",
      "quantity": 10
    }
  ]
}
```

Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/OUT/0001",
    "status": "DRAFT"
  }
}
```

---

## GET /deliveries/:deliveryId

Return delivery details.

Response:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/OUT/0001",
    "warehouseId": "uuid",
    "sourceLocationId": "uuid",
    "deliveryAddress": "Customer Address",
    "scheduledAt": "2026-09-26T15:00:00Z",
    "responsibleUserId": "uuid",
    "status": "WAITING",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "sku": "DESK001",
        "productName": "Desk",
        "requestedQuantity": 10,
        "availableQuantity": 8
      }
    ]
  }
}
```

---

## PATCH /deliveries/:deliveryId

Modify a delivery while it is editable.

---

## POST /deliveries/:deliveryId/confirm

Confirm the delivery and determine whether sufficient stock exists.

Possible transitions:

```text
DRAFT -> READY
DRAFT -> WAITING
```

If stock is insufficient, the delivery enters `WAITING`.

---

## POST /deliveries/:deliveryId/ready

Transition:

```text
WAITING -> READY
```

Allowed only when every item has sufficient free stock.

---

## POST /deliveries/:deliveryId/validate

Transition:

```text
READY -> DONE
```

Validation atomically:

1. verifies delivery state;
2. verifies sufficient stock;
3. decreases stock;
4. creates ledger entries;
5. marks delivery `DONE`.

Response:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/OUT/0001",
    "status": "DONE"
  },
  "message": "Delivery validated successfully"
}
```

Stock must never become negative.

Repeated validation must not decrease stock twice.

---

## POST /deliveries/:deliveryId/cancel

Cancel a delivery.

Allowed before completion.

---

# 9. Internal Transfers

Transfer statuses:

```text
DRAFT
READY
DONE
CANCELED
```

## GET /transfers

Query parameters:

```text
page
limit
search
status
warehouseId
sourceLocationId
destinationLocationId
dateFrom
dateTo
```

---

## POST /transfers

Create an internal transfer.

Request:

```json
{
  "warehouseId": "uuid",
  "sourceLocationId": "uuid",
  "destinationLocationId": "uuid",
  "scheduledAt": "2026-09-26T12:00:00Z",
  "items": [
    {
      "productId": "uuid",
      "quantity": 20
    }
  ]
}
```

Response:

```json
{
  "data": {
    "id": "uuid",
    "reference": "WH/INT/0001",
    "status": "DRAFT"
  }
}
```

---

## GET /transfers/:transferId

Return transfer details.

---

## PATCH /transfers/:transferId

Update a draft transfer.

---

## POST /transfers/:transferId/ready

Transition:

```text
DRAFT -> READY
```

The API must verify sufficient available stock.

---

## POST /transfers/:transferId/validate

Transition:

```text
READY -> DONE
```

Atomically:

```text
source location stock -= quantity
destination location stock += quantity
```

Two ledger movements must be generated:

```text
OUT: source -> transfer
IN: transfer -> destination
```

The operation must be atomic. Partial transfers are not permitted.

---

## POST /transfers/:transferId/cancel

Cancel the transfer.

---

# 10. Inventory Ledger / Move History

The inventory ledger is append-only.

Completed receipts, deliveries, transfers, and adjustments must generate ledger entries.

## GET /inventory/moves

Query parameters:

```text
page
limit
search
reference
productId
warehouseId
locationId
movementType=IN|OUT|TRANSFER|ADJUSTMENT
dateFrom
dateTo
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "WH/IN/0001",
      "movementType": "IN",
      "product": {
        "id": "uuid",
        "sku": "DESK001",
        "name": "Desk"
      },
      "quantity": 50,
      "fromLocation": null,
      "toLocation": {
        "id": "uuid",
        "name": "WH/Stock1"
      },
      "contact": "Azure Interior",
      "createdAt": "2026-09-26T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Ledger entries cannot be edited or deleted.

---

## GET /inventory/moves/:moveId

Return complete ledger entry details.

---

# 11. Warehouses

## GET /warehouses

List warehouses.

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Main Warehouse",
      "shortCode": "WH",
      "address": "Warehouse Address",
      "locationCount": 4
    }
  ]
}
```

---

## POST /warehouses

Request:

```json
{
  "name": "Main Warehouse",
  "shortCode": "WH",
  "address": "Warehouse Address"
}
```

`shortCode` must be unique.

---

## GET /warehouses/:warehouseId

Return warehouse details.

---

## PATCH /warehouses/:warehouseId

Request:

```json
{
  "name": "Main Warehouse",
  "shortCode": "MAIN",
  "address": "Updated Address"
}
```

Changing a warehouse short code must not modify historical references.

---

## DELETE /warehouses/:warehouseId

A warehouse containing stock or historical operations should not be physically deleted.

---

# 12. Locations

## GET /locations

Query parameters:

```text
warehouseId
search
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Stock",
      "shortCode": "STOCK",
      "warehouseId": "uuid"
    },
    {
      "id": "uuid",
      "name": "Production Rack",
      "shortCode": "PROD",
      "warehouseId": "uuid"
    }
  ]
}
```

---

## POST /locations

Request:

```json
{
  "name": "Production Rack",
  "shortCode": "PROD",
  "warehouseId": "uuid"
}
```

---

## GET /locations/:locationId

Return location details.

---

## PATCH /locations/:locationId

Request:

```json
{
  "name": "Production Rack A",
  "shortCode": "PRODA"
}
```

---

## DELETE /locations/:locationId

A location containing stock or historical movements should not be physically deleted.

---

# 13. Reordering Rules

## GET /reordering-rules

Query parameters:

```text
productId
warehouseId
locationId
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "warehouseId": "uuid",
      "locationId": "uuid",
      "reorderPoint": 10,
      "reorderQuantity": 25,
      "enabled": true
    }
  ]
}
```

---

## POST /reordering-rules

Request:

```json
{
  "productId": "uuid",
  "warehouseId": "uuid",
  "locationId": "uuid",
  "reorderPoint": 10,
  "reorderQuantity": 25
}
```

---

## PATCH /reordering-rules/:ruleId

Update a reordering rule.

---

## DELETE /reordering-rules/:ruleId

Disable/remove a reordering rule.

---

# 14. Profile

## GET /profile

Return the current user's profile.

---

## PATCH /profile

Request:

```json
{
  "email": "new@example.com"
}
```

Authentication credentials must not be changed through this endpoint.

---

# 15. Global Search

## GET /search

Search products and inventory operations.

Query parameters:

```text
q
type=product|receipt|delivery|transfer|move
limit
```

Response:

```json
{
  "data": [
    {
      "type": "product",
      "id": "uuid",
      "label": "DESK001 - Desk"
    },
    {
      "type": "receipt",
      "id": "uuid",
      "label": "WH/IN/0001"
    }
  ]
}
```

---

# 16. Common Status Filters

Dashboard and list endpoints must support the following status values where applicable:

```text
DRAFT
WAITING
READY
DONE
CANCELED
```

Status transitions are server-controlled.

Clients must not send arbitrary status values through normal `PATCH` requests.

---

# 17. Inventory Invariants

The following rules are mandatory.

### Stock cannot become negative

```text
onHand >= 0
```

### Free stock cannot exceed on-hand stock

```text
0 <= freeToUse <= onHand
```

### Reservation calculation

```text
freeToUse = onHand - reserved
```

### Receipt validation

```text
destination.onHand += receivedQuantity
```

### Delivery validation

```text
source.onHand -= deliveredQuantity
```

### Internal transfer validation

```text
source.onHand -= quantity
destination.onHand += quantity
```

### Adjustment

```text
difference = countedQuantity - currentQuantity
newQuantity = countedQuantity
```

Every stock-changing operation must create an immutable ledger record.

---

# 18. Transaction Requirements

Stock-changing operations must execute inside a database transaction.

The following operations are atomic:

```text
Receipt validation
Delivery validation
Internal transfer validation
Stock adjustment
Initial stock creation
```

For example, receipt validation must either perform all of the following or none of them:

```text
Update stock
Create ledger entries
Update document status
Record validation timestamp
```

No operation may leave the inventory state partially updated.

---

# 19. Idempotency

Stock-changing endpoints should support:

```http
Idempotency-Key: <unique-request-id>
```

Required for:

```text
POST /receipts/:id/validate
POST /deliveries/:id/validate
POST /transfers/:id/validate
POST /stock/adjustments
```

Repeating the same request with the same idempotency key must not create duplicate stock movements.

---

# 20. Error Codes

Common error codes:

```text
VALIDATION_ERROR
INVALID_CREDENTIALS
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
DUPLICATE_RESOURCE
INVALID_STATUS_TRANSITION
INSUFFICIENT_STOCK
NEGATIVE_STOCK
LOCATION_MISMATCH
PRODUCT_NOT_FOUND
WAREHOUSE_NOT_FOUND
RECEIPT_NOT_FOUND
DELIVERY_NOT_FOUND
TRANSFER_NOT_FOUND
INVALID_OTP
OTP_EXPIRED
IDEMPOTENCY_CONFLICT
INTERNAL_ERROR
```

Example insufficient stock:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product DESK001",
    "details": {
      "productId": "uuid",
      "requested": 10,
      "available": 4
    }
  }
}
```

---

# 21. HTTP Status Codes

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Use `409 Conflict` for state conflicts such as:

```text
duplicate SKU
duplicate warehouse short code
invalid concurrent stock operation
already validated document
```

---

# 22. Reference Number Generation

References are generated by the backend.

Formats:

```text
<WAREHOUSE_CODE>/IN/<SEQUENCE>
<WAREHOUSE_CODE>/OUT/<SEQUENCE>
<WAREHOUSE_CODE>/INT/<SEQUENCE>
<WAREHOUSE_CODE>/ADJ/<SEQUENCE>
```

Examples:

```text
WH/IN/0001
WH/OUT/0001
WH/INT/0001
WH/ADJ/0001
```

Reference numbers must be unique.

Historical references must remain unchanged even if a warehouse short code is later changed.

---

# 23. Audit Fields

Resources should expose:

```json
{
  "createdAt": "2026-09-26T10:30:00Z",
  "updatedAt": "2026-09-26T10:30:00Z",
  "createdBy": "uuid",
  "updatedBy": "uuid"
}
```

Inventory ledger records additionally contain:

```json
{
  "performedBy": "uuid",
  "performedAt": "2026-09-26T10:30:00Z"
}
```

Historical inventory movements must remain immutable.
