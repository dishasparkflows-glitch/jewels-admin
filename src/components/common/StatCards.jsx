import React from 'react';

const colorStyles = {
  bronze: {
    bg: 'bg-[#faf3e8]',
    text: 'text-[#8b6f4e]',
    border: 'border-[#8b6f4e]/15',
  },
  green: {
    bg: 'bg-[#effaf2]',
    text: 'text-[#16a34a]',
    border: 'border-emerald-200/50',
  },
  peach: {
    bg: 'bg-[#fef6ee]',
    text: 'text-[#ea580c]',
    border: 'border-orange-200/50',
  },
  gold: {
    bg: 'bg-[#fcf5e5]',
    text: 'text-[#b45309]',
    border: 'border-amber-200/50',
  },
  blue: {
    bg: 'bg-[#eff6ff]',
    text: 'text-[#2563eb]',
    border: 'border-blue-200/50',
  },
};

export default function StatCards({ cards = [] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const color = colorStyles[card.color || 'bronze'] || colorStyles.bronze;

        return (
          <div
            key={card.label || idx}
            className="bg-white rounded-lg border border-stone-200/90 px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-shadow hover:shadow-xs"
          >
            {Icon && (
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center shrink-0 border ${color.border}`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[2]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-stone-500 truncate leading-none">
                {card.label}
              </p>
              <p className="text-base sm:text-lg font-bold text-stone-900 font-serif tracking-tight mt-0.5 truncate leading-none">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
