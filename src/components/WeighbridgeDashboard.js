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
  TextField
} from '@mui/material';
import {
  Scale,
  Add,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const WeighbridgeDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [weighbridgeRecords, setWeighbridgeRecords] = useState([]);
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [weightForm, setWeightForm] = useState({
    vehicleNumber: '',
    poNumber: '',
    material: '',
    supplierName: '',
    weightBefore: '',
    weightAfter: '',
    netWeight: '',
    weighingDate: '',
    remarks: ''
  });

  useEffect(() => {
    fetchWeighbridgeRecords();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const fetchWeighbridgeRecords = async () => {
    try {
      const q = query(
        collection(db, 'weighbridge'),
        orderBy('weighingDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWeighbridgeRecords(recordsData);
    } catch (error) {
      console.error('Error fetching weighbridge records:', error);
    }
  };

  const handleCreateWeightRecord = async () => {
    try {
      const weightData = {
        ...weightForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      await addDoc(collection(db, 'weighbridge'), weightData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'Weight Recorded',
        userId: currentUser.uid,
        userRole: 'Weighbridge Operator',
        details: `Weight recorded for vehicle ${weightForm.vehicleNumber} - Net: ${weightForm.netWeight} kg`,
        timestamp: new Date().toISOString()
      });

      setOpenWeightDialog(false);
      setWeightForm({
        vehicleNumber: '',
        poNumber: '',
        material: '',
        supplierName: '',
        weightBefore: '',
        weightAfter: '',
        netWeight: '',
        weighingDate: '',
        remarks: ''
      });
      fetchWeighbridgeRecords();
    } catch (error) {
      console.error('Error creating weight record:', error);
    }
  };

  const openCreateDialog = () => {
    setWeightForm({
      ...weightForm,
      weighingDate: new Date().toISOString().split('T')[0]
    });
    setOpenWeightDialog(true);
  };

  const calculateNetWeight = () => {
    const before = parseFloat(weightForm.weightBefore) || 0;
    const after = parseFloat(weightForm.weightAfter) || 0;
    const net = before - after;
    setWeightForm({ ...weightForm, netWeight: net.toFixed(2) });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Weighbridge Dashboard
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
                <Scale sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{weighbridgeRecords.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Weight Records</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Weighbridge Records */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Weighbridge Records</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Record Weight
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Weight Before (kg)</TableCell>
                <TableCell>Weight After (kg)</TableCell>
                <TableCell>Net Weight (kg)</TableCell>
                <TableCell>Weighing Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weighbridgeRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.vehicleNumber}</TableCell>
                  <TableCell>{record.poNumber}</TableCell>
                  <TableCell>{record.material}</TableCell>
                  <TableCell>{record.weightBefore}</TableCell>
                  <TableCell>{record.weightAfter}</TableCell>
                  <TableCell>{record.netWeight}</TableCell>
                  <TableCell>{new Date(record.weighingDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {/* View weight details */}}
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

      {/* Create Weight Record Dialog */}
      <Dialog open={openWeightDialog} onClose={() => setOpenWeightDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record Vehicle Weight</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={weightForm.vehicleNumber}
                onChange={(e) => setWeightForm({ ...weightForm, vehicleNumber: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={weightForm.poNumber ? { poNumber: weightForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setWeightForm({
                      ...weightForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setWeightForm({
                      ...weightForm,
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
                value={weightForm.material}
                onChange={(e) => setWeightForm({ ...weightForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={weightForm.supplierName}
                onChange={(e) => setWeightForm({ ...weightForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight Before (kg)"
                type="number"
                value={weightForm.weightBefore}
                onChange={(e) => setWeightForm({ ...weightForm, weightBefore: e.target.value })}
                margin="normal"
                required
                onBlur={calculateNetWeight}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weight After (kg)"
                type="number"
                value={weightForm.weightAfter}
                onChange={(e) => setWeightForm({ ...weightForm, weightAfter: e.target.value })}
                margin="normal"
                required
                onBlur={calculateNetWeight}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Net Weight (kg)"
                value={weightForm.netWeight}
                InputProps={{ readOnly: true }}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weighing Date"
                type="date"
                value={weightForm.weighingDate}
                onChange={(e) => setWeightForm({ ...weightForm, weighingDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={weightForm.remarks}
                onChange={(e) => setWeightForm({ ...weightForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenWeightDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWeightRecord} variant="contained">
            Record Weight
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WeighbridgeDashboard;
