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
import RoleGuard from '@/components/common/RoleGuard';
import type { RoleFeature } from '@/security/roleAccess';

const guarded = (element: React.ReactNode, feature: RoleFeature) => (
  <RoleGuard feature={feature}>{element}</RoleGuard>
);

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
        <Route path="base-info" element={guarded(<BaseInfoPage />, 'baseInfo.manage')} />
        <Route path="help" element={<HelpPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="settings" element={guarded(<SettingsPage />, 'settings.manage')} />
        <Route path="scenarios">
          <Route index element={guarded(<ScenariosPage />, 'scenarios.view')} />
          <Route path=":id" element={guarded(<ScenarioDetailPage />, 'scenarios.view')} />
        </Route>
        <Route path="resources" element={guarded(<ResourcesPage />, 'resources.view')} />
        <Route path="data-management" element={guarded(<DataManagementPage />, 'data.manage')} />

        <Route path="users/*" element={guarded(<UsersRoutes />, 'users.view')} />
        
        {/* روت‌های تست */}
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes; 
