import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { getProjectBRDs, downloadBRD, deleteBRD } from '../services/api';
import { BRD } from '../types';
import { saveAs } from 'file-saver';

interface BRDListProps {
  projectId: string;
  onViewDetails?: (brd: BRD) => void;
  refreshTrigger?: number;
}

const BRDList: React.FC<BRDListProps> = ({ projectId, onViewDetails, refreshTrigger }) => {
  const { state, dispatch } = useAppContext();
  const [brds, setBrds] = useState<BRD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brdToDelete, setBrdToDelete] = useState<BRD | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [brdToDownload, setBrdToDownload] = useState<BRD | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('');

  const loadBRDs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectBRDs(projectId);
      setBrds(response.brds);
      dispatch({ type: 'SET_BRDS', payload: response.brds });
      setError(null);
    } catch (err) {
      setError('Failed to load BRDs');
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    loadBRDs();
  }, [loadBRDs, refreshTrigger]);

  const handleDownloadClick = (brd: BRD) => {
    setBrdToDownload(brd);
    // Pre-fill with the original filename but without extension for easy editing
    const nameWithoutExt = brd.filename.replace(/\.[^/.]+$/, '');
    setDownloadFilename(nameWithoutExt);
    setDownloadDialogOpen(true);
  };

  const handleDownloadConfirm = async () => {
    if (!brdToDownload || !downloadFilename.trim()) return;

    try {
      setDownloadingId(brdToDownload.id);
      const blob = await downloadBRD(projectId, brdToDownload.id);
      // Add .docx extension if not present
      const filename = downloadFilename.trim();
      const finalFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
      saveAs(blob, finalFilename);
      setDownloadDialogOpen(false);
      setBrdToDownload(null);
      setDownloadFilename('');
    } catch (err) {
      setError('Failed to download BRD');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteClick = (brd: BRD) => {
    setBrdToDelete(brd);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!brdToDelete) return;

    try {
      setDeletingId(brdToDelete.id);
      await deleteBRD(projectId, brdToDelete.id);
      setBrds(prev => prev.filter(b => b.id !== brdToDelete.id));
      dispatch({ type: 'REMOVE_BRD', payload: brdToDelete.id });

      // Update project BRD count
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === projectId
            ? { ...p, brd_count: p.brd_count - 1 }
            : p
        ),
      });
    } catch (err) {
      setError('Failed to delete BRD');
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setBrdToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return 'No preview available';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        Generated BRDs
      </Typography>

      {brds.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No BRDs generated yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate your first BRD to see it listed here
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Requirements Preview</TableCell>
                <TableCell>Documents Used</TableCell>
                <TableCell>Generated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brds.map((brd) => (
                <TableRow key={brd.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {brd.filename}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {truncateText(brd.requirements_preview, 100)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${brd.document_count} docs`}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(brd.generated_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {onViewDetails && (
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(brd)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadClick(brd)}
                      disabled={downloadingId === brd.id}
                      title="Download"
                    >
                      {downloadingId === brd.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DownloadIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(brd)}
                      disabled={deletingId === brd.id}
                      color="error"
                      title="Delete"
                    >
                      {deletingId === brd.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete BRD</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{brdToDelete?.filename}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Download Naming Dialog */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Download BRD</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter a name for your BRD file. The .docx extension will be added automatically if not included.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Filename"
            fullWidth
            variant="outlined"
            value={downloadFilename}
            onChange={(e) => setDownloadFilename(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDownloadConfirm();
              }
            }}
            placeholder="Enter filename (e.g., Project_BRD)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDownloadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDownloadConfirm}
            variant="contained"
            disabled={!downloadFilename.trim() || downloadingId === brdToDownload?.id}
          >
            {downloadingId === brdToDownload?.id ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Downloading...
              </>
            ) : (
              'Download'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BRDList;
