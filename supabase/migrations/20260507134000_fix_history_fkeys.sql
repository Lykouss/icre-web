ALTER TABLE public.event_history
  DROP CONSTRAINT IF EXISTS event_history_actor_id_fkey,
  ADD CONSTRAINT event_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS event_history_target_user_id_fkey,
  ADD CONSTRAINT event_history_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
