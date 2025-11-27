-- Upgrade vote_snapshots table to match ph_launches schema
-- This allows us to store full product details in every snapshot

ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS rank_of_day int4;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS ph_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS topics text[];
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS makers jsonb;
ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS launched_at timestamptz;

-- Ensure permissions are still correct (Unrestricted)
ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;
GRANT ALL ON vote_snapshots TO anon;
GRANT ALL ON vote_snapshots TO authenticated;
GRANT ALL ON vote_snapshots TO service_role;
