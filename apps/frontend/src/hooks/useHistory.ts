import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { InventoryMove, MoveQueryParams } from '@/types/ledger';

export function useHistory(params: MoveQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.reference) queryParams.set('reference', params.reference);
  if (params.productId) queryParams.set('productId', params.productId);
  if (params.warehouseId) queryParams.set('warehouseId', params.warehouseId);
  if (params.locationId) queryParams.set('locationId', params.locationId);
  if (params.movementType) queryParams.set('movementType', params.movementType);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);

  const qs = queryParams.toString();
  const endpoint = qs ? `/inventory/moves?${qs}` : '/inventory/moves';

  return useQuery({
    queryKey: ['inventory-moves', params],
    queryFn: async () => {
      return await apiClient<InventoryMove[]>(endpoint);
    },
  });
}

export function useMove(moveId?: string) {
  return useQuery({
    queryKey: ['inventory-move', moveId],
    queryFn: async () => {
      const res = await apiClient<InventoryMove>(`/inventory/moves/${moveId}`);
      return res.data;
    },
    enabled: Boolean(moveId),
  });
}
