import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UsersListPage, UserDetailPage } from '../pages';

const UsersRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UsersListPage />} />
      <Route path=":id" element={<UserDetailPage />} />
      <Route path="*" element={<Navigate to="/dashboard/users" replace />} />
    </Routes>
  );
};

export default UsersRoutes;