'use client';

import { useState, useEffect } from 'react';
import { Loader2, Terminal, Calendar, Play, CheckCircle, AlertCircle, List, BarChart3, Globe, Smartphone, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';

interface ProcessedItem {
    name: string;
    votes: number;
    niche: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'processing' | 'analytics'>('processing');

    // Analytics State
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [timeframe, setTimeframe] = useState('24h');

    // New state for 2-step process
    const [checkMode, setCheckMode] = useState(false);
    const [availableCount, setAvailableCount] = useState<number | null>(null);
    const [limit, setLimit] = useState<number>(10);
    const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);

    useEffect(() => {
        if (isAuthenticated && activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [isAuthenticated, activeTab, timeframe]);

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
            const data = await res.json();
            if (res.ok) {
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    // ...

    {/* Modern Traffic Timeline */ }
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 h-[450px] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                Traffic Overview
            </h3>
            <div className="flex items-center gap-2">
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    {['24h', '7d', '30d', '90d'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeframe === tf
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
                <span className="flex items-center gap-1.5 text-gray-400 text-xs ml-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                </span>
            </div>
        </div>

        {loadingAnalytics ? (
            <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        ) : (
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                if (timeframe === '24h') {
                                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                }
                                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                            }}
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-90">
                                            <p className="text-gray-400 text-xs mb-2">
                                                {label ? new Date(label).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </p>
                                            <p className="text-emerald-400 font-bold text-xl flex items-center gap-2">
                                                {payload[0].value}
                                                <span className="text-xs font-normal text-gray-500">Visitors</span>
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorVisits)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )}
    </div>

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'producthuntr') {
            setIsAuthenticated(true);
        } else {
            alert('Incorrect password');
        }
    };

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    const checkAvailability = async () => {
        setIsLoading(true);
        setCheckMode(true);
        setAvailableCount(null);
        addLog(`Checking availability for ${selectedDate}...`);

        try {
            const res = await fetch('/api/admin/process-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate, password: 'producthuntr', action: 'check' }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to check');

            setAvailableCount(data.count);
            setLimit(data.count); // Default to max
            addLog(`Found ${data.count} launches available for ${selectedDate}`);
        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
            setCheckMode(false);
        } finally {
            setIsLoading(false);
        }
    };

    const processDate = async (dateStr: string, limitVal?: number) => {
        setIsLoading(true);
        addLog(`Starting processing for ${dateStr} (Limit: ${limitVal || 'All'})...`);

        try {
            const res = await fetch('/api/admin/process-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    password: 'producthuntr',
                    action: 'process',
                    limit: limitVal
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to process');
            }

            addLog(`✅ Completed ${dateStr}: ${data.stats.processed} processed, ${data.stats.skipped} skipped, ${data.stats.errors} errors`);

            if (data.stats.processedItems) {
                setProcessedItems(prev => [...data.stats.processedItems, ...prev]);
            }

            // Add detailed logs from server if available
            if (data.stats.logs && data.stats.logs.length > 0) {
                data.stats.logs.forEach((log: string) => addLog(`  > ${log}`));
            }

            // Reset check mode
            setCheckMode(false);
            setAvailableCount(null);

        } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessRecent = async () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await processDate(today.toISOString().split('T')[0]);
        await processDate(yesterday.toISOString().split('T')[0]);
    };

    const handleProcessSelected = () => {
        checkAvailability();
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-hunted-dark text-gray-900 dark:text-hunted-text">
                <form onSubmit={handleLogin} className="bg-white dark:bg-hunted-card p-8 rounded-lg shadow-xl w-96 border border-gray-200 dark:border-hunted-border">
                    <h1 className="text-2xl font-bold mb-6 text-center text-emerald-600 dark:text-emerald-400">Admin Access</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full bg-white dark:bg-hunted-dark border border-gray-200 dark:border-hunted-border rounded px-4 py-2 mb-4 focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-hunted-text"
                    />
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-hunted-dark text-gray-900 dark:text-hunted-text p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-hunted-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Terminal className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-bold">ProductHuntr Admin</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 dark:bg-hunted-card rounded-lg p-1 border border-gray-200 dark:border-hunted-border">
                            <button
                                onClick={() => setActiveTab('processing')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'processing' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-hunted-text shadow-sm' : 'text-gray-500 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text'}`}
                            >
                                Processing
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-hunted-text shadow-sm' : 'text-gray-500 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text'}`}
                            >
                                Analytics
                            </button>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-hunted-muted">
                            Status: <span className="text-emerald-600 dark:text-emerald-400">Online</span>
                        </div>
                    </div>
                </header>

                {activeTab === 'processing' ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Quick Actions Card */}
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-lg">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-hunted-text">
                                    <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                    Quick Actions
                                </h2>
                                <p className="text-gray-500 dark:text-hunted-muted text-sm mb-6">
                                    Trigger processing for the most recent launches immediately.
                                </p>
                                <button
                                    onClick={handleProcessRecent}
                                    disabled={isLoading || checkMode}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
                                >
                                    {isLoading && !checkMode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                    Process Today & Yesterday
                                </button>
                            </div>

                            {/* Custom Date Card */}
                            <div className="bg-white dark:bg-hunted-card rounded-xl p-6 border border-gray-200 dark:border-hunted-border shadow-lg lg:col-span-2">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-hunted-text">
                                    <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                                    Custom Date Processing
                                </h2>

                                {!checkMode ? (
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-500 dark:text-hunted-muted mb-1">Select Date</label>
                                            <input
                                                type="date"
                                                value={selectedDate}
                                                onChange={(e) => setSelectedDate(e.target.value)}
                                                className="w-full bg-white dark:bg-hunted-dark border border-gray-200 dark:border-hunted-border rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 text-gray-900 dark:text-hunted-text"
                                            />
                                        </div>
                                        <button
                                            onClick={handleProcessSelected}
                                            disabled={isLoading}
                                            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-all h-[42px]"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Availability'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-gray-50 dark:bg-hunted-dark p-4 rounded-lg border border-gray-200 dark:border-hunted-border flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-gray-500 dark:text-hunted-muted">Found on {selectedDate}</div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-hunted-text">{availableCount} Launches</div>
                                            </div>
                                            <button
                                                onClick={() => setCheckMode(false)}
                                                className="text-xs text-gray-500 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 dark:text-hunted-muted mb-1">How many to process? (Top voted first)</label>
                                                <input
                                                    type="number"
                                                    value={limit}
                                                    onChange={(e) => setLimit(Number(e.target.value))}
                                                    max={availableCount || 100}
                                                    min={1}
                                                    className="w-full bg-white dark:bg-hunted-dark border border-gray-200 dark:border-hunted-border rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 text-gray-900 dark:text-hunted-text"
                                                />
                                            </div>
                                            <button
                                                onClick={() => processDate(selectedDate, limit)}
                                                disabled={isLoading}
                                                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-all h-[42px] flex items-center gap-2"
                                            >
                                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                                                Start Processing
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Console Output */}
                            <div className="bg-black dark:bg-black rounded-xl border border-gray-200 dark:border-hunted-border shadow-lg overflow-hidden flex flex-col h-[500px]">
                                <div className="bg-gray-100 dark:bg-hunted-card px-4 py-2 border-b border-gray-200 dark:border-hunted-border flex items-center justify-between shrink-0">
                                    <span className="text-xs font-mono text-gray-500 dark:text-hunted-muted">Console Output</span>
                                    <button
                                        onClick={() => setLogs([])}
                                        className="text-xs text-gray-500 hover:text-white transition-colors"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="p-4 overflow-y-auto font-mono text-sm space-y-2 flex-1">
                                    {logs.length === 0 ? (
                                        <div className="text-gray-600 italic">Ready to process...</div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className={`break-words ${log.includes('❌') ? 'text-red-400' :
                                                log.includes('✅') ? 'text-emerald-400' :
                                                    'text-gray-300'
                                                }`}>
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Processed Items Table */}
                            <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border shadow-lg overflow-hidden flex flex-col h-[500px]">
                                <div className="bg-gray-50 dark:bg-hunted-card px-4 py-2 border-b border-gray-200 dark:border-hunted-border flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <List className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-hunted-text">Processed Items</span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-hunted-muted">{processedItems.length} items</span>
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {processedItems.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 dark:text-hunted-muted text-sm">
                                            No items processed yet in this session.
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 dark:text-hunted-muted uppercase bg-gray-50 dark:bg-hunted-dark sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Product</th>
                                                    <th className="px-4 py-3">Votes</th>
                                                    <th className="px-4 py-3">Niche</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-hunted-border">
                                                {processedItems.map((item, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-hunted-text">{item.name}</td>
                                                        <td className="px-4 py-3 text-gray-500 dark:text-hunted-muted">{item.votes}</td>
                                                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">{item.niche}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-hunted-muted">Total Visits</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-hunted-text">
                                    {loadingAnalytics ? <Loader2 className="w-6 h-6 animate-spin" /> : analyticsData?.totalVisits || 0}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-hunted-muted">Avg Duration</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-hunted-text">
                                    {loadingAnalytics ? <Loader2 className="w-6 h-6 animate-spin" /> : `${analyticsData?.avgDuration || 0}s`}
                                </div>
                            </div>
                        </div>

                        {/* Modern Traffic Timeline */}
                        <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border h-[450px] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-hunted-text">
                                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    Traffic Overview
                                </h3>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-hunted-muted">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Data
                                    </span>
                                </div>
                            </div>

                            {loadingAnalytics ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                </div>
                            ) : (
                                <div className="h-[320px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analyticsData?.timeline || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#6B7280"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white dark:bg-hunted-card border border-gray-200 dark:border-hunted-border p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-90">
                                                                <p className="text-gray-500 dark:text-hunted-muted text-xs mb-2">
                                                                    {label ? new Date(label).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </p>
                                                                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl flex items-center gap-2">
                                                                    {payload[0].value}
                                                                    <span className="text-xs font-normal text-gray-500 dark:text-hunted-muted">Visitors</span>
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#10B981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorVisits)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Pages */}
                            <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border h-[400px]">
                                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-hunted-text">Top Pages</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analyticsData?.pages || []} layout="vertical" margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                        <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                                        <YAxis dataKey="name" type="category" width={100} stroke="#9CA3AF" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F0F0F',
                                                border: '1px solid #27272a',
                                                borderRadius: '8px',
                                                color: '#E4E4E7'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Devices & Countries */}
                            <div className="grid grid-rows-2 gap-6">
                                <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-hunted-text">
                                        <Smartphone className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                                        Device Types
                                    </h3>
                                    <div className="h-[150px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={analyticsData?.devices || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={60}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {(analyticsData?.devices || []).map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#0F0F0F',
                                                        border: '1px solid #27272a',
                                                        borderRadius: '8px',
                                                        color: '#E4E4E7'
                                                    }}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-hunted-card p-6 rounded-xl border border-gray-200 dark:border-hunted-border">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-hunted-text">
                                        <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                                        Top Locations
                                    </h3>
                                    <div className="space-y-3 overflow-y-auto max-h-[150px] pr-2">
                                        {analyticsData?.countries?.map((country: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-300">{country.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500"
                                                            style={{ width: `${(country.value / (analyticsData.totalVisits || 1)) * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-500 dark:text-gray-400 w-8 text-right">{country.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
