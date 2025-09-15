import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Chip
} from '@mui/material';
import {
  AccountBalance,
  Add,
  Visibility,
  Logout,
  Payment,
  Receipt
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query,  orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { generateGNRFromPO } from '../utils/gnrUtils';

const AccountsDashboard = () => {
  const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
  const [accountsRecords, setAccountsRecords] = useState([]);
  const [gnrRecords, setGnrRecords] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openGNRDialog, setOpenGNRDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedGNR, setSelectedGNR] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    poNumber: '',
    supplierName: '',
    material: '',
    amount: '',
    paymentMethod: '',
    paymentDate: '',
    remarks: ''
  });
  const [gnrForm, setGnrForm] = useState({
    gnrNumber: '',
    poNumber: '',
    supplierName: '',
    material: '',
    quantity: '',
    receivedDate: '',
    receivedBy: '',
    condition: '',
    remarks: ''
  });

  useEffect(() => {
    fetchAccountsRecords();
    fetchGNRRecords();
  }, []);

  const fetchAccountsRecords = async () => {
    try {
      const q = query(
        collection(db, 'accounts'),
        orderBy('paymentDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAccountsRecords(recordsData);
    } catch (error) {
      console.error('Error fetching accounts records:', error);
    }
  };

  const fetchGNRRecords = async () => {
    try {
      const q = query(
        collection(db, 'gnr'),
        orderBy('receivedDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGnrRecords(recordsData);
    } catch (error) {
      console.error('Error fetching GNR records:', error);
    }
  };
    const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, try to navigate to login
      navigate('/login');
    }
  };

  const handleCreatePayment = async () => {
    try {
      const paymentData = {
        ...paymentForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Processed'
      };

      await addDoc(collection(db, 'accounts'), paymentData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'Payment Processed',
        userId: currentUser.uid,
        userRole: 'Accounts Dept',
        details: `Payment processed for PO ${paymentForm.poNumber} - Amount: ₹${paymentForm.amount}`,
        timestamp: new Date().toISOString()
      });


      setPaymentForm({
        poNumber: '',
        supplierName: '',
        material: '',
        amount: '',
        paymentMethod: '',
        paymentDate: '',
        remarks: ''
      });
      fetchAccountsRecords();
    } catch (error) {
      console.error('Error creating payment record:', error);
    }
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setPaymentForm({
      poNumber: record.poNumber || '',
      supplierName: record.supplierName || '',
      material: record.material || '',
      amount: record.amount || '',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setOpenPaymentDialog(true);
  };

  const handleCreateGNR = async () => {
    try {
      const gnrData = {
        ...gnrForm,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'Active'
      };

      await addDoc(collection(db, 'gnr'), gnrData);
      
      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'GNR Created',
        userId: currentUser.uid,
        userRole: 'Accounts Dept',
        details: `GNR ${gnrForm.gnrNumber} created for PO ${gnrForm.poNumber}`,
        timestamp: new Date().toISOString()
      });

      setOpenGNRDialog(false);
      setGnrForm({
        gnrNumber: '',
        poNumber: '',
        supplierName: '',
        material: '',
        quantity: '',
        receivedDate: '',
        receivedBy: '',
        condition: '',
        remarks: ''
      });
      fetchGNRRecords();
    } catch (error) {
      console.error('Error creating GNR:', error);
    }
  };

  const openCreateDialog = () => {
    setSelectedRecord(null);
    setPaymentForm({
      poNumber: '',
      supplierName: '',
      material: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setOpenPaymentDialog(true);
  };

  const openCreateGNRDialog = () => {
    setGnrForm({
      gnrNumber: `GNR-${Date.now()}`,
      poNumber: '',
      supplierName: '',
      material: '',
      quantity: '',
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: '',
      condition: 'Good',
      remarks: ''
    });
    setOpenGNRDialog(true);
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    // Generate GNR details from PO data
    const gnrData = generateGNRFromPO(record);
    setSelectedGNR(gnrData);
    setOpenViewDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processed':
        return 'success';
      case 'Pending':
        return 'warning';
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
          Accounts Department Dashboard
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
                <AccountBalance sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{accountsRecords.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Payment Records</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accounts Records */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Payment Records & GNR</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Process Payment
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Amount (₹)</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountsRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.poNumber}</TableCell>
                  <TableCell>{record.supplierName}</TableCell>
                  <TableCell>{record.material}</TableCell>
                  <TableCell>₹{record.amount}</TableCell>
                  <TableCell>{record.paymentMethod}</TableCell>
                  <TableCell>{new Date(record.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={record.status} 
                      color={getStatusColor(record.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewRecord(record)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Payment />}
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

      {/* GNR Records */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Goods Note Receipt (GNR)</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => navigate('/gnr')}
            >
              View GNR
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={openCreateGNRDialog}
            >
              Create GNR
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>GNR Number</TableCell>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Received Date</TableCell>
                <TableCell>Received By</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gnrRecords.map((gnr) => (
                <TableRow key={gnr.id}>
                  <TableCell>{gnr.gnrNumber}</TableCell>
                  <TableCell>{gnr.poNumber}</TableCell>
                  <TableCell>{gnr.supplierName}</TableCell>
                  <TableCell>{gnr.material}</TableCell>
                  <TableCell>{gnr.quantity}</TableCell>
                  <TableCell>{new Date(gnr.receivedDate).toLocaleDateString()}</TableCell>
                  <TableCell>{gnr.receivedBy}</TableCell>
                  <TableCell>
                    <Chip 
                      label={gnr.condition} 
                      color={gnr.condition === 'Good' ? 'success' : gnr.condition === 'Damaged' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {/* View GNR details */}}
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

      {/* View Details Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            PO Details with Auto-Generated GNR
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRecord && selectedGNR && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* PO Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Purchase Order Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PO Number"
                  value={selectedRecord.poNumber}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  value={selectedRecord.supplierName}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material"
                  value={selectedRecord.material}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount (₹)"
                  value={selectedRecord.amount}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  value={selectedRecord.paymentMethod}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  value={new Date(selectedRecord.paymentDate).toLocaleDateString()}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedRecord.status}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>

              {/* GNR Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="secondary" sx={{ mt: 2 }}>
                  Auto-Generated GNR Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GNR Number"
                  value={selectedGNR.gnrNumber}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PO Number"
                  value={selectedGNR.poNumber}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  value={selectedGNR.supplierName}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material"
                  value={selectedGNR.material}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  value={`${selectedGNR.quantity} ${selectedGNR.unit}`}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Received Date"
                  value={selectedGNR.receivedDate}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Received By"
                  value={selectedGNR.receivedBy}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Condition"
                  value={selectedGNR.condition}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Storage Location"
                  value={selectedGNR.storageLocation}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  value={selectedGNR.vehicleNumber}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driver Name"
                  value={selectedGNR.driverName}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Driver Phone"
                  value={selectedGNR.driverPhone}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  value={selectedGNR.remarks}
                  InputProps={{ readOnly: true }}
                  margin="normal"
                  multiline
                  rows={3}
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

export default AccountsDashboard;

  
