# Entity Resolution & Knowledge Graph Setup

This guide walks you through setting up the entity resolution, knowledge graph, and signal timeline infrastructure.

## Overview

The new system provides:

1. **Entity Resolution**: Deduplicates companies and people across all data sources
2. **Knowledge Graph**: Models relationships (founded by, invested in, hired, etc.)
3. **Signal Timeline**: Time-series tracking of all signals per entity
4. **Impact Scoring**: Automated scoring with explainability

## Setup Steps

### 1. Run Database Migrations

Execute the SQL scripts in order:

```bash
# Connect to your Supabase database
psql $DATABASE_URL

# Run migrations
\i scripts/01-entity-resolution-schema.sql
\i scripts/02-knowledge-graph-schema.sql
\i scripts/03-signal-timeline-schema.sql
```

Or via Supabase dashboard:
1. Go to SQL Editor
2. Copy/paste each script
3. Run them in order

### 2. Add Canonical ID Columns to Existing Tables

```sql
-- Add canonical_id to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS canonical_id UUID REFERENCES canonical_companies(id);
CREATE INDEX IF NOT EXISTS idx_companies_canonical ON companies(canonical_id);

-- Add canonical_id to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS canonical_id UUID REFERENCES canonical_people(id);
CREATE INDEX IF NOT EXISTS idx_people_canonical ON people(canonical_id);
```

### 3. Migrate Existing Data

Run the migration script to move your existing data into the new system:

```bash
npm run migrate:entities
```

Add this to your `package.json`:

```json
{
  "scripts": {
    "migrate:entities": "tsx scripts/04-migrate-existing-data.ts",
    "refresh-scores": "tsx scripts/refresh-all-scores.ts"
  }
}
```

### 4. Set Up Automated Score Refresh

Create a cron job or use Vercel Cron to refresh scores daily:

```typescript
// app/api/cron/refresh-scores/route.ts
import { NextResponse } from 'next/server';
import { refreshAllScores } from '@/lib/signal-timeline';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const count = await refreshAllScores();
  
  return NextResponse.json({ 
    success: true, 
    refreshed: count 
  });
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

## Usage Examples

### Resolve a Company

```typescript
import { resolveCompany } from '@/lib/entity-resolver';

const canonicalId = await resolveCompany(
  'Acme Inc',
  'https://acme.com',
  'producthunt',
  'ph_12345'
);
```

### Add a Signal Event

```typescript
import { addSignalEvent } from '@/lib/signal-timeline';

await addSignalEvent(
  'company',
  canonicalId,
  'funding',
  {
    eventDate: new Date(),
    title: 'Acme raises $10M Series A',
    description: 'Led by Sequoia Capital',
    url: 'https://techcrunch.com/...',
    impactScore: 0.9,
    source: 'techcrunch',
    metadata: {
      amount_usd: 10000000,
      round_type: 'series_a',
    },
  }
);
```

### Get Entity Timeline

```typescript
import { getEntityTimeline } from '@/lib/signal-timeline';

const timeline = await getEntityTimeline(
  'company',
  canonicalId,
  {
    startDate: new Date('2024-01-01'),
    limit: 50,
  }
);
```

### Add Relationships

```typescript
import { addCompanyFounder } from '@/lib/knowledge-graph';

await addCompanyFounder(
  companyId,
  personId,
  {
    title: 'CEO & Co-founder',
    startedAt: new Date('2020-01-01'),
    source: 'yc',
    confidence: 0.9,
  }
);
```

### Get Impact Score

```typescript
import { refreshEntityScore } from '@/lib/signal-timeline';

const score = await refreshEntityScore('company', canonicalId);

console.log(`Impact Score: ${score.impact_score}/100`);
console.log(`Trend (7d): ${score.trend_7d}`);
console.log(`Action: ${score.recommended_action}`);
```

## API Endpoints

### Resolve Entity
```
POST /api/entities/resolve
Body: { type: 'company', name: 'Acme', website: 'acme.com' }
```

### Get Timeline
```
GET /api/entities/timeline?entityType=company&entityId=xxx&grouped=true
```

### Get Score
```
GET /api/entities/score?entityType=company&entityId=xxx
POST /api/entities/score (to refresh)
```

### Get Top Scoring
```
GET /api/entities/score?entityType=company&top=50
```

### Get Relationships
```
GET /api/graph/relationships?entityType=company&entityId=xxx&type=founders
```

## Integration with Existing Sync Scripts

Update your sync scripts to use entity resolution:

```typescript
// In lib/producthunt.ts or similar
import { resolveCompany } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';

async function syncProductHunt() {
  const posts = await fetchPosts();
  
  for (const post of posts) {
    // Resolve company
    const canonicalId = await resolveCompany(
      post.name,
      post.website,
      'producthunt',
      post.id
    );
    
    // Add signal event
    await addSignalEvent(
      'company',
      canonicalId,
      'launch',
      {
        eventDate: new Date(post.created_at),
        title: post.tagline,
        url: post.url,
        source: 'producthunt',
        sourceId: post.id,
        metadata: {
          votes: post.votes_count,
          comments: post.comments_count,
        },
      }
    );
  }
}
```

## Next Steps

1. **Run migrations** ✓
2. **Migrate existing data** ✓
3. **Update sync scripts** to use entity resolution
4. **Set up score refresh cron**
5. **Build UI components** for timeline and graph views
6. **Add data sources** (RSS feeds, AngelList, etc.)
7. **Implement alerts** based on scores and cohorts

## Monitoring

Check migration status:

```sql
-- Count canonical entities
SELECT 
  (SELECT COUNT(*) FROM canonical_companies) as companies,
  (SELECT COUNT(*) FROM canonical_people) as people,
  (SELECT COUNT(*) FROM signal_events) as events,
  (SELECT COUNT(*) FROM entity_relationships) as relationships;

-- Top scoring companies
SELECT 
  cc.canonical_name,
  es.impact_score,
  es.trend_7d,
  es.recommended_action
FROM entity_scores es
JOIN canonical_companies cc ON cc.id = es.entity_id
WHERE es.entity_type = 'company'
ORDER BY es.impact_score DESC
LIMIT 20;
```

## Troubleshooting

**Issue**: Duplicate entities still appearing
- Run deduplication: Check aliases table and merge manually if needed
- Adjust similarity threshold in `entity-resolver.ts`

**Issue**: Scores not updating
- Check cron job is running
- Manually trigger: `POST /api/entities/score`
- Verify signal events are being created

**Issue**: Relationships not showing
- Verify foreign keys are correct
- Check relationship type matches enum
- Run relationship extraction script again
