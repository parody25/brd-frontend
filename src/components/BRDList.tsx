import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
// ✅ Add missing imports
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { getProjectBRDs, downloadBRD, deleteBRD } from '../services/api';
import { BRD } from '../types';
import { saveAs } from 'file-saver';
import SearchBar from './SearchBar';
// import ConfirmDialog from './ConfirmDialog'; // ❌ Not used, safe to remove
import EmptyState from './EmptyState';
import { useUi } from '../context/UiContext';

interface BRDListProps {
  projectId: string;
  onViewDetails?: (brd: BRD) => void;
  refreshTrigger?: number;
}

type SortKey = 'filename' | 'document_count' | 'generated_at';

const BRDList: React.FC<BRDListProps> = ({ projectId, onViewDetails, refreshTrigger }) => {
  const { state, dispatch } = useAppContext();
  const { showToast } = useUi();

  const [brds, setBrds] = useState<BRD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ✅ Proper delete dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brdToDelete, setBrdToDelete] = useState<BRD | null>(null);

  // ✅ Download naming dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [brdToDownload, setBrdToDownload] = useState<BRD | null>(null);
  const [downloadFilename, setDownloadFilename] = useState('');

  // ✅ Missing view state: search + sort
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('generated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadBRDs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProjectBRDs(projectId);
      setBrds(response.brds);
      dispatch({ type: 'SET_BRDS', payload: response.brds });
      setError(null);
    } catch {
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
    const nameWithoutExt = brd.filename.replace(/\.[^/.]+$/, '');
    setDownloadFilename(nameWithoutExt);
    setDownloadDialogOpen(true);
  };

  const handleDownloadConfirm = async () => {
    if (!brdToDownload || !downloadFilename.trim()) return;

    try {
      setDownloadingId(brdToDownload.id);
      const blob = await downloadBRD(projectId, brdToDownload.id);
      const filename = downloadFilename.trim();
      const finalFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
      saveAs(blob, finalFilename);
      setDownloadDialogOpen(false);
      setBrdToDownload(null);
      setDownloadFilename('');
    } catch {
      setError('Failed to download BRD');
    } finally {
      setDownloadingId(null);
    }
  };

  // ✅ Define missing delete click handler
  const handleDeleteClick = (brd: BRD) => {
    setBrdToDelete(brd);
    setDeleteConfirmOpen(true);
  };

  // ✅ Fix confirm handler to use brdToDelete instead of a non-existent `confirm.brd`
  const handleDeleteConfirm = async () => {
    if (!brdToDelete) return;

    try {
      setDeletingId(brdToDelete.id);
      await deleteBRD(projectId, brdToDelete.id);

      setBrds(prev => prev.filter(b => b.id !== brdToDelete.id));
      dispatch({ type: 'REMOVE_BRD', payload: brdToDelete.id });

      // Decrement count on project card safely
      dispatch({
        type: 'SET_PROJECTS',
        payload: state.projects.map(p =>
          p.project_id === projectId ? { ...p, brd_count: Math.max(0, p.brd_count - 1) } : p
        ),
      });

      showToast('BRD deleted', 'success');
    } catch {
      showToast('Failed to delete BRD', 'error');
    } finally {
      setDeletingId(null);
      setDeleteConfirmOpen(false);
      setBrdToDelete(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const truncate = (t?: string, n = 100) => (!t ? 'No preview available' : t.length > n ? t.substring(0, n) + '...' : t);

  const filteredSorted = useMemo(() => {
    const q = query.toLowerCase();
    const f = brds.filter(b =>
      b.filename.toLowerCase().includes(q) ||
      (b.requirements_preview || '').toLowerCase().includes(q)
    );

    const s = [...f].sort((a, b) => {
      let va: any = (a as any)[sortBy];
      let vb: any = (b as any)[sortBy];

      if (sortBy === 'generated_at') {
        va = new Date(a.generated_at).getTime();
        vb = new Date(b.generated_at).getTime();
      }

      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return s;
  }, [brds, query, sortBy, sortDir]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box sx={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
          <SearchBar placeholder="Search BRDs (filename or requirements)..." onChange={setQuery} />
        </Box>
        <TextField
          select
          size="small"
          label="Sort by"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
        >
          <MenuItem value="generated_at">Generated date</MenuItem>
          <MenuItem value="filename">Filename</MenuItem>
          <MenuItem value="document_count">Documents used</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Direction"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
        >
          <MenuItem value="desc">Desc</MenuItem>
          <MenuItem value="asc">Asc</MenuItem>
        </TextField>
      </Box>

      <Typography variant="h6" gutterBottom>Generated BRDs</Typography>

      {filteredSorted.length === 0 ? (
        <EmptyState
          icon={<DescriptionIcon fontSize="inherit" />}
          title="No BRDs yet"
          subtitle={brds.length === 0 ? 'Generate your first BRD to see it listed here' : 'Try a different search term'}
        />
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
              {filteredSorted.map((brd) => (
                <TableRow key={brd.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{brd.filename}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{truncate(brd.requirements_preview, 120)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${brd.document_count} docs`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{formatDate(brd.generated_at)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {onViewDetails && (
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => onViewDetails(brd)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
            onKeyDown={(e) => {
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
