import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  Save,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { createTransferSchema, CreateTransferFormValues } from '@/schemas/transfer';
import { Warehouse, Location } from '@/types/warehouse';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { useTransferMutations } from '@/hooks/useTransfers';

export const TransferCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransferFormValues>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      warehouseId: '',
      sourceLocationId: '',
      destinationLocationId: '',
      scheduledAt: new Date().toISOString().slice(0, 10),
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedWarehouseId = watch('warehouseId');
  const sourceLocationId = watch('sourceLocationId');

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
    enabled: Boolean(selectedWarehouseId),
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient<Product[]>('/products?limit=100');
      return res.data;
    },
  });

  const { createTransfer } = useTransferMutations();

  const onSubmit = async (values: CreateTransferFormValues) => {
    setFormError(null);
    try {
      const payload = {
        warehouseId: values.warehouseId,
        sourceLocationId: values.sourceLocationId,
        destinationLocationId: values.destinationLocationId,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        items: values.items.map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        })),
      };

      const result = await createTransfer.mutateAsync(payload);
      navigate(`/operations/transfers/${result.id}`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create internal transfer');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/operations/transfers">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to Transfers
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            New Internal Transfer
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule an internal stock relocation between two locations within a warehouse
          </p>
        </div>
      </div>

      {formError && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
          <h2 className="text-base font-semibold text-foreground border-b pb-3">
            Transfer Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Warehouse */}
            <div className="md:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Warehouse *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  {...register('warehouseId')}
                  onChange={(e) => {
                    setValue('warehouseId', e.target.value);
                    setValue('sourceLocationId', '');
                    setValue('destinationLocationId', '');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Select warehouse</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.shortCode})
                    </option>
                  ))}
                </select>
              </div>
              {errors.warehouseId && (
                <p className="text-xs text-destructive mt-1">{errors.warehouseId.message}</p>
              )}
            </div>

            {/* Source Location */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Source Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  {...register('sourceLocationId')}
                  disabled={!selectedWarehouseId}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {selectedWarehouseId ? 'Select source location' : 'Choose a warehouse first'}
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.shortCode})
                    </option>
                  ))}
                </select>
              </div>
              {errors.sourceLocationId && (
                <p className="text-xs text-destructive mt-1">{errors.sourceLocationId.message}</p>
              )}
            </div>

            {/* Destination Location */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Destination Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600 pointer-events-none" />
                <select
                  {...register('destinationLocationId')}
                  disabled={!selectedWarehouseId}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {selectedWarehouseId ? 'Select destination location' : 'Choose a warehouse first'}
                  </option>
                  {locations
                    .filter((loc) => loc.id !== sourceLocationId)
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.shortCode})
                      </option>
                    ))}
                </select>
              </div>
              {errors.destinationLocationId && (
                <p className="text-xs text-destructive mt-1">{errors.destinationLocationId.message}</p>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Scheduled Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  {...register('scheduledAt')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {errors.scheduledAt && (
                <p className="text-xs text-destructive mt-1">{errors.scheduledAt.message}</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Items to Transfer *</h3>
                <p className="text-xs text-muted-foreground">Select products and quantities to move</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1 })}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <div className="flex-1">
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Product
                    </label>
                    <select
                      {...register(`items.${index}.productId` as const)}
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select a product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - UoM: {p.unitOfMeasure}
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.productId && (
                      <p className="text-[11px] text-destructive mt-0.5">
                        {errors.items[index]?.productId?.message}
                      </p>
                    )}
                  </div>

                  <div className="w-32">
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-[11px] text-destructive mt-0.5">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                      className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {errors.items?.root && (
              <p className="text-xs text-destructive">{errors.items.root.message}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/operations/transfers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createTransfer.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {createTransfer.isPending ? 'Creating Transfer...' : 'Create Draft Transfer'}
          </Button>
        </div>
      </form>
    </div>
  );
};
