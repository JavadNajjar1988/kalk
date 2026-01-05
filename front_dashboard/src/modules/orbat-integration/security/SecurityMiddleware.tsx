import React, { PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';

const SecurityMiddleware: React.FC<PropsWithChildren> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default SecurityMiddleware;
