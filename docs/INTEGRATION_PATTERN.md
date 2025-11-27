# Standard Integration Pattern

## Overview

All integrations (TechCrunch, HackerNews, GitHub, Reddit, etc.) must follow this standardized 3-step pattern used by Product Hunt:

```
1. Fetch Data from Source
   ↓
2. AI Entity Extraction (Companies & People)
   ↓
3. Smart Profile Merging (Create or Update)
```

## The Pattern

### Step 1: Fetch Data from Source

Fetch 100-200 items from the data source:

```typescript
// Example: TechCrunch
const articles = await fetchTechCrunchArticles(200);

// Example: HackerNews  
const storyIds = await fetchTopStories(200);
const stories = await fetchHNItems(storyIds);
```

### Step 2: AI Entity Extraction

For EACH item, use AI to extract:
- **Companies** mentioned (name, description, website, tags)
- **People** mentioned (name, title, social links, tags)
- **Refined signal** (headline, summary, why_it_matters, recommended_action)

```typescript
const analysis = await analyzeWithAI(item);

// Returns:
{
  signal: {
    headline: "...",
    summary: "...",
    why_it_matters: "...",
    recommended_action: "...",
    tags: [...]
  },
  company: {
    name: "Acme Inc",
    description: "...",
    website: "https://acme.com",
    tags: ["saas", "b2b"],
    social_links: { twitter: "...", linkedin: "..." }
  },
  people: [
    {
      name: "John Doe",
      title: "CEO & Co-founder",
      tags: ["founder", "ceo"],
      social_links: { twitter: "@johndoe", linkedin: "..." }
    }
  ]
}
```

### Step 3: Smart Profile Merging

Use `findOrCreateCompany` and `findOrCreatePerson` to:
- **Find existing profiles** by name/email/social handles
- **Merge data** if profile exists (append new info)
- **Create new profile** if doesn't exist

```typescript
// Company
const company = await findOrCreateCompany({
  name: analysis.company.name,
  description: analysis.company.description,
  website: analysis.company.website,
  tags: analysis.company.tags,
  social_links: analysis.company.social_links,
});

// People
const personIds = [];
for (const person of analysis.people) {
  const personId = await findOrCreatePerson({
    name: person.name,
    title: person.title,
    company_id: company?.id,
    company_name: company?.name,
    tags: person.tags,
    social_links: person.social_links,
  });
  personIds.push(personId);
}

// Create signal
await supabase.from('signals').insert({
  headline: analysis.signal.headline,
  summary: analysis.signal.summary,
  why_it_matters: analysis.signal.why_it_matters,
  recommended_action: analysis.signal.recommended_action,
  company_id: company?.id,
  company_name: company?.name,
  person_ids: personIds,
  // ... source-specific fields
});
```

## Why This Pattern?

### Benefits

1. **Consistent Data Quality**: AI extracts structured data from unstructured text
2. **Automatic Deduplication**: Profile merger prevents duplicates
3. **Rich Profiles**: Companies and people accumulate data over time
4. **Relationship Tracking**: Links signals to companies and people
5. **Better Search**: Structured data enables powerful queries

### Example: Data Accumulation

**First Signal** (from TechCrunch):
```
Company: Acme Inc
- Description: "AI-powered analytics platform"
- Website: acme.com
- Tags: ["ai", "analytics"]
```

**Second Signal** (from HackerNews):
```
Company: Acme Inc (FOUND - merges data)
- Description: "AI-powered analytics platform" (kept)
- Website: acme.com (kept)
- Tags: ["ai", "analytics", "developer-tools"] (appended)
- GitHub: github.com/acme (NEW - added)
```

**Third Signal** (from Product Hunt):
```
Company: Acme Inc (FOUND - merges data)
- Description: "AI-powered analytics platform for developers" (updated)
- Website: acme.com (kept)
- Tags: ["ai", "analytics", "developer-tools", "saas"] (appended)
- GitHub: github.com/acme (kept)
- Twitter: @acmeinc (NEW - added)
```

Result: **Rich, comprehensive company profile** built from multiple sources!

## Implementation Guide

### For Each Integration

#### 1. Create AI Analysis Function

```typescript
// lib/ai.ts

export async function analyzeTechCrunchArticle(article: TCArticle): Promise<Analysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('AI is required but not configured');
  }
  
  const prompt = `Analyze this TechCrunch article and extract entities:

Title: ${article.title}
Content: ${article.content}
URL: ${article.url}

Extract:
1. Company mentioned (name, description, website, tags)
2. People mentioned (name, title, role, social links)
3. Refined signal (headline, summary, why_it_matters, recommended_action)

Return JSON:
{
  "signal": {
    "headline": "...",
    "summary": "...",
    "why_it_matters": "...",
    "recommended_action": "...",
    "tags": [...]
  },
  "company": {
    "name": "...",
    "description": "...",
    "website": "...",
    "tags": [...],
    "social_links": {}
  },
  "people": [
    {
      "name": "...",
      "title": "...",
      "tags": [...],
      "social_links": {}
    }
  ]
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    }),
  });
  
  const data = await response.json();
  const content = data.content[0].text;
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  return JSON.parse(jsonMatch[0]);
}
```

#### 2. Update Sync Function

```typescript
// app/api/techcrunch/sync/route.ts

export async function POST() {
  // 1. Fetch data
  const articles = await fetchTechCrunchArticles(200);
  const signalArticles = filterSignalWorthyArticles(articles);
  
  // 2. Process with AI in parallel batches
  const BATCH_SIZE = 5;
  const results = [];
  
  for (let i = 0; i < signalArticles.length; i += BATCH_SIZE) {
    const batch = signalArticles.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (article) => {
      try {
        const analysis = await analyzeTechCrunchArticle(article);
        return { article, analysis, success: true };
      } catch (error) {
        return { article, error, success: false };
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 3. Save to database with profile merging
  let imported = 0;
  
  for (const result of results) {
    if (result.status === 'rejected' || !result.value.success) continue;
    
    const { article, analysis } = result.value;
    
    // Find or create company
    const company = await findOrCreateCompany({
      name: analysis.company.name,
      description: analysis.company.description,
      website: analysis.company.website,
      tags: analysis.company.tags,
      social_links: analysis.company.social_links,
    });
    
    // Find or create people
    const personIds = [];
    for (const person of analysis.people) {
      const personId = await findOrCreatePerson({
        name: person.name,
        title: person.title,
        company_id: company?.id,
        tags: person.tags,
        social_links: person.social_links,
      });
      personIds.push(personId);
    }
    
    // Create signal
    await supabase.from('signals').insert({
      headline: analysis.signal.headline,
      summary: analysis.signal.summary,
      why_it_matters: analysis.signal.why_it_matters,
      recommended_action: analysis.signal.recommended_action,
      company_id: company?.id,
      company_name: company?.name,
      person_ids: personIds,
      source_link: article.url,
      // ... source-specific fields
    });
    
    imported++;
  }
  
  return NextResponse.json({ imported });
}
```

## Integration Checklist

For each integration, ensure:

- [ ] Fetches 100-200 items from source
- [ ] Filters for signal-worthy content
- [ ] Uses AI to extract companies and people
- [ ] Processes in parallel batches (5-10 at a time)
- [ ] Uses `findOrCreateCompany` for deduplication
- [ ] Uses `findOrCreatePerson` for deduplication
- [ ] Links signals to companies and people
- [ ] Includes source-specific enrichment fields
- [ ] Has proper error handling
- [ ] Logs progress and metrics

## Performance Optimization

### Parallel Processing

Process AI requests in batches:

```typescript
const BATCH_SIZE = 5; // 5 concurrent AI requests

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  const promises = batch.map(item => analyzeWithAI(item));
  const results = await Promise.allSettled(promises);
  
  // Process results...
  
  // Rate limiting delay between batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

**Speed Improvement**: ~5-10x faster than sequential processing

### Caching

Cache AI results to avoid re-processing:

```typescript
const cacheKey = `ai:${source}:${itemId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const analysis = await analyzeWithAI(item);
await redis.set(cacheKey, JSON.stringify(analysis), 'EX', 86400); // 24h cache

return analysis;
```

## Error Handling

Always handle AI failures gracefully:

```typescript
try {
  const analysis = await analyzeWithAI(item);
  // Use AI-extracted data
} catch (error) {
  console.error('AI failed, using fallback:', error);
  
  // Fallback: manual extraction
  const analysis = {
    signal: {
      headline: item.title,
      summary: item.content.substring(0, 500),
      why_it_matters: 'Requires manual review',
      recommended_action: 'Review this signal',
      tags: [],
    },
    company: {
      name: extractCompanyName(item.title),
      description: '',
      website: '',
      tags: [],
    },
    people: [],
  };
}
```

## Testing

Test each integration:

```bash
# 1. Test data fetching
curl -X POST http://localhost:3000/api/techcrunch/sync

# 2. Check database
# - Companies created/updated
# - People created/updated
# - Signals linked correctly

# 3. Verify deduplication
# - Run sync twice
# - Should not create duplicates
# - Should append new data to existing profiles
```

## Migration Path

### Existing Integrations

To migrate existing integrations to this pattern:

1. **Add AI analysis function** to `lib/ai.ts`
2. **Update sync endpoint** to use AI + profile merging
3. **Test with small batch** (10-20 items)
4. **Verify deduplication** works
5. **Deploy to production**
6. **Monitor for errors**

### Priority Order

1. ✅ **Product Hunt** - Already implemented
2. 🔄 **TechCrunch** - In progress
3. ⏳ **HackerNews** - Next
4. ⏳ **GitHub** - Next
5. ⏳ **Reddit** - Next
6. ⏳ **Y Combinator** - Next

## Summary

**The Golden Rule**: 
> Every integration must extract entities with AI and use profile merging. No exceptions.

This ensures:
- Consistent data quality across all sources
- Rich, comprehensive profiles
- Automatic deduplication
- Powerful search and discovery
- Better user experience

Follow this pattern for all current and future integrations!
