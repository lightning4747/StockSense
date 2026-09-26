export interface StockItem {
  productId: string;
  sku: string;
  product: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  locationId: string;
  locationName?: string;
  locationShortCode?: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
  costPerUnit?: number | string | null;
  unitCost?: number | string | null;
}

export interface StockProductLocation {
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  locationId: string;
  locationName?: string;
  locationShortCode?: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

export interface StockProductDetail {
  productId: string;
  totalOnHand: number;
  totalReserved: number;
  totalFreeToUse: number;
  locations: StockProductLocation[];
}

export type StockStatusFilter = 'all' | 'available' | 'low' | 'out';

export interface StockQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  warehouseId?: string;
  locationId?: string;
  categoryId?: string;
  productId?: string;
  stockStatus?: StockStatusFilter;
}
