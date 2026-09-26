export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: ProductCategory;
  unitOfMeasure: string;
  costPerUnit: number;
  reorderPoint: number;
  reorderQuantity: number;
  onHand?: number;
  freeToUse?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductStockBreakdown {
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  onHand: number;
  reserved: number;
  freeToUse: number;
}

export interface ReorderingRule {
  id: string;
  productId: string;
  warehouseId: string;
  warehouseName?: string;
  locationId: string;
  locationName?: string;
  minQuantity: number;
  maxQuantity: number;
  createdAt?: string;
  updatedAt?: string;
}
