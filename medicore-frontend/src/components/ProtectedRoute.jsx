import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, role, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Normalize requiredRole to lowercase so "ADMIN" / "admin" both work
  const normalizedRequired = requiredRole
    ? requiredRole.toLowerCase()
    : null;

  if (normalizedRequired && role !== normalizedRequired) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
