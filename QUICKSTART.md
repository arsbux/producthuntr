# Quick Setup - Using vote_snapshots Table

## Step 1: Remove Restrictions from Database

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;
GRANT ALL ON vote_snapshots TO anon;
GRANT ALL ON vote_snapshots TO authenticated;
```

Or just run the entire file: `supabase/fix-snapshot-permissions.sql`

## Step 2: Populate Initial Data

```bash
./scripts/trigger-snapshot-update.sh
```

Or use curl:
```bash
curl -X GET http://localhost:3000/api/cron/update-snapshot \
  -H "Authorization: Bearer mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure"
```

This will:
- Fetch all today's launches from Product Hunt
- Delete old snapshots for today
- Insert fresh product snapshots (one row per product)

## Step 3: Check the Dashboard

Visit: `http://localhost:3000/desk`

The dashboard will:
1. Query `vote_snapshots` for today's data
2. Join with `ph_launches` for full product details
3. Categorize and aggregate data
4. Display instantly!

## How It Works

```
┌─────────────┐
│  Dashboard  │──► /api/today-launches ──► SELECT * FROM vote_snapshots
└─────────────┘                                    WHERE snapshot_date = today

                                                         ▲
                                                         │
                    Cron Job (every 5 min) ──────────────┘
                            │
                            ▼
                    Product Hunt API
                            │
                            ▼
                    INSERT INTO vote_snapshots
                    (one row per product)
```

## Data Flow

**Cron Job** (`/api/cron/update-snapshot`):
- Fetches Product Hunt API data
- Deletes old rows for today
- Inserts fresh rows (product_id, votes, comments, etc.)

**Frontend API** (`/api/today-launches`):
- Reads `vote_snapshots` for today
- Joins with `ph_launches` for full details
- Categorizes products
- Aggregates data for charts
- Returns to dashboard

## Setup Cron Job for Production

### Vercel (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/update-snapshot",
    "schedule": "*/5 * * * *"
  }]
}
```

### External Cron Service

URL: `https://your-domain.com/api/cron/update-snapshot`
Schedule: `*/5 * * * *`
Header: `Authorization: Bearer mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure`

## Benefits

✅ **Simple structure** - One row per product, easy to query
✅ **Fast queries** - Indexed on date/time
✅ **Historical data** - Can keep snapshots for multiple days
✅ **Flexible** - Join with other tables for rich data
✅ **No rate limits** - Frontend reads from database
