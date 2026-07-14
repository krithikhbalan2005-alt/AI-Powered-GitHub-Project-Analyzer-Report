"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { loginSchema } from '../../validations/auth';
import { Code, Mail, Lock, LogIn, Loader, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const { login, resetPassword, currentUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If logged in, redirect to dashboard
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate inputs
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'Incorrect email address or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!forgotEmail) {
      setSubmitError('Please enter your email address to reset your password.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setSubmitSuccess('Password reset link has been sent to your email. Check your inbox.');
      setIsForgotMode(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl flex flex-col gap-6 shadow-xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Code className="h-7 w-7" />
            <span>GitAnalyzer</span>
          </Link>
          <h2 className="text-xl font-bold mt-2">
            {isForgotMode ? 'Reset your password' : 'Sign in to your account'}
          </h2>
          <p className="text-xs text-muted">
            {isForgotMode
              ? 'We will email you link instructions to reset your password'
              : 'Enter your credentials to access your dashboard'}
          </p>
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg">
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-lg">
            {submitSuccess}
          </div>
        )}

        {!isForgotMode ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              {formErrors.email && (
                <span className="text-red-400 text-[10px]">{formErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              {formErrors.password && (
                <span className="text-red-400 text-[10px]">{formErrors.password}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Send Instructions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setSubmitError(null);
              }}
              className="w-full py-2 bg-transparent text-muted hover:text-text rounded-lg text-xs transition"
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="text-center text-xs text-muted border-t border-border/50 pt-4">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
