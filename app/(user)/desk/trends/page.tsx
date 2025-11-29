'use client';

import { useState, useEffect } from 'react';
import { fetchAggregatedTrends } from '@/app/actions/trends';
import { Calendar } from 'lucide-react';
import TrendsChart from '@/components/TrendsChart';
import { Skeleton } from '@/components/ui/skeleton';

export default function TrendsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30d');

    useEffect(() => {
        loadData();
    }, [timeframe]);

    async function loadData() {
        setLoading(true);
        const res = await fetchAggregatedTrends(timeframe);
        setData(res);
        setLoading(false);
    }

    // if (loading) return ... removed
    // if (!data) return ... removed

    const keywords = data?.keywords || [];
    const categories = data?.categories || [];
    const totalLaunches = data?.totalLaunches || 0;
    const history = data?.history || [];

    const topKeyword = keywords[0];
    const topCategory = categories[0];

    return (
        <div className="p-4 md:p-8 bg-[var(--bg-app)] min-h-screen text-gray-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Market Trends</h1>
                    <p className="text-gray-400">Track top keywords and categories over time</p>
                </div>

                {/* Timeframe Filter */}
                <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-gray-800">
                    <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-transparent text-sm text-white focus:outline-none py-1 pr-2"
                    >
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="3m">Last 3 Months</option>
                        <option value="6m">Last 6 Months</option>
                        <option value="12m">Last 12 Months</option>
                        <option value="18m">Last 18 Months</option>
                    </select>
                </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Launches</div>
                    {loading ? (
                        <Skeleton className="h-9 w-24 mb-2" />
                    ) : (
                        <div className="text-3xl font-bold text-white">{totalLaunches}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">in selected period</div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Top Keyword</div>
                    {loading ? (
                        <Skeleton className="h-8 w-32 mb-2" />
                    ) : (
                        <div className="text-2xl font-bold text-[#FF6154] truncate">{topKeyword?.name || 'N/A'}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">{loading ? <Skeleton className="h-3 w-16 inline-block" /> : `${topKeyword?.launches || 0} launches`}</div>
                </div>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Top Category</div>
                    {loading ? (
                        <Skeleton className="h-8 w-40 mb-2" />
                    ) : (
                        <div className="text-2xl font-bold text-blue-400 truncate">{topCategory?.name || 'N/A'}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">{loading ? <Skeleton className="h-3 w-16 inline-block" /> : `${topCategory?.launches || 0} launches`}</div>
                </div>
            </div>

            {/* Keywords Section */}
            <div className="space-y-6 mb-16">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-8 bg-[#FF6154] rounded-full"></span>
                    Top Keywords
                </h2>
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
                    {loading ? (
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    ) : (
                        <TrendsChart
                            key="keywords-chart"
                            history={history}
                            items={keywords}
                            type="keywords"
                        />
                    )}
                </div>
            </div>

            {/* Categories Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                    Top Categories
                </h2>
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
                    {loading ? (
                        <Skeleton className="h-[400px] w-full rounded-xl" />
                    ) : (
                        <TrendsChart
                            key="categories-chart"
                            history={history}
                            items={categories}
                            type="categories"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
