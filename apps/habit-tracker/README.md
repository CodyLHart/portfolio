# Habit Tracker

A portfolio app for tracking habits with variable targets, units, calendar
analytics, C# API code, SQLite persistence, and Google sign-in.

## Structure

```text
apps/habit-tracker/
  api/  ASP.NET Core Web API, EF Core, SQLite, Google auth
  web/  Vite, React, TypeScript
```

## Local development

Start the API:

```bash
cd apps/habit-tracker/api
dotnet run
```

Start the frontend:

```bash
cd apps/habit-tracker/web
npm run dev
```

Open the frontend at:

```text
http://127.0.0.1:5173
```

Use `127.0.0.1`, not `localhost`, so the browser sends the API auth cookie
back through the Vite proxy during local development.

If your local portfolio shell is not running on `http://127.0.0.1:3000`, set the
habit tracker web app's back-link URL before starting Vite:

```bash
VITE_PORTFOLIO_URL=http://127.0.0.1:3001 npm run dev
```

The Vite dev server proxies `/api`, `/auth`, and `/signin-google` requests to
the API on `http://127.0.0.1:5087`.

## Google OAuth

Create OAuth credentials in Google Cloud Console and configure:

```bash
dotnet user-secrets set "Authentication:Google:ClientId" "<client-id>"
dotnet user-secrets set "Authentication:Google:ClientSecret" "<client-secret>"
```

Use this redirect URI for local development:

```text
http://127.0.0.1:5087/signin-google
```

Google requires an exact match. `localhost` and `127.0.0.1` are different
origins, so add the URI above exactly as written.
