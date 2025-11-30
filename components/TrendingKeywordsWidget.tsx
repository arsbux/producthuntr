'use client';

import { TrendingUp } from 'lucide-react';
import {
    LineChart,
    Line,
    ResponsiveContainer,
    YAxis
} from 'recharts';

interface KeywordData {
    name: string;
    count: number; // Volume
    growth: number; // Percentage
    history?: number[]; // Trend data
}

interface TrendingKeywordsWidgetProps {
    keywords: KeywordData[];
}

export default function TrendingKeywordsWidget({ keywords }: TrendingKeywordsWidgetProps) {
    const colors = ['#FF6154', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

    // Generate fake history if missing (for the sparklines)
    const getHistory = (k: KeywordData) => {
        if (k.history) return k.history.map((val, i) => ({ i, val }));
        // Generate a smooth curve
        return Array.from({ length: 20 }).map((_, i) => ({
            i,
            val: Math.sin(i / 3) * 20 + i * 5 + Math.random() * 10 // Upward trend with curve
        }));
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 h-full flex flex-col shadow-lg">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Trending Keywords</h3>
                    <p className="text-sm text-gray-500">High-velocity tags of the day</p>
                </div>
                <div className="px-3 py-1.5 bg-[#0F0F0F] border border-gray-800 rounded-lg text-xs font-medium text-gray-300 shadow-inner">
                    <span className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        Votes Velocity
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[180px] w-full mb-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart>
                        {keywords.slice(0, 3).map((k, i) => (
                            <Line
                                key={k.name}
                                data={getHistory(k)}
                                type="monotone"
                                dataKey="val"
                                stroke={colors[i]}
                                strokeWidth={3}
                                dot={false}
                                strokeOpacity={0.8}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>

                {/* Subtle Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-dashed border-gray-800/50 w-full h-px" />
                    <div className="border-t border-dashed border-gray-800/50 w-full h-px" />
                    <div className="border-t border-dashed border-gray-800/50 w-full h-px" />
                </div>
            </div>

            {/* Keywords List */}
            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar">
                {keywords.map((k, i) => (
                    <div key={k.name} className="group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                    style={{ backgroundColor: colors[i % colors.length], boxShadow: `0 0 10px ${colors[i % colors.length]}40` }}
                                />
                                <span className="text-base font-medium text-gray-200 group-hover:text-white transition-colors">
                                    #{k.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded">
                                    <TrendingUp className="w-3 h-3" />
                                    +{k.growth}%
                                </span>
                                <span className="text-sm text-gray-500 w-12 text-right">{k.count} vol</span>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-[#0F0F0F] rounded-full overflow-hidden border border-gray-800/50">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                style={{
                                    width: `${Math.min(100, (k.count / (keywords[0]?.count || 1)) * 100)}%`,
                                    backgroundColor: colors[i % colors.length]
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full -translate-x-full animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
