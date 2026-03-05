
// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProjectListPage from './pages/ProjectListPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import JiraSettingsPage from './pages/JiraSettingsPage';
import { AppProvider } from './context/AppContext';
import { UiProvider } from './context/UiContext';
import { JiraProvider } from './context/JiraContext';

const App: React.FC = () => {
  return (
    <UiProvider>
      <AppProvider>
        <JiraProvider>
          <BrowserRouter>
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            <Routes>
              <Route path="/" element={<ProjectListPage />} />
              <Route path="/projects/:projectId" element={<ProjectDashboardPage />} />
              <Route path="/jira-settings" element={<JiraSettingsPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        </JiraProvider>
      </AppProvider>
    </UiProvider>
  );
};

export default App;
