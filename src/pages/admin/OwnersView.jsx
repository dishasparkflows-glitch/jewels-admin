import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineOfficeBuilding,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineViewGrid,
  HiOutlineTrash,
  HiOutlineDatabase,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineGlobeAlt,
  HiOutlineCheck,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { ownersAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import MobileGridList from '../../components/common/MobileGridList';
import usePagination from '../../hooks/usePagination';
import { useAdminPageSize } from '../../utils/adminPagination';
import { getFirstAllowedPath } from '../../utils/moduleAccess';

function extractDatabaseName(url = '') {
  const raw = String(url || '').trim();
  if (!raw) return '—';
  const withoutQuery = raw.split('?')[0].replace(/\/+$/, '');
  const match = withoutQuery.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/]+)$/i);
  if (match?.[1]) return match[1];
  const hostMatch = withoutQuery.match(/^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^/]+)$/i);
  if (hostMatch?.[1]) return hostMatch[1];
  return '—';
}

function groupModulesList(modulesList = []) {
  const order = [];
  const map = {};
  modulesList.forEach((mod) => {
    const grp = mod.group || 'General';
    if (!map[grp]) {
      order.push(grp);
      map[grp] = { group: grp, modules: [] };
    }
    map[grp].modules.push(mod);
  });
  return order.map((g) => map[g]);
}

export default function OwnersView() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { startOwnerPreview } = useAuth();

  const [owners, setOwners] = useState([]);
  const [systemModules, setSystemModules] = useState([]);
  const [moduleGroups, setModuleGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [viewingOwner, setViewingOwner] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formDatabaseUrl, setFormDatabaseUrl] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [formAllowedModules, setFormAllowedModules] = useState([]);
  const [isModulePickerOpen, setIsModulePickerOpen] = useState(false);
  const [draftAllowedModules, setDraftAllowedModules] = useState([]);
  const [moduleSearch, setModuleSearch] = useState('');
  const [showDbInput, setShowDbInput] = useState(false);

  const fetchModules = useCallback(async () => {
    try {
      const res = await ownersAPI.getModules();
      const data = res.data?.data || {};
      const mods = Array.isArray(data.modules) ? data.modules : [];
      const groups = Array.isArray(data.groups) && data.groups.length > 0
        ? data.groups
        : groupModulesList(mods);
      setSystemModules(mods);
      setModuleGroups(groups);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load modules from database');
      setSystemModules([]);
      setModuleGroups([]);
    }
  }, []);

  const fetchOwners = useCallback(async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      const res = await ownersAPI.getAll({ page, limit });
      const items = res.data?.data?.items || res.data?.data || [];
      setOwners(Array.isArray(items) ? items : []);
      if (res.data?.pagination?.totalDocs !== undefined) {
        setServerTotal(res.data.pagination.totalDocs);
      }
    } catch (err) {
      console.error('Failed to load owners:', err);
      toast.error(err.response?.data?.message || 'Failed to load website owners');
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  useEffect(() => {
    fetchOwners(currentPage, pageSize);
  }, [fetchOwners, currentPage, pageSize]);

  const moduleTitleMap = useMemo(() => {
    const map = {};
    systemModules.forEach((m) => {
      map[m.id] = m.title;
    });
    return map;
  }, [systemModules]);

  const filteredOwners = useMemo(() => {
    let result = owners;
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.name || '').toLowerCase().includes(q) ||
          (o.websiteUrl || '').toLowerCase().includes(q) ||
          (o.databaseUrl || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [owners, search, statusFilter]);

  const { totalItems, paginatedItems } = usePagination(filteredOwners, pageSize, serverTotal);

  const activeCount = useMemo(() => owners.filter((o) => o.status === 'active').length, [owners]);
  const inactiveCount = useMemo(() => owners.filter((o) => o.status === 'inactive').length, [owners]);

  const statCardsData = [
    {
      label: 'Total Owners',
      value: serverTotal ?? owners.length,
      icon: HiOutlineOfficeBuilding,
      color: 'bronze',
      active: statusFilter === 'all',
      onClick: () => setStatusFilter('all'),
    },
    {
      label: 'Active Clients',
      value: activeCount,
      icon: HiOutlineCheckCircle,
      color: 'green',
      active: statusFilter === 'active',
      onClick: () => setStatusFilter((prev) => (prev === 'active' ? 'all' : 'active')),
    },
    {
      label: 'Inactive Clients',
      value: inactiveCount,
      icon: HiOutlineXCircle,
      color: 'peach',
      active: statusFilter === 'inactive',
      onClick: () => setStatusFilter((prev) => (prev === 'inactive' ? 'all' : 'inactive')),
    },
    {
      label: 'System Modules',
      value: systemModules.length,
      icon: HiOutlineViewGrid,
      color: 'gold',
    },
  ];

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingOwner(null);
    setViewingOwner(null);
    setIsModulePickerOpen(false);
    setFormName('');
    setFormWebsiteUrl('');
    setFormDatabaseUrl('');
    setFormStatus('active');
    setFormAllowedModules(systemModules.map((m) => m.id));
    setModuleSearch('');
    setShowDbInput(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (owner) => {
    setEditingOwner(owner);
    setViewingOwner(null);
    setIsModulePickerOpen(false);
    setFormName(owner.name || '');
    setFormWebsiteUrl(owner.websiteUrl || '');
    setFormDatabaseUrl(owner.databaseUrl || '');
    setFormStatus(owner.status || 'active');
    setFormAllowedModules(Array.isArray(owner.allowedModules) ? [...owner.allowedModules] : []);
    setModuleSearch('');
    setShowDbInput(false);
    setIsModalOpen(true);
  };

  // Open dedicated module selection popup
  const handleOpenModulePicker = () => {
    setDraftAllowedModules([...formAllowedModules]);
    setModuleSearch('');
    setIsModulePickerOpen(true);
  };

  // Toggle single module inside popup draft
  const toggleModule = (modId) => {
    setDraftAllowedModules((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  // Toggle all modules in a group inside popup draft
  const toggleGroupModules = (groupMods) => {
    const groupIds = groupMods.map((m) => m.id);
    const allSelectedInGroup = groupIds.every((id) => draftAllowedModules.includes(id));

    if (allSelectedInGroup) {
      setDraftAllowedModules((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setDraftAllowedModules((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  const handleSelectAllModules = () => {
    setDraftAllowedModules(systemModules.map((m) => m.id));
  };

  const handleClearAllModules = () => {
    setDraftAllowedModules([]);
  };

  const handleApplyModuleSelection = () => {
    setFormAllowedModules([...draftAllowedModules]);
    setIsModulePickerOpen(false);
  };

  // Save Owner
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter owner / client name');
      return;
    }
    if (!formDatabaseUrl.trim()) {
      toast.error('Please enter database URL');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName.trim(),
        websiteUrl: formWebsiteUrl.trim(),
        databaseUrl: formDatabaseUrl.trim(),
        status: formStatus,
        allowedModules: formAllowedModules,
      };

      if (editingOwner?._id) {
        const res = await ownersAPI.update(editingOwner._id, payload);
        const sync = res?.data?.data?.moduleSync;
        if (sync?.synced) {
          toast.success(
            `Owner "${payload.name}" updated & synced ${sync.activeCount} active / ${sync.inactiveCount ?? 0} inactive modules to "${sync.database}"`
          );
        } else if (sync?.reason) {
          toast.success(`Owner "${payload.name}" updated (${sync.reason})`);
        } else {
          toast.success(`Owner "${payload.name}" updated successfully`);
        }
      } else {
        const res = await ownersAPI.create(payload);
        const sync = res?.data?.data?.moduleSync;
        if (sync?.synced) {
          toast.success(
            `Owner "${payload.name}" added & synced ${sync.activeCount} active / ${sync.inactiveCount ?? 0} inactive modules to "${sync.database}"`
          );
        } else {
          toast.success(`Owner "${payload.name}" added successfully`);
        }
      }

      setIsModalOpen(false);
      fetchOwners(currentPage, pageSize);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save owner');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (owner) => {
    const nextStatus = owner.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await ownersAPI.update(owner._id, { status: nextStatus });
      const sync = res?.data?.data?.moduleSync;
      setOwners((prev) =>
        prev.map((o) => (o._id === owner._id ? { ...o, status: nextStatus } : o))
      );
      if (sync?.synced) {
        toast.success(
          `${owner.name} marked as ${nextStatus} (synced ${sync.activeCount} active / ${sync.inactiveCount ?? 0} inactive modules)`
        );
      } else {
        toast.success(`${owner.name} marked as ${nextStatus}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Delete single owner
  const handleDelete = async (owner) => {
    const isConfirmed = await confirm({
      title: `Delete ${owner.name}`,
      message: `Are you sure you want to remove "${owner.name}"? Their configured database entry and module permissions will be removed.`,
      confirmText: 'Delete Owner',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await ownersAPI.delete(owner._id);
      toast.success(`"${owner.name}" deleted`);
      setOwners((prev) => prev.filter((o) => o._id !== owner._id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(owner._id);
        return next;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete owner');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) {
      toast.error('Please select owners to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Delete Selected Owners',
      message: `Are you sure you want to delete ${count} selected owner${count > 1 ? 's' : ''}?`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      await ownersAPI.bulkDelete(Array.from(selectedIds));
      toast.success(`${count} owner${count > 1 ? 's' : ''} deleted`);
      setOwners((prev) => prev.filter((o) => !selectedIds.has(o._id)));
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected owners');
    }
  };

  // Seed Categories & Master Data modal state
  const [seedingOwnerId, setSeedingOwnerId] = useState(null);
  const [seedModalOwner, setSeedModalOwner] = useState(null);
  const [seedPreviewLoading, setSeedPreviewLoading] = useState(false);
  const [seedPreview, setSeedPreview] = useState(null);
  const [selectedSeedCollections, setSelectedSeedCollections] = useState(new Set());
  const [activeSeedCollection, setActiveSeedCollection] = useState('');

  const handleOpenSeedModal = async (owner) => {
    setSeedModalOwner(owner);
    setSeedPreview(null);
    setSelectedSeedCollections(new Set());
    setActiveSeedCollection('');
    setSeedPreviewLoading(true);
    try {
      const res = await ownersAPI.getSeedPreview(owner._id);
      const data = res.data?.data || res.data || {};
      const tables = Array.isArray(data.tables) ? data.tables : [];
      setSeedPreview(data);
      setSelectedSeedCollections(
        new Set(tables.filter((t) => t.centralCount > 0).map((t) => t.collection))
      );
      if (tables.length > 0) {
        setActiveSeedCollection(tables[0].collection);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load central DB master data');
    } finally {
      setSeedPreviewLoading(false);
    }
  };

  const handleConfirmSeedData = async () => {
    if (!seedModalOwner) return;
    const collections = Array.from(selectedSeedCollections);
    if (collections.length === 0) {
      toast.error('Please select at least one master table to seed');
      return;
    }

    try {
      setSeedingOwnerId(seedModalOwner._id);
      const res = await ownersAPI.seedData(seedModalOwner._id, collections);
      const data = res.data?.data || {};
      const countMsg = data.totalDocuments ? ` (${data.totalDocuments} records synced)` : '';
      toast.success(`Categories & master data seeded for "${seedModalOwner.name}"${countMsg}`);
      setSeedModalOwner(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed categories & master data');
    } finally {
      setSeedingOwnerId(null);
    }
  };

  const handlePreviewAccess = (owner) => {
    if (owner.status !== 'active') {
      toast.error('Activate this owner before previewing client access');
      return;
    }
    const allowed = Array.isArray(owner.allowedModules) ? owner.allowedModules : [];
    const targetPath = getFirstAllowedPath(allowed);
    if (!targetPath) {
      toast.error('Select at least one module for this owner before previewing');
      return;
    }
    startOwnerPreview(owner);
    toast.success(`Previewing "${owner.name}" (${allowed.length} modules)`);
    navigate(targetPath);
  };

  const allSelected =
    paginatedItems.length > 0 && paginatedItems.every((item) => selectedIds.has(item._id));

  const handleSelectAllRows = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((i) => i._id)));
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

  // Filter module groups inside modal
  const filteredModuleGroups = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return moduleGroups;
    return moduleGroups
      .map((grp) => {
        const groupMatches = grp.group.toLowerCase().includes(q);
        const mods = groupMatches
          ? grp.modules
          : grp.modules.filter(
              (m) =>
                m.title.toLowerCase().includes(q) ||
                m.id.toLowerCase().includes(q) ||
                (m.path || '').toLowerCase().includes(q)
            );
        if (mods.length === 0) return null;
        return { ...grp, modules: mods };
      })
      .filter(Boolean);
  }, [moduleGroups, moduleSearch]);

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Website Owners"
        subtitle="Manage client websites, database connections, and module-level access permissions."
        onAdd={handleOpenAdd}
        addLabel="Add Owner"
      />

      <StatCards cards={statCardsData} />

      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        placeholder="Search by client name, website URL, or database name..."
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-2 h-[42px] px-3.5 sm:px-4 rounded-xl text-xs sm:text-[13px] font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.size > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2 text-[#d93025]" />
            <span>{selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}</span>
          </button>
        }
      />

      {/* Owners Table (Mobile Grid + Desktop Table) */}
      <div className="bg-white rounded-xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <MobileGridList
          loading={loading}
          loadingText="Loading website owners..."
          isEmpty={filteredOwners.length === 0}
          emptyText={
            search
              ? `No owners found matching "${search}".`
              : 'No client websites configured yet. Click "Add Owner" to add your first client.'
          }
          items={paginatedItems}
          showSelectAll
          allSelected={allSelected}
          onSelectAll={handleSelectAllRows}
          renderCard={(owner, idx) => {
            const id = owner._id;
            const isSelected = selectedIds.has(id);
            const allowed = Array.isArray(owner.allowedModules) ? owner.allowedModules : [];
            const srNo = (currentPage - 1) * pageSize + idx + 1;

            return (
              <div
                key={id}
                onClick={() => handleOpenEdit(owner)}
                className={`rounded-xl border p-3.5 bg-white shadow-2xs transition-all cursor-pointer space-y-2.5 ${
                  isSelected ? 'border-[#8b6f4e]/60 bg-[#faf6f0]/50' : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSelectRow(id)}
                      className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer shrink-0"
                    />
                    <div className="w-8 h-8 rounded-lg bg-[#faf3e8] border border-[#8b6f4e]/20 text-[#8b6f4e] font-bold text-xs flex items-center justify-center shrink-0">
                      {(owner.name || 'O').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 text-xs truncate">{owner.name}</p>
                      <p className="text-[10px] text-stone-400 truncate">#{srNo} · {allowed.length} modules</p>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <RowActions
                      onEdit={() => handleOpenEdit(owner)}
                      onDelete={() => handleDelete(id, owner.name)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-[11px]" onClick={(e) => e.stopPropagation()}>
                  <span className="text-stone-500 truncate">{owner.websiteUrl || owner.domain || '—'}</span>
                  <ToggleSwitch
                    checked={owner.status !== 'inactive'}
                    onChange={() => handleToggleStatus(owner)}
                    size="sm"
                  />
                </div>
              </div>
            );
          }}
        />

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[780px] text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200/80 bg-[#eef2f6] text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAllRows}
                    className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                    aria-label="Select all owners"
                  />
                </th>
                <th className="py-3 px-2 text-center w-12 whitespace-nowrap">SR NO</th>
                <th className="py-3 px-3 whitespace-nowrap">CLIENT / OWNER</th>
                <th className="py-3 px-3 whitespace-nowrap">DATABASE</th>
                <th className="py-3 px-3 whitespace-nowrap">ALLOWED MODULES</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">STATUS</th>
                <th className="py-3 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-stone-400">
                    <div className="animate-spin w-5 h-5 border-2 border-[#8b6f4e] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading website owners...
                  </td>
                </tr>
              ) : filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-stone-400">
                    {search
                      ? `No owners found matching "${search}".`
                      : 'No client websites configured yet. Click "Add Owner" to add your first client.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((owner, idx) => {
                  const id = owner._id;
                  const isSelected = selectedIds.has(id);
                  const dbName = extractDatabaseName(owner.databaseUrl);
                  const allowed = Array.isArray(owner.allowedModules) ? owner.allowedModules : [];

                  return (
                    <tr
                      key={id}
                      onClick={() => handleOpenEdit(owner)}
                      className={`hover:bg-[#faf7f2] transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#faf6f0]/50' : ''
                      }`}
                    >
                      <td className="py-3 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-2 text-center font-semibold text-stone-500 whitespace-nowrap">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      {/* Client / Owner Name & Website URL */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#faf3e8] border border-[#8b6f4e]/20 text-[#8b6f4e] font-bold text-xs flex items-center justify-center shrink-0">
                            {(owner.name || 'O').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 text-xs leading-tight">
                              {owner.name}
                            </p>
                            {owner.websiteUrl && (
                              <p className="text-[10.5px] text-stone-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                                <HiOutlineGlobeAlt className="w-3 h-3 shrink-0" />
                                <span className="truncate">{owner.websiteUrl}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Database Name */}
                      <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-lg px-2.5 py-1 max-w-[220px]">
                          <HiOutlineDatabase className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                          <span className="font-mono text-[11px] font-semibold text-stone-700 truncate">
                            {dbName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenSeedModal(owner)}
                            disabled={seedingOwnerId === id}
                            title="Seed Categories & Master Data"
                            aria-label="Seed Categories & Master Data"
                            className="p-0.5 text-stone-400 hover:text-[#8b6f4e] disabled:opacity-50 cursor-pointer shrink-0"
                          >
                            <HiOutlineRefresh className={`w-3.5 h-3.5 ${seedingOwnerId === id ? 'animate-spin text-[#8b6f4e]' : ''}`} />
                          </button>
                        </div>
                      </td>

                      {/* Allowed Modules */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf3e8] text-[#8b6f4e] border border-[#8b6f4e]/20 whitespace-nowrap">
                          {allowed.length} / {systemModules.length || allowed.length} Modules
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <ToggleSwitch
                          checked={owner.status === 'active'}
                          onChange={() => handleToggleStatus(owner)}
                          size="sm"
                          ariaLabel={`Toggle status for ${owner.name}`}
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 pl-2 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePreviewAccess(owner)}
                            data-tooltip="Preview Client Module Access"
                            data-tooltip-position="top"
                            aria-label="Preview Client Module Access"
                            className="w-7 h-7 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 inline-flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          >
                            <HiOutlineShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <RowActions
                            record={owner}
                            onView={() => setViewingOwner(owner)}
                            onEdit={() => handleOpenEdit(owner)}
                            onDelete={() => handleDelete(owner)}
                            viewTitle="View owner & modules"
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

        <Pagination
          currentPage={currentPage}
          totalItems={serverTotal ?? totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          itemLabel="owners"
        />
      </div>

      {/* ─── Add / Edit Owner Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isModulePickerOpen) setIsModalOpen(false);
        }}
        title={editingOwner ? `Edit Owner — ${editingOwner.name}` : 'Add Website Owner'}
        subtitle="Configure client details, database connection URL, and select accessible modules."
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="owner-form"
              disabled={saving}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saving ? 'Saving...' : editingOwner ? 'Update Owner' : 'Create Owner'}
            </button>
          </>
        }
      >
        <form id="owner-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Owner Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/70 p-4 rounded-2xl border border-stone-200/80">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Owner / Client Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Neirah Jewels"
                required
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Website URL <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formWebsiteUrl}
                onChange={(e) => setFormWebsiteUrl(e.target.value)}
                placeholder="e.g. https://clientwebsite.com"
                className="w-full h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Database URL <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showDbInput ? 'text' : 'password'}
                  value={formDatabaseUrl}
                  onChange={(e) => setFormDatabaseUrl(e.target.value)}
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net/client_db"
                  required
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-stone-200 bg-white font-mono text-xs text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowDbInput((prev) => !prev)}
                  title={showDbInput ? 'Hide Database URL' : 'Show Database URL'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  {showDbInput ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <div>
                <p className="text-xs font-bold text-stone-700">Client Status</p>
                <p className="text-[11px] text-stone-500">
                  Inactive clients will have module access paused.
                </p>
              </div>
              <ToggleSwitch
                checked={formStatus === 'active'}
                onChange={(val) => setFormStatus(val ? 'active' : 'inactive')}
                showStatusText
                activeText="Active"
                inactiveText="Inactive"
              />
            </div>
          </div>

          {/* Module Selection Trigger & Summary */}
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex flex-wrap items-center gap-2">
                  <span>Module Access Permissions</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                    style={{
                      backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.1)',
                      color: 'var(--theme-primary, #8b6f4e)',
                      borderColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.25)',
                    }}
                  >
                    {formAllowedModules.length} / {systemModules.length} Selected
                  </span>
                </h4>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Open the module selector popup to easily view and toggle permissions by group.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenModulePicker}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 transition-all cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <HiOutlineShieldCheck className="w-4 h-4" />
                <span>View & Select Modules</span>
              </button>
            </div>

            {/* Selected Group Summary Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-200/70">
              {moduleGroups.map((grp) => {
                const selectedInGroup = grp.modules.filter((m) =>
                  formAllowedModules.includes(m.id)
                ).length;
                const hasAny = selectedInGroup > 0;
                return (
                  <button
                    key={grp.group}
                    type="button"
                    onClick={handleOpenModulePicker}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                      hasAny
                        ? 'bg-white border-stone-200 text-stone-800 hover:border-stone-300'
                        : 'bg-stone-100/70 border-stone-200/60 text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <span>{grp.group}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-full"
                      style={
                        hasAny
                          ? {
                              backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.12)',
                              color: 'var(--theme-primary, #8b6f4e)',
                            }
                          : undefined
                      }
                    >
                      {selectedInGroup}/{grp.modules.length}
                    </span>
                  </button>
                );
              })}
              {systemModules.length === 0 && (
                <span className="text-[11px] text-stone-400 italic">No system modules loaded.</span>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── Module Access Permissions Popup ─── */}
      <Modal
        isOpen={isModulePickerOpen}
        onClose={() => setIsModulePickerOpen(false)}
        title="Module Access Permissions"
        subtitle={
          formName.trim()
            ? `Select accessible admin modules for "${formName.trim()}"`
            : 'Select which modules this client website is allowed to access.'
        }
        maxWidth="max-w-5xl"
        zIndex="z-[1050]"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModulePickerOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyModuleSelection}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:brightness-95 transition-all cursor-pointer"
            >
              <HiOutlineCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Save Selection ({draftAllowedModules.length} / {systemModules.length})</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Toolbar: Search, Selected Counter & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-stone-50/80 p-3 rounded-2xl border border-stone-200/80">
            <div className="relative flex-1 min-w-0">
              <HiOutlineSearch className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Filter modules by name, group, or route path..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 focus:outline-none focus:border-[var(--theme-primary,#8b6f4e)]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-bold border"
                style={{
                  backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.1)',
                  color: 'var(--theme-primary, #8b6f4e)',
                  borderColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.25)',
                }}
              >
                {draftAllowedModules.length} / {systemModules.length} Selected
              </span>
              <button
                type="button"
                onClick={handleSelectAllModules}
                className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.08)',
                  color: 'var(--theme-primary, #8b6f4e)',
                  borderColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.3)',
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAllModules}
                className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-600 text-xs font-semibold hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Spacious Grouped Modules Grid */}
          {filteredModuleGroups.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/40">
              <p className="text-xs font-semibold text-stone-500">
                No modules match &ldquo;{moduleSearch}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredModuleGroups.map((grp) => {
                const selectedInGroup = grp.modules.filter((m) =>
                  draftAllowedModules.includes(m.id)
                ).length;
                const allGroupSelected =
                  grp.modules.length > 0 && selectedInGroup === grp.modules.length;

                return (
                  <div
                    key={grp.group}
                    className="rounded-xl border border-stone-200/90 bg-white overflow-hidden flex flex-col"
                  >
                    <div className="px-3.5 py-2.5 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-stone-800 truncate">
                          {grp.group}
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500 bg-white border border-stone-200 px-1.5 py-0.5 rounded-full shrink-0">
                          {selectedInGroup}/{grp.modules.length}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleGroupModules(grp.modules)}
                        style={{ color: 'var(--theme-primary, #8b6f4e)' }}
                        className="text-[11px] font-bold hover:underline cursor-pointer shrink-0"
                      >
                        {allGroupSelected ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="p-2.5 grid grid-cols-1 gap-1.5">
                      {grp.modules.map((mod) => {
                        const checked = draftAllowedModules.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            className={`w-full px-2.5 py-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              checked
                                ? 'text-stone-900'
                                : 'bg-white border-stone-100 text-stone-600 hover:bg-stone-50'
                            }`}
                            style={
                              checked
                                ? {
                                    backgroundColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.08)',
                                    borderColor: 'rgba(var(--theme-primary-rgb, 139, 111, 78), 0.35)',
                                  }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                  checked
                                    ? 'text-white'
                                    : 'bg-white border-stone-300'
                                }`}
                                style={
                                  checked
                                    ? {
                                        backgroundColor: 'var(--theme-primary, #8b6f4e)',
                                        borderColor: 'var(--theme-primary, #8b6f4e)',
                                      }
                                    : undefined
                                }
                              >
                                {checked && <HiOutlineCheck className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span className="text-xs font-semibold truncate">{mod.title}</span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 shrink-0 hidden sm:inline truncate max-w-[120px]">
                              {mod.path}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* ─── View Owner Modal ─── */}
      <Modal
        isOpen={Boolean(viewingOwner)}
        onClose={() => setViewingOwner(null)}
        title={viewingOwner?.name || 'Owner Details'}
        subtitle="Client database configuration & assigned system modules"
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setViewingOwner(null)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                const target = viewingOwner;
                setViewingOwner(null);
                if (target) handleOpenEdit(target);
              }}
              style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Edit Modules
            </button>
          </>
        }
      >
        {viewingOwner && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Client Name</p>
                <p className="text-sm font-bold text-stone-900 mt-0.5">{viewingOwner.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Status</p>
                <span
                  className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    viewingOwner.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}
                >
                  {viewingOwner.status}
                </span>
              </div>
              {viewingOwner.websiteUrl && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Website URL</p>
                  <p className="font-medium text-stone-800 mt-0.5">{viewingOwner.websiteUrl}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Database</p>
                <div className="mt-1 inline-flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-1.5">
                  <HiOutlineDatabase className="w-3.5 h-3.5 text-[#8b6f4e] shrink-0" />
                  <code className="font-mono text-xs font-semibold text-stone-800">
                    {extractDatabaseName(viewingOwner.databaseUrl)}
                  </code>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-800 mb-2">
                Accessible Modules ({viewingOwner.allowedModules?.length || 0})
              </p>
              {viewingOwner.allowedModules?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {viewingOwner.allowedModules.map((modId) => (
                    <span
                      key={modId}
                      className="px-2.5 py-1 rounded-lg bg-[#faf3e8] border border-[#8b6f4e]/20 text-[#8b6f4e] text-[11px] font-semibold"
                    >
                      {moduleTitleMap[modId] || modId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 italic">No modules selected for this owner.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Seed Categories & Master Data Modal ─── */}
      <Modal
        isOpen={Boolean(seedModalOwner)}
        onClose={() => !seedingOwnerId && setSeedModalOwner(null)}
        title={`Seed Categories & Master Data${seedModalOwner ? ` — ${seedModalOwner.name}` : ''}`}
        subtitle="Preview records from our central database and select master tables to seed into this owner's database."
        maxWidth="max-w-5xl"
        footer={
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <span className="text-xs text-stone-500 whitespace-nowrap">
              <strong className="text-stone-800">{selectedSeedCollections.size}</strong> of{' '}
              {seedPreview?.tables?.length || 0} tables selected
              {seedPreview ? (
                <>
                  {' · '}Central Total:{' '}
                  <strong className="text-stone-800">{seedPreview.totalCentralRecords}</strong> records
                </>
              ) : null}
            </span>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => setSeedModalOwner(null)}
                disabled={Boolean(seedingOwnerId)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSeedData}
                disabled={seedPreviewLoading || Boolean(seedingOwnerId) || selectedSeedCollections.size === 0}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--theme-primary,#8b6f4e)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs transition-opacity"
              >
                <HiOutlineRefresh className={`w-3.5 h-3.5 shrink-0 ${seedingOwnerId ? 'animate-spin' : ''}`} />
                <span>{seedingOwnerId ? 'Seeding...' : 'Seed Selected Data'}</span>
              </button>
            </div>
          </div>
        }
      >
        {seedPreviewLoading ? (
          <div className="py-16 text-center text-xs text-stone-500">
            Loading central database master tables...
          </div>
        ) : !seedPreview?.tables?.length ? (
          <div className="py-16 text-center text-xs text-stone-400">
            No master table data available to preview.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[290px_1fr] gap-4 min-h-[400px]">
            {/* Left Sidebar: Master Tables & Total Counts */}
            <div className="border border-stone-200 rounded-xl bg-stone-50/70 flex flex-col overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-stone-200 bg-white flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Master Tables ({seedPreview.tables.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const all = seedPreview.tables.filter((t) => t.centralCount > 0).map((t) => t.collection);
                    setSelectedSeedCollections((prev) =>
                      prev.size === all.length ? new Set() : new Set(all)
                    );
                  }}
                  className="text-[11px] font-semibold text-[var(--theme-primary,#8b6f4e)] hover:underline cursor-pointer"
                >
                  {selectedSeedCollections.size ===
                  seedPreview.tables.filter((t) => t.centralCount > 0).length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-stone-100">
                {seedPreview.tables.map((tbl) => {
                  const isActive = activeSeedCollection === tbl.collection;
                  const isChecked = selectedSeedCollections.has(tbl.collection);
                  return (
                    <div
                      key={tbl.collection}
                      onClick={() => setActiveSeedCollection(tbl.collection)}
                      className={`flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer transition-colors border-l-2 ${
                        isActive
                          ? 'bg-[#faf3e8]/80 border-[var(--theme-primary,#8b6f4e)]'
                          : 'border-transparent hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={tbl.centralCount === 0}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() =>
                            setSelectedSeedCollections((prev) => {
                              const next = new Set(prev);
                              if (next.has(tbl.collection)) next.delete(tbl.collection);
                              else next.add(tbl.collection);
                              return next;
                            })
                          }
                          className="h-3.5 w-3.5 rounded border-stone-300 accent-[var(--theme-primary,#8b6f4e)] cursor-pointer shrink-0"
                        />
                        <span
                          className={`text-xs truncate ${
                            isActive
                              ? 'font-bold text-[var(--theme-primary,#8b6f4e)]'
                              : 'font-medium text-stone-700'
                          }`}
                        >
                          {tbl.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-stone-200 text-stone-600 shrink-0">
                        {tbl.centralCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Selected Master Table Records */}
            {(() => {
              const activeTbl =
                seedPreview.tables.find((t) => t.collection === activeSeedCollection) ||
                seedPreview.tables[0];
              if (!activeTbl) return null;
              return (
                <div className="border border-stone-200 rounded-xl bg-white flex flex-col overflow-hidden min-w-0">
                  <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-bold text-stone-900">{activeTbl.label}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#faf3e8] text-[#8b6f4e] border border-[#8b6f4e]/20">
                        Central DB: {activeTbl.centralCount}
                      </span>
                      {activeTbl.targetCount !== null && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          Owner DB: {activeTbl.targetCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-stone-400">
                      Image fields excluded automatically
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[380px]">
                    {activeTbl.items.length === 0 ? (
                      <div className="py-16 text-center text-xs text-stone-400">
                        No records in central database for {activeTbl.label}.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold uppercase text-stone-500 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center">#</th>
                            <th className="py-2.5 px-3">Name / Value</th>
                            <th className="py-2.5 px-3">Code / Slug</th>
                            <th className="py-2.5 px-3 text-right w-24">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {activeTbl.items.map((row, idx) => (
                            <tr key={row._id || idx} className="hover:bg-stone-50/70">
                              <td className="py-2 px-3 text-center text-stone-400">{idx + 1}</td>
                              <td className="py-2 px-3 font-medium text-stone-800">{row.primary}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-stone-500">
                                {row.secondary || '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    row.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
