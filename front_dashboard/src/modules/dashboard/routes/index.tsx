import React from 'react';
import { Route, Routes, Navigate, Outlet } from 'react-router-dom';

import MainLayout from '@/components/layout/MainLayout';
import HomePage from '../pages/HomePage';
import MapPage from '../pages/MapPage';
import AlertsPage from '../pages/AlertsPage';
import BaseInfoPage from '../pages/BaseInfoPage';
import HelpPage from '../pages/HelpPage';
import NotificationsPage from '../pages/NotificationsPage';
import SearchPage from '../pages/SearchPage';
import SettingsPage from '../pages/SettingsPage';
import ScenariosPage from '../pages/ScenariosPage';
import ScenarioDetailPage from '../pages/ScenarioDetailPage';
import ResourcesPage from '../pages/ResourcesPage';
import MilitarySymbolGeneratorPage from '../pages/MilitarySymbolGeneratorPage';
import UsersPage from '../pages/users';
import UsersRoutes from '../../users/routes';
import HierarchicalSelectorTest from '../../../components/test/HierarchicalSelectorTest';
import MilitaryRanksDataMappingTest from '@/test/MilitaryRanksDataMappingTest';
import GeographicalDataMappingTest from '@/test/GeographicalDataMappingTest';
import RealTimeSyncTest from '@/components/test/RealTimeSyncTest';
import AllCategoriesHierarchyVerification from '@/components/test/AllCategoriesHierarchyVerification';
import SectionBasedReferenceTest from '@/components/test/SectionBasedReferenceTest';
import SectionSwitchingTest from '@/components/test/SectionSwitchingTest';
import ComprehensiveSectionSwitchingTest from '@/components/test/ComprehensiveSectionSwitchingTest';
import ErrorHandlingValidationTest from '@/components/test/ErrorHandlingValidationTest';
import RealTimeSyncAdvancedTest from '@/components/test/RealTimeSyncAdvancedTest';
import RealTimeSyncComprehensiveTest from '@/components/test/RealTimeSyncComprehensiveTest';
import ReferenceCategorySelectorComprehensiveTest from '@/components/test/ReferenceCategorySelectorComprehensiveTest';
import FinalIntegrationTest from '@/components/test/FinalIntegrationTest';
import TestsPage from '@/components/test/TestsPage';
import SmartFieldPreviewSyncTest from '@/test/SmartFieldPreviewSyncTest';
import OrbatMapperModule from '../../orbat-mapper/index';

 
import DefinitionEditorRoutes from '../../definition-editor/routes';

const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <MainLayout>
          <Outlet />
        </MainLayout>
      }>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
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

        {/* ماژول ORBAT Mapper */}
        <Route path="orbat-mapper/*" element={<OrbatMapperModule />} />
        
        <Route path="definition-editor/*" element={<DefinitionEditorRoutes />} />
        <Route path="military-symbol-generator" element={<MilitarySymbolGeneratorPage />} />
        <Route path="users/*" element={<UsersRoutes />} />
        
        {/* روت‌های تست */}
        <Route path="test" element={<TestsPage />} />
        <Route path="test/section-switching" element={<SectionSwitchingTest />} />
        <Route path="test/comprehensive-section-switching" element={<ComprehensiveSectionSwitchingTest />} />
        <Route path="test/error-handling" element={<ErrorHandlingValidationTest />} />
        <Route path="test/realtime-sync-advanced" element={<RealTimeSyncAdvancedTest />} />
        <Route path="test/realtime-sync-comprehensive" element={<RealTimeSyncComprehensiveTest />} />
        <Route path="test/reference-category-selector-comprehensive" element={<ReferenceCategorySelectorComprehensiveTest />} />
        <Route path="test/final-integration" element={<FinalIntegrationTest />} />
        <Route path="test/section-based-reference" element={<SectionBasedReferenceTest />} />
        <Route path="test/military-ranks-mapping" element={<MilitaryRanksDataMappingTest />} />
        <Route path="test/geographical-mapping" element={<GeographicalDataMappingTest />} />
        <Route path="test/hierarchical-selector" element={<HierarchicalSelectorTest />} />
        <Route path="test/real-time-sync" element={<RealTimeSyncTest />} />
        <Route path="test/all-categories-hierarchy" element={<AllCategoriesHierarchyVerification />} />
        <Route path="test/smart-field-preview-sync" element={<SmartFieldPreviewSyncTest />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default DashboardRoutes; 