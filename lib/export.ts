import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ShipmentRecord } from './types';

const columns = [
  { key: 'refNumber', label: 'REF #' },
  { key: 'awbNumber', label: 'AWB #' },
  { key: 'courier', label: 'COURIER' },
  { key: 'country', label: 'Country' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'city', label: 'CITY' },
  { key: 'areaName', label: 'Area Name' },
  { key: 'address', label: 'ADDRESS' },
  { key: 'productName', label: 'Product Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'codAmount', label: 'COD' },
  { key: 'saleAgent', label: 'Sale Agent' },
  { key: 'team', label: 'TEAM' },
  { key: 'status', label: 'Status' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'createdAt', label: 'Created At' },
] as const;

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function exportToExcel(records: ShipmentRecord[], filename = 'records') {
  const data = records.map((r) => {
    const row: Record<string, string | number> = {};
    columns.forEach((col) => {
      const val = r[col.key as keyof ShipmentRecord];
      if (col.key === 'createdAt') {
        row[col.label] = formatDateTime(val as string);
      } else {
        row[col.label] = (val ?? '') as string | number;
      }
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Records');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportToZip(records: ShipmentRecord[], filename = 'records') {
  const zip = new JSZip();
  const folder = zip.folder(filename);

  records.forEach((record) => {
    const content = columns
      .map((col) => {
        const val = record[col.key as keyof ShipmentRecord];
        if (col.key === 'createdAt') return `${col.label}: ${formatDateTime(val as string)}`;
        return `${col.label}: ${val ?? ''}`;
      })
      .join('\n');
    folder?.file(`${record.refNumber}.txt`, content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${filename}.zip`);
}
