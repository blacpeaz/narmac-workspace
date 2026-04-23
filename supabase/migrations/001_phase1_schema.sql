-- ============================================================
-- Narmac Workspace — Phase 1 Schema
-- Tables: users, products, stock_transactions, audit_logs
-- ============================================================

-- 1. Users table (linked to auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Helper function: checks admin role via SECURITY DEFINER to avoid RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = auth.uid()::text and role::text = 'admin'
  );
$$;

create policy "Authenticated users can read own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  size text not null,
  unit text not null default 'kg',
  low_stock_threshold numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text references public.users(id),
  unique (type, size)
);

alter table public.products enable row level security;

create policy "Anyone authenticated can read products"
  on public.products for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert products"
  on public.products for insert
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  using (public.is_admin());

-- 3. Stock transactions table
create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  type text not null check (type in ('IN', 'OUT')),
  quantity numeric not null check (quantity > 0),
  reference_type text not null check (reference_type in ('rebaling', 'sale', 'adjustment', 'initial')),
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  created_by text references public.users(id)
);

alter table public.stock_transactions enable row level security;

create policy "Anyone authenticated can read stock_transactions"
  on public.stock_transactions for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert stock_transactions"
  on public.stock_transactions for insert
  with check (public.is_admin());

-- 4. Audit logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id),
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE')),
  module text not null,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can read audit_logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "Anyone authenticated can insert audit_logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

-- 5. Inventory view function
create or replace function public.get_inventory()
returns table (
  product_id uuid,
  product_type text,
  product_size text,
  unit text,
  low_stock_threshold numeric,
  is_active boolean,
  current_stock numeric,
  status text
)
language sql
stable
security definer
as $$
  select
    p.id as product_id,
    p.type as product_type,
    p.size as product_size,
    p.unit,
    p.low_stock_threshold,
    p.is_active,
    coalesce(
      sum(case when st.type = 'IN' then st.quantity else 0 end) -
      sum(case when st.type = 'OUT' then st.quantity else 0 end),
      0
    ) as current_stock,
    case
      when coalesce(
        sum(case when st.type = 'IN' then st.quantity else 0 end) -
        sum(case when st.type = 'OUT' then st.quantity else 0 end),
        0
      ) = 0 then 'OUT_OF_STOCK'
      when coalesce(
        sum(case when st.type = 'IN' then st.quantity else 0 end) -
        sum(case when st.type = 'OUT' then st.quantity else 0 end),
        0
      ) <= p.low_stock_threshold then 'LOW'
      else 'OK'
    end as status
  from public.products p
  left join public.stock_transactions st on st.product_id = p.id
  where p.is_active = true
  group by p.id, p.type, p.size, p.unit, p.low_stock_threshold, p.is_active
  order by p.type, p.size;
$$;

-- 6. Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'viewer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
