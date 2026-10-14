# EstateHub (Venture Plus) — Real Estate Platform

EstateHub is a full‑stack real estate management platform built to manage **ventures**, **plots**, **leads**, **customers**, and day‑to‑day sales operations. It contains:

- `client/`: a Vite + React + TypeScript dashboard (shadcn-ui + Tailwind)
- `server/`: an Express + Prisma API server (TypeScript)
- `database/`: Prisma schema + migrations (MySQL)

This README documents **how this repo is structured, how to run it locally, and how the main flows work**.

## Tech Stack

- Frontend: Vite + React + TypeScript, shadcn-ui, Tailwind CSS
- Backend: Node.js, Express, Zod validation, JWT (cookie-based), Multer uploads
- Database: Prisma + MySQL
- Realtime: SSE by default, optional WebSocket (`ws`)
- Security: Helmet, rate limiting, HPP, CSRF checks in production

## Key Features

- Role-based access: `ADMIN`, `EMPLOYEE`, `AGENT`, `CUSTOMER`
- Locations → Ventures → Plots inventory management
- Plot layout regions + plot coordinate mapping (`x/y/width/height`)
- Venture layout + photo uploads served from `/uploads`
- Lead pipeline + customer records (`/total-data`)
- Favorites, inquiries, tracking updates, stats dashboards
- Realtime updates via `GET /api/stream` (SSE) and optional `ws://<host>/api/ws`

## Repository Layout

- `client/` Main UI (Vite React)
- `server/` API server (Express + Prisma)
- `database/` Prisma schema + migrations
- `dist/` Build output used by some deployments (generated)
- `uploads/` Runtime uploads (generated at runtime inside `server/`)
- `backend/` Legacy scripts and test utilities (not part of the main runtime)
- `frontend/` Legacy connection tests (not part of the main runtime)
- `Procfile` Start command used by some PaaS providers

## Prerequisites

- Node.js (recommended: 18+ LTS)
- MySQL server (local or hosted)
- npm (repo uses npm workspaces)

## Quick Start (Local Development)

From `venture_plus/`:

1) Install dependencies:
```sh
npm i
```

2) Configure server env:

Windows:
```sh
copy server\.env.example server\.env
```
macOS/Linux:
```sh
cp server/.env.example server/.env
```

3) Configure client env:

Windows:
```sh
copy client\.env.example client\.env
```
macOS/Linux:
```sh
cp client/.env.example client/.env
```

4) Create DB tables with Prisma migrations:
```sh
npm run prisma:migrate -w server
```

5) (Optional) Seed sample data:
```sh
npm run seed -w server
```

6) Start client + server together:
```sh
npm run dev
```

Defaults:
- Client: `http://localhost:8081`
- API: `http://localhost:4000`
- API base: `http://localhost:4000/api`

## Environment Variables

### Server (`server/.env`)

Required:
- `DATABASE_URL` MySQL connection string (example: `mysql://user:pass@localhost:3306/estatehub`)
- `JWT_SECRET` (change in production)

Common:
- `NODE_ENV` `development` | `test` | `production`
- `PORT` API port (default `4000`)
- `JWT_EXPIRES_IN` token TTL (default `1d`)
- `CORS_ORIGIN` comma-separated allowed origins (example includes `http://localhost:8081`)
- `LOG_LEVEL` `info` (default) / `debug` / ...

Realtime:
- `REALTIME_TRANSPORT` `sse` (default) or `ws`
- `REALTIME_REDIS_URL` optional; used only when you wire multi-instance fanout

Cookies / CSRF (mainly production):
- `COOKIE_SAMESITE` `lax` | `strict` | `none`
- `COOKIE_DOMAIN` optional cookie domain
- `CSRF_COOKIE_NAME` default `estatehub_csrf`
- `ACCESS_TOKEN_COOKIE_NAME` default `estatehub_access`

### Client (`client/.env`)
- `VITE_API_URL` API base URL (default `http://localhost:4000/api`)
- `VITE_CSRF_COOKIE_NAME` must match server `CSRF_COOKIE_NAME`

## Core Concepts (Data Model)

The source of truth is `database/schema.prisma`:

- `Location` → `Venture` → `Plot`
- `User` with roles: `ADMIN`, `EMPLOYEE`, `AGENT`, `CUSTOMER`
- `EmployeeProfile` (account status, metadata for employees)
- `AgentProfile` (agent details)
- `Lead` (interest on a plot, optional assigned agent)
- `CustomerRecord` (sales pipeline records shown under `/total-data`)
- `Favorite` (user ↔ plot)
- `Inquiry` (public inquiries; optionally linked to plot/agent)
- `TrackingUpdate` (live location + status updates per customer record)

## API Overview

All endpoints are under `/api`.

Public:
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register` (creates `EMPLOYEE` users only)
- `POST /api/inquiries`

Auth:
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/change-password`
- `POST /api/auth/customers` (provision a `CUSTOMER` account; requires staff role)
- `GET /api/auth/csrf` (CSRF cookie helper; used in production)

Inventory:
- `GET /api/locations`, `GET /api/locations/:id`
- `GET /api/ventures`, `GET /api/ventures/:id`, `POST /api/ventures`
- `GET /api/plots`, `GET /api/plots/:id`, `PUT /api/plots/:id`
- `PUT /api/plots/:id/coords`, `PUT /api/plots/coords`
- `GET /api/plots/:plotId/leads`

Leads + Customers:
- `GET /api/leads`, `POST /api/leads`, `PUT /api/leads/:leadId`, `DELETE /api/leads/:leadId`
- `GET /api/total-data`, `POST /api/total-data`, `PUT /api/total-data/:id`, `DELETE /api/total-data/:id`

Engagement:
- `GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites/:plotId`
- `GET /api/agents`, `GET /api/agents/:id`
- `GET /api/stats`
- `GET /api/tracking`, `POST /api/tracking`

Employee access management:
- `GET /api/employees`, `GET /api/admins`, `GET /api/customers`
- `GET /api/employee-access/employees`, `POST /api/employee-access/employees`
- `PUT /api/employee-access/employees/:id`, `POST /api/employee-access/employees/:id/status`
- `POST /api/employee-access/otp/request`, `POST /api/employee-access/otp/verify`

## Realtime

- SSE stream: `GET /api/stream` (requires auth)
- WebSocket: set `REALTIME_TRANSPORT=ws` and connect to `ws://<host>/api/ws`

## Uploads

Uploads are stored under `server/uploads/` and served by the API at `/uploads`.

Endpoints:
- `POST /api/ventures/:id/layout` venture layout upload
- `POST /api/ventures/:id/photo` venture photo upload

Local testing helper:
- `backend/test-images-browser.html` can be used to quickly verify image URLs and CORS behavior.

## Seed Data (Optional)

Run:
```sh
npm run seed -w server
```

Creates sample users (passwords are for local testing only):

- Admins:
  - `admin@estatehub.com` / `Admin123!` (admin code: `ADMIN2026`)
  - `manager@estatehub.com` / `Admin123!` (admin code: `ADMIN2027`)
- Employee: `john.employee@estatehub.com` / `Emp123!`
- Agent: `lisa.agent@estatehub.com` / `Emp123!`
- Customers:
  - `customer1@estatehub.com` / `Cust123!`
  - `customer2@estatehub.com` / `Cust123!`

## Scripts

From `venture_plus/`:
- `npm run dev` run client + server (concurrently)
- `npm run build` build client + server
- `npm run lint` lint client + server
- `npm run test` client tests (Vitest)
- `npm run prisma:generate` generate Prisma client

Server workspace (`-w server`):
- `npm run dev -w server` API dev server
- `npm run start -w server` production server (builds first)
- `npm run prisma:migrate -w server` local dev migrations
- `npm run prisma:deploy -w server` production migrations
- `npm run prisma:studio -w server` Prisma Studio
- `npm run seed -w server` seed data

Client workspace (`-w client`):
- `npm run dev -w client` Vite dev server on `8081`
- `npm run build -w client` production build
- `npm run preview -w client` preview build
- `npm run test -w client` run Vitest suite

## Deployment Notes

- `Procfile` contains `web: npm run start -w server` for platforms that honor Procfiles.
- Ensure these run as part of deploy:
  - `npm run build`
  - `npm run prisma:deploy -w server` (migrations)
- Host the client output from `client/dist` via a static host/CDN, or configure your infra to serve it.

## Troubleshooting

- Prisma connection errors: verify `DATABASE_URL`, MySQL is reachable, and the database exists.
- CORS errors in browser: add your origin to `CORS_ORIGIN` (comma-separated), then restart the server.
- WebSocket auth failures: send `Authorization: Bearer <token>` or ensure the access-token cookie exists.
