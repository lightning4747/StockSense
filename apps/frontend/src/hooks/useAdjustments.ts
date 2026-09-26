import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { StockAdjustmentPayload, StockAdjustmentResult } from '@/types/adjustment';

export function useAdjustments() {
  const queryClient = useQueryClient();

  const createAdjustment = useMutation({
    mutationFn: async (payload: StockAdjustmentPayload) => {
      const res = await apiClient<StockAdjustmentResult>('/stock/adjustments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-moves'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { createAdjustment };
}
