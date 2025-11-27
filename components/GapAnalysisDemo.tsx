'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface MarketGap {
    problem: string;
    icp: string;
    niche: string;
    currentProducts: number;
    avgEngagement: number;
    opportunityScore: number;
    reasoning: string;
}

interface GapAnalysisDemoProps {
    gaps: MarketGap[];
}

export default function GapAnalysisDemo({ gaps }: GapAnalysisDemoProps) {
    // Generate some mock data if real data is empty or sparse to make the chart look good behind the blur
    const displayData = gaps.length > 0 ? gaps.map(gap => ({
        x: gap.currentProducts,
        y: gap.avgEngagement,
        z: gap.opportunityScore,
    })) : Array.from({ length: 20 }).map((_, i) => ({
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 1000),
        z: Math.floor(Math.random() * 100) + 50,
    }));

    return (
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden relative group">

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 border-b border-neutral-800/50 flex justify-between items-center z-10 bg-neutral-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Market Matrix</span>
                </div>
                <div className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-[10px] font-mono text-neutral-400">
                    LIVE
                </div>
            </div>

            {/* Blurred Chart Content */}
            <div className="h-[450px] w-full p-8 bg-neutral-900 pt-20 filter blur-[6px] opacity-60 transition-all duration-500 group-hover:blur-[4px] group-hover:opacity-70">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Competition"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#525252', fontSize: 10 }}
                            domain={[0, 'auto']}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Demand"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#525252', fontSize: 10 }}
                        />
                        <ZAxis type="number" dataKey="z" range={[100, 800]} name="Score" />
                        <Scatter name="Gaps" data={displayData} fill="#3b82f6">
                            {displayData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.z > 80 ? '#3b82f6' : '#60a5fa'}
                                    fillOpacity={0.6}
                                    stroke={entry.z > 80 ? '#60a5fa' : '#93c5fd'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-8 rounded-2xl shadow-2xl max-w-sm text-center transform transition-all duration-500 hover:scale-105 hover:border-blue-500/30">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <Lock className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Unlock Market Gaps</h3>
                    <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                        Get access to our proprietary "Blue Ocean" matrix. Identify high-demand, low-competition niches instantly.
                    </p>
                    <Link href="/login" className="inline-flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                        <Sparkles className="w-4 h-4" /> Unlock Pro Access
                    </Link>
                    <div className="mt-4 text-xs text-neutral-500">
                        Join 5,000+ founders finding ideas daily
                    </div>
                </div>
            </div>
        </div>
    );
}
