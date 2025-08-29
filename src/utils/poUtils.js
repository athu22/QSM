// Utility functions for Purchase Order management

/**
 * Generate a unique PO number with format: POYYYYMMDDXXX
 * @returns {string} Generated PO number
 */
export const generatePONumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO${year}${month}${day}${random}`;
};

/**
 * Validate PO number format
 * @param {string} poNumber - PO number to validate
 * @returns {boolean} True if valid format
 */
export const validatePONumber = (poNumber) => {
  if (!poNumber) return false;
  
  // Check if it matches the format POYYYYMMDDXXX
  const poRegex = /^PO\d{4}\d{2}\d{2}\d{3}$/;
  return poRegex.test(poNumber);
};

/**
 * Extract date from PO number
 * @param {string} poNumber - PO number
 * @returns {Date|null} Extracted date or null if invalid
 */
export const extractDateFromPO = (poNumber) => {
  if (!validatePONumber(poNumber)) return null;
  
  try {
    const year = parseInt(poNumber.substring(2, 6));
    const month = parseInt(poNumber.substring(6, 8)) - 1; // Month is 0-indexed
    const day = parseInt(poNumber.substring(8, 10));
    
    return new Date(year, month, day);
  } catch (error) {
    return null;
  }
};

/**
 * Check if PO number is from today
 * @param {string} poNumber - PO number to check
 * @returns {boolean} True if PO is from today
 */
export const isPOToday = (poNumber) => {
  const poDate = extractDateFromPO(poNumber);
  if (!poDate) return false;
  
  const today = new Date();
  return poDate.toDateString() === today.toDateString();
};

/**
 * Get PO number age in days
 * @param {string} poNumber - PO number to check
 * @returns {number} Age in days, -1 if invalid
 */
export const getPOAge = (poNumber) => {
  const poDate = extractDateFromPO(poNumber);
  if (!poDate) return -1;
  
  const today = new Date();
  const diffTime = Math.abs(today - poDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Format PO number for display
 * @param {string} poNumber - PO number to format
 * @returns {string} Formatted PO number
 */
export const formatPONumber = (poNumber) => {
  if (!poNumber) return '';
  
  // Add spaces for better readability: PO 2024 01 15 001
  if (validatePONumber(poNumber)) {
    return `${poNumber.substring(0, 2)} ${poNumber.substring(2, 6)} ${poNumber.substring(6, 8)} ${poNumber.substring(8, 10)} ${poNumber.substring(10)}`;
  }
  
  return poNumber;
};

/**
 * Get PO status color for Material-UI
 * @param {string} status - PO status
 * @returns {string} Color name
 */
export const getPOStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'completed': return 'primary';
    case 'pending': return 'warning';
    case 'dispatched': return 'info';
    default: return 'default';
  }
};

/**
 * Get PO priority based on age and status
 * @param {string} poNumber - PO number
 * @param {string} status - PO status
 * @returns {string} Priority level
 */
export const getPOPriority = (poNumber, status) => {
  if (status === 'Completed' || status === 'Rejected') return 'low';
  
  const age = getPOAge(poNumber);
  if (age === -1) return 'unknown';
  
  if (age <= 1) return 'high';
  if (age <= 3) return 'medium';
  return 'low';
};

/**
 * Sort PO numbers by date (newest first)
 * @param {Array} poList - List of PO objects
 * @returns {Array} Sorted PO list
 */
export const sortPOsByDate = (poList) => {
  return [...poList].sort((a, b) => {
    const dateA = extractDateFromPO(a.poNumber) || new Date(0);
    const dateB = extractDateFromPO(b.poNumber) || new Date(0);
    return dateB - dateA;
  });
};

/**
 * Filter POs by date range
 * @param {Array} poList - List of PO objects
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered PO list
 */
export const filterPOsByDateRange = (poList, startDate, endDate) => {
  if (!startDate || !endDate) return poList;
  
  return poList.filter(po => {
    const poDate = extractDateFromPO(po.poNumber);
    if (!poDate) return false;
    
    return poDate >= startDate && poDate <= endDate;
  });
};
