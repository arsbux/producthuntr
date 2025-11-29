import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Frontend API: Reads rich data directly from vote_snapshots
 */
export async function GET() {
    try {
        // 1. Get today's date in Pacific Time (Product Hunt's timezone)
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

        // 1. Find the latest snapshot time for today
        const { data: latestTimeData, error: timeError } = await supabase
            .from('vote_snapshots')
            .select('snapshot_time')
            .eq('snapshot_date', today)
            .order('snapshot_time', { ascending: false })
            .limit(1)
            .single();

        if (timeError || !latestTimeData) {
            console.log('[Frontend API] No snapshots found for today');
            return NextResponse.json({ chartData: [], topLaunches: [], metrics: {} });
        }

        const latestSnapshotTime = latestTimeData.snapshot_time;
        console.log(`[Frontend API] Fetching snapshot from: ${latestSnapshotTime}`);

        // 2. Fetch all records for that specific snapshot time
        const { data: snapshots, error } = await supabase
            .from('vote_snapshots')
            .select('*')
            .eq('snapshot_time', latestSnapshotTime)
            .order('votes_count', { ascending: false });

        if (error || !snapshots) {
            console.error('[Frontend API] Error:', error);
            return NextResponse.json({ chartData: [], topLaunches: [], metrics: {} });
        }

        // Helper: Categorize based on topics/name
        function guessCategory(post: any): string {
            const text = (post.product_name + ' ' + post.tagline + ' ' + (post.topics?.join(' ') || '')).toLowerCase();

            if (text.includes('ai') || text.includes('gpt') || text.includes('machine learning')) return 'AI & Machine Learning';
            if (text.includes('dev') || text.includes('api') || text.includes('code')) return 'Developer Tools';
            if (text.includes('design') || text.includes('ui') || text.includes('figma')) return 'Design & Creative';
            if (text.includes('marketing') || text.includes('seo')) return 'Marketing & Growth';
            if (text.includes('productivity') || text.includes('task')) return 'Productivity & Organization';

            return 'Other';
        }

        function getCategoryColor(category: string): string {
            const colors: Record<string, string> = {
                'AI & Machine Learning': '#8b5cf6',
                'Developer Tools': '#3b82f6',
                'Productivity & Organization': '#10b981',
                'Design & Creative': '#f43f5e',
                'Marketing & Growth': '#f59e0b',
                'Fintech & Finance': '#0ea5e9',
                'Health & Wellness': '#ec4899',
                'Education & Learning': '#14b8a6',
                'E-commerce & Retail': '#f97316',
                'Analytics & Data': '#0ea5e9',
                'Other': '#9ca3af'
            };
            return colors[category] || '#9ca3af';
        }

        // Process data - Calculate from ALL snapshots
        // Process data - Calculate from ALL snapshots
        const categoryStats: Record<string, { count: number, votes: number, comments: number }> = {};
        let aiCount = 0;
        let totalVotes = 0;

        // First pass: Calculate category distribution from ALL products
        snapshots.forEach(s => {
            const category = guessCategory(s);

            if (!categoryStats[category]) {
                categoryStats[category] = { count: 0, votes: 0, comments: 0 };
            }

            categoryStats[category].count++;
            categoryStats[category].votes += s.votes_count;
            categoryStats[category].comments += s.comments_count;

            if (category === 'AI & Machine Learning') aiCount++;
            totalVotes += s.votes_count;
        });

        // Second pass: Build topLaunches list (limited to 200 for performance)
        const topLaunches = snapshots.slice(0, 200).map(s => {
            const category = guessCategory(s);

            return {
                id: s.product_id,
                name: s.product_name,
                votes: s.votes_count,
                comments: s.comments_count,
                niche: category,
                tagline: s.tagline,
                thumbnail_url: s.thumbnail_url,
                website_url: s.website_url,
                launched_at: s.launched_at || s.snapshot_time
            };
        });

        // 3. Fetch history for Top 10 products
        const top10Ids = snapshots.slice(0, 10).map(s => s.product_id);
        const { data: historyData } = await supabase
            .from('vote_snapshots')
            .select('product_id, snapshot_time, votes_count, comments_count')
            .in('product_id', top10Ids)
            .eq('snapshot_date', today)
            .order('snapshot_time', { ascending: true });

        const productHistory = top10Ids.map((id, index) => {
            const product = snapshots.find(s => s.product_id === id);
            const productSnapshots = historyData?.filter(h => h.product_id === id) || [];

            // Assign a color from a palette
            const colors = ['#FF6154', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

            return {
                id,
                name: product?.product_name || 'Unknown',
                color: colors[index % colors.length],
                snapshots: productSnapshots
            };
        });

        // 4. Calculate Keyword/Tag Velocity (using latest snapshot totals)
        const keywordStats: Record<string, { velocity: number, volume: number }> = {};
        snapshots.forEach(s => {
            s.topics?.forEach((topic: string) => {
                if (!keywordStats[topic]) keywordStats[topic] = { velocity: 0, volume: 0 };
                keywordStats[topic].velocity += s.votes_count; // Using votes as velocity proxy
                keywordStats[topic].volume++;
            });
        });

        const keywordVelocity = Object.entries(keywordStats).map(([keyword, stats]) => ({
            keyword,
            velocity: stats.velocity,
            volume: stats.volume
        }));

        // Chart Data - Now reflects ALL products with rich stats
        const chartData = Object.entries(categoryStats)
            .filter(([name]) => name !== 'Other')
            .map(([name, stats]) => ({
                name,
                value: stats.count,
                votes: stats.votes,
                comments: stats.comments,
                color: getCategoryColor(name)
            }))
            .sort((a, b) => b.value - a.value); // Return all categories, sorted by count

        const categoryVelocity = chartData.map(c => ({
            category: c.name,
            velocity: c.votes, // Using votes as velocity proxy
            count: c.value
        }));

        // 5. Calculate Historical Trends for Categories and Keywords
        const { data: allSnapshots } = await supabase
            .from('vote_snapshots')
            .select('product_name, tagline, votes_count, comments_count, topics, snapshot_time')
            .eq('snapshot_date', today)
            .order('snapshot_time', { ascending: true });

        const timeBuckets = new Map<string, { categories: Record<string, { votes: number, comments: number }>, keywords: Record<string, { votes: number, comments: number }> }>();

        allSnapshots?.forEach(s => {
            // Group by hour/minute (simplify to every snapshot time)
            const time = new Date(s.snapshot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!timeBuckets.has(time)) {
                timeBuckets.set(time, { categories: {}, keywords: {} });
            }
            const bucket = timeBuckets.get(time)!;

            // Category Stats
            const category = guessCategory(s);
            if (category !== 'Other') {
                if (!bucket.categories[category]) bucket.categories[category] = { votes: 0, comments: 0 };
                bucket.categories[category].votes += s.votes_count;
                bucket.categories[category].comments += s.comments_count;
            }

            // Keyword Stats
            s.topics?.forEach((topic: string) => {
                if (!bucket.keywords[topic]) bucket.keywords[topic] = { votes: 0, comments: 0 };
                bucket.keywords[topic].votes += s.votes_count;
                bucket.keywords[topic].comments += s.comments_count;
            });
        });

        const trendHistory = Array.from(timeBuckets.entries()).map(([time, stats]) => ({
            time,
            categories: stats.categories,
            keywords: stats.keywords
        }));

        return NextResponse.json({
            chartData,
            topLaunches,
            productHistory,
            categoryVelocity,
            keywordVelocity,
            trendHistory,
            metrics: {
                totalLaunches: snapshots.length,
                aiPercentage: snapshots.length > 0 ? Math.round((aiCount / snapshots.length) * 100) : 0,
                avgVotes: snapshots.length > 0 ? Math.round(totalVotes / snapshots.length) : 0,
                topCategory: chartData[0]?.name || 'N/A'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
