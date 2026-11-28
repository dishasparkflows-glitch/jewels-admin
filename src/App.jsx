import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ImagePreviewProvider } from './contexts/ImagePreviewContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import { adminPages } from './utils/routeLoaders';
import { getFirstAllowedPath, isPathAllowed } from './utils/moduleAccess';

function RootRedirect() {
  const { allowedModules, dbModules } = useAuth();
  const target = isPathAllowed('/dashboard', allowedModules, dbModules)
    ? '/dashboard'
    : (getFirstAllowedPath(allowedModules, dbModules) || '/dashboard');
  return <Navigate to={target} replace />;
}

const {
  Login,
  ForgotPassword,
  ResetPassword,
  Dashboard,
  OrdersView,
  CodSequencesView,
  CustomersView,
  AppointmentsView,
  CustomInquiriesView,
  ReviewsView,
  SettingsView,
  InstagramPostsView,
  BirthstonePortfolioView,
  CouponsView,
  CelebrateGiftsView,
  TopAnnouncementView,
  DiamondsView,
  AddDiamonds,
  BannersView,
  HomeSectionsView,
  DiamondTypesView,
  DiamondShapesView,
  DiamondColorsView,
  DiamondClaritiesView,
  DiamondSizesView,
  GemstoneTypesView,
  GemstoneShapesView,
  MetalPuritiesView,
  MetalColorsView,
  SizesView,
  VtoMastersView,
  AddJewelryProduct,
  OrnateProductsView,
  OrnateProductEdit,
  CategoryFiltersView,
  NavigationMenusView,
  WhatsAppView,
  MetalRatesView,
  DiamondPricingMasterView,
  CurrenciesView,
  BeforeAfterView,
  BlogsView,
  WriteBlogView,
  BlogCategoriesView,
  DynamicModuleView,
  ProfileView,
  AnalyticsView,
  StaticPagesView,
  StoresView,
  ThemesView,
  GalleryView,
  OwnersView,
  NotificationsView,
} = adminPages;

function App() {
  useEffect(() => {
    const handleCheckboxEnter = (e) => {
      if (e.key !== 'Enter') return;
      const target = e.target;
      if (!target || target.disabled || target.readOnly) return;
      const isNativeCheckbox = target.tagName === 'INPUT' && target.type === 'checkbox';
      const isRoleCheckbox =
        target.getAttribute?.('role') === 'checkbox' && target.tagName !== 'BUTTON';
      if (isNativeCheckbox || isRoleCheckbox) {
        e.preventDefault();
        e.stopPropagation();
        target.click();
      }
    };
    document.addEventListener('keydown', handleCheckboxEnter, true);
    return () => document.removeEventListener('keydown', handleCheckboxEnter, true);
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <ConfirmProvider>
            <ImagePreviewProvider>
            <Toaster
              position="top-right"
              containerStyle={{
                top: 20,
                right: 20,
                zIndex: 999999,
              }}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1b1b1b',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  border: '1px solid #333',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                },
              }}
            >
              {(t) => (
                <ToastBar toast={t}>
                  {({ icon, message }) => (
                    <div className="flex items-center gap-2 w-full">
                      {icon}
                      <div className="flex-1 text-xs sm:text-[13px] font-medium leading-snug">{message}</div>
                      {t.type !== 'loading' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.dismiss(t.id);
                          }}
                          className="ml-1 p-1 rounded-md text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                          title="Close"
                          aria-label="Close notification"
                        >
                          <HiOutlineX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </ToastBar>
              )}
            </Toaster>

        <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
        <Routes>
          {/* Public Login & Password Recovery Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Luxury Portal Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<AnalyticsView />} />

            {/* Catalog Module */}
            <Route path="/catalog" element={<Navigate to="/catalog/jewelry-products" replace />} />
            <Route path="/catalog/jewelry-products/add" element={<AddJewelryProduct />} />
            <Route path="/catalog/jewelry-products/edit/:id" element={<AddJewelryProduct />} />
            <Route path="/catalog/silver-products/add" element={<AddJewelryProduct />} />
            <Route path="/catalog/silver-products/edit/:id" element={<AddJewelryProduct />} />
            <Route path="/catalog/ornate-products" element={<OrnateProductsView />} />
            <Route path="/catalog/ornate-products/add" element={<OrnateProductEdit />} />
            <Route path="/catalog/ornate-products/edit/:id" element={<OrnateProductEdit />} />
            <Route path="/catalog/category-filters" element={<CategoryFiltersView />} />
            <Route path="/catalog/navigation-menus" element={<NavigationMenusView />} />

            {/* Pricing Hub */}
            <Route path="/pricing-hub" element={<Navigate to="/pricing-hub/metal-rates" replace />} />
            <Route path="/pricing-hub/metal-rates" element={<MetalRatesView />} />
            <Route path="/pricing-hub/diamond-rates" element={<DiamondPricingMasterView />} />
            <Route path="/currencies" element={<CurrenciesView />} />

            {/* Product Config */}
            <Route path="/product-config" element={<Navigate to="/metal-purity" replace />} />
            <Route path="/metal-purity" element={<MetalPuritiesView />} />
            <Route path="/metal-color" element={<MetalColorsView />} />
            <Route path="/sizes" element={<SizesView />} />
            <Route path="/vto-masters" element={<VtoMastersView />} />

            {/* Diamond Config */}
            <Route path="/diamond-config" element={<Navigate to="/diamond-types" replace />} />
            <Route path="/diamond-types" element={<DiamondTypesView />} />
            <Route path="/diamond-shapes" element={<DiamondShapesView />} />
            <Route path="/diamond-color" element={<DiamondColorsView />} />
            <Route path="/diamond-clarity" element={<DiamondClaritiesView />} />
            <Route path="/diamond-size" element={<DiamondSizesView />} />

            {/* Gemstone Config */}
            <Route path="/gemstone-config" element={<Navigate to="/gemstone-types" replace />} />
            <Route path="/gemstone-types" element={<GemstoneTypesView />} />
            <Route path="/gemstone-shapes" element={<GemstoneShapesView />} />

            {/* Diamonds Module */}
            <Route path="/diamonds" element={<DiamondsView />} />
            <Route path="/diamonds/add" element={<AddDiamonds />} />
            <Route path="/diamonds/edit/:id" element={<AddDiamonds />} />

            {/* Sales & Orders */}
            <Route path="/orders" element={<OrdersView />} />
            <Route path="/customers" element={<CustomersView />} />
            <Route path="/appointments" element={<AppointmentsView />} />
            <Route path="/custom-inquiries" element={<CustomInquiriesView />} />
            <Route path="/reviews" element={<ReviewsView />} />
            <Route path="/cod-sequences" element={<CodSequencesView />} />

            {/* Marketing & Content */}
            <Route path="/home-sections" element={<HomeSectionsView />} />
            <Route path="/banners" element={<BannersView />} />
            <Route path="/banners/:typeKey" element={<BannersView />} />
            <Route path="/banners/:typeKey/edit/:bannerId" element={<BannersView />} />
            <Route path="/celebrate-gifts" element={<CelebrateGiftsView />} />
            <Route path="/coupons" element={<CouponsView />} />
            <Route path="/birthstones" element={<BirthstonePortfolioView />} />
            <Route path="/marketing/before-after" element={<BeforeAfterView />} />
            <Route path="/top-announcements" element={<TopAnnouncementView />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/themes" element={<ThemesView />} />
            <Route path="/instagram-posts" element={<InstagramPostsView />} />
            <Route path="/blogs" element={<BlogsView />} />
            <Route path="/blogs/write" element={<WriteBlogView />} />
            <Route path="/blogs/edit/:id" element={<WriteBlogView />} />
            <Route path="/blog-categories" element={<BlogCategoriesView />} />
            <Route path="/static-pages" element={<StaticPagesView />} />

            {/* Business Ops & Administration */}
            <Route path="/stores" element={<StoresView />} />
            <Route path="/system/whatsapp" element={<WhatsAppView />} />
            <Route path="/notifications" element={<NotificationsView />} />
            <Route path="/owners" element={<OwnersView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/profile" element={<ProfileView />} />

            {/* Senior Dynamic View for all Config & Catalog modules */}
            <Route path="*" element={<DynamicModuleView />} />
          </Route>
        </Routes>
        </Suspense>
            </ImagePreviewProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
