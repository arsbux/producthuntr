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
    Coffee,
    ArrowLeft,
    Brain,
    RefreshCw
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
    LabelList
} from 'recharts';
import {
    getNicheSuccessHistogram,
    getProductScatterData,
    getFeatureCorrelation,
    getTopicVelocity,
    getCategoryDetails,
    type NicheHistogramData,
    type ProductScatterPoint,
    type FeatureCorrelation,
    type TopicVelocityData,
    type CategoryDetails
} from '@/lib/charts-data';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Skeleton } from '@/components/ui/skeleton';

export default function NicheDetailPage() {
    const params = useParams();
    const router = useRouter();

    // Safely handle params.slug which might be undefined during build or an array
    const slug = params?.slug;
    const niche = slug ? decodeURIComponent(Array.isArray(slug) ? slug[0] : slug) : '';

    const [loading, setLoading] = useState(true);
    const [histogramData, setHistogramData] = useState<NicheHistogramData | null>(null);
    const [scatterData, setScatterData] = useState<ProductScatterPoint[]>([]);
    const [correlationData, setCorrelationData] = useState<FeatureCorrelation[]>([]);
    const [growthData, setGrowthData] = useState<TopicVelocityData | null>(null);
    const [topProducts, setTopProducts] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [showingAll, setShowingAll] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{
        engagementGap: { value: string; label: string };
        brief: { paragraph1: string; paragraph2: string };
        key_insight: string;
    } | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(true);
    const [todayLaunches, setTodayLaunches] = useState<any[]>([]);
    const [loadingLive, setLoadingLive] = useState(true);
    const [categoryDetails, setCategoryDetails] = useState<CategoryDetails | null>(null);

    const supabase = createClientComponentClient();

    useEffect(() => {
        if (niche) {
            loadNicheData();
            loadAiAnalysis();
            loadTodayLaunches();
        }
    }, [niche]);

    const loadAiAnalysis = async () => {
        setLoadingAnalysis(true);
        try {
            const response = await fetch('/api/niche/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche }),
            });
            if (response.ok) {
                const data = await response.json();
                setAiAnalysis(data);
            }
        } catch (error) {
            console.error('Failed to load AI analysis', error);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const loadTodayLaunches = async () => {
        setLoadingLive(true);
        try {
            const response = await fetch('/api/today-launches');
            if (response.ok) {
                const data = await response.json();
                console.log('Niche:', niche);
                console.log('Top Launches:', data.topLaunches.length);
                console.log('First Launch Niche:', data.topLaunches[0]?.niche);

                // Filter launches by current niche
                const nicheLaunches = data.topLaunches.filter((launch: any) =>
                    launch.niche === niche ||
                    launch.tagline?.toLowerCase().includes(niche.toLowerCase()) ||
                    launch.name?.toLowerCase().includes(niche.toLowerCase())
                );
                console.log('Filtered Launches:', nicheLaunches.length);
                setTodayLaunches(nicheLaunches);
            }
        } catch (error) {
            console.error('Failed to load today launches', error);
        } finally {
            setLoadingLive(false);
        }
    };

    const loadNicheData = async () => {
        setLoading(true);
        try {
            const [histogram, scatter, correlation, allVelocity, catDetails] = await Promise.all([
                getNicheSuccessHistogram(niche),
                getProductScatterData(niche),
                getFeatureCorrelation(niche),
                getTopicVelocity(),
                getCategoryDetails(niche)
            ]);

            setHistogramData(histogram);
            setScatterData(scatter);
            setCorrelationData(correlation);
            setCategoryDetails(catDetails);

            // Find matching velocity data
            const velocity = allVelocity.find(v => v.topic === niche) ||
                allVelocity.find(v => v.topic.includes(niche) || niche.includes(v.topic));
            setGrowthData(velocity || null);

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

    // if (loading) return ... removed

    if (!loading && !histogramData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-hunted-dark flex items-center justify-center p-4">
                <div className="text-center bg-white dark:bg-hunted-card rounded-xl p-8 border border-gray-200 dark:border-hunted-border max-w-md">
                    <AlertCircle className="w-16 h-16 text-gray-400 dark:text-hunted-muted mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-hunted-text mb-2">Niche Not Found</h2>
                    <p className="text-gray-600 dark:text-hunted-muted mb-6">
                        We don't have enough data for "{niche}" yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-hunted-dark">
            {/* Three Column Layout */}
            <div className="flex flex-col lg:flex-row gap-0 min-h-screen">
                {/* LEFT SIDEBAR - Category Name + Top 3 Products */}
                <aside className="w-full lg:w-[420px] bg-white dark:bg-hunted-card border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-hunted-border overflow-y-auto flex-shrink-0 lg:h-screen">
                    {/* Category Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-hunted-border sticky top-0 bg-white dark:bg-hunted-card z-10">
                        {loading ? (
                            <div className="flex items-center gap-4 mb-3">
                                <Skeleton className="w-16 h-16 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-8 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex-shrink-0">
                                    {getCategoryIcon(niche)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-hunted-text truncate">{niche}</h1>
                                    <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
                                        Deep dive into the {niche} niche
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Success Decode */}
                    <div className="p-4">
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-600" />
                                    Success Decode
                                </h2>
                                <button
                                    onClick={loadAiAnalysis}
                                    disabled={loadingAnalysis}
                                    className="p-1.5 text-purple-400 hover:text-purple-600 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
                                    title="Regenerate Analysis"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalysis ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {loading || loadingAnalysis ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <Skeleton className="h-24 w-full rounded-lg" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ) : aiAnalysis ? (
                                <div className="space-y-4">
                                    {/* Engagement Stats */}
                                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-500 dark:text-hunted-muted uppercase tracking-wide font-semibold mb-0.5">Engagement Gap</div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-lg font-bold text-gray-900 dark:text-hunted-text">{aiAnalysis.engagementGap.value}</span>
                                                <span className="text-xs text-gray-600 dark:text-hunted-muted">{aiAnalysis.engagementGap.label}</span>
                                            </div>
                                        </div>
                                        <div className="text-right max-w-[50%]">
                                            <div className="text-[10px] text-gray-500 dark:text-hunted-muted uppercase tracking-wide font-semibold mb-0.5">Key Insight</div>
                                            <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 leading-tight">
                                                {aiAnalysis.key_insight}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Analysis Text */}
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-700 dark:text-hunted-muted leading-relaxed">
                                            {aiAnalysis.brief.paragraph1}
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-hunted-muted leading-relaxed">
                                            {aiAnalysis.brief.paragraph2}
                                        </p>
                                    </div>

                                    <div className="text-[10px] text-gray-400 italic pt-2 border-t border-purple-100/50">
                                        Based on real-time analysis of 60 products in this niche.
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 italic">
                                    Analysis unavailable.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* CENTER - Charts & Analytics */}
                <main className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Key Stats */}
                    {/* Niche Growth Trend */}
                    {loading ? (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden p-4">
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <Skeleton className="h-[300px] w-full" />
                        </div>
                    ) : growthData && (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-hunted-border">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Growth Trend
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
                                    Launch volume, upvotes, and comments over the last 12 months
                                </p>
                            </div>
                            <div className="p-4">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={growthData.timeSeriesData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLaunches" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#9ca3af"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#9ca3af"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#9ca3af"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F0F0F',
                                                borderColor: '#27272a',
                                                color: '#E4E4E7',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                            labelStyle={{ color: '#E4E4E7', fontWeight: 'bold', marginBottom: '4px' }}
                                        />
                                        <Legend />
                                        <Area
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="launchCount"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorLaunches)"
                                            name="Launches"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="avgUpvotes"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Avg Upvotes"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="avgComments"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Avg Comments"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Performance Scatter Plot */}
                    {loading ? (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden p-4">
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <Skeleton className="h-[300px] w-full" />
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-hunted-border">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                    Engagement Patterns
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
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
                                                        <div className="bg-white dark:bg-hunted-card p-3 border border-gray-200 dark:border-hunted-border rounded-lg shadow-lg max-w-xs">
                                                            <div className="font-bold text-gray-900 dark:text-hunted-text mb-1 truncate text-sm">{data.name}</div>
                                                            <div className="text-xs space-y-0.5 text-gray-600 dark:text-hunted-muted">
                                                                <div>Type: <span className="font-semibold text-gray-900 dark:text-hunted-text">{data.productType}</span></div>
                                                                <div>Upvotes: <span className="font-semibold text-gray-900 dark:text-hunted-text">{data.votes}</span></div>
                                                                <div>Comments: <span className="font-semibold text-gray-900 dark:text-hunted-text">{data.comments}</span></div>
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
                    )}


                    {/* Keyword Analysis Section */}
                    {loading ? (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden p-4">
                                <Skeleton className="h-6 w-1/3 mb-4" />
                                <Skeleton className="h-[350px] w-full" />
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden p-4">
                                <Skeleton className="h-6 w-1/3 mb-4" />
                                <Skeleton className="h-[350px] w-full" />
                            </div>
                        </div>
                    ) : categoryDetails && (
                        <div className="space-y-6">
                            {/* Keyword Trends */}
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-hunted-border">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-600" />
                                        Keyword Trends
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
                                        Usage frequency of top keywords over time
                                    </p>
                                </div>
                                <div className="p-4">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart
                                            data={(() => {
                                                // Prepare data for Keyword Trends chart
                                                return categoryDetails.timeSeriesData.map(t => {
                                                    const point: any = { month: t.month };
                                                    categoryDetails.keywordTrends.forEach(k => {
                                                        const kPoint = k.data.find(d => d.month === t.month);
                                                        point[k.keyword] = kPoint ? kPoint.count : 0;
                                                    });
                                                    return point;
                                                });
                                            })()}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#9ca3af"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#9ca3af"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#0F0F0F',
                                                    borderRadius: '8px',
                                                    border: '1px solid #27272a',
                                                    fontSize: '12px',
                                                    color: '#E4E4E7'
                                                }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            {categoryDetails.keywordTrends.map((k, i) => (
                                                <Line
                                                    key={k.keyword}
                                                    type="monotone"
                                                    dataKey={k.keyword}
                                                    name={k.keyword}
                                                    stroke={`hsl(${i * 60 + 200}, 70%, 50%)`}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 4 }}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Keywords */}
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-hunted-border">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                        Top Keywords
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
                                        Most frequently used terms in this category
                                    </p>
                                </div>
                                <div className="p-4">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart
                                            data={categoryDetails.topKeywords.slice(0, 15)}
                                            layout="vertical"
                                            margin={{ left: 60, right: 20, top: 5, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                            <XAxis
                                                type="number"
                                                stroke="#9ca3af"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                dataKey="keyword"
                                                type="category"
                                                width={100}
                                                stroke="#4b5563"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#27272a' }}
                                                contentStyle={{
                                                    backgroundColor: '#0F0F0F',
                                                    borderRadius: '8px',
                                                    border: '1px solid #27272a',
                                                    fontSize: '12px',
                                                    color: '#E4E4E7'
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#3b82f6"
                                                radius={[0, 4, 4, 0]}
                                                barSize={20}
                                                name="Frequency"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Feature Correlation */}
                    {loading ? (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden p-4">
                            <Skeleton className="h-6 w-1/3 mb-4" />
                            <Skeleton className="h-[350px] w-full" />
                        </div>
                    ) : correlationData.length > 0 && (
                        <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-hunted-border">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-600" />
                                    Feature/Language Correlation
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted mt-1">
                                    Which keywords in descriptions correlate with higher upvotes?
                                </p>
                            </div>
                            <div className="p-4">
                                {/* Bar Chart Visualization */}
                                <div className="mb-6">
                                    <ResponsiveContainer width="100%" height={350}>
                                        <BarChart
                                            data={correlationData.slice(0, 10).map(d => ({
                                                ...d,
                                                posUplift: d.uplift > 0 ? d.uplift : 0,
                                                negUplift: d.uplift < 0 ? d.uplift : 0
                                            }))}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                            barSize={32}
                                            stackOffset="sign"
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                                            <XAxis
                                                type="number"
                                                stroke="#9ca3af"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}%`}
                                            />
                                            <YAxis
                                                dataKey="keyword"
                                                type="category"
                                                width={100}
                                                stroke="#4b5563"
                                                fontSize={11}
                                                tickLine={false}
                                                axisLine={false}
                                                tick={{ fill: '#374151', fontWeight: 500 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#27272a' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload[0]) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white dark:bg-hunted-card p-3 border border-gray-100 dark:border-hunted-border rounded-xl shadow-xl">
                                                                <div className="font-bold text-gray-900 dark:text-hunted-text text-sm mb-1">"{data.keyword}"</div>
                                                                <div className="text-xs space-y-1">
                                                                    <div className={`font-bold ${data.uplift > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                        {data.uplift > 0 ? '+' : ''}{data.uplift}% Uplift
                                                                    </div>
                                                                    <div className="text-gray-500 dark:text-hunted-muted">
                                                                        {data.occurrences} mentions
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={2} />

                                            {/* Positive Bars */}
                                            <Bar dataKey="posUplift" fill="#10b981" radius={[0, 4, 4, 0]} stackId="stack">
                                                <LabelList
                                                    dataKey="posUplift"
                                                    position="right"
                                                    formatter={(val: any) => Number(val) > 0 ? `+${val}%` : ''}
                                                    style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold' }}
                                                />
                                            </Bar>

                                            {/* Negative Bars */}
                                            <Bar dataKey="negUplift" fill="#ef4444" radius={[4, 0, 0, 4]} stackId="stack">
                                                <LabelList
                                                    dataKey="negUplift"
                                                    position="left"
                                                    formatter={(val: any) => Number(val) < 0 ? `${val}%` : ''}
                                                    style={{ fontSize: '10px', fill: '#ef4444', fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Detailed Analysis Charts */}
                                <div className="grid grid-cols-1 gap-8 mt-8">
                                    {/* Impact Analysis - With vs Without */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-hunted-text mb-4 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-yellow-500" />
                                            Impact Analysis (Avg. Upvotes)
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={correlationData.slice(0, 8)}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                    barGap={0}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                                                    <XAxis
                                                        dataKey="keyword"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        fontSize={10}
                                                        stroke="#9ca3af"
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        fontSize={10}
                                                        stroke="#9ca3af"
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        content={({ active, payload, label }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-white dark:bg-hunted-card p-3 border border-gray-100 dark:border-hunted-border shadow-xl rounded-xl">
                                                                        <p className="font-bold text-gray-900 dark:text-hunted-text text-sm mb-2">"{label}"</p>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                                <span className="text-gray-500 dark:text-hunted-muted">With Keyword:</span>
                                                                                <span className="font-bold text-gray-900 dark:text-hunted-text">{payload[0].value}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-xs">
                                                                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                                                                <span className="text-gray-500 dark:text-hunted-muted">Without Keyword:</span>
                                                                                <span className="font-bold text-gray-900 dark:text-hunted-text">{payload[1].value}</span>
                                                                            </div>
                                                                            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-hunted-border">
                                                                                <span className={`text-xs font-bold ${payload[0].value > payload[1].value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                                    {payload[0].value > payload[1].value ? '+' : ''}
                                                                                    {Math.round(((Number(payload[0].value) - Number(payload[1].value)) / Number(payload[1].value)) * 100)}% Impact
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Legend iconType="circle" fontSize={10} />
                                                    <Bar
                                                        dataKey="avgUpvotesWithKeyword"
                                                        name="With Keyword"
                                                        fill="#3b82f6"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={20}
                                                    />
                                                    <Bar
                                                        dataKey="avgUpvotesWithout"
                                                        name="Without Keyword"
                                                        fill="#4b5563"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={20}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Keyword Frequency */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-hunted-text mb-4 flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-purple-500" />
                                            Keyword Frequency
                                        </h3>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={correlationData.slice(0, 10)}
                                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                                                    <XAxis
                                                        dataKey="keyword"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        fontSize={10}
                                                        stroke="#9ca3af"
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        fontSize={10}
                                                        stroke="#9ca3af"
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                        content={({ active, payload, label }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-white dark:bg-hunted-card p-2 border border-gray-100 dark:border-hunted-border shadow-lg rounded-lg">
                                                                        <p className="font-bold text-gray-900 dark:text-hunted-text text-xs">"{label}"</p>
                                                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                                                                            {payload[0].value} mentions
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="occurrences"
                                                        name="Mentions"
                                                        fill="#8b5cf6"
                                                        radius={[4, 4, 0, 0]}
                                                        barSize={30}
                                                    >
                                                        {correlationData.slice(0, 10).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fillOpacity={0.6 + (index * 0.05)} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* RIGHT SIDEBAR - Live Today + Top 10 Products List */}
                <aside className="w-[420px] bg-white dark:bg-hunted-card border-l border-gray-200 dark:border-hunted-border overflow-y-auto flex-shrink-0">
                    {/* Live Today Section */}
                    <div className="border-b border-gray-200 dark:border-hunted-border">
                        <div className="p-4 border-b border-gray-100 dark:border-hunted-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                            <h2 className="text-sm font-bold text-gray-900 dark:text-hunted-text uppercase tracking-wide flex items-center gap-2">
                                <span className="flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Live Today in {niche}
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                            {loadingLive ? (
                                <div className="p-4 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-8 h-8 rounded-full bg-gray-200" />
                                            <div className="w-10 h-10 rounded-lg bg-gray-200" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : todayLaunches.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No launches in this category today.
                                </div>
                            ) : (
                                todayLaunches.slice(0, 10).map((product, index) => {
                                    const gradients = [
                                        'bg-gradient-to-r from-gray-100 to-gray-50',
                                        'bg-gradient-to-r from-blue-50 to-indigo-50',
                                        'bg-gradient-to-r from-cyan-50 to-blue-50',
                                        'bg-gradient-to-r from-red-50 to-orange-50',
                                        'bg-gradient-to-r from-gray-100 to-slate-50',
                                        'bg-gradient-to-r from-green-50 to-emerald-50',
                                        'bg-gradient-to-r from-purple-50 to-fuchsia-50',
                                        'bg-gradient-to-r from-orange-50 to-amber-50',
                                        'bg-gradient-to-r from-pink-50 to-rose-50',
                                        'bg-gradient-to-r from-blue-50 to-cyan-50',
                                    ];
                                    const gradient = gradients[index % gradients.length];

                                    return (
                                        <div
                                            key={product.name + '-live'}
                                            className={`${gradient} dark:bg-none dark:bg-neutral-800 mx-2 my-2 p-2.5 rounded-lg border border-white/50 dark:border-hunted-border shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Rank & Thumbnail Container */}
                                                <div className="relative flex-shrink-0">
                                                    <span className="absolute -top-1 -left-1 text-[10px] font-bold text-white w-5 h-5 flex items-center justify-center bg-blue-500 rounded-full shadow-sm z-10">
                                                        {index + 1}
                                                    </span>
                                                    {product.thumbnail_url ? (
                                                        <img
                                                            src={product.thumbnail_url}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center text-gray-400 shadow-sm">
                                                            <Award className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-hunted-text line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 line-clamp-1">
                                                        {product.tagline}
                                                    </p>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex-shrink-0 flex items-center gap-3 text-xs font-bold text-gray-900">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="text-orange-600">{product.votes?.toLocaleString() || 0}</span>
                                                        <span className="text-[10px] text-gray-400">▲</span>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className="text-gray-700 dark:text-hunted-muted">{product.comments || 0}</span>
                                                        <MessageCircle className="w-3 h-3 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Top 10 Products Section */}
                    <div className="p-4 border-b border-gray-200 dark:border-hunted-border sticky top-0 bg-white dark:bg-hunted-card z-10">
                        <h2 className="text-sm font-bold text-gray-900 dark:text-hunted-text uppercase tracking-wide">
                            Top 10 Products
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {topProducts.slice(0, 10).map((product, index) => {
                            const gradients = [
                                'bg-gradient-to-r from-gray-100 to-gray-50',
                                'bg-gradient-to-r from-blue-50 to-indigo-50',
                                'bg-gradient-to-r from-cyan-50 to-blue-50',
                                'bg-gradient-to-r from-red-50 to-orange-50',
                                'bg-gradient-to-r from-gray-100 to-slate-50',
                                'bg-gradient-to-r from-green-50 to-emerald-50',
                                'bg-gradient-to-r from-purple-50 to-fuchsia-50',
                                'bg-gradient-to-r from-orange-50 to-amber-50',
                                'bg-gradient-to-r from-pink-50 to-rose-50',
                                'bg-gradient-to-r from-blue-50 to-cyan-50',
                            ];
                            const gradient = gradients[index % gradients.length];

                            return (
                                <div
                                    key={product.name}
                                    className={`${gradient} dark:bg-none dark:bg-neutral-800 mx-2 my-2 p-2.5 rounded-lg border border-white/50 dark:border-hunted-border shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Rank & Thumbnail Container */}
                                        <div className="relative flex-shrink-0">
                                            <span className={`absolute -top-1 -left-1 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm z-10 ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-200 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-white/80 text-gray-500'
                                                }`}>
                                                {index + 1}
                                            </span>
                                            {product.thumbnail_url ? (
                                                <img
                                                    src={product.thumbnail_url}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-lg object-cover shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center text-gray-400 shadow-sm">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-hunted-text line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {product.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                                {product.tagline}
                                            </p>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex-shrink-0 flex items-center gap-3 text-xs font-bold text-gray-900">
                                            <div className="flex items-center justify-center gap-1">
                                                <span>{product.votes_count.toLocaleString()}</span>
                                                <span className="text-[10px] text-gray-400">▲</span>
                                            </div>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-gray-700 dark:text-hunted-muted">{product.comments_count}</span>
                                                <MessageCircle className="w-3 h-3 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
}
