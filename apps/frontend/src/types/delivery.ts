export type DeliveryStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface DeliveryItem {
  id?: string;
  productId: string;
  sku?: string;
  productName?: string;
  requestedQuantity: number;
  availableQuantity?: number;
}

export interface Delivery {
  id: string;
  reference: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  sourceLocationId: string;
  sourceLocationName?: string;
  sourceLocationShortCode?: string;
  deliveryAddress?: string;
  scheduledAt?: string;
  responsibleUserId?: string;
  status: DeliveryStatus;
  items?: DeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryPayload {
  warehouseId: string;
  sourceLocationId: string;
  deliveryAddress?: string;
  scheduledAt?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateDeliveryPayload {
  sourceLocationId?: string;
  deliveryAddress?: string;
  scheduledAt?: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
}
