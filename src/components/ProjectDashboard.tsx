import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  AutoAwesome as AutoAwesomeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

import { useAppContext } from '../context/AppContext';
import {
  getProjectDocuments,
  deleteDocument,
} from '../services/api';
import { getDocumentDownloadUrl } from '../services/api';

import { Document as DocumentType, BRD } from '../types';

import DocumentUpload from './DocumentUpload';
import BRDGenerator from './BRDGenerator';
import BRDList from './BRDList';
import BRDDetailsModal from './BRDDetailsModal';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import UserStoriesGenerator from './UserStoriesGenerator';
import UserStoriesList from './UserStoriesList';
import UserStoriesListWithJira from './UserStoriesListWithJira';
import { useUi } from '../context/UiContext';

const ProjectDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { showToast } = useUi();

  // Data
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [showUpload, setShowUpload] = useState(false);
  const [showBRDGenerator, setShowBRDGenerator] = useState(false);
  const [showBRDDetails, setShowBRDDetails] = useState(false);

  // BRD selection
  const [selectedBRD, setSelectedBRD] = useState<BRD | null>(null);
  const [brdRefreshTrigger, setBrdRefreshTrigger] = useState(0);

  // Tabs
  const [tab, setTab] = useState(0);

  // User Stories
  const [showUserStoriesGenerator, setShowUserStoriesGenerator] = useState(false);
  const [userStoriesRefreshTrigger, setUserStoriesRefreshTrigger] = useState(0);

  // Search
  const [docQuery, setDocQuery] = useState('');

  // Delete confirm
  const [confirm, setConfirm] = useState<{ open: boolean; docId?: string; docName?: string }>({ open: false });

  // Document Preview (Documents tab)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | undefined>(undefined);

  const currentProject = state.projects.find(p => p.project_id === projectId);

  const loadDocuments = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const response = await getProjectDocuments(projectId);
      setDocuments(response.documents);
      setError(null);
    } catch {
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

      // Decrement count on project card
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === projectId ? { ...p, document_count: Math.max(0, p.document_count - 1) } : p
        ),
      });

      showToast('Document deleted', 'success');
    } catch {
      showToast('Failed to delete document', 'error');
    }
  };

  const handleUploadSuccess = (document: DocumentType) => {
    setDocuments(prev => [...prev, document]);
    setShowUpload(false);

    // Increment project counter
    dispatch({
      type: 'SET_PROJECTS',
      payload: state.projects.map(p =>
        p.project_id === projectId ? { ...p, document_count: p.document_count + 1 } : p
      ),
    });

    showToast('Document uploaded', 'success');
  };

  // Preview handler for the Documents list
  const handlePreviewDocument = (doc: DocumentType) => {
    if (!projectId) return;
    const url = getDocumentDownloadUrl(projectId, doc.id); // append ?format=txt if you prefer text
    setPreviewUrl(url);
    setPreviewName(doc.filename);
    setPreviewOpen(true);
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const filteredDocs = useMemo(
    () => documents.filter(d => d.filename.toLowerCase().includes(docQuery.toLowerCase())),
    [documents, docQuery]
  );

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
          underline="hover"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">{currentProject.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
            <Chip label={`${currentProject.document_count} documents`} size="small" color="primary" variant="outlined" />
            <Chip label={`${currentProject.brd_count} BRDs`} size="small" color="secondary" variant="outlined" />
            <Chip label={`${state.user_stories.length} User Stories`} size="small" color="info" variant="outlined" />
            <Typography variant="body2" color="text.secondary">Created: {formatDate(currentProject.created_at)}</Typography>
          </Box>
        </Box>

        <Tooltip title={documents.length === 0 ? 'Upload documents first' : 'Generate a new BRD'}>
          <span>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setShowBRDGenerator(true)}
              disabled={documents.length === 0}
            >
              Generate BRD
            </Button>
          </span>
        </Tooltip>

        <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setShowUpload(true)}>
          Upload Document
        </Button>
        
        <Tooltip title={currentProject.brd_count === 0 ? 'Generate a BRD first' : 'Generate User Stories from BRD'}>
          <span>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setShowUserStoriesGenerator(true)}
              disabled={currentProject.brd_count === 0}
            >
              Generate User Stories
            </Button>
          </span>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label={`Documents (${documents.length})`} />
          <Tab label={`BRDs (${currentProject.brd_count})`} />
          <Tab label={`User Stories (${state.user_stories.length})`} />
        </Tabs>
      </Paper>

      {/* Documents Tab */}
      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ maxWidth: 420, mb: 2 }}>
            <SearchBar placeholder="Search documents..." onChange={setDocQuery} />
          </Box>
          <Divider sx={{ mb: 2 }} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredDocs.length === 0 ? (
            <EmptyState
              icon={<DescriptionIcon fontSize="inherit" />}
              title={documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents'}
              subtitle={documents.length === 0 ? 'Upload business documents to generate BRDs' : 'Try a different search term'}
            />
          ) : (
            <List>
              {filteredDocs.map(document => (
                <ListItem
                  key={document.id}
                  divider
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Preview button (new) */}
                      <IconButton
                        edge="end"
                        onClick={() => handlePreviewDocument(document)}
                        title="Preview"
                        aria-label="preview-document"
                      >
                        <VisibilityIcon />
                      </IconButton>

                      {/* Existing Delete */}
                      <IconButton
                        edge="end"
                        onClick={() => setConfirm({ open: true, docId: document.id, docName: document.filename })}
                        color="error"
                        title="Delete"
                        aria-label="delete-document"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={document.filename}
                    secondary={`Uploaded: ${formatDate(document.uploaded_at)}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* BRDs Tab */}
      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <BRDList
            projectId={projectId!}
            refreshTrigger={brdRefreshTrigger}
            onViewDetails={(brd: BRD) => { setSelectedBRD(brd); setShowBRDDetails(true); }}
          />
        </Paper>
      )}

      {/* User Stories Tab */}
      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <UserStoriesListWithJira
            projectId={projectId!}
            refreshTrigger={userStoriesRefreshTrigger}
          />
        </Paper>
      )}

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
          onSuccess={() => { setBrdRefreshTrigger(prev => prev + 1); setShowBRDGenerator(false); }}
        />
      )}

      {/* User Stories Generator Dialog */}
      {showUserStoriesGenerator && (
        <UserStoriesGenerator
          projectId={projectId!}
          open={showUserStoriesGenerator}
          onClose={() => setShowUserStoriesGenerator(false)}
          onSuccess={() => { setUserStoriesRefreshTrigger(prev => prev + 1); setShowUserStoriesGenerator(false); }}
        />
      )}

      {/* BRD Details Modal (no projectId prop needed; modal derives it from URL in your version) */}
      <BRDDetailsModal
        open={showBRDDetails}
        onClose={() => { setShowBRDDetails(false); setSelectedBRD(null); }}
        brd={selectedBRD}
      />

      {/* Confirm delete document */}
      <ConfirmDialog
        open={confirm.open}
        title="Delete Document"
        message={<>Are you sure you want to delete "<b>{confirm.docName}</b>"? This action cannot be undone.</>}
        onClose={() => setConfirm({ open: false })}
        onConfirm={() => { if (confirm.docId) handleDeleteDocument(confirm.docId); setConfirm({ open: false }); }}
        confirmColor="error"
        confirmText="Delete"
      />

      {/* Document preview dialog (Documents tab) */}
      <DocumentPreviewDialog
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewUrl(null); setPreviewName(undefined); }}
        url={previewUrl}
        filename={previewName}
      />
    </Box>
  );
};

export default ProjectDashboard;
