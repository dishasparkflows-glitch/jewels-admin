import PropTypes from 'prop-types';

/**
 * Reusable, luxury-styled Tooltip component with smooth transitions and caret arrow
 *
 * @param {string|ReactNode} content - Text or node to show inside tooltip
 * @param {'top'|'bottom'|'left'|'right'} position - Placement of the tooltip (default: 'bottom')
 * @param {ReactNode} children - Target element trigger
 * @param {string} className - Optional container styling
 */
export default function Tooltip({
  content,
  position = 'bottom',
  children,
  className = '',
}) {
  if (!content) return children;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r',
    bottom: '-top-1 left-1/2 -translate-x-1/2 border-t border-l',
    left: '-right-1 top-1/2 -translate-y-1/2 border-t border-r',
    right: '-left-1 top-1/2 -translate-y-1/2 border-b border-l',
  };

  return (
    <div className={`relative inline-flex items-center group/tooltip ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`absolute z-50 pointer-events-none transition-all duration-150 ease-out opacity-0 scale-95 group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 ${
          positionClasses[position] || positionClasses.bottom
        }`}
      >
        <div className="relative bg-stone-900 text-white text-[11px] font-medium tracking-wide px-2.5 py-1.5 rounded-lg shadow-xl border border-stone-800/90 whitespace-nowrap flex items-center gap-1.5 select-none">
          {content}
          <span
            className={`absolute w-2 h-2 bg-stone-900 border-stone-800/90 rotate-45 ${
              arrowClasses[position] || arrowClasses.bottom
            }`}
          />
        </div>
      </div>
    </div>
  );
}

Tooltip.propTypes = {
  content: PropTypes.node,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};
