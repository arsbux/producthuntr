'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface Trend {
    id: string;
    title: string;
    chartData: { value: number }[];
    status: string;
}

interface TrendVelocityDemoProps {
    trends: Trend[];
}

export default function TrendVelocityDemo({ trends }: TrendVelocityDemoProps) {
    const topTrends = trends.slice(0, 3);

    const mergedData = topTrends[0]?.chartData.map((_, index) => {
        const point: any = { month: index };
        topTrends.forEach(trend => {
            point[trend.title] = trend.chartData[index]?.value || 0;
        });
        return point;
    }) || [];

    const colors = ['#ea580c', '#3b82f6', '#10b981']; // Orange, Blue, Green

    return (
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                <div className="flex gap-4">
                    {topTrends.map((trend, i) => (
                        <div key={trend.id} className="flex items-center gap-2 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }}></span>
                            <span className="text-neutral-300">{trend.title}</span>
                        </div>
                    ))}
                </div>
                <div className="text-xs text-neutral-500 font-mono">LIVE DATA</div>
            </div>

            <div className="h-[350px] w-full p-6 bg-gradient-to-b from-neutral-900 to-neutral-900/50">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            {topTrends.map((trend, i) => (
                                <linearGradient key={trend.id} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#525252', fontSize: 10 }}
                            tickFormatter={(value) => `M${value + 1}`}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#525252', fontSize: 10 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #262626', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                            labelStyle={{ color: '#a3a3a3', marginBottom: '4px' }}
                        />
                        {topTrends.map((trend, i) => (
                            <Area
                                key={trend.id}
                                type="monotone"
                                dataKey={trend.title}
                                stroke={colors[i]}
                                strokeWidth={2}
                                fill={`url(#gradient-${i})`}
                                animationDuration={1500}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-between items-center">
                <div className="text-xs text-neutral-500">
                    Last 12 months velocity
                </div>
                <button className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:gap-2 transition-all">
                    Full Report <ArrowUpRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
