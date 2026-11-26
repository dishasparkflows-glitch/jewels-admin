import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineCheck,
  HiOutlineShoppingBag,
  HiOutlineClipboardList,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import ModuleHeader from '../../components/common/ModuleHeader';
import DatePicker from '../../components/common/DatePicker';
import { analyticsAPI, dashboardAPI } from '../../api/services';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeChartPalette } from '../../utils/themeUtils';
import { openProductPreview } from '../../utils/productPreview';

const DATE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const metrics = [
  { label: 'Products', path: '/catalog/jewelry-products' },
  { label: 'Appointments', path: '/appointments' },
  { label: 'Customers', path: '/customers' },
  { label: 'Reviews', path: '/reviews' },
  { label: 'Orders', path: '/orders' },
];

function getOrderStatusBadgeClass(status = '') {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
    case 'processing':
      return 'bg-amber-50 text-amber-700 border border-amber-200/60';
    case 'shipped':
      return 'bg-sky-50 text-sky-700 border border-sky-200/60';
    case 'accepted':
      return 'bg-blue-50 text-blue-700 border border-blue-200/60';
    case 'cancelled':
    case 'returned':
      return 'bg-rose-50 text-rose-700 border border-rose-200/60';
    case 'pending':
    default:
      return 'bg-stone-100 text-stone-700 border border-stone-200/60';
  }
}

// Helper: Convert polar coordinates to Cartesian for SVG donut arcs
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: +(centerX + radius * Math.cos(angleInRadians)).toFixed(2),
    y: +(centerY + radius * Math.sin(angleInRadians)).toFixed(2),
  };
}

// Helper: Generate SVG path for a donut arc slice
function describeDonutArc(x, y, radius, innerRadius, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    endAngle = startAngle + 359.99;
  }
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

// Helper: Generate smooth Catmull-Rom cubic Bezier spline path
function getSplinePath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function Dashboard() {
  const { currentTheme } = useTheme();
  const themePrimary = currentTheme?.primary || '#8b6f4e';
  const themeChartColor = currentTheme?.accent || themePrimary;
  const chartPalette = useMemo(() => getThemeChartPalette(currentTheme), [currentTheme]);

  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(true);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [revision, setRevision] = useState(0);

  // 'revenue' | 'orders' toggle for Sales Overview
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Date Filter State
  const [datePeriod, setDatePeriod] = useState('30days');
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [tempCustomRange, setTempCustomRange] = useState({ start: '', end: '' });
  const dateMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      // 1. If clicking inside the dateMenu dropdown, don't close
      if (dateMenuRef.current && dateMenuRef.current.contains(e.target)) {
        return;
      }
      // 2. If clicking inside any portaled DatePicker popup or calendar, don't close
      if (
        e.target.closest?.('[data-datepicker-popup]') ||
        e.target.closest?.('.datepicker-popup') ||
        e.target.closest?.('.z-\\[100000\\]')
      ) {
        return;
      }
      setIsDateMenuOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPeriod = (val) => {
    if (val === 'custom') {
      setDatePeriod('custom');
      if (!tempCustomRange.start || !tempCustomRange.end) {
        const todayStr = new Date().toISOString().split('T')[0];
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        setTempCustomRange({
          start: customRange.start || weekAgoStr,
          end: customRange.end || todayStr,
        });
      }
    } else {
      setDatePeriod(val);
      setIsDateMenuOpen(false);
    }
  };

  const currentPeriodLabel = useMemo(() => {
    if (datePeriod === 'custom' && customRange.start && customRange.end) {
      return `${customRange.start} to ${customRange.end}`;
    }
    const found = DATE_OPTIONS.find((o) => o.value === datePeriod);
    return found ? found.label : 'Last 30 Days';
  }, [datePeriod, customRange]);

  // Fetch top summary counts via single dashboard counts API
  useEffect(() => {
    let isMounted = true;
    setLoadingCounts(true);
    dashboardAPI
      .getCounts()
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || res.data || {};
        setCounts({
          Products: data.products ?? data.Products ?? 0,
          Appointments: data.appointments ?? data.Appointments ?? 0,
          Customers: data.customers ?? data.Customers ?? 0,
          Reviews: data.reviews ?? data.Reviews ?? 0,
          Orders: data.orders ?? data.Orders ?? 0,
        });
      })
      .catch((err) => {
        console.error('Failed to load dashboard counts:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingCounts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [revision]);

  // Fetch dashboard sales metrics (timeline & category breakdown)
  useEffect(() => {
    let isMounted = true;
    setLoadingSales(true);
    const params = {};
    if (datePeriod === 'custom') {
      if (!customRange.start || !customRange.end) {
        setLoadingSales(false);
        return;
      }
      params.startDate = customRange.start;
      params.endDate = customRange.end;
    } else {
      params.period = datePeriod;
    }

    analyticsAPI
      .getDashboardSales(params)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data?.data || res.data;
        if (data) setSalesData(data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard sales metrics:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSales(false);
      });

    return () => {
      isMounted = false;
    };
  }, [revision, datePeriod, customRange]);

  // Fetch dashboard bottom sections (top selling products & recent orders)
  useEffect(() => {
    let isMounted = true;
    setLoadingSections(true);

    Promise.all([
      dashboardAPI.getTopSellingProducts({ limit: 5 }),
      dashboardAPI.getRecentOrders({ limit: 5 }),
    ])
      .then(([topRes, ordersRes]) => {
        if (!isMounted) return;
        const topData = topRes.data?.data ?? topRes.data ?? [];
        const ordersData = ordersRes.data?.data ?? ordersRes.data ?? [];
        setTopSellingProducts(Array.isArray(topData) ? topData : []);
        setRecentOrders(Array.isArray(ordersData) ? ordersData : []);
      })
      .catch((err) => {
        console.error('Failed to load dashboard overview sections:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSections(false);
      });

    return () => {
      isMounted = false;
    };
  }, [revision]);

  // Chart layout dimensions
  const chartWidth = 650;
  const chartHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const chartBottom = chartHeight - paddingBottom;

  // Process timeline data for Spline Chart
  const timeline = salesData?.timeline || [];

  const { points, yTicks, splinePath, areaPath } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { points: [], yTicks: [], splinePath: '', areaPath: '' };
    }

    const isRevenue = activeMetric === 'revenue';
    const rawValues = timeline.map((d) => (isRevenue ? d.revenue : d.orders));
    const maxDataVal = Math.max(...rawValues, 1);

    // Compute nice upper bound and 5 equal steps
    let maxTick = 1000000; // default 10L for revenue
    let ticks = [];

    if (isRevenue) {
      if (maxDataVal > 1000000) {
        maxTick = Math.ceil(maxDataVal / 200000) * 200000;
      } else {
        maxTick = 1000000; // standard 10L as in screenshot
      }
      const step = maxTick / 5;
      ticks = [
        { val: maxTick, label: `₹${maxTick / 100000}L` },
        { val: step * 4, label: `₹${(step * 4) / 100000}L` },
        { val: step * 3, label: `₹${(step * 3) / 100000}L` },
        { val: step * 2, label: `₹${(step * 2) / 100000}L` },
        { val: step, label: `₹${step / 100000}L` },
        { val: 0, label: '₹0' },
      ];
    } else {
      maxTick = Math.max(60, Math.ceil(maxDataVal / 10) * 10);
      const step = maxTick / 5;
      ticks = [
        { val: maxTick, label: `${Math.round(maxTick)}` },
        { val: step * 4, label: `${Math.round(step * 4)}` },
        { val: step * 3, label: `${Math.round(step * 3)}` },
        { val: step * 2, label: `${Math.round(step * 2)}` },
        { val: step, label: `${Math.round(step)}` },
        { val: 0, label: '0' },
      ];
    }

    const calculatedPoints = timeline.map((d, i) => {
      const val = isRevenue ? d.revenue : d.orders;
      const x = paddingLeft + i * (usableWidth / (timeline.length - 1));
      const y = chartBottom - (val / maxTick) * usableHeight;
      return {
        x: +x.toFixed(1),
        y: +y.toFixed(1),
        val,
        date: d.date,
        label: d.label,
        formattedRevenue: d.formattedRevenue,
        orders: d.orders,
      };
    });

    const sPath = getSplinePath(calculatedPoints);
    const aPath = calculatedPoints.length > 0
      ? `${sPath} L ${calculatedPoints[calculatedPoints.length - 1].x} ${chartBottom} L ${calculatedPoints[0].x} ${chartBottom} Z`
      : '';

    return {
      points: calculatedPoints,
      yTicks: ticks,
      splinePath: sPath,
      areaPath: aPath,
    };
  }, [timeline, activeMetric, usableWidth, usableHeight, chartBottom, paddingLeft]);

  // Donut chart arcs calculation with theme-matched slice palette
  const rawCategorySales = salesData?.categorySales || [];
  const categorySales = useMemo(
    () =>
      rawCategorySales.map((cat, idx) => ({
        ...cat,
        color: chartPalette[idx % chartPalette.length],
      })),
    [rawCategorySales, chartPalette]
  );

  const donutArcs = useMemo(() => {
    let currentAngle = 0;
    return categorySales.map((cat) => {
      const startAngle = currentAngle;
      const sweep = (cat.percentage / 100) * 360;
      const endAngle = currentAngle + sweep;
      currentAngle = endAngle;

      const path = describeDonutArc(100, 100, 78, 56, startAngle, endAngle);
      return {
        ...cat,
        startAngle,
        endAngle,
        path,
      };
    });
  }, [categorySales]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ModuleHeader
        title="Overview"
        subtitle="Current records and live performance from your store."
      />

      {/* Top Count Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            to={metric.path}
            className="last:col-span-2 sm:last:col-span-1 rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-5 transition-shadow hover:shadow-sm"
          >
            <p className="text-xs sm:text-sm font-medium text-stone-500">{metric.label}</p>
            <p className="mt-1.5 sm:mt-3 text-xl sm:text-2xl font-semibold text-stone-900">
              {loadingCounts
                ? 'Loading…'
                : counts[metric.label] == null
                ? 'Unavailable'
                : counts[metric.label].toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      {!loadingCounts && Object.values(counts).some((count) => count == null) && (
        <button onClick={() => setRevision((value) => value + 1)} className="text-sm text-[#8b6f4e] underline">
          Retry unavailable metrics
        </button>
      )}

      {/* Analytics Visual Widgets: Sales Overview & Sales by Category */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Card 1: Sales Overview */}
        <div className="xl:col-span-8 bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between min-w-0">
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">Sales Overview</h2>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              {/* Date Filter Dropdown */}
              <div className="relative" ref={dateMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsDateMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 transition-all shadow-2xs cursor-pointer"
                >
                  <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{currentPeriodLabel}</span>
                  <HiOutlineChevronDown
                    className={`w-3.5 h-3.5 text-stone-400 transition-transform shrink-0 ${
                      isDateMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDateMenuOpen && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-52 max-w-[calc(100vw-2.5rem)] bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-30 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                      Filter Period
                    </div>
                    {DATE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectPeriod(opt.value)}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                          datePeriod === opt.value
                            ? 'text-[#8b6f4e] bg-[#faf5ee] font-semibold'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {datePeriod === opt.value && <HiOutlineCheck className="w-3.5 h-3.5 text-[#8b6f4e]" />}
                      </button>
                    ))}

                    {datePeriod === 'custom' && (
                      <div className="border-t border-stone-100 p-2.5 mt-1 space-y-2 bg-stone-50/70 rounded-b-xl">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-stone-500">From</label>
                          <DatePicker
                            value={tempCustomRange.start}
                            onChange={(dateStr) => {
                              const cleanDate = typeof dateStr === 'string' ? dateStr : dateStr?.target?.value || '';
                              setTempCustomRange((prev) => ({ ...prev, start: cleanDate }));
                            }}
                            placeholder="Start Date"
                            size="sm"
                            maxDate={tempCustomRange.end ? new Date(tempCustomRange.end) : new Date()}
                            buttonClassName="w-full text-xs h-8 px-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase text-stone-500">To</label>
                          <DatePicker
                            value={tempCustomRange.end}
                            onChange={(dateStr) => {
                              const cleanDate = typeof dateStr === 'string' ? dateStr : dateStr?.target?.value || '';
                              setTempCustomRange((prev) => ({ ...prev, end: cleanDate }));
                            }}
                            placeholder="End Date"
                            size="sm"
                            minDate={tempCustomRange.start ? new Date(tempCustomRange.start) : undefined}
                            maxDate={new Date()}
                            buttonClassName="w-full text-xs h-8 px-2"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (tempCustomRange.start && tempCustomRange.end) {
                              setCustomRange({ ...tempCustomRange });
                              setIsDateMenuOpen(false);
                            }
                          }}
                          disabled={!tempCustomRange.start || !tempCustomRange.end}
                          className="w-full mt-1.5 py-1.5 rounded-lg bg-[#8b6f4e] text-white text-xs font-semibold hover:bg-[#785e40] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Apply Range
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Segmented Control Pill */}
              <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1 shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeMetric === 'revenue'
                      ? 'bg-[#8b6f4e] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric('orders')}
                  className={`px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                    activeMetric === 'orders'
                      ? 'bg-[#8b6f4e] text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>
          </div>

          {/* Spline Area Chart */}
          <div className="relative w-full overflow-hidden">
            {loadingSales ? (
              <div className="h-60 w-full flex items-center justify-center text-stone-400 text-sm animate-pulse">
                Loading sales data...
              </div>
            ) : points.length === 0 ? (
              <div className="h-60 w-full flex items-center justify-center text-stone-400 text-sm">
                No sales data recorded for the selected period.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Dynamic Theme Gradient Fill */}
                  <linearGradient id="salesOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={themeChartColor} stopOpacity="0.28" />
                    <stop offset="60%" stopColor={themeChartColor} stopOpacity="0.08" />
                    <stop offset="100%" stopColor={themeChartColor} stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {yTicks.map((tick, i) => {
                  const y = paddingTop + i * (usableHeight / (yTicks.length - 1));
                  return (
                    <g key={`ytick-${i}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#f0ece6"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[13px] sm:text-[11px] font-medium fill-stone-500 select-none"
                      >
                        {tick.label}
                      </text>
                    </g>
                  );
                })}

                {/* Spline Area Gradient Fill */}
                {areaPath && <path d={areaPath} fill="url(#salesOverviewGrad)" />}

                {/* Spline Main Stroke Line */}
                {splinePath && (
                  <path
                    d={splinePath}
                    fill="none"
                    stroke={themePrimary}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points (Dots) & X-Axis Labels */}
                {points.map((pt, i) => {
                  const isHovered = hoveredPointIndex === i;
                  return (
                    <g key={`pt-${i}`}>
                      {/* Vertical Hover Highlight Line */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={paddingTop}
                          x2={pt.x}
                          y2={chartBottom}
                          stroke={themeChartColor}
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* X-Axis Tick Label */}
                      <text
                        x={pt.x}
                        y={chartBottom + 20}
                        textAnchor="middle"
                        className={`text-[13px] sm:text-[11px] font-medium fill-stone-500 select-none ${
                          i % 2 === 1 ? 'hidden sm:block' : ''
                        }`}
                      >
                        {pt.label}
                      </text>

                      {/* Dot on Data Point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '5' : '3.5'}
                        fill={themePrimary}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? '2.5' : '2'}
                        className="transition-all duration-150"
                      />

                      {/* Invisible hover area target */}
                      <rect
                        x={pt.x - usableWidth / (points.length * 2)}
                        y={paddingTop}
                        width={usableWidth / points.length}
                        height={usableHeight + 25}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(i)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Interactive Floating Tooltip */}
            {hoveredPointIndex !== null && points[hoveredPointIndex] && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full transform rounded-lg bg-stone-900/95 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm transition-all duration-75"
                style={{
                  left: `${(points[hoveredPointIndex].x / chartWidth) * 100}%`,
                  top: `${(points[hoveredPointIndex].y / chartHeight) * 100 - 8}%`,
                }}
              >
                <div className="font-semibold text-stone-200">{points[hoveredPointIndex].label}</div>
                <div className="mt-0.5 font-semibold" style={{ color: currentTheme?.light || '#fde68a' }}>
                  {points[hoveredPointIndex].formattedRevenue}
                </div>
                <div className="text-[11px] text-stone-400">
                  {points[hoveredPointIndex].orders} Orders
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Sales by Category */}
        <div className="xl:col-span-4 bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between min-w-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight mb-4 sm:mb-5">Sales by Category</h2>

            {loadingSales ? (
              <div className="h-60 w-full flex items-center justify-center text-stone-400 text-sm animate-pulse">
                Loading categories...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row xl:flex-row items-center justify-between gap-5 sm:gap-6">
                {/* SVG Donut Chart with Center Text */}
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90 overflow-visible">
                    {donutArcs.length === 0 ? (
                      <circle cx="100" cy="100" r="67" fill="none" stroke="#f0ebe4" strokeWidth="22" />
                    ) : (
                      donutArcs.map((arc, i) => {
                        const isHovered = hoveredCategory === arc.name;
                        return (
                          <path
                            key={arc.name || i}
                            d={arc.path}
                            fill={arc.color}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="transition-all duration-200 cursor-pointer"
                            style={{
                              opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                              transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                              transformOrigin: '100px 100px',
                            }}
                            onMouseEnter={() => setHoveredCategory(arc.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        );
                      })
                    )}
                  </svg>

                  {/* Donut Center Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-none">
                      {salesData?.formattedTotalSales || '₹0'}
                    </span>
                    <span className="text-[11px] text-stone-500 font-medium mt-1">
                      Total Sales
                    </span>
                  </div>
                </div>

                {/* Category Breakdown Legend */}
                <div className="flex-1 w-full space-y-3">
                  {categorySales.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400">
                      No category sales recorded yet
                    </div>
                  ) : (
                    categorySales.map((cat) => {
                      const isHovered = hoveredCategory === cat.name;
                      return (
                        <div
                          key={cat.name}
                          className={`flex items-center justify-between transition-all duration-150 cursor-pointer py-0.5 px-1 rounded-md ${
                            hoveredCategory && !isHovered ? 'opacity-40' : 'opacity-100'
                          } ${isHovered ? 'bg-stone-50 font-semibold' : ''}`}
                          onMouseEnter={() => setHoveredCategory(cat.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-xs sm:text-sm text-stone-700 font-medium">
                              {cat.name}
                            </span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-stone-900">
                            {cat.percentage}%
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Top Selling Products & Recent Orders ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Top Selling Products */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-[#faf5ee] text-[#8b6f4e] shrink-0">
                  <HiOutlineShoppingBag className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">Top Selling Products</h2>
              </div>
              <Link
                to="/catalog/jewelry-products"
                className="text-xs font-semibold text-[#8b6f4e] hover:text-[#73583c] flex items-center gap-1 transition-colors shrink-0"
              >
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {loadingSections ? (
              <div className="h-64 flex items-center justify-center text-xs text-stone-400 animate-pulse">
                Loading top products...
              </div>
            ) : topSellingProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No top selling products recorded yet
              </div>
            ) : (
              <div className="divide-y divide-stone-100 mt-2">
                {topSellingProducts.map((item, index) => {
                  const thumbUrl = item.imageUrl || item.images?.[0];
                  const productTitle = item.basicInfo?.title || item.title || 'Untitled Jewelry';
                  const productSku = item.basicInfo?.sku || item.sku || 'N/A';
                  return (
                  <div
                    key={item._id || index}
                    role="button"
                    tabIndex={0}
                    onClick={() => openProductPreview(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProductPreview(item);
                      }
                    }}
                    title="Open product on storefront"
                    className="py-3.5 px-2 -mx-2 rounded-xl flex items-center gap-4 first:pt-2 last:pb-1 cursor-pointer hover:bg-stone-50/90 transition-colors group"
                  >
                    {/* Rank Circle */}
                    <span className="w-7 h-7 rounded-full bg-[#faf5ee] text-[#8b6f4e] font-bold text-xs flex items-center justify-center shrink-0">
                      {item.rank || index + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl bg-stone-900/90 border border-stone-200/50 overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={productTitle} className="w-full h-full object-cover" />
                      ) : (
                        <IoDiamondOutline className="w-5 h-5 text-amber-200/60" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-stone-900 group-hover:text-[#8b6f4e] transition-colors truncate" title={productTitle}>
                        {productTitle}
                      </h4>
                      <p className="text-xs text-stone-400 mt-0.5">
                        SKU: {productSku}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-stone-900">
                          {item.formattedPrice || `₹${Number(item.price || 0).toLocaleString('en-IN')}`}
                        </span>
                        <span className="text-stone-300">|</span>
                        <span className="text-xs text-stone-500 font-medium">
                          {item.ordersCount ?? 0} {item.ordersCount === 1 ? 'order' : 'orders'}
                        </span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recent Orders */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-6 shadow-xs flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 sm:pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-1.5 rounded-lg bg-[#faf5ee] text-[#8b6f4e] shrink-0">
                  <HiOutlineClipboardList className="w-5 h-5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">Recent Orders</h2>
              </div>
              <Link
                to="/orders"
                className="text-xs font-semibold text-[#8b6f4e] hover:text-[#73583c] flex items-center gap-1 transition-colors shrink-0"
              >
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {loadingSections ? (
              <div className="h-64 flex items-center justify-center text-xs text-stone-400 animate-pulse">
                Loading recent orders...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">
                No recent orders recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs table-compact min-w-[420px] sm:min-w-full">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 font-medium">
                      <th className="py-2.5 font-semibold">Order ID</th>
                      <th className="py-2.5 font-semibold">Customer</th>
                      <th className="py-2.5 font-semibold">Amount</th>
                      <th className="py-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {recentOrders.map((order, idx) => (
                      <tr key={order._id || idx} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 font-semibold text-stone-900">
                          <Link to="/orders" className="hover:underline text-stone-900">
                            {order.orderId || order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 text-stone-700 font-medium truncate max-w-[140px]">
                          {order.customer}
                        </td>
                        <td className="py-3 font-bold text-stone-900">
                          {order.formattedAmount || `₹${Number(order.amount || 0).toLocaleString('en-IN')}`}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${getOrderStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
