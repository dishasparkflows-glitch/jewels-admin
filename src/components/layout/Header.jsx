import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineSearch,
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineCalendar,
} from 'react-icons/hi';

const Header = ({ onMobileToggle }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Format today's date matching screenshot: e.g. "27 SEPT - TODAY"
  const todayFormatted = (() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${day} ${month} - TODAY`;
  })();

  return (
    <header className="sticky top-0 z-30 bg-[#fbfaf8]/95 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-8 h-20 flex items-center justify-between">
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          aria-label="Toggle Navigation"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md">
          <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, orders, customers..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-stone-200/80 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          />
        </div>
      </div>

      {/* Right: Date badge, notifications, Super Admin profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Date pill badge from screenshot */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#faf5ed] border border-[#e8d8c0] text-[11px] font-bold text-[#8b6f4e] tracking-wider uppercase shadow-xs">
          <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8b6f4e]" />
          <span>{todayFormatted}</span>
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 text-stone-400 hover:text-stone-700 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-stone-200/60"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#fbfaf8]" />
        </button>

        {/* Super Admin User info */}
        <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-stone-200/60">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-stone-900 leading-tight">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
            </p>
            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400">
              {user?.role ? user.role.toUpperCase() : 'ADMIN'}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#f4ece0] border border-[#e8d9c2] flex items-center justify-center font-bold text-xs text-[#8b6f4e] shadow-sm">
            {user?.firstName?.[0] || 'S'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
