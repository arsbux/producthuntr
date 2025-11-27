'use client';

import { Line, LineChart, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface TrendCardProps {
    title: string;
    subtitle: string;
    metric: string;
    metricLabel: string;
    chartData: { value: number }[];
    status: string;
    delay?: number;
}

export default function TrendCard({ title, subtitle, metric, metricLabel, chartData, status, delay = 0 }: TrendCardProps) {
    const isExploding = status === 'Exploding';
    const isRising = status === 'Rising';

    const color = isExploding ? '#3b82f6' : isRising ? '#10b981' : '#737373';
    const bgGradient = isExploding ? 'from-blue-500/10' : isRising ? 'from-emerald-500/10' : 'from-neutral-500/10';

    return (
        <div
            className="bg-[#161b22] rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group relative overflow-hidden"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Top Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isExploding ? 'from-blue-500 to-indigo-500' : isRising ? 'from-emerald-500 to-teal-500' : 'from-neutral-700 to-neutral-600'} opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium">{subtitle}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isExploding ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        isRising ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}>
                    {status}
                </div>
            </div>

            <div className="h-24 w-full -ml-2 mb-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#gradient-${title})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex items-end justify-between pt-4 border-t border-white/5">
                <div>
                    <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-0.5">
                        {metricLabel}
                    </div>
                    <div className={`text-xl font-bold tabular-nums tracking-tight ${isExploding ? 'text-blue-400' :
                            isRising ? 'text-emerald-400' :
                                'text-neutral-300'
                        }`}>
                        {metric}
                    </div>
                </div>
                <div className="text-xs text-neutral-500 font-medium">
                    Last 12 mo
                </div>
            </div>
        </div>
    );
}
