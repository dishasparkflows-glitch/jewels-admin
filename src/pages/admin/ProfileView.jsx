import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usersAPI, authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineColorSwatch,
  HiOutlineLockClosed,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineRefresh,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';

export default function ProfileView() {
  const { user, updateUser } = useAuth();
  const {
    currentTheme,
    presets,
    defaultTheme,
    selectTheme,
    selectCustomColor,
    resetToDefault,
    isDefault,
  } = useTheme();

  const [activeTab, setActiveTab] = useState('theme'); // 'theme' | 'profile' | 'security'
  
  // Custom Color State
  const [customHex, setCustomHex] = useState(
    currentTheme.isCustom ? currentTheme.primary : '#8b6f4e'
  );

  // Profile Form State
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Sync profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  // Handle theme preset selection
  const handleSelectPreset = async (presetId) => {
    const selected = selectTheme(presetId);
    toast.success(`Theme switched to ${selected.label || selected.name}!`, {
      icon: '✨',
      style: {
        background: '#1c1917',
        color: '#fff',
        border: `1px solid ${selected.border || '#444'}`,
      },
    });

    // Optionally persist in user profile
    try {
      if (user?._id) {
        await usersAPI.updateMe({ themeColor: presetId });
        updateUser({ themeColor: presetId });
      }
    } catch {
      // LocalStorage already persisted in ThemeContext
    }
  };

  // Handle custom color apply
  const handleApplyCustomColor = async () => {
    if (!customHex || !/^#([0-9A-F]{3}){1,2}$/i.test(customHex)) {
      toast.error('Please enter a valid hex color code (e.g. #0d9488)');
      return;
    }
    const theme = selectCustomColor(customHex, 'Custom Palette');
    toast.success(`Custom theme applied (${customHex})!`, {
      icon: '🎨',
    });

    try {
      if (user?._id) {
        await usersAPI.updateMe({ themeColor: customHex });
        updateUser({ themeColor: customHex });
      }
    } catch {
      // LocalStorage updated
    }
  };

  // Reset to default theme
  const handleResetDefault = async () => {
    resetToDefault();
    setCustomHex(defaultTheme.primary);
    toast.success('Restored default Luxury Bronze theme!', {
      icon: '🏺',
    });

    try {
      if (user?._id) {
        await usersAPI.updateMe({ themeColor: 'default' });
        updateUser({ themeColor: 'default' });
      }
    } catch {
      // LocalStorage updated
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const payload = {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phone: profileData.phone.trim(),
        bio: profileData.bio.trim(),
      };

      const { data } = await usersAPI.updateMe(payload);
      updateUser(data.data || payload);
      toast.success('Profile details updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile details');
    } finally {
      setProfileSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const roleDisplay = (user?.role || 'SUPER_ADMIN').replace('_', ' ').toUpperCase();

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Hero Overview Card ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative theme accent background glow */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-15 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: currentTheme.primary }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar with current theme ring */}
            <div
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm transition-all duration-300 border-2"
              style={{
                backgroundColor: currentTheme.light,
                borderColor: currentTheme.border,
                color: currentTheme.primary,
              }}
            >
              {user?.firstName?.[0] || 'S'}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Super Admin'}
                </h1>
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-colors"
                  style={{
                    backgroundColor: currentTheme.soft,
                    borderColor: currentTheme.border,
                    color: currentTheme.primary,
                  }}
                >
                  <HiOutlineShieldCheck className="w-3.5 h-3.5" />
                  {roleDisplay}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 flex items-center gap-2">
                <span>{user?.email || 'admin@jewels.com'}</span>
                <span className="text-stone-300">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Session
                </span>
              </p>
            </div>
          </div>

          {/* Current Theme Pill Info */}
          <div className="flex items-center gap-3 self-start sm:self-auto bg-stone-50/90 border border-stone-200/90 px-3.5 py-2 rounded-xl">
            <div
              className="w-4 h-4 rounded-full border border-white shadow-2xs transition-colors duration-300"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <div className="text-left">
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
                Active Theme
              </span>
              <span className="text-xs font-bold text-stone-800">
                {currentTheme.name} {currentTheme.isDefault && '(Default)'}
              </span>
            </div>
            {!isDefault && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="ml-2 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors text-xs font-semibold cursor-pointer"
                title="Reset to Default Bronze"
              >
                <HiOutlineRefresh className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Navigation Tabs ──────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-stone-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'theme'
                ? 'shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={
              activeTab === 'theme'
                ? {
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                  }
                : {}
            }
          >
            <HiOutlineColorSwatch className="w-4 h-4" />
            <span>Theme & Colors</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                activeTab === 'theme'
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-200/70 text-stone-600'
              }`}
            >
              {isDefault ? 'Default' : currentTheme.name}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={
              activeTab === 'profile'
                ? {
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                  }
                : {}
            }
          >
            <HiOutlineUser className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={
              activeTab === 'security'
                ? {
                    backgroundColor: currentTheme.primary,
                    color: '#ffffff',
                  }
                : {}
            }
          >
            <HiOutlineLockClosed className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: THEME & APPEARANCE ────────────────────────── */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Default Theme Card (Highlighted First) */}
          <div
            className={`rounded-2xl p-5 sm:p-6 transition-all duration-200 border-2 ${
              isDefault
                ? 'bg-white shadow-md ring-2 ring-stone-900/5'
                : 'bg-white/80 border-stone-200/80 hover:border-stone-300'
            }`}
            style={{
              borderColor: isDefault ? defaultTheme.primary : undefined,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: defaultTheme.primary }}
                >
                  <HiOutlineSparkles className="w-6 h-6 text-[#f4ece0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-stone-900">
                      Default Luxury Bronze
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#faf5ee] text-[#8b6f4e] border border-[#e8d9c2]">
                      Original Brand
                    </span>
                    {isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <HiOutlineCheck className="w-3.5 h-3.5" /> Active Theme
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
                    Our current signature luxury bronze and warm beige palette crafted for fine jewellery. Selecting this restores the portal's original look.
                  </p>

                  {/* Swatches preview for default */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[11px] font-semibold text-stone-400">Palette:</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-md border border-stone-200 shadow-2xs"
                        style={{ backgroundColor: defaultTheme.primary }}
                        title="Primary Bronze (#8b6f4e)"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-stone-200 shadow-2xs"
                        style={{ backgroundColor: defaultTheme.accent }}
                        title="Accent Gold (#9c7849)"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-stone-200 shadow-2xs"
                        style={{ backgroundColor: defaultTheme.light }}
                        title="Light Cream (#f4ece0)"
                      />
                      <div
                        className="w-5 h-5 rounded-md border border-stone-200 shadow-2xs"
                        style={{ backgroundColor: defaultTheme.soft }}
                        title="Soft Warm Linen (#faf5ee)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('default')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isDefault
                      ? 'bg-stone-900 text-white cursor-default shadow-xs'
                      : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 hover:border-stone-400 shadow-2xs'
                  }`}
                >
                  {isDefault ? (
                    <>
                      <HiOutlineCheck className="w-4 h-4 text-emerald-400 stroke-2" />
                      <span>Current Theme</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineRefresh className="w-4 h-4 text-[#8b6f4e]" />
                      <span>Restore Default Theme</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Curated Theme Presets Grid */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  Curated Gemstone & Metal Schemes
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Click any luxury theme below to immediately update all buttons, badges, highlights, and borders across the portal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {presets.map((preset) => {
                const isSelected = currentTheme.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3.5 rounded-xl text-left border-2 transition-all duration-200 relative group cursor-pointer ${
                      isSelected
                        ? 'bg-stone-50/90 shadow-xs'
                        : 'bg-white border-stone-200/80 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                    style={{
                      borderColor: isSelected ? preset.primary : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      {/* Color Preview Pill */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-2xs border transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: preset.primary,
                            borderColor: preset.border,
                          }}
                        >
                          {isSelected ? (
                            <HiOutlineCheck className="w-5 h-5 text-white stroke-[2.5]" />
                          ) : (
                            <span className="text-xs">{preset.name[0]}</span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900 group-hover:text-black">
                              {preset.name}
                            </span>
                            {preset.isDefault && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b6f4e] bg-[#faf5ee] px-1 rounded border border-[#e8d9c2]">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono font-medium text-stone-400">
                            {preset.primary}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 mt-2.5 line-clamp-1">
                      {preset.description}
                    </p>

                    {/* Miniature swatch preview */}
                    <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-stone-100">
                      <div
                        className="h-2 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.primary }}
                        title="Primary"
                      />
                      <div
                        className="h-2 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.accent || preset.hover }}
                        title="Accent"
                      />
                      <div
                        className="h-2 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.light }}
                        title="Light"
                      />
                      <div
                        className="h-2 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.soft }}
                        title="Soft"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Customizer & Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Hex Picker */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  Custom Hex Color Picker
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pick any custom color for your brand or administration portal.
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border border-stone-200 p-0.5 bg-white shadow-2xs"
                      title="Choose custom color"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs font-bold text-stone-900 block mb-1.5">
                      Hex Color Code
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customHex}
                        onChange={(e) => setCustomHex(e.target.value)}
                        placeholder="#8b6f4e"
                        maxLength={7}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-mono font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 uppercase shadow-2xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomColor}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-95 cursor-pointer whitespace-nowrap"
                        style={{ backgroundColor: customHex }}
                      >
                        Apply Color
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">
                  Want the original design back?
                </span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-xs font-bold text-stone-700 hover:text-stone-900 underline underline-offset-2 cursor-pointer flex items-center gap-1.5"
                >
                  <HiOutlineRefresh className="w-3.5 h-3.5 text-[#8b6f4e]" />
                  Revert to Default ({defaultTheme.primary})
                </button>
              </div>
            </div>

            {/* Live Interactive Component Preview */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-900">
                  Live UI Preview
                </h3>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  {currentTheme.name} ({currentTheme.primary})
                </span>
              </div>

              <p className="text-xs text-stone-500 mb-4">
                Here is a live simulation of portal buttons, badges, and sidebar items in the active theme:
              </p>

              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 space-y-4">
                {/* Button previews */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-opacity"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    Primary Button
                  </button>

                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors"
                    style={{
                      borderColor: currentTheme.border,
                      backgroundColor: currentTheme.soft,
                      color: currentTheme.primary,
                    }}
                  >
                    Subtle Action
                  </button>

                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border inline-flex items-center gap-1"
                    style={{
                      backgroundColor: currentTheme.soft,
                      borderColor: currentTheme.border,
                      color: currentTheme.primary,
                    }}
                  >
                    <HiOutlineBadgeCheck className="w-3.5 h-3.5" />
                    STATUS BADGE
                  </span>
                </div>

                {/* Simulated Sidebar item */}
                <div className="p-2 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: currentTheme.light,
                        borderColor: currentTheme.border,
                        color: currentTheme.primary,
                      }}
                    >
                      N
                    </div>
                    <span className="text-xs font-bold text-stone-800">
                      Active Navigation Item
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PERSONAL INFORMATION ──────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs max-w-3xl">
          <div className="border-b border-stone-100 pb-4 mb-5">
            <h3 className="text-base font-bold text-stone-900">
              Personal Information
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Update your administrator account name, phone number, and administrative bio.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  First Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    placeholder="Super"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                  placeholder="Admin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] bg-stone-50 text-xs sm:text-[13px] font-medium text-stone-500 cursor-not-allowed shadow-2xs"
                  />
                  <HiOutlineMail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Email is locked to primary administrator credentials.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                  />
                  <HiOutlinePhone className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1.5">
                Bio / Responsibilities
              </label>
              <textarea
                rows={3}
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                placeholder="Chief Administrator for NEIRAH Jewellers Luxury Operations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all resize-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 3: SECURITY & PASSWORD ───────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs max-w-2xl">
          <div className="border-b border-stone-100 pb-4 mb-5">
            <h3 className="text-base font-bold text-stone-900">
              Change Account Password
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Ensure your account is using a strong password with at least 6 characters.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1.5">
                Current Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwords.currentPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, currentPassword: e.target.value })
                  }
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="w-4 h-4" />
                  ) : (
                    <HiOutlineEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  New Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-900 block mb-1.5">
                  Confirm New Password <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d6cfc2] hover:border-[#bdae99] text-xs sm:text-[13px] font-medium text-stone-900 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 shadow-2xs transition-all"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="submit"
                disabled={passwordSaving}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-opacity hover:opacity-95 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: currentTheme.primary }}
              >
                {passwordSaving ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
