import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography
} from '@mui/material';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Fully qualified URL to the document endpoint */
  url: string | null;
  /** Optional filename for display */
  filename?: string;
}

const looksLikePdf = (filename?: string) =>
  !!filename && filename.toLowerCase().endsWith('.pdf');

const DocumentPreviewDialog: React.FC<Props> = ({ open, onClose, url, filename }) => {
  const isPdf = looksLikePdf(filename);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {filename ? `Preview: ${filename}` : 'Document Preview'}
      </DialogTitle>
      <DialogContent dividers>
        {url ? (
          isPdf ? (
            <Box sx={{ height: '70vh' }}>
              <iframe
                title="Document Preview"
                src={url}
                style={{ width: '100%', height: '100%', border: 0 }}
              />
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This file type cannot be previewed in the browser. Open it in a new tab or download it.
              </Typography>
              <Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} variant="outlined">
                Open in New Tab
              </Button>
            </Box>
          )
        ) : (
          <Typography variant="body2" color="text.secondary">
            No preview available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {!isPdf && url && (
          <Button onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
            Open in New Tab
          </Button>
        )}
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreviewDialog;