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
  Science,
  Add,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const SampleDeptDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [samples, setSamples] = useState([]);
  const [openSampleDialog, setOpenSampleDialog] = useState(false);
  const [sampleForm, setSampleForm] = useState({
    poNumber: '',
    material: '',
    supplierName: '',
    sampleQuantity: '',
    collectionDate: '',
    testStatus: 'Pending',
    remarks: ''
  });

  useEffect(() => {
    fetchSamples();
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const fetchSamples = async () => {
    try {
      const q = query(
        collection(db, 'samples'),
        orderBy('collectionDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const samplesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSamples(samplesData);
    } catch (error) {
      console.error('Error fetching samples:', error);
    }
  };

  const handleCreateSample = async () => {
    try {
      const sampleData = {
        ...sampleForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      await addDoc(collection(db, 'samples'), sampleData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'Sample Collected',
        userId: currentUser.uid,
        userRole: 'Sample Dept',
        details: `Sample collected for PO ${sampleForm.poNumber} - ${sampleForm.material}`,
        timestamp: new Date().toISOString()
      });

      setOpenSampleDialog(false);
      setSampleForm({
        poNumber: '',
        material: '',
        supplierName: '',
        sampleQuantity: '',
        collectionDate: '',
        testStatus: 'Pending',
        remarks: ''
      });
      fetchSamples();
    } catch (error) {
      console.error('Error creating sample:', error);
    }
  };

  const openCreateDialog = () => {
    setSampleForm({
      ...sampleForm,
      collectionDate: new Date().toISOString().split('T')[0]
    });
    setOpenSampleDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Passed':
        return 'success';
      case 'Failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sample Department Dashboard
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
                <Science sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{samples.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Samples</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Samples */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Material Samples</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Collect Sample
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Sample Quantity</TableCell>
                <TableCell>Collection Date</TableCell>
                <TableCell>Test Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {samples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell>{sample.poNumber}</TableCell>
                  <TableCell>{sample.material}</TableCell>
                  <TableCell>{sample.supplierName}</TableCell>
                  <TableCell>{sample.sampleQuantity}</TableCell>
                  <TableCell>{new Date(sample.collectionDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: sample.testStatus === 'Passed' ? 'success.main' : 
                               sample.testStatus === 'Failed' ? 'error.main' : 'warning.main'
                      }}
                    >
                      {sample.testStatus}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {/* View sample details */}}
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

      {/* Create Sample Dialog */}
      <Dialog open={openSampleDialog} onClose={() => setOpenSampleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Collect Material Sample</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={sampleForm.poNumber ? { poNumber: sampleForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setSampleForm({
                      ...sampleForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setSampleForm({
                      ...sampleForm,
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
                value={sampleForm.material}
                onChange={(e) => setSampleForm({ ...sampleForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={sampleForm.supplierName}
                onChange={(e) => setSampleForm({ ...sampleForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sample Quantity"
                value={sampleForm.sampleQuantity}
                onChange={(e) => setSampleForm({ ...sampleForm, sampleQuantity: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Collection Date"
                type="date"
                value={sampleForm.collectionDate}
                onChange={(e) => setSampleForm({ ...sampleForm, collectionDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Test Status"
                value={sampleForm.testStatus}
                onChange={(e) => setSampleForm({ ...sampleForm, testStatus: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Passed">Passed</MenuItem>
                <MenuItem value="Failed">Failed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={sampleForm.remarks}
                onChange={(e) => setSampleForm({ ...sampleForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSampleDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSample} variant="contained">
            Collect Sample
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SampleDeptDashboard;
