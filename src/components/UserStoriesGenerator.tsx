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
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
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
  const [inputMethod, setInputMethod] = useState<'brd' | 'customer_journey'>('brd');
  const [brdId, setBrdId] = useState<string>('');
  const [customerJourneyContent, setCustomerJourneyContent] = useState<string>('');
  const [customerJourneyFile, setCustomerJourneyFile] = useState<File | null>(null);
  const [version, setVersion] = useState<string>('v1.0');

  // Filter BRDs for the current project
  const availableBRDs = state.brds.filter(brd => brd.id);

  useEffect(() => {
    if (open && availableBRDs.length > 0) {
      setBrdId(availableBRDs[0].id);
    }
  }, [open, availableBRDs]);

  const handleGenerate = async () => {
    // Validation
    if (!version) {
      setError('Please provide a version');
      return;
    }

    if (inputMethod === 'brd' && !brdId) {
      setError('Please select a BRD');
      return;
    }

    if (inputMethod === 'customer_journey') {
      if (!customerJourneyContent.trim() && !customerJourneyFile) {
        setError('Please provide customer journey content (text or file)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateUserStories(
        projectId, 
        inputMethod === 'brd' ? brdId : null, 
        version,
        inputMethod === 'customer_journey' ? customerJourneyContent : null,
        inputMethod === 'customer_journey' ? customerJourneyFile : undefined
      );
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
    setInputMethod('brd');
    setBrdId('');
    setCustomerJourneyContent('');
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
        
        {availableBRDs.length === 0 && inputMethod === 'brd' ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No BRDs available. Please generate a BRD first before creating User Stories.
          </Alert>
        ) : (
          <>
            {/* Input Method Selection */}
            <FormControl component="fieldset" margin="normal">
              <Typography variant="subtitle2" gutterBottom>
                Generate from:
              </Typography>
              <RadioGroup
                row
                value={inputMethod}
                onChange={(e) => setInputMethod(e.target.value as 'brd' | 'customer_journey')}
              >
                <FormControlLabel 
                  value="brd" 
                  control={<Radio />} 
                  label="BRD Document" 
                />
                <FormControlLabel 
                  value="customer_journey" 
                  control={<Radio />} 
                  label="Customer Journey" 
                />
              </RadioGroup>
            </FormControl>

            {/* BRD Selection */}
            {inputMethod === 'brd' && (
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
            )}

            {/* Customer Journey Input */}
            {inputMethod === 'customer_journey' && (
              <>
                {/* File Upload Section */}
                <Box sx={{ mb: 2, p: 2, border: '1px dashed', borderColor: 'grey.300', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Customer Journey Document
                  </Typography>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: customerJourneyFile ? 'primary.main' : 'grey.300',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: customerJourneyFile ? 'action.hover' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.docx,.doc,.txt,.eml,.xls,.xlsx';
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (file) {
                          setCustomerJourneyFile(file);
                          // Clear text content when file is uploaded
                          setCustomerJourneyContent('');
                        }
                      };
                      input.click();
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      {customerJourneyFile ? `Selected: ${customerJourneyFile.name}` : 'Click to upload customer journey document'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supported formats: PDF, DOCX, DOC, TXT, EML, XLS, XLSX
                    </Typography>
                  </Box>
                  
                  {/* File Chip */}
                  {customerJourneyFile && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<DescriptionIcon />}
                        label={customerJourneyFile.name}
                        onDelete={() => setCustomerJourneyFile(null)}
                        color="primary"
                      />
                    </Box>
                  )}
                </Box>

                {/* Text Input Section */}
                <Typography variant="subtitle2" gutterBottom>
                  Or Enter Customer Journey Text
                </Typography>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Customer Journey Content"
                  multiline
                  rows={6}
                  value={customerJourneyContent}
                  onChange={(e) => {
                    setCustomerJourneyContent(e.target.value);
                    // Clear file when text is entered
                    if (e.target.value.trim()) {
                      setCustomerJourneyFile(null);
                    }
                  }}
                  placeholder="Describe the customer journey steps. Example: User visits website → browses products → adds to cart → checks out"
                  required={!customerJourneyFile}
                />
              </>
            )}

            {/* Version Input */}
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