'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    TrendingUp,
    MessageSquare,
    ArrowUpRight,
    Activity,
    Zap,
    BarChart3,
    ExternalLink,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import TopProductsVelocityChart from '@/components/TopProductsVelocityChart';
import CategoryVelocityChart from '@/components/CategoryVelocityChart';
import KeywordVelocityChart from '@/components/KeywordVelocityChart';

interface Launch {
    id: string;
    name: string;
    tagline: string;
    votes: number;
    comments: number;
    niche: string;
    thumbnail_url?: string;
    launched_at: string;
}

interface DashboardData {
    topLaunches: Launch[];
    productHistory: any[];
    categoryVelocity: any[];
    keywordVelocity: any[];
    trendHistory: any[];
    metrics: {
        totalLaunches: number;
        aiPercentage: number;
        avgVotes: number;
        topCategory: string;
    };
    chartData: any[];
}

export default function DashboardView() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`/api/today-launches?date=${selectedDate}`);
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        }

        setLoading(true);
        load();

        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Market Pulse</h1>
                    <p className="text-gray-500 text-sm">Real-time analysis of Product Hunt launches</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-[var(--bg-panel)] rounded-full border border-[var(--border-subtle)] p-1">
                        <button
                            onClick={() => {
                                const date = new Date(selectedDate);
                                date.setDate(date.getDate() - 1);
                                setSelectedDate(date.toLocaleDateString('en-CA'));
                            }}
                            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="relative px-4 py-1">
                            <span className="text-sm font-medium text-white cursor-pointer hover:text-[#FF6154] transition-colors">
                                {(() => {
                                    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                                    if (selectedDate === today) return 'Today';

                                    return new Date(selectedDate).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    });
                                })()}
                            </span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>

                        <button
                            onClick={() => {
                                const date = new Date(selectedDate);
                                date.setDate(date.getDate() + 1);
                                const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                                const nextDate = date.toLocaleDateString('en-CA');

                                if (nextDate <= today) {
                                    setSelectedDate(nextDate);
                                }
                            }}
                            disabled={selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })}
                            className={`p-1.5 rounded-full transition-colors ${selectedDate === new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
                                ? 'text-gray-700 cursor-not-allowed'
                                : 'hover:bg-white/10 text-gray-400 hover:text-white'
                                }`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {(() => {
                        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
                        const isToday = selectedDate === today;

                        return (
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-[var(--bg-panel)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                                <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                {isToday ? 'Live Updates' : 'Historical View'}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Total Launches"
                    value={data?.metrics?.totalLaunches}
                    icon={Activity}
                    trend="+12%"
                    loading={loading}
                />
                <MetricCard
                    label="AI Products"
                    value={data ? `${data.metrics.aiPercentage}%` : undefined}
                    icon={Zap}
                    subtext="of today's batch"
                    loading={loading}
                />
                <MetricCard
                    label="Avg. Upvotes"
                    value={data?.metrics?.avgVotes}
                    icon={TrendingUp}
                    subtext="per product"
                    loading={loading}
                />
                <MetricCard
                    label="Top Category"
                    value={data?.metrics?.topCategory}
                    icon={BarChart3}
                    highlight
                    loading={loading}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Top 10 List (Compact) - Spans 4 cols */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                            <h3 className="font-bold text-white">Top 10 Products</h3>
                            <span className="text-xs text-gray-500">By rank</span>
                        </div>
                        <div className="divide-y divide-gray-800 overflow-y-auto flex-1">
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <div key={i} className="p-3 flex items-center gap-3">
                                        <Skeleton className="w-4 h-4 rounded" />
                                        <Skeleton className="w-8 h-8 rounded-md" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <Skeleton className="w-8 h-4" />
                                    </div>
                                ))
                            ) : (
                                data?.topLaunches.slice(0, 10).map((launch, index) => (
                                    <Link
                                        key={launch.id}
                                        href={`/desk/launch/${launch.id}`}
                                        className="block p-3 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-mono text-gray-500 text-xs w-4 text-center">
                                                {index + 1}
                                            </div>

                                            {launch.thumbnail_url ? (
                                                <img src={launch.thumbnail_url} alt={launch.name} className="w-8 h-8 rounded-md object-cover bg-gray-800" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xs">
                                                    {launch.name[0]}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-white truncate group-hover:text-[#FF6154] transition-colors">
                                                    {launch.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 truncate">{launch.tagline}</p>
                                            </div>

                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 text-white font-mono text-xs font-medium">
                                                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                                                    {launch.votes}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Charts - Spans 8 cols */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Top Products Velocity Chart */}
                    {loading ? (
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    ) : (
                        <TopProductsVelocityChart data={data?.productHistory || []} />
                    )}

                </div>
            </div>

            {/* Secondary Charts Grid - Spans Full Width */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <>
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </>
                ) : (
                    <>
                        <CategoryVelocityChart data={data?.categoryVelocity || []} history={data?.trendHistory || []} />
                        <KeywordVelocityChart data={data?.keywordVelocity || []} history={data?.trendHistory || []} />
                    </>
                )}
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, trend, subtext, highlight, loading }: any) {
    return (
        <div className={`glass-panel p-5 rounded-xl ${highlight ? 'border-[#FF6154]/30 bg-[#FF6154]/5' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                    <Icon className="w-5 h-5" />
                </div>
                {trend && !loading && (
                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                {loading ? (
                    <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                    <h3 className="text-2xl font-bold text-white font-mono tracking-tight">{value}</h3>
                )}
                {subtext && <p className="text-xs text-gray-600 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
