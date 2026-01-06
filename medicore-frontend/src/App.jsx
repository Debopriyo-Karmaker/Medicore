// src/App.jsx
import LabAssistantProfile from './pages/LabAssistantProfile';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import PatientProfile from './pages/PatientProfile';
import Appointments from './pages/Appointments';
import PatientReports from './pages/PatientReports';
import PatientPrescriptions from './pages/PatientPrescriptions';

import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LabAssistantDashboard from './pages/LabAssistantDashboard';

import { USER_ROLES } from './utils/constants';
import './App.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Central dashboard redirect based on role
function DashboardRedirect() {
  const { user } = useAuth();

  // Not logged in -> go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role (USER_ROLES may be upper; normalize)
  const normalizedRole = user.role?.toString().toLowerCase() || '';

  switch (normalizedRole) {
    case USER_ROLES.PATIENT.toLowerCase():
      return <Navigate to="/patient/dashboard" replace />;
    case USER_ROLES.DOCTOR.toLowerCase():
      return <Navigate to="/doctor/dashboard" replace />;
    case USER_ROLES.LAB_ASSISTANT.toLowerCase():
      return <Navigate to="/lab/dashboard" replace />;
    case USER_ROLES.ADMIN.toLowerCase():
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

// Wrap routes so we can apply theme class on root
function AppContent() {
  const { theme } = useTheme(); // 'light' | 'dark'

  return (
    // app-root is still useful for layout; theme class is also applied on <html> by ThemeContext
    <div className={`app-root theme-${theme}`}>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes (hero / landing) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Central dashboard route: after login go here, then redirect by role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/reports"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
                <PatientReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.PATIENT}>
                <PatientPrescriptions />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.DOCTOR}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Lab Assistant Routes */}
          <Route
            path="/lab/dashboard"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.LAB_ASSISTANT}>
                <LabAssistantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab/profile"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.LAB_ASSISTANT}>
                <LabAssistantProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole={USER_ROLES.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
