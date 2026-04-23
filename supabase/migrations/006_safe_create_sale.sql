-- ============================================================
-- Narmac Workspace — Atomic sale creation with stock check
-- Locks the product row so concurrent sales for the same product
-- serialize, preventing overselling.
-- ============================================================

create or replace function public.create_sale_safe(
  p_product_id   uuid,
  p_quantity     numeric,
  p_unit_price   numeric,
  p_payment_type text,
  p_notes        text    default null,
  p_customer_name     text default null,
  p_customer_phone    text default null,
  p_customer_address  text default null,
  p_customer_category text default null,
  p_created_by        text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_stock numeric;
  v_sale          record;
begin
  -- Lock the product row so any concurrent sale for the same product
  -- must wait until this transaction completes. This serializes stock
  -- checks and prevents two simultaneous sales from both seeing
  -- "enough stock" when combined they exceed available units.
  PERFORM id FROM public.products WHERE id = p_product_id FOR UPDATE;

  -- Calculate current stock from all recorded transactions
  SELECT coalesce(
    sum(case when type = 'IN'  then quantity else 0 end) -
    sum(case when type = 'OUT' then quantity else 0 end),
    0
  )
  INTO v_current_stock
  FROM public.stock_transactions
  WHERE product_id = p_product_id;

  -- Reject the sale if there isn't enough stock
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %',
      v_current_stock, p_quantity;
  END IF;

  -- Insert the sale row
  INSERT INTO public.sales (
    product_id, quantity, unit_price, payment_type,
    notes, customer_name, customer_phone, customer_address,
    customer_category, created_by
  )
  VALUES (
    p_product_id, p_quantity, p_unit_price, p_payment_type,
    p_notes, p_customer_name, p_customer_phone, p_customer_address,
    p_customer_category, p_created_by
  )
  RETURNING * INTO v_sale;

  -- Deduct stock
  INSERT INTO public.stock_transactions (
    product_id, type, quantity, reference_type, reference_id,
    notes, created_by
  )
  VALUES (
    p_product_id, 'OUT', p_quantity, 'sale', v_sale.id,
    'Sale #' || left(v_sale.id::text, 8),
    p_created_by
  );

  RETURN row_to_json(v_sale);
end;
$$;
