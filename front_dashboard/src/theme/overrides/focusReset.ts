import { ComponentsOverrides } from '@mui/material/styles/overrides';

const focusReset: ComponentsOverrides['MuiButton'] & ComponentsOverrides['MuiIconButton'] & ComponentsOverrides['MuiFab'] & ComponentsOverrides['MuiListItemButton'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        '&:focus, &:focus-visible': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:focus, &:focus-visible': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        '&:focus, &:focus-visible': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        '&:focus, &:focus-visible': {
          outline: 'none',
          boxShadow: 'none',
        },
      },
    },
  },
};

export default focusReset; 