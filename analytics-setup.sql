-- Create table for tracking site visits
CREATE TABLE IF NOT EXISTS analytics_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_path TEXT,
    user_agent TEXT,
    ip_address TEXT,
    country TEXT,
    city TEXT,
    device_type TEXT,
    referrer TEXT,
    duration_seconds INTEGER DEFAULT 0
);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON analytics_visits(created_at);

-- Create index for path analysis
CREATE INDEX IF NOT EXISTS idx_analytics_visits_page_path ON analytics_visits(page_path);

-- Disable Row Level Security to remove all restrictions
ALTER TABLE analytics_visits DISABLE ROW LEVEL SECURITY;

-- Policies are not needed when RLS is disabled, but we keep the grants
-- Grant permissions to the table
GRANT ALL ON analytics_visits TO anon, authenticated, service_role;
