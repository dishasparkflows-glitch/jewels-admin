import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineRefresh,
  HiOutlineCash,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlinePhotograph,
  HiOutlineEye,
  HiOutlineTicket,
  HiOutlineColorSwatch,
  HiOutlineCamera,
  HiOutlineTemplate,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineSpeakerphone,
  HiOutlineBookOpen,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

import {
  IoDiamondOutline,
  IoColorPaletteOutline,
  IoSettingsOutline,
  IoSparklesOutline,
  IoLayersOutline,
  IoCubeOutline,
  IoMapOutline,
} from 'react-icons/io5';

import {
  TbCoins,
  TbRuler2,
  TbCircleOff,
  TbCurrencyDollar,
} from 'react-icons/tb';

export const navSections = [
  // ─── Main Direct Access Items ──────────────────────────────────────────
  {
    id: 'main',
    title: null,
    items: [
      { id: 'dashboard', title: 'Dashboard', path: '/dashboard', icon: HiOutlineHome },
      { id: 'custom-inquiries', title: 'Custom Inquiries', path: '/custom-inquiries', icon: HiOutlineSparkles, apiEndpoint: '/custom-inquiries' },
      { id: 'diamonds', title: 'Diamonds', path: '/diamonds', icon: IoDiamondOutline, apiEndpoint: '/diamonds' },
      { id: 'reviews', title: 'Reviews', path: '/reviews', icon: HiOutlineChatAlt2 },
      { id: 'reports', title: 'Reports', path: '/reports', icon: HiOutlineDocumentReport, apiEndpoint: '/analytics/overview' },

      // ─── 1. Catalog (Collapsible Submenu) ─────────────────────────────
      {
        id: 'catalog',
        title: 'Catalog',
        path: '/catalog',
        icon: IoLayersOutline,
        children: [
          { id: 'jewelry-products', title: 'Jewellery Products', path: '/catalog/jewelry-products', icon: IoCubeOutline, apiEndpoint: '/products?productType=gold' },
          { id: 'silver-products', title: 'Silver Products', path: '/catalog/silver-products', icon: IoSparklesOutline, apiEndpoint: '/products?productType=silver' },
          { id: 'ornate-products', title: 'Ornate Products', path: '/catalog/ornate-products', icon: IoLayersOutline, apiEndpoint: '/products?isOrnate=true' },
          { id: 'categories', title: 'Categories', path: '/catalog/categories', icon: HiOutlineTag, apiEndpoint: '/categories' },
          { id: 'navigation-menus', title: 'Navigation Menus', path: '/catalog/navigation-menus', icon: IoMapOutline, apiEndpoint: '/categories' },
        ],
      },

      // ─── 2. Pricing Hub (Collapsible Submenu - Matches Portal Screenshot) ─
      {
        id: 'pricing-hub',
        title: 'Pricing Hub',
        path: '/pricing-hub',
        icon: TbCoins,
        children: [
          { id: 'metal-rates', title: 'Metal Rates', path: '/pricing-hub/metal-rates', icon: TbCoins, apiEndpoint: '/goldprice' },
          { id: 'diamond-rates', title: 'Diamond rates', path: '/pricing-hub/diamond-rates', icon: IoDiamondOutline, apiEndpoint: '/diamond-prices' },
          { id: 'currencies', title: 'Currencies', path: '/currencies', icon: TbCurrencyDollar, apiEndpoint: '/currencies' },
        ],
      },

      // ─── 3. Product Config (Collapsible Submenu - Matches Portal Screenshot) ─
      {
        id: 'product-config',
        title: 'Product Config',
        path: '/product-config',
        icon: IoSettingsOutline,
        children: [
          { id: 'metal-purity', title: 'Metal Purity', path: '/metal-purity', icon: IoSparklesOutline, apiEndpoint: '/metal-purities' },
          { id: 'metal-color', title: 'Metal Color', path: '/metal-color', icon: IoColorPaletteOutline, apiEndpoint: '/metal-colors' },
          { id: 'sizes', title: 'Sizes', path: '/sizes', icon: TbRuler2, apiEndpoint: '/sizes' },
          { id: 'vto-masters', title: 'VTO Masters', path: '/vto-masters', icon: IoSparklesOutline, apiEndpoint: '/vto-masters' },
        ],
      },

      // ─── 4. Diamond Config (Collapsible Submenu - Matches Portal Screenshot) ─
      {
        id: 'diamond-config',
        title: 'Diamond Config',
        path: '/diamond-config',
        icon: IoDiamondOutline,
        children: [
          { id: 'diamond-types', title: 'Diamond Types', path: '/diamond-types', icon: IoDiamondOutline, apiEndpoint: '/diamond-types' },
          { id: 'diamond-shapes', title: 'Diamond Shapes', path: '/diamond-shapes', icon: TbCircleOff, apiEndpoint: '/diamond-shapes' },
          { id: 'diamond-color', title: 'Diamond Color', path: '/diamond-color', icon: IoColorPaletteOutline, apiEndpoint: '/diamond-colors' },
          { id: 'diamond-clarity', title: 'Diamond Clarity', path: '/diamond-clarity', icon: IoDiamondOutline, apiEndpoint: '/diamond-clarities' },
          { id: 'diamond-size', title: 'Diamond Size', path: '/diamond-size', icon: IoDiamondOutline, apiEndpoint: '/diamond-sizes' },
        ],
      },
    ],
  },

  // ─── Marketing Section ───────────────────────────────────────────────
  {
    id: 'marketing',
    title: 'MARKETING',
    items: [
      { id: 'home-sections', title: 'Home Sections', path: '/home-sections', icon: HiOutlineTemplate, apiEndpoint: '/home-sections' },
      { id: 'celebrate-gifts', title: 'Celebrate & Gifts', path: '/celebrate-gifts', icon: IoDiamondOutline, apiEndpoint: '/featured' },
      { id: 'banners', title: 'Banners', path: '/banners', icon: HiOutlinePhotograph, apiEndpoint: '/banners' },
      { id: 'offers', title: 'Offers', path: '/coupons', icon: HiOutlineTicket, apiEndpoint: '/coupons' },
      { id: 'top-announcement', title: 'Top Announcement', path: '/top-announcements', icon: HiOutlineSpeakerphone, apiEndpoint: '/top-announcements' },
      { id: 'before-after', title: 'Lookare Before/After', path: '/marketing/before-after', icon: HiOutlineEye, apiEndpoint: '/cust-jewellery-before-after' },
      { id: 'birthstones', title: 'Birthstones', path: '/birthstones', icon: IoDiamondOutline, apiEndpoint: '/birthstones' },
      { id: 'instagram', title: 'Instagram Posts', path: '/instagram-posts', icon: HiOutlineCamera, apiEndpoint: '/instagram-posts' },
      { id: 'blogs', title: 'Blog Articles', path: '/blogs', icon: HiOutlineBookOpen, apiEndpoint: '/blogs' },
      { id: 'blog-categories', title: 'Blog Categories', path: '/blog-categories', icon: HiOutlineTag, apiEndpoint: '/blog-categories' },
      { id: 'footer-management', title: 'Footer Management', path: '/footer-settings', icon: HiOutlineTemplate, apiEndpoint: '/footer-settings' },
    ],
  },

  // ─── Sales & Orders Section ──────────────────────────────────────────
  {
    id: 'sales-orders',
    title: 'SALES & ORDERS',
    items: [
      { id: 'orders', title: 'Orders', path: '/orders', icon: HiOutlineShoppingBag, apiEndpoint: '/orders' },
      { id: 'returns', title: 'Returns', path: '/returns', icon: HiOutlineRefresh, apiEndpoint: '/returns' },
      { id: 'cod-sequence', title: 'COD Sequence', path: '/cod-sequences', icon: HiOutlineCash, apiEndpoint: '/cod-sequences' },
      { id: 'customers', title: 'Customers', path: '/customers', icon: HiOutlineUserGroup, apiEndpoint: '/users' },
      { id: 'appointments', title: 'Appointments', path: '/appointments', icon: HiOutlineCalendar, apiEndpoint: '/appointments' },
    ],
  },

  // ─── Website Section ─────────────────────────────────────────────────
  {
    id: 'website',
    title: 'WEBSITE',
    items: [
      { id: 'website-themes', title: 'Themes', path: '/website/themes', icon: HiOutlineColorSwatch, apiEndpoint: '/website/themes' },
    ],
  },

  // ─── System & Settings Section ───────────────────────────────────────
  {
    id: 'system',
    title: 'SYSTEM & SETTINGS',
    items: [
      { id: 'whatsapp', title: 'WhatsApp Connect', path: '/system/whatsapp', icon: HiOutlineChatAlt2 },
      { id: 'profile', title: 'User Profile & Theme', path: '/profile', icon: HiOutlineUserGroup },
      { id: 'settings', title: 'Settings', path: '/settings', icon: HiOutlineCog },
    ],
  },
];
