"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { AnalysisRecord } from '../../../types';
import {
  ArrowLeft,
  Download,
  Trash2,
  Calendar,
  Star,
  GitFork,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  ExternalLink,
  Cpu,
  BookOpen,
  CloudLightning,
  Sparkles,
  Loader,
  Terminal,
  Layers,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function AnalysisDetailPage() {
  const { id } = useParams() as { id: string };
  const { currentUser, getIdToken, refreshProfile } = useAuth();
  const router = useRouter();

  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // PDF download trigger loading
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'codebase' | 'readme' | 'deployment'>('overview');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/analyses/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setRecord(resData.data);
      } else {
        setErrorMsg(resData.message || 'Failed to fetch analysis details.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load analysis due to a network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && id) {
      fetchAnalysis();
    }
  }, [currentUser, id]);

  const handleDelete = async () => {
    if (!record) return;
    if (!confirm('Are you sure you want to delete this analysis? This action is permanent.')) return;

    try {
      const token = await getIdToken();
      const response = await fetch(`${apiBaseUrl}/analyses/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        await refreshProfile();
        router.push('/dashboard');
      } else {
        alert(resData.message || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!record) return;
    setDownloadingPdf(true);

    try {
      const token = await getIdToken();
      
      // 1. First, check if PDF is already generated on Firebase Storage
      let downloadUrl = record.pdf?.downloadUrl;

      if (!record.pdf?.generated || !downloadUrl) {
        // PDF not generated yet, trigger creation
        const generateResponse = await fetch(`${apiBaseUrl}/analyses/${record.id}/report`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const genData = await generateResponse.json();
        if (genData.success) {
          downloadUrl = genData.data.downloadUrl;
        } else {
          throw new Error(genData.message || 'Failed to compile report.');
        }
      } else {
        // PDF is generated, fetch an active refreshed signed URL
        const refreshResponse = await fetch(`${apiBaseUrl}/analyses/${record.id}/report`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          downloadUrl = refreshData.data.downloadUrl;
        }
      }

      if (downloadUrl) {
        // Trigger download
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.target = '_blank';
        a.download = `github-analysis-${record.repository.owner}-${record.repository.name}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'PDF download failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-sm text-muted">Retrieving codebase logs...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !record) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-panel max-w-md p-8 rounded-2xl text-center flex flex-col items-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <h3 className="text-lg font-bold">Analysis Log Error</h3>
          <p className="text-xs text-muted">{errorMsg || 'Analysis record could not be loaded.'}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-900 border border-border text-xs rounded-lg hover:bg-slate-800 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { repository, scores, checks, missingFiles, issues, aiSuggestions, deployment, summary, resumePoint, portfolioDescription } = record;

  // Grade color map
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 border-green-500/30 bg-green-500/5';
    if (score >= 75) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5';
    if (score >= 60) return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
    if (score >= 40) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-red-400 border-red-500/30 bg-red-500/5';
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted hover:text-text transition">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-lg text-xs font-semibold transition"
          >
            {downloadingPdf ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export PDF Report</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-border text-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg text-xs transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Log</span>
          </button>
        </div>
      </div>

      {/* Repo title details banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text">
              {repository.fullName}
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold border border-border bg-slate-950 text-muted px-2 py-0.5 rounded">
              {repository.visibility}
            </span>
          </div>
          <p className="text-xs text-muted mt-1 max-w-xl">{repository.description || 'No description provided.'}</p>
          <div className="flex items-center gap-4 text-xs text-muted mt-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400" />
              <span>{repository.stars} stars</span>
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-4 w-4 text-indigo-400" />
              <span>{repository.forks} forks</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>Updated on {repository.lastUpdatedAt ? new Date(repository.lastUpdatedAt).toLocaleDateString() : 'N/A'}</span>
            </span>
          </div>
        </div>

        {/* Global badge score */}
        <div className={`border p-4 rounded-xl flex items-center gap-4 min-w-[200px] justify-center ${getScoreColor(scores.overall)}`}>
          <div className="text-center">
            <span className="text-3xl sm:text-4xl font-black block">{scores.overall}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted">Quality Score</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-xs font-bold block capitalize">{scores.overall >= 90 ? 'Excellent' : scores.overall >= 75 ? 'Very Good' : scores.overall >= 60 ? 'Good' : 'Needs Fix'}</span>
            <span className="text-[9px] text-muted block">Deterministic Rating</span>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-border gap-2 overflow-x-auto">
        {(['overview', 'codebase', 'readme', 'deployment'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold capitalize border-b-2 transition whitespace-nowrap ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TABS INNER PANELS */}
      <div className="flex flex-col gap-8">
        {activeTab === 'overview' && (
          /* TAB 1: OVERVIEW & AI MENTOR */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Summary */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>AI Mentor Evaluation</span>
                </h3>
                <p className="text-sm leading-relaxed">{summary || 'AI evaluations unavailable.'}</p>
              </div>

              {/* CV Points */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5" />
                  <span>Portfolio CV & Resume Elements</span>
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-950 p-4 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Resume Bullet Point</span>
                    <p className="text-xs text-text italic leading-relaxed">
                      &quot;{resumePoint || 'Not generated'}&quot;
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1">Portfolio Project Description</span>
                    <p className="text-xs text-text leading-relaxed">
                      {portfolioDescription || 'Not generated'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-text uppercase tracking-wider">Optimization Steps</h3>
                <div className="flex flex-col gap-4">
                  {aiSuggestions.map((sug, i) => (
                    <div key={i} className="flex gap-4 items-start border-b border-border/40 pb-4 last:border-0 last:pb-0">
                      <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        sug.priority === 'high' ? 'bg-red-500/10 text-red-400' : sug.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-950 text-muted'
                      }`}>
                        {sug.priority}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h4 className="font-bold text-sm text-text">{sug.title}</h4>
                        <p className="text-xs text-muted">{sug.explanation}</p>
                        {sug.steps && sug.steps.length > 0 && (
                          <div className="flex flex-col gap-1 mt-1 text-[11px] text-text font-semibold">
                            {sug.steps.map((st, idx) => (
                              <span key={idx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                <span>{st}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Score grids side details */}
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Evaluation Breakdown</h3>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Codebase Structure', score: scores.structure, max: 25 },
                    { label: 'README Documentation', score: scores.readme, max: 20 },
                    { label: 'Deployment Readiness', score: scores.deployment, max: 25 },
                    { label: 'Security Configuration', score: scores.security, max: 15 },
                    { label: 'Portfolio Readiness', score: scores.portfolio, max: 5 },
                  ].map((cat, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{cat.label}</span>
                        <span className="font-bold">{cat.score}/{cat.max}</span>
                      </div>
                      <div className="h-2 bg-slate-950 border border-border/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(cat.score / cat.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Verification disclaimer</h3>
                <p className="text-[10px] text-muted leading-relaxed">
                  GitAnalyzer is an automated quality auditing checklist. Code files are not executed or run, meaning successful deployment depends on correct database connections, CORS parameters, and cloud hosting accounts.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'codebase' && (
          /* TAB 2: CODEBASE & SECURITY */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Critical Security Anomalies */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertOctagon className="h-5 w-5 text-red-500" />
                  <span>Security & File Audits</span>
                </h3>

                {issues.length === 0 ? (
                  <div className="text-xs text-green-400 bg-green-500/5 p-4 rounded-xl border border-green-500/20 font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5" />
                    <span>Clean code! No sensitive files or directory warnings found.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="p-4 bg-slate-950 rounded-xl border border-border flex gap-3.5">
                        {issue.severity === 'critical' || issue.severity === 'high' ? (
                          <AlertOctagon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-text">{issue.title}</h4>
                            <span className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                              issue.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-xs text-muted leading-relaxed">{issue.description}</p>
                          <div className="bg-slate-900 px-3 py-2 rounded-lg text-xs border border-border/40 text-text">
                            <span className="font-bold text-indigo-400">Recommendation:</span> {issue.recommendation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technologies evidence list */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Detected Technical Stack</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Frontend Frameworks', items: record.detectedStack.frontend },
                    { title: 'Backend / Runtime', items: record.detectedStack.backend },
                    { title: 'Databases', items: record.detectedStack.database },
                    { title: 'Deployment & DevOps', items: record.detectedStack.deployment },
                    { title: 'Testing Libraries', items: record.detectedStack.testing },
                    { title: 'Package Managers', items: record.detectedStack.packageManagers },
                  ].map((cat, idx) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-border flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{cat.title}</span>
                      {cat.items.length === 0 ? (
                        <span className="text-xs text-muted italic">Generic / Not Detected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {cat.items.map((item, itemIdx) => (
                            <span key={itemIdx} className="bg-slate-900 border border-border/80 px-2.5 py-0.5 rounded text-xs text-indigo-300 font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist of files side */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 h-fit">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Workspace Verification</h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'README.md', checked: checks.readmeExists },
                  { label: '.env.example', checked: checks.envExampleExists },
                  { label: '.gitignore', checked: checks.gitignoreExists },
                  { label: 'LICENSE file', checked: checks.licenseExists },
                  { label: 'Package manifest', checked: checks.packageFileExists },
                  { label: 'Dependency lockfile', checked: checks.lockFileExists },
                  { label: 'Frontend/Backend Separated', checked: checks.frontendBackendSeparated },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-muted">{item.label}</span>
                    {item.checked ? (
                      <CheckCircle className="h-4.5 w-4.5 text-green-400" />
                    ) : (
                      <XCircle className="h-4.5 w-4.5 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
              {missingFiles.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-red-400">Missing Required Files</span>
                  <div className="flex flex-wrap gap-1.5">
                    {missingFiles.map((f, idx) => (
                      <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'readme' && (
          /* TAB 3: README AUDIT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Outline proposal */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-400" />
                    <span>Suggested Professional README Structure</span>
                  </h3>
                  <span className="text-xs text-muted">Markdowns format</span>
                </div>
                
                <div className="bg-slate-950 p-4 rounded-xl border border-border relative">
                  <pre className="text-xs text-indigo-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[450px]">
                    {record.checks?.readmeExists ? 
                      `# ${repository.name}\n\n## Overview\nShort descriptive statement of the application.\n\n## Getting Started\n1. Clone the project repository.\n2. Run npm install.\n3. Configure environment keys.\n4. Run development script.` : 
                      'README outline generation skipped.'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Readme checklist metrics */}
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-black text-indigo-400">{scores.readme * 5}/100</div>
                  <div className="text-xs font-bold text-muted uppercase">README Quality Score</div>
                </div>
                <div className="h-px bg-border/50" />
                
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Checked Sections</span>
                  {[
                    { label: 'Screenshots / Media', checked: checks.screenshotsFound },
                    { label: 'Demo URL link', checked: checks.demoLinkFound },
                    { label: 'Setup / Install instructions', checked: checks.installationStepsFound },
                    { label: 'Usage Commands', checked: checks.usageSectionFound },
                    { label: 'API schemas documentation', checked: checks.apiDocumentationFound },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{item.label}</span>
                      {item.checked ? (
                        <CheckCircle className="h-4.5 w-4.5 text-green-400" />
                      ) : (
                        <XCircle className="h-4.5 w-4.5 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          /* TAB 4: DEPLOYMENT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Deploy settings */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CloudLightning className="h-4.5 w-4.5 text-blue-400" />
                  <span>Deployment Configurations</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted block mb-1">Target Application</span>
                    <span className="text-sm font-bold text-text">{deployment.detectedFramework || 'Generic Static App'}</span>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted block mb-1">Recommended Hosting Platform</span>
                    <span className="text-sm font-bold text-indigo-400">{deployment.recommendedPlatform}</span>
                  </div>

                  {deployment.buildCommand && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-border sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-muted block mb-1">Suggested Build Command</span>
                      <code className="text-xs bg-slate-900 border border-border px-2 py-1 rounded text-blue-300 font-mono block w-fit">
                        {deployment.buildCommand}
                      </code>
                    </div>
                  )}

                  {deployment.startCommand && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-border sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-muted block mb-1">Suggested Start Command</span>
                      <code className="text-xs bg-slate-900 border border-border px-2 py-1 rounded text-purple-300 font-mono block w-fit">
                        {deployment.startCommand}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Step by step deployment guides */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text">Step-by-Step Deployment Guide</h3>
                
                <div className="flex flex-col gap-3">
                  {/* Generate simple guide lists based on targets */}
                  {[
                    `Sign up or login on ${deployment.recommendedPlatform.split(' ')[0]}.`,
                    deployment.environmentVariablesRequired ? 'Review and copy environment variable keys listed in your .env.example.' : null,
                    `Connect your GitHub account and import repository: "${repository.fullName}".`,
                    deployment.buildCommand ? `Verify build settings contain command: "${deployment.buildCommand}".` : null,
                    deployment.startCommand ? `Verify runner start commands contain: "${deployment.startCommand}".` : null,
                    'Run trigger Deploy. Wait for the URL generation and double-check endpoints routing.'
                  ].filter(Boolean).map((step, idx) => (
                    <div key={idx} className="flex gap-3.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-slate-950 border border-border text-[10px] font-bold flex items-center justify-center text-indigo-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs leading-relaxed text-muted">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deploy checklist state */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 h-fit">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-indigo-400">{scores.deployment}/25</div>
                <div className="text-xs font-bold text-muted uppercase">Deployment Score</div>
              </div>
              <div className="h-px bg-border/50" />
              
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Deployment Status</span>
                  {deployment.ready ? (
                    <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2.5 py-0.5 rounded-full font-semibold">Ready</span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-semibold">Checks Required</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-bold text-muted uppercase text-[10px] tracking-wider">Recommendation Reason</span>
                  <p className="text-muted leading-relaxed text-[11px]">{deployment.recommendationReason}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
