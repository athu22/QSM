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
  Logout,
  Edit
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const QCDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [qcResults, setQcResults] = useState([]);
  const [openQCDialog, setOpenQCDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
const [selectedQC, setSelectedQC] = useState(null);
const [poList, setPoList] = useState([]);
  const [editingQC, setEditingQC] = useState(null);
  const [qcForm, setQcForm] = useState({
    poNumber: '',
    material: '',
    supplierName: '',
    testDate: '',
    testResult: 'Pending',
    purity: '',
    moisture: '',
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
  const fetchPOs = async () => {
  try {
    const q = query(collection(db, "purchaseOrders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const poData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setPoList(poData);
  } catch (error) {
    console.error("Error fetching POs:", error);
  }
};

useEffect(() => {
  fetchQCResults();
  fetchPOs();
}, []);


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

      if (editingQC) {
        // Update existing QC result
        const qcDocRef = doc(db, 'qcResults', editingQC.id);
        await updateDoc(qcDocRef, {
          ...qcData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new QC result
        await addDoc(collection(db, 'qcResults'), qcData);
      }
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: editingQC ? 'QC Test Updated' : 'QC Test Completed',
        userId: currentUser.uid,
        userRole: 'QC Dept',
        details: `QC test ${editingQC ? 'updated' : 'completed'} for PO ${qcForm.poNumber} - Result: ${qcForm.testResult}`,
        timestamp: new Date().toISOString()
      });

      setOpenQCDialog(false);
      setEditingQC(null);
      setQcForm({
        poNumber: '',
        material: '',
        supplierName: '',
        testDate: '',
        testResult: 'Pending',
        purity: '',
        moisture: '',
        testParameters: '',
        remarks: ''
      });
      fetchQCResults();
    } catch (error) {
      console.error('Error creating QC result:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingQC(null);
    setQcForm({
      poNumber: '',
      material: '',
      supplierName: '',
      testDate: new Date().toISOString().split('T')[0],
      testResult: 'Pending',
      purity: '',
      moisture: '',
      testParameters: '',
      remarks: ''
    });
    setOpenQCDialog(true);
  };

  const openEditDialog = (qc) => {
    setEditingQC(qc);
    setQcForm({
      poNumber: qc.poNumber,
      material: qc.material,
      supplierName: qc.supplierName,
      testDate: qc.testDate,
      testResult: qc.testResult,
      purity: qc.purity || '',
      moisture: qc.moisture || '',
      testParameters: qc.testParameters,
      remarks: qc.remarks
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
      QC Department Dashboard
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
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.3)',
        },
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
          <CheckCircle sx={{ fontSize: 50, color: 'success.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {qcResults.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              QC Tests
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>

  {/* QC Results */}
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
        Quality Control Results
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
        Record QC Result
      </Button>
    </Box>

    <TableContainer>
      <Table sx={{ borderRadius: 3, overflow: 'hidden' }}>
<TableHead>
  <TableRow sx={{ background: '#f5f7fa' }}>
    {['PO Number', 'Material', 'Supplier', 'Test Date', 'Test Result', 'Purity (%)', 'Moisture (%)', 'Weight/Quantity', 'Actions'].map((header) => (
      <TableCell key={header} sx={{ fontWeight: 600 }}>
        {header}
      </TableCell>
    ))}
  </TableRow>
</TableHead>

        <TableBody>
          {qcResults.map((qc, index) => (
            <TableRow
              key={qc.id}
              sx={{
                backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                '&:hover': { backgroundColor: '#f1f9ff' },
              }}
            >
              <TableCell>{qc.poNumber}</TableCell>
              <TableCell>{qc.material}</TableCell>
              <TableCell>{qc.supplierName}</TableCell>
              <TableCell>{new Date(qc.testDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ color: getResultColor(qc.testResult), fontWeight: 600 }}>
                  {qc.testResult}
                </Typography>
              </TableCell>
              <TableCell>{qc.purity || 'N/A'}</TableCell>
              <TableCell>{qc.moisture || 'N/A'}</TableCell>
<TableCell>
  {qc.weight ? `${qc.weight} kg` : qc.quantity ? qc.quantity : 'N/A'}
</TableCell>

              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
<Button
  size="small"
  startIcon={<Visibility />}
  sx={{ textTransform: 'none' }}
  onClick={() => {
    setSelectedQC(qc);
    setOpenViewDialog(true);
  }}
>
  View
</Button>

                  <Button size="small" variant="outlined" startIcon={<Edit />} sx={{ textTransform: 'none' }} onClick={() => openEditDialog(qc)}>
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

  {/* Dialog: styled below */}
  <Dialog
    open={openQCDialog}
    onClose={() => setOpenQCDialog(false)}
    maxWidth="md"
    fullWidth
    PaperProps={{
      sx: { borderRadius: 3, p: 1, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' },
    }}
  >
    <DialogTitle sx={{ fontWeight: 700, pb: 1, fontSize: '1.3rem' }}>
      {editingQC ? 'Edit QC Test Result' : 'Record QC Test Result'}
    </DialogTitle>
<DialogContent dividers sx={{ p: 3 }}>
  <Grid container spacing={2}>
<Grid item xs={12} sm={6}>
  <TextField
    select
    label="PO Number"
    fullWidth
    value={qcForm.poNumber}
    onChange={(e) => setQcForm({ ...qcForm, poNumber: e.target.value })}
  >
    {poList.length > 0 ? (
      poList.map((po) => (
        <MenuItem key={po.id} value={po.poNumber}>
          {po.poNumber} - {po.supplierName}
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>No POs Available</MenuItem>
    )}
  </TextField>
</Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        label="Material"
        fullWidth
        value={qcForm.material}
        onChange={(e) => setQcForm({ ...qcForm, material: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        label="Supplier Name"
        fullWidth
        value={qcForm.supplierName}
        onChange={(e) => setQcForm({ ...qcForm, supplierName: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        label="Test Date"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        value={qcForm.testDate}
        onChange={(e) => setQcForm({ ...qcForm, testDate: e.target.value })}
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        select
        label="Test Result"
        fullWidth
        value={qcForm.testResult}
        onChange={(e) => setQcForm({ ...qcForm, testResult: e.target.value })}
      >
        <MenuItem value="Pending">Pending</MenuItem>
        <MenuItem value="Passed">Passed</MenuItem>
        <MenuItem value="Failed">Failed</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} sm={6}>
      <TextField
        select
        fullWidth
        label="Select Option"
        value={qcForm.option || ""}
        onChange={(e) => setQcForm({ ...qcForm, option: e.target.value })}
      >
        <MenuItem value="weight">Weight in KG</MenuItem>
        <MenuItem value="quantity">Quantity</MenuItem>
        <MenuItem value="none">None</MenuItem>
      </TextField>
    </Grid>

    {/* Weight Field */}
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Weight (kg)"
        type="number"
        value={qcForm.weight || ""}
        onChange={(e) => setQcForm({ ...qcForm, weight: e.target.value })}
        disabled={qcForm.option !== "weight"}
      />
    </Grid>

    {/* Quantity Field */}
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Quantity"
        type="number"
        value={qcForm.quantity || ""}
        onChange={(e) => setQcForm({ ...qcForm, quantity: e.target.value })}
        disabled={qcForm.option !== "quantity"}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        label="Purity (%)"
        fullWidth
        value={qcForm.purity}
        onChange={(e) => setQcForm({ ...qcForm, purity: e.target.value })}
      />
    </Grid>
    
    <Grid item xs={12} sm={6}>
      <TextField
        label="Moisture (%)"
        fullWidth
        value={qcForm.moisture}
        onChange={(e) => setQcForm({ ...qcForm, moisture: e.target.value })}
      />
    </Grid>

    <Grid item xs={12}>
      <TextField
        label="Remarks"
        fullWidth
        multiline
        rows={2}
        value={qcForm.remarks}
        onChange={(e) =>
          setQcForm({ ...qcForm, remarks: e.target.value })
        }
      />
    </Grid>
  </Grid>
  
</DialogContent>

    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={() => setOpenQCDialog(false)} sx={{ textTransform: 'none' }}>
        Cancel
      </Button>
      <Button onClick={handleCreateQCResult} variant="contained" sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}>
        {editingQC ? 'Update Result' : 'Record Result'}
      </Button>
    </DialogActions>
  </Dialog>
  {/* View QC Details Dialog */}
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
    QC Test Details
  </DialogTitle>
  <DialogContent dividers sx={{ p: 3 }}>
    {selectedQC && (
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            PO Number
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {selectedQC.poNumber}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Supplier
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {selectedQC.supplierName}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Material
          </Typography>
          <Typography variant="body1">{selectedQC.material}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Test Date
          </Typography>
          <Typography variant="body1">
            {new Date(selectedQC.testDate).toLocaleDateString()}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Result
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: getResultColor(selectedQC.testResult), fontWeight: 600 }}
          >
            {selectedQC.testResult}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Purity (%)
          </Typography>
          <Typography variant="body1">{selectedQC.purity || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Moisture (%)
          </Typography>
          <Typography variant="body1">{selectedQC.moisture || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Other Test Parameters
          </Typography>
          <Typography variant="body1">
            {selectedQC.testParameters || 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Remarks
          </Typography>
          <Typography variant="body1">
            {selectedQC.remarks || 'N/A'}
          </Typography>
        </Grid>
      </Grid>
    )}
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => setOpenViewDialog(false)}
      sx={{ textTransform: 'none' }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>

</Container>

  );
};

export default QCDashboard;
