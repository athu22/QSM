import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Alert
} from '@mui/material';
import { usePO } from '../contexts/POContext';

const POSelector = ({ 
  value, 
  onChange, 
  label = "PO Number", 
  required = false, 
  disabled = false,
  showDetails = false,
  placeholder = "Search PO number, supplier, or material...",
  size = "medium"
}) => {
  const { purchaseOrders, loading, error } = usePO();
  const [inputValue, setInputValue] = useState('');

  // Filter options based on input
  const getOptions = () => {
    if (!inputValue) return purchaseOrders;
    
    return purchaseOrders.filter(po => 
      po.poNumber.toLowerCase().includes(inputValue.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(inputValue.toLowerCase()) ||
      po.material.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const options = getOptions();

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const handleChange = (event, newValue) => {
    onChange(newValue);
  };

  const getOptionLabel = (option) => {
    if (typeof option === 'string') return option;
    return option.poNumber || '';
  };

  const renderOption = (props, option) => (
    <Box component="li" {...props}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="body1" fontWeight="bold">
          {option.poNumber}
        </Typography>
        {showDetails && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {option.supplierName} • {option.material}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip 
                label={option.status} 
                size="small" 
                color={
                  option.status === 'Approved' ? 'success' : 
                  option.status === 'Rejected' ? 'error' : 
                  option.status === 'Completed' ? 'primary' : 'default'
                }
                variant="outlined"
              />
              <Chip 
                label={`Qty: ${option.quantity}`} 
                size="small" 
                variant="outlined"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  const renderInput = (params) => (
    <TextField
      {...params}
      label={label}
      required={required}
      placeholder={placeholder}
      size={size}
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loading ? <CircularProgress color="inherit" size={20} /> : null}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load PO data: {error}
      </Alert>
    );
  }

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      renderInput={renderInput}
      loading={loading}
      disabled={disabled}
      filterOptions={(x) => x} // Disable built-in filtering since we handle it manually
      isOptionEqualToValue={(option, value) => 
        option.poNumber === value.poNumber
      }
      sx={{ minWidth: 250 }}
    />
  );
};

export default POSelector;
