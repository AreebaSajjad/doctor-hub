import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/UI';

import LandingPage from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import DoctorsPage from './pages/DoctorsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AssistantDashboard from './pages/AssistantDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Route guard - redirect if not logged in
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Redirect to correct dashboard based on role
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case 'patient': return <PatientDashboard />;
    case 'doctor': return <DoctorDashboard />;
    case 'assistant': return <AssistantDashboard />;
    case 'admin':
    case 'super_admin': return <AdminDashboard />;
    default: return <Navigate to="/" replace />;
  }
}

// Redirect logged-in users away from auth pages
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/book/:doctorId" element={<PrivateRoute><BookAppointmentPage /></PrivateRoute>} />

      {/* Role-specific routes all handled via /dashboard */}
      <Route path="/appointments" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/prescriptions" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/patients" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/payments" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/admin/clinics" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/admin/analytics" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 64 }}>🏥</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800 }}>404</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Page not found</p>
          <a href="/" className="btn btn-primary">Go Home</a>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
