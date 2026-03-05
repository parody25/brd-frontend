import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

interface SyncProgressModalProps {
  open: boolean;
  onClose: () => void;
  progress: number;
  message: string;
  isSyncing: boolean;
  onCancel?: () => void;
  results?: {
    success: Array<{
      issue_key: string;
      issue_id: string;
      url: string;
      type: string;
    }>;
    failed: Array<{
      title: string;
      error: string;
    }>;
    total: number;
  } | null;
}

const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  open,
  onClose,
  progress,
  message,
  isSyncing,
  onCancel,
  results
}) => {
  const getProgressColor = () => {
    if (progress === 100 && results) {
      return results.failed.length > 0 ? 'warning' : 'success';
    }
    return 'primary';
  };

  const getStatusIcon = () => {
    if (progress === 100 && results) {
      return results.failed.length > 0 ? <ErrorIcon color="error" /> : <CheckCircleIcon color="success" />;
    }
    return <SyncIcon color="primary" />;
  };

  const getStatusText = () => {
    if (progress === 100 && results) {
      if (results.failed.length > 0) {
        return `Sync completed with ${results.failed.length} errors`;
      }
      return 'Sync completed successfully';
    }
    return isSyncing ? 'Syncing to Jira...' : 'Preparing sync...';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStatusIcon()}
          <Typography variant="h6">Jira Sync Progress</Typography>
          <Chip 
            label={getStatusText()} 
            color={getProgressColor()} 
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Progress Bar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary">
              {progress}%
            </Typography>
          </Box>
          
          {/* Status Message */}
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
          
          {/* Results Summary */}
          {results && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Sync Results:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`Success: ${results.success.length}`}
                  color="success"
                  variant="outlined"
                />
                <Chip 
                  label={`Failed: ${results.failed.length}`}
                  color={results.failed.length > 0 ? "error" : "default"}
                  variant="outlined"
                />
                <Chip 
                  label={`Total: ${results.total}`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              {/* Success List */}
              {results.success.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Created Issues:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {results.success.map((issue, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={issue.type} size="small" color="primary" />
                          <Typography variant="body2">
                            {issue.issue_key} - {issue.issue_id}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          color="primary"
                        >
                          View in Jira
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Failed List */}
              {results.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Failed Issues:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {results.failed.map((failed, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          border: '1px solid',
                          borderColor: 'error.main',
                          borderRadius: 1,
                          backgroundColor: 'error.light',
                          color: 'error.contrastText'
                        }}
                      >
                        <Typography variant="body2">
                          {failed.title}
                        </Typography>
                        <Typography variant="caption">
                          {failed.error}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        {isSyncing && onCancel && (
          <Button
            onClick={onCancel}
            startIcon={<CancelIcon />}
            color="error"
            variant="outlined"
          >
            Cancel Sync
          </Button>
        )}
        <Button onClick={onClose} variant="contained" color="primary">
          {progress === 100 ? 'Close' : 'Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SyncProgressModal;