import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, AlertTriangle, CheckCircle, Zap, Globe } from 'lucide-react';
import LaunchVelocityChart from '@/components/LaunchVelocityChart';
import GenerateAuditButton from '@/components/GenerateAuditButton';
import CategoryVelocityChart from '@/components/CategoryVelocityChart';
import KeywordVelocityChart from '@/components/KeywordVelocityChart';

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
            .select('id, name, tagline, topics, votes_count, thumbnail_url')
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


    return { product, history: history || [], similarProducts, trendHistory, categoryData, keywordData, productCategory };
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

    const { product, history, similarProducts, trendHistory, categoryData, keywordData, productCategory } = data;
    const analysis = product.ai_analysis || {};
    const hasAudit = analysis.strengths?.length > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <Link href="/desk" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            {/* Header Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                <div className="lg:col-span-2">
                    <div className="flex items-start gap-6">
                        {product.thumbnail_url && (
                            <img src={product.thumbnail_url} alt={product.name} className="w-24 h-24 rounded-xl object-cover border border-gray-800" />
                        )}
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{product.name}</h1>
                            <p className="text-xl text-gray-400 mb-4">{product.tagline}</p>

                            {/* Description & Website */}
                            <div className="mb-4 text-gray-300 text-sm leading-relaxed max-w-2xl">
                                {product.description}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                {product.website_url && (
                                    <a href={product.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        <Globe className="w-4 h-4" />
                                        Visit Website
                                    </a>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {product.topics?.map((topic: string) => (
                                    <span key={topic} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Upvotes</p>
                            <p className="text-3xl font-bold text-white">{product.votes_count}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Comments</p>
                            <p className="text-3xl font-bold text-white">{product.comments_count}</p>
                        </div>
                    </div>
                    <a
                        href={product.ph_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-[#FF6154] hover:bg-[#ff4f40] text-white text-center font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        View on Product Hunt
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>

            {/* AI Audit Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column: Analysis */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Velocity Chart */}
                    <LaunchVelocityChart data={history} />

                    {/* One-Line Pitch */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 border border-gray-700 relative">
                        <div className="absolute top-4 right-4">
                            <GenerateAuditButton launchId={product.id} hasAudit={hasAudit} />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3">Refined Value Prop</h3>
                        <p className="text-2xl font-medium text-white leading-relaxed">
                            "{analysis.one_line_pitch || 'Run analysis to generate value prop...'}"
                        </p>
                    </div>

                    {hasAudit && (
                        <>
                            {/* Strengths & Risks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-green-400 mb-4">
                                        <CheckCircle className="w-5 h-5" />
                                        Key Strengths
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.strengths.map((s: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-red-400 mb-4">
                                        <AlertTriangle className="w-5 h-5" />
                                        Potential Risks
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.risks.map((r: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-300">
                                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                                {r}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Growth Actions */}
                            <div className="bg-blue-900/20 rounded-xl p-8 border border-blue-500/30">
                                <h3 className="flex items-center gap-2 text-xl font-bold text-blue-400 mb-6">
                                    <Zap className="w-6 h-6" />
                                    Recommended Growth Actions
                                </h3>
                                <div className="grid gap-4">
                                    {analysis.growth_actions.map((action: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 bg-blue-900/10 p-4 rounded-lg border border-blue-500/20">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <p className="text-gray-200 pt-1">{action}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Meta Info */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4">Market Context</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-500 text-sm">Target Audience (ICP)</p>
                                <p className="text-gray-300">{analysis.icp || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Problem Solved</p>
                                <p className="text-gray-300">{analysis.problem || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm">Business Model</p>
                                <p className="text-gray-300">{analysis.pricing_model || 'Unknown'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                        <h3 className="text-lg font-bold text-white mb-4">Makers</h3>
                        <div className="space-y-4">
                            {product.makers?.map((maker: any) => (
                                <div key={maker.username} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
                                        {maker.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{maker.name}</p>
                                        <p className="text-gray-500 text-sm">@{maker.username}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category & Keyword Growth */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-6">Category & Keyword Growth</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-[400px]">
                        <CategoryVelocityChart data={categoryData} history={trendHistory} />
                    </div>
                    <div className="h-[400px]">
                        <KeywordVelocityChart data={keywordData} history={trendHistory} />
                    </div>
                </div>
            </div>

            {/* Similar Launches */}
            {similarProducts.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Similar Launches</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {similarProducts.map((p: any) => (
                            <Link key={p.product_id} href={`/desk/launch/${p.product_id}`} className="block group">
                                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition-all h-full">
                                    <div className="flex items-start gap-3 mb-3">
                                        {p.thumbnail_url && (
                                            <img src={p.thumbnail_url} alt={p.product_name} className="w-12 h-12 rounded-lg object-cover" />
                                        )}
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{p.product_name}</h3>
                                            <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                                                <TrendingUp className="w-3 h-3" />
                                                {p.votes_count} votes
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2 mb-3">{p.tagline}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {p.topics?.slice(0, 2).map((t: string) => (
                                            <span key={t} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-500">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
