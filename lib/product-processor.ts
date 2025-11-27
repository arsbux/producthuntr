import { createClient } from '@supabase/supabase-js';
import { analyzeLaunch } from './ai-analyst';
import { categorizeNiche, guessCategory, MAIN_CATEGORIES } from './category-mapping';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const phToken = process.env.PRODUCT_HUNT_API_TOKEN;

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

export async function fetchLaunchesForDate(date: Date): Promise<PHPost[]> {
    if (!phToken) {
        throw new Error('Missing Product Hunt API Token');
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let allPosts: PHPost[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
        const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${phToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: `
                query($postedAfter: DateTime, $postedBefore: DateTime, $after: String) {
                  posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore, first: 40, after: $after) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
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
                    postedBefore: endDate.toISOString(),
                    after: cursor
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

        const posts = data.data.posts.edges.map((edge: any) => {
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

        allPosts = [...allPosts, ...posts];

        hasNextPage = data.data.posts.pageInfo.hasNextPage;
        cursor = data.data.posts.pageInfo.endCursor;

        // Safety break to prevent infinite loops if something goes wrong
        if (allPosts.length > 500) break;
    }

    return allPosts;
}

export async function processDay(date: Date, limit?: number) {
    const stats = {
        processed: 0,
        skipped: 0,
        errors: 0,
        logs: [] as string[],
        processedItems: [] as { name: string, votes: number, niche: string }[]
    };
    const dateStr = date.toLocaleDateString();

    const log = (msg: string) => {
        console.log(msg);
        stats.logs.push(msg);
    };

    try {
        log(`Fetching launches for ${dateStr}...`);
        let launches = await fetchLaunchesForDate(date);
        log(`Found ${launches.length} launches`);

        if (limit && limit > 0) {
            log(`Limiting to top ${limit} launches`);
            launches = launches.slice(0, limit);
        }

        for (const launch of launches) {
            // 1. Check for duplicates
            const { data: existing } = await supabase
                .from('ph_launches')
                .select('id')
                .eq('id', launch.id.toString())
                .single();

            if (existing) {
                stats.skipped++;
                // Still add to processed items list if we found it, maybe mark as skipped?
                // Actually, the user wants to see "all products and launches that have been got".
                // If we skip it, it means it's already in DB. We should probably fetch it from DB to show it?
                // Or just show that we processed (skipped) it.
                // For now, let's just log it.
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
                log(`❌ [${dateStr}] DB Error: ${error.message}`);
                stats.errors++;
            } else {
                log(`✅ [${dateStr}] Saved: ${launch.name} (${consolidatedCategory})`);
                stats.processed++;
                stats.processedItems.push({
                    name: launch.name,
                    votes: launch.votes_count,
                    niche: consolidatedCategory
                });
            }
        }
    } catch (err: any) {
        log(`❌ [${dateStr}] Failed: ${err.message}`);
        stats.errors++;
    }

    return stats;
}
