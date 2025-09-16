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
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Visibility,
  Logout,
  Assessment,
  Description
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [pendingPOs, setPendingPOs] = useState([]);
  const [openPODialog, setOpenPODialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [approvalForm, setApprovalForm] = useState({
    status: '',
    remarks: ''
  });

  useEffect(() => {
    fetchPendingPOs();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
  };


  const openViewDetails = (po) => {
    setSelectedPO(po);
    setOpenViewDialog(true);
  };

  const fetchPendingPOs = async () => {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('status', '==', 'Pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingPOs(poData);
    } catch (error) {
      console.error('Error fetching pending POs:', error);
    }
  };

  const handleApproval = async () => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', selectedPO.id), {
        status: approvalForm.status,
        managerRemarks: approvalForm.remarks,
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'activityLogs'), {
        action: `PO ${approvalForm.status}`,
        userId: currentUser.uid,
        userRole: 'Manager',
        details: `PO ${selectedPO.poNumber} ${approvalForm.status.toLowerCase()} with remarks: ${approvalForm.remarks}`,
        timestamp: new Date().toISOString()
      });

      setOpenPODialog(false);
      setSelectedPO(null);
      setApprovalForm({ status: '', remarks: '' });
      fetchPendingPOs();
    } catch (error) {
      console.error('Error updating PO:', error);
    }
  };

  const openApprovalDialog = (po, status) => {
    setSelectedPO(po);
    setApprovalForm({ status, remarks: '' });
    setOpenPODialog(true);
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
          p: 2,
          background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
          borderRadius: 2,
          boxShadow: 3,
          color: 'white'
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Manager Dashboard
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: 4,
              transition: '0.3s',
              '&:hover': { transform: 'scale(1.05)', boxShadow: 6 }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ fontSize: 50, color: '#f57c00', mr: 2 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {pendingPOs.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approvals
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
       <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          boxShadow: 4,
          backgroundColor: '#fafafa'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Pending Purchase Orders
        </Typography>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#1976d2' }}>
              <TableRow>
                {['PO Number', 'Supplier', 'Material', 'Quantity', 'Order Date', 'Deliver Date', 'Total Amount', 'Actions'].map((head, idx) => (
                  <TableCell key={idx} sx={{ color: 'white', fontWeight: 'bold' }}>
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPOs.map((po) => (
                <TableRow
                  key={po.id}
                  sx={{
                    '&:hover': { backgroundColor: '#f1f8ff' },
                    transition: '0.2s'
                  }}
                >
                  <TableCell>{po.poNumber}</TableCell>
                  <TableCell>{po.supplierName}</TableCell>
                  <TableCell>{po.material}</TableCell>
                  <TableCell>{po.quantity}</TableCell>
                  <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(po.deliverDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    ₹{((po.ratePerQuantity * po.quantity) + parseFloat(po.taxAmount || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                        onClick={() => openViewDetails(po)}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUp />}
                        onClick={() => openApprovalDialog(po, 'Approved')}
                        sx={{ borderRadius: 2 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<ThumbDown />}
                        onClick={() => openApprovalDialog(po, 'Rejected')}
                        sx={{ borderRadius: 2 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- View PO Dialog --- */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
          Purchase Order Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedPO ? (
            <Grid container spacing={2}>
              {[
                { label: 'PO Number', value: selectedPO.poNumber },
                { label: 'Supplier Name', value: selectedPO.supplierName },
                { label: 'Material', value: selectedPO.material },
                { label: 'Quantity', value: selectedPO.quantity },
                { label: 'Rate Per Quantity', value: `₹${selectedPO.ratePerQuantity}` },
                { label: 'Tax Amount', value: `₹${selectedPO.taxAmount || 0}` },
                { label: 'Total Amount', value: `₹${((selectedPO.ratePerQuantity * selectedPO.quantity) + parseFloat(selectedPO.taxAmount || 0)).toFixed(2)}` },
                { label: 'Order Date', value: new Date(selectedPO.orderDate).toLocaleDateString() },
                { label: 'Deliver Date', value: new Date(selectedPO.deliverDate).toLocaleDateString() },
                { label: 'Status', value: selectedPO.status }
              ].map((item, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>No data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- Approve/Reject Dialog --- */}
      <Dialog open={openPODialog} onClose={() => setOpenPODialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {approvalForm.status === 'Approved' ? 'Approve' : 'Reject'} Purchase Order
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1"><strong>PO Number:</strong> {selectedPO?.poNumber}</Typography>
            <Typography variant="body1"><strong>Supplier:</strong> {selectedPO?.supplierName}</Typography>
            <Typography variant="body1"><strong>Material:</strong> {selectedPO?.material}</Typography>
            <Typography variant="body1"><strong>Quantity:</strong> {selectedPO?.quantity}</Typography>
            <TextField
              fullWidth
              label="Remarks"
              value={approvalForm.remarks}
              onChange={(e) => setApprovalForm({ ...approvalForm, remarks: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPODialog(false)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleApproval}
            variant="contained"
            color={approvalForm.status === 'Approved' ? 'success' : 'error'}
            sx={{ borderRadius: 2 }}
          >
            {approvalForm.status === 'Approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDashboard;
