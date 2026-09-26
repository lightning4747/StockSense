import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/lib/api';
import { Warehouse } from '@/types/warehouse';
import { warehouseSchema, WarehouseFormData } from '@/schemas/warehouse';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  X,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const WarehousesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteTargetWh, setDeleteTargetWh] = useState<Warehouse | null>(null);

  // Fetch warehouses
  const { data: warehouses = [], isLoading, isError } = useQuery<Warehouse[]>({
    queryKey: ['warehouses', searchTerm],
    queryFn: async () => {
      const endpoint = searchTerm ? `/warehouses?search=${encodeURIComponent(searchTerm)}` : '/warehouses';
      const res = await apiClient<Warehouse[]>(endpoint);
      return res.data;
    },
  });

  // Form for create/edit
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormData) => {
      return apiClient<Warehouse>('/warehouses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse created successfully');
      handleCloseModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Failed to create warehouse');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WarehouseFormData }) => {
      return apiClient<Warehouse>(`/warehouses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse updated successfully');
      handleCloseModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Failed to update warehouse');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/warehouses/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Warehouse deactivated successfully');
      setDeleteTargetWh(null);
    },
    onError: (err: ApiError) => {
      // Soft-delete guard toast when deletion blocked
      toast.error(err.message || 'Cannot delete warehouse');
      setDeleteTargetWh(null);
    },
  });

  const handleOpenCreateModal = () => {
    setEditingWarehouse(null);
    reset({ name: '', shortCode: '', address: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setValue('name', wh.name);
    setValue('shortCode', wh.shortCode);
    setValue('address', wh.address || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    reset();
  };

  const onSubmit = (data: WarehouseFormData) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClick = (wh: Warehouse) => {
    if (wh.locationCount > 0) {
      toast.error(
        `Cannot delete "${wh.name}". It contains ${wh.locationCount} active storage location${wh.locationCount > 1 ? 's' : ''}.`
      );
      return;
    }
    setDeleteTargetWh(wh);
  };

  const confirmDelete = () => {
    if (deleteTargetWh) {
      deleteMutation.mutate(deleteTargetWh.id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Warehouses & Stores</h1>
          <p className="text-sm text-muted-foreground">
            Manage your physical distribution facilities and storage warehouses
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Add Warehouse</span>
        </Button>
      </div>

      {/* Search Input */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by warehouse name, short code (e.g. WH), or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Warehouse Directory</CardTitle>
              <CardDescription>
                {warehouses.length} {warehouses.length === 1 ? 'warehouse' : 'warehouses'} configured
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Warehouse Name</th>
                <th className="px-6 py-3.5">Short Code</th>
                <th className="px-6 py-3.5">Address</th>
                <th className="px-6 py-3.5">Storage Locations</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading warehouses...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                    <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                    Failed to load warehouses
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    No warehouses found. Click "Add Warehouse" to register one.
                  </td>
                </tr>
              ) : (
                warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{wh.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Added {wh.createdAt ? new Date(wh.createdAt).toLocaleDateString() : 'recently'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono font-bold tracking-wider text-xs">
                        {wh.shortCode}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs">
                      {wh.address ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{wh.address}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60 italic">No address provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/settings/warehouses/${wh.id}/locations`)}
                        className="group flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        title="View & manage locations in this warehouse"
                      >
                        <Badge
                          variant={wh.locationCount > 0 ? 'secondary' : 'outline'}
                          className="font-mono text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors cursor-pointer"
                        >
                          {wh.locationCount} {wh.locationCount === 1 ? 'Location' : 'Locations'}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(wh)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Warehouse"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(wh)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title={
                            wh.locationCount > 0
                              ? 'Cannot delete: Contains active locations'
                              : 'Deactivate Warehouse'
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Warehouse Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <h2 className="text-lg font-semibold text-foreground">
                {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="whName">Warehouse Name</Label>
                <Input
                  id="whName"
                  placeholder="e.g. Main Distribution Store"
                  autoFocus
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whShortCode">Short Code (2–6 chars)</Label>
                  <span className="text-[10px] text-muted-foreground">Used for reference numbers</span>
                </div>
                <Input
                  id="whShortCode"
                  placeholder="e.g. WH, PROD, HUB"
                  className="uppercase font-mono"
                  maxLength={6}
                  {...register('shortCode')}
                />
                {errors.shortCode && (
                  <p className="text-xs font-medium text-destructive">{errors.shortCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whAddress">Address / Location</Label>
                <Input
                  id="whAddress"
                  placeholder="e.g. Building B, Bay 4, Industrial Park"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs font-medium text-destructive">{errors.address.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingWarehouse ? (
                    'Save Changes'
                  ) : (
                    'Create Warehouse'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {deleteTargetWh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-destructive pb-3 border-b border-border/60">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Deactivate Warehouse</h2>
            </div>

            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to deactivate warehouse{' '}
              <span className="font-semibold text-foreground">"{deleteTargetWh.name}" [{deleteTargetWh.shortCode}]</span>?
              Historical documents referencing this warehouse will be preserved.
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTargetWh(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  'Deactivate'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
