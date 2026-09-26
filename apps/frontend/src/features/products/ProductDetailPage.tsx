import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Edit,
  Save,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Building2,
  DollarSign,
  Layers,
  Sliders,
  Info,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import {
  updateProductSchema,
  UpdateProductFormValues,
  reorderingRuleSchema,
  ReorderingRuleFormValues,
} from '@/schemas/product';
import { Product, ProductStockBreakdown, ReorderingRule } from '@/types/product';
import { Category } from '@/types/category';
import { Warehouse, WarehouseLocation } from '@/types/warehouse';

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReorderingRule | null>(null);
  const [selectedRuleWarehouseId, setSelectedRuleWarehouseId] = useState<string>('');

  // Fetch product detail
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      return await apiClient<Product>(`/products/${productId}`);
    },
    enabled: !!productId,
  });

  const product = productResponse?.data;

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient<Category[]>('/categories');
      return res.data;
    },
  });

  // Fetch stock breakdown
  const { data: stockBreakdown = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ['product-stock', productId],
    queryFn: async () => {
      const res = await apiClient<ProductStockBreakdown[]>(`/products/${productId}/stock-breakdown`);
      return res.data;
    },
    enabled: !!productId,
  });

  // Fetch reordering rules
  const { data: reorderingRules = [], isLoading: isLoadingRules } = useQuery({
    queryKey: ['reordering-rules', productId],
    queryFn: async () => {
      const res = await apiClient<ReorderingRule[]>(`/reordering-rules?productId=${productId}`);
      return res.data;
    },
    enabled: !!productId,
  });

  // Fetch warehouses for reordering rules modal
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch locations for reordering rules modal
  const { data: ruleLocations = [] } = useQuery({
    queryKey: ['locations', selectedRuleWarehouseId],
    queryFn: async () => {
      if (!selectedRuleWarehouseId) return [];
      const res = await apiClient<WarehouseLocation[]>(`/locations?warehouseId=${selectedRuleWarehouseId}`);
      return res.data;
    },
    enabled: !!selectedRuleWarehouseId,
  });

  // Update Product Metadata Form
  const {
    register: registerMeta,
    handleSubmit: handleMetaSubmit,
    reset: resetMeta,
    formState: { errors: metaErrors, isDirty: isMetaDirty, isSubmitting: isMetaSubmitting },
  } = useForm<UpdateProductFormValues>({
    resolver: zodResolver(updateProductSchema),
    values: product
      ? {
          name: product.name,
          categoryId: product.categoryId,
          unitOfMeasure: product.unitOfMeasure,
          costPerUnit: product.costPerUnit,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity,
        }
      : undefined,
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: UpdateProductFormValues) => {
      return await apiClient(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setToastMessage({ type: 'success', message: 'Product metadata updated successfully.' });
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Failed to update product.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Reordering Rule Form
  const {
    register: registerRule,
    handleSubmit: handleRuleSubmit,
    reset: resetRuleForm,
    setValue: setRuleValue,
    formState: { errors: ruleErrors, isSubmitting: isRuleSubmitting },
  } = useForm<ReorderingRuleFormValues>({
    resolver: zodResolver(reorderingRuleSchema),
    defaultValues: {
      warehouseId: '',
      locationId: '',
      minQuantity: 10,
      maxQuantity: 50,
    },
  });

  const openCreateRuleModal = () => {
    setEditingRule(null);
    setSelectedRuleWarehouseId(warehouses[0]?.id || '');
    resetRuleForm({
      warehouseId: warehouses[0]?.id || '',
      locationId: '',
      minQuantity: 10,
      maxQuantity: 50,
    });
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule: ReorderingRule) => {
    setEditingRule(rule);
    setSelectedRuleWarehouseId(rule.warehouseId);
    resetRuleForm({
      warehouseId: rule.warehouseId,
      locationId: rule.locationId,
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
    });
    setIsRuleModalOpen(true);
  };

  const saveRuleMutation = useMutation({
    mutationFn: async (data: ReorderingRuleFormValues) => {
      if (editingRule) {
        return await apiClient(`/reordering-rules/${editingRule.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        });
      } else {
        return await apiClient('/reordering-rules', {
          method: 'POST',
          body: JSON.stringify({ ...data, productId }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reordering-rules', productId] });
      setIsRuleModalOpen(false);
      setToastMessage({
        type: 'success',
        message: editingRule ? 'Reordering rule updated.' : 'Reordering rule created.',
      });
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Failed to save reordering rule.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiClient(`/reordering-rules/${ruleId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reordering-rules', productId] });
      setToastMessage({ type: 'success', message: 'Reordering rule removed.' });
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Failed to delete reordering rule.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  if (isLoadingProduct) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  if (isProductError || !product) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-destructive">Product Not Found</h3>
        <p className="text-xs text-muted-foreground">
          {(productError as Error)?.message || 'The requested product could not be located.'}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="alert"
          className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium shadow-lg transition-all animate-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          )}
          <span className="flex-1">{toastMessage.message}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs uppercase font-bold tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & SKU Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Products</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary">
              {product.sku}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Category: <strong className="text-foreground">{product.category?.name || 'Uncategorized'}</strong> ·
            Unit: <strong className="text-foreground uppercase">{product.unitOfMeasure}</strong>
          </p>
        </div>

        {/* Global Summary KPI chips */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-right shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">On Hand Stock</div>
            <div className="text-lg font-bold text-foreground">{product.onHand ?? 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-right shadow-sm">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground">Free to Use</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {product.freeToUse ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Metadata Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" />
                <span>Product Metadata</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span>Stock quantity is not editable here (requires operations)</span>
              </div>
            </div>

            <form
              onSubmit={handleMetaSubmit((data) => updateProductMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Product Name</label>
                  <input
                    type="text"
                    {...registerMeta('name')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.name ? 'border-destructive' : 'border-input'
                    }`}
                  />
                  {metaErrors.name && (
                    <p className="text-[11px] text-destructive">{metaErrors.name.message}</p>
                  )}
                </div>

                {/* SKU (Readonly invariant per API contract) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">SKU Code (Immutable)</label>
                  <input
                    type="text"
                    value={product.sku}
                    disabled
                    className="h-10 w-full rounded-xl border border-input bg-muted/50 px-3 text-sm font-mono text-muted-foreground cursor-not-allowed"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    {...registerMeta('categoryId')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.categoryId ? 'border-destructive' : 'border-input'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {metaErrors.categoryId && (
                    <p className="text-[11px] text-destructive">{metaErrors.categoryId.message}</p>
                  )}
                </div>

                {/* Unit of Measure */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Unit of Measure</label>
                  <input
                    type="text"
                    {...registerMeta('unitOfMeasure')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.unitOfMeasure ? 'border-destructive' : 'border-input'
                    }`}
                  />
                </div>

                {/* Cost Per Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Cost Per Unit ($)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...registerMeta('costPerUnit')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.costPerUnit ? 'border-destructive' : 'border-input'
                    }`}
                  />
                </div>

                {/* Reorder Point */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Reorder Point</label>
                  <input
                    type="number"
                    min="0"
                    {...registerMeta('reorderPoint')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.reorderPoint ? 'border-destructive' : 'border-input'
                    }`}
                  />
                </div>

                {/* Reorder Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Default Reorder Qty</label>
                  <input
                    type="number"
                    min="1"
                    {...registerMeta('reorderQuantity')}
                    className={`h-10 w-full rounded-xl border bg-muted/20 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all ${
                      metaErrors.reorderQuantity ? 'border-destructive' : 'border-input'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  disabled={!isMetaDirty}
                  onClick={() => resetMeta()}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={!isMetaDirty || isMetaSubmitting || updateProductMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-40"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {updateProductMutation.isPending ? 'Saving Changes...' : 'Save Metadata'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Stock Breakdown By Location Table */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span>Stock Breakdown By Location</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Physical distribution across warehouses, receiving docks, and racks.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Rack / Location</th>
                    <th className="py-2.5 px-3 text-right">On Hand</th>
                    <th className="py-2.5 px-3 text-right">Reserved</th>
                    <th className="py-2.5 px-3 text-right">Free to Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {isLoadingStock ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        Loading stock distribution...
                      </td>
                    </tr>
                  ) : stockBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted-foreground">
                        No physical stock recorded in any location yet.
                      </td>
                    </tr>
                  ) : (
                    stockBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3 font-medium text-foreground flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{item.warehouseName}</span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono">
                          {item.locationName}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-foreground">
                          {item.onHand}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground">
                          {item.reserved}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {item.freeToUse}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Reordering Rules Section */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-purple-500" />
                  <span>Reordering Rules</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Automated min/max replenishments per storage location.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateRuleModal}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            {isLoadingRules ? (
              <div className="py-6 text-center text-xs text-muted-foreground">Loading rules...</div>
            ) : reorderingRules.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                <Sliders className="h-6 w-6 mx-auto opacity-40" />
                <p>No reordering rules configured.</p>
                <p className="text-[10px]">Add rules to automate stock replenishment alerts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reorderingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-xs text-foreground">
                        {rule.warehouseName}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditRuleModal(rule)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit Rule"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Remove Rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground font-mono">
                      Location: {rule.locationName}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Min Qty:</span>{' '}
                        <strong className="text-foreground">{rule.minQuantity}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Qty:</span>{' '}
                        <strong className="text-foreground">{rule.maxQuantity}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Reordering Rule Modal */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground">
                {editingRule ? 'Edit Reordering Rule' : 'New Reordering Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleRuleSubmit((data) => saveRuleMutation.mutate(data))}
              className="space-y-4"
            >
              {/* Warehouse Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Warehouse</label>
                <select
                  {...registerRule('warehouseId')}
                  value={selectedRuleWarehouseId}
                  onChange={(e) => {
                    setSelectedRuleWarehouseId(e.target.value);
                    setRuleValue('warehouseId', e.target.value);
                    setRuleValue('locationId', '');
                  }}
                  className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.shortCode})
                    </option>
                  ))}
                </select>
                {ruleErrors.warehouseId && (
                  <p className="text-[11px] text-destructive">{ruleErrors.warehouseId.message}</p>
                )}
              </div>

              {/* Location Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Location</label>
                <select
                  {...registerRule('locationId')}
                  disabled={!selectedRuleWarehouseId}
                  className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                >
                  <option value="">Select Location</option>
                  {ruleLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.shortCode})
                    </option>
                  ))}
                </select>
                {ruleErrors.locationId && (
                  <p className="text-[11px] text-destructive">{ruleErrors.locationId.message}</p>
                )}
              </div>

              {/* Min & Max Quantities */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Min Quantity</label>
                  <input
                    type="number"
                    min="0"
                    {...registerRule('minQuantity')}
                    className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  />
                  {ruleErrors.minQuantity && (
                    <p className="text-[11px] text-destructive">{ruleErrors.minQuantity.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Max Quantity</label>
                  <input
                    type="number"
                    min="1"
                    {...registerRule('maxQuantity')}
                    className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  />
                  {ruleErrors.maxQuantity && (
                    <p className="text-[11px] text-destructive">{ruleErrors.maxQuantity.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRuleSubmitting || saveRuleMutation.isPending}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saveRuleMutation.isPending ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
