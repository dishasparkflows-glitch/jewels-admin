import {
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineTrendingUp,
  HiOutlineDocumentReport,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineCash,
  HiOutlineSpeakerphone,
  HiOutlineEye,
  HiOutlineMail,
  HiOutlineCamera,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlineTemplate,
  HiOutlineFolder,
  HiOutlineColorSwatch,
  HiOutlineCog,
  HiOutlineChatAlt2,
} from 'react-icons/hi';

import {
  IoDiamondOutline,
  IoLayersOutline,
  IoCubeOutline,
  IoSettingsOutline,
  IoSparklesOutline,
} from 'react-icons/io5';

import { TbCoins } from 'react-icons/tb';

export const navSections = [
  // ─── Top Single Item ──────────────────────────────────────────
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: HiOutlineHome,
  },

  // ─── 1. ANALYTICS ─────────────────────────────────────────────
  {
    id: 'analytics',
    title: 'ANALYTICS',
    icon: HiOutlineChartBar,
    children: [
      { id: 'google-analytics', title: 'Google Analytics', path: '/analytics', icon: HiOutlineTrendingUp, apiEndpoint: '/analytics/overview' },
      { id: 'reports', title: 'Reports', path: '/reports', icon: HiOutlineDocumentReport, apiEndpoint: '/analytics/overview' },
    ],
  },

  // ─── 2. CATALOG ───────────────────────────────────────────────
  {
    id: 'catalog',
    title: 'CATALOG',
    icon: IoDiamondOutline,
    children: [
      { id: 'jewelry-products', title: 'Jewellery Products', path: '/catalog/jewelry-products', icon: IoCubeOutline, apiEndpoint: '/products?productType=gold' },
      { id: 'silver-products', title: 'Silver Products', path: '/catalog/silver-products', icon: IoSparklesOutline, apiEndpoint: '/products?productType=silver' },
      { id: 'ornate-products', title: 'Ornate Products', path: '/catalog/ornate-products', icon: IoLayersOutline, apiEndpoint: '/products?isOrnate=true' },
      { id: 'categories', title: 'Categories', path: '/catalog/categories', icon: HiOutlineTag, apiEndpoint: '/categories' },
      { id: 'pricing-hub', title: 'Pricing Hub', path: '/pricing-hub/metal-rates', icon: TbCoins, apiEndpoint: '/goldprice' },
      { id: 'product-config', title: 'Product Config', path: '/metal-purity', icon: IoSettingsOutline, apiEndpoint: '/metal-purities' },
      { id: 'diamond-config', title: 'Diamond Config', path: '/diamond-types', icon: IoDiamondOutline, apiEndpoint: '/diamond-types' },
    ],
  },

  // ─── 3. SALES & ORDERS ────────────────────────────────────────
  {
    id: 'sales-orders',
    title: 'SALES & ORDERS',
    icon: HiOutlineShoppingBag,
    children: [
      { id: 'orders', title: 'Orders', path: '/orders', icon: HiOutlineShoppingBag, apiEndpoint: '/orders' },
      { id: 'returns', title: 'Returns', path: '/returns', icon: HiOutlineRefresh, apiEndpoint: '/returns' },
      { id: 'customers', title: 'Customers', path: '/customers', icon: HiOutlineUserGroup, apiEndpoint: '/users' },
      { id: 'appointments', title: 'Appointments', path: '/appointments', icon: HiOutlineCalendar, apiEndpoint: '/appointments' },
      { id: 'custom-inquiries', title: 'Custom Inquiries', path: '/custom-inquiries', icon: HiOutlineSparkles, apiEndpoint: '/custom-inquiries' },
      { id: 'cod-sequence', title: 'COD Sequence', path: '/cod-sequences', icon: HiOutlineCash, apiEndpoint: '/cod-sequences' },
    ],
  },

  // ─── 4. MARKETING ─────────────────────────────────────────────
  {
    id: 'marketing',
    title: 'MARKETING',
    icon: HiOutlineSpeakerphone,
    children: [
      { id: 'celebrate-gifts', title: 'Celebrate & Gifts', path: '/celebrate-gifts', icon: HiOutlineSparkles, apiEndpoint: '/featured' },
      { id: 'offers', title: 'Offers', path: '/coupons', icon: HiOutlineEye, apiEndpoint: '/coupons' },
      { id: 'before-after', title: 'Lookare Before/After', path: '/marketing/before-after', icon: HiOutlineMail, apiEndpoint: '/cust-jewellery-before-after' },
      { id: 'birthstones', title: 'Birthstones', path: '/birthstones', icon: IoDiamondOutline, apiEndpoint: '/birthstones' },
      { id: 'instagram', title: 'Instagram Posts', path: '/instagram-posts', icon: HiOutlineCamera, apiEndpoint: '/instagram-posts' },
    ],
  },

  // ─── 5. WEBSITE CONTENT ───────────────────────────────────────
  {
    id: 'website-content',
    title: 'WEBSITE CONTENT',
    icon: HiOutlineDocumentText,
    children: [
      { id: 'banners', title: 'Banners', path: '/banners', icon: HiOutlinePhotograph, apiEndpoint: '/banners' },
      { id: 'homepage-sections', title: 'Homepage Sections', path: '/home-sections', icon: HiOutlineTemplate, apiEndpoint: '/home-sections' },
      { id: 'announcements', title: 'Announcements', path: '/top-announcements', icon: HiOutlineSpeakerphone, apiEndpoint: '/top-announcements' },
      { id: 'blog-articles', title: 'Blog Articles', path: '/blogs', icon: HiOutlineDocumentText, apiEndpoint: '/blogs' },
      { id: 'blog-categories', title: 'Blog Categories', path: '/blog-categories', icon: HiOutlineFolder, apiEndpoint: '/blog-categories' },
      { id: 'footer-management', title: 'Footer Management', path: '/footer-settings', icon: HiOutlineTemplate, apiEndpoint: '/footer-settings' },
      { id: 'themes', title: 'Themes', path: '/website/themes', icon: HiOutlineColorSwatch, apiEndpoint: '/website/themes' },
    ],
  },

  // ─── 6. SYSTEM & SETTINGS ─────────────────────────────────────
  {
    id: 'system-settings',
    title: 'SYSTEM & SETTINGS',
    icon: HiOutlineCog,
    children: [
      { id: 'whatsapp', title: 'WhatsApp Connect', path: '/system/whatsapp', icon: HiOutlineChatAlt2 },
      { id: 'profile', title: 'User Profile & Theme', path: '/profile', icon: HiOutlineUserGroup },
      { id: 'settings', title: 'Settings', path: '/settings', icon: HiOutlineCog },
    ],
  },
];
