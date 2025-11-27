-- ==========================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Create the helper function for future admin scripts
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- 2. Upgrade vote_snapshots table with missing columns
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS rank_of_day int4;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS ph_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS topics text[];
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS makers jsonb;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS launched_at timestamptz;

-- 3. Fix Permissions (Make it unrestricted)
ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public insert access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public update access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public delete access" ON vote_snapshots;

-- Grant full access to all roles
GRANT ALL ON vote_snapshots TO anon;
GRANT ALL ON vote_snapshots TO authenticated;
GRANT ALL ON vote_snapshots TO service_role;

-- 4. Verify
SELECT 'Success!' as status, count(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'vote_snapshots';
