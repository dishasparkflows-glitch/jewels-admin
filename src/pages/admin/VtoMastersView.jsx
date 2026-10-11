import React, { useState, useEffect, useMemo } from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiOutlineTrash,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';

const ORDERED_PARTS = ['hand', 'neck', 'ear', 'wrist'];

const BODY_PART_META = {
  hand: {
    name: 'Hand Master',
    env: 'HAND ENVIRONMENT',
    description:
      'Used for Rings and Bracelets. Upload high-quality top-down images of a hand with neutral lighting.',
  },
  neck: {
    name: 'Neck Master',
    env: 'NECK ENVIRONMENT',
    description:
      'Used for Necklaces and Pendants. Ensure the neckline is clear and centered for jewelry placement.',
  },
  ear: {
    name: 'Ear Master',
    env: 'EAR ENVIRONMENT',
    description:
      'Used for Earrings. High-detail close-up of a side-view ear lobe is recommended.',
  },
  wrist: {
    name: 'Wrist Master',
    env: 'WRIST ENVIRONMENT',
    description:
      'Used for Bangles and Bracelets. Upload images of a wrist from a side or top-down angle.',
  },
};

const DEFAULT_ASSET_MAP = {
  hand: { light: '/vto/hand_light.jpg', dark: '/vto/hand_dark.jpg' },
  neck: { light: '/vto/neck_light.jpg', dark: '/vto/neck_dark.jpg' },
  ear: { light: '/vto/ear_light.jpg', dark: '/vto/ear_dark.jpg' },
  wrist: { light: '/vto/hand_light.jpg', dark: '/vto/hand_dark.jpg' },
};

export default function VtoMastersView() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState('hand');
  const [selectedMaster, setSelectedMaster] = useState(null);

  // Form Fields inside Modal
  const [lightUrl, setLightUrl] = useState('');
  const [lightPublicId, setLightPublicId] = useState('');
  const [darkUrl, setDarkUrl] = useState('');
  const [darkPublicId, setDarkPublicId] = useState('');
  const [status, setStatus] = useState('active');

  // Modal uploading state
  const [uploadingLight, setUploadingLight] = useState(false);
  const [lightProgress, setLightProgress] = useState(0);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [darkProgress, setDarkProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Inline Card uploading state (e.g. 'ear_light')
  const [uploadingCardTone, setUploadingCardTone] = useState(null);

  // Fetch all VTO Masters from backend
  const fetchMasters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vto-masters');
      const items = res.data?.data?.items || res.data?.data || [];
      setMasters(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load VTO Masters:', err);
      toast.error('Failed to load VTO Masters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  // Helper to open edit modal
  const openEditModal = (partKey, currentMaster) => {
    setSelectedPart(partKey);
    setSelectedMaster(currentMaster || null);
    setLightUrl(currentMaster?.lightImage?.url || '');
    setLightPublicId(currentMaster?.lightImage?.public_id || '');
    setDarkUrl(currentMaster?.darkImage?.url || '');
    setDarkPublicId(currentMaster?.darkImage?.public_id || '');
    setStatus(currentMaster?.status || 'active');
    setIsModalOpen(true);
  };

  // Direct Inline Upload on Card (Hover & Click REPLACE LIGHT / REPLACE DARK)
  const handleCardUpload = async (e, partKey, tone, currentMaster) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toneKey = `${partKey}_${tone}`;
    try {
      setUploadingCardTone(toneKey);
      const res = await uploadWithPresignedUrl(file, 'vto');

      const isLight = tone === 'light';
      const payload = {
        bodyPart: partKey,
        lightImage: isLight
          ? { url: res.fileUrl, public_id: res.key || `${partKey}_light` }
          : (currentMaster?.lightImage || { url: '', public_id: '' }),
        darkImage: !isLight
          ? { url: res.fileUrl, public_id: res.key || `${partKey}_dark` }
          : (currentMaster?.darkImage || { url: '', public_id: '' }),
        status: currentMaster?.status || 'active',
      };

      if (currentMaster?._id) {
        await api.put(`/vto-masters/${currentMaster._id}`, payload);
      } else {
        await api.post('/vto-masters', payload);
      }

      toast.success(`${BODY_PART_META[partKey]?.name} ${isLight ? 'Light' : 'Dark'} Tone updated`);
      await fetchMasters();
    } catch (err) {
      console.error(`Failed to upload ${partKey} ${tone} image:`, err);
      toast.error(err.response?.data?.message || `Failed to upload image`);
    } finally {
      setUploadingCardTone(null);
      e.target.value = '';
    }
  };

  // Restore Default Models
  const handleRestoreDefaults = async () => {
    try {
      setLoading(true);
      for (const part of ORDERED_PARTS) {
        const master = masters.find((m) => m.bodyPart === part);
        const def = DEFAULT_ASSET_MAP[part];
        const payload = {
          bodyPart: part,
          lightImage: { url: def.light, public_id: `${part}_light` },
          darkImage: { url: def.dark, public_id: `${part}_dark` },
          status: 'active',
        };

        if (master?._id) {
          await api.put(`/vto-masters/${master._id}`, payload);
        } else {
          await api.post('/vto-masters', payload);
        }
      }

      toast.success('Default VTO model assets restored');
      await fetchMasters();
    } catch (err) {
      console.error('Failed to restore defaults:', err);
      toast.error('Failed to restore default assets');
    } finally {
      setLoading(false);
    }
  };

  // Upload handlers inside Modal
  const handleUploadLight = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLight(true);
      setLightProgress(0);
      const res = await uploadWithPresignedUrl(file, 'vto', setLightProgress);
      setLightUrl(res.fileUrl);
      setLightPublicId(res.key || file.name);
      toast.success('Light Tone asset uploaded');
    } catch (err) {
      console.error('Light upload error:', err);
      toast.error('Failed to upload Light Tone image');
    } finally {
      setUploadingLight(false);
      e.target.value = '';
    }
  };

  const handleUploadDark = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingDark(true);
      setDarkProgress(0);
      const res = await uploadWithPresignedUrl(file, 'vto', setDarkProgress);
      setDarkUrl(res.fileUrl);
      setDarkPublicId(res.key || file.name);
      toast.success('Dark Tone asset uploaded');
    } catch (err) {
      console.error('Dark upload error:', err);
      toast.error('Failed to upload Dark Tone image');
    } finally {
      setUploadingDark(false);
      e.target.value = '';
    }
  };

  // Save changes inside Modal
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        bodyPart: selectedPart,
        lightImage: {
          url: lightUrl,
          public_id: lightPublicId || `${selectedPart}_light`,
        },
        darkImage: {
          url: darkUrl,
          public_id: darkPublicId || `${selectedPart}_dark`,
        },
        status,
      };

      if (selectedMaster?._id) {
        await api.put(`/vto-masters/${selectedMaster._id}`, payload);
      } else {
        await api.post('/vto-masters', payload);
      }

      toast.success('VTO Master updated successfully');
      setIsModalOpen(false);
      await fetchMasters();
    } catch (err) {
      console.error('Failed to save VTO Master:', err);
      toast.error(err.response?.data?.message || 'Failed to save VTO Master');
    } finally {
      setSaving(false);
    }
  };

  // Quick stat cards
  const configuredCount = useMemo(
    () => masters.filter((m) => m.lightImage?.url || m.darkImage?.url).length,
    [masters]
  );

  const statCardsData = [
    {
      label: 'VTO Environments',
      value: ORDERED_PARTS.length,
      icon: IoSparklesOutline,
      color: 'bronze',
    },
    {
      label: 'Configured Masters',
      value: configuredCount,
      icon: HiOutlinePhotograph,
      color: 'green',
    },
    {
      label: 'Tone Variants',
      value: 'Light & Dark',
      icon: IoSparklesOutline,
      color: 'peach',
    },
    {
      label: 'Engine Readiness',
      value: configuredCount >= 3 ? '100% Ready' : 'In Progress',
      icon: HiOutlineCheck,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Breadcrumb & Header Row ─── */}
      <ModuleHeader
        breadcrumbs={['Home', 'Product Config', 'VTO Masters']}
        title="VTO Master Assets"
        subtitle="Configure global virtual try-on environments, light and dark tone models for rings, earrings and necklaces."
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Master Assets Cards Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ORDERED_PARTS.map((key) => {
          const meta = BODY_PART_META[key];
          const master = masters.find((m) => m.bodyPart === key);
          const isActive = master?.status === 'active';
          const lightImg = master?.lightImage?.url;
          const darkImg = master?.darkImage?.url;
          const isLightUploading = uploadingCardTone === `${key}_light`;
          const isDarkUploading = uploadingCardTone === `${key}_dark`;

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-stone-200/80 p-3 sm:p-3.5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all"
            >
              {/* Top Details */}
              <div>
                {/* Header Row: Icon + Title/Env + Active Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#faf5ee] border border-[#ebdccb] flex items-center justify-center text-[#8f6d43] flex-shrink-0 shadow-2xs">
                      <IoSparklesOutline className="w-3.5 h-3.5 text-[#8f6d43]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-xs sm:text-[13px] tracking-tight leading-tight">
                        {meta.name}
                      </h3>
                      <span className="text-[9px] font-bold tracking-wider text-stone-400 uppercase">
                        {meta.env}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE Badge */}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide text-emerald-600 bg-emerald-50/90 border border-emerald-200/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-stone-500 mt-2 leading-tight line-clamp-2 min-h-0">
                  {meta.description}
                </p>

                {/* Dual Image Containers: LIGHT SKIN TONE vs DARK SKIN TONE */}
                <div className="grid grid-cols-2 gap-2 mt-2.5">
                  {/* Light Tone */}
                  <div>
                    <div className="text-[9px] font-bold tracking-wider text-stone-400 uppercase mb-1 flex items-center justify-between">
                      <span>LIGHT SKIN TONE</span>
                    </div>

                    <label
                      htmlFor={`card-upload-${key}-light`}
                      className="group relative aspect-[4/5] max-h-36 rounded-xl overflow-hidden bg-[#fafafa] border border-stone-150/80 flex items-center justify-center shadow-2xs cursor-pointer block select-none"
                      title="Click to replace Light Tone image"
                    >
                      <input
                        type="file"
                        id={`card-upload-${key}-light`}
                        accept="image/*"
                        className="hidden"
                        disabled={isLightUploading}
                        onChange={(e) => handleCardUpload(e, key, 'light', master)}
                      />

                      {lightImg ? (
                        <img
                          src={getMediaUrl(lightImg)}
                          alt={`${meta.name} Light`}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f9fafb] flex flex-col items-center justify-center text-stone-300">
                          <span className="text-[10px] font-medium text-stone-400">Light</span>
                        </div>
                      )}

                      {/* Loading Spinner during upload */}
                      {isLightUploading ? (
                        <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-20 text-white">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-bold tracking-wider uppercase">Uploading...</span>
                        </div>
                      ) : (
                        /* Hover Overlay - exact match to Screenshot 1: REPLACE LIGHT */
                        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
                          <HiOutlineUpload className="w-4 h-4 text-white" />
                          <span className="text-[9px] font-bold tracking-wider uppercase text-center px-1">
                            {lightImg ? 'REPLACE LIGHT' : 'UPLOAD LIGHT'}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Dark Tone */}
                  <div>
                    <div className="text-[9px] font-bold tracking-wider text-stone-400 uppercase mb-1 flex items-center justify-between">
                      <span>DARK SKIN TONE</span>
                    </div>

                    <label
                      htmlFor={`card-upload-${key}-dark`}
                      className="group relative aspect-[4/5] max-h-36 rounded-xl overflow-hidden bg-[#fafafa] border border-stone-150/80 flex items-center justify-center shadow-2xs cursor-pointer block select-none"
                      title="Click to replace Dark Tone image"
                    >
                      <input
                        type="file"
                        id={`card-upload-${key}-dark`}
                        accept="image/*"
                        className="hidden"
                        disabled={isDarkUploading}
                        onChange={(e) => handleCardUpload(e, key, 'dark', master)}
                      />

                      {darkImg ? (
                        <img
                          src={getMediaUrl(darkImg)}
                          alt={`${meta.name} Dark`}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f9fafb] flex flex-col items-center justify-center text-stone-300">
                          <span className="text-[10px] font-medium text-stone-400">Dark</span>
                        </div>
                      )}

                      {/* Loading Spinner during upload */}
                      {isDarkUploading ? (
                        <div className="absolute inset-0 bg-stone-900/75 backdrop-blur-xs flex flex-col items-center justify-center gap-1 z-20 text-white">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-bold tracking-wider uppercase">Uploading...</span>
                        </div>
                      ) : (
                        /* Hover Overlay - exact match to Screenshot 1: REPLACE DARK */
                        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 text-white">
                          <HiOutlineUpload className="w-4 h-4 text-white" />
                          <span className="text-[9px] font-bold tracking-wider uppercase text-center px-1">
                            {darkImg ? 'REPLACE DARK' : 'UPLOAD DARK'}
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer: High-res required + UPDATE MASTER */}
              <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-1 text-[10px] text-stone-400">
                  <HiOutlineInformationCircle className="w-3 h-3 text-stone-400 flex-shrink-0" />
                  <span>High-res req</span>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(key, master)}
                  className="bg-[#d1d5db] hover:bg-stone-400 active:bg-stone-500 text-white font-bold text-[9px] tracking-wider px-2.5 py-1 rounded transition-colors shadow-2xs uppercase cursor-pointer"
                >
                  UPDATE MASTER
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bottom Architecture Tip ─── */}
      <div className="mt-2.5 bg-[#fffdfa] border border-[#f5ece1] rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5 shadow-2xs">
        <div className="w-6 h-6 rounded-full bg-[#f6eee3] text-[#8f6d43] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
          <HiOutlineInformationCircle className="w-3.5 h-3.5 text-[#8f6d43]" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-stone-900 mb-0.5">
            Architecture Tip
          </h4>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            These master assets are global. When a customer uses the VTO, the system will overlay the product-specific transparent PNG onto these images. The{' '}
            <strong className="font-semibold text-stone-800">Dark Skin Tone</strong> asset should be an exact pose-match of the{' '}
            <strong className="font-semibold text-stone-800">Light</strong> one to ensure seamless skin-tone slider transitions.
          </p>
        </div>
      </div>

      {/* ─── Edit / Update Master Modal ─── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#faf8f5]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#faf5ee] border border-[#ebdccb] flex items-center justify-center text-[#8f6d43]">
                  <IoSparklesOutline className="w-4 h-4 text-[#8f6d43]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Update Master Asset: {BODY_PART_META[selectedPart]?.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {BODY_PART_META[selectedPart]?.env}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Quick Template Preset */}
              <div className="flex items-center justify-between p-3 bg-amber-50/70 rounded-xl border border-amber-200/60">
                <div>
                  <div className="text-xs font-bold text-amber-900">Default Model Template</div>
                  <div className="text-[11px] text-amber-700">
                    Quickly apply the recommended realistic studio models
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const def = DEFAULT_ASSET_MAP[selectedPart] || DEFAULT_ASSET_MAP.hand;
                    setLightUrl(def.light);
                    setLightPublicId(`${selectedPart}_light`);
                    setDarkUrl(def.dark);
                    setDarkPublicId(`${selectedPart}_dark`);
                    toast.success(`Applied default assets for ${BODY_PART_META[selectedPart]?.name}`);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-[#8f6d43] bg-white hover:bg-stone-50 border border-[#ebdccb] rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Apply Defaults
                </button>
              </div>

              {/* Status Select */}
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                <div>
                  <div className="text-xs font-bold text-stone-800">Asset Status</div>
                  <div className="text-[11px] text-stone-500">
                    Make this environment available for Virtual Try-On
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                      status === 'active' ? 'bg-[#8f6d43]' : 'bg-stone-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        status === 'active' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-semibold text-stone-700 w-14">
                    {status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Light Skin Tone Upload */}
              <div className="border border-stone-200/80 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 tracking-wide uppercase">
                    Light Skin Tone Image
                  </label>
                  {lightUrl && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <HiOutlineCheck className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-24 h-28 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {lightUrl ? (
                      <img
                        src={getMediaUrl(lightUrl)}
                        alt="Light Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiOutlinePhotograph className="w-8 h-8 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={lightUrl}
                      onChange={(e) => setLightUrl(e.target.value)}
                      placeholder="/vto/hand_light.jpg or https://..."
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#8f6d43]"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                        <HiOutlineUpload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLight}
                          className="hidden"
                          disabled={uploadingLight}
                        />
                      </label>

                      {lightUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLightUrl('');
                            setLightPublicId('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}

                      {uploadingLight && (
                        <span className="text-[11px] text-stone-500">
                          Uploading... {lightProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dark Skin Tone Upload */}
              <div className="border border-stone-200/80 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-800 tracking-wide uppercase">
                    Dark Skin Tone Image
                  </label>
                  {darkUrl && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <HiOutlineCheck className="w-3 h-3" /> Configured
                    </span>
                  )}
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-24 h-28 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {darkUrl ? (
                      <img
                        src={getMediaUrl(darkUrl)}
                        alt="Dark Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiOutlinePhotograph className="w-8 h-8 text-stone-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={darkUrl}
                      onChange={(e) => setDarkUrl(e.target.value)}
                      placeholder="/vto/hand_dark.jpg or https://..."
                      className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#8f6d43]"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                        <HiOutlineUpload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadDark}
                          className="hidden"
                          disabled={uploadingDark}
                        />
                      </label>

                      {darkUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setDarkUrl('');
                            setDarkPublicId('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}

                      {uploadingDark && (
                        <span className="text-[11px] text-stone-500">
                          Uploading... {darkProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pose Match Notice */}
              <div className="text-[11px] text-stone-500 bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2">
                <HiOutlineInformationCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  For seamless virtual try-on transitions, ensure both assets have identical dimensions, centering, and pose alignment.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingLight || uploadingDark}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#8f6d43] hover:bg-[#7b5e39] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Master Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
