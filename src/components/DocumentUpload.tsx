import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { uploadDocument } from '../services/api';
import { Document as DocumentType } from '../types';

interface DocumentUploadProps {
  projectId: string;
  onClose: () => void;
  onSuccess: (document: DocumentType) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  projectId,
  onClose,
  onSuccess,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'message/rfc822': ['.eml'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i];
      if (uploadFile.status !== 'pending') continue;

      try {
        // Update status to uploading
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        const response = await uploadDocument(projectId, uploadFile.file);

        // Create document object
        const document: DocumentType = {
          id: response.document_id,
          filename: uploadFile.file.name,
          uploaded_at: new Date().toISOString(),
          type: 'business_document',
        };

        // Update status to success
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'success', progress: 100 } : f
        ));

        // Call onSuccess for each uploaded file
        onSuccess(document);

      } catch (error) {
        // Update status to error
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? {
            ...f,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
            progress: 0
          } : f
        ));
      }
    }

    setUploading(false);
  };

  const getFileIcon = (filename: string) => {
    return <FileIcon />;
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasPendingFiles = files.some(f => f.status === 'pending');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <Dialog open maxWidth="md" fullWidth onClose={onClose}>
      <DialogTitle>Upload Documents</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to select files
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Supported formats: PDF, DOCX, DOC, XLS, XLSX, EML, TXT (max 50MB each)
            </Typography>
          </Box>
        </Box>

        {files.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Files to Upload ({files.length})
            </Typography>
            <List>
              {files.map((uploadFile, index) => (
                <ListItem key={index} divider>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                    {getFileIcon(uploadFile.file.name)}
                    <ListItemText
                      primary={uploadFile.file.name}
                      secondary={formatFileSize(uploadFile.file.size)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                    {uploadFile.status === 'uploading' && (
                      <LinearProgress
                        variant="determinate"
                        value={uploadFile.progress}
                        sx={{ width: 100, mr: 2 }}
                      />
                    )}
                    {getStatusIcon(uploadFile.status)}
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                        {uploadFile.error}
                      </Typography>
                    )}
                  </Box>
                  {uploadFile.status === 'pending' && (
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => removeFile(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {hasErrors && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Some files failed to upload. You can retry or remove failed files.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={uploadFiles}
          variant="contained"
          disabled={files.length === 0 || !hasPendingFiles || uploading}
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentUpload;
