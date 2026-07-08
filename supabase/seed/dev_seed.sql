-- =====================================================================
-- Seed data for local dev (goldenage_dev only)
-- =====================================================================
-- Run AFTER the initial migration. Creates a demo elder + guardian so
-- the app has data to play with. NEVER run in production.
-- =====================================================================

-- The auth.users rows are created via the Supabase dashboard or
-- supabase auth signups. Here we just upsert known UUIDs once they exist.

-- Example profile shape (replace UUIDs with real auth.users IDs):
--   insert into public.profiles (id, display_name, preferred_name, phone_e164, city)
--   values
--     ('00000000-0000-0000-0000-000000000001', '王爷爷', '王爷爷', '+8613800000001', '北京'),
--     ('00000000-0000-0000-0000-000000000002', '王小明', '小明',  '+8613900000002', '北京')
--   on conflict (id) do nothing;

-- Example guardian pair (after both users sign up):
--   insert into public.guardians (elder_id, guardian_id, role, pair_accepted)
--   values
--     ('00000000-0000-0000-0000-000000000001',
--      '00000000-0000-0000-0000-000000000002',
--      'primary', true)
--   on conflict do nothing;

-- Example medication schedule:
--   insert into public.medication_schedules (user_id, med_name, dosage, schedule_times, notes)
--   values
--     ('00000000-0000-0000-0000-000000000001',
--      '降压药', '1 片', '{08:00,20:00}', '饭后服用');
