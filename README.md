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

The API targets the installed .NET 5 SDK on this machine. Before public
deployment, upgrade the API to a current LTS .NET version and move from SQLite
to a managed database if multiple users will rely on the app.
