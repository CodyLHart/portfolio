# List App

A collaborative full-stack list app built with Next.js, React, Supabase
Postgres, Google auth, and Supabase Realtime.

## Features

- Google sign-in through Supabase Auth
- Exact-email friend requests with in-app notifications
- List owners, editors, and viewers
- Collaborators and share-link tokens with role presets
- Realtime list and item updates
- Optional item quantity, notes, due date, priority, category, and assignee
- Checked items move to the bottom until removed
- Manual ordering and category grouping
- Remove completed and clear all actions
- Restorable list snapshots
- Autocomplete suggestions scoped to the current list's history

## Local Development

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Enable Google auth in Supabase Auth providers.
4. Copy `.env.example` to `.env.local` and fill in the project values.

```bash
npm run dev
```

## Build

```bash
npm run build
```
