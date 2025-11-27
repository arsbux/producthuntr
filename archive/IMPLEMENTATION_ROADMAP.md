# Implementation Roadmap: Entity Resolution → Knowledge Graph → Monetization

## Phase 1: Foundation (Week 1) ✓ READY TO START

### Entity Resolution & Canonicalization
- [x] Database schema created
- [x] Entity resolver library built
- [x] API endpoints created
- [ ] Run migrations on production
- [ ] Migrate existing data
- [ ] Test deduplication accuracy

**Deliverable**: All companies and people deduplicated with canonical IDs

---

## Phase 2: Knowledge Graph (Week 1-2)

### Graph Infrastructure
- [x] Relationship tables created
- [x] Graph query functions built
- [x] API endpoints for relationships
- [ ] Extract relationships from existing data
- [ ] Build graph visualization component
- [ ] Add relationship management UI

**Deliverable**: Working knowledge graph with founder, employee, investor relationships

---

## Phase 3: Signal Timeline & Scoring (Week 2)

### Timeline & Scoring System
- [x] Signal events table created
- [x] Scoring algorithm implemented
- [x] Timeline API endpoints
- [ ] Migrate existing signals to timeline
- [ ] Set up automated score refresh
- [ ] Build timeline UI component
- [ ] Add score breakdown visualization

**Deliverable**: Every entity has impact score and timeline view

---

## Phase 4: Coverage Expansion (Week 2-3)

### Add Free Data Sources

Priority order (ranked by impact):

1. **Tech Press RSS** (2-3 days)
   - TechCrunch, VentureBeat, The Verge
   - Parse for funding announcements
   - Extract company names and amounts
   - Create: `lib/rss-feeds.ts`, `app/api/rss/sync/route.ts`

2. **AngelList/Wellfound** (2-3 days)
   - Scrape company profiles
   - Job postings for hiring signals
   - Growth role detection
   - Create: `lib/angellist.ts`, `app/api/angellist/sync/route.ts`

3. **Crunchbase (free tier)** (1-2 days)
   - Funding data
   - Investor relationships
   - Company metadata
   - Create: `lib/crunchbase.ts`

4. **LinkedIn (careful scraping)** (2-3 days)
   - Company size changes
   - Job postings
   - Employee movements
   - Create: `lib/linkedin.ts`

5. **Twitter/X API** (1-2 days)
   - Company announcements
   - Founder tweets
   - Launch signals
   - Create: `lib/twitter.ts`

**Deliverable**: 5+ new data sources feeding into entity resolution

---

## Phase 5: Alerts & Cohort Detection (Week 3-4)

### Smart Alerts
- [ ] Alert rules engine
- [ ] Cohort detection queries
- [ ] Email notification system
- [ ] Slack/Discord webhooks
- [ ] User alert preferences

**Example Rules**:
```typescript
// High-priority alert
if (
  hasFundingInLast90Days &&
  isHiringGrowthRoles &&
  hasProductLaunch
) {
  sendAlert('high', 'Prime partnership opportunity');
}

// Cohort detection
findCompanies({
  vertical: 'fintech',
  fundingInLast90Days: true,
  hiringGrowthRoles: true,
  location: 'SF Bay Area',
});
```

**Deliverable**: Automated alerts for high-value opportunities

---

## Phase 6: Search & Discovery UX (Week 4)

### Advanced Search
- [ ] Semantic search with embeddings
- [ ] Structured filters (stage, tech, topics, region)
- [ ] Saved searches
- [ ] Watchlists
- [ ] Shared boards for teams

**Deliverable**: Powerful search and discovery interface

---

## Phase 7: Exports & API (Week 4-5)

### Data Access
- [ ] CSV export
- [ ] Airtable integration
- [ ] Notion integration
- [ ] REST API with authentication
- [ ] API documentation
- [ ] Rate limiting

**Deliverable**: Multiple ways to access and export data

---

## Phase 8: Monetization (Week 5-6)

### Pricing Tiers

**Free Tier**
- 10 searches/day
- Basic filters
- View top 50 companies

**Pro ($500/mo)**
- Unlimited searches
- All filters
- Custom alerts
- CSV export
- 2hr analyst support/month

**Enterprise ($2000+/mo)**
- API access
- Airtable/Notion sync
- Custom reports
- Dedicated analyst
- White-label option

### Implementation
- [ ] Stripe integration
- [ ] Usage tracking
- [ ] Subscription management
- [ ] Billing portal
- [ ] Usage limits enforcement

**Deliverable**: Live payment system and tiered access

---

## Phase 9: Quality Feedback Loop (Week 6)

### ML Improvements
- [ ] User feedback collection (acted/irrelevant)
- [ ] Feedback → scoring model
- [ ] A/B test scoring algorithms
- [ ] Confidence score improvements
- [ ] Source weight tuning

**Deliverable**: Self-improving scoring system

---

## Quick Wins (Do These First)

### Week 1 Quick Wins
1. **Run entity resolution on existing data** (1 day)
   - Immediate deduplication
   - Clean up your database

2. **Add TechCrunch RSS** (1 day)
   - High-quality funding signals
   - Easy to implement

3. **Build timeline view** (1 day)
   - Show value immediately
   - Great for demos

4. **Set up score refresh cron** (2 hours)
   - Automated scoring
   - No manual work

### Week 2 Quick Wins
1. **Add AngelList scraping** (2 days)
   - Hiring signals
   - Company profiles

2. **Build alert system** (2 days)
   - Email on high scores
   - Immediate value

3. **Create cohort queries** (1 day)
   - "Show me all fintech with recent funding"
   - Sellable feature

---

## Success Metrics

### Technical Metrics
- Entity resolution accuracy: >95%
- Duplicate rate: <5%
- Score refresh time: <5 min for all entities
- API response time: <200ms p95

### Business Metrics
- Data coverage: 10,000+ companies
- Signal velocity: 100+ new signals/day
- User engagement: 50+ searches/day
- Conversion rate: 5% free → paid

---

## Resource Requirements

### Development Time
- Phase 1-3 (Foundation): 2 weeks
- Phase 4 (Coverage): 1 week
- Phase 5-7 (Features): 2 weeks
- Phase 8-9 (Monetization): 2 weeks
- **Total**: 7 weeks for MVP

### Infrastructure
- Supabase: $25/mo (Pro plan)
- Vercel: $20/mo (Pro plan)
- Anthropic API: ~$50/mo
- RSS/scraping: Free
- **Total**: ~$100/mo

---

## Next Actions (Start Today)

1. **Run database migrations** (30 min)
   ```bash
   psql $DATABASE_URL < scripts/01-entity-resolution-schema.sql
   psql $DATABASE_URL < scripts/02-knowledge-graph-schema.sql
   psql $DATABASE_URL < scripts/03-signal-timeline-schema.sql
   ```

2. **Migrate existing data** (1 hour)
   ```bash
   npm run migrate:entities
   ```

3. **Test entity resolution** (30 min)
   ```bash
   curl -X POST http://localhost:3000/api/entities/resolve \
     -H "Content-Type: application/json" \
     -d '{"type":"company","name":"Stripe","website":"stripe.com"}'
   ```

4. **Build timeline UI** (2 hours)
   - Create `components/EntityTimeline.tsx`
   - Show on company detail pages

5. **Add TechCrunch RSS** (2 hours)
   - Create `lib/techcrunch-rss.ts`
   - Parse for funding announcements
   - Run sync every hour

---

## Questions to Answer

Before starting, clarify:

1. **Data sources**: Which sources are highest priority for your use case?
2. **Target customers**: VCs? Sales teams? Recruiters?
3. **Pricing**: What can your target customers afford?
4. **Competition**: Who else is doing this? What's your edge?
5. **Legal**: Any scraping/data usage concerns?

---

## Support

If you need help:
- Check `ENTITY_RESOLUTION_SETUP.md` for detailed setup
- Review code in `lib/entity-resolver.ts`, `lib/knowledge-graph.ts`
- Test APIs in `app/api/entities/` and `app/api/graph/`
- Ask questions about specific implementation details
