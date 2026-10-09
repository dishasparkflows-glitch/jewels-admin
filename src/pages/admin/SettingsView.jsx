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
    companyName: 'Neirah',
    emailAddress: 'info@neirah.in',
    mobileNumber: '+91 84600-91955',
    storeAddress:
      'Sanskrut - 1 GH Road G-1. 1/2 Sector 3D plot no.1182 G-1, near Hi-Tech hospital, Gandhinagar',
    gstCode: '24AAAAA0000A1Z5',
    panCode: 'ABCDE1234F',
    returnPeriodDays: 10,
    returnPolicy: 'Easy 15-Day Returns & Refund',
    shippingPolicy: '',
    certificateImageUrl: '',
  });

  const [monetaryForm, setMonetaryForm] = useState({
    bankName: 'HDFC BANK',
    bankAccountNumber: '50200012345678',
    ifscCode: 'HDFC0000451',
  });

  const [showAccountRaw, setShowAccountRaw] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingMonetary, setSavingMonetary] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      const data = res.data?.data || {};
      setSettings(data);

      setBusinessForm({
        companyName: data.companyName || 'Neirah',
        emailAddress: data.emailAddress || 'info@neirah.in',
        mobileNumber: data.mobileNumber || '+91 84600-91955',
        storeAddress:
          data.storeAddress ||
          'Sanskrut - 1 GH Road G-1. 1/2 Sector 3D plot no.1182 G-1, near Hi-Tech hospital, Gandhinagar',
        gstCode: data.gstCode || '24AAAAA0000A1Z5',
        panCode: data.panCode || 'ABCDE1234F',
        returnPeriodDays: data.returnPeriodDays !== undefined ? data.returnPeriodDays : 10,
        returnPolicy: data.returnPolicy || 'Easy 15-Day Returns & Refund',
        shippingPolicy: data.shippingPolicy || '',
        certificateImageUrl: data.certificateImage?.url || '',
      });

      setMonetaryForm({
        bankName: data.bankName || 'HDFC BANK',
        bankAccountNumber: data.bankAccountNumber || '50200012345678',
        ifscCode: data.ifscCode || 'HDFC0000451',
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
        returnPeriodDays: Number(businessForm.returnPeriodDays),
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

  // Certificate image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingImage(true);
      const res = await api.post('/upload/single?folder=certificates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setBusinessForm((prev) => ({ ...prev, certificateImageUrl: uploadedUrl }));
        toast.success('Certificate uploaded successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Company Name */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              * COMPANY NAME
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.companyName}
              onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              disabled={!isEditingBusiness}
              value={businessForm.emailAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, emailAddress: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Mobile Number with India Flag */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              MOBILE NUMBER
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
                className={`w-full h-8 pl-8 pr-2.5 text-xs font-medium rounded-md border transition-all ${
                  isEditingBusiness
                    ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                    : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
                }`}
              />
            </div>
          </div>

          {/* Store Address */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              STORE ADDRESS
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.storeAddress}
              title={businessForm.storeAddress}
              onChange={(e) => setBusinessForm({ ...businessForm, storeAddress: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border truncate transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* GST Code */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              GST CODE
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.gstCode}
              onChange={(e) => setBusinessForm({ ...businessForm, gstCode: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* PAN Code */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              PAN CODE
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.panCode}
              onChange={(e) => setBusinessForm({ ...businessForm, panCode: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Return Period */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              RETURN PERIOD (DAYS)
            </label>
            <input
              type="number"
              disabled={!isEditingBusiness}
              value={businessForm.returnPeriodDays}
              onChange={(e) => setBusinessForm({ ...businessForm, returnPeriodDays: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Return Policy */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              RETURN POLICY
            </label>
            <input
              type="text"
              disabled={!isEditingBusiness}
              value={businessForm.returnPolicy}
              onChange={(e) => setBusinessForm({ ...businessForm, returnPolicy: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>
        </div>

        {/* Lower Row: Shipping Policy & Certificate of Authenticity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-1">
          {/* Shipping Policy (Left Col - 7 cols) */}
          <div className="lg:col-span-7">
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              SHIPPING POLICY
            </label>
            <textarea
              rows={2}
              disabled={!isEditingBusiness}
              placeholder="Describe the platform shipping and delivery terms..."
              value={businessForm.shippingPolicy}
              onChange={(e) => setBusinessForm({ ...businessForm, shippingPolicy: e.target.value })}
              className={`w-full p-2.5 text-xs rounded-md border transition-all resize-none leading-relaxed ${
                isEditingBusiness
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Certificate of Authenticity (Right Col - 5 cols) */}
          <div className="lg:col-span-5">
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              CERTIFICATE OF AUTHENTICITY IMAGE
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Bank Name */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              BANK NAME
            </label>
            <input
              type="text"
              disabled={!isEditingMonetary}
              value={monetaryForm.bankName}
              onChange={(e) => setMonetaryForm({ ...monetaryForm, bankName: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all ${
                isEditingMonetary
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
                  : 'bg-stone-50/70 border-stone-200 text-stone-800 cursor-default'
              }`}
            />
          </div>

          {/* Bank Account Number */}
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              BANK ACCOUNT NUMBER
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
                className={`w-full h-8 pl-2.5 pr-8 text-xs font-medium rounded-md border transition-all tracking-wider ${
                  isEditingMonetary
                    ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30 tracking-normal'
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
            <label className="block text-[10px] font-bold tracking-wider text-stone-400 uppercase mb-1">
              IFSC CODE
            </label>
            <input
              type="text"
              disabled={!isEditingMonetary}
              value={monetaryForm.ifscCode}
              onChange={(e) => setMonetaryForm({ ...monetaryForm, ifscCode: e.target.value })}
              className={`w-full h-8 px-2.5 text-xs font-medium rounded-md border transition-all uppercase ${
                isEditingMonetary
                  ? 'bg-white border-[#8f6d43] text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8f6d43]/30'
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
