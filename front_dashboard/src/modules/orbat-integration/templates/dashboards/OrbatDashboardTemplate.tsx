import React, { useState, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Button,
  Stack,
  Alert,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Dashboard,
  Map,
  TableChart,
  Timeline,
  Analytics,
  Settings,
  Refresh,
  MoreVert,
  Fullscreen,
  FullscreenExit,
  GridView,
  ViewModule,
  ViewList,
  FilterList,
  Sort,
  Share,
  Download,
  Print,
  Help,
  Layers,
  Group,
  Event,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { OrbatViewer } from '../../components/OrbatViewer';
import { OrbatUnitCard } from '../../components/OrbatUnitCard';
import { OrbatEventCard } from '../../components/OrbatEventCard';
import { OrbatDebugMonitor } from '../../components/OrbatDebugMonitor';
import { ResponsiveGrid, ResponsiveStack, useResponsive } from '../layouts/ResponsiveLayoutSystem';
import { OrbatDataCard, OrbatList, OrbatStatusPanel } from '../components/TemplateComponents';
import type { OrbatScenario, OrbatUnit, OrbatEvent } from '../../types/orbat-data';

// Dashboard widget interface
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'map' | 'units' | 'events' | 'analytics' | 'status' | 'debug' | 'custom';
  size: { xs: number; sm: number; md: number; lg: number; xl: number };
  position: { x: number; y: number };
  visible: boolean;
  resizable: boolean;
  movable: boolean;
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
}

// Dashboard layout interface
export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  isDefault?: boolean;
}

// Dashboard template props
export interface OrbatDashboardProps {
  scenario?: OrbatScenario;
  units?: OrbatUnit[];
  events?: OrbatEvent[];
  layouts?: DashboardLayout[];
  defaultLayout?: string;
  onLayoutChange?: (layout: DashboardLayout) => void;
  onWidgetUpdate?: (widget: DashboardWidget) => void;
  loading?: boolean;
  error?: string;
  editable?: boolean;
}

// Styled components
const DashboardContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default
}));

const DashboardHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderRadius: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.appBar
}));

const DashboardContent = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(1),
  overflow: 'auto',
  backgroundColor: theme.palette.background.default
}));

const WidgetContainer = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  transition: theme.transitions.create(['box-shadow'], {
    duration: theme.transitions.duration.short
  }),
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const WidgetHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 48
}));

const WidgetContent = styled(Box)({
  flex: 1,
  overflow: 'auto',
  position: 'relative'
});

// Default widgets configuration
const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'map-view',
    title: 'Map View',
    type: 'map',
    size: { xs: 12, sm: 12, md: 8, lg: 8, xl: 8 },
    position: { x: 0, y: 0 },
    visible: true,
    resizable: true,
    movable: true
  },
  {
    id: 'unit-status',
    title: 'Unit Status',
    type: 'status',
    size: { xs: 12, sm: 6, md: 4, lg: 4, xl: 4 },
    position: { x: 8, y: 0 },
    visible: true,
    resizable: true,
    movable: true
  },
  {
    id: 'units-list',
    title: 'Units',
    type: 'units',
    size: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
    position: { x: 0, y: 1 },
    visible: true,
    resizable: true,
    movable: true
  },
  {
    id: 'events-list',
    title: 'Events',
    type: 'events',
    size: { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 },
    position: { x: 6, y: 1 },
    visible: true,
    resizable: true,
    movable: true
  }
];

const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Default View',
    description: 'Standard ORBAT dashboard layout',
    widgets: DEFAULT_WIDGETS,
    isDefault: true
  },
  {
    id: 'map-focused',
    name: 'Map Focused',
    description: 'Large map view with minimal sidebars',
    widgets: [
      { ...DEFAULT_WIDGETS[0], size: { xs: 12, sm: 12, md: 12, lg: 10, xl: 10 } },
      { ...DEFAULT_WIDGETS[1], size: { xs: 12, sm: 12, md: 12, lg: 2, xl: 2 }, position: { x: 10, y: 0 } }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics View',
    description: 'Analytics and reporting focused layout',
    widgets: [
      { ...DEFAULT_WIDGETS[1], size: { xs: 12, sm: 6, md: 3, lg: 3, xl: 3 } },
      { id: 'analytics-1', title: 'Analytics', type: 'analytics', size: { xs: 12, sm: 6, md: 9, lg: 9, xl: 9 }, position: { x: 3, y: 0 }, visible: true, resizable: true, movable: true },
      { ...DEFAULT_WIDGETS[2], size: { xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }, position: { x: 0, y: 1 } },
      { ...DEFAULT_WIDGETS[3], size: { xs: 12, sm: 12, md: 6, lg: 6, xl: 6 }, position: { x: 6, y: 1 } }
    ]
  }
];

// Widget component map
const WIDGET_COMPONENTS = {
  map: ({ scenario, ...props }: any) => (
    <OrbatViewer
      mode="map"
      scenarioId={scenario?.id}
      height="100%"
      {...props}
    />
  ),
  units: ({ units = [], ...props }: any) => (
    <ResponsiveGrid config={{ columns: { xs: 1, sm: 1, md: 2, lg: 2, xl: 3 } }}>
      {units.slice(0, 10).map((unit: OrbatUnit) => (
        <OrbatUnitCard
          key={unit.id}
          unit={unit}
          compact
          {...props}
        />
      ))}
    </ResponsiveGrid>
  ),
  events: ({ events = [], ...props }: any) => (
    <Stack spacing={1}>
      {events.slice(0, 5).map((event: OrbatEvent) => (
        <OrbatEventCard
          key={event.id}
          event={event}
          compact
          {...props}
        />
      ))}
    </Stack>
  ),
  status: ({ units = [], events = [], ...props }: any) => (
    <OrbatStatusPanel
      items={[
        { id: 'total-units', label: 'Total Units', value: units.length, status: 'info', icon: <Group /> },
        { id: 'active-units', label: 'Active Units', value: units.filter((u: OrbatUnit) => u.status === 'ACTIVE').length, status: 'success', icon: <Visibility /> },
        { id: 'total-events', label: 'Events', value: events.length, status: 'info', icon: <Event /> },
        { id: 'active-events', label: 'Active Events', value: events.filter((e: OrbatEvent) => e.startTime && new Date(e.startTime) <= new Date()).length, status: 'warning', icon: <Timeline /> }
      ]}
      layout="grid"
      columns={2}
      compact
      {...props}
    />
  ),
  analytics: ({ units = [], events = [], ...props }: any) => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Analytics sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Analytics Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Advanced analytics and reporting features will be available here.
      </Typography>
    </Box>
  ),
  debug: (props: any) => (
    <OrbatDebugMonitor {...props} />
  )
};

// Widget component
const DashboardWidget: React.FC<{
  widget: DashboardWidget;
  scenario?: OrbatScenario;
  units?: OrbatUnit[];
  events?: OrbatEvent[];
  onUpdate?: (widget: DashboardWidget) => void;
  editable?: boolean;
}> = ({ widget, scenario, units, events, onUpdate, editable = false }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const toggleVisibility = useCallback(() => {
    onUpdate?.({ ...widget, visible: !widget.visible });
    handleMenuClose();
  }, [widget, onUpdate]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen(!fullscreen);
    handleMenuClose();
  }, [fullscreen]);

  const WidgetComponent = WIDGET_COMPONENTS[widget.type] || (() => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        Widget type '{widget.type}' not implemented
      </Typography>
    </Box>
  ));

  if (!widget.visible) {
    return null;
  }

  return (
    <WidgetContainer 
      elevation={fullscreen ? 8 : 1}
      sx={{
        ...(fullscreen && {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300,
          m: 0
        })
      }}
    >
      <WidgetHeader>
        <Typography variant="h6" component="div">
          {widget.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {editable && (
            <>
              <IconButton size="small" onClick={toggleFullscreen}>
                {fullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
              
              <IconButton size="small" onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={toggleVisibility}>
                  {widget.visible ? <VisibilityOff /> : <Visibility />}
                  <Typography sx={{ ml: 1 }}>
                    {widget.visible ? 'Hide' : 'Show'}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={toggleFullscreen}>
                  {fullscreen ? <FullscreenExit /> : <Fullscreen />}
                  <Typography sx={{ ml: 1 }}>
                    {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem>
                  <Settings />
                  <Typography sx={{ ml: 1 }}>Configure</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </WidgetHeader>
      
      <WidgetContent>
        <WidgetComponent
          scenario={scenario}
          units={units}
          events={events}
          {...widget.props}
        />
      </WidgetContent>
    </WidgetContainer>
  );
};

// Main dashboard component
export const OrbatDashboardTemplate: React.FC<OrbatDashboardProps> = ({
  scenario,
  units = [],
  events = [],
  layouts = DEFAULT_LAYOUTS,
  defaultLayout = 'default',
  onLayoutChange,
  onWidgetUpdate,
  loading = false,
  error,
  editable = false
}) => {
  const { viewport } = useResponsive();
  const [activeLayoutId, setActiveLayoutId] = useState(defaultLayout);
  const [editMode, setEditMode] = useState(false);

  // Get current layout
  const currentLayout = useMemo(() => {
    return layouts.find(l => l.id === activeLayoutId) || layouts[0];
  }, [layouts, activeLayoutId]);

  // Handle layout change
  const handleLayoutChange = useCallback((layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      setActiveLayoutId(layoutId);
      onLayoutChange?.(layout);
    }
  }, [layouts, onLayoutChange]);

  // Handle widget update
  const handleWidgetUpdate = useCallback((updatedWidget: DashboardWidget) => {
    onWidgetUpdate?.(updatedWidget);
  }, [onWidgetUpdate]);

  if (loading) {
    return (
      <DashboardContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress size={60} />
        </Box>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Dashboard Header */}
      <DashboardHeader elevation={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Dashboard color="primary" />
            <Typography variant="h6">
              ORBAT Dashboard
            </Typography>
            
            {scenario && (
              <Chip 
                label={scenario.name} 
                color="primary" 
                variant="outlined"
                size="small"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Layout Selection */}
            <Tabs
              value={activeLayoutId}
              onChange={(_, value) => handleLayoutChange(value)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 'auto' }}
            >
              {layouts.map((layout) => (
                <Tab
                  key={layout.id}
                  label={layout.name}
                  value={layout.id}
                  sx={{ minHeight: 'auto', py: 1 }}
                />
              ))}
            </Tabs>
            
            {editable && (
              <FormControlLabel
                control={
                  <Switch
                    checked={editMode}
                    onChange={(e) => setEditMode(e.target.checked)}
                    size="small"
                  />
                }
                label="Edit"
                sx={{ ml: 2 }}
              />
            )}
            
            <IconButton size="small">
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </DashboardHeader>

      {/* Dashboard Content */}
      <DashboardContent>
        <ResponsiveGrid
          config={{
            columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
            spacing: { xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }
          }}
        >
          {currentLayout.widgets
            .filter(widget => widget.visible)
            .map((widget) => (
              <Box 
                key={widget.id}
                sx={{
                  gridColumn: {
                    xs: `span ${Math.min(widget.size.xs, 1)}`,
                    sm: `span ${Math.min(widget.size.sm, 2)}`,
                    md: `span ${Math.min(widget.size.md, 3)}`,
                    lg: `span ${Math.min(widget.size.lg, 4)}`,
                    xl: `span ${Math.min(widget.size.xl, 5)}`
                  },
                  height: widget.type === 'map' ? 500 : 300
                }}
              >
                <DashboardWidget
                  widget={widget}
                  scenario={scenario}
                  units={units}
                  events={events}
                  onUpdate={handleWidgetUpdate}
                  editable={editMode}
                />
              </Box>
            ))
          }
        </ResponsiveGrid>
      </DashboardContent>
    </DashboardContainer>
  );
};

export default OrbatDashboardTemplate;