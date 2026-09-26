import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import {
  Boxes,
  LayoutDashboard,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  Tag,
  LogOut,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isOperationsOpen, setIsOperationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const productsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const operationsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const settingsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnterProducts = () => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    setIsProductsOpen(true);
  };
  const handleMouseLeaveProducts = () => {
    productsTimeoutRef.current = setTimeout(() => setIsProductsOpen(false), 200);
  };

  const handleMouseEnterOperations = () => {
    if (operationsTimeoutRef.current) clearTimeout(operationsTimeoutRef.current);
    setIsOperationsOpen(true);
  };
  const handleMouseLeaveOperations = () => {
    operationsTimeoutRef.current = setTimeout(() => setIsOperationsOpen(false), 200);
  };

  const handleMouseEnterSettings = () => {
    if (settingsTimeoutRef.current) clearTimeout(settingsTimeoutRef.current);
    setIsSettingsOpen(true);
  };
  const handleMouseLeaveSettings = () => {
    settingsTimeoutRef.current = setTimeout(() => setIsSettingsOpen(false), 200);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR (Exact per wireframe.md Navigation specification)     */}
      {/* 1. Products | 2. Operations | 4. Move History | 5. Dashboard | 6. Setting */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Left Brand + Main Top Navigation Links */}
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-bold tracking-tight text-foreground flex items-center gap-1.5 text-base">
                  <span>StockSense</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">IMS</span>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Inventory System
                </div>
              </div>
            </NavLink>

            {/* Top Navigation Menu */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* 5. Dashboard */}
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>

              {/* 1. Products (Dropdown: Create/Update, Stock Availability, Categories, Reordering Rules) */}
              <div
                className="relative py-2"
                onMouseEnter={handleMouseEnterProducts}
                onMouseLeave={handleMouseLeaveProducts}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isProductsOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {isProductsOpen && (
                  <div className="absolute left-0 top-full pt-1 w-56 z-50 animate-in fade-in zoom-in-95">
                    <div className="rounded-xl border border-border bg-card p-1.5 shadow-xl">
                      <NavLink
                        to="/products"
                        onClick={() => setIsProductsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Package className="h-4 w-4 text-primary" />
                        <div>
                          <div>Products Catalog</div>
                          <div className="text-[10px] text-muted-foreground">Create & update products</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/stock"
                        onClick={() => setIsProductsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Layers className="h-4 w-4 text-blue-500" />
                        <div>
                          <div>Stock Availability</div>
                          <div className="text-[10px] text-muted-foreground">Per location & warehouse</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/settings/categories"
                        onClick={() => setIsProductsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Tag className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div>Product Categories</div>
                          <div className="text-[10px] text-muted-foreground">Manage category groups</div>
                        </div>
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Operations (Dropdown: Receipts, Deliveries, Internal Transfers, Adjustments) */}
              <div
                className="relative py-2"
                onMouseEnter={handleMouseEnterOperations}
                onMouseLeave={handleMouseLeaveOperations}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isOperationsOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Operations</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {isOperationsOpen && (
                  <div className="absolute left-0 top-full pt-1 w-64 z-50 animate-in fade-in zoom-in-95">
                    <div className="rounded-xl border border-border bg-card p-1.5 shadow-xl">
                      <NavLink
                        to="/operations/receipts"
                        onClick={() => setIsOperationsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div>Receipts (Incoming Stock)</div>
                          <div className="text-[10px] text-muted-foreground">Vendor delivery receipts</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/operations/deliveries"
                        onClick={() => setIsOperationsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        <div>
                          <div>Delivery Orders (Outgoing Stock)</div>
                          <div className="text-[10px] text-muted-foreground">Customer shipments</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/operations/transfers"
                        onClick={() => setIsOperationsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <ArrowLeftRight className="h-4 w-4 text-purple-500" />
                        <div>
                          <div>Internal Transfers</div>
                          <div className="text-[10px] text-muted-foreground">Move between racks/warehouses</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/operations/adjustments"
                        onClick={() => setIsOperationsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                        <div>
                          <div>Inventory Adjustment</div>
                          <div className="text-[10px] text-muted-foreground">Physical count reconciliation</div>
                        </div>
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Move History */}
              <NavLink
                to="/history"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <History className="h-4 w-4" />
                <span>Move History</span>
              </NavLink>

              {/* 6. Setting (Warehouse) */}
              <div
                className="relative py-2"
                onMouseEnter={handleMouseEnterSettings}
                onMouseLeave={handleMouseLeaveSettings}
              >
                <button
                  type="button"
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isSettingsOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Setting</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {isSettingsOpen && (
                  <div className="absolute left-0 top-full pt-1 w-52 z-50 animate-in fade-in zoom-in-95">
                    <div className="rounded-xl border border-border bg-card p-1.5 shadow-xl">
                      <NavLink
                        to="/settings/warehouses"
                        onClick={() => setIsSettingsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <div>Warehouse</div>
                          <div className="text-[10px] text-muted-foreground">Warehouses & Locations</div>
                        </div>
                      </NavLink>
                      <NavLink
                        to="/settings/categories"
                        onClick={() => setIsSettingsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <Tag className="h-4 w-4 text-emerald-500" />
                        <div>
                          <div>Categories</div>
                          <div className="text-[10px] text-muted-foreground">Product categories</div>
                        </div>
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Header: Search + Notifications + Profile Menu */}
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="SKU search & smart filters..."
                className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
              />
            </div>

            <button
              type="button"
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </button>

            <div className="h-6 w-px bg-border/80" />

            {/* Profile Dropdown Menu: My Profile & Logout */}
            <div className="flex items-center gap-2">
              <NavLink
                to="/profile"
                className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                  {user?.loginId?.slice(0, 2) || 'US'}
                </div>
                <span className="hidden sm:inline font-semibold">{user?.loginId}</span>
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
