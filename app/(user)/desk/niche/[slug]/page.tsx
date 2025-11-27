'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Target,
    TrendingUp,
    ArrowRight,
    BarChart3,
    MessageCircle,
    Award,
    AlertCircle,
    Activity,
    Code,
    Smartphone,
    Users,
    ShoppingCart,
    Palette,
    Briefcase,
    GraduationCap,
    Gamepad2,
    Heart,
    TrendingUp as Marketing,
    Music,
    Wrench,
    Lock,
    BookOpen,
    Cpu,
    PenTool,
    Zap,
    Globe,
    Camera,
    Coffee
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    getNicheSuccessHistogram,
    getProductScatterData,
    getFeatureCorrelation,
    type NicheHistogramData,
    type ProductScatterPoint,
    type FeatureCorrelation
} from '@/lib/charts-data';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NicheDetailPage() {
    const params = useParams();
    const router = useRouter();
    const niche = decodeURIComponent(params.slug as string);

    const [loading, setLoading] = useState(true);
    const [histogramData, setHistogramData] = useState<NicheHistogramData | null>(null);
    const [scatterData, setScatterData] = useState<ProductScatterPoint[]>([]);
    const [correlationData, setCorrelationData] = useState<FeatureCorrelation[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [showingAll, setShowingAll] = useState(false);
    const [loadingAll, setLoadingAll] = useState(false);

    const supabase = createClientComponentClient();

    useEffect(() => {
        if (niche) {
            loadNicheData();
        }
    }, [niche]);

    const loadNicheData = async () => {
        setLoading(true);
        try {
            const [histogram, scatter, correlation] = await Promise.all([
                getNicheSuccessHistogram(niche),
                getProductScatterData(niche),
                getFeatureCorrelation(niche)
            ]);

            setHistogramData(histogram);
            setScatterData(scatter);
            setCorrelationData(correlation);

            // Load top 10 products
            const { data: products } = await supabase
                .from('ph_launches')
                .select('name, votes_count, comments_count, ai_analysis, launched_at, thumbnail_url, tagline, website_url')
                .not('ai_analysis', 'is', null)
                .order('votes_count', { ascending: false })
                .limit(100); // Get more to filter

            if (products) {
                const filtered = products.filter(p => p.ai_analysis?.niche === niche).slice(0, 10);
                setTopProducts(filtered);
            }
        } catch (error) {
            console.error('Error loading niche data:', error);
        }
        setLoading(false);
    };

    const loadAllProducts = async () => {
        setLoadingAll(true);
        try {
            // Fetch all products in this niche
            const { data: products } = await supabase
                .from('ph_launches')
                .select('name, votes_count, comments_count, ai_analysis, launched_at, thumbnail_url, tagline, website_url')
                .not('ai_analysis', 'is', null)
                .order('votes_count', { ascending: false });

            if (products) {
                const filtered = products.filter(p => p.ai_analysis?.niche === niche);
                setAllProducts(filtered);
                setShowingAll(true);
            }
        } catch (error) {
            console.error('Error loading all products:', error);
        }
        setLoadingAll(false);
    };

    const getTypeColor = (type: ProductScatterPoint['productType']) => {
        switch (type) {
            case 'Community Darling': return '#10b981'; // green
            case 'Pure Utility': return '#3b82f6'; // blue
            case 'Niche Product': return '#f59e0b'; // orange
            case 'Low Engagement': return '#9ca3af'; // gray
        }
    };

    // Generate custom icon based on category name using lucide-react icons
    const getCategoryIcon = (categoryName: string) => {
        // Map categories to icons and colors
        const getCategoryMapping = (name: string) => {
            const nameLower = name.toLowerCase();

            // AI & Machine Learning
            if (nameLower.includes('ai') || nameLower.includes('machine learning') || nameLower.includes('artificial intelligence')) {
                return { Icon: Cpu, color: '#8b5cf6', bgColor: '#f3e8ff' };
            }
            // Developer Tools
            if (nameLower.includes('developer') || nameLower.includes('dev tools') || nameLower.includes('code')) {
                return { Icon: Code, color: '#3b82f6', bgColor: '#dbeafe' };
            }
            // Productivity
            if (nameLower.includes('productivity') || nameLower.includes('organization')) {
                return { Icon: Zap, color: '#f59e0b', bgColor: '#fef3c7' };
            }
            // Design & Creative
            if (nameLower.includes('design') || nameLower.includes('creative')) {
                return { Icon: Palette, color: '#ec4899', bgColor: '#fce7f3' };
            }
            // Marketing & Growth
            if (nameLower.includes('marketing') || nameLower.includes('growth')) {
                return { Icon: TrendingUp, color: '#10b981', bgColor: '#d1fae5' };
            }
            // Business & Finance
            if (nameLower.includes('business') || nameLower.includes('finance')) {
                return { Icon: Briefcase, color: '#06b6d4', bgColor: '#cffafe' };
            }
            // Media & Entertainment
            if (nameLower.includes('media') || nameLower.includes('entertainment') || nameLower.includes('video')) {
                return { Icon: Camera, color: '#f43f5e', bgColor: '#ffe4e6' };
            }
            // Education & Learning
            if (nameLower.includes('education') || nameLower.includes('learning')) {
                return { Icon: GraduationCap, color: '#6366f1', bgColor: '#e0e7ff' };
            }
            // Health & Wellness
            if (nameLower.includes('health') || nameLower.includes('wellness') || nameLower.includes('fitness')) {
                return { Icon: Heart, color: '#ef4444', bgColor: '#fee2e2' };
            }
            // Analytics & Data
            if (nameLower.includes('analytics') || nameLower.includes('data')) {
                return { Icon: BarChart3, color: '#0ea5e9', bgColor: '#e0f2fe' };
            }
            // Social & Community
            if (nameLower.includes('social') || nameLower.includes('community')) {
                return { Icon: Users, color: '#8b5cf6', bgColor: '#f3e8ff' };
            }
            // Communication
            if (nameLower.includes('communication') || nameLower.includes('messaging')) {
                return { Icon: MessageCircle, color: '#14b8a6', bgColor: '#ccfbf1' };
            }
            // E-commerce & Sales
            if (nameLower.includes('commerce') || nameLower.includes('sales') || nameLower.includes('shop')) {
                return { Icon: ShoppingCart, color: '#f59e0b', bgColor: '#fef3c7' };
            }
            // Security & Privacy
            if (nameLower.includes('security') || nameLower.includes('privacy')) {
                return { Icon: Lock, color: '#64748b', bgColor: '#f1f5f9' };
            }
            // Gaming
            if (nameLower.includes('game') || nameLower.includes('gaming')) {
                return { Icon: Gamepad2, color: '#a855f7', bgColor: '#f3e8ff' };
            }
            // Music & Audio
            if (nameLower.includes('music') || nameLower.includes('audio')) {
                return { Icon: Music, color: '#ec4899', bgColor: '#fce7f3' };
            }
            // Mobile
            if (nameLower.includes('mobile') || nameLower.includes('app')) {
                return { Icon: Smartphone, color: '#06b6d4', bgColor: '#cffafe' };
            }
            // Tools & Utilities
            if (nameLower.includes('tool') || nameLower.includes('utility')) {
                return { Icon: Wrench, color: '#78716c', bgColor: '#f5f5f4' };
            }
            // Writing & Content
            if (nameLower.includes('writing') || nameLower.includes('content')) {
                return { Icon: PenTool, color: '#6366f1', bgColor: '#e0e7ff' };
            }
            // Web & Internet
            if (nameLower.includes('web') || nameLower.includes('internet')) {
                return { Icon: Globe, color: '#0ea5e9', bgColor: '#e0f2fe' };
            }
            // Lifestyle
            if (nameLower.includes('lifestyle') || nameLower.includes('food')) {
                return { Icon: Coffee, color: '#f59e0b', bgColor: '#fef3c7' };
            }
            // Books & Reading
            if (nameLower.includes('book') || nameLower.includes('reading')) {
                return { Icon: BookOpen, color: '#0891b2', bgColor: '#cffafe' };
            }

            // Default
            return { Icon: Target, color: '#6366f1', bgColor: '#e0e7ff' };
        };

        const { Icon, color, bgColor } = getCategoryMapping(categoryName);

        return (
            <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
            >
                <Icon className="w-8 h-8" style={{ color: color }} strokeWidth={2} />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Analyzing {niche}...</p>
                </div>
            </div>
        );
    }

    if (!histogramData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-xl p-8 border border-gray-200 max-w-md">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Niche Not Found</h2>
                    <p className="text-gray-600 mb-6">
                        We don't have enough data for "{niche}" yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Three Column Layout */}
            <div className="flex gap-0 h-screen">
                {/* LEFT SIDEBAR - Category Name + Top 3 Products */}
                <aside className="w-[420px] bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                    {/* Category Header */}
                    <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex-shrink-0">
                                {getCategoryIcon(niche)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl font-bold text-gray-900 truncate">{niche}</h1>
                                <p className="text-xs text-gray-500 mt-1">
                                    Deep dive into the {niche} niche
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top 3 Products */}
                    {topProducts.length > 0 && (
                        <div className="p-4">
                            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                                Top 3 Products
                            </h2>
                            <div className="space-y-2">
                                {topProducts.slice(0, 3).map((product, index) => (
                                    <div
                                        key={product.name}
                                        className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-3 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Rank */}
                                            <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {index + 1}
                                            </div>

                                            {/* Thumbnail */}
                                            {product.thumbnail_url && (
                                                <div className="flex-shrink-0">
                                                    <img
                                                        src={product.thumbnail_url}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                    />
                                                </div>
                                            )}

                                            {/* Product Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                                                    {product.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-1">
                                                    {product.tagline}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="flex-shrink-0 flex items-center gap-3 text-xs">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-gray-400">▲</span>
                                                    <span className="font-bold text-gray-900">{product.votes_count.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <MessageCircle className="w-3 h-3 text-gray-400" />
                                                    <span className="font-semibold text-gray-700">{product.comments_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                {/* CENTER - Charts & Analytics */}
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Key Stats */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Total Products</div>
                            <div className="text-2xl font-bold text-gray-900">{histogramData.stats.total}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Median Upvotes</div>
                            <div className="text-2xl font-bold text-blue-600">{histogramData.stats.median}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Top 10% (P90)</div>
                            <div className="text-2xl font-bold text-orange-600">{histogramData.stats.p90}</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1">Top 1% (P99)</div>
                            <div className="text-2xl font-bold text-green-600">{histogramData.stats.p99}</div>
                        </div>
                    </div>

                    {/* Performance Scatter Plot */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-blue-600" />
                                Engagement Patterns
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Different product types attract different engagement patterns
                            </p>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={[...scatterData].sort((a, b) => a.votes - b.votes)} margin={{ top: 10, right: 20, bottom: 50, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        fontSize={9}
                                        tickLine={false}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={11}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload[0]) {
                                                const data = payload[0].payload as ProductScatterPoint;
                                                return (
                                                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg max-w-xs">
                                                        <div className="font-bold text-gray-900 mb-1 truncate text-sm">{data.name}</div>
                                                        <div className="text-xs space-y-0.5">
                                                            <div>Type: <span className="font-semibold">{data.productType}</span></div>
                                                            <div>Upvotes: <span className="font-semibold">{data.votes}</span></div>
                                                            <div>Comments: <span className="font-semibold">{data.comments}</span></div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        type="natural"
                                        dataKey="votes"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        name="Upvotes"
                                    />
                                    <Line
                                        type="natural"
                                        dataKey="comments"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        name="Comments"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Feature Correlation */}
                    {correlationData.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    Feature/Language Correlation
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Which keywords in descriptions correlate with higher upvotes?
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="space-y-2">
                                    {correlationData.slice(0, 5).map((feature, index) => (
                                        <div
                                            key={feature.keyword}
                                            className={`p-3 rounded-lg border ${feature.uplift > 20
                                                ? 'bg-green-50 border-green-200'
                                                : feature.uplift > 0
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-red-50 border-red-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 text-sm mb-0.5 flex items-center gap-2">
                                                        <span>
                                                            {index + 1}. "{feature.keyword}"
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-white rounded-full border border-gray-200">
                                                            {feature.occurrences} mentions
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        With: <span className="font-semibold">{feature.avgUpvotesWithKeyword}</span>
                                                        {' • '}
                                                        Without: <span className="font-semibold">{feature.avgUpvotesWithout}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xl font-bold ${feature.uplift > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {feature.uplift > 0 ? '+' : ''}{feature.uplift}%
                                                    </div>
                                                    <div className="text-xs text-gray-600">uplift</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* RIGHT SIDEBAR - All Products List */}
                <aside className="w-[420px] bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
                    <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                            All Products ({showingAll ? allProducts.length : topProducts.length})
                        </h2>
                        {!showingAll && (
                            <button
                                onClick={loadAllProducts}
                                disabled={loadingAll}
                                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                {loadingAll ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        Load All Products
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-gray-100">
                        {(showingAll ? allProducts : topProducts).map((product, index) => (
                            <div
                                key={product.name}
                                className="group p-3 hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Rank */}
                                    <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {index + 1}
                                    </div>

                                    {/* Thumbnail */}
                                    {product.thumbnail_url && (
                                        <div className="flex-shrink-0">
                                            <img
                                                src={product.thumbnail_url}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                            />
                                        </div>
                                    )}

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600">
                                            {product.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-1">
                                            {product.tagline}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex-shrink-0 flex items-center gap-3 text-xs">
                                        <div className="flex flex-col items-center w-10">
                                            <span className="text-gray-400 mb-0.5">▲</span>
                                            <span className="font-bold text-gray-900">{product.votes_count.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col items-center w-10">
                                            <MessageCircle className="w-3 h-3 text-gray-400 mb-0.5" />
                                            <span className="font-semibold text-gray-700">{product.comments_count}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    );
}
