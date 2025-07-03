import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../assets/context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/LoginForm" replace />;
  }

  // If allowedRoles is specified and user doesn't have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/" replace />;
    } else if (user.role === 'STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has the required role
  return children;
};

export default ProtectedRoute; 