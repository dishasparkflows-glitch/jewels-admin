import {
  HiOutlineViewGrid,
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
  {
    id: 'main',
    title: null,
    items: [
      { id: 'dashboard', title: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
      { id: 'diamonds', title: 'Diamonds', path: '/diamonds', icon: IoDiamondOutline, apiEndpoint: '/diamonds' },
      { id: 'reviews', title: 'Reviews', path: '/reviews', icon: HiOutlineChatAlt2 },

      // ─── 1. Catalog (Matches User Screenshot) ───
      {
        id: 'catalog',
        title: 'Catalog',
        path: '/catalog',
        icon: IoLayersOutline,
        children: [
          { title: 'Jewelry Products', path: '/catalog/jewelry-products', icon: IoCubeOutline, apiEndpoint: '/products?productType=Jewelry' },
          { title: 'Silver Products', path: '/catalog/silver-products', icon: IoCubeOutline, apiEndpoint: '/products?productType=Silver' },
          { title: 'Ornate Products', path: '/catalog/ornate-products', icon: IoDiamondOutline, apiEndpoint: '/products?isOrnate=true' },
          { title: 'Categories', path: '/catalog/categories', icon: IoLayersOutline, apiEndpoint: '/categories' },
          { title: 'Navigation Menus', path: '/catalog/navigation-menus', icon: IoMapOutline, apiEndpoint: '/navigation-menus' },
        ],
      },

      // ─── 2. Pricing Hub (Matches User Screenshot) ───
      {
        id: 'pricing-hub',
        title: 'Pricing Hub',
        path: '/pricing-hub',
        icon: TbCoins,
        children: [
          { title: 'Metal Rates', path: '/pricing-hub/metal-rates', icon: TbCoins, apiEndpoint: '/goldprice' },
          { title: 'Diamond rates', path: '/pricing-hub/diamond-rates', icon: IoDiamondOutline, apiEndpoint: '/diamond-prices' },
          { title: 'Currencies', path: '/currencies', icon: TbCurrencyDollar, apiEndpoint: '/currencies' },
        ],
      },

      // ─── 3. Product Config (Matches User Screenshot) ───
      {
        id: 'product-config',
        title: 'Product Config',
        path: '/product-config',
        icon: IoSettingsOutline,
        children: [
          { title: 'Metal Purity', path: '/metal-purity', icon: IoSparklesOutline, apiEndpoint: '/metal-purities' },
          { title: 'Metal Color', path: '/metal-color', icon: IoColorPaletteOutline, apiEndpoint: '/metal-colors' },
          { title: 'Sizes', path: '/sizes', icon: TbRuler2, apiEndpoint: '/sizes' },
          { title: 'VTO Masters', path: '/vto-masters', icon: IoSparklesOutline, apiEndpoint: '/vto-masters' },
        ],
      },

      // ─── 4. Diamond Config (Matches User Screenshot) ───
      {
        id: 'diamond-config',
        title: 'Diamond Config',
        path: '/diamond-config',
        icon: IoDiamondOutline,
        children: [
          { title: 'Diamond Types', path: '/diamond-types', icon: IoDiamondOutline, apiEndpoint: '/diamond-types' },
          { title: 'Diamond Shapes', path: '/diamond-shapes', icon: TbCircleOff, apiEndpoint: '/diamond-shapes' },
          { title: 'Diamond Color', path: '/diamond-color', icon: IoColorPaletteOutline, apiEndpoint: '/diamond-colors' },
          { title: 'Diamond Clarity', path: '/diamond-clarity', icon: IoDiamondOutline, apiEndpoint: '/diamond-clarities' },
          { title: 'Diamond Size', path: '/diamond-size', icon: IoDiamondOutline, apiEndpoint: '/diamond-sizes' },
        ],
      },
    ],
  },
  {
    id: 'orders-sales',
    title: 'SALES & ORDERS',
    items: [
      { id: 'orders', title: 'Orders', path: '/orders', icon: HiOutlineShoppingBag },
      { id: 'returns', title: 'Returns', path: '/returns', icon: HiOutlineRefresh },
      { id: 'cod-sequence', title: 'COD Sequence', path: '/cod-sequences', icon: HiOutlineCash },
      { id: 'customers', title: 'Customers', path: '/customers', icon: HiOutlineUserGroup },
      { id: 'appointments', title: 'Appointments', path: '/appointments', icon: HiOutlineCalendar },
      { id: 'custom-inquiries', title: 'Custom Inquiries', path: '/custom-inquiries', icon: HiOutlineSparkles },
    ],
  },
  {
    id: 'marketing',
    title: 'MARKETING',
    items: [
      { id: 'home-sections', title: 'Home Sections', path: '/home-sections', icon: HiOutlineTemplate, apiEndpoint: '/home-sections' },
      { id: 'celebrate-gifts', title: 'Celebrate & Gifts', path: '/celebrate-gifts', icon: IoDiamondOutline, apiEndpoint: '/featured' },
      { id: 'banners', title: 'Banners', path: '/banners', icon: HiOutlinePhotograph, apiEndpoint: '/banners' },
      { id: 'offers', title: 'Offers', path: '/coupons', icon: HiOutlineTicket, apiEndpoint: '/coupons' },
      { id: 'top-announcement', title: 'Top Announcement', path: '/top-announcement', icon: HiOutlineSpeakerphone, apiEndpoint: '/top-announcements' },
      { id: 'before-after', title: 'Lookare Before/After', path: '/marketing/before-after', icon: HiOutlineEye, apiEndpoint: '/cust-jewellery-before-after' },
      { id: 'birthstones', title: 'Birthstones', path: '/birthstones', icon: IoDiamondOutline, apiEndpoint: '/birthstones' },
      { id: 'instagram', title: 'Instagram Posts', path: '/instagram-posts', icon: HiOutlineCamera, apiEndpoint: '/instagram-posts' },
      { id: 'footer-management', title: 'Footer Management', path: '/footer-settings', icon: HiOutlineTemplate, apiEndpoint: '/footer-settings' },
    ],
  },
  {
    id: 'system',
    title: 'SYSTEM',
    items: [
      { id: 'whatsapp', title: 'WhatsApp Connect', path: '/system/whatsapp', icon: HiOutlineChatAlt2 },
      { id: 'profile', title: 'User Profile & Theme', path: '/profile', icon: HiOutlineColorSwatch },
      { id: 'settings', title: 'Settings', path: '/settings', icon: HiOutlineCog },
    ],
  },
];
