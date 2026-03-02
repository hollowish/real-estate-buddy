import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * Wrap any page with this to require login.
 * Usage: <ProtectedRoute><DashboardPage /></ProtectedRoute>
 */
export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
