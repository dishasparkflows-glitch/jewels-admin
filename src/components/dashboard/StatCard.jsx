const StatCard = ({ label, value, change, subtext, icon: Icon }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-stone-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-stone-400 tracking-wider uppercase">
            {label}
          </p>
          <p className="text-2xl font-bold text-stone-900 tracking-tight">
            {value}
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
              <span className="text-[9px]">▲</span> {change}
            </span>
            <span className="text-stone-400 font-normal">{subtext}</span>
          </div>
        </div>

        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[#faf8f5] border border-stone-200/60 flex items-center justify-center text-stone-500 flex-shrink-0">
            <Icon className="w-5 h-5 text-stone-600 stroke-[1.7]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
