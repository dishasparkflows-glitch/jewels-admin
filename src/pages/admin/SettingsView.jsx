import React, { useState, useEffect, useRef } from 'react';
import {
  HiOutlineChevronRight,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
  HiOutlineRefresh,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { uploadWithPresignedUrl } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';

export default function SettingsView() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Separate editing states for the two cards
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [isEditingMonetary, setIsEditingMonetary] = useState(false);

  // Form states
  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    emailAddress: '',
    mobileNumber: '',
    storeAddress: '',
    gstCode: '',
    panCode: '',
    returnPeriodDays: '',
    returnPolicy: '',
    shippingPolicy: '',
    certificateImageUrl: '',
  });

  const [monetaryForm, setMonetaryForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
  });

  const [showAccountRaw, setShowAccountRaw] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingMonetary, setSavingMonetary] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const mobileLogoInputRef = useRef(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingMobileLogo, setUploadingMobileLogo] = useState(false);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data?.data || {};
      setSettings(data);

      setBusinessForm({
        companyName: data.companyName ?? '',
        emailAddress: data.emailAddress ?? '',
        mobileNumber: data.mobileNumber ?? '',
        storeAddress: data.storeAddress ?? '',
        gstCode: data.gstCode ?? '',
        panCode: data.panCode ?? '',
        returnPeriodDays: data.returnPeriodDays ?? '',
        returnPolicy: data.returnPolicy ?? '',
        shippingPolicy: data.shippingPolicy ?? '',
        certificateImageUrl: data.certificateImage?.url ?? '',
      });

      setMonetaryForm({
        bankName: data.bankName ?? '',
        bankAccountNumber: data.bankAccountNumber ?? '',
        ifscCode: data.ifscCode ?? '',
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Business & Identity
  const handleSaveBusiness = async () => {
    try {
      setSavingBusiness(true);
      const payload = {
        companyName: businessForm.companyName,
        emailAddress: businessForm.emailAddress,
        mobileNumber: businessForm.mobileNumber,
        storeAddress: businessForm.storeAddress,
        gstCode: businessForm.gstCode,
        panCode: businessForm.panCode,
        returnPeriodDays: businessForm.returnPeriodDays === '' ? undefined : Number(businessForm.returnPeriodDays),
        returnPolicy: businessForm.returnPolicy,
        shippingPolicy: businessForm.shippingPolicy,
        certificateImage: {
          url: businessForm.certificateImageUrl,
        },
      };

      const res = await api.put('/settings', payload);
      setSettings(res.data?.data || payload);
      toast.success('Business configuration updated successfully');
      setIsEditingBusiness(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingBusiness(false);
    }
  };

  // Save Monetary Settlement
  const handleSaveMonetary = async () => {
    try {
      setSavingMonetary(true);
      const payload = {
        bankName: monetaryForm.bankName,
        bankAccountNumber: monetaryForm.bankAccountNumber,
        ifscCode: monetaryForm.ifscCode,
      };

      const res = await api.put('/settings', payload);
      setSettings(res.data?.data || payload);
      toast.success('Monetary settlement details updated');
      setIsEditingMonetary(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingMonetary(false);
    }
  };

  const handleLogoUpload = async (event, isMobile = false) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      event.target.value = '';
      return;
    }
    const setter = isMobile ? setUploadingMobileLogo : setUploadingLogo;
    const ref = isMobile ? mobileLogoInputRef : logoInputRef;
    const field = isMobile ? 'mobileLogoImage' : 'logoImage';
    try {
      setter(true);
      const { fileUrl, key } = await uploadWithPresignedUrl(file, 'brand-logos');
      const current = settings?.[field] || {};
      const response = await api.put('/settings', {
        [field]: { url: fileUrl, key: key || current.key || '' },
      });
      setSettings(response.data?.data || { ...settings, [field]: { url: fileUrl, key: key } });
      toast.success(`${isMobile ? 'Mobile' : 'Website'} logo saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Logo upload failed');
    } finally {
      setter(false);
      if (ref.current) ref.current.value = '';
    }
  };

  // Certificate image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { fileUrl } = await uploadWithPresignedUrl(file, 'certificates');
      if (fileUrl) {
        setBusinessForm((prev) => ({ ...prev, certificateImageUrl: fileUrl }));
        toast.success('Certificate uploaded successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const statCardsData = [
    {
      label: 'Business Entity',
      value: businessForm.companyName || 'Neirah',
      icon: HiOutlineOfficeBuilding,
      color: 'bronze',
    },
    {
      label: 'Settlement Bank',
      value: monetaryForm.bankName || 'HDFC Bank',
      icon: HiOutlineCash,
      color: 'green',
    },
    {
      label: 'Return Period',
      value: `${businessForm.returnPeriodDays || 10} Days`,
      icon: HiOutlineRefresh,
      color: 'peach',
    },
    {
      label: 'System Status',
      value: 'Operational',
      icon: HiOutlineCheck,
      color: 'gold',
    },
  ];

  return (
    <div className="space-y-2">
      {/* ─── Module Header (Breadcrumbs, Title, Export) ─── */}
      <ModuleHeader
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'System' },
          { label: 'Settings' },
        ]}
        title="Settings"
        subtitle="Manage business identity, tax credentials, return policies, and monetary banking details."
      />

      {/* ─── 4 Stat Cards ─── */}
      <StatCards cards={statCardsData} />

      {/* Website branding uploads */}
      <section className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 sm:p-4">
        <div className="mb-3 border-b border-stone-100 pb-2">
          <h2 className="text-sm font-bold text-stone-900">Website Logos</h2>
          <p className="mt-1 text-xs text-stone-500">Upload transparent PNG, JPG, or WebP logos. The mobile logo is used on narrow screens when provided.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Desktop logo', field: 'logoImage', inputRef: logoInputRef, busy: uploadingLogo, mobile: false },
            { label: 'Mobile logo (optional)', field: 'mobileLogoImage', inputRef: mobileLogoInputRef, busy: uploadingMobileLogo, mobile: true },
          ].map(({ label, field, inputRef, busy, mobile }) => (
            <div key={field} className="rounded-xl border border-stone-200 bg-[#fbfaf8] p-3">
              <p className="text-xs font-semibold text-stone-800 mb-2">{label}</p>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleLogoUpload(event, mobile)} className="sr-only" />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="min-h-24 w-full flex items-center justify-center rounded-lg border border-dashed border-[#d8c8b2] bg-white px-3 py-2 hover:border-[#8f6d43] hover:bg-[#faf5ee] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#8f6d43]/30">
                {settings?.[field]?.url ? <img src={getMediaUrl(settings[field].url)} alt={`${label} preview`} className="max-h-16 max-w-full object-contain" /> : <span className="text-xs text-stone-500">{busy ? 'Uploading…' : 'Tap to choose an image'}</span>}
              </button>
              <p className="mt-1.5 text-[10px] text-stone-400">{busy ? 'Saving logo…' : 'PNG, JPG, WebP or SVG'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 1. Business & Identity Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
            Business & Identity
          </h2>
          {isEditingBusiness ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingBusiness(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
              <button
                type="button"
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <HiOutlineCheck className="w-3 h-3" />
                <span>{savingBusiness ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingBusiness(true)}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8f6d43] hover:text-[#735530] transition-colors cursor-pointer"
            >
              <span>EDIT CONFIGURATION</span>
              <HiOutlineChevronRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Company Name <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.companyName}
              onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              disabled={!isEditingBusiness}
              value={businessForm.emailAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, emailAddress: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Mobile Number with India Flag */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-2.5 text-xs select-none pointer-events-none">
                🇮🇳
              </span>
              <input
                type="text"
                disabled={!isEditingBusiness}
                value={businessForm.mobileNumber}
                onChange={(e) => setBusinessForm({ ...businessForm, mobileNumber: e.target.value })}
                className={`w-full h-9 pl-8 pr-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                  isEditingBusiness
                    ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                    : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
                }`}
              />
            </div>
          </div>

          {/* Store Address */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Store Address
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.storeAddress}
              title={businessForm.storeAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, storeAddress: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border truncate transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* GST Code */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              GST Code
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.gstCode}
              onChange={(e) => setBusinessForm({ ...businessForm, gstCode: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* PAN Code */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              PAN Code
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.panCode}
              onChange={(e) => setBusinessForm({ ...businessForm, panCode: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Return Period */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Return Period (Days)
            </label>
            <input
              type="number"
              disabled={!isEditingBusiness}
              value={businessForm.returnPeriodDays}
              onChange={(e) => setBusinessForm({ ...businessForm, returnPeriodDays: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Return Policy */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Return Policy
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.returnPolicy}
              onChange={(e) => setBusinessForm({ ...businessForm, returnPolicy: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>
        </div>

        {/* Lower Row: Shipping Policy & Certificate of Authenticity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-1">
          {/* Shipping Policy (Left Col - 7 cols) */}
          <div className="lg:col-span-7">
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Shipping Policy
            </label>
            <textarea
              rows={2}
              disabled={!isEditingBusiness}
              placeholder="Describe the platform shipping and delivery terms..."
              value={businessForm.shippingPolicy}
              onChange={(e) => setBusinessForm({ ...businessForm, shippingPolicy: e.target.value })}
              className={`w-full p-2.5 text-xs rounded-xl border transition-all resize-none leading-relaxed ${
                isEditingBusiness
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Certificate of Authenticity (Right Col - 5 cols) */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Certificate of Authenticity Image
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div
              onClick={() => isEditingBusiness && fileInputRef.current?.click()}
              className={`h-[68px] rounded-lg border border-dashed flex flex-col items-center justify-center p-2 transition-all ${
                isEditingBusiness
                  ? 'border-stone-300 hover:border-[#8f6d43] hover:bg-stone-50/80 cursor-pointer'
                  : 'border-stone-200 bg-stone-50/40 cursor-default'
              }`}
            >
              {businessForm.certificateImageUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={businessForm.certificateImageUrl}
                    alt="Certificate"
                    className="w-10 h-10 object-cover rounded border border-stone-200"
                  />
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                      CERTIFICATE ATTACHED
                    </p>
                    <p className="text-[9px] text-stone-400">
                      {isEditingBusiness ? 'Click to change image' : 'Active authenticity stamp'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <HiOutlineUpload className="w-4 h-4 text-stone-400 mb-0.5 stroke-[1.8]" />
                  <p className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                    {uploadingImage ? 'UPLOADING...' : 'UPLOAD CERTIFICATE'}
                  </p>
                  <p className="text-[8px] tracking-wider text-stone-400 uppercase font-medium">
                    PNG, JPG OR WEBP
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Monetary Settlement Card ─── */}
      <div className="bg-white rounded-lg border border-stone-200/90 shadow-2xs p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
          <h2 className="text-sm font-bold text-stone-900 font-sans tracking-tight">
            Monetary Settlement
          </h2>
          {isEditingMonetary ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingMonetary(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-3 h-3" />
                <span>CANCEL</span>
              </button>
              <button
                type="button"
                onClick={handleSaveMonetary}
                disabled={savingMonetary}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#8f6d43] hover:bg-[#7b5b33] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <HiOutlineCheck className="w-3 h-3" />
                <span>{savingMonetary ? 'SAVING...' : 'SAVE CHANGES'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingMonetary(true)}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8f6d43] hover:text-[#735530] transition-colors cursor-pointer"
            >
              <span>EDIT CONFIGURATION</span>
              <HiOutlineChevronRight className="w-3 h-3 stroke-[2.5]" />
            </button>
          )}
        </div>

        {/* Monetary Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bank Name */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Bank Name
            </label>
            <input
              type="text"
              disabled={!isEditingMonetary}
              value={monetaryForm.bankName}
              onChange={(e) => setMonetaryForm({ ...monetaryForm, bankName: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                isEditingMonetary
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Bank Account Number
            </label>
            <div className="relative flex items-center">
              <input
                type={showAccountRaw || isEditingMonetary ? 'text' : 'password'}
                disabled={!isEditingMonetary}
                value={
                  !isEditingMonetary && !showAccountRaw
                    ? '************'
                    : monetaryForm.bankAccountNumber
                }
                onChange={(e) =>
                  setMonetaryForm({ ...monetaryForm, bankAccountNumber: e.target.value })
                }
                className={`w-full h-9 pl-3 pr-8 text-xs sm:text-[13px] font-medium rounded-xl border transition-all ${
                  isEditingMonetary
                    ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                    : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
                }`}
              />
              {!isEditingMonetary && (
                <button
                  type="button"
                  onClick={() => setShowAccountRaw(!showAccountRaw)}
                  className="absolute right-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showAccountRaw ? (
                    <HiOutlineEyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <HiOutlineEye className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              IFSC Code
            </label>
            <input
              type="text"
              disabled={!isEditingMonetary}
              value={monetaryForm.ifscCode}
              onChange={(e) => setMonetaryForm({ ...monetaryForm, ifscCode: e.target.value })}
              className={`w-full h-9 px-3 text-xs sm:text-[13px] font-medium rounded-xl border transition-all uppercase ${
                isEditingMonetary
                  ? 'bg-white border-[#8b6f4e] text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8b6f4e]/20'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="pt-2 pb-1 text-center">
        <p className="text-[9px] tracking-[0.2em] text-stone-400 uppercase font-semibold">
          NEIRAH JEWELLERS GLOBAL ADMIN V1.0.25
        </p>
      </div>
    </div>
  );
}
