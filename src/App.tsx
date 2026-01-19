import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProvider } from './context/AppContext';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
          </Routes>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
