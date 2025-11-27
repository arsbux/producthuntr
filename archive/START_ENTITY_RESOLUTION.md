# Quick Start: Entity Resolution System

Get the entity resolution, knowledge graph, and signal timeline running in 30 minutes.

## Prerequisites

- Supabase project set up
- Environment variables configured
- Existing data in `companies`, `people`, `signals` tables

## Step 1: Run Database Migrations (5 min)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project → SQL Editor
2. Create a new query
3. Copy/paste the content of `scripts/01-entity-resolution-schema.sql`
4. Click "Run"
5. Repeat for `scripts/02-knowledge-graph-schema.sql`
6. Repeat for `scripts/03-signal-timeline-schema.sql`

### Option B: Via Command Line

```bash
# Set your database URL
export DATABASE_URL="postgresql://..."

# Run migrations
psql $DATABASE_URL -f scripts/01-entity-resolution-schema.sql
psql $DATABASE_URL -f scripts/02-knowledge-graph-schema.sql
psql $DATABASE_URL -f scripts/03-signal-timeline-schema.sql
```

### Verify

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'canonical_companies',
    'canonical_people',
    'company_aliases',
    'signal_events',
    'entity_relationships'
  );
```

Should return 5 rows.

## Step 2: Add Canonical ID Columns (2 min)

Run this in Supabase SQL Editor:

```sql
-- Add canonical_id to existing tables
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS canonical_id UUID 
REFERENCES canonical_companies(id);

ALTER TABLE people 
ADD COLUMN IF NOT EXISTS canonical_id UUID 
REFERENCES canonical_people(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_companies_canonical 
ON companies(canonical_id);

CREATE INDEX IF NOT EXISTS idx_people_canonical 
ON people(canonical_id);
```

## Step 3: Install Dependencies (1 min)

```bash
npm install tsx dotenv
```

## Step 4: Migrate Existing Data (10 min)

```bash
# Run migration script
npm run migrate:entities
```

This will:
- Deduplicate all companies
- Deduplicate all people
- Convert signals to timeline events
- Extract relationships

**Watch for**:
- Duplicate warnings (expected)
- Error messages (investigate)
- Progress updates

## Step 5: Test the System (5 min)

### Test Entity Resolution

```bash
curl -X POST http://localhost:3000/api/entities/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "type": "company",
    "name": "Stripe",
    "website": "https://stripe.com",
    "source": "test"
  }'
```

Should return: `{"canonicalId":"..."}`

### Test Timeline

```bash
# Replace {id} with a canonical company ID
curl "http://localhost:3000/api/entities/timeline?entityType=company&entityId={id}&grouped=true"
```

Should return timeline events.

### Test Scoring

```bash
# Replace {id} with a canonical company ID
curl "http://localhost:3000/api/entities/score?entityType=company&entityId={id}"
```

Should return impact score and breakdown.

## Step 6: Refresh Scores (2 min)

```bash
npm run refresh-scores
```

This calculates impact scores for all entities with recent activity.

## Step 7: Verify in Database (5 min)

```sql
-- Check canonical entities
SELECT COUNT(*) FROM canonical_companies;
SELECT COUNT(*) FROM canonical_people;

-- Check aliases (should be more than canonical entities)
SELECT COUNT(*) FROM company_aliases;
SELECT COUNT(*) FROM person_aliases;

-- Check signal events
SELECT COUNT(*) FROM signal_events;

-- Check scores
SELECT COUNT(*) FROM entity_scores;

-- View top scoring companies
SELECT 
  cc.canonical_name,
  es.impact_score,
  es.trend_7d,
  es.recent_signals_7d,
  es.recommended_action
FROM entity_scores es
JOIN canonical_companies cc ON cc.id = es.entity_id
WHERE es.entity_type = 'company'
ORDER BY es.impact_score DESC
LIMIT 10;
```

## Common Issues

### Issue: Migration script fails with "Cannot find module"

**Fix**: Make sure you're using `tsx` not `ts-node`:
```bash
npm install tsx
npm run migrate:entities
```

### Issue: "relation does not exist"

**Fix**: Run the SQL migrations first (Step 1)

### Issue: Duplicate key violations

**Fix**: This is normal during migration. The script handles it.

### Issue: Scores are all 0

**Fix**: Run the score refresh:
```bash
npm run refresh-scores
```

### Issue: No timeline events

**Fix**: Check signal_events table:
```sql
SELECT COUNT(*) FROM signal_events;
```

If 0, re-run migration.

## Next Steps

### 1. Update Sync Scripts (30 min)

Pick one sync script to update first (e.g., Product Hunt):

```typescript
// lib/producthunt.ts
import { resolveCompany } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';

// Replace old company creation with:
const canonicalId = await resolveCompany(
  post.name,
  post.website,
  'producthunt',
  post.id
);

// Replace old signal creation with:
await addSignalEvent('company', canonicalId, 'launch', {
  eventDate: new Date(post.created_at),
  title: post.tagline,
  url: post.url,
  source: 'producthunt',
  sourceId: post.id,
  metadata: { votes: post.votes_count },
});
```

See `INTEGRATION_EXAMPLE.md` for full examples.

### 2. Set Up Automated Score Refresh (10 min)

Create `app/api/cron/refresh-scores/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { refreshAllScores } from '@/lib/signal-timeline';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await refreshAllScores();
  return NextResponse.json({ success: true, refreshed: count });
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/refresh-scores",
    "schedule": "0 2 * * *"
  }]
}
```

### 3. Build Timeline UI (1 hour)

Create `components/EntityTimeline.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';

export function EntityTimeline({ 
  entityType, 
  entityId 
}: { 
  entityType: 'company' | 'person'; 
  entityId: string;
}) {
  const [timeline, setTimeline] = useState([]);
  
  useEffect(() => {
    fetch(`/api/entities/timeline?entityType=${entityType}&entityId=${entityId}&grouped=true`)
      .then(r => r.json())
      .then(data => setTimeline(data.timeline));
  }, [entityType, entityId]);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Timeline</h2>
      {timeline.map((day: any) => (
        <div key={day.date} className="border-l-2 border-blue-500 pl-4">
          <div className="text-sm text-gray-500">{day.date}</div>
          {day.events.map((event: any) => (
            <div key={event.id} className="mt-2">
              <div className="font-medium">{event.title}</div>
              <div className="text-sm text-gray-600">{event.description}</div>
              <div className="text-xs text-gray-400">
                Impact: {Math.round(event.impact_score * 100)}% • {event.source}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

Use in company detail page:

```typescript
// app/(user)/desk/companies/[id]/page.tsx
import { EntityTimeline } from '@/components/EntityTimeline';

export default function CompanyPage({ params }: { params: { id: string } }) {
  return (
    <div>
      {/* Existing company info */}
      
      <EntityTimeline entityType="company" entityId={params.id} />
    </div>
  );
}
```

### 4. Add New Data Sources (ongoing)

See `IMPLEMENTATION_ROADMAP.md` for priority order.

Start with TechCrunch RSS (easiest, high value):

```typescript
// lib/techcrunch-rss.ts
import Parser from 'rss-parser';
import { resolveCompany } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';

const parser = new Parser();

export async function syncTechCrunchRSS() {
  const feed = await parser.parseURL('https://techcrunch.com/feed/');
  
  for (const item of feed.items) {
    // Parse for funding announcements
    if (item.title?.toLowerCase().includes('raises') || 
        item.title?.toLowerCase().includes('funding')) {
      
      // Extract company name (simple regex)
      const match = item.title.match(/^([^raises]+) raises/i);
      if (!match) continue;
      
      const companyName = match[1].trim();
      
      // Resolve company
      const canonicalId = await resolveCompany(
        companyName,
        undefined,
        'techcrunch',
        item.guid
      );
      
      // Add signal
      await addSignalEvent('company', canonicalId, 'funding', {
        eventDate: new Date(item.pubDate || Date.now()),
        title: item.title,
        description: item.contentSnippet,
        url: item.link,
        impactScore: 0.85, // TechCrunch is high quality
        source: 'techcrunch',
        sourceId: item.guid,
      });
    }
  }
}
```

## Success Checklist

- [ ] All 3 SQL migrations ran successfully
- [ ] Canonical companies table has data
- [ ] Signal events table has data
- [ ] Entity scores table has data
- [ ] API endpoints return data
- [ ] No duplicate companies in canonical table
- [ ] Timeline shows events chronologically
- [ ] Scores are non-zero for active companies
- [ ] At least one sync script updated
- [ ] Score refresh cron job set up

## Getting Help

If stuck:
1. Check `ENTITY_RESOLUTION_SETUP.md` for detailed docs
2. Review `INTEGRATION_EXAMPLE.md` for code examples
3. Check database logs in Supabase
4. Verify environment variables are set
5. Test API endpoints with curl

## What You've Built

After completing this quick start, you have:

✓ **Entity Resolution**: Deduplicates companies/people across sources
✓ **Knowledge Graph**: Tracks relationships between entities
✓ **Signal Timeline**: Time-series view of all signals
✓ **Impact Scoring**: Automated scoring with explainability
✓ **APIs**: RESTful endpoints for all features

This is the foundation for:
- Advanced search and discovery
- Automated alerts
- Cohort detection
- Data exports
- Monetization

See `IMPLEMENTATION_ROADMAP.md` for next steps.
