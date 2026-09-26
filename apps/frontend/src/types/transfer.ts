export type TransferStatus = 'DRAFT' | 'READY' | 'DONE' | 'CANCELED';

export interface TransferItem {
  id?: string;
  productId: string;
  sku?: string;
  productName?: string;
  quantity: number;
}

export interface Transfer {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  sourceLocationId: string;
  sourceLocationName?: string;
  sourceLocationShortCode?: string;
  destinationLocationId: string;
  destinationLocationName?: string;
  destinationLocationShortCode?: string;
  scheduledAt?: string;
  responsibleUserId?: string;
  status: TransferStatus;
  items?: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferPayload {
  warehouseId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  scheduledAt?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateTransferPayload {
  sourceLocationId?: string;
  destinationLocationId?: string;
  scheduledAt?: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
}
