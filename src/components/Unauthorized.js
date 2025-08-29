import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert
} from '@mui/material';
import { Block, ArrowBack } from '@mui/icons-material';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Block sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom color="error">
            Access Denied
          </Typography>
          <Alert severity="warning" sx={{ width: '100%', mb: 3 }}>
            You don't have permission to access this page. Please contact your administrator.
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;
