-- ⚠️ WARNING: DEVELOPMENT ONLY - REMOVES ALL SECURITY RESTRICTIONS
-- DO NOT USE IN PRODUCTION!
-- This disables Row Level Security to allow unrestricted database access

-- 1. Disable Row Level Security on all tables
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.webhook_events;

-- 3. Grant full access to all authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.webhook_events TO authenticated;

-- 4. Grant full access to anonymous users (public access)
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.subscriptions TO anon;
GRANT ALL ON public.webhook_events TO anon;

-- 5. Grant usage on sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Done! All restrictions removed.
-- Everyone can now read/write all data.
-- Perfect for development, but NEVER use in production!
