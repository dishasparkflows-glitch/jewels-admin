import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineBell,
  HiOutlineMenu,
  HiOutlineCalendar,
} from 'react-icons/hi';

const Header = ({ onMobileToggle }) => {
  const { user } = useAuth();

  // Format today's date matching screenshot: e.g. "27 SEPT - TODAY"
  const todayFormatted = (() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return `${day} ${month} - TODAY`;
  })();

  return (
    <header className="sticky top-0 z-30 bg-[#fbfaf8]/95 backdrop-blur-md border-b border-stone-200/60 px-3 sm:px-5 h-11 sm:h-12 flex items-center justify-between">
      {/* Left: Mobile hamburger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          aria-label="Toggle Navigation"
        >
          <HiOutlineMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Date badge, notifications, Super Admin profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date pill badge from screenshot */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-stone-200 text-[11px] font-semibold text-stone-700 shadow-2xs cursor-pointer hover:bg-stone-50 transition-colors">
          <HiOutlineCalendar className="w-3.5 h-3.5 text-[#8b6f4e]" />
          <span>{todayFormatted}</span>
          <svg className="w-3 h-3 text-stone-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Notifications with badge '2' */}
        <button
          className="relative p-1.5 text-stone-500 hover:text-stone-800 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-stone-200/60 cursor-pointer"
          aria-label="Notifications"
        >
          <HiOutlineBell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            2
          </span>
        </button>

        {/* Super Admin User info */}
        <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-stone-200/60 cursor-pointer">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f4ece0] border border-[#e8d9c2] flex items-center justify-center font-bold text-xs text-[#8b6f4e] shadow-xs">
            {user?.firstName?.[0] || 'S'}
          </div>

          <div className="text-left hidden sm:block">
            <p className="text-[11px] sm:text-xs font-bold text-stone-900 leading-tight">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
            </p>
            <span className="text-[9px] uppercase tracking-wider font-bold text-stone-400 leading-tight block">
              {user?.role ? user.role.toUpperCase() : 'ADMIN'}
            </span>
          </div>

          <svg className="w-3 h-3 text-stone-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </header>
  );
};

export default Header;
