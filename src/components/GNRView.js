import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Clear } from '@mui/icons-material';

function formatDate(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

const GNRView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poFilter, setPoFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchGNR = async () => {
      try {
        setLoading(true);
        setError(null);
        const qRef = query(collection(db, 'gnr'), orderBy('receivedDate', 'desc'));
        const snap = await getDocs(qRef);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(data);
      } catch (e) {
        console.error('Error fetching GNR records:', e);
        setError(e.message || 'Failed to fetch GNR records');
      } finally {
        setLoading(false);
      }
    };
    fetchGNR();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const poOk = poFilter
        ? String(r.poNumber || '')
            .toLowerCase()
            .includes(poFilter.trim().toLowerCase())
        : true;
      let dateOk = true;
      if (fromDate || toDate) {
        const rec = r.receivedDate || r.date || r.createdAt;
        const recTime = rec ? new Date(rec).getTime() : NaN;
        const fromOk = fromDate ? recTime >= new Date(fromDate).getTime() : true;
        const toOk = toDate ? recTime <= new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1 : true;
        dateOk = Number.isFinite(recTime) ? fromOk && toOk : false;
      }
      return poOk && dateOk;
    });
  }, [records, poFilter, fromDate, toDate]);

  // Build columns dynamically from union of keys to ensure all fields show
  const columns = useMemo(() => {
    const keys = new Set();
    filtered.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    // Ensure id is present first
    const orderedKeys = ['poNumber', 'gnrNumber', 'vehicleNumber', 'supplierName', 'material', 'quantity', 'storageLocation', 'qcStatus', 'qcBy', 'qcDate', 'receivedBy', 'receivedDate', 'remarks']
      .filter((k) => keys.has(k));
    const remaining = Array.from(keys).filter((k) => !orderedKeys.includes(k) && k !== 'id');
    const finalKeys = [...orderedKeys, ...remaining];

    return finalKeys.map((field) => ({
      field,
      headerName: field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
      flex: 1,
      minWidth: 150,
      sortable: true,
      valueGetter: (params) => params.row[field],
      valueFormatter: (params) =>
        /date/i.test(field) ? formatDate(params.value) : Array.isArray(params.value) || typeof params.value === 'object' ? JSON.stringify(params.value) : params.value ?? ''
    }));
  }, [filtered]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">GNR Records</Typography>
        <Typography variant="body2" color="text.secondary">
          View-only. All data is fetched automatically. No edits are permitted.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label="Filter by PO Number"
              value={poFilter}
              onChange={(e) => setPoFilter(e.target.value)}
              InputProps={{
                endAdornment: poFilter ? (
                  <IconButton aria-label="clear" onClick={() => setPoFilter('')} size="small">
                    <Clear fontSize="small" />
                  </IconButton>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            disableColumnFilter
            disableColumnMenu
            disableDensitySelector
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            getRowId={(row) => row.id}
            sx={{
              '& .MuiDataGrid-cell': { alignItems: 'center' },
              '& .MuiDataGrid-columnHeaders': { fontWeight: 600 }
            }}
          />
        )}
      </Paper>
    </Container>
  );
};

export default GNRView;


