import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { getProjectDocuments, deleteDocument } from '../services/api';
import { Document as DocumentType, BRD } from '../types';
import DocumentUpload from './DocumentUpload';
import BRDGenerator from './BRDGenerator';
import BRDList from './BRDList';
import BRDDetailsModal from './BRDDetailsModal';

const ProjectDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showBRDGenerator, setShowBRDGenerator] = useState(false);
  const [showBRDDetails, setShowBRDDetails] = useState(false);
  const [selectedBRD, setSelectedBRD] = useState<BRD | null>(null);
  const [brdRefreshTrigger, setBrdRefreshTrigger] = useState(0);

  const currentProject = state.projects.find(p => p.project_id === projectId);

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await getProjectDocuments(projectId);
      setDocuments(response.documents);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!currentProject) {
      navigate('/');
      return;
    }

    dispatch({ type: 'SET_CURRENT_PROJECT', payload: currentProject });
    loadDocuments();
  }, [projectId, currentProject, navigate, dispatch, loadDocuments]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!projectId) return;

    try {
      await deleteDocument(projectId, documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      // Update project document count
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === projectId
            ? { ...p, document_count: p.document_count - 1 }
            : p
        ),
      });
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleUploadSuccess = (document: DocumentType) => {
    setDocuments(prev => [...prev, document]);
    setShowUpload(false);
    // Update project document count
    dispatch({
      type: 'SET_PROJECTS',
      payload: state.projects.map(p =>
        p.project_id === projectId
          ? { ...p, document_count: p.document_count + 1 }
          : p
      ),
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!currentProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <FolderIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Projects
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {currentProject.name}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {currentProject.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip
              label={`${currentProject.document_count} documents`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={`${currentProject.brd_count} BRDs`}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ mr: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              Created: {formatDate(currentProject.created_at)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setShowUpload(true)}
        >
          Upload Document
        </Button>
        <Button
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          onClick={() => setShowBRDGenerator(true)}
          disabled={documents.length === 0}
        >
          Generate BRD
        </Button>
      </Box>

      {/* Documents Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documents
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No documents uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload business documents to generate BRDs
            </Typography>
          </Box>
        ) : (
          <List>
            {documents.map((document) => (
              <ListItem key={document.id} divider>
                <ListItemText
                  primary={document.filename}
                  secondary={`Uploaded: ${formatDate(document.uploaded_at)}`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteDocument(document.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* BRD Section */}
      <Paper sx={{ p: 3 }}>
        <BRDList
          projectId={projectId!}
          refreshTrigger={brdRefreshTrigger}
          onViewDetails={(brd: BRD) => {
            setSelectedBRD(brd);
            setShowBRDDetails(true);
          }}
        />
      </Paper>

      {/* Upload Dialog */}
      {showUpload && (
        <DocumentUpload
          projectId={projectId!}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* BRD Generator Dialog */}
      {showBRDGenerator && (
        <BRDGenerator
          projectId={projectId!}
          onClose={() => setShowBRDGenerator(false)}
          onSuccess={() => {
            // Refresh BRD list after generation
            setBrdRefreshTrigger(prev => prev + 1);
            setShowBRDGenerator(false);
          }}
        />
      )}

      {/* BRD Details Modal */}
      <BRDDetailsModal
        open={showBRDDetails}
        onClose={() => {
          setShowBRDDetails(false);
          setSelectedBRD(null);
        }}
        brd={selectedBRD}
      />
    </Box>
  );
};

export default ProjectDashboard;
