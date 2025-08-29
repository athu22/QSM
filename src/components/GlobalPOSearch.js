import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Clear,
  Visibility,
  Close
} from '@mui/icons-material';
import { usePO } from '../contexts/POContext';

const GlobalPOSearch = ({ open, onClose }) => {
  const { purchaseOrders, loading, searchPOs } = usePO();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPODetails, setShowPODetails] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results = searchPOs(searchTerm);
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSelectedPO(null);
    setShowPODetails(false);
  };

  const handleViewPODetails = (po) => {
    setSelectedPO(po);
    setShowPODetails(true);
  };

  const handleClosePODetails = () => {
    setShowPODetails(false);
    setSelectedPO(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Completed': return 'primary';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      {/* Main Search Dialog */}
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Global PO Search</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Search by PO number, supplier name, or material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {loading && <CircularProgress size={20} />}
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!searchTerm.trim()}
                >
                  Search
                </Button>
              </Grid>
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleClearSearch}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Search Results ({searchResults.length})
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO Number</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Material</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Order Date</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((po) => (
                      <TableRow key={po.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {po.poNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{po.supplierName}</TableCell>
                        <TableCell>{po.material}</TableCell>
                        <TableCell>
                          <Chip
                            label={po.status}
                            color={getStatusColor(po.status)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{formatDate(po.orderDate)}</TableCell>
                        <TableCell>{po.quantity}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewPODetails(po)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {searchTerm && searchResults.length === 0 && !loading && (
            <Alert severity="info">
              No PO numbers found matching "{searchTerm}"
            </Alert>
          )}

          {!searchTerm && (
            <Alert severity="info">
              Enter a search term to find PO numbers across the system
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* PO Details Dialog */}
      <Dialog open={showPODetails} onClose={handleClosePODetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">PO Details: {selectedPO?.poNumber}</Typography>
            <IconButton onClick={handleClosePODetails}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedPO && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">PO Number</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.poNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedPO.status}
                  color={getStatusColor(selectedPO.status)}
                  sx={{ mt: 0.5 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Supplier</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.supplierName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Material</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.material}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Order Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedPO.orderDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Delivery Date</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedPO.deliverDate)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.quantity}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Rate per Quantity</Typography>
                <Typography variant="body1" gutterBottom>₹{selectedPO.ratePerQuantity}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Rate per KG</Typography>
                <Typography variant="body1" gutterBottom>₹{selectedPO.ratePerKG}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">HSN/SAC Code</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.hsnSacCode}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">GST</Typography>
                <Typography variant="body1" gutterBottom>{selectedPO.gst}%</Typography>
              </Grid>
              {selectedPO.remark && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
                  <Typography variant="body1" gutterBottom>{selectedPO.remark}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedPO.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1" gutterBottom>{formatDate(selectedPO.updatedAt)}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePODetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GlobalPOSearch;
