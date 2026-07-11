-- =====================================================================
-- GoldenAge AI — Profile fields for setup wizard
-- =====================================================================
-- Adds the columns the new multi-step setup wizard collects:
--   - gender              ('female' | 'male' | 'other' | null)
--   - age                 (smallint — derived from birth_date if available)
--   - news_topics         (text[]) — what the user wants to see in the feed
--   - guardian_name       (text)
--   - guardian_phone      (text)
--   - guardian_relationship (text)  -- e.g. 儿子 / 女儿 / 配偶 / 孙辈
-- All nullable; new users fill them in via the wizard, existing users get
-- defaults that won't break the UI.

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='gender') then
    alter table public.profiles add column gender text
      check (gender is null or gender in ('female','male','other'));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='age') then
    alter table public.profiles add column age smallint
      check (age is null or (age between 0 and 130));
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='news_topics') then
    alter table public.profiles add column news_topics text[] default '{}';
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='guardian_name') then
    alter table public.profiles add column guardian_name text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='guardian_phone') then
    alter table public.profiles add column guardian_phone text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles' and column_name='guardian_relationship') then
    alter table public.profiles add column guardian_relationship text;
  end if;
end $$;

-- Index for filtering profiles by news preferences (used by the AI ranker
-- to bias the per-user feed).
create index if not exists profiles_news_topics_gin
  on public.profiles using gin (news_topics);
