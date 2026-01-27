
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#155EEF' },
    secondary: { main: '#7C3AED' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 10 },
  typography: {
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#84A9FF' },
    secondary: { main: '#B39DDB' },
    background: { default: '#0B1020', paper: '#0F172A' },
  },
  shape: { borderRadius: 10 },
  typography: {
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
});

export {};
