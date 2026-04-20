-- ============================================================
-- Narmac Workspace — Flexible Products
-- New: product_categories table
-- Alter: products (add category_id, make size nullable, unit options)
-- ============================================================

-- 1. Product categories table
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;

create policy "Anyone authenticated can read categories"
  on public.product_categories for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert categories"
  on public.product_categories for insert
  with check (public.is_admin());

create policy "Admins can update categories"
  on public.product_categories for update
  using (public.is_admin());

create policy "Admins can delete categories"
  on public.product_categories for delete
  using (public.is_admin());

-- Seed default categories
insert into public.product_categories (name) values
  ('General'),
  ('Bulk Materials'),
  ('Appliances'),
  ('Accessories');

-- 2. Expense categories table
create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

create policy "Anyone authenticated can read expense categories"
  on public.expense_categories for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert expense categories"
  on public.expense_categories for insert
  with check (public.is_admin());

create policy "Admins can delete expense categories"
  on public.expense_categories for delete
  using (public.is_admin());

-- Seed default expense categories
insert into public.expense_categories (name) values
  ('Fuel'),
  ('Labor'),
  ('Transport'),
  ('Maintenance'),
  ('Utilities'),
  ('Other');

-- Drop the check constraint on expenses.category so it accepts any text
alter table public.expenses drop constraint if exists expenses_category_check;

-- 3. Alter products table
-- Add category_id column
alter table public.products
  add column category_id uuid references public.product_categories(id) on delete set null;

-- Make size nullable
alter table public.products
  alter column size drop not null;

-- Drop old unique constraint and add new one
alter table public.products
  drop constraint if exists products_type_size_key;

create unique index products_type_size_unique
  on public.products (type, coalesce(size, ''));
