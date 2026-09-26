import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  ArrowLeft,
  Building2,
  MapPin,
  Package,
  AlertCircle,
  Save,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { createAdjustmentSchema, CreateAdjustmentFormValues } from '@/schemas/adjustment';
import { Warehouse, Location } from '@/types/warehouse';
import { Product } from '@/types/product';
import { StockItem } from '@/types/stock';
import { Button } from '@/components/ui/button';
import { useAdjustments } from '@/hooks/useAdjustments';

export const AdjustmentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAdjustmentFormValues>({
    resolver: zodResolver(createAdjustmentSchema),
    defaultValues: {
      productId: '',
      locationId: '',
      countedQuantity: 0,
      reason: '',
    },
  });

  const selectedProductId = watch('productId');
  const selectedLocationId = watch('locationId');
  const countedQuantity = watch('countedQuantity');

  // Fetch warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      const endpoint = selectedWarehouseId ? `/locations?warehouseId=${selectedWarehouseId}` : '/locations';
      const res = await apiClient<Location[]>(endpoint);
      return res.data;
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient<Product[]>('/products?limit=100');
      return res.data;
    },
  });

  // Fetch current on hand for selected product and location
  const { data: currentStockResponse, isLoading: isLoadingStock } = useQuery({
    queryKey: ['stock', selectedProductId, selectedLocationId],
    queryFn: async () => {
      if (!selectedProductId || !selectedLocationId) return null;
      const res = await apiClient<StockItem[]>(
        `/stock?productId=${selectedProductId}&locationId=${selectedLocationId}`
      );
      return res.data?.[0] || null;
    },
    enabled: Boolean(selectedProductId && selectedLocationId),
  });

  const currentOnHand = currentStockResponse?.onHand ?? 0;
  const difference = Number(countedQuantity || 0) - currentOnHand;

  const { createAdjustment } = useAdjustments();

  const onSubmit = async (values: CreateAdjustmentFormValues) => {
    setFormError(null);
    try {
      await createAdjustment.mutateAsync({
        productId: values.productId,
        locationId: values.locationId,
        countedQuantity: Number(values.countedQuantity),
        reason: values.reason,
      });
      navigate('/operations/adjustments');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit stock adjustment');
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/operations/adjustments">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Adjustments
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            New Inventory Adjustment
          </h1>
          <p className="text-sm text-muted-foreground">
            Count physical inventory and calculate adjustment difference
          </p>
        </div>
      </div>

      {formError && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-foreground border-b pb-3">
            Physical Count Reconciliation
          </h2>

          {/* Product Picker */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Select Product *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                {...register('productId')}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
              >
                <option value="">Choose a product to adjust</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - UoM: {p.unitOfMeasure}
                  </option>
                ))}
              </select>
            </div>
            {errors.productId && (
              <p className="text-xs text-destructive mt-1">{errors.productId.message}</p>
            )}
          </div>

          {/* Warehouse Filter (optional helper for locations) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Warehouse (Optional Filter)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => {
                    setSelectedWarehouseId(e.target.value);
                    setValue('locationId', '');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.shortCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Picker */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Storage Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  {...register('locationId')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Select location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.shortCode})
                    </option>
                  ))}
                </select>
              </div>
              {errors.locationId && (
                <p className="text-xs text-destructive mt-1">{errors.locationId.message}</p>
              )}
            </div>
          </div>

          {/* On Hand vs Counted Quantity Display Box */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quantity Comparison & Calculated Variance
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Current On Hand */}
              <div className="bg-background rounded-md p-3 border">
                <div className="text-xs text-muted-foreground">Current On Hand</div>
                <div className="text-xl font-bold text-foreground mt-1">
                  {isLoadingStock ? '...' : currentOnHand.toLocaleString()}
                </div>
                {selectedProduct && (
                  <div className="text-[10px] text-muted-foreground">{selectedProduct.unitOfMeasure}</div>
                )}
              </div>

              {/* Counted Quantity Input */}
              <div className="bg-background rounded-md p-3 border ring-2 ring-primary/20">
                <label className="text-xs font-semibold text-primary block">Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  {...register('countedQuantity', { valueAsNumber: true })}
                  className="w-full text-center text-xl font-bold text-foreground mt-1 bg-transparent focus:outline-none"
                />
                {selectedProduct && (
                  <div className="text-[10px] text-muted-foreground">{selectedProduct.unitOfMeasure}</div>
                )}
              </div>

              {/* Calculated Difference */}
              <div className="bg-background rounded-md p-3 border">
                <div className="text-xs text-muted-foreground">Calculated Variance</div>
                <div
                  className={`text-xl font-bold mt-1 flex items-center justify-center gap-1 ${
                    difference > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : difference < 0
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {difference > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4" />
                      +{difference}
                    </>
                  ) : difference < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4" />
                      {difference}
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4" />0
                    </>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {difference > 0
                    ? 'Inventory Surplus'
                    : difference < 0
                    ? 'Inventory Shortage'
                    : 'Exact Match'}
                </div>
              </div>
            </div>

            {errors.countedQuantity && (
              <p className="text-xs text-destructive text-center">{errors.countedQuantity.message}</p>
            )}
          </div>

          {/* Reason Field */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
              Reason / Memo *
            </label>
            <input
              type="text"
              placeholder="e.g. Annual physical cycle count, Damaged in transit, Supplier packaging discrepancy"
              {...register('reason')}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.reason && (
              <p className="text-xs text-destructive mt-1">{errors.reason.message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/operations/adjustments">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createAdjustment.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {createAdjustment.isPending ? 'Adjusting Stock...' : 'Save Stock Adjustment'}
          </Button>
        </div>
      </form>
    </div>
  );
};
