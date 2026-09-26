import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  X,
  Package,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { InventoryMove, MovementType } from '@/types/ledger';
import { Warehouse, Location } from '@/types/warehouse';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

export const HistoryPage: React.FC = () => {
  // Filters & State
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState<string>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Selected Move for Modal
  const [selectedMove, setSelectedMove] = useState<InventoryMove | null>(null);

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
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      const endpoint = selectedWarehouseId ? `/locations?warehouseId=${selectedWarehouseId}` : '/locations';
      const res = await apiClient<Location[]>(endpoint);
      return res.data;
    },
  });

  // Moves query
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(movementType !== 'all' ? { movementType } : {}),
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
    ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }).toString();

  const {
    data: movesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory-moves', page, search, movementType, selectedWarehouseId, selectedLocationId, dateFrom, dateTo],
    queryFn: async () => {
      return await apiClient<InventoryMove[]>(`/inventory/moves?${queryParams}`);
    },
  });

  const moves = movesResponse?.data || [];
  const pagination = (movesResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ArrowDownLeft className="h-3 w-3" />
            Receipt (IN)
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <ArrowUpRight className="h-3 w-3" />
            Delivery (OUT)
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/70 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
            <ArrowLeftRight className="h-3 w-3" />
            Transfer
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <SlidersHorizontal className="h-3 w-3" />
            Adjustment
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  const getLocationLabel = (locId?: string | null, locObj?: { id: string; name: string } | null) => {
    if (locObj?.name) return locObj.name;
    if (!locId) return 'None (Vendor / Scrap)';
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : locId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Move History
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete, immutable audit log of all stock movements (receipts, deliveries, transfers, and adjustments)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference, SKU, or product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Warehouse */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setSelectedLocationId('');
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

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              title="From date"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              title="To date"
            />
          </div>
        </div>

        {/* Movement Type Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium mr-1">Movement Type:</span>
          {(['all', 'IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setMovementType(t);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                movementType === t
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t === 'all' ? 'All Movements' : t}
            </button>
          ))}

          {(search || selectedWarehouseId || movementType !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedWarehouseId('');
                setMovementType('all');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="ml-auto text-xs text-primary hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading move history...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Failed to load move history</p>
            <p className="text-xs mt-1">{(error as Error)?.message || 'An error occurred'}</p>
          </div>
        ) : moves.length === 0 ? (
          <EmptyState
            icon={History}
            title="No movement history found"
            description="Stock movements will appear here automatically when receipts, deliveries, transfers, or adjustments are validated."
            actionLabel="Reset filters"
            onAction={() => {
              setSearch('');
              setSelectedWarehouseId('');
              setMovementType('all');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">From Location</th>
                  <th className="px-4 py-3">To Location</th>
                  <th className="px-4 py-3">Contact / Memo</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {moves.map((move) => (
                  <tr
                    key={move.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedMove(move)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {move.reference}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getTypeBadge(move.movementType)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{move.product.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{move.product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {move.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {getLocationLabel(move.fromLocationId, move.fromLocation)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                      {getLocationLabel(move.toLocationId, move.toLocation)}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground max-w-xs truncate">
                      {move.contact || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(move.performedAt || move.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {moves.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{pagination.total}</span> stock movements
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

      {/* Move Detail Modal */}
      {selectedMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground font-mono">
                  {selectedMove.reference}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMove(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase font-medium">Movement Type:</span>
                <div>{getTypeBadge(selectedMove.movementType)}</div>
              </div>

              <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  {selectedMove.product.name}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  SKU: {selectedMove.product.sku}
                </div>
                <div className="text-base font-bold text-foreground mt-1">
                  Quantity: {selectedMove.quantity.toLocaleString()} units
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md border bg-muted/10">
                  <span className="text-muted-foreground block mb-0.5 font-medium">From Location:</span>
                  <span className="font-mono text-foreground">
                    {getLocationLabel(selectedMove.fromLocationId, selectedMove.fromLocation)}
                  </span>
                </div>
                <div className="p-2.5 rounded-md border bg-muted/10">
                  <span className="text-muted-foreground block mb-0.5 font-medium">To Location:</span>
                  <span className="font-mono text-foreground">
                    {getLocationLabel(selectedMove.toLocationId, selectedMove.toLocation)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center justify-between">
                  <span>Contact / Memo:</span>
                  <span className="text-foreground font-medium">{selectedMove.contact || 'None'}</span>
                </div>
                {selectedMove.sourceDocumentType && (
                  <div className="flex items-center justify-between">
                    <span>Source Document:</span>
                    <span className="text-foreground font-mono">{selectedMove.sourceDocumentType}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Performed At:</span>
                  <span className="text-foreground">
                    {new Date(selectedMove.performedAt || selectedMove.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" onClick={() => setSelectedMove(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
