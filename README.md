# Cody Hart Portfolio

This repository is a portfolio shell plus independent project apps. The root
Next.js app is the central launchpad. Project apps live under `apps/` and can
choose their own stack.

## Apps

```text
apps/
  design-portfolio/  design gallery metadata, currently served at /design-portfolio
  habit-tracker/     C# API + SQLite + React/Vite frontend
```

## Root site

```bash
npm run dev
npm run build
npm run lint
```

The root site is still Vercel-friendly and can continue to deploy from the
existing GitHub integration.

For production, set the deployed habit tracker URL so the root portfolio opens
the live app instead of the local Vite dev server:

```bash
NEXT_PUBLIC_HABIT_TRACKER_URL=https://habit-tracker.example.com
```

## All projects

```bash
npm run build:projects
npm run lint:projects
npm run build:all
npm run lint:all
```

`build:projects` runs each independent app that defines a build script.

## Habit tracker

```bash
cd apps/habit-tracker
npm run dev:api
npm run dev:web
```

The API currently targets .NET 10. Local development defaults to SQLite, while
production can use PostgreSQL by setting `Database__Provider=Postgres` and a
hosted PostgreSQL connection string.

Production config examples live in:

```text
.env.example
apps/habit-tracker/web/.env.example
apps/habit-tracker/api/appsettings.Production.example.json
```
