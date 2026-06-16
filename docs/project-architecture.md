# Portfolio project architecture

This repository is now organized as a portfolio shell plus independent project
workspaces.

## Current deployment

The root Next.js app remains the deployable portfolio site. That keeps the
existing GitHub-to-Vercel setup intact: Vercel can continue running the root
`npm run build` command when changes are pushed.

## Future project apps

Place standalone applications in `apps/<slug>`. Each app can choose its own
framework, dependencies, and scripts. Register public-facing projects in
`src/data/projects.ts` so the central site can list them at `/projects` and show
details at `/projects/<slug>`.

## URL strategy

Use portfolio-owned pages for project descriptions:

```text
/projects
/projects/<slug>
```

When a project is ready to run as its own app, link its registry `href` to the
running experience. Static apps can be served from the portfolio if they build
to files. Server-backed or framework-specific apps should be deployed as their
own Vercel project or zone and routed from the portfolio.

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
