import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  PlayCircle,
  ShieldCheck,
  Ban,
  Boxes,
} from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api';
import { Receipt } from '@/types/receipt';

export const ReceiptDetailPage: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch receipt details
  const {
    data: receiptResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: async () => {
      return await apiClient<Receipt>(`/receipts/${receiptId}`);
    },
    enabled: !!receiptId,
  });

  const receipt = receiptResponse?.data;

  // Transition: DRAFT -> READY
  const markReadyMutation = useMutation({
    mutationFn: async () => {
      return await apiClient(`/receipts/${receiptId}/ready`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setToastMessage({ type: 'success', message: 'Receipt is now marked as READY for warehouse receipt.' });
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Failed to mark receipt as ready.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Transition: READY -> DONE (Validate & increase stock)
  const validateMutation = useMutation({
    mutationFn: async () => {
      return await apiClient(`/receipts/${receiptId}/validate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      setToastMessage({
        type: 'success',
        message: 'Receipt validated! Inventory stock has been credited to destination location.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Validation failed.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Transition: DRAFT/READY -> CANCELED
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiClient(`/receipts/${receiptId}/cancel`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      setToastMessage({ type: 'success', message: 'Receipt has been canceled.' });
      setTimeout(() => setToastMessage(null), 4000);
    },
    onError: (err: ApiError) => {
      setToastMessage({ type: 'error', message: err.message || 'Failed to cancel receipt.' });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Clock className="h-3.5 w-3.5" />
            Draft
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/70 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Ready for Processing
          </span>
        );
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed & Validated
          </span>
        );
      case 'CANCELED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-950/70 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Canceled
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading receipt details...</span>
        </div>
      </div>
    );
  }

  if (isError || !receipt) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-destructive">Receipt Not Found</h3>
        <p className="text-xs text-muted-foreground">
          {(error as Error)?.message || 'The requested receipt could not be located.'}
        </p>
        <Link
          to="/operations/receipts"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Receipts</span>
        </Link>
      </div>
    );
  }

  const receiptItems = Array.isArray(receipt.items) ? receipt.items : [];
  const totalQuantity = receiptItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
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

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/operations/receipts"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Receipts</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{receipt.reference}</h1>
            {getStatusBadge(receipt.status)}
          </div>
          <p className="text-xs text-muted-foreground">
            Supplier: <strong className="text-foreground">{receipt.supplierName}</strong> · Scheduled: {' '}
            <strong className="text-foreground">{new Date(receipt.scheduledAt).toLocaleDateString()}</strong>
          </p>
        </div>

        {/* Action Buttons: Mark Ready / Validate / Cancel (Conditional per Status) */}
        <div className="flex items-center gap-2">
          {/* DRAFT -> READY */}
          {receipt.status === 'DRAFT' && (
            <button
              type="button"
              disabled={markReadyMutation.isPending}
              onClick={() => markReadyMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" />
              <span>{markReadyMutation.isPending ? 'Marking Ready...' : 'Mark Ready'}</span>
            </button>
          )}

          {/* READY -> DONE (Validate) */}
          {receipt.status === 'READY' && (
            <button
              type="button"
              disabled={validateMutation.isPending}
              onClick={() => validateMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{validateMutation.isPending ? 'Validating Stock...' : 'Validate'}</span>
            </button>
          )}

          {/* DRAFT or READY -> CANCEL */}
          {(receipt.status === 'DRAFT' || receipt.status === 'READY') && (
            <button
              type="button"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source & Destination */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Locations</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-semibold text-foreground">{receipt.from || 'Vendor'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-semibold text-primary">{receipt.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Warehouse:</span>
              <span className="font-medium text-foreground">{receipt.warehouseName}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Contact */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span>Schedule & Contact</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scheduled Date:</span>
              <span className="font-semibold text-foreground">
                {new Date(receipt.scheduledAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supplier:</span>
              <span className="font-medium text-foreground">{receipt.supplierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Responsible:</span>
              <span className="font-mono text-muted-foreground">
                {receipt.responsible?.loginId || 'inventory01'}
              </span>
            </div>
          </div>
        </div>

        {/* Quantities summary */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 text-emerald-500" />
            <span>Receipt Summary</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Line Items:</span>
              <span className="font-semibold text-foreground">{receipt.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quantity:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalQuantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stock Status:</span>
              <span className="font-semibold text-foreground">
                {receipt.status === 'DONE' ? 'Credited to On-Hand' : 'Pending Receipt'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
          <Boxes className="h-4 w-4 text-emerald-500" />
          <span>Expected Line Items</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-right">Quantity Expected</th>
                <th className="py-2.5 px-3 text-right">Stock Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {receiptItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No line items recorded for this receipt.
                  </td>
                </tr>
              ) : (
                receiptItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-primary">
                      <span className="rounded bg-primary/10 px-2 py-0.5">{item.sku}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">{item.productName}</td>
                    <td className="py-3 px-3 text-right font-bold text-foreground text-sm">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {receipt.status === 'DONE' ? (
                        <span className="text-emerald-600 font-semibold">+{item.quantity} On Hand</span>
                      ) : (
                        <span className="text-muted-foreground">Pending Validation</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
