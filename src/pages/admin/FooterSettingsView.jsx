import React, { useState, useEffect } from 'react';
import {
  HiOutlineInformationCircle,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSave,
  HiOutlineLink,
  HiOutlineCheck,
  HiOutlineExternalLink,
  HiOutlineGlobeAlt,
} from 'react-icons/hi';
import { IoGridOutline, IoLayersOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Dropdown from '../../components/common/Dropdown';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import RowActions from '../../components/common/RowActions';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function FooterSettingsView() {
  const confirm = useConfirm();
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
    toast.success(`${newPlatform} profile linked`);
  };

  // Remove social link
  const handleRemoveSocialLink = async (index) => {
    const item = socialLinks[index];
    const isConfirmed = await confirm({
      title: 'Remove Social Link',
      message: `Are you sure you want to remove the link for ${item?.platform || 'this platform'}?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
    toast.success('Social link removed');
  };

  // Add shop item to matrix
  const handleLinkAsset = (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      toast.error('Please select a target category resource');
      return;
    }

    const selectedCat = categories.find((c) => c._id === selectedCategoryId);
    if (!selectedCat) return;

    // Check duplicate
    if (
      shopItems.some(
        (item) => item.itemId === selectedCategoryId || item.title === selectedCat.name
      )
    ) {
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
  const handleRemoveShopItem = async (index) => {
    const item = shopItems[index];
    const isConfirmed = await confirm({
      title: 'Unlink Category',
      message: `Are you sure you want to unlink ${item?.title || 'this category'} from footer navigation?`,
      confirmText: 'Unlink',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    setShopItems((prev) => prev.filter((_, i) => i !== index));
    toast.success('Category unlinked from shop matrix');
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

  // Export handler
  const handleExport = (format) => {
    const exportData = {
      copyright,
      socialLinks,
      shopItems,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `footer_settings_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported footer configuration as JSON');
    } else {
      const rows = [
        ['Type', 'Identifier / Platform', 'Value / Target'],
        ['Copyright', 'Text', copyright],
        ...socialLinks.map((s) => ['Social Link', s.platform, s.url]),
        ...shopItems.map((m) => ['Shop Matrix', m.title, m.itemId]),
      ];
      const csvContent = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `footer_settings_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported footer configuration as CSV');
    }
  };

  // Metric Stat Cards
  const statCardsData = [
    {
      label: 'Linked Socials',
      value: socialLinks.length,
      icon: HiOutlineGlobeAlt,
      color: 'bronze',
    },
    {
      label: 'Shop Matrix Links',
      value: shopItems.length,
      icon: IoGridOutline,
      color: 'green',
    },
    {
      label: 'Available Categories',
      value: categories.length,
      icon: IoLayersOutline,
      color: 'peach',
    },
    {
      label: 'Footer Status',
      value: 'Configured',
      icon: HiOutlineCheck,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Module Header (Breadcrumbs, Title, Export, Save) ─── */}
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Marketing' },
          { label: 'Footer Management' },
        ]}
        title="Footer Management"
        subtitle="Configure corporate credits, brand social channels, and storefront shop matrix navigation."
        onExport={handleExport}
        onAdd={handleSaveAll}
        addLabel={saving ? 'Saving...' : 'Save Configuration'}
      />

      {/* ─── 4 Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Main 2-Column Luxury Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* ─── Left Column (5 Cols): Corporate Identity & Social Channels ─── */}
        <div className="lg:col-span-5 space-y-2.5">
          {/* Card 1: Corporate Identity */}
          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <div className="w-6 h-6 rounded-md bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                <HiOutlineInformationCircle className="w-3.5 h-3.5 text-[#8b6f4e]" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-wider text-stone-900 uppercase">
                  CORPORATE IDENTITY
                </h3>
                <p className="text-[10px] text-stone-400">
                  Global legal copyright declaration
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-wider text-stone-500 uppercase mb-1">
                COPYRIGHT NOTICE
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                placeholder="© 2024 Neirah Jewellers. All rights reserved."
                className="w-full h-8 px-3 text-xs font-medium rounded-md border border-stone-200 bg-stone-50 text-stone-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b6f4e]/30 focus:border-[#8b6f4e] transition-all"
              />
            </div>
          </div>

          {/* Card 2: Social Media Hub */}
          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                  <HiOutlineGlobeAlt className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-stone-900 uppercase">
                    SOCIAL MEDIA HUB
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Connect storefront social channel icons
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#8b6f4e] bg-[#faf5ee] px-1.5 py-0.5 rounded border border-[#e8d9c2]">
                {socialLinks.length} LINKED
              </span>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddSocialLink} className="space-y-3">
              <div className="flex items-end gap-3">
                <div className="w-36 shrink-0">
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1.5">
                    PLATFORM
                  </label>
                  <Dropdown
                    value={newPlatform}
                    onChange={(val) => setNewPlatform(val)}
                    options={[
                      'Facebook',
                      'YouTube',
                      'Instagram',
                      'Pinterest',
                      'Twitter',
                      'LinkedIn',
                    ]}
                    buttonClassName="h-10 rounded-lg text-xs font-medium bg-stone-50"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1.5">
                    PROFILE URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/30 focus:border-[#8b6f4e] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-10 h-10 bg-[#8b6f4e] hover:bg-[#7b5b33] text-white rounded-lg flex items-center justify-center shrink-0 transition-colors shadow-2xs cursor-pointer"
                  title="Add Social Link"
                >
                  <HiOutlinePlus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* List of Added Social Links */}
            {socialLinks.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl bg-stone-50/40">
                No social links added yet.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {socialLinks.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-stone-50/70 border border-stone-200/80 rounded-xl text-xs hover:bg-stone-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-stone-900 w-20 shrink-0">
                        {item.platform}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-500 hover:text-[#8b6f4e] truncate text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span className="truncate">{item.url}</span>
                        <HiOutlineExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialLink(index)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-2"
                      title="Remove Link"
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
          <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#faf5ee] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                  <IoGridOutline className="w-3.5 h-3.5 text-[#8b6f4e]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-stone-900 uppercase">
                    SHOP HUB MATRIX
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Curate navigation categories displayed in the storefront footer column
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-bold tracking-wider text-stone-400 uppercase">
                GLOBAL LINK REGISTRY
              </span>
            </div>

            {/* Resource Linking Box */}
            <div className="rounded-lg border border-dashed border-stone-300 p-3 bg-[#faf8f5]/40">
              <form onSubmit={handleLinkAsset} className="flex flex-col sm:flex-row items-end gap-2">
                <div className="w-full sm:w-32">
                  <label className="block text-[9px] font-bold tracking-wider text-stone-400 uppercase mb-1">
                    RESOURCE TYPE
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Category"
                    className="w-full h-8 px-2.5 text-xs font-semibold rounded-md border border-stone-200 bg-stone-100/70 text-stone-600 cursor-default"
                  />
                </div>

                <div className="w-full sm:flex-1">
                  <label className="block text-[9px] font-bold tracking-wider text-stone-400 uppercase mb-1">
                    TARGET CATEGORY
                  </label>
                  <Dropdown
                    value={selectedCategoryId}
                    onChange={(val) => setSelectedCategoryId(val)}
                    options={categories.map((cat) => ({
                      value: cat._id,
                      label: cat.name,
                    }))}
                    placeholder="Select Storefront Category..."
                    buttonClassName="h-8 rounded-md text-xs font-medium bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto h-8 px-3.5 bg-[#8b6f4e] hover:bg-[#7b5b33] text-white text-xs font-semibold tracking-wider uppercase rounded-md transition-colors shadow-2xs whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>LINK</span>
                </button>
              </form>
            </div>

            {/* List of Linked Shop Categories */}
            {shopItems.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-stone-200 rounded-xl bg-stone-50/30">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <HiOutlineLink className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold tracking-wider text-stone-400 uppercase">
                  LINK REGISTRY EMPTY
                </p>
                <p className="text-[11px] text-stone-400 max-w-sm">
                  Select a category above and click &ldquo;LINK CATEGORY&rdquo; to add navigation items to your website footer.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
                    LINKED CATEGORIES ({shopItems.length})
                  </p>
                  <span className="text-[10px] text-stone-400">
                    Arranged in storefront footer order
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shopItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3.5 bg-stone-50/80 border border-stone-200/80 rounded-xl hover:bg-stone-50 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8b6f4e] shrink-0" />
                        <div className="min-w-0">
                          <span className="font-semibold text-stone-900 text-xs truncate block">
                            {item.title || item.name || 'Category Item'}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            ID: #{item.itemId?.slice(-6) || 'CAT'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveShopItem(index)}
                        title="Unlink Category"
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-2"
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
