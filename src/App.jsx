import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
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
import BannersView from './pages/admin/BannersView';
import DiamondTypesView from './pages/admin/DiamondTypesView';
import DiamondShapesView from './pages/admin/DiamondShapesView';
import DiamondColorsView from './pages/admin/DiamondColorsView';
import DiamondClaritiesView from './pages/admin/DiamondClaritiesView';
import DiamondSizesView from './pages/admin/DiamondSizesView';
import MetalPuritiesView from './pages/admin/MetalPuritiesView';
import MetalColorsView from './pages/admin/MetalColorsView';
import SizesView from './pages/admin/SizesView';
import VtoMastersView from './pages/admin/VtoMastersView';
import DynamicModuleView from './pages/admin/DynamicModuleView';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1b1b1b',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '13px',
              border: '1px solid #333',
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
            <Route path="/banners" element={<BannersView />} />
            <Route path="/marketing/banners" element={<BannersView />} />
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

            {/* Senior Dynamic View for all Config & Catalog modules */}
            <Route path="*" element={<DynamicModuleView />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
