import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineUserAdd,
  HiOutlineExternalLink,
  HiOutlineMailOpen,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAdminPageSize } from '../../utils/adminPagination';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import Dropdown from '../../components/common/Dropdown';
import MobileGridList from '../../components/common/MobileGridList';
import Pagination from '../../components/common/Pagination';
import TableSrNo from '../../components/common/TableSrNo';
import { DeleteActionButton } from '../../components/common/RowActions';

const TYPE_STYLES = {
  info: 'bg-blue-50 text-blue-700 border-blue-200/80',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
  error: 'bg-rose-50 text-rose-700 border-rose-200/80',
};

function notifyHeaderUpdate() {
  window.dispatchEvent(new CustomEvent('notifications:updated'));
}

export default function NotificationsView() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize('notifications', 10);
  const [totalItems, setTotalItems] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (statusFilter === 'unread') params.isRead = 'false';
      if (statusFilter === 'read') params.isRead = 'true';
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search.trim()) params.search = search.trim();

      const res = await notificationsAPI.getAll(params);
      const payload = res.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      const pagination = payload.pagination || {};

      setNotifications(list);
      setTotalItems(Number(pagination.total ?? list.length));
      if (typeof payload.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      } else {
        const countRes = await notificationsAPI.getUnreadCount().catch(() => null);
        setUnreadCount(countRes?.data?.data?.count ?? 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications, search]);

  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, statusFilter, typeFilter, search]);

  const handleMarkAsRead = async (notif, e) => {
    e?.stopPropagation?.();
    if (!notif?._id || notif.isRead) return;
    try {
      await notificationsAPI.markAsRead(notif._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyHeaderUpdate();
      toast.success('Marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      );
      setUnreadCount(0);
      notifyHeaderUpdate();
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notif, e) => {
    e?.stopPropagation?.();
    const ok = await confirm({
      title: 'Delete Notification',
      message: `Remove "${notif.title}"?`,
      confirmText: 'Delete',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await notificationsAPI.delete(notif._id);
      toast.success('Notification deleted');
      notifyHeaderUpdate();
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    const ok = await confirm({
      title: 'Delete Selected Notifications',
      message: `Delete ${selectedIds.length} selected notification(s)?`,
      confirmText: 'Delete Selected',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await notificationsAPI.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} notification(s) deleted`);
      setSelectedIds([]);
      notifyHeaderUpdate();
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notifications');
    }
  };

  const handleOpenNotification = async (notif) => {
    if (!notif.isRead) {
      await notificationsAPI.markAsRead(notif._id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      notifyHeaderUpdate();
    }
    if (notif.metadata?.link) {
      navigate(notif.metadata.link);
    }
  };

  const allSelected =
    notifications.length > 0 && notifications.every((n) => selectedIds.includes(n._id));

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(notifications.map((n) => n._id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const newUserCount = useMemo(
    () => notifications.filter((n) => n.metadata?.event === 'user_registered').length,
    [notifications]
  );

  const readCount = Math.max(0, totalItems - unreadCount);

  const statCardsData = [
    {
      label: 'Notifications',
      value: totalItems,
      icon: HiOutlineBell,
      color: 'bronze',
      active: statusFilter === 'all',
      onClick: () => {
        setStatusFilter('all');
        setCurrentPage(1);
      },
    },
    {
      label: 'Unread',
      value: unreadCount,
      icon: HiOutlineMailOpen,
      color: 'rose',
      active: statusFilter === 'unread',
      onClick: () => {
        setStatusFilter('unread');
        setCurrentPage(1);
      },
    },
    {
      label: 'Read',
      value: readCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
      active: statusFilter === 'read',
      onClick: () => {
        setStatusFilter('read');
        setCurrentPage(1);
      },
    },
    {
      label: 'New Users (Page)',
      value: newUserCount,
      icon: HiOutlineUserAdd,
      color: 'blue',
    },
  ];

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Notifications"
        subtitle="Stay updated on new user registrations, customer activity, and system alerts."
        extraActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
            >
              <HiOutlineRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 transition-all cursor-pointer"
              >
                <HiOutlineCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        }
      />

      <StatCards cards={statCardsData} />

      {/* Filter Pills + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'read', label: 'Read' },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                style={active ? { backgroundColor: 'var(--theme-primary, #8b6f4e)', borderColor: 'var(--theme-primary, #8b6f4e)' } : undefined}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  active
                    ? 'text-white shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <HiOutlineTrash className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <SearchFilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          placeholder="Search notifications, customer name or email..."
          extraActions={
            <Dropdown
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'info', label: 'Info' },
                { value: 'success', label: 'Success' },
                { value: 'warning', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ]}
              size="sm"
              buttonClassName="h-[42px] min-w-[130px] rounded-xl text-xs font-semibold bg-white border border-stone-200"
            />
          }
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading notifications..."
          isEmpty={notifications.length === 0}
          emptyText="No notifications found."
          items={notifications}
          showSelectAll
          allSelected={allSelected}
          onSelectAll={toggleSelectAll}
          renderCard={(notif, idx) => {
            const isSelected = selectedIds.includes(notif._id);
            const srNo = (currentPage - 1) * pageSize + idx + 1;
            const typeBadgeClass = TYPE_STYLES[notif.type] || TYPE_STYLES.info;

            return (
              <div
                key={notif._id}
                onClick={() => handleOpenNotification(notif)}
                className={`rounded-xl border p-3.5 transition-all cursor-pointer space-y-2.5 ${
                  !notif.isRead
                    ? 'border-[#8b6f4e]/40 bg-[#faf6f0]/60'
                    : isSelected
                    ? 'border-[#8b6f4e]/60 bg-[#faf6f0]/40'
                    : 'border-stone-200/90 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelectOne(notif._id)}
                      style={{ accentColor: 'var(--theme-primary, #8b6f4e)' }}
                      className="w-3.5 h-3.5 mt-0.5 rounded border-stone-300 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-stone-400">#{srNo}</span>
                        <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-stone-900' : 'font-semibold text-stone-700'}`}>
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${typeBadgeClass}`}>
                    {notif.type || 'info'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-400">{formatRelativeTime(notif.sendAt)}</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif, e)}
                        className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[10px] font-semibold text-stone-700 cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                    <DeleteActionButton onClick={(e) => handleDelete(notif, e)} title="Delete notification" />
                  </div>
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#faf8f5] border-b border-stone-200/80 text-[10.5px] font-bold uppercase tracking-wider text-stone-500">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ accentColor: 'var(--theme-primary, #8b6f4e)' }}
                    className="w-3.5 h-3.5 rounded border-stone-300 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3 text-center w-14 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-4 whitespace-nowrap">NOTIFICATION</th>
                <th className="py-3 px-4 whitespace-nowrap">TYPE</th>
                <th className="py-3 px-4 whitespace-nowrap">TIME</th>
                <th className="py-3 px-4 whitespace-nowrap text-center">STATUS</th>
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-stone-400 text-xs">
                    Loading notifications...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-stone-400 text-xs">
                    No notifications found.
                  </td>
                </tr>
              ) : (
                notifications.map((notif, idx) => {
                  const isSelected = selectedIds.includes(notif._id);
                  const typeBadgeClass = TYPE_STYLES[notif.type] || TYPE_STYLES.info;

                  return (
                    <tr
                      key={notif._id}
                      onClick={() => handleOpenNotification(notif)}
                      className={`transition-colors cursor-pointer ${
                        !notif.isRead
                          ? 'bg-[#faf6f0]/55 hover:bg-[#faf4ea]'
                          : 'hover:bg-stone-50/70'
                      }`}
                    >
                      <td className="py-3.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(notif._id)}
                          style={{ accentColor: 'var(--theme-primary, #8b6f4e)' }}
                          className="w-3.5 h-3.5 rounded border-stone-300 cursor-pointer"
                        />
                      </td>

                      <TableSrNo
                        currentPage={currentPage}
                        pageSize={pageSize}
                        index={idx}
                        className="py-3.5 px-3 text-center text-xs font-semibold text-stone-500 whitespace-nowrap"
                      />

                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-start gap-2.5">
                          {notif.metadata?.event === 'user_registered' && (
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                              <HiOutlineUserAdd className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`text-xs leading-snug ${!notif.isRead ? 'font-bold text-stone-900' : 'font-semibold text-stone-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeBadgeClass}`}>
                          {notif.type || 'info'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-xs font-medium text-stone-700">{formatRelativeTime(notif.sendAt)}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{formatDateTime(notif.sendAt)}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            notif.isRead
                              ? 'bg-stone-100 text-stone-600 border-stone-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {notif.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>

                      <td className="py-3.5 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {notif.metadata?.link && (
                            <button
                              type="button"
                              onClick={() => handleOpenNotification(notif)}
                              title="Open related page"
                              className="p-1.5 rounded-lg border border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <HiOutlineExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!notif.isRead && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(notif, e)}
                              title="Mark as read"
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <HiOutlineCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <DeleteActionButton onClick={(e) => handleDelete(notif, e)} title="Delete notification" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          itemLabel="notifications"
        />
      </div>
    </div>
  );
}
