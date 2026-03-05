import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Link as LinkIcon
} from '@mui/icons-material';

interface SyncResultsProps {
  results: {
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
  };
  onDownloadReport?: () => void;
  onRetryFailed?: () => void;
}

const SyncResults: React.FC<SyncResultsProps> = ({
  results,
  onDownloadReport,
  onRetryFailed
}) => {
  const successCount = results.success.length;
  const failedCount = results.failed.length;
  const totalCount = results.total;

  const getSummaryColor = () => {
    if (failedCount === 0) return 'success';
    if (failedCount < successCount) return 'warning';
    return 'error';
  };

  const getSummaryText = () => {
    if (failedCount === 0) {
      return `All ${totalCount} issues created successfully!`;
    }
    if (failedCount < successCount) {
      return `${successCount} issues created, ${failedCount} failed`;
    }
    return `Sync failed: ${failedCount} issues could not be created`;
  };

  const downloadReport = () => {
    const content = `
Jira Sync Report
================

Summary:
- Total Issues: ${totalCount}
- Success: ${successCount}
- Failed: ${failedCount}

Created Issues:
${results.success.map(issue => 
  `- ${issue.issue_key} (${issue.type}): ${issue.url}`
).join('\n')}

Failed Issues:
${results.failed.map(failed => 
  `- ${failed.title}: ${failed.error}`
).join('\n')}

Report generated on: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jira-sync-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Sync Results Summary</Typography>
          <Chip 
            label={getSummaryText()}
            color={getSummaryColor()}
            variant="outlined"
            icon={failedCount === 0 ? <CheckCircleIcon /> : <ErrorIcon />}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Total: ${totalCount}`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={`Success: ${successCount}`}
            color="success"
            variant="outlined"
          />
          <Chip 
            label={`Failed: ${failedCount}`}
            color={failedCount > 0 ? "error" : "default"}
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Actions */}
      {(onDownloadReport || onRetryFailed) && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          {onDownloadReport && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={onDownloadReport}
              variant="outlined"
              color="primary"
            >
              Download Report
            </Button>
          )}
          {onRetryFailed && failedCount > 0 && (
            <Button
              startIcon={<ErrorIcon />}
              onClick={onRetryFailed}
              variant="contained"
              color="error"
            >
              Retry Failed ({failedCount})
            </Button>
          )}
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
            variant="outlined"
            color="secondary"
          >
            Export Text Report
          </Button>
        </Box>
      )}

      {/* Success Table */}
      {results.success.length > 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Issue Key</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Issue ID</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.success.map((issue, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {issue.issue_key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={issue.type} size="small" color="primary" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {issue.issue_id}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Open in Jira">
                        <IconButton
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Failed List */}
      {results.failed.length > 0 && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="error.main">
              Failed Issues ({failedCount})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {results.failed.map((failed, index) => (
                <Alert key={index} severity="error" variant="outlined">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {failed.title}
                    </Typography>
                    <Typography variant="caption" color="error.light">
                      {failed.error}
                    </Typography>
                  </Box>
                </Alert>
              ))}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Success Message */}
      {failedCount === 0 && (
        <Alert severity="success" variant="outlined">
          <Typography variant="body1">
            All {totalCount} user stories have been successfully synced to Jira! 
            You can now view and manage them in your Jira project.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SyncResults;