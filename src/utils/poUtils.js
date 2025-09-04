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


/**
 * Open a printable window for a PO in the provided template style.
 * The generated HTML is self-contained with basic styling mirroring the sample.
 * @param {object} po - Purchase order record
 */
export const printPurchaseOrder = (po) => {
  if (!po) return;
  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch (_) {
      return d || '';
    }
  };

  const subtotal = Number(po.quantity || 0) * Number(po.ratePerQuantity || 0);
  const taxAmount = po.taxAmount !== undefined && po.taxAmount !== ''
    ? Number(po.taxAmount)
    : (Number(po.gst || 0) / 100) * subtotal;
  const total = subtotal + taxAmount;

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Purchase Order ${po.poNumber || ''}</title>
      <style>
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; }
        .sheet { border: 4px solid #e31c1c; padding: 16px; }
        .header { text-align: center; margin-bottom: 12px; }
        .title { color: #e31c1c; font-size: 28px; font-weight: 800; letter-spacing: 1px; }
        .meta { float: right; text-align: right; font-size: 14px; }
        .row { display: flex; gap: 16px; margin: 8px 0; }
        .col { flex: 1; }
        .section-title { background: #e31c1c; color: #fff; padding: 6px 8px; font-weight: 700; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 2px solid #e31c1c; padding: 6px 8px; font-size: 14px; }
        th { background: #fff; color: #000; font-weight: 700; }
        .totals { width: 40%; margin-left: auto; }
        .totals td { border: none; }
        .totals .label { text-align: right; padding-right: 8px; }
        .totals .amount { text-align: right; min-width: 100px; }
        .footer-note { text-align: center; margin-top: 24px; font-size: 12px; }
        @media print {
          body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { border-width: 3px; border-color: #e31c1c; }
          .section-title { background: #e31c1c !important; color: #fff !important; }
          th, td { border-color: #e31c1c !important; }
          .title { color: #e31c1c !important; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="meta">
            <div>Date: ${formatDate(po.orderDate)}</div>
            <div>PO #: ${po.poNumber || ''}</div>
          </div>
          <div class="title">PURCHASE ORDER</div>
        </div>

        <div class="row">
          <div class="col">
            <div class="section-title">VENDOR</div>
            <div>${po.supplierName || ''}</div>
          </div>
          <div class="col">
            <div class="section-title">SHIP TO</div>
            <div>${po.shipToName || ''}</div>
          </div>
        </div>

        <div class="section-title">ITEMS</div>
        <table>
          <thead>
            <tr>
              <th style="width:20%">ITEM #</th>
              <th style="width:40%">DESCRIPTION</th>
              <th style="width:10%">QTY</th>
              <th style="width:15%">UNIT PRICE</th>
              <th style="width:15%">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${po.hsnSacCode || ''}</td>
              <td>${po.material || ''}</td>
              <td style="text-align:right">${po.quantity || ''}</td>
              <td style="text-align:right">${Number(po.ratePerQuantity || 0).toFixed(2)}</td>
              <td style="text-align:right">${subtotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table class="totals">
          <tbody>
            <tr>
              <td class="label">SUBTOTAL</td>
              <td class="amount">${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">TAX (${Number(po.gst || 0)}%)</td>
              <td class="amount">${taxAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label" style="font-weight:700">TOTAL</td>
              <td class="amount" style="font-weight:700">${total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">Comments or Special Instructions</div>
        <div>${po.remark || ''}</div>

        <div class="footer-note">If you have any questions about this purchase order, please contact your purchasing team.</div>
      </div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
    </body>
  </html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

