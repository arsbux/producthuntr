import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import TrackButton from '@/components/TrackButton';
import { calculateLaunchScore } from '@/lib/scoring';
import LaunchScoreCard from '@/components/LaunchScoreCard';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, AlertTriangle, CheckCircle, Zap, Globe } from 'lucide-react';
import LaunchVelocityChart from '@/components/LaunchVelocityChart';
import GenerateAuditButton from '@/components/GenerateAuditButton';
import CategoryVelocityChart from '@/components/CategoryVelocityChart';
import KeywordVelocityChart from '@/components/KeywordVelocityChart';
import CompetitorComparison from '@/components/CompetitorComparison';
import { Skeleton } from '@/components/ui/skeleton';
import ProductDetailView from '@/components/desk/ProductDetailView';

export const dynamic = 'force-dynamic';

function guessCategory(post: any): string {
    const text = (post.product_name + ' ' + post.tagline + ' ' + (post.topics?.join(' ') || '')).toLowerCase();

    if (text.includes('ai') || text.includes('gpt') || text.includes('machine learning')) return 'AI & Machine Learning';
    if (text.includes('dev') || text.includes('api') || text.includes('code')) return 'Developer Tools';
    if (text.includes('design') || text.includes('ui') || text.includes('figma')) return 'Design & Creative';
    if (text.includes('marketing') || text.includes('seo')) return 'Marketing & Growth';
    if (text.includes('productivity') || text.includes('task')) return 'Productivity & Organization';

    return 'Other';
}

async function getLaunchData(id: string) {
    const supabase = createServerComponentClient({ cookies });

    // 1. Try fetching from ph_launches (Primary Source)
    let { data: product, error } = await supabase
        .from('ph_launches')
        .select('*')
        .eq('id', id)
        .single();

    // 2. Fallback: Try fetching from vote_snapshots if not found
    if (!product) {
        const { data: snapshot } = await supabase
            .from('vote_snapshots')
            .select('*')
            .eq('product_id', id)
            .order('snapshot_time', { ascending: false })
            .limit(1)
            .single();

        if (snapshot) {
            // Construct a temporary product object from the snapshot
            product = {
                id: snapshot.product_id,
                name: snapshot.product_name,
                tagline: snapshot.tagline,
                description: snapshot.description || 'No description available.',
                votes_count: snapshot.votes_count,
                comments_count: snapshot.comments_count,
                website_url: snapshot.website_url,
                ph_url: snapshot.ph_url,
                thumbnail_url: snapshot.thumbnail_url,
                topics: snapshot.topics || [],
                makers: snapshot.makers || [],
                launched_at: snapshot.launched_at || snapshot.snapshot_time,
                ai_analysis: null
            };
        }
    }

    if (!product) {
        return null;
    }

    // Fetch hourly history from snapshots for this product
    const { data: history } = await supabase
        .from('vote_snapshots')
        .select('votes_count, comments_count, snapshot_time')
        .eq('product_id', id)
        .order('snapshot_time', { ascending: true });

    // Fetch Similar Products
    let similarProducts = [];
    if (product.topics && product.topics.length > 0) {
        // Query ph_launches to include historical data
        const { data: similar } = await supabase
            .from('ph_launches')
            .select('id, name, tagline, topics, votes_count, comments_count, thumbnail_url, launched_at')
            .overlaps('topics', product.topics)
            .neq('id', id)
            .order('votes_count', { ascending: false })
            .limit(20);

        if (similar) {
            let candidates = similar.map((p: any) => ({
                ...p,
                product_id: p.id,      // Map for UI compatibility
                product_name: p.name,  // Map for UI compatibility
                sharedCount: p.topics ? p.topics.filter((t: string) => product.topics.includes(t)).length : 0
            }));

            // Sort by shared count desc, then votes desc
            candidates.sort((a, b) => {
                if (b.sharedCount !== a.sharedCount) return b.sharedCount - a.sharedCount;
                return b.votes_count - a.votes_count;
            });

            similarProducts = candidates.slice(0, 4);
        }
    }

    // Fetch Historical Trends (Last 14 Days) + Live Data
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: historicalLaunches } = await supabase
        .from('ph_launches')
        .select('id, name, votes_count, comments_count, topics, launched_at, tagline')
        .gte('launched_at', fourteenDaysAgo.toISOString())
        .order('launched_at', { ascending: true });

    // Process into daily buckets
    const dailyStats = new Map<string, { categories: Record<string, { votes: number, comments: number }>, keywords: Record<string, { votes: number, comments: number }> }>();

    historicalLaunches?.forEach(p => {
        const date = new Date(p.launched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyStats.has(date)) dailyStats.set(date, { categories: {}, keywords: {} });
        const day = dailyStats.get(date)!;

        // Category
        const cat = guessCategory({ product_name: p.name, tagline: p.tagline, topics: p.topics });
        if (cat !== 'Other') {
            if (!day.categories[cat]) day.categories[cat] = { votes: 0, comments: 0 };
            day.categories[cat].votes += p.votes_count;
            day.categories[cat].comments += p.comments_count;
        }

        // Keywords
        p.topics?.forEach((t: string) => {
            if (!day.keywords[t]) day.keywords[t] = { votes: 0, comments: 0 };
            day.keywords[t].votes += p.votes_count;
            day.keywords[t].comments += p.comments_count;
        });
    });

    // Add Today's Live Data
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const { data: todaySnapshots } = await supabase
        .from('vote_snapshots')
        .select('product_id, product_name, tagline, votes_count, comments_count, topics')
        .eq('snapshot_date', today);

    if (todaySnapshots && todaySnapshots.length > 0) {
        if (!dailyStats.has(todayLabel)) dailyStats.set(todayLabel, { categories: {}, keywords: {} });
        const todayBucket = dailyStats.get(todayLabel)!;

        const productMaxVotes = new Map<string, any>();
        todaySnapshots.forEach(s => {
            if (!productMaxVotes.has(s.product_id) || s.votes_count > productMaxVotes.get(s.product_id).votes_count) {
                productMaxVotes.set(s.product_id, s);
            }
        });

        productMaxVotes.forEach(p => {
            // Category
            const cat = guessCategory({ product_name: p.product_name, tagline: p.tagline, topics: p.topics });
            if (cat !== 'Other') {
                if (!todayBucket.categories[cat]) todayBucket.categories[cat] = { votes: 0, comments: 0 };
                todayBucket.categories[cat].votes += p.votes_count;
                todayBucket.categories[cat].comments += p.comments_count;
            }

            // Keywords
            p.topics?.forEach((t: string) => {
                if (!todayBucket.keywords[t]) todayBucket.keywords[t] = { votes: 0, comments: 0 };
                todayBucket.keywords[t].votes += p.votes_count;
                todayBucket.keywords[t].comments += p.comments_count;
            });
        });
    }

    const trendHistory = Array.from(dailyStats.entries()).map(([time, stats]) => ({
        time,
        categories: stats.categories,
        keywords: stats.keywords
    }));

    // Prepare data for the specific category of this product
    const productCategory = guessCategory(product);
    const categoryData = [{
        category: productCategory,
        velocity: trendHistory[trendHistory.length - 1]?.categories[productCategory]?.votes || 0,
        count: 0
    }];

    // Prepare data for the product's keywords
    const keywordVolume: Record<string, number> = {};
    historicalLaunches?.forEach(p => {
        p.topics?.forEach((t: string) => {
            keywordVolume[t] = (keywordVolume[t] || 0) + 1;
        });
    });

    const keywordData = product.topics?.map((topic: string) => ({
        keyword: topic,
        velocity: trendHistory[trendHistory.length - 1]?.keywords[topic]?.votes || 0,
        volume: keywordVolume[topic] || 0
    })) || [];


    const productVelocity = history && history.length > 1 ? history[history.length - 1].votes_count - history[history.length - 2].votes_count : 0;
    const { score, grade, breakdown } = calculateLaunchScore(product, Math.max(0, productVelocity));

    return { product, history: history || [], similarProducts, trendHistory, categoryData, keywordData, productCategory, score, grade, breakdown };
}

export default async function LaunchPage({ params }: { params: { id: string } }) {
    const data = await getLaunchData(params.id);

    if (!data || !data.product) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Launch Not Found</h1>
                <Link href="/desk" className="text-blue-500 hover:underline">Back to Dashboard</Link>
            </div>
        );
    }

    const { product, history, similarProducts, trendHistory, categoryData, keywordData, productCategory, score, grade, breakdown } = data;

    return (
        <ProductDetailView
            product={product}
            history={history}
            similarProducts={similarProducts}
            trendHistory={trendHistory}
            categoryData={categoryData}
            keywordData={keywordData}
            productCategory={productCategory}
            score={score}
            grade={grade}
            breakdown={breakdown}
        />
    );
}
