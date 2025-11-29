'use client';

import { useState, useRef, useEffect } from 'react';
import { TrendingUp, MessageSquare, Activity, ChevronDown } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface KeywordData {
    keyword: string;
    velocity: number;
    volume: number;
}

interface KeywordVelocityChartProps {
    data: KeywordData[];
    history?: any[];
}

export default function KeywordVelocityChart({ data, history }: KeywordVelocityChartProps) {
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

    const sortedData = [...data].sort((a, b) => b.velocity - a.velocity).slice(0, 5);
    const maxVelocity = Math.max(...sortedData.map(d => d.velocity));

    // Prepare chart data
    const chartData = history?.map((h, i) => {
        const point: any = { time: h.time };
        if (h.keywords) {
            Object.entries(h.keywords).forEach(([key, stats]: [string, any]) => {
                if (mode === 'velocity') {
                    // Calculate rate of change (votes per bucket)
                    // For the first point, set velocity to 0 to avoid a huge spike from cumulative total
                    const prev = i > 0 ? history[i - 1].keywords[key]?.votes || 0 : stats.votes;
                    const current = stats.votes || 0;
                    point[key] = Math.max(0, current - prev);
                } else {
                    point[key] = stats[mode] || 0;
                }
            });
        }
        return point;
    }) || [];

    const colors = ['#FF6154', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

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
                    <h3 className="text-lg font-bold text-white mb-1 whitespace-nowrap">Trending Keywords</h3>
                    <p className="text-sm text-gray-500 whitespace-nowrap">High-velocity tags of the day</p>
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
            <div className="flex-1 min-h-[200px] w-full mb-6">
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
                                key={item.keyword}
                                type="monotone"
                                dataKey={item.keyword}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="flex-none space-y-4">
                {sortedData.map((item, index) => (
                    <div key={item.keyword} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                                <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                                    #{item.keyword}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    +{item.velocity}
                                </span>
                                <span className="text-xs text-gray-600">{item.volume} vol</span>
                            </div>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden ml-4">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(item.velocity / maxVelocity) * 100}%`,
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
