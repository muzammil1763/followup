import * as XLSX from 'xlsx';

// Template 1: Main shipment data upload (headers only)
export function downloadShipmentTemplate() {
  const headers = [
    'REF #',
    'AWB #',
    'COURIER',
    'Country',
    'Customer Name',
    'Phone Number',
    'CITY',
    'Area Name',
    'ADDRESS',
    'Product Name',
    'SKU',
    'COD',
    'Sale Agent',
    'TEAM',
  ];

  // Create worksheet with only headers
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shipment Data');
  XLSX.writeFile(wb, 'Shipment_Upload_Template.xlsx');
}

// Template 2: Status update (headers only)
export function downloadStatusTemplate() {
  const headers = ['AWB #', 'STATUS'];

  // Create worksheet with only headers
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Status Update');
  XLSX.writeFile(wb, 'Status_Update_Template.xlsx');
}

// Template 3: Payment update (headers only)
export function downloadPaymentTemplate() {
  const headers = ['AWB #', 'COD RECEIVED'];

  // Create worksheet with only headers
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payment Update');
  XLSX.writeFile(wb, 'Payment_Update_Template.xlsx');
}
