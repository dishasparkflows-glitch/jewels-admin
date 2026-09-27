import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineSave,
  HiOutlineUpload,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const MONTHS = [
  { short: 'JAN', full: 'January', num: 1, defaultStone: 'GARNET', color: '#d97706' },
  { short: 'FEB', full: 'February', num: 2, defaultStone: 'AMETHYST', color: '#9333ea' },
  { short: 'MAR', full: 'March', num: 3, defaultStone: 'AQUAMARINE', color: '#06b6d4' },
  { short: 'APR', full: 'April', num: 4, defaultStone: 'DIAMOND', color: '#38bdf8' },
  { short: 'MAY', full: 'May', num: 5, defaultStone: 'EMERALD', color: '#10b981' },
  { short: 'JUN', full: 'June', num: 6, defaultStone: 'PEARL', color: '#94a3b8' },
  { short: 'JUL', full: 'July', num: 7, defaultStone: 'RUBY', color: '#e11d48' },
  { short: 'AUG', full: 'August', num: 8, defaultStone: 'PERIDOT', color: '#84cc16' },
  { short: 'SEP', full: 'September', num: 9, defaultStone: 'SAPPHIRE', color: '#2563eb' },
  { short: 'OCT', full: 'October', num: 10, defaultStone: 'OPAL', color: '#f472b6' },
  { short: 'NOV', full: 'November', num: 11, defaultStone: 'CITRINE', color: '#eab308' },
  { short: 'DEC', full: 'December', num: 12, defaultStone: 'BLUE TOPAZ', color: '#0ea5e9' },
];

// Photorealistic 3D gemstone radial sphere gradients matching luxury jewel portrayals
const GEM_GRADIENTS = {
  GARNET: 'radial-gradient(circle at 35% 26%, #fde047 0%, #fb923c 25%, #ea580c 55%, #9a3412 82%, #431407 100%)',
  AMETHYST: 'radial-gradient(circle at 35% 26%, #f5d0fe 0%, #c084fc 30%, #9333ea 60%, #581c87 85%, #2e1065 100%)',
  AQUAMARINE: 'radial-gradient(circle at 35% 26%, #cffafe 0%, #38bdf8 30%, #06b6d4 60%, #0e7490 85%, #164e63 100%)',
  DIAMOND: 'radial-gradient(circle at 35% 26%, #ffffff 0%, #f0f9ff 30%, #bae6fd 60%, #38bdf8 85%, #0369a1 100%)',
  EMERALD: 'radial-gradient(circle at 35% 26%, #dcfce7 0%, #4ade80 30%, #16a34a 60%, #166534 85%, #052e16 100%)',
  PEARL: 'radial-gradient(circle at 35% 26%, #ffffff 0%, #f8fafc 40%, #e2e8f0 70%, #94a3b8 90%, #475569 100%)',
  RUBY: 'radial-gradient(circle at 35% 26%, #ffe4e6 0%, #fb7185 28%, #e11d48 60%, #9f1239 85%, #4c0519 100%)',
  PERIDOT: 'radial-gradient(circle at 35% 26%, #ecfccb 0%, #a3e635 30%, #65a30d 65%, #3f6212 85%, #1a2e05 100%)',
  SAPPHIRE: 'radial-gradient(circle at 35% 26%, #dbeafe 0%, #60a5fa 30%, #2563eb 60%, #1e40af 85%, #172554 100%)',
  OPAL: 'radial-gradient(circle at 35% 26%, #fef3c7 0%, #f472b6 35%, #c084fc 70%, #7c3aed 90%, #4c1d95 100%)',
  CITRINE: 'radial-gradient(circle at 35% 26%, #fef9c3 0%, #facc15 30%, #ca8a04 60%, #854d0e 85%, #422006 100%)',
  'BLUE TOPAZ': 'radial-gradient(circle at 35% 26%, #e0f2fe 0%, #38bdf8 30%, #0284c7 60%, #0369a1 85%, #082f49 100%)',
};

export default function BirthstonePortfolioView() {
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [birthstonesMap, setBirthstonesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Current active month form state
  const [stoneName, setStoneName] = useState('GARNET');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const fileInputRef = useRef(null);

  // Fetch all birthstones from API
  const fetchBirthstones = async () => {
    try {
      setLoading(true);
      const res = await api.get('/birthstones?limit=50');
      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);

      const map = {};
      items.forEach((item) => {
        if (item.month) {
          map[item.month.toLowerCase()] = item;
        }
      });
      setBirthstonesMap(map);

      // Initialize selected month
      syncCurrentMonth(selectedMonth, map);
    } catch (err) {
      console.error('Failed to load birthstones:', err);
      toast.error('Failed to load birthstone data');
    } finally {
      setLoading(false);
    }
  };

  const syncCurrentMonth = (monthName, map) => {
    const existing = map[monthName.toLowerCase()];
    const defaultMeta = MONTHS.find((m) => m.full.toLowerCase() === monthName.toLowerCase());

    if (existing) {
      setStoneName(existing.stoneName ? existing.stoneName.toUpperCase() : defaultMeta?.defaultStone || '');
      setIsActive(existing.status !== 'inactive');
      setImageUrl(existing.image?.url || '');
    } else {
      setStoneName(defaultMeta?.defaultStone || 'GARNET');
      setIsActive(true);
      setImageUrl('');
    }
  };

  useEffect(() => {
    fetchBirthstones();
  }, []);

  const handleSelectMonth = (monthFull) => {
    setSelectedMonth(monthFull);
    syncCurrentMonth(monthFull, birthstonesMap);
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/upload/single?folder=birthstones', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        toast.success('Gemstone portrait uploaded successfully');
      }
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const existing = birthstonesMap[selectedMonth.toLowerCase()];
      const payload = {
        month: selectedMonth,
        stoneName: stoneName.trim().toUpperCase(),
        status: isActive ? 'active' : 'inactive',
        image: { url: imageUrl },
      };

      if (existing?._id) {
        await api.put(`/birthstones/${existing._id}`, payload);
      } else {
        await api.post('/birthstones', payload);
      }

      toast.success(`${selectedMonth} configuration saved successfully`);
      fetchBirthstones();
    } catch (err) {
      console.error('Error saving birthstone:', err);
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const currentGradient =
    GEM_GRADIENTS[stoneName.toUpperCase()] ||
    GEM_GRADIENTS.GARNET;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Page Title Header (Matches Screenshot) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Birthstone Portfolio
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage seasonal portrayals and stone labels for our birthstone collection.
          </p>
        </div>
        <button
          onClick={fetchBirthstones}
          title="Refresh Birthstone Portfolio"
          className="w-10 h-10 rounded-xl bg-white border border-stone-200/90 text-stone-500 hover:text-stone-900 flex items-center justify-center transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <HiOutlineRefresh className={`w-5 h-5 stroke-[1.8] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── 2-Column Grid (Matches Screenshot) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── Left Column (5 cols): Seasonal Portal Calendar ─── */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden">
          {/* Calendar Top Header with Binder Ring Tabs */}
          <div className="relative pt-6 pb-5 px-6 flex flex-col items-center justify-center border-b border-stone-100 bg-[#fdfbf9]/70">
            {/* Binder notches / loops */}
            <div className="absolute -top-1.5 left-1/4 w-3.5 h-3 rounded-full bg-stone-200 border border-stone-300 shadow-xs" />
            <div className="absolute -top-1.5 right-1/4 w-3.5 h-3 rounded-full bg-stone-200 border border-stone-300 shadow-xs" />

            <div className="flex flex-col items-center gap-1.5">
              <HiOutlineCalendar className="w-5 h-5 text-[#8f6d43]" />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#8f6d43] uppercase">
                SEASONAL PORTAL
              </span>
            </div>
          </div>

          {/* 12 Months Grid (2 Rows of 6) */}
          <div className="p-6">
            <div className="grid grid-cols-6 gap-2.5">
              {MONTHS.map((m) => {
                const isSelected = selectedMonth.toLowerCase() === m.full.toLowerCase();

                return (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() => handleSelectMonth(m.full)}
                    className={`relative h-20 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#8f6d43] text-white shadow-md shadow-[#8f6d43]/20 ring-2 ring-[#8f6d43]/25'
                        : 'bg-white border border-stone-200/80 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    {/* Month Label */}
                    <span
                      className={`text-xs font-bold tracking-wider z-10 transition-colors ${
                        isSelected ? 'text-white' : 'text-stone-800'
                      }`}
                    >
                      {m.short}
                    </span>

                    {/* Faint Watermark Number centered below month */}
                    <span
                      className={`text-2xl font-serif italic -mt-1 select-none pointer-events-none transition-colors ${
                        isSelected ? 'text-white/25' : 'text-stone-300/60'
                      }`}
                    >
                      {m.num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Right Column (7 cols): Selected Month Configuration ─── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8f6d43]">
              <IoDiamondOutline className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-stone-900 font-sans tracking-tight">
              {selectedMonth} Configuration
            </h2>
          </div>

          {/* Content Row: Gem Portrait | Assigned Gemstone | Global Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Gem Portrait Box (4 cols) */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-3">
                GEM PORTRAIT
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload custom gemstone portrait"
                className="w-36 h-36 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-[#8f6d43] transition-all shadow-inner"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={stoneName}
                    className="w-28 h-28 object-contain rounded-xl"
                  />
                ) : (
                  /* Stunning 3D Gem Sphere matching Screenshot's Garnet Sphere */
                  <div className="relative flex items-center justify-center">
                    {/* Floor contact shadow */}
                    <div className="absolute -bottom-1.5 w-18 h-2.5 rounded-full bg-stone-900/10 blur-[3px]" />
                    {/* Realistic 3D gemstone sphere */}
                    <div
                      className="w-24 h-24 rounded-full transition-transform duration-300 group-hover:scale-105 relative z-10"
                      style={{
                        background: currentGradient,
                        boxShadow:
                          '0 12px 24px -4px rgba(0, 0, 0, 0.2), inset -7px -7px 14px rgba(0, 0, 0, 0.38), inset 3px 3px 7px rgba(255, 255, 255, 0.45)',
                      }}
                    />
                  </div>
                )}

                {/* Upload overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold tracking-wider uppercase rounded-2xl">
                  <HiOutlineUpload className="w-5 h-5 mb-1" />
                  <span>{uploadingImage ? 'UPLOADING...' : 'CHANGE'}</span>
                </div>
              </div>
            </div>

            {/* Assigned Gemstone (5 cols) */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-3">
                ASSIGNED GEMSTONE
              </label>
              <input
                type="text"
                value={stoneName}
                onChange={(e) => setStoneName(e.target.value.toUpperCase())}
                placeholder="e.g. GARNET"
                className="w-full h-11 px-4 text-xs font-semibold tracking-wider text-stone-800 bg-stone-50/60 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
              />
            </div>

            {/* Global Visibility (3 cols) */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-3">
                GLOBAL VISIBILITY
              </label>
              <div className="flex items-center gap-3 h-11">
                <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                {/* Switch toggle matching screenshot */}
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none ${
                    isActive ? 'bg-[#8f6d43]' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5 ${
                      isActive ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <HiOutlineSave className="w-4 h-4 stroke-[2]" />
              <span>{saving ? 'SAVING...' : 'SAVE'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
