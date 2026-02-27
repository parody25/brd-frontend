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
  DialogActions
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { useAppContext } from '../context/AppContext';
import { useUi } from '../context/UiContext';
import { getProjectUserStories, downloadUserStories, deleteUserStories } from '../services/api';
import { UserStories } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface UserStoriesListProps {
  projectId: string;
  refreshTrigger?: number;
  onSuccess?: () => void;
}

const UserStoriesList: React.FC<UserStoriesListProps> = ({ projectId, refreshTrigger = 0 }) => {
  const { dispatch } = useAppContext();
  const { showToast } = useUi();
  
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string; filename?: string }>({ open: false });
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<UserStories | null>(null);

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

  useEffect(() => {
    loadUserStories();
  }, [loadUserStories, refreshTrigger]);

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const handleInfoClick = (story: UserStories) => {
    setSelectedInfo(story);
    setInfoOpen(true);
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                      <Chip label={`${story.story_count} stories`} size="small" variant="outlined" />
                      <Chip label={`${story.epic_count} epics`} size="small" variant="outlined" />
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
    </Box>
  );
};

export default UserStoriesList;