import React from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';

import MainLayout from '@/components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import AlertsPage from '../pages/AlertsPage';
import BaseInfoPage from '../pages/BaseInfoPage';
import HelpPage from '../pages/HelpPage';
import NotificationsPage from '../pages/NotificationsPage';
import SearchPage from '../pages/SearchPage';
import SettingsPage from '../pages/SettingsPage';
import ScenariosPage from '../pages/ScenariosPage';
import ScenarioDetailPage from '../pages/ScenarioDetailPage';
import ResourcesPage from '../pages/ResourcesPage';
import DataManagementPage from '../pages/DataManagementPage';
import UsersRoutes from '../../users/routes';

 
const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <MainLayout>
          <Outlet />
        </MainLayout>
      }>
        <Route index element={<HomePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="base-info" element={<BaseInfoPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="scenarios">
          <Route index element={<ScenariosPage />} />
          <Route path=":id" element={<ScenarioDetailPage />} />
        </Route>
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="data-management" element={<DataManagementPage />} />

        <Route path="users/*" element={<UsersRoutes />} />
        
        {/* روت‌های تست */}
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes; 
