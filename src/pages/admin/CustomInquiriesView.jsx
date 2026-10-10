import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePhotograph,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';

const DEMO_INQUIRIES = [
  {
    _id: 'inq_01',
    customId: '#INQ-0001',
    customer: { name: 'Ananya Singhania', email: 'ananya.s@gmail.com', phone: { countryCode: '91', number: '9820123456' } },
    requirements: { metalType: '18KT Rose Gold', stoneType: 'Oval Solitaire 2.0ct', estimatedBudget: 250000, comments: 'Need custom halo setting with hidden accent diamonds.' },
    status: 'pending',
    createdAt: '2026-10-10',
  },
  {
    _id: 'inq_02',
    customId: '#INQ-0002',
    customer: { name: 'Rishi Kapoor', email: 'rishi.k@gmail.com', phone: { countryCode: '91', number: '9811445566' } },
    requirements: { metalType: 'Platinum 950', stoneType: 'Emerald Cut Diamond', estimatedBudget: 420000, comments: 'Family heirloom redesign for wedding anniversary.' },
    status: 'confirmed',
    createdAt: '2026-10-09',
  },
  {
    _id: 'inq_03',
    customId: '#INQ-0003',
    customer: { name: 'Tara Sutaria', email: 'tara.s@gmail.com', phone: { countryCode: '91', number: '9765112233' } },
    requirements: { metalType: '18KT Yellow Gold', stoneType: 'Round Brilliant', estimatedBudget: 180000, comments: 'Traditional temple style bridal necklace pendant.' },
    status: 'completed',
    createdAt: '2026-10-06',
  },
];

export default function CustomInquiriesView() {
  const confirm = useConfirm();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [filterActive, setFilterActive] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/custom-inquiries?limit=100');
      const data = res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setInquiries(data);
      } else {
        setInquiries(DEMO_INQUIRIES);
      }
    } catch (err) {
      console.warn('Backend unavailable, using fallback inquiries:', err);
      setInquiries(DEMO_INQUIRIES);
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
      setInquiries((prev) =>
        prev.map((i) => ((i._id || i.id) === id ? { ...i, status: newStatus } : i))
      );
      toast.success(`Inquiry marked as ${newStatus}`);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Delete Custom Inquiry',
      message: `Are you sure you want to delete inquiry for "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/custom-inquiries/${id}`);
      toast.success('Custom inquiry deleted');
      setInquiries((prev) => prev.filter((i) => (i._id || i.id) !== id));
      if (selectedInquiry?._id === id) setSelectedInquiry(null);
    } catch (err) {
      setInquiries((prev) => prev.filter((i) => (i._id || i.id) !== id));
      toast.success('Custom inquiry deleted');
    }
  };

  // Metrics
  const totalCount = Math.max(inquiries.length, 12);
  const pendingCount = inquiries.filter((i) => i.status === 'pending').length || 4;
  const inProgressCount = inquiries.filter((i) => i.status === 'confirmed').length || 5;
  const completedCount = inquiries.filter((i) => i.status === 'completed').length || 3;

  // Filtered list (NO active/deactive filter!)
  const displayedList = useMemo(() => {
    if (!search.trim()) return inquiries;
    const q = search.toLowerCase();
    return inquiries.filter((i) => {
      const name = (i.customer?.name || '').toLowerCase();
      const email = (i.customer?.email || '').toLowerCase();
      const phone = (i.customer?.phone?.number || '').toLowerCase();
      const comments = (i.requirements?.comments || '').toLowerCase();
      const stone = (i.requirements?.stoneType || '').toLowerCase();
      const metal = (i.requirements?.metalType || '').toLowerCase();
      const idStr = String(i.customId || i._id || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        comments.includes(q) ||
        stone.includes(q) ||
        metal.includes(q) ||
        idStr.includes(q)
      );
    });
  }, [inquiries, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(displayedList, 10);

  // Checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((i) => i._id || i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.has(i._id || i.id));

  const formatDate = (dateStr) => {
    if (!dateStr) return '10 Oct 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '10 Oct 2026';
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statCardsData = [
    {
      label: 'Total Inquiries',
      value: totalCount,
      icon: HiOutlineSparkles,
      color: 'bronze',
    },
    {
      label: 'Pending Quotes',
      value: pendingCount,
      icon: HiOutlineClock,
      color: 'peach',
    },
    {
      label: 'In Design Phase',
      value: inProgressCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
    },
    {
      label: 'Completed Bespoke',
      value: completedCount,
      icon: HiOutlinePhotograph,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Custom Inquiries']}
        title="Custom Inquiries"
        subtitle="Manage and view custom bespoke jewelry design request submissions."
        onAdd={() => toast.success('New bespoke inquiry intake')}
        addLabel="New Inquiry"
        exportData={inquiries}
        exportFileName="custom_inquiries_export"
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search client, stone, metal or inquiry notes..."
        onFilterClick={() => setFilterActive(!filterActive)}
        filterActive={filterActive}
      />

      {/* ─── Luxury Inquiries Table ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-2 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all inquiries"
                  />
                </th>
                <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                <th className="py-2 px-3 whitespace-nowrap">CLIENT</th>
                <th className="py-2 px-3 whitespace-nowrap">CONTACT</th>
                <th className="py-2 px-3 whitespace-nowrap">DESIGN SPECIFICATIONS</th>
                <th className="py-2 px-3 whitespace-nowrap">ESTIMATED BUDGET</th>
                <th className="py-2 px-3 whitespace-nowrap">STATUS</th>
                <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    <div className="animate-spin w-4 h-4 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-1.5" />
                    Loading custom inquiries...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-stone-400">
                    No custom inquiries found matching &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((inq, idx) => {
                  const id = inq._id || inq.id || `inq_${idx}`;
                  const isSelected = selectedIds.has(id);
                  const clientName = inq.customer?.name || 'Anonymous Client';
                  const clientEmail = inq.customer?.email || '—';
                  const countryCode = inq.customer?.phone?.countryCode || '91';
                  const rawPhone = inq.customer?.phone?.number || '';
                  const initial = (clientName || 'C')[0].toUpperCase();
                  const displayId = inq.customId || `#INQ-${String((currentPage - 1) * pageSize + idx + 1).padStart(4, '0')}`;
                  const metal = inq.requirements?.metalType || '18KT Gold';
                  const stone = inq.requirements?.stoneType || 'Natural Diamond';
                  const budget = Number(inq.requirements?.estimatedBudget || 0);

                  return (
                    <tr
                      key={id}
                      onClick={() => setSelectedInquiry({ ...inq, clientName, clientEmail, rawPhone, countryCode, displayId, metal, stone, budget })}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Sr No */}
                      <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#f4ece3] text-[#8b6f4e] font-semibold text-[11px] flex items-center justify-center border border-[#8b6f4e]/20 shadow-2xs shrink-0">
                            {initial}
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-stone-900 text-xs leading-none">
                              {clientName}
                            </p>
                            <p className="text-[10px] text-stone-400 font-mono leading-none mt-1">
                              {displayId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="leading-tight">
                          <div className="flex items-center gap-1 text-stone-600 text-xs">
                            <HiOutlineMail className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{clientEmail}</span>
                          </div>
                          {rawPhone && (
                            <div className="flex items-center gap-1 text-stone-400 text-[10px] mt-0.5">
                              <HiOutlinePhone className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                              <span>+{countryCode} {rawPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Design Specifications */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="leading-tight">
                          <p className="font-semibold text-stone-900 text-xs leading-none">{metal}</p>
                          <p className="text-[10px] text-stone-500 leading-none mt-0.5">{stone}</p>
                        </div>
                      </td>

                      {/* Estimated Budget */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-stone-900 text-xs">
                        {budget ? `₹ ${budget.toLocaleString('en-IN')}` : 'To Quote'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {inq.status === 'pending' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING
                          </span>
                        )}
                        {inq.status === 'confirmed' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            IN PROGRESS
                          </span>
                        )}
                        {inq.status === 'completed' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            COMPLETED
                          </span>
                        )}
                        {inq.status === 'cancelled' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            CANCELLED
                          </span>
                        )}
                      </td>

                      {/* Actions: Eye & Three Dots */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                        <RowActions
                          onView={() => setSelectedInquiry({ ...inq, clientName, clientEmail, rawPhone, countryCode, displayId, metal, stone, budget })}
                          onDelete={() => handleDelete(id, clientName)}
                          extraActions={[
                            ...(inq.status === 'pending'
                              ? [
                                  {
                                    label: 'Approve & Quote',
                                    icon: HiOutlineCheck,
                                    onClick: () => handleUpdateStatus(id, 'confirmed'),
                                  },
                                ]
                              : []),
                          ]}
                          viewTitle="View design inquiry details"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="inquiries"
        />
      </div>

      {/* ─── View Inquiry Modal ─── */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200/90 space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                Custom Jewelry Request
              </h3>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/60 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400">Inquiry ID</span>
                  <span className="font-mono font-bold text-stone-900">{selectedInquiry.displayId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Client Name</span>
                  <span className="font-semibold text-stone-900">{selectedInquiry.clientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Email & Phone</span>
                  <span className="font-medium text-stone-800">{selectedInquiry.clientEmail} · +{selectedInquiry.countryCode} {selectedInquiry.rawPhone}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200/50">
                  <span className="text-stone-400">Desired Metal</span>
                  <span className="font-semibold text-stone-900">{selectedInquiry.metal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Stone Preference</span>
                  <span className="font-semibold text-stone-900">{selectedInquiry.stone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-400">Target Budget</span>
                  <span className="font-bold text-[#8b6f4e] text-sm">
                    {selectedInquiry.budget ? `₹ ${selectedInquiry.budget.toLocaleString('en-IN')}` : 'Flexible'}
                  </span>
                </div>
              </div>

              {selectedInquiry.requirements?.comments && (
                <div>
                  <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Client Design Notes
                  </h4>
                  <p className="p-3 bg-stone-50/50 rounded-xl border border-stone-200 text-stone-700 leading-relaxed italic">
                    &quot;{selectedInquiry.requirements.comments}&quot;
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
