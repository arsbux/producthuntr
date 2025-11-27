'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HeroChartProps {
    data: {
        category: string;
        launches: number;
        avgEngagement: number;
        growthRate: number;
    }[];
}

export default function HeroChart({ data }: HeroChartProps) {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1c2128] border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-xl">
                    <p className="text-white font-semibold text-sm mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <p className="text-neutral-300 text-xs font-medium">
                            {payload[0].value.toLocaleString()} Launches
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const hasData = data && data.length > 0;

    return (
        <div className="w-full h-[420px] bg-[#161b22] border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-2xl shadow-black/50 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight">Market Dominance</h3>
                    <p className="text-sm text-neutral-500 mt-1">Top categories by volume (6mo)</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-neutral-300">Live Data</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                            barSize={36}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#30363d" opacity={0.4} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="category"
                                type="category"
                                width={140}
                                tick={{ fill: '#8b949e', fontSize: 13, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: '#30363d', opacity: 0.2 }}
                            />
                            <Bar
                                dataKey="launches"
                                radius={[0, 4, 4, 0]}
                                animationDuration={1500}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 0 ? '#3b82f6' : '#21262d'}
                                        stroke={index === 0 ? 'none' : '#30363d'}
                                        strokeWidth={1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">Analyzing market data...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
