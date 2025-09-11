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
  AccountBalance,
  Add,
  Visibility,
  Logout,
  Payment,
  Receipt
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const AccountsDashboard = () => {
  const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
  const [accountsRecords, setAccountsRecords] = useState([]);
  const [gnrRecords, setGnrRecords] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openGNRDialog, setOpenGNRDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
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

      setOpenPaymentDialog(false);
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
                        onClick={() => {/* View payment details */}}
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
          <Button
            variant="contained"
            startIcon={<Receipt />}
            onClick={openCreateGNRDialog}
          >
            Create GNR
          </Button>
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

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRecord ? 'Edit Payment Record' : 'Process New Payment'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <POSelector
                value={paymentForm.poNumber ? { poNumber: paymentForm.poNumber } : null}
                onChange={(selectedPO) => {
                  if (selectedPO) {
                    setPaymentForm({
                      ...paymentForm,
                      poNumber: selectedPO.poNumber,
                      supplierName: selectedPO.supplierName,
                      material: selectedPO.material
                    });
                  } else {
                    setPaymentForm({
                      ...paymentForm,
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
                value={paymentForm.supplierName}
                onChange={(e) => setPaymentForm({ ...paymentForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material"
                value={paymentForm.material}
                onChange={(e) => setPaymentForm({ ...paymentForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Online Payment">Online Payment</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePayment} variant="contained">
            {selectedRecord ? 'Update Payment Record' : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* GNR Dialog */}
      <Dialog open={openGNRDialog} onClose={() => setOpenGNRDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Goods Note Receipt (GNR)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GNR Number"
                value={gnrForm.gnrNumber}
                InputProps={{ readOnly: true }}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PO Number"
                value={gnrForm.poNumber}
                onChange={(e) => setGnrForm({ ...gnrForm, poNumber: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={gnrForm.supplierName}
                onChange={(e) => setGnrForm({ ...gnrForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material"
                value={gnrForm.material}
                onChange={(e) => setGnrForm({ ...gnrForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={gnrForm.quantity}
                onChange={(e) => setGnrForm({ ...gnrForm, quantity: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Received Date"
                type="date"
                value={gnrForm.receivedDate}
                onChange={(e) => setGnrForm({ ...gnrForm, receivedDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Received By"
                value={gnrForm.receivedBy}
                onChange={(e) => setGnrForm({ ...gnrForm, receivedBy: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Condition"
                value={gnrForm.condition}
                onChange={(e) => setGnrForm({ ...gnrForm, condition: e.target.value })}
                margin="normal"
                required
              >
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
                <MenuItem value="Partial">Partial</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                value={gnrForm.remarks}
                onChange={(e) => setGnrForm({ ...gnrForm, remarks: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGNRDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateGNR} variant="contained">
            Create GNR
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountsDashboard;
