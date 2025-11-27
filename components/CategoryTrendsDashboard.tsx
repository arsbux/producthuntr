'use client';

import { TopicVelocityData } from '@/lib/charts-data';
import Link from 'next/link';
import { Area, AreaChart, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CategoryTrendsDashboardProps {
    data: TopicVelocityData[];
}

export default function CategoryTrendsDashboard({ data }: CategoryTrendsDashboardProps) {
    // Sort data by growth/volume to ensure the "Featured" one is actually significant
    // Assuming data is already sorted by volume/relevance from the API, but let's ensure the first one is the "Top Growing" if possible.
    // For now, we'll trust the order or just take the first one as featured.

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Market Understanding</h1>
                    <p className="text-gray-500">Clear category identification with real-time trend data. See what's rising before the crowd.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
                    {data.map((category, index) => {
                        const isRising = category.trend === 'rising';
                        const isDeclining = category.trend === 'declining';
                        const growthColor = isRising ? 'text-green-500' : isDeclining ? 'text-red-500' : 'text-blue-500';
                        const chartColor = isRising ? '#22c55e' : isDeclining ? '#ef4444' : '#3b82f6';

                        // Calculate growth using 3-month averages
                        const dataPoints = category.timeSeriesData;
                        const len = dataPoints.length;

                        let growthPercent = 0;
                        let isNew = false;

                        if (len >= 6) {
                            const recentAvg = (dataPoints[len - 1].launchCount + dataPoints[len - 2].launchCount + dataPoints[len - 3].launchCount) / 3;
                            const oldAvg = (dataPoints[0].launchCount + dataPoints[1].launchCount + dataPoints[2].launchCount) / 3;

                            if (oldAvg > 0.5) {
                                growthPercent = Math.round(((recentAvg - oldAvg) / oldAvg) * 100);
                                // Cap at 200% for realistic display
                                growthPercent = Math.min(growthPercent, 200);
                            } else if (recentAvg > 0) {
                                growthPercent = 100;
                                isNew = true;
                            }
                        } else {
                            const first = dataPoints[0]?.launchCount || 0;
                            const last = dataPoints[len - 1]?.launchCount || 0;
                            if (first > 0) {
                                growthPercent = Math.round(((last - first) / first) * 100);
                                // Cap at 200% for realistic display
                                growthPercent = Math.min(growthPercent, 200);
                            } else if (last > 0) {
                                growthPercent = 100;
                                isNew = true;
                            }
                        }

                        const growthDisplay = isNew ? 'New' : (growthPercent > 0 ? `+${growthPercent}%` : `${growthPercent}%`);
                        const isFeatured = index === 0;

                        return (
                            <Link
                                href={`/category/${encodeURIComponent(category.topic)}`}
                                key={category.topic}
                                className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group ${isFeatured ? 'md:col-span-2 lg:col-span-2 row-span-2' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className={`font-bold text-gray-900 truncate pr-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`} title={category.topic}>{category.topic}</h3>
                                    <div className={`flex flex-col items-end ${growthColor}`}>
                                        <span className={`${isFeatured ? 'text-3xl' : 'text-xl'} font-bold`}>{growthDisplay}</span>
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Growth</span>
                                    </div>
                                </div>

                                <div className={`${isFeatured ? 'h-48' : 'h-32'} mb-4`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={category.timeSeriesData}>
                                            <Line
                                                type="monotone"
                                                dataKey="launchCount"
                                                stroke={chartColor}
                                                strokeWidth={3}
                                                dot={false}
                                                style={{ filter: `drop-shadow(0 0 6px ${chartColor})` }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                                    <span>{category.timeSeriesData[0]?.month}</span>
                                    <span>{category.timeSeriesData[category.timeSeriesData.length - 1]?.month}</span>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <p className="text-sm text-gray-500 line-clamp-2">
                                        {category.topic} tools seeing {category.trend} activity.
                                    </p>
                                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
