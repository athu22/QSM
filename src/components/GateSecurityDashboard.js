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
  Security,
  Add,
  Visibility,
  Logout,
  Edit
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, where, orderBy, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';


const GateSecurityDashboard = () => {
  const { logout, currentUser } = useAuth();
   const navigate = useNavigate();
  const [gateEntries, setGateEntries] = useState([]);
  const [openEntryDialog, setOpenEntryDialog] = useState(false);
  const [approvedPOs, setApprovedPOs] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryForm, setEntryForm] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    poNumber: '',
    supplierName: '',
    material: '',
    entryTime: '',
    vehicleChecks: '',
    remarks: ''
  });

  useEffect(() => {
    fetchGateEntries();
  }, []);
  
  useEffect(() => {
  fetchGateEntries();
  fetchApprovedPOs();
}, []);

const fetchApprovedPOs = async () => {
  try {
    const q = query(
      collection(db, 'purchaseOrders'),
    );
    const querySnapshot = await getDocs(q);
    const poData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Approved POs:', poData); // Add this line
    setApprovedPOs(poData);
  } catch (error) {
    console.error('Error fetching approved POs:', error);
  }
};
  const fetchGateEntries = async () => {
    try {
      const q = query(
        collection(db, 'gateEntries'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Flatten vehicles for display in table
        const flattenedEntries = [];
        if (data.vehicles) {
          Object.values(data.vehicles).forEach(vehicle => {
            flattenedEntries.push({
              id: `${doc.id}_${vehicle.vehicleNumber}`,
              poNumber: doc.id, // Document ID is now the PO number
              supplierName: data.supplierName,
              material: data.material,
              ...vehicle
            });
          });
        }
        return flattenedEntries;
      }).flat();
      setGateEntries(entriesData);
    } catch (error) {
      console.error('Error fetching gate entries:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const handleCreateEntry = async () => {
    try {
      const poDocRef = doc(db, 'gateEntries', entryForm.poNumber);
      const poDoc = await getDoc(poDocRef);
      
      const vehicleData = {
        vehicleNumber: entryForm.vehicleNumber,
        driverName: entryForm.driverName,
        driverPhone: entryForm.driverPhone,
        entryTime: entryForm.entryTime,
        vehicleChecks: entryForm.vehicleChecks,
        remarks: entryForm.remarks,
        status: 'Active'
      };

      if (poDoc.exists()) {
        // Update existing PO document with new vehicle
        const existingData = poDoc.data();
        const updatedVehicles = {
          ...existingData.vehicles,
          [entryForm.vehicleNumber]: vehicleData
        };
        
        await updateDoc(poDocRef, {
          vehicles: updatedVehicles,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new PO document
        const entryData = {
          poNumber: entryForm.poNumber,
          supplierName: entryForm.supplierName,
          material: entryForm.material,
          vehicles: {
            [entryForm.vehicleNumber]: vehicleData
          },
          createdBy: currentUser.uid,
          createdAt: new Date().toISOString(),
          status: 'Active'
        };
        
        await setDoc(poDocRef, entryData);
      }
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: editingEntry ? 'Gate Entry Updated' : 'Gate Entry Recorded',
        userId: currentUser.uid,
        userRole: 'Gate Security',
        details: `Vehicle ${entryForm.vehicleNumber} ${editingEntry ? 'updated' : 'entered'} for PO ${entryForm.poNumber}`,
        timestamp: new Date().toISOString()
      });

      setOpenEntryDialog(false);
      setEditingEntry(null);
      setEntryForm({
        vehicleNumber: '',
        driverName: '',
        driverPhone: '',
        poNumber: '',
        supplierName: '',
        material: '',
        entryTime: '',
        vehicleChecks: '',
        remarks: ''
      });
      fetchGateEntries();
    } catch (error) {
      console.error('Error creating gate entry:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingEntry(null);
    setEntryForm({
      vehicleNumber: '',
      driverName: '',
      driverPhone: '',
      poNumber: '',
      supplierName: '',
      material: '',
      entryTime: new Date().toISOString().slice(0, 16),
      vehicleChecks: '',
      remarks: ''
    });
    setOpenEntryDialog(true);
  };

  const openEditDialog = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      vehicleNumber: entry.vehicleNumber,
      driverName: entry.driverName,
      driverPhone: entry.driverPhone,
      poNumber: entry.poNumber,
      supplierName: entry.supplierName,
      material: entry.material,
      entryTime: entry.entryTime,
      vehicleChecks: entry.vehicleChecks,
      remarks: entry.remarks
    });
    setOpenEntryDialog(true);
  };

  const handlePOCardClick = (po) => {
  setEntryForm({
    ...entryForm,
    poNumber: po.poNumber || '',
    supplierName: po.supplierName || '',
    material: po.material || '',
    entryTime: new Date().toISOString().slice(0, 16)
  });
  setOpenEntryDialog(true);
};

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gate Security Dashboard
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
                <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{gateEntries.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Entries</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gate Entries */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Gate Entries</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Record Entry
          </Button>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>Manager Approved Purchase Orders</Typography>
<Grid container spacing={2} sx={{ mb: 4 }}>
  {approvedPOs.length === 0 && (
    <Grid item xs={12}>
      <Typography color="text.secondary">No approved POs found.</Typography>
    </Grid>
  )}
  {approvedPOs.map(po => (
    <Grid item xs={12} sm={6} md={3} key={po.id}>
      <Card
        sx={{ cursor: 'pointer', border: '2px solid #1976d2' }}
        onClick={() => handlePOCardClick(po)}
      >
        <CardContent>
          <Typography variant="h6">PO: {po.poNumber}</Typography>
          <Typography variant="body2">Supplier: {po.supplierName}</Typography>
          <Typography variant="body2">Material: {po.material}</Typography>
        </CardContent>
      </Card>
    </Grid>
  ))}
</Grid>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vehicle Number</TableCell>
                <TableCell>Driver Name</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Entry Time</TableCell>
                <TableCell>Vehicle Checks</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gateEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.vehicleNumber}</TableCell>
                  <TableCell>{entry.driverName}</TableCell>
                  <TableCell>{entry.poNumber}</TableCell>
                  <TableCell>{entry.supplierName}</TableCell>
                  <TableCell>{entry.material}</TableCell>
                  <TableCell>{new Date(entry.entryTime).toLocaleString()}</TableCell>
                  <TableCell>{entry.vehicleChecks}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => {/* View entry details */}}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => openEditDialog(entry)}
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

      {/* Create Entry Dialog */}
      <Dialog open={openEntryDialog} onClose={() => setOpenEntryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingEntry ? 'Edit Gate Entry' : 'Record Gate Entry'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={entryForm.vehicleNumber}
                onChange={(e) => setEntryForm({ ...entryForm, vehicleNumber: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Driver Name"
                value={entryForm.driverName}
                onChange={(e) => setEntryForm({ ...entryForm, driverName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Driver Phone"
                value={entryForm.driverPhone}
                onChange={(e) => setEntryForm({ ...entryForm, driverPhone: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={entryForm.poNumber ? { poNumber: entryForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setEntryForm({
                      ...entryForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setEntryForm({
                      ...entryForm,
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
                label="Supplier Name"
                value={entryForm.supplierName}
                onChange={(e) => setEntryForm({ ...entryForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material"
                value={entryForm.material}
                onChange={(e) => setEntryForm({ ...entryForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Entry Time"
                type="datetime-local"
                value={entryForm.entryTime}
                onChange={(e) => setEntryForm({ ...entryForm, entryTime: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Vehicle Checks"
                value={entryForm.vehicleChecks}
                onChange={(e) => setEntryForm({ ...entryForm, vehicleChecks: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="Passed">Passed</MenuItem>
                <MenuItem value="Failed">Failed</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={entryForm.remarks}
                onChange={(e) => setEntryForm({ ...entryForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEntryDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateEntry} variant="contained">
            {editingEntry ? 'Update Entry' : 'Record Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GateSecurityDashboard;
