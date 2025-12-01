'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';

interface TrendsChartProps {
    history: any[];
    items: any[]; // Top items from the table
    type: 'keywords' | 'categories';
}

const COLORS = ['#FF6154', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'];

export default function TrendsChart({ history, items, type }: TrendsChartProps) {
    const [metric, setMetric] = useState<'launches' | 'votes' | 'comments'>('votes');
    // Initialize with top 5 items
    const [visibleItems, setVisibleItems] = useState<Set<string>>(() => new Set(items.slice(0, 5).map(i => i.name)));

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        return history.map(day => {
            const point: any = { date: day.date };
            const group = type === 'keywords' ? day.keywords : day.categories;

            // Ensure we have data for all visible items, default to 0
            visibleItems.forEach(item => {
                // Check if key exists in group (case insensitive matching might be needed if keys vary, but we normalized to lowercase in lib/trends.ts for keywords)
                // However, categories are Title Case.
                // In lib/trends.ts:
                // Keywords: k = t.toLowerCase()
                // Categories: cat = guessCategory(l) (Title Case)

                // So for keywords we need to lookup lowercase name.
                // For categories we lookup name as is.

                const key = type === 'keywords' ? item.toLowerCase() : item;
                point[item] = group[key]?.[metric] || 0;
            });
            return point;
        });
    }, [history, visibleItems, metric, type]);

    const toggleItem = (name: string) => {
        const next = new Set(visibleItems);
        if (next.has(name)) {
            next.delete(name);
        } else {
            if (next.size >= 10) return; // Limit to 10
            next.add(name);
        }
        setVisibleItems(next);
    };

    // Get color for an item based on its index in the visible set (to keep colors stable, we might want a map, but index is fine for now)
    const getItemColor = (name: string) => {
        const index = Array.from(visibleItems).indexOf(name);
        return index >= 0 ? COLORS[index % COLORS.length] : '#444';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Growth Trends</h3>
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                    {['launches', 'votes', 'comments'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMetric(m as any)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${metric === m ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(val) => {
                                const d = new Date(val);
                                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
                            minTickGap={30}
                        />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#999', marginBottom: '8px' }}
                            labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        />
                        <Legend />
                        {Array.from(visibleItems).map((item) => (
                            <Line
                                key={item}
                                type="monotone"
                                dataKey={item}
                                stroke={getItemColor(item)}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                connectNulls
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Leaderboard / Legend Toggles */}
            <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                    Top {type === 'keywords' ? 'Keywords' : 'Categories'} (Click to toggle)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {items.slice(0, 20).map((item, index) => (
                        <button
                            key={item.name}
                            onClick={() => toggleItem(item.name)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${visibleItems.has(item.name)
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getItemColor(item.name) }}
                                />
                                <span className="truncate capitalize">
                                    <span className="text-gray-500 mr-1.5 font-mono">#{index + 1}</span>
                                    {item.name}
                                </span>
                            </div>
                            {visibleItems.has(item.name) ? <Eye className="w-3 h-3 text-gray-400" /> : <EyeOff className="w-3 h-3 text-gray-600" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
