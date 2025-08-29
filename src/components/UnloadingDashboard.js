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
  Unarchive,
  Add,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const UnloadingDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [unloadingRecords, setUnloadingRecords] = useState([]);
  const [openUnloadingDialog, setOpenUnloadingDialog] = useState(false);
  const [unloadingForm, setUnloadingForm] = useState({
    vehicleNumber: '',
    poNumber: '',
    material: '',
    supplierName: '',
    unloadingStartTime: '',
    unloadingEndTime: '',
    storageLocation: '',
    quantityUnloaded: '',
    remarks: ''
  });

  useEffect(() => {
    fetchUnloadingRecords();
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const fetchUnloadingRecords = async () => {
    try {
      const q = query(
        collection(db, 'unloading'),
        orderBy('unloadingStartTime', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUnloadingRecords(recordsData);
    } catch (error) {
      console.error('Error fetching unloading records:', error);
    }
  };

  const handleCreateUnloadingRecord = async () => {
    try {
      const unloadingData = {
        ...unloadingForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      await addDoc(collection(db, 'unloading'), unloadingData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'Unloading Completed',
        userId: currentUser.uid,
        userRole: 'Unloading Dept',
        details: `Unloading completed for vehicle ${unloadingForm.vehicleNumber} at ${unloadingForm.storageLocation}`,
        timestamp: new Date().toISOString()
      });

      setOpenUnloadingDialog(false);
      setUnloadingForm({
        vehicleNumber: '',
        poNumber: '',
        material: '',
        supplierName: '',
        unloadingStartTime: '',
        unloadingEndTime: '',
        storageLocation: '',
        quantityUnloaded: '',
        remarks: ''
      });
      fetchUnloadingRecords();
    } catch (error) {
      console.error('Error creating unloading record:', error);
    }
  };

  const openCreateDialog = () => {
    const now = new Date();
    setUnloadingForm({
      ...unloadingForm,
      unloadingStartTime: now.toISOString().slice(0, 16),
      unloadingEndTime: now.toISOString().slice(0, 16)
    });
    setOpenUnloadingDialog(true);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Unloading Department Dashboard
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
                <Unarchive sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{unloadingRecords.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Unloading Records</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unloading Records */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Unloading Records</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Record Unloading
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Storage Location</TableCell>
                <TableCell>Quantity Unloaded</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unloadingRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.vehicleNumber}</TableCell>
                  <TableCell>{record.poNumber}</TableCell>
                  <TableCell>{record.material}</TableCell>
                  <TableCell>{record.storageLocation}</TableCell>
                  <TableCell>{record.quantityUnloaded}</TableCell>
                  <TableCell>{new Date(record.unloadingStartTime).toLocaleString()}</TableCell>
                  <TableCell>{new Date(record.unloadingEndTime).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {/* View unloading details */}}
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

      {/* Create Unloading Record Dialog */}
      <Dialog open={openUnloadingDialog} onClose={() => setOpenUnloadingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Unloading</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={unloadingForm.vehicleNumber}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, vehicleNumber: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={unloadingForm.poNumber ? { poNumber: unloadingForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setUnloadingForm({
                      ...unloadingForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setUnloadingForm({
                      ...unloadingForm,
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
                value={unloadingForm.material}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={unloadingForm.supplierName}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Storage Location"
                value={unloadingForm.storageLocation}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, storageLocation: e.target.value })}
                margin="normal"
                required
                placeholder="e.g., Warehouse A, Section 1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity Unloaded"
                type="number"
                value={unloadingForm.quantityUnloaded}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, quantityUnloaded: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unloading Start Time"
                type="datetime-local"
                value={unloadingForm.unloadingStartTime}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, unloadingStartTime: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unloading End Time"
                type="datetime-local"
                value={unloadingForm.unloadingEndTime}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, unloadingEndTime: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={unloadingForm.remarks}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUnloadingDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUnloadingRecord} variant="contained">
            Record Unloading
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UnloadingDashboard;
