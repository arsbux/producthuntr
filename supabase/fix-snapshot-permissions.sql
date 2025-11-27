-- Remove all restrictions from vote_snapshots table

-- 1. Disable RLS
ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies
DROP POLICY IF EXISTS "Allow public read access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public insert access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public update access" ON vote_snapshots;
DROP POLICY IF EXISTS "Allow public delete access" ON vote_snapshots;

-- 3. Grant full access to all roles
GRANT ALL ON vote_snapshots TO anon;
GRANT ALL ON vote_snapshots TO authenticated;
GRANT ALL ON vote_snapshots TO service_role;

-- 4. Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_vote_snapshots_date ON vote_snapshots(snapshot_date DESC, snapshot_time DESC);
CREATE INDEX IF NOT EXISTS idx_vote_snapshots_product ON vote_snapshots(product_id);

-- Verify (should show rls_enabled = false)
SELECT tablename, rowsecurity as rls_enabled 
FROM pg_tables 
WHERE tablename = 'vote_snapshots';
