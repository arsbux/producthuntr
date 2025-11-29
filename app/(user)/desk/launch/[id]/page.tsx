import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import LaunchVelocityChart from '@/components/LaunchVelocityChart';
import GenerateAuditButton from '@/components/GenerateAuditButton';

export const dynamic = 'force-dynamic';

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

    // Fetch hourly history from snapshots
    const { data: history } = await supabase
        .from('vote_snapshots')
        .select('votes_count, comments_count, snapshot_time')
        .eq('product_id', id)
        .order('snapshot_time', { ascending: true });

    return { product, history: history || [] };
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

    const { product, history } = data;
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
        </div>
    );
}
