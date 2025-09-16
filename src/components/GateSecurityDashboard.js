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
  MenuItem,
  Chip
} from '@mui/material';
import {
  Security,
  Add,
  Visibility,
  Logout,
  Edit
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  updateDoc,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const GateSecurityDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const [gateEntries, setGateEntries] = useState([]);
  const [openEntryDialog, setOpenEntryDialog] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
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
  remarks: '',
  outTime: ''   // NEW FIELD
});


  useEffect(() => {
    fetchGateEntries();
    fetchApprovedPOs();
  }, []);

  const fetchApprovedPOs = async () => {
    try {
      const q = query(collection(db, 'purchaseOrders'));
      const querySnapshot = await getDocs(q);
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovedPOs(poData);
    } catch (error) {
      console.error('Error fetching approved POs:', error);
    }
  };

  const fetchGateEntries = async () => {
    try {
      const q = query(collection(db, 'gateEntries'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const flattenedEntries = [];
        if (data.vehicles) {
          Object.values(data.vehicles).forEach(vehicle => {
            flattenedEntries.push({
              id: `${doc.id}_${vehicle.vehicleNumber}`,
              poNumber: doc.id,
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
    navigate('/login');
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
  outTime: entryForm.outTime || null,
  status: editingEntry ? 'Closed' : 'Active'
};


      if (poDoc.exists()) {
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
    remarks: entry.remarks,
    outTime: entry.outTime || ''   // NEW
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          px: 2,
          py: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          color: 'white',
          boxShadow: '0 6px 20px rgba(25,118,210,0.3)'
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Gate Security Dashboard
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<Logout />}
          sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      {/* Stats Card */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'linear-gradient(145deg, #ffffff, #f9f9f9)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{gateEntries.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Entries
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approved POs */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Manager Approved Purchase Orders
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {approvedPOs.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary">No approved POs found.</Typography>
          </Grid>
        )}
        {approvedPOs.map(po => (
          <Grid item xs={12} sm={6} md={3} key={po.id}>
            <Card
              sx={{
                cursor: 'pointer',
                borderRadius: 3,
                transition: '0.2s',
                '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }
              }}
              onClick={() => handlePOCardClick(po)}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  PO: {po.poNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supplier: {po.supplierName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Material: {po.material}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gate Entries */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          background: 'linear-gradient(145deg, #ffffff, #f9f9f9)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Gate Entries
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ borderRadius: 3, textTransform: 'none', px: 3 }}
            onClick={openCreateDialog}
          >
            Record Entry
          </Button>
        </Box>

        <TableContainer
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 3px 12px rgba(0,0,0,0.1)'
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Driver Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Material</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entry Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Out Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vehicle Checks</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gateEntries.map((entry) => (
                <TableRow
                  key={entry.id}
                  hover
                  sx={{ transition: 'all 0.2s', '&:hover': { backgroundColor: '#f9fafb' } }}
                >
                  <TableCell>{entry.vehicleNumber}</TableCell>
                  <TableCell>{entry.driverName}</TableCell>
                  <TableCell>{entry.poNumber}</TableCell>
                  <TableCell>{entry.supplierName}</TableCell>
                  <TableCell>{entry.material}</TableCell>
                  <TableCell>{new Date(entry.entryTime).toLocaleString()}</TableCell>
                  <TableCell>{entry.outTime ? new Date(entry.outTime).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={entry.vehicleChecks}
                      color={
                        entry.vehicleChecks === 'Passed'
                          ? 'success'
                          : entry.vehicleChecks === 'Failed'
                          ? 'error'
                          : 'warning'
                      }
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
<Button
  size="small"
  startIcon={<Visibility />}
  variant="outlined"
  sx={{ borderRadius: 3, textTransform: 'none', px: 2 }}
  onClick={() => setViewEntry(entry)}
>
  View
</Button>

                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit />}
                        sx={{ borderRadius: 3, textTransform: 'none', px: 2 }}
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

      {/* Create/Edit Entry Dialog */}
      <Dialog
        open={openEntryDialog}
        onClose={() => setOpenEntryDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle
          sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}
        >
          {editingEntry ? 'Edit Gate Entry' : 'Record Gate Entry'}
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          <Grid container spacing={2}>
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
  {editingEntry ? (
    <TextField
      fullWidth
      label="Out Time"
      type="datetime-local"
      value={entryForm.outTime}
      onChange={(e) => setEntryForm({ ...entryForm, outTime: e.target.value })}
      margin="normal"
      InputLabelProps={{ shrink: true }}
      required
    />
  ) : (
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
  )}
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
          <Button
            onClick={() => setOpenEntryDialog(false)}
            sx={{ borderRadius: 3, px: 3, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEntry}
            variant="contained"
            sx={{ borderRadius: 3, px: 3, textTransform: 'none' }}
          >
            {editingEntry ? 'Update Entry' : 'Record Entry'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Entry Dialog */}
<Dialog
  open={!!viewEntry}
  onClose={() => setViewEntry(null)}
  maxWidth="md"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: 3,
      p: 2,
      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
    }
  }}
>
  <DialogTitle
    sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}
  >
    Gate Entry Details
  </DialogTitle>
  <DialogContent dividers sx={{ mt: 2 }}>
    {viewEntry && (
      <Grid container spacing={2}>
        {[
          ["Vehicle Number", viewEntry.vehicleNumber],
          ["Driver Name", viewEntry.driverName],
          ["Driver Phone", viewEntry.driverPhone],
          ["PO Number", viewEntry.poNumber],
          ["Supplier", viewEntry.supplierName],
          ["Material", viewEntry.material],
["Entry Time", new Date(viewEntry.entryTime).toLocaleString()],
["Out Time", viewEntry.outTime ? new Date(viewEntry.outTime).toLocaleString() : "-"],
["Vehicle Checks", viewEntry.vehicleChecks],

          ["Remarks", viewEntry.remarks],
          ["Status", viewEntry.status],
        ].map(([label, value]) => (
          <Grid item xs={12} sm={6} key={label}>
            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body1">{value || "-"}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setViewEntry(null)}
      sx={{ borderRadius: 3, px: 3, textTransform: 'none' }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

    </Container>
  );
};

export default GateSecurityDashboard;
