-- Migration: Allow elders to resolve their own crisis_events
-- The guardian update policy already exists (20260712000004), but the elder
-- themselves could not update resolved_at on their own SOS events. This adds
-- a self-update policy so the Me/History screen's "Mark Resolved" button works.

create policy "crisis self update" on public.crisis_events
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
