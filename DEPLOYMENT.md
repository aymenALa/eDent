# eDent — Zero-Cost Cloud Deployment Guide ($0.00)

eDent supports two zero-cost deployment options:

1. **Interactive Portfolio Demo (`portfolio-demo` branch, Vercel Hobby only — $0.00, no credit card)**:
   - Runs **100% in the browser** (`VITE_DEMO_MODE=true`) using a centralized demo adapter + **IndexedDB** (`edent_portfolio_demo`), seeded from `edent-frontend/public/demo-seed.json`.
   - Includes passwordless role selection (`/demo`), in-workspace role switching, **Reset demo data**, sample tooth images, floating welcome announcement, and PDF exports — with **zero** backend or cloud database dependency.
2. **Full-Stack Deployment (`ui-enhancement` branch)**:

| Layer | Provider & Tier | Key Limits & Notes |
|---|---|---|
| **Frontend** | **Vercel Hobby** (`edent`) | Root `edent-frontend/`, Vite (`dist/`), SPA rewrites via `vercel.json` |
| **Backend** | **Render Free (Docker)** (`edent-backend`) | Root `edent-backend/`, 512 MB RAM (`-Xms128m -Xmx320m -XX:+UseSerialGC`), binds `${PORT:-5050}`, spins down after 15 min inactivity (~1 min cold start) |
| **Database** | **TiDB Cloud Starter** (`edent-demo`) | MySQL-compatible, 5 GiB row storage, mandatory TLS, 6 MiB max single-row limit |

---

## 0. Portfolio Demo Deployment — Vercel Hobby ($0, No Backend Required)

1. In **Vercel**, import `https://github.com/aymenALa/eDent`:
   - **Project Name**: `edent`
   - **Branch**: `portfolio-demo`
   - **Root Directory**: `edent-frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add **Environment Variable**:
   - `VITE_DEMO_MODE` = `true`
3. Deploy. [`edent-frontend/vercel.json`](edent-frontend/vercel.json) handles React Router SPA rewrites (`/demo`, `/professor/dashboard`, `/student`, `/admin`, etc.). No `VITE_API_BASE_URL`, backend, or database credentials are needed.

---

## 1. Database Setup — TiDB Cloud Starter ($0)

1. Sign in to **TiDB Cloud** and create a **Starter** cluster (`edent-demo`, AWS Frankfurt, $0 monthly spending limit).
2. Create the database `edent_demo` and a least-privilege application user (`SELECT` only for read-only demo, or `SELECT, INSERT, UPDATE, DELETE` on `edent_demo.*`).
3. Import the sanitized demonstration dataset [`edent.sql`](edent.sql) with TLS enabled:
   ```bash
   mysql --ssl-mode=VERIFY_IDENTITY -h <TIDB_HOST> -P 4000 -u <TIDB_USER> -p edent_demo < edent.sql
   ```

---

## 2. Backend Setup — Render Free Docker Web Service ($0)

1. In **Render**, create a **New Web Service** connected to `https://github.com/aymenALa/eDent`.
2. Configure the service:
   - **Service Name**: `edent-backend`
   - **Branch**: `ui-enhancement`
   - **Root Directory**: `edent-backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (uses [`edent-backend/Dockerfile`](edent-backend/Dockerfile))
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
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://<TIDB_HOST>:4000/edent_demo?serverTimezone=UTC&sslMode=VERIFY_IDENTITY` | Mandatory TLS for TiDB Cloud |
| `SPRING_DATASOURCE_USERNAME` | `<restricted-db-user>` | Least-privilege TiDB Cloud user |
| `SPRING_DATASOURCE_PASSWORD` | `<restricted-db-password>` | From TiDB Cloud |
| `SPRING_JPA_DDL_AUTO` | `none` | Recommended after importing `edent.sql` |

4. Deploy and verify `GET https://edent-backend.onrender.com/api/health` returns:
   ```json
   { "status": "UP", "demoReadOnly": true }
   ```
   > **Cold Start Note**: Render Free spins down after 15 minutes of inactivity; the first request after idle takes ~45–60 seconds.

---

## 3. Frontend Setup — Vercel Hobby ($0)

1. In **Vercel**, import `https://github.com/aymenALa/eDent` as a new project:
   - **Project Name**: `edent`
   - **Branch**: `ui-enhancement`
   - **Root Directory**: `edent-frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api`
3. Deploy. [`edent-frontend/vercel.json`](edent-frontend/vercel.json) rewrites all routes to `/index.html` so direct links and browser refreshes work cleanly.

---

## 4. Public Demo Security & Accounts

- When `APP_DEMO_READONLY=true`:
  - Visitors can log in across all 3 roles, browse dashboards, inspect student submissions, test the **Tooth Analysis Studio** landmark/angle preview locally in the browser, and export **PDF reports**.
  - Any mutating request (`POST`, `PUT`, `PATCH`, `DELETE`) other than `POST /api/users/login` is rejected server-side with `403 Forbidden` (`"Public demo mode is read-only. Changes cannot be saved."`).
- Password hashes (`User.password`) and activation codes (`User.codeActivation`) are marked `WRITE_ONLY` and never serialized in API responses.
- Demo accounts seeded in `edent.sql`:
  - **Administrator**: `admin.synth@test.local` / `SynthAdmin!23`
  - **Professor**: `prof.synth@test.local` / `SynthProf!23`
  - **Student**: `student.synth@test.local` / `SynthStud!23`

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
