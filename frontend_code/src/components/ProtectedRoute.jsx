import React from 'react';
import { Navigate } from 'react-router-dom';
import keycloak from '../services/keycloak';

const ProtectedRoute = ({ children }) => {
  if (!keycloak.authenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
