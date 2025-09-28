import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MapViewerPage from '../pages/MapViewerPage';

const MapViewerRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<MapViewerPage />} />
    </Routes>
  );
};

export default MapViewerRoutes;