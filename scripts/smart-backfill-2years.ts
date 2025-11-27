import { createClient } from '@supabase/supabase-js';
import { analyzeLaunch } from '../lib/ai-analyst';
import { categorizeNiche, guessCategory, MAIN_CATEGORIES } from '../lib/category-mapping';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const phToken = process.env.PRODUCT_HUNT_API_TOKEN;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

if (!phToken) {
    console.error('❌ Missing Product Hunt API Token');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PHPost {
    id: number;
    name: string;
    tagline: string;
    description: string;
    votes_count: number;
    comments_count: number;
    created_at: string;
    website: string;
    redirect_url: string;
    topics: Array<{ name: string }>;
    makers: Array<{
        name: string;
        username: string;
        twitter_username?: string;
    }>;
    thumbnail_url?: string;
}

async function fetchLaunchesForDate(date: Date): Promise<PHPost[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // console.log(`   📅 Fetching for ${startDate.toLocaleDateString()}...`);

    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${phToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: `
            query($postedAfter: DateTime, $postedBefore: DateTime) {
              posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore) {
                edges {
                  node {
                    id
                    name
                    tagline
                    description
                    votesCount
                    commentsCount
                    createdAt
                    website
                    url
                    thumbnail {
                      url
                    }
                    topics {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                    makers {
                      name
                      username
                      twitterUsername
                    }
                  }
                }
              }
            }
          `,
            variables: {
                postedAfter: startDate.toISOString(),
                postedBefore: endDate.toISOString()
            }
        }),
    });

    if (!response.ok) {
        throw new Error(`Product Hunt API error: ${response.status}`);
    }

    const data: any = await response.json();

    if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data.posts.edges.map((edge: any) => {
        const node = edge.node;
        return {
            id: parseInt(node.id),
            name: node.name,
            tagline: node.tagline,
            description: node.description || '',
            votes_count: node.votesCount || 0,
            comments_count: node.commentsCount || 0,
            created_at: node.createdAt,
            website: node.website || '',
            redirect_url: node.url,
            thumbnail_url: node.thumbnail?.url,
            topics: node.topics?.edges?.map((t: any) => ({ name: t.node.name })) || [],
            makers: node.makers?.map((m: any) => ({
                name: m.name,
                username: m.username,
                twitter_username: m.twitterUsername,
            })) || [],
        };
    });
}

async function processDay(date: Date) {
    const stats = { processed: 0, skipped: 0, errors: 0 };
    const dateStr = date.toLocaleDateString();

    try {
        const launches = await fetchLaunchesForDate(date);
        // console.log(`   📦 [${dateStr}] Found ${launches.length} launches`);

        for (const launch of launches) {
            // 1. Check for duplicates
            const { data: existing } = await supabase
                .from('ph_launches')
                .select('id')
                .eq('id', launch.id.toString())
                .single();

            if (existing) {
                stats.skipped++;
                continue;
            }

            // 2. AI Analysis
            let analysis;
            try {
                analysis = await analyzeLaunch({
                    name: launch.name,
                    tagline: launch.tagline,
                    description: launch.description,
                    topics: launch.topics.map(t => t.name),
                });
            } catch (e) {
                analysis = {
                    icp: 'Unknown',
                    problem: 'Unknown',
                    solution_type: 'Unknown',
                    niche: 'Unknown',
                    pricing_model: 'Unknown',
                    one_line_pitch: 'Analysis failed'
                };
            }

            // 3. Consolidate Category
            const originalNiche = analysis.niche;
            let consolidatedCategory = categorizeNiche(originalNiche);

            if (consolidatedCategory === MAIN_CATEGORIES.OTHER) {
                const guessed = guessCategory(launch.name, launch.tagline, launch.description);
                if (guessed !== MAIN_CATEGORIES.OTHER) {
                    consolidatedCategory = guessed;
                }
            }

            analysis.niche = consolidatedCategory;

            // 4. Save to DB
            const { error } = await supabase.from('ph_launches').insert({
                id: launch.id.toString(),
                name: launch.name,
                tagline: launch.tagline,
                description: launch.description,
                votes_count: launch.votes_count,
                comments_count: launch.comments_count,
                website_url: launch.website,
                ph_url: launch.redirect_url,
                thumbnail_url: launch.thumbnail_url,
                topics: launch.topics.map(t => t.name),
                makers: launch.makers,
                launched_at: launch.created_at,
                ai_analysis: analysis,
                analyzed_at: new Date().toISOString(),
            });

            if (error) {
                console.error(`      ❌ [${dateStr}] DB Error: ${error.message}`);
                stats.errors++;
            } else {
                console.log(`      ✅ [${dateStr}] Saved: ${launch.name} (${consolidatedCategory})`);
                stats.processed++;
            }

            // Small delay between products within a day to prevent overwhelming DB/AI
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    } catch (err) {
        console.error(`❌ [${dateStr}] Failed:`, err);
        stats.errors++;
    }

    return stats;
}

async function smartBackfill() {
    console.log('🚀 Starting Parallel Smart Backfill (2 Years)...');
    console.log('   Target: 8 Days Parallel Processing');

    const DAYS_TO_BACKFILL = 730; // 2 years
    const BATCH_SIZE = 8;

    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Iterate in batches
    for (let i = 0; i < DAYS_TO_BACKFILL; i += BATCH_SIZE) {
        const batchDates: Date[] = [];

        // Prepare batch of dates
        for (let j = 0; j < BATCH_SIZE && (i + j) < DAYS_TO_BACKFILL; j++) {
            const date = new Date();
            date.setDate(date.getDate() - (i + j) - 1);
            batchDates.push(date);
        }

        console.log(`\n⚡ Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(DAYS_TO_BACKFILL / BATCH_SIZE)} (${batchDates[0].toLocaleDateString()} - ${batchDates[batchDates.length - 1].toLocaleDateString()})`);

        // Process batch in parallel
        const results = await Promise.all(batchDates.map(date => processDay(date)));

        // Aggregate stats
        results.forEach(stat => {
            totalProcessed += stat.processed;
            totalSkipped += stat.skipped;
            totalErrors += stat.errors;
        });

        console.log(`   Batch Summary: ${results.reduce((a, b) => a + b.processed, 0)} processed, ${results.reduce((a, b) => a + b.skipped, 0)} skipped`);

        // Rate limit between batches
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ Backfill Complete!');
    console.log(`   Processed: ${totalProcessed}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
}

smartBackfill();
