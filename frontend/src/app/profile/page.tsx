"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfileSchema } from '../../validations/auth';
import {
  User,
  Mail,
  Shield,
  BarChart,
  Save,
  CheckCircle,
  Loader,
  Camera,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, getIdToken, userProfile, refreshProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powered-git-hub-project-analyzer-fawn.vercel.app/api';

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const authLoading = !currentUser && userProfile === null;

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setPhotoURL(userProfile.photoURL || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate inputs with Zod
    const validation = updateProfileSchema.safeParse({ name, photoURL: photoURL || null });
    
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
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, photoURL: photoURL || null })
      });
      const resData = await response.json();
      if (resData.success) {
        setSubmitSuccess('Profile updated successfully!');
        await refreshProfile();
      } else {
        setSubmitError(resData.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setSubmitError('Network failure updating profile settings.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-sm text-muted">Securing workspace session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Account Profile</h1>
        <p className="text-xs sm:text-sm text-muted">Update your display information and inspect account metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl glow-card flex flex-col gap-6 h-fit">
          <h3 className="text-base font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Profile Details</span>
          </h3>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted">Display Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              {formErrors.name && (
                <span className="text-red-400 text-[10px]">{formErrors.name}</span>
              )}
            </div>

            {/* Email (Readonly) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted">Email Address (Read-only)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  value={userProfile?.email}
                  readOnly
                  disabled
                  className="w-full bg-slate-950/60 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-muted cursor-not-allowed"
                />
              </div>
            </div>

            {/* Photo URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted">Profile Avatar Link (optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
                  <Camera className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  value={photoURL}
                  onChange={e => setPhotoURL(e.target.value)}
                  className="w-full bg-slate-900 border border-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-text focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              {formErrors.photoURL && (
                <span className="text-red-400 text-[10px]">{formErrors.photoURL}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 text-white font-semibold rounded-lg text-xs transition flex items-center justify-center gap-2 w-fit"
            >
              {loading ? (
                <Loader className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Save className="h-4.5 w-4.5" />
              )}
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* Stats Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-400" />
              <span>Statistics Summary</span>
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-border/40">
                <span className="text-muted">Total Audits Run</span>
                <span className="font-extrabold text-text">{userProfile?.totalAnalyses || 0} runs</span>
              </div>
              
              <div className="flex items-center justify-between text-xs pb-3 border-b border-border/40">
                <span className="text-muted">Verification Clearance</span>
                <span className="font-extrabold text-indigo-400 uppercase">{userProfile?.role}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Registered At</span>
                <span className="font-extrabold text-text">Active developer</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span>Developer Integrity</span>
            </h4>
            <p className="text-[10px] text-muted leading-relaxed">
              System access roles default to standard developer. Mentor roles provide access to audit comment logs and admin settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
