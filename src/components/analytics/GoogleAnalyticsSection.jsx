import React, { useState, useEffect, useCallback } from 'react';
import {
  HiOutlineTrendingUp,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineGlobeAlt,
  HiOutlineClock,
  HiOutlineRefresh,
    HiOutlineShoppingBag,
  HiOutlineChevronDown,
  HiOutlineSparkles,
} from 'react-icons/hi';
import api from '../../api/axios';
import Pagination from '../common/Pagination';
import { useAdminPageSize } from '../../utils/adminPagination';

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7daysAgo' },
  { label: 'Last 30 Days', value: '30daysAgo' },
  { label: 'Last 90 Days', value: '90daysAgo' },
];

export default function GoogleAnalyticsSection({ isStandalone = false }) {
  const [range, setRange] = useState('30daysAgo');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useAdminPageSize();

  useEffect(() => {
    setProductPage(1);
  }, [range, productPageSize]);

  const fetchData = useCallback(async (selectedRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/dashboard', {
        params: { startDate: selectedRange, endDate: 'today' },
      });
      setData(res.data?.data || null);
    } catch (err) {
      console.warn('Failed to load Google Analytics dashboard:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not fetch analytics report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [range, fetchData]);

  const summary = data?.summary || {};
  const timeline = data?.timeline || [];
  const topProducts = data?.topProducts || [];
  const safeProductPage = Math.min(productPage, Math.max(1, Math.ceil(topProducts.length / productPageSize)));
  const visibleProducts = topProducts.slice((safeProductPage - 1) * productPageSize, safeProductPage * productPageSize);
  const trafficSources = data?.trafficSources || [];
  const realtime = data?.realtime || {};
  const isConfigured = data?.configured;

  // Compute SVG Area Chart coordinates
  const maxViews = Math.max(...timeline.map((d) => d.pageViews || 0), 10);
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = svgWidth - paddingX * 2;
  const graphHeight = svgHeight - paddingY * 2;

  const points = timeline.map((d, i) => {
    const x = paddingX + (i / Math.max(timeline.length - 1, 1)) * graphWidth;
    const y = paddingY + graphHeight - ((d.pageViews || 0) / maxViews) * graphHeight;
    return { x, y, data: d };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`
    : '';

  return (
    <div className="space-y-4">
      {/* ─── Header & Date Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#faf3e8] text-[#8b6f4e]">
              <HiOutlineTrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-stone-900">
              Google Analytics 4 (GA4) Traffic & Performance
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Realtime audience metrics, visitor sessions, and top-viewed jewelry products.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Realtime Live Pulse */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{realtime.activeUsers || 0} active now</span>
          </div>

          {/* Date Selector */}
          <div className="inline-flex rounded-xl bg-stone-100 p-0.5 border border-stone-200">
            {DATE_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  range === r.value
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchData(range)}
            disabled={loading}
            title="Refresh analytics data"
            className="p-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      
      {/* ─── 4 Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Visitors</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HiOutlineUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tracking-tight">
              {loading ? '…' : (summary.totalUsers || 0).toLocaleString()}
            </span>
            {summary.trends?.users && (
              <span className={`text-[11px] font-semibold ${
                summary.trends.users.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
              }`}>
                {summary.trends.users}
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">vs previous period</span>
        </div>

        {/* Sessions */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Total Sessions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <HiOutlineGlobeAlt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tracking-tight">
              {loading ? '…' : (summary.totalSessions || 0).toLocaleString()}
            </span>
            {summary.trends?.sessions && (
              <span className={`text-[11px] font-semibold ${
                summary.trends.sessions.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
              }`}>
                {summary.trends.sessions}
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">vs previous period</span>
        </div>

        {/* Page Views */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Page Views</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HiOutlineEye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tracking-tight">
              {loading ? '…' : (summary.pageViews || 0).toLocaleString()}
            </span>
            {summary.trends?.pageViews && (
              <span className={`text-[11px] font-semibold ${
                summary.trends.pageViews.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'
              }`}>
                {summary.trends.pageViews}
              </span>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">total screens viewed</span>
        </div>

        {/* Engagement Rate & Duration */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-medium">Engagement Rate</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HiOutlineClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 tracking-tight">
              {loading ? '…' : (summary.engagementRate || '0%')}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              avg {summary.averageSessionDuration || '0m'}
            </span>
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">active session ratio</span>
        </div>
      </div>

      {/* ─── Traffic Over Time Chart & Traffic Acquisition ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Interactive SVG Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Traffic Trend Over Time</h3>
              <p className="text-xs text-stone-500">{range === 'today' ? 'Hourly breakdown of page views and visitor activity' : 'Daily breakdown of page views and visitor activity'}</p>
            </div>
            {hoveredPoint && (
              <div className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                <span className="font-semibold">{hoveredPoint.data.date}</span>: {hoveredPoint.data.pageViews} views ({hoveredPoint.data.users} visitors)
              </div>
            )}
          </div>

          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 select-none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b6f4e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#8b6f4e" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#f0ece6" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={paddingY + graphHeight / 2} x2={svgWidth - paddingX} y2={paddingY + graphHeight / 2} stroke="#f0ece6" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#e5e0d8" strokeWidth="1" />

              {/* Area & Line */}
              {areaD && <path d={areaD} fill="url(#viewsGradient)" />}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#8b6f4e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Hover Dots */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.data.date === p.data.date ? 5 : 3}
                  className="fill-[#8b6f4e] hover:fill-[#5a4329] transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* X Axis Dates */}
            <div className="flex justify-between text-[10px] text-stone-400 px-2 mt-1">
              <span>{timeline[0]?.date || ''}</span>
              <span>{timeline[Math.floor(timeline.length / 2)]?.date || ''}</span>
              <span>{timeline[timeline.length - 1]?.date || ''}</span>
            </div>
          </div>
        </div>

        {/* Traffic Channels Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Traffic Acquisition Channels</h3>
            <p className="text-xs text-stone-500 mb-4">Top referrer channels by session volume</p>

            <div className="space-y-3">
              {trafficSources.map((item, idx) => {
                const totalSessions = trafficSources.reduce((sum, s) => sum + (s.sessions || 0), 0) || 1;
                const percentage = Math.round(((item.sessions || 0) / totalSessions) * 100);

                return (
                  <div key={item.channel || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-800">{item.channel}</span>
                      <span className="text-stone-500 font-semibold">{percentage}% ({item.sessions} sessions)</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#8b6f4e] to-[#c6913c] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Real-time channel grouping</span>
            <span className="font-semibold text-stone-700">GA4 Session Model</span>
          </div>
        </div>
      </div>

      {/* ─── Top Viewed Products ─── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Most Viewed Products</h3>
            <p className="text-xs text-stone-500">Product detail page views mapped to catalog records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU / Tag</th>
                <th className="py-3 px-4">Catalogue Price</th>
                <th className="py-3 px-4 text-right">Unique Visitors</th>
                <th className="py-3 px-4 text-right">Total Page Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-stone-400 text-xs">
                    No product views recorded yet for this timeframe.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg border border-stone-200 bg-stone-50 shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                            <HiOutlineShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 truncate max-w-xs sm:max-w-md">
                            {p.title}
                          </p>
                          <span className="text-[10px] text-stone-400">ID: {p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                      {p.sku || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-stone-700">
                      {(p.users || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#8b6f4e]">
                      {(p.views || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={safeProductPage}
          totalItems={topProducts.length}
          pageSize={productPageSize}
          onPageChange={setProductPage}
          onPageSizeChange={setProductPageSize}
          itemLabel="products"
        />
      </div>
    </div>
  );
}
