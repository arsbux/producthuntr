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
  ScatterChart,
  Scatter,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  getTopCategories,
  getMarketGapMatrix,
  getYesterdayLaunchesData,
  type MarketGapMatrix,
  type YesterdayData
} from '@/lib/charts-data';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [marketGaps, setMarketGaps] = useState<MarketGapMatrix[]>([]);
  const [yesterdayData, setYesterdayData] = useState<YesterdayData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [categories, gapData, yesterday] = await Promise.all([
        getTopCategories('launches', 0), // 0 = fetch all categories
        getMarketGapMatrix(),
        getYesterdayLaunchesData()
      ]);

      // Sort categories by launches descending for the sidebar list
      const sortedCategories = categories.sort((a, b) => b.launches - a.launches);

      setTopCategories(sortedCategories);
      setMarketGaps(gapData);
      setYesterdayData(yesterday);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
    setLoading(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

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
          {topCategories.map((category, index) => (
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
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT - Full Width */}
      <main className="flex-1 h-[calc(100vh-80px)] overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* YESTERDAY'S SNAPSHOT */}
          {yesterdayData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-blue-600" />
                    Yesterday's Pulse
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Market activity from the last 24 hours
                  </p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600">
                    {yesterdayData.metrics.totalLaunches} Launches
                  </div>
                  <div className="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-700">
                    {yesterdayData.metrics.aiPercentage}% AI
                  </div>
                  <Link
                    href={`/desk/daily-analysis?date=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    View Full Analysis
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                {/* Category Split - 4 columns */}
                <div className="col-span-4 bg-white rounded-xl border border-gray-200 p-5 h-[480px] flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 mb-4">Category Split</h3>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                    {yesterdayData.chartData.map((item, index) => {
                      const percentage = Math.round((item.value / yesterdayData.metrics.totalLaunches) * 100);
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const dateStr = yesterday.toISOString().split('T')[0];

                      return (
                        <Link
                          key={index}
                          href={`/desk/daily-analysis?date=${dateStr}`}
                          className="block group"
                        >
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">
                              {item.name}
                            </span>
                            <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 group-hover:opacity-90"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Top Performers - 8 columns */}
                <div className="col-span-8 bg-white rounded-xl border border-gray-200 h-[480px] flex flex-col overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-900">Top Performers</h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md">Sorted by Upvotes</span>
                  </div>
                  <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
                    {yesterdayData.topLaunches.map((product, index) => (
                      <div key={index} className="px-5 py-3 hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-50 text-gray-400'
                            }`}>
                            {index + 1}
                          </div>

                          {/* Thumbnail */}
                          {product.thumbnail_url && (
                            <img
                              src={product.thumbnail_url}
                              alt={product.name}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {product.tagline}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {product.comments}
                            </span>
                            <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                              ▲ {product.votes.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 40, bottom: 60, left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload as MarketGapMatrix;
                          return (
                            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                              <div className="font-bold text-gray-900 text-sm mb-2">{data.category}</div>
                              <div className="text-xs space-y-1">
                                <div>Launch Volume: <span className="font-semibold">{data.launchVolume}</span></div>
                                <div>Avg Upvotes: <span className="font-semibold">{data.avgUpvotes}</span></div>
                                <div>Quadrant: <span className="font-semibold capitalize">{data.quadrant.replace('-', ' ')}</span></div>
                                <div className="pt-1.5 border-t border-gray-100 mt-1.5">
                                  <span className="text-xs font-semibold text-green-600">Score: {data.opportunityScore}</span>
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
                        <Cell key={`cell-${index}`} fill={getQuadrantColor(entry.quadrant)} />
                      ))}
                    </Scatter>
                    <ReferenceLine x={50} stroke="#e5e7eb" strokeDasharray="3 3" />
                    <ReferenceLine y={50} stroke="#e5e7eb" strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
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
      </main>
    </div>
  );
}
