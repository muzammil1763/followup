export type Country = string;

export type DeliveryStatus = 'IN_PROCESSING' | 'DELIVERED' | 'RTO';
export type PaymentStatus = 'PAID' | 'UNPAID';

export interface ShipmentRecord {
  id: string;           // refNumber used as display id
  refNumber: string;
  awbNumber: string;
  courier: string;
  country: string;
  customerName: string;
  phone: string;
  city: string;
  areaName: string;
  address: string;
  productName: string;
  sku: string;
  codAmount: number;
  saleAgent: string;
  team: string;
  status: DeliveryStatus;
  paymentStatus: PaymentStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  country: string;
  city: string;
  search: string;
  status: DeliveryStatus | '';
  paymentStatus: PaymentStatus | '';
}
