'use client';

import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { TrendingUp, MessageSquare, Activity } from 'lucide-react';

interface Snapshot {
    snapshot_time: string;
    votes_count: number;
    comments_count: number;
}

interface ProductHistory {
    id: string;
    name: string;
    color: string;
    snapshots: Snapshot[];
}

interface TopProductsVelocityChartProps {
    data: ProductHistory[];
}

export default function TopProductsVelocityChart({ data }: TopProductsVelocityChartProps) {
    const [mode, setMode] = useState<'votes' | 'comments' | 'velocity'>('votes');

    // Process data for the chart
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Get all unique timestamps
        const timestamps = Array.from(new Set(
            data.flatMap(p => p.snapshots.map(s => s.snapshot_time))
        )).sort();

        return timestamps.map(time => {
            const point: any = { time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

            data.forEach(product => {
                const snapshot = product.snapshots.find(s => s.snapshot_time === time);
                if (snapshot) {
                    if (mode === 'votes') {
                        point[product.id] = snapshot.votes_count;
                    } else if (mode === 'comments') {
                        point[product.id] = snapshot.comments_count;
                    } else {
                        // Velocity: Calculate change from previous snapshot
                        // This is a simplified velocity (current - previous)
                        // In a real app, you'd want to find the previous snapshot index
                        point[product.id] = snapshot.votes_count; // Placeholder for now, logic below is better
                    }
                }
            });
            return point;
        });
    }, [data, mode]);

    // Calculate Velocity (Rate of Change)
    const velocityData = useMemo(() => {
        if (mode !== 'velocity') return chartData;

        return chartData.map((point, index) => {
            if (index === 0) return { ...point, ...data.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}) };

            const prevPoint = chartData[index - 1];
            const newPoint = { ...point };

            data.forEach(product => {
                const current = point[product.id] || 0;
                const prev = prevPoint[product.id] || 0;
                newPoint[product.id] = current - prev;
            });

            return newPoint;
        });
    }, [chartData, mode, data]);

    const finalData = mode === 'velocity' ? velocityData : chartData;

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Top 10 Products Growth</h3>
                    <p className="text-sm text-gray-500">Real-time tracking of today's leaders</p>
                </div>

                <div className="flex bg-[#0F0F0F] rounded-lg p-1 border border-gray-800">
                    <button
                        onClick={() => setMode('votes')}
                        className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'votes'
                                ? 'bg-[#FF6154] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Votes
                    </button>
                    <button
                        onClick={() => setMode('comments')}
                        className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'comments'
                                ? 'bg-[#FF6154] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Comments
                    </button>
                    <button
                        onClick={() => setMode('velocity')}
                        className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'velocity'
                                ? 'bg-[#FF6154] text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        Velocity
                    </button>
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={finalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
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
                        />
                        {data.map((product) => (
                            <Line
                                key={product.id}
                                type="monotone"
                                dataKey={product.id}
                                name={product.name}
                                stroke={product.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Legend / Toggles */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
                {data.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-xs text-gray-300"
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: product.color }} />
                        {product.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
