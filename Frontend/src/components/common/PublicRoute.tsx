import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { WorkspaceSkeleton } from '../workspace';

/**
 * Route wrapper for guest-only pages like /login and /register.
 * If the user is already authenticated, redirects them to /dashboard
 * (or the previous location they attempted to access).
 */
export const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;
