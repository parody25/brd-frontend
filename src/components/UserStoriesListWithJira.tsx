import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Sync as SyncIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { useJiraContext } from '../context/JiraContext';
import { useUi } from '../context/UiContext';
import { getProjectUserStories, downloadUserStories, deleteUserStories, syncUserStoriesToJira, getJiraProjects } from '../services/api';
import { UserStories, JiraProject } from '../types';
import ConfirmDialog from './ConfirmDialog';
import JiraConfigModal from './JiraConfigModal';
import SyncProgressModal from './SyncProgressModal';

interface UserStoriesListWithJiraProps {
  projectId: string;
  refreshTrigger?: number;
  onSuccess?: () => void;
}

const UserStoriesListWithJira: React.FC<UserStoriesListWithJiraProps> = ({ projectId, refreshTrigger = 0 }) => {
  const { dispatch } = useAppContext();
  const { state: jiraState, dispatch: jiraDispatch } = useJiraContext();
  const { showToast } = useUi();
  
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; filename?: string }>({ open: false });
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<UserStories | null>(null);
  const [jiraConfigOpen, setJiraConfigOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTarget, setSyncTarget] = useState<{ id: string; filename: string } | null>(null);
  const [projectKey, setProjectKey] = useState('');
  const [availableProjects, setAvailableProjects] = useState<JiraProject[]>([]);
  const [syncProjectModalOpen, setSyncProjectModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const loadUserStories = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await getProjectUserStories(projectId);
      setUserStories(response.user_stories);
      dispatch({ type: 'SET_USER_STORIES', payload: response.user_stories });
      setError(null);
    } catch {
      setError('Failed to load User Stories');
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  const loadJiraProjects = useCallback(async () => {
    try {
      const response = await getJiraProjects();
      if (response.projects) {
        setAvailableProjects(response.projects);
        // Set default project key from config if available
        if (jiraState.config?.project_key) {
          setProjectKey(jiraState.config.project_key);
        } else if (response.projects.length > 0) {
          setProjectKey(response.projects[0].key);
        }
      }
    } catch (error) {
      console.error('Failed to load Jira projects:', error);
    }
  }, [jiraState.config?.project_key]);

  useEffect(() => {
    loadUserStories();
    if (jiraState.isConnected) {
      loadJiraProjects();
    }
  }, [loadUserStories, refreshTrigger, jiraState.isConnected, loadJiraProjects]);

  const handleDownload = async (userStoriesId: string, filename: string) => {
    try {
      const blob = await downloadUserStories(projectId, userStoriesId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('User Stories downloaded successfully', 'success');
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to download User Stories';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (userStoriesId: string) => {
    if (!projectId) return;
    try {
      await deleteUserStories(projectId, userStoriesId);
      setUserStories(prev => prev.filter(story => story.id !== userStoriesId));
      dispatch({ type: 'REMOVE_USER_STORY', payload: userStoriesId });
      showToast('User Stories deleted successfully', 'success');
    } catch {
      showToast('Failed to delete User Stories', 'error');
    }
  };

  const handleSyncToJira = async () => {
    if (!syncTarget || !jiraState.config) return;
    
    jiraDispatch({ type: 'SET_SYNC_PROGRESS', payload: { isSyncing: true, progress: 0, message: 'Starting sync to Jira...' } });
    setSyncModalOpen(true);
    
    try {
      const config = {
        jira_url: jiraState.config.jira_url,
        project_key: projectKey,
        auth_token: jiraState.config.api_token
      };
      
      const result = await syncUserStoriesToJira(projectId, syncTarget.id, config);
      
      jiraDispatch({ 
        type: 'SET_SYNC_RESULTS', 
        payload: result 
      });
      
      jiraDispatch({ 
        type: 'SET_SYNC_PROGRESS', 
        payload: { 
          isSyncing: false, 
          progress: 100, 
          message: result.message || 'Sync completed' 
        } 
      });
      
      showToast(result.message || 'Sync completed successfully', 'success');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Sync failed';
      jiraDispatch({ 
        type: 'SET_SYNC_PROGRESS', 
        payload: { 
          isSyncing: false, 
          progress: 0, 
          message: message 
        } 
      });
      showToast(message, 'error');
    }
  };

  const handleOpenJiraConfig = () => {
    setJiraConfigOpen(true);
  };

  const handleCloseJiraConfig = () => {
    setJiraConfigOpen(false);
  };

  const handleJiraConfigSuccess = () => {
    loadJiraProjects();
    showToast('Jira configuration updated', 'success');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const handleInfoClick = (story: UserStories) => {
    setSelectedInfo(story);
    setInfoOpen(true);
  };

  const handleProjectSelection = () => {
    if (availableProjects.length > 0) {
      setProjectKey(availableProjects[0].key);
    }
    setSyncProjectModalOpen(false);
    setSyncModalOpen(true);
  };

  const handleProjectModalClose = () => {
    setSyncProjectModalOpen(false);
    setSyncTarget(null);
  };


  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Jira Configuration Status */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {jiraState.isConnected ? (
            <Chip label="Jira Connected" color="success" variant="outlined" />
          ) : (
            <Chip label="Jira Not Connected" color="error" variant="outlined" />
          )}
          {jiraState.config && jiraState.config.project_key && (
            <Chip label={`Default Project: ${jiraState.config.project_key}`} variant="outlined" />
          )}
        </Box>
        <Button
          startIcon={<SettingsIcon />}
          onClick={handleOpenJiraConfig}
          variant="outlined"
          color="primary"
        >
          Jira Settings
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : userStories.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No User Stories generated yet. Generate User Stories from a BRD to get started.
        </Alert>
      ) : (
        <Paper sx={{ mb: 2 }}>
          <List>
            {userStories.map((story) => (
              <ListItem key={story.id} divider>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{story.filename}</Typography>
                      <Chip label={`v${story.version}`} size="small" color="primary" />
                      {story.story_count > 0 && (
                        <Chip label={`${story.story_count} stories`} size="small" variant="outlined" />
                      )}
                      {story.epic_count > 0 && (
                        <Chip label={`${story.epic_count} epics`} size="small" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Source BRD: {story.brd_filename}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generated: {formatDate(story.generated_at)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="View details">
                      <IconButton
                        edge="end"
                        onClick={() => handleInfoClick(story)}
                        aria-label="info"
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Excel">
                      <IconButton
                        edge="end"
                        onClick={() => handleDownload(story.id, story.filename)}
                        aria-label="download"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sync to Jira">
                      <span>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            setSyncTarget({ id: story.id, filename: story.filename });
                            if (jiraState.config?.project_key) {
                              // Use default project key if available
                              setProjectKey(jiraState.config.project_key);
                              setSyncModalOpen(true);
                            } else {
                              // Prompt user to select project
                              setSyncProjectModalOpen(true);
                            }
                          }}
                          aria-label="sync"
                          disabled={!jiraState.isConnected}
                          color="primary"
                        >
                          <SyncIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        onClick={() => setConfirmDelete({ open: true, id: story.id, filename: story.filename })}
                        color="error"
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Info Dialog */}
      <Dialog open={infoOpen} onClose={() => setInfoOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Stories Details</DialogTitle>
        <DialogContent>
          {selectedInfo && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Filename</Typography>
                <Typography>{selectedInfo.filename}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Version</Typography>
                <Typography>{selectedInfo.version}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Source BRD</Typography>
                <Typography>{selectedInfo.brd_filename}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Generated</Typography>
                <Typography>{formatDate(selectedInfo.generated_at)}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Content</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={`${selectedInfo.story_count} User Stories`} size="small" color="primary" />
                  <Chip label={`${selectedInfo.epic_count} Epics`} size="small" color="secondary" />
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete User Stories"
        message={<>Are you sure you want to delete "<b>{confirmDelete.filename}</b>"? This action cannot be undone.</>}
        onClose={() => setConfirmDelete({ open: false })}
        onConfirm={() => {
          if (confirmDelete.id) handleDelete(confirmDelete.id);
          setConfirmDelete({ open: false });
        }}
        confirmColor="error"
        confirmText="Delete"
      />

      {/* Jira Configuration Modal */}
      <JiraConfigModal
        open={jiraConfigOpen}
        onClose={handleCloseJiraConfig}
        onSuccess={handleJiraConfigSuccess}
      />

      {/* Project Selection Modal */}
      <Dialog open={syncProjectModalOpen} onClose={handleProjectModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>Select Jira Project</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please select a Jira project to sync the User Stories to:
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Project</InputLabel>
            <Select
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value)}
              label="Project"
            >
              {availableProjects.map((project) => (
                <MenuItem key={project.key} value={project.key}>
                  {project.key} - {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProjectModalClose}>Cancel</Button>
          <Button
            onClick={handleProjectSelection}
            disabled={!projectKey || availableProjects.length === 0}
            variant="contained"
            color="primary"
          >
            Continue to Sync
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Progress Modal */}
      <SyncProgressModal
        open={syncModalOpen}
        onClose={() => {
          setSyncModalOpen(false);
          setSyncTarget(null);
          jiraDispatch({ type: 'RESET_SYNC_PROGRESS' });
        }}
        progress={jiraState.syncProgress.progress}
        message={jiraState.syncProgress.message}
        isSyncing={jiraState.syncProgress.isSyncing}
        results={jiraState.syncProgress.results?.sync_results || null}
        onCancel={() => {
          // Handle cancel if needed
        }}
      />
    </Box>
  );
};

export default UserStoriesListWithJira;