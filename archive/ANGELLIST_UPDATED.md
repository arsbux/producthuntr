# AngelList/Wellfound Integration Updated

## Summary

Updated AngelList/Wellfound integration to follow the standard 3-step pattern:

```
1. Fetch Data → 2. AI Entity Extraction → 3. Smart Profile Merging
```

## What Changed

### Before
- ❌ Manual company name extraction
- ❌ No AI processing
- ❌ No people tracking
- ❌ Used entity resolution (requires migrations)
- ❌ Placeholder implementation

### After
- ✅ AI extracts companies and people
- ✅ Smart profile merging (deduplication)
- ✅ People tracking with relationships
- ✅ Works with existing database
- ✅ Ready-to-use framework

## Implementation Status

### ✅ Complete
- AI analysis function
- Profile merging integration
- Parallel batch processing
- Error handling
- API endpoint
- UI page

### ⏳ Needs Implementation
- **Scraping logic** - The actual data fetching from Wellfound

## How It Works

### Step 1: Fetch Data (TODO)

```typescript
// In lib/angellist.ts - fetchAngelListCompanies()
// Options:
// 1. Use AngelList API (if available)
// 2. Scrape with Puppeteer (headless browser)
// 3. Scrape with Cheerio (HTML parsing)

// Returns:
[
  {
    name: "Acme Inc",
    url: "https://wellfound.com/company/acme",
    website: "https://acme.com",
    description: "AI-powered analytics",
    location: "San Francisco",
    size: "11-50",
    jobCount: 8,
    isHiring: true,
    roles: ["Senior Engineer", "Head of Sales", "Product Manager"]
  }
]
```

### Step 2: AI Entity Extraction (✅ Complete)

```typescript
const analysis = await analyzeAngelListCompany(company);

// Returns:
{
  signal: {
    headline: "Acme Inc is rapidly hiring (8 open roles)",
    summary: "Acme is expanding their team with focus on growth roles...",
    why_it_matters: "Hiring spike indicates growth phase and fresh capital...",
    recommended_action: "Reach out to discuss partnership opportunities...",
    tags: ["hiring", "growth", "expansion"]
  },
  company: {
    name: "Acme Inc",
    description: "AI-powered analytics platform",
    website: "https://acme.com",
    tags: ["ai", "analytics", "b2b", "saas"],
    social_links: { twitter: "@acmeinc", linkedin: "..." }
  },
  people: [
    {
      name: "Jane Smith",
      title: "Head of Talent",
      tags: ["hiring_manager"],
      social_links: { linkedin: "..." }
    }
  ]
}
```

### Step 3: Smart Profile Merging (✅ Complete)

```typescript
// Find or create company (deduplicates automatically)
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

// Create signal linked to company and people
await supabase.from('signals').insert({
  headline: analysis.signal.headline,
  summary: analysis.signal.summary,
  company_id: company?.id,
  person_ids: personIds,
  // ...
});
```

## To Complete Implementation

### Option 1: Use AngelList API (Recommended)

```typescript
async function fetchAngelListCompanies(): Promise<AngelListCompany[]> {
  const apiKey = process.env.ANGELLIST_API_KEY;
  
  const response = await fetch('https://api.angel.co/1/jobs', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  const data = await response.json();
  return data.jobs.map(job => ({
    name: job.startup.name,
    url: job.startup.angellist_url,
    website: job.startup.company_url,
    // ... map other fields
  }));
}
```

### Option 2: Scrape with Puppeteer

```typescript
import puppeteer from 'puppeteer';

async function fetchAngelListCompanies(): Promise<AngelListCompany[]> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://wellfound.com/jobs');
  
  const companies = await page.evaluate(() => {
    const companyElements = document.querySelectorAll('.company-card');
    return Array.from(companyElements).map(el => ({
      name: el.querySelector('.company-name')?.textContent,
      url: el.querySelector('a')?.href,
      jobCount: el.querySelectorAll('.job-listing').length,
      // ... extract other fields
    }));
  });
  
  await browser.close();
  return companies;
}
```

### Option 3: Scrape with Cheerio

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';

async function fetchAngelListCompanies(): Promise<AngelListCompany[]> {
  const { data } = await axios.get('https://wellfound.com/jobs');
  const $ = cheerio.load(data);
  
  const companies: AngelListCompany[] = [];
  
  $('.company-card').each((i, el) => {
    companies.push({
      name: $(el).find('.company-name').text(),
      url: $(el).find('a').attr('href'),
      jobCount: $(el).find('.job-listing').length,
      // ... extract other fields
    });
  });
  
  return companies;
}
```

## Legal & Ethical Considerations

Before implementing scraping:

1. ✅ Check `robots.txt`: https://wellfound.com/robots.txt
2. ✅ Review Terms of Service
3. ✅ Implement rate limiting (1-2 req/sec max)
4. ✅ Add User-Agent header
5. ✅ Cache aggressively
6. ✅ Consider contacting AngelList for API access

## Testing

Once scraping is implemented:

```bash
# 1. Test sync
curl -X POST http://localhost:3000/api/angellist/sync

# 2. Check database
# - Companies created with AI-extracted data
# - People created and linked to companies
# - Signals created with hiring information

# 3. Verify deduplication
# - Run sync twice
# - Should not create duplicates
# - Should append new data to existing profiles
```

## Benefits of This Update

### Data Quality
- ✅ AI extracts accurate company information
- ✅ Identifies key people (hiring managers, founders)
- ✅ Rich, contextual hiring signals

### Deduplication
- ✅ Automatic company deduplication
- ✅ Automatic people deduplication
- ✅ Data accumulates over time

### Relationships
- ✅ Signals linked to companies
- ✅ Signals linked to people
- ✅ People linked to companies

### Example: Data Accumulation

**Signal 1** (AngelList):
```
Company: Acme Inc
- Website: acme.com
- Tags: ["hiring", "growth"]
- People: [Jane Smith - Head of Talent]
```

**Signal 2** (TechCrunch):
```
Company: Acme Inc ← FOUND, merges data
- Website: acme.com ← kept
- Tags: ["hiring", "growth", "funding"] ← appended
- People: [Jane Smith, John Doe - CEO] ← appended
```

**Result**: Rich profile built from multiple sources!

## Current Status

### Framework: ✅ Complete
- AI analysis function ready
- Profile merging integrated
- API endpoint configured
- Error handling in place

### Scraping: ⏳ Needs Implementation
- Choose method (API/Puppeteer/Cheerio)
- Implement `fetchAngelListCompanies()`
- Add rate limiting
- Test thoroughly

## Next Steps

1. **Choose scraping method** (API preferred)
2. **Implement `fetchAngelListCompanies()`**
3. **Test with small batch** (10-20 companies)
4. **Verify deduplication** works
5. **Deploy to production**

## Files Modified

- ✅ `lib/angellist.ts` - Updated to use AI + profile merging
- ✅ `app/api/angellist/sync/route.ts` - Updated API endpoint
- ✅ `app/(user)/desk/angellist/page.tsx` - Already has sync button

## Summary

AngelList integration now follows the standard pattern:
- ✅ AI entity extraction
- ✅ Smart profile merging
- ✅ People tracking
- ⏳ Just needs scraping implementation

Once scraping is added, it will work exactly like Product Hunt - automatically extracting companies and people, deduplicating, and building rich profiles over time!
