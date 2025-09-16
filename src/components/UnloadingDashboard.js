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
import { Unarchive, Add, Visibility, Logout } from '@mui/icons-material';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const UnloadingDashboard = () => {
  const { logout, currentUser } = useAuth();
  const { getGateEntriesByPO } = usePO();
  const navigate = useNavigate();
  const [unloadingRecords, setUnloadingRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openUnloadingDialog, setOpenUnloadingDialog] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
const [editingRecord, setEditingRecord] = useState(null);
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
    navigate('/login');
  };

  const handleViewRecord = (record) => {
  setSelectedRecord(record);
  setOpenViewDialog(true);
};

const handleEditRecord = (record) => {
  setEditingRecord(record);
  setUnloadingForm({
    vehicleNumber: record.vehicleNumber,
    poNumber: record.poNumber,
    material: record.material,
    supplierName: record.supplierName,
    unloadingStartTime: record.unloadingStartTime,
    unloadingEndTime: record.unloadingEndTime,
    storageLocation: record.storageLocation,
    quantityUnloaded: record.quantityUnloaded,
    remarks: record.remarks || ''
  });
  setOpenEditDialog(true);
};

// Update record in Firestore
const handleUpdateUnloadingRecord = async () => {
  try {
    const recordRef = collection(db, 'unloading');
    const recordDoc = unloadingRecords.find(r => r.id === editingRecord.id);
    if (!recordDoc) return;

    await db.doc(`unloading/${editingRecord.id}`).update({
      ...unloadingForm,
      updatedAt: new Date().toISOString()
    });

    // Optional: add activity log
    await addDoc(collection(db, 'activityLogs'), {
      action: 'Unloading Record Updated',
      userId: currentUser.uid,
      userRole: 'Unloading Dept',
      details: `Updated unloading record for vehicle ${unloadingForm.vehicleNumber}`,
      timestamp: new Date().toISOString()
    });

    setOpenEditDialog(false);
    setEditingRecord(null);
    fetchUnloadingRecords();
  } catch (error) {
    console.error('Error updating record:', error);
  }
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

  const fetchVehiclesForPO = async (poNumber) => {
    try {
      const gateEntries = await getGateEntriesByPO(poNumber);
      setAvailableVehicles(gateEntries);
      
      if (gateEntries.length === 1) {
        setUnloadingForm(prev => ({
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
      setUnloadingForm({
        ...unloadingForm,
        poNumber: selectedPO.poNumber,
        supplierName: selectedPO.supplierName,
        material: selectedPO.material,
        vehicleNumber: ''
      });
      fetchVehiclesForPO(selectedPO.poNumber);
    } else {
      setUnloadingForm({
        ...unloadingForm,
        poNumber: '',
        supplierName: '',
        material: '',
        vehicleNumber: ''
      });
      setAvailableVehicles([]);
    }
  };

  const openCreateDialog = () => {
    const now = new Date();
    setUnloadingForm({
      vehicleNumber: '',
      poNumber: '',
      material: '',
      supplierName: '',
      unloadingStartTime: now.toISOString().slice(0, 16),
      unloadingEndTime: now.toISOString().slice(0, 16),
      storageLocation: '',
      quantityUnloaded: '',
      remarks: ''
    });
    setAvailableVehicles([]);
    setOpenUnloadingDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          p: 2,
          borderRadius: 3,
          background: "linear-gradient(135deg, #1976d2 30%, #42a5f5 90%)",
          color: "white",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Unloading Department Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            "&:hover": { background: "rgba(255,255,255,0.3)" },
            textTransform: "none"
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              transition: "0.3s",
              "&:hover": { boxShadow: "0 6px 18px rgba(0,0,0,0.2)" }
            }}
          >
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Unarchive sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {unloadingRecords.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unloading Records
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Unloading Records Table */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Unloading Records
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Record Unloading
          </Button>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ background: "#f5f7fa" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Vehicle Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Material</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Storage Location</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quantity Unloaded</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unloadingRecords.map((record) => (
                <TableRow key={record.id} sx={{ "&:hover": { background: "#f1f3f6" } }}>
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
  sx={{ textTransform: "none" }}
  onClick={() => handleViewRecord(record)}
>
  View
</Button>
  <Button
    size="small"
    variant="outlined"
    sx={{ textTransform: "none" }}
    onClick={() => handleEditRecord(record)}
  >
    Edit
  </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
  open={openEditDialog}
  onClose={() => setOpenEditDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>Edit Unloading Record</DialogTitle>
  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {/* Reuse the same TextFields as in create dialog */}
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
          select
          label="Storage Location"
          value={unloadingForm.storageLocation}
          onChange={(e) => setUnloadingForm({ ...unloadingForm, storageLocation: e.target.value })}
          margin="normal"
          required
        >
          {Array.from({ length: 10 }, (_, i) => (
            <MenuItem key={i+1} value={`L${i+1}`}>{`L${i+1}`}</MenuItem>
          ))}
        </TextField>
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
    <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
    <Button onClick={handleUpdateUnloadingRecord} variant="contained">
      Update Record
    </Button>
  </DialogActions>
</Dialog>


      {/* Create Unloading Record Dialog */}
      <Dialog
        open={openUnloadingDialog}
        onClose={() => setOpenUnloadingDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Record Unloading</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              {availableVehicles.length > 0 ? (
                <TextField
                  fullWidth
                  select
                  label="Vehicle Number"
                  value={unloadingForm.vehicleNumber}
                  onChange={(e) => setUnloadingForm({ ...unloadingForm, vehicleNumber: e.target.value })}
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
                  value={unloadingForm.vehicleNumber}
                  onChange={(e) => setUnloadingForm({ ...unloadingForm, vehicleNumber: e.target.value })}
                  margin="normal"
                  required
                  helperText={
                    unloadingForm.poNumber
                      ? "No vehicles found for this PO. Enter manually or verify gate entry."
                      : "Select a PO first to see vehicles, or enter manually."
                  }
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={unloadingForm.poNumber ? { poNumber: unloadingForm.poNumber } : null}
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
                select
                label="Storage Location"
                value={unloadingForm.storageLocation}
                onChange={(e) => setUnloadingForm({ ...unloadingForm, storageLocation: e.target.value })}
                margin="normal"
                required
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <MenuItem key={i+1} value={`L${i+1}`}>{`L${i+1}`}</MenuItem>
                ))}
              </TextField>
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
      <Dialog
  open={openViewDialog}
  onClose={() => setOpenViewDialog(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>Unloading Record Details</DialogTitle>
  <DialogContent>
    {selectedRecord && (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Vehicle Number"
            value={selectedRecord.vehicleNumber}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="PO Number"
            value={selectedRecord.poNumber}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Material"
            value={selectedRecord.material}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Supplier Name"
            value={selectedRecord.supplierName}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Storage Location"
            value={selectedRecord.storageLocation}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Quantity Unloaded"
            value={selectedRecord.quantityUnloaded}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Start Time"
            value={new Date(selectedRecord.unloadingStartTime).toLocaleString()}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="End Time"
            value={new Date(selectedRecord.unloadingEndTime).toLocaleString()}
            margin="normal"
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            value={selectedRecord.remarks}
            margin="normal"
            multiline
            rows={3}
            InputProps={{ readOnly: true }}
          />
        </Grid>
      </Grid>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
  </DialogActions>
</Dialog>
    </Container>
  );
};

export default UnloadingDashboard;
