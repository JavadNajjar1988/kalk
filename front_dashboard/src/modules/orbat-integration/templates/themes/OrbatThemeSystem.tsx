import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  createTheme, 
  ThemeProvider as MuiThemeProvider, 
  Theme,
  PaletteMode,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// ORBAT-specific color palette
export const orbatColors = {
  // Military standard colors
  friendly: '#0074D9',      // Blue
  hostile: '#FF4136',       // Red
  neutral: '#2ECC40',       // Green
  unknown: '#FFDC00',       // Yellow
  
  // Additional military colors
  destroyed: '#85144b',     // Maroon
  captured: '#FF851B',      // Orange
  
  // Map colors
  terrain: '#8fbc8f',       // Dark Sea Green
  water: '#4682b4',         // Steel Blue
  urban: '#696969',         // Dim Gray
  
  // Status colors
  active: '#28a745',        // Success Green
  inactive: '#6c757d',      // Gray
  warning: '#ffc107',       // Warning Yellow
  critical: '#dc3545',      // Danger Red
  
  // UI accents
  primary: '#1976d2',       // Material Blue
  secondary: '#dc004e',     // Material Pink
  background: '#f5f5f5',    // Light Gray
  surface: '#ffffff',       // White
  overlay: 'rgba(0,0,0,0.5)' // Semi-transparent black
};

// Theme configuration interface
export interface OrbatThemeConfig {
  mode: PaletteMode;
  primaryColor: string;
  secondaryColor: string;
  militarySymbols: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  elevation: 'none' | 'low' | 'medium' | 'high';
  animations: boolean;
  compactMode: boolean;
}

// Default theme configuration
const defaultConfig: OrbatThemeConfig = {
  mode: 'light',
  primaryColor: orbatColors.primary,
  secondaryColor: orbatColors.secondary,
  militarySymbols: true,
  highContrast: false,
  fontSize: 'medium',
  borderRadius: 'medium',
  elevation: 'medium',
  animations: true,
  compactMode: false
};

// Create ORBAT theme
const createOrbatTheme = (config: OrbatThemeConfig): Theme => {
  const fontSize = {
    small: { scale: 0.875, spacing: 6 },
    medium: { scale: 1, spacing: 8 },
    large: { scale: 1.125, spacing: 10 }
  }[config.fontSize];

  const borderRadius = {
    none: 0,
    small: 4,
    medium: 8,
    large: 16
  }[config.borderRadius];

  const elevation = {
    none: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    low: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    medium: undefined, // Use Material-UI defaults
    high: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48]
  }[config.elevation];

  return createTheme({
    palette: {
      mode: config.mode,
      primary: {
        main: config.primaryColor,
        ...(config.highContrast && {
          main: config.mode === 'dark' ? '#ffffff' : '#000000'
        })
      },
      secondary: {
        main: config.secondaryColor
      },
      // Custom ORBAT colors
      success: { main: orbatColors.friendly },
      error: { main: orbatColors.hostile },
      warning: { main: orbatColors.unknown },
      info: { main: orbatColors.neutral },
      
      // Custom palette extensions
      ...(config.mode === 'dark' ? {
        background: {
          default: '#121212',
          paper: '#1e1e1e'
        }
      } : {
        background: {
          default: orbatColors.background,
          paper: orbatColors.surface
        }
      })
    },
    typography: {
      fontSize: 14 * fontSize.scale,
      h1: { fontSize: `${2.5 * fontSize.scale}rem` },
      h2: { fontSize: `${2 * fontSize.scale}rem` },
      h3: { fontSize: `${1.75 * fontSize.scale}rem` },
      h4: { fontSize: `${1.5 * fontSize.scale}rem` },
      h5: { fontSize: `${1.25 * fontSize.scale}rem` },
      h6: { fontSize: `${1.125 * fontSize.scale}rem` },
      body1: { fontSize: `${1 * fontSize.scale}rem` },
      body2: { fontSize: `${0.875 * fontSize.scale}rem` },
      caption: { fontSize: `${0.75 * fontSize.scale}rem` }
    },
    spacing: fontSize.spacing,
    shape: { borderRadius },
    ...(elevation && { shadows: elevation.map(px => 
      px === 0 ? 'none' : `0px ${px}px ${px * 2}px rgba(0,0,0,0.12)`
    ) }),
    transitions: {
      duration: config.animations ? {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195
      } : {
        shortest: 0,
        shorter: 0,
        short: 0,
        standard: 0,
        complex: 0,
        enteringScreen: 0,
        leavingScreen: 0
      }
    },
    components: {
      // Custom component overrides
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(config.compactMode && {
              padding: theme.spacing(1)
            })
          })
        }
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(config.compactMode && {
              minHeight: 32,
              fontSize: '0.813rem',
              padding: theme.spacing(0.5, 1)
            })
          })
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(config.compactMode && {
              padding: theme.spacing(0.5)
            })
          })
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            ...(config.compactMode && {
              paddingTop: theme.spacing(0.5),
              paddingBottom: theme.spacing(0.5)
            })
          })
        }
      }
    }
  });
};

// Theme context
interface OrbatThemeContextType {
  config: OrbatThemeConfig;
  updateConfig: (updates: Partial<OrbatThemeConfig>) => void;
  resetTheme: () => void;
  toggleMode: () => void;
  orbatColors: typeof orbatColors;
}

const OrbatThemeContext = createContext<OrbatThemeContextType | null>(null);

// Custom hook to use ORBAT theme
export const useOrbatTheme = () => {
  const context = useContext(OrbatThemeContext);
  if (!context) {
    throw new Error('useOrbatTheme must be used within OrbatThemeProvider');
  }
  return context;
};

// Theme provider component
interface OrbatThemeProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<OrbatThemeConfig>;
  persistConfig?: boolean;
}

export const OrbatThemeProvider: React.FC<OrbatThemeProviderProps> = ({
  children,
  initialConfig = {},
  persistConfig = true
}) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  // Load config from localStorage or use defaults
  const [config, setConfig] = useState<OrbatThemeConfig>(() => {
    if (persistConfig && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('orbat-theme-config');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...defaultConfig, ...parsed, ...initialConfig };
        }
      } catch (error) {
        console.warn('Failed to load theme config from localStorage:', error);
      }
    }
    
    return {
      ...defaultConfig,
      mode: prefersDarkMode ? 'dark' : 'light',
      ...initialConfig
    };
  });

  // Save config to localStorage
  useEffect(() => {
    if (persistConfig && typeof window !== 'undefined') {
      try {
        localStorage.setItem('orbat-theme-config', JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save theme config to localStorage:', error);
      }
    }
  }, [config, persistConfig]);

  // Update theme config
  const updateConfig = useCallback((updates: Partial<OrbatThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset theme to defaults
  const resetTheme = useCallback(() => {
    setConfig({
      ...defaultConfig,
      mode: prefersDarkMode ? 'dark' : 'light'
    });
  }, [prefersDarkMode]);

  // Toggle dark/light mode
  const toggleMode = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : 'light'
    }));
  }, []);

  // Create theme instance
  const theme = React.useMemo(() => createOrbatTheme(config), [config]);

  const contextValue: OrbatThemeContextType = {
    config,
    updateConfig,
    resetTheme,
    toggleMode,
    orbatColors
  };

  return (
    <OrbatThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </OrbatThemeContext.Provider>
  );
};

// Styled components with theme support
export const OrbatContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  minHeight: '100vh',
  transition: theme.transitions.create(['background-color', 'color'])
}));

export const MilitarySymbol = styled('div')<{ 
  affiliation?: 'friendly' | 'hostile' | 'neutral' | 'unknown';
  size?: 'small' | 'medium' | 'large';
}>(({ theme, affiliation = 'unknown', size = 'medium' }) => {
  const symbolSize = {
    small: 24,
    medium: 32,
    large: 48
  }[size];

  const symbolColor = {
    friendly: orbatColors.friendly,
    hostile: orbatColors.hostile,
    neutral: orbatColors.neutral,
    unknown: orbatColors.unknown
  }[affiliation];

  return {
    width: symbolSize,
    height: symbolSize,
    backgroundColor: symbolColor,
    border: `2px solid ${theme.palette.text.primary}`,
    borderRadius: theme.shape.borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.getContrastText(symbolColor),
    fontSize: symbolSize * 0.4,
    fontWeight: 'bold',
    transition: theme.transitions.create(['background-color', 'border-color'])
  };
});

export const StatusIndicator = styled('div')<{ 
  status: 'active' | 'inactive' | 'warning' | 'critical';
  variant?: 'dot' | 'badge' | 'bar';
}>(({ theme, status, variant = 'dot' }) => {
  const statusColor = {
    active: orbatColors.active,
    inactive: orbatColors.inactive,
    warning: orbatColors.warning,
    critical: orbatColors.critical
  }[status];

  const baseStyles = {
    backgroundColor: statusColor,
    transition: theme.transitions.create('background-color')
  };

  switch (variant) {
    case 'dot':
      return {
        ...baseStyles,
        width: 8,
        height: 8,
        borderRadius: '50%'
      };
    case 'badge':
      return {
        ...baseStyles,
        padding: theme.spacing(0.25, 0.75),
        borderRadius: theme.shape.borderRadius,
        color: theme.palette.getContrastText(statusColor),
        fontSize: '0.75rem',
        fontWeight: 'bold'
      };
    case 'bar':
      return {
        ...baseStyles,
        width: '100%',
        height: 4,
        borderRadius: theme.shape.borderRadius
      };
    default:
      return baseStyles;
  }
});

// Theme utilities
export const getAffiliationColor = (affiliation: string): string => {
  switch (affiliation) {
    case 'F': case 'friendly': return orbatColors.friendly;
    case 'H': case 'hostile': return orbatColors.hostile;
    case 'N': case 'neutral': return orbatColors.neutral;
    case 'U': case 'unknown': return orbatColors.unknown;
    default: return orbatColors.unknown;
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active': return orbatColors.active;
    case 'inactive': return orbatColors.inactive;
    case 'destroyed': return orbatColors.destroyed;
    case 'captured': return orbatColors.captured;
    default: return orbatColors.inactive;
  }
};

// HOC for theme-aware components
export const withOrbatTheme = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const ThemedComponent: React.FC<P> = (props) => {
    const themeContext = useOrbatTheme();
    
    return (
      <Component 
        {...props} 
        orbatTheme={themeContext}
      />
    );
  };

  ThemedComponent.displayName = `withOrbatTheme(${Component.displayName || Component.name})`;
  
  return ThemedComponent;
};

export default {
  OrbatThemeProvider,
  useOrbatTheme,
  orbatColors,
  createOrbatTheme,
  OrbatContainer,
  MilitarySymbol,
  StatusIndicator,
  getAffiliationColor,
  getStatusColor,
  withOrbatTheme
};