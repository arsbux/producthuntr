'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Filter,
    Sparkles,
    Users,
    Award,
    Zap
} from 'lucide-react';
import {
    getMarketGaps,
    type MarketGap,
    getSuccessPatterns,
    type SuccessPattern
} from '@/lib/charts-data';

export default function OpportunitiesPage() {
    const [loading, setLoading] = useState(true);


    // Market Gaps State
    const [marketGaps, setMarketGaps] = useState<MarketGap[]>([]);
    const [gapFilter, setGapFilter] = useState<'all' | 'hot' | 'strong'>('all');

    // Success Patterns State
    const [successPatterns, setSuccessPatterns] = useState<SuccessPattern[]>([]);
    const [patternFilter, setPatternFilter] = useState<'all' | 'high' | 'emerging'>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [gaps, patterns] = await Promise.all([
                getMarketGaps(),
                getSuccessPatterns()
            ]);
            setMarketGaps(gaps);
            setSuccessPatterns(patterns);
        } catch (error) {
            console.error('Error loading opportunities:', error);
        }
        setLoading(false);
    };

    // Filter Logic
    const getFilteredGaps = () => {
        if (gapFilter === 'hot') return marketGaps.filter(g => g.opportunityScore >= 400);
        if (gapFilter === 'strong') return marketGaps.filter(g => g.opportunityScore >= 300 && g.opportunityScore < 400);
        return marketGaps;
    };

    const getFilteredPatterns = () => {
        if (patternFilter === 'high') return successPatterns.filter(p => p.successScore > 300);
        if (patternFilter === 'emerging') return successPatterns.filter(p => p.count >= 2 && p.count <= 10);
        return successPatterns;
    };

    const filteredGaps = getFilteredGaps();
    const filteredPatterns = getFilteredPatterns();

    const getScoreBadge = (score: number) => {
        if (score >= 400) return { label: 'High Potential', color: 'text-blue-600 bg-blue-50' };
        if (score >= 300) return { label: 'Moderate', color: 'text-gray-600 bg-gray-50' };
        return { label: 'Standard', color: 'text-gray-500 bg-gray-50' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {/* Header Section - Minimal */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                        Opportunities
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Underserved markets & success patterns
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: MARKET GAPS */}
                    <div className="flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Market Gaps
                                <span className="ml-2 text-sm font-normal text-gray-400">
                                    {marketGaps.length}
                                </span>
                            </h2>

                            {/* Filter Bar - Minimal */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGapFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${gapFilter === 'all'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setGapFilter('hot')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${gapFilter === 'hot'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    High Potential
                                </button>
                                <button
                                    onClick={() => setGapFilter('strong')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${gapFilter === 'strong'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Moderate
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Opportunities List - Minimal */}
                        <div className="overflow-y-auto h-[calc(100vh-280px)] pr-2 space-y-3">
                            {filteredGaps.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500 text-sm">No market gaps found.</p>
                                </div>
                            ) : (
                                filteredGaps.map((gap, index) => {
                                    const badge = getScoreBadge(gap.opportunityScore);

                                    return (
                                        <Link
                                            key={`${gap.icp}-${gap.problem}-${index}`}
                                            href={`/desk/niche/${encodeURIComponent(gap.niche)}`}
                                            className="block group"
                                        >
                                            <div className="bg-white border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-all hover:shadow-sm">
                                                <div className="flex flex-col gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                                                {gap.niche}
                                                            </span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.color}`}>
                                                                {badge.label}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-base font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                            {gap.problem}
                                                        </h3>

                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3" />
                                                                <span>{gap.icp}</span>
                                                            </div>
                                                            <span className="hidden sm:inline">•</span>
                                                            <div>
                                                                <span className="font-medium text-gray-900">{gap.currentProducts}</span> products
                                                            </div>
                                                            <span className="hidden sm:inline">•</span>
                                                            <div>
                                                                <span className="font-medium text-gray-900">{gap.avgEngagement}</span> avg engagement
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: SUCCESS PATTERNS */}
                    <div className="flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Success Patterns
                                <span className="ml-2 text-sm font-normal text-gray-400">
                                    {successPatterns.length}
                                </span>
                            </h2>

                            {/* Filters - Minimal */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPatternFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${patternFilter === 'all'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setPatternFilter('high')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${patternFilter === 'high'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    High
                                </button>
                                <button
                                    onClick={() => setPatternFilter('emerging')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${patternFilter === 'emerging'
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Emerging
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Patterns List - Minimal */}
                        <div className="overflow-y-auto h-[calc(100vh-280px)] pr-2 space-y-3">
                            {filteredPatterns.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm">No patterns found.</p>
                                </div>
                            ) : (
                                filteredPatterns.map((pattern, index) => (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-100 rounded-lg p-5 hover:border-gray-300 transition-all hover:shadow-sm"
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                                        {pattern.niche}
                                                    </span>
                                                    {pattern.successScore > 500 && (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700 flex items-center gap-1">
                                                            <Award className="w-3 h-3" /> High Performer
                                                        </span>
                                                    )}
                                                    {pattern.count >= 2 && pattern.count <= 5 && (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 flex items-center gap-1">
                                                            <Zap className="w-3 h-3" /> Emerging
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-3 mb-3">
                                                    <div>
                                                        <div className="text-[10px] font-medium text-gray-400 uppercase mb-1">Problem</div>
                                                        <div className="text-sm text-gray-900 leading-relaxed">{pattern.problem}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-medium text-gray-400 uppercase mb-1">Target ICP</div>
                                                        <div className="text-sm text-gray-900">{pattern.icp}</div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 border-t border-gray-50 pt-3 mt-1">
                                                    <div>
                                                        <span className="font-medium text-gray-900">{pattern.count}</span> launches
                                                    </div>
                                                    <span className="hidden sm:inline">•</span>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{pattern.avgVotes}</span> avg votes
                                                    </div>
                                                    <span className="hidden sm:inline">•</span>
                                                    <div>
                                                        <span className="font-medium text-gray-900">{pattern.avgComments}</span> avg comments
                                                    </div>
                                                </div>
                                            </div>
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
