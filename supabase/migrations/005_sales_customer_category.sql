-- ============================================================
-- Narmac Workspace — Add customer category to sales
-- ============================================================

alter table public.sales
  add column customer_category text
    check (customer_category in ('Bales', 'Household items'));
