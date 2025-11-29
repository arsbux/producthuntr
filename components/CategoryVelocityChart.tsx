'use client';

import { useState, useRef, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { TrendingUp, MessageSquare, Activity, ChevronDown } from 'lucide-react';

interface CategoryData {
    category: string;
    velocity: number;
    count: number;
}

interface CategoryVelocityChartProps {
    data: CategoryData[];
    history?: any[];
}

export default function CategoryVelocityChart({ data, history }: CategoryVelocityChartProps) {
    const [mode, setMode] = useState<'votes' | 'comments' | 'velocity'>('votes');
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Sort based on current mode (velocity in data is votes, we might need to adjust if we had comments in data)
    // For now, we'll use the passed data for the list, but we should ideally re-sort based on mode if we had that data in 'data' prop.
    // The 'data' prop currently only has 'velocity' (votes) and 'count'. 
    // We'll stick to sorting by velocity (votes) for the list to keep it simple, or we can't sort by comments without more data.
    // Actually, let's just use the history to determine the top categories for the selected mode if possible, 
    // or just stick to votes for the list sorting but show the selected metric in the chart.

    const sortedData = [...data].sort((a, b) => b.velocity - a.velocity).slice(0, 10);
    const colors = ['#FF6154', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

    // Prepare chart data
    const chartData = history?.map((h, i) => {
        const point: any = { time: h.time };
        if (h.categories) {
            Object.entries(h.categories).forEach(([cat, stats]: [string, any]) => {
                if (mode === 'velocity') {
                    // Calculate rate of change (votes per bucket)
                    // For the first point, set velocity to 0 to avoid a huge spike from cumulative total
                    const prev = i > 0 ? history[i - 1].categories[cat]?.votes || 0 : stats.votes;
                    const current = stats.votes || 0;
                    point[cat] = Math.max(0, current - prev);
                } else {
                    point[cat] = stats[mode] || 0;
                }
            });
        }
        return point;
    }) || [];

    const renderModeIcon = (m: string) => {
        switch (m) {
            case 'votes': return <TrendingUp className="w-3 h-3" />;
            case 'comments': return <MessageSquare className="w-3 h-3" />;
            case 'velocity': return <Activity className="w-3 h-3" />;
            default: return null;
        }
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 h-full flex flex-col">
            <div className="flex-none flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 whitespace-nowrap">Top Category Velocity</h3>
                    <p className="text-sm text-gray-500 whitespace-nowrap">Fastest growing niches today</p>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#0F0F0F] border border-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-gray-700 transition-all"
                    >
                        {renderModeIcon(mode)}
                        <span className="capitalize">{mode}</span>
                        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-36 bg-[#0F0F0F] border border-gray-800 rounded-xl shadow-xl z-20 p-1 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                            {['votes', 'comments', 'velocity'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => { setMode(m as any); setShowMenu(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${mode === m
                                        ? 'bg-[#FF6154] text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {renderModeIcon(m)}
                                    <span className="capitalize">{m}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Live Chart */}
            <div className="h-[400px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="time"
                            hide
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 10 }}
                            tickLine={false}
                            axisLine={false}
                            width={30}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#999' }}
                        />
                        {sortedData.map((item, index) => (
                            <Line
                                key={item.category}
                                type="monotone"
                                dataKey={item.category}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedData.map((item, index) => (
                    <div key={item.category} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                                    {item.category}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {item.velocity} votes
                                </span>
                            </div>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden ml-4">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(item.velocity / (sortedData[0]?.velocity || 1)) * 100}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
