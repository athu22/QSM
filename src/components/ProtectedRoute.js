import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole, loading } = useAuth();

  // Wait until auth state is resolved to avoid redirect flicker on refresh
  if (loading) {
    return null; // or a spinner component if you have one
  }

  // If no user, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user exists but no role (during logout), redirect to login
  if (currentUser && !userRole) {
    return <Navigate to="/login" replace />;
  }

  // If user has role but it's not in allowed roles, redirect to unauthorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
