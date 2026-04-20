-- ============================================================
-- Narmac Workspace — Add optional customer info to sales
-- ============================================================

alter table public.sales
  add column customer_name text,
  add column customer_phone text,
  add column customer_address text;
