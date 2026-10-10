import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineEye, HiOutlineDotsVertical, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function RowActions({
  onView,
  onPreview,
  onEdit,
  onDelete,
  viewTitle = 'View Details',
  previewTitle,
  editTitle = 'Edit',
  editLabel,
  deleteTitle = 'Delete',
  deleteLabel,
  extraActions = [],
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleView = onView || onPreview;
  const activeViewTitle = previewTitle || viewTitle;
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
    <div className="inline-flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
      {/* View / Preview Action (Eye button) */}
      {handleView && (
        <button
          type="button"
          onClick={handleView}
          title={activeViewTitle}
          className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          <HiOutlineEye className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      )}

      {/* Edit Action (Pencil button - Soft Blue tint with vivid blue icon) */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={activeEditLabel}
          className="w-7 h-7 rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] hover:border-[#bfdbfe] active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          <HiOutlinePencil className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      )}

      {/* Delete Action (Trash button - Soft Red/Peach tint with vivid red icon) */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={activeDeleteLabel}
          className="w-7 h-7 rounded-lg border border-[#fee2e2] bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2] hover:border-[#fecaca] active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          <HiOutlineTrash className="w-3.5 h-3.5 stroke-[2]" />
        </button>
      )}

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
