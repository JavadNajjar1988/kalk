/**
 * Scenario Editor Layout
 * طرح‌بندی اصلی ویرایشگر سناریو
 */

import React, { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { ScenarioNavigationBar } from './ScenarioNavigationBar';
import { ScenarioMainToolbar } from './ScenarioMainToolbar';
import { OrbatDisplayPanel } from './OrbatDisplayPanel';
import { ScenarioTimeline } from './ScenarioTimeline';

export interface ScenarioEditorLayoutProps {
  scenario: any;
  onBackToScenarios: () => void;
}

export const ScenarioEditorLayout: React.FC<ScenarioEditorLayoutProps> = ({
  scenario,
  onBackToScenarios,
}) => {
  // UI state management
  const [showTimeline, setShowTimeline] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [currentMode, setCurrentMode] = useState<'map' | 'grid' | 'chart'>('chart');

  // Handle mode change
  const handleModeChange = (mode: 'map' | 'grid' | 'chart') => {
    setCurrentMode(mode);
  };

  // Handle UI toggles
  const handleToggleTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  const handleToggleToolbar = () => {
    setShowToolbar(!showToolbar);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Navigation Bar */}
      <ScenarioNavigationBar
        scenario={scenario}
        currentMode={currentMode}
        showTimeline={showTimeline}
        showToolbar={showToolbar}
        onModeChange={handleModeChange}
        onToggleTimeline={handleToggleTimeline}
        onToggleToolbar={handleToggleToolbar}
        onBackToScenarios={onBackToScenarios}
      />

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ORBAT Display Panel - Main Content */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <OrbatDisplayPanel
            scenario={scenario}
            mode={currentMode}
          />

          {/* Main Toolbar - Floating over content */}
          {showToolbar && (
            <Box
              sx={{
                position: 'absolute',
                bottom: showTimeline ? 80 : 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                pointerEvents: 'none', // Allow clicks through
              }}
            >
              <Paper
                elevation={4}
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  pointerEvents: 'auto', // Re-enable clicks for toolbar
                }}
              >
                <ScenarioMainToolbar
                  scenario={scenario}
                  currentMode={currentMode}
                />
              </Paper>
            </Box>
          )}
        </Box>

        {/* Timeline - Bottom */}
        {showTimeline && (
          <Box
            sx={{
              height: 60,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <ScenarioTimeline scenario={scenario} />
          </Box>
        )}
      </Box>
    </Box>
  );
};