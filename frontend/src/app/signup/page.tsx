"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { signupSchema } from '../../validations/auth';
import { Code, User, Mail, Lock, ShieldCheck, Sparkles, Loader } from 'lucide-react';

export default function SignupPage() {
  const { signup, currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError(null);
    
    // Validate inputs using Zod Schema
    const validation = signupSchema.safeParse({ name, email, password, confirmPassword });
    
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
      await signup(email, password, name);
      router.push('/dashboard');
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl flex flex-col gap-6 shadow-xl relative">
        {/* Top brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 text-indigo-400 font-bold text-xl">
            <Code className="h-7 w-7" />
            <span>GitAnalyzer</span>
          </Link>
          <h2 className="text-xl font-bold mt-2">Create your account</h2>
          <p className="text-xs text-muted">Join other developers auditing their repositories</p>
        </div>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {formErrors.name && (
              <span className="text-red-400 text-[10px]">{formErrors.name}</span>
            )}
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted">Password</label>
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

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            {formErrors.confirmPassword && (
              <span className="text-red-400 text-[10px]">{formErrors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-emerald-500/10 text-[10px] text-emerald-400/90 font-medium select-none">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>SSL End-to-End Encryption & PBKDF2 Password Hashing Active</span>
        </div>

        <div className="text-center text-xs text-muted border-t border-border/50 pt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
