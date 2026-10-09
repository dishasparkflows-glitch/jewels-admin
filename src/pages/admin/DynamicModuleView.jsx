import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineFilter,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';

const routeMap = {
  // ─── 1. Diamond Config ───────────────────────────
  '/diamond-config/types': {
    endpoint: '/diamond-types',
    title: 'Diamond Types',
    fields: [{ name: 'name', label: 'Type Name (e.g. Lab Grown, Natural)', type: 'text', required: true }],
  },
  '/diamond-config/shapes': {
    endpoint: '/diamond-shapes',
    title: 'Diamond Shapes',
    fields: [{ name: 'name', label: 'Shape Name (e.g. Round, Oval, Princess)', type: 'text', required: true }],
  },
  '/diamond-config/color': {
    endpoint: '/diamond-colors',
    title: 'Diamond Color',
    fields: [{ name: 'name', label: 'Color Grade (e.g. D, E, F, G)', type: 'text', required: true }],
  },
  '/diamond-config/clarity': {
    endpoint: '/diamond-clarities',
    title: 'Diamond Clarity',
    fields: [{ name: 'name', label: 'Clarity Grade (e.g. VVS1, VS2, SI1)', type: 'text', required: true }],
  },
  '/diamond-config/size': {
    endpoint: '/diamond-sizes',
    title: 'Diamond Size',
    fields: [
      { name: 'name', label: 'Size Bracket (e.g. 1.00 - 1.49ct)', type: 'text', required: true },
      { name: 'sizeFrom', label: 'Size From (Carats)', type: 'number', required: true },
      { name: 'sizeTo', label: 'Size To (Carats)', type: 'number', required: true },
    ],
  },

  // ─── 2. Product Config ───────────────────────────
  '/product-config/metal-purity': {
    endpoint: '/metal-purities',
    title: 'Metal Purity',
    fields: [
      { name: 'name', label: 'Purity Name (e.g. 18KT, 14KT, Platinum)', type: 'text', required: true },
      { name: 'metalType', label: 'Metal Category', type: 'select', options: ['Gold', 'Platinum', 'Silver'], default: 'Gold' },
      { name: 'karat', label: 'Karat Value (for Gold)', type: 'number' },
    ],
  },
  '/product-config/metal-color': {
    endpoint: '/metal-colors',
    title: 'Metal Color',
    fields: [
      { name: 'name', label: 'Color Label (e.g. Yellow Gold, Rose Gold)', type: 'text', required: true },
      { name: 'colorCode', label: 'Start Color Hex (e.g. #F9E498)', type: 'text' },
      { name: 'colorCodeEnd', label: 'End Color Hex (e.g. #B38B34)', type: 'text' },
    ],
  },
  '/product-config/sizes': {
    endpoint: '/sizes',
    title: 'Sizes',
    fields: [{ name: 'name', label: 'Size Display (e.g. Size 7 / 17.3mm)', type: 'text', required: true }],
  },
  '/product-config/vto-masters': {
    endpoint: '/vto-masters',
    title: 'VTO Masters',
    fields: [
      { name: 'bodyPart', label: 'Body Part', type: 'select', options: ['hand', 'neck', 'ear', 'wrist'], required: true },
      { name: 'lightImage.url', label: 'Light Tone Image URL', type: 'text', required: true },
      { name: 'darkImage.url', label: 'Dark Tone Image URL', type: 'text', required: true },
    ],
  },

  // ─── 3. Pricing Hub ──────────────────────────────
  '/pricing-hub/metal-rates': {
    endpoint: '/metal-types',
    title: 'Metal Rates',
    fields: [
      { name: 'name', label: 'Metal Display Name', type: 'text', required: true },
      { name: 'karat', label: 'Karat', type: 'number' },
      { name: 'metalColor', label: 'Metal Color', type: 'text' },
    ],
  },
  '/pricing-hub/diamond-rates': {
    endpoint: '/diamond-prices',
    title: 'Diamond rates',
    fields: [
      { name: 'sizeFrom', label: 'Size From (ct)', type: 'number', required: true },
      { name: 'sizeTo', label: 'Size To (ct)', type: 'number', required: true },
      { name: 'ratePerCarat', label: 'Rate Per Carat (INR)', type: 'number', required: true },
      { name: 'ratePerCaratUSD', label: 'Rate Per Carat (USD)', type: 'number' },
    ],
  },

  // ─── 4. Catalog ──────────────────────────────────
  '/catalog/jewelry-products': {
    endpoint: '/products?productType=Jewelry',
    title: 'Jewelry Products',
    fields: [
      { name: 'title', label: 'Product Title', type: 'text', required: true },
      { name: 'sku', label: 'SKU Code', type: 'text', required: true },
      { name: 'price', label: 'Retail Price (₹)', type: 'number', required: true },
    ],
  },
  '/catalog/silver-products': {
    endpoint: '/products?productType=Silver',
    title: 'Silver Products',
    fields: [
      { name: 'title', label: 'Product Title', type: 'text', required: true },
      { name: 'sku', label: 'SKU Code', type: 'text', required: true },
      { name: 'price', label: 'Retail Price (₹)', type: 'number', required: true },
    ],
  },
  '/catalog/ornate-products': {
    endpoint: '/products?isOrnate=true',
    title: 'Ornate Products',
    fields: [
      { name: 'title', label: 'Product Title', type: 'text', required: true },
      { name: 'sku', label: 'Tag No / SKU', type: 'text', required: true },
      { name: 'price', label: 'Retail Price (₹)', type: 'number', required: true },
    ],
  },
  '/catalog/categories': {
    endpoint: '/categories',
    title: 'Categories',
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true },
      { name: 'type', label: 'Type', type: 'select', options: ['category', 'collection'], default: 'category' },
    ],
  },
  '/catalog/navigation-menus': {
    endpoint: '/menu-sections',
    title: 'Navigation Menus',
    fields: [
      { name: 'title', label: 'Section Title', type: 'text', required: true },
    ],
  },

  // ─── 5. Diamonds ──────────────────────────────────
  '/diamonds': {
    endpoint: '/diamonds',
    title: 'Diamonds',
    fields: [
      { name: 'sku', label: 'SKU / Certificate ID', type: 'text', required: true },
      { name: 'title', label: 'Diamond Title', type: 'text', required: true },
      { name: 'carat', label: 'Carat Weight', type: 'number', required: true },
      { name: 'price', label: 'Price (₹)', type: 'number', required: true },
      { name: 'rate', label: 'Rate Per Carat (₹)', type: 'number' },
    ],
  },

  // ─── Operations & Marketing ──────────────────────
  '/orders': { endpoint: '/orders', title: 'Orders' },
  '/returns': { endpoint: '/returns', title: 'Returns' },
  '/appointments': { endpoint: '/appointments', title: 'Appointments' },
  '/custom-inquiries': { endpoint: '/custom-inquiries', title: 'Custom Inquiries' },
  '/cod-sequence': { endpoint: '/cod-sequences', title: 'COD Sequence' },
  '/cod-sequences': { endpoint: '/cod-sequences', title: 'COD Sequence' },
  '/marketing/coupons': { endpoint: '/coupons', title: 'Coupons' },
  '/marketing/banners': { endpoint: '/banners', title: 'Banners' },
  '/marketing/birthstones': { endpoint: '/birthstones', title: 'Birthstones' },
  '/marketing/before-after': { endpoint: '/cust-jewellery-before-after', title: 'Lookare Before/After' },
  '/marketing/instagram': { endpoint: '/instagram-posts', title: 'Instagram Posts' },
  '/marketing/gifts': { endpoint: '/featured', title: 'Celebrate & Gifts' },
  '/marketing/footer': { endpoint: '/footer-settings', title: 'Footer Management' },
};

const DynamicModuleView = () => {
  const confirm = useConfirm();
  const { pathname } = useLocation();
  const config = routeMap[pathname] || {
    endpoint: pathname,
    title: pathname.split('/').filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
  };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(config.endpoint);
      const data = res.data?.data?.items || res.data?.data || [];
      setItems(Array.isArray(data) ? data : [data].filter(Boolean));
    } catch (err) {
      console.error('Failed to load records for', config.endpoint, err);
      // Fallback empty array
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    fetchItems();
    setSearch('');
  }, [fetchItems]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const cleanEndpoint = config.endpoint.split('?')[0];
      await api.post(cleanEndpoint, formData);
      toast.success(`${config.title} record created!`);
      setIsModalOpen(false);
      setFormData({});
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: `Delete ${config.title} Record`,
      message: 'Are you sure you want to delete this record? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;
    try {
      const cleanEndpoint = config.endpoint.split('?')[0];
      await api.delete(`${cleanEndpoint}/${id}`);
      toast.success('Record deleted successfully');
      setItems((prev) => prev.filter((i) => i._id !== id && i.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  // Helper to get row label/name
  const getRowLabel = (row) => {
    const val =
      row.title ||
      row.name ||
      row.coupon?.code ||
      row.couponcode ||
      row.fullName ||
      row.sku ||
      row.bodyPart ||
      row.url ||
      row.copyright ||
      'Record';

    if (typeof val === 'object' && val !== null) {
      return val.name || val.title || val.label || JSON.stringify(val);
    }
    return String(val ?? '');
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      const label = String(getRowLabel(row)).toLowerCase();
      const id = String(row._id || row.id || '').toLowerCase();
      const sku = typeof row.sku === 'string' ? row.sku.toLowerCase() : '';
      return label.includes(q) || id.includes(q) || sku.includes(q);
    });
  }, [items, search]);

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, 10);

  const statCardsData = [
    {
      label: `Total ${config.title}`,
      value: items.length || 0,
      icon: HiOutlineEye,
      color: 'bronze',
    },
    {
      label: 'Verified Records',
      value: items.length || 0,
      icon: HiOutlineRefresh,
      color: 'green',
    },
    {
      label: 'Catalog Items',
      value: filteredItems.length || 0,
      icon: HiOutlinePlus,
      color: 'peach',
    },
    {
      label: 'Active Sync',
      value: 'Live',
      icon: HiOutlineEye,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', config.title]}
        title={config.title}
        subtitle={`Configure, manage and update real-time ${config.title.toLowerCase()} catalog data.`}
        onAdd={() => setIsModalOpen(true)}
        addLabel={`Add ${config.title.replace(/s$/, '')}`}
        exportData={items}
        exportFileName={`${config.title.toLowerCase().replace(/\s+/g, '_')}_export`}
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder={`Search ${config.title.toLowerCase()}...`}
      />

      {/* ─── Table Card Container ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs overflow-hidden">
        {/* Table view */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-1.5">
              <HiOutlineRefresh className="w-4 h-4 animate-spin text-[#8b6f4e]" />
              <span>Loading {config.title.toLowerCase()} from database...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#faf6f0] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                <HiOutlineEye className="w-4 h-4" />
              </div>
              <p className="font-medium text-stone-600 text-xs">No records found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-[#8b6f4e] hover:underline font-semibold cursor-pointer"
              >
                + Add the first {config.title} item
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-2 pl-4 pr-1 w-8">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                      />
                    </th>
                    <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">SR NO</th>
                    <th className="py-2 px-3 whitespace-nowrap">ITEM / RECORD</th>
                    <th className="py-2 px-3 whitespace-nowrap">SPECIFICATIONS</th>
                    <th className="py-2 px-3 whitespace-nowrap">STATUS</th>
                    <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {paginatedItems.map((row, idx) => {
                    const rowLabel = getRowLabel(row);
                    const thumbUrl =
                      row.image?.url ||
                      row.lightImage?.url ||
                      (Array.isArray(row.images) && row.images[0]?.url) ||
                      (Array.isArray(row.ornateImages) && row.ornateImages[0]?.url);

                    const typeName =
                      typeof row.type === 'object' && row.type !== null
                        ? (row.type.name || row.type.title || '')
                        : (typeof row.type === 'string' ? row.type : '');

                    const shapeName =
                      typeof row.shape === 'object' && row.shape !== null
                        ? (row.shape.name || row.shape.title || '')
                        : (typeof row.shape === 'string' ? row.shape : '');

                    const colorName =
                      typeof row.color === 'object' && row.color !== null
                        ? (row.color.name || row.color.title || '')
                        : (typeof row.color === 'string' ? row.color : '');

                    const clarityName =
                      typeof row.clarity === 'object' && row.clarity !== null
                        ? (row.clarity.name || row.clarity.title || '')
                        : (typeof row.clarity === 'string' ? row.clarity : '');

                    const statusStr =
                      typeof row.status === 'object' && row.status !== null
                        ? (row.status.name || 'active')
                        : String(row.status || (row.isActive !== false ? 'active' : 'inactive'));

                    const isInactive = statusStr === 'inactive' || row.isActive === false;

                    return (
                      <tr key={row._id || row.id} className="hover:bg-[#fcfaf7] transition-colors">
                        <td className="py-2.5 pl-4 pr-1">
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 text-stone-900 text-xs font-semibold flex items-center gap-2.5">
                          {thumbUrl && (
                            <img
                              src={thumbUrl}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover border border-stone-200 shrink-0"
                            />
                          )}
                          <span className="truncate max-w-xs">{rowLabel}</span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {row.sku && typeof row.sku === 'string' && row.sku !== rowLabel && (
                              <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-1 py-0.5 rounded border border-stone-200/50">
                                {row.sku}
                              </span>
                            )}
                            {row.carat !== undefined && row.carat !== null && (
                              <span className="font-semibold text-stone-900">
                                {row.carat} ct
                              </span>
                            )}
                            {shapeName && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium">
                                {shapeName}
                              </span>
                            )}
                            {colorName && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                                Color: {colorName}
                              </span>
                            )}
                            {clarityName && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px]">
                                {clarityName}
                              </span>
                            )}
                            {row.karat ? <span>{row.karat}KT</span> : null}
                            {row.colorCode && (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs"
                                  style={{
                                    background: row.colorCodeEnd
                                      ? `linear-gradient(135deg, ${row.colorCode}, ${row.colorCodeEnd})`
                                      : row.colorCode,
                                  }}
                                />
                                <span className="text-[11px] text-stone-500">{row.colorCode}</span>
                              </span>
                            )}
                            {row.sizeFrom !== undefined && `${row.sizeFrom} - ${row.sizeTo}ct`}
                            {row.price !== undefined && row.price !== null && (
                              <span className="font-semibold text-stone-900">
                                ₹{Number(row.price).toLocaleString('en-IN')}
                              </span>
                            )}
                            {row.ratePerCarat && `₹${Number(row.ratePerCarat).toLocaleString('en-IN')}/ct`}
                            {row.rate && !row.ratePerCarat && `₹${Number(row.rate).toLocaleString('en-IN')}/ct`}
                            {typeName && (
                              <span className="capitalize px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px]">
                                {typeName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isInactive
                                ? 'bg-stone-100 text-stone-600 border-stone-200'
                                : 'bg-[#faf5ed] text-[#8b6f4e] border-[#e8d8c0]'
                            }`}
                          >
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                          <RowActions
                            onView={() => toast.success(`Record: ${rowLabel}`)}
                            onDelete={() => handleDelete(row._id || row.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Luxury Common Pagination */}
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      </div>

      {/* ─── Create Record Modal ────────────────────────────── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Create New {config.title.replace(/s$/, '')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {config.fields?.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <Dropdown
                      value={formData[field.name] || field.default || ''}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, [field.name]: val }))
                      }
                      options={field.options}
                      placeholder={`Select ${field.label}`}
                      size="sm"
                      buttonClassName="w-full h-9 rounded-xl border border-stone-200 bg-[#fdfcfb]"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      placeholder={field.label}
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold tracking-wider text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl uppercase shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicModuleView;
