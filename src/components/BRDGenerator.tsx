
// src/components/BRDGenerator.tsx
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography,
  CircularProgress, Alert, LinearProgress
} from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, Download as DownloadIcon } from '@mui/icons-material';
import { generateBRD } from '../services/api';
import { useUi } from '../context/UiContext';

interface BRDGeneratorProps {
  projectId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const BRDGenerator: React.FC<BRDGeneratorProps> = ({ projectId, onClose, onSuccess }) => {
  const [requirements, setRequirements] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { showToast } = useUi();

  const handleGenerate = async () => {
    if (!requirements.trim()) return;
    setGenerating(true);
    setProgress(0);
    setError(null);
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + 10;
        });
      }, 500);

      await generateBRD(projectId, requirements);
      clearInterval(progressInterval);
      setProgress(100);
      setCompleted(true);
      showToast('BRD generated successfully', 'success');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate BRD');
      setProgress(0);
      showToast('Failed to generate BRD', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => { if (!generating) onClose(); };

  return (
    <Dialog open maxWidth="md" fullWidth onClose={handleClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <AutoAwesomeIcon sx={{ mr: 1 }} /> Generate BRD
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter your requirements for the BRD. The AI will analyze your uploaded documents and generate a comprehensive Business Requirements Document.
          </Typography>
        </Box>
        <TextField
          label="Requirements"
          multiline rows={6} fullWidth
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Describe the business requirements, objectives, and scope for the BRD..."
          disabled={generating}
          sx={{ mb: 3 }}
        />
        {generating && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>Generating BRD... This may take a few minutes.</Typography>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Processing documents and generating content...
            </Typography>
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {completed && <Alert severity="success" sx={{ mb: 3 }}>BRD generated and saved successfully! You can now view and download it from the BRD list.</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={generating}>{completed ? 'Close' : 'Cancel'}</Button>
        {!completed && (
          <Button
            onClick={handleGenerate}
            variant="contained"
            disabled={!requirements.trim() || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {generating ? 'Generating...' : 'Generate & Save BRD'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BRDGenerator;
