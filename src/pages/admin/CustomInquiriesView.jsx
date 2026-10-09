import React, { useState, useEffect } from 'react';
import {
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlinePhone,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlineCheck,
  HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function CustomInquiriesView() {
  const confirm = useConfirm();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/custom-inquiries?limit=100');
      const data = res.data?.data?.items || res.data?.data || [];
      setInquiries(data);
    } catch (err) {
      console.error('Failed to fetch custom inquiries:', err);
      toast.error('Failed to load custom inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/custom-inquiries/${id}`, { status: newStatus });
      toast.success(`Inquiry marked as ${newStatus}`);
      fetchInquiries();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Custom Inquiry',
      message: 'Are you sure you want to delete this custom inquiry? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/custom-inquiries/${id}`);
      toast.success('Custom inquiry deleted successfully');
      fetchInquiries();
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Metrics
  const totalCount = inquiries.length;
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
  const completedCount = inquiries.filter((i) => i.status === 'completed' || i.status === 'confirmed').length;
  const cancelledCount = inquiries.filter((i) => i.status === 'cancelled').length;

  const displayedList = inquiries
    .filter((i) => (activeTab ? i.status === activeTab : true))
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (i.customer?.name || '').toLowerCase();
      const email = (i.customer?.email || '').toLowerCase();
      const phone = (i.customer?.phone?.number || '').toLowerCase();
      const comments = (i.requirements?.comments || '').toLowerCase();
      const stone = (i.requirements?.stoneType || '').toLowerCase();
      const metal = (i.requirements?.metalType || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        comments.includes(q) ||
        stone.includes(q) ||
        metal.includes(q)
      );
    });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedList, 10);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Custom Design Inquiries
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage and view custom jewelry design request submissions from your storefront.
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200/90 text-stone-700 text-xs font-bold tracking-wider uppercase rounded-lg hover:bg-stone-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <HiOutlineRefresh className="w-4 h-4 text-stone-500" />
          <span>REFRESH LIST</span>
        </button>
      </div>

      {/* ─── 4 Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL INQUIRIES</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{totalCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineSparkles className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL PENDING</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineClock className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">CONFIRMED / COMPLETED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{completedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineCheckCircle className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL CANCELLED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{cancelledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineExclamation className="w-5 h-5 text-stone-500" />
          </div>
        </div>
      </div>

      {/* ─── Status Filter Tabs ─── */}
      <div className="flex flex-wrap items-center gap-3">
        {['pending', 'confirmed', 'completed', 'cancelled'].map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setActiveTab(statusKey)}
            className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === statusKey
                ? 'bg-[#8f6d43] text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
            }`}
          >
            {statusKey}
          </button>
        ))}
      </div>

      {/* ─── Search Bar ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm p-4">
        <div className="relative">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search client name, email, phone, requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">CLIENT INFO</th>
                <th className="py-4 px-6">CONTACT</th>
                <th className="py-4 px-6">JEWELLERY REQUIREMENTS</th>
                <th className="py-4 px-6">COMMENTS / NOTES</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-400">
                    <div className="animate-spin w-6 h-6 border-2 border-[#8f6d43] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading custom design inquiries...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-stone-400">
                    No custom inquiries in this view.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((inq) => {
                  const clientName = inq.customer?.name || 'Anonymous';
                  const clientEmail = inq.customer?.email || '—';
                  const countryCode = inq.customer?.phone?.countryCode || '91';
                  const rawPhone = inq.customer?.phone?.number || '';
                  const initial = (clientName || 'C')[0].toUpperCase();

                  const stoneType = inq.requirements?.stoneType || '—';
                  const metalType = inq.requirements?.metalType || '—';
                  const rawJewelryTypes = inq.requirements?.jewelryTypes;
                  const jewelryTypeList = Array.isArray(rawJewelryTypes)
                    ? rawJewelryTypes.join(', ')
                    : rawJewelryTypes || '—';
                  const comments = inq.requirements?.comments || inq.comments || '—';

                  return (
                    <tr key={inq._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Client Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4ece3] text-[#8f6d43] font-semibold text-xs flex items-center justify-center border border-[#8f6d43]/20 shadow-2xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{clientName}</p>
                            <p className="text-xs text-stone-400 truncate max-w-[180px]">{clientEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-stone-700 text-xs font-medium">
                          <HiOutlinePhone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>
                            {rawPhone ? `+${countryCode} ${rawPhone}` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Jewellery Requirements */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-stone-900 text-xs">
                            {stoneType} · {metalType}
                          </p>
                          <p className="text-[11px] text-stone-400 font-semibold tracking-wider uppercase mt-0.5">
                            {jewelryTypeList}
                          </p>
                        </div>
                      </td>

                      {/* Comments / Notes */}
                      <td className="py-4 px-6 text-stone-600 text-xs">
                        <p className="max-w-[200px] truncate" title={comments}>
                          {comments}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            inq.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inq.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : inq.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedInquiry(inq)}
                            title="View Inquiry Details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                          {inq.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(inq._id, 'confirmed')}
                                title="Accept Inquiry"
                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              >
                                <HiOutlineCheck className="w-4 h-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(inq._id, 'cancelled')}
                                title="Cancel Inquiry"
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <HiOutlineX className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(inq._id)}
                            title="Delete Inquiry"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Common Pagination */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200/80 space-y-5 my-8 animate-scaleUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
              <div className="flex items-center gap-2.5">
                <HiOutlineSparkles className="w-5 h-5 text-[#8f6d43]" />
                <h3 className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                  Custom Design Request Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Section 1: Customer Details (2x2 Grid) */}
            <div className="pb-4 border-b border-stone-200/80">
              <span className="text-[11px] font-bold text-[#8f6d43] uppercase tracking-wider block mb-3">
                1. Customer Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    NAME
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-1">
                    {selectedInquiry.customer?.name || selectedInquiry.name || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    EMAIL ADDRESS
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-1 break-all">
                    {selectedInquiry.customer?.email || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    PHONE
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-1">
                    +{selectedInquiry.customer?.phone?.countryCode || '91'}{' '}
                    {selectedInquiry.customer?.phone?.number || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    STATUS
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase mt-1 ${
                      selectedInquiry.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedInquiry.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : selectedInquiry.status === 'cancelled'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedInquiry.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Jewellery Requirements */}
            <div className="pb-4 border-b border-stone-200/80">
              <span className="text-[11px] font-bold text-[#8f6d43] uppercase tracking-wider block mb-3">
                2. Jewellery Requirements
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    STONE TYPE
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-stone-900 mt-1">
                    {selectedInquiry.requirements?.stoneType || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    METAL TYPE
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-stone-900 mt-1">
                    {selectedInquiry.requirements?.metalType || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    JEWELRY TYPES
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-stone-900 mt-1 capitalize">
                    {Array.isArray(selectedInquiry.requirements?.jewelryTypes)
                      ? selectedInquiry.requirements.jewelryTypes.join(', ')
                      : selectedInquiry.requirements?.jewelryTypes || '—'}
                  </p>
                </div>
              </div>

              {/* Comments inside Requirements */}
              <div className="mt-3.5">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  COMMENTS / SPECIAL REQUESTS
                </span>
                <div className="mt-1.5 p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs sm:text-sm text-stone-700 leading-relaxed min-h-[44px]">
                  {selectedInquiry.requirements?.comments ? (
                    selectedInquiry.requirements.comments
                  ) : (
                    <span className="text-stone-400 italic">No comments provided.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Reference Images */}
            <div>
              {(() => {
                const rawImages = selectedInquiry.referenceImages || [];
                const images = Array.isArray(rawImages)
                  ? rawImages
                  : [rawImages].filter(Boolean);

                return (
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      REFERENCE IMAGES ({images.length})
                    </span>
                    {images.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {images.map((img, idx) => {
                          const url = typeof img === 'string' ? img : img?.url;
                          if (!url) return null;
                          return (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(url)}
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 group relative cursor-pointer shadow-xs hover:border-[#8f6d43] transition-all shrink-0"
                            >
                              <img
                                src={url}
                                alt={`Reference ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <HiOutlineEye className="w-5 h-5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 italic mt-1.5">
                        No reference images attached
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDelete(selectedInquiry._id)}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Delete Inquiry
              </button>

              <div className="flex items-center gap-2">
                {selectedInquiry.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedInquiry._id, 'confirmed')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Accept Inquiry
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedInquiry._id, 'cancelled')}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cancel Inquiry
                    </button>
                  </>
                )}
                {selectedInquiry.status === 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedInquiry._id, 'completed')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Mark as Completed
                  </button>
                )}
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox Modal for Full Image Preview ─── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged Reference"
              className="max-h-[85vh] max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
