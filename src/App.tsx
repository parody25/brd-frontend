
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import { AppProvider } from './context/AppContext';
import { UiProvider } from './context/UiContext';

const App: React.FC = () => {
  return (
    <UiProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </UiProvider>
  );
};

export default App;
