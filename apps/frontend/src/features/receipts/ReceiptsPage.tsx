import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Receipt } from '@/types/receipt';
import { Warehouse } from '@/types/warehouse';

export const ReceiptsPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<string>('scheduledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch Receipts query
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }).toString();

  const {
    data: receiptsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['receipts', page, search, selectedWarehouseId, status, dateFrom, dateTo, sortBy, sortOrder],
    queryFn: async () => {
      return await apiClient<Receipt[]>(`/receipts?${queryParams}`);
    },
  });

  const receipts = receiptsResponse?.data || [];
  const pagination = (receiptsResponse?.pagination as {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
            <Clock className="h-3 w-3" />
            Draft
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-3 w-3" />
            Ready
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <ArrowDownLeft className="h-4 w-4" />
            <span>Incoming Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Receipts</h1>
          <p className="text-sm text-muted-foreground">
            Manage vendor shipments, verify incoming deliveries, and receive inventory stock into storage racks.
          </p>
        </div>

        <Link
          to="/operations/receipts/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Receipt</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reference, supplier, product..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-input bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Status: Draft</option>
              <option value="READY">Status: Ready</option>
              <option value="DONE">Status: Done</option>
              <option value="CANCELED">Status: Canceled</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
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

          {/* Date Filter */}
          <div className="flex items-center gap-1.5">
            <div className="relative w-1/2">
              <input
                type="date"
                title="Date From"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-input bg-muted/30 px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="relative w-1/2">
              <input
                type="date"
                title="Date To"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-input bg-muted/30 px-2 text-[11px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Receipts Table Card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground select-none">
                <th
                  onClick={() => handleSort('reference')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Reference</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5">From</th>
                <th className="px-6 py-3.5">To (Destination)</th>
                <th className="px-6 py-3.5">Contact / Supplier</th>
                <th
                  onClick={() => handleSort('scheduledAt')}
                  className="px-6 py-3.5 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Scheduled Date</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading incoming receipts...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-destructive">
                    {(error as Error)?.message || 'Failed to load receipts.'}
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No receipts found</p>
                      <p className="text-xs">Create a new receipt to record incoming supplier shipments.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                receipts.map((receipt) => {
                  const items = Array.isArray(receipt.items) ? receipt.items : [];
                  const totalQty = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
                  const warehouse = warehouses.find((w) => w.id === receipt.warehouseId);
                  const destinationLabel = receipt.to || (warehouse ? `${warehouse.name} (${warehouse.shortCode})` : 'Warehouse Storage');

                  return (
                    <tr
                      key={receipt.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/operations/receipts/${receipt.id}`)}
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-primary">
                        <span className="rounded bg-primary/10 px-2.5 py-1">{receipt.reference}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {receipt.from || receipt.supplierName || 'Vendor'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{destinationLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-foreground">
                        {receipt.supplierName}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(receipt.scheduledAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(receipt.status)}</td>
                      <td className="px-6 py-4 text-right text-xs font-semibold text-foreground">
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          {items.length > 0 ? `${items.length} line(s) · ${totalQty} qty` : 'View details'}
                        </span>
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
            Showing <span className="font-semibold text-foreground">{receipts.length}</span> of{' '}
            <span className="font-semibold text-foreground">{pagination.total}</span> receipts
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
    </div>
  );
};
