
// src/components/EmptyState.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Box sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>{icon}</Box>
    <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
  </Box>
);

export default EmptyState;
