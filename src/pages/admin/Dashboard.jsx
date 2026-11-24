import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ModuleHeader from '../../components/common/ModuleHeader';
import { analyticsAPI, dashboardAPI } from '../../api/services';

const metrics = [
  { label: 'Products', path: '/catalog/jewelry-products' },
  { label: 'Categories', path: '/catalog/categories' },
  { label: 'Customers', path: '/customers' },
  { label: 'Reviews', path: '/reviews' },
];

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
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [salesData, setSalesData] = useState(null);
  const [loadingSales, setLoadingSales] = useState(true);
  const [revision, setRevision] = useState(0);

  // 'revenue' | 'orders' toggle for Sales Overview
  const [activeMetric, setActiveMetric] = useState('revenue');
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

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
          Categories: data.categories ?? data.Categories ?? 0,
          Customers: data.customers ?? data.Customers ?? 0,
          Reviews: data.reviews ?? data.Reviews ?? 0,
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
    analyticsAPI
      .getDashboardSales()
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

  // Donut chart arcs calculation
  const categorySales = salesData?.categorySales || [];
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
    <div className="space-y-6">
      <ModuleHeader
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Dashboard' }]}
        title="Overview"
        subtitle="Current records and live performance from your store."
      />

      {/* Top Count Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            to={metric.path}
            className="rounded-2xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <p className="text-sm font-medium text-stone-500">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-stone-900">
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Card 1: Sales Overview */}
        <div className="xl:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          {/* Card Header & Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">Sales Overview</h2>
            </div>

            {/* Segmented Control Pill */}
            <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveMetric('revenue')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  activeMetric === 'revenue'
                    ? 'bg-[#84562b] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setActiveMetric('orders')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  activeMetric === 'orders'
                    ? 'bg-[#84562b] text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Orders
              </button>
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
                No sales data recorded in the last 30 days.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Luxury Warm Brown Gradient Fill */}
                  <linearGradient id="salesOverviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b8864e" stopOpacity="0.28" />
                    <stop offset="60%" stopColor="#b8864e" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#b8864e" stopOpacity="0.00" />
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
                        className="text-[11px] font-medium fill-stone-500 select-none"
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
                    stroke="#b38249"
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
                          stroke="#b8864e"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      )}

                      {/* X-Axis Tick Label */}
                      <text
                        x={pt.x}
                        y={chartBottom + 20}
                        textAnchor="middle"
                        className="text-[11px] font-medium fill-stone-500 select-none"
                      >
                        {pt.label}
                      </text>

                      {/* Dot on Data Point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? '5' : '3.5'}
                        fill="#b38249"
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
                <div className="mt-0.5 text-amber-300">
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
        <div className="xl:col-span-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight mb-5">Sales by Category</h2>

            {loadingSales ? (
              <div className="h-60 w-full flex items-center justify-center text-stone-400 text-sm animate-pulse">
                Loading categories...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row xl:flex-row items-center justify-between gap-6">
                {/* SVG Donut Chart with Center Text */}
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
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
    </div>
  );
}
