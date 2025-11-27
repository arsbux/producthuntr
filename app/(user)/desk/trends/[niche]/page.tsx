'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Product {
    id: number;
    name: string;
    tagline: string;
    votes_count: number;
    comments_count: number;
    launched_at: string;
    website: string;
    redirect_url: string;
    thumbnail_url?: string;
    ai_analysis: {
        icp: string;
        problem: string;
        niche: string;
        one_line_pitch?: string;
        pricing_model?: string;
    };
}

export default function NichePage() {
    const params = useParams();
    const router = useRouter();
    const niche = decodeURIComponent(params.niche as string);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        avgVotes: 0,
        topProduct: '',
    });

    useEffect(() => {
        fetchNicheProducts();
    }, [niche]);

    async function fetchNicheProducts() {
        try {
            const supabase = createClient(supabaseUrl, supabaseAnonKey);

            const { data: launches, error } = await supabase
                .from('ph_launches')
                .select('*')
                .not('ai_analysis', 'is', null);

            if (error) throw error;

            // Filter by niche and sort by votes
            const nicheProducts = (launches || [])
                .filter(l => l.ai_analysis?.niche === niche)
                .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0));

            setProducts(nicheProducts);

            // Calculate stats
            const totalVotes = nicheProducts.reduce((sum, p) => sum + (p.votes_count || 0), 0);
            setStats({
                totalProducts: nicheProducts.length,
                avgVotes: Math.round(totalVotes / nicheProducts.length) || 0,
                topProduct: nicheProducts[0]?.name || 'N/A',
            });

        } catch (error) {
            console.error('Error fetching niche products:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading {niche} products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-neutral-50 min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Trends</span>
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{niche}</h1>
                <p className="text-sm md:text-base text-neutral-600">
                    {stats.totalProducts} products ranked by performance
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                    <div className="text-sm text-neutral-600 mb-1">Total Products</div>
                    <div className="text-3xl font-bold text-neutral-900">{stats.totalProducts}</div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                    <div className="text-sm text-neutral-600 mb-1">Average Votes</div>
                    <div className="text-3xl font-bold text-neutral-900">{stats.avgVotes}</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="text-xs font-medium opacity-90 mb-1">🏆 TOP PERFORMER</div>
                    <div className="text-lg font-bold truncate">{stats.topProduct}</div>
                </div>
            </div>

            {/* Products List */}
            <div className="space-y-4">
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="bg-white border border-neutral-200 rounded-xl p-4 md:p-6 hover:border-orange-500 hover:shadow-lg transition-all"
                    >
                        <div className="flex flex-col md:flex-row items-start gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                {/* Rank Badge */}
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        index === 1 ? 'bg-neutral-100 text-neutral-600' :
                                            index === 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-neutral-50 text-neutral-500'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                {product.thumbnail_url && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={product.thumbnail_url}
                                            alt={product.name}
                                            className="w-12 h-12 md:w-16 md:h-16 rounded-full md:rounded-lg object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-neutral-900 mb-1">{product.name}</h3>
                                        <p className="text-sm text-neutral-600 mb-3">{product.tagline}</p>

                                        {product.ai_analysis?.one_line_pitch && (
                                            <p className="text-sm text-neutral-700 italic mb-3">
                                                "{product.ai_analysis.one_line_pitch}"
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                                {product.ai_analysis?.icp || 'Unknown ICP'}
                                            </span>
                                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                                                {product.ai_analysis?.problem || 'Unknown Problem'}
                                            </span>
                                            {product.ai_analysis?.pricing_model && (
                                                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium">
                                                    {product.ai_analysis.pricing_model}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-orange-600" />
                                        <span className="font-semibold text-neutral-900">{product.votes_count || 0}</span>
                                        <span className="text-neutral-600">votes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-neutral-900">{product.comments_count || 0}</span>
                                        <span className="text-neutral-600">comments</span>
                                    </div>
                                    <div className="text-neutral-500 hidden sm:block">
                                        {new Date(product.launched_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    {product.redirect_url && (
                                        <a
                                            href={product.redirect_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                            View on PH
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
                        <p className="text-neutral-600">No products found in this niche.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
