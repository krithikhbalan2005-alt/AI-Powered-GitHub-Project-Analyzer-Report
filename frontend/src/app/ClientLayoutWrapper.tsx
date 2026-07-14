"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Code, History, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // If path is login, signup, or landing, we might want different layouts, 
  // but showing a clean header is fine.
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'History', icon: History },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      {!isAuthPage && (
        <header className="border-b border-border bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-indigo-400 font-bold text-lg hover:text-indigo-300 transition">
              <Code className="h-6 w-6" />
              <span>GitAnalyzer</span>
            </Link>

            {currentUser ? (
              <nav className="flex items-center gap-1 sm:gap-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : 'text-muted hover:text-text hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{link.label}</span>
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      pathname === '/admin'
                        ? 'bg-purple-500/10 text-purple-400'
                        : 'text-muted hover:text-text hover:bg-slate-900'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <div className="h-6 w-px bg-border mx-1 sm:mx-2" />

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden md:flex flex-col items-end text-xs">
                    <span className="font-semibold text-text">{userProfile?.name}</span>
                    <span className="text-muted capitalize">{userProfile?.role}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg transition"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </nav>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-muted hover:text-text transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow shadow-indigo-600/30"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      {!isAuthPage && (
        <footer className="border-t border-border bg-slate-950 py-6 text-center text-xs text-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} GitAnalyzer. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="hover:underline hover:text-text">Documentation</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline hover:text-text">GitHub</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
