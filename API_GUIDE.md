# 📘 Horizon Banking Platform — API Guide

Complete REST API reference for the Horizon Banking Platform backend.

**Base URL:** `http://localhost:3001/api`  
**Content-Type:** `application/json`  
**Authentication:** JWT via httpOnly cookies (set automatically on login)

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Accounts](#accounts)
  - [Transactions](#transactions)
  - [Admin](#admin)
  - [Dashboard](#dashboard)
- [Data Types & Enums](#data-types--enums)
- [Validation Rules](#validation-rules)

---

## Overview

### Response Format

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Authentication Flow

1. **Login** → Server sets `access_token` and `refresh_token` httpOnly cookies
2. **Authenticated requests** → Browser sends cookies automatically
3. **Token expired** → Call `/api/auth/refresh` to get new access token
4. **Logout** → Server clears cookies and revokes session

### Pagination

List endpoints support pagination via query parameters:

| Parameter | Type   | Default | Description          |
|-----------|--------|---------|----------------------|
| `page`    | number | `1`     | Page number (1-based) |
| `limit`   | number | `20`    | Items per page (1-100) |

---

## Authentication

Authenticated endpoints require a valid JWT access token in the `access_token` cookie. The token is set automatically by the login endpoint.

For testing with curl, you can capture cookies:

```bash
# Login and save cookies
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bankingsystem.com","password":"Admin@12345"}'

# Use saved cookies for authenticated requests
curl -b cookies.txt http://localhost:3001/api/auth/me
```

### Authorization

Some endpoints require specific permissions. The `authorize()` middleware checks the user's roles and permissions:

```
authorize('accounts:create')   → Teller, Manager, Admin
authorize('transactions:approve') → Manager, Admin
authorize('users:manage')      → Admin only
authorize('audit:view')        → Manager, Admin
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning                                            |
|------|----------------------------------------------------|
| 200  | Success                                            |
| 201  | Created                                            |
| 400  | Bad Request (validation error or business rule)    |
| 401  | Unauthorized (missing or invalid token)            |
| 403  | Forbidden (insufficient permissions)               |
| 404  | Not Found                                          |
| 409  | Conflict (duplicate resource)                      |
| 422  | Unprocessable Entity (validation failed)           |
| 429  | Too Many Requests (rate limit exceeded)            |
| 500  | Internal Server Error                              |

### Validation Errors

Zod validation errors return status `400` with details:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["password"],
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

---

## Rate Limiting

| Scope         | Limit                    | Window    |
|---------------|--------------------------|-----------|
| Global        | 100 requests             | 15 minutes |
| Login         | 5 requests               | 15 minutes |

When rate limited, the API returns `429 Too Many Requests`.

---

## Endpoints

---

### Health

#### `GET /api/health`

Health check endpoint. No authentication required.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Auth

#### `POST /api/auth/register`

Register a new user account. New users are automatically assigned the **Customer** role.

**Auth:** None  

**Request Body:**

| Field       | Type   | Required | Validation                                     |
|-------------|--------|----------|------------------------------------------------|
| `email`     | string | ✅       | Valid email format                              |
| `password`  | string | ✅       | 8+ chars, uppercase, lowercase, number, special |
| `firstName` | string | ✅       | 2-50 characters                                 |
| `lastName`  | string | ✅       | 2-50 characters                                 |
| `phone`     | string | ❌       | Valid phone format                               |
| `address`   | string | ❌       | Max 255 characters                               |

**Example:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@1",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["CUSTOMER"]
    }
  }
}
```

---

#### `POST /api/auth/login`

Authenticate a user. Sets `access_token` and `refresh_token` cookies.

**Auth:** None  
**Rate Limit:** 5 attempts / 15 min

**Request Body:**

| Field      | Type   | Required |
|------------|--------|----------|
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Example:**

```bash
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bankingsystem.com",
    "password": "Admin@12345"
  }'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@bankingsystem.com",
      "firstName": "Admin",
      "lastName": "User",
      "roles": ["ADMIN"]
    }
  }
}
```

**Error Cases:**
- `401` — Invalid email or password
- `423` — Account locked (too many failed attempts)

---

#### `POST /api/auth/refresh`

Refresh the access token using the refresh token cookie. The refresh token is rotated (old token invalidated, new one issued).

**Auth:** Refresh token cookie required

**Example:**

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3001/api/auth/refresh
```

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Token refreshed" }
}
```

---

#### `POST /api/auth/logout`

Logout the current user. Clears cookies and revokes the session in the database.

**Auth:** ✅ Required

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/auth/logout
```

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile and roles.

**Auth:** ✅ Required

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/auth/me
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@bankingsystem.com",
    "firstName": "Admin",
    "lastName": "User",
    "phone": null,
    "address": null,
    "isActive": true,
    "emailVerified": false,
    "roles": ["ADMIN"],
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

#### `POST /api/auth/password-reset-request`

Request a password reset. Generates a time-limited token.

**Auth:** None

**Request Body:**

| Field   | Type   | Required |
|---------|--------|----------|
| `email` | string | ✅       |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a reset link has been sent",
    "token": "reset-token-uuid"
  }
}
```

> **Note:** In production, the token would be sent via email. In development, it's returned in the response for testing.

---

#### `POST /api/auth/password-reset`

Reset password using a valid reset token.

**Auth:** None

**Request Body:**

| Field         | Type   | Required | Validation                                     |
|---------------|--------|----------|------------------------------------------------|
| `token`       | string | ✅       | Valid reset token (UUID)                        |
| `newPassword` | string | ✅       | 8+ chars, uppercase, lowercase, number, special |

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Password reset successful" }
}
```

---

### Accounts

#### `GET /api/accounts`

List bank accounts. **Customers** see only their own accounts; **Teller/Manager/Admin** see all.

**Auth:** ✅ Required  
**Permissions:** `accounts:view`

**Query Parameters:**

| Parameter | Type   | Default | Description    |
|-----------|--------|---------|----------------|
| `page`    | number | `1`     | Page number    |
| `limit`   | number | `20`    | Items per page |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/accounts?page=1&limit=10"
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "accountNumber": "1000000001",
      "type": "CHECKING",
      "status": "ACTIVE",
      "balance": 5250.75,
      "currency": "USD",
      "dailyLimit": 10000,
      "owner": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Customer",
        "email": "customer@bankingsystem.com"
      },
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

#### `GET /api/accounts/:id`

Get detailed information about a specific account.

**Auth:** ✅ Required  
**Permissions:** `accounts:view` (own account or staff role)

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/accounts/uuid-here
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "accountNumber": "1000000001",
    "type": "CHECKING",
    "status": "ACTIVE",
    "balance": 5250.75,
    "currency": "USD",
    "dailyLimit": 10000,
    "userId": "owner-uuid",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

#### `POST /api/accounts`

Create a new bank account for a user.

**Auth:** ✅ Required  
**Permissions:** `accounts:create` (Teller, Manager, Admin)

**Request Body:**

| Field            | Type   | Required | Validation                        |
|------------------|--------|----------|-----------------------------------|
| `userId`         | string | ✅       | Valid user UUID                    |
| `type`           | string | ✅       | `CHECKING` or `SAVINGS`            |
| `initialDeposit` | number | ❌       | ≥ 0, default 0                    |
| `dailyLimit`     | number | ❌       | ≥ 0, default varies by type       |

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "type": "SAVINGS",
    "initialDeposit": 1000
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "new-account-uuid",
    "accountNumber": "1000000003",
    "type": "SAVINGS",
    "status": "ACTIVE",
    "balance": 1000,
    "currency": "USD",
    "dailyLimit": 5000
  }
}
```

---

#### `PATCH /api/accounts/:id/status`

Update account status (freeze, activate, or close).

**Auth:** ✅ Required  
**Permissions:** `accounts:update` (Manager, Admin)

**Request Body:**

| Field    | Type   | Required | Validation                          |
|----------|--------|----------|-------------------------------------|
| `status` | string | ✅       | `ACTIVE`, `FROZEN`, or `CLOSED`      |
| `reason` | string | ❌       | Reason for status change             |

**Example:**

```bash
curl -b cookies.txt -X PATCH http://localhost:3001/api/accounts/uuid/status \
  -H "Content-Type: application/json" \
  -d '{"status": "FROZEN", "reason": "Suspicious activity detected"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "FROZEN",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

#### `GET /api/accounts/:id/transactions`

Get transaction history for a specific account.

**Auth:** ✅ Required  
**Permissions:** `accounts:view` (own account or staff)

**Query Parameters:**

| Parameter | Type   | Default | Description    |
|-----------|--------|---------|----------------|
| `page`    | number | `1`     | Page number    |
| `limit`   | number | `20`    | Items per page |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/accounts/uuid/transactions?page=1&limit=10"
```

---

### Transactions

#### `POST /api/transactions/deposit`

Make a deposit into an account. Teller, Manager, or Admin only.

**Auth:** ✅ Required  
**Permissions:** `transactions:deposit` (Teller, Manager, Admin)

**Request Body:**

| Field            | Type   | Required | Validation                           |
|------------------|--------|----------|--------------------------------------|
| `accountId`      | string | ✅       | Valid account UUID                    |
| `amount`         | number | ✅       | > 0, max $1,000,000                  |
| `description`    | string | ❌       | Max 255 characters                    |
| `idempotencyKey` | string | ✅       | UUID v4 (prevents duplicate deposits) |

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/transactions/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-uuid",
    "amount": 500.00,
    "description": "Cash deposit",
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "type": "DEPOSIT",
    "status": "COMPLETED",
    "amount": 500.00,
    "currency": "USD",
    "balanceBefore": 5250.75,
    "balanceAfter": 5750.75,
    "description": "Cash deposit",
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

> **Note:** Deposits ≥ $10,000 will have `status: "PENDING"` and require approval.

---

#### `POST /api/transactions/withdraw`

Withdraw funds from an account. Teller, Manager, or Admin only.

**Auth:** ✅ Required  
**Permissions:** `transactions:withdraw` (Teller, Manager, Admin)

**Request Body:**

| Field            | Type   | Required | Validation                              |
|------------------|--------|----------|-----------------------------------------|
| `accountId`      | string | ✅       | Valid account UUID                       |
| `amount`         | number | ✅       | > 0, max $50,000                         |
| `description`    | string | ❌       | Max 255 characters                       |
| `idempotencyKey` | string | ✅       | UUID v4 (prevents duplicate withdrawals) |

**Business Rules:**
- Cannot withdraw more than account balance
- Cannot withdraw from FROZEN or CLOSED accounts
- Subject to daily transaction limits
- Withdrawals ≥ $10,000 require approval

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/transactions/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "account-uuid",
    "amount": 200.00,
    "description": "ATM withdrawal",
    "idempotencyKey": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "type": "WITHDRAWAL",
    "status": "COMPLETED",
    "amount": 200.00,
    "balanceBefore": 5750.75,
    "balanceAfter": 5550.75
  }
}
```

---

#### `POST /api/transactions/transfer`

Transfer funds between accounts. Available to all authenticated users.

**Auth:** ✅ Required  
**Permissions:** `transactions:transfer`

**Request Body:**

| Field                  | Type   | Required | Validation                            |
|------------------------|--------|----------|---------------------------------------|
| `sourceAccountId`      | string | ✅       | Valid account UUID (must be owned by user or staff) |
| `destinationAccountId` | string | ✅       | Valid account UUID                    |
| `amount`               | number | ✅       | > 0, max $100,000                     |
| `description`          | string | ❌       | Max 255 characters                    |
| `idempotencyKey`       | string | ✅       | UUID v4                               |

**Business Rules:**
- Source and destination must be different accounts
- Source account must be ACTIVE
- Destination account must be ACTIVE
- Cannot transfer more than source balance
- Subject to daily transaction limits
- Transfers ≥ $10,000 require approval

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/transactions/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "sourceAccountId": "checking-uuid",
    "destinationAccountId": "savings-uuid",
    "amount": 1000.00,
    "description": "Monthly savings transfer",
    "idempotencyKey": "770e8400-e29b-41d4-a716-446655440002"
  }'
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "type": "TRANSFER",
    "status": "COMPLETED",
    "amount": 1000.00,
    "sourceAccountId": "checking-uuid",
    "destinationAccountId": "savings-uuid",
    "balanceBefore": 5550.75,
    "balanceAfter": 4550.75
  }
}
```

---

#### `POST /api/transactions/:id/approve`

Approve or reject a pending transaction. Manager or Admin only.

**Auth:** ✅ Required  
**Permissions:** `transactions:approve` (Manager, Admin)

**Request Body:**

| Field      | Type    | Required | Validation           |
|------------|---------|----------|----------------------|
| `approved` | boolean | ✅       | `true` or `false`     |
| `reason`   | string  | ❌       | Reason for decision   |

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/transactions/txn-uuid/approve \
  -H "Content-Type: application/json" \
  -d '{"approved": true, "reason": "Verified with customer"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "txn-uuid",
    "status": "COMPLETED",
    "approval": {
      "approved": true,
      "reason": "Verified with customer",
      "approvedBy": "manager-uuid",
      "approvedAt": "2025-01-15T12:30:00.000Z"
    }
  }
}
```

---

#### `GET /api/transactions`

List transactions. Customers see only their own; staff see all.

**Auth:** ✅ Required  
**Permissions:** `transactions:view`

**Query Parameters:**

| Parameter | Type   | Default | Description    |
|-----------|--------|---------|----------------|
| `page`    | number | `1`     | Page number    |
| `limit`   | number | `20`    | Items per page |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/transactions?page=1&limit=20"
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "DEPOSIT",
      "status": "COMPLETED",
      "amount": 500.00,
      "currency": "USD",
      "description": "Cash deposit",
      "sourceAccount": null,
      "destinationAccount": { "id": "uuid", "accountNumber": "1000000001" },
      "initiatedBy": { "id": "uuid", "firstName": "Teller", "lastName": "User" },
      "fraudFlagged": false,
      "createdAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

#### `GET /api/transactions/pending`

List transactions pending approval. Manager or Admin only.

**Auth:** ✅ Required  
**Permissions:** `transactions:approve` (Manager, Admin)

**Query Parameters:**

| Parameter | Type   | Default |
|-----------|--------|---------|
| `page`    | number | `1`     |
| `limit`   | number | `20`    |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/transactions/pending"
```

---

#### `GET /api/transactions/:id`

Get details of a specific transaction.

**Auth:** ✅ Required  
**Permissions:** `transactions:view`

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/transactions/txn-uuid
```

---

### Admin

#### `GET /api/admin/users`

List all users with their roles. Admin only.

**Auth:** ✅ Required  
**Permissions:** `users:view` (Admin)

**Query Parameters:**

| Parameter | Type   | Default | Description          |
|-----------|--------|---------|----------------------|
| `page`    | number | `1`     | Page number          |
| `limit`   | number | `20`    | Items per page       |
| `search`  | string | —       | Search by name/email |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/admin/users?page=1&limit=10"
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "customer@bankingsystem.com",
      "firstName": "John",
      "lastName": "Customer",
      "isActive": true,
      "roles": [
        { "id": "role-uuid", "name": "CUSTOMER" }
      ],
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 }
}
```

---

#### `GET /api/admin/users/:id`

Get detailed information about a specific user.

**Auth:** ✅ Required  
**Permissions:** `users:view` (Admin)

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/admin/users/user-uuid
```

---

#### `PATCH /api/admin/users/:id`

Update a user's profile or status.

**Auth:** ✅ Required  
**Permissions:** `users:manage` (Admin)

**Request Body:**

| Field       | Type    | Required | Validation      |
|-------------|---------|----------|-----------------|
| `firstName` | string  | ❌       | 2-50 characters |
| `lastName`  | string  | ❌       | 2-50 characters |
| `isActive`  | boolean | ❌       | true/false      |
| `phone`     | string  | ❌       | Valid phone     |

**Example:**

```bash
curl -b cookies.txt -X PATCH http://localhost:3001/api/admin/users/user-uuid \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

---

#### `POST /api/admin/users/assign-role`

Assign a role to a user.

**Auth:** ✅ Required  
**Permissions:** `roles:manage` (Admin)

**Request Body:**

| Field    | Type   | Required | Validation                                    |
|----------|--------|----------|-----------------------------------------------|
| `userId` | string | ✅       | Valid user UUID                                |
| `role`   | string | ✅       | `CUSTOMER`, `TELLER`, `MANAGER`, or `ADMIN`    |

**Example:**

```bash
curl -b cookies.txt -X POST http://localhost:3001/api/admin/users/assign-role \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid", "role": "TELLER"}'
```

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Role TELLER assigned to user successfully" }
}
```

---

#### `DELETE /api/admin/users/:id/roles/:role`

Remove a role from a user.

**Auth:** ✅ Required  
**Permissions:** `roles:manage` (Admin)

**Example:**

```bash
curl -b cookies.txt -X DELETE http://localhost:3001/api/admin/users/user-uuid/roles/TELLER
```

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Role TELLER removed from user" }
}
```

---

#### `GET /api/admin/audit-logs`

View the system audit log.

**Auth:** ✅ Required  
**Permissions:** `audit:view` (Manager, Admin)

**Query Parameters:**

| Parameter  | Type   | Default | Description             |
|------------|--------|---------|-------------------------|
| `page`     | number | `1`     | Page number             |
| `limit`    | number | `20`    | Items per page          |
| `action`   | string | —       | Filter by action type   |
| `resource` | string | —       | Filter by resource type |
| `userId`   | string | —       | Filter by user ID       |

**Example:**

```bash
curl -b cookies.txt "http://localhost:3001/api/admin/audit-logs?page=1&limit=20"
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "action": "LOGIN",
      "resource": "auth",
      "resourceId": null,
      "oldValue": null,
      "newValue": null,
      "ipAddress": "::1",
      "userAgent": "Mozilla/5.0 ...",
      "user": {
        "id": "uuid",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@bankingsystem.com"
      },
      "createdAt": "2025-01-15T10:05:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

---

### Dashboard

#### `GET /api/dashboard/customer`

Get dashboard statistics for the currently authenticated customer.

**Auth:** ✅ Required

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/dashboard/customer
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalBalance": 17750.75,
    "accountCount": 2,
    "monthlyIncome": 2500.00,
    "monthlyExpenses": 1200.00,
    "recentTransactions": [ ... ],
    "accounts": [ ... ]
  }
}
```

---

#### `GET /api/dashboard/admin`

Get system-wide admin dashboard statistics.

**Auth:** ✅ Required  
**Permissions:** Admin role

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/dashboard/admin
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 4,
    "activeUsers": 4,
    "totalAccounts": 5,
    "totalBalance": 25000.00,
    "totalTransactions": 15,
    "pendingApprovals": 2
  }
}
```

---

#### `GET /api/dashboard/manager`

Get manager-level dashboard statistics (similar to admin but focused on operations).

**Auth:** ✅ Required  
**Permissions:** Manager or Admin role

**Example:**

```bash
curl -b cookies.txt http://localhost:3001/api/dashboard/manager
```

---

## Data Types & Enums

### Account Types

| Value      | Description     |
|------------|-----------------|
| `CHECKING` | Checking account |
| `SAVINGS`  | Savings account  |

### Account Statuses

| Value    | Description                 |
|----------|-----------------------------|
| `ACTIVE` | Normal operating state       |
| `FROZEN` | Temporarily suspended        |
| `CLOSED` | Permanently closed           |

### Transaction Types

| Value        | Description              |
|--------------|--------------------------|
| `DEPOSIT`    | Cash/check deposit        |
| `WITHDRAWAL` | Cash withdrawal           |
| `TRANSFER`   | Account-to-account transfer |

### Transaction Statuses

| Value       | Description                          |
|-------------|--------------------------------------|
| `PENDING`   | Awaiting approval (large amount)     |
| `COMPLETED` | Successfully processed               |
| `FAILED`    | Transaction failed                   |
| `REJECTED`  | Rejected by approver                 |

### User Roles

| Value      | Description                    |
|------------|--------------------------------|
| `CUSTOMER` | Bank customer (default)         |
| `TELLER`   | Bank teller (counter operations) |
| `MANAGER`  | Branch manager                  |
| `ADMIN`    | System administrator            |

---

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (`A-Z`)
- At least one lowercase letter (`a-z`)
- At least one number (`0-9`)
- At least one special character (`@$!%*?&`)

### Transaction Limits

| Transaction Type | Maximum per Transaction |
|-----------------|------------------------|
| Deposit          | $1,000,000              |
| Withdrawal       | $50,000                 |
| Transfer         | $100,000                |

### Approval Threshold
- Transactions ≥ **$10,000** require Manager or Admin approval before processing
- Configurable via `LARGE_TRANSACTION_THRESHOLD` environment variable

### Fraud Detection
- Deposits ≥ **$50,000** are automatically flagged for review
- Withdrawals ≥ **$25,000** are automatically flagged for review
- Transfers ≥ **$50,000** are automatically flagged for review
- Flagged transactions have `fraudFlagged: true` in the response

### Daily Limits
- Each account has a configurable `dailyLimit`
- The system tracks cumulative daily transaction amounts
- Transactions exceeding the daily limit are rejected

---

## Testing with curl

### Full Workflow Example

```bash
# 1. Login as admin
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bankingsystem.com","password":"Admin@12345"}'

# 2. View all accounts
curl -b cookies.txt http://localhost:3001/api/accounts

# 3. View admin dashboard
curl -b cookies.txt http://localhost:3001/api/dashboard/admin

# 4. List all users
curl -b cookies.txt http://localhost:3001/api/admin/users

# 5. View audit logs
curl -b cookies.txt http://localhost:3001/api/admin/audit-logs

# 6. Logout
curl -b cookies.txt -X POST http://localhost:3001/api/auth/logout

# 7. Login as teller
curl -c cookies.txt -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teller@bankingsystem.com","password":"Teller@123"}'

# 8. Make a deposit
curl -b cookies.txt -X POST http://localhost:3001/api/transactions/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "accountId":"ACCOUNT_UUID_HERE",
    "amount":500,
    "description":"Cash deposit",
    "idempotencyKey":"'$(uuidgen)'"
  }'

# 9. Logout
curl -b cookies.txt -X POST http://localhost:3001/api/auth/logout
```

---

*Generated for Horizon Banking Platform v1.0*
