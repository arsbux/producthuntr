import { createClient } from '@supabase/supabase-js';
import { analyzeLaunch } from './ai-analyst';
import { categorizeNiche, guessCategory, MAIN_CATEGORIES } from './category-mapping';
import { getProductHuntOAuthToken } from './product-hunt-oauth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
    // Try OAuth first, fall back to developer token
    let token: string;
    try {
        token = await getProductHuntOAuthToken();
    } catch (error) {
        console.warn('OAuth token fetch failed, using developer token');
        token = process.env.PRODUCT_HUNT_API_TOKEN || '';
    }

    if (!token) {
        throw new Error('Missing Product Hunt API credentials');
    }

    // Calculate start and end times for the Product Hunt day (Pacific Time)
    // We use the date string YYYY-MM-DD from the input date to ensure we target the right day
    const phDateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

    // Create timestamps for 00:00:00 and 23:59:59 in Pacific Time
    // We append 'T00:00:00' and use the America/Los_Angeles timezone to get the correct UTC offset
    const startInPT = new Date(`${phDateStr}T00:00:00`);
    // Adjust for timezone offset manually or use a library. 
    // Since we don't have moment-timezone, we can rely on the fact that PH API accepts ISO strings.
    // But we need the ISO string to represent 00:00 PT.

    // Robust way without libraries:
    // 1. Get YYYY, MM, DD parts for PT
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    const phDay = `${year}-${month}-${day}`;

    // Product Hunt day starts at 00:00 PST/PDT.
    // We can simply pass the date string to the API if it supports it, but it takes DateTime.
    // Let's construct the ISO string for the start of the day in PT.
    // Actually, simpler: The API respects the timezone if we don't provide one? No, usually UTC.

    // Let's try to construct the specific UTC times.
    // 00:00 PT is roughly 07:00 or 08:00 UTC.
    // Let's use a trick: Create a date object, set it to the PH time, then read it back.

    // Function to get UTC ISO string for a specific time in PT
    const getUtcFromPt = (dateStr: string, timeStr: string) => {
        // Create a date object that represents that time in PT
        // This is tricky without a library.
        // Alternative: Just use the day boundaries. 
        // If we query for a slightly wider range it's fine, but we want exact day.

        // Let's assume the user wants "Today" in PH terms.
        // If we just use the YYYY-MM-DD string, maybe we can filter in memory? No, pagination.

        // Let's rely on the fact that we can create a string with offset if we knew it.
        // But offset changes (DST).

        // Let's use the 'postedAfter' and 'postedBefore' variables with a safe margin?
        // No, let's try to be precise.

        // Hacky but effective:
        // Create a date, set to noon UTC.
        // Shift it until `toLocaleDateString('en-US', {timeZone: 'America/Los_Angeles'})` matches target date.
        // Then find the exact bounds.

        // Actually, let's just use the YYYY-MM-DD string and append a fixed offset? No.

        // Let's use the Intl API to find the offset.
        const d = new Date(date);
        const timeString = d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeZoneName: 'short' });
        // timeString might contain "PST" or "PDT".
        const isPDT = timeString.includes('PDT');
        const offset = isPDT ? '-07:00' : '-08:00';

        return {
            start: `${phDay}T00:00:00${offset}`,
            end: `${phDay}T23:59:59.999${offset}`
        };
    };

    const { start, end } = getUtcFromPt(date.toISOString(), '');

    // Convert to ISO for API (which expects UTC usually, but with offset it should handle it)
    // Or we convert to UTC ISO string ourselves.
    const startDate = new Date(start);
    const endDate = new Date(end);

    let allPosts: PHPost[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (hasNextPage && retryCount < maxRetries) {
        try {
            const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                query($postedAfter: DateTime, $postedBefore: DateTime, $after: String) {
                  posts(order: VOTES, postedAfter: $postedAfter, postedBefore: $postedBefore, first: 50, after: $after) {
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
                        after: cursor,
                    },
                }),
            });

            // Handle rate limiting with exponential backoff
            if (response.status === 429) {
                const waitTime = Math.pow(2, retryCount) * 5000; // 5s, 10s, 20s
                console.warn(`Rate limited. Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retryCount++;
                continue;
            }

            if (!response.ok) {
                console.error(`Product Hunt API error: ${response.status}`);
                break;
            }

            const data: any = await response.json();

            if (data.errors) {
                const isRateLimit = data.errors.some((e: any) =>
                    e.message?.includes('rate limit') ||
                    e.message?.includes('429') ||
                    e.message?.includes('complexity')
                );

                if (isRateLimit) {
                    console.warn('Rate limit detected in GraphQL errors');
                    if (allPosts.length > 0) {
                        console.log(`Returning ${allPosts.length} posts collected so far`);
                        break;
                    }

                    // Exponential backoff
                    const waitTime = Math.pow(2, retryCount) * 5000;
                    console.warn(`Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    retryCount++;
                    continue;
                }

                throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
            }

            const posts = data?.data?.posts?.edges || [];
            const pageInfo = data?.data?.posts?.pageInfo;

            // Transform the response
            const transformedPosts: PHPost[] = posts.map((edge: any) => ({
                id: parseInt(edge.node.id),
                name: edge.node.name,
                tagline: edge.node.tagline,
                description: edge.node.description || edge.node.tagline,
                votes_count: edge.node.votesCount,
                comments_count: edge.node.commentsCount,
                created_at: edge.node.createdAt,
                website: edge.node.website,
                redirect_url: edge.node.url,
                topics: edge.node.topics?.edges?.map((t: any) => ({ name: t.node.name })) || [],
                makers: edge.node.makers?.map((m: any) => ({
                    name: m.name,
                    username: m.username,
                    twitter_username: m.twitterUsername,
                })) || [],
                thumbnail_url: edge.node.thumbnail?.url,
            }));

            allPosts = [...allPosts, ...transformedPosts];

            hasNextPage = pageInfo?.hasNextPage || false;
            cursor = pageInfo?.endCursor || null;

            console.log(`Fetched ${transformedPosts.length} posts (total: ${allPosts.length}), hasNextPage: ${hasNextPage}`);

            // Increased delay to avoid rate limits
            if (hasNextPage) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
            }

            // Reset retry count on successful request
            retryCount = 0;

        } catch (error) {
            console.error('Error fetching posts:', error);
            if (allPosts.length > 0) {
                console.log(`Returning ${allPosts.length} posts despite error`);
                break;
            }
            throw error;
        }
    }

    if (retryCount >= maxRetries) {
        console.warn(`Max retries reached. Returning ${allPosts.length} posts`);
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
