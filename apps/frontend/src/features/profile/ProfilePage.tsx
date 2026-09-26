import React from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User, Mail, Calendar, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
          <CardDescription>Details associated with your warehouse staff ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Login ID</div>
              <div className="text-sm font-semibold">{user?.loginId}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Email Address</div>
              <div className="text-sm font-semibold">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">Account Status</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Active & Verified
              </div>
            </div>
          </div>

          {user?.createdAt && (
            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Member Since</div>
                <div className="text-sm font-semibold">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
