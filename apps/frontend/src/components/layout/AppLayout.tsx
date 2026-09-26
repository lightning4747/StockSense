import React from 'react';
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
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
    { label: 'Products', icon: Package, to: '/products' },
    { label: 'Stock Availability', icon: Layers, to: '/stock' },
    {
      group: 'Operations',
      items: [
        { label: 'Receipts', icon: ArrowDownLeft, to: '/operations/receipts' },
        { label: 'Deliveries', icon: ArrowUpRight, to: '/operations/deliveries' },
        { label: 'Transfers', icon: ArrowLeftRight, to: '/operations/transfers' },
        { label: 'Adjustments', icon: SlidersHorizontal, to: '/operations/adjustments' },
      ],
    },
    { label: 'Move History', icon: History, to: '/history' },
    { label: 'Settings', icon: Settings, to: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/70 bg-card">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-border/70 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Boxes className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-foreground">StockSense</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Inventory System
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <nav className="space-y-1">
            {navItems.map((item, idx) => {
              if ('group' in item && item.group) {
                return (
                  <div key={idx} className="pt-4">
                    <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                      {item.group}
                    </div>
                    <div className="space-y-1">
                      {item.items.map((subItem) => (
                        <NavLink
                          key={subItem.to}
                          to={subItem.to}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )
                          }
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                );
              }

              if ('to' in item && item.to && item.icon) {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )
                    }
                  >
                    <IconComponent className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }
              return null;
            })}
          </nav>
        </div>

        {/* Profile & Logout Section */}
        <div className="border-t border-border/70 p-4">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-xs uppercase">
                {user?.loginId?.slice(0, 2) || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-foreground">
                  {user?.loginId}
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{user?.email}</div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-card/80 px-8 backdrop-blur-md">
          <div className="text-sm font-medium text-muted-foreground">
            Warehouse Management Portal
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/profile"
              className="flex items-center gap-2 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>My Profile</span>
            </NavLink>
          </div>
        </header>

        {/* Page Content View */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
