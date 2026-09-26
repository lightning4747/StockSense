import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { CategoriesPage } from '@/features/settings/CategoriesPage';
import { WarehousesPage } from '@/features/settings/WarehousesPage';
import { LocationsPage } from '@/features/settings/LocationsPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { ProductCreatePage } from '@/features/products/ProductCreatePage';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';
import { ReceiptsPage } from '@/features/receipts/ReceiptsPage';
import { ReceiptCreatePage } from '@/features/receipts/ReceiptCreatePage';
import { ReceiptDetailPage } from '@/features/receipts/ReceiptDetailPage';
import { StockPage } from '@/features/stock/StockPage';
import { DeliveriesPage } from '@/features/deliveries/DeliveriesPage';
import { DeliveryCreatePage } from '@/features/deliveries/DeliveryCreatePage';
import { DeliveryDetailPage } from '@/features/deliveries/DeliveryDetailPage';
import { TransfersPage } from '@/features/transfers/TransfersPage';
import { TransferCreatePage } from '@/features/transfers/TransferCreatePage';
import { TransferDetailPage } from '@/features/transfers/TransferDetailPage';
import { AdjustmentsPage } from '@/features/adjustments/AdjustmentsPage';
import { AdjustmentCreatePage } from '@/features/adjustments/AdjustmentCreatePage';
import { HistoryPage } from '@/features/history/HistoryPage';

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
            element: <DashboardPage />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
          {
            path: '/products',
            element: <ProductsPage />,
          },
          {
            path: '/products/new',
            element: <ProductCreatePage />,
          },
          {
            path: '/products/:productId',
            element: <ProductDetailPage />,
          },
          {
            path: '/stock',
            element: <StockPage />,
          },
          {
            path: '/operations/receipts',
            element: <ReceiptsPage />,
          },
          {
            path: '/operations/receipts/new',
            element: <ReceiptCreatePage />,
          },
          {
            path: '/operations/receipts/:receiptId',
            element: <ReceiptDetailPage />,
          },
          {
            path: '/operations/deliveries',
            element: <DeliveriesPage />,
          },
          {
            path: '/operations/deliveries/new',
            element: <DeliveryCreatePage />,
          },
          {
            path: '/operations/deliveries/:deliveryId',
            element: <DeliveryDetailPage />,
          },
          {
            path: '/operations/transfers',
            element: <TransfersPage />,
          },
          {
            path: '/operations/transfers/new',
            element: <TransferCreatePage />,
          },
          {
            path: '/operations/transfers/:transferId',
            element: <TransferDetailPage />,
          },
          {
            path: '/operations/adjustments',
            element: <AdjustmentsPage />,
          },
          {
            path: '/operations/adjustments/new',
            element: <AdjustmentCreatePage />,
          },
          {
            path: '/history',
            element: <HistoryPage />,
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
