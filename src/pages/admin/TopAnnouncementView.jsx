import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineDuplicate,
  HiOutlineTrash,
  HiOutlineCalendar,
  HiOutlineLink,
  HiOutlinePlus,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCheck,
} from 'react-icons/hi';
import { MdDragIndicator } from 'react-icons/md';
import toast from 'react-hot-toast';
import { topAnnouncementsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import Modal from '../../components/common/Modal';

// Helper to format dates matching the exact screenshot: "13 Oct 2026 - No end"
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatSchedule = (item) => {
  const start = formatDate(item.startDate) || formatDate(new Date());
  if (item.hasNoEndDate || !item.endDate) {
    return `${start} - No end`;
  }
  const end = formatDate(item.endDate);
  return `${start} - ${end}`;
};

// Input date helper: yyyy-mm-dd for input[type="date"]
const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

export default function TopAnnouncementView() {
  const confirm = useConfirm();
  const [announcements, setAnnouncements] = useState([]);
  const [settings, setSettings] = useState({ isEnabled: true, autoplayInterval: 4000 });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Live preview slider index
  const [previewIndex, setPreviewIndex] = useState(0);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal form fields
  const [formData, setFormData] = useState({
    message: '',
    link: '',
    isActive: true,
    hasNoEndDate: true,
    startDate: toInputDate(new Date()),
    endDate: '',
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await topAnnouncementsAPI.getAll({ limit: 100 });
      const items = res.data?.data || [];
      setAnnouncements(items);
      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load top announcements:', err);
      toast.error('Failed to load announcements data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter active announcements for the top interactive preview banner
  const activeAnnouncements = useMemo(() => {
    return announcements.filter((a) => a.isActive);
  }, [announcements]);

  // Keep preview index in bounds
  useEffect(() => {
    if (previewIndex >= activeAnnouncements.length && activeAnnouncements.length > 0) {
      setPreviewIndex(0);
    }
  }, [activeAnnouncements.length, previewIndex]);

  // Auto-cycle live preview slider
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, settings.autoplayInterval || 4000);
    return () => clearInterval(interval);
  }, [activeAnnouncements.length, settings.autoplayInterval]);

  // Handle global toggle "Enable Announcement Bar"
  const handleToggleGlobal = async (nextVal) => {
    try {
      setSavingSettings(true);
      const updated = { ...settings, isEnabled: nextVal };
      setSettings(updated);
      await topAnnouncementsAPI.updateSettings(updated);
      toast.success(nextVal ? 'Announcement bar enabled on website' : 'Announcement bar hidden on website');
    } catch (err) {
      console.error('Failed to update announcement bar setting:', err);
      toast.error('Failed to update setting');
      // Revert on error
      setSettings((prev) => ({ ...prev, isEnabled: !nextVal }));
    } finally {
      setSavingSettings(false);
    }
  };

  // Open modal for Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      message: '',
      link: '',
      isActive: true,
      hasNoEndDate: true,
      startDate: toInputDate(new Date()),
      endDate: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      message: item.message || '',
      link: item.link || '',
      isActive: item.isActive ?? true,
      hasNoEndDate: item.hasNoEndDate ?? true,
      startDate: toInputDate(item.startDate) || toInputDate(new Date()),
      endDate: toInputDate(item.endDate) || '',
    });
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error('Please enter an announcement message');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        message: formData.message.trim(),
        link: formData.link.trim(),
        isActive: formData.isActive,
        hasNoEndDate: formData.hasNoEndDate,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.hasNoEndDate ? null : (formData.endDate ? new Date(formData.endDate) : null),
      };

      if (editingItem) {
        await topAnnouncementsAPI.update(editingItem._id, payload);
        toast.success('Announcement updated successfully');
      } else {
        await topAnnouncementsAPI.create(payload);
        toast.success('Announcement added successfully');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle individual announcement active status
  const handleToggleStatus = async (item) => {
    try {
      // Optimistic update
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, isActive: !a.isActive } : a))
      );
      await topAnnouncementsAPI.toggleStatus(item._id);
      toast.success(`Announcement set to ${!item.isActive ? 'active' : 'inactive'}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to toggle status');
      // Revert on error
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, isActive: item.isActive } : a))
      );
    }
  };

  // Duplicate an announcement
  const handleDuplicate = async (item) => {
    try {
      const res = await topAnnouncementsAPI.duplicate(item._id);
      toast.success('Announcement duplicated');
      fetchData();
    } catch (err) {
      console.error('Failed to duplicate announcement:', err);
      toast.error('Failed to duplicate announcement');
    }
  };

  // Delete an announcement
  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: 'Delete Announcement',
      message: `Are you sure you want to delete "${item.message}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await topAnnouncementsAPI.delete(item._id);
      toast.success('Announcement deleted');
      setAnnouncements((prev) => prev.filter((a) => a._id !== item._id));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      toast.error('Failed to delete announcement');
    }
  };

  // Drag and drop reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...announcements];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update locally
    setDraggedIndex(index);
    setAnnouncements(updated);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      const itemsToUpdate = announcements.map((it, idx) => ({
        id: it._id,
        order: idx + 1,
      }));
      await topAnnouncementsAPI.reorder(itemsToUpdate);
      toast.success('Order updated');
    } catch (err) {
      console.error('Failed to save reorder:', err);
      toast.error('Failed to save new order');
      fetchData();
    }
  };

  // Quick Emoji chips helper
  const quickEmojis = ['✨', '🚚', '📱', '🎁', '💬', '💎', '💍', '🎉', '🏷️'];
  const insertEmoji = (emoji) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message + (prev.message && !prev.message.endsWith(' ') ? ' ' : '') + emoji + ' ',
    }));
  };

  // View on website handler
  const handleViewOnWebsite = () => {
    const websiteUrl =
      import.meta.env.VITE_WEBSITE_URL ||
      window.location.origin.replace(':5174', ':5173');
    window.open(websiteUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─── Breadcrumb & Top Page Header (Matches User Screenshot) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <span>Marketing</span>
            <span className="text-stone-300">›</span>
            <span className="text-stone-600 font-semibold">Top Announcement Bar</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Top Announcement Bar (Header Banner)
          </h1>
          <p className="text-[13px] text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Add short messages to show on the top header of your website. You can add multiple lines and set them active/inactive.
          </p>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          {/* Enable Announcement Bar Switch */}
          <div className="flex items-center gap-3 bg-white border border-stone-200/90 rounded-2xl px-4 py-2 shadow-2xs">
            <div className="flex flex-col text-right">
              <span className="text-[13px] font-semibold text-stone-800 leading-tight">
                Enable Announcement Bar
              </span>
              <span className="text-[11px] text-stone-400 leading-tight">
                Shows at the top of website header
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.isEnabled}
              disabled={savingSettings}
              onClick={() => handleToggleGlobal(!settings.isEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.isEnabled ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* View on Website Button */}
          <button
            type="button"
            onClick={handleViewOnWebsite}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#fbf5ed] hover:bg-[#f5ebd9] border border-[#e8d7be] text-[#8b6f4e] font-semibold text-[13px] rounded-2xl transition-all shadow-2xs hover:shadow-xs active:scale-98"
          >
            <HiOutlineEye className="w-4 h-4 text-[#8b6f4e]" />
            <span>View on Website</span>
          </button>
        </div>
      </div>

      {/* ─── Live Preview Banner Card (Matches User Screenshot) ─── */}
      <div className="bg-[#fbf4eb] border border-[#ecdcc3] rounded-2xl px-5 py-3.5 shadow-2xs transition-all relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          {/* Prev Arrow */}
          <button
            type="button"
            onClick={() => {
              if (activeAnnouncements.length > 0) {
                setPreviewIndex(
                  (prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length
                );
              }
            }}
            disabled={activeAnnouncements.length <= 1}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous preview message"
          >
            <HiOutlineChevronLeft className="w-4 h-4" />
          </button>

          {/* Center Announcement Content */}
          <div className="flex-1 text-center py-0.5">
            {activeAnnouncements.length > 0 ? (
              <div className="inline-flex items-center justify-center gap-2 font-medium text-[13px] text-stone-800 transition-all duration-300 animate-fadeIn">
                <span>{activeAnnouncements[previewIndex]?.message}</span>
              </div>
            ) : (
              <span className="text-[13px] text-stone-400 italic">
                No active announcements to display. Add or activate one below.
              </span>
            )}
          </div>

          {/* Right Pagination dots & Next Arrow */}
          <div className="flex items-center gap-3">
            {/* Pagination Dots */}
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center gap-1.5">
                {activeAnnouncements.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setPreviewIndex(dotIdx)}
                    className={`rounded-full transition-all duration-300 ${
                      dotIdx === previewIndex
                        ? 'w-2 h-2 bg-[#8b6f4e]'
                        : 'w-1.5 h-1.5 bg-[#dfcfbb] hover:bg-[#bfa78a]'
                    }`}
                    title={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Next Arrow */}
            <button
              type="button"
              onClick={() => {
                if (activeAnnouncements.length > 0) {
                  setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length);
                }
              }}
              disabled={activeAnnouncements.length <= 1}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next preview message"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disabled Overlay Banner indicator */}
        {!settings.isEnabled && (
          <div className="absolute top-1 right-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-stone-200 text-stone-600 rounded-md">
              Bar Disabled
            </span>
          </div>
        )}
      </div>

      {/* ─── Main Section: Announcement Messages Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Section Header */}
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Announcement Messages
            </h2>
            <p className="text-[13px] text-stone-500 mt-0.5">
              Manage multiple announcement lines. You can drag to reorder them.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8b6f4e] hover:bg-[#785e42] text-white text-[13px] font-semibold rounded-2xl transition-all shadow-xs hover:shadow-md active:scale-98"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Add Announcement</span>
          </button>
        </div>

        {/* Table / Rows */}
        <div className="p-6 pt-3 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-stone-400">
              <div className="w-8 h-8 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineCalendar className="w-6 h-6" />
              </div>
              <p className="text-stone-700 font-semibold mb-1">No announcements yet</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mb-4">
                Add your first announcement or load default sample announcements.
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await topAnnouncementsAPI.seedDefaults();
                    toast.success('Default announcements created');
                    fetchData();
                  } catch (e) {
                    toast.error('Failed to seed defaults');
                  }
                }}
                className="px-4 py-2 text-xs font-medium text-[#8b6f4e] bg-[#fbf5ed] border border-[#e8d7be] rounded-xl hover:bg-[#f5ebd9] transition-colors"
              >
                Load Default Announcements
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="w-8 pb-1 pl-2"></th>
                  <th className="w-12 pb-1 text-center">#</th>
                  <th className="pb-1 min-w-[280px]">MESSAGE</th>
                  <th className="pb-1 min-w-[160px]">LINK (OPTIONAL)</th>
                  <th className="pb-1 w-24 text-center">STATUS</th>
                  <th className="pb-1 min-w-[200px]">SCHEDULE</th>
                  <th className="pb-1 w-28 text-right pr-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((item, index) => {
                  const isDragging = draggedIndex === index;
                  return (
                    <tr
                      key={item._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group transition-all duration-200 ${
                        isDragging ? 'opacity-40 scale-[0.99]' : 'opacity-100'
                      }`}
                    >
                      {/* Drag Handle */}
                      <td className="pl-2 pr-1 align-middle">
                        <button
                          type="button"
                          className="p-1 text-stone-300 hover:text-stone-600 cursor-grab active:cursor-grabbing rounded transition-colors"
                          title="Drag to reorder"
                        >
                          <MdDragIndicator className="w-5 h-5" />
                        </button>
                      </td>

                      {/* Number # */}
                      <td className="text-center align-middle">
                        <div className="w-8 h-8 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-center text-xs font-semibold text-stone-700 mx-auto">
                          {index + 1}
                        </div>
                      </td>

                      {/* Message Field */}
                      <td className="align-middle px-2">
                        <div className="bg-white border border-stone-200/90 rounded-2xl px-4 py-2.5 text-[13px] text-stone-800 font-medium shadow-2xs hover:border-[#8b6f4e]/50 transition-colors flex items-center gap-2">
                          <span className="truncate">{item.message}</span>
                        </div>
                      </td>

                      {/* Link Field */}
                      <td className="align-middle px-2">
                        <div className="bg-white border border-stone-200/90 rounded-2xl px-3.5 py-2.5 text-[13px] text-stone-600 font-normal shadow-2xs flex items-center gap-2 hover:border-[#8b6f4e]/50 transition-colors">
                          <HiOutlineLink className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate text-stone-700">
                            {item.link || <span className="text-stone-400 italic">No link</span>}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="text-center align-middle px-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={item.isActive}
                          onClick={() => handleToggleStatus(item)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            item.isActive ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                          title={`Click to set ${item.isActive ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              item.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Schedule Badge */}
                      <td className="align-middle px-2">
                        <div className="bg-white border border-stone-200/90 rounded-2xl px-3.5 py-2.5 text-[12px] text-stone-700 font-medium shadow-2xs flex items-center gap-2.5">
                          <HiOutlineCalendar className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="whitespace-nowrap">{formatSchedule(item)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="text-right align-middle pr-2 pl-2">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                            title="Edit Announcement"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(item)}
                            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                            title="Duplicate Announcement"
                          >
                            <HiOutlineDuplicate className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="w-8 h-8 rounded-xl bg-[#fdeeed] hover:bg-[#fadbd8] text-[#d93025] border border-[#fadbd8] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                            title="Delete Announcement"
                          >
                            <HiOutlineTrash className="w-4 h-4 stroke-2" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Add / Edit Announcement Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Announcement' : 'Add Announcement'}
        subtitle="Manage the announcement message, link destination, and scheduling."
        maxWidth="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-[13px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitForm}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-[13px] font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e42] rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-4 h-4" />
                  <span>{editingItem ? 'Update Message' : 'Save Announcement'}</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Announcement Message */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Message <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="e.g. BIS Hallmarked & Certified Jewellery ✨"
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
            />

            {/* Quick emoji helper chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-stone-400 font-medium">Insert:</span>
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="px-2 py-0.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                  title={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Link */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Link (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <HiOutlineLink className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="e.g. /about-bis or /collections/festive"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Internal path like /about-bis or full URL starting with https://
            </p>
          </div>

          {/* Status Switch */}
          <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl">
            <div>
              <span className="text-xs font-bold text-stone-900 block">
                Status
              </span>
              <span className="text-[11px] text-stone-500">
                {formData.isActive ? 'Active and visible on rotating banner' : 'Inactive (hidden from rotation)'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.isActive}
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                formData.isActive ? 'bg-emerald-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Schedule Configuration */}
          <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">
                Schedule & Duration
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={formData.hasNoEndDate}
                  onChange={(e) => setFormData({ ...formData, hasNoEndDate: e.target.checked })}
                  className="rounded text-[#8b6f4e] focus:ring-[#8b6f4e] w-4 h-4"
                />
                <span>No End Date (Continuous)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  onFocus={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                  onClick={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all cursor-pointer shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  End Date {formData.hasNoEndDate && <span className="text-stone-400 font-normal">(Disabled)</span>}
                </label>
                <input
                  type="date"
                  disabled={formData.hasNoEndDate}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  onFocus={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                  onClick={(e) => { try { e.target.showPicker?.(); } catch (err) {} }}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all disabled:bg-stone-100 disabled:text-stone-400 cursor-pointer shadow-2xs"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
