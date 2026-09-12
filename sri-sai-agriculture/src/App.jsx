import { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useScrollReveal } from "./hooks/useScrollReveal";

// Layout
import AnnouncementBar  from "./components/layout/AnnouncementBar";
import TopBar           from "./components/layout/TopBar";
import Header           from "./components/layout/Header";
import Footer           from "./components/layout/Footer";
import FloatingButtons  from "./components/layout/FloatingButtons";

// Pages
import Home             from "./pages/Home";
import FacultyPage      from "./pages/FacultyPage";
import Results          from "./pages/Results";
import Hostel           from "./pages/Hostel";
import AdminDashboard  from "./pages/admin/AdminDashboard";
import AboutPage       from "./pages/AboutPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import ActivitiesPage   from "./pages/ActivitiesPage";
import StudentLogin     from "./pages/portal/StudentLogin";
import StudentRegister  from "./pages/portal/StudentRegister";
import StudentDashboard from "./pages/portal/StudentDashboard";
import ResetPassword    from "./pages/portal/ResetPassword";
import StaffLogin       from "./pages/staff/StaffLogin";
import StaffDashboard   from "./pages/staff/StaffDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import SuperAdminResetPassword from "./pages/portal/SuperAdminResetPassword";

export default function App() {
  const location = useLocation();
  useScrollReveal([location.pathname]);

  useEffect(() => {
    if (location.hash === "#contact" || location.hash === "#enquiry") {
      setTimeout(() => {
        const el = document.getElementById("enquiry") || document.getElementById("contact");
        if (el) {
          const yOffset = -90;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
          setTimeout(() => {
            const input = el.querySelector("input");
            if (input) input.focus({ preventScroll: true });
          }, 350);
        }
      }, 150);
    }
  }, [location]);

  const isAdminPanel = location.pathname.startsWith('/super-admin') || location.pathname.startsWith('/admin');
  const isPortal = location.pathname.startsWith('/portal') || location.pathname.startsWith('/staff') || location.pathname.startsWith('/receptionist');

  return (
    <div className="min-h-screen bg-cream font-sora text-[#374151] overflow-x-hidden w-full max-w-full relative">
      {/* ── Top fixed layers ── */}
      {!isAdminPanel && !isPortal && (
        <>
          <AnnouncementBar />
          <TopBar />
          <Header />
        </>
      )}

      {/* ── Main content with Routing ── */}
      <main className="w-full max-w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/results" element={<Results />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/hostel" element={<Hostel />} />
          
          {/* Super Admin Panel Routes */}
          <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/super-admin/dashboard" element={<AdminDashboard />} />
          <Route path="/super-admin/reset-password/:token" element={<SuperAdminResetPassword />} />

          {/* Legacy Admin Routes Fallback */}
          <Route path="/admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Navigate to="/super-admin/dashboard" replace />} />
          
          {/* Student Portal Routes */}
          <Route path="/portal/login" element={<StudentLogin />} />
          <Route path="/portal/register" element={<StudentRegister />} />
          <Route path="/portal/reset-password/:token" element={<ResetPassword />} />
          <Route path="/portal/dashboard" element={<StudentDashboard />} />

          {/* Staff Portal Routes */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/dashboard" element={<StaffDashboard />} />

          {/* Receptionist Portal Route */}
          <Route path="/receptionist" element={<Navigate to="/receptionist/dashboard" replace />} />
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
        </Routes>

      </main>

      {/* ── Footer ── */}
      {!isAdminPanel && !isPortal && <Footer />}

      {/* ── Floating call buttons ── */}
      {!isAdminPanel && !isPortal && <FloatingButtons />}
    </div>
  );
}
