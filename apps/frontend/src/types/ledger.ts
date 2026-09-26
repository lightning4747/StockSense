export type MovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface LedgerProduct {
  id: string;
  sku: string;
  name: string;
}

export interface InventoryMove {
  id: string;
  reference: string;
  movementType: MovementType;
  product: LedgerProduct;
  fromLocationId?: string | null;
  fromLocation?: {
    id: string;
    name: string;
  } | null;
  toLocationId?: string | null;
  toLocation?: {
    id: string;
    name: string;
  } | null;
  quantity: number;
  contact?: string | null;
  sourceDocumentId?: string | null;
  sourceDocumentType?: string | null;
  performedBy?: string | null;
  performedAt: string;
  createdAt: string;
}

export interface MoveQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  reference?: string;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  movementType?: MovementType | '';
  dateFrom?: string;
  dateTo?: string;
}
