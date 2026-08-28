create extension if not exists pgcrypto;

create table if not exists public.lorries (
  id uuid primary key default gen_random_uuid(),
  lorry_code text not null unique,
  registration text not null unique,
  driver text not null,
  type text not null,
  status text not null check (status in ('AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE')),
  current_location text,
  destination text,
  cargo text,
  capacity_weight numeric not null check (capacity_weight > 0),
  capacity_volume numeric not null check (capacity_volume > 0),
  fuel_efficiency numeric not null check (fuel_efficiency > 0),
  fuel numeric check (fuel between 0 and 100),
  utilization numeric check (utilization between 0 and 100),
  rfid_tag text unique,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id text primary key,
  customer text not null,
  origin text not null,
  destination text not null,
  origin_lat double precision,
  origin_lon double precision,
  destination_lat double precision,
  destination_lon double precision,
  weight numeric not null check (weight > 0),
  volume numeric not null check (volume > 0),
  priority text not null check (priority in ('Critical', 'High', 'Normal')),
  deadline timestamptz not null,
  status text not null,
  lorry_id uuid references public.lorries(id),
  value numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.rfid_events (
  id uuid primary key default gen_random_uuid(),
  lorry_id uuid not null references public.lorries(id),
  rfid_tag text not null,
  gate text not null check (gate in ('main', 'service')),
  status text not null,
  scanned_at timestamptz not null default now()
);

alter table public.rfid_events add column if not exists reader_id text;

create table if not exists public.optimization_runs (
  id uuid primary key default gen_random_uuid(),
  score numeric,
  distance_saved numeric,
  cost_saved numeric,
  loads jsonb not null default '[]'::jsonb,
  rejected jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.lorries add column if not exists lorry_code text;
update public.lorries set lorry_code = 'LRY-' || right(replace(id::text, '-', ''), 6) where lorry_code is null;
create unique index if not exists lorries_lorry_code_idx on public.lorries(lorry_code);
alter table public.lorries alter column lorry_code set not null;

alter table public.lorries add column if not exists registration text;
alter table public.lorries add column if not exists driver text;
alter table public.lorries add column if not exists type text;
alter table public.lorries add column if not exists status text;
alter table public.lorries add column if not exists current_location text;
alter table public.lorries add column if not exists destination text;
alter table public.lorries add column if not exists cargo text;
alter table public.lorries add column if not exists capacity_weight numeric;
alter table public.lorries add column if not exists capacity_volume numeric;
alter table public.lorries add column if not exists latitude double precision;
alter table public.lorries add column if not exists longitude double precision;
alter table public.lorries add column if not exists updated_at timestamptz;
alter table public.lorries add column if not exists name text;
alter table public.lorries add column if not exists max_weight numeric;
alter table public.lorries add column if not exists max_volume numeric;
alter table public.lorries add column if not exists driver_status text;
alter table public.lorries add column if not exists current_lat double precision;
alter table public.lorries add column if not exists current_lon double precision;
alter table public.lorries add column if not exists last_updated timestamptz;
update public.lorries set status = driver_status where status is null and driver_status is not null;
update public.lorries set capacity_weight = max_weight / 1000 where capacity_weight is null and max_weight is not null;
update public.lorries set capacity_volume = max_volume where capacity_volume is null and max_volume is not null;
update public.lorries set latitude = current_lat, longitude = current_lon where latitude is null and current_lat is not null;
update public.lorries set updated_at = last_updated where updated_at is null and last_updated is not null;

alter table public.shipments add column if not exists deadline timestamptz;
alter table public.shipments add column if not exists origin_lat double precision;
alter table public.shipments add column if not exists origin_lon double precision;
alter table public.shipments add column if not exists destination_lat double precision;
alter table public.shipments add column if not exists destination_lon double precision;
alter table public.shipments add column if not exists lorry_id uuid;
alter table public.shipments add column if not exists assigned_lorry_id text;
update public.shipments as shipment
set lorry_id = lorry.id
from public.lorries as lorry
where shipment.lorry_id is null
  and shipment.assigned_lorry_id = lorry.id::text;
create index if not exists shipments_deadline_idx on public.shipments(deadline);
create index if not exists rfid_events_scanned_at_idx on public.rfid_events(scanned_at desc);

alter table public.rfid_events drop constraint if exists rfid_events_lorry_id_fkey;
alter table public.rfid_events alter column lorry_id type uuid using lorry_id::uuid;
alter table public.rfid_events add constraint rfid_events_lorry_id_fkey foreign key (lorry_id) references public.lorries(id);
