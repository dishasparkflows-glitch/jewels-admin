import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineFilter,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { diamondsAPI } from '../../api/services';
import { useConfirm } from '../../contexts/ConfirmContext';
import Pagination from '../../components/common/Pagination';
import Dropdown from '../../components/common/Dropdown';
import RowActions from '../../components/common/RowActions';
import { useAdminPageSize } from '../../utils/adminPagination';

export default function DiamondsView() {
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [shapeFilter, setShapeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [pagination, setPagination] = useState({ totalPages: 1, totalDocs: 0, limit: 10 });

  // Lookup options for filtering
  const [types, setTypes] = useState([]);
  const [shapes, setShapes] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: search.trim() || undefined,
      };
      if (typeFilter !== 'all') params.typeId = typeFilter;
      if (shapeFilter !== 'all') params.shapeId = shapeFilter;

      const res = await diamondsAPI.getAll(params);
      const items = res.data?.data?.items || res.data?.data || [];
      setDiamonds(Array.isArray(items) ? items : []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load diamonds:', err);
      toast.error('Failed to load diamonds list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, typeFilter, shapeFilter]);

  // Fetch filter lookups
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const res = await api.get('/diamonds/attributes');
        const data = res.data?.data || {};
        if (data.types) setTypes(data.types);
        if (data.shapes) setShapes(data.shapes);
      } catch (e) {
        // Fallback
      }
    };
    fetchLookups();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: 'Delete Diamond',
      message: `Are you sure you want to delete SKU "${item.sku}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await diamondsAPI.delete(item._id);
      toast.success('Diamond removed from stock');
      setDiamonds((prev) => prev.filter((d) => d._id !== item._id));
    } catch (err) {
      console.error('Failed to delete diamond:', err);
      toast.error('Failed to delete diamond');
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      setDiamonds((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, status: nextStatus } : d))
      );
      await diamondsAPI.update(item._id, { status: nextStatus });
      toast.success(`Diamond set to ${nextStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <span>Diamonds Stock</span>
            <span className="px-2.5 py-0.5 text-xs bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d7be] rounded-full font-semibold">
              {pagination.totalDocs || diamonds.length} Total
            </span>
          </h1>
          <p className="text-[13px] text-stone-500 mt-0.5">
            Manage loose diamonds inventory, certification, carat rates, and variant pricing.
          </p>
        </div>

        {/* Add Diamonds Button (Navigates to /diamonds/add) */}
        <button
          type="button"
          onClick={() => navigate('/diamonds/add')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#8b6f4e] hover:bg-[#785e42] text-white text-[13px] font-semibold rounded-xl transition-all shadow-xs hover:shadow-md active:scale-98 cursor-pointer"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Add Diamonds</span>
        </button>
      </div>

      {/* ─── Search and Filters Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <HiOutlineSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU or title..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#8b6f4e] transition-colors"
          />
        </form>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Shape filter */}
          <div className="w-36">
            <Dropdown
              value={shapeFilter}
              onChange={(val) => setShapeFilter(val)}
              options={[
                { value: 'all', label: 'All Shapes' },
                ...shapes.map((s) => ({ value: s._id, label: s.name })),
              ]}
              size="sm"
              buttonClassName="bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          {/* Type filter */}
          <div className="w-36">
            <Dropdown
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                ...types.map((t) => ({ value: t._id, label: t.name })),
              ]}
              size="sm"
              buttonClassName="bg-stone-50 border-stone-200 rounded-xl"
            />
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200/80"
            title="Refresh List"
          >
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Diamonds List Table ─── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-6 pt-4 overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#8b6f4e] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-stone-400 font-medium">Loading diamond inventory...</p>
            </div>
          ) : diamonds.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <IoDiamondOutline className="w-6 h-6" />
              </div>
              <p className="text-stone-800 font-semibold mb-1">No diamonds found</p>
            </div>
          ) : (
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  <th className="w-14 pb-1 pl-2">IMAGE</th>
                  <th className="pb-1 min-w-[160px]">SKU</th>
                  <th className="pb-1 min-w-[200px]">DIAMOND TITLE</th>
                  <th className="pb-1 w-24 text-center">CARAT</th>
                  <th className="pb-1 w-28 text-center">SHAPE / COLOR</th>
                  <th className="pb-1 min-w-[120px]">PRICE (₹)</th>
                  <th className="pb-1 w-20 text-center">STATUS</th>
                  <th className="pb-1 w-20 text-right pr-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {diamonds.map((item) => (
                  <tr key={item._id} className="group hover:bg-stone-50/60 transition-colors">
                    {/* Image */}
                    <td className="pl-2 align-middle">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center text-stone-400">
                        {item.image?.url ? (
                          <img
                            src={item.image.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IoDiamondOutline className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="align-middle px-2">
                      <span className="font-mono text-xs font-bold text-stone-800">
                        {item.sku}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="align-middle px-2">
                      <span className="text-xs font-medium text-stone-800 block truncate max-w-xs">
                        {item.title}
                      </span>
                      {item.typeId?.name && (
                        <span className="text-[10px] text-stone-400 block font-normal">
                          {item.typeId.name}
                        </span>
                      )}
                    </td>

                    {/* Carat */}
                    <td className="text-center align-middle px-2">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-[#fbf5ed] text-[#8b6f4e] border border-[#e8d7be] rounded-lg">
                        {item.carat} ct
                      </span>
                    </td>

                    {/* Shape / Color */}
                    <td className="text-center align-middle px-2">
                      <span className="text-xs text-stone-700 font-semibold block">
                        {item.shapeId?.name || item.shape || 'FANCY'}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {item.colorId?.name || item.color || 'D-E'} • {item.clarityId?.name || item.clarity || 'SI'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="align-middle px-2">
                      <span className="text-xs font-bold text-stone-900 block">
                        ₹ {Number(item.price || 0).toLocaleString()}
                      </span>
                      {item.rate > 0 && (
                        <span className="text-[10px] text-stone-400">
                          @ ₹ {Number(item.rate).toLocaleString()}/ct
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="text-center align-middle px-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.status === 'active'}
                        onClick={() => handleToggleStatus(item)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          item.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                        }`}
                        title={item.status === 'active' ? 'Active' : 'Inactive'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            item.status === 'active' ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="text-right align-middle pr-2">
                      <RowActions
                        onDelete={() => handleDelete(item)}
                        deleteTitle="Delete Diamond"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalItems={pagination.totalDocs || diamonds.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemLabel="diamonds"
        />
      </div>
    </div>
  );
}
