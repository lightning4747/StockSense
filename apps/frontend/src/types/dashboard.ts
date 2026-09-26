export interface DashboardKpis {
  totalProductsInStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
}

export interface DashboardOperations {
  receipts: {
    toReceive: number;
    late: number;
    operations: number;
  };
  deliveries: {
    toDeliver: number;
    late: number;
    waiting: number;
    operations: number;
  };
}

export interface StockMovementTrendItem {
  date: string;
  inQty: number;
  outQty: number;
}
