import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  Building2,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiClient } from '@/lib/api';
import { DashboardKpis, DashboardOperations } from '@/types/dashboard';
import { Warehouse, WarehouseLocation } from '@/types/warehouse';
import { Category } from '@/types/category';

export const DashboardPage: React.FC = () => {
  // Dynamic filter state matching wireframe and API contract
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Fetch Warehouses
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch Locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedWarehouseId],
    queryFn: async () => {
      if (!selectedWarehouseId) return [];
      const res = await apiClient<WarehouseLocation[]>(`/locations?warehouseId=${selectedWarehouseId}`);
      return res.data;
    },
    enabled: !!selectedWarehouseId,
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient<Category[]>('/categories');
      return res.data;
    },
  });

  // Build KPI query string
  const kpiParams = new URLSearchParams({
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
    ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
    ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
  }).toString();

  // Query 1: GET /dashboard KPIs
  const {
    data: kpiResponse,
    isLoading: isLoadingKpis,
  } = useQuery({
    queryKey: ['dashboard-kpis', selectedWarehouseId, selectedLocationId, selectedCategoryId],
    queryFn: async () => {
      return await apiClient<DashboardKpis>(`/dashboard${kpiParams ? `?${kpiParams}` : ''}`);
    },
  });

  const kpis: DashboardKpis = kpiResponse?.data || {
    totalProductsInStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  };

  // Build Operations query string
  const opsParams = new URLSearchParams({
    ...(selectedWarehouseId ? { warehouseId: selectedWarehouseId } : {}),
  }).toString();

  // Query 2: GET /dashboard/operations stats
  const {
    data: opsResponse,
    isLoading: isLoadingOps,
  } = useQuery({
    queryKey: ['dashboard-operations', selectedWarehouseId],
    queryFn: async () => {
      return await apiClient<DashboardOperations>(
        `/dashboard/operations${opsParams ? `?${opsParams}` : ''}`
      );
    },
  });

  const ops: DashboardOperations = opsResponse?.data || {
    receipts: { toReceive: 0, late: 0, operations: 0 },
    deliveries: { toDeliver: 0, late: 0, waiting: 0, operations: 0 },
  };

  // Query 3: GET /inventory/moves to calculate stock movement trends (IN vs OUT)
  const { data: movesResponse } = useQuery({
    queryKey: ['dashboard-moves', selectedWarehouseId],
    queryFn: async () => {
      return await apiClient<any[]>(
        `/inventory/moves?limit=100${selectedWarehouseId ? `&warehouseId=${selectedWarehouseId}` : ''}`
      );
    },
  });

  // Aggregate moves by date for Recharts area chart
  const moves = movesResponse?.data || [];
  const trendDataMap: Record<string, { date: string; inQty: number; outQty: number }> = {};

  // Seed last 7 days so chart is always beautiful
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendDataMap[key] = { date: displayLabel, inQty: 0, outQty: 0 };
  }

  // Populate actual ledger movements
  moves.forEach((move: any) => {
    const dateKey = (move.createdAt || '').split('T')[0];
    if (dateKey && trendDataMap[dateKey]) {
      const qty = Math.abs(Number(move.quantity) || 0);
      if (move.movementType === 'IN' || move.movementType === 'TRANSFER_IN') {
        trendDataMap[dateKey].inQty += qty;
      } else if (move.movementType === 'OUT' || move.movementType === 'TRANSFER_OUT') {
        trendDataMap[dateKey].outQty += qty;
      }
    }
  });

  const chartData = Object.values(trendDataMap);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Inventory Operations Dashboard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time multi-warehouse stock availability, active orders, and fulfillment pipelines.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Link
            to="/operations/receipts/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted shadow-sm transition-all"
          >
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
            <span>New Receipt</span>
          </Link>
          <Link
            to="/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
          >
            <Package className="h-4 w-4" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Dynamic Multi-Warehouse Filter Bar per wireframe.md */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>Scope Filter:</span>
          </div>

          {/* Warehouse Selector */}
          <div className="w-48">
            <select
              value={selectedWarehouseId}
              onChange={(e) => {
                setSelectedWarehouseId(e.target.value);
                setSelectedLocationId('');
              }}
              className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* Location Selector (Dependent on Warehouse) */}
          <div className="w-48">
            <select
              value={selectedLocationId}
              disabled={!selectedWarehouseId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedWarehouseId ? 'All Storage Locations' : 'Select Warehouse First'}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.shortCode})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div className="w-48">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-9 w-full rounded-xl border border-input bg-muted/20 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedWarehouseId || selectedLocationId || selectedCategoryId) && (
            <button
              type="button"
              onClick={() => {
                setSelectedWarehouseId('');
                setSelectedLocationId('');
                setSelectedCategoryId('');
              }}
              className="text-xs font-semibold text-primary hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid (Total Products, Low Stock, Out of Stock, Pending Receipts, Pending Deliveries, Scheduled Transfers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Products */}
        <Link
          to="/products"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total In Stock
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {isLoadingKpis ? '...' : kpis.totalProductsInStock}
          </div>
          <div className="text-[11px] text-muted-foreground">Active SKUs tracked</div>
        </Link>

        {/* 2. Low Stock */}
        <Link
          to="/products?stockStatus=low"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Low Stock
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {isLoadingKpis ? '...' : kpis.lowStockItems}
          </div>
          <div className="text-[11px] text-muted-foreground">Below reorder point</div>
        </Link>

        {/* 3. Out of Stock */}
        <Link
          to="/products?stockStatus=out"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-red-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Out of Stock
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {isLoadingKpis ? '...' : kpis.outOfStockItems}
          </div>
          <div className="text-[11px] text-muted-foreground">Zero available balance</div>
        </Link>

        {/* 4. Pending Receipts */}
        <Link
          to="/operations/receipts?status=READY"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Pending Receipts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoadingKpis ? '...' : kpis.pendingReceipts}
          </div>
          <div className="text-[11px] text-muted-foreground">Incoming vendor orders</div>
        </Link>

        {/* 5. Pending Deliveries */}
        <Link
          to="/operations/deliveries"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Pending Deliveries
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {isLoadingKpis ? '...' : kpis.pendingDeliveries}
          </div>
          <div className="text-[11px] text-muted-foreground">Customer shipments</div>
        </Link>

        {/* 6. Scheduled Transfers */}
        <Link
          to="/operations/transfers"
          className="group rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Transfers
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {isLoadingKpis ? '...' : kpis.scheduledTransfers}
          </div>
          <div className="text-[11px] text-muted-foreground">Between racks / WH</div>
        </Link>
      </div>

      {/* Operations Stats Panel & Stock Movement Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Stock Movement Trend Chart (IN vs OUT) */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Stock Movement Trend (IN vs OUT)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Physical inventory volume received vs dispatched over time.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View Move History</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  name="Stock In (Receipts)"
                  dataKey="inQty"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIn)"
                />
                <Area
                  type="monotone"
                  name="Stock Out (Deliveries)"
                  dataKey="outQty"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOut)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Operations Stats Panel (Receipts & Deliveries status pipeline) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>Operations Pipeline</span>
            </h2>

            {/* Receipts Sub-panel */}
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Incoming Receipts</span>
                </span>
                <Link
                  to="/operations/receipts"
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  View all ({ops.receipts.operations})
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                <div className="rounded-lg bg-card p-2 text-center border border-border/60">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    To Receive
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {isLoadingOps ? '...' : ops.receipts.toReceive}
                  </div>
                </div>
                <div className="rounded-lg bg-card p-2 text-center border border-border/60">
                  <div className="text-[10px] text-red-600 dark:text-red-400 uppercase font-semibold">
                    Late / Overdue
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">
                    {isLoadingOps ? '...' : ops.receipts.late}
                  </div>
                </div>
              </div>
            </div>

            {/* Deliveries Sub-panel */}
            <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                  <span>Outgoing Deliveries</span>
                </span>
                <Link
                  to="/operations/deliveries"
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  View all ({ops.deliveries.operations})
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
                <div className="rounded-lg bg-card p-2 text-center border border-border/60">
                  <div className="text-[9px] text-muted-foreground uppercase font-semibold">
                    To Deliver
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {isLoadingOps ? '...' : ops.deliveries.toDeliver}
                  </div>
                </div>
                <div className="rounded-lg bg-card p-2 text-center border border-border/60">
                  <div className="text-[9px] text-amber-600 uppercase font-semibold">Waiting</div>
                  <div className="text-base font-bold text-amber-600">
                    {isLoadingOps ? '...' : ops.deliveries.waiting}
                  </div>
                </div>
                <div className="rounded-lg bg-card p-2 text-center border border-border/60">
                  <div className="text-[9px] text-red-600 uppercase font-semibold">Late</div>
                  <div className="text-base font-bold text-red-600">
                    {isLoadingOps ? '...' : ops.deliveries.late}
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Facilities Quick Summary */}
            <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Warehouses Active:</span>
              </span>
              <span className="font-semibold text-foreground">{warehouses.length} facility(ies)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
