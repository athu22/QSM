import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { Box, Paper, Typography, Alert, Button, CircularProgress } from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

const FirebaseStatus = () => {
  const [status, setStatus] = useState({
    firebase: 'checking',
    auth: 'checking',
    firestore: 'checking'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkFirebaseStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check Firebase app
      let firebaseStatus = 'error';
      try {
        if (auth && db) {
          firebaseStatus = 'success';
        } else {
          firebaseStatus = 'error';
        }
      } catch (e) {
        firebaseStatus = 'error';
      }

      // Check Auth service
      let authStatus = 'error';
      try {
        if (auth && typeof auth.onAuthStateChanged === 'function') {
          authStatus = 'success';
        } else {
          authStatus = 'error';
        }
      } catch (e) {
        authStatus = 'error';
      }

      // Check Firestore service
      let firestoreStatus = 'error';
      try {
        if (db && typeof db.collection === 'function') {
          firestoreStatus = 'success';
        } else {
          firestoreStatus = 'error';
        }
      } catch (e) {
        firestoreStatus = 'error';
      }

      setStatus({
        firebase: firebaseStatus,
        auth: authStatus,
        firestore: firestoreStatus
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Connected';
      case 'error':
        return 'Failed';
      case 'warning':
        return 'Warning';
      default:
        return 'Checking...';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Firebase Connection Status
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Service Status</Typography>
          <Button 
            variant="outlined" 
            onClick={checkFirebaseStatus}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Refresh Status'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(status.firebase)}
            <Typography variant="body1">Firebase App</Typography>
            <Typography 
              variant="body2" 
              color={getStatusColor(status.firebase)}
              sx={{ ml: 'auto' }}
            >
              {getStatusText(status.firebase)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(status.auth)}
            <Typography variant="body1">Authentication</Typography>
            <Typography 
              variant="body2" 
              color={getStatusColor(status.auth)}
              sx={{ ml: 'auto' }}
            >
              {getStatusText(status.auth)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(status.firestore)}
            <Typography variant="body1">Firestore Database</Typography>
            <Typography 
              variant="body2" 
              color={getStatusColor(status.firestore)}
              sx={{ ml: 'auto' }}
            >
              {getStatusText(status.firestore)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Troubleshooting
        </Typography>
        <Typography variant="body2" paragraph>
          If you see connection errors:
        </Typography>
        <ul>
          <li>Check your internet connection</li>
          <li>Verify Firebase project configuration</li>
          <li>Ensure Firebase services are enabled</li>
          <li>Check browser console for detailed errors</li>
        </ul>
      </Paper>
    </Box>
  );
};

export default FirebaseStatus;
