
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, List, ListItem, ListItemText,
  IconButton, Alert, CircularProgress, Divider, Chip, Breadcrumbs, Link, Tabs, Tab, Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Delete as DeleteIcon, CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon, Folder as FolderIcon, AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { getProjectDocuments, deleteDocument } from '../services/api';
import { Document as DocumentType, BRD } from '../types';
import DocumentUpload from './DocumentUpload';
import BRDGenerator from './BRDGenerator';
import BRDList from './BRDList';
import BRDDetailsModal from './BRDDetailsModal';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import ConfirmDialog from './ConfirmDialog';
import { useUi } from '../context/UiContext';

const ProjectDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { showToast } = useUi();

  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showBRDGenerator, setShowBRDGenerator] = useState(false);
  const [showBRDDetails, setShowBRDDetails] = useState(false);
  const [selectedBRD, setSelectedBRD] = useState<BRD | null>(null);
  const [brdRefreshTrigger, setBrdRefreshTrigger] = useState(0);
  const [tab, setTab] = useState(0);
  const [docQuery, setDocQuery] = useState('');
  const [confirm, setConfirm] = useState<{ open: boolean; docId?: string; docName?: string }>({ open: false });

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
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === projectId ? { ...p, document_count: p.document_count - 1 } : p
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
    dispatch({
      type: 'SET_PROJECTS',
      payload: state.projects.map(p =>
        p.project_id === projectId ? { ...p, document_count: p.document_count + 1 } : p
      ),
    });
    showToast('Document uploaded', 'success');
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
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label={`Documents (${documents.length})`} />
          <Tab label={`BRDs (${currentProject.brd_count})`} />
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
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
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
                    <IconButton edge="end" onClick={() => setConfirm({ open: true, docId: document.id, docName: document.filename })} color="error">
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={document.filename} secondary={`Uploaded: ${formatDate(document.uploaded_at)}`} />
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
            setBrdRefreshTrigger(prev => prev + 1);
            setShowBRDGenerator(false);
          }}
        />
      )}

      {/* BRD Details Modal */}
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
    </Box>
  );
};

export default ProjectDashboard;
