import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon, Description as DescriptionIcon, AutoAwesome as AutoAwesomeIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getProjects, createProject, deleteProject, renameProject } from '../services/api';
import { Project } from '../types';

const ProjectList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
  const loadProjects = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getProjects();
      dispatch({ type: 'SET_PROJECTS', payload: response.projects });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Error loading projects:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

    loadProjects();
  }, [dispatch]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;

    setCreating(true);
    try {
      const response = await createProject(projectName);
      const newProject: Project = {
        project_id: response.project_id,
        name: response.name,
        document_count: 0,
        brd_count: 0,
        created_at: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
      setOpen(false);
      setProjectName('');
      navigate(`/projects/${response.project_id}`);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create project' });
    } finally {
      setCreating(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.project_id}`);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, project: Project) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    // Don't clear selectedProject here - it might be needed for dialogs
  };

  const handleRenameClick = () => {
    console.log('Rename clicked for project:', selectedProject);
    if (selectedProject) {
      setNewProjectName(selectedProject.name);
      setRenameDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    console.log('Delete clicked for project:', selectedProject);
    if (selectedProject) {
      console.log('Opening delete dialog for project:', selectedProject.name);
      console.log('Setting deleteDialogOpen to true');
      setDeleteDialogOpen(true);
      console.log('deleteDialogOpen state should now be true');
    } else {
      console.log('No selected project for delete');
    }
    handleMenuClose();
  };

  const handleRenameConfirm = async () => {
    if (!selectedProject || !newProjectName.trim()) return;

    setRenaming(true);
    try {
      await renameProject(selectedProject.project_id, newProjectName);
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === selectedProject.project_id
            ? { ...p, name: newProjectName }
            : p
        ),
      });
      setRenameDialogOpen(false);
      setNewProjectName('');
      setSelectedProject(null);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to rename project' });
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    console.log('handleDeleteConfirm function called');
    if (!selectedProject) {
      console.log('No selected project, returning early');
      return;
    }

    const projectIdToDelete = selectedProject.project_id;
    console.log('Attempting to delete project:', projectIdToDelete);
    setDeleting(true);
    try {
      const result = await deleteProject(projectIdToDelete);
      console.log('Delete project result:', result);

      // Update state by filtering out the deleted project
      const updatedProjects = state.projects.filter(p => p.project_id !== projectIdToDelete);
      console.log('Projects before deletion:', state.projects.length);
      console.log('Projects after deletion:', updatedProjects.length);

      dispatch({
        type: 'SET_PROJECTS',
        payload: updatedProjects,
      });

      // Clear any error state
      dispatch({ type: 'SET_ERROR', payload: null });

      setDeleteDialogOpen(false);
      setSelectedProject(null);
      console.log('Project deleted successfully from frontend state');

      // Optional: Force a refresh of the projects list to ensure consistency
      // This will reload from the backend to make sure our local state matches
      try {
        const refreshResponse = await getProjects();
        dispatch({ type: 'SET_PROJECTS', payload: refreshResponse.projects });
        console.log('Projects list refreshed after deletion');
      } catch (refreshError) {
        console.warn('Failed to refresh projects list after deletion:', refreshError);
        // Don't show error to user since the deletion itself succeeded
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}` });
      // Keep dialog open on error so user can see the error and try again
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  console.log('Rendering component, deleteDialogOpen:', deleteDialogOpen);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          BRD Projects
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Create Project
        </Button>
      </Box>

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {state.error}
        </Alert>
      )}

      {state.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {state.projects.map((project) => (
            <Box key={project.project_id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 3 },
                }}
                onClick={() => handleProjectClick(project)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h2">
                        {project.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, project)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, fontSize: 'small' }} />
                    <Typography variant="body2" color="text.secondary">
                      {project.document_count} documents
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AutoAwesomeIcon sx={{ mr: 1, fontSize: 'small' }} />
                    <Typography variant="body2" color="text.secondary">
                      {project.brd_count} BRDs
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(project.created_at)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Chip
                    label={`${project.document_count} docs`}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${project.brd_count} BRDs`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {state.projects.length === 0 && !state.loading && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first BRD project to get started
          </Typography>
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New BRD Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={!projectName.trim() || creating}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRenameClick}>
          <EditIcon sx={{ mr: 1 }} />
          Rename
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => {
        setRenameDialogOpen(false);
        setSelectedProject(null);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Project Name"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRenameConfirm}
            variant="contained"
            disabled={!newProjectName.trim() || renaming}
          >
            {renaming ? <CircularProgress size={20} /> : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          console.log('Delete dialog closed');
          setDeleteDialogOpen(false);
          setSelectedProject(null);
        }}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone and will permanently delete all associated documents and BRDs.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              console.log('Cancel button clicked in delete dialog');
              setDeleteDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              console.log('Delete confirm button clicked');
              try {
                handleDeleteConfirm();
              } catch (error) {
                console.error('Error in handleDeleteConfirm:', error);
              }
            }}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectList;
