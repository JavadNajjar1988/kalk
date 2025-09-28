import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ResourcesListPage, ResourceDetailPage } from '../pages';

const ResourcesRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ResourcesListPage />} />
      <Route path=":id" element={<ResourceDetailPage />} />
      <Route path="*" element={<Navigate to="/dashboard/resources" replace />} />
    </Routes>
  );
};

export default ResourcesRoutes;