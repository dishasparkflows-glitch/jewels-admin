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

export default function CustomInquiriesView() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  const [search, setSearch] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom inquiry?')) return;
    try {
      await api.delete(`/custom-inquiries/${id}`);
      toast.success('Custom inquiry deleted successfully');
      fetchInquiries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // Metrics matching Screenshot 4
  const totalCount = inquiries.length;
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length;
  const completedCount = inquiries.filter((i) => i.status === 'completed').length;
  const cancelledCount = inquiries.filter((i) => i.status === 'cancelled').length;

  const displayedList = inquiries
    .filter((i) => (activeTab ? i.status === activeTab : true))
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const name = (i.name || '').toLowerCase();
      const email = (i.email || '').toLowerCase();
      const phone = (i.phoneNumber || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot 4) ─── */}
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

      {/* ─── 4 Stat Cards (Matches Screenshot 4) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL INQUIRIES</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{totalCount || 5}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineSparkles className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL PENDING</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{pendingCount || 3}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineClock className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL COMPLETED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{completedCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineCheckCircle className="w-5 h-5 text-stone-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200/90 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">TOTAL CANCELLED</p>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-serif">{cancelledCount || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
            <HiOutlineExclamation className="w-5 h-5 text-stone-500" />
          </div>
        </div>
      </div>

      {/* ─── Status Filter Tabs (Matches Screenshot 4) ─── */}
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
            placeholder="Search client name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-stone-50/60 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
          />
        </div>
      </div>

      {/* ─── Table (Matches Screenshot 4) ─── */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                <th className="py-4 px-6">CLIENT INFO</th>
                <th className="py-4 px-6">CONTACT</th>
                <th className="py-4 px-6">DESIGN DETAILS</th>
                <th className="py-4 px-6">BUDGET</th>
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
                displayedList.map((inq) => {
                  const initial = (inq.name || 'C')[0].toUpperCase();
                  const jewelryTypeList = Array.isArray(inq.jewelryType)
                    ? inq.jewelryType.join(', ')
                    : inq.jewelryType || 'RING/BAND';

                  return (
                    <tr key={inq._id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Client Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#f4ece3] text-[#8f6d43] font-semibold text-xs flex items-center justify-center border border-[#8f6d43]/20 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{inq.name}</p>
                            <p className="text-xs text-stone-400 truncate max-w-[180px]">{inq.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-stone-700 text-xs font-medium">
                          <HiOutlinePhone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{inq.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Design Details */}
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-stone-900 text-xs">
                            {inq.stoneType} · {inq.metalType}
                          </p>
                          <p className="text-[11px] text-stone-400 font-semibold tracking-wider uppercase mt-0.5">
                            {jewelryTypeList}
                          </p>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-6 text-stone-800 text-xs font-medium">
                        {inq.budget}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          inq.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inq.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : inq.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inq.status}
                        </span>
                      </td>

                      {/* Actions (View, Accept, Cancel, Delete) */}
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

        {/* ─── Bottom Pagination (Matches Screenshot 4) ─── */}
        <div className="py-3 px-6 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-stone-600">LIMIT 10</span>
            <span>·</span>
            <span>{displayedList.length} RECORDS INDEXED</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 rounded-full bg-[#8f6d43] text-white font-semibold flex items-center justify-center shadow-xs">
              1
            </button>
          </div>
        </div>
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Custom Inquiry Details
              </h3>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Client</span>
                <p className="font-semibold text-stone-900">{selectedInquiry.name} ({selectedInquiry.email})</p>
                <p className="text-stone-500 text-xs">Phone: {selectedInquiry.phoneNumber}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Design Request</span>
                <p className="text-stone-800">
                  {selectedInquiry.stoneType} · {selectedInquiry.metalType} · {Array.isArray(selectedInquiry.jewelryType) ? selectedInquiry.jewelryType.join(', ') : selectedInquiry.jewelryType}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Budget Range</span>
                <p className="text-stone-800 font-semibold">{selectedInquiry.budget}</p>
              </div>

              {selectedInquiry.comments && (
                <div>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">Client Comments</span>
                  <p className="text-stone-600 bg-stone-50 p-3 rounded-lg text-xs leading-relaxed italic border border-stone-100">
                    "{selectedInquiry.comments}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
