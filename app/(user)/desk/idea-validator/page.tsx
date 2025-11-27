'use client';

import { useState } from 'react';
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
    Activity
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
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { askGrowthIntelligence, type IntelligenceResult } from '@/lib/idea-validator';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function GrowthWorkbenchPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<IntelligenceResult | null>(null);
    const [query, setQuery] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const data = await askGrowthIntelligence(query);
            setResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (viz: IntelligenceResult['visualization']) => {
        if (!viz) return null;

        const CommonTooltip = () => (
            <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f3f4f6' }}
            />
        );

        switch (viz.type) {
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
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col">
            <div className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8 w-full max-w-7xl mx-auto">

                {/* Header & Search */}
                <div className={`transition-all duration-500 ${result ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center items-center'}`}>
                    <div className={`w-full ${result ? '' : 'max-w-3xl text-center'}`}>
                        <h1 className={`font-bold text-gray-900 tracking-tight mb-2 ${result ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
                            Growth Intelligence Center
                        </h1>
                        <p className={`text-gray-500 mb-8 ${result ? 'text-base' : 'text-xl'}`}>
                            Ask anything about the market, trends, or competitors.
                        </p>

                        <form onSubmit={handleSearch} className="relative w-full max-w-3xl mx-auto">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <input
                                    type="text"
                                    placeholder="e.g. 'Analyze the growth of AI writing tools' or 'What are the top trends in fintech?'"
                                    className="w-full pl-6 pr-16 py-5 rounded-2xl border border-gray-200 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg relative bg-white"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="absolute right-3 top-3 bottom-3 px-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowRight className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </form>

                        {!result && (
                            <div className="mt-8 flex flex-wrap justify-center gap-3">
                                {['Top AI Tools', 'SaaS Trends 2024', 'No-code Growth', 'Developer Tools'].map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => { setQuery(tag); }}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors shadow-sm"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Dashboard */}
                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. The Answer */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Market Analysis</h2>
                            </div>
                            <div className="prose prose-lg text-gray-700 max-w-none">
                                <p>{result.answer}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* 2. Dynamic Visualization */}
                            {result.visualization && (
                                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-gray-400" />
                                            {result.visualization.title}
                                        </h3>
                                    </div>
                                    <div className="flex-1 min-h-[300px]">
                                        {renderChart(result.visualization)}
                                    </div>
                                    <p className="mt-4 text-sm text-gray-500 text-center italic">
                                        {result.visualization.description}
                                    </p>
                                </div>
                            )}

                            {/* 3. Key Trends */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-gray-400" />
                                    Key Trends
                                </h3>
                                <div className="space-y-4">
                                    {result.trends.map((trend, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="font-medium text-gray-900">{trend.name}</span>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trend.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                                    trend.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-200 text-gray-700'
                                                }`}>
                                                {trend.growth}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Relevant Products */}
                        {result.related_products.length > 0 && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-gray-400" />
                                    Relevant Products
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {result.related_products.map((product) => (
                                        <div key={product.id} className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors group cursor-pointer">
                                            <div className="flex items-start gap-4 mb-3">
                                                {product.thumbnail_url ? (
                                                    <img src={product.thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <Rocket className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-1">{product.tagline}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">
                                                {product.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-yellow-500" />
                                                    {product.votes_count} votes
                                                </span>
                                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
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
    );
}
