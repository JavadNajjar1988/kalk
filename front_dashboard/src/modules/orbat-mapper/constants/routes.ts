// Route constants for Orbat Scenario Editor
export const SCENARIO_EDITOR_ROUTES = {
  // Main route for scenario editor
  SCENARIO_EDITOR: '/dashboard/orbat-mapper/scenario/:scenarioId',
  
  // Editor modes - these will be sub-routes
  MAP_EDIT_MODE: '',  // Default - /scenario/:scenarioId
  GRID_EDIT_MODE: 'grid-edit',  // /scenario/:scenarioId/grid-edit  
  CHART_EDIT_MODE: 'chart-edit',  // /scenario/:scenarioId/chart-edit
} as const;

// Helper function to build editor route
export const buildScenarioEditorRoute = (scenarioId: string, mode?: string) => {
  const base = `/dashboard/orbat-mapper/scenario/${scenarioId}`;
  return mode ? `${base}/${mode}` : base;
};

// Editor mode types
export type EditorMode = 'map' | 'grid' | 'chart';

// Helper to get current editor mode from pathname
export const getCurrentEditorMode = (pathname: string): EditorMode => {
  if (pathname.includes('/grid-edit')) return 'grid';
  if (pathname.includes('/chart-edit')) return 'chart';
  return 'map'; // default
};

export default SCENARIO_EDITOR_ROUTES;