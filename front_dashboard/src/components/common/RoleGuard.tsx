import React from 'react';
import { Alert, Box } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';

import { useAppSelector } from '@/store';
import { canAccessFeature, RoleFeature } from '@/security/roleAccess';


interface RoleGuardProps {
  children: React.ReactNode;
  feature: RoleFeature;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, feature }) => {
  const role = useAppSelector((state) => state.auth.user?.role);
  const location = useLocation();
  if (canAccessFeature(role, feature)) return <>{children}</>;
  if (location.pathname !== '/dashboard') return <Navigate to="/dashboard" replace />;
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="warning">شما اجازه دسترسی به این بخش را ندارید.</Alert>
    </Box>
  );
};

export default RoleGuard;

