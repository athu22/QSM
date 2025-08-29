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
  Chip,
  IconButton
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Visibility,
  Logout,
  Assessment
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ManagerDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [pendingPOs, setPendingPOs] = useState([]);
  const [openPODialog, setOpenPODialog] = useState(false);
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
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
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

      // Log activity
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Manager Dashboard
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
                <Assessment sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{pendingPOs.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Approvals</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Purchase Orders */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pending Purchase Orders for Approval
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>PO Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Deliver Date</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingPOs.map((po) => (
                <TableRow key={po.id}>
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
                        onClick={() => {/* View PO details */}}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ThumbUp />}
                        onClick={() => openApprovalDialog(po, 'Approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<ThumbDown />}
                        onClick={() => openApprovalDialog(po, 'Rejected')}
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

      {/* Approval Dialog */}
      <Dialog open={openPODialog} onClose={() => setOpenPODialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalForm.status === 'Approved' ? 'Approve' : 'Reject'} Purchase Order
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>PO Number:</strong> {selectedPO?.poNumber}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Supplier:</strong> {selectedPO?.supplierName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Material:</strong> {selectedPO?.material}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Quantity:</strong> {selectedPO?.quantity}
            </Typography>
            
            <TextField
              fullWidth
              label="Remarks"
              value={approvalForm.remarks}
              onChange={(e) => setApprovalForm({ ...approvalForm, remarks: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
              helperText="Please provide remarks for your decision"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPODialog(false)}>Cancel</Button>
          <Button 
            onClick={handleApproval}
            variant="contained"
            color={approvalForm.status === 'Approved' ? 'success' : 'error'}
          >
            {approvalForm.status === 'Approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManagerDashboard;
