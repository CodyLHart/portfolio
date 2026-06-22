# Cody Hart Portfolio

This repository is a portfolio shell plus independent project apps. The root
Next.js app is the central launchpad. Project apps live under `apps/` and can
choose their own stack.

## Apps

```text
apps/
  design-portfolio/  design gallery metadata, currently served at /design-portfolio
  habit-tracker/     C# API + SQLite + React/Vite frontend
  games/             React/Vite browser games app
  list-app/          Next.js + Supabase collaborative list app
```

## Root site

```bash
npm run dev
npm run build
npm run lint
```

The root site is still Vercel-friendly and can continue to deploy from the
existing GitHub integration.

For production, set deployed app URLs so the root portfolio opens live apps
instead of local dev servers:

```bash
NEXT_PUBLIC_HABIT_TRACKER_URL=https://habit-tracker.example.com
NEXT_PUBLIC_GAMES_URL=https://games.example.com
NEXT_PUBLIC_LIST_APP_URL=https://list-app.example.com
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

## List App

```bash
cd apps/list-app
npm run dev
```

Create a Supabase project, run `apps/list-app/supabase/schema.sql`, enable
Google auth, and set these variables in the List App deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_PORTFOLIO_URL=https://www.codyhart.dev
```
