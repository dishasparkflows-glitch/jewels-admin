import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/Dashboard';
import CodSequencesView from './pages/admin/CodSequencesView';
import CustomersView from './pages/admin/CustomersView';
import AppointmentsView from './pages/admin/AppointmentsView';
import CustomInquiriesView from './pages/admin/CustomInquiriesView';
import ReviewsView from './pages/admin/ReviewsView';
import SettingsView from './pages/admin/SettingsView';
import FooterSettingsView from './pages/admin/FooterSettingsView';
import InstagramPostsView from './pages/admin/InstagramPostsView';
import BirthstonePortfolioView from './pages/admin/BirthstonePortfolioView';
import CouponsView from './pages/admin/CouponsView';
import CelebrateGiftsView from './pages/admin/CelebrateGiftsView';
import TopAnnouncementView from './pages/admin/TopAnnouncementView';
import DiamondsView from './pages/admin/DiamondsView';
import AddDiamonds from './pages/admin/AddDiamonds';
import BannersView from './pages/admin/BannersView';
import HomeSectionsView from './pages/admin/HomeSectionsView';
import DiamondTypesView from './pages/admin/DiamondTypesView';
import DiamondShapesView from './pages/admin/DiamondShapesView';
import DiamondColorsView from './pages/admin/DiamondColorsView';
import DiamondClaritiesView from './pages/admin/DiamondClaritiesView';
import DiamondSizesView from './pages/admin/DiamondSizesView';
import MetalPuritiesView from './pages/admin/MetalPuritiesView';
import MetalColorsView from './pages/admin/MetalColorsView';
import SizesView from './pages/admin/SizesView';
import VtoMastersView from './pages/admin/VtoMastersView';
import AddJewelryProduct from './pages/admin/AddJewelryProduct';
import OrnateProductEdit from './pages/admin/OrnateProductEdit';
import NavigationMenusView from './pages/admin/NavigationMenusView';
import WhatsAppView from './pages/admin/WhatsAppView';
import MetalRatesView from './pages/admin/MetalRatesView';
import CurrenciesView from './pages/admin/CurrenciesView';
import BeforeAfterView from './pages/admin/BeforeAfterView';
import DynamicModuleView from './pages/admin/DynamicModuleView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
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
              padding: '12px 18px',
              fontSize: '13px',
              border: '1px solid #333',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            },
          }}
        />

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
            <Route path="/marketing/banners" element={<BannersView />} />
            <Route path="/website-sections" element={<BannersView />} />
            <Route path="/marketing/website-sections" element={<BannersView />} />
            <Route path="/marketing/before-after" element={<BeforeAfterView />} />
            <Route path="/before-after" element={<BeforeAfterView />} />
            <Route path="/custjewellerybeforeafter" element={<BeforeAfterView />} />
            <Route path="/cust-jewellery-before-after" element={<BeforeAfterView />} />
            <Route path="/home-sections" element={<HomeSectionsView />} />
            <Route path="/marketing/home-sections" element={<HomeSectionsView />} />
            <Route path="/marketing/sections" element={<HomeSectionsView />} />
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
            <Route path="/catalog/jewelry-products/add" element={<AddJewelryProduct />} />
            <Route path="/catalog/jewelry-products/new" element={<AddJewelryProduct />} />

            {/* Luxury Tab-Wise Ornate Product Edit (Matches Exact User Screenshot) */}
            <Route path="/catalog/ornate-products/edit/:id" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/edit/:id" element={<OrnateProductEdit />} />
            <Route path="/catalog/ornate-products/add" element={<OrnateProductEdit />} />
            <Route path="/catalog/ornate-products/new" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/add" element={<OrnateProductEdit />} />
            <Route path="/ornate-products/new" element={<OrnateProductEdit />} />
            {/* Luxury Navigation Menus Module (Matches Exact 4-Screen Design) */}
            <Route path="/catalog/navigation-menus" element={<NavigationMenusView />} />
            <Route path="/navigation-menus" element={<NavigationMenusView />} />

            {/* Luxury WhatsApp Management (Matches Exact User Screenshot) */}
            <Route path="/system/whatsapp" element={<WhatsAppView />} />
            <Route path="/whatsapp" element={<WhatsAppView />} />
            <Route path="/whatsapp-management" element={<WhatsAppView />} />

            {/* Real-Time Price Master (Metal Rates & Gold Price - Matches Exact User Screenshot) */}
            <Route path="/pricing-hub/metal-rates" element={<MetalRatesView />} />
            <Route path="/metal-rates" element={<MetalRatesView />} />
            <Route path="/goldprice" element={<MetalRatesView />} />

            {/* Currency Management (Matches Exact User Screenshot) */}
            <Route path="/pricing-hub/currencies" element={<CurrenciesView />} />
            <Route path="/currencies" element={<CurrenciesView />} />
            <Route path="/currency" element={<CurrenciesView />} />

            {/* Senior Dynamic View for all Config & Catalog modules */}
            <Route path="*" element={<DynamicModuleView />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ConfirmProvider>
    </AuthProvider>
  </BrowserRouter>
  );
}

export default App;
