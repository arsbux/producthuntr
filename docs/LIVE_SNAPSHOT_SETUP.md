# Live Snapshot System

## Overview

The app now uses a **database-backed snapshot system** instead of directly calling the Product Hunt API from the frontend. This improves:

- **Performance**: Frontend loads instantly from the database
- **Reliability**: No rate limiting issues for users
- **Efficiency**: Single background job handles all API calls

## Architecture

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Frontend  │──────▶│  /api/today-     │──────▶│  Database    │
│             │       │   launches       │       │  (Snapshot)  │
└─────────────┘       └──────────────────┘       └──────────────┘
                                                         ▲
                                                         │
                     ┌──────────────────┐                │
                     │  Cron Job        │────────────────┘
                     │  (Every 5 min)   │
                     └──────────────────┘
                             │
                             ▼
                     ┌──────────────────┐
                     │  Product Hunt    │
                     │  API             │
                     └──────────────────┘
```

## Components

### 1. Database Table: `live_snapshot`

Stores the processed Product Hunt data snapshot:
- `id`: Primary key
- `snapshot_data`: JSONB containing chart data, top launches, and metrics
- `created_at`: Timestamp
- `updated_at`: Timestamp

### 2. Background Job: `/api/cron/update-snapshot`

Runs every 5 minutes to:
1. Fetch fresh data from Product Hunt API
2. Process and categorize launches
3. Delete old snapshot
4. Store new snapshot in database

**Security**: Requires `Authorization: Bearer {CRON_SECRET}` header

### 3. Frontend API: `/api/today-launches`

Simple route that:
1. Fetches latest snapshot from database
2. Returns data to frontend
3. No external API calls = fast & reliable

## Setup Instructions

### 1. Run the Database Migration

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Manual - Run the SQL in Supabase Dashboard
# Copy contents of: supabase/migrations/create_live_snapshot.sql
# Paste into: Supabase Dashboard → SQL Editor → Run
```

### 2. Set Up the Cron Job

Choose one of these options:

#### Option A: Vercel Cron (Production - Recommended)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [{
    "path": "/api/cron/update-snapshot",
    "schedule": "*/5 * * * *"
  }]
}
```

2. Deploy to Vercel
3. Add `CRON_SECRET` to Vercel environment variables

#### Option B: External Cron Service (e.g., cron-job.org)

1. Sign up at https://cron-job.org (or similar)
2. Create a new cron job:
   - URL: `https://your-domain.com/api/cron/update-snapshot`
   - Schedule: Every 5 minutes (`*/5 * * * *`)
   - Headers: `Authorization: Bearer mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure`

#### Option C: Manual Testing (Development)

```bash
# Make the script executable
chmod +x scripts/trigger-snapshot-update.sh

# Run it manually
./scripts/trigger-snapshot-update.sh
```

Or use curl directly:

```bash
curl -X GET http://localhost:3000/api/cron/update-snapshot \
  -H "Authorization: Bearer mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure"
```

### 3. Initial Data Load

After migration, manually trigger the first snapshot:

```bash
./scripts/trigger-snapshot-update.sh
```

Or visit: `http://localhost:3000/api/cron/update-snapshot` with the auth header.

## Testing

1. **Check if snapshot exists:**
   ```sql
   SELECT * FROM live_snapshot ORDER BY updated_at DESC LIMIT 1;
   ```

2. **Trigger manual update:**
   ```bash
   ./scripts/trigger-snapshot-update.sh
   ```

3. **Check frontend:**
   - Visit: `http://localhost:3000/desk`
   - Should load instantly with data from the snapshot

## Environment Variables

Make sure these are set in `.env.local`:

```env
# Product Hunt API
PRODUCT_HUNT_API_TOKEN=your_token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key

# Cron authorization
CRON_SECRET=mp_cron_secret_2025_producthunt_analytics_tracker_v1_secure
```

## Monitoring

Check the logs to monitor the snapshot updates:

```bash
# Development
npm run dev

# Look for logs like:
# [Snapshot Job] Starting live data fetch...
# [Snapshot Job] Fetched 200 posts from Product Hunt API
# [Snapshot Job] Snapshot updated successfully with 200 launches
```

## Troubleshooting

**Frontend shows 0 launches:**
- Check if snapshot exists in database
- Manually trigger snapshot update
- Check browser console for errors

**Cron job failing:**
- Verify `CRON_SECRET` matches in both `.env.local` and cron headers
- Check Product Hunt API token is valid
- Review server logs for errors

**Rate limiting still occurring:**
- Ensure cron only runs every 5 minutes (not more frequently)
- Check that frontend is using `/api/today-launches` (database) not direct API calls
