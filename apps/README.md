# Independent project apps

Use this folder for portfolio projects that should be able to own their own tech
stack. Each project should live in `apps/<project-slug>` and can have its own
`package.json`, lockfile if needed, framework config, tests, and build output.

## Recommended app shape

```text
apps/
  my-project/
    package.json
    README.md
    src/
```

Current independent apps include:

```text
apps/games/          browser games, starting with Klondike Solitaire
apps/habit-tracker/  habit tracking app with independent web/API deployments
```

Use a stable slug because it can become part of the public URL:

```text
/projects/my-project
```

## Connecting an app to the portfolio

Add an entry in `src/data/projects.ts` with the same slug. The central portfolio
will use that registry to render the home project listing and project detail
pages.

For static projects, the app can eventually build into a public path that the
portfolio serves. For full framework apps with their own server/runtime, deploy
them as separate Vercel projects or zones and point the registry `href` at their
public route.

## Builds

The root portfolio keeps the current Vercel-friendly command:

```bash
npm run build
```

When project apps are added, this command runs every workspace that defines a
`build` script:

```bash
npm run build:projects
```

To verify the root portfolio and all workspace apps together:

```bash
npm run build:all
```
