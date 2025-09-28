import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScenarioManagementPage from '../pages/ScenarioManagementPage';
import NewScenarioPage from '../pages/NewScenarioPage';
import ScenarioEditorPage from '../pages/ScenarioEditorPage';

const ScenarioManagementRoutes: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ScenarioManagementPage />} />
      <Route path="new" element={<NewScenarioPage />} />
      <Route path=":scenarioId" element={<ScenarioEditorPage />} />
    </Routes>
  );
};

export default ScenarioManagementRoutes;