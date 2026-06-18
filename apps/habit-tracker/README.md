# Habit Tracker

A portfolio app for tracking habits with variable targets, units, calendar
analytics, C# API code, local SQLite persistence, production PostgreSQL support,
and Google sign-in.

## Structure

```text
apps/habit-tracker/
  api/  ASP.NET Core Web API, EF Core, SQLite/PostgreSQL, Google auth
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

If your local API is running somewhere else, override the proxy target:

```bash
VITE_DEV_API_PROXY_TARGET=http://127.0.0.1:5090 npm run dev
```

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

## Production configuration

### Render API service

Create a Render Web Service from this repository with:

```text
Root Directory: apps/habit-tracker/api
Language: Docker
Dockerfile Path: Dockerfile
```

The web app supports these environment variables:

```bash
VITE_API_BASE_URL=https://habit-api.example.com
VITE_HABIT_TRACKER_URL=https://habit-tracker.example.com
VITE_PORTFOLIO_URL=https://portfolio.example.com
```

The API supports these configuration values:

```bash
Database__Provider=Postgres
ConnectionStrings__HabitTracker=<production-database-connection-string>
Authentication__Google__ClientId=<google-oauth-client-id>
Authentication__Google__ClientSecret=<google-oauth-client-secret>
Client__WebUrl=https://habit-tracker.example.com
Client__AllowedOrigins__0=https://habit-tracker.example.com
```

Use a managed PostgreSQL connection string for production. The API runs EF Core
migrations automatically when `Database__Provider` is set to `Postgres`; local
SQLite development still uses `EnsureCreated` so the existing local database can
keep working.

For production Google OAuth, add this redirect URI:

```text
https://habit-api.example.com/signin-google
```

The production API cookie uses `SameSite=None` and `Secure`, so the API must be
served over HTTPS when the frontend and backend are on separate origins.
