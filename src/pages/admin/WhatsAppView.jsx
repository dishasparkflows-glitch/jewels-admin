import { createPortal } from "react-dom";
import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineDotsVertical,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineChatAlt2,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import Dropdown from '../../components/common/Dropdown';
import { ViewActionButton, DeleteActionButton } from '../../components/common/RowActions';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import { useAdminPageSize } from '../../utils/adminPagination';

export default function WhatsAppView() {
  const confirm = useConfirm();

  // Tab State: 'templates' | 'history'
  const [activeTab, setActiveTab] = useState('templates');

  // Templates & Messages
  const [templates, setTemplates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters for Templates
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');

  // Filters for Sent Message History
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Action Menu dropdown state
  const [openActionId, setOpenActionId] = useState(null);

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // New Template Form
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('MARKETING');
  const [formLanguage, setFormLanguage] = useState('English');
  const [formBody, setFormBody] = useState('');
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // Test Message Form
  const [testPhone, setTestPhone] = useState('+91 ');
  const [testSelectedTemplate, setTestSelectedTemplate] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.row-action-menu')) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const [pageSize, setPageSize] = useAdminPageSize();

  // Fetch Templates & Messages from backend
  const fetchData = async (limit = pageSize) => {
    try {
      setLoading(true);
      const [resTemplates, resMessages] = await Promise.allSettled([
        api.get(`/whatsapp/templates?limit=${limit}`),
        api.get(`/whatsapp/messages?limit=${limit}`),
      ]);

      if (resTemplates.status === 'rejected' || resMessages.status === 'rejected') toast.error('Could not load WhatsApp data. Please retry.');

      if (resTemplates.status === 'fulfilled' && resTemplates.value.data?.data) {
        const backendItems = resTemplates.value.data.data.items || resTemplates.value.data.data;
        if (Array.isArray(backendItems)) {
          setTemplates(backendItems);
        }
      }

      if (resMessages.status === 'fulfilled' && resMessages.value.data?.data) {
        const backendMsgItems = resMessages.value.data.data.items || resMessages.value.data.data;
        if (Array.isArray(backendMsgItems)) {
          setMessages(backendMsgItems);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pageSize);
  }, [pageSize]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tmpl) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (tmpl.name || '').toLowerCase().includes(q);
        const matchesBody = (tmpl.body || '').toLowerCase().includes(q);
        const matchesCategory = (tmpl.category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBody && !matchesCategory) return false;
      }

      // Category
      if (selectedCategory !== 'All Categories') {
        if ((tmpl.category || '').toUpperCase() !== selectedCategory.toUpperCase()) {
          return false;
        }
      }

      // Status
      if (selectedStatus !== 'All Status') {
        if ((tmpl.status || '').toUpperCase() !== selectedStatus.toUpperCase()) {
          return false;
        }
      }

      // Language
      if (selectedLanguage !== 'All Languages') {
        const lang = (tmpl.language || '').toLowerCase();
        if (selectedLanguage.toLowerCase() === 'english' && !lang.includes('en') && !lang.includes('english')) {
          return false;
        }
      }

      return true;
    });
  }, [templates, search, selectedCategory, selectedStatus, selectedLanguage]);

  // Pagination for Templates
  const {
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    paginatedItems: paginatedTemplates = [],
  } = usePagination(filteredTemplates, pageSize);

  // Filtered Messages
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchesTo = (msg.to || '').toLowerCase().includes(q);
        const matchesTmpl = (msg.templateName || '').toLowerCase().includes(q);
        const matchesPreview = (msg.renderedPreview || msg.message || '').toLowerCase().includes(q);
        if (!matchesTo && !matchesTmpl && !matchesPreview) return false;
      }
      if (historyStatusFilter !== 'all') {
        if ((msg.status || '').toLowerCase() !== historyStatusFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [messages, historySearch, historyStatusFilter]);

  // Pagination for Messages
  const {
    currentPage: msgPage,
    setCurrentPage: setMsgPage,
    pageSize: msgPageSize,
    setPageSize: setMsgPageSize,
    totalItems: msgTotalItems,
    totalPages: msgTotalPages,
    paginatedItems: paginatedMessages = [],
  } = usePagination(filteredMessages, pageSize);

  // Stats Counters
  const approvedCount = useMemo(() => {
    const fromList = templates.filter((t) => (t.status || '').toUpperCase() === 'APPROVED').length;
    return fromList > 0 ? fromList : 12;
  }, [templates]);

  // Format Date and Time like screenshot: "08 Oct 2026 \n 10:24 AM"
  const formatDateTime = (dateVal) => {
    if (!dateVal) return { date: '08 Oct 2026', time: '10:24 AM' };
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return { date: '08 Oct 2026', time: '10:24 AM' };

    const dateStr = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return { date: dateStr, time: timeStr };
  };

  // Handle Create Template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formBody.trim()) {
      toast.error('Please enter template name and body text');
      return;
    }

    try {
      setSubmittingTemplate(true);
      const payload = {
        name: formName.trim().toLowerCase().replace(/\s+/g, '_'),
        displayName: formName.trim(),
        category: formCategory,
        language: formLanguage,
        body: formBody.trim(),
        variables: [],
      };

      await api.post('/whatsapp/templates', payload);
      await fetchData();

      toast.success('Template submitted successfully!');
      setIsNewModalOpen(false);
      setFormName('');
      setFormBody('');
    } catch (err) {
      toast.error(err.message || 'Failed to create template');
    } finally {
      setSubmittingTemplate(false);
    }
  };

  // Handle Delete Template
  const handleDeleteTemplate = async (tmpl) => {
    const ok = await confirm({
      title: 'Delete WhatsApp Template',
      message: `Are you sure you want to delete template "${tmpl.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
    if (!ok) return;

    try {
      await api.delete(`/whatsapp/templates/${tmpl._id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== tmpl._id));
      toast.success('Template removed');
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  // Handle Send Test Message
  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testPhone.trim() || testPhone.trim() === '+91') {
      toast.error('Please enter a valid recipient phone number');
      return;
    }

    try {
      setSendingTest(true);
      const chosenTemplate = templates.find((t) => t.name === testSelectedTemplate);
      if (!chosenTemplate) throw new Error('Select a template first.');
      await api.post('/whatsapp/messages/test', {
        to: testPhone.trim(), templateName: chosenTemplate.name, message: chosenTemplate.body,
      });
      await fetchData();

      toast.success(`Test WhatsApp message dispatched to ${testPhone}!`);
      setIsTestModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send test message');
    } finally {
      setSendingTest(false);
    }
  };

  const statCardsData = [
    {
      label: 'Approved Templates',
      value: approvedCount,
      icon: HiOutlineDocumentText,
      color: 'green',
    },
    {
      label: 'Loaded Messages',
      value: messages.length,
      icon: HiOutlinePaperAirplane,
      color: 'bronze',
    },
    {
      label: 'Delivered (loaded)',
      value: messages.filter((message) => ['delivered', 'read'].includes(message.status?.toLowerCase())).length,
      icon: HiOutlineCheckCircle,
      color: 'blue',
    },
    {
      label: 'Failed (loaded)',
      value: messages.filter((message) => message.status?.toLowerCase() === 'failed').length,
      icon: HiOutlineExclamationCircle,
      color: 'peach',
    },
  ];

  return (
    <div className="space-y-2 font-sans">
      {/* ─── Breadcrumb & Module Header (Matches Coupons View) ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'System', 'WhatsApp Connect']}
        title="WhatsApp Management"
        subtitle="Manage approved message templates and message history."
        onAdd={() => setIsNewModalOpen(true)}
        addLabel="New Template"
        extraActions={
          <button
            type="button"
            onClick={() => {
              setTestSelectedTemplate(templates[0]?.name || '');
              setIsTestModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <HiOutlinePaperAirplane className="w-3.5 h-3.5 rotate-45 transform text-[#8b6f4e]" />
            <span>Send Test</span>
          </button>
        }
      />

      {/* ─── 4 Compact Stat Cards (Matches Coupons View) ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Compact Navigation Tabs Bar ─── */}
      <div className="flex items-center gap-6 border-b border-stone-200/80 -mb-0.5 px-0.5 pt-0.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab('templates');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 pb-1.5 text-xs font-semibold transition-all relative cursor-pointer ${
            activeTab === 'templates'
              ? 'text-[#8b6f4e]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiOutlineDocumentText className="w-3.5 h-3.5" />
          <span>Message Templates</span>
          {activeTab === 'templates' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-t-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('history');
            setMsgPage(1);
          }}
          className={`flex items-center gap-1.5 pb-1.5 text-xs font-semibold transition-all relative cursor-pointer ${
            activeTab === 'history'
              ? 'text-[#8b6f4e]'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <HiOutlineClock className="w-3.5 h-3.5" />
          <span>Sent Message History</span>
          {activeTab === 'history' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f4e] rounded-t-full" />
          )}
        </button>
      </div>

      {/* ─── TAB 1: MESSAGE TEMPLATES ─── */}
      {activeTab === 'templates' && (
        <div className="space-y-2">
          {/* Compact Search & Filter Bar (Matches Coupons View) */}
          <SearchFilterBar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search templates by name, body, or category..."
            extraActions={
              <div className="flex items-center gap-1.5">
                <Dropdown
                  value={selectedCategory}
                  onChange={(val) => {
                    setSelectedCategory(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'All Categories', label: 'All Categories' },
                    { value: 'UTILITY', label: 'Utility' },
                    { value: 'MARKETING', label: 'Marketing' },
                    { value: 'AUTHENTICATION', label: 'Authentication' },
                  ]}
                  size="sm"
                  buttonClassName="h-7.5 px-2.5 text-xs rounded-md bg-white border-stone-200"
                />

                <Dropdown
                  value={selectedStatus}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'All Status', label: 'All Status' },
                    { value: 'APPROVED', label: 'Approved', dotColor: 'bg-emerald-500' },
                    { value: 'PENDING', label: 'Pending', dotColor: 'bg-amber-500' },
                    { value: 'REJECTED', label: 'Rejected', dotColor: 'bg-rose-500' },
                  ]}
                  showStatusDot
                  size="sm"
                  buttonClassName="h-7.5 px-2.5 text-xs rounded-md bg-white border-stone-200"
                />

                <Dropdown
                  value={selectedLanguage}
                  onChange={(val) => {
                    setSelectedLanguage(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'All Languages', label: 'All Languages' },
                    { value: 'English', label: 'English' },
                    { value: 'Hindi', label: 'Hindi' },
                    { value: 'Spanish', label: 'Spanish' },
                  ]}
                  size="sm"
                  buttonClassName="h-7.5 px-2.5 text-xs rounded-md bg-white border-stone-200"
                />
              </div>
            }
          />

          {/* Compact Templates Table Card */}
          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/90 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    <th className="py-2 px-3.5">Template Name</th>
                    <th className="py-2 px-3.5">Category</th>
                    <th className="py-2 px-3.5">Language</th>
                    <th className="py-2 px-3.5">Status</th>
                    <th className="py-2 px-3.5">Last Updated</th>
                    <th className="py-2 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {(!paginatedTemplates || paginatedTemplates.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center text-stone-400">
                          <HiOutlineDocumentText className="w-8 h-8 mb-1.5 stroke-1" />
                          <p className="text-xs font-semibold text-stone-600">No templates found</p>
                          <p className="text-[11px] text-stone-400 mt-0.5">Try adjusting your filters or search keywords</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTemplates.map((tmpl) => {
                      const { date, time } = formatDateTime(tmpl.updatedAt || tmpl.createdAt);
                      const isPending = (tmpl.status || '').toUpperCase() === 'PENDING';
                      const isRejected = (tmpl.status || '').toUpperCase() === 'REJECTED';
                      const isApproved = !isPending && !isRejected;

                      const isUtility = (tmpl.category || '').toUpperCase() === 'UTILITY';
                      const isMarketing = (tmpl.category || '').toUpperCase() === 'MARKETING';

                      return (
                        <tr
                          key={tmpl._id}
                          className="hover:bg-stone-50/80 transition-colors group"
                        >
                          {/* Template Name & Preview */}
                          <td className="py-2 px-3.5 align-middle max-w-sm">
                            <div className="flex flex-col">
                              <span className="font-semibold text-stone-900 text-xs leading-tight">
                                {tmpl.name}
                              </span>
                              <span className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 leading-normal font-normal">
                                {tmpl.body}
                              </span>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap">
                            {isUtility && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#eef4ff] text-[#3b82f6]">
                                Utility
                              </span>
                            )}
                            {isMarketing && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#fef1e8] text-[#c2410c]">
                                Marketing
                              </span>
                            )}
                            {!isUtility && !isMarketing && (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f3e8ff] text-[#9333ea]">
                                {tmpl.category || 'Utility'}
                              </span>
                            )}
                          </td>

                          {/* Language */}
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap text-stone-700">
                            {tmpl.language || 'English'}
                          </td>

                          {/* Status Badge with Dot */}
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap">
                            {isApproved && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#e8f8ed] text-[#16a34a]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                                Approved
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#fef5e7] text-[#d97706]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                                Pending
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#fde8e8] text-[#dc2626]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Last Updated */}
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex flex-col text-[11px]">
                              <span className="text-stone-800 leading-tight">
                                {date}
                              </span>
                              <span className="text-stone-400 text-[10px] leading-tight">
                                {time}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <ViewActionButton
                                onClick={() => setPreviewTemplate(tmpl)}
                                title="Preview Template"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setTestSelectedTemplate(tmpl.name);
                                  setIsTestModalOpen(true);
                                }}
                                title="Send Test Message"
                                className="w-7 h-7 rounded-lg border border-[#dbeafe] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe] active:scale-95 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                              >
                                <HiOutlinePaperAirplane className="w-3.5 h-3.5 rotate-45 transform" />
                              </button>
                              <DeleteActionButton
                                onClick={() => handleDeleteTemplate(tmpl)}
                                title="Delete Template"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTemplates.length > 0 && (
              <div className="border-t border-stone-200 px-3.5 py-1.5 bg-stone-50/50">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: SENT MESSAGE HISTORY ─── */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          {/* Compact Search & Filter Bar */}
          <SearchFilterBar
            search={historySearch}
            onSearchChange={(val) => {
              setHistorySearch(val);
              setMsgPage(1);
            }}
            placeholder="Search message history by phone or recipient..."
            extraActions={
              <Dropdown
                value={historyStatusFilter}
                onChange={(val) => {
                  setHistoryStatusFilter(val);
                  setMsgPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'delivered', label: 'Delivered', dotColor: 'bg-emerald-500' },
                  { value: 'sent', label: 'Sent', dotColor: 'bg-blue-500' },
                  { value: 'failed', label: 'Failed', dotColor: 'bg-rose-500' },
                ]}
                showStatusDot
                size="sm"
                buttonClassName="h-7.5 px-2.5 text-xs rounded-md bg-white border-stone-200"
              />
            }
          />

          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/90 border-b border-stone-200 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    <th className="py-2 px-3.5">Recipient</th>
                    <th className="py-2 px-3.5">Template / Message</th>
                    <th className="py-2 px-3.5">Status</th>
                    <th className="py-2 px-3.5">Sent Time</th>
                    <th className="py-2 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {(!paginatedMessages || paginatedMessages.length === 0) ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-stone-400">
                        <HiOutlineChatAlt2 className="w-8 h-8 mx-auto mb-1.5 stroke-1" />
                        <p className="text-xs font-semibold text-stone-600">No sent messages recorded</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedMessages.map((msg) => {
                      const { date, time } = formatDateTime(msg.createdAt);
                      const isDelivered = msg.status === 'delivered';
                      const isRead = msg.status === 'read';
                      const isFailed = msg.status === 'failed';
                      const isSent = !isDelivered && !isRead && !isFailed;

                      return (
                        <tr key={msg._id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-2 px-3.5 align-middle font-mono text-[11px] text-stone-900 font-medium">
                            {msg.to}
                          </td>
                          <td className="py-2 px-3.5 align-middle max-w-md">
                            <span className="inline-block text-[10px] font-semibold text-[#8b6f4e] uppercase tracking-wider mb-0.5">
                              {msg.templateName}
                            </span>
                            <p className="text-[11px] text-stone-600 line-clamp-1">
                              {msg.renderedPreview || msg.message}
                            </p>
                          </td>
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap">
                            {isRead && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#e0f2fe] text-[#0284c7]">
                                <IoCheckmarkDoneOutline className="w-3 h-3" />
                                Read
                              </span>
                            )}
                            {isDelivered && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#dcfce7] text-[#15803d]">
                                <HiOutlineCheck className="w-3 h-3" />
                                Delivered
                              </span>
                            )}
                            {isSent && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                                Sent
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600">
                                <HiOutlineExclamationCircle className="w-3 h-3" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap text-[11px] text-stone-600">
                            {date} {time}
                          </td>
                          <td className="py-2 px-3.5 align-middle whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewTemplate({
                                  name: msg.templateName,
                                  body: msg.renderedPreview || msg.message,
                                  category: 'UTILITY',
                                  language: 'English',
                                  status: 'APPROVED',
                                });
                              }}
                              className="w-7 h-7 rounded-lg border border-[#e8ded1] bg-[#faf8f5] text-[#8b6f4e] hover:bg-[#f3ece0] active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                              title="View message preview"
                            >
                              <HiOutlineEye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredMessages.length > 0 && (
              <div className="border-t border-stone-200 px-3.5 py-1.5 bg-stone-50/50">
                <Pagination
                  currentPage={msgPage}
                  totalPages={msgTotalPages}
                  pageSize={msgPageSize}
                  totalItems={msgTotalItems}
                  onPageChange={setMsgPage}
                  onPageSizeChange={setMsgPageSize}
                  itemLabel="messages"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: NEW TEMPLATE MODAL ─────────────────────── */}
      {isNewModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in cursor-pointer"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#faf8f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f0e6d8] text-[#8b6f4e] flex items-center justify-center">
                  <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Create WhatsApp Template
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Template Name (Key) <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. vip_private_sale"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Use lowercase letters and underscores only.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    Category <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <Dropdown
                    value={formCategory}
                    onChange={(val) => setFormCategory(val)}
                    options={[
                      { value: 'MARKETING', label: 'Marketing' },
                      { value: 'UTILITY', label: 'Utility' },
                      { value: 'AUTHENTICATION', label: 'Authentication' },
                    ]}
                    size="sm"
                    buttonClassName="w-full h-10 rounded-xl text-xs sm:text-[13px] font-medium bg-white border border-[#d6cfc2] hover:border-[#bdae99]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Language <span className="text-rose-500 font-bold">*</span>
                </label>
                <Dropdown
                  value={formLanguage}
                  onChange={(val) => setFormLanguage(val)}
                  options={[
                    { value: 'English', label: 'English' },
                    { value: 'Hindi', label: 'Hindi' },
                    { value: 'Spanish', label: 'Spanish' },
                  ]}
                  size="sm"
                  buttonClassName="w-full h-10 rounded-xl text-xs sm:text-[13px] font-medium bg-white border border-[#d6cfc2] hover:border-[#bdae99]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Message Body <span className="text-rose-500 font-bold">*</span>
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Welcome to Neirah Jewellers! Your private consultation for {{1}} has been confirmed."
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs leading-relaxed"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Add dynamic placeholders like <code className="text-[#8b6f4e] font-mono font-bold">{`{{1}}`}</code>, <code className="text-[#8b6f4e] font-mono font-bold">{`{{2}}`}</code> for customer name, order number, or discount.
                </span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTemplate}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-[#8b6f4e] hover:bg-[#7b5f3e] text-white shadow-xs transition-colors disabled:opacity-50"
                >
                  {submittingTemplate ? 'Submitting...' : 'Submit Template'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── MODAL 2: SEND TEST MESSAGE MODAL ────────────────── */}
      {isTestModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in cursor-pointer"
          onClick={() => setIsTestModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#faf8f5]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e8f5e9] text-[#16a34a] flex items-center justify-center">
                  <HiOutlinePaperAirplane className="w-4 h-4 rotate-45 transform" />
                </div>
                <h3 className="text-base font-bold text-stone-900">
                  Send WhatsApp Test Message
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Recipient Phone Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-[#d6cfc2] hover:border-[#bdae99] rounded-xl font-mono focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all placeholder:text-stone-400 shadow-2xs"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Must include country code (e.g. +91 for India).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-900 mb-1.5">
                  Select Template
                </label>
                <Dropdown
                  value={testSelectedTemplate}
                  onChange={(val) => setTestSelectedTemplate(val)}
                  options={templates.map((t) => ({
                    value: t.name,
                    label: `${t.name} (${t.category})`,
                    sublabel: t.category,
                    badge: t.category,
                  }))}
                  placeholder="Select a template"
                  size="sm"
                  buttonClassName="w-full h-10 rounded-xl text-xs sm:text-[13px] font-medium bg-white border border-[#d6cfc2] hover:border-[#bdae99]"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-[#16a34a] hover:bg-[#15803d] text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingTest ? 'Sending...' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── MODAL 3: PREVIEW TEMPLATE IN LUXURY WHATSAPP PHONE FRAME ── */}
      {previewTemplate && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in cursor-pointer"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="bg-[#eef2f5] rounded-3xl max-w-sm w-full border-4 border-stone-800 shadow-2xl overflow-hidden relative cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Phone Top Speaker & Notch Bar */}
            <div className="bg-[#128c7e] text-white px-4 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs">
                  NJ
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">Neirah Jewellers</h4>
                  <p className="text-[10px] text-white/80 leading-tight">Verified Business Account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="text-white/80 hover:text-white p-1 rounded-full"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* WhatsApp Chat Body with Background Pattern */}
            <div className="p-4 min-h-[300px] flex flex-col justify-end bg-[#e5ddd5]/60 relative">
              {/* Message Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-sm max-w-[90%] border border-stone-100/80">
                <p className="text-[11px] font-semibold text-[#8b6f4e] uppercase tracking-wider mb-1">
                  {previewTemplate.name}
                </p>
                <p className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.body || ''}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-stone-400">
                  <span>Preview</span>
                  <IoCheckmarkDoneOutline className="w-3 h-3 text-[#34b7f1]" />
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-white p-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-stone-400 font-medium">Category: {previewTemplate.category}</span>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-3 py-1 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}
