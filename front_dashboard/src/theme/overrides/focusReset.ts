import type { Components } from '@mui/material/styles';

const focusReset: Pick<Components, 'MuiButton' | 'MuiIconButton' | 'MuiFab' | 'MuiListItemButton'> = {
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
