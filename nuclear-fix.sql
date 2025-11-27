-- ============================================
-- NUCLEAR OPTION - Complete Permission Reset
-- ============================================
-- If fix-permissions.sql didn't work, try this
-- This completely resets all permissions

-- Step 1: Drop and recreate tables (preserves data)
BEGIN;

-- Backup existing data
CREATE TEMP TABLE visitors_backup AS SELECT * FROM visitors;
CREATE TEMP TABLE page_views_backup AS SELECT * FROM page_views;

-- Drop tables
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS visitors CASCADE;
DROP VIEW IF EXISTS visitor_analytics CASCADE;
DROP VIEW IF EXISTS page_analytics CASCADE;

-- Recreate visitors table WITHOUT RLS
CREATE TABLE visitors (
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

-- Recreate page_views table WITHOUT RLS
CREATE TABLE page_views (
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

-- Restore data
INSERT INTO visitors SELECT * FROM visitors_backup;
INSERT INTO page_views SELECT * FROM page_views_backup;

-- Create indexes
CREATE INDEX idx_visitors_session_id ON visitors(session_id);
CREATE INDEX idx_visitors_visited_at ON visitors(visited_at);
CREATE INDEX idx_visitors_page_url ON visitors(page_url);
CREATE INDEX idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);

-- Recreate views
CREATE OR REPLACE VIEW visitor_analytics AS
SELECT 
    DATE(visited_at) as date,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(*) as total_visits,
    COUNT(DISTINCT page_url) as pages_visited,
    AVG(CASE WHEN device_type IS NOT NULL THEN 1 ELSE 0 END) as device_detection_rate
FROM visitors
GROUP BY DATE(visited_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW page_analytics AS
SELECT 
    v.page_url,
    COUNT(*) as views,
    COUNT(DISTINCT v.session_id) as unique_views,
    AVG(pv.time_on_page) as avg_time_on_page,
    AVG(pv.scroll_depth) as avg_scroll_depth,
    SUM(CASE WHEN pv.clicked_cta THEN 1 ELSE 0 END) as cta_clicks
FROM visitors v
LEFT JOIN page_views pv ON v.id = pv.visitor_id
GROUP BY v.page_url
ORDER BY views DESC;

-- CRITICAL: Grant ALL permissions BEFORE enabling anything
GRANT ALL PRIVILEGES ON TABLE visitors TO anon, authenticated, postgres;
GRANT ALL PRIVILEGES ON TABLE page_views TO anon, authenticated, postgres;
GRANT SELECT ON visitor_analytics TO anon, authenticated, postgres;
GRANT SELECT ON page_analytics TO anon, authenticated, postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres;

-- Make sure RLS is OFF
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('anon', schemaname||'.'||tablename, 'INSERT') as anon_insert
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('visitors', 'page_views');

-- Success
DO $$ 
BEGIN 
    RAISE NOTICE '✅ NUCLEAR FIX COMPLETE!';
    RAISE NOTICE '🔄 Hard refresh your browser (Ctrl+Shift+R)';
END $$;
