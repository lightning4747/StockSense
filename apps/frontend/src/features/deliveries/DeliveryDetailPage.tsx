import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  AlertCircle,
  RefreshCw,
  Ban,
  PackageCheck,
} from 'lucide-react';
import { useDelivery, useDeliveryMutations } from '@/hooks/useDeliveries';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';

export const DeliveryDetailPage: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: delivery, isLoading, isError, error, refetch } = useDelivery(deliveryId);
  const { data: warehouses = [] } = useWarehouses();
  const { data: locations = [] } = useLocations(delivery?.warehouseId);

  const {
    confirmDelivery,
    readyDelivery,
    validateDelivery,
    cancelDelivery,
  } = useDeliveryMutations(deliveryId);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        Loading delivery order details...
      </div>
    );
  }

  if (isError || !delivery) {
    return (
      <div className="max-w-3xl mx-auto p-8 rounded-lg border bg-card text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">Delivery Order Not Found</h2>
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message || 'Could not find the requested delivery order.'}
        </p>
        <Link to="/operations/deliveries">
          <Button variant="outline" size="sm">
            Back to Deliveries
          </Button>
        </Link>
      </div>
    );
  }

  const warehouse = warehouses.find((w) => w.id === delivery.warehouseId);
  const location = locations.find((l) => l.id === delivery.sourceLocationId);

  const handleConfirm = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await confirmDelivery.mutateAsync(delivery.id);
      setActionSuccess('Delivery confirmed. Stock levels checked.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to confirm delivery');
    }
  };

  const handleReady = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await readyDelivery.mutateAsync(delivery.id);
      setActionSuccess('Delivery marked as READY for dispatch.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark delivery as ready');
    }
  };

  const handleValidate = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await validateDelivery.mutateAsync(delivery.id);
      setActionSuccess('Delivery validated successfully! Stock reduced and ledger recorded.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to validate delivery');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this delivery order?')) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await cancelDelivery.mutateAsync(delivery.id);
      setActionSuccess('Delivery canceled.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel delivery');
    }
  };

  const isMutating =
    confirmDelivery.isPending ||
    readyDelivery.isPending ||
    validateDelivery.isPending ||
    cancelDelivery.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/operations/deliveries">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {delivery.reference}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  delivery.status === 'DONE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                    : delivery.status === 'READY'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400'
                    : delivery.status === 'WAITING'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                    : delivery.status === 'CANCELED'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {delivery.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created on {new Date(delivery.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {delivery.status === 'DRAFT' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isMutating}
                className="gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isMutating}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm Order
              </Button>
            </>
          )}

          {delivery.status === 'WAITING' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isMutating}
                className="gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReady}
                disabled={isMutating}
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Check & Mark Ready
              </Button>
            </>
          )}

          {delivery.status === 'READY' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isMutating}
                className="gap-1.5 text-destructive hover:bg-destructive/10"
              >
                <Ban className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleValidate}
                disabled={isMutating}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <PackageCheck className="h-4 w-4" />
                Validate Delivery
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {actionError && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-md bg-emerald-500/15 p-4 text-sm text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* WAITING stock-insufficient banner */}
      {delivery.status === 'WAITING' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            Stock Insufficient — Order Placed on Hold
          </div>
          <p className="text-xs text-amber-700/90 dark:text-amber-400">
            One or more items in this order do not have enough available free quantity in the source location.
            Once inventory arrives via receipts or internal transfers, click <strong>"Check & Mark Ready"</strong> to re-verify and advance the order.
          </p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Warehouse & Location
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium text-foreground">
                {delivery.warehouseName || warehouse?.name || delivery.warehouseId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Source Location:</span>
              <span className="font-medium text-foreground">
                {delivery.sourceLocationName || location?.name || delivery.sourceLocationId}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Shipping & Schedule
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-medium text-foreground truncate max-w-xs">
                {delivery.deliveryAddress || 'Standard Shipment'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Scheduled Date:</span>
              <span className="font-medium text-foreground">
                {delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleDateString() : 'Immediate'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Order Line Items
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {delivery.items?.length || 0} line item(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-right">Requested Qty</th>
                <th className="px-4 py-3 text-right">Available Qty</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {delivery.items && delivery.items.length > 0 ? (
                delivery.items.map((item, idx) => {
                  const reqQty = item.requestedQuantity;
                  const availQty = item.availableQuantity ?? 0;
                  const isShort = availQty < reqQty && delivery.status !== 'DONE';

                  return (
                    <tr key={item.id || idx} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                        {item.sku || 'SKU'}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {item.productName || 'Product'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {reqQty}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span
                          className={
                            isShort
                              ? 'text-destructive font-bold'
                              : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          }
                        >
                          {availQty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isShort ? (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            Deficit ({reqQty - availQty})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Stock OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">
                    No items in this delivery order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
