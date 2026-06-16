# Portfolio project architecture

This repository is organized as a portfolio shell plus independent project
workspaces. The root app is the directory/index experience; portfolio projects
live in `apps/`.

## Current deployment

The root Next.js app remains the deployable portfolio shell. That keeps the
existing GitHub-to-Vercel setup intact: Vercel can continue running the root
`npm run build` command when changes are pushed.

## Future project apps

Place standalone applications in `apps/<slug>`. Each app can choose its own
framework, dependencies, and scripts. Register public-facing projects in
`src/data/projects.ts` so the central site can list them at `/projects` and show
details at `/projects/<slug>`.

The habit tracker follows this shape:

```text
apps/habit-tracker/
  api/  ASP.NET Core Web API, EF Core, SQLite, Google OAuth
  web/  Vite, React, TypeScript
```

## URL strategy

Use portfolio-owned pages for project descriptions:

```text
/projects
/projects/<slug>
```

When a project is ready to run as its own app, link its registry `href` to the
running experience. Static React/Vite apps can be served by Vercel. Server-backed
apps such as the C# habit tracker should deploy the frontend and API separately,
or deploy both behind a .NET-capable host.

Recommended deployment path:

1. Keep the central portfolio shell on Vercel.
2. Deploy static frontends, such as Vite builds, to Vercel when they do not need
   a custom server.
3. Deploy ASP.NET Core APIs to a .NET host such as Azure App Service, Render,
   Fly.io, Railway, or a container platform.
4. Move production data from SQLite to Postgres, SQL Server, or another managed
   database before inviting real users.

## CI/CD strategy

Use these commands locally and in CI:

```bash
npm run build
npm run build:projects
npm run build:all
```

The default `npm run build` intentionally builds only the root portfolio so the
current production deployment remains stable. `build:all` is the broader check
to use before merging once independent apps are added.
