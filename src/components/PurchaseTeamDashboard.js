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
  MenuItem,
  Alert,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Visibility,
  Logout,
  Print
} from '@mui/icons-material';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { generatePONumber, validatePONumber, printPurchaseOrder } from '../utils/poUtils';

const PurchaseTeamDashboard = () => {
  const { logout, currentUser } = useAuth();
   const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [openPODialog, setOpenPODialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [poForm, setPOForm] = useState({
    poNumber: '',
    orderDate: '',
    deliverDate: '',
    supplierName: '',
    material: '',
    ratePerQuantity: '',
    ratePerKG: '',
    quantity: '',
    hsnSacCode: '',
    gst: '',
    taxAmount: '',
    remark: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      console.log('User authenticated, fetching purchase orders');
      fetchPurchaseOrders();
    } else {
      console.log('No user authenticated yet');
    }
  }, [currentUser?.uid]);
    const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/login');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching purchase orders for user:', currentUser?.uid);
      
      // First try to fetch orders for the current user
      let q = query(
        collection(db, 'purchaseOrders'),
        where('createdBy', '==', currentUser?.uid),
        orderBy('createdAt', 'desc')
      );
      
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (error) {
        console.log('Error with filtered query, trying to fetch all orders:', error);
        // If the filtered query fails, try to fetch all orders
        q = query(
          collection(db, 'purchaseOrders'),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      }
      
      const poData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched purchase orders:', poData);
      setPurchaseOrders(poData);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError(error.message);
      // Set empty array on error to avoid undefined issues
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async () => {
    try {
      // Validate required fields
      const requiredFields = ['poNumber', 'orderDate', 'deliverDate', 'supplierName', 'material', 'quantity', 'ratePerQuantity', 'ratePerKG', 'hsnSacCode', 'gst'];
      const missingFields = requiredFields.filter(field => !poForm[field]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      console.log('Creating PO with data:', poForm);
      
      const poData = {
        ...poForm,
        status: 'Pending',
        createdBy: currentUser?.uid || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving PO data:', poData);
      const docRef = await addDoc(collection(db, 'purchaseOrders'), poData);
      console.log('PO created with ID:', docRef.id);
      
      // Log activity
      try {
        await addDoc(collection(db, 'activityLogs'), {
          action: 'Purchase Order Created',
          userId: currentUser?.uid || 'unknown',
          userRole: 'Purchase Team',
          details: `PO ${poForm.poNumber} created for ${poForm.supplierName}`,
          timestamp: new Date().toISOString()
        });
      } catch (activityError) {
        console.error('Error logging activity:', activityError);
        // Don't fail the PO creation if activity logging fails
      }

      setOpenPODialog(false);
      
      // Reset form
      const newForm = {
        poNumber: '',
        orderDate: '',
        deliverDate: '',
        supplierName: '',
        material: '',
        ratePerQuantity: '',
        ratePerKG: '',
        quantity: '',
        hsnSacCode: '',
        gst: '',
        taxAmount: '',
        remark: ''
      };
      setPOForm(newForm);
      
      // Refresh the purchase orders list
      await fetchPurchaseOrders();
      
      alert(`Purchase Order ${poForm.poNumber} created successfully!`);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert(`Error creating purchase order: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Dispatched':
        return 'info';
      default:
        return 'default';
    }
  };

  // Using the utility function from poUtils.js

  const openCreateDialog = () => {
    const newPONumber = generatePONumber();
    console.log('Generated PO Number:', newPONumber);
    
    const newForm = {
      poNumber: newPONumber,
      orderDate: new Date().toISOString().split('T')[0],
      deliverDate: '',
      supplierName: '',
      material: '',
      ratePerQuantity: '',
      ratePerKG: '',
      quantity: '',
      hsnSacCode: '',
      gst: '',
      taxAmount: '',
      remark: ''
    };
    
    console.log('Setting PO form:', newForm);
    setPOForm(newForm);
    setOpenPODialog(true);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Purchase Team Dashboard
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
                <ShoppingCart sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{purchaseOrders.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total POs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Purchase Orders */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Purchase Orders</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
          >
            Create PO
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
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
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No purchase orders found. Create your first PO using the "Create PO" button above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>{po.poNumber}</TableCell>
                    <TableCell>{po.supplierName}</TableCell>
                    <TableCell>{po.material}</TableCell>
                    <TableCell>{po.quantity}</TableCell>
                    <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(po.deliverDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip 
                        label={po.status} 
                        color={getStatusColor(po.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => {/* View PO details */}}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Print />}
                        onClick={() => printPurchaseOrder(po)}
                        sx={{ ml: 1 }}
                      >
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create PO Dialog */}
      <Dialog open={openPODialog} onClose={() => setOpenPODialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Debug: PO Number = "{poForm.poNumber}" | User ID = "{currentUser?.uid}"
              </Typography>
            </Box>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PO Number"
                value={poForm.poNumber}
                InputProps={{ readOnly: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Order Date"
                type="date"
                value={poForm.orderDate}
                onChange={(e) => setPOForm({ ...poForm, orderDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deliver Date"
                type="date"
                value={poForm.deliverDate}
                onChange={(e) => setPOForm({ ...poForm, deliverDate: e.target.value })}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                value={poForm.supplierName}
                onChange={(e) => setPOForm({ ...poForm, supplierName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Material"
                value={poForm.material}
                onChange={(e) => setPOForm({ ...poForm, material: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={poForm.quantity}
                onChange={(e) => setPOForm({ ...poForm, quantity: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rate per Quantity"
                type="number"
                value={poForm.ratePerQuantity}
                onChange={(e) => setPOForm({ ...poForm, ratePerQuantity: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rate per KG"
                type="number"
                value={poForm.ratePerKG}
                onChange={(e) => setPOForm({ ...poForm, ratePerKG: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="HSN/SAC Code"
                value={poForm.hsnSacCode}
                onChange={(e) => setPOForm({ ...poForm, hsnSacCode: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GST %"
                type="number"
                value={poForm.gst}
                onChange={(e) => setPOForm({ ...poForm, gst: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tax Amount"
                type="number"
                value={poForm.taxAmount}
                onChange={(e) => setPOForm({ ...poForm, taxAmount: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remark"
                value={poForm.remark}
                onChange={(e) => setPOForm({ ...poForm, remark: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPODialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePO} variant="contained">
            Create PO
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PurchaseTeamDashboard;
