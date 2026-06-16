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

The Vite dev server proxies `/api`, `/auth`, and `/signin-google` requests to
the API on `http://localhost:5087`.

## Google OAuth

Create OAuth credentials in Google Cloud Console and configure:

```bash
dotnet user-secrets set "Authentication:Google:ClientId" "<client-id>"
dotnet user-secrets set "Authentication:Google:ClientSecret" "<client-secret>"
```

Use this redirect URI for local development:

```text
http://localhost:5087/signin-google
```
