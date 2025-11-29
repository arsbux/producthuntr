import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function guessCategory(post: any): string {
    const text = (post.product_name + ' ' + post.tagline + ' ' + (post.topics?.join(' ') || '')).toLowerCase();

    if (text.includes('ai') || text.includes('gpt') || text.includes('machine learning')) return 'AI & Machine Learning';
    if (text.includes('dev') || text.includes('api') || text.includes('code')) return 'Developer Tools';
    if (text.includes('design') || text.includes('ui') || text.includes('figma')) return 'Design & Creative';
    if (text.includes('marketing') || text.includes('seo')) return 'Marketing & Growth';
    if (text.includes('productivity') || text.includes('task')) return 'Productivity & Organization';

    return 'Other';
}

export async function getTrendOverview(timeframeHours: number = 24) {
    const now = new Date();
    // Fetch snapshots for the last 24h + buffer
    const past = new Date(now.getTime() - timeframeHours * 60 * 60 * 1000);

    const { data: snapshots, error } = await supabase
        .from('vote_snapshots')
        .select('*')
        .gte('snapshot_time', past.toISOString())
        .order('snapshot_time', { ascending: true });

    if (error || !snapshots) {
        console.error('Error fetching snapshots:', error);
        return null;
    }

    // Group by product
    const products = new Map<string, any[]>();
    snapshots.forEach(s => {
        if (!products.has(s.product_id)) products.set(s.product_id, []);
        products.get(s.product_id)!.push(s);
    });

    const risingProducts = [];
    const categoryCounts = new Map<string, number>();

    for (const [id, snaps] of products) {
        if (snaps.length < 2) continue;

        // Sort by time just in case
        snaps.sort((a, b) => new Date(a.snapshot_time).getTime() - new Date(b.snapshot_time).getTime());

        const current = snaps[snaps.length - 1];
        const start = snaps[0]; // First snapshot in the window

        const votesNow = current.votes_count;
        const votesStart = start.votes_count;
        const deltaVotes = votesNow - votesStart;

        // Velocity Multiplier (e.g., 3x)
        // Avoid division by zero
        const velocity = votesStart > 0 ? (votesNow / votesStart) : (votesNow > 0 ? votesNow : 0);

        // Category
        const category = guessCategory(current);
        categoryCounts.set(category, (categoryCounts.get(category) || 0) + deltaVotes);

        if (deltaVotes > 0) {
            risingProducts.push({
                id: current.product_id,
                name: current.product_name,
                tagline: current.tagline,
                category,
                votes: votesNow,
                deltaVotes,
                velocity: votesStart > 0 ? (votesNow / votesStart).toFixed(1) + 'x' : 'New',
                comments: current.comments_count,
                thumbnail_url: current.thumbnail_url,
                topics: current.topics || [],
                ph_url: current.ph_url
            });
        }
    }

    // Sort by Delta Votes (Absolute growth)
    risingProducts.sort((a, b) => b.deltaVotes - a.deltaVotes);

    // Global Stats
    const totalLaunches = risingProducts.length;
    const spikes = risingProducts.filter(p => p.deltaVotes > 20).length; // Threshold > 20 votes in 24h

    // Top Category
    let topCategory = 'N/A';
    let maxCatVotes = 0;
    categoryCounts.forEach((votes, cat) => {
        if (votes > maxCatVotes) {
            maxCatVotes = votes;
            topCategory = cat;
        }
    });

    const biggestMover = risingProducts[0] || null;

    return {
        globalStats: {
            totalLaunches,
            spikes,
            topCategory,
            biggestMover
        },
        risingProducts: risingProducts.slice(0, 50) // Top 50
    };
}

export async function getAggregatedTrends(startDate: Date, useSnapshots = false) {
    if (useSnapshots) {
        return getSnapshotTrends(startDate);
    }

    const { data: launches, count, error } = await supabase
        .from('ph_launches')
        .select('id, name, votes_count, comments_count, topics, launched_at, tagline', { count: 'exact' })
        .gte('launched_at', startDate.toISOString())
        .order('votes_count', { ascending: false })
        .limit(10000);

    if (error) {
        console.error('Error fetching aggregated trends:', error);
        return { keywords: [], categories: [], totalLaunches: 0, history: [] };
    }

    // Aggregate by Keyword
    const keywordStats = new Map<string, { launches: number, votes: number, comments: number }>();
    // Aggregate by Category
    const categoryStats = new Map<string, { launches: number, votes: number, comments: number }>();

    launches?.forEach(l => {
        // Keywords
        l.topics?.forEach((t: string) => {
            const k = t.toLowerCase();
            if (!keywordStats.has(k)) keywordStats.set(k, { launches: 0, votes: 0, comments: 0 });
            const stat = keywordStats.get(k)!;
            stat.launches++;
            stat.votes += l.votes_count;
            stat.comments += l.comments_count;
        });

        // Category
        const cat = guessCategory(l);
        if (cat !== 'Other') {
            if (!categoryStats.has(cat)) categoryStats.set(cat, { launches: 0, votes: 0, comments: 0 });
            const cStat = categoryStats.get(cat)!;
            cStat.launches++;
            cStat.votes += l.votes_count;
            cStat.comments += l.comments_count;
        }
    });

    // Convert to arrays and sort
    const keywords = Array.from(keywordStats.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avgVotes: Math.round(stats.votes / stats.launches)
    })).sort((a, b) => b.votes - a.votes).slice(0, 50);

    const categories = Array.from(categoryStats.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avgVotes: Math.round(stats.votes / stats.launches)
    })).sort((a, b) => b.votes - a.votes);

    // Top items sets for filtering history
    const topKeywords = new Set(keywords.slice(0, 20).map(k => k.name));
    const topCategories = new Set(categories.slice(0, 20).map(c => c.name));

    // Build History
    const historyMap = new Map<string, { date: string, keywords: Record<string, any>, categories: Record<string, any> }>();

    launches?.forEach(l => {
        const date = new Date(l.launched_at).toLocaleDateString('en-CA');
        if (!historyMap.has(date)) historyMap.set(date, { date, keywords: {}, categories: {} });
        const day = historyMap.get(date)!;

        // Keywords
        l.topics?.forEach((t: string) => {
            const k = t.toLowerCase();
            if (topKeywords.has(k)) {
                if (!day.keywords[k]) day.keywords[k] = { launches: 0, votes: 0, comments: 0 };
                day.keywords[k].launches++;
                day.keywords[k].votes += l.votes_count;
                day.keywords[k].comments += l.comments_count;
            }
        });

        // Category
        const cat = guessCategory(l);
        if (topCategories.has(cat)) {
            if (!day.categories[cat]) day.categories[cat] = { launches: 0, votes: 0, comments: 0 };
            day.categories[cat].launches++;
            day.categories[cat].votes += l.votes_count;
            day.categories[cat].comments += l.comments_count;
        }
    });

    const history = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { keywords, categories, totalLaunches: count || launches?.length || 0, history };
}

async function getSnapshotTrends(startDate: Date) {
    // Fetch snapshots
    const { data: snapshots, error } = await supabase
        .from('vote_snapshots')
        .select('product_id, votes, comments, recorded_at')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

    if (error || !snapshots?.length) return { keywords: [], categories: [], totalLaunches: 0, history: [] };

    // Group by product to calculate deltas
    const productMap = new Map<string, any[]>();
    snapshots.forEach(s => {
        if (!productMap.has(s.product_id)) productMap.set(s.product_id, []);
        productMap.get(s.product_id)!.push(s);
    });

    const productDeltas = new Map<string, { votes: number, comments: number }>();
    for (const [pid, snaps] of productMap) {
        const first = snaps[0];
        const last = snaps[snaps.length - 1];
        productDeltas.set(pid, {
            votes: last.votes - first.votes,
            comments: last.comments - first.comments
        });
    }

    // Fetch product details
    const productIds = Array.from(productDeltas.keys());
    const { data: products } = await supabase
        .from('ph_launches')
        .select('id, name, topics, tagline, description, launched_at')
        .in('id', productIds);

    // Aggregate
    const keywordStats = new Map<string, { launches: number, votes: number, comments: number }>();
    const categoryStats = new Map<string, { launches: number, votes: number, comments: number }>();

    products?.forEach(p => {
        const delta = productDeltas.get(p.id) || { votes: 0, comments: 0 };
        if (delta.votes < 0) delta.votes = 0;

        // Keywords
        p.topics?.forEach((t: string) => {
            const k = t.toLowerCase();
            if (!keywordStats.has(k)) keywordStats.set(k, { launches: 0, votes: 0, comments: 0 });
            const stat = keywordStats.get(k)!;
            stat.launches++; // Active products
            stat.votes += delta.votes;
            stat.comments += delta.comments;
        });

        // Category
        const cat = guessCategory(p);
        if (cat !== 'Other') {
            if (!categoryStats.has(cat)) categoryStats.set(cat, { launches: 0, votes: 0, comments: 0 });
            const cStat = categoryStats.get(cat)!;
            cStat.launches++;
            cStat.votes += delta.votes;
            cStat.comments += delta.comments;
        }
    });

    // Convert and sort
    const keywords = Array.from(keywordStats.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avgVotes: Math.round(stats.votes / stats.launches)
    })).sort((a, b) => b.votes - a.votes).slice(0, 50);

    const categories = Array.from(categoryStats.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        avgVotes: Math.round(stats.votes / stats.launches)
    })).sort((a, b) => b.votes - a.votes);

    // History (Hourly buckets for snapshots)
    const topKeywords = new Set(keywords.slice(0, 20).map(k => k.name));
    const topCategories = new Set(categories.slice(0, 20).map(c => c.name));

    const historyMap = new Map<string, { date: string, keywords: Record<string, any>, categories: Record<string, any> }>();

    // We iterate through snapshots to build history
    // We need to join with product details to know keywords/category
    const productInfo = new Map(products?.map(p => [p.id, p]));

    snapshots.forEach(s => {
        const p = productInfo.get(s.product_id);
        if (!p) return;

        // Bucket by hour
        const date = new Date(s.recorded_at);
        date.setMinutes(0, 0, 0); // Round to hour
        const key = date.toISOString();

        if (!historyMap.has(key)) historyMap.set(key, { date: key, keywords: {}, categories: {} });
        const bucket = historyMap.get(key)!;

        // We need delta for this snapshot relative to previous in this bucket? 
        // Or just cumulative votes in this bucket?
        // Charts usually show value over time.
        // If we show "Votes", it should be the total votes at that time?
        // Or votes gained in that hour?
        // The main chart shows "Growth Trends".
        // If we show total votes, it will be a monotonically increasing line (mostly).
        // If we show velocity (votes/hour), it's a spike chart.
        // The existing implementation for long-term uses `day.votes += l.votes_count`.
        // That sums up the TOTAL votes of launches in that day.
        // So it shows the "volume of votes generated by launches on that day".

        // For snapshots (24h), we probably want "Total votes accumulated by top keywords at this hour".
        // So we sum up the current votes of all active products in that keyword at that time.

        // Keywords
        p.topics?.forEach((t: string) => {
            const k = t.toLowerCase();
            if (topKeywords.has(k)) {
                if (!bucket.keywords[k]) bucket.keywords[k] = { launches: 0, votes: 0, comments: 0 };
                bucket.keywords[k].votes += s.votes; // Sum of current votes
                // This might be huge if we sum all products.
                // But it's consistent with "Total votes of launches in this bucket".
            }
        });

        // Category
        const cat = guessCategory(p);
        if (topCategories.has(cat)) {
            if (!bucket.categories[cat]) bucket.categories[cat] = { launches: 0, votes: 0, comments: 0 };
            bucket.categories[cat].votes += s.votes;
        }
    });

    const history = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return { keywords, categories, totalLaunches: productIds.length, history };
}
