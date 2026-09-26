import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  AlertTriangle,
  Building2,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { createProductSchema, CreateProductFormValues } from '@/schemas/product';
import { Category } from '@/types/category';
import { Warehouse, WarehouseLocation } from '@/types/warehouse';

export const ProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient<Category[]>('/categories');
      return res.data;
    },
  });

  // Fetch Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch Locations for selected warehouse
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiClient<WarehouseLocation[]>(`/locations?warehouseId=${selectedWarehouseId}`);
      return res.data;
    },
    enabled: !!selectedWarehouseId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      unitOfMeasure: 'unit',
      costPerUnit: 0,
      reorderPoint: 10,
      reorderQuantity: 25,
      initialStock: 0,
      initialLocationId: '',
    },
  });

  const initialStockValue = watch('initialStock');

  const createMutation = useMutation({
    mutationFn: async (data: CreateProductFormValues) => {
      return await apiClient('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const newId = res.data?.id;
      if (newId) {
        navigate(`/products/${newId}`);
      } else {
        navigate('/products');
      }
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to create product.');
    },
  });

  const onSubmit = (data: CreateProductFormValues) => {
    setErrorMessage(null);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Products</span>
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
          <Package className="h-4 w-4" />
          <span>Product Management</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Product</h1>
        <p className="text-sm text-muted-foreground">
          Define SKU identity, category group, unit of measure, and optional opening stock.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-medium text-destructive"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Create Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <Package className="h-4 w-4 text-primary" />
            <span>General Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Product Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ergonomic Standing Desk 140x70"
                {...register('name')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.name ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>SKU (Unique Barcode / Code) <span className="text-destructive">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">e.g. DESK-001</span>
              </label>
              <input
                type="text"
                placeholder="DESK-001"
                {...register('sku')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.sku ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.sku && <p className="text-[11px] text-destructive">{errors.sku.message}</p>}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Category <span className="text-destructive">*</span>
              </label>
              <select
                {...register('categoryId')}
                disabled={isLoadingCategories}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.categoryId ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Select a Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-[11px] text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Unit of Measure */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Unit of Measure (UoM) <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="unit, kg, m, box, liter..."
                {...register('unitOfMeasure')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.unitOfMeasure ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.unitOfMeasure && (
                <p className="text-[11px] text-destructive">{errors.unitOfMeasure.message}</p>
              )}
            </div>

            {/* Cost Per Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Cost Per Unit ($) <span className="text-destructive">*</span></span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register('costPerUnit')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.costPerUnit ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.costPerUnit && (
                <p className="text-[11px] text-destructive">{errors.costPerUnit.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Control & Reordering Thresholds */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <Boxes className="h-4 w-4 text-amber-500" />
            <span>Reordering Policy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reorder Point */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Reorder Point (Min Alert Level)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Triggers low-stock warnings</span>
              </label>
              <input
                type="number"
                min="0"
                {...register('reorderPoint')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.reorderPoint ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.reorderPoint && (
                <p className="text-[11px] text-destructive">{errors.reorderPoint.message}</p>
              )}
            </div>

            {/* Reorder Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Default Reorder Quantity</span>
                <span className="text-[10px] text-muted-foreground font-normal">Recommended order lot</span>
              </label>
              <input
                type="number"
                min="1"
                {...register('reorderQuantity')}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.reorderQuantity ? 'border-destructive' : 'border-input'
                }`}
              />
              {errors.reorderQuantity && (
                <p className="text-[11px] text-destructive">{errors.reorderQuantity.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Optional Initial Stock Opening */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span>Initial Opening Stock (Optional)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              If recording existing on-hand stock immediately, pick the target warehouse & rack location.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opening Stock Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Initial Quantity</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                {...register('initialStock')}
                className="h-10 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
            </div>

            {/* Target Warehouse Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Warehouse</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setValue('initialLocationId', '');
                }}
                className="h-10 w-full rounded-xl border border-input bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.shortCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Location Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Location {Number(initialStockValue) > 0 && <span className="text-destructive">*</span>}
              </label>
              <select
                {...register('initialLocationId')}
                disabled={!selectedWarehouseId}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.initialLocationId ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">
                  {selectedWarehouseId ? 'Select Location / Rack' : 'Select Warehouse first'}
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </select>
              {errors.initialLocationId && (
                <p className="text-[11px] text-destructive">{errors.initialLocationId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/products"
            className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating Product...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
