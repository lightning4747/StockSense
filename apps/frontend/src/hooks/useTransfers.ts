import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Transfer, CreateTransferPayload, UpdateTransferPayload } from '@/types/transfer';

export interface TransferQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  warehouseId?: string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useTransfers(params: TransferQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.search) queryParams.set('search', params.search);
  if (params.status && params.status !== 'all') queryParams.set('status', params.status);
  if (params.warehouseId) queryParams.set('warehouseId', params.warehouseId);
  if (params.sourceLocationId) queryParams.set('sourceLocationId', params.sourceLocationId);
  if (params.destinationLocationId) queryParams.set('destinationLocationId', params.destinationLocationId);
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) queryParams.set('dateTo', params.dateTo);

  const qs = queryParams.toString();
  const endpoint = qs ? `/transfers?${qs}` : '/transfers';

  return useQuery({
    queryKey: ['transfers', params],
    queryFn: async () => {
      return await apiClient<Transfer[]>(endpoint);
    },
  });
}

export function useTransfer(transferId?: string) {
  return useQuery({
    queryKey: ['transfer', transferId],
    queryFn: async () => {
      const res = await apiClient<Transfer>(`/transfers/${transferId}`);
      return res.data;
    },
    enabled: Boolean(transferId),
  });
}

export function useTransferMutations(transferId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    if (transferId) {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
    }
  };

  const createTransfer = useMutation({
    mutationFn: async (payload: CreateTransferPayload) => {
      const res = await apiClient<{ id: string; reference: string; status: string }>('/transfers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const updateTransfer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTransferPayload }) => {
      const res = await apiClient<Transfer>(`/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const readyTransfer = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Transfer>(`/transfers/${id}/ready`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const validateTransfer = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Transfer>(`/transfers/${id}/validate`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  const cancelTransfer = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient<Transfer>(`/transfers/${id}/cancel`, {
        method: 'POST',
      });
      return res.data;
    },
    onSuccess: invalidate,
  });

  return {
    createTransfer,
    updateTransfer,
    readyTransfer,
    validateTransfer,
    cancelTransfer,
  };
}
