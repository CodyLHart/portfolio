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

## Architecture

The app follows a feature-based structure while keeping the existing routes and
behavior intact.

- `src/app`: route entries, the thin client app composer, route tests, and
  app-wide CSS tokens/shared primitives.
- `src/app/friends`: dedicated Friends routes that render in the authenticated
  shell without mounting the list workspace sidebar.
- `src/app/api/friends`: authenticated API routes for Friends summaries and
  detail data.
- `src/features/app`: authenticated route state, browser history, mobile detail
  navigation, shared-list route handoff helpers, and app-wide status message
  state.
- `src/components/layout`: reusable shell pieces such as the authenticated
  header and account menu.
- `src/components/ui`: shared leaf UI such as avatars and persistent loading
  spinners, plus the Font Awesome icon wrapper.
- `src/features/landing`: the signed-out landing experience and its colocated
  CSS Module.
- `src/features/profile`: auth API helpers, local/prod OAuth redirect handling,
  auth session lifecycle, and signed-in profile hydration.
- `src/features/realtime`: Supabase Realtime subscriptions for account inbox,
  list detail, collaborator changes, list refreshes, and presence.
- `src/features/notifications`: notification menu UI, notification rows,
  account inbox API helpers, notification action controller, and
  notification-label utilities.
- `src/features/friends`: Friends page UI, shared-list rows, participant lists,
  Friends controller hooks, client API helpers, and Friends domain derivation.
- `src/features/lists`: the signed-in list workspace, list navigation, selected
  list detail, item entry, item rows, drag/drop zones, list-related modals,
  list creation, list ordering, list/item/history/settings controllers, feature
  API helpers, list-specific types, and pure list utilities.
- `src/features/sharing`: collaborator invitation, friend request, collaborator
  role update, and share-link URL acceptance controllers.
- `src/lib`: Supabase client setup, shared types, formatting helpers, error
  helpers, and server query helpers.

CSS that belongs to standalone components is colocated in `.module.css` files.
`globals.css` remains for app-wide tokens, base elements, shared button/form
primitives, and layout utilities shared across feature surfaces.

The List App uses the free Font Awesome webfont package for interface icons.
The root layout imports `@fortawesome/fontawesome-free/css/all.min.css` once,
and icons render with class names such as `fa-solid fa-trash`, usually through
the shared `AppIcon` wrapper. Decorative icons remain `aria-hidden`, while
icon-only controls keep clear button `aria-label`s. This intentionally favors a
simple class-based setup over per-icon React imports; Pro icons, kits, and CDN
usage are not required.

`src/app/ListApp.tsx` is intentionally kept as a top-level composer. It owns the
remaining cross-feature state needed to connect Lists, Friends, profile,
realtime, and routing, while feature hooks own mutation/action orchestration.
Share-link acceptance lives in `src/features/sharing`, and notification actions
live in `src/features/notifications`.

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
