import { useState, useRef, useEffect } from 'react';
import {
  HiOutlineDotsVertical,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
} from 'react-icons/hi';

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

export function ViewActionButton({
  onClick,
  title = 'View Details',
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
      className={`w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf5ed] text-[#8b6f4e] hover:bg-[#f3ece0] hover:text-[#735839] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <HiOutlineEye className={iconClassName} />
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

export function StatusActionButton({
  status = 'approved',
  onClick,
  title,
  loading = false,
  className = '',
  iconClassName = 'w-3.5 h-3.5 stroke-[2.5]',
  disabled = false,
  ...props
}) {
  const normStatus = String(status || 'approved').toLowerCase();
  const isApproved = normStatus === 'approved';
  const isRejected = normStatus === 'rejected';

  const defaultTitle = isApproved
    ? 'Status: Approved (Click to change)'
    : isRejected
    ? 'Status: Rejected (Click to change)'
    : 'Status: Pending (Click to change)';

  return (
    <button
      type="button"
      onClick={onClick}
      title={title || defaultTitle}
      disabled={disabled || loading}
      className={`w-7 h-7 rounded-lg border inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
        isApproved
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300'
          : isRejected
          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:border-rose-300'
          : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:border-amber-300'
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isApproved ? (
        <HiOutlineCheck className={iconClassName} />
      ) : isRejected ? (
        <HiOutlineX className={iconClassName} />
      ) : (
        <HiOutlineClock className="w-3.5 h-3.5 stroke-[2]" />
      )}
    </button>
  );
}

export default function RowActions({
  onView,
  onOpenWebsite,
  onEdit,
  onDelete,
  viewTitle = 'View Details',
  websiteTitle = 'View on store',
  editTitle = 'Edit',
  editLabel,
  deleteTitle = 'Delete',
  deleteLabel,
  extraActions = [],
  beforeActions,
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

      {/* View Action (Eye button - Soft gold/amber tint with #8b6f4e icon) */}
      {onView && !onEdit && (
        <ViewActionButton onClick={onView} title={viewTitle} />
      )}

      {/* Before / Leading Actions (e.g. Status toggle, Approve/Reject dropdown) */}
      {beforeActions}

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
