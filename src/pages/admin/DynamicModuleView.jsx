import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch,
  HiOutlinePlus,
  HiOutlineDownload,
  HiOutlineFilter,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlineX,
} from 'react-icons/hi';

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

  // ─── Operations & Marketing ──────────────────────
  '/appointments': { endpoint: '/appointments', title: 'Appointments' },
  '/custom-inquiries': { endpoint: '/custom-inquiries', title: 'Custom Inquiries' },
  '/cod-sequence': { endpoint: '/cod-sequences', title: 'COD Sequence' },
  '/marketing/coupons': { endpoint: '/coupons', title: 'Coupons' },
  '/marketing/banners': { endpoint: '/banners', title: 'Banners' },
  '/marketing/birthstones': { endpoint: '/birthstones', title: 'Birthstones' },
  '/marketing/before-after': { endpoint: '/cust-jewellery-before-after', title: 'Lookare Before/After' },
  '/marketing/instagram': { endpoint: '/instagram-posts', title: 'Instagram Posts' },
  '/marketing/gifts': { endpoint: '/featured', title: 'Celebrate & Gifts' },
  '/marketing/footer': { endpoint: '/footer-settings', title: 'Footer Management' },
};

const DynamicModuleView = () => {
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
    if (!window.confirm('Are you sure you want to delete this record?')) return;
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
    return (
      row.name ||
      row.title ||
      row.couponcode ||
      row.fullName ||
      row.sku ||
      row.bodyPart ||
      row.url ||
      row.copyright ||
      'Record'
    );
  };

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      const label = getRowLabel(row).toLowerCase();
      const id = (row._id || row.id || '').toLowerCase();
      return label.includes(q) || id.includes(q);
    });
  }, [items, search]);

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              {config.title}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#faf6f0] text-[#8b6f4e] border border-[#e8d9c2]">
              {items.length} Records
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Configure, manage and update real-time {config.title.toLowerCase()} data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold tracking-wider uppercase shadow-sm shadow-[#8b6f4e]/20 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      {/* ─── Search Bar & Table ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/70 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${config.title.toLowerCase()}...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#fdfcfb] border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#8b6f4e]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500">
            <HiOutlineFilter className="w-4 h-4 text-stone-400" />
            <span>Showing {filteredItems.length} of {items.length} records</span>
          </div>
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
              <HiOutlineRefresh className="w-6 h-6 animate-spin text-[#8b6f4e]" />
              <span>Loading {config.title.toLowerCase()} from database...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#faf6f0] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                <HiOutlineEye className="w-6 h-6" />
              </div>
              <p className="font-medium text-stone-600">No records found</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-[#8b6f4e] hover:underline font-semibold"
              >
                + Add the first {config.title} item
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  <th className="pb-3">Title / Value</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredItems.map((row) => (
                  <tr key={row._id || row.id} className="hover:bg-[#fcfaf7] transition-colors">
                    <td className="py-3.5 text-stone-900 text-xs font-semibold flex items-center gap-2.5">
                      {row.image?.url && (
                        <img
                          src={row.image.url}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover border border-stone-200"
                        />
                      )}
                      {row.lightImage?.url && (
                        <img
                          src={row.lightImage.url}
                          alt=""
                          className="w-7 h-7 rounded-lg object-cover border border-stone-200"
                        />
                      )}
                      <span>{getRowLabel(row)}</span>
                    </td>
                    <td className="py-3.5 text-stone-600 text-xs">
                      {row.karat ? `${row.karat}KT` : null}
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
                      {row.price && `₹${Number(row.price).toLocaleString('en-IN')}`}
                      {row.ratePerCarat && `₹${Number(row.ratePerCarat).toLocaleString('en-IN')}/ct`}
                      {row.type && <span className="capitalize">{row.type}</span>}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.status === 'inactive' || row.isActive === false
                            ? 'bg-stone-100 text-stone-600 border-stone-200'
                            : 'bg-[#faf5ed] text-[#8b6f4e] border-[#e8d8c0]'
                        }`}
                      >
                        {row.status || (row.isActive !== false ? 'active' : 'inactive')}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(row._id || row.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <select
                      value={formData[field.name] || field.default || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-[#fdfcfb] focus:outline-none focus:border-[#8b6f4e]"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
