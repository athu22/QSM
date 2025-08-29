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
  Chip
} from '@mui/material';
import {
  LocalShipping,
  Visibility,
  Logout
} from '@mui/icons-material';
import { collection, getDocs, updateDoc, doc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [approvedPOs, setApprovedPOs] = useState([]);

  useEffect(() => {
    fetchApprovedPOs();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Redirect to login page
  };

  const fetchApprovedPOs = async () => {
    try {
      const q = query(
        collection(db, 'purchaseOrders'),
        where('status', '==', 'Approved'),
        orderBy('createdAt', 'desc')
      );
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

  const handleDispatch = async (po) => {
    try {
      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'Dispatched',
        dispatchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Log activity
      await addDoc(collection(db, 'activityLogs'), {
        action: 'PO Dispatched',
        userId: currentUser.uid,
        userRole: 'Vendor',
        details: `PO ${po.poNumber} marked as dispatched`,
        timestamp: new Date().toISOString()
      });

      fetchApprovedPOs();
    } catch (error) {
      console.error('Error updating PO:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Dispatched':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Vendor Dashboard
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
                <LocalShipping sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{approvedPOs.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Approved POs</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approved Purchase Orders */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Approved Purchase Orders
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
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {approvedPOs.map((po) => (
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => {/* View PO details */}}
                      >
                        View
                      </Button>
                      {po.status === 'Approved' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="info"
                          startIcon={<LocalShipping />}
                          onClick={() => handleDispatch(po)}
                        >
                          Mark Dispatched
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default VendorDashboard;
