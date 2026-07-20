import { useTheme, useMediaQuery } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  // Breakpoints for responsive design
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));
  
  // Common responsive checks
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Orientation detection
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return {
    // Breakpoint checks
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Device type checks
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    
    // Orientation
    isPortrait,
    isLandscape,
    
    // Theme for direct access
    theme
  };
};