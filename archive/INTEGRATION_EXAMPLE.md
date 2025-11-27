# Integration Example: Using Entity Resolution in Sync Scripts

This shows how to update your existing sync scripts to use the new entity resolution system.

## Before (Old Way)

```typescript
// lib/producthunt.ts - OLD
async function syncProductHunt() {
  const posts = await fetchPosts();
  
  for (const post of posts) {
    // Create or find company
    let company = await findCompanyByName(post.name);
    if (!company) {
      company = await createCompany({
        name: post.name,
        website: post.website,
      });
    }
    
    // Create signal
    await createSignal({
      company_id: company.id,
      headline: post.tagline,
      source: 'producthunt',
      // ...
    });
  }
}
```

**Problems**:
- Creates duplicates ("Stripe", "stripe", "Stripe Inc")
- No deduplication across sources
- No relationship tracking
- No timeline view

## After (New Way)

```typescript
// lib/producthunt.ts - NEW
import { resolveCompany } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';

async function syncProductHunt() {
  const posts = await fetchPosts();
  
  for (const post of posts) {
    // Resolve to canonical company (handles deduplication)
    const canonicalId = await resolveCompany(
      post.name,
      post.website,
      'producthunt',
      post.id
    );
    
    // Add signal event (automatically updates timeline & score)
    await addSignalEvent(
      'company',
      canonicalId,
      'launch',
      {
        eventDate: new Date(post.created_at),
        title: post.tagline,
        description: post.description,
        url: post.url,
        source: 'producthunt',
        sourceId: post.id,
        metadata: {
          votes: post.votes_count,
          comments: post.comments_count,
          topics: post.topics,
          makers: post.makers,
        },
      }
    );
    
    // Extract founder relationships
    for (const maker of post.makers || []) {
      const personId = await resolvePerson(
        maker.name,
        undefined,
        canonicalId,
        'producthunt',
        maker.id
      );
      
      await addCompanyFounder(
        canonicalId,
        personId,
        {
          title: 'Maker',
          source: 'producthunt',
          confidence: 0.7,
        }
      );
    }
  }
}
```

**Benefits**:
- ✓ Automatic deduplication
- ✓ Canonical entity IDs
- ✓ Timeline tracking
- ✓ Relationship extraction
- ✓ Impact scoring

## Full Example: HackerNews Sync

```typescript
// lib/hackernews.ts - UPDATED
import { resolveCompany } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';
import { extractDomain } from './entity-resolver';

export async function syncHackerNews() {
  const stories = await fetchTopStories();
  
  for (const story of stories) {
    // Skip if no URL
    if (!story.url) continue;
    
    // Extract company from URL
    const domain = extractDomain(story.url);
    if (!domain) continue;
    
    // Resolve company
    const canonicalId = await resolveCompany(
      story.title.split(' ')[0], // rough company name
      story.url,
      'hackernews',
      story.id.toString()
    );
    
    // Determine event type
    const eventType = determineEventType(story.title);
    
    // Add signal event
    await addSignalEvent(
      'company',
      canonicalId,
      eventType,
      {
        eventDate: new Date(story.time * 1000),
        title: story.title,
        url: story.url,
        impactScore: calculateHNImpact(story.score, story.descendants),
        source: 'hackernews',
        sourceId: story.id.toString(),
        metadata: {
          score: story.score,
          comments: story.descendants,
          author: story.by,
        },
      }
    );
  }
}

function determineEventType(title: string): EventType {
  const lower = title.toLowerCase();
  
  if (lower.includes('funding') || lower.includes('raised')) return 'funding';
  if (lower.includes('launch') || lower.includes('introducing')) return 'launch';
  if (lower.includes('hiring') || lower.includes('jobs')) return 'hire';
  if (lower.includes('release') || lower.includes('version')) return 'release';
  
  return 'press';
}

function calculateHNImpact(score: number, comments: number): number {
  // High score + high engagement = high impact
  const scoreComponent = Math.min(score / 500, 1) * 0.6;
  const commentComponent = Math.min(comments / 200, 1) * 0.4;
  
  return scoreComponent + commentComponent;
}
```

## Example: YC Sync with Relationships

```typescript
// lib/yc.ts - UPDATED
import { resolveCompany, resolvePerson } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';
import { addCompanyFounder, addFundingRound } from './knowledge-graph';

export async function syncYCCompanies() {
  const companies = await fetchYCCompanies();
  
  for (const yc of companies) {
    // Resolve company
    const canonicalId = await resolveCompany(
      yc.name,
      yc.website,
      'yc',
      yc.id
    );
    
    // Add YC batch as signal
    await addSignalEvent(
      'company',
      canonicalId,
      'milestone',
      {
        eventDate: new Date(yc.batch_date),
        title: `Joined Y Combinator ${yc.batch}`,
        url: yc.yc_url,
        impactScore: 0.8,
        source: 'yc',
        sourceId: yc.id,
        metadata: {
          batch: yc.batch,
          vertical: yc.vertical,
          status: yc.status,
        },
      }
    );
    
    // Add founders
    for (const founder of yc.founders || []) {
      const personId = await resolvePerson(
        founder.name,
        founder.email,
        canonicalId,
        'yc',
        founder.id
      );
      
      await addCompanyFounder(
        canonicalId,
        personId,
        {
          title: founder.title || 'Co-founder',
          startedAt: new Date(yc.founded_year, 0, 1),
          source: 'yc',
          confidence: 0.95, // YC data is highly reliable
        }
      );
    }
    
    // Add funding if available
    if (yc.funding_amount) {
      await addFundingRound(
        canonicalId,
        yc.funding_stage || 'seed',
        {
          amountUsd: yc.funding_amount,
          announcedDate: new Date(yc.funding_date),
          source: 'yc',
          confidence: 0.9,
        }
      );
    }
  }
}
```

## Example: GitHub Sync

```typescript
// lib/github.ts - UPDATED
import { resolveCompany, resolvePerson } from './entity-resolver';
import { addSignalEvent } from './signal-timeline';
import { addRelationship } from './knowledge-graph';

export async function syncGitHubTrending() {
  const repos = await fetchTrendingRepos();
  
  for (const repo of repos) {
    // Try to resolve company from repo owner
    let canonicalId: string;
    
    if (repo.owner_type === 'Organization') {
      canonicalId = await resolveCompany(
        repo.owner,
        repo.homepage || `https://github.com/${repo.owner}`,
        'github',
        repo.owner
      );
    } else {
      // Individual developer
      const personId = await resolvePerson(
        repo.owner,
        undefined,
        undefined,
        'github',
        repo.owner
      );
      
      // Create signal for person
      await addSignalEvent(
        'person',
        personId,
        'release',
        {
          eventDate: new Date(),
          title: `${repo.name} trending on GitHub`,
          url: repo.url,
          impactScore: calculateGitHubImpact(repo.stars, repo.stars_today),
          source: 'github',
          sourceId: repo.full_name,
          metadata: {
            stars: repo.stars,
            stars_today: repo.stars_today,
            language: repo.language,
          },
        }
      );
      
      continue;
    }
    
    // Add release signal for company
    await addSignalEvent(
      'company',
      canonicalId,
      'release',
      {
        eventDate: new Date(),
        title: `${repo.name} trending on GitHub`,
        description: repo.description,
        url: repo.url,
        impactScore: calculateGitHubImpact(repo.stars, repo.stars_today),
        source: 'github',
        sourceId: repo.full_name,
        metadata: {
          stars: repo.stars,
          forks: repo.forks,
          stars_today: repo.stars_today,
          language: repo.language,
        },
      }
    );
  }
}

function calculateGitHubImpact(totalStars: number, todayStars: number): number {
  // Viral growth = high impact
  if (todayStars > 1000) return 0.95;
  if (todayStars > 500) return 0.85;
  if (todayStars > 100) return 0.70;
  if (totalStars > 10000) return 0.75;
  if (totalStars > 5000) return 0.65;
  return 0.50;
}
```

## Migration Checklist

For each sync script:

- [ ] Import `resolveCompany` and/or `resolvePerson`
- [ ] Import `addSignalEvent`
- [ ] Replace company creation with `resolveCompany()`
- [ ] Replace signal creation with `addSignalEvent()`
- [ ] Extract relationships (founders, employees, etc.)
- [ ] Add impact score calculation
- [ ] Include rich metadata
- [ ] Test deduplication works
- [ ] Verify timeline appears correctly

## Testing

```typescript
// Test entity resolution
const id1 = await resolveCompany('Stripe', 'https://stripe.com', 'test', '1');
const id2 = await resolveCompany('stripe', 'https://www.stripe.com', 'test', '2');
console.assert(id1 === id2, 'Should resolve to same canonical ID');

// Test signal events
await addSignalEvent('company', id1, 'funding', {
  eventDate: new Date(),
  title: 'Test funding',
  source: 'test',
});

// Check timeline
const timeline = await getEntityTimeline('company', id1);
console.log('Timeline:', timeline);

// Check score
const score = await refreshEntityScore('company', id1);
console.log('Score:', score.impact_score);
```

## Next Steps

1. Update one sync script as a test
2. Run it and verify:
   - No duplicates created
   - Timeline shows events
   - Score is calculated
3. Update remaining sync scripts
4. Run full migration
5. Monitor for issues
