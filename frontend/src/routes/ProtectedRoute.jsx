import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getHomePathForRole } from '../utils/roles';

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className='flex min-h-screen items-center justify-center px-4'>
        <div className='glass-panel rounded-[28px] px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-200'>
          Restoring your workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
