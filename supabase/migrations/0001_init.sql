create extension if not exists "pgcrypto";

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists tenant_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  phone_number_id text not null,
  waba_id text,
  display_phone text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null,
  role text not null default 'agent',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text,
  phone text not null,
  neighborhood text,
  service_type text,
  urgency text,
  status text not null default 'NEW',
  handoff_human boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  wa_conversation_id text,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null,
  body text not null,
  wa_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists service_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  service_type text not null,
  price_min numeric,
  price_max numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_tenant on leads(tenant_id);
create index if not exists idx_leads_phone on leads(phone);
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_conversations_tenant on conversations(tenant_id);
create index if not exists idx_conversations_last_message on conversations(last_message_at);
create index if not exists idx_messages_tenant on messages(tenant_id);
create index if not exists idx_appointments_tenant on appointments(tenant_id);

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

alter table tenants enable row level security;
alter table tenant_channels enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table appointments enable row level security;
alter table service_catalog enable row level security;

create policy "tenants_select" on tenants
  for select using (id = current_tenant_id());

create policy "tenant_channels_all" on tenant_channels
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

create policy "profiles_self" on profiles
  for select using (id = auth.uid());

create policy "profiles_update" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "leads_all" on leads
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

create policy "conversations_all" on conversations
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

create policy "messages_all" on messages
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

create policy "appointments_all" on appointments
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());

create policy "service_catalog_all" on service_catalog
  for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id());
