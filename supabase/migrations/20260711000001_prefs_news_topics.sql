-- =====================================================================
-- GoldenAge AI — Mirror news_topics on user_preferences
-- =====================================================================
-- The news ranker and AI agents can read user_preferences.news_topics
-- without joining profiles. The wizard writes to both tables; the mirror
-- keeps agent lookups fast.

alter table public.user_preferences
  add column if not exists news_topics text[] default '{}';
