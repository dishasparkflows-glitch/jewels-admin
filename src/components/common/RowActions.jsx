import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash, HiOutlineExternalLink } from 'react-icons/hi';

export function EditActionButton({
  onClick,
  title = 'Edit',
  className = '',
  iconClassName = 'w-3.5 h-3.5 stroke-[2]',
  disabled = false,
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] hover:border-[#bfdbfe] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <HiOutlinePencil className={iconClassName} />
    </button>
  );
}

export function DeleteActionButton({
  onClick,
  title = 'Delete',
  className = '',
  iconClassName = 'w-3.5 h-3.5 stroke-[2]',
  disabled = false,
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 rounded-lg border border-[#fadbd8] bg-[#fdeeed] text-[#d93025] hover:bg-[#fadbd8] hover:border-[#f5b7b1] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <HiOutlineTrash className={iconClassName} />
    </button>
  );
}

// Deprecated no-op export so any leftover import does not break
export function ViewActionButton() {
  return null;
}

export default function RowActions({
  onView,
  onPreview,
  onOpenWebsite,
  onEdit,
  onDelete,
  viewTitle = 'View Details',
  previewTitle,
  websiteTitle = 'View on store',
  editTitle = 'Edit',
  editLabel,
  deleteTitle = 'Delete',
  deleteLabel,
  extraActions = [],
  children,
  className = '',
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const activeEditLabel = editLabel || editTitle;
  const activeDeleteLabel = deleteLabel || deleteTitle;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`inline-flex items-center gap-1.5 justify-end ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* View on Store / Website Action */}
      {onOpenWebsite && (
        <button
          type="button"
          onClick={onOpenWebsite}
          title={websiteTitle}
          aria-label={websiteTitle}
          className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-white text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      )}

      {/* Edit Action (Pencil button - Soft Blue tint with vivid blue icon) */}
      {onEdit && (
        <EditActionButton onClick={onEdit} title={activeEditLabel} />
      )}

      {/* Delete Action (Trash button - Soft warm rose with vivid red icon) */}
      {onDelete && (
        <DeleteActionButton onClick={onDelete} title={activeDeleteLabel} />
      )}

      {/* Any inline children actions */}
      {children}

      {/* Extra Actions (Three dots button) */}
      {extraActions && extraActions.length > 0 && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            title="More actions"
            className="w-6.5 h-6.5 rounded-md border border-stone-200/90 bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-50 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            <HiOutlineDotsVertical className="w-3.5 h-3.5 stroke-[1.8]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-32 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-40 animate-fadeIn text-left">
              {extraActions.map((action, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    action.onClick?.();
                  }}
                  className="w-full px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {action.icon && <action.icon className="w-3 h-3 text-stone-400" />}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
