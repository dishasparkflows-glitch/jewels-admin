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
  rose: {
    bg: 'bg-[#fff1f2]',
    text: 'text-[#e11d48]',
    border: 'border-rose-200/50',
  },
  purple: {
    bg: 'bg-[#faf5ff]',
    text: 'text-[#9333ea]',
    border: 'border-purple-200/50',
  },
};

export default function StatCards({ cards = [] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const color = colorStyles[card.color || 'bronze'] || colorStyles.bronze;
        const isClickable = Boolean(card.onClick);

        return (
          <div
            key={card.label || idx}
            onClick={card.onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            className={`bg-white rounded-lg border px-3 py-1.5 sm:py-2 shadow-2xs flex items-center gap-2.5 transition-all ${
              card.active
                ? 'border-[#8b6f4e] ring-1 ring-[#8b6f4e]/30'
                : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
            } ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''}`}
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
              <p className="text-base sm:text-lg font-bold text-stone-900 tracking-tight mt-0.5 truncate leading-none">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
