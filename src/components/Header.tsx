
// src/components/Header.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useUi } from '../context/UiContext';

const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useUi();

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <DescriptionIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI BRD Generation System
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Powered by AI
          </Typography>
          <Tooltip title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
