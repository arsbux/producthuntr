-- Enable RLS (good practice to have it on, even if policies are permissive, but user asked to remove restrictions)
-- Actually, user said "remove all restrictions", so let's disable RLS to be sure.
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and service_role users
GRANT ALL ON TABLE subscriptions TO authenticated;
GRANT ALL ON TABLE subscriptions TO service_role;
GRANT ALL ON TABLE subscriptions TO postgres;
GRANT ALL ON TABLE subscriptions TO anon; -- Just in case, though we require auth for the app logic

-- Ensure sequence permissions if any (usually handled by serial/identity but good to be safe)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
