import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPlaceholder } from '@/features/dashboard/DashboardPlaceholder';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { CategoriesPage } from '@/features/settings/CategoriesPage';
import { WarehousesPage } from '@/features/settings/WarehousesPage';
import { LocationsPage } from '@/features/settings/LocationsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <DashboardPlaceholder />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          {
            path: '/products',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                <p className="text-sm text-muted-foreground">Product catalog and inventory status</p>
              </div>
            ),
          },
          {
            path: '/stock',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Stock Availability</h1>
                <p className="text-sm text-muted-foreground">Multi-warehouse inventory levels and reservations</p>
              </div>
            ),
          },
          {
            path: '/operations/receipts',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Incoming Receipts</h1>
                <p className="text-sm text-muted-foreground">Receive goods from vendor shipments</p>
              </div>
            ),
          },
          {
            path: '/operations/deliveries',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Delivery Orders</h1>
                <p className="text-sm text-muted-foreground">Fulfill outgoing customer shipments</p>
              </div>
            ),
          },
          {
            path: '/operations/transfers',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Internal Transfers</h1>
                <p className="text-sm text-muted-foreground">Move inventory between locations and warehouses</p>
              </div>
            ),
          },
          {
            path: '/operations/adjustments',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Inventory Adjustments</h1>
                <p className="text-sm text-muted-foreground">Physical count reconciliation and scrap adjustments</p>
              </div>
            ),
          },
          {
            path: '/history',
            element: (
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Move History</h1>
                <p className="text-sm text-muted-foreground">Immutable stock ledger movements log</p>
              </div>
            ),
          },
          {
            path: '/settings',
            element: <Navigate to="/settings/warehouses" replace />,
          },
          {
            path: '/settings/warehouses',
            element: <WarehousesPage />,
          },
          {
            path: '/settings/warehouses/:warehouseId/locations',
            element: <LocationsPage />,
          },
          {
            path: '/settings/locations',
            element: <LocationsPage />,
          },
          {
            path: '/settings/categories',
            element: <CategoriesPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
