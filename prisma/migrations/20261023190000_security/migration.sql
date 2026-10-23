-- AlterTable
ALTER TABLE "users" ADD COLUMN     "session_version" INTEGER NOT NULL DEFAULT 0;


-- Row-level security on every table, with no policies. Supabase publishes the public schema
-- through its REST API, where the anon key (which is meant to be public) would otherwise read
-- and write every row. With RLS on and no policies, those roles see nothing. SlotBack connects
-- as the table owner, which RLS doesn't apply to, so the app itself is unaffected.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
