import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
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
  Alert,
  Chip,
  CircularProgress,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  ShoppingCart,
  Add,
  Visibility,
  Logout,
  Print,
  Send,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  generatePONumber,
  printPurchaseOrder,
} from "../utils/poUtils";
import { motion } from "framer-motion";

const PurchaseTeamDashboard = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [openPODialog, setOpenPODialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [error, setError] = useState(null);
  const [lastCreatedPO, setLastCreatedPO] = useState(null);
  const [showSendToWP, setShowSendToWP] = useState(false);
  const [poForm, setPOForm] = useState({
    poNumber: "",
    orderDate: "",
    deliverDate: "",
    supplierName: "",
    material: "",
    ratePerQuantity: "",
    ratePerKG: "",
    quantity: "",
    hsnSacCode: "",
    gst: "",
    taxAmount: "",
    remark: "",
  });

  useEffect(() => {
    if (currentUser?.uid) {
      fetchPurchaseOrders();
    }
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, "purchaseOrders"),
        where("createdBy", "==", currentUser?.uid),
        orderBy("createdAt", "desc")
      );
      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch {
        q = query(collection(db, "purchaseOrders"), orderBy("createdAt", "desc"));
        querySnapshot = await getDocs(q);
      }
      const poData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPurchaseOrders(poData);
    } catch (error) {
      setError(error.message);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async () => {
    try {
      const requiredFields = [
        "poNumber",
        "orderDate",
        "deliverDate",
        "supplierName",
        "material",
        "quantity",
        "ratePerQuantity",
        "ratePerKG",
        "hsnSacCode",
        "gst",
      ];
      const missing = requiredFields.filter((f) => !poForm[f]);
      if (missing.length > 0) {
        alert(`Missing: ${missing.join(", ")}`);
        return;
      }

      const poData = {
        ...poForm,
        status: "Pending",
        createdBy: currentUser?.uid || "unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "purchaseOrders"), poData);
      setOpenPODialog(false);
      setPOForm({
        poNumber: "",
        orderDate: "",
        deliverDate: "",
        supplierName: "",
        material: "",
        ratePerQuantity: "",
        ratePerKG: "",
        quantity: "",
        hsnSacCode: "",
        gst: "",
        taxAmount: "",
        remark: "",
      });
      await fetchPurchaseOrders();
      setLastCreatedPO({ ...poData, id: docRef.id });
      setShowSendToWP(true);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSendToWP = async () => {
    if (!lastCreatedPO) return;
    const poDocRef = doc(db, "purchaseOrders", lastCreatedPO.id);
    await updateDoc(poDocRef, {
      status: "Sent to WP",
      sentToWPAt: new Date().toISOString(),
    });
    setShowSendToWP(false);
    setLastCreatedPO(null);
    await fetchPurchaseOrders();
  };

  const openCreateDialog = () => {
    setPOForm({
      poNumber: generatePONumber(),
      orderDate: new Date().toISOString().split("T")[0],
      deliverDate: "",
      supplierName: "",
      material: "",
      ratePerQuantity: "",
      ratePerKG: "",
      quantity: "",
      hsnSacCode: "",
      gst: "",
      taxAmount: "",
      remark: "",
    });
    setOpenPODialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "error";
      case "Dispatched":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* App Header */}
      <AppBar position="static" sx={{ background: "linear-gradient(90deg,#4f46e5,#9333ea)" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Purchase Team Dashboard</Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Card sx={{ borderRadius: 3, boxShadow: 4, p: 2 }}>
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <ShoppingCart sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{purchaseOrders.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Total POs</Typography>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Send to WP Banner */}
        {showSendToWP && lastCreatedPO && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: "success.light",
                borderRadius: 2,
                boxShadow: 3,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">
                  PO {lastCreatedPO.poNumber} created. Send to Work Process?
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button variant="contained" color="success" startIcon={<Send />} onClick={handleSendToWP}>
                    Send
                  </Button>
                  <Button variant="outlined" onClick={() => setShowSendToWP(false)}>
                    Dismiss
                  </Button>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Purchase Orders Table */}
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Purchase Orders</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
              Create PO
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: "linear-gradient(90deg,#e0e7ff,#ede9fe)" }}>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Qty</TableCell>
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
                        <Typography>No purchase orders found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((po) => (
                      <motion.tr key={po.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <TableCell>{po.poNumber}</TableCell>
                        <TableCell>{po.supplierName}</TableCell>
                        <TableCell>{po.material}</TableCell>
                        <TableCell>{po.quantity}</TableCell>
                        <TableCell>{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(po.deliverDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip label={po.status} color={getStatusColor(po.status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Button 
  size="small" 
  startIcon={<Visibility />} 
  onClick={() => setViewPO(po)}
>
  View
</Button>

                          <Button size="small" startIcon={<Print />} sx={{ ml: 1 }} onClick={() => printPurchaseOrder(po)}>
                            Print
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Create PO Dialog */}
        <Dialog open={openPODialog} onClose={() => setOpenPODialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {Object.entries({
                poNumber: "PO Number",
                orderDate: "Order Date",
                deliverDate: "Deliver Date",
                supplierName: "Supplier Name",
                material: "Material",
                quantity: "Quantity",
                ratePerQuantity: "Rate per Quantity",
                ratePerKG: "Rate per KG",
                hsnSacCode: "HSN/SAC Code",
                gst: "GST %",
                taxAmount: "Tax Amount",
                remark: "Remark",
              }).map(([key, label]) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField
                    fullWidth
                    label={label}
                    type={
                      key.includes("Date")
                        ? "date"
                        : key.includes("quantity") ||
                          key.includes("Rate") ||
                          key.includes("gst") ||
                          key.includes("tax")
                        ? "number"
                        : "text"
                    }
                    value={poForm[key]}
                    onChange={(e) => setPOForm({ ...poForm, [key]: e.target.value })}
                    margin="normal"
                    InputLabelProps={key.includes("Date") ? { shrink: true } : {}}
                    InputProps={key === "poNumber" ? { readOnly: true } : {}}
                    multiline={key === "remark"}
                    rows={key === "remark" ? 3 : 1}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPODialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePO} variant="contained">
              Create PO
            </Button>
          </DialogActions>
        </Dialog>
        {/* View PO Dialog */}
<Dialog 
  open={!!viewPO} 
  onClose={() => setViewPO(null)} 
  maxWidth="md" 
  fullWidth
>
  <DialogTitle>Purchase Order Details</DialogTitle>
  <DialogContent>
    {viewPO && (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {[
            ["PO Number", viewPO.poNumber],
            ["Order Date", new Date(viewPO.orderDate).toLocaleDateString()],
            ["Deliver Date", new Date(viewPO.deliverDate).toLocaleDateString()],
            ["Supplier", viewPO.supplierName],
            ["Material", viewPO.material],
            ["Quantity", viewPO.quantity],
            ["Rate per Quantity", viewPO.ratePerQuantity],
            ["Rate per KG", viewPO.ratePerKG],
            ["HSN/SAC Code", viewPO.hsnSacCode],
            ["GST %", viewPO.gst],
            ["Tax Amount", viewPO.taxAmount],
            ["Remark", viewPO.remark],
            ["Status", viewPO.status],
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
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setViewPO(null)}>Close</Button>
  </DialogActions>
</Dialog>

      </Container>
    </Box>
  );
};

export default PurchaseTeamDashboard;
