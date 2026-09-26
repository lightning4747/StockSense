import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient, ApiError } from '@/lib/api';
import { Warehouse, Location } from '@/types/warehouse';
import { locationSchema, LocationFormData } from '@/schemas/warehouse';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  X,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export const LocationsPage: React.FC = () => {
  const { warehouseId } = useParams<{ warehouseId?: string }>();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteTargetLoc, setDeleteTargetLoc] = useState<Location | null>(null);

  // Fetch parent warehouse details if scoped to a warehouseId
  const { data: currentWarehouse } = useQuery<Warehouse>({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      if (!warehouseId) throw new Error('Warehouse ID required');
      const res = await apiClient<Warehouse>(`/warehouses/${warehouseId}`);
      return res.data;
    },
    enabled: Boolean(warehouseId),
  });

  // Fetch all warehouses for dropdown
  const { data: allWarehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const res = await apiClient<Warehouse[]>('/warehouses');
      return res.data;
    },
  });

  // Fetch locations
  const { data: locations = [], isLoading, isError } = useQuery<Location[]>({
    queryKey: ['locations', warehouseId, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (warehouseId) params.append('warehouseId', warehouseId);
      if (searchTerm) params.append('search', searchTerm);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient<Location[]>(`/locations${queryString}`);
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
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      warehouseId: warehouseId || '',
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: LocationFormData) => {
      return apiClient<Location>('/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Location created successfully');
      handleCloseModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Failed to create location');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LocationFormData> }) => {
      return apiClient<Location>(`/locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Location updated successfully');
      handleCloseModal();
    },
    onError: (err: ApiError) => {
      toast.error(err.message || 'Failed to update location');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient(`/locations/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Location removed successfully');
      setDeleteTargetLoc(null);
    },
    onError: (err: ApiError) => {
      // Soft-delete guard toast when deletion blocked
      toast.error(err.message || 'Cannot delete location');
      setDeleteTargetLoc(null);
    },
  });

  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    reset({
      name: '',
      shortCode: '',
      warehouseId: warehouseId || (allWarehouses[0]?.id ?? ''),
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setValue('name', loc.name);
    setValue('shortCode', loc.shortCode);
    setValue('warehouseId', loc.warehouseId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    reset();
  };

  const onSubmit = (data: LocationFormData) => {
    if (editingLocation) {
      updateMutation.mutate({
        id: editingLocation.id,
        data: { name: data.name, shortCode: data.shortCode },
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteClick = (loc: Location) => {
    if (loc.shortCode === 'STOCK') {
      toast.error(`Cannot delete location "${loc.name}". It contains active inventory stock.`);
      return;
    }
    setDeleteTargetLoc(loc);
  };

  const confirmDelete = () => {
    if (deleteTargetLoc) {
      deleteMutation.mutate(deleteTargetLoc.id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link to="/settings/warehouses" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Warehouses</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">
              {currentWarehouse ? currentWarehouse.name : 'All Locations'}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Storage Locations</span>
            {currentWarehouse && (
              <Badge variant="outline" className="font-mono text-xs">
                {currentWarehouse.shortCode}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentWarehouse
              ? `Configured storage racks, shelves, and receiving zones in ${currentWarehouse.name}`
              : 'Directory of all warehouse bins, racks, and receiving zones'}
          </p>
        </div>

        <Button onClick={handleOpenCreateModal} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </Button>
      </div>

      {/* Parent Warehouse Info Card if scoped */}
      {currentWarehouse && (
        <Card className="border-border/60 bg-muted/20 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground">{currentWarehouse.name}</div>
                <div className="text-xs text-muted-foreground">
                  {currentWarehouse.address || 'No address specified'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium">
                Short Code: <strong className="font-mono">{currentWarehouse.shortCode}</strong>
              </div>
              <div className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium">
                Total Locations: <strong className="text-primary">{locations.length}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search storage locations by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">Location List</CardTitle>
          <CardDescription>
            {locations.length} {locations.length === 1 ? 'storage zone' : 'storage zones'} registered
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5">Location Name</th>
                <th className="px-6 py-3.5">Location Code</th>
                <th className="px-6 py-3.5">Full System Path</th>
                <th className="px-6 py-3.5">Parent Warehouse</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                    Loading locations...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                    <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                    Failed to load locations
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    No locations found. Click "Add Location" to configure storage racks.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Layers className="h-4 w-4" />
                        </div>
                        <span>{loc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-mono text-xs">
                        {loc.shortCode}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">
                      {loc.warehouseShortCode}/{loc.shortCode}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{loc.warehouseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(loc)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit Location"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(loc)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title={
                            loc.shortCode === 'STOCK'
                              ? 'Cannot delete: Contains active inventory stock'
                              : 'Delete Location'
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

      {/* Create / Edit Location Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <h2 className="text-lg font-semibold text-foreground">
                {editingLocation ? 'Edit Location' : 'Add New Storage Location'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              {/* Warehouse selector (disabled if scoped from warehouse page) */}
              <div className="space-y-2">
                <Label htmlFor="warehouseId">Parent Warehouse</Label>
                <select
                  id="warehouseId"
                  disabled={Boolean(warehouseId && !editingLocation)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('warehouseId')}
                >
                  {allWarehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} [{wh.shortCode}]
                    </option>
                  ))}
                </select>
                {errors.warehouseId && (
                  <p className="text-xs font-medium text-destructive">{errors.warehouseId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="locName">Location Name</Label>
                <Input
                  id="locName"
                  placeholder="e.g. Shelf A1, Receiving Zone, Cold Room..."
                  autoFocus
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="locShortCode">Short Code (2–10 chars)</Label>
                  <span className="text-[10px] text-muted-foreground">Unique within warehouse</span>
                </div>
                <Input
                  id="locShortCode"
                  placeholder="e.g. STOCK, RACK_B, SHELF_1"
                  className="uppercase font-mono"
                  maxLength={10}
                  {...register('shortCode')}
                />
                {errors.shortCode && (
                  <p className="text-xs font-medium text-destructive">{errors.shortCode.message}</p>
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
                  ) : editingLocation ? (
                    'Save Changes'
                  ) : (
                    'Create Location'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {deleteTargetLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center gap-3 text-destructive pb-3 border-b border-border/60">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Delete Storage Location</h2>
            </div>

            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to remove storage location{' '}
              <span className="font-semibold text-foreground">"{deleteTargetLoc.name}" [{deleteTargetLoc.shortCode}]</span>?
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
              <Button
                variant="outline"
                onClick={() => setDeleteTargetLoc(null)}
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
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
