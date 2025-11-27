import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// 1. TOPIC & TAG VELOCITY
// ============================================

export interface TopicVelocityData {
    topic: string;
    timeSeriesData: {
        month: string;
        launchCount: number;
        avgUpvotes: number;
        avgComments: number;
    }[];
    totalLaunches: number;
    trend: 'rising' | 'stable' | 'declining';
}

const CATEGORY_MAPPING: Record<string, string> = {
    'Artificial Intelligence': 'AI & Machine Learning',
    'Machine Learning': 'AI & Machine Learning',
    'Generative AI': 'AI & Machine Learning',
    'Developer Tools': 'Developer Tools',
    'Programming': 'Developer Tools',
    'APIs': 'Developer Tools',
    'Open Source': 'Developer Tools',
    'Productivity': 'Productivity & Organization',
    'Task Management': 'Productivity & Organization',
    'Calendar': 'Productivity & Organization',
    'Notes': 'Productivity & Organization',
    'Design Tools': 'Design & Creative',
    'Graphics': 'Design & Creative',
    'User Experience': 'Design & Creative',
    'Marketing': 'Marketing & Growth',
    'SEO': 'Marketing & Growth',
    'Social Media': 'Marketing & Growth',
    'Analytics': 'Marketing & Growth',
    'Growth Hacking': 'Marketing & Growth',
    'Fintech': 'Fintech & Finance',
    'Finance': 'Fintech & Finance',
    'Investing': 'Fintech & Finance',
    'Crypto': 'Web3 & Crypto',
    'Web3': 'Web3 & Crypto',
    'Blockchain': 'Web3 & Crypto',
    'Health': 'Health & Wellness',
    'Wellness': 'Health & Wellness',
    'Fitness': 'Health & Wellness',
    'Education': 'Education & Learning',
    'EdTech': 'Education & Learning',
    'Learning': 'Education & Learning',
    'E-commerce': 'E-commerce & Retail',
    'Retail': 'E-commerce & Retail',
    'DTC': 'E-commerce & Retail',
};

function mapNicheToCategory(niche: string): string {
    // Direct match
    if (CATEGORY_MAPPING[niche]) return CATEGORY_MAPPING[niche];

    // Keyword match
    const lower = niche.toLowerCase();
    if (lower.includes('ai') || lower.includes('gpt') || lower.includes('bot') || lower.includes('llm')) return 'AI & Machine Learning';
    if (lower.includes('dev') || lower.includes('code') || lower.includes('api') || lower.includes('sdk') || lower.includes('database')) return 'Developer Tools';
    if (lower.includes('productiv') || lower.includes('task') || lower.includes('notion') || lower.includes('organi') || lower.includes('project')) return 'Productivity & Organization';
    if (lower.includes('design') || lower.includes('art') || lower.includes('color') || lower.includes('ui') || lower.includes('ux') || lower.includes('video') || lower.includes('image')) return 'Design & Creative';
    if (lower.includes('market') || lower.includes('seo') || lower.includes('social') || lower.includes('ad') || lower.includes('email') || lower.includes('content')) return 'Marketing & Growth';
    if (lower.includes('finance') || lower.includes('money') || lower.includes('invest') || lower.includes('bank') || lower.includes('pay')) return 'Fintech & Finance';
    if (lower.includes('crypto') || lower.includes('web3') || lower.includes('chain') || lower.includes('token') || lower.includes('nft')) return 'Web3 & Crypto';
    if (lower.includes('health') || lower.includes('fit') || lower.includes('well') || lower.includes('med') || lower.includes('gym')) return 'Health & Wellness';
    if (lower.includes('learn') || lower.includes('edu') || lower.includes('teach') || lower.includes('course') || lower.includes('school')) return 'Education & Learning';
    if (lower.includes('shop') || lower.includes('store') || lower.includes('commerce') || lower.includes('retail') || lower.includes('cart')) return 'E-commerce & Retail';

    // Default to the niche itself if no category is found, instead of "Other"
    return niche;
}

export async function getTopicVelocity(months = 12): Promise<TopicVelocityData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count, launched_at')
        .not('ai_analysis', 'is', null)
        .gte('launched_at', getMonthsAgo(months));

    if (!launches) return [];

    // Group by niche/topic and month
    const topicMap = new Map<string, Map<string, { launches: any[], votes: number, comments: number }>>();

    launches.forEach(launch => {
        const rawNiche = launch.ai_analysis?.niche || 'Unknown';
        const niche = mapNicheToCategory(rawNiche);

        if (niche === 'Other') return; // Skip undefined categories for cleaner chart

        const monthKey = getMonthKey(launch.launched_at);

        if (!topicMap.has(niche)) {
            topicMap.set(niche, new Map());
        }

        const nicheData = topicMap.get(niche)!;
        if (!nicheData.has(monthKey)) {
            nicheData.set(monthKey, { launches: [], votes: 0, comments: 0 });
        }

        const monthData = nicheData.get(monthKey)!;
        monthData.launches.push(launch);
        monthData.votes += launch.votes_count || 0;
        monthData.comments += launch.comments_count || 0;
    });

    // Convert to array and calculate metrics
    const results: TopicVelocityData[] = [];

    topicMap.forEach((monthsData, topic) => {
        const timeSeriesData = Array.from(monthsData.entries())
            .map(([month, data]) => ({
                month,
                launchCount: data.launches.length,
                avgUpvotes: Math.round(data.votes / data.launches.length),
                avgComments: Math.round(data.comments / data.launches.length),
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        const totalLaunches = timeSeriesData.reduce((sum, d) => sum + d.launchCount, 0);

        // Calculate trend
        const recentHalf = timeSeriesData.slice(-Math.ceil(timeSeriesData.length / 2));
        const olderHalf = timeSeriesData.slice(0, Math.floor(timeSeriesData.length / 2));
        const recentAvg = recentHalf.reduce((sum, d) => sum + d.launchCount, 0) / recentHalf.length;
        const olderAvg = olderHalf.reduce((sum, d) => sum + d.launchCount, 0) / olderHalf.length;

        let trend: 'rising' | 'stable' | 'declining' = 'stable';
        if (recentAvg > olderAvg * 1.3) trend = 'rising';
        else if (recentAvg < olderAvg * 0.7) trend = 'declining';

        results.push({
            topic,
            timeSeriesData,
            totalLaunches,
            trend,
        });
    });

    return results.sort((a, b) => b.totalLaunches - a.totalLaunches).slice(0, 10);
}

// ============================================
// 1.5 MARKET LANDSCAPE TREEMAP
// ============================================

export interface TreemapData {
    name: string;
    size: number; // Total Launches
    growth: number; // Growth Rate %
    sentiment: number; // Avg Upvotes (proxy for sentiment/demand)
    children?: TreemapData[];
    [key: string]: any; // Index signature for Recharts
}

export async function getMarketTreemap(): Promise<TreemapData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, launched_at')
        .not('ai_analysis', 'is', null)
        .gte('launched_at', getMonthsAgo(12));

    if (!launches) return [];

    const categoryMap = new Map<string, {
        launches: number;
        recentLaunches: number;
        oldLaunches: number;
        totalVotes: number;
    }>();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    launches.forEach(launch => {
        const rawNiche = launch.ai_analysis?.niche || 'Unknown';
        const niche = mapNicheToCategory(rawNiche);

        if (niche === 'Other') return;

        if (!categoryMap.has(niche)) {
            categoryMap.set(niche, { launches: 0, recentLaunches: 0, oldLaunches: 0, totalVotes: 0 });
        }

        const data = categoryMap.get(niche)!;
        data.launches += 1;
        data.totalVotes += launch.votes_count || 0;

        if (new Date(launch.launched_at) > sixMonthsAgo) {
            data.recentLaunches += 1;
        } else {
            data.oldLaunches += 1;
        }
    });

    const results: TreemapData[] = [];

    categoryMap.forEach((data, name) => {
        // Calculate growth
        const growth = data.oldLaunches > 0
            ? Math.round(((data.recentLaunches - data.oldLaunches) / data.oldLaunches) * 100)
            : 100;

        const sentiment = Math.round(data.totalVotes / data.launches);

        results.push({
            name,
            size: data.launches,
            growth,
            sentiment
        });
    });

    // Wrap in a root node to ensure Recharts handles depth correctly (Root = 0, Categories = 1)
    return [{
        name: 'Market',
        size: 0, // Recharts will calculate this based on children
        growth: 0,
        sentiment: 0,
        children: results.sort((a, b) => b.size - a.size)
    }];
}

// ============================================
// 2. KEYWORD TREND ANALYZER
// ============================================

export interface KeywordTrendData {
    keyword: string;
    monthlyData: {
        month: string;
        mentions: number;
        avgUpvotes: number;
        products: { name: string; votes: number }[];
    }[];
    totalMentions: number;
    averageSuccess: number;
}

export async function getKeywordTrends(keyword: string, months = 12): Promise<KeywordTrendData | null> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('name, description, tagline, votes_count, launched_at, ai_analysis')
        .gte('launched_at', getMonthsAgo(months));

    if (!launches) return null;

    const keywordLower = keyword.toLowerCase();
    const matchingLaunches = launches.filter(l => {
        const searchText = [l.name, l.description, l.tagline, l.ai_analysis?.problem].join(' ').toLowerCase();
        return searchText.includes(keywordLower);
    });

    // Group by month
    const monthMap = new Map<string, { launches: any[], totalVotes: number }>();

    matchingLaunches.forEach(launch => {
        const monthKey = getMonthKey(launch.launched_at);
        if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, { launches: [], totalVotes: 0 });
        }

        const monthData = monthMap.get(monthKey)!;
        monthData.launches.push(launch);
        monthData.totalVotes += launch.votes_count || 0;
    });

    const monthlyData = Array.from(monthMap.entries())
        .map(([month, data]) => ({
            month,
            mentions: data.launches.length,
            avgUpvotes: data.launches.length > 0 ? Math.round(data.totalVotes / data.launches.length) : 0,
            products: data.launches
                .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
                .slice(0, 5)
                .map(l => ({ name: l.name, votes: l.votes_count || 0 })),
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    const totalMentions = matchingLaunches.length;
    const totalVotes = matchingLaunches.reduce((sum, l) => sum + (l.votes_count || 0), 0);
    const averageSuccess = totalMentions > 0 ? Math.round(totalVotes / totalMentions) : 0;

    return {
        keyword,
        monthlyData,
        totalMentions,
        averageSuccess,
    };
}

// ============================================
// 3. CATEGORY PERFORMANCE MATRIX
// ============================================

export interface CategoryPerformanceData {
    category: string;
    launchCount: number;
    avgUpvotes: number;
    avgComments: number;
    saturationScore: number; // 0-100, higher = more saturated
}

export async function getCategoryPerformanceMatrix(): Promise<CategoryPerformanceData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    const categoryMap = new Map<string, { launches: any[], totalVotes: number, totalComments: number }>();

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Unknown';
        if (!categoryMap.has(niche)) {
            categoryMap.set(niche, { launches: [], totalVotes: 0, totalComments: 0 });
        }

        const catData = categoryMap.get(niche)!;
        catData.launches.push(launch);
        catData.totalVotes += launch.votes_count || 0;
        catData.totalComments += launch.comments_count || 0;
    });

    const results: CategoryPerformanceData[] = [];

    categoryMap.forEach((data, category) => {
        const launchCount = data.launches.length;
        const avgUpvotes = Math.round(data.totalVotes / launchCount);
        const avgComments = Math.round(data.totalComments / launchCount);

        // Saturation score: high launches + low engagement = saturated
        const normalizedLaunches = Math.min(launchCount / 100, 1); // Cap at 100 launches
        const normalizedEngagement = Math.min(avgUpvotes / 500, 1); // Cap at 500 upvotes
        const saturationScore = Math.round((normalizedLaunches * 70 + (1 - normalizedEngagement) * 30) * 100);

        results.push({
            category,
            launchCount,
            avgUpvotes,
            avgComments,
            saturationScore,
        });
    });

    return results.filter(r => r.launchCount >= 5).sort((a, b) => b.launchCount - a.launchCount);
}

// ============================================
// 4. NICHE SUCCESS HISTOGRAM
// ============================================

export interface NicheHistogramData {
    niche: string;
    buckets: {
        range: string;
        count: number;
        percentage: number;
    }[];
    stats: {
        median: number;
        p90: number;
        p99: number;
        total: number;
    };
}

export async function getNicheSuccessHistogram(niche: string): Promise<NicheHistogramData | null> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, ai_analysis')
        .not('ai_analysis', 'is', null);

    if (!launches) return null;

    const nicheLaunches = launches.filter(l => l.ai_analysis?.niche === niche);

    if (nicheLaunches.length === 0) return null;

    const votes = nicheLaunches.map(l => l.votes_count || 0).sort((a, b) => a - b);

    // Define buckets
    const bucketRanges = [
        { range: '0-50', min: 0, max: 50 },
        { range: '51-100', min: 51, max: 100 },
        { range: '101-200', min: 101, max: 200 },
        { range: '201-500', min: 201, max: 500 },
        { range: '501-1000', min: 501, max: 1000 },
        { range: '1000+', min: 1001, max: Infinity },
    ];

    const buckets = bucketRanges.map(({ range, min, max }) => {
        const count = votes.filter(v => v >= min && v <= max).length;
        const percentage = Math.round((count / votes.length) * 100);
        return { range, count, percentage };
    });

    // Calculate percentiles
    const median = percentile(votes, 50);
    const p90 = percentile(votes, 90);
    const p99 = percentile(votes, 99);

    return {
        niche,
        buckets,
        stats: {
            median,
            p90,
            p99,
            total: votes.length,
        },
    };
}

// ============================================
// 5. PRODUCT SCATTER DATA (Votes vs Comments)
// ============================================

export interface ProductScatterPoint {
    name: string;
    votes: number;
    comments: number;
    niche: string;
    productType: 'Community Darling' | 'Pure Utility' | 'Niche Product' | 'Low Engagement';
}

export async function getProductScatterData(category?: string): Promise<ProductScatterPoint[]> {
    let query = supabase
        .from('ph_launches')
        .select('name, votes_count, comments_count, ai_analysis')
        .not('ai_analysis', 'is', null)
        .gte('votes_count', 50); // Only show products with meaningful data

    const { data: launches } = await query;

    if (!launches) return [];

    let filtered = launches;
    if (category) {
        filtered = launches.filter(l => l.ai_analysis?.niche === category);
    }

    return filtered.map(l => {
        const votes = l.votes_count || 0;
        const comments = l.comments_count || 0;
        const commentToVoteRatio = votes > 0 ? comments / votes : 0;

        let productType: ProductScatterPoint['productType'] = 'Niche Product';

        if (votes > 400 && comments > 100) productType = 'Community Darling';
        else if (votes > 300 && commentToVoteRatio < 0.15) productType = 'Pure Utility';
        else if (votes < 150 && comments < 30) productType = 'Low Engagement';

        return {
            name: l.name,
            votes,
            comments,
            niche: l.ai_analysis?.niche || 'Unknown',
            productType,
        };
    });
}

// ============================================
// 6. FEATURE/LANGUAGE CORRELATION
// ============================================

export interface FeatureCorrelation {
    keyword: string;
    occurrences: number;
    avgUpvotesWithKeyword: number;
    avgUpvotesWithout: number;
    uplift: number; // Percentage increase
}

export async function getFeatureCorrelation(category: string): Promise<FeatureCorrelation[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('description, tagline, votes_count, ai_analysis')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    const categoryLaunches = launches.filter(l => l.ai_analysis?.niche === category);

    // Common keywords to test
    const keywords = [
        'AI',
        'AI-powered',
        'free',
        'open source',
        'no-code',
        'automation',
        'analytics',
        'collaboration',
        'real-time',
        'integration',
        'Chrome extension',
        'API',
        'dashboard',
        'mobile',
    ];

    const results: FeatureCorrelation[] = [];

    keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        const withKeyword = categoryLaunches.filter(l => {
            const text = [l.description, l.tagline].join(' ').toLowerCase();
            return text.includes(keywordLower);
        });

        const withoutKeyword = categoryLaunches.filter(l => {
            const text = [l.description, l.tagline].join(' ').toLowerCase();
            return !text.includes(keywordLower);
        });

        if (withKeyword.length < 3) return; // Need at least 3 samples

        const avgWithKeyword = withKeyword.reduce((sum, l) => sum + (l.votes_count || 0), 0) / withKeyword.length;
        const avgWithout = withoutKeyword.length > 0
            ? withoutKeyword.reduce((sum, l) => sum + (l.votes_count || 0), 0) / withoutKeyword.length
            : 0;

        const uplift = avgWithout > 0 ? Math.round(((avgWithKeyword - avgWithout) / avgWithout) * 100) : 0;

        results.push({
            keyword,
            occurrences: withKeyword.length,
            avgUpvotesWithKeyword: Math.round(avgWithKeyword),
            avgUpvotesWithout: Math.round(avgWithout),
            uplift,
        });
    });

    return results.filter(r => Math.abs(r.uplift) > 5).sort((a, b) => b.uplift - a.uplift);
}

// ============================================
// 7. AUDIENCE IMPACT (Twitter Followers vs Upvotes)
// ============================================

export interface AudienceImpactPoint {
    makerName: string;
    productName: string;
    followers: number;
    upvotes: number;
}

export async function getAudienceImpact(): Promise<AudienceImpactPoint[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('name, votes_count, makers')
        .not('makers', 'is', null);

    if (!launches) return [];

    const points: AudienceImpactPoint[] = [];

    launches.forEach(launch => {
        const makers = launch.makers as any[];
        if (!makers || !Array.isArray(makers)) return;

        makers.forEach(maker => {
            if (maker.twitter_username && maker.twitter_followers) {
                points.push({
                    makerName: maker.name || maker.twitter_username,
                    productName: launch.name,
                    followers: maker.twitter_followers,
                    upvotes: launch.votes_count || 0,
                });
            }
        });
    });

    return points.filter(p => p.followers > 0 && p.upvotes > 0);
}

// ============================================
// 8. SERIAL MAKER SUCCESS
// ============================================

export interface SerialMakerData {
    launchNumber: string;
    avgUpvotes: number;
    count: number;
}

export async function getSerialMakerSuccess(): Promise<SerialMakerData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, makers, launched_at')
        .not('makers', 'is', null)
        .order('launched_at', { ascending: true });

    if (!launches) return [];

    // Track maker launch history
    const makerHistory = new Map<string, { launches: { votes: number; date: string }[] }>();

    launches.forEach(launch => {
        const makers = launch.makers as any[];
        if (!makers || !Array.isArray(makers)) return;

        makers.forEach(maker => {
            const makerKey = maker.twitter_username || maker.name;
            if (!makerKey) return;

            if (!makerHistory.has(makerKey)) {
                makerHistory.set(makerKey, { launches: [] });
            }

            makerHistory.get(makerKey)!.launches.push({
                votes: launch.votes_count || 0,
                date: launch.launched_at,
            });
        });
    });

    // Calculate averages by launch number
    const launchNumberData = new Map<number, { totalVotes: number; count: number }>();

    makerHistory.forEach(history => {
        if (history.launches.length < 2) return; // Only serial makers

        history.launches.forEach((launch, index) => {
            const launchNum = index + 1;
            if (!launchNumberData.has(launchNum)) {
                launchNumberData.set(launchNum, { totalVotes: 0, count: 0 });
            }

            const data = launchNumberData.get(launchNum)!;
            data.totalVotes += launch.votes;
            data.count += 1;
        });
    });

    const results: SerialMakerData[] = [];
    launchNumberData.forEach((data, launchNum) => {
        if (launchNum <= 5) { // Only show first 5 launches
            results.push({
                launchNumber: launchNum === 1 ? '1st' : launchNum === 2 ? '2nd' : launchNum === 3 ? '3rd' : `${launchNum}th`,
                avgUpvotes: Math.round(data.totalVotes / data.count),
                count: data.count,
            });
        }
    });

    return results.sort((a, b) => parseInt(a.launchNumber) - parseInt(b.launchNumber));
}

// ============================================
// 9. LAUNCH TIME HEATMAP
// ============================================

export interface LaunchTimeData {
    day: string;
    hour: number;
    avgUpvotes: number;
    launchCount: number;
}

export async function getLaunchTimeHeatmap(): Promise<LaunchTimeData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, launched_at, rank_of_day')
        .gte('rank_of_day', 1)
        .lte('rank_of_day', 5); // Only look at top 5 products of the day

    if (!launches) return [];

    const heatmapData = new Map<string, { totalVotes: number; count: number }>();

    launches.forEach(launch => {
        const date = new Date(launch.launched_at);
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
        const hour = date.getUTCHours(); // PST is typically UTC-8 or UTC-7, but we'll use UTC for global launches

        const key = `${day}-${hour}`;

        if (!heatmapData.has(key)) {
            heatmapData.set(key, { totalVotes: 0, count: 0 });
        }

        const data = heatmapData.get(key)!;
        data.totalVotes += launch.votes_count || 0;
        data.count += 1;
    });

    const results: LaunchTimeData[] = [];

    heatmapData.forEach((data, key) => {
        const [day, hourStr] = key.split('-');
        results.push({
            day,
            hour: parseInt(hourStr),
            avgUpvotes: Math.round(data.totalVotes / data.count),
            launchCount: data.count,
        });
    });

    return results;
}

// ============================================
// 10. MARKET GAPS (Blue Ocean Opportunities)
// ============================================

export interface MarketGap {
    problem: string;
    icp: string;
    niche: string;
    currentProducts: number;
    avgEngagement: number;
    opportunityScore: number;
    reasoning: string;
}

export async function getMarketGaps(): Promise<MarketGap[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, comments_count, ai_analysis')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    // Group by ICP + Problem combination
    const combinationMap = new Map<string, {
        icp: string;
        problem: string;
        niche: string;
        products: any[];
        totalEngagement: number;
    }>();

    launches.forEach(launch => {
        const icp = launch.ai_analysis?.icp;
        const problem = launch.ai_analysis?.problem;
        const niche = launch.ai_analysis?.niche;

        if (!icp || !problem || !niche) return;

        const key = `${icp}|${problem}`;

        if (!combinationMap.has(key)) {
            combinationMap.set(key, {
                icp,
                problem,
                niche,
                products: [],
                totalEngagement: 0,
            });
        }

        const data = combinationMap.get(key)!;
        data.products.push(launch);
        data.totalEngagement += (launch.votes_count || 0) + (launch.comments_count || 0) * 2;
    });

    // Find gaps: low product count + high engagement potential
    const gaps: MarketGap[] = [];

    combinationMap.forEach(data => {
        const productCount = data.products.length;
        const avgEngagement = Math.round(data.totalEngagement / productCount);

        // Opportunity = high engagement but low competition
        if (productCount <= 3 && avgEngagement > 200) {
            const opportunityScore = Math.round(
                (avgEngagement * 0.6) + // Higher engagement = better
                ((10 - productCount) * 50) // Fewer products = better
            );

            gaps.push({
                problem: data.problem,
                icp: data.icp,
                niche: data.niche,
                currentProducts: productCount,
                avgEngagement,
                opportunityScore,
                reasoning: `Only ${productCount} product(s) addressing this for ${data.icp}, with ${avgEngagement} avg engagement. Clear demand with low supply.`,
            });
        }
    });

    return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20);
}

// ============================================
// ADDITIONAL ANALYTICS
// ============================================

// Team Size Impact
export async function getTeamSizeImpact() {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, makers')
        .not('makers', 'is', null);

    if (!launches) return [];

    const teamSizeMap = new Map<number, { totalVotes: number; count: number }>();

    launches.forEach(launch => {
        const makers = launch.makers as any[];
        if (!makers || !Array.isArray(makers)) return;

        const teamSize = Math.min(makers.length, 5); // Cap at 5+

        if (!teamSizeMap.has(teamSize)) {
            teamSizeMap.set(teamSize, { totalVotes: 0, count: 0 });
        }

        const data = teamSizeMap.get(teamSize)!;
        data.totalVotes += launch.votes_count || 0;
        data.count += 1;
    });

    const results = Array.from(teamSizeMap.entries()).map(([size, data]) => ({
        teamSize: size >= 5 ? '5+' : size.toString(),
        avgUpvotes: Math.round(data.totalVotes / data.count),
        productCount: data.count,
    }));

    return results.sort((a, b) => parseInt(a.teamSize) - parseInt(b.teamSize));
}

// Market Health Metrics
export async function getMarketHealth() {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, comments_count, launched_at')
        .gte('launched_at', getMonthsAgo(6));

    if (!launches) return null;

    const totalProducts = launches.length;
    const avgUpvotes = Math.round(launches.reduce((sum, l) => sum + (l.votes_count || 0), 0) / totalProducts);
    const avgComments = Math.round(launches.reduce((sum, l) => sum + (l.comments_count || 0), 0) / totalProducts);

    const highPerformers = launches.filter(l => (l.votes_count || 0) > 500).length;
    const successRate = Math.round((highPerformers / totalProducts) * 100);

    return {
        totalProducts,
        avgUpvotes,
        avgComments,
        highPerformers,
        successRate,
    };
}

// Top Categories by Various Metrics
export async function getTopCategories(metric: 'launches' | 'engagement' | 'growth' = 'launches', limit: number = 10) {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count, launched_at')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    const categoryMap = new Map<string, {
        launches: number;
        totalEngagement: number;
        totalVotes: number;
        totalComments: number;
        recentLaunches: number;
        oldLaunches: number;
    }>();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Unknown';
        if (!categoryMap.has(niche)) {
            categoryMap.set(niche, {
                launches: 0,
                totalEngagement: 0,
                totalVotes: 0,
                totalComments: 0,
                recentLaunches: 0,
                oldLaunches: 0
            });
        }

        const data = categoryMap.get(niche)!;
        data.launches += 1;
        data.totalVotes += (launch.votes_count || 0);
        data.totalComments += (launch.comments_count || 0);
        data.totalEngagement += (launch.votes_count || 0) + (launch.comments_count || 0) * 2;

        if (new Date(launch.launched_at) > sixMonthsAgo) {
            data.recentLaunches += 1;
        } else {
            data.oldLaunches += 1;
        }
    });

    const results = Array.from(categoryMap.entries()).map(([category, data]) => {
        const growthRate = data.oldLaunches > 0
            ? Math.round(((data.recentLaunches - data.oldLaunches) / data.oldLaunches) * 100)
            : 100;

        return {
            category,
            launches: data.launches,
            totalVotes: data.totalVotes,
            totalComments: data.totalComments,
            avgEngagement: Math.round(data.totalEngagement / data.launches),
            growthRate,
        };
    });

    // Sort by selected metric
    let sortedResults;
    if (metric === 'launches') {
        sortedResults = results.sort((a, b) => b.launches - a.launches);
    } else if (metric === 'engagement') {
        sortedResults = results.sort((a, b) => b.avgEngagement - a.avgEngagement);
    } else {
        sortedResults = results.sort((a, b) => b.growthRate - a.growthRate);
    }

    if (limit > 0) {
        return sortedResults.slice(0, limit);
    }
    return sortedResults;
}

// ============================================
// MARKET GAP FINDER (2x2 Matrix for Blue Ocean Opportunities)
// ============================================

export interface MarketGapMatrix {
    category: string;
    launchVolume: number; // X-axis: Competition/Saturation
    avgUpvotes: number; // Y-axis: Demand/Interest
    avgComments: number;
    quadrant: 'blue-ocean' | 'red-ocean' | 'niche' | 'emerging';
    opportunityScore: number;
}

export async function getMarketGapMatrix(): Promise<MarketGapMatrix[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    const categoryMap = new Map<string, { launches: any[], totalVotes: number, totalComments: number }>();

    launches.forEach(launch => {
        const category = launch.ai_analysis?.niche || 'Unknown';
        if (!categoryMap.has(category)) {
            categoryMap.set(category, { launches: [], totalVotes: 0, totalComments: 0 });
        }

        const data = categoryMap.get(category)!;
        data.launches.push(launch);
        data.totalVotes += launch.votes_count || 0;
        data.totalComments += launch.comments_count || 0;
    });

    const results: MarketGapMatrix[] = [];

    // Calculate median values for quadrant assignment
    const allVolumes = Array.from(categoryMap.values()).map(d => d.launches.length);
    const allAvgUpvotes = Array.from(categoryMap.values()).map(d => d.totalVotes / d.launches.length);
    const medianVolume = median(allVolumes);
    const medianUpvotes = median(allAvgUpvotes);

    categoryMap.forEach((data, category) => {
        const launchVolume = data.launches.length;
        const avgUpvotes = Math.round(data.totalVotes / launchVolume);
        const avgComments = Math.round(data.totalComments / launchVolume);

        // Determine quadrant
        let quadrant: MarketGapMatrix['quadrant'];
        if (launchVolume < medianVolume && avgUpvotes > medianUpvotes) {
            quadrant = 'blue-ocean'; // LOW competition, HIGH demand
        } else if (launchVolume > medianVolume && avgUpvotes > medianUpvotes) {
            quadrant = 'red-ocean'; // HIGH competition, HIGH demand
        } else if (launchVolume < medianVolume && avgUpvotes < medianUpvotes) {
            quadrant = 'niche'; // LOW competition, LOW demand
        } else {
            quadrant = 'emerging'; // HIGH competition, LOW demand
        }

        // Opportunity score (higher = better opportunity)
        // Blue ocean gets highest score, red ocean gets moderate, rest gets low
        const demandScore = (avgUpvotes / medianUpvotes) * 100;
        const competitionPenalty = (launchVolume / medianVolume) * 50;
        const opportunityScore = Math.round(demandScore - competitionPenalty);

        results.push({
            category,
            launchVolume,
            avgUpvotes,
            avgComments,
            quadrant,
            opportunityScore
        });
    });

    // Filter to categories with at least 5 products
    return results
        .filter(r => r.launchVolume >= 5)
        .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// Helper function for median
function median(arr: number[]): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

// ============================================
// TOP 3 CATEGORIES BY UPVOTES VS PRODUCTS
// ============================================

export interface Top3CategoryData {
    category: string;
    totalUpvotes: number;
    productCount: number;
    avgUpvotes: number;
}

export async function getTop3Categories(): Promise<Top3CategoryData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    const categoryMap = new Map<string, { totalUpvotes: number; productCount: number }>();

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Unknown';
        if (!categoryMap.has(niche)) {
            categoryMap.set(niche, { totalUpvotes: 0, productCount: 0 });
        }

        const data = categoryMap.get(niche)!;
        data.totalUpvotes += launch.votes_count || 0;
        data.productCount += 1;
    });

    const results: Top3CategoryData[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
            category,
            totalUpvotes: data.totalUpvotes,
            productCount: data.productCount,
            avgUpvotes: Math.round(data.totalUpvotes / data.productCount),
        }))
        .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
        .slice(0, 3);

    return results;
}

// ============================================
// VOTE DISTRIBUTION ACROSS PRODUCTS AND TAGS
// ============================================

export interface VoteDistributionData {
    productName: string;
    votes: number;
    tags: string[];
    tagCount: number;
}

export async function getVoteDistribution(): Promise<VoteDistributionData[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('name, votes_count, topics')
        .gte('votes_count', 50) // Only meaningful products
        .order('votes_count', { ascending: false })
        .limit(100);

    if (!launches) return [];

    return launches.map(launch => {
        const topics = launch.topics as any[];
        const tags = topics ? topics.map((t: any) => t.name || t).filter(Boolean) : [];

        return {
            productName: launch.name,
            votes: launch.votes_count || 0,
            tags,
            tagCount: tags.length,
        };
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString();
}

function getMonthKey(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
}

// ============================================
// SUCCESS PATTERNS (ICP + Problem + Niche)
// ============================================

export interface SuccessPattern {
    icp: string;
    problem: string;
    niche: string;
    count: number;
    avgVotes: number;
    avgComments: number;
    successScore: number;
}

export async function getSuccessPatterns(): Promise<SuccessPattern[]> {
    const { data: launches, error } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count')
        .not('ai_analysis', 'is', null);

    if (error || !launches) {
        console.error('Error fetching patterns:', error);
        return [];
    }

    // Group by ICP + Problem + Niche combination
    const patternMap = new Map<string, {
        count: number;
        totalVotes: number;
        totalComments: number;
        icp: string;
        problem: string;
        niche: string;
    }>();

    launches.forEach(launch => {
        const analysis = launch.ai_analysis;
        if (!analysis) return;

        const icp = analysis.icp || 'Unknown ICP';
        const problem = analysis.problem || 'Unknown Problem';
        const niche = analysis.niche || 'Unknown Niche';

        const key = `${icp}|${problem}|${niche}`;

        const existing = patternMap.get(key) || {
            count: 0,
            totalVotes: 0,
            totalComments: 0,
            icp,
            problem,
            niche,
        };

        existing.count++;
        existing.totalVotes += launch.votes_count || 0;
        existing.totalComments += launch.comments_count || 0;

        patternMap.set(key, existing);
    });

    // Convert to array and calculate success score
    return Array.from(patternMap.values())
        .filter(p => {
            // Show all patterns, but filter out "Unknown" combinations
            return p.icp !== 'Unknown ICP' && p.problem !== 'Unknown Problem';
        })
        .map(p => ({
            icp: p.icp,
            problem: p.problem,
            niche: p.niche,
            count: p.count,
            avgVotes: Math.round(p.totalVotes / p.count),
            avgComments: Math.round(p.totalComments / p.count),
            successScore: Math.round(
                (p.totalVotes / p.count * 0.6) +
                (p.totalComments / p.count * 0.3 * 5) +
                (Math.min(p.count, 10) * 10)
            ),
        }))
        .sort((a, b) => b.successScore - a.successScore)
        .slice(0, 50);
}

// ============================================
// 11. YESTERDAY'S SNAPSHOT
// ============================================

export interface YesterdayData {
    chartData: { name: string; value: number; color: string }[];
    topLaunches: {
        name: string;
        votes: number;
        comments: number;
        niche: string;
        tagline: string;
        thumbnail_url?: string;
        website_url?: string;
        launched_at: string;
    }[];
    metrics: {
        totalLaunches: number;
        aiPercentage: number;
        avgVotes: number;
        topCategory: string;
    };
}

function getColorForCategory(category: string): string {
    const colors: Record<string, string> = {
        'AI & Machine Learning': '#8b5cf6', // Violet
        'Developer Tools': '#3b82f6', // Blue
        'Productivity & Organization': '#10b981', // Emerald
        'Design & Creative': '#f43f5e', // Rose
        'Marketing & Growth': '#f59e0b', // Amber
        'Fintech & Finance': '#0ea5e9', // Sky Blue
        'Web3 & Crypto': '#6366f1', // Indigo
        'Health & Wellness': '#ec4899', // Pink
        'Education & Learning': '#14b8a6', // Teal
        'E-commerce & Retail': '#f97316', // Orange
        'Other': '#9ca3af' // Gray
    };

    if (colors[category]) return colors[category];

    // Simple hash for dynamic colors
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export async function getYesterdayLaunchesData(): Promise<YesterdayData> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const { data: launches } = await supabase
        .from('ph_launches')
        .select('name, votes_count, comments_count, tagline, ai_analysis, launched_at, thumbnail_url, website_url')
        .gte('launched_at', yesterday.toISOString())
        .lte('launched_at', endOfYesterday.toISOString())
        .order('votes_count', { ascending: false });

    if (!launches || launches.length === 0) {
        return {
            chartData: [],
            topLaunches: [],
            metrics: { totalLaunches: 0, aiPercentage: 0, avgVotes: 0, topCategory: 'N/A' }
        };
    }

    // Process Categories
    const categoryMap = new Map<string, number>();
    let aiCount = 0;
    let totalVotes = 0;

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Other';
        const category = mapNicheToCategory(niche);
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

        // Check for AI
        const isAI = niche.toLowerCase().includes('ai') ||
            launch.name.toLowerCase().includes('ai') ||
            launch.tagline.toLowerCase().includes('ai');
        if (isAI) aiCount++;

        totalVotes += launch.votes_count || 0;
    });

    // Format Chart Data
    const chartData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({
            name,
            value,
            color: getColorForCategory(name)
        }))
        .sort((a, b) => b.value - a.value);

    // Metrics
    const totalLaunches = launches.length;
    const aiPercentage = Math.round((aiCount / totalLaunches) * 100);
    const avgVotes = Math.round(totalVotes / totalLaunches);
    const topCategory = chartData.length > 0 ? chartData[0].name : 'N/A';

    // Top 50 Launches
    const topLaunches = launches.slice(0, 50).map(l => ({
        name: l.name,
        votes: l.votes_count || 0,
        comments: l.comments_count || 0,
        niche: l.ai_analysis?.niche || 'Unknown',
        tagline: l.tagline,
        thumbnail_url: l.thumbnail_url,
        website_url: l.website_url,
        launched_at: l.launched_at
    }));

    return {
        chartData,
        topLaunches,
        metrics: {
            totalLaunches,
            aiPercentage,
            avgVotes,
            topCategory
        }
    };
}

// Get Today's Live Launches Data
export async function getTodayLiveLaunchesData(): Promise<YesterdayData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const now = new Date();

    const { data: launches } = await supabase
        .from('ph_launches')
        .select('name, votes_count, comments_count, tagline, ai_analysis, launched_at, thumbnail_url, website_url')
        .gte('launched_at', today.toISOString())
        .lte('launched_at', now.toISOString())
        .order('votes_count', { ascending: false });

    if (!launches || launches.length === 0) {
        return {
            chartData: [],
            topLaunches: [],
            metrics: { totalLaunches: 0, aiPercentage: 0, avgVotes: 0, topCategory: 'N/A' }
        };
    }

    // Process Categories
    const categoryMap = new Map<string, number>();
    let aiCount = 0;
    let totalVotes = 0;

    launches.forEach(launch => {
        const niche = launch.ai_analysis?.niche || 'Other';
        const category = mapNicheToCategory(niche);
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

        // Check for AI
        const isAI = niche.toLowerCase().includes('ai') ||
            launch.name.toLowerCase().includes('ai') ||
            launch.tagline.toLowerCase().includes('ai');
        if (isAI) aiCount++;

        totalVotes += launch.votes_count || 0;
    });

    // Format Chart Data
    const chartData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({
            name,
            value,
            color: getColorForCategory(name)
        }))
        .sort((a, b) => b.value - a.value);

    // Metrics
    const totalLaunches = launches.length;
    const aiPercentage = Math.round((aiCount / totalLaunches) * 100);
    const avgVotes = Math.round(totalVotes / totalLaunches);
    const topCategory = chartData.length > 0 ? chartData[0].name : 'N/A';

    // Top 50 Launches
    const topLaunches = launches.slice(0, 50).map(l => ({
        name: l.name,
        votes: l.votes_count || 0,
        comments: l.comments_count || 0,
        niche: l.ai_analysis?.niche || 'Unknown',
        tagline: l.tagline,
        thumbnail_url: l.thumbnail_url,
        website_url: l.website_url,
        launched_at: l.launched_at
    }));

    return {
        chartData,
        topLaunches,
        metrics: {
            totalLaunches,
            aiPercentage,
            avgVotes,
            topCategory
        }
    };
}


// ============================================
// 8. DAILY LAUNCH PULSE
// ============================================

export interface DailyLaunchData {
    date: string;
    launches: {
        id: string;
        name: string;
        tagline: string;
        votes: number;
        category: string;
        rank: number;
        thumbnail?: string;
    }[];
    categoryStats: {
        name: string;
        count: number;
        totalVotes: number;
    }[];
    topProduct: {
        name: string;
        votes: number;
    } | null;
    mostDiscussed: {
        name: string;
        comments: number;
    } | null;
    mostEngaged: {
        name: string;
        comments: number;
        votes: number;
        totalEngagement: number;
    } | null;
    topCategory: {
        name: string;
        totalVotes: number;
    } | null;
    aiSummary: string;
}

export async function getDailyLaunchData(): Promise<DailyLaunchData | null> {
    // 1. Get the most recent date with launches
    const { data: latestLaunch } = await supabase
        .from('ph_launches')
        .select('launched_at')
        .order('launched_at', { ascending: false })
        .limit(1)
        .single();

    if (!latestLaunch) return null;

    const targetDate = new Date(latestLaunch.launched_at).toISOString().split('T')[0];

    // 2. Fetch all launches for that date
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('id, name, tagline, votes_count, comments_count, ai_analysis, thumbnail_url')
        .gte('launched_at', `${targetDate}T00:00:00`)
        .lt('launched_at', `${targetDate}T23:59:59`)
        .order('votes_count', { ascending: false });

    if (!launches || launches.length === 0) return null;

    // 3. Process data
    const processedLaunches = launches.map((launch, index) => ({
        id: launch.id,
        name: launch.name,
        tagline: launch.tagline,
        votes: launch.votes_count,
        comments: launch.comments_count || 0,
        category: mapNicheToCategory(launch.ai_analysis?.niche || 'Unknown'),
        rank: index + 1,
        thumbnail: launch.thumbnail_url
    }));

    // Category Stats
    const categoryMap = new Map<string, { count: number; totalVotes: number }>();
    processedLaunches.forEach(launch => {
        if (!categoryMap.has(launch.category)) {
            categoryMap.set(launch.category, { count: 0, totalVotes: 0 });
        }
        const stats = categoryMap.get(launch.category)!;
        stats.count += 1;
        stats.totalVotes += launch.votes;
    });

    const categoryStats = Array.from(categoryMap.entries())
        .map(([name, stats]) => ({
            name,
            count: stats.count,
            totalVotes: stats.totalVotes
        }))
        .sort((a, b) => b.count - a.count);

    // Top Highlights
    const topProduct = processedLaunches[0] ? { name: processedLaunches[0].name, votes: processedLaunches[0].votes } : null;

    // Find most discussed (comments only)
    const sortedByComments = [...processedLaunches].sort((a, b) => b.comments - a.comments);
    const mostDiscussed = sortedByComments[0] ? { name: sortedByComments[0].name, comments: sortedByComments[0].comments } : null;

    // Find most engaged (votes + comments * 2)
    const sortedByEngagement = [...processedLaunches].sort((a, b) => (b.votes + b.comments * 2) - (a.votes + a.comments * 2));
    const mostEngaged = sortedByEngagement[0] ? {
        name: sortedByEngagement[0].name,
        comments: sortedByEngagement[0].comments,
        votes: sortedByEngagement[0].votes,
        totalEngagement: sortedByEngagement[0].votes + (sortedByEngagement[0].comments * 2)
    } : null;

    const topCategory = categoryStats.sort((a, b) => b.totalVotes - a.totalVotes)[0] || null;

    // Generate AI Summary (Opportunity Focused)
    const totalVotes = processedLaunches.reduce((sum, l) => sum + l.votes, 0);
    const dominantCategory = categoryStats[0];

    // Find "Blue Ocean" opportunities: Categories with high avg votes but low count (not the top category)
    const opportunities = categoryStats
        .filter(c => c.count < categoryStats[0].count && c.count > 0) // Not the most crowded
        .map(c => ({ ...c, avgVotes: c.totalVotes / c.count }))
        .sort((a, b) => b.avgVotes - a.avgVotes);

    const topOpportunity = opportunities[0];

    let summary = `Builders, pay attention: While ${dominantCategory.name} is crowded with ${dominantCategory.count} launches, the real opportunity might be in **${topOpportunity?.name || 'niche markets'}**. `;

    if (topOpportunity) {
        summary += `This category shows high demand (avg ${Math.round(topOpportunity.avgVotes)} votes/launch) but low supply. `;
    }

    if (mostDiscussed) {
        summary += `User discussions are heating up around **${mostDiscussed.name}**, suggesting a specific pain point in the ${mapNicheToCategory(processedLaunches.find(l => l.name === mostDiscussed.name)?.category || '')} space. `;
    }

    summary += `The market is signaling a need for quality over quantity—${processedLaunches.length} products launched, but engagement is concentrating on those solving real problems.`;

    return {
        date: targetDate,
        launches: processedLaunches.slice(0, 50), // Top 50
        categoryStats,
        topProduct,
        mostDiscussed,
        mostEngaged,
        topCategory,
        aiSummary: summary
    };
}

export interface MarketGapItem {
    x: number; // Competition (Launch Count)
    y: number; // Engagement (Avg Votes)
    z: number; // Market Size (Total Votes)
    name: string;
    fill: string;
    opportunityScore: number;
}

export interface MarketGapData {
    scatterData: MarketGapItem[];
    topOpportunity: {
        name: string;
        avgVotes: number;
        competition: number;
        description: string;
    } | null;
}

export async function getMarketGapData(): Promise<MarketGapData | null> {
    // Fetch last 30 days of data for a robust analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString();

    const { data: launches } = await supabase
        .from('ph_launches')
        .select('votes_count, ai_analysis')
        .gte('launched_at', startDate);

    if (!launches || launches.length === 0) return null;

    // Aggregate by Category
    const categoryMap = new Map<string, { count: number; totalVotes: number }>();

    launches.forEach(launch => {
        const category = mapNicheToCategory(launch.ai_analysis?.niche || 'Unknown');
        if (!categoryMap.has(category)) {
            categoryMap.set(category, { count: 0, totalVotes: 0 });
        }
        const stats = categoryMap.get(category)!;
        stats.count += 1;
        stats.totalVotes += launch.votes_count;
    });

    // Transform to Scatter Data
    const scatterData: MarketGapItem[] = Array.from(categoryMap.entries())
        .map(([name, stats]) => {
            const avgVotes = stats.totalVotes / stats.count;
            // Opportunity Score: High Avg Votes / Low Count
            // We weigh Avg Votes higher
            const opportunityScore = avgVotes / Math.sqrt(stats.count);

            let fill = '#9CA3AF'; // Gray (Neutral)
            if (opportunityScore > 50) fill = '#10B981'; // Green (Opportunity)
            if (stats.count > 50 && avgVotes < 50) fill = '#EF4444'; // Red (Saturated)
            if (stats.count > 50 && avgVotes > 100) fill = '#F59E0B'; // Orange (Competitive but High Reward)

            return {
                x: stats.count,
                y: Math.round(avgVotes),
                z: stats.totalVotes, // Bubble size
                name,
                fill,
                opportunityScore
            };
        })
        .filter(item => item.name !== 'Unknown' && item.x > 2); // Filter out noise

    // Find Top Opportunity
    const sortedOpportunities = [...scatterData].sort((a, b) => b.opportunityScore - a.opportunityScore);
    const topOpp = sortedOpportunities[0];

    const topOpportunity = topOpp ? {
        name: topOpp.name,
        avgVotes: topOpp.y,
        competition: topOpp.x,
        description: `High demand (${topOpp.y} avg votes) with relatively low competition (${topOpp.x} launches in 30 days).`
    } : null;

    return {
        scatterData,
        topOpportunity
    };
}
