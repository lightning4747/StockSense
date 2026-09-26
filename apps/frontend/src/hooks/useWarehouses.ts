import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Warehouse } from '@/types/warehouse';

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });
}
