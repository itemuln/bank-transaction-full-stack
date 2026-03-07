# 🏦 Horizon Banking Platform

> **[🚀 Live Demo → bank-transaction-full-stack-wat7.vercel.app](https://bank-transaction-full-stack-wat7.vercel.app)**
<img width="3412" height="1944" alt="image" src="https://github.com/user-attachments/assets/4c2d276d-fd76-45ab-a2f9-ec1d72cf2550" />


A production-grade, full-stack banking application built with **Next.js 16**, **Prisma 7**, **PostgreSQL (Supabase)**, and deployed on **Vercel**. Features role-based access control, transaction management with approval workflows, fraud detection, and a polished dashboard UI with shadcn/ui.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)

---

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database](#database)
- [Authentication & Security](#authentication--security)
- [Role-Based Access Control](#role-based-access-control)
- [Demo Accounts](#demo-accounts)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Live Demo

**🌐 [https://bank-transaction-full-stack-wat7.vercel.app](https://bank-transaction-full-stack-wat7.vercel.app)**

Try it out with any of the demo accounts below:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@bankingsystem.com` | `Admin@12345` |
| **Customer** | `customer@bankingsystem.com` | `Customer@123` |
| **Teller** | `teller@bankingsystem.com` | `Teller@123` |
| **Manager** | `manager@bankingsystem.com` | `Manager@123` |

> Each role sees a different dashboard and has different permissions — try logging in as different users to explore the full system.

---

## Features

### Banking Operations
- **Multi-account support** — Checking & Savings accounts per user
- **Deposits & Withdrawals** — Teller-operated with full audit trails
- **Fund Transfers** — Between own accounts or to other users' accounts
- **Transaction Idempotency** — UUID-based idempotency keys prevent duplicate processing
- **Large Transaction Approvals** — Transactions ≥ $10,000 require Manager/Admin approval
- **Fraud Detection** — Automatic flagging of suspiciously large transactions
- **Daily Limits** — Per-account configurable daily transaction limits

### Security
- **JWT Authentication** — Short-lived access tokens (15 min) + rotating refresh tokens (7 days)
- **httpOnly Cookies** — Tokens stored in secure, httpOnly, SameSite=lax cookies
- **Rate Limiting** — Per-IP rate limiting on all endpoints with stricter limits on login
- **Account Lockout** — Automatic lockout after 5 failed login attempts (15 min cooldown)
- **Password Policy** — Enforced: uppercase, lowercase, number, special character, 8+ chars
- **Helmet.js** — Security-hardened HTTP headers
- **Audit Logging** — Every significant action logged with user, IP, timestamp, old/new values
- **CORS** — Restricted to frontend origin with credentials support

### Role-Based Access Control (RBAC)
- **4 Roles**: Customer, Teller, Manager, Admin
- **17 Granular Permissions** across accounts, transactions, users, audit, roles
- **Dynamic role assignment** by administrators
- **Role-aware UI** — Sidebar, pages, and actions adapt to user permissions

### Dashboard & UI
- **Role-specific dashboards** — Different views for Customer, Staff, and Admin
- **Real-time stats** — Balance overview, monthly income/expenses, transaction volume
- **Account management** — Create, view, freeze, close accounts
- **Transaction history** — Paginated, filterable transaction tables
- **Approval workflow UI** — Approve/reject pending transactions with reasons
- **User management** — Admin panel for user and role administration
- **Audit log viewer** — Searchable, paginated audit trail
- **shadcn/ui** — Polished component library with consistent design system

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Edge + Serverless)            │
│                                                         │
│  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │  Next.js 16 Frontend  │  │  Next.js API Routes    │  │
│  │  (App Router + RSC)   │  │  (Serverless Functions) │  │
│  │                       │  │                         │  │
│  │  • Zustand Auth Store │  │  ┌───────────────────┐  │  │
│  │  • Axios API Client   │  │  │  Service Layer    │  │  │
│  │  • shadcn/ui + TW4    │  │  │  • AuthService    │  │  │
│  │                       │  │  │  • BankingService  │  │  │
│  │  Pages:               │  │  └───────────────────┘  │  │
│  │  • Dashboard          │──│                         │  │
│  │  • Accounts           │  │  ┌───────────────────┐  │  │
│  │  • Transactions       │  │  │  Repository Layer │  │  │
│  │  • Transfer Funds     │  │  │  • UserRepo       │  │  │
│  │  • Teller Ops         │  │  │  • AccountRepo    │  │  │
│  │  • Approvals          │  │  │  • TransactionRepo│  │  │
│  │  • Admin Panel        │  │  │  • AuditLogRepo   │  │  │
│  │  • Audit Logs         │  │  └────────┬──────────┘  │  │
│  └───────────────────────┘  └───────────┼─────────────┘  │
│                                         │                │
└─────────────────────────────────────────┼────────────────┘
                                          │ SSL
                              ┌───────────▼────────────┐
                              │  Supabase PostgreSQL 17 │
                              │  (Connection Pooler)    │
                              │  11 Tables, indexed     │
                              └─────────────────────────┘
```

All API routes run as **Next.js Route Handlers** (serverless functions) on Vercel — no separate backend server needed in production. The service layer, repositories, and business logic are shared between the API routes.

---

## Tech Stack

| Layer          | Technology                                              |
|----------------|---------------------------------------------------------|
| **Frontend**   | Next.js 16 (App Router), React 19, TypeScript 5        |
| **UI**         | shadcn/ui (new-york), Tailwind CSS 4, Lucide Icons     |
| **State**      | Zustand 5 (with persist middleware)                     |
| **API**        | Next.js Route Handlers (serverless)                     |
| **Database**   | PostgreSQL 17 (Supabase), Prisma 7 (adapter-pg driver) |
| **Auth**       | JWT (jsonwebtoken), bcryptjs, httpOnly cookies          |
| **Validation** | Zod 4 (shared schemas between frontend & backend)      |
| **Deployment** | Vercel (serverless), Supabase (managed PostgreSQL)      |

---

## Project Structure

```text
bank_transaction_system/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout (fonts, Toaster)
│   ├── globals.css                # Tailwind v4 theme + custom styles
│   ├── (auth)/                    # Auth layout group (public)
│   │   ├── sign-in/page.tsx       # Login page
│   │   └── sign-up/page.tsx       # Registration page
│   ├── (root)/                    # Authenticated layout group
│   │   ├── layout.tsx             # Sidebar + AuthGuard wrapper
│   │   ├── page.tsx               # Dashboard (role-aware)
│   │   ├── accounts/              # Account list + detail pages
│   │   ├── transactions/          # Transaction history
│   │   ├── transfer/              # Fund transfer form
│   │   ├── teller/                # Teller deposit/withdrawal
│   │   ├── approvals/             # Pending approvals (Manager+)
│   │   ├── admin/                 # User mgmt, roles, audit logs
│   │   └── settings/              # System settings
│   └── api/                       # Next.js API Route Handlers
│       ├── _lib/helpers.ts        # Shared auth, cookies, pagination
│       ├── auth/                  # register, login, logout, refresh, me
│       ├── accounts/              # CRUD, status, transaction history
│       ├── transactions/          # deposit, withdraw, transfer, approve
│       ├── admin/                 # users, roles, audit-logs, stats
│       ├── dashboard/             # customer, admin, manager stats
│       └── health/                # Health check
│
├── backend/                       # Business logic & data layer
│   ├── config/
│   │   ├── env.ts                 # Zod-validated environment config
│   │   └── database.ts            # Prisma client singleton (pooled)
│   ├── infrastructure/
│   │   ├── audit-logger.ts        # Audit log utility
│   │   └── token-service.ts       # JWT sign/verify helpers
│   ├── repositories/              # Data access layer (Prisma queries)
│   └── services/                  # Business logic
│       ├── auth.service.ts        # Registration, login, tokens
│       └── banking.service.ts     # Accounts, transactions, approvals
│
├── components/
│   ├── ui/                        # shadcn/ui primitives (20+ components)
│   └── dashboard/                 # Banking-specific components
│
├── lib/
│   ├── utils.ts                   # formatAmount, formatDateTime, cn()
│   ├── api-client.ts              # Axios instance with 401 interceptor
│   ├── api-hooks.ts               # All API fetch functions
│   └── stores/auth-store.ts       # Zustand auth state (with persist)
│
├── packages/shared/
│   ├── types/index.ts             # DTOs, enums, API response types
│   └── schemas/index.ts           # Zod validation schemas (shared)
│
├── prisma/
│   ├── schema.prisma              # Database schema (11 models)
│   └── seed.ts                    # Demo data seeder
│
├── vercel.json                    # Vercel deployment config
├── prisma.config.ts               # Prisma 7 configuration
├── next.config.ts                 # Server external packages config
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 (running locally or remote)
- **npm** ≥ 10

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd bank_transaction_system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://your_user@localhost:5432/bank_transaction_system"

# JWT Secrets (generate strong random strings for production!)
JWT_ACCESS_SECRET="your-access-secret-at-least-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-at-least-32-characters-long"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# Server
NODE_ENV="development"
PORT=3001
FRONTEND_URL="http://localhost:3000"

# Banking
LARGE_TRANSACTION_THRESHOLD=10000
```

### 4. Set up the database

```bash
# Create the database (if it doesn't exist)
createdb bank_transaction_system

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data (4 users, 2 accounts, roles, permissions)
npm run db:seed
```

### 5. Start development

```bash
npm run dev
```

This starts **both** servers concurrently:

| Service   | URL                    |
|-----------|------------------------|
| Frontend  | http://localhost:3000   |
| Backend   | http://localhost:3001   |

---

## Database

### Schema Overview (11 Models)

| Model                 | Purpose                                         |
|-----------------------|-------------------------------------------------|
| `User`                | User accounts with profile & lockout fields      |
| `Role`                | System roles (Customer, Teller, Manager, Admin)  |
| `Permission`          | Granular permissions (resource + action)          |
| `UserRole`            | Many-to-many user ↔ role mapping                 |
| `RolePermission`      | Many-to-many role ↔ permission mapping           |
| `Account`             | Bank accounts (Checking / Savings)                |
| `Transaction`         | Financial transactions with idempotency keys      |
| `TransactionApproval` | Approval records for large transactions           |
| `Session`             | Refresh token sessions (with device info)         |
| `AuditLog`            | Immutable audit trail (action, old/new values)    |
| `PasswordReset`       | Time-limited password reset tokens                |

### Entity Relationship

```
User ──┬── UserRole ───── Role ───── RolePermission ───── Permission
       ├── Account ────── Transaction ──── TransactionApproval
       ├── Session
       ├── AuditLog
       └── PasswordReset
```

### Key Indexes

- `Account.account_number` — Unique
- `Account.user_id` — Foreign key index
- `Transaction.idempotency_key` — Unique (prevents duplicates)
- `Transaction.source_account_id` / `destination_account_id` — Foreign key indexes
- `AuditLog.user_id`, `AuditLog.resource` — Query indexes
- `Session.token` — Unique lookup index

---

## Authentication & Security

| Feature                     | Implementation                                 |
|-----------------------------|------------------------------------------------|
| Password hashing            | bcryptjs with 12 salt rounds                   |
| Access tokens               | JWT, 15-minute expiry, signed with HS256        |
| Refresh tokens              | JWT, 7-day expiry, stored in DB, rotated on use |
| Token storage               | httpOnly, Secure, SameSite=lax cookies          |
| Token auto-refresh          | Axios 401 interceptor → transparent retry       |
| Account lockout             | 5 failed attempts → 15 min lockout              |
| Rate limiting (global)      | 100 requests / 15 min per IP                    |
| Rate limiting (login)       | 5 requests / 15 min per IP                      |
| HTTP security headers       | Helmet.js (CSP, HSTS, X-Frame, etc.)            |
| CORS                        | Restricted to `FRONTEND_URL` with credentials   |
| JSON body limit             | 10 KB max                                       |
| Transaction idempotency     | UUID idempotency keys on all mutations           |
| Audit logging               | All CRUD, auth, and admin actions                |
| Password policy             | 8+ chars, uppercase, lowercase, number, special  |

---

## Role-Based Access Control

### Roles & Permissions Matrix

| Permission                  | Customer | Teller | Manager | Admin |
|-----------------------------|:--------:|:------:|:-------:|:-----:|
| View own accounts           | ✅       | ✅     | ✅      | ✅    |
| View all accounts           | ❌       | ✅     | ✅      | ✅    |
| Create accounts             | ❌       | ✅     | ✅      | ✅    |
| Freeze / close accounts     | ❌       | ❌     | ✅      | ✅    |
| Make deposits               | ❌       | ✅     | ✅      | ✅    |
| Make withdrawals            | ❌       | ✅     | ✅      | ✅    |
| Transfer funds              | ✅       | ✅     | ✅      | ✅    |
| View transactions           | ✅       | ✅     | ✅      | ✅    |
| Approve large transactions  | ❌       | ❌     | ✅      | ✅    |
| View users                  | ❌       | ✅     | ✅      | ✅    |
| Create / update users       | ❌       | ❌     | ❌      | ✅    |
| Manage roles                | ❌       | ❌     | ❌      | ✅    |
| View audit logs             | ❌       | ❌     | ✅      | ✅    |
| System settings             | ❌       | ❌     | ❌      | ✅    |

---

## Demo Accounts

After running `npm run db:seed`, the following accounts are available:

| Role     | Email                       | Password       |
|----------|-----------------------------|----------------|
| Admin    | admin@bankingsystem.com     | Admin@12345    |
| Customer | customer@bankingsystem.com  | Customer@123   |
| Teller   | teller@bankingsystem.com    | Teller@123     |
| Manager  | manager@bankingsystem.com   | Manager@123    |

The demo **customer** comes with two pre-funded accounts:
- **Checking** (••••0001) — $5,250.75
- **Savings** (••••0002) — $12,500.00

---

## Available Scripts

| Script               | Description                                     |
|----------------------|-------------------------------------------------|
| `npm run dev`        | Start frontend + backend concurrently            |
| `npm run dev:frontend` | Start Next.js dev server only                  |
| `npm run dev:backend`  | Start Express dev server (tsx --watch)          |
| `npm run build`      | Build Next.js for production                     |
| `npm run lint`       | Run ESLint                                       |
| `npm run db:generate` | Generate Prisma client                          |
| `npm run db:push`    | Push schema to database (no migrations)          |
| `npm run db:migrate` | Run Prisma migrations                            |
| `npm run db:seed`    | Seed database with demo data                     |
| `npm run db:studio`  | Open Prisma Studio GUI                           |

---

## API Reference

See the full **[API Guide →](./API_GUIDE.md)** for complete endpoint documentation with request/response examples, validation rules, and curl commands.

### Quick Overview

| Method | Endpoint                            | Auth | Description                    |
|--------|-------------------------------------|------|--------------------------------|
| POST   | `/api/auth/register`                | ❌   | Register new user              |
| POST   | `/api/auth/login`                   | ❌   | Login (returns JWT cookies)    |
| POST   | `/api/auth/refresh`                 | 🍪   | Refresh access token           |
| POST   | `/api/auth/logout`                  | ✅   | Logout & revoke session        |
| GET    | `/api/auth/me`                      | ✅   | Get current user profile       |
| POST   | `/api/auth/password-reset-request`  | ❌   | Request password reset         |
| POST   | `/api/auth/password-reset`          | ❌   | Reset password with token      |
| GET    | `/api/accounts`                     | ✅   | List accounts (role-filtered)  |
| GET    | `/api/accounts/:id`                 | ✅   | Get account details            |
| POST   | `/api/accounts`                     | ✅🔒 | Create account                 |
| PATCH  | `/api/accounts/:id/status`          | ✅🔒 | Freeze / activate / close      |
| GET    | `/api/accounts/:id/transactions`    | ✅   | Account transaction history    |
| POST   | `/api/transactions/deposit`         | ✅🔒 | Make deposit                   |
| POST   | `/api/transactions/withdraw`        | ✅🔒 | Make withdrawal                |
| POST   | `/api/transactions/transfer`        | ✅   | Transfer funds                 |
| POST   | `/api/transactions/:id/approve`     | ✅🔒 | Approve/reject transaction     |
| GET    | `/api/transactions`                 | ✅   | List transactions (paginated)  |
| GET    | `/api/transactions/pending`         | ✅🔒 | List pending approvals         |
| GET    | `/api/transactions/:id`             | ✅   | Get transaction details        |
| GET    | `/api/admin/users`                  | ✅🔒 | List all users                 |
| GET    | `/api/admin/users/:id`              | ✅🔒 | Get user details               |
| PATCH  | `/api/admin/users/:id`              | ✅🔒 | Update user                    |
| POST   | `/api/admin/users/assign-role`      | ✅🔒 | Assign role to user            |
| DELETE | `/api/admin/users/:id/roles/:role`  | ✅🔒 | Remove role from user          |
| GET    | `/api/admin/audit-logs`             | ✅🔒 | View audit logs                |
| GET    | `/api/dashboard/customer`           | ✅   | Customer dashboard stats       |
| GET    | `/api/dashboard/admin`              | ✅🔒 | Admin dashboard stats          |
| GET    | `/api/dashboard/manager`            | ✅🔒 | Manager dashboard stats        |
| GET    | `/api/health`                       | ❌   | Health check                   |

✅ = Requires authentication · 🔒 = Requires specific role/permission · 🍪 = Requires refresh token cookie

---

## Environment Variables

| Variable                       | Required | Default              | Description                          |
|--------------------------------|----------|----------------------|--------------------------------------|
| `DATABASE_URL`                 | ✅       | —                    | PostgreSQL connection string         |
| `JWT_ACCESS_SECRET`            | ✅       | —                    | Secret for signing access tokens     |
| `JWT_REFRESH_SECRET`           | ✅       | —                    | Secret for signing refresh tokens    |
| `JWT_ACCESS_EXPIRY`            | ❌       | `15m`                | Access token expiry duration         |
| `JWT_REFRESH_EXPIRY`           | ❌       | `7d`                 | Refresh token expiry duration        |
| `BCRYPT_ROUNDS`                | ❌       | `12`                 | bcrypt hashing rounds                |
| `RATE_LIMIT_WINDOW_MS`         | ❌       | `900000`             | Rate limit window (ms)               |
| `RATE_LIMIT_MAX_REQUESTS`      | ❌       | `100`                | Max requests per window              |
| `LOGIN_RATE_LIMIT_MAX`         | ❌       | `5`                  | Max login attempts per window        |
| `NODE_ENV`                     | ❌       | `development`        | Environment mode                     |
| `PORT`                         | ❌       | `3001`               | Backend API port                     |
| `FRONTEND_URL`                 | ❌       | `http://localhost:3000` | Allowed CORS origin               |
| `LARGE_TRANSACTION_THRESHOLD`  | ❌       | `10000`              | Amount requiring approval ($)        |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## Deployment

This project is deployed on **Vercel** with a **Supabase** PostgreSQL database.

### Vercel Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooler connection string (port 6543) |
| `JWT_ACCESS_SECRET` | Min 32 characters |
| `JWT_REFRESH_SECRET` | Min 32 characters |

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itemuln/bank-transaction-full-stack)

1. Create a [Supabase](https://supabase.com) project
2. Copy the **connection pooler** URL (port 6543, transaction mode)
3. Deploy to Vercel and set the environment variables above
4. Run `npx prisma db push` against your Supabase database
5. Run `npx tsx prisma/seed.ts` to seed demo data

---

## License

This project is for educational and portfolio purposes. All rights reserved.
