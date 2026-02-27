import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Typography
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { useUi } from '../context/UiContext';
import { generateUserStories } from '../services/api';

interface UserStoriesGeneratorProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UserStoriesGenerator: React.FC<UserStoriesGeneratorProps> = ({
  projectId,
  open,
  onClose,
  onSuccess
}) => {
  const { state } = useAppContext();
  const { showToast } = useUi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brdId, setBrdId] = useState<string>('');
  const [version, setVersion] = useState<string>('v1.0');

  // Filter BRDs for the current project
  const availableBRDs = state.brds.filter(brd => brd.id);

  useEffect(() => {
    if (open && availableBRDs.length > 0) {
      setBrdId(availableBRDs[0].id);
    }
  }, [open, availableBRDs]);

  const handleGenerate = async () => {
    if (!brdId || !version) {
      setError('Please select a BRD and provide a version');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateUserStories(projectId, brdId, version);
      showToast(`User Stories generated successfully: ${response.filename}`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate User Stories');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBrdId('');
    setVersion('v1.0');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate User Stories</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {availableBRDs.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No BRDs available. Please generate a BRD first before creating User Stories.
          </Alert>
        ) : (
          <>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>BRD</InputLabel>
              <Select
                value={brdId}
                label="BRD"
                onChange={(e) => setBrdId(e.target.value)}
              >
                {availableBRDs.map(brd => (
                  <MenuItem key={brd.id} value={brd.id}>
                    {brd.filename} ({brd.input_document_filenames.join(', ')})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.0, 1.2.3"
              required
            />

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                What will be generated:
              </Typography>
              <Typography variant="body2">
                • User Stories sheet with story details and acceptance criteria
              </Typography>
              <Typography variant="body2">
                • Epics sheet with related story groupings
              </Typography>
              <Typography variant="body2">
                • Dependencies sheet showing story relationships
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={loading || availableBRDs.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Generating...' : 'Generate User Stories'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserStoriesGenerator;