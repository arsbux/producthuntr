'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, PieChart, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COLORS = ['#ea580c', '#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b'];

export default function TrendsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLaunches: 0,
        avgVotes: 0,
        avgComments: 0,
        topPerformer: '',
    });
    const [nicheData, setNicheData] = useState<any[]>([]);
    const [problemData, setProblemData] = useState<any[]>([]);
    const [icpData, setIcpData] = useState<any[]>([]);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [pricingData, setPricingData] = useState<any[]>([]);

    useEffect(() => {
        fetchTrendsData();
    }, []);

    async function fetchTrendsData() {
        try {
            const { data: launches } = await supabase
                .from('ph_launches')
                .select('*')
                .not('ai_analysis', 'is', null)
                .order('votes_count', { ascending: false });

            if (!launches || launches.length === 0) {
                setLoading(false);
                return;
            }

            // Calculate stats
            const totalVotes = launches.reduce((sum, l) => sum + (l.votes_count || 0), 0);
            const totalComments = launches.reduce((sum, l) => sum + (l.comments_count || 0), 0);
            const topLaunch = launches[0];

            setStats({
                totalLaunches: launches.length,
                avgVotes: Math.round(totalVotes / launches.length),
                avgComments: Math.round(totalComments / launches.length),
                topPerformer: topLaunch?.name || 'N/A',
            });

            // Top Niches
            const nicheCount = new Map<string, { count: number; votes: number; comments: number }>();
            launches.forEach(l => {
                const niche = l.ai_analysis?.niche || 'Unknown';
                const existing = nicheCount.get(niche) || { count: 0, votes: 0, comments: 0 };
                existing.count++;
                existing.votes += l.votes_count || 0;
                existing.comments += l.comments_count || 0;
                nicheCount.set(niche, existing);
            });

            const sortedNiches = Array.from(nicheCount.entries())
                .map(([name, data]) => ({
                    name: name, // Keep full name, no truncation
                    fullName: name, // Store full name for tooltips
                    launches: data.count,
                    avgVotes: Math.round(data.votes / data.count),
                    engagement: Math.round((data.votes + data.comments * 2) / data.count),
                }))
                .sort((a, b) => b.launches - a.launches)
                .slice(0, 10);
            setNicheData(sortedNiches);

            // Top Problems
            const problemCount = new Map<string, { count: number; votes: number }>();
            launches.forEach(l => {
                const problem = l.ai_analysis?.problem || 'Unknown';
                const existing = problemCount.get(problem) || { count: 0, votes: 0 };
                existing.count++;
                existing.votes += l.votes_count || 0;
                problemCount.set(problem, existing);
            });

            const sortedProblems = Array.from(problemCount.entries())
                .map(([name, data]) => ({
                    name: name, // Keep full name
                    launches: data.count,
                    avgVotes: Math.round(data.votes / data.count),
                }))
                .sort((a, b) => b.launches - a.launches)
                .slice(0, 8);
            setProblemData(sortedProblems);

            // Top ICPs
            const icpCount = new Map<string, { count: number; votes: number }>();
            launches.forEach(l => {
                const icp = l.ai_analysis?.icp || 'Unknown';
                const existing = icpCount.get(icp) || { count: 0, votes: 0 };
                existing.count++;
                existing.votes += l.votes_count || 0;
                icpCount.set(icp, existing);
            });

            const sortedICPs = Array.from(icpCount.entries())
                .map(([name, data]) => ({
                    name: name, // Keep full name
                    count: data.count,
                    avgVotes: Math.round(data.votes / data.count),
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 8);
            setIcpData(sortedICPs);

            // Timeline data (launches per day over last 30 days)
            const dayMap = new Map<string, number>();
            launches.forEach(l => {
                const date = new Date(l.launched_at);
                const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
            });

            const timelineArray = Array.from(dayMap.entries())
                .map(([date, count]) => ({ date, launches: count }))
                .slice(-30);
            setTimelineData(timelineArray);

            // Pricing Model Distribution - Group similar models
            const pricingCount = new Map<string, number>();
            launches.forEach(l => {
                let pricing = l.ai_analysis?.pricing_model || 'Unknown';

                // Normalize and group pricing models
                const pricingLower = pricing.toLowerCase();
                if (pricingLower.includes('subscription')) {
                    pricing = 'Subscription';
                } else if (pricingLower.includes('freemium')) {
                    pricing = 'Freemium';
                } else if (pricingLower.includes('free') && !pricingLower.includes('freemium')) {
                    pricing = 'Free';
                } else if (pricingLower.includes('one-time')) {
                    pricing = 'One-time Purchase';
                } else if (pricingLower.includes('pay-per') || pricingLower.includes('pay per')) {
                    pricing = 'Pay-per-use';
                } else if (pricingLower.includes('open-source') || pricingLower.includes('open source')) {
                    pricing = 'Open Source';
                } else if (pricingLower.includes('commission')) {
                    pricing = 'Commission-based';
                } else if (pricingLower === 'unknown') {
                    pricing = 'Not Specified';
                }

                pricingCount.set(pricing, (pricingCount.get(pricing) || 0) + 1);
            });

            const pricingArray = Array.from(pricingCount.entries())
                .map(([name, value]) => ({ name, value, percentage: Math.round((value / launches.length) * 100) }))
                .sort((a, b) => b.value - a.value);
            setPricingData(pricingArray);

        } catch (error) {
            console.error('Error fetching trends:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading trends data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-neutral-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Market Trends</h1>
                <p className="text-neutral-600">
                    Real-time analytics from {stats.totalLaunches} analyzed Product Hunt launches
                </p>
            </div>

            {/* Main Chart - Niche Activity */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-8 shadow-sm hover:shadow-lg transition-all">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Niche Launch Activity</h3>
                    <p className="text-sm text-neutral-600">Click on any niche to see all products ranked by performance</p>
                </div>
                <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                        data={nicheData}
                        margin={{ bottom: 120, left: 20, right: 20, top: 20 }}
                        onClick={(data) => {
                            if (data && data.activeLabel) {
                                window.location.href = `/desk/trends/${encodeURIComponent(data.activeLabel)}`;
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis
                            dataKey="name"
                            stroke="#737373"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={120}
                        />
                        <YAxis stroke="#737373" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e5e5',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            cursor={{ fill: 'rgba(234, 88, 12, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                        <Bar
                            dataKey="launches"
                            fill="#ea580c"
                            name="Launches"
                            radius={[8, 8, 0, 0]}
                            cursor="pointer"
                        />
                        <Bar
                            dataKey="avgVotes"
                            fill="#2563eb"
                            name="Avg Votes"
                            radius={[8, 8, 0, 0]}
                            cursor="pointer"
                        />
                    </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center text-sm text-neutral-500">
                    💡 Click on any bar to explore products in that niche
                </div>
            </div>

            {/* Trending Problems - Emphasized */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-8 mb-8 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-neutral-900">Trending Problems Being Solved</h3>
                        <p className="text-sm text-neutral-600">What pain points are getting the most attention</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {problemData.map((problem, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-neutral-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm">
                                        #{index + 1}
                                    </div>
                                    <div className="font-semibold text-neutral-900 text-sm leading-tight flex-1">
                                        {problem.name}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <span className="text-neutral-600">{problem.launches} launches</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                    <span className="text-neutral-600">{problem.avgVotes} avg votes</span>
                                </div>
                            </div>
                            <div className="mt-3 bg-neutral-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(problem.avgVotes / 500) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Secondary Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Target ICPs */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">Who's Being Targeted</h3>
                            <p className="text-xs text-neutral-600">Most common ideal customer profiles</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {icpData.map((icp, index) => (
                            <div key={index} className="border-b border-neutral-100 pb-3 last:border-0 hover:bg-neutral-50 p-2 rounded-lg transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-neutral-400">#{index + 1}</span>
                                        <span className="font-medium text-neutral-900 text-sm">{icp.name}</span>
                                    </div>
                                    <div className="text-xs text-neutral-500 font-medium">{icp.count} products</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${(icp.count / icpData[0].count) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs font-semibold text-neutral-700">{icp.avgVotes}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Distribution */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                            <PieChart className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-neutral-900">Pricing Models</h3>
                            <p className="text-xs text-neutral-600">How products are monetizing</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {pricingData.map((item, index) => (
                            <div key={index} className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-sm"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        ></div>
                                        <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-neutral-700">{item.value}</span>
                                        <span className="text-xs text-neutral-500">({item.percentage}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="h-2.5 rounded-full transition-all duration-500 group-hover:opacity-80"
                                        style={{
                                            width: `${item.percentage}%`,
                                            backgroundColor: COLORS[index % COLORS.length]
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
