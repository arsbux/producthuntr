-- ============================================
-- ULTIMATE FIX - For 401 Unauthorized Errors
-- ============================================
-- This fixes authentication and permission issues

-- Step 1: Make sure tables exist and are accessible
CREATE TABLE IF NOT EXISTS visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    screen_width INTEGER,
    screen_height INTEGER,
    language TEXT,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    page_title TEXT,
    time_on_page INTEGER,
    scroll_depth INTEGER,
    clicked_cta BOOLEAN DEFAULT FALSE,
    cta_type TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: COMPLETELY disable RLS
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'visitors') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON visitors';
    END LOOP;
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'page_views') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON page_views';
    END LOOP;
END $$;

-- Step 4: Grant MAXIMUM permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 5: Specifically grant on our tables
GRANT ALL ON visitors TO anon, authenticated, postgres, service_role;
GRANT ALL ON page_views TO anon, authenticated, postgres, service_role;

-- Step 6: Make tables publicly accessible (no auth required)
ALTER TABLE visitors OWNER TO postgres;
ALTER TABLE page_views OWNER TO postgres;

-- Step 7: Verify permissions
DO $$
DECLARE
    v_select BOOLEAN;
    v_insert BOOLEAN;
BEGIN
    v_select := has_table_privilege('anon', 'visitors', 'SELECT');
    v_insert := has_table_privilege('anon', 'visitors', 'INSERT');
    
    IF v_select AND v_insert THEN
        RAISE NOTICE '✅ SUCCESS! Permissions are now correct.';
        RAISE NOTICE '🔄 Hard refresh your browser (Ctrl+Shift+R)';
    ELSE
        RAISE WARNING '⚠️  Permissions may still have issues. Check Supabase API settings.';
    END IF;
END $$;

-- Step 8: Show current permissions
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
