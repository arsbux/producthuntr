'use client';

import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ProductGrowthChartProps {
    products: any[];
}

export default function ProductGrowthChart({ products }: ProductGrowthChartProps) {
    const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

    // Generate simulated intraday history
    const generateHistory = () => {
        const now = new Date();
        const startHour = 8; // Start from 8 AM or launch time
        const currentHour = now.getHours();
        const points = [];

        for (let h = startHour; h <= currentHour; h++) {
            const time = `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
            const point: any = { time };

            products.forEach(p => {
                // Simulate growth curve
                const totalHours = currentHour - startHour + 1;
                const hourIndex = h - startHour;
                const progress = hourIndex / (totalHours - 1 || 1);

                // Logistic-like curve
                const curve = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
                const votes = Math.floor(p.votes_count * curve);

                point[p.id] = Math.max(0, votes);
            });
            points.push(point);
        }
        return points;
    };

    const data = generateHistory();
    const colors = ['#FF6154', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Top 10 Products Growth</h3>
                    <p className="text-sm text-gray-500">Real-time tracking of today's leaders</p>
                </div>
                <div className="flex bg-[#0F0F0F] rounded-lg p-1 border border-gray-800">
                    <button className="px-3 py-1.5 bg-[#FF6154] text-white text-xs font-medium rounded-md">Votes</button>
                    <button className="px-3 py-1.5 text-gray-400 hover:text-white text-xs font-medium rounded-md transition-colors">Comments</button>
                    <button className="px-3 py-1.5 text-gray-400 hover:text-white text-xs font-medium rounded-md transition-colors">Velocity</button>
                </div>
            </div>

            <div className="h-[400px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#999', marginBottom: '8px' }}
                        />
                        {products.map((p, i) => (
                            <Line
                                key={p.id}
                                type="monotone"
                                dataKey={p.id}
                                name={p.name}
                                stroke={colors[i % colors.length]}
                                strokeWidth={hoveredProduct === p.id ? 4 : 2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                strokeOpacity={hoveredProduct && hoveredProduct !== p.id ? 0.3 : 1}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-3">
                {products.map((p, i) => (
                    <button
                        key={p.id}
                        onMouseEnter={() => setHoveredProduct(p.id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${hoveredProduct === p.id
                                ? 'bg-white/10 border-white/20'
                                : 'bg-[#0F0F0F] border-gray-800 hover:border-gray-700'
                            }`}
                    >
                        <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors[i % colors.length] }}
                        />
                        <span className="text-xs font-medium text-gray-300">{p.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
