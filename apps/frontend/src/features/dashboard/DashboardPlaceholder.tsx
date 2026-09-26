import React, { useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Clock,
  Filter,
  Warehouse,
} from 'lucide-react';

export const DashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  // Dynamic filter state matching wireframe:
  // - Document type: Receipts / Delivery / Internal / Adjustments
  // - Status: Draft, Waiting, Ready, Done, Canceled
  // - Warehouse: Main Warehouse / Production Warehouse
  // - Product Category: All / Raw Materials / Finished Goods / Packaging
  const [docTypeFilter, setDocTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Dashboard KPIs matching wireframe L24-28
  const kpis = [
    {
      title: 'Total Products in Stock',
      value: '1,250',
      subtext: 'Across all active locations',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Low Stock / Out of Stock',
      value: '16',
      subtext: '12 Low stock · 4 Out of stock',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Pending Receipts',
      value: '4',
      subtext: 'Incoming vendor orders to receive',
      icon: ArrowDownLeft,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Pending Deliveries',
      value: '4',
      subtext: 'Outgoing customer shipments',
      icon: ArrowUpRight,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Internal Transfers Scheduled',
      value: '3',
      subtext: 'Movements between warehouse racks',
      icon: ArrowLeftRight,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  // Mock operational activities matching wireframe
  const mockOperations = [
    {
      id: 'WH/IN/0001',
      type: 'Receipt',
      from: 'Azure Interior (Vendor)',
      to: 'WH/Stock1',
      items: '50x Steel Rods',
      status: 'READY',
      date: 'Today, 10:00 AM',
    },
    {
      id: 'WH/OUT/0001',
      type: 'Delivery',
      from: 'WH/Stock1',
      to: 'Customer - Frame Fabrication',
      items: '10x Chairs',
      status: 'WAITING',
      date: 'Today, 02:30 PM',
    },
    {
      id: 'WH/INT/0001',
      type: 'Internal Transfer',
      from: 'Main Store',
      to: 'Production Rack',
      items: '100 kg Steel Stock',
      status: 'DONE',
      date: 'Today, 09:15 AM',
    },
    {
      id: 'WH/ADJ/0001',
      type: 'Adjustment',
      from: 'Production Rack',
      to: 'Scrap / Loss',
      items: '-3 kg Damaged Steel',
      status: 'DONE',
      date: 'Today, 08:45 AM',
    },
    {
      id: 'WH/IN/0002',
      type: 'Receipt',
      from: 'Deco Addict (Vendor)',
      to: 'WH/Stock2',
      items: '25x Wooden Desks',
      status: 'DRAFT',
      date: 'Tomorrow, 11:00 AM',
    },
  ];

  const filteredOperations = mockOperations.filter((op) => {
    if (docTypeFilter !== 'all') {
      if (docTypeFilter === 'receipts' && op.type !== 'Receipt') return false;
      if (docTypeFilter === 'deliveries' && op.type !== 'Delivery') return false;
      if (docTypeFilter === 'internal' && op.type !== 'Internal Transfer') return false;
      if (docTypeFilter === 'adjustments' && op.type !== 'Adjustment') return false;
    }
    if (statusFilter !== 'all' && op.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return <Badge variant="success" className="font-mono text-xs">Done</Badge>;
      case 'READY':
        return <Badge variant="default" className="font-mono text-xs bg-emerald-600 hover:bg-emerald-600">Ready</Badge>;
      case 'WAITING':
        return <Badge variant="warning" className="font-mono text-xs">Waiting</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary" className="font-mono text-xs">Draft</Badge>;
      case 'CANCELED':
        return <Badge variant="destructive" className="font-mono text-xs">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user?.loginId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-card border-border/80 text-xs">
            <Warehouse className="h-3.5 w-3.5 text-primary" />
            <span>Active Warehouse: <strong>Main Store (WH)</strong></span>
          </Badge>
        </div>
      </div>

      {/* Wireframe KPIs Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</div>
                  <div className="text-xs font-semibold text-foreground/80 mt-0.5">{kpi.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{kpi.subtext}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dynamic Filters Section (Wireframe L30-36) */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Dynamic Operations Filters</CardTitle>
            </div>
            {(docTypeFilter !== 'all' || statusFilter !== 'all' || warehouseFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDocTypeFilter('all');
                  setStatusFilter('all');
                  setWarehouseFilter('all');
                  setCategoryFilter('all');
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* By document type */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Document Type
              </label>
              <select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="all">All Document Types</option>
                <option value="receipts">Receipts (Incoming)</option>
                <option value="deliveries">Delivery Orders (Outgoing)</option>
                <option value="internal">Internal Transfers</option>
                <option value="adjustments">Stock Adjustments</option>
              </select>
            </div>

            {/* By status */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="WAITING">Waiting (Stock Insufficient)</option>
                <option value="READY">Ready</option>
                <option value="DONE">Done</option>
                <option value="CANCELED">Canceled</option>
              </select>
            </div>

            {/* By warehouse or location */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Warehouse / Location
              </label>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="all">All Warehouses</option>
                <option value="main">Main Warehouse (WH)</option>
                <option value="prod">Production Floor</option>
                <option value="stock1">WH / Stock1</option>
                <option value="stock2">WH / Stock2</option>
              </select>
            </div>

            {/* By product category */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Product Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                <option value="all">All Categories</option>
                <option value="raw">Raw Materials</option>
                <option value="finished">Finished Goods</option>
                <option value="packaging">Packaging Supplies</option>
                <option value="tools">Spare Parts & Tools</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Live Stream / Snapshot Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Live Operations Stream</CardTitle>
              <CardDescription>
                Real-time snapshot of inventory receipts, deliveries, transfers, and adjustments
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredOperations.length} matching operations
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Reference</th>
                <th className="px-6 py-3.5">Document Type</th>
                <th className="px-6 py-3.5">Route (From / To)</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Scheduled / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                    No operations match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => (
                  <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
                      {op.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {op.type === 'Receipt' && <ArrowDownLeft className="h-4 w-4 text-emerald-500" />}
                        {op.type === 'Delivery' && <ArrowUpRight className="h-4 w-4 text-blue-500" />}
                        {op.type === 'Internal Transfer' && <ArrowLeftRight className="h-4 w-4 text-purple-500" />}
                        {op.type === 'Adjustment' && <SlidersHorizontal className="h-4 w-4 text-amber-500" />}
                        <span className="font-medium text-xs">{op.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{op.from}</span>
                      <span className="mx-1.5 text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">{op.to}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground">
                      {op.items}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(op.status)}
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-muted-foreground flex items-center justify-end gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                      <span>{op.date}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
