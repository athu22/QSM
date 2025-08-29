import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import { AdminPanelSettings, CheckCircle, Info } from '@mui/icons-material';

const AdminSetup = () => {
  const [systemStatus, setSystemStatus] = useState('checking');
  const [adminExists, setAdminExists] = useState(false);
  const { isFirstUser } = useAuth();

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setSystemStatus('checking');
      const firstUser = await isFirstUser();
      setAdminExists(!firstUser);
      setSystemStatus('checked');
    } catch (error) {
      console.error('Error checking system status:', error);
      setSystemStatus('error');
    }
  };

  if (systemStatus === 'checking') {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Checking system status...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AdminPanelSettings sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography component="h1" variant="h4">
              QMS System Setup
            </Typography>
          </Box>

          {systemStatus === 'error' && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Error checking system status. Please try again.
            </Alert>
          )}

          {adminExists ? (
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                System is already configured
              </Typography>
              <Typography variant="body1">
                An admin user already exists in the system. You can proceed with normal login.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" icon={<Info />} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                First-time setup required
              </Typography>
              <Typography variant="body1">
                No users exist in the system yet. The first person to log in will automatically become the admin user.
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              How to proceed:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                If this is your first time setting up the system, go to the login page and create your admin account.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                The first email and password combination used will automatically become the admin user.
              </Typography>
              <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                After the first admin user is created, normal user registration and login will resume.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              href="/login"
              sx={{ mr: 2 }}
            >
              Go to Login
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={checkSystemStatus}
              sx={{ mr: 2 }}
            >
              Refresh Status
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/firebase-test"
              sx={{ mt: 2 }}
            >
              Test Firebase Connection
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminSetup;
