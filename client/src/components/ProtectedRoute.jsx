import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShieldAlert } from 'lucide-react';
import Button from './common/Button';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-100 dark:bg-rose-950/40 rounded-full text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          403 - Access Forbidden
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">
          Your role (<span className="font-semibold text-rose-600 dark:text-rose-400 capitalize">{user.role}</span>) does not have permission to view this page. Please return to your dashboard or contact campus administration.
        </p>
        <Button onClick={() => window.location.href = '/dashboard'} variant="primary">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
