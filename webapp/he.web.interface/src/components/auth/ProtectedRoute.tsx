import { Navigate, useLocation } from 'react-router-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, hasAccount, hasMembership, isLoading } = useFirebaseAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no account AND no membership exists, redirect to onboarding
  // Invited users (hasMembership === true) should skip onboarding and go to dashboard
  // Don't redirect if already on onboarding or account-setup pages
  const needsOnboarding = hasAccount === false && hasMembership === false;
  if (needsOnboarding && location.pathname !== '/onboarding' && location.pathname !== '/account-setup') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
