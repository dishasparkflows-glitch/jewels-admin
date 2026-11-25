import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineX, HiOutlineArrowRight } from 'react-icons/hi';
import { navSections } from '../../config/navigation';
import { resolveNavSections } from '../../utils/moduleAccess';
import { useAuth } from '../../contexts/AuthContext';

// Extra keyword mappings to make searching as intuitive and friendly as possible
const EXTRA_ALIASES = {
  '/orders': ['order', 'orders', 'sales', 'purchases', 'checkout', 'transactions', 'shipping'],
  '/returns': ['return', 'returns', 'refund', 'refunds', 'exchange', 'rma'],
  '/custom-inquiries': ['custom', 'inquiries', 'inquiry', 'custom design', 'bespoke', 'requests'],
  '/cod-sequences': ['cod', 'cash on delivery', 'sequence', 'cod sequence'],
  '/catalog/jewelry-products': ['jewelry', 'jewellery', 'gold', 'products', 'product list', 'rings', 'necklaces', 'earrings'],
  '/catalog/silver-products': ['silver', 'silver products', '925', 'silver jewellery'],
  '/catalog/ornate-products': ['ornate', 'erp', 'sync', 'ornate products'],
  '/diamonds': ['diamond', 'diamonds', 'loose diamonds', 'carat', 'solitaire', 'stock'],
  '/catalog/categories': ['category', 'categories', 'collections', 'subcategories'],
  '/catalog/category-filters': ['filter', 'filters', 'category filters', 'facets'],
  '/catalog/navigation-menus': ['navigation', 'menus', 'navbar', 'header menu'],
  '/pricing-hub/metal-rates': ['metal rates', 'gold rate', 'silver rate', 'gold price', 'pricing', 'live rates'],
  '/pricing-hub/diamond-rates': ['diamond rates', 'diamond price', 'pricing matrix', 'carat rate'],
  '/currencies': ['currency', 'currencies', 'exchange rates', 'forex', 'usd', 'inr', 'aed'],
  '/metal-purity': ['metal purity', 'purity', 'karat', '14k', '18k', '22k', '24k', '925'],
  '/metal-color': ['metal color', 'color', 'rose gold', 'white gold', 'yellow gold', 'tones'],
  '/sizes': ['sizes', 'size', 'ring size', 'bangles', 'bracelets', 'sizing engine'],
  '/vto-masters': ['vto', 'virtual try on', 'try-on', 'camera', '3d', 'ar'],
  '/diamond-types': ['diamond types', 'lab grown', 'natural diamond'],
  '/diamond-shapes': ['diamond shapes', 'shapes', 'round', 'oval', 'pear', 'emerald cut', 'princess', 'cushion'],
  '/diamond-color': ['diamond color', 'd-f', 'g-h', 'i-j', 'fancy color'],
  '/diamond-clarity': ['diamond clarity', 'clarity', 'vvs', 'vs', 'si', 'if', 'flawless'],
  '/diamond-size': ['diamond size', 'pointer', 'carat size', 'mm'],
  '/gemstone-types': ['gemstone types', 'gemstone', 'ruby', 'sapphire', 'emerald', 'amethyst', 'topaz', 'stone'],
  '/gemstone-shapes': ['gemstone shapes', 'gem shape', 'cuts'],
  '/customers': ['customers', 'users', 'clients', 'buyer', 'accounts'],
  '/appointments': ['appointments', 'appointment', 'booking', 'virtual appointment', 'schedule', 'calendar'],
  '/reviews': ['reviews', 'ratings', 'feedback', 'testimonials', 'stars'],
  '/home-sections': ['home sections', 'homepage', 'sections', 'hero', 'layout'],
  '/banners': ['banners', 'banner', 'slider', 'carousel', 'promo banner'],
  '/celebrate-gifts': ['celebrate', 'gifts', 'celebrate & gifts', 'gifting', 'featured'],
  '/coupons': ['coupons', 'coupon', 'offers', 'offer', 'discounts', 'discount', 'promo code', 'voucher'],
  '/birthstones': ['birthstones', 'birthstone', 'months'],
  '/marketing/before-after': ['before after', 'lookare', 'transformation'],
  '/gallery': ['gallery', 'media gallery', 'media', 'photos', 'images', 'assets', 'uploads'],
  '/themes': ['themes', 'theme', 'color scheme', 'media mapping', 'appearance'],
  '/instagram-posts': ['instagram', 'insta', 'social media', 'feed'],
  '/blogs': ['blogs', 'blog articles', 'articles', 'posts', 'news'],
  '/blog-categories': ['blog categories', 'article topics'],
  '/static-pages': ['static pages', 'about us', 'terms', 'privacy policy', 'faq', 'pages'],
  '/reports': ['reports', 'analytics', 'sales report', 'charts', 'revenue'],
  '/system/whatsapp': ['whatsapp', 'whatsapp connect', 'chat', 'messaging'],
  '/owners': ['owner', 'owners', 'client', 'clients', 'website owners', 'database url', 'modules', 'access', 'permissions'],
  '/profile': ['profile', 'user profile', 'account', 'password', 'theme settings'],
  '/settings': ['settings', 'store settings', 'config', 'logo', 'general settings'],
};

// Flatten navSections into a normalized list
function buildSearchIndex(dbModules = null, allowedModules = null) {
  const list = [];
  const seenPaths = new Set();
  const sections = resolveNavSections(navSections, dbModules, allowedModules);

  sections.forEach((section) => {
    const sectionTitle = section.title || 'General';
    (section.items || []).forEach((item) => {
      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => {
          if (!seenPaths.has(child.path)) {
            seenPaths.add(child.path);
            list.push({
              id: child.id,
              title: child.title,
              path: child.path,
              icon: child.icon || item.icon,
              section: sectionTitle,
              category: item.title,
              aliases: EXTRA_ALIASES[child.path] || [],
            });
          }
        });
      } else {
        if (!seenPaths.has(item.path)) {
          seenPaths.add(item.path);
          list.push({
            id: item.id,
            title: item.title,
            path: item.path,
            icon: item.icon,
            section: sectionTitle,
            category: null,
            aliases: EXTRA_ALIASES[item.path] || [],
          });
        }
      }
    });
  });

  return list;
}

export default function AdminMenuSearch() {
  const navigate = useNavigate();
  const { allowedModules, dbModules } = useAuth();
  const searchIndex = useMemo(() => buildSearchIndex(dbModules, allowedModules), [dbModules, allowedModules]);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter items matching query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return searchIndex
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const sectionLower = item.section.toLowerCase();
        const categoryLower = (item.category || '').toLowerCase();
        const aliases = item.aliases || [];

        let score = 0;
        if (titleLower === q) score = 100;
        else if (titleLower.startsWith(q)) score = 80;
        else if (aliases.some((a) => a === q)) score = 75;
        else if (aliases.some((a) => a.startsWith(q))) score = 65;
        else if (titleLower.includes(q)) score = 50;
        else if (aliases.some((a) => a.includes(q))) score = 40;
        else if (categoryLower.includes(q) || sectionLower.includes(q)) score = 20;

        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query, searchIndex]);

  // Handle redirect to selected item
  const handleSelect = useCallback(
    (item) => {
      if (!item?.path) return;
      navigate(item.path);
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [navigate]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle keys in search input (ArrowDown, ArrowUp, Enter, Escape)
  const handleInputKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults.length > 0) {
        const target = filteredResults[highlightedIndex] || filteredResults[0];
        handleSelect(target);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative flex-1 min-w-0 sm:max-w-sm md:max-w-md" ref={containerRef}>
      {/* Input Box */}
      <div className="relative flex items-center">
        <span className="absolute left-3 pointer-events-none text-stone-400">
          <HiOutlineSearch className="w-4 h-4 stroke-[2]" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search menu or page..."
          className="w-full h-9 pl-9 pr-8 md:pr-14 text-xs font-medium text-stone-900 bg-stone-50 hover:bg-stone-100/70 focus:bg-white border border-stone-200/90 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all shadow-2xs placeholder:text-stone-400"
          aria-label="Search admin menu"
          aria-autocomplete="list"
        />

        {/* Right side inside input: Clear button OR Ctrl+K badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono font-semibold text-stone-400 bg-stone-100 border border-stone-200/90 rounded-md select-none pointer-events-none">
              Ctrl K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && query.trim() && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-0 top-14 sm:top-auto sm:mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scaleUp py-1.5">
          {filteredResults.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                <span>Navigation Menus</span>
                <span>Press Enter ↵ to open</span>
              </div>
              {filteredResults.map((item, idx) => {
                const isSelected = idx === highlightedIndex;
                const Icon = item.icon || HiOutlineArrowRight;
                return (
                  <button
                    key={item.id + item.path}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#faf5ed] text-stone-900' : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                        isSelected
                          ? 'border-[#ebdcc9] bg-white text-[#8b6f4e]'
                          : 'border-stone-200 bg-stone-50 text-stone-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 stroke-[2]" />
                    </div>

                    {/* Title & Section breadcrumb */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate flex items-center gap-1">
                        <span>{item.section}</span>
                        {item.category && item.category !== item.title && (
                          <>
                            <span>›</span>
                            <span>{item.category}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Action Arrow */}
                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-stone-400">
                      <span className="font-mono text-[10px] text-stone-400 hidden sm:inline">{item.path}</span>
                      <HiOutlineArrowRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected ? 'translate-x-0.5 text-[#8b6f4e]' : 'opacity-40'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-stone-500">
              <p className="font-semibold text-stone-700">No menu or page found for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px] text-stone-400 mt-1">Try searching for &quot;Orders&quot;, &quot;Products&quot;, &quot;Diamonds&quot;, or &quot;Settings&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
