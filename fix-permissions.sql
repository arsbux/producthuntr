-- ============================================
-- QUICK FIX FOR 403 PERMISSION ERRORS
-- ============================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN
-- This will remove all restrictions and allow tracking to work

-- Step 1: Disable Row Level Security
ALTER TABLE IF EXISTS visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS page_views DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (clean slate)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on visitors table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'visitors') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON visitors';
    END LOOP;
    
    -- Drop all policies on page_views table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'page_views') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON page_views';
    END LOOP;
END $$;

-- Step 3: Grant FULL permissions to anonymous users (needed for tracking)
GRANT ALL PRIVILEGES ON TABLE visitors TO anon;
GRANT ALL PRIVILEGES ON TABLE page_views TO anon;
GRANT ALL PRIVILEGES ON TABLE visitors TO authenticated;
GRANT ALL PRIVILEGES ON TABLE page_views TO authenticated;

-- Step 4: Grant permissions on views
GRANT SELECT ON visitor_analytics TO anon, authenticated;
GRANT SELECT ON page_analytics TO anon, authenticated;

-- Step 5: Grant sequence permissions (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 6: Verify everything worked
SELECT 
    'visitors' as table_name,
    has_table_privilege('anon', 'visitors', 'SELECT') as can_select,
    has_table_privilege('anon', 'visitors', 'INSERT') as can_insert,
    has_table_privilege('anon', 'visitors', 'UPDATE') as can_update,
    has_table_privilege('anon', 'visitors', 'DELETE') as can_delete
UNION ALL
SELECT 
    'page_views' as table_name,
    has_table_privilege('anon', 'page_views', 'SELECT') as can_select,
    has_table_privilege('anon', 'page_views', 'INSERT') as can_insert,
    has_table_privilege('anon', 'page_views', 'UPDATE') as can_update,
    has_table_privilege('anon', 'page_views', 'DELETE') as can_delete;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Permissions fixed! All operations should now work.';
    RAISE NOTICE '📊 Refresh your website and check the console.';
END $$;
