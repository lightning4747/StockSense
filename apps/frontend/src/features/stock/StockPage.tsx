import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { StockItem } from '@/types/stock';
import { Warehouse, Location } from '@/types/warehouse';
import { ProductCategory } from '@/types/product';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export const StockPage: React.FC = () => {
  // Filter States
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState<'all' | 'available' | 'low' | 'out'>('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Warehouses query
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Locations query
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: async () => {
      const endpoint = warehouseId ? `/locations?warehouseId=${warehouseId}` : '/locations';
      const res = await apiClient<Location[]>(endpoint);
      return res.data;
    },
  });

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient<ProductCategory[]>('/categories');
      return res.data;
    },
  });

  // Stock query
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(warehouseId ? { warehouseId } : {}),
    ...(locationId ? { locationId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(stockStatus !== 'all' ? { stockStatus } : {}),
  }).toString();

  const {
    data: stockResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['stock', page, search, warehouseId, locationId, categoryId, stockStatus],
    queryFn: async () => {
      return await apiClient<StockItem[]>(`/stock?${queryParams}`);
    },
  });

  const stockItems = stockResponse?.data || [];
  const pagination = (stockResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 15, total: 0, totalPages: 1 };

  // Quick stats
  const totalOnHand = stockItems.reduce((acc, item) => acc + (item.onHand || 0), 0);
  const totalReserved = stockItems.reduce((acc, item) => acc + (item.reserved || 0), 0);
  const totalFreeToUse = stockItems.reduce((acc, item) => acc + (item.freeToUse || 0), 0);

  const getStatusBadge = (item: StockItem) => {
    if (item.onHand === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/70 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
          <XCircle className="h-3 w-3" />
          Out of Stock
        </span>
      );
    }
    if (item.freeToUse <= 0 && item.onHand > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Fully Reserved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Available
      </span>
    );
  };

  const getWarehouseName = (item: StockItem) => {
    if (item.warehouseName) return item.warehouseName;
    const wh = warehouses.find((w) => w.id === item.warehouseId);
    return wh ? `${wh.name} (${wh.shortCode})` : item.warehouseId;
  };

  const getLocationName = (item: StockItem) => {
    if (item.locationName) return item.locationName;
    const loc = locations.find((l) => l.id === item.locationId);
    return loc ? loc.name : item.locationId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Stock Availability
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time multi-warehouse inventory levels, physical on-hand quantities, and customer reservations
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Rows (Page)</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stockItems.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total in system: {pagination.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On Hand (Current Page)</div>
          <div className="text-2xl font-bold text-primary mt-1">{totalOnHand.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Physical items in storage</div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reserved (Current Page)</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{totalReserved.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Allocated to pending orders</div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Free to Use (Current Page)</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalFreeToUse.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Available for new shipments</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search product SKU or title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Warehouse */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setLocationId('');
                setPage(1);
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

          {/* Location */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
          {(['all', 'available', 'low', 'out'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setStockStatus(status);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                stockStatus === status
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {status === 'all'
                ? 'All Stock'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}

          {(search || warehouseId || locationId || categoryId || stockStatus !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setWarehouseId('');
                setLocationId('');
                setCategoryId('');
                setStockStatus('all');
                setPage(1);
              }}
              className="ml-auto text-xs text-primary hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading stock levels...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Failed to load stock data</p>
            <p className="text-xs mt-1">{(error as Error)?.message || 'An error occurred'}</p>
          </div>
        ) : stockItems.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No inventory records found"
            description="No items match your active search and filter criteria. Try clearing filters or creating an initial stock adjustment."
            actionLabel="Reset filters"
            onAction={() => {
              setSearch('');
              setWarehouseId('');
              setLocationId('');
              setCategoryId('');
              setStockStatus('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">On Hand</th>
                  <th className="px-4 py-3 text-right">Reserved</th>
                  <th className="px-4 py-3 text-right">Free to Use</th>
                  <th className="px-4 py-3 text-right">Cost / Unit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stockItems.map((item, idx) => {
                  const rawCost = item.costPerUnit ?? item.unitCost ?? 0;
                  const numericCost = typeof rawCost === 'number' ? rawCost : parseFloat(String(rawCost)) || 0;
                  return (
                    <tr
                      key={`${item.productId}-${item.locationId}-${idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.product}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getWarehouseName(item)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getLocationName(item)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {item.onHand.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400 font-medium">
                        {item.reserved.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        <span
                          className={
                            item.freeToUse <= 0
                              ? 'text-destructive font-bold'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }
                        >
                          {item.freeToUse.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        ${numericCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {stockItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{pagination.total}</span> stock entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs px-2">
                Page {page} of {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
