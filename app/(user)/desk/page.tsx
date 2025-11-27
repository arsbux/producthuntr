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
      <div className="bg-white border border-gray-200 p-2 rounded shadow-sm text-xs">
        <p className="font-bold">{payload[0].name}</p>
        <p>{payload[0].value} launches</p>
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
    <div className="flex min-h-[calc(100vh-80px)] bg-gray-50">
      {/* LEFT SIDEBAR - Fixed Position Categories List */}
      <aside className="w-96 bg-white border-r border-gray-200 flex-shrink-0 h-[calc(100vh-80px)] overflow-y-auto sticky top-0">
        <div className="p-4 sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">All Categories</h2>
            <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2.5 py-1 rounded-full">{topCategories.length}</span>
          </div>
        </div>

        <div className="p-2">
          {loadingCategories ? (
            <div className="space-y-2 p-2">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            topCategories.map((category, index) => (
              <Link
                key={category.category}
                href={`/desk/niche/${encodeURIComponent(category.category)}`}
                className="group flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-all border-l-2 border-transparent hover:border-blue-500"
              >
                {/* Rank */}
                <div className={`
                w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0
                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-400'}
              `}>
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">
                      {category.category}
                    </h3>
                    <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                      {category.launches}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (category.launches / topCategories[0].launches) * 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            )))}
        </div>
      </aside>

      {/* MAIN CONTENT - Full Width */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* TODAY'S LIVE PULSE */}
          {todayData && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Today's Live Pulse
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      LIVE from Product Hunt API
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time Product Hunt launches happening right now • Auto-refreshes every 5 minutes
                  </p>
                </div>
                {loadingToday ? (
                  <div className="flex gap-2">
                    <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">
                      {todayData?.metrics?.totalLaunches || 0} Launches
                    </div>
                    <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-700">
                      {todayData?.metrics?.aiPercentage || 0}% AI
                    </div>
                    <Link href="/desk/niche/AI%20%26%20Machine%20Learning">
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1">
                        View Full Analysis <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers List */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Top Performers</h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Sorted by Upvotes</span>
                  </div>

                  {loadingToday ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-3 animate-pulse">
                          <div className="w-6 h-6 bg-gray-200 rounded" />
                          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                          <div className="w-12 h-6 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {todayData?.topLaunches?.slice(0, 10).map((launch, index) => (
                        <div key={launch.name} className="bg-white p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all flex items-center gap-3 group">
                          <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-700 rounded flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          {launch.thumbnail_url ? (
                            <img src={launch.thumbnail_url} alt={launch.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <Box className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{launch.name}</h4>
                            <p className="text-xs text-gray-500 truncate">{launch.tagline}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <MessageCircle className="w-3 h-3" />
                              {launch.comments}
                            </div>
                            <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-700">
                              <span className="text-[10px]">▲</span> {launch.votes}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-4">Category Split</h3>
                  <div className="h-[300px] w-full relative flex items-center">
                    {loadingToday ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse">
                        <div className="w-48 h-48 rounded-full border-8 border-gray-100 border-t-blue-100" />
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="40%"
                            cy="50%"
                            innerRadius="30%"
                            outerRadius="100%"
                            data={todayData?.chartData?.map(item => ({ ...item, fill: item.color })) || []}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar
                              label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                              background={{ fill: '#f3f4f6' }}
                              dataKey="value"
                              cornerRadius={10}
                            />
                            <Legend
                              iconSize={10}
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              wrapperStyle={style}
                              formatter={(value, entry: any) => (
                                <span style={{ color: '#374151', fontWeight: 500, fontSize: '12px' }}>
                                  {value} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({entry.payload.value})</span>
                                </span>
                              )}
                            />
                            <Tooltip content={<CustomTooltip />} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        {/* Center Label */}
                        <div className="absolute left-[40%] top-1/2 -translate-y-1/2 -translate-x-1/2 text-center pointer-events-none mt-8">
                          <div className="text-4xl font-bold text-gray-900 tracking-tight">
                            {todayData?.chartData?.reduce((sum, item) => sum + item.value, 0) || 0}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">Total Launches</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORY VOLUME CHART - Full Width */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Category Volume
                </h3>
                <p className="text-sm text-gray-500 mt-1">Historical launch volume trends</p>
              </div>
            </div>
            <div className="h-96">
              {loadingCategories ? (
                <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
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
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: '#111827', fontWeight: 600, fontSize: '13px' }}
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Market Gap Analysis
              </h2>
              <p className="text-gray-500 mt-1 text-sm">
                Launch Volume vs. Demand (Avg Upvotes)
              </p>
            </div>
            <div className="p-6">
              <div className="h-[500px]">
                {loadingGaps ? (
                  <div className="w-full h-full bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Loading market gap data...</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 40, bottom: 60, left: 60 }}>
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
                              fill="#dcfce7" fillOpacity={0.3}
                            />
                            {/* Red Ocean: High Vol, High Vote */}
                            <ReferenceArea
                              x1={medianVol} x2={maxVol}
                              y1={medianVote} y2={maxVote}
                              fill="#fee2e2" fillOpacity={0.3}
                            />
                            {/* Niche: Low Vol, Low Vote */}
                            <ReferenceArea
                              x1={0} x2={medianVol}
                              y1={0} y2={medianVote}
                              fill="#f3f4f6" fillOpacity={0.3}
                            />
                            {/* Emerging: High Vol, Low Vote */}
                            <ReferenceArea
                              x1={medianVol} x2={maxVol}
                              y1={0} y2={medianVote}
                              fill="#fef3c7" fillOpacity={0.3}
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
                        fontSize={11}
                        label={{ value: 'Launch Volume (Competition) →', position: 'bottom', offset: 40, style: { fill: '#6b7280', fontWeight: 600, fontSize: 12 } }}
                      />
                      <YAxis
                        type="number"
                        dataKey="avgUpvotes"
                        name="Avg Upvotes"
                        stroke="#9ca3af"
                        fontSize={11}
                        label={{ value: '← Avg Upvotes (Demand)', angle: -90, position: 'left', offset: 40, style: { fill: '#6b7280', fontWeight: 600, fontSize: 12 } }}
                      />
                      <ZAxis type="number" dataKey="opportunityScore" range={[60, 400]} name="Opportunity Score" />

                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload as MarketGapMatrix;
                            return (
                              <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getQuadrantColor(data.quadrant) }}></div>
                                  <div className="font-bold text-gray-900 text-sm">{data.category}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                  <div className="text-gray-500">Launch Volume</div>
                                  <div className="font-semibold text-right">{data.launchVolume}</div>

                                  <div className="text-gray-500">Avg Upvotes</div>
                                  <div className="font-semibold text-right">{data.avgUpvotes}</div>

                                  <div className="text-gray-500">Avg Comments</div>
                                  <div className="font-semibold text-right">{data.avgComments}</div>

                                  <div className="col-span-2 pt-2 mt-1 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Opportunity Score</span>
                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{data.opportunityScore}</span>
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
              <div className="mt-6 grid grid-cols-4 gap-4">
                {/* Blue Ocean */}
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900">Blue Ocean</span>
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
                        <span className="text-xs text-gray-700 font-medium group-hover:text-blue-600 truncate">{item.category}</span>
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
                      <span className="font-bold text-sm text-gray-900">Red Ocean</span>
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
                        <span className="text-xs text-gray-700 font-medium group-hover:text-blue-600 truncate">{item.category}</span>
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
                      <span className="font-bold text-sm text-gray-900">Emerging</span>
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
                        <span className="text-xs text-gray-700 font-medium group-hover:text-blue-600 truncate">{item.category}</span>
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
                      <span className="font-bold text-sm text-gray-900">Niche</span>
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
                        <span className="text-xs text-gray-700 font-medium group-hover:text-blue-600 truncate">{item.category}</span>
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
