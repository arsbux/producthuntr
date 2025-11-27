# Get Started Checklist

Use this checklist to implement the entity resolution system step by step.

## Phase 1: Setup (Day 1) ⏱️ 2-3 hours

### Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run `scripts/01-entity-resolution-schema.sql`
- [ ] Run `scripts/02-knowledge-graph-schema.sql`
- [ ] Run `scripts/03-signal-timeline-schema.sql`
- [ ] Verify tables created (should see 15+ new tables)
- [ ] Add canonical_id columns to existing tables:
  ```sql
  ALTER TABLE companies ADD COLUMN canonical_id UUID REFERENCES canonical_companies(id);
  ALTER TABLE people ADD COLUMN canonical_id UUID REFERENCES canonical_people(id);
  ```

### Dependencies
- [ ] Install tsx: `npm install tsx dotenv`
- [ ] Verify environment variables in `.env.local`
- [ ] Test database connection

### Data Migration
- [ ] Run: `npm run migrate:entities`
- [ ] Check for errors in console
- [ ] Verify canonical_companies has data
- [ ] Verify signal_events has data
- [ ] Check for duplicate warnings (expected)

### Initial Score Refresh
- [ ] Run: `npm run refresh-scores`
- [ ] Verify entity_scores table populated
- [ ] Check top scoring companies in database

### API Testing
- [ ] Start dev server: `npm run dev`
- [ ] Test entity resolution:
  ```bash
  curl -X POST http://localhost:3000/api/entities/resolve \
    -H "Content-Type: application/json" \
    -d '{"type":"company","name":"Test Co","website":"test.com"}'
  ```
- [ ] Test timeline endpoint (use a real canonical_id)
- [ ] Test score endpoint
- [ ] All endpoints return 200 OK

**✓ Checkpoint**: You should have canonical entities, signal events, and scores in your database.

---

## Phase 2: Integration (Day 2-3) ⏱️ 4-6 hours

### Update Sync Scripts

Pick your most important sync script first (e.g., Product Hunt):

- [ ] Import entity resolver:
  ```typescript
  import { resolveCompany } from '@/lib/entity-resolver';
  import { addSignalEvent } from '@/lib/signal-timeline';
  ```

- [ ] Replace company creation with resolution:
  ```typescript
  const canonicalId = await resolveCompany(
    data.name,
    data.website,
    'producthunt',
    data.id
  );
  ```

- [ ] Replace signal creation with event:
  ```typescript
  await addSignalEvent('company', canonicalId, 'launch', {
    eventDate: new Date(data.created_at),
    title: data.tagline,
    url: data.url,
    source: 'producthunt',
    sourceId: data.id,
    metadata: { votes: data.votes_count },
  });
  ```

- [ ] Test the updated sync script
- [ ] Verify no duplicates created
- [ ] Check timeline shows new events
- [ ] Repeat for other sync scripts

**✓ Checkpoint**: At least one sync script using entity resolution.

---

## Phase 3: Automation (Day 3) ⏱️ 1-2 hours

### Score Refresh Cron

- [ ] Create `app/api/cron/refresh-scores/route.ts`:
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

- [ ] Add CRON_SECRET to `.env.local`
- [ ] Add to `vercel.json`:
  ```json
  {
    "crons": [{
      "path": "/api/cron/refresh-scores",
      "schedule": "0 2 * * *"
    }]
  }
  ```

- [ ] Test cron endpoint locally
- [ ] Deploy to Vercel
- [ ] Verify cron runs (check Vercel logs)

**✓ Checkpoint**: Scores refresh automatically every day.

---

## Phase 4: UI Components (Day 4-5) ⏱️ 6-8 hours

### Timeline Component

- [ ] Create `components/EntityTimeline.tsx`
- [ ] Fetch timeline from API
- [ ] Display events chronologically
- [ ] Show impact scores
- [ ] Add source badges
- [ ] Style with Tailwind

### Score Display

- [ ] Create `components/EntityScore.tsx`
- [ ] Show impact score (0-100)
- [ ] Display trend indicator (↑↓→)
- [ ] Show score breakdown
- [ ] Add recommended action
- [ ] Color code by priority

### Integration

- [ ] Add timeline to company detail page
- [ ] Add score to company card
- [ ] Add timeline to person detail page
- [ ] Test on multiple entities
- [ ] Verify real-time updates

**✓ Checkpoint**: Users can see timelines and scores in the UI.

---

## Phase 5: New Data Sources (Week 2) ⏱️ 1-2 days each

### TechCrunch RSS (Priority 1)

- [ ] Install rss-parser: `npm install rss-parser`
- [ ] Create `lib/techcrunch-rss.ts`
- [ ] Parse RSS feed
- [ ] Extract funding announcements
- [ ] Use entity resolution
- [ ] Create signal events
- [ ] Create sync endpoint
- [ ] Test with recent articles
- [ ] Set up hourly sync

### AngelList/Wellfound (Priority 2)

- [ ] Create `lib/angellist.ts`
- [ ] Scrape company profiles (respect robots.txt)
- [ ] Extract job postings
- [ ] Detect growth roles
- [ ] Use entity resolution
- [ ] Create signal events
- [ ] Test with known companies
- [ ] Set up daily sync

### Additional Sources

- [ ] Twitter/X API (announcements)
- [ ] Crunchbase (funding data)
- [ ] LinkedIn (company size, jobs)
- [ ] GitHub releases (product updates)
- [ ] Reddit (community signals)

**✓ Checkpoint**: 3+ new data sources feeding into system.

---

## Phase 6: Alerts & Discovery (Week 3) ⏱️ 3-4 days

### Alert System

- [ ] Create `lib/alerts.ts`
- [ ] Define alert rules:
  ```typescript
  if (score >= 70 && trend === 'up' && recentFunding) {
    sendAlert('high', 'Prime partnership opportunity');
  }
  ```
- [ ] Email notifications (SendGrid/Resend)
- [ ] Slack webhooks
- [ ] User alert preferences
- [ ] Alert history

### Cohort Detection

- [ ] Create cohort query functions
- [ ] "Fintech + recent funding + hiring"
- [ ] "YC companies + high score"
- [ ] "SF Bay Area + Series A"
- [ ] Save cohort queries
- [ ] Export cohort results

### Search Improvements

- [ ] Add score-based sorting
- [ ] Filter by trend (up/down/stable)
- [ ] Filter by recent activity
- [ ] Filter by signal types
- [ ] Saved searches

**✓ Checkpoint**: Automated alerts and powerful cohort detection.

---

## Phase 7: Monetization (Week 4) ⏱️ 4-5 days

### Pricing Tiers

- [ ] Define tiers (Free, Pro, Enterprise)
- [ ] Set usage limits
- [ ] Create pricing page

### Stripe Integration

- [ ] Install Stripe: `npm install stripe`
- [ ] Create Stripe products
- [ ] Create checkout flow
- [ ] Handle webhooks
- [ ] Update user subscriptions
- [ ] Enforce usage limits

### API Access

- [ ] Generate API keys
- [ ] Add authentication middleware
- [ ] Rate limiting
- [ ] Usage tracking
- [ ] API documentation

### Exports

- [ ] CSV export
- [ ] Airtable integration
- [ ] Notion integration
- [ ] Webhook delivery

**✓ Checkpoint**: Live payment system and tiered access.

---

## Verification Checklist

Run these queries to verify everything is working:

```sql
-- 1. Entity resolution working
SELECT 
  COUNT(DISTINCT canonical_company_id) as unique_companies,
  COUNT(*) as total_aliases,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT canonical_company_id), 2) as ratio
FROM company_aliases;
-- Ratio should be 3-5 (multiple aliases per company)

-- 2. Signals flowing in
SELECT 
  DATE(event_date) as date,
  COUNT(*) as events,
  COUNT(DISTINCT entity_id) as unique_entities
FROM signal_events
WHERE event_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(event_date)
ORDER BY date DESC;
-- Should see events every day

-- 3. Scores being calculated
SELECT 
  COUNT(*) as scored_entities,
  AVG(impact_score) as avg_score,
  MAX(calculated_at) as last_refresh
FROM entity_scores;
-- last_refresh should be recent

-- 4. Relationships extracted
SELECT 
  relationship_type,
  COUNT(*) as count
FROM entity_relationships
GROUP BY relationship_type
ORDER BY count DESC;
-- Should see FOUNDED_BY, EMPLOYED_BY, etc.

-- 5. Top performers
SELECT 
  cc.canonical_name,
  es.impact_score,
  es.trend_7d,
  es.recent_signals_7d
FROM entity_scores es
JOIN canonical_companies cc ON cc.id = es.entity_id
WHERE es.entity_type = 'company'
ORDER BY es.impact_score DESC
LIMIT 10;
-- Should see companies with high scores
```

---

## Success Metrics

Track these to measure success:

### Technical Metrics
- [ ] Entity resolution accuracy > 95%
- [ ] Duplicate rate < 5%
- [ ] API response time < 200ms (p95)
- [ ] Score refresh time < 5 min
- [ ] Zero data loss

### Data Metrics
- [ ] 10,000+ canonical companies
- [ ] 100+ new signals per day
- [ ] 5+ data sources integrated
- [ ] 1,000+ relationships mapped

### Business Metrics
- [ ] 50+ daily active users
- [ ] 100+ searches per day
- [ ] 10+ alerts triggered per day
- [ ] 5% free → paid conversion

---

## Troubleshooting

### Common Issues

**"Cannot find module '@/lib/entity-resolver'"**
- Check tsconfig.json has path aliases
- Restart dev server

**"Duplicate key violation"**
- Normal during migration
- Script handles it automatically

**"Scores are all 0"**
- Run: `npm run refresh-scores`
- Check signal_events has data

**"Timeline is empty"**
- Verify signal_events table populated
- Check canonical_id is correct
- Re-run migration if needed

**"API returns 500"**
- Check Supabase connection
- Verify environment variables
- Check server logs

---

## Resources

- **Setup**: `START_ENTITY_RESOLUTION.md`
- **Integration**: `INTEGRATION_EXAMPLE.md`
- **Roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Architecture**: `SYSTEM_FLOW.md`
- **Overview**: `ENTITY_SYSTEM_OVERVIEW.md`

---

## Next Actions (Right Now)

1. [ ] Run database migrations (30 min)
2. [ ] Run data migration (30 min)
3. [ ] Test API endpoints (15 min)
4. [ ] Update one sync script (1 hour)
5. [ ] Build timeline component (2 hours)

**Start here**: Open `START_ENTITY_RESOLUTION.md` and follow the 30-minute quick start.

---

## Questions?

Before you start, make sure you understand:

- [ ] What entity resolution does (deduplication)
- [ ] How knowledge graph works (relationships)
- [ ] What signal timeline provides (time-series)
- [ ] How scoring works (0-100 impact score)
- [ ] Why this matters (actionable intelligence)

If unclear, read `ENTITY_SYSTEM_OVERVIEW.md` first.

---

## Celebrate Milestones 🎉

- ✓ Database migrated
- ✓ First entity resolved
- ✓ First timeline displayed
- ✓ First alert triggered
- ✓ First paying customer
- ✓ 10,000 entities tracked
- ✓ 100,000 signals processed
- ✓ $10k MRR achieved

You've got this! Start with Phase 1 and work through systematically.
