// GNR Utility Functions

/**
 * Generate GNR number based on PO number
 * @param {string} poNumber - PO Number
 * @returns {string} GNR number (e.g., GNR-001, GNR-002, etc.)
 */
export const generateGNRNumber = (poNumber) => {
  try {
    // Extract number from PO number (e.g., PO-2024-001 -> 001)
    const match = poNumber.match(/(\d+)$/);
    if (match) {
      const number = match[1];
      return `GNR-${number.padStart(3, '0')}`;
    }
    // Fallback to timestamp-based number
    return `GNR-${Date.now().toString().slice(-6)}`;
  } catch (error) {
    console.error('Error generating GNR number:', error);
    return `GNR-${Date.now().toString().slice(-6)}`;
  }
};

/**
 * Generate GNR details from PO data
 * @param {Object} poData - PO data object
 * @returns {Object} GNR object with auto-generated details
 */
export const generateGNRFromPO = (poData) => {
  const gnrNumber = generateGNRNumber(poData.poNumber);
  
  return {
    gnrNumber,
    poNumber: poData.poNumber,
    supplierName: poData.supplierName,
    material: poData.material,
    quantity: poData.quantity || 'N/A',
    unit: poData.unit || 'pieces',
    receivedDate: new Date().toISOString().split('T')[0],
    receivedBy: 'System Generated',
    condition: 'Good',
    status: 'Active',
    storageLocation: 'Main Warehouse',
    vehicleNumber: `VEH-${poData.poNumber.split('-').pop()}`,
    driverName: 'Auto Assigned',
    driverPhone: 'N/A',
    remarks: `Auto-generated GNR for PO ${poData.poNumber}`,
    createdAt: new Date().toISOString(),
    createdBy: 'system',
    createdByName: 'System'
  };
};
