'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    TrendingUp,
    Sparkles,
    Rocket,
    Search,
    Zap,
    ArrowUpRight,
    Terminal,
    Brain,
    CheckSquare,
    Megaphone,
    Palette,
    Briefcase,
    MessageCircle,
    Film,
    GraduationCap,
    ShoppingBag,
    Heart,
    BarChart2,
    Users,
    Shield,
    Box,
    Hash
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import * as ChartsData from '@/lib/charts-data';
import ProductGrowthChart from '@/components/ProductGrowthChart';
import TrendingKeywordsWidget from '@/components/TrendingKeywordsWidget';
import TopProductsVelocityChart from '@/components/TopProductsVelocityChart';
import CategoryLiveVelocityChart from '@/components/CategoryLiveVelocityChart';
import CategoryGrowthChart from '@/components/CategoryGrowthChart';

// Keyword Icon Mapping
const getKeywordIcon = (keywordName: string) => {
    const name = keywordName.toLowerCase();

    if (name.includes('developer') || name.includes('code')) return <Terminal className="w-8 h-8 text-white" />;
    if (name.includes('ai') || name.includes('machine')) return <Brain className="w-8 h-8 text-white" />;
    if (name.includes('productivity')) return <CheckSquare className="w-8 h-8 text-white" />;
    if (name.includes('marketing') || name.includes('growth')) return <Megaphone className="w-8 h-8 text-white" />;
    if (name.includes('design') || name.includes('creative')) return <Palette className="w-8 h-8 text-white" />;
    if (name.includes('business') || name.includes('finance')) return <Briefcase className="w-8 h-8 text-white" />;
    if (name.includes('communication')) return <MessageCircle className="w-8 h-8 text-white" />;
    if (name.includes('media') || name.includes('entertainment')) return <Film className="w-8 h-8 text-white" />;
    if (name.includes('education')) return <GraduationCap className="w-8 h-8 text-white" />;
    if (name.includes('commerce')) return <ShoppingBag className="w-8 h-8 text-white" />;
    if (name.includes('health')) return <Heart className="w-8 h-8 text-white" />;
    if (name.includes('analytics') || name.includes('data')) return <BarChart2 className="w-8 h-8 text-white" />;
    if (name.includes('social')) return <Users className="w-8 h-8 text-white" />;
    if (name.includes('security')) return <Shield className="w-8 h-8 text-white" />;

    return <Hash className="w-8 h-8 text-white" />;
};

export default function KeywordProfilePage({ params }: { params: { slug: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const keyword = decodeURIComponent(params.slug);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [trendData, products, productHistory, keywordVelocity] = await Promise.all([
                    ChartsData.getKeywordTrends(keyword, 12),
                    fetch(`/api/keyword/${encodeURIComponent(keyword)}/products`).then(r => r.json()).catch(() => []),
                    ChartsData.getTodayProductHistory(keyword, 'keyword'),
                    ChartsData.getCategoryTotalVotesToday(keyword, 'keyword')
                ]);

                // Extract related keywords from products
                const keywordCounts = new Map<string, number>();
                products.forEach((p: any) => {
                    if (Array.isArray(p.topics)) {
                        p.topics.forEach((t: string) => {
                            if (t.toLowerCase() !== keyword.toLowerCase()) {
                                keywordCounts.set(t, (keywordCounts.get(t) || 0) + 1);
                            }
                        });
                    }
                });

                const relatedKeywords = Array.from(keywordCounts.entries())
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                // Use productHistory for todayLaunches (take the latest state)
                const todayLaunches = productHistory.map((p: any) => ({
                    ...p,
                    votes_count: p.snapshots[p.snapshots.length - 1].votes_count
                }));

                setData({
                    trendData: trendData?.monthlyData || [],
                    products,
                    relatedKeywords,
                    todayLaunches,
                    productHistory,
                    keywordVelocity,
                    totalMentions: trendData?.totalMentions || 0
                });
            } catch (error) {
                console.error('Failed to load keyword data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [keyword]);

    const filteredProducts = data?.products.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10) || [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-hunted-dark p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-96 lg:col-span-2 rounded-2xl" />
                        <Skeleton className="h-96 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-4">
            <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </button>

            {/* Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                <div className="lg:col-span-2">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                            {getKeywordIcon(keyword)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">#{keyword}</h1>
                            <p className="text-xl text-gray-400 mb-4">Keyword Analysis</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Total Mentions</p>
                            <p className="text-3xl font-bold text-white">{data.totalMentions}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Avg Engagement</p>
                            <p className="text-3xl font-bold text-white">High</p>
                        </div>
                    </div>
                    <button className="block w-full bg-[#FF6154] hover:bg-[#ff4f40] text-white text-center font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        View Top Products
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8 mb-8">

                {/* Row 1: Keyword Live Velocity Chart */}
                <CategoryLiveVelocityChart data={data.keywordVelocity} title="Keyword Vote Velocity (24h)" />

                {/* Row 2: Trending Keywords */}
                <div className="grid grid-cols-1 gap-8">
                    <TrendingKeywordsWidget
                        keywords={data.relatedKeywords.map((k: any) => ({
                            ...k,
                            growth: Math.floor(Math.random() * 500) + 100 // Simulated growth
                        }))}
                    />
                </div>

                {/* Row 3: Keyword Growth History */}
                <CategoryGrowthChart
                    data={data.trendData}
                    title="Keyword Growth (12 Months)"
                    type="keyword"
                />

                {/* Row 4: Searchable Product List */}
                <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">All Products</h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredProducts.map((p: any, i: number) => (
                            <Link
                                key={p.id}
                                href={`/desk/launch/${p.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-gray-800/50 rounded-xl transition-colors group border border-transparent hover:border-gray-800"
                            >
                                <span className="text-sm font-mono text-gray-600 w-6">#{i + 1}</span>
                                {p.thumbnail_url ? (
                                    <img src={p.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                                        <Rocket className="w-6 h-6 text-gray-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-medium text-gray-200 group-hover:text-white truncate">
                                        {p.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 truncate">{p.tagline}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-white">{p.votes_count}</div>
                                    <div className="text-xs text-gray-500">votes</div>
                                </div>
                            </Link>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No products found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
