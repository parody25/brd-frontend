import React from 'react';
import {
  Chip,
  Box,
  Typography,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

interface SyncStatusProps {
  status: 'not_synced' | 'syncing' | 'synced' | 'failed';
  lastSync?: string;
  onRetry?: () => void;
  onSync?: () => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
  status,
  lastSync,
  onRetry,
  onSync
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'synced':
        return {
          label: 'Synced',
          color: 'success' as const,
          icon: <CheckCircleIcon />,
          tooltip: lastSync ? `Last synced: ${lastSync}` : 'Successfully synced to Jira'
        };
      case 'syncing':
        return {
          label: 'Syncing...',
          color: 'primary' as const,
          icon: <SyncIcon />,
          tooltip: 'Currently syncing to Jira'
        };
      case 'failed':
        return {
          label: 'Sync Failed',
          color: 'error' as const,
          icon: <ErrorIcon />,
          tooltip: 'Sync failed. Click to retry.'
        };
      case 'not_synced':
      default:
        return {
          label: 'Not Synced',
          color: 'default' as const,
          icon: <ScheduleIcon />,
          tooltip: 'Not synced to Jira yet'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={config.label}
        color={config.color}
        icon={config.icon}
        size="small"
        variant={status === 'synced' ? 'filled' : 'outlined'}
      />
      {status === 'not_synced' && onSync && (
        <Tooltip title="Sync to Jira">
          <IconButton
            size="small"
            onClick={onSync}
            color="primary"
            aria-label="sync-to-jira"
          >
            <CloudUploadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {status === 'failed' && onRetry && (
        <Tooltip title="Retry Sync">
          <IconButton
            size="small"
            onClick={onRetry}
            color="error"
            aria-label="retry-sync"
          >
            <SyncIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {lastSync && status === 'synced' && (
        <Typography variant="caption" color="text.secondary">
          {lastSync}
        </Typography>
      )}
    </Box>
  );
};

export default SyncStatus;