import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  passwordResetSchema,
  PasswordResetRequestFormData,
  PasswordResetVerifyFormData,
  PasswordResetFormData,
} from '@/schemas/auth';
import { apiClient, ApiError } from '@/lib/api';
import { PasswordResetVerifyResponse } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Boxes, Mail, KeyRound, Lock, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'request' | 'verify' | 'reset';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1 Form
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest, isSubmitting: isSubmittingRequest },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  // Step 2 Form
  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify, isSubmitting: isSubmittingVerify },
  } = useForm<PasswordResetVerifyFormData>({
    resolver: zodResolver(passwordResetVerifySchema),
  });

  // Step 3 Form
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset, isSubmitting: isSubmittingReset },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onRequestSubmit = async (data: PasswordResetRequestFormData) => {
    setErrorMsg(null);
    try {
      await apiClient('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setEmail(data.email);
      setStep('verify');
      toast.success('If the account exists, an OTP has been sent.');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to process request');
      }
    }
  };

  const onVerifySubmit = async (data: PasswordResetVerifyFormData) => {
    setErrorMsg(null);
    try {
      const res = await apiClient<PasswordResetVerifyResponse>('/auth/password-reset/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp: data.otp }),
      });
      setResetToken(res.data.resetToken);
      setStep('reset');
      toast.success('OTP verified. Please enter your new password.');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Invalid or expired OTP');
      }
    }
  };

  const onResetSubmit = async (data: PasswordResetFormData) => {
    setErrorMsg(null);
    try {
      await apiClient('/auth/password-reset', {
        method: 'POST',
        body: JSON.stringify({
          resetToken,
          newPassword: data.newPassword,
        }),
      });
      toast.success('Password updated successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to update password');
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
          <p className="text-sm text-muted-foreground">Account recovery</p>
        </div>

        <Card className="border-border/60 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <CardTitle className="text-xl">
                {step === 'request' && 'Reset Password'}
                {step === 'verify' && 'Verify OTP'}
                {step === 'reset' && 'Set New Password'}
              </CardTitle>
            </div>
            <CardDescription>
              {step === 'request' && 'Enter your registered email address to receive an OTP code.'}
              {step === 'verify' && `Enter the 6-digit OTP code sent to ${email}`}
              {step === 'reset' && 'Create a new strong password for your account.'}
            </CardDescription>
          </CardHeader>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mx-6 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST */}
          {step === 'request' && (
            <form onSubmit={handleSubmitRequest(onRequestSubmit)}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Registered Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      className="pl-9"
                      {...registerRequest('email')}
                    />
                  </div>
                  {errorsRequest.email && (
                    <p className="text-xs font-medium text-destructive">
                      {errorsRequest.email.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}

          {/* STEP 2: VERIFY */}
          {step === 'verify' && (
            <form onSubmit={handleSubmitVerify(onVerifySubmit)}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      placeholder="123456"
                      maxLength={6}
                      className="pl-9 tracking-widest font-mono text-base"
                      {...registerVerify('otp')}
                    />
                  </div>
                  {errorsVerify.otp && (
                    <p className="text-xs font-medium text-destructive">{errorsVerify.otp.message}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmittingVerify}>
                  {isSubmittingVerify ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change email address
                </button>
              </CardFooter>
            </form>
          )}

          {/* STEP 3: RESET */}
          {step === 'reset' && (
            <form onSubmit={handleSubmitReset(onResetSubmit)}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="NewStrong@Password1"
                      className="pl-9"
                      {...registerReset('newPassword')}
                    />
                  </div>
                  {errorsReset.newPassword && (
                    <p className="text-xs font-medium text-destructive">
                      {errorsReset.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="NewStrong@Password1"
                      className="pl-9"
                      {...registerReset('confirmPassword')}
                    />
                  </div>
                  {errorsReset.confirmPassword && (
                    <p className="text-xs font-medium text-destructive">
                      {errorsReset.confirmPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmittingReset}>
                  {isSubmittingReset ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
