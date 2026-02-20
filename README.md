# Data Science Interview Prep Tracker

Minimal web app to track study sessions, daily plans, and progress for data science interview prep. Built with Next.js (App Router), TypeScript, Tailwind, Prisma, and SQLite.

## Screenshots

| Dashboard | Applications | Progress |
|-----------|--------------|----------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Applications](docs/screenshots/applications.png) | ![Progress](docs/screenshots/progress.png) |

## Features

- **Dashboard** – Today’s upcoming sessions and progress at a glance (total time, week, streak)
- **Daily plan** – Suggested sessions for today (based on least-practiced tags) and your scheduled tasks
- **Tasks** – Study sessions with title, duration, scheduled date/time, and tags
- **Applications** – Track job applications (company, role, status, date applied, notes, next step). Filter by status; status-updated date is recorded when you change status
- **Progress** – Total time, this week’s time, streak, and time-by-tag chart
- **Tags** – Default tags (SQL, ML, Stats, Python, Behavioral) plus any you add; all editable

No auth in v1 (single-user, local).

## Run locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` in the project root:

   ```bash
   cp .env.example .env
   ```

   Default content: `DATABASE_URL="file:./dev.db"`. Prisma will create the SQLite file when you run migrations.

3. **Database**

   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

   This creates the SQLite DB and seeds the 5 default tags.

4. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). The root redirects to `/dashboard`.

## Scripts

| Command           | Description                |
|-------------------|----------------------------|
| `npm run dev`     | Start Next.js dev server   |
| `npm run build`   | Production build           |
| `npm run start`   | Start production server    |
| `npm run lint`    | Run ESLint                 |
| `npx prisma migrate dev` | Create/apply migrations |
| `npx prisma db seed`     | Seed default tags        |

## Tech

- **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS**
- **Prisma** + **SQLite** (local `./dev.db`)
- **Recharts** for the progress “time by tag” chart

## File structure (main)

- `prisma/schema.prisma` – Tag, Task, TaskTag, Application
- `src/app/` – Routes: `/` (redirects to dashboard), `/dashboard`, `/plan`, `/tasks`, `/tasks/[id]`, `/applications`, `/applications/[id]`, `/progress`, `/tags`
- `src/components/` – Layout (Nav, PageContainer), tasks, plan, progress, applications, ui
- `src/lib/` – `db`, `tags`, `tasks`, `progress`, `applications`
