import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  Building2,
  Trash2,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { Product } from '@/types/product';
import { Warehouse, WarehouseLocation } from '@/types/warehouse';
import { Category } from '@/types/category';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Deletion state
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient<Category[]>('/categories');
      return res.data;
    },
  });

  // Fetch Warehouses for dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch Locations for dropdown if warehouse is selected
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiClient<WarehouseLocation[]>(`/locations?warehouseId=${selectedWarehouseId}`);
      return res.data;
    },
    enabled: !!selectedWarehouseId,
  });

  // Fetch Products query
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
    ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
    ...(stockStatus !== 'all' ? { stockStatus } : {}),
  }).toString();

  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'products',
      page,
      search,
      selectedCategoryId,
      selectedWarehouseId,
      selectedLocationId,
      stockStatus,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      return await apiClient<Product[]>(`/products?${queryParams}`);
    },
  });

  const products = productsResponse?.data || [];
  const pagination = (productsResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiClient(`/products/${productId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setToastMessage({ type: 'success', message: 'Product successfully deactivated.' });
      setDeleteProductTarget(null);
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({
        type: 'error',
        message: err.message || 'Failed to deactivate product.',
      });
      setDeleteProductTarget(null);
      setTimeout(() => setToastMessage(null), 6000);
    },
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Package className="h-4 w-4" />
            <span>Master Catalog</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage product metadata, stock availability thresholds, and reordering policies.
          </p>
        </div>

        <Link
          to="/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search SKU / Name */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by SKU or product name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setSelectedLocationId('');
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="all">Status: All Levels</option>
              <option value="available">Status: In Stock</option>
              <option value="low">Status: Low Stock (≤ Reorder)</option>
              <option value="out">Status: Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Location Sub-filter if Warehouse is active */}
        {selectedWarehouseId && locations.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <Building2 className="h-3.5 w-3.5" />
              Filter Location:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLocationId('')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !selectedLocationId
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All Locations
            </button>
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedLocationId(loc.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedLocationId === loc.id
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground select-none">
                <th
                  onClick={() => handleSort('sku')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SKU</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Product Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">UoM</th>
                <th
                  onClick={() => handleSort('onHand')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>On Hand</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('freeToUse')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Free to Use</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reorderPoint')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Reorder Point</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-destructive">
                    {(error as Error)?.message || 'Failed to load products.'}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No products match the filter criteria</p>
                      <p className="text-xs">Try clearing your filters or create a new product item.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const onHand = product.onHand ?? 0;
                  const isOutOfStock = onHand <= 0;
                  const isLowStock = !isOutOfStock && onHand <= product.reorderPoint;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                        <span className="rounded bg-primary/10 px-2 py-1">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div>{product.name}</div>
                        <div className="text-[11px] text-muted-foreground sm:hidden">
                          {product.category?.name || 'Uncategorized'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground uppercase">{product.unitOfMeasure}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-right text-foreground">
                        {product.onHand ?? 0}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-right text-foreground">
                        {product.freeToUse ?? 0}
                      </td>
                      <td className="px-6 py-4 text-xs text-right text-muted-foreground">
                        {product.reorderPoint}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            Available
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()} // Prevent row click
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/products/${product.id}`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Edit & Stock Breakdown"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(product)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Deactivate Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-semibold text-foreground">{products.length}</span> of{' '}
            <span className="font-semibold text-foreground">{pagination.total}</span> products
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-medium">
              Page {page} of {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete / Deactivate Confirmation Modal */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Deactivate Product</h3>
                <p className="text-xs text-muted-foreground">SKU: {deleteProductTarget.sku}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to deactivate{' '}
              <strong className="text-foreground">"{deleteProductTarget.name}"</strong>? If this product has active
              inventory or ledger history, deletion will be blocked by system guardrails.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteProductTarget.id)}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
