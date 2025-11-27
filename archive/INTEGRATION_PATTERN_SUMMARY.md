# Integration Pattern - Quick Summary

## The 3-Step Pattern

All integrations must follow this pattern (as used by Product Hunt):

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: FETCH DATA                                          │
│ - Fetch 100-200 items from source                          │
│ - Filter for signal-worthy content                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: AI ENTITY EXTRACTION                                │
│ - Extract companies (name, description, website, tags)     │
│ - Extract people (name, title, social links, tags)         │
│ - Refine signal (headline, summary, why_it_matters, action)│
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: SMART PROFILE MERGING                               │
│ - findOrCreateCompany() - deduplicates & merges            │
│ - findOrCreatePerson() - deduplicates & merges             │
│ - Create signal linked to company & people                 │
└─────────────────────────────────────────────────────────────┘
```

## Why This Matters

### Without This Pattern (Old Way)
- Manual company name extraction → errors
- Duplicate companies ("Stripe", "stripe", "Stripe Inc")
- No people tracking
- Shallow profiles
- Poor search

### With This Pattern (New Way)
- AI extracts entities → accurate
- Automatic deduplication → clean data
- People tracked → relationships
- Rich profiles → accumulate data over time
- Powerful search → structured data

## Example: Data Accumulation

**Signal 1** (TechCrunch):
```
Company: Acme Inc
- Website: acme.com
- Tags: ["ai"]
```

**Signal 2** (HackerNews):
```
Company: Acme Inc ← FOUND, merges data
- Website: acme.com ← kept
- Tags: ["ai", "developer-tools"] ← appended
- GitHub: github.com/acme ← NEW
```

**Signal 3** (Product Hunt):
```
Company: Acme Inc ← FOUND, merges data
- Website: acme.com ← kept
- Tags: ["ai", "developer-tools", "saas"] ← appended
- GitHub: github.com/acme ← kept
- Twitter: @acmeinc ← NEW
```

**Result**: Rich profile built from 3 sources!

## Implementation Status

| Integration | Status | Notes |
|------------|--------|-------|
| Product Hunt | ✅ Complete | Reference implementation |
| TechCrunch | 🔄 In Progress | Needs AI + profile merging |
| HackerNews | ⏳ Todo | Needs AI + profile merging |
| GitHub | ⏳ Todo | Needs AI + profile merging |
| Reddit | ⏳ Todo | Needs AI + profile merging |
| Y Combinator | ⏳ Todo | Needs AI + profile merging |

## Next Steps

1. **Read**: `INTEGRATION_PATTERN.md` for full details
2. **Update**: TechCrunch to use this pattern
3. **Test**: Verify deduplication works
4. **Repeat**: Apply to all other integrations

## Key Functions

```typescript
// AI Analysis
const analysis = await analyzeTechCrunchArticle(article);

// Profile Merging
const company = await findOrCreateCompany(analysis.company);
const personId = await findOrCreatePerson(analysis.person);

// Create Signal
await supabase.from('signals').insert({
  ...analysis.signal,
  company_id: company.id,
  person_ids: [personId],
});
```

## Requirements

- ✅ ANTHROPIC_API_KEY configured
- ✅ `findOrCreateCompany` function exists
- ✅ `findOrCreatePerson` function exists
- ✅ AI analysis function per integration

See `INTEGRATION_PATTERN.md` for complete implementation guide.
