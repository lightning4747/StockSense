import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { signupSchema, SignupFormData } from '@/schemas/auth';
import { useAuth } from './useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Boxes, Lock, Mail, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api';

export const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';

  const hasMinLength = passwordValue.length >= 9;
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passwordValue);

  const onSubmit = async (data: SignupFormData) => {
    setErrorMsg(null);
    try {
      await signup(data);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to create account. Please check your details.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 p-4 dark:bg-slate-950/50">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">StockSense IMS</h1>
          <p className="text-sm text-muted-foreground">Register a new warehouse user</p>
        </div>

        <Card className="border-border/60 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Enter details to get started with StockSense</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="loginId">Login ID (6–12 characters)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loginId"
                    placeholder="inventory01"
                    className="pl-9"
                    autoComplete="username"
                    {...register('loginId')}
                  />
                </div>
                {errors.loginId && (
                  <p className="text-xs font-medium text-destructive">{errors.loginId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="pl-9"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Strong@Password1"
                    className="pl-9"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive">{errors.password.message}</p>
                )}

                <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                    />
                    <span>9+ characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${hasUppercase ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                    />
                    <span>Uppercase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${hasLowercase ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                    />
                    <span>Lowercase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${hasSpecial ? 'text-emerald-500' : 'text-muted-foreground/40'}`}
                    />
                    <span>Special symbol</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
