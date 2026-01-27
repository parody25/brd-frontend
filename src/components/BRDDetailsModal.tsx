
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, Divider, IconButton, Tooltip, Stack
} from '@mui/material';
import { Close as CloseIcon, Description as DescriptionIcon, Schedule as ScheduleIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { BRD } from '../types';
import { useUi } from '../context/UiContext';

interface BRDDetailsModalProps {
  open: boolean;
  onClose: () => void;
  brd: BRD | null;
}
const BRDDetailsModal: React.FC<BRDDetailsModalProps> = ({ open, onClose, brd }) => {
  const { showToast } = useUi();
  if (!brd) return null;

  const formatDate = (s: string) => new Date(s).toLocaleString();

  const copyRequirements = async () => {
    try {
      await navigator.clipboard.writeText(brd.requirements_preview || '');
      showToast('Requirements copied to clipboard', 'success');
    } catch { showToast('Failed to copy', 'error'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">BRD Details</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>{brd.filename}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <ScheduleIcon sx={{ fontSize: 'small' }} />
            <Typography variant="body2" color="text.secondary">Generated on {formatDate(brd.generated_at)}</Typography>
            <Chip label={`${brd.document_count} documents used`} size="small" color="primary" variant="outlined" />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>Requirements</Typography>
            <Tooltip title="Copy to clipboard">
              <IconButton size="small" onClick={copyRequirements}><CopyIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {brd.requirements_preview || 'No preview available'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>Input Documents</Typography>
          {brd.input_document_filenames.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No input documents specified</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {brd.input_document_filenames.map((f, i) => (
                <Chip key={i} label={f} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BRDDetailsModal;
