import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Location } from '@/types/warehouse';

export function useLocations(warehouseId?: string) {
  return useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: async () => {
      const endpoint = warehouseId ? `/locations?warehouseId=${warehouseId}` : '/locations';
      const res = await apiClient<Location[]>(endpoint);
      return res.data;
    },
    enabled: warehouseId === undefined || Boolean(warehouseId),
  });
}
