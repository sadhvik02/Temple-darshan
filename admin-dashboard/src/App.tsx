import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TempleInfoPage from "./pages/TempleInfoPage";
import BannersPage from "./pages/BannersPage";
import ServicesPage from "./pages/ServicesPage";
import SlotsPage from "./pages/SlotsPage";
import BookingsPage from "./pages/BookingsPage";
import NewsPage from "./pages/NewsPage";
import EventsPage from "./pages/EventsPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — require admin auth */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/temple" element={<TempleInfoPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/slots" element={<SlotsPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Catch-all → redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
