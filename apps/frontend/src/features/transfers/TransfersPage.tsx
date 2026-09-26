import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  MapPin,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Transfer, TransferStatus } from '@/types/transfer';
import { Warehouse, Location } from '@/types/warehouse';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

export const TransfersPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Warehouses query
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Locations query for resolving names
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      const endpoint = selectedWarehouseId ? `/locations?warehouseId=${selectedWarehouseId}` : '/locations';
      const res = await apiClient<Location[]>(endpoint);
      return res.data;
    },
  });

  // Query params
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }).toString();

  const {
    data: transfersResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transfers', page, search, selectedWarehouseId, status, dateFrom, dateTo],
    queryFn: async () => {
      return await apiClient<Transfer[]>(`/transfers?${queryParams}`);
    },
  });

  const transfers = transfersResponse?.data || [];
  const pagination = (transfersResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const getStatusBadge = (st: TransferStatus) => {
    switch (st) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3 w-3" />
            Draft
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-3 w-3" />
            Ready
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/70 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  const getWarehouseName = (tr: Transfer) => {
    if (tr.warehouseName) return tr.warehouseName;
    const wh = warehouses.find((w) => w.id === tr.warehouseId);
    return wh ? `${wh.name} (${wh.shortCode})` : tr.warehouseId;
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return 'N/A';
    const loc = locations.find((l) => l.id === locationId);
    return loc ? loc.name : locationId;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
            Internal Transfers
          </h1>
          <p className="text-sm text-muted-foreground">
            Move inventory between warehouse storage locations with atomic stock ledger updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Link to="/operations/transfers/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Transfer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference (e.g. WH/INT/0001)..."
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
              title="Scheduled from date"
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
              title="Scheduled to date"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
          {(['all', 'DRAFT', 'READY', 'DONE', 'CANCELED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatus(st);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                status === st
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {st === 'all' ? 'All Transfers' : st}
            </button>
          ))}

          {(search || selectedWarehouseId || status !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedWarehouseId('');
                setStatus('all');
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
            Loading transfers...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-destructive">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="font-medium">Failed to load internal transfers</p>
            <p className="text-xs mt-1">{(error as Error)?.message || 'An error occurred'}</p>
          </div>
        ) : transfers.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No internal transfers found"
            description="Create your first internal stock transfer to move inventory between locations."
            actionLabel="Create Transfer"
            onAction={() => navigate('/operations/transfers/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3">Source Location</th>
                  <th className="px-4 py-3">Destination Location</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transfers.map((tr) => (
                  <tr
                    key={tr.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/operations/transfers/${tr.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {tr.reference}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">
                      {getWarehouseName(tr)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {tr.sourceLocationName || getLocationName(tr.sourceLocationId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {tr.destinationLocationName || getLocationName(tr.destinationLocationId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {tr.scheduledAt ? new Date(tr.scheduledAt).toLocaleDateString() : 'Immediate'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(tr.status)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/operations/transfers/${tr.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {transfers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{pagination.total}</span> transfers
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
