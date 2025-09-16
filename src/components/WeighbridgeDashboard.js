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
  Scale,
  Add,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const WeighbridgeDashboard = () => {
  const { logout, currentUser } = useAuth();
  const { getGateEntriesByPO } = usePO();
  const navigate = useNavigate();
  const [weighbridgeRecords, setWeighbridgeRecords] = useState([]);
  const [openWeightDialog, setOpenWeightDialog] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
const [openViewDialog, setOpenViewDialog] = useState(false);
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

    if (editingRecord) {
      // Update existing record
      const recordRef = doc(db, 'weighbridge', editingRecord.id);
      await updateDoc(recordRef, { ...weightData, updatedAt: new Date().toISOString() });
    } else {
      // Create new record
      await addDoc(collection(db, 'weighbridge'), weightData);
    }

    // Log activity
    await addDoc(collection(db, 'activityLogs'), {
      action: editingRecord ? 'Weight Updated' : 'Weight Recorded',
      userId: currentUser.uid,
      userRole: 'Weighbridge Operator',
      details: `${editingRecord ? 'Updated' : 'Recorded'} weight for vehicle ${weightForm.vehicleNumber} - Net: ${weightForm.netWeight} kg`,
      timestamp: new Date().toISOString()
    });

    setOpenWeightDialog(false);
    setEditingRecord(null);
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
    console.error('Error creating/updating weight record:', error);
  }
};
  const openEditDialog = (record) => {
  setEditingRecord(record);
  setWeightForm({
    vehicleNumber: record.vehicleNumber,
    poNumber: record.poNumber,
    material: record.material,
    supplierName: record.supplierName,
    weightBefore: record.weightBefore,
    weightAfter: record.weightAfter,
    netWeight: record.netWeight,
    weighingDate: record.weighingDate,
    remarks: record.remarks
  });
  setOpenWeightDialog(true);
};


  const openCreateDialog = () => {
    setWeightForm({
      vehicleNumber: '',
      poNumber: '',
      material: '',
      supplierName: '',
      weightBefore: '',
      weightAfter: '',
      netWeight: '',
      weighingDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setAvailableVehicles([]);
    setOpenWeightDialog(true);
  };
const calculateNetWeight = (before, after) => {
  const wBefore = parseFloat(before) || 0;
  const wAfter = parseFloat(after) || 0;
  return (wBefore - wAfter).toFixed(2);
};


  const fetchVehiclesForPO = async (poNumber) => {
    try {
      const gateEntries = await getGateEntriesByPO(poNumber);
      setAvailableVehicles(gateEntries);
      
      // Automatically select the first available vehicle if only one is found
      if (gateEntries.length === 1) {
        setWeightForm(prev => ({
          ...prev,
          vehicleNumber: gateEntries[0].vehicleNumber
        }));
      }
    } catch (error) {
      console.error('Error fetching vehicles for PO:', error);
      setAvailableVehicles([]);
    }
  };

  const handlePOSelection = (selectedPO) => {
    if (selectedPO) {
      setWeightForm({
        ...weightForm,
        poNumber: selectedPO.poNumber,
        supplierName: selectedPO.supplierName,
        material: selectedPO.material,
        vehicleNumber: '' // Reset vehicle number when PO changes
      });
      // Fetch vehicles for the selected PO
      fetchVehiclesForPO(selectedPO.poNumber);
    } else {
      setWeightForm({
        ...weightForm,
        poNumber: '',
        supplierName: '',
        material: '',
        vehicleNumber: ''
      });
      setAvailableVehicles([]);
    }
  };

  return (
<Container maxWidth="xl" sx={{ py: 4 }}>
  {/* Dashboard Header */}
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 4,
      p: 3,
      borderRadius: 3,
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    }}
  >
    <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
      Weighbridge Dashboard
    </Typography>
    <Button
      variant="contained"
      startIcon={<Logout />}
      onClick={handleLogout}
      sx={{
        bgcolor: 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        color: '#fff',
        px: 3,
        borderRadius: 2,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
      }}
    >
      Logout
    </Button>
  </Box>

  {/* Stats Card */}
  <Grid container spacing={3} sx={{ mb: 4 }}>
    <Grid item xs={12} sm={6} md={3}>
      <Card
        sx={{
          borderRadius: 3,
          p: 2,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
          transition: '0.3s',
          '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 30px rgba(0,0,0,0.2)' },
        }}
      >
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <Scale sx={{ fontSize: 50, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {weighbridgeRecords.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Weight Records
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>

  {/* Weighbridge Records Table */}
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
      background: '#fff',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Weighbridge Records
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={openCreateDialog}
        sx={{
          borderRadius: 2,
          px: 3,
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        Record Weight
      </Button>
    </Box>

    <TableContainer>
      <Table sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableHead>
          <TableRow sx={{ background: '#f5f7fa' }}>
            {['Vehicle Number', 'PO Number', 'Material', 'Weight Before (kg)', 'Weight After (kg)', 'Net Weight (kg)', 'Weighing Date', 'Actions'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 600 }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {weighbridgeRecords.map((record, index) => (
            <TableRow
              key={record.id}
              sx={{
                backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                '&:hover': { backgroundColor: '#f1f9ff' },
              }}
            >
              <TableCell>{record.vehicleNumber}</TableCell>
              <TableCell>{record.poNumber}</TableCell>
              <TableCell>{record.material}</TableCell>
              <TableCell>{record.weightBefore}</TableCell>
              <TableCell>{record.weightAfter}</TableCell>
              <TableCell>{record.netWeight}</TableCell>
              <TableCell>{new Date(record.weighingDate).toLocaleDateString()}</TableCell>
<TableCell>
  <Box sx={{ display: 'flex', gap: 1 }}>
<Button
  size="small"
  startIcon={<Visibility />}
  onClick={() => {
    setSelectedRecord(record);
    setOpenViewDialog(true);
  }}
>
  View
</Button>

    <Button
      size="small"
      variant="outlined"
      sx={{ textTransform: 'none' }}
      onClick={() => openEditDialog(record)}
    >
      Edit
    </Button>
  </Box>
</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Paper>

  {/* Dialog styling */}
  <Dialog
    open={openWeightDialog}
    onClose={() => setOpenWeightDialog(false)}
    maxWidth="md"
    fullWidth
    PaperProps={{ sx: { borderRadius: 3, p: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } }}
  >
    <DialogTitle sx={{ fontWeight: 700 }}>Record Vehicle Weight</DialogTitle>
    <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              {availableVehicles.length > 0 ? (
                <TextField
                  fullWidth
                  select
                  label="Vehicle Number"
                  value={weightForm.vehicleNumber}
                  onChange={(e) => setWeightForm({ ...weightForm, vehicleNumber: e.target.value })}
                  margin="normal"
                  required
                >
                  {availableVehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.vehicleNumber}>
                      {vehicle.vehicleNumber} - {vehicle.driverName} ({new Date(vehicle.entryTime).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={weightForm.vehicleNumber}
                  onChange={(e) => setWeightForm({ ...weightForm, vehicleNumber: e.target.value })}
                  margin="normal"
                  required
                  helperText={
                    weightForm.poNumber
                      ? "No vehicles found for this PO. Enter manually or verify gate entry."
                      : "Select a PO first to see vehicles, or enter manually."
                  }
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={weightForm.poNumber ? { poNumber: weightForm.poNumber } : null}
                onChange={handlePOSelection}
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
    onChange={(e) =>
      setWeightForm({
        ...weightForm,
        weightBefore: e.target.value,
        netWeight: calculateNetWeight(e.target.value, weightForm.weightAfter)
      })
    }
    margin="normal"
    required
  />
</Grid>

<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    label="Weight After (kg)"
    type="number"
    value={weightForm.weightAfter}
    onChange={(e) =>
      setWeightForm({
        ...weightForm,
        weightAfter: e.target.value,
        netWeight: calculateNetWeight(weightForm.weightBefore, e.target.value)
      })
    }
    margin="normal"
    required
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
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={() => setOpenWeightDialog(false)} sx={{ textTransform: 'none' }}>
        Cancel
      </Button>
      <Button onClick={handleCreateWeightRecord} variant="contained" sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>
        Record Weight
      </Button>
    </DialogActions>
      </Dialog>
      <Dialog
  open={openViewDialog}
  onClose={() => setOpenViewDialog(false)}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: { borderRadius: 3, p: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
  }}
>
  <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem' }}>
    Weighbridge Record Details
  </DialogTitle>
  <DialogContent dividers sx={{ p: 3 }}>
    {selectedRecord && (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Vehicle Number</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedRecord.vehicleNumber}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">PO Number</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedRecord.poNumber}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Material</Typography>
          <Typography variant="body1">{selectedRecord.material}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
          <Typography variant="body1">{selectedRecord.supplierName}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Weight Before (kg)</Typography>
          <Typography variant="body1">{selectedRecord.weightBefore}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Weight After (kg)</Typography>
          <Typography variant="body1">{selectedRecord.weightAfter}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Net Weight (kg)</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedRecord.netWeight}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">Weighing Date</Typography>
          <Typography variant="body1">{new Date(selectedRecord.weighingDate).toLocaleDateString()}</Typography>
        </Grid>
        {selectedRecord.remarks && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
            <Typography variant="body1">{selectedRecord.remarks}</Typography>
          </Grid>
        )}
      </Grid>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenViewDialog(false)} sx={{ textTransform: 'none' }}>
      Close
    </Button>
  </DialogActions>
</Dialog>

    </Container>
  );
};

export default WeighbridgeDashboard;
