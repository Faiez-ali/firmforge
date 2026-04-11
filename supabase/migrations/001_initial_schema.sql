-- FirmForge — Initial Database Schema
-- Run this in Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users / profiles (extends Supabase auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'team')),
  generations_today integer not null default 0,
  credits     integer not null default 0,
  referral_code text unique default substring(md5(random()::text), 1, 8),
  referred_by uuid references public.profiles(id),
  paddle_customer_id text,
  github_access_token text,
  created_at  timestamptz not null default now()
);

-- Projects
create table public.projects (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete set null,
  spec          jsonb not null,
  bom           jsonb,
  status        text not null default 'generating' check (status in ('draft', 'generating', 'complete', 'failed')),
  output_url    text,       -- Cloudflare R2 zip URL
  github_url    text,       -- Pro: pushed repo URL
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- Generation log (anonymous feedback loop)
create table public.generation_events (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid references public.projects(id) on delete cascade,
  mcu           text,
  component     text,
  library_used  text,
  library_url   text,
  success       boolean not null default true,
  created_at    timestamptz not null default now()
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.projects enable row level security;

-- Users can only read/update their own profile
create policy "users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Users can view and create their own projects
create policy "users can view own projects"
  on public.projects for select using (auth.uid() = user_id);

create policy "users can insert own projects"
  on public.projects for insert with check (auth.uid() = user_id);

-- Function: reset daily generation count (called by cron — schedule: daily at 00:00 UTC)
create or replace function reset_daily_generations()
returns void language sql as $$
  update public.profiles set generations_today = 0;
$$;

-- Function: auto-create profile on user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
