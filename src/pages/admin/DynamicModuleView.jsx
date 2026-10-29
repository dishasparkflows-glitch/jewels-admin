import { createPortal } from "react-dom";
import ThemeImageField from '../../components/common/ThemeImageField';
import { savePendingThemeMedia } from '../../utils/savePendingThemeMedia';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlinePencilAlt,
  HiOutlineMenuAlt4,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlinePhotograph,
  HiOutlineSparkles,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { IoDiamondOutline } from 'react-icons/io5';
import { RxDragHandleDots2 } from 'react-icons/rx';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import { useAdminPageSize } from '../../utils/adminPagination';
import { useConfirm } from '../../contexts/ConfirmContext';
import ModuleHeader from '../../components/common/ModuleHeader';
import StatCards from '../../components/common/StatCards';
import SearchFilterBar from '../../components/common/SearchFilterBar';
import RowActions from '../../components/common/RowActions';
import Dropdown from '../../components/common/Dropdown';
import OrnateSyncModal from '../../components/common/OrnateSyncModal';
import { deleteUploadedFile, uploadWithPresignedUrl, formatBytes } from '../../utils/uploadWithPresignedUrl';
import { getMediaUrl } from '../../utils/imageUrl';
import { openProductPreview } from '../../utils/productPreview';

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
      { name: 'metalType', label: 'Metal Category', type: 'select', options: ['Gold', 'Platinum', 'Silver'] },
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
    endpoint: '/products?productType=gold',
    title: 'Jewellery Products',
    singularTitle: 'Jewellery Product',
    fields: [
      { name: 'title', label: 'Product Title', type: 'text', required: true },
      { name: 'sku', label: 'SKU Code', type: 'text', required: true },
      { name: 'price', label: 'Retail Price (₹)', type: 'number', required: true },
    ],
  },
  '/catalog/silver-products': {
    endpoint: '/products?productType=silver',
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
    singularTitle: 'Category',
    fields: [
      { name: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. Rings, Necklaces' },
      { name: 'icon', label: 'Icon', type: 'icon', placeholder: 'Upload Icon' },
      { name: 'banner', label: 'Banner', type: 'banner', placeholder: 'Upload Banner' },
    ],
  },
  '/catalog/navigation-menus': {
    endpoint: '/menu-sections',
    title: 'Navigation Menus',
    singularTitle: 'Menu Section',
    fields: [
      { name: 'categoryId', label: 'Category', type: 'lookup', lookupEndpoint: '/categories/lookup', lookupFallback: '/categories?limit=100', required: true },
      { name: 'title', label: 'Section Title', type: 'text', required: true },
    ],
  },
  '/navigation-menus': {
    endpoint: '/menu-sections',
    title: 'Navigation Menus',
    singularTitle: 'Menu Section',
    fields: [
      { name: 'categoryId', label: 'Category', type: 'lookup', lookupEndpoint: '/categories/lookup', lookupFallback: '/categories?limit=100', required: true },
      { name: 'title', label: 'Section Title', type: 'text', required: true },
    ],
  },
  '/menu-sections': {
    endpoint: '/menu-sections',
    title: 'Navigation Menus',
    singularTitle: 'Menu Section',
    fields: [
      { name: 'categoryId', label: 'Category', type: 'lookup', lookupEndpoint: '/categories/lookup', lookupFallback: '/categories?limit=100', required: true },
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
      { name: 'shapeId', label: 'Shape', type: 'lookup', lookupEndpoint: '/diamond-shapes/lookup', lookupFallback: '/diamond-shapes?limit=100', required: true },
      { name: 'colorId', label: 'Color', type: 'lookup', lookupEndpoint: '/diamond-colors/lookup', lookupFallback: '/diamond-colors?limit=100', required: true },
      { name: 'clarityId', label: 'Clarity', type: 'lookup', lookupEndpoint: '/diamond-clarities/lookup', lookupFallback: '/diamond-clarities?limit=100', required: true },
      { name: 'typeId', label: 'Type (Lab / Natural)', type: 'lookup', lookupEndpoint: '/diamond-types/lookup', lookupFallback: '/diamond-types?limit=100', required: true },
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
  const navigate = useNavigate();
  const config = routeMap[pathname] || {
    endpoint: pathname,
    title: pathname.split('/').filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
  };

  const singleName =
    config.singularTitle ||
    (config.title.endsWith('ies')
      ? config.title.slice(0, -3) + 'y'
      : config.title.replace(/s$/, ''));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useAdminPageSize();
  const [serverTotal, setServerTotal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Demo Metrics Quick Edit Modal state
  const [editingMetricsProduct, setEditingMetricsProduct] = useState(null);
  const [metricsSoldCount, setMetricsSoldCount] = useState(0);
  const [metricsReviewCount, setMetricsReviewCount] = useState(0);
  const [savingMetrics, setSavingMetrics] = useState(false);

  const handleOpenMetricsModal = (product) => {
    setEditingMetricsProduct(product);
    setMetricsSoldCount(product.demoMetrics?.soldCount ?? 0);
    setMetricsReviewCount(product.demoMetrics?.reviewCount ?? 0);
  };

  const handleSaveMetrics = async () => {
    if (!editingMetricsProduct) return;
    try {
      setSavingMetrics(true);
      const prodId = editingMetricsProduct._id || editingMetricsProduct.id;
      const payload = {
        demoMetrics: {
          soldCount: Number(metricsSoldCount) || 0,
          reviewCount: Number(metricsReviewCount) || 0,
        },
      };
      await api.put('/products/' + prodId, payload);
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === prodId ? { ...item, ...payload } : item
        )
      );
      toast.success('Demo metrics updated for product');
      setEditingMetricsProduct(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update metrics');
    } finally {
      setSavingMetrics(false);
    }
  };
  const [viewingRecord, setViewingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [pendingThemeImages, setPendingThemeImages] = useState({});
  const [saving, setSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOrnateSyncModalOpen, setIsOrnateSyncModalOpen] = useState(false);
  const [lookupData, setLookupData] = useState({}); // { fieldName: [{ value, label }] }
  const [uploadingField, setUploadingField] = useState(null);

  const isCategoryPage = pathname === '/catalog/categories' || config.endpoint === '/categories';

  // Promo Banner state for category modules
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [editingBannerIndex, setEditingBannerIndex] = useState(null);
  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    key: '',
    link: '',
    status: 'active',
    order: 0,
  });
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false);
  const [availableThemes, setAvailableThemes] = useState([]);

  useEffect(() => {
    if (isCategoryPage) {
      api.get('/website/themes', { params: { status: 'all', limit: 100 } })
        .then(({ data }) => {
          const rows = Array.isArray(data.data) ? data.data : data.data?.items || [];
          setAvailableThemes(rows.filter((t) => t.status !== 'archived'));
        })
        .catch(() => {});
    }
  }, [isCategoryPage]);

  const handleOpenAdd = () => {
    if (pathname === '/catalog/jewelry-products' || pathname.includes('jewelry-products')) {
      navigate('/catalog/jewelry-products/add');
    } else if (pathname === '/catalog/silver-products' || pathname.includes('silver-products')) {
      navigate('/catalog/silver-products/add');
    } else if (pathname === '/catalog/ornate-products' || pathname.includes('ornate-products')) {
      navigate('/catalog/ornate-products/add');
    } else {
      setEditingRecord(null);
      const defaults = isCategoryPage ? { promoBanners: [], status: 'active', themeId: '', sizeChart: '', sizeChartKey: '', iconKey: '', bannerKey: '' } : {};
      setPendingThemeImages({});
      (config.fields || []).forEach((f) => {
        if (f.default !== undefined) defaults[f.name] = f.default;
      });
      setFormData(defaults);
      setBannerFormOpen(false);
      setEditingBannerIndex(null);
      setIsModalOpen(true);
    }
  };

  const handleOpenEdit = (row) => {
    setEditingRecord(row);
    const initial = {};
    if (isCategoryPage) {
      initial.status = row.status ?? 'active';
      initial.themeId = row.themeId?._id || row.themeId || '';
    }
    if (config.fields) {
      config.fields.forEach((f) => {
        let val = row[f.name];
        if (val && typeof val === 'object' && val.url !== undefined) {
          val = val.url || '';
        }
        initial[f.name] = val !== undefined ? val : (f.default || '');
      });
    }
    if (row.name && initial.name === undefined) initial.name = row.name;
    if (row.type && initial.type === undefined) initial.type = row.type;
    if (row.icon !== undefined) {
      initial.icon = typeof row.icon === 'object' ? (row.icon?.url || '') : (row.icon || '');
      initial.iconKey = typeof row.icon === 'object' ? (row.icon?.key || '') : '';
    }
    if (row.banner !== undefined) {
      initial.banner = typeof row.banner === 'object' ? (row.banner?.url || '') : (row.banner || '');
      initial.bannerKey = typeof row.banner === 'object' ? (row.banner?.key || '') : '';
    }
    if (row.sizeChart !== undefined) {
      initial.sizeChart = typeof row.sizeChart === 'object' ? (row.sizeChart?.url || '') : (row.sizeChart || '');
      initial.sizeChartKey = typeof row.sizeChart === 'object' ? (row.sizeChart?.key || '') : '';
    }
    if (Array.isArray(row.promoBanners)) {
      initial.promoBanners = row.promoBanners.map((b, idx) => ({
        _id: b._id,
        title: b.title || '',
        image: typeof b.image === 'object' ? { url: b.image?.url || '', key: b.image?.key || '' } : { url: b.image || '', key: '' },
        imageUrl: typeof b.image === 'object' ? (b.image?.url || '') : (b.image || ''),
        order: b.order ?? idx + 1,
      }));
    } else if (isCategoryPage) {
      initial.promoBanners = [];
    }
    setBannerFormOpen(false);
    setPendingThemeImages({});
    setEditingBannerIndex(null);
    setFormData(initial);
    setIsModalOpen(true);
  };

  const handleOpenBannerForm = (banner = null, index = null) => {
    if (banner !== null && index !== null) {
      setEditingBannerIndex(index);
      setBannerFormData({
        title: banner.title || '',
        imageUrl: banner.image?.url || banner.imageUrl || (typeof banner.image === 'string' ? banner.image : '') || '',
        key: banner.image?.key || banner.key || '',
        order: banner.order ?? index + 1,
      });
    } else {
      setEditingBannerIndex(null);
      setBannerFormData({
        title: '',
        imageUrl: '',
        key: '',
        order: (formData.promoBanners?.length || 0) + 1,
      });
    }
    setBannerFormOpen(true);
  };

  const handleCloseBannerForm = () => {
    setBannerFormOpen(false);
    setEditingBannerIndex(null);
    setBannerFormData({
      title: '',
      imageUrl: '',
      key: '',
      order: 0,
    });
  };

  const executeUploadBannerImage = async (file) => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setBannerFormData((prev) => ({
      ...prev,
      imageUrl: localPreview,
    }));
    try {
      setIsUploadingBannerImage(true);
      toast.loading('Uploading banner image...', { id: 'promo-banner-upload' });
      const upload = await uploadWithPresignedUrl(file, 'banners');
      const { url, fileUrl, key, wasCompressed, savingsPercent } = upload;
      const finalUrl = url || fileUrl;
      setBannerFormData((prev) => ({
        ...prev,
        imageUrl: finalUrl,
        key: key || '',
      }));
      const successMsg = wasCompressed && savingsPercent > 0
        ? `Promo banner uploaded! (Optimized -${savingsPercent}%)`
        : 'Promo banner image uploaded!';
      toast.success(successMsg, { id: 'promo-banner-upload' });
    } catch (err) {
      toast.error(`Image upload failed: ${err.message}`, { id: 'promo-banner-upload' });
    } finally {
      setIsUploadingBannerImage(false);
    }
  };

  const handleUploadBannerImage = (file) => {
    if (!file) return;
    executeUploadBannerImage(file);
  };

  const handleSavePromoBannerItem = () => {
    if (!bannerFormData.title?.trim()) {
      return toast.error('Banner title is required');
    }
    const newItem = {
      title: bannerFormData.title.trim(),
      image: {
        url: (bannerFormData.imageUrl || '').trim(),
        key: (bannerFormData.key || '').trim(),
      },
      imageUrl: (bannerFormData.imageUrl || '').trim(),
      order: Number(bannerFormData.order || 0),
    };

    setFormData((prev) => {
      const currentList = Array.isArray(prev.promoBanners) ? [...prev.promoBanners] : [];
      if (editingBannerIndex !== null && editingBannerIndex >= 0) {
        currentList[editingBannerIndex] = { ...currentList[editingBannerIndex], ...newItem };
      } else {
        currentList.push(newItem);
      }
      return { ...prev, promoBanners: currentList };
    });

    toast.success(editingBannerIndex !== null ? 'Promo banner updated' : 'Promo banner added');
    handleCloseBannerForm();
  };

  const handleUpdateBannerTitle = (index, newTitle) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev.promoBanners) ? [...prev.promoBanners] : [];
      if (currentList[index]) {
        currentList[index] = { ...currentList[index], title: newTitle };
      }
      return { ...prev, promoBanners: currentList };
    });
  };

  const handleDeletePromoBannerItem = async (index) => {
    const bannerToRemove = (Array.isArray(formData.promoBanners) ? formData.promoBanners : [])[index];
    try {
      await deleteUploadedFile(bannerToRemove?.image || bannerToRemove?.imageUrl);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete banner image from storage');
      return;
    }
    setFormData((prev) => {
      const currentList = Array.isArray(prev.promoBanners) ? [...prev.promoBanners] : [];
      return { ...prev, promoBanners: currentList.filter((_, i) => i !== index) };
    });
    toast.success('Promo banner removed');
    if (editingBannerIndex === index) {
      handleCloseBannerForm();
    }
  };

  const handleClearImageField = async (fieldName) => {
    try {
      const currentVal = formData[fieldName];
      const url = typeof currentVal === 'object' ? currentVal?.url : currentVal;
      const key = formData[`${fieldName}Key`] || (typeof currentVal === 'object' ? currentVal?.key : '');
      if (key || url) {
        await deleteUploadedFile({ key, url });
      }
      setFormData((prev) => ({ ...prev, [fieldName]: '', [`${fieldName}Key`]: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete file from storage');
    }
  };

  const handleClearPromoBannerImage = async () => {
    try {
      await deleteUploadedFile({ key: bannerFormData.key, url: bannerFormData.imageUrl });
      setBannerFormData((prev) => ({ ...prev, imageUrl: '', key: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete image from storage');
    }
  };

  const handleTogglePromoBannerStatus = (index) => {
    setFormData((prev) => {
      const currentList = Array.isArray(prev.promoBanners) ? [...prev.promoBanners] : [];
      if (currentList[index]) {
        const nextStatus = currentList[index].status === 'inactive' ? 'active' : 'inactive';
        currentList[index] = { ...currentList[index], status: nextStatus };
      }
      return { ...prev, promoBanners: currentList };
    });
  };

  const executeFileUpload = async (fieldName, file, folder = 'categories') => {
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    // Instant local preview so the admin sees the selected image immediately!
    setFormData((prev) => ({
      ...prev,
      [fieldName]: localPreview,
      [`${fieldName}Key`]: '',
    }));

    try {
      setUploadingField(fieldName);
      toast.loading(`Optimizing & uploading ${fieldName}...`, { id: `upload-${fieldName}` });
      const res = await uploadWithPresignedUrl(file, folder);
      const finalUrl = res.fileUrl || '';
      setFormData((prev) => ({
        ...prev,
        [fieldName]: finalUrl,
        [`${fieldName}Key`]: res.key || '',
      }));
      const savings = res.wasCompressed ? ` (optimized ${formatBytes(res.originalSize)} → ${formatBytes(res.compressedSize)})` : '';
      toast.success(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} uploaded${savings}!`, {
        id: `upload-${fieldName}`,
      });
    } catch (err) {
      toast.error(`Upload failed: ${err.message}`, { id: `upload-${fieldName}` });
    } finally {
      setUploadingField(null);
    }
  };

  const handleFileUpload = (fieldName, file, folder = 'categories') => {
    if (!file) return;
    executeFileUpload(fieldName, file, folder);
  };

  const isOrnatePage = pathname.includes('ornate-products');
  const isJewelryPage = pathname.includes('jewelry-products');
  const isSilverPage = pathname.includes('silver-products');
  const isProductCatalogPage = isOrnatePage || isJewelryPage || isSilverPage;

  const handleEditProductRecord = (row) => {
    const id = row?._id || row?.id;
    if (!id) return;
    if (isOrnatePage) {
      navigate(`/catalog/ornate-products/edit/${id}`);
    } else if (isSilverPage) {
      navigate(`/catalog/silver-products/edit/${id}`);
    } else if (isJewelryPage) {
      navigate(`/catalog/jewelry-products/edit/${id}`);
    } else {
      handleOpenEdit(row);
    }
  };

  // Trigger Ornate ERP Sync & store data in DB
  const handleSyncOrnateProducts = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      toast.loading('Connecting to Ornate ERP and syncing products into database...', {
        id: 'ornate-sync',
      });

      let res;
      try {
        res = await api.post('/ornate/sync', {}, { timeout: 120000 });
      } catch (fullSyncErr) {
        console.warn('Full sync attempt failed, trying sync-labels fallback:', fullSyncErr);
        res = await api.post('/ornate/sync-labels', {}, { timeout: 120000 });
      }

      const syncMsg = res.data?.message || 'Ornate products synced successfully!';
      toast.success(syncMsg, { id: 'ornate-sync' });

      // Refresh items from database
      await fetchItems();
    } catch (err) {
      console.error('Failed to sync Ornate products:', err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to sync products from Ornate ERP';
      toast.error(errMsg, { id: 'ornate-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchItems = useCallback(
    async (page = currentPage, limit = pageSize, q = search) => {
      try {
        setLoading(true);
        const params = { page, limit };
        if (q && q.trim()) params.search = q.trim();
        const res = await api.get(config.endpoint, { params });
        const data = res.data?.data?.items || res.data?.data || [];
        setItems(Array.isArray(data) ? data : [data].filter(Boolean));
        if (res.data?.pagination?.totalDocs !== undefined) {
          setServerTotal(res.data.pagination.totalDocs);
        } else {
          setServerTotal(null);
        }
      } catch (err) {
        console.error('Failed to load records for', config.endpoint, err);
        setItems([]);
        setServerTotal(null);
      } finally {
        setLoading(false);
      }
    },
    [config.endpoint, currentPage, pageSize, search]
  );

  useEffect(() => {
    setCurrentPage(1);
    setSearch('');
    setSelectedIds([]);
  }, [pathname]);

  useEffect(() => {
    fetchItems(currentPage, pageSize, search);
  }, [fetchItems, currentPage, pageSize, search]);

  // Fetch lookup options when modal opens for fields with type: 'lookup'
  useEffect(() => {
    if (!isModalOpen) return;
    const lookupFields = (config.fields || []).filter((f) => f.type === 'lookup');
    if (lookupFields.length === 0) return;

    const fetchLookups = async () => {
      // If we are configuring diamonds, fetch all diamond attributes in ONE single API call
      if (config.endpoint === '/diamonds') {
        try {
          const res = await api.get('/diamonds/attributes');
          const data = res.data?.data || {};
          const shapeList = data.shapes || data.diamondShapes || [];
          const colorList = data.colors || data.diamondColors || [];
          const clarityList = data.clarities || data.diamondClarities || [];
          const typeList = data.types || data.diamondTypes || [];

          setLookupData((prev) => ({
            ...prev,
            shapeId: shapeList.map((i) => ({ value: i._id || i.id, label: i.name })),
            colorId: colorList.map((i) => ({ value: i._id || i.id, label: i.name })),
            clarityId: clarityList.map((i) => ({ value: i._id || i.id, label: i.name })),
            typeId: typeList.map((i) => ({ value: i._id || i.id, label: i.name })),
          }));
          return;
        } catch (err) {
          console.warn('Single diamond options fetch fallback:', err);
        }
      }

      const results = {};
      await Promise.all(
        lookupFields.map(async (field) => {
          try {
            let res;
            try {
              res = await api.get(field.lookupEndpoint);
            } catch {
              res = await api.get(field.lookupFallback);
            }
            const data = res.data?.data?.items || res.data?.data || [];
            const arr = Array.isArray(data) ? data : [];
            results[field.name] = arr.map((item) => ({
              value: item._id || item.id,
              label: item.name || item.title || item.label || item._id,
            }));
          } catch {
            results[field.name] = [];
          }
        })
      );
      setLookupData((prev) => ({ ...prev, ...results }));
    };

    fetchLookups();
  }, [isModalOpen, config.fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const cleanEndpoint = config.endpoint.split('?')[0];
      let payload = { ...formData };

      // Ensure proper structure for categories
      if (cleanEndpoint === '/categories') {
        payload.themeId = payload.themeId || null;
        const iconVal = typeof payload.icon === 'object' ? (payload.icon?.url || '') : (payload.icon || '');
        const iconKey = payload.iconKey || (typeof payload.icon === 'object' ? payload.icon?.key : '') || '';
        payload.icon = { url: (iconVal || '').trim(), key: (iconKey || '').trim() };

        const bannerVal = typeof payload.banner === 'object' ? (payload.banner?.url || '') : (payload.banner || '');
        const bannerKey = payload.bannerKey || (typeof payload.banner === 'object' ? payload.banner?.key : '') || '';
        payload.banner = { url: (bannerVal || '').trim(), key: (bannerKey || '').trim() };

        const sizeChartVal = typeof payload.sizeChart === 'object' ? (payload.sizeChart?.url || '') : (payload.sizeChart || '');
        const sizeChartKey = payload.sizeChartKey || (typeof payload.sizeChart === 'object' ? payload.sizeChart?.key : '') || '';
        payload.sizeChart = { url: (sizeChartVal || '').trim(), key: (sizeChartKey || '').trim() };

        delete payload.iconKey;
        delete payload.bannerKey;
        delete payload.sizeChartKey;
        if (Array.isArray(payload.promoBanners)) {
          payload.promoBanners = payload.promoBanners.map((b, idx) => ({
            _id: b._id,
            title: (b.title || '').trim(),
            image: {
              url: (typeof b.image === 'object' ? b.image?.url : b.image || b.imageUrl || '') || '',
              key: (typeof b.image === 'object' ? b.image?.key : b.key || '') || '',
            },
            order: Number(b.order ?? idx + 1),
          }));
        }
      }

      if (cleanEndpoint === '/products') {
        const title = formData.title || '';
        const sku = formData.sku || '';
        const slug = (formData.slug || title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const isOrnate = config.endpoint.includes('isOrnate=true') || Boolean(formData.isOrnate);
        const productType = (config.endpoint.toLowerCase().includes('producttype=silver') || isOrnate) ? 'silver' : 'gold';
        const mrp = Number(formData.mrp || formData.price) || 0;
        const salePrice = Number(formData.salePrice || formData.price) || 0;
        const costPrice = Number(formData.costPrice) || 0;
        const displayPrice = Number(formData.displayPrice || salePrice) || 0;
        const gstPercentage = Number(formData.gstPercentage) || 0;
        const markupPercentage = Number(formData.markupPercentage) || 0;

        payload = {
          ...formData,
          basicInfo: {
            ...(formData.basicInfo || {}),
            title,
            sku,
            slug,
            description: formData.description || '',
          },
          pricing: {
            mrp,
            salePrice,
            costPrice,
            displayPrice,
            gstPercentage,
            markupPercentage,
            ...(formData.pricing || {}),
          },
          specifications: {
            metalWeight: Number(formData.metalWeight) || 0,
          },
          ornate: {
            tagNo: formData.tagNo || '',
            barcode: formData.barcode || '',
            itemCode: formData.itemCode || '',
            goldAmt: Number(formData.goldAmt) || 0,
            labourAmt: Number(formData.labourAmt) || 0,
            diamondAmt: Number(formData.diamondAmt) || 0,
            stockQty: Number(formData.stockQty) || 0,
            isSold: Boolean(formData.isSold),
            ...(formData.ornate || {}),
          },
          title,
          sku,
          slug,
          price: mrp,
          salePrice,
          displayPrice,
          productType,
          isOrnate,
        };
      }

      let saveResponse;
      if (editingRecord) {
        saveResponse = await api.put(`${cleanEndpoint}/${editingRecord._id || editingRecord.id}`, payload);
        toast.success(`${singleName} updated successfully!`);
      } else {
        saveResponse = await api.post(cleanEndpoint, payload);
        if (isCategoryPage && saveResponse.data?.data) setEditingRecord(saveResponse.data.data);
        toast.success(`${singleName} created successfully!`);
      }
      const savedId = saveResponse.data?.data?._id || editingRecord?._id || editingRecord?.id;
      if (isCategoryPage && savedId && Object.keys(pendingThemeImages).length) {
        await savePendingThemeMedia(formData.themeId, 'category', savedId, pendingThemeImages);
      }
      setPendingThemeImages({});

      setIsModalOpen(false);
      setEditingRecord(null);
      setFormData({});
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record');
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
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record');
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((i) => i._id || i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    if (count === 0) {
      toast.error('Please select records to delete');
      return;
    }

    const isConfirmed = await confirm({
      title: `Delete Selected ${config.title} Records`,
      message: `Are you sure you want to delete ${count} selected record${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete (${count})`,
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!isConfirmed) return;

    try {
      const cleanEndpoint = config.endpoint.split('?')[0];
      await Promise.allSettled(
        selectedIds.map((id) => api.delete(`${cleanEndpoint}/${id}`))
      );
      setItems((prev) => prev.filter((i) => !selectedIds.includes(i._id) && !selectedIds.includes(i.id)));
      setSelectedIds([]);
      toast.success(`${count} record${count > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete some records');
    }
  };

  // Helper to get row label/name
  const getRowLabel = (row) => {
    if (!row) return 'Record';
    const val =
      row.basicInfo?.title ||
      row.basicInfo?.name ||
      row.title ||
      row.name ||
      row.productName ||
      row.itemName ||
      row.coupon?.code ||
      row.couponcode ||
      row.fullName ||
      row.basicInfo?.sku ||
      row.sku ||
      row.tagNo ||
      row.ornate?.tagNo ||
      row.bodyPart ||
      row.url ||
      row.copyright ||
      'Record';

    if (typeof val === 'object' && val !== null) {
      return val.name || val.title || val.label || JSON.stringify(val);
    }
    return String(val ?? '');
  };

  // Helper to filter out legacy/seed static images like /featured/ or /promos/
  const isValidMediaUrl = (u) => {
    if (!u || typeof u !== 'string') return false;
    const trimmed = u.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('/featured/') || trimmed.startsWith('/promos/') || trimmed.includes('example.com')) {
      return false;
    }
    return true;
  };

  // Helper to resolve product and generic thumbnails
  const getRowThumbnail = (row) => {
    if (!row) return null;
    // 1. Ornate product images
    if (row.ornate?.ornateImages && row.ornate.ornateImages.length > 0) {
      const first = row.ornate.ornateImages[0];
      const u = typeof first === 'string' ? first : first?.url;
      if (isValidMediaUrl(u)) return u;
    }
    if (isValidMediaUrl(row.ornate?.firstPhoto)) return row.ornate.firstPhoto;
    if (Array.isArray(row.ornateImages) && row.ornateImages.length > 0) {
      const first = row.ornateImages[0];
      const u = typeof first === 'string' ? first : first?.url;
      if (isValidMediaUrl(u)) return u;
    }
    // 2. Color images (catalog products)
    if (Array.isArray(row.colorImages) && row.colorImages.length > 0) {
      for (const col of row.colorImages) {
        if (Array.isArray(col?.images) && col.images.length > 0) {
          const nonVid = col.images.find(
            (img) => img?.mediaType !== 'video' && (img?.url || typeof img === 'string')
          );
          const target = nonVid || col.images[0];
          const u = typeof target === 'string' ? target : target?.url;
          if (isValidMediaUrl(u)) return u;
        }
      }
    }
    // 3. metalColors
    if (Array.isArray(row.metalColors) && row.metalColors.length > 0) {
      for (const mc of row.metalColors) {
        if (isValidMediaUrl(mc?.firstPhoto)) return mc.firstPhoto;
        if (Array.isArray(mc?.images) && mc.images.length > 0) {
          const u = typeof mc.images[0] === 'string' ? mc.images[0] : mc.images[0]?.url;
          if (isValidMediaUrl(u)) return u;
        }
      }
    }
    // 4. images array
    if (Array.isArray(row.images) && row.images.length > 0) {
      for (const item of row.images) {
        const u = typeof item === 'string' ? item : item?.url;
        if (isValidMediaUrl(u)) return u;
      }
    }
    // 5. media gallery
    if (Array.isArray(row.media?.gallery)) {
      for (const g of row.media.gallery) {
        const u = typeof g === 'string' ? g : g?.url;
        if (isValidMediaUrl(u)) return u;
      }
    }
    // 6. standard fallbacks (image, banner, lightImage, icon)
    if (isValidMediaUrl(row.image?.url)) return row.image.url;
    if (typeof row.image === 'string' && isValidMediaUrl(row.image)) return row.image;
    if (isValidMediaUrl(row.imageUrl)) return row.imageUrl;
    if (isValidMediaUrl(row.banner?.url)) return row.banner.url;
    if (typeof row.banner === 'string' && isValidMediaUrl(row.banner)) return row.banner;
    if (isValidMediaUrl(row.lightImage?.url)) return row.lightImage.url;
    if (isValidMediaUrl(row.icon?.url)) return row.icon.url;
    if (typeof row.icon === 'string' && isValidMediaUrl(row.icon)) return row.icon;
    return null;
  };

  const [updatingVisibilityId, setUpdatingVisibilityId] = useState(null);

  // Toggle Web & App platform visibility
  const handleToggleProductVisibility = async (row, platform, e) => {
    if (e) e.stopPropagation();
    const rowId = row._id || row.id;
    if (!rowId) return;

    const currentWeb = row.inweb !== false && row.visibility?.web !== false;
    const currentApp = row.inapp !== false && row.visibility?.app !== false;

    const nextWeb = platform === 'web' ? !currentWeb : currentWeb;
    const nextApp = platform === 'app' ? !currentApp : currentApp;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => {
        const id = item._id || item.id;
        if (id === rowId) {
          return {
            ...item,
            inweb: nextWeb,
            inapp: nextApp,
            visibility: {
              ...(item.visibility || {}),
              web: nextWeb,
              app: nextApp,
            },
          };
        }
        return item;
      })
    );

    try {
      setUpdatingVisibilityId(`${rowId}-${platform}`);
      const payload =
        platform === 'web'
          ? { 'visibility.web': nextWeb }
          : { 'visibility.app': nextApp };

      await api.put(`/products/${rowId}`, payload);
      toast.success(
        `${platform === 'web' ? 'Web' : 'App'} visibility ${
          (platform === 'web' ? nextWeb : nextApp) ? 'enabled' : 'disabled'
        }`
      );
    } catch (err) {
      console.error('Failed to update product visibility:', err);
      toast.error(`Failed to update ${platform} visibility`);
      // Revert on error
      setItems((prev) =>
        prev.map((item) => {
          const id = item._id || item.id;
          if (id === rowId) {
            return {
              ...item,
              inweb: currentWeb,
              inapp: currentApp,
              visibility: {
                ...(item.visibility || {}),
                web: currentWeb,
                app: currentApp,
              },
            };
          }
          return item;
        })
      );
    } finally {
      setUpdatingVisibilityId(null);
    }
  };

  // Toggle draft/approved status for products
  const handleToggleProductStatus = async (row, e) => {
    if (e) e.stopPropagation();
    const rowId = row._id || row.id;
    if (!rowId) return;

    const currentStatus = row.status === 'approved' ? 'approved' : 'draft';
    const nextStatus = currentStatus === 'approved' ? 'draft' : 'approved';

    setItems((prev) =>
      prev.map((item) =>
        (item._id || item.id) === rowId ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await api.put(`/products/${rowId}`, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus}`);
    } catch (err) {
      console.error('Failed to update product status:', err);
      toast.error('Failed to update status');
      setItems((prev) =>
        prev.map((item) =>
          (item._id || item.id) === rowId ? { ...item, status: currentStatus } : item
        )
      );
    }
  };

  const filteredItems = useMemo(() => {
    if (serverTotal !== null) return items;
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      const label = String(getRowLabel(row)).toLowerCase();
      const id = String(row._id || row.id || '').toLowerCase();
      const sku = String(row.basicInfo?.sku || row.ornate?.tagNo || row.sku || '').toLowerCase();
      return label.includes(q) || id.includes(q) || sku.includes(q);
    });
  }, [items, search, serverTotal]);

  const {
    totalItems,
    paginatedItems,
  } = usePagination(filteredItems, pageSize, serverTotal);

  const inStockCount = useMemo(
    () => items.filter((p) => !p.isSold && (p.inStock ?? 1) > 0).length,
    [items]
  );
  const outOfStockCount = useMemo(
    () => items.filter((p) => p.isSold || p.inStock === 0).length,
    [items]
  );

  const statCardsData = isOrnatePage
    ? [
        {
          label: 'Total Ornate Products',
          value: serverTotal !== null ? serverTotal : (items.length || 0),
          icon: HiOutlineEye,
          color: 'bronze',
        },
        {
          label: 'In Stock Products',
          value: inStockCount,
          icon: HiOutlineRefresh,
          color: 'green',
        },
        {
          label: 'Sold / Out of Stock',
          value: outOfStockCount,
          icon: HiOutlineTrash,
          color: 'peach',
        },
        {
          label: 'ERP Live Sync',
          value: isSyncing ? 'Syncing...' : 'Connected',
          icon: HiOutlineRefresh,
          color: 'gold',
        },
      ]
    : [
        {
          label: `Total ${config.title}`,
          value: serverTotal !== null ? serverTotal : (items.length || 0),
          icon: HiOutlineEye,
          color: 'bronze',
        },
        {
          label: 'Verified Records',
          value: serverTotal !== null ? serverTotal : (items.length || 0),
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
        subtitle={
          isOrnatePage
            ? 'Real-time synchronization and catalog management of Ornate ERP jewellery products.'
            : `Configure, manage and update real-time ${config.title.toLowerCase()} catalog data.`
        }
        onAdd={handleOpenAdd}
        addLabel={
          pathname.includes('jewelry-products')
            ? 'Add Jewellery Product'
            : isSilverPage
            ? 'Add Silver Product'
            : isOrnatePage
            ? 'Add Ornate Product'
            : `Add ${singleName}`
        }
        extraActions={
          isOrnatePage && (
            <button
              type="button"
              onClick={() => setIsOrnateSyncModalOpen(true)}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#8b6f4e] hover:bg-[#785e40] active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none text-white rounded-lg text-xs sm:text-[13px] font-semibold tracking-wide transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <HiOutlineRefresh className={`w-4 h-4 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing Products...' : 'Sync Products'}</span>
            </button>
          )
        }
        exportData={items}
        exportFileName={`${config.title.toLowerCase().replace(/\s+/g, '_')}_export`}
      />

      {/* ─── 4 Stat Cards Row ─── */}
      <StatCards cards={statCardsData} />

      {/* ─── Search & Filter Bar (NO active/deactive filter) ─── */}
      <SearchFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        placeholder={`Search ${config.title.toLowerCase()}...`}
        extraActions={
          <button
            type="button"
            onClick={handleBulkDelete}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border shadow-2xs cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-[#fef2f2] text-[#ef4444] border-[#fee2e2] hover:bg-[#fee2e2] hover:border-[#fca5a5] active:scale-95 ring-1 ring-red-200/50'
                : 'bg-white text-stone-400 border-stone-200/90 hover:text-stone-600 hover:bg-stone-50'
            }`}
            title={
              selectedIds.length > 0
                ? `Delete ${selectedIds.length} selected record${selectedIds.length > 1 ? 's' : ''}`
                : 'Select records to delete'
            }
          >
            <HiOutlineTrash className="w-3.5 h-3.5 stroke-2" />
            <span>{selectedIds.length > 0 ? `Delete (${selectedIds.length})` : 'Delete'}</span>
          </button>
        }
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
            <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-[#faf6f0] border border-[#e8d9c2] flex items-center justify-center text-[#8b6f4e]">
                <HiOutlineEye className="w-4 h-4" />
              </div>
              <p className="font-medium text-stone-600 text-xs">No records found</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-white text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-2 pl-4 pr-1 w-8">
                      <input
                        type="checkbox"
                        checked={
                          paginatedItems.length > 0 &&
                          paginatedItems.every((row) => selectedIds.includes(row._id || row.id))
                        }
                        onChange={handleSelectAll}
                        className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                      />
                    </th>
                    <th className="py-2 px-2 text-center w-12 whitespace-nowrap text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      SR NO
                    </th>
                    <th className="py-2 px-3 whitespace-nowrap">
                      {isProductCatalogPage ? 'PRODUCT' : 'ITEM / RECORD'}
                    </th>
                    <th className="py-2 px-3 whitespace-nowrap">SPECIFICATIONS</th>
                    {isProductCatalogPage && (
                      <th className="py-2 px-3 whitespace-nowrap text-center">DEMO METRICS</th>
                    )}
                    {isProductCatalogPage && (
                      <th className="py-2 px-3 whitespace-nowrap text-center">VISIBILITY</th>
                    )}
                    <th className="py-2 px-3 whitespace-nowrap text-center">STATUS</th>
                    <th className="py-2 pr-4 pl-2 whitespace-nowrap text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {paginatedItems.map((row, idx) => {
                    const rowLabel = getRowLabel(row);
                    const isEmoji =
                      typeof row.icon === 'string' &&
                      row.icon.length <= 4 &&
                      !row.icon.startsWith('http') &&
                      !row.icon.startsWith('/');

                    const rawThumb = getRowThumbnail(row);
                    const thumbUrl = getMediaUrl(rawThumb);

                    const isWebVisible = row.inweb !== false && row.visibility?.web !== false;
                    const isAppVisible = row.inapp !== false && row.visibility?.app !== false;

                    const skuCode =
                      row.basicInfo?.sku ||
                      row.ornate?.tagNo ||
                      (typeof row.sku === 'string' ? row.sku : '');

                    const displayPrice =
                      row.pricing?.salePrice ??
                      row.pricing?.calculatedPrice ??
                      row.price;

                    const typeName =
                      typeof row.typeId === 'object' && row.typeId !== null
                        ? (row.typeId.name || row.typeId.title || '')
                        : (typeof row.type === 'object' && row.type !== null
                          ? (row.type.name || row.type.title || '')
                          : (typeof row.typeId === 'string' ? row.typeId : (typeof row.type === 'string' ? row.type : '')));

                    const shapeName =
                      typeof row.shapeId === 'object' && row.shapeId !== null
                        ? (row.shapeId.name || row.shapeId.title || '')
                        : (typeof row.shape === 'object' && row.shape !== null
                          ? (row.shape.name || row.shape.title || '')
                          : (typeof row.shapeId === 'string' ? row.shapeId : (typeof row.shape === 'string' ? row.shape : '')));

                    const colorName =
                      typeof row.colorId === 'object' && row.colorId !== null
                        ? (row.colorId.name || row.colorId.title || '')
                        : (typeof row.color === 'object' && row.color !== null
                          ? (row.color.name || row.color.title || '')
                          : (typeof row.colorId === 'string' ? row.colorId : (typeof row.color === 'string' ? row.color : '')));

                    const clarityName =
                      typeof row.clarityId === 'object' && row.clarityId !== null
                        ? (row.clarityId.name || row.clarityId.title || '')
                        : (typeof row.clarity === 'object' && row.clarity !== null
                          ? (row.clarity.name || row.clarity.title || '')
                          : (typeof row.clarityId === 'string' ? row.clarityId : (typeof row.clarity === 'string' ? row.clarity : '')));

                    const statusStr =
                      typeof row.status === 'object' && row.status !== null
                        ? (row.status.name || 'active')
                        : String(row.status || (row.isActive !== false ? 'active' : 'inactive'));

                    const isInactive = statusStr === 'inactive' || row.isActive === false;

                    return (
                      <tr
                        key={row._id || row.id}
                        onClick={() => {
                          if (isProductCatalogPage) {
                            handleEditProductRecord(row);
                          } else {
                            setViewingRecord(row);
                          }
                        }}
                        className="hover:bg-[#faf7f2] transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row._id || row.id)}
                            onChange={() => handleSelectItem(row._id || row.id)}
                            className="w-3.5 h-3.5 rounded border-stone-300 text-[#8b6f4e] focus:ring-[#8b6f4e]/30 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center text-xs font-semibold text-stone-500 whitespace-nowrap">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* PRODUCT / ITEM COLUMN */}
                        <td className="py-2.5 px-3 text-stone-900 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#faf6f0] border border-stone-200/90 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#8b6f4e]/40 transition-colors">
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={rowLabel}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    if (e.currentTarget.parentElement) {
                                      e.currentTarget.parentElement.innerHTML =
                                        '<span class="text-[9px] text-stone-400 font-medium select-none">No Img</span>';
                                    }
                                  }}
                                />
                              ) : isEmoji ? (
                                <span className="text-base">{row.icon}</span>
                              ) : (
                                <span className="text-[9px] text-stone-400 font-medium select-none">
                                  No Img
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs space-y-0.5">
                              <span
                                className="font-bold text-stone-900 text-xs block leading-tight truncate hover:text-[#8b6f4e] transition-colors"
                                title={rowLabel}
                              >
                                {rowLabel}
                              </span>
                              {skuCode && skuCode !== rowLabel && (
                                <span className="font-mono text-[10px] text-stone-400 block truncate">
                                  {skuCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SPECIFICATIONS COLUMN */}
                        <td className="py-2.5 px-3 text-stone-600 text-xs">
                          {isProductCatalogPage ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {displayPrice !== undefined && displayPrice !== null && (
                                <span className="font-bold text-stone-900 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded text-[11px]">
                                  ₹{Number(displayPrice).toLocaleString('en-IN')}
                                </span>
                              )}
                              {(row.specifications?.metalDetails?.purity || row.productType || row.ornate?.metalName) && (
                                <span className="capitalize px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium">
                                  {row.specifications?.metalDetails?.purity || (row.productType ? `${row.productType} Jewellery` : row.ornate?.metalName)}
                                </span>
                              )}
                              {(row.specifications?.metalWeight || row.specifications?.metalDetails?.grossWeight || row.ornate?.grossWt) && (
                                <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[10px] font-mono">
                                  {row.specifications?.metalWeight || row.specifications?.metalDetails?.grossWeight || row.ornate?.grossWt}g
                                </span>
                              )}
                              {row.stockStatus && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  row.stockStatus === 'In Stock'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                    : 'bg-stone-100 text-stone-600'
                                }`}>
                                  {row.stockStatus}
                                </span>
                              )}
                            </div>
                          ) : (
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
                              {row.banner && (row.banner.url || (typeof row.banner === 'string' && row.banner)) && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium">
                                  Banner ✓
                                </span>
                              )}
                              {row.icon && (row.icon.url || (typeof row.icon === 'string' && row.icon)) && !isEmoji && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-medium">
                                  Icon ✓
                                </span>
                              )}
                              {Array.isArray(row.promoBanners) && row.promoBanners.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-medium flex items-center gap-1">
                                  <HiOutlineSparkles className="w-3 h-3 text-purple-500" />
                                  {row.promoBanners.length} Promo Banner{row.promoBanners.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* DEMO METRICS COLUMN */}
                        {isProductCatalogPage && (
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMetricsModal(row);
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenMetricsModal(row);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200/90 bg-stone-50/80 hover:bg-amber-50 hover:border-amber-200 text-stone-700 hover:text-amber-900 transition-all cursor-pointer shadow-2xs group"
                              title="Click to edit demo metrics (sold & review count)"
                            >
                              <span className="flex items-center gap-1 text-[11px] font-semibold">
                                <span className="text-amber-500 font-bold">★</span>
                                <span>{row.demoMetrics?.reviewCount ?? 0}</span>
                              </span>
                              <span className="text-stone-300">|</span>
                              <span className="flex items-center gap-1 text-[11px] font-semibold">
                                <span>🔥</span>
                                <span>{row.demoMetrics?.soldCount ?? 0}</span>
                              </span>
                            </button>
                          </td>
                        )}

                        {/* VISIBILITY COLUMN (Web & App) */}
                        {isProductCatalogPage && (
                          <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5 bg-stone-50/90 p-1 rounded-lg border border-stone-200/80 shadow-2xs">
                              {/* Web Status Toggle */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleProductVisibility(row, 'web', e)}
                                disabled={updatingVisibilityId === `${row._id || row.id}-web`}
                                title={isWebVisible ? 'Web: Visible (Click to Hide)' : 'Web: Hidden (Click to Show)'}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  isWebVisible
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                    : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                                }`}
                              >
                                <span className="text-[10px]">🌐</span>
                                <span>Web</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${isWebVisible ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                              </button>

                              {/* App Status Toggle */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleProductVisibility(row, 'app', e)}
                                disabled={updatingVisibilityId === `${row._id || row.id}-app`}
                                title={isAppVisible ? 'App: Visible (Click to Hide)' : 'App: Hidden (Click to Show)'}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                  isAppVisible
                                    ? 'bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100'
                                    : 'bg-white text-stone-400 border-stone-200 hover:text-stone-600 hover:bg-stone-50'
                                }`}
                              >
                                <span className="text-[10px]">📱</span>
                                <span>App</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${isAppVisible ? 'bg-sky-500' : 'bg-stone-300'}`} />
                              </button>
                            </div>
                          </td>
                        )}

                        {/* STATUS COLUMN */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => isProductCatalogPage && handleToggleProductStatus(row, e)}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize transition-all ${
                              isProductCatalogPage ? 'cursor-pointer hover:scale-105 select-none' : ''
                            } ${
                              isInactive
                                ? 'bg-stone-100 text-stone-600 border-stone-200'
                                : statusStr === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-[#faf5ed] text-[#8b6f4e] border-[#e8d8c0]'
                            }`}
                            title={isProductCatalogPage ? 'Click to toggle status (draft / approved)' : undefined}
                          >
                            {statusStr}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="py-2.5 pr-4 pl-2 whitespace-nowrap text-right">
                          <RowActions
                            onView={() => {
                              if (isProductCatalogPage) {
                                handleEditProductRecord(row);
                              } else {
                                setViewingRecord(row);
                              }
                            }}
                            onOpenWebsite={isProductCatalogPage ? () => openProductPreview(row) : undefined}
                            onEdit={() => handleEditProductRecord(row)}
                            onDelete={() => handleDelete(row._id || row.id, rowLabel)}
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
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* ─── Create / Edit Record Modal ────────────────────────────── */}
      {isModalOpen && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
          }}
        >
          <div
            className={`bg-white rounded-2xl sm:rounded-3xl ${isCategoryPage ? 'max-w-6xl p-5 sm:p-7' : 'max-w-lg p-4 sm:p-6'} w-full shadow-2xl border border-stone-200 space-y-4 sm:space-y-5 animate-in fade-in zoom-in duration-200 max-h-[92vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {editingRecord ? 'Edit' : 'Add'} {singleName}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6f4e] block mt-0.5">
                  LUXURY CATALOG MANAGEMENT
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecord(null);
                }}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {isCategoryPage ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ─── TOP ROW: Category Name & Theme ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Name */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 mb-1.5 block">
                      Category Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rings, Necklaces, Bracelets"
                      value={formData.name || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full h-10 px-4 text-xs sm:text-sm font-medium text-stone-900 bg-white border border-stone-200 rounded-xl hover:border-stone-300 focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/15 transition-all shadow-2xs placeholder:text-stone-400"
                    />
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="text-xs font-bold text-stone-800 mb-1.5 block">
                      Theme <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <Dropdown
                      value={formData.themeId || ''}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, themeId: val }));
                        setPendingThemeImages({});
                      }}
                      options={[
                        { value: '', label: 'Select Theme (or Default)' },
                        ...availableThemes.map((theme) => ({
                          value: theme._id,
                          label: `${theme.name}${theme.status ? ` - ${theme.status}` : ''}`,
                        })),
                      ]}
                      placeholder="Select Theme"
                      size="field"
                      buttonClassName="w-full h-10 px-4 rounded-xl border border-stone-200 hover:border-stone-300 bg-white text-stone-900 text-xs sm:text-sm font-medium shadow-2xs flex items-center justify-between"
                    />
                  </div>
                </div>

                {/* ─── CATEGORY IMAGES SECTION ─── */}
                <div className="bg-[#FAF9F6]/60 rounded-2xl border border-stone-200/90 p-4 sm:p-5 space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                      <HiOutlinePhotograph className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 leading-tight">
                        Category Images
                      </h4>
                      <p className="text-[11px] text-stone-500 font-normal mt-0.5">
                        Upload images for this category.
                      </p>
                    </div>
                  </div>

                  {/* 4-Column Grid: Icon, Banner, Size Chart, Promo Banners */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
                    {/* ─── Col 1: Category Icon ─── */}
                    {(() => {
                      const iconVal = formData.icon;
                      const iconUrl = typeof iconVal === 'object' ? iconVal?.url || '' : iconVal || '';
                      const hasIcon = Boolean(iconUrl && typeof iconUrl === 'string' && iconUrl.trim().length > 0);

                      return (
                        <div className="lg:col-span-2 xl:col-span-2 flex flex-col h-full">
                          <div className="mb-2">
                            <label className="text-xs font-bold text-stone-900 block leading-tight">
                              Category Icon <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <span className="text-[11px] text-stone-400 font-normal block mt-0.5 truncate">
                              Square image (e.g. 200 × 200 px)
                            </span>
                          </div>

                          <div className="flex-1 min-h-[148px] relative rounded-xl border border-dashed border-stone-200 hover:border-[#8b6f4e] bg-white p-3 flex flex-col items-center justify-center text-center transition-all group shadow-2xs">
                            {uploadingField === 'icon' ? (
                              <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                <span className="text-[11px] font-medium text-[#8b6f4e]">Uploading icon...</span>
                              </div>
                            ) : hasIcon ? (
                              <div className="flex flex-col items-center justify-center w-full h-full py-1">
                                <div className="w-16 h-16 rounded-xl border border-stone-100 bg-[#FAF4ED]/50 p-2 flex items-center justify-center overflow-hidden shadow-2xs mb-2">
                                  <img
                                    src={getMediaUrl(iconUrl)}
                                    alt="Category Icon"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer">
                                    <span>Change</span>
                                    <input
                                      type="file"
                                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFileUpload('icon', file, 'categories');
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  <span className="text-stone-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleClearImageField('icon')}
                                    className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-3 group">
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload('icon', file, 'categories');
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <HiOutlinePhotograph className="w-8 h-8 text-stone-400 group-hover:text-[#8b6f4e] transition-colors mb-1.5" />
                                <span className="text-xs font-semibold text-stone-800 group-hover:text-[#8b6f4e] transition-colors">
                                  Click to upload
                                </span>
                                <span className="text-[11px] text-stone-400 mt-0.5">
                                  PNG, JPG up to 2 MB
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ─── Col 2: Category Banner ─── */}
                    {(() => {
                      const bannerVal = formData.banner;
                      const bannerUrl = typeof bannerVal === 'object' ? bannerVal?.url || '' : bannerVal || '';
                      const hasBanner = Boolean(bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim().length > 0);

                      return (
                        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
                          <div className="mb-2">
                            <label className="text-xs font-bold text-stone-900 block leading-tight">
                              Category Banner <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <span className="text-[11px] text-stone-400 font-normal block mt-0.5 truncate">
                              Landscape image (e.g. 1920 × 600 px)
                            </span>
                          </div>

                          <div className="flex-1 min-h-[148px] relative rounded-xl border border-dashed border-stone-200 hover:border-[#8b6f4e] bg-white p-3 flex flex-col items-center justify-center text-center transition-all group shadow-2xs">
                            {uploadingField === 'banner' ? (
                              <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                <span className="text-[11px] font-medium text-[#8b6f4e]">Uploading banner...</span>
                              </div>
                            ) : hasBanner ? (
                              <div className="flex flex-col items-center justify-center w-full h-full py-1">
                                <div className="w-full h-20 rounded-lg overflow-hidden border border-stone-200 shadow-2xs mb-2 bg-stone-100">
                                  <img
                                    src={getMediaUrl(bannerUrl)}
                                    alt="Banner preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer">
                                    <span>Change</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFileUpload('banner', file, 'categories');
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  <span className="text-stone-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleClearImageField('banner')}
                                    className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-3 group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload('banner', file, 'categories');
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <HiOutlinePhotograph className="w-8 h-8 text-stone-400 group-hover:text-[#8b6f4e] transition-colors mb-1.5" />
                                <span className="text-xs font-semibold text-stone-800 group-hover:text-[#8b6f4e] transition-colors">
                                  Click to upload
                                </span>
                                <span className="text-[11px] text-stone-400 mt-0.5">
                                  PNG, JPG up to 5 MB
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ─── Col 3: Size Chart ─── */}
                    {(() => {
                      const sizeChartVal = formData.sizeChart;
                      const sizeChartUrl = typeof sizeChartVal === 'object' ? sizeChartVal?.url || '' : sizeChartVal || '';
                      const hasSizeChart = Boolean(sizeChartUrl && typeof sizeChartUrl === 'string' && sizeChartUrl.trim().length > 0);

                      return (
                        <div className="lg:col-span-3 xl:col-span-3 flex flex-col h-full">
                          <div className="mb-2">
                            <label className="text-xs font-bold text-stone-900 block leading-tight">
                              Size Chart <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
                            </label>
                            <span className="text-[11px] text-stone-400 font-normal block mt-0.5 truncate">
                              PDF document or Image (e.g. PDF size guide, PNG, JPG)
                            </span>
                          </div>

                          <div className="flex-1 min-h-[148px] relative rounded-xl border border-dashed border-stone-200 hover:border-[#8b6f4e] bg-white p-3 flex flex-col items-center justify-center text-center transition-all group shadow-2xs">
                            {uploadingField === 'sizeChart' ? (
                              <div className="flex flex-col items-center justify-center py-4 gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                <span className="text-[11px] font-medium text-[#8b6f4e]">Uploading size chart...</span>
                              </div>
                            ) : hasSizeChart ? (
                              <div className="flex flex-col items-center justify-center w-full h-full py-1">
                                {/\.pdf($|\?)/i.test(sizeChartUrl) ? (
                                  <div className="w-full h-20 rounded-lg overflow-hidden border border-rose-200 bg-rose-50/60 p-2 flex flex-col items-center justify-center gap-1 shadow-2xs mb-2">
                                    <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px]">PDF</span>
                                      <span>Size Guide Document</span>
                                    </div>
                                    <span className="text-[10px] text-stone-500 truncate max-w-[180px]">
                                      {sizeChartUrl.split('/').pop() || 'size-guide.pdf'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="w-full h-20 rounded-lg overflow-hidden border border-stone-200 shadow-2xs mb-2 bg-stone-50 p-1 flex items-center justify-center">
                                    <img
                                      src={getMediaUrl(sizeChartUrl)}
                                      alt="Size Chart preview"
                                      className="w-full h-full object-contain"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <a
                                    href={getMediaUrl(sizeChartUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-semibold text-stone-600 hover:text-[#8b6f4e] hover:underline flex items-center gap-0.5"
                                  >
                                    View <HiOutlineExternalLink className="w-3 h-3" />
                                  </a>
                                  <span className="text-stone-300">•</span>
                                  <label className="text-[11px] font-semibold text-[#8b6f4e] hover:underline cursor-pointer">
                                    <span>Change</span>
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf,.pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFileUpload('sizeChart', file, 'categories');
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  <span className="text-stone-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleClearImageField('sizeChart')}
                                    className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-3 group">
                                <input
                                  type="file"
                                  accept="image/*,application/pdf,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload('sizeChart', file, 'categories');
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <HiOutlinePhotograph className="w-8 h-8 text-stone-400 group-hover:text-[#8b6f4e] transition-colors mb-1.5" />
                                <span className="text-xs font-semibold text-stone-800 group-hover:text-[#8b6f4e] transition-colors">
                                  Click to upload
                                </span>
                                <span className="text-[11px] text-stone-400 mt-0.5">
                                  PNG, JPG up to 5 MB
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ─── Col 4: Promo Banners ─── */}
                    <div className="sm:col-span-2 lg:col-span-4 xl:col-span-4 flex flex-col h-full">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-stone-900 block leading-tight">
                            Promo Banners <span className="text-stone-400 font-normal text-[11px]">(Optional)</span>
                          </label>
                        </div>

                        {!bannerFormOpen && (
                          <button
                            type="button"
                            onClick={() => handleOpenBannerForm()}
                            className="px-2.5 py-1 rounded-lg bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                          >
                            <HiOutlinePlus className="w-3.5 h-3.5" />
                            <span>Add Banner</span>
                          </button>
                        )}
                      </div>

                      {/* Banner Add/Edit Sub-Form */}
                      {bannerFormOpen && (
                        <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-sm space-y-3 mb-2 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                            <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                              <HiOutlinePhotograph className="w-3.5 h-3.5 text-[#8b6f4e]" />
                              <span>{editingBannerIndex !== null ? 'Edit Promo Banner' : 'New Promo Banner'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={handleCloseBannerForm}
                              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                            >
                              <HiOutlineX className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Image Upload Area */}
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                              Banner Image <span className="text-rose-500">*</span>
                            </label>
                            {bannerFormData.imageUrl ? (
                              <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 group shadow-2xs h-20">
                                <img
                                  src={getMediaUrl(bannerFormData.imageUrl)}
                                  alt="Promo banner preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://placehold.co/600x200/f5efe6/8b6f4e?text=Banner+Preview';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="px-2.5 py-1 bg-white text-stone-800 rounded-md text-[11px] font-semibold hover:bg-stone-100 cursor-pointer shadow-md flex items-center gap-1">
                                    <HiOutlineUpload className="w-3 h-3" />
                                    <span>Change</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      disabled={isUploadingBannerImage}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadBannerImage(file);
                                      }}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={handleClearPromoBannerImage}
                                    className="px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-semibold hover:bg-red-700 cursor-pointer shadow-md flex items-center gap-1"
                                  >
                                    <HiOutlineTrash className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className={`w-full py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                isUploadingBannerImage
                                  ? 'border-[#8b6f4e] bg-[#faf5ed]'
                                  : 'border-stone-200 bg-stone-50/50 hover:border-[#8b6f4e] hover:bg-white'
                              }`}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingBannerImage}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadBannerImage(file);
                                  }}
                                />
                                {isUploadingBannerImage ? (
                                  <div className="flex items-center gap-2 py-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                    <span className="text-[11px] font-semibold text-[#8b6f4e]">Uploading...</span>
                                  </div>
                                ) : (
                                  <>
                                    <HiOutlinePhotograph className="w-5 h-5 text-stone-400" />
                                    <span className="text-[11px] font-semibold text-stone-700">Click to upload banner image</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>

                          {/* Banner Title */}
                          <div>
                            <label className="text-[11px] font-bold text-stone-700 block mb-1">
                              Banner Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. New Arrivals"
                              value={bannerFormData.title}
                              onChange={(e) =>
                                setBannerFormData((prev) => ({ ...prev, title: e.target.value }))
                              }
                              className="w-full px-3 py-1.5 text-xs font-medium text-stone-900 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#8b6f4e]"
                            />
                          </div>

                          {/* Form Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                            <button
                              type="button"
                              onClick={handleCloseBannerForm}
                              className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSavePromoBannerItem}
                              disabled={isUploadingBannerImage}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              {editingBannerIndex !== null ? 'Save Changes' : 'Add Banner'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Banner Cards List Matching Screenshot */}
                      {!(formData.promoBanners && formData.promoBanners.length > 0) ? (
                        !bannerFormOpen && (
                          <div className="flex-1 min-h-[148px] border border-dashed border-stone-200 rounded-xl bg-white p-4 flex flex-col items-center justify-center text-center shadow-2xs">
                            <HiOutlinePhotograph className="w-8 h-8 text-stone-300 mb-1" />
                            <span className="text-xs font-semibold text-stone-600">No promo banners yet</span>
                            <span className="text-[11px] text-stone-400 mt-0.5">Click &ldquo;+ Add Banner&rdquo; to add promo banners</span>
                          </div>
                        )
                      ) : (
                        <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                          {formData.promoBanners.map((banner, index) => {
                            const bannerImg =
                              banner.imageUrl ||
                              (typeof banner.image === 'object' ? banner.image?.url : banner.image) ||
                              '';

                            return (
                              <div
                                key={banner._id || index}
                                className="rounded-xl border border-stone-200 bg-white p-2.5 flex items-center gap-2.5 shadow-2xs hover:border-stone-300 transition-colors"
                              >
                                {/* Grip Icon */}
                                <RxDragHandleDots2 className="w-4 h-4 text-stone-400 shrink-0 cursor-grab" />

                                {/* Thumbnail */}
                                <div className="w-16 h-11 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                                  {bannerImg ? (
                                    <img
                                      src={getMediaUrl(bannerImg)}
                                      alt={banner.title || 'Banner'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src =
                                          'https://placehold.co/100x70/f5efe6/8b6f4e?text=Banner';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                      No Img
                                    </div>
                                  )}
                                </div>

                                {/* Title with input matching screenshot */}
                                <div className="flex-1 min-w-0">
                                  <label className="text-[10px] font-bold text-stone-700 block mb-0.5">
                                    Banner Title
                                  </label>
                                  <input
                                    type="text"
                                    value={banner.title || ''}
                                    placeholder="e.g. New Arrivals"
                                    onChange={(e) => handleUpdateBannerTitle(index, e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs font-medium text-stone-900 bg-stone-50/70 hover:bg-stone-50 focus:bg-white border border-stone-200 focus:border-[#8b6f4e] rounded-lg focus:outline-none transition-colors"
                                  />
                                </div>

                                {/* Edit & Delete Buttons Matching Screenshot */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenBannerForm(banner, index)}
                                    className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                                    title="Edit Details"
                                  >
                                    <HiOutlinePencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePromoBannerItem(index)}
                                    className="p-1.5 text-rose-600 bg-rose-50/80 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                                    title="Delete Banner"
                                  >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── BOTTOM FOOTER BAR ─── */}
                <div className="pt-4 border-t border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Category Status Toggle with Subtitle */}
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        Category Status
                      </span>
                      <span className="text-[11px] text-stone-500 font-normal">
                        Enable or disable this category on the website.
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.status === 'active'}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            status: prev.status === 'active' ? 'inactive' : 'active',
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.status === 'active' ? 'bg-[#8b6f4e]' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            formData.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-bold text-stone-800">
                        {formData.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Cancel & Save Changes Action Buttons */}
                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingRecord(null);
                      }}
                      className="px-5 py-2.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 text-xs font-semibold text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {saving
                        ? editingRecord
                          ? 'Saving...'
                          : 'Creating...'
                        : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {config.fields?.map((field) => (
                  <div key={field.name} className="space-y-1">
                    {field.type === 'banner' ? (
                      (() => {
                        const bannerVal = formData[field.name];
                        const bannerUrl = typeof bannerVal === 'object' ? (bannerVal?.url || '') : (bannerVal || '');
                        const hasBanner = Boolean(bannerUrl && typeof bannerUrl === 'string' && bannerUrl.trim().length > 0);

                        return (
                          <div className="space-y-2 p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/80">
                            <div className="flex items-center gap-1.5">
                              <HiOutlinePhotograph className="w-4 h-4 text-[#8b6f4e]" />
                              <span className="text-xs font-bold text-stone-900">
                                {field.label}
                              </span>
                            </div>

                            <ThemeImageField key={editingRecord?._id || 'new'} module="category" recordId={editingRecord?._id} selectedThemeId={formData.themeId || ''} onThemeChange={(value) => { setFormData((previous) => ({ ...previous, themeId: value })); setPendingThemeImages({}); }} onPendingChange={(slot, image) => setPendingThemeImages((current) => ({ ...current, [slot]: image }))} slots={[{ key: 'banner', label: 'Category banner', url: bannerUrl }]}>
                            <div className="space-y-2 pt-1">
                              {hasBanner ? (
                                <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 group shadow-2xs">
                                  <img
                                    key={bannerUrl}
                                    src={getMediaUrl(bannerUrl)}
                                    alt="Banner preview"
                                    className="w-full h-28 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={(e) => {
                                      e.currentTarget.style.display = 'block';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <label className="px-3 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-semibold hover:bg-stone-100 cursor-pointer shadow-md flex items-center gap-1">
                                      <HiOutlineUpload className="w-3.5 h-3.5" />
                                      <span>Change</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleFileUpload(field.name, file, 'categories');
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleClearImageField(field.name)}
                                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer shadow-md flex items-center gap-1"
                                    >
                                      <HiOutlineTrash className="w-3.5 h-3.5" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label
                                  className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                    uploadingField === field.name
                                      ? 'border-[#8b6f4e] bg-[#faf5ed]'
                                      : 'border-stone-200 bg-white hover:border-[#8b6f4e] hover:bg-[#fcfaf7]'
                                  }`}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingField === field.name}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(field.name, file, 'categories');
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                  {uploadingField === field.name ? (
                                    <>
                                      <div className="w-5 h-5 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                      <span className="text-[11px] font-semibold text-[#8b6f4e]">
                                        Uploading banner...
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlineUpload className="w-5 h-5 text-stone-400 group-hover:text-[#8b6f4e]" />
                                      <span className="text-xs font-semibold text-stone-700">
                                        Click to upload category banner
                                      </span>
                                    </>
                                  )}
                                </label>
                              )}
                            </div>
                            </ThemeImageField>
                          </div>
                        );
                      })()
                    ) : field.type === 'icon' ? (
                      (() => {
                        const iconVal = formData[field.name];
                        const iconUrl = typeof iconVal === 'object' ? (iconVal?.url || '') : (iconVal || '');
                        const hasIcon = Boolean(iconUrl && typeof iconUrl === 'string' && iconUrl.trim().length > 0);

                        return (
                          <ThemeImageField key={editingRecord?._id || 'new'} module="category" recordId={editingRecord?._id} selectedThemeId={formData.themeId || ''} onThemeChange={(value) => { setFormData((previous) => ({ ...previous, themeId: value })); setPendingThemeImages({}); }} onPendingChange={(slot, image) => setPendingThemeImages((current) => ({ ...current, [slot]: image }))} slots={[{ key: 'icon', label: 'Category icon', url: iconUrl }]}>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                              <HiOutlineSparkles className="w-3.5 h-3.5 text-[#8b6f4e]" />
                              <span>{field.label}</span>
                            </label>

                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl border border-stone-200 bg-[#fdfcfb] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative">
                                {uploadingField === field.name ? (
                                  <div className="w-5 h-5 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                ) : hasIcon ? (
                                  <img
                                    key={iconUrl}
                                    src={getMediaUrl(iconUrl)}
                                    alt="Category Icon"
                                    className="w-full h-full object-contain p-1.5"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={(e) => {
                                      e.currentTarget.style.display = 'block';
                                    }}
                                  />
                                ) : (
                                  <HiOutlineSparkles className="w-5 h-5 text-stone-300" />
                                )}
                              </div>

                              <label className="flex-1 py-2.5 px-4 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-200 hover:border-[#8b6f4e] rounded-xl text-stone-700 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs font-semibold shadow-2xs">
                                {uploadingField === field.name ? (
                                  <>
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 border-t-[#8b6f4e] animate-spin" />
                                    <span className="text-[#8b6f4e]">Uploading icon...</span>
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineUpload className="w-4 h-4 text-stone-500" />
                                    <span>{hasIcon ? 'Change Category Icon' : 'Upload Category Icon'}</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                  className="hidden"
                                  disabled={uploadingField === field.name}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(field.name, file, 'categories');
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>

                              {hasIcon && (
                                <button
                                  type="button"
                                  onClick={() => handleClearImageField(field.name)}
                                  className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-stone-200"
                                  title="Clear Icon"
                                >
                                  <HiOutlineX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          </ThemeImageField>
                        );
                      })()
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-stone-900 flex items-center gap-1">
                          {field.label} {field.required && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <Dropdown
                            value={formData[field.name] || field.default || ''}
                            onChange={(val) =>
                              setFormData((prev) => ({ ...prev, [field.name]: val }))
                            }
                            options={field.options}
                            placeholder={`Select ${field.label}`}
                            size="field"
                            buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white text-stone-900 text-xs sm:text-[13px] font-medium shadow-2xs"
                          />
                        ) : field.type === 'lookup' ? (
                          <Dropdown
                            value={formData[field.name] || ''}
                            onChange={(val) =>
                              setFormData((prev) => ({ ...prev, [field.name]: val }))
                            }
                            options={lookupData[field.name] || []}
                            placeholder={`Select ${field.label}`}
                            size="field"
                            buttonClassName="w-full h-10 px-3.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-white text-stone-900 text-xs sm:text-[13px] font-medium shadow-2xs"
                          />
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            placeholder={field.placeholder || field.label}
                            value={formData[field.name] || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                            }
                            className="w-full h-10 px-3.5 text-xs sm:text-[13px] font-medium text-stone-900 bg-white border border-stone-200 hover:border-stone-300 rounded-xl focus:outline-none focus:border-[#8b6f4e] focus:ring-2 focus:ring-[#8b6f4e]/20 transition-all shadow-2xs placeholder:text-stone-400"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingRecord(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold tracking-wider text-white bg-[#8b6f4e] hover:bg-[#785e40] rounded-xl uppercase shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {saving
                      ? editingRecord
                        ? 'Saving...'
                        : 'Creating...'
                      : editingRecord
                      ? 'Save Changes'
                      : 'Create Record'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>, document.body)
      )}

      {/* ─── View Record Details Modal ──────────────────────── */}
      {viewingRecord && (
        createPortal(<div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setViewingRecord(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200/90 space-y-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#faf5ed] text-[#8b6f4e] flex items-center justify-center font-bold text-sm">
                  <HiOutlineEye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 leading-tight">
                    {singleName} Details
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>

            {/* Media thumbnail if exists */}
            {(() => {
              const rawMedia = getRowThumbnail(viewingRecord);
              const mediaUrl = getMediaUrl(rawMedia);
              if (!mediaUrl) return null;
              return (
                <div className="w-full h-44 rounded-xl overflow-hidden bg-stone-50 border border-stone-200/60 flex items-center justify-center image-preview-container">
                  <img
                    src={mediaUrl}
                    alt={getRowLabel(viewingRecord)}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const container = e.currentTarget.closest('.image-preview-container');
                      if (container) container.style.display = 'none';
                    }}
                  />
                </div>
              );
            })()}

            {/* Details Grid - Display All Available Fields */}
            <div className="space-y-2 bg-stone-50/70 p-4 rounded-xl border border-stone-200/60 text-xs">
              {/* Name / Title */}
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                <span className="text-stone-400 font-medium">Name / Title</span>
                <span className="font-bold text-stone-900 text-right">{getRowLabel(viewingRecord)}</span>
              </div>

              {/* SKU / Tag */}
              {(viewingRecord.basicInfo?.sku || viewingRecord.ornate?.tagNo || viewingRecord.sku) && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">SKU / Tag</span>
                  <span className="font-mono text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                    {viewingRecord.basicInfo?.sku || viewingRecord.ornate?.tagNo || viewingRecord.sku}
                  </span>
                </div>
              )}

              {/* Web Visibility */}
              {isProductCatalogPage && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Web Visibility</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viewingRecord.inweb !== false && viewingRecord.visibility?.web !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    🌐 {viewingRecord.inweb !== false && viewingRecord.visibility?.web !== false ? 'Visible on Web' : 'Hidden from Web'}
                  </span>
                </div>
              )}

              {/* App Visibility */}
              {isProductCatalogPage && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">App Visibility</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      viewingRecord.inapp !== false && viewingRecord.visibility?.app !== false
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                    }`}
                  >
                    📱 {viewingRecord.inapp !== false && viewingRecord.visibility?.app !== false ? 'Visible in App' : 'Hidden from App'}
                  </span>
                </div>
              )}

              {/* Slug */}
              {viewingRecord.slug && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Slug</span>
                  <span className="font-mono text-stone-700 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                    /{viewingRecord.slug}
                  </span>
                </div>
              )}

              {/* Type / Collection */}
              {viewingRecord.type && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Type</span>
                  <span className="capitalize font-semibold text-[#8b6f4e] bg-[#faf5ed] border border-[#e8d8c0] px-2 py-0.5 rounded-full text-[10px]">
                    {typeof viewingRecord.type === 'object' ? viewingRecord.type.name : viewingRecord.type}
                  </span>
                </div>
              )}

              {/* Status */}
              {viewingRecord.status !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Status</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                      String(viewingRecord.status).toLowerCase() === 'inactive'
                        ? 'bg-stone-100 text-stone-600 border-stone-200'
                        : 'bg-[#faf5ed] text-[#8b6f4e] border-[#e8d8c0]'
                    }`}
                  >
                    {typeof viewingRecord.status === 'object' ? viewingRecord.status.name : String(viewingRecord.status)}
                  </span>
                </div>
              )}


              {/* Category Icon */}
              {viewingRecord.icon && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Icon</span>
                  <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                    {typeof viewingRecord.icon === 'string' &&
                    viewingRecord.icon.length <= 4 &&
                    !viewingRecord.icon.startsWith('http') &&
                    !viewingRecord.icon.startsWith('/') ? (
                      <span className="text-base">{viewingRecord.icon}</span>
                    ) : (
                      <img
                        src={getMediaUrl(
                          typeof viewingRecord.icon === 'object'
                            ? viewingRecord.icon.url
                            : viewingRecord.icon
                        )}
                        alt="Icon"
                        className="w-5 h-5 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-xs font-mono text-stone-600 truncate max-w-[180px]">
                      {typeof viewingRecord.icon === 'object'
                        ? viewingRecord.icon.url
                        : viewingRecord.icon}
                    </span>
                  </span>
                </div>
              )}

              {/* Category Banner */}
              {viewingRecord.banner && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Banner</span>
                  <span className="font-mono text-[11px] text-stone-700 truncate max-w-[200px]">
                    {typeof viewingRecord.banner === 'object'
                      ? viewingRecord.banner.url
                      : viewingRecord.banner}
                  </span>
                </div>
              )}

              {/* Gallery Images */}
              {Array.isArray(viewingRecord.images) && viewingRecord.images.length > 0 && (
                <div className="flex flex-col gap-1.5 pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">
                    Gallery Images ({viewingRecord.images.length})
                  </span>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {viewingRecord.images.map((img, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-stone-200 shadow-2xs">
                        <img
                          src={getMediaUrl(img.url || img)}
                          alt={img.title || `Image ${i + 1}`}
                          className="w-6 h-6 rounded object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="text-[11px] font-medium text-stone-700">
                          {img.title || `Image #${i + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Promo Banners */}
              {(Array.isArray(viewingRecord.promoBanners) && viewingRecord.promoBanners.length > 0) && (
                <div className="space-y-2 py-3 border-b border-stone-200/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <HiOutlineSparkles className="w-3.5 h-3.5 text-[#8b6f4e]" />
                      <span>Category Promo Banners</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faf5ed] text-[#8b6f4e] border border-[#e8d8c0]">
                      {viewingRecord.promoBanners.length} Banner{viewingRecord.promoBanners.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {viewingRecord.promoBanners.map((p, idx) => {
                      const pImg = p.image?.url || p.url || (typeof p.image === 'string' ? p.image : '') || '';
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 bg-[#faf7f2]/70">
                          {pImg ? (
                            <img
                              src={getMediaUrl(pImg)}
                              alt={p.title}
                              className="w-16 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://placehold.co/100x70/f5efe6/8b6f4e?text=Banner';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-11 rounded-lg bg-stone-200 flex items-center justify-center text-stone-400 text-xs shrink-0">
                              No Img
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-stone-900 truncate">{p.title || 'Untitled Banner'}</p>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                                {p.status || 'active'}
                              </span>
                            </div>
                            {p.subtitle && <p className="text-[11px] text-stone-500 truncate">{p.subtitle}</p>}
                            {(p.link || p.url) && (
                              <p className="text-[10px] font-mono text-[#8b6f4e] truncate mt-0.5 flex items-center gap-1">
                                <HiOutlineExternalLink className="w-3 h-3 shrink-0" />
                                <span>{p.link || p.url}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Chart */}
              {viewingRecord.sizeChart && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Size Chart</span>
                  <span className="font-mono text-[11px] text-[#8b6f4e]">
                    {typeof viewingRecord.sizeChart === 'object' ? viewingRecord.sizeChart.url : viewingRecord.sizeChart}
                  </span>
                </div>
              )}

              {/* SKU / Code */}
              {viewingRecord.sku && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">SKU / Code</span>
                  <span className="font-mono font-semibold text-stone-900">{viewingRecord.sku}</span>
                </div>
              )}

              {/* Price */}
              {viewingRecord.price !== undefined && viewingRecord.price !== null && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Price</span>
                  <span className="font-bold text-[#8b6f4e] text-sm">₹ {Number(viewingRecord.price).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* MRP / Sale Price */}
              {viewingRecord.mrp !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">MRP</span>
                  <span className="font-semibold text-stone-800">₹ {Number(viewingRecord.mrp).toLocaleString('en-IN')}</span>
                </div>
              )}
              {viewingRecord.salePrice !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Sale Price</span>
                  <span className="font-bold text-emerald-600">₹ {Number(viewingRecord.salePrice).toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Carat Weight */}
              {viewingRecord.carat !== undefined && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Carat Weight</span>
                  <span className="font-semibold text-stone-800">{viewingRecord.carat} ct</span>
                </div>
              )}

              {/* Rate / Carat */}
              {viewingRecord.ratePerCarat && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Rate / Carat (INR)</span>
                  <span className="font-semibold text-stone-800">₹ {Number(viewingRecord.ratePerCarat).toLocaleString('en-IN')}</span>
                </div>
              )}
              {viewingRecord.ratePerCaratUSD && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Rate / Carat (USD)</span>
                  <span className="font-semibold text-stone-800">$ {Number(viewingRecord.ratePerCaratUSD).toLocaleString('en-US')}</span>
                </div>
              )}

              {/* Size Range */}
              {(viewingRecord.sizeFrom !== undefined || viewingRecord.sizeTo !== undefined) && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Size Range</span>
                  <span className="font-semibold text-stone-800">{viewingRecord.sizeFrom} - {viewingRecord.sizeTo} ct</span>
                </div>
              )}

              {/* Karat */}
              {viewingRecord.karat && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Karat</span>
                  <span className="font-semibold text-stone-800">{viewingRecord.karat}KT</span>
                </div>
              )}

              {/* Metal Category */}
              {viewingRecord.metalType && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Metal Category</span>
                  <span className="font-semibold text-stone-800">{viewingRecord.metalType}</span>
                </div>
              )}

              {/* Metal Color */}
              {viewingRecord.metalColor && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Metal Color</span>
                  <span className="font-semibold text-stone-800">{viewingRecord.metalColor}</span>
                </div>
              )}

              {/* Color Swatch */}
              {viewingRecord.colorCode && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Color Swatch</span>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-stone-300 inline-block shadow-2xs"
                      style={{
                        background: viewingRecord.colorCodeEnd
                          ? `linear-gradient(135deg, ${viewingRecord.colorCode}, ${viewingRecord.colorCodeEnd})`
                          : viewingRecord.colorCode,
                      }}
                    />
                    <span className="font-mono text-stone-700">{viewingRecord.colorCode}</span>
                  </span>
                </div>
              )}

              {/* Body Part */}
              {viewingRecord.bodyPart && (
                <div className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Body Part</span>
                  <span className="capitalize font-semibold text-stone-800">{viewingRecord.bodyPart}</span>
                </div>
              )}

              {/* Description */}
              {viewingRecord.description && (
                <div className="flex flex-col gap-1 pb-2 border-b border-stone-200/50">
                  <span className="text-stone-400 font-medium">Description</span>
                  <span className="text-stone-700 leading-relaxed text-xs">{viewingRecord.description}</span>
                </div>
              )}

              {/* Any additional config.fields not already rendered */}
              {(config.fields || []).map((f) => {
                const renderedKeys = [
                  'name', 'title', 'slug', 'type', 'status', 'icon', 'banner', 'images',
                  'promoBanners', 'sizeChart', 'sku', 'price', 'mrp', 'salePrice',
                  'carat', 'ratePerCarat', 'ratePerCaratUSD', 'sizeFrom', 'sizeTo', 'karat',
                  'metalType', 'metalColor', 'colorCode', 'colorCodeEnd', 'bodyPart', 'description'
                ];
                if (renderedKeys.includes(f.name)) return null;
                const val = viewingRecord[f.name];
                if (val === undefined || val === null || val === '') return null;
                return (
                  <div key={f.name} className="flex justify-between items-center pb-2 border-b border-stone-200/50">
                    <span className="text-stone-400 font-medium">{f.label || f.name}</span>
                    <span className="font-semibold text-stone-800">
                      {typeof val === 'object' ? (val.name || val.title || JSON.stringify(val)) : String(val)}
                    </span>
                  </div>
                );
              })}

              {/* Timestamps */}
              {(viewingRecord.createdAt || viewingRecord.meta?.createdAt) && (
                <div className="flex justify-between items-center pb-1">
                  <span className="text-stone-400 font-medium">Created On</span>
                  <span className="font-medium text-stone-600">
                    {new Date(viewingRecord.createdAt || viewingRecord.meta?.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {(viewingRecord.updatedAt || viewingRecord.meta?.updatedAt) && (
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-medium">Last Updated</span>
                  <span className="font-medium text-stone-600">
                    {new Date(viewingRecord.updatedAt || viewingRecord.meta?.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            {isOrnatePage ? (
              <button
                type="button"
                onClick={() => {
                  navigate(`/catalog/ornate-products/edit/${viewingRecord._id || viewingRecord.id}`);
                }}
                className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <HiOutlinePencil className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Edit Product (Tab-Wise Designer)</span>
              </button>
            ) : isSilverPage ? (
              <button
                type="button"
                onClick={() => {
                  navigate(`/catalog/silver-products/edit/${viewingRecord._id || viewingRecord.id}`);
                }}
                className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <HiOutlinePencil className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Edit Silver Product</span>
              </button>
            ) : isJewelryPage ? (
              <button
                type="button"
                onClick={() => {
                  navigate(`/catalog/jewelry-products/edit/${viewingRecord._id || viewingRecord.id}`);
                }}
                className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <HiOutlinePencil className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Edit Jewellery Product</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const rec = viewingRecord;
                  setViewingRecord(null);
                  handleOpenEdit(rec);
                }}
                className="w-full py-2 bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <HiOutlinePencil className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Edit {singleName}</span>
              </button>
            )}

            {isProductCatalogPage && (
              <button
                type="button"
                onClick={() => openProductPreview(viewingRecord)}
                className="w-full py-2 bg-white border border-[#d6cfc2] hover:bg-[#faf7f2] text-[#785e40] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 mb-2"
              >
                <HiOutlineExternalLink className="w-3.5 h-3.5 stroke-[2]" />
                <span>View on Store</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewingRecord(null)}
              className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>, document.body)
      )}

      {/* ─── Ornate ERP Category Sync Modal ─── */}
      {isOrnatePage && (
        <OrnateSyncModal
          isOpen={isOrnateSyncModalOpen}
          onClose={() => setIsOrnateSyncModalOpen(false)}
          onSyncComplete={() => {
            fetchItems();
          }}
        />
      )}


      {/* ─── QUICK EDIT DEMO METRICS MODAL ─── */}
      {editingMetricsProduct && (
        createPortal(<div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setEditingMetricsProduct(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl p-5 space-y-4 animate-scaleUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 text-lg shadow-2xs">
                  🔥
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    Product Demo Metrics
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate max-w-[260px]">
                    {editingMetricsProduct.basicInfo?.title || editingMetricsProduct.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMetricsProduct(null)}
                className="w-7 h-7 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Live Storefront Preview */}
            <div className="rounded-xl border border-stone-200/90 bg-[#fdfcfb] p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Storefront Live Badge Preview
              </span>
              <div className="flex items-center gap-1.5 text-xs text-stone-700">
                <span className="text-amber-400 tracking-tighter">★★★★★</span>
                <span className="font-semibold text-stone-800 text-xs">
                  {metricsReviewCount || 0} reviews
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-700 font-medium">
                <span>🔥</span>
                <span>
                  <strong className="font-bold text-stone-900">{metricsSoldCount || 0}</strong> sold in last 3 hours
                </span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Sold Count
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">🔥</span>
                  <input
                    type="number"
                    min="0"
                    value={metricsSoldCount}
                    onChange={(e) => setMetricsSoldCount(e.target.value)}
                    className="w-full h-9 pl-7 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30"
                    placeholder="e.g. 24"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">Number of pieces sold</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Review Count
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs">★</span>
                  <input
                    type="number"
                    min="0"
                    value={metricsReviewCount}
                    onChange={(e) => setMetricsReviewCount(e.target.value)}
                    className="w-full h-9 pl-7 pr-3 text-xs font-semibold rounded-xl border border-stone-200 text-stone-900 bg-white focus:outline-none focus:border-[#8b6f4e] focus:ring-1 focus:ring-[#8b6f4e]/30"
                    placeholder="e.g. 13"
                  />
                </div>
                <span className="text-[10px] text-stone-400 mt-1 block">Number of customer reviews</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingMetricsProduct(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 rounded-lg border border-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMetrics}
                disabled={savingMetrics}
                style={{ backgroundColor: 'var(--theme-primary, #8b6f4e)' }}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg hover:brightness-95 disabled:opacity-50 transition cursor-pointer"
              >
                {savingMetrics ? 'Saving…' : 'Save Demo Metrics'}
              </button>
            </div>
          </div>
        </div>, document.body)
      )}

    </div>
  );
};

export default DynamicModuleView;
