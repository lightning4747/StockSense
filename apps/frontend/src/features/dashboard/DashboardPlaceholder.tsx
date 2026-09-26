import React from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, XCircle } from 'lucide-react';

export const DashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();

  const mockKpis = [
    { title: 'Total Products in Stock', value: '1,250', icon: Package, color: 'text-primary' },
    { title: 'Low Stock Items', value: '12', icon: AlertTriangle, color: 'text-amber-500' },
    { title: 'Out of Stock Items', value: '4', icon: XCircle, color: 'text-destructive' },
    { title: 'Pending Receipts', value: '4', icon: ArrowDownLeft, color: 'text-emerald-500' },
    { title: 'Pending Deliveries', value: '4', icon: ArrowUpRight, color: 'text-blue-500' },
    { title: 'Scheduled Transfers', value: '3', icon: ArrowLeftRight, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.loginId} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here is a high-level snapshot of your warehouse inventory operations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockKpis.map((kpi, idx) => (
          <Card key={idx} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Authentication Verified</CardTitle>
          <CardDescription>
            You are securely authenticated as <span className="font-semibold text-foreground">{user?.email}</span> (ID: {user?.loginId}).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
