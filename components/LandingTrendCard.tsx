'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Lock, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface LandingTrendCardProps {
    title: string;
    subtitle: string;
    metric: string;
    metricLabel: string;
    chartData: { value: number }[];
    status: string;
    delay?: number;
    isLocked?: boolean;
}

const CHART_COLOR = '#ea580c'; // Orange-600

export default function LandingTrendCard({
    title,
    subtitle,
    metric,
    metricLabel,
    chartData,
    status,
    delay = 0,
    isLocked = false
}: LandingTrendCardProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <Link
            href="/desk"
            className={`
        block relative group rounded-3xl p-6 border transition-all duration-500
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isLocked
                    ? 'bg-neutral-900/50 border-neutral-800 blur-[2px] hover:blur-0 hover:bg-neutral-900 hover:border-orange-500/30'
                    : 'bg-neutral-900 border-neutral-800 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-900/20'
                }
      `}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-white tracking-tight">{title}</h3>
                        {status === 'Exploding' && (
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-neutral-400 leading-snug">{subtitle}</p>
                </div>
                <div className="text-right">
                    <div className="font-bold text-xl text-orange-500">{metric}</div>
                    <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{metricLabel}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-32 w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.2} />
                                <stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={CHART_COLOR}
                            strokeWidth={3}
                            fill={`url(#gradient-${title})`}
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Footer / Actions */}
            <div className="mt-6 flex items-center justify-between">
                <div className={`
            px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
            ${status === 'Exploding' ? 'bg-orange-500/10 text-orange-500' : 'bg-neutral-800 text-neutral-400'}
        `}>
                    {status}
                </div>

                {isLocked ? (
                    <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium">
                        <Lock className="w-3 h-3" /> Pro Only
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:translate-x-1 transition-transform cursor-pointer">
                        View Analysis <ArrowRight className="w-3 h-3" />
                    </div>
                )}
            </div>

            {/* Locked Overlay */}
            {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-neutral-950/60 backdrop-blur-sm rounded-3xl">
                    <button className="px-5 py-2 bg-orange-600 text-white text-sm font-bold rounded-full hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 transform hover:scale-105">
                        Unlock Trend
                    </button>
                </div>
            )}
        </Link>
    );
}
