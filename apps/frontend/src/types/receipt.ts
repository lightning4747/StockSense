export type ReceiptStatus = 'DRAFT' | 'READY' | 'DONE' | 'CANCELED';

export interface ReceiptItem {
  id: string;
  productId: string;
  sku?: string;
  productName?: string;
  quantity: number;
}

export interface Receipt {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  destinationLocationId: string;
  destinationLocationName?: string;
  destinationLocationShortCode?: string;
  supplierName: string;
  scheduledAt: string;
  responsibleUserId?: string;
  responsible?: {
    id: string;
    loginId: string;
  };
  status: ReceiptStatus;
  items: ReceiptItem[];
  from?: string;
  to?: string;
  contact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptPayload {
  warehouseId: string;
  destinationLocationId: string;
  supplierName: string;
  scheduledAt: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateReceiptPayload {
  destinationLocationId?: string;
  supplierName?: string;
  scheduledAt?: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
}
