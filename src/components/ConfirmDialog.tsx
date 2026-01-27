
// src/components/ConfirmDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmColor?: 'primary' | 'error';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'error',
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      {typeof message === 'string' ? <Typography>{message}</Typography> : message}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>{cancelText}</Button>
      <Button onClick={onConfirm} color={confirmColor} variant="contained">{confirmText}</Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
