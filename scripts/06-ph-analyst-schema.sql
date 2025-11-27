-- Product Hunt Analyst Schema
-- Focuses exclusively on PH launches and AI analysis

-- 1. CLEANUP: Drop legacy tables and existing tables to start fresh
DROP TABLE IF EXISTS investment_theses CASCADE;
DROP TABLE IF EXISTS company_thesis_matches CASCADE;
DROP TABLE IF EXISTS signal_quality_scores CASCADE;
DROP TABLE IF EXISTS company_trust_signals CASCADE;
DROP TABLE IF EXISTS investor_preferences CASCADE;
DROP TABLE IF EXISTS signals CASCADE; -- Previous main table
DROP TABLE IF EXISTS ph_launches CASCADE;
DROP TABLE IF EXISTS ph_trends CASCADE;

-- 2. ENSURE SCHEMA PERMISSIONS
-- Make sure the public schema allows creation
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT CREATE ON SCHEMA public TO postgres, service_role;

-- 3. CREATE: Main Launches Table
CREATE TABLE public.ph_launches (
  id TEXT PRIMARY KEY, -- Product Hunt ID
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  
  -- Metrics
  votes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  rank_of_day INTEGER,
  
  -- Links
  website_url TEXT,
  ph_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  topics TEXT[] DEFAULT '{}',
  makers JSONB DEFAULT '[]',
  launched_at TIMESTAMP WITH TIME ZONE,
  
  -- AI Analysis (The Core Value)
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "icp": "Freelance Designers",
  --   "problem": "Managing multiple invoices",
  --   "solution_type": "SaaS",
  --   "niche": "Fintech for Creatives",
  --   "pricing_model": "Freemium"
  -- }
  
  analyzed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE: Trend Reports (Cached Aggregations)
CREATE TABLE public.ph_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Aggregated Data
  top_niches JSONB DEFAULT '[]', -- [{"niche": "AI Devtools", "count": 15, "avg_votes": 400}]
  top_problems JSONB DEFAULT '[]',
  top_icps JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_date, period_type)
);

-- 5. INDEXES
CREATE INDEX idx_ph_launches_votes ON public.ph_launches(votes_count DESC);
CREATE INDEX idx_ph_launches_date ON public.ph_launches(launched_at DESC);
CREATE INDEX idx_ph_launches_analyzed ON public.ph_launches(analyzed_at);

-- 6. PERMISSIONS: Disable Row Level Security (RLS) for unrestricted access
ALTER TABLE public.ph_launches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ph_trends DISABLE ROW LEVEL SECURITY;

-- 7. GRANT FULL PERMISSIONS TO ALL ROLES
-- This ensures service_role can insert/update/delete
GRANT ALL PRIVILEGES ON TABLE public.ph_launches TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON TABLE public.ph_trends TO postgres, anon, authenticated, service_role;

-- Grant usage on sequences (if any were created)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 8. ENABLE REALTIME (optional, for live updates)
-- Note: This might fail if the publication doesn't exist, but that's okay
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ph_launches;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add table to realtime publication: %', SQLERRM;
END $$;

-- 9. VERIFY SETUP
DO $$
BEGIN
    RAISE NOTICE 'Schema setup complete!';
    RAISE NOTICE 'Tables created: ph_launches, ph_trends';
    RAISE NOTICE 'RLS disabled for both tables';
    RAISE NOTICE 'All permissions granted to service_role';
END $$;
