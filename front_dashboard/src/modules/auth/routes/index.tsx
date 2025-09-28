import { lazy } from 'react';
import { RouteObject, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('../components/LoginPage'));

const authRoutes: RouteObject[] = [
  {
    path: '/auth/login',
    element: <LoginPage />,
  },
  {
    path: '/auth',
    element: <Navigate to="/auth/login" replace />,
  },
];

export default authRoutes; 