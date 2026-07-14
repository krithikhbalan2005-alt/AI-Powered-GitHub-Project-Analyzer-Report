"use client";

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Sparkles, BookOpen, FileCheck, ArrowRight, Github, Code, Rocket, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col gap-20 py-8 md:py-16">
      {/* Hero Section */}
      <section className="relative text-center flex flex-col items-center gap-6 max-w-4xl mx-auto px-4">
        {/* Glow Element */}
        <div className="absolute top-0 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-border text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Gen GitHub Auditor</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Supercharge Your Portfolio. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            Deploy with Confidence.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted max-w-2xl">
          Evaluate public repositories for structural design, README documentation details, deployment profiles, and security configurations. Get instant AI suggestions and resume bullet points.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow shadow-indigo-600/30 w-full sm:w-auto"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow shadow-indigo-600/30 w-full sm:w-auto"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold bg-slate-900 border border-border hover:bg-slate-800 text-text rounded-xl transition w-full sm:w-auto"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 glow-card">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Code className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Static Code Auditing</h3>
          <p className="text-sm text-muted">
            Scans folder layout structures, configuration details, lockfiles, and codebase organization to flag code quality issues.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 glow-card">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Rocket className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Hosting & Deploy Checks</h3>
          <p className="text-sm text-muted">
            Detects frameworks and dependencies to recommend hosting environments (Vercel, Render), mapping setup instructions.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 glow-card">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">AI Technical Mentorship</h3>
          <p className="text-sm text-muted">
            Translates metrics into actionable optimization tips, portfolio outlines, and resume bullet points using the Gemini API.
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="flex flex-col gap-12 max-w-5xl mx-auto w-full">
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="text-sm text-muted">Three simple steps to audit your repository and optimize your portfolio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-border flex items-center justify-center text-indigo-400 font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-base">Paste Repository Link</h4>
            <p className="text-xs text-muted max-w-xs">
              Input any public GitHub repository URL into the analysis scanner. No code is executed or cloned.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-border flex items-center justify-center text-purple-400 font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-base">Wait for Scan</h4>
            <p className="text-xs text-muted max-w-xs">
              The engine queries GitHub to check structure files, README documentation parameters, and config safety details.
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-border flex items-center justify-center text-blue-400 font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-base">Review Insights & Report</h4>
            <p className="text-xs text-muted max-w-xs">
              Download a comprehensive, recruiter-ready PDF report, view portfolio metrics, and copy customized CV points.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="glass-panel p-8 md:p-12 rounded-3xl text-center relative overflow-hidden flex flex-col items-center gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none" />
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ready to Audit Your Codebases?</h2>
        <p className="text-sm text-muted max-w-xl">
          Join freshers and students auditing their repos for placement readiness. Ensure your projects are secure, organized, and properly documented.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition shadow shadow-indigo-600/30"
        >
          <span>Create Free Account</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
