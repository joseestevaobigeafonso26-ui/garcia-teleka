-- Garcia Pedro Teleka — LOJA (carrinho, pedidos, pagamentos, entregas, stock, livros digitais)
-- Execute DEPOIS de schema.sql. Pode ser executado de novo sem perder dados.

-- ========== LIVROS: formato, preço digital, ficheiro, stock ==========
alter table public.books
  add column if not exists book_type text not null default 'physical',
  add column if not exists digital_price_kz integer,
  add column if not exists digital_path text,
  add column if not exists track_stock boolean not null default false,
  add column if not exists stock integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'books_book_type_check') then
    alter table public.books add constraint books_book_type_check
      check (book_type in ('physical','digital','both'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'books_stock_check') then
    alter table public.books add constraint books_stock_check check (stock >= 0);
  end if;
end $$;

-- ========== DEFINIÇÕES DA LOJA ==========
alter table public.site_settings
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists pickup_info text not null default 'Levantamento combinado com o autor pelo WhatsApp.',
  add column if not exists delivery_enabled boolean not null default true;

-- ========== FORMAS DE PAGAMENTO ==========
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'other' check (kind in ('bank_transfer','multicaixa_express','cash','other')),
  label text not null,
  details text not null default '',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ========== ZONAS DE ENTREGA ==========
create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_kz integer not null default 0 check (fee_kz >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ========== PEDIDOS ==========
create sequence if not exists public.order_seq start 1;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_method text not null check (delivery_method in ('pickup','delivery','digital')),
  zone_id uuid references public.delivery_zones(id) on delete set null,
  zone_name text,
  delivery_fee integer not null default 0,
  address text,
  notes text,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  payment_label text,
  subtotal integer not null,
  total integer not null,
  status text not null default 'new' check (status in ('new','paid','preparing','delivered','cancelled')),
  proof_path text,
  admin_notes text,
  stock_deducted boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  title text not null,
  format text not null check (format in ('physical','digital')),
  unit_price integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- ========== SEGURANÇA (RLS) ==========
alter table public.payment_methods enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Formas de pagamento e zonas: leitura pública (aparecem no checkout), escrita só admin
do $$
declare t text;
begin
  foreach t in array array['payment_methods','delivery_zones']
  loop
    execute format('drop policy if exists "leitura publica" on public.%I', t);
    execute format('create policy "leitura publica" on public.%I for select using (true)', t);
    execute format('drop policy if exists "escrita admin" on public.%I', t);
    execute format('create policy "escrita admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Pedidos: ninguém lê/escreve diretamente, exceto o admin.
-- Os clientes usam as funções abaixo (com código + telefone).
drop policy if exists "pedidos admin" on public.orders;
create policy "pedidos admin" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "itens admin" on public.order_items;
create policy "itens admin" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== FUNÇÃO: criar pedido (convidado, sem conta) ==========
create or replace function public.create_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p->>'name', ''));
  v_phone text := regexp_replace(coalesce(p->>'phone', ''), '[^0-9]', '', 'g');
  v_email text := nullif(btrim(coalesce(p->>'email', '')), '');
  v_method text := coalesce(p->>'delivery_method', '');
  v_address text := nullif(btrim(coalesce(p->>'address', '')), '');
  v_notes text := nullif(btrim(coalesce(p->>'notes', '')), '');
  v_zone public.delivery_zones;
  v_pay public.payment_methods;
  v_settings public.site_settings;
  v_book public.books;
  v_item jsonb;
  v_qty int;
  v_format text;
  v_price int;
  v_subtotal int := 0;
  v_fee int := 0;
  v_has_physical boolean := false;
  v_deduct boolean := false;
  v_lines jsonb := '[]'::jsonb;
  v_order_id uuid := gen_random_uuid();
  v_code text;
begin
  -- anti-spam: campo escondido tem de vir vazio
  if coalesce(p->>'hp', '') <> '' then
    raise exception 'Pedido inválido.';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Indique o seu nome.';
  end if;
  if char_length(v_phone) < 9 or char_length(v_phone) > 15 then
    raise exception 'Indique um número de telefone válido.';
  end if;
  if v_email is not null and (char_length(v_email) > 160 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Email inválido.';
  end if;
  if v_address is not null and char_length(v_address) > 300 then
    raise exception 'Morada demasiado longa.';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'Observações demasiado longas.';
  end if;
  if jsonb_typeof(p->'items') is distinct from 'array'
     or jsonb_array_length(p->'items') = 0
     or jsonb_array_length(p->'items') > 30 then
    raise exception 'O carrinho está vazio.';
  end if;

  select * into v_settings from public.site_settings where id = 1;

  -- 1) validar itens com os dados REAIS da base de dados (o preço nunca vem do cliente)
  for v_item in select * from jsonb_array_elements(p->'items') loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    v_format := coalesce(v_item->>'format', 'physical');
    if v_qty < 1 or v_qty > 20 then
      raise exception 'Quantidade inválida.';
    end if;

    select * into v_book from public.books where id = (v_item->>'book_id')::uuid for update;
    if not found then
      raise exception 'Um dos livros já não está disponível.';
    end if;

    if v_format = 'digital' then
      if v_book.book_type = 'physical' then
        raise exception 'O livro "%" não tem versão digital.', v_book.title;
      end if;
      v_qty := 1;
      v_price := coalesce(nullif(v_book.digital_price_kz, 0), v_book.price_kz);
    else
      v_format := 'physical';
      if v_book.book_type = 'digital' then
        raise exception 'O livro "%" só existe em versão digital.', v_book.title;
      end if;
      v_has_physical := true;
      v_price := v_book.price_kz;
      if v_book.track_stock and v_book.stock < v_qty then
        if v_book.stock <= 0 then
          raise exception 'O livro "%" está esgotado.', v_book.title;
        end if;
        raise exception 'Stock insuficiente para "%". Disponível: %.', v_book.title, v_book.stock;
      end if;
    end if;

    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'book_id', v_book.id,
      'title', v_book.title,
      'format', v_format,
      'price', v_price,
      'qty', v_qty,
      'track', (v_format = 'physical' and v_book.track_stock)
    ));
  end loop;

  -- 2) entrega
  if v_has_physical then
    if v_method = 'pickup' then
      if not v_settings.pickup_enabled then
        raise exception 'O levantamento no local não está disponível.';
      end if;
    elsif v_method = 'delivery' then
      if not v_settings.delivery_enabled then
        raise exception 'As entregas não estão disponíveis de momento.';
      end if;
      select * into v_zone from public.delivery_zones
        where id = nullif(p->>'zone_id', '')::uuid and is_active;
      if not found then
        raise exception 'Escolha uma zona de entrega.';
      end if;
      if v_address is null then
        raise exception 'Indique a morada de entrega.';
      end if;
      v_fee := v_zone.fee_kz;
    else
      raise exception 'Escolha levantamento ou entrega.';
    end if;
  else
    v_method := 'digital';
  end if;

  -- 3) pagamento
  select * into v_pay from public.payment_methods
    where id = nullif(p->>'payment_method_id', '')::uuid and is_active;
  if not found then
    raise exception 'Escolha uma forma de pagamento.';
  end if;
  if v_pay.kind = 'cash' and not v_has_physical then
    raise exception 'Esta forma de pagamento só serve para livros físicos.';
  end if;

  -- 4) gravar
  v_code := 'GPT-' || lpad(nextval('public.order_seq')::text, 4, '0');

  insert into public.orders (
    id, code, customer_name, customer_phone, customer_email, delivery_method,
    zone_id, zone_name, delivery_fee, address, notes,
    payment_method_id, payment_label, subtotal, total
  ) values (
    v_order_id, v_code, v_name, v_phone, v_email, v_method,
    case when v_method = 'delivery' then v_zone.id end,
    case when v_method = 'delivery' then v_zone.name end,
    v_fee,
    case when v_method = 'delivery' then v_address end,
    v_notes,
    v_pay.id, v_pay.label, v_subtotal, v_subtotal + v_fee
  );

  for v_item in select * from jsonb_array_elements(v_lines) loop
    insert into public.order_items (order_id, book_id, title, format, unit_price, quantity)
    values (
      v_order_id,
      (v_item->>'book_id')::uuid,
      v_item->>'title',
      v_item->>'format',
      (v_item->>'price')::int,
      (v_item->>'qty')::int
    );

    if (v_item->>'track')::boolean then
      update public.books
        set stock = stock - (v_item->>'qty')::int
        where id = (v_item->>'book_id')::uuid
          and stock >= (v_item->>'qty')::int;
      if not found then
        raise exception 'Stock insuficiente para "%".', v_item->>'title';
      end if;
      v_deduct := true;
    end if;
  end loop;

  update public.orders set stock_deducted = v_deduct where id = v_order_id;

  return jsonb_build_object('code', v_code, 'total', v_subtotal + v_fee);
end;
$$;

-- ========== FUNÇÃO: consultar pedido (código + telefone) ==========
create or replace function public.get_order(p_code text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  o public.orders;
  pk text;
  pd text;
  digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if char_length(digits) < 9 then
    return null;
  end if;

  select * into o from public.orders where code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return null;
  end if;
  if right(regexp_replace(o.customer_phone, '[^0-9]', '', 'g'), 9) <> right(digits, 9) then
    return null;
  end if;

  select kind, details into pk, pd from public.payment_methods where id = o.payment_method_id;

  return jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'customer_name', o.customer_name,
    'delivery_method', o.delivery_method,
    'zone_name', o.zone_name,
    'delivery_fee', o.delivery_fee,
    'address', o.address,
    'subtotal', o.subtotal,
    'total', o.total,
    'payment_label', o.payment_label,
    'payment_kind', pk,
    'payment_details', pd,
    'has_proof', o.proof_path is not null,
    'created_at', o.created_at,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'book_id', i.book_id,
        'title', i.title,
        'format', i.format,
        'unit_price', i.unit_price,
        'qty', i.quantity
      ) order by i.title), '[]'::jsonb)
      from public.order_items i where i.order_id = o.id
    )
  );
end;
$$;

-- ========== FUNÇÃO: anexar comprovativo ==========
create or replace function public.attach_proof(p_code text, p_phone text, p_path text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if char_length(digits) < 9 then
    return false;
  end if;
  select * into o from public.orders where code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return false;
  end if;
  if right(regexp_replace(o.customer_phone, '[^0-9]', '', 'g'), 9) <> right(digits, 9) then
    return false;
  end if;
  if o.status <> 'new' then
    return false;
  end if;
  if p_path is null or left(p_path, char_length(o.code) + 1) <> o.code || '/' then
    return false;
  end if;
  update public.orders set proof_path = p_path, updated_at = now() where id = o.id;
  return true;
end;
$$;

-- ========== FUNÇÃO (ADMIN): mudar estado, repondo/retirando stock ==========
create or replace function public.admin_set_order_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  r record;
  any_tracked boolean := false;
begin
  if not public.is_admin() then
    raise exception 'Sem permissão.';
  end if;
  if p_status not in ('new','paid','preparing','delivered','cancelled') then
    raise exception 'Estado inválido.';
  end if;

  select * into o from public.orders where id = p_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;
  if o.status = p_status then
    return;
  end if;

  if p_status = 'cancelled' and o.stock_deducted then
    -- cancelar: repõe o stock
    update public.books b
      set stock = b.stock + i.quantity
      from public.order_items i
      where i.order_id = o.id and i.format = 'physical' and i.book_id = b.id and b.track_stock;
    update public.orders set stock_deducted = false where id = o.id;

  elsif o.status = 'cancelled' and p_status <> 'cancelled' then
    -- reativar: volta a retirar o stock
    for r in
      select i.book_id, i.quantity, b.title, b.stock
      from public.order_items i
      join public.books b on b.id = i.book_id
      where i.order_id = o.id and i.format = 'physical' and b.track_stock
      for update of b
    loop
      if r.stock < r.quantity then
        raise exception 'Stock insuficiente para reativar "%".', r.title;
      end if;
      update public.books set stock = stock - r.quantity where id = r.book_id;
      any_tracked := true;
    end loop;
    update public.orders set stock_deducted = any_tracked where id = o.id;
  end if;

  update public.orders
    set status = p_status,
        updated_at = now(),
        paid_at = case
          when p_status in ('paid','preparing','delivered') and paid_at is null then now()
          else paid_at
        end
    where id = o.id;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, text) from public, anon;
grant execute on function public.admin_set_order_status(uuid, text) to authenticated;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.get_order(text, text) to anon, authenticated;
grant execute on function public.attach_proof(text, text, text) to anon, authenticated;

-- ========== STORAGE PRIVADO ==========
-- Comprovativos: o cliente envia (sem conta), só o admin vê.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 5242880,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "proofs upload" on storage.objects;
create policy "proofs upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'proofs');

drop policy if exists "proofs admin" on storage.objects;
create policy "proofs admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'proofs' and public.is_admin())
  with check (bucket_id = 'proofs' and public.is_admin());

-- Livros digitais (PDF/EPUB): privado; o download é libertado pelo servidor após pagamento.
insert into storage.buckets (id, name, public)
values ('digital', 'digital', false)
on conflict (id) do update set public = false;

drop policy if exists "digital admin" on storage.objects;
create policy "digital admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'digital' and public.is_admin())
  with check (bucket_id = 'digital' and public.is_admin());

-- ========== TEMPO REAL (aviso de novo pedido no painel) ==========
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when others then
  null; -- já estava adicionada
end $$;

-- ========== EXEMPLOS (inativos: edite e ative no painel) ==========
do $$
begin
  if not exists (select 1 from public.payment_methods) then
    insert into public.payment_methods (kind, label, details, is_active, sort_order) values
    ('bank_transfer', 'Transferência bancária (IBAN)',
     E'Banco: (nome do banco)\nIBAN: AO06 0000 0000 0000 0000 0000 0\nTitular: Garcia Pedro Teleka\nUse o código do pedido como descrição.', false, 1),
    ('multicaixa_express', 'Multicaixa Express',
     E'Número: 9XX XXX XXX\nTitular: Garcia Pedro Teleka\nUse o código do pedido como referência.', false, 2),
    ('cash', 'Pagar no levantamento / na entrega',
     'Pague em dinheiro quando receber o livro.', true, 3);
  end if;

  if not exists (select 1 from public.delivery_zones) then
    insert into public.delivery_zones (name, fee_kz, is_active, sort_order) values
    ('Luanda — exemplo (edite o preço)', 2000, false, 1);
  end if;
end $$;
