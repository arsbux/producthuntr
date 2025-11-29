'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Snapshot {
    votes_count: number;
    comments_count: number;
    snapshot_time: string;
}

export default function LaunchVelocityChart({ data }: { data: Snapshot[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center bg-[#1a1a1a] rounded-xl border border-gray-800 text-gray-500">
                No historical data available yet.
            </div>
        );
    }

    // Format data for chart
    const chartData = data.map(d => ({
        time: new Date(d.snapshot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        votes: d.votes_count,
        comments: d.comments_count
    }));

    return (
        <div className="h-[300px] w-full bg-[#1a1a1a] rounded-xl border border-gray-800 p-4">
            <h3 className="text-gray-400 text-sm font-medium mb-4">Vote Velocity (24h)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF6154" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#FF6154" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="time"
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="votes"
                        stroke="#FF6154"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVotes)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
