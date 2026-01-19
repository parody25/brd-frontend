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
} from '@mui/material';
import { Add as AddIcon, Folder as FolderIcon, Description as DescriptionIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getProjects, createProject } from '../services/api';
import { Project } from '../types';

const ProjectList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await getProjects();
        dispatch({ type: 'SET_PROJECTS', payload: response.projects });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {project.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, fontSize: 'small' }} />
                    <Typography variant="body2" color="text.secondary">
                      {project.document_count} documents
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
    </Box>
  );
};

export default ProjectList;
