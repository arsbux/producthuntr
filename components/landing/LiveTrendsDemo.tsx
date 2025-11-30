'use client';

import { useState, useEffect } from 'react';
import { fetchAggregatedTrends } from '@/app/actions/trends';
import TrendsChart from '@/components/TrendsChart';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function LiveTrendsDemo() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30d');

    useEffect(() => {
        loadData();
    }, [timeframe]);

    async function loadData() {
        setLoading(true);
        try {
            const res = await fetchAggregatedTrends(timeframe);
            setData(res);
        } catch (error) {
            console.error("Failed to load trends data", error);
        } finally {
            setLoading(false);
        }
    }

    const keywords = data?.keywords || [];
    const history = data?.history || [];

    return (
        <div className="w-full bg-[#0F0F12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header / Controls */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#151518]">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <span className="ml-4 text-sm font-mono text-gray-500">/desk/trends</span>
                </div>

                {/* Simple Timeframe Toggle */}
                <div className="flex bg-black/50 rounded-lg p-1 border border-white/5">
                    {['7d', '30d', '3m'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeframe === t ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
                        <div className="grid grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <TrendsChart
                        history={history}
                        items={keywords}
                        type="keywords"
                    />
                )}
            </div>
        </div>
    );
}
