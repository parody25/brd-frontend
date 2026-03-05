import { useEffect } from 'react';
import { useJiraContext } from '../context/JiraContext';
import { getJiraConfig, getJiraProjects } from '../services/api';

export const useJiraConfig = () => {
  const { state, dispatch } = useJiraContext();

  const loadConfig = async () => {
    try {
      const config = await getJiraConfig();
      if (config) {
        dispatch({ type: 'SET_CONFIG', payload: config });
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        dispatch({ type: 'SET_CONNECTED', payload: false });
      }
    } catch (error) {
      console.error('Failed to load Jira config:', error);
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  };

  const loadProjects = async () => {
    try {
      const response = await getJiraProjects();
      if (response.projects) {
        // Projects are loaded in the component, this is just for reference
        return response.projects;
      }
    } catch (error) {
      console.error('Failed to load Jira projects:', error);
    }
  };

  const testConnection = async (config: any) => {
    try {
      const result = await getJiraConfig(); // This would be testJiraConnection in real implementation
      if (result.success) {
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        return true;
      } else {
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_ERROR', payload: result.message });
        return false;
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Connection failed';
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config: state.config,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    loadConfig,
    loadProjects,
    testConnection
  };
};