'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, TrendingUp, MessageCircle, Sparkles, Award, Filter, Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Skeleton } from '@/components/ui/skeleton';

function DailyAnalysisContent() {
    const searchParams = useSearchParams();
    const initialDate = searchParams.get('date');

    const [selectedDate, setSelectedDate] = useState(
        initialDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const supabase = createClientComponentClient();

    useEffect(() => {
        loadDailyAnalytics();
    }, [selectedDate]);

    const loadDailyAnalytics = async () => {
        setLoading(true);
        try {
            const targetDate = new Date(selectedDate);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            const { data: launches } = await supabase
                .from('ph_launches')
                .select('*')
                .gte('launched_at', targetDate.toISOString())
                .lt('launched_at', nextDay.toISOString())
                .not('ai_analysis', 'is', null);

            if (!launches || launches.length === 0) {
                setAnalytics(null);
                setLoading(false);
                return;
            }

            // Group by category
            const categoryMap = new Map<string, any[]>();
            launches.forEach(launch => {
                const category = launch.ai_analysis?.niche || 'Uncategorized';
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category)!.push(launch);
            });

            // Calculate category stats
            const categories = Array.from(categoryMap.entries()).map(([name, items]) => {
                const totalVotes = items.reduce((sum, l) => sum + (l.votes_count || 0), 0);
                const totalComments = items.reduce((sum, l) => sum + (l.comments_count || 0), 0);
                const avgVotes = Math.round(totalVotes / items.length);
                const avgComments = Math.round(totalComments / items.length);

                // Sort items by votes
                const sortedItems = [...items].sort((a, b) =>
                    (b.votes_count || 0) - (a.votes_count || 0)
                );

                return {
                    name,
                    count: items.length,
                    totalVotes,
                    totalComments,
                    avgVotes,
                    avgComments,
                    topProduct: sortedItems[0],
                    allProducts: sortedItems
                };
            });

            // Sort categories by launch count
            categories.sort((a, b) => b.count - a.count);

            // Find top voted category and majority category
            const topVotedCategory = [...categories].sort((a, b) => b.totalVotes - a.totalVotes)[0];
            const majorityCategory = categories[0]; // Already sorted by count

            // Overall stats
            const totalLaunches = launches.length;
            const totalVotes = launches.reduce((sum, l) => sum + (l.votes_count || 0), 0);
            const totalComments = launches.reduce((sum, l) => sum + (l.comments_count || 0), 0);

            // Sort all launches by votes
            const sortedLaunches = [...launches].sort((a, b) =>
                (b.votes_count || 0) - (a.votes_count || 0)
            );

            setAnalytics({
                date: targetDate,
                totalLaunches,
                totalVotes,
                totalComments,
                avgVotes: Math.round(totalVotes / totalLaunches),
                avgComments: Math.round(totalComments / totalLaunches),
                topVotedCategory: topVotedCategory?.name || 'N/A',
                majorityCategory: majorityCategory?.name || 'N/A',
                categories,
                allLaunches: sortedLaunches
            });
        } catch (error) {
            console.error('Error loading daily analytics:', error);
        }
        setLoading(false);
    };

    const formattedDate = analytics?.date ? new Date(analytics.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : '';

    const getCategoryColor = (index: number) => {
        const colors = [
            '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
        ];
        return colors[index % colors.length];
    };

    // Filter launches by category
    const filteredLaunches = selectedCategory === 'all'
        ? analytics?.allLaunches || []
        : analytics?.allLaunches?.filter((launch: any) =>
            launch.ai_analysis?.niche === selectedCategory
        ) || [];

    // if (loading) return ... removed

    return (
        <div className="min-h-screen bg-white dark:bg-hunted-dark">
            <div className="max-w-[1800px] mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/desk"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-hunted-text tracking-tight mb-1">
                                Daily Analysis
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-hunted-muted">
                                <Calendar className="w-4 h-4" />
                                <span>{formattedDate}</span>
                            </div>
                        </div>

                        {/* Date Selector */}
                        <div className="flex items-center gap-3">
                            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-hunted-muted">
                                Select Date:
                            </label>
                            <input
                                id="date-picker"
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="px-3 py-2 border border-gray-200 dark:border-hunted-border dark:bg-hunted-card dark:text-hunted-text rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-hunted-text focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <>
                        {/* Overall Stats Skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5">
                                    <Skeleton className="w-20 h-3 mb-2" />
                                    <Skeleton className="w-16 h-8" />
                                </div>
                            ))}
                        </div>

                        {/* Three Column Layout Skeleton */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Categories Breakdown Skeleton */}
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-6">
                                <Skeleton className="w-32 h-6 mb-6" />
                                <div className="space-y-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between">
                                                <Skeleton className="w-24 h-4" />
                                                <Skeleton className="w-8 h-4" />
                                            </div>
                                            <Skeleton className="w-full h-2 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* All Launches Skeleton */}
                            <div className="lg:col-span-2 bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <Skeleton className="w-32 h-6" />
                                    <Skeleton className="w-32 h-8 rounded-lg" />
                                </div>
                                <div className="space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-hunted-border">
                                            <Skeleton className="w-7 h-7 rounded-lg" />
                                            <Skeleton className="w-12 h-12 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="w-48 h-4" />
                                                <Skeleton className="w-32 h-3" />
                                            </div>
                                            <div className="flex gap-4">
                                                <Skeleton className="w-12 h-4" />
                                                <Skeleton className="w-12 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : !analytics ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-hunted-card rounded-lg border border-dashed border-gray-200 dark:border-hunted-border">
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-hunted-text mb-1">No Data Available</h3>
                        <p className="text-gray-500 dark:text-hunted-muted text-sm">No launches found for this date</p>
                    </div>
                ) : (
                    <>
                        {/* Overall Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Total Launches</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-hunted-text">{analytics.totalLaunches}</div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Categories</div>
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.categories.length}</div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Total Votes</div>
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.totalVotes}</div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Avg Votes</div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-hunted-text">{analytics.avgVotes}</div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Top Voted</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-hunted-text truncate" title={analytics.topVotedCategory}>
                                    {analytics.topVotedCategory}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5 hover:border-gray-200 dark:hover:border-hunted-text transition-colors">
                                <div className="text-[10px] font-medium text-gray-400 dark:text-hunted-muted uppercase tracking-wider mb-2">Majority</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-hunted-text truncate" title={analytics.majorityCategory}>
                                    {analytics.majorityCategory}
                                </div>
                            </div>
                        </div>

                        {/* Three Column Layout */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Categories Breakdown - Left Column */}
                            <div className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-hunted-text mb-6">
                                    Categories
                                    <span className="ml-2 text-sm font-normal text-gray-400 dark:text-hunted-muted">
                                        {analytics.categories.length}
                                    </span>
                                </h2>

                                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                                    {analytics.categories.map((category: any, index: number) => {
                                        const percentage = Math.round((category.count / analytics.totalLaunches) * 100);
                                        const color = getCategoryColor(index);

                                        return (
                                            <div key={category.name} className="group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-sm text-gray-900 dark:text-hunted-text">{category.name}</h3>
                                                            <span className="text-xs font-bold text-gray-900 dark:text-hunted-text bg-gray-50 dark:bg-neutral-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-hunted-border">
                                                                {percentage}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-hunted-muted">
                                                            <span>{category.count} launches</span>
                                                            <span>•</span>
                                                            <span>{category.totalVotes} votes</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2 mb-3">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: color
                                                        }}
                                                    />
                                                </div>

                                                {/* Top product in category */}
                                                {category.topProduct && (
                                                    <Link
                                                        href={category.topProduct.product_url || '#'}
                                                        target="_blank"
                                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                                                    >
                                                        {category.topProduct.thumbnail_url && (
                                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-white dark:bg-hunted-card">
                                                                <img
                                                                    src={category.topProduct.thumbnail_url}
                                                                    alt={category.topProduct.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-xs text-gray-900 dark:text-hunted-text truncate">
                                                                {category.topProduct.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-hunted-muted">
                                                                {category.topProduct.votes_count || 0} votes
                                                            </div>
                                                        </div>
                                                        <Award className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* All Launches - Middle Column (2 columns wide) */}
                            <div className="lg:col-span-2 bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-hunted-text">
                                        All Launches
                                        <span className="ml-2 text-sm font-normal text-gray-400 dark:text-hunted-muted">
                                            {filteredLaunches.length}
                                        </span>
                                    </h2>

                                    {/* Category Filter */}
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-400 dark:text-hunted-muted" />
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="px-3 py-1.5 border border-gray-200 dark:border-hunted-border dark:bg-hunted-dark dark:text-hunted-text rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-hunted-text focus:border-transparent"
                                        >
                                            <option value="all">All Categories</option>
                                            {analytics.categories.map((cat: any) => (
                                                <option key={cat.name} value={cat.name}>
                                                    {cat.name} ({cat.count})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                                    {filteredLaunches.map((launch: any, index: number) => (
                                        <Link
                                            key={launch.id}
                                            href={launch.product_url || '#'}
                                            target="_blank"
                                            className="block group"
                                        >
                                            <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-hunted-border hover:border-gray-300 dark:hover:border-hunted-text hover:shadow-sm transition-all">
                                                {/* Rank */}
                                                <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-hunted-muted">
                                                    {index + 1}
                                                </div>

                                                {/* Thumbnail */}
                                                {launch.thumbnail_url && (
                                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-800">
                                                        <img
                                                            src={launch.thumbnail_url}
                                                            alt={launch.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-sm text-gray-900 dark:text-hunted-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                        {launch.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-hunted-muted truncate">{launch.tagline}</p>
                                                    {launch.ai_analysis?.niche && (
                                                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-hunted-muted rounded">
                                                            {launch.ai_analysis.niche}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <TrendingUp className="w-4 h-4 text-gray-400 dark:text-hunted-muted" />
                                                        <span className="font-semibold text-gray-900 dark:text-hunted-text">{launch.votes_count || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageCircle className="w-4 h-4 text-gray-400 dark:text-hunted-muted" />
                                                        <span className="font-semibold text-gray-900 dark:text-hunted-text">{launch.comments_count || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}

                                    {filteredLaunches.length === 0 && (
                                        <div className="text-center py-12 text-gray-400 dark:text-hunted-muted text-sm">
                                            No launches found in this category
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function DailyAnalysisPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-hunted-dark p-6">
                <div className="max-w-[1800px] mx-auto">
                    <div className="mb-8 flex justify-between">
                        <Skeleton className="w-48 h-8" />
                        <Skeleton className="w-48 h-10 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-hunted-card rounded-lg border border-gray-100 dark:border-hunted-border p-5">
                                <Skeleton className="w-20 h-3 mb-2" />
                                <Skeleton className="w-16 h-8" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        }>
            <DailyAnalysisContent />
        </Suspense>
    );
}
