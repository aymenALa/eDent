# eDent — Dental Education & Practical Work Platform

eDent is a full-stack educational platform for managing dental practical work. It connects **Administrators**, **Professors**, and **Students** through role-based academic workspaces:

- **Administrators**: Manage, activate, and deactivate professor accounts.
- **Professors**: Organize student cohorts, manage anatomical tooth references and practical-work assignments, inspect student submissions, view group statistics, and export PDF reports.
- **Students**: Track assigned practical work, upload front and side tooth illustrations/images, place 9 landmarks per view in the Tooth Analysis Studio, review prototype scores, and manage personal profile details.

> **Educational Prototype Disclaimer**: The tooth-angle measurements and scoring use prototype geometric definitions for educational demonstration only. They are not clinically validated and must not be used for clinical diagnosis or treatment decisions.

## Project Authorship

Originally created by **Yahya Mourid**, enhanced and modernized by **Aymen Alioua**.

## Required Software

- **Node.js** 18+ (verified with Node v22.13.1 / npm 10.9.2)
- **Java** 17+ (targets Java 17; verified with JDK 21.0.4)
- **MySQL** 8.x (or Docker Compose)

## Local Database Setup & Import

The repository includes a sanitized, synthetic demonstration dataset in [`edent.sql`](edent.sql) (1 administrator, 6 professors, 48 students, 6 groups, 12 teeth, 10 practical works, and 54 completed submissions with procedurally generated tooth illustrations).

```sql
CREATE DATABASE IF NOT EXISTS dents;
```

```powershell
mysql -h 127.0.0.1 -P 3307 -u root dents < edent.sql
```

> Default Spring Boot configuration in `edent-backend/src/main/resources/application.properties` targets `jdbc:mysql://localhost:3307/dents?serverTimezone=UTC` (override via `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` as needed).

## Environment Variables

- **Backend**:
  - `SPRING_DATASOURCE_URL` (optional override, e.g. `jdbc:mysql://127.0.0.1:3308/edent_test?serverTimezone=UTC`)
  - `SPRING_DATASOURCE_USERNAME`
  - `SPRING_DATASOURCE_PASSWORD`
  - `MAIL_USERNAME` (Gmail SMTP username for account/password-recovery emails)
  - `MAIL_PASSWORD` (Google App Password; never commit real credentials)
- **Frontend** (`edent-frontend/.env` or process environment):
  - `VITE_PORT_SPRING=5050`

## Running Locally

### Backend (Maven Wrapper)

```powershell
cd edent-backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

### Frontend (Vite)

```powershell
cd edent-frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Local Demo Accounts

> **Demo-Only Warning**: These synthetic accounts are strictly for local demonstration and testing. Do not enable or reuse them in production deployments.

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin.synth@test.local` | `SynthAdmin!23` |
| **Professor** | `prof.synth@test.local` | `SynthProf!23` |
| **Student** | `student.synth@test.local` | `SynthStud!23` |

## Application Modes

eDent supports two distinct runtime modes:

- **Full-Stack Mode** (`ui-enhancement` branch, `VITE_DEMO_MODE=false` or unset):
  - Architecture: **React + Spring Boot + MySQL/TiDB + JWT authentication**.
  - Requires a running backend and database; uses real password/BCrypt login, JWT tokens, and server-side role/ownership enforcement.
- **Interactive Portfolio Demo Mode** (`portfolio-demo` branch, `VITE_DEMO_MODE=true`):
  - Architecture: **React + Centralized Demo Adapter + IndexedDB** (`edent_portfolio_demo`), seeded on first visit from `edent-frontend/public/demo-seed.json` (`55` users, `6` groups, `12` teeth, `10` practical works, `32` group assignments, `54` submissions).
  - **Passwordless Access (`/demo`)**: Visitors can explore as **Administrator**, **Professor**, or **Student** without entering a password or connecting to any backend.
  - **Browser-Local Persistence**: Changes (activations, groups, students, PWs, tooth-image landmark submissions) persist in the visitor's own browser via IndexedDB across refreshes.
  - **Role Switching & Reset**: An in-workspace demo bar lets visitors switch between Admin, Professor, and Student seamlessly or click **Reset demo data** (with confirmation) to restore the initial synthetic dataset.
  - **Sample Tooth Images**: The Tooth Analysis Studio provides sample front/side tooth illustrations in demo mode so visitors can test 9-landmark geometry, scoring, and PDF export without uploading local files.

```powershell
cd edent-frontend
$env:VITE_DEMO_MODE = "true"
npm run dev
```

