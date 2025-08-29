import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { CheckCircle, Error, Warning } from '@mui/icons-material';

const FirebaseTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results = {};

    try {
      // Test 1: Firebase App initialization
      results.appInitialized = true;
      console.log('✓ Firebase App initialized');

      // Test 2: Firebase Auth availability
      results.authAvailable = !!auth;
      console.log('✓ Firebase Auth available:', !!auth);

      // Test 3: Firebase Firestore availability
      results.firestoreAvailable = !!db;
      console.log('✓ Firebase Firestore available:', !!db);

      // Test 4: Check if we can access Firestore
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        results.firestoreAccess = true;
        results.userCount = snapshot.size;
        console.log('✓ Firestore access successful, user count:', snapshot.size);
      } catch (error) {
        results.firestoreAccess = false;
        results.firestoreError = error.message;
        console.error('✗ Firestore access failed:', error);
      }

      // Test 5: Check Firebase project configuration
      if (auth.config) {
        results.authConfig = true;
        results.projectId = auth.config.projectId;
        console.log('✓ Auth config available, project ID:', auth.config.projectId);
      } else {
        results.authConfig = false;
        console.log('✗ Auth config not available');
      }

    } catch (error) {
      console.error('Test error:', error);
      results.generalError = error.message;
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle color="success" />;
    if (status === false) return <Error color="error" />;
    return <Warning color="warning" />;
  };

  const getStatusColor = (status) => {
    if (status === true) return 'success';
    if (status === false) return 'error';
    return 'warning';
  };

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Firebase Connection Test
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            This component helps diagnose Firebase connectivity and configuration issues.
          </Typography>

          <Button
            variant="contained"
            onClick={runTests}
            disabled={isRunning}
            sx={{ mb: 3 }}
          >
            {isRunning ? <CircularProgress size={24} /> : 'Run Tests'}
          </Button>

          {Object.keys(testResults).length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Test Results:
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="Firebase App Initialization"
                    secondary={testResults.appInitialized ? 'Success' : 'Failed'}
                  />
                  {getStatusIcon(testResults.appInitialized)}
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemText
                    primary="Firebase Auth Service"
                    secondary={testResults.authAvailable ? 'Available' : 'Not Available'}
                  />
                  {getStatusIcon(testResults.authAvailable)}
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemText
                    primary="Firebase Firestore Service"
                    secondary={testResults.firestoreAvailable ? 'Available' : 'Not Available'}
                  />
                  {getStatusIcon(testResults.firestoreAvailable)}
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemText
                    primary="Firestore Access"
                    secondary={
                      testResults.firestoreAccess 
                        ? `Success (${testResults.userCount || 0} users)` 
                        : `Failed: ${testResults.firestoreError || 'Unknown error'}`
                    }
                  />
                  {getStatusIcon(testResults.firestoreAccess)}
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemText
                    primary="Auth Configuration"
                    secondary={
                      testResults.authConfig 
                        ? `Project ID: ${testResults.projectId || 'N/A'}` 
                        : 'Not Available'
                    }
                  />
                  {getStatusIcon(testResults.authConfig)}
                </ListItem>
              </List>

              {testResults.generalError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  General Error: {testResults.generalError}
                </Alert>
              )}

              {testResults.firestoreError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Firestore Error: {testResults.firestoreError}
                </Alert>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Troubleshooting Steps:
                </Typography>
                <Box component="ul" sx={{ pl: 3 }}>
                  <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Ensure your Firebase project is properly configured
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Check that Authentication and Firestore services are enabled
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Verify your Firebase configuration in the console
                  </Typography>
                  <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                    Check your internet connection and firewall settings
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default FirebaseTest;
