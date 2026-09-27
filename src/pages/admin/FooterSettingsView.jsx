import React, { useState, useEffect } from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSave,
  HiOutlineLink,
  HiOutlineCheck,
} from 'react-icons/hi';
import { IoGridOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function FooterSettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Corporate Identity
  const [copyright, setCopyright] = useState('© 2024 Neirah Jewellers. All rights reserved.');

  // Social Hub
  const [socialLinks, setSocialLinks] = useState([]);
  const [newPlatform, setNewPlatform] = useState('Facebook');
  const [newUrl, setNewUrl] = useState('');

  // Shop Hub Matrix
  const [shopItems, setShopItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [footerRes, catRes] = await Promise.all([
        api.get('/footer-settings/settings'),
        api.get('/categories/lookup'),
      ]);

      const footerData = footerRes.data?.data || {};
      if (footerData.copyright) setCopyright(footerData.copyright);
      if (Array.isArray(footerData.socialLinks)) setSocialLinks(footerData.socialLinks);
      if (Array.isArray(footerData.shopItems)) setShopItems(footerData.shopItems);

      const catList = catRes.data?.data || [];
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load footer settings:', err);
      toast.error('Failed to load footer configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add social link to local state
  const handleAddSocialLink = (e) => {
    e.preventDefault();
    if (!newUrl.trim()) {
      toast.error('Please enter a profile URL');
      return;
    }

    setSocialLinks((prev) => [
      ...prev,
      { platform: newPlatform, url: newUrl.trim() },
    ]);
    setNewUrl('');
    toast.success(`${newPlatform} link added`);
  };

  // Remove social link
  const handleRemoveSocialLink = (index) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  // Add shop item to matrix
  const handleLinkAsset = (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      toast.error('Please select a target resource');
      return;
    }

    const selectedCat = categories.find((c) => c._id === selectedCategoryId);
    if (!selectedCat) return;

    // Check duplicate
    if (shopItems.some((item) => item.itemId === selectedCategoryId || item.title === selectedCat.name)) {
      toast.error('This category is already linked in the shop matrix');
      return;
    }

    setShopItems((prev) => [
      ...prev,
      {
        itemType: 'Category',
        itemId: selectedCategoryId,
        title: selectedCat.name,
      },
    ]);
    setSelectedCategoryId('');
    toast.success(`${selectedCat.name} linked to Shop Hub Matrix`);
  };

  // Remove shop item
  const handleRemoveShopItem = (index) => {
    setShopItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save all changes to backend
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        copyright,
        socialLinks,
        shopItems,
      };

      await api.put('/footer-settings/settings', payload);
      toast.success('Footer configuration saved successfully');
    } catch (err) {
      console.error('Error saving footer settings:', err);
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ─── Top Header (Matches Screenshot 1) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Footer Management
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Configure global identity and shop navigation matrix.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-sm self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          <HiOutlineSave className="w-4 h-4 stroke-[2]" />
          <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
        </button>
      </div>

      {/* ─── Main 2-Column Grid (Matches Screenshot 1) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── Left Column (5 Cols): Corporate Identity & Social Hub ─── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Corporate Identity */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-6 h-6 rounded-full bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8f6d43]">
                <HiOutlineInformationCircle className="w-4 h-4 text-[#8f6d43]" />
              </div>
              <h3 className="text-xs font-bold tracking-wider text-[#8f6d43] uppercase">
                CORPORATE IDENTITY
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                COPYRIGHT CREDITS
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                placeholder="© 2024 Neirah Jewellers. All rights reserved."
                className="w-full h-11 px-4 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50/60 text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
              />
            </div>
          </div>

          {/* Card 2: Social Hub */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
              <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                <HiOutlinePlus className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
                Social Hub
              </h3>
            </div>

            {/* Input Row */}
            <form onSubmit={handleAddSocialLink} className="flex items-end gap-3">
              {/* Platform dropdown */}
              <div className="w-40 shrink-0">
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  PLATFORM
                </label>
                <div className="relative">
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full h-11 px-3.5 text-xs font-medium bg-stone-50/60 border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] appearance-none cursor-pointer"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Pinterest">Pinterest</option>
                    <option value="Twitter">Twitter</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Profile URL */}
              <div className="flex-1">
                <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                  PROFILE URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-medium bg-stone-50/60 border border-stone-200 rounded-lg text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] transition-all"
                />
              </div>

              {/* Add Button */}
              <button
                type="submit"
                className="w-11 h-11 bg-[#8f6d43] hover:bg-[#7b5b33] text-white rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
              >
                <HiOutlinePlus className="w-5 h-5 stroke-[2.5]" />
              </button>
            </form>

            {/* List of Added Social Links */}
            {socialLinks.length > 0 && (
              <div className="pt-2 space-y-2 border-t border-stone-100">
                {socialLinks.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-stone-50/80 border border-stone-200/70 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-stone-900 w-20 shrink-0">
                        {item.platform}
                      </span>
                      <span className="text-stone-500 truncate text-[11px]">
                        {item.url}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(index)}
                      className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Column (7 Cols): Shop Hub Matrix ─── */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <IoGridOutline className="w-4 h-4 text-stone-500" />
                <h3 className="text-xs font-bold tracking-wider text-stone-800 uppercase">
                  SHOP HUB MATRIX
                </h3>
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                GLOBAL LINK REGISTRY
              </span>
            </div>

            {/* Dashed Border Container (Matches Screenshot 1 & 2) */}
            <div className="rounded-xl border border-dashed border-stone-200 p-6 bg-stone-50/30">
              <form onSubmit={handleLinkAsset} className="flex flex-col sm:flex-row items-end gap-3">
                {/* Resource Type */}
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    RESOURCE TYPE
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Category"
                    className="w-full h-11 px-4 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-700 cursor-default"
                  />
                </div>

                {/* Target Identity Dropdown (Matches Screenshot 2) */}
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                    TARGET IDENTITY
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full h-11 px-4 text-xs font-medium bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30 focus:border-[#8f6d43] appearance-none cursor-pointer"
                    >
                      <option value="">Select Resource...</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Link Asset Button */}
                <button
                  type="submit"
                  className="w-full sm:w-auto h-11 px-5 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors shadow-2xs whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>LINK ASSET</span>
                </button>
              </form>
            </div>

            {/* List / Empty State (Matches Screenshot 1 & 2) */}
            {shopItems.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <HiOutlineLink className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                  LINK REGISTRY EMPTY
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                  LINKED SHOP CATEGORIES ({shopItems.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-stone-50/80 border border-stone-200/80 rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-[#8f6d43] shrink-0" />
                        <span className="font-semibold text-stone-900 text-xs truncate">
                          {item.title || item.name || 'Category Item'}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-stone-400 bg-stone-200/60 px-1.5 py-0.5 rounded">
                          {item.itemType || 'Category'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveShopItem(index)}
                        title="Unlink Asset"
                        className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
