
// src/context/UiContext.tsx
import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Snackbar, Alert } from '@mui/material';
import { darkTheme, lightTheme } from '../theme';

type Severity = 'success' | 'info' | 'warning' | 'error';

interface UiContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  showToast: (message: string, severity?: Severity) => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export const UiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('ui.darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: Severity }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => localStorage.setItem('ui.darkMode', JSON.stringify(darkMode)), [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(v => !v), []);
  const showToast = useCallback((message: string, severity: Severity = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  return (
    <UiContext.Provider value={{ darkMode, toggleDarkMode, showToast }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <Snackbar
          open={toast.open}
          autoHideDuration={3500}
          onClose={() => setToast(t => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setToast(t => ({ ...t, open: false }))} severity={toast.severity} variant="filled">
            {toast.message}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </UiContext.Provider>
  );
};

export const useUi = (): UiContextType => {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
};
