# Saukele — Digital Wedding Registry & Kazakh Tradition Logistics Platform

A production-grade backend for managing Kazakh wedding gift registries, guest family trees, vendor coordination, and delivery logistics.

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

---

## Setup

```bash
git clone <https://github.com/Yersin165/saukele-backend.git>
cd saukele-backend

cp .env.example .env
# Fill in all values in .env before continuing

npm install
npx prisma migrate deploy
npx prisma generate
```

**Start the API server:**
```bash
npm run dev
```

**Start the background worker (separate terminal):**
```bash
npm run worker
```

API will be available at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/docs`

---

## Running Tests

```bash
npm test
```

Tests use a real PostgreSQL database defined by `DATABASE_URL` in your `.env`. The test suite cleans up after itself between runs.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development`, `test`, or `production` |
| `APP_URL` | Base URL used in email links (e.g. `http://localhost:3000`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_EXPIRES_IN` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `7d`) |
| `RESEND_API_KEY` | API key from resend.com for transactional email |
| `EMAIL_FROM` | Sender address (e.g. `Saukele <noreply@yourdomain.com>`) |

---

## User Roles

| Role | Description |
|---|---|
| `COUPLE` | Creates and manages the wedding profile, gift registry, and family tree |
| `GUEST` | Views the registry and makes contributions to pool gifts |
| `VENDOR` | Lists gift items for sale; requires admin approval before going live |
| `COURIER` | Assigned to deliveries and updates delivery status |
| `ADMIN` | Approves/suspends vendors, bans users, monitors job queues |

---

## Architecture Decisions

**Prisma ORM** — All database access goes through Prisma. This enforces type safety, keeps the full migration history in version control, and eliminates any risk of raw SQL injection. The schema is the single source of truth for the database structure.

**BullMQ + Redis for background jobs** — All emails are queued and processed asynchronously by a separate worker process. API endpoints never block waiting for Resend to respond. Jobs have automatic retry with exponential backoff (3 attempts), and admins can monitor queue health via `GET /api/admin/queues`.

**Resend for transactional email** — Five business events trigger real emails: account verification, password reset, contribution received, gift fully funded, and vendor status changes. All are processed through the BullMQ email queue, never inline.

**Cursor-based pagination** — All list endpoints use cursor pagination instead of offset. This avoids duplicate or skipped records when rows are inserted or deleted between pages, which matters for live registries with concurrent guest activity.

**JWT with refresh token rotation** — Access tokens expire in 15 minutes. Refresh tokens are stored in the database and rotated on every use. Tokens are immediately revoked on logout, password reset, and account ban.

---

## API Reference

Full OpenAPI spec: [`openapi.yaml`](./openapi.yaml)  
Interactive docs: `http://localhost:3000/docs`

The implementation matches `openapi.yaml` exactly. No deviations.

### Endpoint summary

| Domain | Base path |
|---|---|
| Auth | `/api/auth` |
| Weddings | `/api/weddings` |
| Gifts | `/api/gifts` |
| Contributions | `/api/contributions` |
| Family members | `/api/family-members` |
| Vendors | `/api/vendors` |
| Admin | `/api/admin` |

---

## Background Jobs

| Queue | Job | Schedule |
|---|---|---|
| `emails` | Verification, password reset, contribution confirmed, gift funded, vendor status | Triggered on demand |
| `gifts` | `EXPIRE_DEADLINES` — resets overdue gifts back to AVAILABLE | Every hour (`0 * * * *`) |

---

## Health Check
GET /health
Returns `{ status: "ok", timestamp: "..." }`. Use this to verify the server is running.