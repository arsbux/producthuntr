-- Supabase SQL Setup for Visitor Tracking
-- Run this in your Supabase SQL Editor

-- Create visitors table
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

-- Create page_views table for detailed tracking
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    page_title TEXT,
    time_on_page INTEGER, -- in seconds
    scroll_depth INTEGER, -- percentage
    clicked_cta BOOLEAN DEFAULT FALSE,
    cta_type TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitors_session_id ON visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON visitors(visited_at);
CREATE INDEX IF NOT EXISTS idx_visitors_page_url ON visitors(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);

-- Create a view for analytics dashboard
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

-- Create a view for page analytics
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

-- Disable Row Level Security (RLS) for full access
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow anonymous inserts" ON visitors;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON page_views;
DROP POLICY IF EXISTS "Allow authenticated reads" ON visitors;
DROP POLICY IF EXISTS "Allow authenticated reads" ON page_views;
DROP POLICY IF EXISTS "Enable insert for anon" ON visitors;
DROP POLICY IF EXISTS "Enable insert for anon" ON page_views;
DROP POLICY IF EXISTS "Enable read for all" ON visitors;
DROP POLICY IF EXISTS "Enable read for all" ON page_views;

-- Create permissive policies for full access
CREATE POLICY "Allow all operations" ON visitors
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations" ON page_views
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant all permissions to anon and authenticated users
GRANT ALL ON visitors TO anon, authenticated;
GRANT ALL ON page_views TO anon, authenticated;
GRANT SELECT ON visitor_analytics TO anon, authenticated;
GRANT SELECT ON page_analytics TO anon, authenticated;

-- Grant usage on sequences if they exist
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
