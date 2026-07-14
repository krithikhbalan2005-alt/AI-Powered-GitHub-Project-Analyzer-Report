"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AnalysisRecord } from '../../types';
import {
  Search,
  PlusCircle,
  GitBranch,
  Star,
  Activity,
  Award,
  Sparkles,
  PlayCircle,
  AlertCircle,
  Trash2,
  Eye,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser, getIdToken, userProfile, refreshProfile } = useAuth();
  const router = useRouter();

  const [repoUrl, setRepoUrl] = useState('');
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Stages for the analysis animation
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const stages = [
    'Parsing repository URL & verifying parameters...',
    'Downloading repository tree from GitHub...',
    'Scanning files for technologies and languages...',
    'Analyzing code organization & directory separation...',
    'Auditing safety setups and committed secrets...',
    'Evaluating README documentation guidelines...',
    'Calculating deterministic score matrix...',
    'Querying Gemini AI for mentor recommendations...',
    'Completing report & saving configurations...'
  ];

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Auth loading state helper
  const authLoading = !currentUser && userProfile === null;

  // Fetch previous analyses history
  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      setLoadingHistory(true);
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/analyses?limit=10&page=1`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setAnalyses(resData.data.analyses || []);
      }
    } catch (err) {
      console.error('Failed to load analysis logs history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser]);

  // Stage simulation logic when analyzing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analyzing) {
      interval = setInterval(() => {
        setCurrentStageIndex((prev) => {
          if (prev < stages.length - 1) return prev + 1;
          return prev; // hold at last step until HTTP completes
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [analyzing, stages.length]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setCurrentStageIndex(0);

    try {
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ repositoryUrl: repoUrl })
      });

      const resData = await response.json();

      if (resData.success) {
        // Refresh local details and redirect
        await fetchHistory();
        await refreshProfile();
        setRepoUrl('');
        router.push(`/analyses/${resData.data.id}`);
      } else {
        setAnalysisError(resData.message || 'Analysis run failed.');
        setAnalyzing(false);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setAnalysisError('Network exception running analysis. Make sure the server is online.');
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this analysis? This will remove all records and stored PDFs.')) return;

    try {
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/analyses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setAnalyses(prev => prev.filter(item => item.id !== id));
        await refreshProfile();
      } else {
        alert(resData.message || 'Delete failed.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete.');
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

  // Stats calculators
  const totalChecks = userProfile?.totalAnalyses || analyses.length;
  const completedScans = analyses.filter(a => a.status === 'completed');
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((sum, current) => sum + current.scores.overall, 0) / completedScans.length)
    : 0;
  const deployReadyCount = completedScans.filter(a => a.deployment.ready).length;

  return (
    <div className="flex flex-col gap-10 py-4">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {userProfile?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Submit a public GitHub repository link below to run quality and deployment checks.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted bg-slate-900 px-3 py-1.5 rounded-lg border border-border">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span>Server Engine Online</span>
        </div>
      </div>

      {/* Analysis form / loading state */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl glow-card relative overflow-hidden">
        {analyzing ? (
          /* ACTIVE SCANNING SCREEN */
          <div className="flex flex-col items-center py-8 gap-6 text-center max-w-lg mx-auto">
            <Loader className="h-10 w-10 text-indigo-400 animate-spin" />
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-bold">Analyzing GitHub Repository</h3>
              <p className="text-xs text-indigo-400 font-semibold">{stages[currentStageIndex]}</p>
            </div>
            
            {/* Visual Progress Steps */}
            <div className="w-full bg-slate-900 border border-border/80 rounded-xl p-4 flex flex-col items-start text-xs text-muted gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${currentStageIndex >= 2 ? 'text-green-400' : 'text-muted animate-pulse'}`} />
                <span>Fetch and read files metadata</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${currentStageIndex >= 5 ? 'text-green-400' : currentStageIndex >= 2 ? 'text-indigo-400 animate-pulse' : 'text-muted'}`} />
                <span>Static stack and structure checks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${currentStageIndex >= 7 ? 'text-green-400' : currentStageIndex >= 5 ? 'text-indigo-400 animate-pulse' : 'text-muted'}`} />
                <span>Run scoring calculations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`h-4 w-4 ${currentStageIndex >= 8 ? 'text-green-400' : currentStageIndex >= 7 ? 'text-indigo-400 animate-pulse' : 'text-muted'}`} />
                <span>Query Gemini AI recommendations</span>
              </div>
            </div>
            <p className="text-[10px] text-muted max-w-xs">This process takes roughly 5 seconds. Please do not close or reload this browser page.</p>
          </div>
        ) : (
          /* SUBMIT INPUT SCREEN */
          <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-400" />
              <span>Audit New Repository</span>
            </h3>

            {analysisError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-border pl-11 pr-4 py-3 rounded-xl text-sm placeholder-muted focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={!repoUrl.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow shadow-indigo-600/25"
              >
                <PlayCircle className="h-4.5 w-4.5" />
                <span>Run Audit</span>
              </button>
            </div>
            <span className="text-[10px] text-muted">Supports public GitHub URL forms (e.g. github.com/owner/repo or https://github.com/owner/repo.git)</span>
          </form>
        )}
      </div>

      {/* Analytics stats dashboard */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total analyses */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-indigo-500 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">Total Analyses</span>
            <span className="text-2xl font-black">{totalChecks}</span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <GitBranch className="h-6 w-6" />
          </div>
        </div>

        {/* Avg score */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-purple-500 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">Average Score</span>
            <span className="text-2xl font-black">{avgScore}/100</span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Deploy ready */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-l-blue-500 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted tracking-wider uppercase">Deployment Ready</span>
            <span className="text-2xl font-black">{deployReadyCount} Projects</span>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Recent analyses list */}
      <section className="flex flex-col gap-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" />
          <span>Recent Audits</span>
        </h3>

        {loadingHistory ? (
          /* SKELETON LOADING */
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-900/50 border border-border/80 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : analyses.length === 0 ? (
          /* EMPTY STATE */
          <div className="glass-panel py-12 px-6 rounded-2xl text-center flex flex-col items-center gap-4 max-w-md mx-auto w-full">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-border flex items-center justify-center text-muted">
              <Search className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-sm">No repository audits yet</h4>
              <p className="text-xs text-muted">Enter a repository link in the form above to trigger your first quality audit scan.</p>
            </div>
          </div>
        ) : (
          /* DATA LIST */
          <div className="flex flex-col gap-3">
            {analyses.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/analyses/${item.id}`}
                className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/80 transition group border border-border/85"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-950 border border-border flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                    {item.repository.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-text group-hover:text-indigo-400 transition flex items-center gap-1">
                      <span>{item.repository.fullName}</span>
                      {item.repository.visibility === 'private' && (
                        <span className="text-[10px] bg-slate-900 border border-border text-muted px-1.5 py-0.5 rounded uppercase">Private</span>
                      )}
                    </h4>
                    <p className="text-xs text-muted flex items-center gap-2">
                      <span className="capitalize">{item.detectedStack.languages[0] || 'Unknown Lang'}</span>
                      <span>•</span>
                      <span>Audited on {new Date(item.createdAt?._seconds ? item.createdAt._seconds * 1000 : item.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-border/50 pt-2.5 sm:pt-0">
                  {/* Score */}
                  <div className="flex flex-col items-start sm:items-end text-xs">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Score</span>
                    <span className="font-black text-indigo-400 text-sm">{item.scores?.overall || 0}/100</span>
                  </div>

                  {/* Deploy status */}
                  <div className="flex flex-col items-start sm:items-end text-xs">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Status</span>
                    {item.status === 'completed' ? (
                      item.deployment?.ready ? (
                        <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                      ) : (
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">Not Ready</span>
                      )
                    ) : (
                      <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">Failed</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Delete log"
                      className="p-2 text-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg transition"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                    <ChevronRight className="h-5 w-5 text-muted group-hover:text-text transition hidden sm:inline" />
                  </div>
                </div>
              </Link>
            ))}
            
            {analyses.length > 5 && (
              <Link href="/history" className="text-center text-xs text-indigo-400 hover:underline mt-1">
                View all previous audits ({analyses.length})
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// Simple loader helper inline
function Loader(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
