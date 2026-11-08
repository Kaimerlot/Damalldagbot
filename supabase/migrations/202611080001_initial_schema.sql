create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  language text not null default 'sv' check (language in ('sv', 'en')),
  favourite_club_id uuid,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  city_sv text not null,
  city_en text not null,
  colours jsonb not null default '{}'::jsonb,
  founded_year integer,
  stadium text,
  description_sv text,
  description_en text,
  external_team_id text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add constraint profiles_favourite_club_id_fkey
  foreign key (favourite_club_id) references public.clubs(id) on delete set null;

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  champion_club_id uuid references public.clubs(id) on delete set null,
  notes_sv text,
  notes_en text,
  verified boolean not null default false
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  round integer,
  kickoff_at timestamptz not null,
  home_club_id uuid not null references public.clubs(id),
  away_club_id uuid not null references public.clubs(id),
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'postponed', 'abandoned')),
  external_match_id text,
  updated_at timestamptz not null default now(),
  check (home_club_id <> away_club_id),
  unique (season_id, external_match_id)
);

create table public.standings (
  season_id uuid not null references public.seasons(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  played integer not null default 0 check (played >= 0),
  won integer not null default 0 check (won >= 0),
  drawn integer not null default 0 check (drawn >= 0),
  lost integer not null default 0 check (lost >= 0),
  goals_for integer not null default 0 check (goals_for >= 0),
  goals_against integer not null default 0 check (goals_against >= 0),
  points integer not null default 0 check (points >= 0),
  position integer,
  updated_at timestamptz not null default now(),
  primary key (season_id, club_id)
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_sv text not null,
  title_en text,
  summary_sv text,
  summary_en text,
  body_sv text,
  body_en text,
  image_url text,
  image_credit text,
  source_url text,
  club_id uuid references public.clubs(id) on delete set null,
  tags text[] not null default '{}',
  published_at timestamptz,
  scheduled_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.history_events (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  title_sv text not null,
  title_en text,
  body_sv text,
  body_en text,
  source_url text,
  verified boolean not null default false
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  nationality text,
  position text,
  years_active text,
  clubs jsonb not null default '[]'::jsonb,
  bio_sv text,
  bio_en text,
  image_url text,
  image_credit text,
  image_license text,
  verified boolean not null default false
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_sv text not null,
  question_en text not null,
  options_sv jsonb not null check (jsonb_typeof(options_sv) = 'array' and jsonb_array_length(options_sv) = 4),
  options_en jsonb not null check (jsonb_typeof(options_en) = 'array' and jsonb_array_length(options_en) = 4),
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation_sv text,
  explanation_en text,
  verified boolean not null default false,
  active boolean not null default false
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  category text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  slug text not null,
  name_sv text not null,
  name_en text not null,
  description_sv text,
  description_en text,
  category text not null,
  price_sek integer not null check (price_sek > 0),
  images jsonb not null default '[]'::jsonb,
  active boolean not null default false,
  stripe_product_id text,
  created_at timestamptz not null default now(),
  unique (club_id, slug)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  colour text not null,
  stock integer not null default 0 check (stock >= 0),
  stripe_price_id text,
  unique (product_id, size, colour)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stripe_session_id text not null unique,
  status text not null check (status in ('pending', 'paid', 'expired', 'refunded', 'failed')),
  total_sek integer not null check (total_sek >= 0),
  shipping_address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unit_price_sek integer not null check (unit_price_sek > 0)
);

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text,
  language text not null check (language in ('sv', 'en')),
  score integer not null default 0,
  streak integer not null default 0,
  question_count integer not null default 10,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.quiz_session_questions (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id),
  position smallint not null,
  selected_index smallint check (selected_index between -1 and 3),
  elapsed_ms integer check (elapsed_ms >= 0),
  used_hint boolean not null default false,
  primary key (session_id, question_id),
  unique (session_id, position)
);

create table public.sync_log (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_changed integer not null default 0,
  error text
);

create table public.stripe_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index matches_season_id_idx on public.matches(season_id);
create index matches_home_club_id_idx on public.matches(home_club_id);
create index matches_away_club_id_idx on public.matches(away_club_id);
create index matches_kickoff_at_idx on public.matches(kickoff_at);
create index standings_club_id_idx on public.standings(club_id);
create index news_club_id_idx on public.news(club_id);
create index news_published_at_idx on public.news(published_at desc);
create index seasons_champion_club_id_idx on public.seasons(champion_club_id);
create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);
create index products_club_id_idx on public.products(club_id);
create index product_variants_product_id_idx on public.product_variants(product_id);
create index orders_user_id_idx on public.orders(user_id);
create index order_items_order_id_idx on public.order_items(order_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' and new.role is distinct from old.role then
    raise exception 'Profile role cannot be changed by the account owner';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_before_update
before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'language' = 'en' then 'en' else 'sv' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create view public.quiz_questions_public as
  select id, category, difficulty, question_sv, question_en, options_sv, options_en,
         explanation_sv, explanation_en
  from public.quiz_questions
  where active = true;

create or replace function public.start_quiz(p_category text default null, p_language text default 'sv')
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_session uuid := gen_random_uuid();
  selected_count integer;
  question_list jsonb;
begin
  if p_language not in ('sv', 'en') then raise exception 'Unsupported language'; end if;
  insert into public.quiz_sessions (id, user_id, category, language)
  values (new_session, auth.uid(), p_category, p_language);

  with selected as (
    select id, row_number() over () - 1 as position
    from public.quiz_questions
    where active and (p_category is null or category = p_category)
    order by random()
    limit 10
  )
  insert into public.quiz_session_questions (session_id, question_id, position)
  select new_session, id, position from selected;

  get diagnostics selected_count = row_count;
  if selected_count < 10 then
    delete from public.quiz_sessions where id = new_session;
    raise exception 'Not enough active questions in this category';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', q.id,
    'question', case when p_language = 'sv' then q.question_sv else q.question_en end,
    'options', case when p_language = 'sv' then q.options_sv else q.options_en end,
    'position', sq.position
  ) order by sq.position)
  into question_list
  from public.quiz_session_questions sq
  join public.quiz_questions q on q.id = sq.question_id
  where sq.session_id = new_session;

  return jsonb_build_object('session_id', new_session, 'questions', question_list);
end;
$$;

create or replace function public.submit_answer(p_session_id uuid, p_question_id uuid, p_option_index integer, p_elapsed_ms integer, p_used_hint boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  quiz_row public.quiz_sessions%rowtype;
  question_row public.quiz_questions%rowtype;
  expected_position smallint;
  is_correct boolean;
  points integer := 0;
  actual_elapsed_ms integer;
  base_points integer;
begin
  if p_option_index not between -1 and 3 or p_elapsed_ms < 0 then raise exception 'Invalid answer'; end if;
  select * into quiz_row from public.quiz_sessions where id = p_session_id and finished_at is null for update;
  if not found or (quiz_row.user_id is not null and quiz_row.user_id <> auth.uid()) then raise exception 'Quiz session not found'; end if;
  select sq.position into expected_position from public.quiz_session_questions sq
  where sq.session_id = p_session_id and sq.question_id = p_question_id and sq.selected_index is null;
  if not found then raise exception 'Question is not awaiting an answer'; end if;
  select * into question_row from public.quiz_questions where id = p_question_id and active;
  if not found then raise exception 'Question is no longer active'; end if;

  is_correct := question_row.correct_index = p_option_index;
  actual_elapsed_ms := greatest(0, least(20000, floor(extract(epoch from (clock_timestamp() - quiz_row.created_at)) * 1000)::integer - expected_position * 20000));
  base_points := case question_row.difficulty when 'hard' then 200 when 'medium' then 150 else 100 end;
  if is_correct then
    points := round((base_points + floor((20000 - actual_elapsed_ms) / 200.0)) * (1 + least(quiz_row.streak, 5) * 0.1));
    if p_used_hint then points := floor(points / 2.0)::integer; end if;
  end if;
  update public.quiz_session_questions set selected_index = p_option_index, elapsed_ms = actual_elapsed_ms, used_hint = p_used_hint
  where session_id = p_session_id and question_id = p_question_id;
  update public.quiz_sessions set score = score + points, streak = case when is_correct then streak + 1 else 0 end
  where id = p_session_id;

  return jsonb_build_object(
    'correct', is_correct,
    'score_added', points,
    'explanation', case when quiz_row.language = 'sv' then question_row.explanation_sv else question_row.explanation_en end,
    'position', expected_position
  );
end;
$$;

create or replace function public.finish_quiz(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  quiz_row public.quiz_sessions%rowtype;
  answered_count integer;
  attempt_id uuid;
begin
  select * into quiz_row from public.quiz_sessions where id = p_session_id and finished_at is null for update;
  if not found or (quiz_row.user_id is not null and quiz_row.user_id <> auth.uid()) then raise exception 'Quiz session not found'; end if;
  select count(*) into answered_count from public.quiz_session_questions where session_id = p_session_id and selected_index is not null;
  if answered_count <> 10 then raise exception 'Quiz is not complete'; end if;
  update public.quiz_sessions set finished_at = now() where id = p_session_id;
  if quiz_row.user_id is not null then
    insert into public.quiz_attempts (user_id, score, total, category)
    values (quiz_row.user_id, quiz_row.score, answered_count, quiz_row.category)
    returning id into attempt_id;
  end if;
  return jsonb_build_object('score', quiz_row.score, 'total', answered_count, 'attempt_id', attempt_id);
end;
$$;

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.seasons enable row level security;
alter table public.matches enable row level security;
alter table public.standings enable row level security;
alter table public.news enable row level security;
alter table public.history_events enable row level security;
alter table public.players enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_session_questions enable row level security;
alter table public.sync_log enable row level security;
alter table public.stripe_events enable row level security;

create policy "Profiles are readable by owner" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Profiles are editable by owner" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Public read clubs" on public.clubs for select to anon, authenticated using (true);
create policy "Admins manage clubs" on public.clubs for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read seasons" on public.seasons for select to anon, authenticated using (true);
create policy "Admins manage seasons" on public.seasons for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read matches" on public.matches for select to anon, authenticated using (true);
create policy "Admins manage matches" on public.matches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read standings" on public.standings for select to anon, authenticated using (true);
create policy "Admins manage standings" on public.standings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read published news" on public.news for select to anon, authenticated using (published_at is not null and published_at <= now());
create policy "Admins manage news" on public.news for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read history" on public.history_events for select to anon, authenticated using (true);
create policy "Admins manage history" on public.history_events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read players" on public.players for select to anon, authenticated using (true);
create policy "Admins manage players" on public.players for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage quiz questions" on public.quiz_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Users read own quiz attempts" on public.quiz_attempts for select to authenticated using (user_id = auth.uid());
create policy "Public read active products" on public.products for select to anon, authenticated using (active);
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public read active variants" on public.product_variants for select to anon, authenticated using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "Admins manage variants" on public.product_variants for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Users read own orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "Users read own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "Quiz sessions are server only" on public.quiz_sessions for all to authenticated using (false) with check (false);
create policy "Quiz session questions are server only" on public.quiz_session_questions for all to authenticated using (false) with check (false);
create policy "Admins read sync log" on public.sync_log for select to authenticated using (public.is_admin());
create policy "Admins read Stripe events" on public.stripe_events for select to authenticated using (public.is_admin());

revoke all on public.quiz_questions from anon, authenticated;
grant select on public.quiz_questions_public to anon, authenticated;
grant select on public.clubs, public.seasons, public.matches, public.standings, public.history_events, public.players to anon, authenticated;
grant select on public.news to anon, authenticated;
grant select on public.products, public.product_variants to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.quiz_attempts, public.orders, public.order_items to authenticated;
grant select, insert, update, delete on public.clubs, public.seasons, public.matches, public.standings, public.news, public.history_events, public.players, public.quiz_questions, public.products, public.product_variants to authenticated;
grant select on public.sync_log, public.stripe_events to authenticated;
grant execute on function public.start_quiz(text, text) to anon, authenticated;
grant execute on function public.submit_answer(uuid, uuid, integer, integer) to anon, authenticated;
grant execute on function public.finish_quiz(uuid) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;