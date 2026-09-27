import React, { useState, useEffect } from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineX,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoSparklesOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';

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

  // Uploading state
  const [uploadingLight, setUploadingLight] = useState(false);
  const [lightProgress, setLightProgress] = useState(0);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [darkProgress, setDarkProgress] = useState(0);
  const [saving, setSaving] = useState(false);

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

  // Upload handlers
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
    }
  };

  // Save changes
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ─── Page Header (Exact Match to Screenshot 1) ─── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[28px] font-bold text-stone-900 tracking-tight">
          VTO Master Assets
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Configure global hand, wrist, and neck environments for Virtual Try-On.
        </p>
      </div>

      {/* ─── Master Assets Cards Grid (Exact Match to Screenshot 1 & 2) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ORDERED_PARTS.map((key) => {
          const meta = BODY_PART_META[key];
          const master = masters.find((m) => m.bodyPart === key);
          const isActive = master?.status === 'active';
          const lightImg = master?.lightImage?.url;
          const darkImg = master?.darkImage?.url;

          return (
            <div
              key={key}
              className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all"
            >
              {/* Top Details */}
              <div>
                {/* Header Row: Icon + Title/Env + Active Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#faf5ee] border border-[#ebdccb] flex items-center justify-center text-[#8f6d43] flex-shrink-0 shadow-2xs">
                      <IoSparklesOutline className="w-4 h-4 text-[#8f6d43]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-[15px] tracking-tight leading-tight">
                        {meta.name}
                      </h3>
                      <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                        {meta.env}
                      </span>
                    </div>
                  </div>

                  {/* ACTIVE Badge (Exact Match: tiny dot + ACTIVE) */}
                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-emerald-600 bg-emerald-50/90 border border-emerald-200/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[12px] text-stone-500 mt-4 leading-relaxed min-h-[36px]">
                  {meta.description}
                </p>

                {/* Dual Image Containers: LIGHT SKIN TONE vs DARK SKIN TONE */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Light Tone */}
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1.5">
                      LIGHT SKIN TONE
                    </div>
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#fafafa] border border-stone-150/80 flex items-center justify-center shadow-2xs">
                      {lightImg ? (
                        <img
                          src={lightImg}
                          alt={`${meta.name} Light`}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f9fafb] flex flex-col items-center justify-center text-stone-300">
                          <span className="text-[11px] font-medium text-stone-400">Light</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dark Tone */}
                  <div>
                    <div className="text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1.5">
                      DARK SKIN TONE
                    </div>
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#fafafa] border border-stone-150/80 flex items-center justify-center shadow-2xs">
                      {darkImg ? (
                        <img
                          src={darkImg}
                          alt={`${meta.name} Dark`}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#f9fafb] flex flex-col items-center justify-center text-stone-300">
                          <span className="text-[11px] font-medium text-stone-400">Dark</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer: High-res required + UPDATE MASTER */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-stone-100">
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <HiOutlineInformationCircle className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span>High-res required</span>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(key, master)}
                  className="bg-[#d1d5db] hover:bg-stone-400 active:bg-stone-500 text-white font-bold text-[10px] tracking-wider px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs uppercase cursor-pointer"
                >
                  UPDATE MASTER
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Bottom Architecture Tip (Exact Match to Screenshot 2) ─── */}
      <div className="mt-8 bg-[#fffdfa] border border-[#f5ece1] rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-2xs">
        <div className="w-8 h-8 rounded-full bg-[#f6eee3] text-[#8f6d43] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
          <HiOutlineInformationCircle className="w-5 h-5 text-[#8f6d43]" />
        </div>
        <div className="flex-1">
          <h4 className="text-[13px] font-bold text-stone-900 mb-0.5">
            Architecture Tip
          </h4>
          <p className="text-[12px] sm:text-[12.5px] text-stone-500 leading-relaxed">
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
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
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
                  <div className="w-24 h-28 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {lightUrl ? (
                      <img
                        src={lightUrl}
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
                  <div className="w-24 h-28 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {darkUrl ? (
                      <img
                        src={darkUrl}
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
