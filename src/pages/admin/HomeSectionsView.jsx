import { createPortal } from "react-dom";
import { useState, useEffect, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineTemplate,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi';
import {
  IoLayersOutline,
  IoDiamondOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import RowActions from '../../components/common/RowActions';
import ProductPickerModal from '../../components/common/ProductPickerModal';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import MobileGridList from '../../components/common/MobileGridList';
import { useAdminPageSize } from '../../utils/adminPagination';
import { slugify } from '../../utils/formatters';
import { getFrontBaseUrl } from '../../utils/productPreview';

const getProductBadgeLabel = (prod) => {
  if (prod.isOrnate || prod.productType === 'ornate') return 'ORNATE';
  const metal = (prod.metalName || '').toLowerCase();
  if (metal.includes('gold') || prod.productType === 'gold') return 'GOLD';
  if (metal.includes('silver') || prod.productType === 'silver') return 'SILVER';
  return 'JEWELRY';
};

export default function HomeSectionsView() {
  const confirm = useConfirm();

  // State
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [viewingSection, setViewingSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    sectionKey: '',
    order: 0,
    status: 'active',
    visibility: {
      website: true,
      mobileApp: true,
    },
    selectedProducts: [],
  });

  // Product Picker Modal State
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Upload state
  const [submitting, setSubmitting] = useState(false);

  // Reorder State
  const [reorderingItems, setReorderingItems] = useState([]);
  const [savingReorder, setSavingReorder] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Fetch sections
  const fetchSections = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await api.get(`/home-sections?page=${page}&limit=${limit}`);
      const items = res.data?.data?.items || res.data?.data || [];
      setSections(Array.isArray(items) ? items : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load home sections:', err);
      toast.error('Failed to load home sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Filtered sections
  const filteredSections = sections;

  // Pagination hook
  const {
    paginatedItems: paginatedSections = [],
    totalItems,
  } = usePagination(filteredSections, pageSize, serverTotal);

  // Stats calculation
  const stats = useMemo(() => {
    const total = sections.length;
    const active = sections.filter((s) => s.status === 'active').length;
    const inactive = total - active;
    const totalItems = sections.reduce(
      (acc, s) => acc + (s.productIds?.length || s.items?.length || 0),
      0
    );
    return { total, active, inactive, totalItems };
  }, [sections]);

  const statCardsData = [
    { label: 'Total Sections', value: stats.total, color: 'bronze', icon: HiOutlineTemplate },
    { label: 'Live Active', value: stats.active, color: 'green', icon: HiOutlineCheck },
    { label: 'Draft / Inactive', value: stats.inactive, color: 'peach', icon: HiOutlineX },
    { label: 'Curated Cards & Slides', value: stats.totalItems, color: 'gold', icon: IoDiamondOutline },
  ];

  const handleOpenProductPicker = () => {
    setIsProductPickerOpen(true);
  };

  const handleRemoveSelectedProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      selectedProducts: (prev.selectedProducts || []).filter(
        (p) => String(p._id || p.id || p.productId) !== String(productId)
      ),
    }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSection(null);
    setIsSlugEdited(false);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      sectionKey: '',
      order: sections.length + 1,
      status: 'active',
      visibility: {
        website: true,
        mobileApp: true,
      },
      badgeText: '',
      selectedProducts: [],
      items: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sec) => {
    setEditingSection(sec);
    setIsSlugEdited(Boolean(sec.sectionKey));
    const rawList = (sec.products && sec.products.length > 0)
      ? sec.products
      : (sec.items && sec.items.length > 0)
        ? sec.items
        : (sec.productIds && sec.productIds.length > 0)
          ? sec.productIds
          : [];

    const loadedSelected = rawList.map((it) => {
      const isObj = it && typeof it === 'object';
      const pid = isObj ? (it.productId || it._id || it.id) : it;
      return {
        _id: pid,
        id: pid,
        productId: pid,
        title: it.basicInfo?.title || it.title || '',
        subtitle: it.subtitle || it.metalName || '',
        thumbnail:
          it.colorImages?.[0]?.images?.[0]?.url ||
          it.images?.[0] ||
          it.image?.url ||
          it.imageUrl ||
          it.thumbnail ||
          '',
        sku: it.basicInfo?.sku || it.sku || '',
        price: it.pricing?.salePrice || it.price || 0,
        productType: it.productType || '',
        metalName: it.productType || '',
      };
    });

    setFormData({
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      slug: sec.slug || sec.sectionKey || '',
      sectionKey: sec.slug || sec.sectionKey || '',
      order: sec.order || 0,
      status: sec.status || 'active',
      visibility: {
        website: sec.visibility?.website ?? true,
        mobileApp: sec.visibility?.mobileApp ?? true,
      },
      selectedProducts: loadedSelected,
    });
    setIsModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (sec) => {
    setViewingSection(sec);
    setIsViewModalOpen(true);
  };

  // Toggle Status
  const handleToggleStatus = async (sec) => {
    const nextStatus = sec.status === 'active' ? 'inactive' : 'active';
    // Optimistic update
    setSections((prev) =>
      prev.map((item) => (item._id === sec._id ? { ...item, status: nextStatus } : item))
    );

    try {
      await api.patch(`/home-sections/${sec._id}/toggle-status`);
      toast.success(`Section "${sec.title}" is now ${nextStatus}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Failed to update status');
      fetchSections();
    }
  };

  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);

  // Toggle Platform Visibility (Web & App)
  const handleToggleVisibility = async (sec, platform, e) => {
    if (e) e.stopPropagation();
    const secId = sec._id;
    if (!secId) return;

    const currentWeb = sec.visibility?.website !== false;
    const currentApp = sec.visibility?.mobileApp !== false;

    const nextWeb = platform === 'website' ? !currentWeb : currentWeb;
    const nextApp = platform === 'mobileApp' ? !currentApp : currentApp;

    const nextVisibility = {
      website: nextWeb,
      mobileApp: nextApp,
    };

    // Optimistic update
    setSections((prev) =>
      prev.map((item) => (item._id === secId ? { ...item, visibility: nextVisibility } : item))
    );

    try {
      setUpdatingVisibilityId(`${secId}-${platform}`);
      await api.put(`/home-sections/${secId}`, { visibility: nextVisibility });
      toast.success(
        `${platform === 'website' ? 'Web' : 'App'} visibility ${(platform === 'website' ? nextWeb : nextApp) ? 'enabled' : 'disabled'
        }`
      );
    } catch (err) {
      console.error('Failed to update visibility:', err);
      toast.error(`Failed to update ${platform === 'website' ? 'Web' : 'App'} visibility`);
      // Revert on error
      setSections((prev) =>
        prev.map((item) =>
          item._id === secId
            ? { ...item, visibility: { website: currentWeb, mobileApp: currentApp } }
            : item
        )
      );
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  // Delete Section
  const handleDelete = async (sec) => {
    const ok = await confirm({
      title: 'Delete Home Section',
      message: `Are you sure you want to delete "${sec.title}"? This section will be removed from the storefront.`,
      confirmText: 'Delete',
      confirmColor: 'red',
    });
    if (!ok) return;

    try {
      await api.delete(`/home-sections/${sec._id}`);
      toast.success('Section deleted successfully');
      setSections((prev) => prev.filter((item) => item._id !== sec._id));
    } catch (err) {
      console.error('Failed to delete section:', err);
      toast.error('Failed to delete section');
    }
  };

  // Save / Submit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Section title is required');
      return;
    }

    try {
      setSubmitting(true);
      const productIds = (formData.selectedProducts || [])
        .map((p) => p._id || p.id || p.productId)
        .filter(Boolean);

      const sectionSlug = (formData.slug || formData.sectionKey || '').trim() || slugify(formData.title);

      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        slug: sectionSlug,
        sectionKey: sectionSlug,
        order: Number(formData.order) || 0,
        status: formData.status || 'active',
        visibility: {
          website: Boolean(formData.visibility?.website),
          mobileApp: Boolean(formData.visibility?.mobileApp),
        },
        productIds,
      };

      if (editingSection) {
        await api.put(`/home-sections/${editingSection._id}`, payload);
        toast.success('Home section updated successfully');
      } else {
        await api.post('/home-sections', payload);
        toast.success('Home section created successfully');
      }

      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      console.error('Failed to save section:', err);
      toast.error(err.response?.data?.message || 'Failed to save section');
    } finally {
      setSubmitting(false);
    }
  };


  // Open Reorder Modal
  const handleOpenReorderModal = () => {
    setReorderingItems(sections.map((s, idx) => ({ ...s, newOrder: idx + 1 })));
    setIsReorderModalOpen(true);
  };

  const handleSaveBulkReorder = async () => {
    try {
      setSavingReorder(true);
      const payload = reorderingItems.map((item, idx) => ({
        id: item._id,
        order: idx + 1,
      }));
      await api.put('/home-sections/reorder', { items: payload });
      toast.success('Sections order saved');
      setIsReorderModalOpen(false);
      fetchSections();
    } catch {
      toast.error('Failed to reorder sections');
    } finally {
      setSavingReorder(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader        title="Home Sections"
        subtitle="Organize, curate, and reorder dynamic homepage sections and marketing banners."
        onAdd={handleOpenAdd}
        addLabel="Add Section"        extraActions={
          <button
            type="button"
            onClick={handleOpenReorderModal}
            className="flex items-center gap-2 h-[42px] px-4 sm:px-5 bg-white hover:bg-stone-50 active:scale-[0.98] border border-stone-200 text-stone-700 rounded-xl text-xs sm:text-[13.5px] font-bold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
          >
            <HiOutlineSwitchHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#8b6f4e] stroke-2" />
            <span>Reorder</span>
          </button>
        }
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Main Sections Table Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <div className="w-6 h-6 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Loading home sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="py-14 text-center">
            <HiOutlineTemplate className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-stone-800">No home sections found</h3>
          </div>
        ) : (
          <>
            <MobileGridList
              items={paginatedSections || []}
              showSelectAll
              allSelected={
                (paginatedSections || []).length > 0 &&
                (paginatedSections || []).every((s) => selectedIds.includes(s._id))
              }
              onSelectAll={(e) => {
                if (e.target.checked) {
                  const pageIds = (paginatedSections || []).map((s) => s._id);
                  setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
                } else {
                  const pageIds = (paginatedSections || []).map((s) => s._id);
                  setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                }
              }}
              renderCard={(sec) => {
                const globalIdx = sections.findIndex((s) => s._id === sec._id);
                const isSelected = selectedIds.includes(sec._id);
                const itemCount = Array.isArray(sec.products) ? sec.products.length : sec.productIds?.length || 0;

                return (
                  <div
                    key={sec._id}
                    onClick={() => handleOpenEdit(sec)}
                    className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                      isSelected ? 'border-[#8b6f4e]/60 bg-[#faf6f0]/40' : 'border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, sec._id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== sec._id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 text-xs truncate">{sec.title}</p>
                          <p className="text-[10px] text-stone-400 truncate">Order {sec.order || globalIdx + 1} · /{sec.slug}</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <RowActions
                          onOpenWebsite={() =>
                            window.open(`${getFrontBaseUrl()}/`, '_blank', 'noopener,noreferrer')
                          }
                          websiteTitle="View on Storefront"
                          onEdit={() => handleOpenEdit(sec)}
                          onDelete={() => handleDelete(sec._id, sec.title)}
                        />
                      </div>
                    </div>

                    {sec.subtitle && (
                      <p className="text-xs text-stone-500 line-clamp-1">{sec.subtitle}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]" onClick={(e) => e.stopPropagation()}>
                      <span className="text-stone-600"><strong className="text-stone-900">{itemCount}</strong> items</span>
                      <ToggleSwitch
                        checked={sec.status === 'active'}
                        onChange={() => handleToggleStatus(sec)}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              }}
            />

            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-1 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        (paginatedSections || []).length > 0 &&
                        (paginatedSections || []).every((s) => selectedIds.includes(s._id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const pageIds = (paginatedSections || []).map((s) => s._id);
                          setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
                        } else {
                          const pageIds = (paginatedSections || []).map((s) => s._id);
                          setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 text-center w-14 whitespace-nowrap">
                    ORDER
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[170px]">TITLE</th>
                  <th className="py-3 px-3 whitespace-nowrap min-w-[180px]">SUBTITLE</th>
                  <th className="py-3 px-3 whitespace-nowrap w-36">SLUG</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-44">VISIBILITY</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-28">ITEMS</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">STATUS</th>
                  <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right w-28">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {(paginatedSections || []).map((sec) => {
                  const globalIdx = sections.findIndex((s) => s._id === sec._id);
                  const isSelected = selectedIds.includes(sec._id);

                  return (
                    <tr
                      key={sec._id}
                      onClick={() => handleOpenEdit(sec)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${isSelected ? 'bg-[#faf6f0]/40' : ''
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, sec._id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== sec._id));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      {/* Order */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="font-bold text-stone-700 font-mono text-[11px]">
                          {sec.order || globalIdx + 1}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-3 min-w-[170px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-stone-900 text-xs">
                            {sec.title}
                          </span>
                          {sec.badgeText && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                              {sec.badgeText}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Subtitle */}
                      <td className="py-2.5 px-3 min-w-[180px]">
                        <span className="text-xs text-stone-600 block truncate max-w-xs" title={sec.subtitle || ''}>
                          {sec.subtitle || <span className="text-stone-300">—</span>}
                        </span>
                      </td>

                      {/* Identifier Slug */}
                      <td className="py-2.5 px-3 whitespace-nowrap w-36">
                        <code className="text-[10px] text-[#8b6f4e] bg-[#faf3e8] px-1.5 py-0.5 rounded font-mono font-medium">
                          #{sec.slug || sec.sectionKey || '—'}
                        </code>
                      </td>

                      {/* Platform Visibility */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap w-44" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 bg-stone-50/90 p-1 rounded-lg border border-stone-200/80 shadow-2xs">
                          {/* Web Status Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(sec, 'website', e)}
                            disabled={updatingVisibilityId === `${sec._id}-website`}
                            title={sec.visibility?.website !== false ? 'Web: Visible (Click to Hide)' : 'Web: Hidden (Click to Show)'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${sec.visibility?.website !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                              }`}
                          >
                            <span className="text-[10px]">🌐</span>
                            <span>Web</span>
                          </button>

                          {/* App Status Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleVisibility(sec, 'mobileApp', e)}
                            disabled={updatingVisibilityId === `${sec._id}-mobileApp`}
                            title={sec.visibility?.mobileApp !== false ? 'App: Visible (Click to Hide)' : 'App: Hidden (Click to Show)'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${sec.visibility?.mobileApp !== false
                                ? 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100'
                                : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                              }`}
                          >
                            <span className="text-[10px]">📱</span>
                            <span>App</span>
                          </button>
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap w-28">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf3e8] text-[#8b6f4e] border border-[#8b6f4e]/20 shadow-2xs">
                          {sec.productIds?.length || sec.products?.length || sec.items?.length || 0} products
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-2.5 px-3 text-center align-middle whitespace-nowrap w-24">
                        <div className="flex items-center justify-center">
                          <ToggleSwitch
                            checked={sec.status === 'active'}
                            onChange={() => handleToggleStatus(sec)}
                            size="sm"
                            stopPropagation={true}
                            ariaLabel={sec.status === 'active' ? 'Active' : 'Inactive'}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right w-28" onClick={(e) => e.stopPropagation()}>
                        <RowActions
                          record={sec}
                          onOpenWebsite={() =>
                            window.open(`${getFrontBaseUrl()}/`, '_blank', 'noopener,noreferrer')
                          }
                          websiteTitle="View on Storefront"
                          onView={() => handleOpenView(sec)}
                          onEdit={() => handleOpenEdit(sec)}
                          onDelete={() => handleDelete(sec)}
                          viewTitle="Preview Section"
                          editTitle="Edit Section"
                          deleteTitle="Delete Section"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* ─── Luxury Common Pagination ─── */}
        <Pagination
          currentPage={currentPage}
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="sections"
        />
      </div>

      {/* ─── Add / Edit Home Section Modal (Screenshot 1) ───────────────── */}
      {isModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto cursor-pointer"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200/80 shadow-2xl w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100 bg-white">
              <div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  {editingSection ? 'Edit Home Section' : 'Create Home Section'}
                </h2>
                <p className="text-[11px] font-bold tracking-widest text-[#8b6f4e] uppercase mt-0.5">
                  HOMEPAGE CURATED PRODUCTS
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full border border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-6">
              {/* Row 1: Section Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                    SECTION TITLE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        title: val,
                        sectionKey: (!editingSection || !isSlugEdited) ? slugify(val) : prev.sectionKey,
                      }));
                    }}
                    placeholder="e.g. Trending Lab Grown Diamonds"
                    className="w-full text-xs bg-white border border-[#d6cfc2] rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                    TAGLINE / SUBTITLE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g. Handcrafted luxury for every celebration"
                    className="w-full text-xs bg-white border border-[#d6cfc2] rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>
              </div>

              {/* Row 2: Identifier Slug, Status & Platform Visibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                    IDENTIFIER SLUG (UNIQUE)
                  </label>
                  <input
                    type="text"
                    value={formData.sectionKey}
                    onChange={(e) => {
                      const val = slugify(e.target.value);
                      setIsSlugEdited(Boolean(val));
                      setFormData((prev) => ({
                        ...prev,
                        sectionKey: val || slugify(prev.title),
                      }));
                    }}
                    placeholder={slugify(formData.title) || 'e.g. trending-lab-grown'}
                    className="w-full text-xs font-mono bg-white border border-[#d6cfc2] rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                      STATUS
                    </label>
                    <div className="w-full h-[42px] px-3.5 rounded-xl text-xs bg-white border border-[#d6cfc2] shadow-2xs flex items-center justify-between">
                      <span className="text-xs font-semibold text-stone-800">
                        {formData.status === 'active' ? 'Active (Live)' : 'Inactive (Draft)'}
                      </span>
                      <ToggleSwitch
                        checked={formData.status === 'active'}
                        onChange={(checked) =>
                          setFormData((prev) => ({ ...prev, status: checked ? 'active' : 'inactive' }))
                        }
                        size="sm"
                        ariaLabel="Section Status"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                      PLATFORM VISIBILITY
                    </label>
                    <div className="h-[42px] px-3.5 bg-white border border-[#d6cfc2] rounded-xl flex items-center justify-start gap-4 shadow-2xs">
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.visibility?.website ?? true}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              visibility: { ...prev.visibility, website: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer accent-[#8b6f4e]"
                        />
                        <span>Web</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.visibility?.mobileApp ?? true}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              visibility: { ...prev.visibility, mobileApp: e.target.checked },
                            }))
                          }
                          className="w-4 h-4 rounded text-[#8b6f4e] focus:ring-[#8b6f4e] border-stone-300 cursor-pointer accent-[#8b6f4e]"
                        />
                        <span>App</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Selected Products Header */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      SELECTED PRODUCTS ({formData.selectedProducts?.length || 0})
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formData.selectedProducts?.length > 0
                        ? 'Manage or pick additional products for this section.'
                        : 'Pick products with pagination to feature in this section.'}
                    </p>
                  </div>
                  {formData.selectedProducts?.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenProductPicker}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Browse & Select Products</span>
                    </button>
                  )}
                </div>

                {/* Product Container: Empty state vs Selected Products list */}
                {(!formData.selectedProducts || formData.selectedProducts.length === 0) ? (
                  <div className="border-2 border-dashed border-stone-200/90 rounded-2xl p-8 sm:p-12 text-center bg-stone-50/30">
                    <div className="w-12 h-12 rounded-full bg-[#f6efe6] text-[#8b6f4e] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <IoLayersOutline className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-stone-800 mb-1">
                      No products added yet
                    </h4>
                    <button
                      type="button"
                      onClick={handleOpenProductPicker}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    >
                      <HiOutlinePlus className="w-4 h-4" />
                      <span>Browse & Select Products</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-stone-200/90 rounded-2xl p-4 bg-stone-50/40">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                      {formData.selectedProducts.map((prod, idx) => (
                        <div
                          key={prod._id || prod.id || idx}
                          className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs group relative hover:border-[#8b6f4e] transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {prod.thumbnail || prod.imageUrl ? (
                              <img
                                src={prod.thumbnail || prod.imageUrl}
                                alt={prod.title}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-stone-400 font-mono">
                                #{idx + 1}
                              </span>
                              <span className="text-[9px] font-bold text-[#8b6f4e] bg-[#faf3e8] px-1.5 py-0.2 rounded uppercase">
                                {getProductBadgeLabel(prod)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-stone-800 truncate mt-0.5" title={prod.title}>
                              {prod.title}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                              <span className="font-bold text-stone-900">
                                ₹{Number(prod.price || prod.salePrice || 0).toLocaleString('en-IN')}
                              </span>
                              {prod.sku && (
                                <span className="text-[10px] font-mono text-stone-400 truncate max-w-[80px]">
                                  {prod.sku}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedProduct(prod._id || prod.id || prod.productId)}
                            className="w-6 h-6 rounded-full bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title="Remove product"
                          >
                            <HiOutlineX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-200 text-stone-700 bg-white rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer shadow-2xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#8b6f4e] hover:bg-[#785e40] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingSection ? 'Save Changes' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>, document.body)
      )}

      {/* ─── Common Product Picker Modal ───────────────────────── */}
      <ProductPickerModal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        onApply={(selectedList) => {
          setFormData((prev) => ({
            ...prev,
            selectedProducts: selectedList,
          }));
          setIsProductPickerOpen(false);
          toast.success(`${selectedList.length} product${selectedList.length === 1 ? '' : 's'} added to section`);
        }}
        initialSelected={formData.selectedProducts || []}
        title="Select Products for Homepage Section"
        subtitle="Search and select products across pages. Selections stay saved when navigating pages."
      />


      {/* ─── Preview / View Modal ────────────────────────────── */}
      {isViewModalOpen && viewingSection && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 bg-stone-50">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {viewingSection.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 flex items-center justify-center cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Slug Key</span>
                  <p className="font-mono font-bold text-stone-800">#{viewingSection.sectionKey}</p>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Status</span>
                  <p className="font-semibold text-stone-800 uppercase">{viewingSection.status}</p>
                </div>
              </div>

              {viewingSection.subtitle && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Subtitle</span>
                  <p className="text-stone-700 mt-0.5">{viewingSection.subtitle}</p>
                </div>
              )}

              {viewingSection.description && (
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-semibold">Description</span>
                  <p className="text-stone-700 mt-0.5">{viewingSection.description}</p>
                </div>
              )}

              {/* Platform Visibility Status */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                <span className="text-stone-500 text-xs font-semibold">Visibility:</span>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${viewingSection.visibility?.website !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                  Web {viewingSection.visibility?.website !== false ? '✓' : '✗'}
                </span>
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${viewingSection.visibility?.mobileApp !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                  App {viewingSection.visibility?.mobileApp !== false ? '✓' : '✗'}
                </span>
              </div>

              {((viewingSection.products && viewingSection.products.length > 0) ||
                (viewingSection.items && viewingSection.items.length > 0)) && (
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase font-semibold">
                      Curated Products ({viewingSection.products?.length || viewingSection.items?.length || 0})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {(viewingSection.products || viewingSection.items || []).map((item, idx) => {
                        const img =
                          item.colorImages?.[0]?.images?.[0]?.url ||
                          item.images?.[0] ||
                          item.image?.url ||
                          '';
                        const title = item.basicInfo?.title || item.title || '';
                        const price = item.pricing?.salePrice || item.price || 0;
                        const sku = item.basicInfo?.sku || item.sku || '';
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs"
                          >
                            <div className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                              {img ? (
                                <img
                                  src={img}
                                  alt={title}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-stone-400 font-mono">#{idx + 1}</span>
                                {item.productType && (
                                  <span className="text-[9px] font-bold text-[#8b6f4e] bg-[#faf3e8] px-1 py-0.2 rounded uppercase">
                                    {item.productType}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-stone-900 text-xs truncate mt-0.5">{title}</p>
                              <div className="flex items-center justify-between text-[11px] text-stone-500 mt-0.5">
                                {price > 0 && (
                                  <span className="font-bold text-stone-900">
                                    ₹{Number(price).toLocaleString('en-IN')}
                                  </span>
                                )}
                                {sku && (
                                  <span className="text-[10px] font-mono text-stone-400 truncate max-w-[80px]">
                                    {sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEdit(viewingSection);
                }}
                className="px-4 py-2 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] cursor-pointer"
              >
                Edit Section
              </button>
            </div>
          </div>
        </div>, document.body)
      )}

      {/* ─── Visual Reorder Modal ────────────────────────────── */}
      {isReorderModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
          onClick={() => setIsReorderModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">
                Reorder Storefront Sections
              </h3>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
              <p className="text-stone-500 text-[11px] mb-2">
                Use arrows to adjust the visual appearance sequence on the homepage.
              </p>
              {reorderingItems.map((item, idx) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#faf3e8] text-[#8b6f4e] font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const next = [...reorderingItems];
                        const temp = next[idx];
                        next[idx] = next[idx - 1];
                        next[idx - 1] = temp;
                        setReorderingItems(next);
                      }}
                      className="w-6 h-6 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <HiOutlineArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === reorderingItems.length - 1}
                      onClick={() => {
                        const next = [...reorderingItems];
                        const temp = next[idx];
                        next[idx] = next[idx + 1];
                        next[idx + 1] = temp;
                        setReorderingItems(next);
                      }}
                      className="w-6 h-6 rounded bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <HiOutlineArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReorder}
                onClick={handleSaveBulkReorder}
                className="px-4 py-1.5 bg-[#8b6f4e] text-white rounded-lg text-xs font-semibold hover:bg-[#785e40] cursor-pointer"
              >
                {savingReorder ? 'Saving...' : 'Save Sequence'}
              </button>
            </div>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}
