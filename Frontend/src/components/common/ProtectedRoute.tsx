import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceSkeleton } from '../workspace';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowGuestShareToken?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowGuestShareToken = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const hasShareToken =
    allowGuestShareToken && Boolean(searchParams.get('shareToken')?.trim());

  // Allow unauthenticated guest access if a temporary share token is provided
  if (hasShareToken) {
    return children;
  }

  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
