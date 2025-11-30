'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface DataPoint {
    time: string;
    total_votes: number;
}

interface CategoryLiveVelocityChartProps {
    data: DataPoint[];
    title?: string;
}

export default function CategoryLiveVelocityChart({ data, title = "Vote Velocity (24h)" }: CategoryLiveVelocityChartProps) {
    // Format time for display
    const formattedData = data.map(d => ({
        ...d,
        displayTime: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-500">Combined votes of all products launching today</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF6154" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FF6154" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="displayTime"
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
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            itemStyle={{ color: '#FF6154' }}
                            labelStyle={{ color: '#999', marginBottom: '8px' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total_votes"
                            stroke="#FF6154"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVotes)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
