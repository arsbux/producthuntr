-- Create table to store live Product Hunt snapshot
CREATE TABLE IF NOT EXISTS live_snapshot (
    id SERIAL PRIMARY KEY,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on updated_at for quick lookups
CREATE INDEX IF NOT EXISTS idx_live_snapshot_updated_at ON live_snapshot(updated_at DESC);

-- DISABLE RLS for completely unrestricted access
ALTER TABLE live_snapshot DISABLE ROW LEVEL SECURITY;

-- Insert initial empty snapshot
INSERT INTO live_snapshot (snapshot_data) 
VALUES ('{
    "chartData": [],
    "topLaunches": [],
    "metrics": {
        "totalLaunches": 0,
        "aiPercentage": 0,
        "avgVotes": 0,
        "topCategory": "N/A"
    }
}'::jsonb)
ON CONFLICT DO NOTHING;
