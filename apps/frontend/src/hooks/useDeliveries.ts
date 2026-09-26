import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Delivery, CreateDeliveryPayload, UpdateDeliveryPayload } from '@/types/delivery';

export interface DeliveryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  warehouseId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useDeliveries(params: DeliveryQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params.warehouseId) queryParams.set('warehouseId', params.warehouseId);
  if (params.locationId) queryParams.set('locationId', params.locationId);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);

  const qs = queryParams.toString();
  const endpoint = qs ? `/deliveries?${qs}` : '/deliveries';

  return useQuery({
    queryKey: ['deliveries', params],
    queryFn: async () => {
      return await apiClient<Delivery[]>(endpoint);
    },
  });
}

export function useDelivery(deliveryId?: string) {
  return useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const res = await apiClient<Delivery>(`/deliveries/${deliveryId}`);
      return res.data;
    },
    enabled: Boolean(deliveryId),
  });
}

export function useDeliveryMutations(deliveryId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    if (deliveryId) {
      queryClient.invalidateQueries({ queryKey: ['delivery', deliveryId] });
    }
  };

  const createDelivery = useMutation({
    mutationFn: async (payload: CreateDeliveryPayload) => {
      const res = await apiClient<{ id: string; reference: string; status: string }>('/deliveries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const updateDelivery = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDeliveryPayload }) => {
      const res = await apiClient<Delivery>(`/deliveries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const confirmDelivery = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Delivery>(`/deliveries/${id}/confirm`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const readyDelivery = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Delivery>(`/deliveries/${id}/ready`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const validateDelivery = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Delivery>(`/deliveries/${id}/validate`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const cancelDelivery = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Delivery>(`/deliveries/${id}/cancel`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  return {
    createDelivery,
    updateDelivery,
    confirmDelivery,
    readyDelivery,
    validateDelivery,
    cancelDelivery,
  };
}
