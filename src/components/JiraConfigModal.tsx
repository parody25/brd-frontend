import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as TestTubeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useJiraContext } from '../context/JiraContext';
import { useUi } from '../context/UiContext';
import { useJiraConfig } from '../hooks/useJiraConfig';
import { testJiraConnection, getJiraProjects, getJiraConfig } from '../services/api';

interface JiraConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const JiraConfigModal: React.FC<JiraConfigModalProps> = ({ open, onClose, onSuccess }) => {
  const { state, dispatch } = useJiraContext();
  const { showToast } = useUi();
  
  const [config, setConfig] = useState({
    jira_url: '',
    email: '',
    api_token: '',
    project_key: '',
  });
  const [projects, setProjects] = useState<Array<{ key: string; name: string }>>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      loadCurrentConfig();
      loadAvailableProjects();
    }
  }, [open]);

  const loadAvailableProjects = async () => {
    try {
      const response = await getJiraProjects();
      if (response.projects) {
        setProjects(response.projects);
        // Set default project key from config if available
        if (state.config?.project_key) {
          setConfig(prev => ({ ...prev, project_key: state.config?.project_key || '' }));
        } else if (response.projects.length > 0) {
          setConfig(prev => ({ ...prev, project_key: response.projects[0].key }));
        }
      }
    } catch (error) {
      console.error('Failed to load Jira projects:', error);
    }
  };

  const loadCurrentConfig = async () => {
    try {
      const currentConfig = await getJiraConfig();
      if (currentConfig) {
        setConfig({
          jira_url: currentConfig.jira_url || '',
          email: currentConfig.email || '',
          api_token: currentConfig.api_token || '',
          project_key: currentConfig.project_key || '',
        });
        // Store the full config (including project_key) in context for backend compatibility
        dispatch({ type: 'SET_CONFIG', payload: currentConfig });
      }
    } catch (error) {
      console.error('Failed to load Jira config:', error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!config.jira_url.trim()) {
      newErrors.jira_url = 'Jira Server URL is required';
    }
    if (!config.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!config.api_token.trim()) {
      newErrors.api_token = 'API Token is required';
    }
    // Default Project Key is optional - removed validation
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;
    
    setIsTesting(true);
    try {
      const result = await testJiraConnection(config);
      if (result.success) {
        showToast('Connection successful!', 'success');
        dispatch({ type: 'SET_CONNECTED', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
      } else {
        showToast(result.message || 'Connection failed', 'error');
        dispatch({ type: 'SET_CONNECTED', payload: false });
        dispatch({ type: 'SET_ERROR', payload: result.message });
      }
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Connection failed';
      showToast(message, 'error');
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Test connection first
      const testResult = await testJiraConnection(config);
      if (!testResult.success) {
        throw new Error(testResult.message || 'Connection test failed');
      }
      
      // Save configuration (assuming backend handles saving)
      const configWithProjectKey = {
        ...config,
        project_key: '' // Provide empty string for project_key since it's required by backend
      };
      dispatch({ type: 'SET_CONFIG', payload: configWithProjectKey });
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      showToast('Jira configuration saved successfully!', 'success');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message = error.message || 'Failed to save configuration';
      showToast(message, 'error');
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getStatusChip = () => {
    if (state.isLoading) {
      return <Chip label="Loading..." color="primary" variant="outlined" />;
    }
    if (state.isConnected) {
      return (
        <Chip 
          label="Connected" 
          color="success" 
          icon={<CheckCircleIcon />}
          variant="outlined"
        />
      );
    }
    if (state.error) {
      return (
        <Chip 
          label="Connection Failed" 
          color="error" 
          icon={<ErrorIcon />}
          variant="outlined"
        />
      );
    }
    return <Chip label="Not Connected" color="default" variant="outlined" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Jira Configuration</Typography>
          {getStatusChip()}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {state.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Jira Server URL"
            value={config.jira_url}
            onChange={(e) => handleChange('jira_url', e.target.value)}
            error={!!errors.jira_url}
            helperText={errors.jira_url}
            placeholder="https://your-domain.atlassian.net"
          />
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={config.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="your-email@example.com"
          />
          
          <TextField
            fullWidth
            label="API Token"
            type={showToken ? 'text' : 'password'}
            value={config.api_token}
            onChange={(e) => handleChange('api_token', e.target.value)}
            error={!!errors.api_token}
            helperText={errors.api_token}
            placeholder="Your Jira API token"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowToken(!showToken)}
                    edge="end"
                  >
                    {showToken ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl fullWidth>
            <InputLabel>Default Project Key</InputLabel>
            <Select
              value={config.project_key}
              onChange={(e) => handleChange('project_key', e.target.value)}
              label="Default Project Key"
            >
              {projects.map((project) => (
                <MenuItem key={project.key} value={project.key}>
                  {project.key} - {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleTestConnection}
          disabled={isTesting || state.isLoading}
          startIcon={isTesting ? <CircularProgress size={20} /> : <TestTubeIcon />}
          color="secondary"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={state.isLoading}
          startIcon={state.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          color="primary"
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JiraConfigModal;