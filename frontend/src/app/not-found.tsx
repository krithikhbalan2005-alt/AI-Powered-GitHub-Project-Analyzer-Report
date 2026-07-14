"use client";

import Link from 'next/link';
import { Terminal, Home, CornerDownRight, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="glass-panel w-full max-w-lg p-8 rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 animate-bounce" />
          <span>EXCEPTION_HANDLER</span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-black text-text">404: Branch Not Found</h1>
          <p className="text-sm text-muted">
            The page you are trying to pull does not exist in our remote ref list. It might have been deleted, or the route changed.
          </p>
        </div>

        {/* Code Block Mockup */}
        <div className="bg-slate-950 p-4 rounded-xl border border-border/80 font-mono text-xs flex flex-col gap-1 text-muted">
          <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 mb-2 text-[10px] uppercase font-bold text-muted">
            <Terminal className="h-3.5 w-3.5" />
            <span>Console output</span>
          </div>
          <p><span className="text-red-400">$</span> git checkout page-route</p>
          <p className="text-red-400">error: pathspec &apos;page-route&apos; did not match any file(s) known to git</p>
          <p className="text-indigo-400">status: terminated with exit code 404</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 border border-border hover:bg-slate-800 text-muted hover:text-text rounded-lg text-xs transition"
          >
            <CornerDownRight className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
