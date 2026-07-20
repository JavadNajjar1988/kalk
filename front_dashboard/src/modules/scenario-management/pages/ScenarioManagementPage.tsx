/**
 * Scenario Management Page
 * صفحه مدیریت سناریوها با نمایش Landing Page
 */

import React from 'react';
import { Box } from '@mui/material';
import { ScenarioLandingPage } from '../components';
import type { ScenarioAction } from '../types';

const ScenarioManagementPage: React.FC = () => {
  const handleScenarioSelect = (scenarioId: string) => {
    console.log('Scenario selected:', scenarioId);
    // TODO: Navigate to scenario editor or implement custom logic
  };

  const handleScenarioAction = (action: ScenarioAction, scenarioId: string) => {
    console.log('Scenario action:', action, scenarioId);
    // TODO: Handle scenario actions (open, delete, download, etc.)
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <ScenarioLandingPage
        onScenarioSelect={handleScenarioSelect}
        onScenarioAction={handleScenarioAction}
        showDemoScenarios={true}
        enableUpload={true}
        enableUrlLoad={true}
      />
    </Box>
  );
};

export default ScenarioManagementPage;