import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DefinitionEditorPage from '../pages/DefinitionEditorPage';
import { GeographicalPage, MilitaryRanksPage, MilitaryUnitsPage, EquipmentPage, MissionTypePage, OperationalStatusPage, OperationalEnvironmentPage, TimeDefinitionsPage, CodingClassificationPage, MilitaryUnitTypePage, OrganizationalAffiliationPage, ThreatTypePage, InfoClassificationPage, LogisticsStatusPage, AmmunitionPage, WeatherPage, PersonsPage, LogisticsPage } from '../pages/categories';

const DefinitionEditorRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DefinitionEditorPage />} />
      {/* مسیرهای اختصاصی هر دسته‌بندی */}
      <Route path="/geographical" element={<GeographicalPage />} />
      <Route path="/military-ranks" element={<MilitaryRanksPage />} />
      <Route path="/military-units" element={<MilitaryUnitsPage />} />
      <Route path="/equipment" element={<EquipmentPage />} />
      <Route path="/mission-type" element={<MissionTypePage />} />
      <Route path="/operational-status" element={<OperationalStatusPage />} />
      <Route path="/operational-environment" element={<OperationalEnvironmentPage />} />
      <Route path="/time-definitions" element={<TimeDefinitionsPage />} />
      <Route path="/coding-classification" element={<CodingClassificationPage />} />
      <Route path="/force-type" element={<MilitaryUnitTypePage />} />
      <Route path="/organizational-affiliation" element={<OrganizationalAffiliationPage />} />
      <Route path="/threat-type" element={<ThreatTypePage />} />
      <Route path="/info-classification" element={<InfoClassificationPage />} />
      <Route path="/logistics-status" element={<LogisticsStatusPage />} />
      <Route path="/ammunition" element={<AmmunitionPage />} />
      <Route path="/weather" element={<WeatherPage />} />
      <Route path="/persons" element={<PersonsPage />} />
      <Route path="/logistics" element={<LogisticsPage />} />
    </Routes>
  );
};

export default DefinitionEditorRoutes;
