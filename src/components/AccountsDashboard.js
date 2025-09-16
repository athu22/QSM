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
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { generateGNRFromPO } from '../utils/gnrUtils';

const AccountsDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [accountsRecords, setAccountsRecords] = useState([]);
  const [gnrRecords, setGnrRecords] = useState([]);
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
      const q = query(collection(db, 'accounts'), orderBy('paymentDate', 'desc'));
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
      const q = query(collection(db, 'gnr'), orderBy('receivedDate', 'desc'));
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
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
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
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          px: 3,
          py: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          color: 'white',
          boxShadow: '0 6px 20px rgba(25,118,210,0.3)',
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Accounts Department Dashboard
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
              background: 'linear-gradient(145deg, #ffffff, #f9f9f9)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{accountsRecords.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Payment Records
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Accounts Records */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          background: 'linear-gradient(145deg, #ffffff, #f9f9f9)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Payment Records & GNR</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ borderRadius: 3, textTransform: 'none', px: 2 }}
            onClick={openCreateDialog}
          >
            Process Payment
          </Button>
        </Box>

        <TableContainer
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Table>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                {['PO Number', 'Supplier', 'Material', 'Amount (₹)', 'Payment Method', 'Payment Date', 'Status', 'Actions'].map((head) => (
                  <TableCell key={head} sx={{ fontWeight: 700 }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {accountsRecords.map((record) => (
                <TableRow
                  key={record.id}
                  hover
                  sx={{
                    transition: 'all 0.2s',
                    '&:hover': { backgroundColor: '#f9fafb' },
                  }}
                >
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
                        onClick={() => handleViewRecord(record)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Payment />}
                        sx={{ borderRadius: 3, textTransform: 'none', px: 2 }}
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

      {/* View Details Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}>
          PO Details with Auto-Generated GNR
        </DialogTitle>
        <DialogContent dividers sx={{ mt: 2 }}>
          {selectedRecord && selectedGNR && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* PO Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Purchase Order Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="PO Number" value={selectedRecord.poNumber} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Supplier Name" value={selectedRecord.supplierName} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Material" value={selectedRecord.material} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Amount (₹)" value={selectedRecord.amount} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Payment Method" value={selectedRecord.paymentMethod} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Payment Date" value={new Date(selectedRecord.paymentDate).toLocaleDateString()} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Status" value={selectedRecord.status} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>

              {/* GNR Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="secondary" sx={{ mt: 2 }}>
                  Auto-Generated GNR Details
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="GNR Number" value={selectedGNR.gnrNumber} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="PO Number" value={selectedGNR.poNumber} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Supplier Name" value={selectedGNR.supplierName} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Material" value={selectedGNR.material} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Quantity" value={`${selectedGNR.quantity} ${selectedGNR.unit}`} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Received Date" value={selectedGNR.receivedDate} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Received By" value={selectedGNR.receivedBy} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Condition" value={selectedGNR.condition} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Storage Location" value={selectedGNR.storageLocation} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Vehicle Number" value={selectedGNR.vehicleNumber} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Driver Name" value={selectedGNR.driverName} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Driver Phone" value={selectedGNR.driverPhone} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" value={selectedGNR.remarks} InputProps={{ readOnly: true }} margin="normal" />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenViewDialog(false)}
            variant="contained"
            color="primary"
            sx={{ borderRadius: 3, px: 3, textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountsDashboard;
