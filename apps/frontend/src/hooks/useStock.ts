import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StockItem, StockQueryParams, StockProductDetail } from '@/types/stock';

export function useStock(params: StockQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.warehouseId) queryParams.set('warehouseId', params.warehouseId);
  if (params.locationId) queryParams.set('locationId', params.locationId);
  if (params.categoryId) queryParams.set('categoryId', params.categoryId);
  if (params.productId) queryParams.set('productId', params.productId);
  if (params.stockStatus && params.stockStatus !== 'all') queryParams.set('stockStatus', params.stockStatus);

  const qs = queryParams.toString();
  const endpoint = qs ? `/stock?${qs}` : '/stock';

  return useQuery({
    queryKey: ['stock', params],
    queryFn: async () => {
      return await apiClient<StockItem[]>(endpoint);
    },
  });
}

export function useProductStock(productId?: string) {
  return useQuery({
    queryKey: ['stock', 'product', productId],
    queryFn: async () => {
      const res = await apiClient<StockProductDetail>(`/stock/${productId}`);
      return res.data;
    },
    enabled: Boolean(productId),
  });
}
