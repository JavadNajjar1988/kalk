import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { 
  OrbatProvider, 
  OrbatViewer, 
  useOrbatBridge, 
  useOrbatData, 
  useOrbatCommands,
  useOrbatEvents,
  useOrbatState 
} from '../index';

// Example component showing how to use the Phase 2 implementation
const OrbatIntegrationDemo: React.FC = () => {
  const { sendCommand, isReady, error } = useOrbatBridge();
  const { scenarios, units, events, isLoading } = useOrbatData();
  const { loadScenario, addUnit, executeCommand } = useOrbatCommands();
  const { subscribe, onUnitChanged, onEventTriggered } = useOrbatEvents();
  const { 
    state, 
    selectUnit, 
    highlightUnits, 
    setCurrentScenario,
    getStatistics 
  } = useOrbatState();

  React.useEffect(() => {
    // Subscribe to unit changes
    const unsubscribe = onUnitChanged((unit) => {
      console.log('Unit changed:', unit);
    });

    return unsubscribe;
  }, [onUnitChanged]);

  const handleLoadDemo = async () => {
    try {
      // Load a demo scenario
      await loadScenario('demo-scenario-1');
      
      // Add some demo units
      await addUnit({
        name: 'Alpha Company',
        unitType: 'INFANTRY',
        sidc: 'SFGPUCII------',
        position: { lat: 40.7128, lon: -74.0060 },
        status: 'ACTIVE'
      });

      console.log('Demo loaded successfully');
    } catch (error) {
      console.error('Failed to load demo:', error);
    }
  };

  const stats = getStatistics();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ORBAT Integration Demo - Phase 2
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        This demonstrates the React hooks and components created in Phase 2 of the headless adapter implementation.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Bridge Status
            </Typography>
            <Typography>Ready: {isReady ? 'Yes' : 'No'}</Typography>
            <Typography>Loading: {isLoading ? 'Yes' : 'No'}</Typography>
            <Typography>Error: {error || 'None'}</Typography>
            
            <Button 
              variant="contained" 
              onClick={handleLoadDemo}
              sx={{ mt: 2 }}
              disabled={!isReady}
            >
              Load Demo
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              State Statistics
            </Typography>
            <Typography>Total Units: {stats.totalUnits}</Typography>
            <Typography>Selected Units: {stats.selectedUnitsCount}</Typography>
            <Typography>Visible Units: {stats.visibleUnitsCount}</Typography>
            <Typography>Total Events: {stats.totalEvents}</Typography>
            <Typography>Active Events: {stats.activeEventsCount}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              ORBAT Viewer
            </Typography>
            <OrbatViewer
              mode="map"
              scenarioId="demo-scenario-1"
              height="350px"
              onReady={() => console.log('ORBAT Viewer ready')}
              onError={(error) => console.error('ORBAT Viewer error:', error)}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Main component wrapped with provider
const OrbatIntegrationDemoPage: React.FC = () => {
  return (
    <OrbatProvider
      config={{
        vueAppUrl: 'http://localhost:5173',
        enableCaching: true,
        enableRealTimeSync: true
      }}
    >
      <OrbatIntegrationDemo />
    </OrbatProvider>
  );
};

export default OrbatIntegrationDemoPage;