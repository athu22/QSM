import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePO } from '../contexts/POContext';
import POSelector from './POSelector';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import {
  CheckCircle,
  Add,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const QCDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [qcResults, setQcResults] = useState([]);
  const [openQCDialog, setOpenQCDialog] = useState(false);
  const [qcForm, setQcForm] = useState({
    poNumber: '',
    material: '',
    supplierName: '',
    testDate: '',
    testResult: 'Pending',
    testParameters: '',
    remarks: ''
  });

  useEffect(() => {
    fetchQCResults();
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const fetchQCResults = async () => {
    try {
      const q = query(
        collection(db, 'qcResults'),
        orderBy('testDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const qcData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQcResults(qcData);
    } catch (error) {
      console.error('Error fetching QC results:', error);
    }
  };

  const handleCreateQCResult = async () => {
    try {
      const qcData = {
        ...qcForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      await addDoc(collection(db, 'qcResults'), qcData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'QC Test Completed',
        userId: currentUser.uid,
        userRole: 'QC Dept',
        details: `QC test completed for PO ${qcForm.poNumber} - Result: ${qcForm.testResult}`,
        timestamp: new Date().toISOString()
      });

      setOpenQCDialog(false);
      setQcForm({
        poNumber: '',
        material: '',
        supplierName: '',
        testDate: '',
        testResult: 'Pending',
        testParameters: '',
        remarks: ''
      });
      fetchQCResults();
    } catch (error) {
      console.error('Error creating QC result:', error);
    }
  };

  const openCreateDialog = () => {
    setQcForm({
      ...qcForm,
      testDate: new Date().toISOString().split('T')[0]
    });
    setOpenQCDialog(true);
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Passed':
        return 'success.main';
      case 'Failed':
        return 'error.main';
      case 'Pending':
        return 'warning.main';
      default:
        return 'text.primary';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          QC Department Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{qcResults.length}</Typography>
                  <Typography variant="body2" color="text.secondary">QC Tests</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* QC Results */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Quality Control Results</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Record QC Result
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Test Date</TableCell>
                <TableCell>Test Result</TableCell>
                <TableCell>Test Parameters</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {qcResults.map((qc) => (
                <TableRow key={qc.id}>
                  <TableCell>{qc.poNumber}</TableCell>
                  <TableCell>{qc.material}</TableCell>
                  <TableCell>{qc.supplierName}</TableCell>
                  <TableCell>{new Date(qc.testDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ color: getResultColor(qc.testResult) }}
                    >
                      {qc.testResult}
                    </Typography>
                  </TableCell>
                  <TableCell>{qc.testParameters}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {/* View QC details */}}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create QC Result Dialog */}
      <Dialog open={openQCDialog} onClose={() => setOpenQCDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record QC Test Result</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={qcForm.poNumber ? { poNumber: qcForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setQcForm({
                      ...qcForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setQcForm({
                      ...qcForm,
                      poNumber: '',
                      supplierName: '',
                      material: ''
                    });
                  }
                }}
                label="PO Number"
                required
                showDetails={true}
                placeholder="Search PO number..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material"
                value={qcForm.material}
                onChange={(e) => setQcForm({ ...qcForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={qcForm.supplierName}
                onChange={(e) => setQcForm({ ...qcForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Date"
                type="date"
                value={qcForm.testDate}
                onChange={(e) => setQcForm({ ...qcForm, testDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Test Result"
                value={qcForm.testResult}
                onChange={(e) => setQcForm({ ...qcForm, testResult: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="Passed">Passed</MenuItem>
                <MenuItem value="Failed">Failed</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Parameters"
                value={qcForm.testParameters}
                onChange={(e) => setQcForm({ ...qcForm, testParameters: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., Purity: 99.5%, Moisture: 0.1%"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={qcForm.remarks}
                onChange={(e) => setQcForm({ ...qcForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQCDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateQCResult} variant="contained">
            Record Result
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QCDashboard;
