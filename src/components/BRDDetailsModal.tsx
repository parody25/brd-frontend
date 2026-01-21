import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { BRD } from '../types';

interface BRDDetailsModalProps {
  open: boolean;
  onClose: () => void;
  brd: BRD | null;
}

const BRDDetailsModal: React.FC<BRDDetailsModalProps> = ({ open, onClose, brd }) => {
  if (!brd) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            BRD Details
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {brd.filename}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ScheduleIcon sx={{ mr: 1, fontSize: 'small' }} />
            <Typography variant="body2" color="text.secondary">
              Generated on {formatDate(brd.generated_at)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={`${brd.document_count} documents used`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Requirements
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {brd.requirements_preview}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Input Documents
          </Typography>
          {brd.input_document_filenames.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No input documents specified
            </Typography>
          ) : (
            <List dense>
              {brd.input_document_filenames.map((filename, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={filename}
                    primaryTypographyProps={{
                      variant: 'body2',
                    }}
                  />
                </ListItem>
              ))}
            </List>
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
