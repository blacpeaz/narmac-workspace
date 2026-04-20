-- ============================================================
-- Narmac Workspace — Phase 2: Sales + Expenses
-- Tables: sales, expenses
-- ============================================================

-- 1. Sales table
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  total numeric not null generated always as (quantity * unit_price) stored,
  payment_type text not null check (payment_type in ('cash', 'transfer', 'credit')),
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

alter table public.sales enable row level security;

create policy "Anyone authenticated can read sales"
  on public.sales for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert sales"
  on public.sales for insert
  with check (public.is_admin());

create policy "Admins can update sales"
  on public.sales for update
  using (public.is_admin());

-- 2. Expenses table
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('fuel', 'labor', 'transport', 'maintenance', 'utilities', 'other')),
  amount numeric not null check (amount > 0),
  description text,
  created_at timestamptz not null default now(),
  created_by uuid references public.users(id)
);

alter table public.expenses enable row level security;

create policy "Anyone authenticated can read expenses"
  on public.expenses for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert expenses"
  on public.expenses for insert
  with check (public.is_admin());

create policy "Admins can update expenses"
  on public.expenses for update
  using (public.is_admin());
