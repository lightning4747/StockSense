import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FileText,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { InventoryMove } from '@/types/ledger';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

export const AdjustmentsPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    movementType: 'ADJUSTMENT',
    ...(search ? { search } : {}),
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
    queryKey: ['inventory-moves', 'ADJUSTMENT', page, search, dateFrom, dateTo],
    queryFn: async () => {
      return await apiClient<InventoryMove[]>(`/inventory/moves?${queryParams}`);
    },
  });

  const adjustments = movesResponse?.data || [];
  const pagination = (movesResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6 text-primary" />
            Inventory Adjustments
          </h1>
          <p className="text-sm text-muted-foreground">
            Reconcile physical stock counts, log inventory variance, and record damaged or scrapped items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link to="/operations/adjustments/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Adjustment
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference or product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

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

        {(search || dateFrom || dateTo) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading adjustments...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Failed to load adjustment history</p>
            <p className="text-xs mt-1">{(error as Error)?.message || 'An error occurred'}</p>
          </div>
        ) : adjustments.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No inventory adjustments recorded"
            description="Perform a physical stock count reconciliation to adjust warehouse inventory."
            actionLabel="New Adjustment"
            onAction={() => navigate('/operations/adjustments/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Adjusted Qty</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Performed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {adjustments.map((adj) => {
                  const isPositive = Boolean(adj.toLocationId);
                  return (
                    <tr key={adj.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {adj.reference}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div>{adj.product.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{adj.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                        {adj.toLocation?.name || adj.fromLocation?.name || adj.toLocationId || adj.fromLocationId || 'Warehouse Location'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-destructive'
                          }`}
                        >
                          {isPositive ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              +{adj.quantity}
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3" />
                              -{adj.quantity}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-xs truncate">
                        {adj.contact || 'Physical inventory reconciliation'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(adj.performedAt || adj.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {adjustments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{pagination.total}</span> adjustments
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
