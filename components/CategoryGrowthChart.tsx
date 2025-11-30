'use client';

import { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp, MessageSquare, Rocket } from 'lucide-react';

interface CategoryGrowthChartProps {
    data: any[];
    title?: string;
    type: 'category' | 'keyword';
}

export default function CategoryGrowthChart({ data, title, type }: CategoryGrowthChartProps) {
    const [mode, setMode] = useState<'launches' | 'votes' | 'comments'>('launches');

    const chartData = useMemo(() => {
        if (!data) return [];
        return data.map(item => ({
            month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            value: mode === 'launches'
                ? (type === 'category' ? item.count : item.mentions)
                : (mode === 'votes' ? item.votes : item.comments)
        }));
    }, [data, mode, type]);

    const getModeLabel = () => {
        switch (mode) {
            case 'launches': return 'Total Launches';
            case 'votes': return 'Total Votes';
            case 'comments': return 'Total Comments';
        }
    };

    const getModeColor = () => {
        switch (mode) {
            case 'launches': return '#3B82F6'; // Blue
            case 'votes': return '#FF6154'; // Orange
            case 'comments': return '#10B981'; // Green
        }
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{title || 'Growth Over Time'}</h3>
                    <p className="text-sm text-gray-500">12-month historical performance</p>
                </div>

                <div className="flex bg-[#0F0F0F] rounded-lg p-1 border border-gray-800">
                    <button
                        onClick={() => setMode('launches')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'launches'
                            ? 'bg-[#3B82F6] text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Rocket className="w-3 h-3" />
                        Launches
                    </button>
                    <button
                        onClick={() => setMode('votes')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'votes'
                            ? 'bg-[#FF6154] text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <TrendingUp className="w-3 h-3" />
                        Votes
                    </button>
                    <button
                        onClick={() => setMode('comments')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'comments'
                            ? 'bg-[#10B981] text-white shadow-sm'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <MessageSquare className="w-3 h-3" />
                        Comments
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={getModeColor()} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={getModeColor()} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#999', marginBottom: '8px' }}
                            formatter={(value: number) => [value.toLocaleString(), getModeLabel()]}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={getModeColor()}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
