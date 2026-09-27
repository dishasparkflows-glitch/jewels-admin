import { useState } from 'react';
import { weeklyOrderActivity } from '../../data/dashboardData';

const OrderActivityChart = () => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const maxVal = 10;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-bold text-stone-900 text-base">Order Activity</h3>
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
          Weekly Distribution
        </p>
      </div>

      {/* Bar Chart Area */}
      <div className="relative pt-6 pb-2">
        <div className="h-48 flex items-end justify-between gap-3 sm:gap-4 px-2">
          {weeklyOrderActivity.map((item) => {
            const heightPercent = item.count > 0 ? (item.count / maxVal) * 100 : 0;
            const isHovered = hoveredDay === item.day;

            return (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredDay(item.day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && item.count > 0 && (
                  <div className="mb-2 bg-stone-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap animate-fade-in">
                    {item.count} {item.count === 1 ? 'order' : 'orders'}
                  </div>
                )}

                {/* The Bar */}
                <div
                  className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                    item.count === 0
                      ? 'h-0'
                      : isHovered
                      ? 'bg-[#8b6f4e] shadow-md shadow-[#8b6f4e]/20'
                      : 'bg-[#ede5dc] hover:bg-[#8b6f4e]'
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: item.count > 0 ? '12px' : '0px',
                  }}
                />

                {/* Day Label */}
                <span
                  className={`text-[11px] font-medium mt-3 transition-colors ${
                    isHovered ? 'text-stone-900 font-semibold' : 'text-stone-400'
                  }`}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderActivityChart;
