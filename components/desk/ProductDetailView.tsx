'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, TrendingUp, AlertTriangle, CheckCircle, Zap, Globe } from 'lucide-react';
import TrackButton from '@/components/TrackButton';
import LaunchVelocityChart from '@/components/LaunchVelocityChart';
import GenerateAuditButton from '@/components/GenerateAuditButton';
import LaunchScoreCard from '@/components/LaunchScoreCard';
import CategoryVelocityChart from '@/components/CategoryVelocityChart';
import KeywordVelocityChart from '@/components/KeywordVelocityChart';
import CompetitorComparison from '@/components/CompetitorComparison';

interface ProductDetailViewProps {
    product: any;
    history: any[];
    similarProducts: any[];
    trendHistory: any[];
    categoryData: any[];
    keywordData: any[];
    productCategory: string;
    score: number;
    grade: string;
    breakdown: any;
    isStandalone?: boolean; // To toggle back button
}

export default function ProductDetailView({
    product,
    history,
    similarProducts,
    trendHistory,
    categoryData,
    keywordData,
    productCategory,
    score,
    grade,
    breakdown,
    isStandalone = true
}: ProductDetailViewProps) {
    const analysis = product.ai_analysis || {};
    const hasAudit = analysis.strengths?.length > 0;

    return (
        <div className="max-w-7xl mx-auto px-4 py-4 text-left">
            {isStandalone && (
                <Link href="/desk" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            )}

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

                            <div className="flex flex-wrap gap-2 mb-6">
                                {product.topics?.map((topic: string) => (
                                    <span key={topic} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300 border border-gray-700">
                                        {topic}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <a
                                    href={product.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#FF6154] hover:bg-[#ff4f40] text-white rounded-lg font-medium transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    Visit Website
                                </a>
                                <TrackButton productId={product.id} />
                                <a
                                    href={product.ph_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-gray-800 hover:bg-gray-800 text-gray-300 rounded-lg font-medium transition-colors"
                                >
                                    View on PH
                                </a>
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
                    {history && history.length > 0 && (
                        <LaunchVelocityChart data={history} />
                    )}

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

                    <LaunchScoreCard score={score} grade={grade} breakdown={breakdown} />
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

            {/* Competitor Snapshot */}
            {
                similarProducts.length > 0 && (
                    <div className="mb-8">
                        <CompetitorComparison currentProduct={product} competitors={similarProducts} />
                    </div>
                )
            }

            {/* Similar Launches */}
            {
                similarProducts.length > 0 && (
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
                )
            }
        </div >
    );
}
