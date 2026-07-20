import React, { useState, useCallback, useMemo } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Paper,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Map,
  TableChart,
  Timeline,
  GridView,
  Settings,
  Monitor,
  Info,
  Layers,
  Group,
  Event,
  Analytics,
  Help
} from '@mui/icons-material';
import { OrbatToolbar } from '../OrbatToolbar';

// Layout configuration interface
export interface LayoutConfig {
  drawerWidth: number;
  collapsedDrawerWidth: number;
  headerHeight: number;
  footerHeight: number;
  spacing: number;
  showSidebar: boolean;
  showHeader: boolean;
  showFooter: boolean;
  sidebarCollapsible: boolean;
  sidebarInitiallyOpen: boolean;
}

// Navigation item interface
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  badge?: number;
  disabled?: boolean;
  onClick?: () => void;
}

// Layout areas interface
export interface LayoutAreas {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  main: React.ReactNode;
  footer?: React.ReactNode;
  toolbar?: React.ReactNode;
}

// Styled components
const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth'
})<{
  open?: boolean;
  drawerWidth: number;
}>(({ theme, open, drawerWidth }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'drawerWidth'
})<{
  open?: boolean;
  drawerWidth: number;
}>(({ theme, open, drawerWidth }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const StyledDrawer = styled(Drawer)<{ drawerWidth: number }>(({ drawerWidth }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
}));

// Default layout configuration
const DEFAULT_CONFIG: LayoutConfig = {
  drawerWidth: 280,
  collapsedDrawerWidth: 60,
  headerHeight: 64,
  footerHeight: 40,
  spacing: 2,
  showSidebar: true,
  showHeader: true,
  showFooter: false,
  sidebarCollapsible: true,
  sidebarInitiallyOpen: true
};

// Default navigation items for ORBAT
const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: <Map />,
    children: [
      { id: 'scenario-list', label: 'All Scenarios', icon: <GridView /> },
      { id: 'scenario-create', label: 'Create New', icon: <Event /> }
    ]
  },
  {
    id: 'units',
    label: 'Units',
    icon: <Group />,
    children: [
      { id: 'unit-list', label: 'Unit List', icon: <TableChart /> },
      { id: 'unit-hierarchy', label: 'Hierarchy', icon: <Timeline /> }
    ]
  },
  {
    id: 'map',
    label: 'Map View',
    icon: <Layers />,
    path: '/map'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Analytics />,
    badge: 3
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings />,
    children: [
      { id: 'general', label: 'General', icon: <Settings /> },
      { id: 'debug', label: 'Debug Monitor', icon: <Monitor /> }
    ]
  },
  {
    id: 'help',
    label: 'Help',
    icon: <Help />,
    path: '/help'
  }
];

// Props interface
interface OrbatLayoutProps {
  config?: Partial<LayoutConfig>;
  areas: LayoutAreas;
  navItems?: NavItem[];
  title?: string;
  onNavigate?: (itemId: string, path?: string) => void;
  onDrawerToggle?: (open: boolean) => void;
  loading?: boolean;
  error?: string;
}

// Navigation list component
const NavigationList: React.FC<{
  items: NavItem[];
  onItemClick: (item: NavItem) => void;
  level?: number;
}> = ({ items, onItemClick, level = 0 }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback((itemId: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.children && item.children.length > 0) {
      toggleItem(item.id);
    } else {
      onItemClick(item);
    }
  }, [onItemClick, toggleItem]);

  return (
    <List component="div" disablePadding>
      {items.map((item) => (
        <React.Fragment key={item.id}>
          <ListItem disablePadding>
            <ListItemButton
              sx={{ pl: 2 + level * 2 }}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
              {item.children && item.children.length > 0 && (
                openItems.has(item.id) ? <ExpandLess /> : <ExpandMore />
              )}
            </ListItemButton>
          </ListItem>
          
          {item.children && item.children.length > 0 && (
            <Collapse in={openItems.has(item.id)} timeout="auto" unmountOnExit>
              <NavigationList
                items={item.children}
                onItemClick={onItemClick}
                level={level + 1}
              />
            </Collapse>
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

// Main layout component
export const OrbatMasterLayout: React.FC<OrbatLayoutProps> = ({
  config: userConfig = {},
  areas,
  navItems = DEFAULT_NAV_ITEMS,
  title = 'ORBAT System',
  onNavigate,
  onDrawerToggle,
  loading = false,
  error
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Merge user config with defaults
  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...userConfig
  }), [userConfig]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(
    !isMobile && config.sidebarInitiallyOpen
  );

  // Handle drawer toggle
  const handleDrawerToggle = useCallback(() => {
    const newState = !drawerOpen;
    setDrawerOpen(newState);
    onDrawerToggle?.(newState);
  }, [drawerOpen, onDrawerToggle]);

  // Handle navigation
  const handleNavigate = useCallback((item: NavItem) => {
    onNavigate?.(item.id, item.path);
    item.onClick?.();
    
    // Close drawer on mobile after navigation
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [onNavigate, isMobile]);

  // Auto-close drawer on mobile
  React.useEffect(() => {
    if (isMobile && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isMobile, drawerOpen]);

  // Drawer content
  const drawerContent = areas.sidebar || (
    <>
      <DrawerHeader>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2 }}>
          Navigation
        </Typography>
        <IconButton onClick={handleDrawerToggle}>
          {theme.direction === 'ltr' ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <NavigationList 
        items={navItems} 
        onItemClick={handleNavigate}
      />
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Header */}
      {config.showHeader && (
        <StyledAppBar 
          position="fixed" 
          open={drawerOpen && config.showSidebar}
          drawerWidth={config.drawerWidth}
        >
          <Toolbar>
            {config.showSidebar && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerToggle}
                edge="start"
                sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            {areas.header || (
              <>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                  {title}
                </Typography>
                
                {loading && (
                  <Typography variant="body2" color="inherit" sx={{ mr: 2 }}>
                    Loading...
                  </Typography>
                )}
                
                {error && (
                  <Tooltip title={error}>
                    <IconButton color="inherit">
                      <Info />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Toolbar>
          
          {/* Custom toolbar */}
          {areas.toolbar}
        </StyledAppBar>
      )}

      {/* Sidebar */}
      {config.showSidebar && (
        <StyledDrawer
          variant={isMobile ? 'temporary' : 'persistent'}
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          drawerWidth={config.drawerWidth}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {drawerContent}
        </StyledDrawer>
      )}

      {/* Main content */}
      <Main 
        open={drawerOpen && config.showSidebar && !isMobile}
        drawerWidth={config.drawerWidth}
      >
        {config.showHeader && <DrawerHeader />}
        
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Main content area */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {areas.main}
          </Box>
          
          {/* Footer */}
          {config.showFooter && areas.footer && (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 1, 
                mt: 'auto',
                height: config.footerHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {areas.footer}
            </Paper>
          )}
        </Box>
      </Main>
    </Box>
  );
};

export default OrbatMasterLayout;