create extension if not exists pgcrypto;

create type public.friendship_status as enum ('pending', 'accepted', 'blocked');
create type public.list_role as enum ('owner', 'editor', 'viewer');
create type public.item_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.notification_type as enum ('friend_request', 'list_invite', 'role_change');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  sort_mode text not null default 'manual',
  item_fields jsonb not null default '{"quantity":true,"category":true,"dueDate":true,"priority":true,"assignee":true,"notes":true}'::jsonb,
  share_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lists
  add column if not exists item_fields jsonb not null default '{"quantity":true,"category":true,"dueDate":true,"priority":true,"assignee":true,"notes":true}'::jsonb;

create table if not exists public.list_collaborators (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.list_role not null default 'viewer',
  status text not null default 'accepted',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint list_collaborators_unique_user unique (list_id, user_id)
);

create table if not exists public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  quantity text,
  notes text,
  due_date date,
  priority public.item_priority,
  category text,
  completed boolean not null default false,
  position numeric not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_item_suggestions (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null,
  category text,
  usage_count integer not null default 1,
  last_used_at timestamptz not null default now(),
  constraint list_item_suggestions_unique_title unique (list_id, title)
);

create table if not exists public.list_snapshots (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  label text not null,
  items jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.lists enable row level security;
alter table public.list_collaborators enable row level security;
alter table public.list_items enable row level security;
alter table public.list_item_suggestions enable row level security;
alter table public.list_snapshots enable row level security;
alter table public.notifications enable row level security;

create or replace function public.is_list_member(target_list_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.list_collaborators
    where list_id = target_list_id
      and user_id = auth.uid()
      and status = 'accepted'
  ) or exists (
    select 1
    from public.lists
    where id = target_list_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.list_role_for(target_list_id uuid)
returns public.list_role
language sql
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.lists
      where id = target_list_id and owner_id = auth.uid()
    ) then 'owner'::public.list_role
    else (
      select role
      from public.list_collaborators
      where list_id = target_list_id
        and user_id = auth.uid()
        and status = 'accepted'
      limit 1
    )
  end;
$$;

create policy "profiles can read authenticated profiles"
on public.profiles for select
to authenticated
using (true);

create policy "profiles can upsert themselves"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles can update themselves"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "friends can see their friendships"
on public.friendships for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "users can request friendships"
on public.friendships for insert
to authenticated
with check (requester_id = auth.uid());

create policy "friend request recipients can accept"
on public.friendships for update
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid())
with check (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "members can read lists"
on public.lists for select
to authenticated
using (owner_id = auth.uid() or public.is_list_member(id));

create policy "users can create lists"
on public.lists for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owners and editors can update lists"
on public.lists for update
to authenticated
using (owner_id = auth.uid() or public.list_role_for(id) in ('owner', 'editor'))
with check (owner_id = auth.uid() or public.list_role_for(id) in ('owner', 'editor'));

create policy "owners can delete lists"
on public.lists for delete
to authenticated
using (owner_id = auth.uid());

create policy "members can read collaborators"
on public.list_collaborators for select
to authenticated
using (public.is_list_member(list_id) or user_id = auth.uid());

create policy "owners can manage collaborators"
on public.list_collaborators for all
to authenticated
using (public.list_role_for(list_id) = 'owner')
with check (public.list_role_for(list_id) = 'owner');

create policy "invitees can accept collaborator invites"
on public.list_collaborators for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can read items"
on public.list_items for select
to authenticated
using (public.is_list_member(list_id));

create policy "owners and editors can write items"
on public.list_items for all
to authenticated
using (public.list_role_for(list_id) in ('owner', 'editor'))
with check (public.list_role_for(list_id) in ('owner', 'editor'));

create policy "members can read suggestions"
on public.list_item_suggestions for select
to authenticated
using (public.is_list_member(list_id));

create policy "owners and editors can write suggestions"
on public.list_item_suggestions for all
to authenticated
using (public.list_role_for(list_id) in ('owner', 'editor'))
with check (public.list_role_for(list_id) in ('owner', 'editor'));

create policy "members can read snapshots"
on public.list_snapshots for select
to authenticated
using (public.is_list_member(list_id));

create policy "owners can write snapshots"
on public.list_snapshots for all
to authenticated
using (public.list_role_for(list_id) = 'owner')
with check (public.list_role_for(list_id) = 'owner');

create policy "users can read their notifications"
on public.notifications for select
to authenticated
using (recipient_id = auth.uid());

create policy "users can create notifications"
on public.notifications for insert
to authenticated
with check (actor_id = auth.uid() or actor_id is null);

create policy "users can update their notifications"
on public.notifications for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create or replace function public.accept_share_link(token text, requested_role public.list_role)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_list public.lists;
  accepted_role public.list_role;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  accepted_role := case
    when requested_role = 'editor' then 'editor'::public.list_role
    else 'viewer'::public.list_role
  end;

  select *
  into target_list
  from public.lists
  where share_token = token
  limit 1;

  if target_list.id is null then
    raise exception 'Share link not found';
  end if;

  insert into public.list_collaborators (invited_by, list_id, role, status, user_id)
  values (target_list.owner_id, target_list.id, accepted_role, 'accepted', auth.uid())
  on conflict (list_id, user_id)
  do update set
    role = excluded.role,
    status = 'accepted',
    updated_at = now();

  return target_list.id;
end;
$$;

grant execute on function public.accept_share_link(text, public.list_role) to authenticated;
