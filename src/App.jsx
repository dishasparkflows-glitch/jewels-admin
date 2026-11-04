import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ImagePreviewProvider } from './contexts/ImagePreviewContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
// Lazy-loaded Admin Page Views for dynamic code-splitting & fast build
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const CodSequencesView = lazy(() => import('./pages/admin/CodSequencesView'));
const CustomersView = lazy(() => import('./pages/admin/CustomersView'));
const AppointmentsView = lazy(() => import('./pages/admin/AppointmentsView'));
const CustomInquiriesView = lazy(() => import('./pages/admin/CustomInquiriesView'));
const ReviewsView = lazy(() => import('./pages/admin/ReviewsView'));
const SettingsView = lazy(() => import('./pages/admin/SettingsView'));
const FooterSettingsView = lazy(() => import('./pages/admin/FooterSettingsView'));
const InstagramPostsView = lazy(() => import('./pages/admin/InstagramPostsView'));
const BirthstonePortfolioView = lazy(() => import('./pages/admin/BirthstonePortfolioView'));
const CouponsView = lazy(() => import('./pages/admin/CouponsView'));
const CelebrateGiftsView = lazy(() => import('./pages/admin/CelebrateGiftsView'));
const TopAnnouncementView = lazy(() => import('./pages/admin/TopAnnouncementView'));
const DiamondsView = lazy(() => import('./pages/admin/DiamondsView'));
const AddDiamonds = lazy(() => import('./pages/admin/AddDiamonds'));
const BannersView = lazy(() => import('./pages/admin/BannersView'));
const HomeSectionsView = lazy(() => import('./pages/admin/HomeSectionsView'));
const DiamondTypesView = lazy(() => import('./pages/admin/DiamondTypesView'));
const DiamondShapesView = lazy(() => import('./pages/admin/DiamondShapesView'));
const DiamondColorsView = lazy(() => import('./pages/admin/DiamondColorsView'));
const DiamondClaritiesView = lazy(() => import('./pages/admin/DiamondClaritiesView'));
const DiamondSizesView = lazy(() => import('./pages/admin/DiamondSizesView'));
const MetalPuritiesView = lazy(() => import('./pages/admin/MetalPuritiesView'));
const MetalColorsView = lazy(() => import('./pages/admin/MetalColorsView'));
const SizesView = lazy(() => import('./pages/admin/SizesView'));
const VtoMastersView = lazy(() => import('./pages/admin/VtoMastersView'));
const AddJewelryProduct = lazy(() => import('./pages/admin/AddJewelryProduct'));
const OrnateProductsView = lazy(() => import('./pages/admin/OrnateProductsView'));
const OrnateProductEdit = lazy(() => import('./pages/admin/OrnateProductEdit'));
const CategoryFiltersView = lazy(() => import('./pages/admin/CategoryFiltersView'));
const NavigationMenusView = lazy(() => import('./pages/admin/NavigationMenusView'));
const WhatsAppView = lazy(() => import('./pages/admin/WhatsAppView'));
const MetalRatesView = lazy(() => import('./pages/admin/MetalRatesView'));
const DiamondPricingMasterView = lazy(() => import('./pages/admin/DiamondPricingMasterView'));
const CurrenciesView = lazy(() => import('./pages/admin/CurrenciesView'));
const BeforeAfterView = lazy(() => import('./pages/admin/BeforeAfterView'));
const BlogsView = lazy(() => import('./pages/admin/BlogsView'));
const WriteBlogView = lazy(() => import('./pages/admin/WriteBlogView'));
const BlogCategoriesView = lazy(() => import('./pages/admin/BlogCategoriesView'));
const DynamicModuleView = lazy(() => import('./pages/admin/DynamicModuleView'));
const ProfileView = lazy(() => import('./pages/admin/ProfileView'));
const AnalyticsView = lazy(() => import('./pages/admin/AnalyticsView'));
const StaticPagesView = lazy(() => import('./pages/admin/StaticPagesView'));
const WebsiteThemesView = lazy(() => import('./pages/admin/WebsiteThemesView'));
const GalleryView = lazy(() => import('./pages/admin/GalleryView'));

const AdminPageLoader = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-stone-400 gap-3">
    <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8b6f4e] rounded-full animate-spin" />
    <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">Loading view...</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
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

        <Suspense fallback={<AdminPageLoader />}>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Luxury Portal Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/reports" element={<AnalyticsView />} />
            <Route path="/collections" element={<OrnateProductsView />} />

            {/* Parent Route Auto-Redirects to First Submenu Page */}
            <Route path="/catalog" element={<Navigate to="/catalog/jewelry-products" replace />} />
            <Route path="/pricing-hub" element={<Navigate to="/pricing-hub/metal-rates" replace />} />
            <Route path="/product-config" element={<Navigate to="/metal-purity" replace />} />
            <Route path="/diamond-config" element={<Navigate to="/diamond-types" replace />} />
            <Route path="/sales-orders" element={<Navigate to="/orders" replace />} />
            <Route path="/orders-sales" element={<Navigate to="/orders" replace />} />
            <Route path="/customer-hub" element={<Navigate to="/customers" replace />} />

            {/* Exact Screenshot Views */}
            <Route path="/cod-sequences" element={<CodSequencesView />} />
            <Route path="/cod-sequence" element={<CodSequencesView />} />
            <Route path="/customers" element={<CustomersView />} />
            <Route path="/appointments" element={<AppointmentsView />} />
            <Route path="/custom-inquiries" element={<CustomInquiriesView />} />
            <Route path="/reviews" element={<ReviewsView />} />
            {/* Luxury Diamond Module (Matches Exact User Screenshot at /diamonds/add) */}
            <Route path="/diamonds/add" element={<AddDiamonds />} />
            <Route path="/diamonds/new" element={<AddDiamonds />} />
            <Route path="/diamonds" element={<DiamondsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/footer-settings" element={<FooterSettingsView />} />
            <Route path="/marketing/footer" element={<FooterSettingsView />} />
            <Route path="/instagram-posts" element={<InstagramPostsView />} />
            <Route path="/marketing/instagram" element={<InstagramPostsView />} />
            <Route path="/birthstones" element={<BirthstonePortfolioView />} />
            <Route path="/marketing/birthstones" element={<BirthstonePortfolioView />} />
            <Route path="/coupons" element={<CouponsView />} />
            <Route path="/marketing/coupons" element={<CouponsView />} />
            <Route path="/celebrate-gifts" element={<CelebrateGiftsView />} />
            <Route path="/marketing/gifts" element={<CelebrateGiftsView />} />
            <Route path="/marketing/celebrate-gifts" element={<CelebrateGiftsView />} />
            <Route path="/top-announcement" element={<TopAnnouncementView />} />
            <Route path="/top-announcements" element={<TopAnnouncementView />} />
            <Route path="/marketing/top-announcement" element={<TopAnnouncementView />} />
            <Route path="/marketing/announcements" element={<TopAnnouncementView />} />
            <Route path="/banners" element={<BannersView />} />
            <Route path="/banners/:typeKey" element={<BannersView />} />
            <Route path="/banners/:typeKey/new" element={<BannersView />} />
            <Route path="/banners/:typeKey/edit/:bannerId" element={<BannersView />} />
            <Route path="/marketing/banners" element={<BannersView />} />
            <Route path="/marketing/banners/:typeKey" element={<BannersView />} />
            <Route path="/marketing/banners/:typeKey/new" element={<BannersView />} />
            <Route path="/marketing/banners/:typeKey/edit/:bannerId" element={<BannersView />} />
            <Route path="/website-sections" element={<BannersView />} />
            <Route path="/marketing/website-sections" element={<BannersView />} />
            <Route path="/marketing/before-after" element={<BeforeAfterView />} />
            <Route path="/before-after" element={<BeforeAfterView />} />
            <Route path="/custjewellerybeforeafter" element={<BeforeAfterView />} />
            <Route path="/cust-jewellery-before-after" element={<BeforeAfterView />} />
            <Route path="/home-sections" element={<HomeSectionsView />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/media-gallery" element={<GalleryView />} />
            <Route path="/website/gallery" element={<GalleryView />} />
            <Route path="/marketing/gallery" element={<GalleryView />} />
            <Route path="/website/themes" element={<WebsiteThemesView />} />
            <Route path="/themes" element={<WebsiteThemesView />} />
            <Route path="/static-pages" element={<StaticPagesView />} />
            <Route path="/website/static-pages" element={<StaticPagesView />} />
            <Route path="/website-content/static-pages" element={<StaticPagesView />} />
            <Route path="/pages" element={<StaticPagesView />} />
            <Route path="/marketing/home-sections" element={<HomeSectionsView />} />
            <Route path="/marketing/sections" element={<HomeSectionsView />} />
            {/* Luxury Blog Module, Editorial Studio & Categories */}
            <Route path="/blogs" element={<BlogsView />} />
            <Route path="/blogs/write" element={<WriteBlogView />} />
            <Route path="/blogs/add" element={<WriteBlogView />} />
            <Route path="/blogs/new" element={<WriteBlogView />} />
            <Route path="/blogs/edit/:id" element={<WriteBlogView />} />
            <Route path="/marketing/blogs" element={<BlogsView />} />
            <Route path="/marketing/blogs/write" element={<WriteBlogView />} />
            <Route path="/marketing/blogs/edit/:id" element={<WriteBlogView />} />
            <Route path="/blog-categories" element={<BlogCategoriesView />} />
            <Route path="/marketing/blog-categories" element={<BlogCategoriesView />} />
            {/* Dedicated Diamonds Module */}
            <Route path="/diamonds" element={<DiamondsView />} />
            <Route path="/diamonds/add" element={<AddDiamonds />} />
            <Route path="/diamonds/edit/:id" element={<AddDiamonds />} />

            <Route path="/diamond-types" element={<DiamondTypesView />} />
            <Route path="/diamond-config/types" element={<DiamondTypesView />} />
            <Route path="/diamond-shapes" element={<DiamondShapesView />} />
            <Route path="/diamond-config/shapes" element={<DiamondShapesView />} />
            <Route path="/diamond-color" element={<DiamondColorsView />} />
            <Route path="/diamond-config/color" element={<DiamondColorsView />} />
            <Route path="/diamond-clarity" element={<DiamondClaritiesView />} />
            <Route path="/diamond-config/clarity" element={<DiamondClaritiesView />} />
            <Route path="/diamond-size" element={<DiamondSizesView />} />
            <Route path="/diamond-config/size" element={<DiamondSizesView />} />
            <Route path="/metal-purity" element={<MetalPuritiesView />} />
            <Route path="/product-config/metal-purity" element={<MetalPuritiesView />} />
            <Route path="/metal-color" element={<MetalColorsView />} />
            <Route path="/product-config/metal-color" element={<MetalColorsView />} />
            <Route path="/sizes" element={<SizesView />} />
            <Route path="/product-config/sizes" element={<SizesView />} />
            <Route path="/vto-masters" element={<VtoMastersView />} />
            <Route path="/product-config/vto-masters" element={<VtoMastersView />} />

            {/* Luxury Add Jewelry Product (Matches Exact User Screenshot) */}
            <Route path="/catalog/jewelry-products/edit/:id" element={<AddJewelryProduct />} />
            <Route path="/catalog/jewelry-products/add" element={<AddJewelryProduct />} />
            <Route path="/catalog/jewelry-products/new" element={<AddJewelryProduct />} />
            <Route path="/catalog/silver-products/edit/:id" element={<AddJewelryProduct />} />
            <Route path="/catalog/silver-products/add" element={<AddJewelryProduct />} />
            <Route path="/catalog/silver-products/new" element={<AddJewelryProduct />} />
            <Route path="/catalog/add-jewelry-product" element={<AddJewelryProduct />} />
            <Route path="/add-jewelry-product" element={<AddJewelryProduct />} />

            {/* Luxury Ornate Products Catalog (Matches Target Mockup Design) */}
            <Route path="/catalog/ornate-products" element={<OrnateProductsView />} />
            <Route path="/ornate-products" element={<OrnateProductsView />} />

            {/* Luxury Tab-Wise Ornate Product Edit (Matches Exact User Screenshot) */}
            <Route path="/catalog/ornate-products/edit/:id" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/edit/:id" element={<OrnateProductEdit />} />
            <Route path="/catalog/ornate-products/add" element={<OrnateProductEdit />} />
            <Route path="/catalog/ornate-products/new" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/add" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/new" element={<OrnateProductEdit />} />
            {/* Category Filters Dynamic Assignment Module */}
            <Route path="/catalog/category-filters" element={<CategoryFiltersView />} />
            <Route path="/category-filters" element={<CategoryFiltersView />} />

            {/* Luxury Navigation Menus Module (Matches Exact 4-Screen Design) */}
            <Route path="/catalog/navigation-menus" element={<NavigationMenusView />} />

            {/* Luxury WhatsApp Management (Matches Exact User Screenshot) */}
            <Route path="/system/whatsapp" element={<WhatsAppView />} />
            <Route path="/whatsapp" element={<WhatsAppView />} />
            <Route path="/whatsapp-management" element={<WhatsAppView />} />

            {/* Real-Time Price Master (Metal Rates & Gold Price - Matches Exact User Screenshot) */}
            <Route path="/pricing-hub/metal-rates" element={<MetalRatesView />} />
            <Route path="/metal-rates" element={<MetalRatesView />} />
            <Route path="/goldprice" element={<MetalRatesView />} />

            {/* Diamond Pricing Master (Matches Exact User Screenshot at /diamondprice) */}
            <Route path="/pricing-hub/diamond-rates" element={<DiamondPricingMasterView />} />
            <Route path="/pricing-hub/diamond-price" element={<DiamondPricingMasterView />} />
            <Route path="/diamondprice" element={<DiamondPricingMasterView />} />
            <Route path="/diamond-price" element={<DiamondPricingMasterView />} />
            <Route path="/diamond-rates" element={<DiamondPricingMasterView />} />

            {/* Currency Management (Matches Exact User Screenshot) */}
            <Route path="/pricing-hub/currencies" element={<CurrenciesView />} />
            <Route path="/currencies" element={<CurrenciesView />} />
            {/* User Profile & Theme Customization */}
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/theme" element={<ProfileView />} />
            <Route path="/settings/profile" element={<ProfileView />} />
            <Route path="/user-profile" element={<ProfileView />} />

            {/* Senior Dynamic View for all Config & Catalog modules */}
            <Route path="*" element={<DynamicModuleView />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
