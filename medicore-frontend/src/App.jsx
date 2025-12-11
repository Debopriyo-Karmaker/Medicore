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

// Central dashboard redirect based on role
function DashboardRedirect() {
  const { user } = useAuth();

  // Not logged in -> go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case USER_ROLES.PATIENT:
      return <Navigate to="/patient/dashboard" replace />;
    case USER_ROLES.DOCTOR:
      return <Navigate to="/doctor/dashboard" replace />;
    case USER_ROLES.LAB_ASSISTANT:
      return <Navigate to="/lab/dashboard" replace />;
    case USER_ROLES.ADMIN:
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <AuthProvider>
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
              <ProtectedRoute
                allowedRoles={[
                  USER_ROLES.PATIENT,
                  USER_ROLES.DOCTOR,
                  USER_ROLES.LAB_ASSISTANT,
                  USER_ROLES.ADMIN,
                ]}
              >
                <DashboardRedirect />
              </ProtectedRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/reports"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                <PatientReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.PATIENT]}>
                <PatientPrescriptions />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.DOCTOR]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Lab Assistant Routes */}
          <Route
            path="/lab/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.LAB_ASSISTANT]}>
                <LabAssistantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
