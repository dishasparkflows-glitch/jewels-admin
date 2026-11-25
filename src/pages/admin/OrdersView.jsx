import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineShoppingBag,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineTag,
  HiOutlineExternalLink,
  HiOutlineDocumentDownload,
  HiOutlineDocumentText,
  HiOutlineMail,
  HiOutlinePaperAirplane,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineXCircle,
  HiOutlineReply,
} from 'react-icons/hi';
import { IoLogoWhatsapp } from 'react-icons/io5';
import { ShiprocketDispatchModal, ShiprocketTrackingModal } from '../../components/common/ShiprocketModals';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import useDebounce from '../../hooks/useDebounce';
import { useAdminPageSize } from '../../utils/adminPagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import { getMediaUrl } from '../../utils/imageUrl';

const ORDER_TABS = [
  { key: 'all', label: 'ALL ORDERS' },
  { key: 'pending', label: 'PENDING' },
  { key: 'processing', label: 'PROCESSING' },
  { key: 'shipped', label: 'SHIPPED' },
  { key: 'delivered', label: 'DELIVERED' },
  { key: 'cancelled', label: 'CANCELLED' },
  { key: 'returned', label: 'RETURNED' },
];

export default function OrdersView() {
  const confirm = useConfirm();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [orderStatusTab, setOrderStatusTab] = useState('all');
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewingOrder, setViewingOrder] = useState(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Shiprocket states
  const [shiprocketDispatchOpen, setShiprocketDispatchOpen] = useState(false);
  const [shiprocketTrackingOpen, setShiprocketTrackingOpen] = useState(false);
  const [shiprocketTrackingOrderId, setShiprocketTrackingOrderId] = useState(null);

  // Mark as Delivered with Typed Confirmation state
  const [markDeliveredOrder, setMarkDeliveredOrder] = useState(null);
  const [typedConfirmText, setTypedConfirmText] = useState('');

  // Invoice Dispatch State
  const [showInvoiceDispatch, setShowInvoiceDispatch] = useState(false);
  const [invoiceMethods, setInvoiceMethods] = useState(['email', 'whatsapp']);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  // Lock body scroll when viewingOrder modal is open
  useEffect(() => {
    if (viewingOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingOrder]);

  // Send Invoice Handler
  const handleSendInvoice = async () => {
    if (!viewingOrder?._id) return;
    if (invoiceMethods.length === 0) {
      toast.error('Please select at least one delivery method (Email or WhatsApp).');
      return;
    }

    try {
      setSendingInvoice(true);
      const res = await api.post('/orders/send-invoice', {
        id: viewingOrder._id,
        methods: invoiceMethods,
      });

      const dispatched = res.data?.data?.dispatched || invoiceMethods;
      toast.success(`Invoice dispatched successfully via ${dispatched.join(' & ')}! ✨`);
      setShowInvoiceDispatch(false);
    } catch (err) {
      console.error('Invoice dispatch failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to dispatch invoice');
    } finally {
      setSendingInvoice(false);
    }
  };

  // Download Invoice Handler
  const handleDownloadInvoice = async (order = viewingOrder) => {
    if (!order?._id) return;
    try {
      setDownloadingInvoice(true);
      const res = await api.get(`/orders/${order._id}/invoice`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeOrderNum = (order.orderNumber || 'ORD').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `NEIRAH_INVOICE_${safeOrderNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully! 📄');
    } catch (err) {
      console.error('Failed to download invoice:', err);
      toast.error('Could not download invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  // Pagination hook with serverTotal
  const {
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    totalItems,
  } = usePagination(orders, pageSize, serverTotal);

  // Fetch orders from API with server-side pagination
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize,
      };
      if (orderStatusTab && orderStatusTab !== 'all') {
        params.status = orderStatusTab;
      }
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      const res = await api.get('/orders', { params });
      const list = res.data?.data?.items || res.data?.data || res.data?.orders || [];
      setOrders(Array.isArray(list) ? list : []);

      const pagination = res.data?.data?.pagination || res.data?.pagination;
      if (pagination?.totalDocs !== undefined) {
        setServerTotal(pagination.totalDocs);
      } else if (pagination?.total !== undefined) {
        setServerTotal(pagination.total);
      } else {
        setServerTotal(Array.isArray(list) ? list.length : 0);
      }

      if (res.data?.data?.counts) {
        setStatusCounts(res.data.data.counts);
      } else if (orderStatusTab === 'all' && Array.isArray(list)) {
        const counts = { all: list.length, total: list.length, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 };
        list.forEach((ord) => {
          const st = String(ord.orderStatus || ord.status || '').toLowerCase();
          if (st === 'pending') counts.pending += 1;
          else if (st === 'processing' || st === 'accepted' || st === 'confirmed') counts.processing += 1;
          else if (st === 'shipped' || st === 'out_for_delivery') counts.shipped += 1;
          else if (st === 'delivered') counts.delivered += 1;
          else if (st === 'cancelled') counts.cancelled += 1;
          else if (st === 'returned') counts.returned += 1;
        });
        setStatusCounts(counts);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders from database');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, orderStatusTab, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 6 status-wise stat cards matching the status tabs
  const statCardsData = useMemo(() => {
    return [
      {
        id: 'pending',
        label: 'Pending',
        value: statusCounts.pending ?? 0,
        icon: HiOutlineClock,
        color: 'gold',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'pending' ? 'all' : 'pending'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'pending',
      },
      {
        id: 'processing',
        label: 'Processing',
        value: statusCounts.processing ?? 0,
        icon: HiOutlineRefresh,
        color: 'blue',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'processing' ? 'all' : 'processing'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'processing',
      },
      {
        id: 'shipped',
        label: 'Shipped',
        value: statusCounts.shipped ?? 0,
        icon: HiOutlineTruck,
        color: 'purple',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'shipped' ? 'all' : 'shipped'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'shipped',
      },
      {
        id: 'delivered',
        label: 'Delivered',
        value: statusCounts.delivered ?? 0,
        icon: HiOutlineCheckCircle,
        color: 'green',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'delivered' ? 'all' : 'delivered'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'delivered',
      },
      {
        id: 'cancelled',
        label: 'Cancelled',
        value: statusCounts.cancelled ?? 0,
        icon: HiOutlineXCircle,
        color: 'rose',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'cancelled' ? 'all' : 'cancelled'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'cancelled',
      },
      {
        id: 'returned',
        label: 'Returned',
        value: statusCounts.returned ?? 0,
        icon: HiOutlineReply,
        color: 'peach',
        onClick: () => {
          setOrderStatusTab((prev) => (prev === 'returned' ? 'all' : 'returned'));
          setCurrentPage(1);
        },
        active: orderStatusTab === 'returned',
      },
    ];
  }, [statusCounts, orderStatusTab, setCurrentPage]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderStatus(true);
      await api.patch(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      setOrders((prev) =>
        prev.map((ord) => ((ord._id || ord.id) === orderId ? { ...ord, orderStatus: newStatus, status: newStatus } : ord))
      );
      if (viewingOrder && (viewingOrder._id || viewingOrder.id) === orderId) {
        setViewingOrder((prev) => ({ ...prev, orderStatus: newStatus, status: newStatus }));
      }
      fetchOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // Handle Open Mark as Delivered Modal
  const handleOpenMarkDelivered = (order) => {
    setMarkDeliveredOrder(order);
    setTypedConfirmText('');
  };

  // Handle Confirm Mark as Delivered
  const handleConfirmMarkDelivered = async () => {
    if (!markDeliveredOrder) return;
    const orderId = markDeliveredOrder._id || markDeliveredOrder.id;
    await handleUpdateOrderStatus(orderId, 'delivered');
    setMarkDeliveredOrder(null);
    setTypedConfirmText('');
  };

  const normalizedTyped = typedConfirmText.trim().toLowerCase();
  const isDeliveredTypedValid =
    normalizedTyped === 'mark as delivered' ||
    normalizedTyped === 'mark as deliveded' ||
    normalizedTyped === 'mark as delived';

  // Handle Delete Order
  const handleDeleteOrder = async (orderId, orderNo) => {
    const isConfirmed = await confirm({
      title: `Delete Order ${orderNo || ''}`,
      message: `Are you sure you want to permanently delete order ${orderNo || ''}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await api.delete(`/orders/${orderId}`);
      toast.success('Order deleted successfully');
      setOrders((prev) => prev.filter((ord) => (ord._id || ord.id) !== orderId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      if (viewingOrder && (viewingOrder._id || viewingOrder.id) === orderId) {
        setViewingOrder(null);
      }
      fetchOrders();
    } catch (err) {
      console.error('Failed to delete order:', err);
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  // Handle Bulk Delete Orders
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error('Please select orders to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: `Delete ${count} Order${count > 1 ? 's' : ''}`,
      message: `Are you sure you want to permanently delete ${count} selected order${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete ${count} Order${count > 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    const idsToDelete = Array.from(selectedIds);
    try {
      await api.post('/orders/bulk-delete', { ids: idsToDelete });
      setOrders((prev) => prev.filter((ord) => !selectedIds.has(ord._id || ord.id)));
      if (viewingOrder && selectedIds.has(viewingOrder._id || viewingOrder.id)) {
        setViewingOrder(null);
      }
      setSelectedIds(new Set());
      toast.success(`${count} order${count > 1 ? 's' : ''} deleted successfully`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to bulk delete orders:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected orders');
    }
  };

  // Format Date Helper
  const formatOrderDate = (dateVal) => {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Selection handlers
  const isAllSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((ord) => {
      const id = ord._id || ord.id;
      return selectedIds.has(id);
    });

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginatedItems.forEach((ord) => {
        const id = ord._id || ord.id;
        if (id) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
      });
      return next;
    });
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* ─── Header ─── */}
      <ModuleHeader        title="Orders Management"
        subtitle="View, track, and fulfill real-time customer storefront purchases"
        extraActions={
          <button
            type="button"
            onClick={fetchOrders}
            title="Refresh List"
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200/90 hover:border-stone-300 rounded-xl text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-all cursor-pointer"
          >
            <HiOutlineRefresh className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* ─── Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Controls Bar ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        placeholder="Search orders by number, customer name, phone, email, or city..."
      />

      {/* ─── Status Filter Tabs & Bulk Actions ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 luxury-scrollbar flex-1 min-w-0">
          {ORDER_TABS.map((tab) => {
            const isActive = orderStatusTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setOrderStatusTab(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive
                    ? 'bg-[#8c6536] text-white shadow-xs ring-1 ring-[#8c6536]'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bulk Delete Button */}
        <button
          type="button"
          onClick={handleBulkDelete}
          disabled={selectedIds.size === 0}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs whitespace-nowrap ${
            selectedIds.size > 0
              ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50 cursor-pointer'
              : 'bg-white text-stone-300 border-stone-200/90 cursor-not-allowed opacity-60'
          }`}
        >
          <HiOutlineTrash className="w-3.5 h-3.5 shrink-0 text-[#ef4444]" />
          <span>Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
        </button>
      </div>

      {/* ─── Orders Table ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
              <HiOutlineRefresh className="w-5 h-5 animate-spin text-[#8b6f4e]" />
              <span>Loading orders from database...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#faf6f0] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                <HiOutlineShoppingBag className="w-5 h-5" />
              </div>
              <p className="font-semibold text-stone-700 text-sm">No orders found</p>
              <p className="text-[11px] text-stone-400">
                {search || orderStatusTab !== 'all' ? 'Try adjusting your filters or search keywords' : 'New customer orders will appear here automatically'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Order Cards (< md) */}
              <div className="md:hidden divide-y divide-stone-100">
                <div className="px-3.5 py-2.5 bg-[#eef2f6] border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                    />
                    <span>Select All ({paginatedItems.length})</span>
                  </label>
                  <span>Orders</span>
                </div>

                {paginatedItems.map((ord, idx) => {
                  const orderId = ord._id || ord.id;
                  const orderNo = ord.orderNumber || 'Order';
                  const statusStr = String(ord.orderStatus || ord.status || 'pending').toLowerCase();
                  const isSelected = selectedIds.has(orderId);
                  const customerName = ord.customer?.firstName
                    ? `${ord.customer.firstName} ${ord.customer.lastName || ''}`.trim()
                    : ord.shippingAddress?.fullName || ord.shippingAddress?.firstName || 'Customer';

                  return (
                    <div
                      key={`m-${orderId}`}
                      onClick={() => setViewingOrder(ord)}
                      className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/40' : 'hover:bg-stone-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(orderId)}
                              className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                            />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-stone-400">
                                #{(currentPage - 1) * pageSize + idx + 1}
                              </span>
                              <span className="font-mono font-bold text-xs text-[#8b6f4e] bg-[#faf5ed] border border-[#8b6f4e]/30 px-2 py-0.5 rounded">
                                {orderNo}
                              </span>
                            </div>
                            {(ord.meta?.createdAt || ord.createdAt) && (
                              <p className="text-[10.5px] text-stone-500 flex items-center gap-1">
                                <HiOutlineClock className="w-3 h-3 text-stone-400 shrink-0" />
                                <span>{formatOrderDate(ord.meta?.createdAt || ord.createdAt)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wider ${
                            statusStr === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : statusStr === 'processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : statusStr === 'shipped'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : statusStr === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : statusStr === 'cancelled'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {statusStr}
                        </span>
                      </div>

                      {Array.isArray(ord.items) && ord.items.length > 0 && (
                        <div className="space-y-1.5 bg-stone-50/70 rounded-xl p-2 border border-stone-100">
                          {ord.items.slice(0, 2).map((item, i) => {
                            const refDoc = item.refId;
                            const itemThumb = getMediaUrl(
                              item.image ||
                              item.thumbnail ||
                              refDoc?.image?.url ||
                              (typeof refDoc?.image === 'string' ? refDoc.image : '') ||
                              refDoc?.ornate?.ornateImages?.[0]?.url ||
                              refDoc?.colorImages?.[0]?.images?.[0]?.url ||
                              refDoc?.media ||
                              refDoc?.basicInfo?.images?.[0]
                            );
                            return (
                              <div key={item._id || i} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#faf6f0] border border-stone-200/80 overflow-hidden flex items-center justify-center shrink-0">
                                  {itemThumb ? (
                                    <img src={itemThumb} alt={item.title || 'Product'} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[11px]">💍</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-stone-900 text-xs truncate">
                                    {item.title || 'Jewellery Item'}
                                  </p>
                                  <p className="text-[10px] text-stone-500">
                                    {item.selectedMetal ? `${item.selectedMetal} • ` : ''}Qty: {item.quantity || 1}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {ord.items.length > 2 && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-bold">
                              +{ord.items.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate">{customerName}</p>
                          <p className="text-[10.5px] text-stone-500 truncate">
                            {ord.customer?.phone || ord.shippingAddress?.phone || ord.shippingAddress?.city || ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-[#8b6f4e]">
                            ₹{Number(ord.pricing?.total ?? ord.totalAmount ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="capitalize px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                              {ord.payment?.method || 'Online'}
                            </span>
                            {ord.payment?.status && (
                              <span className="capitalize px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-stone-50 text-stone-600 border border-stone-200/80">
                                {String(ord.payment.status).replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-stone-100" onClick={(e) => e.stopPropagation()}>
                        {statusStr === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                const isConfirmed = await confirm({
                                  title: `Accept Order ${orderNo}`,
                                  message: `Move order ${orderNo} to Processing status?`,
                                  confirmText: 'Accept Order',
                                  cancelText: 'Cancel',
                                  type: 'success',
                                });
                                if (isConfirmed) handleUpdateOrderStatus(orderId, 'processing');
                              }}
                              disabled={updatingOrderStatus}
                              title="Accept Order"
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80 cursor-pointer"
                            >
                              <HiOutlineCheck className="w-3.5 h-3.5 stroke-2" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                const isConfirmed = await confirm({
                                  title: `Cancel Order ${orderNo}`,
                                  message: `Cancel order ${orderNo}?`,
                                  confirmText: 'Yes, Cancel Order',
                                  cancelText: 'Keep Order',
                                  type: 'danger',
                                });
                                if (isConfirmed) handleUpdateOrderStatus(orderId, 'cancelled');
                              }}
                              disabled={updatingOrderStatus}
                              title="Cancel Order"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200/80 cursor-pointer"
                            >
                              <HiOutlineX className="w-3.5 h-3.5 stroke-2" />
                            </button>
                          </>
                        )}
                        {statusStr === 'processing' && (
                          ord.shiprocketInfo?.awbCode ? (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingOrder(ord);
                                setShiprocketTrackingOrderId(orderId);
                                setShiprocketTrackingOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-stone-900 text-white font-mono text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <HiOutlineTruck className="w-3 h-3" />
                              <span>{ord.shiprocketInfo.awbCode}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingOrder(ord);
                                setShiprocketDispatchOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#8b6f4e] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <HiOutlineTruck className="w-3.5 h-3.5" />
                              <span>Shipment</span>
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingOrder(ord)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 border border-stone-200 cursor-pointer"
                        >
                          <HiOutlineEye className="w-3.5 h-3.5 stroke-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(ord)}
                          disabled={downloadingInvoice}
                          title="Download Invoice"
                          className="p-1.5 rounded-lg text-[#8b6f4e] hover:bg-[#FAF7F2] border border-[#EFE8DD] cursor-pointer"
                        >
                          <HiOutlineDocumentDownload className="w-3.5 h-3.5 stroke-2" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(orderId, orderNo)}
                          title="Delete Order"
                          className="w-7 h-7 rounded-lg border border-[#fadbd8] bg-[#fdeeed] text-[#d93025] inline-flex items-center justify-center cursor-pointer"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5 stroke-2 text-[#d93025]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <table className="hidden md:table w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-1 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3 px-3 text-center w-12 whitespace-nowrap">SR NO</th>
                  <th className="py-3 px-3 whitespace-nowrap">ORDER INFO</th>
                  <th className="py-3 px-3 whitespace-nowrap">PRODUCTS</th>
                  <th className="py-3 px-3 whitespace-nowrap">CUSTOMER</th>
                  <th className="py-3 px-3 whitespace-nowrap">PRICING & PAYMENT</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">STATUS</th>
                  <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {paginatedItems.map((ord, idx) => {
                  const orderId = ord._id || ord.id;
                  const orderNo = ord.orderNumber || 'Order';
                  const statusStr = String(ord.orderStatus || ord.status || 'pending').toLowerCase();
                  const isSelected = selectedIds.has(orderId);

                  return (
                    <tr
                      key={orderId}
                      onClick={() => setViewingOrder(ord)}
                      className={`hover:bg-stone-50/70 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3.5 pl-4 pr-1 w-8 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(orderId)}
                          className="w-4 h-4 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer accent-[#8b6f4e]"
                        />
                      </td>

                      {/* SR NO */}
                      <td className="py-3.5 px-3 text-center align-middle text-xs font-semibold text-stone-400 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* 1. ORDER INFO */}
                      <td className="py-3.5 px-3 text-stone-900 text-xs align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-xs text-[#8b6f4e] bg-[#faf5ed] border border-[#8b6f4e]/30 px-2 py-0.5 rounded shadow-2xs inline-block">
                            {orderNo}
                          </span>
                          {(ord.meta?.createdAt || ord.createdAt) && (
                            <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                              <HiOutlineClock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{formatOrderDate(ord.meta?.createdAt || ord.createdAt)}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-stone-400 font-medium">
                            {ord.items?.length || 0} {ord.items?.length === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </td>

                      {/* 2. PRODUCTS COLUMN */}
                      <td className="py-3.5 px-3 text-stone-900 text-xs align-middle">
                        <div className="min-w-[190px] max-w-xs space-y-1.5">
                          {Array.isArray(ord.items) &&
                            ord.items.slice(0, 2).map((item, i) => {
                              const refDoc = item.refId;
                              const itemThumb = getMediaUrl(
                                item.image ||
                                item.thumbnail ||
                                refDoc?.image?.url ||
                                (typeof refDoc?.image === 'string' ? refDoc.image : '') ||
                                refDoc?.ornate?.ornateImages?.[0]?.url ||
                                refDoc?.colorImages?.[0]?.images?.[0]?.url ||
                                refDoc?.media ||
                                refDoc?.basicInfo?.images?.[0]
                              );
                              return (
                                <div key={item._id || i} className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-[#faf6f0] border border-stone-200/80 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                    {itemThumb ? (
                                      <img
                                        src={itemThumb}
                                        alt={item.title || 'Product'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <span className="text-[11px]">💍</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span
                                      className="font-semibold text-stone-900 text-xs block leading-tight truncate hover:text-[#8b6f4e] transition-colors"
                                      title={item.title || 'Jewellery Item'}
                                    >
                                      {item.title || 'Jewellery Item'}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-500">
                                      {item.selectedMetal && (
                                        <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-medium border border-stone-200/60">
                                          {item.selectedMetal}
                                        </span>
                                      )}
                                      <span className="font-medium text-stone-600">
                                        Qty: {item.quantity || 1}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          {Array.isArray(ord.items) && ord.items.length > 2 && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-bold">
                              +{ord.items.length - 2} more item{ord.items.length - 2 > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. CUSTOMER DETAILS */}
                      <td className="py-3.5 px-3 text-stone-600 text-xs align-middle">
                        <div className="min-w-[150px] max-w-xs space-y-0.5">
                          <div className="font-semibold text-stone-900 text-xs truncate">
                            {ord.customer?.firstName
                              ? `${ord.customer.firstName} ${ord.customer.lastName || ''}`.trim()
                              : ord.shippingAddress?.fullName || ord.shippingAddress?.firstName || 'Customer'}
                          </div>
                          {(ord.customer?.phone || ord.shippingAddress?.phone) && (
                            <div className="text-[11px] text-stone-500 truncate">
                              {ord.customer?.phone || ord.shippingAddress?.phone}
                            </div>
                          )}
                          {ord.shippingAddress?.city && (
                            <div className="text-[10.5px] text-stone-500 truncate">
                              {ord.shippingAddress.city}
                              {ord.shippingAddress.state ? `, ${ord.shippingAddress.state}` : ''}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. PRICING & PAYMENT */}
                      <td className="py-3.5 px-3 text-stone-900 text-xs align-middle whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-[#8b6f4e]">
                            ₹{Number(ord.pricing?.total ?? ord.totalAmount ?? 0).toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`capitalize px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                String(ord.payment?.method).toLowerCase() === 'cod'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {ord.payment?.method || 'Online'}
                            </span>
                            {ord.payment?.status && (
                              <span
                                className={`capitalize px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  String(ord.payment.status).toLowerCase() === 'paid'
                                    ? 'text-emerald-700 bg-emerald-50/80'
                                    : String(ord.payment.status).toLowerCase() === 'partially_paid'
                                    ? 'text-amber-700 bg-amber-50/80 border border-amber-200/60'
                                    : 'text-stone-600 bg-stone-100'
                                }`}
                              >
                                {String(ord.payment.status).replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          {ord.coupon?.code && (
                            <div className="flex items-center gap-1 text-[10.5px] text-emerald-700 pt-0.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-200">
                                <HiOutlineTag className="w-2.5 h-2.5 text-emerald-600" />
                                {ord.coupon.code}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. STATUS BADGE */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize tracking-wider ${
                            statusStr === 'pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : statusStr === 'processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : statusStr === 'shipped'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : statusStr === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : statusStr === 'cancelled'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {statusStr}
                        </span>
                      </td>

                      {/* 6. ACTIONS */}
                      <td className="py-3.5 pr-4 pl-2 whitespace-nowrap text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusStr === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const isConfirmed = await confirm({
                                    title: `Accept Order ${orderNo}`,
                                    message: `Move order ${orderNo} to Processing status?`,
                                    confirmText: 'Accept Order',
                                    cancelText: 'Cancel',
                                    type: 'success',
                                  });
                                  if (isConfirmed) handleUpdateOrderStatus(orderId, 'processing');
                                }}
                                disabled={updatingOrderStatus}
                                title="Accept Order"
                                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs"
                              >
                                <HiOutlineCheck className="w-3.5 h-3.5 stroke-2" />
                              </button>

                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const isConfirmed = await confirm({
                                    title: `Cancel Order ${orderNo}`,
                                    message: `Cancel order ${orderNo}?`,
                                    confirmText: 'Yes, Cancel Order',
                                    cancelText: 'Keep Order',
                                    type: 'danger',
                                  });
                                  if (isConfirmed) handleUpdateOrderStatus(orderId, 'cancelled');
                                }}
                                disabled={updatingOrderStatus}
                                title="Cancel Order"
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200/80 transition-all cursor-pointer shadow-2xs"
                              >
                                <HiOutlineX className="w-3.5 h-3.5 stroke-2" />
                              </button>
                            </>
                          )}

                          {statusStr === 'processing' && (
                            ord.shiprocketInfo?.awbCode ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingOrder(ord);
                                  setShiprocketTrackingOrderId(orderId);
                                  setShiprocketTrackingOpen(true);
                                }}
                                title={`Track Shipment (AWB: ${ord.shiprocketInfo.awbCode})`}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <HiOutlineTruck className="w-3.5 h-3.5 text-stone-300" />
                                <span>AWB: {ord.shiprocketInfo.awbCode}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingOrder(ord);
                                  setShiprocketDispatchOpen(true);
                                }}
                                title="Shipment via Shiprocket"
                                className="px-2.5 py-1.5 rounded-lg bg-[#8b6f4e] hover:bg-[#785e40] active:scale-95 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <HiOutlineTruck className="w-3.5 h-3.5" />
                                <span>Shipment</span>
                              </button>
                            )
                          )}

                          {/* Mark as Delivered Button */}
                          {!['delivered', 'cancelled'].includes(statusStr) && statusStr !== 'pending' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMarkDelivered(ord);
                              }}
                              disabled={updatingOrderStatus}
                              title="Mark as Delivered"
                              className="px-2.5 py-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5 text-xs font-semibold"
                            >
                              <HiOutlineCheckCircle className="w-3.5 h-3.5 stroke-2" />
                              <span className="hidden sm:inline">Mark as Delivered</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrder(ord);
                            }}
                            title="View Full Order Details"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 transition-all cursor-pointer shadow-2xs"
                          >
                            <HiOutlineEye className="w-3.5 h-3.5 stroke-2" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadInvoice(ord);
                            }}
                            disabled={downloadingInvoice}
                            title="Download Tax Invoice (PDF)"
                            className="p-1.5 rounded-lg text-[#8b6f4e] hover:text-[#6d4a27] hover:bg-[#FAF7F2] border border-[#EFE8DD] transition-all cursor-pointer shadow-2xs"
                          >
                            <HiOutlineDocumentDownload className="w-3.5 h-3.5 stroke-2" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(orderId, orderNo);
                            }}
                            title="Delete Order Record"
                            className="w-7 h-7 rounded-lg border border-[#fadbd8] bg-[#fdeeed] text-[#d93025] hover:bg-[#fadbd8] hover:border-[#f5b7b1] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2 text-[#d93025]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </>
          )}
        </div>

        {/* ─── Pagination ─── */}
        {!loading && totalItems > 0 && (
          <div className="p-3 border-t border-stone-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* ─── Order Details Modal Popup ─── */}
      {viewingOrder && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn cursor-pointer"
          onClick={() => setViewingOrder(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh] transition-all transform duration-200 animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200/90 flex items-center justify-between bg-stone-50/80 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#8b6f4e] bg-[#faf5ed] border border-[#8b6f4e]/30 px-2.5 py-0.5 rounded shadow-2xs">
                    {viewingOrder.orderNumber || 'Order'}
                  </span>
                  <span
                    className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      String(viewingOrder.orderStatus || viewingOrder.status).toLowerCase() === 'delivered'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : String(viewingOrder.orderStatus || viewingOrder.status).toLowerCase() === 'cancelled'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {viewingOrder.orderStatus || viewingOrder.status || 'Pending'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  Placed on {formatOrderDate(viewingOrder.meta?.createdAt || viewingOrder.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <HiOutlineX className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Modal Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 luxury-scrollbar">
              {/* Shiprocket Logistics Section - only for non-pending orders */}
              {String(viewingOrder.orderStatus || viewingOrder.status || '').toLowerCase() !== 'pending' && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/80 border border-stone-200/90 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <HiOutlineTruck className="w-5 h-5 text-[#8b6f4e]" />
                      <span className="text-xs font-bold text-stone-900">Shiprocket Logistics</span>
                    </div>
                    {viewingOrder.shiprocketInfo?.awbCode ? (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-mono text-[11px] font-bold tracking-wider">
                        AWB: {viewingOrder.shiprocketInfo.awbCode}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShiprocketDispatchOpen(true)}
                        className="px-3 py-1.5 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Dispatch via Shiprocket</span>
                      </button>
                    )}
                  </div>

                  {viewingOrder.shiprocketInfo?.awbCode && (
                    <div className="pt-2 border-t border-stone-200/70 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-lg border border-stone-200/80">
                          <span className="text-stone-400 block text-[10px]">Courier</span>
                          <span className="font-bold text-stone-800">{viewingOrder.shiprocketInfo.courierName || 'Shiprocket Partner'}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-stone-200/80">
                          <span className="text-stone-400 block text-[10px]">Status</span>
                          <span className="font-bold text-emerald-700 capitalize">{viewingOrder.shiprocketInfo.status || 'Active'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShiprocketTrackingOrderId(viewingOrder._id || viewingOrder.id);
                          setShiprocketTrackingOpen(true);
                        }}
                        className="w-full py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <HiOutlineExternalLink className="w-3.5 h-3.5" />
                        <span>Live Tracking</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Customer & Shipping Address */}
              <div className="p-4 rounded-xl border border-stone-200/80 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <HiOutlineLocationMarker className="w-4 h-4 text-[#8b6f4e]" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Delivery Details
                    </span>
                  </div>
                  {viewingOrder.shippingAddress?.country && (
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                      {viewingOrder.shippingAddress.country}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Left Column: Customer Information */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Customer / Recipient
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {viewingOrder.customer?.firstName
                        ? `${viewingOrder.customer.firstName} ${viewingOrder.customer.lastName || ''}`.trim()
                        : viewingOrder.shippingAddress?.fullName || viewingOrder.shippingAddress?.firstName || 'Valued Customer'}
                    </p>
                    <div className="space-y-1 text-stone-600 pt-0.5">
                      <p className="flex items-center gap-1.5 text-stone-700">
                        <HiOutlinePhone className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                        <span>{viewingOrder.shippingAddress?.phone || viewingOrder.customer?.phone || 'Not provided'}</span>
                      </p>
                      {(viewingOrder.shippingAddress?.email || viewingOrder.customer?.email) && (
                        <p className="flex items-center gap-1.5 text-stone-600 break-all">
                          <HiOutlineMail className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                          <span>{viewingOrder.shippingAddress?.email || viewingOrder.customer?.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Order Address (Exact location of red box) */}
                  <div className="space-y-1.5 sm:border-l sm:border-stone-100 sm:pl-4">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Order Shipping Address
                    </span>
                    <div className="space-y-1 text-stone-700 leading-relaxed">
                      {(viewingOrder.shippingAddress?.addressLine || viewingOrder.shippingAddress?.addressLine1 || viewingOrder.shippingAddress?.address || viewingOrder.shippingAddress?.street) && (
                        <p className="font-semibold text-stone-900">
                          {viewingOrder.shippingAddress?.addressLine || viewingOrder.shippingAddress?.addressLine1 || viewingOrder.shippingAddress?.address || viewingOrder.shippingAddress?.street}
                        </p>
                      )}
                      {viewingOrder.shippingAddress?.apartment && (
                        <p className="text-stone-600">
                          {viewingOrder.shippingAddress.apartment}
                        </p>
                      )}
                      {(viewingOrder.shippingAddress?.city || viewingOrder.shippingAddress?.state || viewingOrder.shippingAddress?.postalCode) && (
                        <p className="text-stone-600">
                          {[
                            viewingOrder.shippingAddress?.city,
                            viewingOrder.shippingAddress?.state
                          ].filter(Boolean).join(', ')}
                          {viewingOrder.shippingAddress?.postalCode ? ` - ${viewingOrder.shippingAddress.postalCode}` : ''}
                        </p>
                      )}
                      {viewingOrder.shippingAddress?.country && (
                        <p className="text-[11px] text-stone-400 font-medium">
                          {viewingOrder.shippingAddress.country}
                        </p>
                      )}
                      {!viewingOrder.shippingAddress?.addressLine && !viewingOrder.shippingAddress?.addressLine1 && !viewingOrder.shippingAddress?.city && (
                        <p className="text-stone-400 italic">No street address provided</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-900 block uppercase tracking-wider">
                  Ordered Items ({viewingOrder.items?.length || 0})
                </span>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden bg-white">
                  {(viewingOrder.items || []).map((item, i) => {
                    const refDoc = item.refId;
                    const itemThumb = getMediaUrl(
                      item.image ||
                      item.thumbnail ||
                      refDoc?.image?.url ||
                      (typeof refDoc?.image === 'string' ? refDoc.image : '') ||
                      refDoc?.ornate?.ornateImages?.[0]?.url ||
                      refDoc?.colorImages?.[0]?.images?.[0]?.url ||
                      refDoc?.media ||
                      refDoc?.basicInfo?.images?.[0]
                    );
                    return (
                      <div key={item._id || i} className="p-3 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#faf6f0] border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                          {itemThumb ? (
                            <img src={itemThumb} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span>💍</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-900 text-xs truncate">{item.title || 'Jewellery Item'}</p>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-stone-500 mt-0.5">
                            {item.selectedMetal && (
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-medium border border-stone-200/60">
                                {item.selectedMetal}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 font-medium border border-stone-200/60">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span className="font-medium">Qty: {item.quantity || 1}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-[#8b6f4e]">
                            ₹{Number(item.totalItemPrice || item.price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>₹{Number(viewingOrder.pricing?.subtotal || viewingOrder.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {Number(viewingOrder.pricing?.discount || viewingOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-₹{Number(viewingOrder.pricing?.discount || viewingOrder.discount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Tax (GST 3%)</span>
                  <span>₹{Number(viewingOrder.pricing?.tax || viewingOrder.tax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Shipping</span>
                  <span className="text-emerald-700 font-semibold">
                    {Number(viewingOrder.pricing?.shipping || viewingOrder.shipping || 0) === 0 ? 'FREE' : `₹${viewingOrder.pricing?.shipping || viewingOrder.shipping}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                  <span>Total Paid</span>
                  <span className="text-[#8b6f4e]">
                    ₹{Number(viewingOrder.pricing?.total ?? viewingOrder.totalAmount ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Pending Order Actions: Accept & Cancel Order */}
              {String(viewingOrder.orderStatus || viewingOrder.status || '').toLowerCase() === 'pending' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 border border-amber-200/90 shadow-2xs space-y-3 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Order Action Required
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Pending Acceptance
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">
                    Accept this order to confirm and move it to Processing to unlock shipment dispatch, or cancel the order.
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title: `Accept Order ${viewingOrder.orderNumber}`,
                          message: `Accept and move order ${viewingOrder.orderNumber} to Processing status?`,
                          confirmText: 'Accept Order',
                          cancelText: 'Cancel',
                          type: 'success',
                        });
                        if (isConfirmed) {
                          await handleUpdateOrderStatus(viewingOrder._id || viewingOrder.id, 'processing');
                        }
                      }}
                      disabled={updatingOrderStatus}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <HiOutlineCheck className="w-4 h-4 stroke-2" />
                      <span>Accept Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title: `Cancel Order ${viewingOrder.orderNumber}`,
                          message: `Are you sure you want to cancel order ${viewingOrder.orderNumber}?`,
                          confirmText: 'Yes, Cancel Order',
                          cancelText: 'Keep Order',
                          type: 'danger',
                        });
                        if (isConfirmed) {
                          await handleUpdateOrderStatus(viewingOrder._id || viewingOrder.id, 'cancelled');
                        }
                      }}
                      disabled={updatingOrderStatus}
                      className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <HiOutlineX className="w-4 h-4 stroke-2" />
                      <span>Cancel Order</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Dispatch Inline Box */}
            {showInvoiceDispatch && (
              <div className="p-4 mx-4 sm:mx-5 mb-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE8DD] space-y-3 animate-fadeIn shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-[#8b6f4e]" />
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Dispatch Tax Invoice
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceDispatch(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 cursor-pointer"
                  >
                    <HiOutlineX className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-stone-600">
                  Select delivery channels to dispatch the official tax invoice for order <strong className="font-mono text-stone-900">{viewingOrder.orderNumber}</strong>:
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-700 bg-white p-3 rounded-xl border border-stone-200/80">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invoiceMethods.includes('email')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInvoiceMethods((prev) => [...prev, 'email']);
                        } else {
                          setInvoiceMethods((prev) => prev.filter((m) => m !== 'email'));
                        }
                      }}
                      className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <HiOutlineMail className="w-4 h-4 text-[#8b6f4e]" />
                      <span>Email</span>
                      <span className="text-[10px] text-stone-400">({viewingOrder.customer?.email || viewingOrder.shippingAddress?.email || 'N/A'})</span>
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invoiceMethods.includes('whatsapp')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setInvoiceMethods((prev) => [...prev, 'whatsapp']);
                        } else {
                          setInvoiceMethods((prev) => prev.filter((m) => m !== 'whatsapp'));
                        }
                      }}
                      className="rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e] cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <IoLogoWhatsapp className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp</span>
                      <span className="text-[10px] text-stone-400">({viewingOrder.customer?.phone || viewingOrder.shippingAddress?.phone || 'N/A'})</span>
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceDispatch(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendInvoice}
                    disabled={sendingInvoice || invoiceMethods.length === 0}
                    className="px-4 py-2 bg-[#8b6f4e] hover:bg-[#725a3f] text-white text-xs font-bold rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {sendingInvoice ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Invoice...</span>
                      </>
                    ) : (
                      <>
                        <HiOutlineCheck className="w-3.5 h-3.5 stroke-2" />
                        <span>Confirm & Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-stone-200/90 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Download PDF button */}
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(viewingOrder)}
                  disabled={downloadingInvoice}
                  className="px-3.5 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  title="Download A4 PDF Tax Invoice"
                >
                  <HiOutlineDocumentDownload className="w-4 h-4 text-[#8b6f4e]" />
                  <span>{downloadingInvoice ? 'Downloading...' : 'Download Invoice'}</span>
                </button>

                {/* Send Invoice Toggle */}
                {!['pending', 'returned', 'return requested', 'cancelled'].includes(String(viewingOrder.orderStatus || viewingOrder.status || '').toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => setShowInvoiceDispatch((prev) => !prev)}
                    className={`px-3.5 py-2 text-xs font-bold tracking-wide rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5 ${
                      showInvoiceDispatch
                        ? 'bg-[#8b6f4e] text-white shadow-xs'
                        : 'bg-white hover:bg-[#faf5ed] border border-[#8b6f4e]/40 text-[#8b6f4e]'
                    }`}
                  >
                    <HiOutlinePaperAirplane className="w-3.5 h-3.5 rotate-90" />
                    <span>SEND INVOICE</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mark as Delivered in Modal */}
                {!['delivered', 'cancelled'].includes(String(viewingOrder.orderStatus || viewingOrder.status || '').toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleOpenMarkDelivered(viewingOrder)}
                    disabled={updatingOrderStatus}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4 stroke-2" />
                    <span>Mark as Delivered</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setViewingOrder(null);
                    setShowInvoiceDispatch(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Shiprocket Forward Dispatch Modal */}
      <ShiprocketDispatchModal
        isOpen={shiprocketDispatchOpen}
        onClose={() => setShiprocketDispatchOpen(false)}
        order={viewingOrder}
        onSuccess={(updatedInfo) => {
          if (viewingOrder) {
            setViewingOrder((prev) => ({
              ...prev,
              shiprocketInfo: updatedInfo,
              orderStatus: prev.orderStatus === 'pending' ? 'processing' : prev.orderStatus,
            }));
            fetchOrders();
          }
        }}
      />

      {/* Shiprocket Live Tracking Modal */}
      <ShiprocketTrackingModal
        isOpen={shiprocketTrackingOpen}
        onClose={() => {
          setShiprocketTrackingOpen(false);
          setShiprocketTrackingOrderId(null);
        }}
        orderId={shiprocketTrackingOrderId}
        awbCode={viewingOrder?.shiprocketInfo?.awbCode}
      />

      {/* ─── Mark as Delivered Confirmation Modal (Type to Confirm) ─── */}
      {markDeliveredOrder && createPortal(
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn"
          onClick={() => {
            if (!updatingOrderStatus) {
              setMarkDeliveredOrder(null);
              setTypedConfirmText('');
            }
          }}
        >
          <div
            className="relative w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl p-6 sm:p-7 text-left transition-all transform duration-200 animate-scaleUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => {
                setMarkDeliveredOrder(null);
                setTypedConfirmText('');
              }}
              disabled={updatingOrderStatus}
              title="Close"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors cursor-pointer disabled:opacity-30"
            >
              <HiOutlineX className="w-5 h-5 stroke-[2]" />
            </button>

            {/* Icon Header */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
                <HiOutlineCheckCircle className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-stone-900 tracking-tight leading-snug">
                  Mark Order as Delivered
                </h3>
                <span className="font-mono text-xs font-bold text-[#8b6f4e] bg-[#faf5ed] border border-[#8b6f4e]/30 px-2 py-0.5 rounded shadow-2xs inline-block mt-0.5">
                  {markDeliveredOrder.orderNumber || 'Order'}
                </span>
              </div>
            </div>

            {/* Warning / Explanation Text */}
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              This action will permanently set the order status to <span className="font-bold text-emerald-700">Delivered</span>, record delivery timestamp, and complete this order.
            </p>

            {/* Typed Confirmation Prompt */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 mb-5 space-y-2">
              <label className="block text-xs font-semibold text-stone-800">
                Please type <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 select-all">mark as delivered</span> to confirm:
              </label>
              <input
                type="text"
                autoFocus
                value={typedConfirmText}
                onChange={(e) => setTypedConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && isDeliveredTypedValid && !updatingOrderStatus) {
                    handleConfirmMarkDelivered();
                  }
                }}
                placeholder="type: mark as delivered"
                disabled={updatingOrderStatus}
                className="w-full h-10 px-3.5 bg-white rounded-lg border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 font-sans">
              <button
                type="button"
                onClick={() => {
                  setMarkDeliveredOrder(null);
                  setTypedConfirmText('');
                }}
                disabled={updatingOrderStatus}
                className="h-10 px-4 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40 text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMarkDelivered}
                disabled={!isDeliveredTypedValid || updatingOrderStatus}
                className={`h-10 px-4 text-xs font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs ${
                  isDeliveredTypedValid && !updatingOrderStatus
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-60'
                }`}
              >
                {updatingOrderStatus ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheck className="w-4 h-4 stroke-2" />
                    <span>Confirm Delivered</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
