import { lazy } from 'react';

function lazyWithPreload(importer) {
  let loaded = false;
  const load = () => {
    if (!loaded) {
      loaded = true;
    }
    return importer();
  };
  const Component = lazy(load);
  Component.preload = load;
  return Component;
}

export const adminPages = {
  Login: lazyWithPreload(() => import('../pages/auth/Login')),
  ForgotPassword: lazyWithPreload(() => import('../pages/auth/ForgotPassword')),
  ResetPassword: lazyWithPreload(() => import('../pages/auth/ResetPassword')),
  Dashboard: lazyWithPreload(() => import('../pages/admin/Dashboard')),
  OrdersView: lazyWithPreload(() => import('../pages/admin/OrdersView')),
  CodSequencesView: lazyWithPreload(() => import('../pages/admin/CodSequencesView')),
  CustomersView: lazyWithPreload(() => import('../pages/admin/CustomersView')),
  AppointmentsView: lazyWithPreload(() => import('../pages/admin/AppointmentsView')),
  CustomInquiriesView: lazyWithPreload(() => import('../pages/admin/CustomInquiriesView')),
  ReviewsView: lazyWithPreload(() => import('../pages/admin/ReviewsView')),
  SettingsView: lazyWithPreload(() => import('../pages/admin/SettingsView')),
  InstagramPostsView: lazyWithPreload(() => import('../pages/admin/InstagramPostsView')),
  BirthstonePortfolioView: lazyWithPreload(() => import('../pages/admin/BirthstonePortfolioView')),
  CouponsView: lazyWithPreload(() => import('../pages/admin/CouponsView')),
  CelebrateGiftsView: lazyWithPreload(() => import('../pages/admin/CelebrateGiftsView')),
  TopAnnouncementView: lazyWithPreload(() => import('../pages/admin/TopAnnouncementView')),
  DiamondsView: lazyWithPreload(() => import('../pages/admin/DiamondsView')),
  AddDiamonds: lazyWithPreload(() => import('../pages/admin/AddDiamonds')),
  BannersView: lazyWithPreload(() => import('../pages/admin/BannersView')),
  HomeSectionsView: lazyWithPreload(() => import('../pages/admin/HomeSectionsView')),
  DiamondTypesView: lazyWithPreload(() => import('../pages/admin/DiamondTypesView')),
  DiamondShapesView: lazyWithPreload(() => import('../pages/admin/DiamondShapesView')),
  DiamondColorsView: lazyWithPreload(() => import('../pages/admin/DiamondColorsView')),
  DiamondClaritiesView: lazyWithPreload(() => import('../pages/admin/DiamondClaritiesView')),
  DiamondSizesView: lazyWithPreload(() => import('../pages/admin/DiamondSizesView')),
  GemstoneTypesView: lazyWithPreload(() => import('../pages/admin/GemstoneTypesView')),
  GemstoneShapesView: lazyWithPreload(() => import('../pages/admin/GemstoneShapesView')),
  MetalPuritiesView: lazyWithPreload(() => import('../pages/admin/MetalPuritiesView')),
  MetalColorsView: lazyWithPreload(() => import('../pages/admin/MetalColorsView')),
  SizesView: lazyWithPreload(() => import('../pages/admin/SizesView')),
  VtoMastersView: lazyWithPreload(() => import('../pages/admin/VtoMastersView')),
  AddJewelryProduct: lazyWithPreload(() => import('../pages/admin/AddJewelryProduct')),
  OrnateProductsView: lazyWithPreload(() => import('../pages/admin/OrnateProductsView')),
  OrnateProductEdit: lazyWithPreload(() => import('../pages/admin/OrnateProductEdit')),
  CategoryFiltersView: lazyWithPreload(() => import('../pages/admin/CategoryFiltersView')),
  NavigationMenusView: lazyWithPreload(() => import('../pages/admin/NavigationMenusView')),
  WhatsAppView: lazyWithPreload(() => import('../pages/admin/WhatsAppView')),
  MetalRatesView: lazyWithPreload(() => import('../pages/admin/MetalRatesView')),
  DiamondPricingMasterView: lazyWithPreload(() => import('../pages/admin/DiamondPricingMasterView')),
  CurrenciesView: lazyWithPreload(() => import('../pages/admin/CurrenciesView')),
  BeforeAfterView: lazyWithPreload(() => import('../pages/admin/BeforeAfterView')),
  BlogsView: lazyWithPreload(() => import('../pages/admin/BlogsView')),
  WriteBlogView: lazyWithPreload(() => import('../pages/admin/WriteBlogView')),
  BlogCategoriesView: lazyWithPreload(() => import('../pages/admin/BlogCategoriesView')),
  DynamicModuleView: lazyWithPreload(() => import('../pages/admin/DynamicModuleView')),
  ProfileView: lazyWithPreload(() => import('../pages/admin/ProfileView')),
  AnalyticsView: lazyWithPreload(() => import('../pages/admin/AnalyticsView')),
  StaticPagesView: lazyWithPreload(() => import('../pages/admin/StaticPagesView')),
  ThemesView: lazyWithPreload(() => import('../pages/admin/ThemesView')),
  GalleryView: lazyWithPreload(() => import('../pages/admin/GalleryView')),
  OwnersView: lazyWithPreload(() => import('../pages/admin/OwnersView')),
  NotificationsView: lazyWithPreload(() => import('../pages/admin/NotificationsView')),
};

const PATH_TO_PAGE = {
  '/dashboard': adminPages.Dashboard,
  '/analytics': adminPages.AnalyticsView,
  '/reports': adminPages.AnalyticsView,
  '/collections': adminPages.OrnateProductsView,
  '/catalog/jewelry-products': adminPages.DynamicModuleView,
  '/catalog/silver-products': adminPages.DynamicModuleView,
  '/catalog/categories': adminPages.DynamicModuleView,
  '/catalog/ornate-products': adminPages.OrnateProductsView,
  '/ornate-products': adminPages.OrnateProductsView,
  '/catalog/category-filters': adminPages.CategoryFiltersView,
  '/catalog/navigation-menus': adminPages.NavigationMenusView,
  '/diamonds': adminPages.DiamondsView,
  '/diamonds/add': adminPages.AddDiamonds,
  '/pricing-hub/metal-rates': adminPages.MetalRatesView,
  '/pricing-hub/diamond-rates': adminPages.DiamondPricingMasterView,
  '/currencies': adminPages.CurrenciesView,
  '/metal-purity': adminPages.MetalPuritiesView,
  '/metal-color': adminPages.MetalColorsView,
  '/sizes': adminPages.SizesView,
  '/vto-masters': adminPages.VtoMastersView,
  '/diamond-types': adminPages.DiamondTypesView,
  '/diamond-shapes': adminPages.DiamondShapesView,
  '/diamond-color': adminPages.DiamondColorsView,
  '/diamond-clarity': adminPages.DiamondClaritiesView,
  '/diamond-size': adminPages.DiamondSizesView,
  '/gemstone-types': adminPages.GemstoneTypesView,
  '/gemstone-shapes': adminPages.GemstoneShapesView,
  '/orders': adminPages.OrdersView,
  '/returns': adminPages.DynamicModuleView,
  '/custom-inquiries': adminPages.CustomInquiriesView,
  '/cod-sequences': adminPages.CodSequencesView,
  '/customers': adminPages.CustomersView,
  '/appointments': adminPages.AppointmentsView,
  '/reviews': adminPages.ReviewsView,
  '/home-sections': adminPages.HomeSectionsView,
  '/banners': adminPages.BannersView,
  '/celebrate-gifts': adminPages.CelebrateGiftsView,
  '/coupons': adminPages.CouponsView,
  '/birthstones': adminPages.BirthstonePortfolioView,
  '/marketing/before-after': adminPages.BeforeAfterView,
  '/gallery': adminPages.GalleryView,
  '/themes': adminPages.ThemesView,
  '/instagram-posts': adminPages.InstagramPostsView,
  '/blogs': adminPages.BlogsView,
  '/blog-categories': adminPages.BlogCategoriesView,
  '/static-pages': adminPages.StaticPagesView,
  '/system/whatsapp': adminPages.WhatsAppView,
  '/notifications': adminPages.NotificationsView,
  '/owners': adminPages.OwnersView,
  '/profile': adminPages.ProfileView,
  '/settings': adminPages.SettingsView,
};

/**
 * Preload a lazy route chunk before navigation so tab jumps happen without
 * Suspense pauses or blank flashes.
 */
export function preloadRoute(path) {
  if (!path) return;
  const page = PATH_TO_PAGE[path] || adminPages.DynamicModuleView;
  page?.preload?.();
}

/**
 * Quietly warm up frequently used admin modules after initial render settles.
 */
export function preloadCoreRoutes() {
  const core = [
    adminPages.Dashboard,
    adminPages.OrdersView,
    adminPages.CustomersView,
    adminPages.AppointmentsView,
    adminPages.ReviewsView,
    adminPages.OrnateProductsView,
    adminPages.DynamicModuleView,
  ];
  core.forEach((page) => page?.preload?.());
}
