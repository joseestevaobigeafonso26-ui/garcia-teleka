-- Garcia Pedro Teleka — esquema Supabase (v2, com painel admin completo)
-- Cole no SQL Editor do Supabase e execute. Pode ser executado de novo sem perder dados.

-- ========== TABELAS ==========
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text not null default '244923000000'
);

-- Colunas novas (textos editáveis do site)
alter table public.site_settings
  add column if not exists author_name text not null default 'Garcia Pedro Teleka',
  add column if not exists author_tagline text not null default 'Escritor · Palestrante · Mentor',
  add column if not exists hero_kicker text not null default 'LIVROS QUE INSPIRAM, TRANSFORMAM E FAZEM PENSAR',
  add column if not exists hero_description text not null default 'Através das suas obras, Garcia Pedro Teleka partilha experiências de vida, valores e ensinamentos que conectam o ser humano ao seu propósito.',
  add column if not exists about_quote text not null default 'A verdadeira força está em nunca desistir dos seus sonhos.',
  add column if not exists about_bio_1 text not null default 'Escritor, palestrante e mentor, Garcia Pedro Teleka é um dos nomes emergentes da literatura contemporânea, conhecido por suas obras que abordam temas como superação, fé, disciplina e desenvolvimento pessoal.',
  add column if not exists about_bio_2 text not null default 'Com uma escrita profunda e inspiradora, tem vindo a impactar milhares de leitores, dentro e fora de Angola, motivando jovens e adultos a alcançarem a sua melhor versão.',
  add column if not exists books_intro text not null default 'Livros que passam mensagens edificantes, despertam a mente e fortalecem o espírito.',
  add column if not exists gallery_intro text not null default 'Imagens de eventos, lançamentos, sessões de autógrafos e muito mais.',
  add column if not exists contact_title text not null default 'Fale Diretamente com Garcia Pedro Teleka',
  add column if not exists contact_text text not null default 'Para convites de palestras, mentorias, encomendas de livros em lote ou dúvidas sobre e-books, entre em contacto via WhatsApp.',
  add column if not exists footer_quote text not null default 'Grandes mudanças começam com grandes decisões.',
  add column if not exists facebook_url text not null default 'https://facebook.com',
  add column if not exists instagram_url text not null default 'https://instagram.com',
  add column if not exists youtube_url text not null default 'https://youtube.com';

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  description text not null default '',
  price_kz integer not null default 0,
  cover_url text not null default '',
  sample_text text not null default '',
  badge text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null default '',
  duration text not null default '',
  thumbnail_url text not null default '',
  video_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ========== ADMINISTRADORES ==========
-- Só os emails nesta tabela podem editar o site (mesmo que alguém crie conta).
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security; -- sem políticas: inacessível pelo cliente

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- >>> IMPORTANTE: substitua pelo email do autor (o mesmo criado em Authentication → Users)
-- insert into public.admins (email) values ('email-do-autor@exemplo.com') on conflict do nothing;

-- ========== SEGURANÇA (RLS) ==========
alter table public.site_settings enable row level security;
alter table public.books enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.videos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['site_settings','books','gallery_photos','videos']
  loop
    execute format('drop policy if exists "leitura publica" on public.%I', t);
    execute format('create policy "leitura publica" on public.%I for select using (true)', t);
    execute format('drop policy if exists "escrita autenticada" on public.%I', t);
    execute format('drop policy if exists "escrita admin" on public.%I', t);
    execute format('create policy "escrita admin" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ========== STORAGE (imagens e vídeos) ==========
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media leitura" on storage.objects;
create policy "media leitura" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media escrita admin" on storage.objects;
create policy "media escrita admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- ========== DADOS INICIAIS (só se as tabelas estiverem vazias) ==========
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from public.books) then
    insert into public.books (title, category, description, price_kz, cover_url, sample_text, badge, is_featured, sort_order) values
    ('Quando os Bons Decidem Falar', 'Autoajuda | Motivação',
     'Sobre posicionamento, valores e a responsabilidade de liderar transformações sociais.', 8000,
     'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=500&q=80',
     E'Capítulo 1: O Silêncio Ruinoso\n\nNão é o ruído dos maus que destrói a sociedade, mas o silêncio complacente daqueles que carregam a luz e escolhem calar. Quando a verdade recua, a mentira avança com a firmeza de um exército não contestado...\n\nO verdadeiro valor de um líder mede-se no momento em que a decisão certa exige coragem para falar sozinho.',
     'Lançamento', true, 1),
    ('Disciplina é Liberdade', 'Desenvolvimento Pessoal',
     'Como construir hábitos sólidos para conquistar a verdadeira independência profissional e pessoal.', 7500,
     'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
     E'Capítulo 1: A Ilusão do Atalho\n\nTodos querem o resultado da vitória, mas poucos aceitam o peso da preparação diária...',
     null, false, 2),
    ('Sonhos em Ação', 'Motivação | Superação',
     'Transforme ideias em metas concretas e vença o medo da execução.', 7500,
     'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80',
     E'Capítulo 1: Da Ideia à Realidade\n\nSonhar é gratuito, mas realizar exige o preço do foco inabalável...',
     null, false, 3),
    ('O Poder da Fé', 'Espiritualidade | Vida',
     'Encontre refúgio e força espiritual para superar os momentos de maior adversidade.', 6500,
     'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=500&q=80',
     E'Capítulo 1: A Ancoragem da Alma\n\nQuando a tempestade exterior parece desmoronar tudo, a fé é a âncora invisível que nos segura...',
     null, false, 4);
  end if;

  if not exists (select 1 from public.videos) then
    insert into public.videos (title, tag, duration, thumbnail_url, video_url, sort_order) values
    ('Bastidores: Preparação para a Grande Palestra', 'Palestra', '40 seg', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=80', 'https://www.w3schools.com/html/mov_bbb.mp4', 1),
    ('A rotina de escrita nas primeiras horas da manhã', 'Escrita', '30 seg', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80', 'https://www.w3schools.com/html/mov_bbb.mp4', 2),
    ('Sessão de Autógrafos e carinho dos leitores', 'Evento', '55 seg', 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80', 'https://www.w3schools.com/html/mov_bbb.mp4', 3),
    ('Sessão de mentoria em grupo sobre propósito', 'Mentoria', '45 seg', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', 'https://www.w3schools.com/html/mov_bbb.mp4', 4);
  end if;

  if not exists (select 1 from public.gallery_photos) then
    insert into public.gallery_photos (image_url, caption, sort_order) values
    ('https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80', 'Palestra Principal sobre Liderança', 1),
    ('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80', 'Apresentação Oficial da Obra', 2),
    ('https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80', 'Sessão Individual de Autógrafos', 3),
    ('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', 'Fotografia com Leitores', 4);
  end if;
end $$;
