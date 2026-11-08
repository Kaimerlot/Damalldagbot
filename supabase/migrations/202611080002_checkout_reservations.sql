create table public.checkout_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'released')),
  expires_at timestamptz not null default now() + interval '30 minutes',
  created_at timestamptz not null default now()
);

create table public.checkout_reservation_items (
  reservation_id uuid not null references public.checkout_reservations(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unit_price_sek integer not null check (unit_price_sek > 0),
  product_name_sv text not null,
  product_name_en text not null,
  size text not null,
  colour text not null,
  primary key (reservation_id, variant_id)
);

create index checkout_reservations_expires_at_idx on public.checkout_reservations(expires_at) where status = 'reserved';
alter table public.checkout_reservations enable row level security;
alter table public.checkout_reservation_items enable row level security;

create or replace function public.reserve_checkout_cart(p_items jsonb, p_user_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reservation_id uuid := gen_random_uuid();
  requested record;
  variant_row record;
  result_items jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 50 then
    raise exception 'Cart must contain between 1 and 50 lines';
  end if;

  insert into public.checkout_reservations (id, user_id) values (reservation_id, p_user_id);
  for requested in
    select variant_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as item(variant_id uuid, quantity integer)
    group by variant_id
    order by variant_id
  loop
    if requested.quantity < 1 or requested.quantity > 10 then raise exception 'Invalid quantity'; end if;
    select pv.id, pv.product_id, pv.stock, pv.size, pv.colour, p.price_sek, p.name_sv, p.name_en
    into variant_row
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where pv.id = requested.variant_id and p.active
    for update of pv;
    if not found or variant_row.stock < requested.quantity then raise exception 'Product is unavailable or out of stock'; end if;

    update public.product_variants set stock = stock - requested.quantity where id = variant_row.id;
    insert into public.checkout_reservation_items (
      reservation_id, variant_id, quantity, unit_price_sek, product_name_sv, product_name_en, size, colour
    ) values (
      reservation_id, variant_row.id, requested.quantity, variant_row.price_sek,
      variant_row.name_sv, variant_row.name_en, variant_row.size, variant_row.colour
    );
    result_items := result_items || jsonb_build_array(jsonb_build_object(
      'variant_id', variant_row.id, 'quantity', requested.quantity, 'unit_amount', variant_row.price_sek,
      'name_sv', variant_row.name_sv, 'name_en', variant_row.name_en,
      'size', variant_row.size, 'colour', variant_row.colour
    ));
  end loop;
  return jsonb_build_object('reservation_id', reservation_id, 'items', result_items);
exception when others then
  update public.product_variants pv set stock = pv.stock + ri.quantity
  from public.checkout_reservation_items ri
  where ri.reservation_id = reservation_id and pv.id = ri.variant_id;
  delete from public.checkout_reservations where id = reservation_id;
  raise;
end;
$$;

create or replace function public.attach_checkout_session(p_reservation_id uuid, p_session_id text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.checkout_reservations set stripe_session_id = p_session_id
  where id = p_reservation_id and status = 'reserved' and stripe_session_id is null;
  if not found then raise exception 'Reservation not found'; end if;
end;
$$;

create or replace function public.release_checkout_reservation(p_reservation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reservation_row public.checkout_reservations%rowtype;
begin
  select * into reservation_row from public.checkout_reservations where id = p_reservation_id for update;
  if not found or reservation_row.status <> 'reserved' then return; end if;
  update public.product_variants pv set stock = pv.stock + ri.quantity
  from public.checkout_reservation_items ri
  where ri.reservation_id = p_reservation_id and pv.id = ri.variant_id;
  update public.checkout_reservations set status = 'released' where id = p_reservation_id;
end;
$$;

create or replace function public.process_stripe_checkout_event(
  p_event_id text, p_event_type text, p_reservation_id uuid, p_session_id text,
  p_user_id uuid, p_total_sek integer, p_shipping_address jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reservation_row public.checkout_reservations%rowtype;
  new_order_id uuid;
begin
  insert into public.stripe_events (id, event_type) values (p_event_id, p_event_type)
  on conflict (id) do nothing;
  if not found then return false; end if;

  select * into reservation_row from public.checkout_reservations
  where id = p_reservation_id and stripe_session_id = p_session_id for update;
  if not found then raise exception 'Checkout reservation not found'; end if;

  if p_event_type = 'checkout.session.completed' then
    if reservation_row.status <> 'reserved' then return false; end if;
    insert into public.orders (user_id, stripe_session_id, status, total_sek, shipping_address)
    values (p_user_id, p_session_id, 'paid', p_total_sek, coalesce(p_shipping_address, '{}'::jsonb))
    returning id into new_order_id;
    insert into public.order_items (order_id, variant_id, quantity, unit_price_sek)
    select new_order_id, variant_id, quantity, unit_price_sek
    from public.checkout_reservation_items where reservation_id = p_reservation_id;
    update public.checkout_reservations set status = 'completed' where id = p_reservation_id;
  elsif p_event_type in ('checkout.session.expired', 'checkout.session.async_payment_failed') then
    if reservation_row.status = 'reserved' then
      update public.product_variants pv set stock = pv.stock + ri.quantity
      from public.checkout_reservation_items ri
      where ri.reservation_id = p_reservation_id and pv.id = ri.variant_id;
      update public.checkout_reservations set status = 'released' where id = p_reservation_id;
    end if;
  end if;
  return true;
end;
$$;

revoke all on function public.reserve_checkout_cart(jsonb, uuid) from public, anon, authenticated;
revoke all on function public.attach_checkout_session(uuid, text) from public, anon, authenticated;
revoke all on function public.release_checkout_reservation(uuid) from public, anon, authenticated;
revoke all on function public.process_stripe_checkout_event(text, text, uuid, text, uuid, integer, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_checkout_cart(jsonb, uuid) to service_role;
grant execute on function public.attach_checkout_session(uuid, text) to service_role;
grant execute on function public.release_checkout_reservation(uuid) to service_role;
grant execute on function public.process_stripe_checkout_event(text, text, uuid, text, uuid, integer, jsonb) to service_role;

revoke all on function public.start_quiz(text, text) from public;
revoke all on function public.submit_answer(uuid, uuid, integer, integer, boolean) from public;
revoke all on function public.finish_quiz(uuid) from public;
revoke all on function public.is_admin() from public;
grant execute on function public.start_quiz(text, text) to anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer, integer, boolean) to anon, authenticated;
grant execute on function public.finish_quiz(uuid) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;