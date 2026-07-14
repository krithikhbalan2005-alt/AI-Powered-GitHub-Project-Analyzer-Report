"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldAlert,
  Loader,
  Users,
  Activity,
  Award,
  CloudLightning,
  Sparkles,
  RefreshCw,
  GitPullRequest
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  averageScore: number;
  deploymentReadyRate: number;
  topTechnologies: { name: string; count: number }[];
}

interface AdminAnalysisLog {
  id: string;
  repository: { fullName: string; url: string };
  scores: { overall: number };
  status: string;
  createdAt: any;
}

export default function AdminPage() {
  const { currentUser, getIdToken, userProfile } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<AdminAnalysisLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ai-powered-git-hub-project-analyzer-fawn.vercel.app/api';

  const fetchAdminData = async () => {
    if (!currentUser) return;
    try {
      setErrorMsg(null);
      const token = await getIdToken();
      
      // 1. Fetch metrics
      const statsRes = await fetch(`${apiBaseUrl}/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      // 2. Fetch logs
      const logsRes = await fetch(`${apiBaseUrl}/admin/analyses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsRes.json();

      if (statsData.success && logsData.success) {
        setStats(statsData.data);
        setLogs(logsData.data.analyses || []);
      } else {
        setErrorMsg(statsData.message || logsData.message || 'Access Forbidden: Administrator role verification failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to download administrative parameters due to a server connection failure.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      setErrorMsg('Forbidden: Access is restricted to platform administrators only.');
      setLoading(false);
    } else if (currentUser && userProfile?.role === 'admin') {
      fetchAdminData();
    }
  }, [currentUser, userProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="text-sm text-muted">Authorizing console workspace...</span>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-panel max-w-md p-8 rounded-2xl text-center flex flex-col items-center gap-4 border-l-4 border-l-red-500">
          <ShieldAlert className="h-12 w-12 text-red-500" />
          <h3 className="text-lg font-bold">Access Restrained</h3>
          <p className="text-xs text-muted">{errorMsg}</p>
          <Link href="/dashboard" className="px-4 py-2 bg-slate-900 border border-border text-xs rounded-lg hover:bg-slate-800 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Admin Console</span>
            <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Privileged</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted font-medium">Global platform auditing counts, technographics shares, and active submissions.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-border hover:bg-slate-800 rounded-lg text-xs transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-indigo-500">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Registered Developers</span>
              <span className="text-2xl font-black">{stats.totalUsers}</span>
            </div>
            <Users className="h-8 w-8 text-indigo-400" />
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-purple-500">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Total Audits Run</span>
              <span className="text-2xl font-black">{stats.totalAnalyses}</span>
            </div>
            <Activity className="h-8 w-8 text-purple-400" />
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-blue-500">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Average Platform Score</span>
              <span className="text-2xl font-black">{stats.averageScore}/100</span>
            </div>
            <Award className="h-8 w-8 text-blue-400" />
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-green-500">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Deployment Ready Rate</span>
              <span className="text-2xl font-black">{stats.deploymentReadyRate}%</span>
            </div>
            <CloudLightning className="h-8 w-8 text-green-400" />
          </div>
        </section>
      )}

      {/* Lists block: tech shares and logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text">Global Submissions History</h3>
          
          <div className="flex flex-col gap-3">
            {logs.slice(0, 15).map((log) => (
              <div key={log.id} className="p-3 bg-slate-950 border border-border rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase border border-border/50">
                    {log.repository.fullName.split('/')[1]?.slice(0, 2) || 'GP'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text truncate max-w-[200px] sm:max-w-xs">{log.repository.fullName}</h4>
                    <span className="text-[9px] text-muted block mt-0.5">ID: {log.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-extrabold text-indigo-400">{log.scores?.overall || 0}/100</span>
                  <Link href={`/analyses/${log.id}`} className="px-2.5 py-1 bg-slate-900 border border-border/80 text-[10px] rounded hover:bg-slate-800 transition">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Techs */}
        {stats && (
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 h-fit">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text">Most Audited Frameworks</h3>
            
            <div className="flex flex-col gap-4 mt-2">
              {stats.topTechnologies.length === 0 ? (
                <span className="text-xs text-muted italic">No framework distributions tracked.</span>
              ) : (
                stats.topTechnologies.map((tech) => (
                  <div key={tech.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{tech.name}</span>
                      <span className="font-black text-indigo-400">{tech.count} projects</span>
                    </div>
                    <div className="h-1.5 bg-slate-950 border border-border/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{
                          width: `${(tech.count / Math.max(...stats.topTechnologies.map(t => t.count))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
