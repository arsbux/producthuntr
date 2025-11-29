'use client';

import { useState, useEffect } from 'react';
import { getMarketHealth, getTopCategories } from '@/lib/charts-data';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, MessageCircle, Award, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [marketHealth, setMarketHealth] = useState<any>(null);
    const [topCategories, setTopCategories] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [health, categories] = await Promise.all([
                    getMarketHealth(),
                    getTopCategories('engagement', 10)
                ]);
                setMarketHealth(health);
                setTopCategories(categories);
            } catch (error) {
                console.error('Failed to load analytics data', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-hunted-dark p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        Analytics Overview
                    </h1>
                    <p className="text-gray-500 dark:text-hunted-muted mt-1">
                        High-level market health and category performance metrics.
                    </p>
                </div>

                {/* Market Health Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-sm">
                                <Skeleton className="h-4 w-24 mb-4" />
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        ))
                    ) : marketHealth ? (
                        <>
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-hunted-muted">Total Products</h3>
                                    <Zap className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-hunted-text mb-1">
                                    {marketHealth.totalProducts.toLocaleString()}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted">Analyzed in last 6 months</p>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-hunted-muted">Avg Upvotes</h3>
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-hunted-text mb-1">
                                    {marketHealth.avgUpvotes.toLocaleString()}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted">Per product average</p>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-hunted-muted">Avg Comments</h3>
                                    <MessageCircle className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-hunted-text mb-1">
                                    {marketHealth.avgComments.toLocaleString()}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted">Per product average</p>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-hunted-muted">Success Rate</h3>
                                    <Award className="w-4 h-4 text-purple-500" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-hunted-text mb-1">
                                    {marketHealth.successRate}%
                                </div>
                                <p className="text-xs text-gray-500 dark:text-hunted-muted">Products with &gt;500 votes</p>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Top Categories Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text">Top Categories by Engagement</h2>
                            <p className="text-sm text-gray-500 dark:text-hunted-muted">Categories driving the most user interaction</p>
                        </div>

                        {loading ? (
                            <div className="h-[300px] w-full">
                                <Skeleton className="h-full w-full rounded-lg" />
                            </div>
                        ) : (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topCategories} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.5} />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="category"
                                            type="category"
                                            width={150}
                                            tick={{ fill: '#6b7280', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{
                                                backgroundColor: '#1f2937',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#f3f4f6'
                                            }}
                                        />
                                        <Bar dataKey="avgEngagement" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                            {topCategories.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#93c5fd'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Category List */}
                    <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-hunted-text">Growth Leaders</h2>
                            <p className="text-sm text-gray-500 dark:text-hunted-muted">Fastest growing categories</p>
                        </div>

                        <div className="space-y-4">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-8 h-8 rounded-lg" />
                                            <div>
                                                <Skeleton className="w-24 h-4 mb-1" />
                                                <Skeleton className="w-16 h-3" />
                                            </div>
                                        </div>
                                        <Skeleton className="w-12 h-6 rounded-full" />
                                    </div>
                                ))
                            ) : (
                                topCategories
                                    .sort((a, b) => b.growthRate - a.growthRate)
                                    .slice(0, 6)
                                    .map((cat, i) => (
                                        <div key={cat.category} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm text-gray-900 dark:text-hunted-text">{cat.category}</div>
                                                    <div className="text-xs text-gray-500 dark:text-hunted-muted">{cat.launches} launches</div>
                                                </div>
                                            </div>
                                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cat.growthRate > 0
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {cat.growthRate > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {Math.abs(cat.growthRate)}%
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
