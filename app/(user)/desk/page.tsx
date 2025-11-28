'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Target,
  TrendingUp,
  AlertCircle,
  Zap,
  Box,
  MessageCircle,
  ArrowRight,
  Layers,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Legend,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import {
  getTopCategories,
  getMarketGapMatrix,
  type MarketGapMatrix,
  type YesterdayData
} from '@/lib/charts-data';

const style = {
  top: '50%',
  right: 0,
  transform: 'translate(0, -50%)',
  lineHeight: '24px',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-hunted-card border border-gray-200 dark:border-hunted-border p-2 rounded shadow-sm text-xs">
        <p className="font-bold text-gray-900 dark:text-hunted-text">{payload[0].name}</p>
        <p className="text-gray-600 dark:text-hunted-muted">{payload[0].value} launches</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingGaps, setLoadingGaps] = useState(true);
  const [loadingToday, setLoadingToday] = useState(true);

  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [marketGaps, setMarketGaps] = useState<MarketGapMatrix[]>([]);
  const [todayData, setTodayData] = useState<YesterdayData>({
    chartData: [],
    topLaunches: [],
    metrics: { totalLaunches: 0, aiPercentage: 0, avgVotes: 0, topCategory: 'N/A' }
  });

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const [categories, gapData] = await Promise.all([
          getTopCategories('launches', 0),
          getMarketGapMatrix()
        ]);
        setTopCategories(categories.sort((a, b) => b.launches - a.launches));
        setMarketGaps(gapData);
      } catch (error) {
        console.error('Error loading static data:', error);
      } finally {
        setLoadingCategories(false);
        setLoadingGaps(false);
      }
    };

    const loadLiveData = async () => {
      // Only set loading true on initial load or if we want to show a spinner during refresh
      // For auto-refresh, we might want to keep showing old data while fetching new
      // But for now, let's keep it simple and show loading state if it's the first load
      // or we can just manage a separate 'isRefreshing' state if needed.
      // For this request, let's just use loadingToday.
      if (todayData.topLaunches.length === 0) setLoadingToday(true);

      try {
        const response = await fetch('/api/today-launches');
        if (response.ok) {
          const data = await response.json();
          if (data && data.metrics) {
            setTodayData(data);
          } else {
            console.error('Invalid data format received:', data);
          }
        } else {
          console.error('Failed to fetch today launches:', response.status);
        }
      } catch (error) {
        console.error('Error loading live data:', error);
      } finally {
        setLoadingToday(false);
      }
    };

    loadStaticData();
    loadLiveData();

    const interval = setInterval(loadLiveData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'blue-ocean': return '#10b981'; // Green
      case 'red-ocean': return '#ef4444'; // Red
      case 'emerging': return '#f59e0b'; // Yellow
      case 'niche': return '#9ca3af'; // Gray
      default: return '#6b7280';
    }
  };

  const quadrants = {
    'blue-ocean': marketGaps.filter(m => m.quadrant === 'blue-ocean'),
    'red-ocean': marketGaps.filter(m => m.quadrant === 'red-ocean'),
    'emerging': marketGaps.filter(m => m.quadrant === 'emerging'),
    'niche': marketGaps.filter(m => m.quadrant === 'niche'),
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-hunted-dark">
      {/* LEFT SIDEBAR - Categories List */}
      <aside className="w-full lg:w-96 bg-white dark:bg-hunted-card border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-hunted-border flex-shrink-0 h-auto lg:h-[calc(100vh-64px)] overflow-y-auto lg:sticky lg:top-16">
        <div className="p-4 sticky top-0 bg-white dark:bg-hunted-card z-10 border-b border-gray-100 dark:border-hunted-border">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-hunted-text">All Categories</h2>
            <span className="text-xs text-gray-500 dark:text-hunted-muted font-semibold bg-gray-100 dark:bg-hunted-border px-2.5 py-1 rounded-full">
              {topCategories.length}
            </span>
          </div>
        </div>

        <div className="p-2 space-y-2">
          {loadingCategories ? (
            <div className="space-y-2 p-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-hunted-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            topCategories.map((category, index) => {
              // Generate a unique subtle gradient for each card based on index
              const gradients = [
                'bg-gradient-to-r from-gray-100 to-gray-50', // 1. Silver/Gray
                'bg-gradient-to-r from-blue-50 to-indigo-50', // 2. Blueish
                'bg-gradient-to-r from-cyan-50 to-blue-50', // 3. Cyanish
                'bg-gradient-to-r from-red-50 to-orange-50', // 4. Reddish
                'bg-gradient-to-r from-gray-100 to-slate-50', // 5. Gray
                'bg-gradient-to-r from-green-50 to-emerald-50', // 6. Greenish
                'bg-gradient-to-r from-purple-50 to-fuchsia-50', // 7. Purple
                'bg-gradient-to-r from-orange-50 to-amber-50', // 8. Orange
                'bg-gradient-to-r from-pink-50 to-rose-50', // 9. Pink
                'bg-gradient-to-r from-blue-50 to-cyan-50', // 10. Blue
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <Link
                  key={category.category}
                  href={`/desk/niche/${encodeURIComponent(category.category)}`}
                  className={`${gradient} dark:from-hunted-card dark:to-hunted-card dark:border-hunted-border p-3 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`
                        w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm
                        ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-white text-gray-500'}
                      `}>
                        {index + 1}
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-bold text-gray-900 dark:text-hunted-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[180px]">
                        {category.category}
                      </h3>
                    </div>

                    {/* Launch Count Badge */}
                    <span className="text-xs font-bold text-gray-700 dark:text-hunted-muted bg-white/60 dark:bg-hunted-border/50 px-2 py-1 rounded-md shadow-sm border border-white/50 dark:border-hunted-border">
                      {category.launches}
                    </span>
                  </div>

                  {/* Metrics Row - REMOVED as per request */}
                  <div className="flex items-center justify-between pl-9 text-xs text-gray-500">
                    <div className="w-full h-1 bg-gray-200/50 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-blue-500 rounded-full opacity-60"
                        style={{ width: `${Math.min(100, (category.launches / (topCategories[0]?.launches || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CONTENT - Full Width */}
      <main className="flex-1">
        <div className="p-6 space-y-6">

          {/* TODAY'S LIVE PULSE */}
          {todayData && (
            <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border p-4 sm:p-6 mb-6 sm:mb-8">
              {/* Header Section */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-hunted-text mb-2">
                      Today's Live Pulse
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-full">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[11px] sm:text-xs font-bold text-red-600">LIVE from Product Hunt API</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-hunted-muted leading-relaxed">
                  Real-time Product Hunt launches happening right now
                  <span className="hidden sm:inline"> • Auto-refreshes every 5 minutes</span>
                </p>
              </div>

              {/* Stats Row */}
              {loadingToday ? (
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                  <div className="h-10 sm:h-12 w-28 sm:w-32 bg-gray-100 dark:bg-hunted-card rounded-lg animate-pulse" />
                  <div className="h-10 sm:h-12 w-20 sm:w-24 bg-gray-100 dark:bg-hunted-card rounded-lg animate-pulse" />
                  <div className="h-10 sm:h-12 flex-1 min-w-[140px] bg-gray-100 dark:bg-hunted-card rounded-lg animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="px-4 py-2.5 sm:py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Total Launches</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-hunted-text">{todayData?.metrics?.totalLaunches || 0}</div>
                  </div>
                  <div className="px-4 py-2.5 sm:py-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-0.5">AI Products</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-hunted-text">{todayData?.metrics?.aiPercentage || 0}%</div>
                  </div>
                  <Link href="/desk/niche/AI%20%26%20Machine%20Learning" className="flex-1 min-w-[140px]">
                    <button className="w-full px-4 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                      <span>View AI Analysis</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Top Performers List - Compact & Scrollable */}
                <div className="bg-white dark:bg-hunted-card rounded-xl lg:col-span-2 border border-gray-100 dark:border-hunted-border shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-gray-100 dark:border-hunted-border bg-gray-50/50 dark:bg-hunted-card/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-hunted-text text-base">Top 10 products</h3>
                      <div className="flex items-center gap-6 text-gray-400 text-xs pr-2">
                        <span title="Votes">▲</span>
                        <span title="Comments"><MessageCircle className="w-3 h-3" /></span>
                        <span title="Score"><Zap className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </div>

                  {loadingToday ? (
                    <div className="p-2 space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-hunted-card p-2 rounded-lg flex items-center gap-3 animate-pulse h-12">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-hunted-border rounded" />
                          <div className="flex-1 h-3 bg-gray-200 dark:bg-hunted-border rounded w-1/2" />
                          <div className="w-24 h-3 bg-gray-200 dark:bg-hunted-border rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[350px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {todayData?.topLaunches?.slice(0, 10).map((launch, index) => {
                        // Generate a unique subtle gradient for each card based on index
                        const gradients = [
                          'bg-gradient-to-r from-gray-100 to-gray-50', // 1. Silver/Gray
                          'bg-gradient-to-r from-blue-50 to-indigo-50', // 2. Blueish
                          'bg-gradient-to-r from-cyan-50 to-blue-50', // 3. Cyanish
                          'bg-gradient-to-r from-red-50 to-orange-50', // 4. Reddish
                          'bg-gradient-to-r from-gray-100 to-slate-50', // 5. Gray
                          'bg-gradient-to-r from-green-50 to-emerald-50', // 6. Greenish
                          'bg-gradient-to-r from-purple-50 to-fuchsia-50', // 7. Purple
                          'bg-gradient-to-r from-orange-50 to-amber-50', // 8. Orange
                          'bg-gradient-to-r from-pink-50 to-rose-50', // 9. Pink
                          'bg-gradient-to-r from-blue-50 to-cyan-50', // 10. Blue
                        ];
                        const gradient = gradients[index % gradients.length];

                        return (
                          <Link key={launch.name} href={`/desk/idea-validator?product=${launch.id}`}>
                            <div className={`${gradient} dark:from-hunted-card dark:to-hunted-card dark:border-hunted-border py-2 px-3 rounded-lg border border-white/50 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer`}>
                              {/* Rank & Icon Container */}
                              <div className="relative flex-shrink-0">
                                <span className="absolute -top-1 -left-1 text-[10px] font-bold text-gray-500 dark:text-hunted-muted w-4 h-4 flex items-center justify-center bg-white/80 dark:bg-hunted-border rounded-full shadow-sm z-10">
                                  {index + 1}
                                </span>
                                {launch.thumbnail_url ? (
                                  <img src={launch.thumbnail_url} alt={launch.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/50 dark:bg-hunted-border flex items-center justify-center text-gray-400 shadow-sm">
                                    <Box className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              {/* Name */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-hunted-text truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{launch.name}</h4>
                              </div>

                              {/* Metrics Columns - Aligned with Header */}
                              <div className="flex items-center gap-6 text-xs font-bold text-gray-900 dark:text-hunted-muted">
                                <div className="w-6 text-center">{launch.votes}</div>
                                <div className="w-6 text-center">{launch.comments}</div>
                                <div className="w-6 text-center">{Math.round(launch.votes / 10) + launch.comments}</div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category Chart */}
                <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border p-4 lg:col-span-3">
                  <h3 className="font-bold text-gray-900 dark:text-hunted-text text-sm mb-4">Category Split</h3>
                  <div className="h-[280px] sm:h-[300px] w-full relative flex items-center">
                    {loadingToday ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse">
                        <div className="w-48 h-48 rounded-full border-8 border-gray-100 border-t-blue-100" />
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="40%"
                            outerRadius="90%"
                            data={todayData?.chartData?.map(item => ({ ...item, fill: item.color })) || []}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar
                              label={{ position: 'insideStart', fill: '#fff', fontSize: 9, fontWeight: 'bold' }}
                              background={{ fill: '#f3f4f6' }}
                              dataKey="value"
                              cornerRadius={8}
                            />
                            {/* Hide legend on mobile, show on desktop */}
                            <Legend
                              iconSize={8}
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              wrapperStyle={{ right: '2%', fontSize: '10px', lineHeight: '18px', display: 'none' }}
                              className="hidden lg:block"
                              formatter={(value, entry: any) => (
                                <span style={{ color: '#374151', fontWeight: 500, fontSize: '10px' }}>
                                  {value} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({entry.payload.value})</span>
                                </span>
                              )}
                            />
                            <Tooltip content={<CustomTooltip />} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 text-center pointer-events-none">
                          <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-hunted-text tracking-tight">
                            {todayData?.chartData?.reduce((sum, item) => sum + item.value, 0) || 0}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">Total Launches</div>
                        </div>

                        {/* Mobile-only simple legend below */}
                        <div className="absolute bottom-0 left-0 right-0 lg:hidden">
                          <div className="flex flex-wrap justify-center gap-2 text-xs">
                            {todayData?.chartData?.slice(0, 3).map((item, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="text-gray-600 text-[10px]">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY VOLUME CHART - Full Width */}
          <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Category Volume
                </h3>
                <p className="text-sm text-gray-500 dark:text-hunted-muted mt-1">Historical launch volume trends</p>
              </div>
            </div>
            <div className="h-96">
              {loadingCategories ? (
                <div className="w-full h-full bg-gray-50 dark:bg-hunted-card rounded-lg animate-pulse flex items-center justify-center">
                  <div className="text-gray-400 text-sm">Loading volume data...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...topCategories].sort((a, b) => a.category.localeCompare(b.category))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="category"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      dataKey="launches"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-8}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F0F0F',
                        borderRadius: '8px',
                        border: '1px solid #27272a',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        color: '#E4E4E7'
                      }}
                      itemStyle={{ color: '#E4E4E7', fontWeight: 600, fontSize: '13px' }}
                      formatter={(value, name, props) => [`${value} launches`, props.payload.category]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="launches"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* MARKET GAP ANALYSIS - Full Width */}
          <div className="bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 dark:text-hunted-text flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Market Gap Analysis
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Launch Volume vs. Demand (Avg Upvotes)
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="h-[400px] sm:h-[450px] min-h-[400px]">
                {loadingGaps ? (
                  <div className="w-full h-full bg-gray-50 dark:bg-hunted-card rounded-lg animate-pulse flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Loading market gap data...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minHeight={400}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />

                      {/* Quadrant Backgrounds */}
                      {marketGaps.length > 0 && (() => {
                        const volumes = marketGaps.map(g => g.launchVolume);
                        const upvotes = marketGaps.map(g => g.avgUpvotes);

                        const getMedian = (arr: number[]) => {
                          const sorted = [...arr].sort((a, b) => a - b);
                          const mid = Math.floor(sorted.length / 2);
                          return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                        };

                        const medianVol = getMedian(volumes);
                        const medianVote = getMedian(upvotes);
                        const maxVol = Math.max(...volumes) * 1.1;
                        const maxVote = Math.max(...upvotes) * 1.1;

                        return (
                          <>
                            {/* Blue Ocean: Low Vol, High Vote */}
                            <ReferenceArea
                              x1={0} x2={medianVol}
                              y1={medianVote} y2={maxVote}
                              fill="var(--chart-blue-ocean)" fillOpacity={0.3}
                            />
                            {/* Red Ocean: High Vol, High Vote */}
                            <ReferenceArea
                              x1={medianVol} x2={maxVol}
                              y1={medianVote} y2={maxVote}
                              fill="var(--chart-red-ocean)" fillOpacity={0.3}
                            />
                            {/* Niche: Low Vol, Low Vote */}
                            <ReferenceArea
                              x1={0} x2={medianVol}
                              y1={0} y2={medianVote}
                              fill="var(--chart-niche)" fillOpacity={0.3}
                            />
                            {/* Emerging: High Vol, Low Vote */}
                            <ReferenceArea
                              x1={medianVol} x2={maxVol}
                              y1={0} y2={medianVote}
                              fill="var(--chart-emerging)" fillOpacity={0.3}
                            />

                            {/* Median Lines */}
                            <ReferenceLine x={medianVol} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: 'Median Volume', position: 'insideTopRight', fill: '#6b7280', fontSize: 10 }} />
                            <ReferenceLine y={medianVote} stroke="#9ca3af" strokeDasharray="3 3" label={{ value: 'Median Demand', position: 'insideTopRight', fill: '#6b7280', fontSize: 10 }} />
                          </>
                        );
                      })()}

                      <XAxis
                        type="number"
                        dataKey="launchVolume"
                        name="Launch Volume"
                        stroke="#9ca3af"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: 'Competition →', position: 'insideBottom', offset: -5, style: { fill: '#6b7280', fontWeight: 600, fontSize: 10 } }}
                      />
                      <YAxis
                        type="number"
                        dataKey="avgUpvotes"
                        name="Avg Upvotes"
                        stroke="#9ca3af"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: '← Demand', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#6b7280', fontWeight: 600, fontSize: 10 } }}
                      />
                      <ZAxis type="number" dataKey="opportunityScore" range={[60, 400]} name="Opportunity Score" />

                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload as MarketGapMatrix;
                            return (
                              <div className="bg-white dark:bg-hunted-card p-4 border border-gray-200 dark:border-hunted-border rounded-xl shadow-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getQuadrantColor(data.quadrant) }}></div>
                                  <div className="font-bold text-gray-900 dark:text-hunted-text text-sm">{data.category}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                  <div className="text-gray-500 dark:text-hunted-muted">Launch Volume</div>
                                  <div className="font-semibold text-right text-gray-900 dark:text-hunted-text">{data.launchVolume}</div>

                                  <div className="text-gray-500 dark:text-hunted-muted">Avg Upvotes</div>
                                  <div className="font-semibold text-right text-gray-900 dark:text-hunted-text">{data.avgUpvotes}</div>

                                  <div className="text-gray-500 dark:text-hunted-muted">Avg Comments</div>
                                  <div className="font-semibold text-right text-gray-900 dark:text-hunted-text">{data.avgComments}</div>

                                  <div className="col-span-2 pt-2 mt-1 border-t border-gray-100 dark:border-hunted-border flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-hunted-muted font-medium">Opportunity Score</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">{data.opportunityScore}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter data={marketGaps.slice(0, 40)}>
                        {marketGaps.slice(0, 40).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getQuadrantColor(entry.quadrant)}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Quadrant Breakdown */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Blue Ocean */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-hunted-text">Blue Ocean</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wide">High Demand • Low Comp</span>
                    </div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{quadrants['blue-ocean'].length}</span>
                  </div>
                  <div className="space-y-1">
                    {quadrants['blue-ocean'].slice(0, 5).map(item => (
                      <Link
                        href={`/desk/niche/${encodeURIComponent(item.category)}`}
                        key={item.category}
                        className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs text-gray-700 dark:text-hunted-muted font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{item.category}</span>
                        <TrendingUp className="w-3 h-3 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    ))}
                    {quadrants['blue-ocean'].length === 0 && <div className="text-xs text-gray-400 italic px-2">None found</div>}
                  </div>
                </div>

                {/* Red Ocean */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-hunted-text">Red Ocean</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wide">High Demand • High Comp</span>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{quadrants['red-ocean'].length}</span>
                  </div>
                  <div className="space-y-1">
                    {quadrants['red-ocean'].slice(0, 5).map(item => (
                      <Link
                        href={`/desk/niche/${encodeURIComponent(item.category)}`}
                        key={item.category}
                        className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs text-gray-700 dark:text-hunted-muted font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{item.category}</span>
                        <AlertCircle className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    ))}
                    {quadrants['red-ocean'].length === 0 && <div className="text-xs text-gray-400 italic px-2">None found</div>}
                  </div>
                </div>

                {/* Emerging */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-hunted-text">Emerging</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Low Demand • High Comp</span>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{quadrants['emerging'].length}</span>
                  </div>
                  <div className="space-y-1">
                    {quadrants['emerging'].slice(0, 5).map(item => (
                      <Link
                        href={`/desk/niche/${encodeURIComponent(item.category)}`}
                        key={item.category}
                        className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs text-gray-700 dark:text-hunted-muted font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{item.category}</span>
                        <Zap className="w-3 h-3 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    ))}
                    {quadrants['emerging'].length === 0 && <div className="text-xs text-gray-400 italic px-2">None found</div>}
                  </div>
                </div>

                {/* Niche */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-hunted-text">Niche</span>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-wide">Low Demand • Low Comp</span>
                    </div>
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{quadrants['niche'].length}</span>
                  </div>
                  <div className="space-y-1">
                    {quadrants['niche'].slice(0, 5).map(item => (
                      <Link
                        href={`/desk/niche/${encodeURIComponent(item.category)}`}
                        key={item.category}
                        className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-xs text-gray-700 dark:text-hunted-muted font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{item.category}</span>
                        <Box className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    ))}
                    {quadrants['niche'].length === 0 && <div className="text-xs text-gray-400 italic px-2">None found</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}
