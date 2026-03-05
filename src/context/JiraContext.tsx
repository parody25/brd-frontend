import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { JiraState, JiraConfig, JiraSyncResult } from '../types';

type JiraAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONFIG'; payload: JiraConfig | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_SYNC_PROGRESS'; payload: { isSyncing: boolean; progress: number; message: string } }
  | { type: 'SET_SYNC_RESULTS'; payload: JiraSyncResult | null }
  | { type: 'RESET_SYNC_PROGRESS' };

const initialState: JiraState = {
  config: null,
  isConnected: false,
  isLoading: false,
  error: null,
  syncProgress: {
    isSyncing: false,
    progress: 0,
    message: '',
    results: null,
  },
};

const jiraReducer = (state: JiraState, action: JiraAction): JiraState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_SYNC_PROGRESS':
      return {
        ...state,
        syncProgress: {
          ...state.syncProgress,
          ...action.payload,
        },
      };
    case 'SET_SYNC_RESULTS':
      return {
        ...state,
        syncProgress: {
          ...state.syncProgress,
          results: action.payload,
        },
      };
    case 'RESET_SYNC_PROGRESS':
      return {
        ...state,
        syncProgress: {
          isSyncing: false,
          progress: 0,
          message: '',
          results: null,
        },
      };
    default:
      return state;
  }
};

interface JiraContextType {
  state: JiraState;
  dispatch: React.Dispatch<JiraAction>;
}

const JiraContext = createContext<JiraContextType | undefined>(undefined);

export const JiraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(jiraReducer, initialState);
  return <JiraContext.Provider value={{ state, dispatch }}>{children}</JiraContext.Provider>;
};

export const useJiraContext = (): JiraContextType => {
  const context = useContext(JiraContext);
  if (context === undefined) {
    throw new Error('useJiraContext must be used within a JiraProvider');
  }
  return context;
};