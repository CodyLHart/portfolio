# List App

A collaborative full-stack list app built with Next.js, React, Supabase
Postgres, Google auth, and Supabase Realtime.

## Features

- Google sign-in through Supabase Auth
- Exact-email friend requests with in-app notifications
- Friends screen for accepted connections and shared lists
- List owners, editors, and viewers
- Collaborators and share-link tokens with role presets
- Realtime list and item updates
- Optional item quantity, notes, due date, priority, category, and assignee
- Checked items move to the bottom until removed
- Manual ordering and category grouping
- Remove completed and clear all actions
- Restorable list snapshots
- Autocomplete suggestions scoped to the current list's history

## Friends Model

Friends are derived from accepted shared-list access. Another user appears in
Friends when they share at least one active list with the signed-in user through
accepted `list_collaborators` membership. Pending or revoked list invitations do
not count, and users disappear when the final shared list is removed.

The app does not use a separate friendship-request system as the source of truth
for Friends. It only derives Friends from lists the current user can already
access through Supabase row-level security.

Friends uses dedicated routes in the authenticated List App shell. These routes
share the signed-in header and account menu, but they do not mount the list
workspace sidebar, selected-list pane, or list-index loading state.

- `/friends`: shared users with shared-list counts.
- `/friends/[friendId]`: lists shared with that person, owner-first participant lists, and roles.
- Shared-list rows return to the existing list detail experience.

The same derivation is exposed through authenticated API routes:

- `/api/friends`
- `/api/friends/[friendId]`

Known limitation: shared-list rows intentionally do not show item counts because
the app avoids loading every list's items for the Friends index/detail screens.

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
