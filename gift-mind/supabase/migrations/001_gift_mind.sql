-- GiftMind: server-side chat memory (service role from API routes only).
-- Run in Supabase SQL Editor or: supabase db push

create table if not exists gift_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  recipient text not null default '',
  occasion text not null default '',
  compass_selections jsonb,
  last_direction jsonb,
  where_to_look jsonb,
  parent_session_id uuid references gift_sessions (id) on delete set null
);

create table if not exists gift_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references gift_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  hidden boolean not null default false,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create index if not exists gift_messages_session_sort
  on gift_messages (session_id, sort_order);

comment on table gift_sessions is 'Anonymous GiftMind journeys; scoped by unguessable UUID.';
comment on table gift_messages is 'Ordered transcript including hidden go-deeper context.';
