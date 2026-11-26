# eDent — Zero-Cost Cloud Deployment Guide ($0.00)

This guide covers deploying **eDent** publicly at **$0.00/month** using free-tier managed services:

| Layer | Provider & Tier | Key Limits & Notes |
|---|---|---|
| **Frontend** | **Vercel Hobby** | Root `dents-front-end/`, Vite (`dist/`), SPA rewrites via `vercel.json` |
| **Backend** | **Render Free (Docker)** | Root `dents-back-end/`, 512 MB RAM (`-Xms128m -Xmx320m -XX:+UseSerialGC`), binds `${PORT:-5050}`, spins down after 15 min inactivity (~1 min cold start) |
| **Database** | **TiDB Cloud Starter** | MySQL-compatible, 5 GiB row storage, mandatory TLS, 6 MiB max single-row limit (`dents.sql` largest row is ~2.06 MB) |

---

## 1. Database Setup — TiDB Cloud Starter ($0)

1. Sign in to **TiDB Cloud** and create a **Starter** cluster (no credit card required).
2. Confirm the cluster spending limit is set to **$0** (free tier).
3. Create a database (e.g. `edent`) and note your **Host**, **Port (`4000`)**, **Username**, and **Password**.
4. Import the sanitized demonstration dataset [`dents.sql`](dents.sql) with TLS enabled:
   ```bash
   mysql --ssl-mode=VERIFY_IDENTITY -h <TIDB_HOST> -P 4000 -u <TIDB_USER> -p edent < dents.sql
   ```
   > **Verified**: `dents.sql` (`18.4 MB` total; `55` users, `48` students, `54` submissions; largest single row ~`2.06 MB`) contains no `DEFINER`, `USE`, or `CREATE DATABASE` statements and fits well within TiDB Cloud Starter's 5 GiB storage and 6 MiB single-row limits.

---

## 2. Backend Setup — Render Free Docker Web Service ($0)

1. In **Render**, create a **New Web Service** connected to your GitHub repository.
2. Configure the service:
   - **Root Directory**: `dents-back-end`
   - **Runtime**: `Docker` (uses [`dents-back-end/Dockerfile`](dents-back-end/Dockerfile))
   - **Instance Type**: `Free`
   - **Health Check Path**: `/api/health`
3. Add the following **Environment Variables** in Render:

| Variable | Example / Value | Notes |
|---|---|---|
| `APP_ENV` | `prod` | Enforces mandatory `JWT_SECRET` (min 32 chars) at startup |
| `JWT_SECRET` | `<random-64-char-secret>` | Generate with `openssl rand -base64 48` |
| `APP_DEMO_READONLY` | `true` | Blocks `POST`/`PUT`/`PATCH`/`DELETE` (except `/api/users/login`) with HTTP `403` |
| `APP_MAIL_ENABLED` | `false` | Disables outbound SMTP in public demo |
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` | Comma-separated explicit origins (no `*`) |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<TIDB_HOST>:4000/edent?serverTimezone=UTC&sslMode=VERIFY_IDENTITY` | Mandatory TLS for TiDB Cloud |
| `SPRING_DATASOURCE_USERNAME` | `<TIDB_USER>` | From TiDB Cloud |
| `SPRING_DATASOURCE_PASSWORD` | `<TIDB_PASSWORD>` | From TiDB Cloud |
| `SPRING_JPA_DDL_AUTO` | `none` | Recommended after importing `dents.sql` (`update` also supported) |

4. Deploy and verify `GET https://<your-backend>.onrender.com/api/health` returns:
   ```json
   { "status": "UP", "demoReadOnly": true }
   ```
   > **Cold Start Note**: Render Free spins down after 15 minutes of inactivity; the first request after idle takes ~45–60 seconds.

---

## 3. Frontend Setup — Vercel Hobby ($0)

1. In **Vercel**, import the GitHub repository as a new project.
2. Configure project settings:
   - **Root Directory**: `dents-front-end`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://<your-backend>.onrender.com/api`
4. Deploy. [`dents-front-end/vercel.json`](dents-front-end/vercel.json) rewrites all routes to `/index.html` so direct links and browser refreshes work cleanly.

---

## 4. Public Demo Security & Accounts

- When `APP_DEMO_READONLY=true`:
  - Visitors can log in across all 3 roles, browse dashboards, inspect student submissions, test the **Tooth Analysis Studio** landmark/angle preview locally in the browser, and export **PDF reports**.
  - Any mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) other than `POST /api/users/login` is rejected server-side with `403 Forbidden` (`"Public demo mode is read-only. Changes cannot be saved."`).
- Password hashes (`User.password`) and activation codes (`User.codeActivation`) are marked `WRITE_ONLY` and never serialized in API responses.
- Demo accounts seeded in `dents.sql`:
  - **Administrator**: `admin.synth@test.local` / `SynthAdmin!23`
  - **Professor**: `prof.synth@test.local` / `SynthProf!23`
  - **Student**: `student.synth@test.local` / `SynthStud!23`

### Historical GitHub Exposure Checklist

Before making the repository or deployment public:
1. Rotate any Gmail App Password or database credentials that may have existed in earlier Git commits on `main`.
2. Ensure no `.env` files with real secrets are committed (`.env.example` contains placeholders only).

---

## 5. Post-Deploy Smoke Tests

```bash
# 1. Backend health & demo mode
curl -s https://<your-backend>.onrender.com/api/health

# 2. Unauthenticated access must return 401
curl -i https://<your-backend>.onrender.com/api/users/all

# 3. Demo login must return 200 with JWT
curl -s -X POST https://<your-backend>.onrender.com/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student.synth@test.local","password":"SynthStud!23"}'

# 4. Read-only mutation must return 403 when APP_DEMO_READONLY=true
curl -i -X POST https://<your-backend>.onrender.com/api/pws/add \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Should be blocked"}'
```
