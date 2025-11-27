'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users,
    TrendingUp,
    Clock,
    BarChart3,
    Award,
    ArrowRight,
    Twitter
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    getAudienceImpact,
    getSerialMakerSuccess,
    getLaunchTimeHeatmap,
    getTeamSizeImpact,
    type AudienceImpactPoint,
    type SerialMakerData,
    type LaunchTimeData
} from '@/lib/charts-data';

export default function MakersPage() {
    const [loading, setLoading] = useState(true);
    const [audienceData, setAudienceData] = useState<AudienceImpactPoint[]>([]);
    const [serialMakerData, setSerialMakerData] = useState<SerialMakerData[]>([]);
    const [launchTimeData, setLaunchTimeData] = useState<LaunchTimeData[]>([]);
    const [teamSizeData, setTeamSizeData] = useState<any[]>([]);

    useEffect(() => {
        loadMakerData();
    }, []);

    const loadMakerData = async () => {
        setLoading(true);
        try {
            const [audience, serial, launchTime, teamSize] = await Promise.all([
                getAudienceImpact(),
                getSerialMakerSuccess(),
                getLaunchTimeHeatmap(),
                getTeamSizeImpact()
            ]);

            setAudienceData(audience);
            setSerialMakerData(serial);
            setLaunchTimeData(launchTime);
            setTeamSizeData(teamSize);
        } catch (error) {
            console.error('Error loading maker data:', error);
        }
        setLoading(false);
    };

    // Prepare heatmap data
    const prepareHeatmapData = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const hours = Array.from({ length: 24 }, (_, i) => i);

        return days.map(day => {
            const dayData: any = { day };

            hours.forEach(hour => {
                const dataPoint = launchTimeData.find(d => d.day === day && d.hour === hour);
                dayData[`h${hour}`] = dataPoint?.avgUpvotes || 0;
            });

            return dayData;
        });
    };

    const heatmapData = prepareHeatmapData();

    // Find best launch time
    const bestLaunchTime = launchTimeData.length > 0
        ? launchTimeData.reduce((best, current) =>
            current.avgUpvotes > best.avgUpvotes ? current : best
        )
        : null;

    const getHeatColor = (value: number) => {
        if (value === 0) return '#f3f4f6'; // gray-100
        if (value < 200) return '#fef3c7'; // yellow-100
        if (value < 400) return '#fed7aa'; // orange-200
        if (value < 600) return '#fca5a5'; // red-300
        return '#dc2626'; // red-600
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Analyzing maker patterns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-10 h-10 text-purple-600" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Maker & Meta Analysis
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Uncover the <span className="font-semibold text-purple-600">meta patterns</span> that influence
                        success — audience size, launch timing, and maker experience
                    </p>
                </div>

                {/* Key Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Twitter className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-sm font-semibold text-purple-900">Audience Matters</div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {audienceData.length} data points analyzed to show correlation between maker followers and Day 1 upvotes
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Award className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-sm font-semibold text-blue-900">Experience Helps</div>
                        </div>
                        <p className="text-sm text-gray-600">
                            Serial makers show {serialMakerData.length > 1 ? 'improved' : 'varying'} performance over multiple launches
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-orange-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-sm font-semibold text-orange-900">Timing is Key</div>
                        </div>
                        <p className="text-sm text-gray-600">
                            {bestLaunchTime
                                ? `Best time: ${bestLaunchTime.day} at ${bestLaunchTime.hour}:00 UTC`
                                : 'Analyzing launch patterns...'}
                        </p>
                    </div>
                </div>

                {/* Audience Impact Scatter Plot */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Twitter className="w-6 h-6 text-purple-600" />
                            Audience Impact Chart
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            Does pre-existing Twitter audience correlate with Product Hunt success?
                        </p>
                    </div>
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={[...audienceData].sort((a, b) => a.followers - b.followers)} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="followers"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: 'Twitter Followers at Launch', position: 'bottom', offset: 40, style: { fill: '#6b7280' } }}
                                    scale="log"
                                    domain={[1, 'auto']}
                                />
                                <YAxis
                                    dataKey="upvotes"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: 'Product Hunt Upvotes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload[0]) {
                                            const data = payload[0].payload as AudienceImpactPoint;
                                            return (
                                                <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                                                    <div className="font-bold text-gray-900 mb-2">{data.productName}</div>
                                                    <div className="text-sm space-y-1">
                                                        <div>Maker: <span className="font-semibold">{data.makerName}</span></div>
                                                        <div>Followers: <span className="font-semibold">{data.followers.toLocaleString()}</span></div>
                                                        <div>Upvotes: <span className="font-semibold">{data.upvotes}</span></div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="natural"
                                    dataKey="upvotes"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-purple-900">
                                <strong>📊 Insight:</strong> There is a positive correlation between Twitter followers and upvotes,
                                but many products with small audiences still achieve high success. Building in public and community
                                engagement matter more than raw follower count.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Serial Maker Success */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Award className="w-6 h-6 text-blue-600" />
                            First-Time vs. Serial Maker Success
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            Do makers get better with each launch? Average upvotes by launch number
                        </p>
                    </div>
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={serialMakerData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="launchNumber"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: 'Avg Upvotes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload[0]) {
                                            const data = payload[0].payload as SerialMakerData;
                                            return (
                                                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                                    <div className="font-bold text-gray-900">{data.launchNumber} Launch</div>
                                                    <div className="text-sm text-gray-600">Avg Upvotes: <span className="font-semibold text-blue-600">{data.avgUpvotes}</span></div>
                                                    <div className="text-xs text-gray-500 mt-1">{data.count} makers analyzed</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line
                                    type="natural"
                                    dataKey="avgUpvotes"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>

                        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                            {serialMakerData.map((data, index) => (
                                <div key={data.launchNumber} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="text-xs text-gray-600 mb-1">{data.launchNumber} Launch</div>
                                    <div className="text-2xl font-bold text-blue-600">{data.avgUpvotes}</div>
                                    <div className="text-xs text-gray-500 mt-1">{data.count} makers</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team Size Impact */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-green-600" />
                            Team Size Impact
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            Does the number of makers on a product affect its success?
                        </p>
                    </div>
                    <div className="p-6">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={teamSizeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="teamSize"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: 'Number of Makers', position: 'bottom', offset: 0, style: { fill: '#6b7280' } }}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickLine={false}
                                    label={{ value: 'Avg Upvotes', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Line
                                    type="natural"
                                    dataKey="avgUpvotes"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Best Time to Launch Heatmap */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-orange-600" />
                            Best Time to Launch
                        </h2>
                        <p className="text-gray-600 mt-1 text-sm">
                            Heatmap showing average upvotes by day of week and hour (UTC) for top 5 products
                        </p>
                    </div>
                    <div className="p-6">
                        {bestLaunchTime && (
                            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-orange-900">Optimal Launch Window:</div>
                                        <div className="text-sm text-orange-800">
                                            {bestLaunchTime.day} at <strong>{bestLaunchTime.hour}:00 UTC</strong> • Avg {bestLaunchTime.avgUpvotes} upvotes • {bestLaunchTime.launchCount} successful launches
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Simplified Heatmap Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left p-2 font-semibold text-gray-700">Day</th>
                                        {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 3 === 0).map(hour => (
                                            <th key={hour} className="text-center p-2 text-xs text-gray-600">{hour}:00</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {heatmapData.map((dayData, index) => (
                                        <tr key={dayData.day} className="border-b border-gray-100">
                                            <td className="p-2 font-medium text-gray-900">{dayData.day}</td>
                                            {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 3 === 0).map(hour => {
                                                const value = dayData[`h${hour}`] || 0;
                                                return (
                                                    <td
                                                        key={hour}
                                                        className="p-2 text-center"
                                                        style={{ backgroundColor: getHeatColor(value) }}
                                                    >
                                                        <span className="text-xs font-semibold">{value > 0 ? value : ''}</span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fef3c7' }}></div>
                                <span className="text-sm text-gray-600">Low (0-200)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fed7aa' }}></div>
                                <span className="text-sm text-gray-600">Medium (200-400)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fca5a5' }}></div>
                                <span className="text-sm text-gray-600">High (400-600)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
                                <span className="text-sm text-gray-600">Very High (600+)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-8 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Ready to Launch?</h3>
                            <p className="text-purple-100">
                                Use these insights to time your launch perfectly and maximize your success
                            </p>
                        </div>
                        <Link
                            href="/desk"
                            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            Back to Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
