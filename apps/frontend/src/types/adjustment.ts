export interface StockAdjustmentPayload {
  productId: string;
  locationId: string;
  countedQuantity: number;
  reason: string;
}

export interface StockAdjustmentResult {
  adjustmentId: string;
  previousQuantity: number;
  countedQuantity: number;
  difference: number;
}
