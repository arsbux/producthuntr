# System Flow: From Raw Data to Actionable Intelligence

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAW DATA SOURCES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Product Hunt    HackerNews    GitHub    Y Combinator    Reddit     │
│      │               │            │            │            │        │
│      │               │            │            │            │        │
│      ▼               ▼            ▼            ▼            ▼        │
│  ┌────────┐     ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │
│  │ Sync   │     │ Sync   │  │ Sync   │  │ Sync   │  │ Sync   │    │
│  │ Script │     │ Script │  │ Script │  │ Script │  │ Script │    │
│  └───┬────┘     └───┬────┘  └───┬────┘  └───┬────┘  └───┬────┘    │
│      │              │           │           │           │           │
└──────┼──────────────┼───────────┼───────────┼───────────┼───────────┘
       │              │           │           │           │
       └──────────────┴───────────┴───────────┴───────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITY RESOLUTION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Input: "Stripe", "stripe", "Stripe Inc", "stripe.com"             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 1. Check domain match (stripe.com)                       │      │
│  │ 2. Check alias table                                     │      │
│  │ 3. Fuzzy name matching (Levenshtein distance)           │      │
│  │ 4. Create canonical entity if new                        │      │
│  │ 5. Add alias reference                                   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Output: canonical_id = "550e8400-e29b-41d4-a716-446655440000"     │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CANONICAL ENTITIES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐         ┌─────────────────────┐           │
│  │ canonical_companies │         │  canonical_people   │           │
│  ├─────────────────────┤         ├─────────────────────┤           │
│  │ id (UUID)           │         │ id (UUID)           │           │
│  │ canonical_name      │         │ canonical_name      │           │
│  │ domain              │         │ email               │           │
│  │ confidence_score    │         │ current_company_id  │           │
│  └─────────────────────┘         └─────────────────────┘           │
│           │                                   │                     │
│           │                                   │                     │
│  ┌────────▼────────┐                 ┌────────▼────────┐           │
│  │ company_aliases │                 │ person_aliases  │           │
│  ├─────────────────┤                 ├─────────────────┤           │
│  │ "Stripe"        │                 │ "John Doe"      │           │
│  │ "stripe"        │                 │ "J. Doe"        │           │
│  │ "Stripe Inc"    │                 │ "john@co.com"   │           │
│  │ "stripe.com"    │                 │ "@johndoe"      │           │
│  └─────────────────┘                 └─────────────────┘           │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE GRAPH                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│     ┌─────────┐                                                     │
│     │ Person  │                                                     │
│     │ (Alice) │                                                     │
│     └────┬────┘                                                     │
│          │ FOUNDED_BY                                               │
│          ▼                                                           │
│     ┌─────────┐         INVESTED_IN        ┌──────────┐            │
│     │ Company │◄──────────────────────────│ Investor │            │
│     │ (Acme)  │                            │ (VC Firm)│            │
│     └────┬────┘                            └──────────┘            │
│          │ HIRED                                                    │
│          ▼                                                           │
│     ┌─────────┐                                                     │
│     │ Person  │                                                     │
│     │  (Bob)  │                                                     │
│     └─────────┘                                                     │
│                                                                      │
│  Tables:                                                             │
│  • entity_relationships (generic edges)                             │
│  • company_person_relationships (optimized)                         │
│  • funding_rounds                                                   │
│  • investors                                                        │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SIGNAL TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Company: Acme Inc (canonical_id: xxx)                              │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ 2024-01-15 │ Product Launch on Product Hunt              │      │
│  │            │ Impact: 0.7 │ Source: producthunt           │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ 2024-01-20 │ Trending on HackerNews                      │      │
│  │            │ Impact: 0.6 │ Source: hackernews            │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ 2024-02-01 │ Raises $10M Series A                        │      │
│  │            │ Impact: 0.9 │ Source: techcrunch            │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ 2024-02-05 │ Hiring 5 growth roles                       │      │
│  │            │ Impact: 0.5 │ Source: angellist             │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │ 2024-02-10 │ Featured in TechCrunch                      │      │
│  │            │ Impact: 0.8 │ Source: techcrunch            │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Table: signal_events                                                │
│  • Time-series storage                                              │
│  • Deduplication via content_hash                                   │
│  • Rich metadata per source                                         │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    IMPACT SCORING ENGINE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Input: All signal_events for entity                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Score Components:                                         │      │
│  │                                                           │      │
│  │ 1. Recency (25%)                                         │      │
│  │    • Signals in last 7 days: 3                           │      │
│  │    • Avg impact: 0.75                                    │      │
│  │    → Score: 87/100                                       │      │
│  │                                                           │      │
│  │ 2. Velocity (25%)                                        │      │
│  │    • 7-day velocity: 0.43 signals/day                    │      │
│  │    • 30-day velocity: 0.17 signals/day                   │      │
│  │    • Acceleration: 2.5x                                  │      │
│  │    → Score: 100/100                                      │      │
│  │                                                           │      │
│  │ 3. Source Weight (30%)                                   │      │
│  │    • TechCrunch: 1.0                                     │      │
│  │    • Product Hunt: 0.7                                   │      │
│  │    • HackerNews: 0.6                                     │      │
│  │    → Weighted avg: 0.77                                  │      │
│  │    → Score: 77/100                                       │      │
│  │                                                           │      │
│  │ 4. Signal Quality (20%)                                  │      │
│  │    • Avg confidence: 0.8                                 │      │
│  │    • Avg impact: 0.7                                     │      │
│  │    → Score: 74/100                                       │      │
│  │                                                           │      │
│  │ Overall Impact Score: 85/100                             │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
│  Output:                                                             │
│  • impact_score: 85                                                 │
│  • trend_7d: "up"                                                   │
│  • trend_30d: "up"                                                  │
│  • recommended_action: "High activity. Research immediately."       │
│  • action_priority: "high"                                          │
│                                                                      │
│  Table: entity_scores                                                │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API & UI LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ GET /timeline   │  │ GET /score      │  │ GET /graph      │    │
│  │                 │  │                 │  │                 │    │
│  │ Returns:        │  │ Returns:        │  │ Returns:        │    │
│  │ • Events by date│  │ • Impact score  │  │ • Relationships │    │
│  │ • Impact scores │  │ • Trend         │  │ • Founders      │    │
│  │ • Source links  │  │ • Action        │  │ • Investors     │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    UI Components                          │      │
│  │                                                           │      │
│  │  • Timeline View (chronological events)                  │      │
│  │  • Score Dashboard (impact breakdown)                    │      │
│  │  • Graph Visualization (relationships)                   │      │
│  │  • Search & Filters (semantic + structured)              │      │
│  │  • Alert Management (rules & notifications)              │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSINESS INTELLIGENCE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Use Cases:                                                          │
│                                                                      │
│  1. Partnership Opportunities                                        │
│     → Find companies with score > 70 + recent funding               │
│                                                                      │
│  2. Competitive Intelligence                                         │
│     → Track competitor signals and relationships                     │
│                                                                      │
│  3. Investment Sourcing                                              │
│     → Identify high-growth startups before Series A                 │
│                                                                      │
│  4. Sales Prospecting                                                │
│     → Target companies hiring growth roles                           │
│                                                                      │
│  5. Market Research                                                  │
│     → Analyze trends by vertical/geography                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Example: Complete Flow for Product Hunt Signal

```
1. RAW DATA
   ─────────
   Product Hunt API returns:
   {
     "name": "stripe",
     "tagline": "Online payment processing",
     "website": "https://www.stripe.com",
     "votes_count": 1234,
     "makers": [{"name": "Patrick Collison"}]
   }

2. ENTITY RESOLUTION
   ──────────────────
   resolveCompany("stripe", "https://www.stripe.com", "producthunt", "ph_123")
   
   → Checks domain: "stripe.com" exists
   → Returns: canonical_id = "550e8400-..."
   → Adds alias: "stripe" → canonical_id

3. SIGNAL EVENT
   ─────────────
   addSignalEvent("company", canonical_id, "launch", {
     eventDate: "2024-02-15",
     title: "Online payment processing",
     impactScore: 0.7,
     metadata: { votes: 1234 }
   })
   
   → Creates signal_events row
   → Triggers score refresh

4. RELATIONSHIP EXTRACTION
   ────────────────────────
   resolvePerson("Patrick Collison", null, canonical_id, "producthunt")
   → Returns: person_id = "660e8400-..."
   
   addCompanyFounder(canonical_id, person_id, {...})
   → Creates entity_relationships row
   → Creates company_person_relationships row

5. SCORE CALCULATION
   ──────────────────
   refreshEntityScore("company", canonical_id)
   
   → Fetches all signal_events for entity
   → Calculates recency: 87/100
   → Calculates velocity: 100/100
   → Calculates source weight: 77/100
   → Calculates quality: 74/100
   → Overall: 85/100
   → Trend: "up"
   → Action: "High activity. Research immediately."

6. API RESPONSE
   ────────────
   GET /api/entities/timeline?entityType=company&entityId=550e8400-...
   
   Returns:
   {
     "timeline": [
       {
         "date": "2024-02-15",
         "events": [
           {
             "title": "Online payment processing",
             "impact_score": 0.7,
             "source": "producthunt",
             "url": "..."
           }
         ]
       }
     ]
   }

7. UI DISPLAY
   ──────────
   <EntityTimeline entityId="550e8400-..." />
   
   Renders:
   ┌─────────────────────────────────────┐
   │ Timeline                            │
   ├─────────────────────────────────────┤
   │ Feb 15, 2024                        │
   │ ● Online payment processing         │
   │   Impact: 70% • Product Hunt        │
   │   1,234 votes                       │
   └─────────────────────────────────────┘
```

## Key Insights

### 1. Deduplication Happens Automatically
Every sync script calls `resolveCompany()` which handles all deduplication logic. You never create duplicates.

### 2. Timeline is Built Incrementally
Each `addSignalEvent()` call adds to the timeline. No need to rebuild.

### 3. Scores Update Automatically
Score refresh can be triggered on-demand or via cron. Always up-to-date.

### 4. Relationships are Bidirectional
Adding a founder relationship automatically creates both directions in the graph.

### 5. Everything is Traceable
Every entity, alias, signal, and relationship tracks its source and confidence.

## Performance Characteristics

```
Operation                    Time        Scalability
─────────────────────────────────────────────────────
Entity resolution            50ms        O(log n) with indexes
Signal event creation        20ms        O(1)
Score calculation           100ms        O(n) signals per entity
Timeline query               30ms        O(log n) with date index
Graph traversal (depth 2)   200ms        O(n²) worst case
Batch resolution (100)        5s         Parallelizable
```

## Data Growth Projections

```
Entities:
• 10,000 companies → 50,000 aliases (5:1 ratio)
• 5,000 people → 15,000 aliases (3:1 ratio)

Signals:
• 100 signals/day → 36,500/year
• 5 years → 182,500 signals

Relationships:
• 3 founders per company → 30,000 relationships
• 10 employees per company → 100,000 relationships

Storage:
• Entities: ~10 MB
• Signals: ~500 MB
• Relationships: ~50 MB
• Total: ~600 MB for 5 years of data
```

## Monitoring Dashboard

```sql
-- System health at a glance
SELECT 
  'Companies' as entity,
  (SELECT COUNT(*) FROM canonical_companies) as canonical,
  (SELECT COUNT(*) FROM company_aliases) as aliases,
  (SELECT COUNT(*) FROM signal_events WHERE entity_type = 'company') as signals,
  (SELECT COUNT(*) FROM entity_scores WHERE entity_type = 'company') as scored
UNION ALL
SELECT 
  'People',
  (SELECT COUNT(*) FROM canonical_people),
  (SELECT COUNT(*) FROM person_aliases),
  (SELECT COUNT(*) FROM signal_events WHERE entity_type = 'person'),
  (SELECT COUNT(*) FROM entity_scores WHERE entity_type = 'person');
```

This system transforms raw, messy data into clean, actionable intelligence.
