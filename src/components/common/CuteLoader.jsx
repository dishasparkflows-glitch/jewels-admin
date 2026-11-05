/* eslint-disable react/prop-types */
import React from 'react';

/**
 * Sparkle Star SVG
 */
const SparkleStar = ({ className = "w-3 h-3 text-[#d4af37]" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

/**
 * Cute Diamond SVG with luxury faceted reflections
 */
const FacetedDiamond = ({ className = "w-9 h-9 text-[#8b6f4e]" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M6 3h12l4 6-10 12L2 9l4-6z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="rgba(212, 175, 55, 0.18)"
    />
    <path
      d="M12 21L7.5 9h9L12 21z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="rgba(139, 111, 78, 0.22)"
    />
    <path
      d="M2 9h20M6 3l1.5 6M18 3l-1.5 6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Cute Luxury Diamond Loader
 * 
 * @param {string} variant - 'page' | 'table' | 'inline' | 'fullscreen'
 * @param {string} text - Primary label (e.g. 'Loading metal colors...')
 * @param {string} subtext - Optional secondary reassurance text
 * @param {number} colSpan - For table rows (default: 6)
 * @param {string} className - Extra container classes
 */
export default function CuteLoader({
  variant = 'page',
  text = 'Polishing fine jewels...',
  subtext,
  colSpan = 6,
  className = '',
}) {
  const content = (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* ─── Glowing Diamond & Twinkling Sparkles ─── */}
      <div className="relative flex items-center justify-center mb-3">
        {/* Soft breathing golden halo aura */}
        <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#faf3e8] via-[#f7ecd9] to-[#faedd8] border border-[#ecd9c2] shadow-[0_4px_20px_rgba(212,175,55,0.18)] animate-cute-halo" />

        {/* Top-Right Sparkle */}
        <div className="absolute -top-1.5 -right-2 animate-cute-twinkle">
          <SparkleStar className="w-4 h-4 text-[#d4af37] drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]" />
        </div>

        {/* Bottom-Left Sparkle */}
        <div className="absolute -bottom-1 -left-2.5 animate-cute-twinkle-delay">
          <SparkleStar className="w-3.5 h-3.5 text-[#b76e79] drop-shadow-[0_0_5px_rgba(183,110,121,0.6)]" />
        </div>

        {/* Floating Faceted Diamond */}
        <div className="relative z-10 animate-cute-bob flex items-center justify-center p-3">
          <FacetedDiamond className="w-8 h-8 sm:w-10 sm:h-10 text-[#8b6f4e] filter drop-shadow-[0_2px_4px_rgba(139,111,78,0.25)]" />
        </div>
      </div>

      {/* ─── Cute Shimmering Pill Badge ─── */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#ecd9c2] shadow-2xs backdrop-blur-xs">
        <span className="text-[11.5px] sm:text-xs font-semibold text-stone-800 tracking-wide">
          {text}
        </span>

        {/* 3 Cute Bouncing Dots */}
        <span className="inline-flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f4e] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f4e] animate-bounce" />
        </span>
      </div>

      {/* Optional Subtext */}
      {subtext && (
        <span className="text-[10.5px] text-stone-400 font-medium mt-1.5 tracking-normal">
          {subtext}
        </span>
      )}
    </div>
  );

  // Variant 1: Table row wrapper
  if (variant === 'table') {
    return (
      <tr>
        <td colSpan={colSpan} className="py-12 sm:py-16 text-center bg-white/40">
          {content}
        </td>
      </tr>
    );
  }

  // Variant 2: Fullscreen overlay
  if (variant === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-stone-900/25 backdrop-blur-xs animate-fadeIn">
        <div className="p-6 bg-white/95 rounded-3xl border border-stone-200/80 shadow-2xl animate-scaleUp">
          {content}
        </div>
      </div>
    );
  }

  // Variant 3: Inline compact
  if (variant === 'inline') {
    return <div className="py-4">{content}</div>;
  }

  // Default: Page view container (for Suspense and view loading)
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6 sm:p-12 w-full">
      {content}
    </div>
  );
}

