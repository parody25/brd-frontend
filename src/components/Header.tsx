import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <DescriptionIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI BRD Generation System
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Powered by GPT-5.1
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
