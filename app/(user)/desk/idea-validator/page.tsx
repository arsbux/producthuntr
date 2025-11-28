'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useSearchParams } from 'next/navigation';
import {
    Rocket,
    Search,
    Zap,
    Target,
    BarChart3,
    TrendingUp,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    PieChart as PieChartIcon,
    Activity,
    Box,
    MessageSquare,
    Calendar
} from 'lucide-react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    ScatterChart,
    Scatter,
    RadialBarChart,
    RadialBar,
    Legend
} from 'recharts';
import { askGrowthIntelligence, type IntelligenceResult } from '@/lib/idea-validator';
import { searchProducts, getProductProfile, type ProductSearchResult, type ProductProfile } from '@/lib/product-intelligence';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PremiumModal from '@/components/PremiumModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function GrowthWorkbenchPage() {
    const searchParams = useSearchParams();
    const [query, setQuery] = useState('');
    const initialProduct = searchParams.get('product');

    // Auth & Subscription State
    const [user, setUser] = useState<any>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (!user) {
                    setShowPremiumModal(true);
                    setCheckingAuth(false);
                    return;
                }

                // Check subscription status
                const res = await fetch('/api/subscription/status');
                const data = await res.json();

                if (data.subscribed) {
                    setIsSubscribed(true);
                    setShowPremiumModal(false);
                } else {
                    setShowPremiumModal(true);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setShowPremiumModal(true);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAccess();
    }, []);

    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<IntelligenceResult | null>(null);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<ProductSearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [debouncedQuery] = useDebounce(query, 300);

    // Product Profile State
    const [selectedProduct, setSelectedProduct] = useState<ProductProfile | null>(null);
    const [viewMode, setViewMode] = useState<'chat' | 'product'>('chat');

    // Handle URL product parameter
    useEffect(() => {
        const productId = searchParams.get('product');
        if (productId) {
            setLoading(true);
            setViewMode('product');
            getProductProfile(productId)
                .then(profile => {
                    setSelectedProduct(profile);
                    setQuery(profile.product.name);
                })
                .catch(error => {
                    console.error('Failed to load product profile:', error);
                    setViewMode('chat');
                })
                .finally(() => setLoading(false));
        }
    }, [searchParams]);

    // Handle Autocomplete
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }
            // Only search if we are NOT in product mode (or maybe always?)
            // If the user is typing a query for the agent, we might still want to show products.
            const results = await searchProducts(debouncedQuery);
            setSuggestions(results);
            setShowSuggestions(true);
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);
        setSelectedProduct(null);
        setViewMode('chat');
        setShowSuggestions(false);

        try {
            const data = await askGrowthIntelligence(query);
            setResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = async (product: ProductSearchResult) => {
        setQuery(product.name);
        setShowSuggestions(false);
        setLoading(true);
        setViewMode('product');

        try {
            const profile = await getProductProfile(product.id);
            setSelectedProduct(profile);
        } catch (error) {
            console.error('Failed to load product profile:', error);
            // Fallback to chat if profile fails
            setViewMode('chat');
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (viz: IntelligenceResult['visualization']) => {
        if (!viz) return null;

        const CommonTooltip = () => (
            <Tooltip
                contentStyle={{
                    backgroundColor: '#0F0F0F',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#E4E4E7'
                }}
                cursor={{ fill: '#27272a' }}
            />
        );

        switch (viz.type) {
            case 'multi_line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey={viz.categoryKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <CommonTooltip />
                            <Legend />
                            {viz.seriesKeys?.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey={viz.categoryKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <CommonTooltip />
                            <Line type="monotone" dataKey={viz.dataKey} stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={viz.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey={viz.categoryKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <CommonTooltip />
                            <Bar dataKey={viz.dataKey} fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="launchVolume" name="Volume" unit="" />
                            <YAxis type="number" dataKey="avgUpvotes" name="Demand" unit="" />
                            <ZAxis type="number" dataKey="opportunityScore" range={[60, 400]} name="Score" />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: '#0F0F0F',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: '#E4E4E7'
                                }}
                            />
                            <Scatter name="Opportunities" data={viz.data} fill="#8884d8">
                                {viz.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                );
            case 'radial_bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={20} data={viz.data}>
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff' }}
                                background
                                dataKey={viz.dataKey}
                                cornerRadius={10}
                            >
                                {viz.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </RadialBar>
                            <Legend
                                iconSize={10}
                                layout="vertical"
                                verticalAlign="middle"
                                wrapperStyle={{
                                    right: 0,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    lineHeight: '24px'
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0F0F0F',
                                    border: '1px solid #27272a',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    color: '#E4E4E7'
                                }}
                                cursor={{ fill: 'transparent' }}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={viz.data}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey={viz.categoryKey} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar name={viz.title} dataKey={viz.dataKey} stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                            <CommonTooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={viz.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey={viz.dataKey}
                            >
                                {viz.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <CommonTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <PremiumModal
                isOpen={showPremiumModal}
                user={user}
            />
            <div className={`min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-hunted-dark flex flex-col ${showPremiumModal ? 'blur-sm pointer-events-none h-[calc(100vh-64px)] overflow-hidden' : ''}`}>
                <div className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8 w-full max-w-7xl mx-auto">

                    {/* Header & Search */}
                    <div className={`transition-all duration-500 ${result || viewMode === 'product' ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center items-center'}`}>
                        <div className={`w-full ${result || viewMode === 'product' ? '' : 'max-w-3xl text-center'}`}>
                            <h1 className={`font-bold text-gray-900 dark:text-hunted-text tracking-tight mb-2 ${result || viewMode === 'product' ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                                Growth Intelligence Center
                            </h1>
                            <p className={`text-gray-500 dark:text-hunted-muted mb-8 ${result || viewMode === 'product' ? 'text-base' : 'text-xl'}`}>
                                Ask anything about the market, trends, or competitors.
                            </p>

                            <div className="relative w-full max-w-3xl mx-auto">
                                <form onSubmit={handleSearch} className="relative z-20">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                        <input
                                            type="text"
                                            placeholder="e.g. 'Analyze the growth of AI writing tools' or 'What are the top trends in fintech?'"
                                            className="w-full pl-6 pr-16 py-5 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg relative bg-white dark:bg-hunted-card dark:text-hunted-text"
                                            value={query}
                                            onChange={(e) => {
                                                setQuery(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onFocus={() => setShowSuggestions(true)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || !query.trim()}
                                            className="absolute right-3 top-3 bottom-3 px-4 bg-gray-900 dark:bg-hunted-border text-white rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </form>

                                {/* Autocomplete Suggestions */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-hunted-card rounded-2xl shadow-xl border border-gray-100 dark:border-hunted-border overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {suggestions.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleSelectProduct(product)}
                                                className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-hunted-border/50 cursor-pointer transition-colors border-b border-gray-50 dark:border-hunted-border last:border-0"
                                            >
                                                {/* Rank Badge */}
                                                {product.daily_rank && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-hunted-border flex items-center justify-center text-sm font-bold text-gray-600 dark:text-hunted-muted shrink-0">
                                                        {product.daily_rank}
                                                    </div>
                                                )}

                                                {/* Logo */}
                                                {product.thumbnail_url ? (
                                                    <img src={product.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-hunted-border shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-hunted-border flex items-center justify-center shrink-0">
                                                        <Rocket className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 dark:text-hunted-text truncate">{product.name}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-hunted-muted truncate">{product.tagline}</p>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-hunted-muted shrink-0">
                                                    <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-hunted-text">
                                                        <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                        {product.votes_count}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {product.comments_count}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {!result && viewMode === 'chat' && (
                                <div className="mt-8 flex flex-wrap justify-center gap-3">
                                    {['Top AI Tools', 'SaaS Trends 2024', 'No-code Growth', 'Developer Tools'].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => { setQuery(tag); }}
                                            className="px-4 py-2 bg-white dark:bg-hunted-card border border-gray-200 dark:border-hunted-border rounded-full text-sm text-gray-600 dark:text-hunted-muted hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PRODUCT PROFILE MODE */}
                    {viewMode === 'product' && selectedProduct && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Header Card */}
                            <div className="bg-white dark:bg-hunted-card p-8 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Rocket className="w-64 h-64 text-blue-600" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                    {/* Large Logo */}
                                    {selectedProduct.product.thumbnail_url ? (
                                        <img src={selectedProduct.product.thumbnail_url} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-lg bg-gray-100" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-lg">
                                            <Rocket className="w-12 h-12 text-blue-600" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-hunted-text">{selectedProduct.product.name}</h2>
                                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                #{selectedProduct.metrics.daily_rank} of the Day
                                            </span>
                                            {selectedProduct.metrics.weekly_rank <= 10 && (
                                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                                                    #{selectedProduct.metrics.weekly_rank} of the Week
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xl text-gray-600 dark:text-hunted-muted mb-4">{selectedProduct.product.tagline}</p>

                                        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-hunted-muted mb-6">
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                <span className="font-bold text-gray-900 dark:text-hunted-text text-lg">{selectedProduct.product.votes_count}</span>
                                                <span>Upvotes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-5 h-5 text-gray-400" />
                                                <span className="font-bold text-gray-900 dark:text-hunted-text text-lg">{selectedProduct.product.comments_count}</span>
                                                <span>Comments</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <span>Launched {new Date(selectedProduct.product.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.product.topics.map(topic => (
                                                <span key={topic} className="px-3 py-1 bg-gray-100 dark:bg-hunted-border text-gray-600 dark:text-hunted-muted rounded-lg text-xs font-medium">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Market Analysis */}
                                <div className="lg:col-span-2 bg-white dark:bg-hunted-card p-8 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-hunted-text">Market Analysis</h3>
                                    </div>
                                    <div className="prose prose-lg text-gray-700 dark:text-hunted-muted max-w-none">
                                        <p className="whitespace-pre-wrap">{selectedProduct.market_analysis}</p>
                                    </div>
                                </div>

                                {/* Category Stats */}
                                <div className="bg-white dark:bg-hunted-card p-6 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm space-y-6">
                                    <h3 className="font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                        <Target className="w-5 h-5 text-gray-400" />
                                        Category Performance
                                    </h3>

                                    <div className="p-4 bg-gray-50 dark:bg-hunted-border/50 rounded-xl">
                                        <div className="text-sm text-gray-500 dark:text-hunted-muted mb-1">Primary Niche</div>
                                        <div className="font-bold text-gray-900 dark:text-hunted-text text-lg">{selectedProduct.analysis.niche}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Category Rank</div>
                                            <div className="font-bold text-blue-900 dark:text-blue-100 text-2xl">#{selectedProduct.metrics.category_rank}</div>
                                            <div className="text-xs text-blue-500 dark:text-blue-300 mt-1">out of {selectedProduct.metrics.total_products_in_category}</div>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Percentile</div>
                                            <div className="font-bold text-green-900 dark:text-green-100 text-2xl">Top {100 - selectedProduct.metrics.percentile_in_category}%</div>
                                            <div className="text-xs text-green-500 dark:text-green-300 mt-1">of category</div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-hunted-border/50 rounded-xl">
                                        <div className="text-sm text-gray-500 dark:text-hunted-muted mb-1">Identified ICP</div>
                                        <div className="font-medium text-gray-900 dark:text-hunted-text">{selectedProduct.analysis.icp}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CHAT/AGENT MODE RESULTS */}
                    {viewMode === 'chat' && result && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* 1. The Answer */}
                            <div className="bg-white dark:bg-hunted-card p-8 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-hunted-text">Market Analysis</h2>
                                </div>
                                <div className="prose prose-lg text-gray-700 dark:text-hunted-muted max-w-none">
                                    <p className="whitespace-pre-wrap">{result.answer}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* 2. Dynamic Visualization */}
                                {result.visualization && result.visualization.data && result.visualization.data.length > 0 && (
                                    <div className="lg:col-span-2 bg-white dark:bg-hunted-card p-6 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm flex flex-col">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-gray-400" />
                                                {result.visualization.title}
                                            </h3>
                                        </div>
                                        <div className="flex-1 min-h-[400px]">
                                            {renderChart(result.visualization)}
                                        </div>
                                        <p className="mt-4 text-sm text-gray-500 dark:text-hunted-muted text-center italic">
                                            {result.visualization.description}
                                        </p>
                                    </div>
                                )}

                                {/* 3. Key Trends */}
                                {result.trends && result.trends.length > 0 && (
                                    <div className="bg-white dark:bg-hunted-card p-6 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm">
                                        <h3 className="font-bold text-gray-900 dark:text-hunted-text mb-6 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-gray-400" />
                                            Key Trends
                                        </h3>
                                        <div className="space-y-4">
                                            {result.trends.map((trend, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-hunted-border/50 rounded-xl">
                                                    <span className="font-medium text-gray-900 dark:text-hunted-text">{trend.name}</span>
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trend.sentiment === 'positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                        trend.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                            'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                        }`}>
                                                        {trend.growth}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. Relevant Products */}
                            {result.related_products.length > 0 && (
                                <div className="bg-white dark:bg-hunted-card p-6 rounded-2xl border border-gray-200 dark:border-hunted-border shadow-sm">
                                    <h3 className="font-bold text-gray-900 dark:text-hunted-text mb-6 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-gray-400" />
                                        Relevant Products
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {result.related_products.map((product) => (
                                            <div key={product.id} className="p-4 rounded-xl border border-gray-200 dark:border-hunted-border hover:border-blue-300 dark:hover:border-blue-500 transition-colors group cursor-pointer">
                                                <div className="flex items-start gap-4 mb-3">
                                                    {product.thumbnail_url ? (
                                                        <img src={product.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-hunted-border flex items-center justify-center">
                                                            <Rocket className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-hunted-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h4>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{product.tagline}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-hunted-muted line-clamp-2 mb-3 h-10">
                                                    {product.description}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-hunted-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3 text-yellow-500" />
                                                        {product.votes_count} votes
                                                    </span>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 dark:text-blue-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
