import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  Plus,
  Trash2,
  User,
  Boxes,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { createReceiptSchema, CreateReceiptFormValues } from '@/schemas/receipt';
import { Warehouse, WarehouseLocation } from '@/types/warehouse';
import { Product } from '@/types/product';

export const ReceiptCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');

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

  // Fetch Products for line item dropdown
  const { data: productsResponse } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      return await apiClient<Product[]>('/products?limit=100');
    },
  });

  const products = productsResponse?.data || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateReceiptFormValues>({
    resolver: zodResolver(createReceiptSchema),
    defaultValues: {
      warehouseId: '',
      destinationLocationId: '',
      supplierName: '',
      scheduledAt: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateReceiptFormValues) => {
      return await apiClient('/receipts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      const newId = res.data?.id;
      if (newId) {
        navigate(`/operations/receipts/${newId}`);
      } else {
        navigate('/operations/receipts');
      }
    },
    onError: (err: ApiError) => {
      setErrorMessage(err.message || 'Failed to create receipt.');
    },
  });

  const onSubmit = (data: CreateReceiptFormValues) => {
    setErrorMessage(null);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/operations/receipts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Receipts</span>
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <ArrowDownLeft className="h-4 w-4" />
          <span>Incoming Inventory</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Draft Receipt</h1>
        <p className="text-sm text-muted-foreground">
          Record expected vendor shipment, select destination storage rack, and specify incoming items.
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

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Destination & Vendor</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warehouse Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Warehouse <span className="text-destructive">*</span>
              </label>
              <select
                {...register('warehouseId')}
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setValue('warehouseId', e.target.value);
                  setValue('destinationLocationId', '');
                }}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.warehouseId ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.shortCode})
                  </option>
                ))}
              </select>
              {errors.warehouseId && (
                <p className="text-[11px] text-destructive">{errors.warehouseId.message}</p>
              )}
            </div>

            {/* Destination Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Destination Rack / Location <span className="text-destructive">*</span>
              </label>
              <select
                {...register('destinationLocationId')}
                disabled={!selectedWarehouseId}
                className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                  errors.destinationLocationId ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">
                  {selectedWarehouseId ? 'Select Location' : 'Select Warehouse first'}
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.shortCode})
                  </option>
                ))}
              </select>
              {errors.destinationLocationId && (
                <p className="text-[11px] text-destructive">{errors.destinationLocationId.message}</p>
              )}
            </div>

            {/* Supplier / Vendor Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Supplier / Vendor Contact <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g. Azure Interior Supply Co."
                  {...register('supplierName')}
                  className={`h-10 w-full rounded-xl border bg-muted/20 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                    errors.supplierName ? 'border-destructive' : 'border-input'
                  }`}
                />
              </div>
              {errors.supplierName && (
                <p className="text-[11px] text-destructive">{errors.supplierName.message}</p>
              )}
            </div>

            {/* Scheduled Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Scheduled Arrival Date <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  {...register('scheduledAt')}
                  className={`h-10 w-full rounded-xl border bg-muted/20 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                    errors.scheduledAt ? 'border-destructive' : 'border-input'
                  }`}
                />
              </div>
              {errors.scheduledAt && (
                <p className="text-[11px] text-destructive">{errors.scheduledAt.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Boxes className="h-4 w-4 text-emerald-500" />
                <span>Line Items (Products & Expected Quantities)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add the catalog products and target quantities to receive upon validation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1 })}
              className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {errors.items?.root && (
            <p className="text-xs text-destructive">{errors.items.root.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-3 items-start rounded-xl border border-border/70 bg-muted/20 p-3"
              >
                {/* Product Dropdown */}
                <div className="col-span-8 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Product</label>
                  <select
                    {...register(`items.${index}.productId` as const)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} ({p.unitOfMeasure})
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId && (
                    <p className="text-[10px] text-destructive">
                      {errors.items[index]?.productId?.message}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...register(`items.${index}.quantity` as const)}
                    className="h-9 w-full rounded-lg border border-input bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-[10px] text-destructive">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                {/* Remove Line */}
                <div className="col-span-1 pt-6 text-right">
                  <button
                    type="button"
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/operations/receipts"
            className="rounded-xl border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating Receipt...' : 'Save Draft Receipt'}
          </button>
        </div>
      </form>
    </div>
  );
};
