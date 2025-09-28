import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTheme, useMediaQuery, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Box, Container, Grid, Stack, Paper, Breakpoint } from '@mui/material';

// Responsive breakpoint definitions
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ResponsiveConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: ResponsiveBreakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
}

export interface LayoutBreakpoints {
  sidebar: {
    xs: 'hidden' | 'drawer' | 'permanent';
    sm: 'hidden' | 'drawer' | 'permanent';
    md: 'hidden' | 'drawer' | 'permanent';
    lg: 'hidden' | 'drawer' | 'permanent';
    xl: 'hidden' | 'drawer' | 'permanent';
  };
  header: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
  };
  footer: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
  };
}

// Responsive grid configuration
export interface ResponsiveGridConfig {
  columns: ResponsiveConfig;
  spacing: ResponsiveConfig;
  containerMaxWidth?: false | Breakpoint;
  fluid?: boolean;
}

// Default responsive configurations
const DEFAULT_GRID_CONFIG: ResponsiveGridConfig = {
  columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  spacing: { xs: 1, sm: 2, md: 2, lg: 3, xl: 3 },
  containerMaxWidth: 'xl',
  fluid: false
};

const DEFAULT_LAYOUT_BREAKPOINTS: LayoutBreakpoints = {
  sidebar: {
    xs: 'hidden',
    sm: 'drawer',
    md: 'drawer',
    lg: 'permanent',
    xl: 'permanent'
  },
  header: {
    xs: true,
    sm: true,
    md: true,
    lg: true,
    xl: true
  },
  footer: {
    xs: false,
    sm: false,
    md: true,
    lg: true,
    xl: true
  }
};

// Responsive context
interface ResponsiveContextType {
  viewport: ViewportInfo;
  gridConfig: ResponsiveGridConfig;
  layoutBreakpoints: LayoutBreakpoints;
  updateGridConfig: (config: Partial<ResponsiveGridConfig>) => void;
  updateLayoutBreakpoints: (breakpoints: Partial<LayoutBreakpoints>) => void;
  getCurrentValue: <T>(config: ResponsiveConfig | Partial<ResponsiveConfig>, defaultValue: T) => T;
}

const ResponsiveContext = createContext<ResponsiveContextType | null>(null);

// Custom hook for responsive context
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};

// Responsive provider component
interface ResponsiveProviderProps {
  children: React.ReactNode;
  gridConfig?: Partial<ResponsiveGridConfig>;
  layoutBreakpoints?: Partial<LayoutBreakpoints>;
}

export const ResponsiveProvider: React.FC<ResponsiveProviderProps> = ({
  children,
  gridConfig: initialGridConfig = {},
  layoutBreakpoints: initialLayoutBreakpoints = {}
}) => {
  const theme = useTheme();
  
  // Media queries for breakpoints
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // State management
  const [gridConfig, setGridConfig] = useState<ResponsiveGridConfig>({
    ...DEFAULT_GRID_CONFIG,
    ...initialGridConfig
  });
  
  const [layoutBreakpoints, setLayoutBreakpoints] = useState<LayoutBreakpoints>({
    ...DEFAULT_LAYOUT_BREAKPOINTS,
    ...initialLayoutBreakpoints
  });

  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    let breakpoint: ResponsiveBreakpoint = 'md';
    if (isXs) breakpoint = 'xs';
    else if (isSm) breakpoint = 'sm';
    else if (isMd) breakpoint = 'md';
    else if (isLg) breakpoint = 'lg';
    else if (isXl) breakpoint = 'xl';

    return {
      width,
      height,
      breakpoint,
      isMobile,
      isTablet,
      isDesktop,
      orientation: width > height ? 'landscape' : 'portrait'
    };
  });

  // Update viewport info on window resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let breakpoint: ResponsiveBreakpoint = 'md';
      if (width < theme.breakpoints.values.sm) breakpoint = 'xs';
      else if (width < theme.breakpoints.values.md) breakpoint = 'sm';
      else if (width < theme.breakpoints.values.lg) breakpoint = 'md';
      else if (width < theme.breakpoints.values.xl) breakpoint = 'lg';
      else breakpoint = 'xl';

      setViewport({
        width,
        height,
        breakpoint,
        isMobile: width < theme.breakpoints.values.md,
        isTablet: width >= theme.breakpoints.values.md && width < theme.breakpoints.values.lg,
        isDesktop: width >= theme.breakpoints.values.lg,
        orientation: width > height ? 'landscape' : 'portrait'
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, [theme.breakpoints.values]);

  // Update grid configuration
  const updateGridConfig = useCallback((newConfig: Partial<ResponsiveGridConfig>) => {
    setGridConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Update layout breakpoints
  const updateLayoutBreakpoints = useCallback((newBreakpoints: Partial<LayoutBreakpoints>) => {
    setLayoutBreakpoints(prev => ({ ...prev, ...newBreakpoints }));
  }, []);

  // Get current value based on breakpoint
  const getCurrentValue = useCallback(<T,>(
    config: ResponsiveConfig | Partial<ResponsiveConfig>, 
    defaultValue: T
  ): T => {
    const value = config[viewport.breakpoint];
    return value !== undefined ? (value as T) : defaultValue;
  }, [viewport.breakpoint]);

  const contextValue: ResponsiveContextType = {
    viewport,
    gridConfig,
    layoutBreakpoints,
    updateGridConfig,
    updateLayoutBreakpoints,
    getCurrentValue
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  config?: Partial<ResponsiveGridConfig>;
  sx?: any;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  config: customConfig = {},
  sx
}) => {
  const { viewport, gridConfig, getCurrentValue } = useResponsive();
  
  const finalConfig = { ...gridConfig, ...customConfig };
  const columns = getCurrentValue(finalConfig.columns, 3);
  const spacing = getCurrentValue(finalConfig.spacing, 2);

  const ContainerComponent = finalConfig.fluid ? Box : Container;

  return (
    <ContainerComponent 
      maxWidth={finalConfig.containerMaxWidth || 'xl'}
      sx={sx}
    >
      <Grid container spacing={spacing}>
        {React.Children.map(children, (child, index) => (
          <Grid item xs={12} sm={12/Math.min(columns, 2)} md={12/Math.min(columns, 3)} lg={12/Math.min(columns, 4)} xl={12/Math.min(columns, 5)} key={index}>
            {child}
          </Grid>
        ))}
      </Grid>
    </ContainerComponent>
  );
};

// Responsive Stack Component
interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: {
    xs?: 'row' | 'column';
    sm?: 'row' | 'column';
    md?: 'row' | 'column';
    lg?: 'row' | 'column';
    xl?: 'row' | 'column';
  };
  spacing?: ResponsiveConfig | number;
  sx?: any;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  direction = { xs: 'column', md: 'row' },
  spacing = 2,
  sx
}) => {
  const { getCurrentValue } = useResponsive();
  
  const currentDirection = getCurrentValue(direction, 'row');
  const currentSpacing = typeof spacing === 'number' 
    ? spacing 
    : getCurrentValue(spacing, 2);

  return (
    <Stack 
      direction={currentDirection}
      spacing={currentSpacing}
      sx={sx}
    >
      {children}
    </Stack>
  );
};

// Responsive Container Component
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: ResponsiveConfig | false;
  padding?: ResponsiveConfig;
  margin?: ResponsiveConfig;
  sx?: any;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = { xs: 'sm', md: 'lg', xl: 'xl' },
  padding = { xs: 1, sm: 2, md: 3 },
  margin = { xs: 0, sm: 0, md: 0 },
  sx
}) => {
  const { getCurrentValue } = useResponsive();
  
  const currentMaxWidth = maxWidth === false ? false : getCurrentValue(maxWidth as ResponsiveConfig, 'lg');
  const currentPadding = getCurrentValue(padding, 2);
  const currentMargin = getCurrentValue(margin, 0);

  return (
    <Container
      maxWidth={currentMaxWidth as Breakpoint | false}
      sx={{
        px: currentPadding,
        mx: currentMargin,
        ...sx
      }}
    >
      {children}
    </Container>
  );
};

// Responsive Paper Component
interface ResponsivePaperProps {
  children: React.ReactNode;
  elevation?: ResponsiveConfig;
  padding?: ResponsiveConfig;
  margin?: ResponsiveConfig;
  square?: ResponsiveConfig;
  sx?: any;
}

export const ResponsivePaper: React.FC<ResponsivePaperProps> = ({
  children,
  elevation = { xs: 1, md: 2, lg: 3 },
  padding = { xs: 1, sm: 2, md: 3 },
  margin = { xs: 0, sm: 1, md: 2 },
  square = { xs: true, md: false },
  sx
}) => {
  const { getCurrentValue } = useResponsive();
  
  const currentElevation = getCurrentValue(elevation, 1);
  const currentPadding = getCurrentValue(padding, 2);
  const currentMargin = getCurrentValue(margin, 1);
  const currentSquare = getCurrentValue(square, false);

  return (
    <Paper
      elevation={currentElevation}
      square={currentSquare}
      sx={{
        p: currentPadding,
        m: currentMargin,
        ...sx
      }}
    >
      {children}
    </Paper>
  );
};

// Adaptive Layout Component
interface AdaptiveLayoutProps {
  children: React.ReactNode;
  mobileLayout: React.ReactNode;
  tabletLayout?: React.ReactNode;
  desktopLayout: React.ReactNode;
}

export const AdaptiveLayout: React.FC<AdaptiveLayoutProps> = ({
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout
}) => {
  const { viewport } = useResponsive();

  if (viewport.isMobile) {
    return <>{mobileLayout}</>;
  }
  
  if (viewport.isTablet && tabletLayout) {
    return <>{tabletLayout}</>;
  }
  
  if (viewport.isDesktop) {
    return <>{desktopLayout}</>;
  }

  return <>{children}</>;
};

// Responsive utility hooks
export const useBreakpoint = () => {
  const { viewport } = useResponsive();
  return viewport.breakpoint;
};

export const useViewport = () => {
  const { viewport } = useResponsive();
  return viewport;
};

export const useResponsiveValue = <T,>(config: ResponsiveConfig | Partial<ResponsiveConfig>, defaultValue: T): T => {
  const { getCurrentValue } = useResponsive();
  return getCurrentValue(config, defaultValue);
};

// HOC for responsive components
export const withResponsive = <P extends object,>(
  Component: React.ComponentType<P>
) => {
  const ResponsiveComponent: React.FC<P> = (props) => {
    const responsive = useResponsive();
    
    return (
      <Component 
        {...props} 
        responsive={responsive}
      />
    );
  };

  ResponsiveComponent.displayName = `withResponsive(${Component.displayName || Component.name})`;
  
  return ResponsiveComponent;
};

// Styled responsive components
export const ResponsiveBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'responsive'
})<{ responsive?: any }>(({ theme, responsive }) => {
  if (!responsive) return {};
  
  const { viewport } = responsive;
  
  return {
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
      margin: theme.spacing(0.5)
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(2),
      margin: theme.spacing(1)
    },
    [theme.breakpoints.up('lg')]: {
      padding: theme.spacing(3),
      margin: theme.spacing(2)
    }
  };
});

export default {
  ResponsiveProvider,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveContainer,
  ResponsivePaper,
  AdaptiveLayout,
  useResponsive,
  useBreakpoint,
  useViewport,
  useResponsiveValue,
  withResponsive
};