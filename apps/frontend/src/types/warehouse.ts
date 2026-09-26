export interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address?: string;
  locationCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehousePayload {
  name: string;
  shortCode: string;
  address?: string;
}

export interface UpdateWarehousePayload {
  name?: string;
  shortCode?: string;
  address?: string;
}

export interface Location {
  id: string;
  name: string;
  shortCode: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseShortCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WarehouseLocation = Location;

export interface CreateLocationPayload {
  name: string;
  shortCode: string;
  warehouseId: string;
}

export interface UpdateLocationPayload {
  name?: string;
  shortCode?: string;
}
