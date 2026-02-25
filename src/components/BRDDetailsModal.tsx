import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box,
  IconButton, Tooltip, Stack, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Close as CloseIcon, Description as DescriptionIcon, Schedule as ScheduleIcon,
  ContentCopy as CopyIcon, Visibility as VisibilityIcon
} from '@mui/icons-material';
import { BRD } from '../types';
import { useUi } from '../context/UiContext';
import { getDocumentDownloadUrl } from '../services/api';
import DocumentPreviewDialog from './DocumentPreviewDialog';

interface BRDDetailsModalProps {
  open: boolean;
  onClose: () => void;
  brd: BRD | null;
}

const BRDDetailsModal: React.FC<BRDDetailsModalProps> = ({ open, onClose, brd }) => {
  const { showToast } = useUi();

  // Preview dialog state (hooks must be unconditional)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | undefined>(undefined);

  // Derive projectId from URL: /projects/:projectId (unconditional hook)
  const projectId = useMemo(() => {
    const match = window.location.pathname.match(/\/projects\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  // Build filename/id pairs even if brd is null (just results in an empty list)
  const inputPairs = useMemo(
    () =>
      (brd?.input_document_filenames ?? []).map((name, idx) => ({
        name,
        id: brd?.input_document_ids ? brd.input_document_ids[idx] : undefined,
      })),
    [brd]
  );

  const formatDate = (s?: string) => (s ? new Date(s).toLocaleString() : '');

  const copyRequirements = async () => {
    try {
      await navigator.clipboard.writeText(brd?.requirements_preview ?? '');
      showToast('Requirements copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handlePreview = (docId?: string, name?: string) => {
    if (!docId || !projectId) return;
    const url = getDocumentDownloadUrl(projectId, docId);
    setPreviewUrl(url);
    setPreviewName(name);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewName(undefined);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">BRD Details</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* If no BRD is provided, show a lightweight message */}
          {!brd ? (
            <Typography variant="body2" color="text.secondary">
              No BRD selected.
            </Typography>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>{brd.filename}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 'small' }} />
                  <Typography variant="body2" color="text.secondary">
                    Generated on {formatDate(brd.generated_at)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">•</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {brd.document_count} documents used
                  </Typography>
                </Box>
              </Box>

              {/* Requirements */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    Requirements
                  </Typography>
                  <Tooltip title="Copy to clipboard">
                    <IconButton size="small" onClick={copyRequirements} aria-label="copy-requirements">
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {brd.requirements_preview ?? 'No preview available'}
                </Typography>
              </Box>

              {/* Input Documents */}
              <Box>
                <Typography variant="h6" gutterBottom>Input Documents</Typography>
                {inputPairs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No input documents specified
                  </Typography>
                ) : (
                  <List dense sx={{ mt: 1 }}>
                    {inputPairs.map((doc, i) => (
                      <ListItem key={`${doc.name}-${i}`} divider>
                        <ListItemText
                          primary={doc.name}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title={doc.id ? 'Preview' : 'Preview unavailable'}>
                            {/* wrapping in <span> so disabled IconButton still shows tooltip */}
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handlePreview(doc.id, doc.name)}
                                disabled={!doc.id}
                                color="primary"
                                aria-label="preview-document"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* In‑app Document Preview */}
      <DocumentPreviewDialog
        open={previewOpen}
        onClose={handleClosePreview}
        url={previewUrl}
        filename={previewName}
      />
    </>
  );
};

export default BRDDetailsModal;