import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Ban,
  PackageCheck,
} from 'lucide-react';
import { useTransfer, useTransferMutations } from '@/hooks/useTransfers';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Button } from '@/components/ui/button';

export const TransferDetailPage: React.FC = () => {
  const { transferId } = useParams<{ transferId: string }>();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: transfer, isLoading, isError, error, refetch } = useTransfer(transferId);
  const { data: warehouses = [] } = useWarehouses();
  const { data: locations = [] } = useLocations(transfer?.warehouseId);

  const {
    readyTransfer,
    validateTransfer,
    cancelTransfer,
  } = useTransferMutations(transferId);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
        Loading transfer details...
      </div>
    );
  }

  if (isError || !transfer) {
    return (
      <div className="max-w-3xl mx-auto p-8 rounded-lg border bg-card text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">Transfer Not Found</h2>
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message || 'Could not find the requested internal transfer.'}
        </p>
        <Link to="/operations/transfers">
          <Button variant="outline" size="sm">
            Back to Transfers
          </Button>
        </Link>
      </div>
    );
  }

  const warehouse = warehouses.find((w) => w.id === transfer.warehouseId);
  const sourceLocation = locations.find((l) => l.id === transfer.sourceLocationId);
  const destLocation = locations.find((l) => l.id === transfer.destinationLocationId);

  const handleReady = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await readyTransfer.mutateAsync(transfer.id);
      setActionSuccess('Transfer marked as READY. Available stock confirmed.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark transfer as ready');
    }
  };

  const handleValidate = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await validateTransfer.mutateAsync(transfer.id);
      setActionSuccess('Transfer validated! Stock moved between locations and ledger updated.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to validate transfer');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      await cancelTransfer.mutateAsync(transfer.id);
      setActionSuccess('Transfer canceled.');
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel transfer');
    }
  };

  const isMutating =
    readyTransfer.isPending || validateTransfer.isPending || cancelTransfer.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/operations/transfers">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                {transfer.reference}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  transfer.status === 'DONE'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                    : transfer.status === 'READY'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400'
                    : transfer.status === 'CANCELED'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {transfer.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Created on {new Date(transfer.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {transfer.status === 'DRAFT' && (
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
                Mark Ready
              </Button>
            </>
          )}

          {transfer.status === 'READY' && (
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
                Validate Transfer
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

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Warehouse Location Routing
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium text-foreground">
                {transfer.warehouseName || warehouse?.name || transfer.warehouseId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">From (Source):</span>
              <span className="font-medium text-foreground">
                {transfer.sourceLocationName || sourceLocation?.name || transfer.sourceLocationId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">To (Destination):</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {transfer.destinationLocationName || destLocation?.name || transfer.destinationLocationId}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Schedule & Status
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Scheduled Date:</span>
              <span className="font-medium text-foreground">
                {transfer.scheduledAt ? new Date(transfer.scheduledAt).toLocaleDateString() : 'Immediate'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-foreground">{transfer.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Transferred Items
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {transfer.items?.length || 0} line item(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-right">Transfer Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {transfer.items && transfer.items.length > 0 ? (
                transfer.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {item.sku || 'SKU'}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.productName || 'Product'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {item.quantity}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground text-xs">
                    No items in this transfer.
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
