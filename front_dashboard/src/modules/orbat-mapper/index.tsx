import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import OrbatLandingPage from './components/OrbatLandingPage';
import ScenarioEditorWrapper from './components/ScenarioEditorWrapper';
import UnderDevelopmentPage from './components/UnderDevelopmentPage';

const OrbatMapperModule: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<OrbatLandingPage />} />
      
      {/* Scenario Editor Routes */}
      <Route path="/scenario/:scenarioId/*" element={<ScenarioEditorWrapper />} />
      
      {/* Legacy/Test Routes */}
      <Route 
        path="/map" 
        element={
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              نمای نقشه
            </Typography>
            <Typography variant="body1" color="text.secondary">
              این بخش در حال توسعه است
            </Typography>
          </Box>
        } 
      />
    </Routes>
  );
};

export default OrbatMapperModule;