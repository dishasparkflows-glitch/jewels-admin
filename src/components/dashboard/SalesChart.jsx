import { useState } from 'react';
import { salesPerformance } from '../../data/dashboardData';
import { HiOutlineDotsVertical } from 'react-icons/hi';

const SalesChart = () => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { yTicks, points } = salesPerformance;

  // Coordinate calculations for SVG viewBox 0 0 600 220
  const width = 600;
  const height = 180;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxVal = 50000;

  const getCoordinates = (index, value) => {
    const x = paddingLeft + (index / (points.length - 1)) * innerWidth;
    const y = paddingTop + innerHeight - (value / maxVal) * innerHeight;
    return { x, y };
  };

  const coords = points.map((p, i) => getCoordinates(i, p.value));
  const pathD = coords.reduce((acc, curr, i) => {
    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-stone-900 text-base">Sales Analytics</h3>
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
            Annual Performance (₹)
          </p>
        </div>
        <button
          className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-50 transition-colors"
          aria-label="Options"
        >
          <HiOutlineDotsVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden">
        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full bg-stone-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg pointer-events-none transition-all duration-150"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 8}%`,
            }}
          >
            <p className="font-semibold">₹{hoveredPoint.value.toLocaleString()}</p>
            <p className="text-[9px] text-stone-400">{hoveredPoint.month}</p>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
        >
          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + (i / (yTicks.length - 1)) * innerHeight;
            return (
              <g key={tick}>
                <text
                  x={paddingLeft - 12}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-stone-400 text-[10px] font-medium"
                >
                  {tick}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1ede6"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* Area Fill under the Line */}
          <path
            d={`${pathD} L ${coords[coords.length - 1].x} ${paddingTop + innerHeight} L ${coords[0].x} ${paddingTop + innerHeight} Z`}
            fill="url(#bronzeGradient)"
            opacity="0.15"
          />

          {/* Bronze Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#8b6f4e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {coords.map((coord, i) => (
            <circle
              key={points[i].month}
              cx={coord.x}
              cy={coord.y}
              r={hoveredPoint?.month === points[i].month ? '5' : '3.5'}
              className="fill-[#8b6f4e] stroke-white stroke-2 cursor-pointer transition-all duration-200"
              onMouseEnter={() =>
                setHoveredPoint({ ...coord, month: points[i].month, value: points[i].value })
              }
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X-Axis Labels */}
          {coords.map((coord, i) => (
            <text
              key={`label-${points[i].month}`}
              x={coord.x}
              y={height - 8}
              textAnchor="middle"
              className="fill-stone-400 text-[11px] font-medium"
            >
              {points[i].month}
            </text>
          ))}

          {/* Linear Gradient Definition */}
          <defs>
            <linearGradient id="bronzeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b6f4e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b6f4e" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default SalesChart;
