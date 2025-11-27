'use client';

import { CategoryDetails } from '@/lib/charts-data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CategoryProfile({ data }: { data: CategoryDetails }) {
    // Prepare data for Keyword Trends chart
    const keywordChartData = data.timeSeriesData.map(t => {
        const point: any = { month: t.month };
        data.keywordTrends.forEach(k => {
            const kPoint = k.data.find(d => d.month === t.month);
            point[k.keyword] = kPoint ? kPoint.count : 0;
        });
        return point;
    });

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{data.topic}</h1>
                    <p className="text-gray-500">Detailed analysis and trends.</p>
                </div>

                {/* Growth Trend */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold mb-4 text-gray-900">Growth Trend</h2>
                    <p className="text-sm text-gray-500 mb-6">Launch volume, upvotes, and comments over the last 12 months</p>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line yAxisId="left" type="monotone" dataKey="launchCount" name="Launches" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="avgUpvotes" name="Avg Upvotes" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="avgComments" name="Avg Comments" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Keywords */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Top Keywords</h2>
                        <p className="text-sm text-gray-500 mb-6">Most frequently used terms in this category</p>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.topKeywords.slice(0, 15)} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="keyword" type="category" width={100} stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Frequency" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Keyword Trends */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Keyword Trends</h2>
                        <p className="text-sm text-gray-500 mb-6">Usage frequency of top keywords over time</p>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={keywordChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    {data.keywordTrends.map((k, i) => (
                                        <Line
                                            key={k.keyword}
                                            type="monotone"
                                            dataKey={k.keyword}
                                            name={k.keyword}
                                            stroke={`hsl(${i * 60 + 200}, 70%, 50%)`}
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
