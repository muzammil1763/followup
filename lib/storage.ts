import { ShipmentRecord, DeliveryStatus, PaymentStatus } from './types';

export async function getRecords(): Promise<ShipmentRecord[]> {
  const res = await fetch('/api/records');
  if (!res.ok) return [];
  return res.json();
}

export async function deleteRecord(refNumber: string): Promise<void> {
  await fetch(`/api/records/${refNumber}`, { method: 'DELETE' });
}

export async function deleteAllRecords(): Promise<void> {
  await fetch('/api/records', { method: 'DELETE' });
}

export async function updateRecordStatus(
  refNumber: string,
  status: DeliveryStatus,
  paymentStatus?: PaymentStatus | null
): Promise<void> {
  await fetch(`/api/records/${refNumber}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, paymentStatus }),
  });
}

export async function updatePaymentStatus(
  refNumber: string,
  paymentStatus: PaymentStatus
): Promise<void> {
  await fetch('/api/records/assign-awb', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refNumber, paymentStatus }),
  });
}
