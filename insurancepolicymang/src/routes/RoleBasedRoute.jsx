import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = user?.roles?.some(role => allowedRoles.includes(role));

  return hasAccess ? <Outlet /> : <Navigate to="/" replace />;
};

export default RoleBasedRoute;
