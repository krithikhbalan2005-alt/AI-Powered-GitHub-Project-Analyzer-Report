"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { AnalysisRecord } from '../../types';
import {
  Search,
  Trash2,
  Calendar,
  Eye,
  GitBranch,
  Loader,
  AlertCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const { currentUser, getIdToken, refreshProfile } = useAuth();
  const router = useRouter();

  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // If not authenticated and auth state resolved, redirect
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  const authLoading = !currentUser && loading === false && analyses.length === 0;

  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const token = await getIdToken();
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const response = await fetch(`${apiBaseUrl}/analyses?limit=${limit}&page=${page}${statusParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const resData = await response.json();
      if (resData.success) {
        setAnalyses(resData.data.analyses || []);
        setTotalPages(resData.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchHistory();
    }
  }, [currentUser, page, statusFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis report from history? This cannot be undone.')) return;

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
      console.error(err);
      alert('Delete failed.');
    }
  };

  // Filter local files matching search term query
  const filteredAnalyses = analyses.filter((item) =>
    item.repository.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Audit Logs History</h1>
        <p className="text-xs sm:text-sm text-muted">Review, search, and manage all your past repository analysis runs.</p>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-950 p-4 rounded-xl border border-border/80">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by repository name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-border pl-9 pr-4 py-2 rounded-lg text-xs placeholder-muted focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="h-4 w-4 text-muted hidden sm:inline" />
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-border text-xs px-3 py-2 rounded-lg text-text focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="analyzing">Analyzing</option>
          </select>
        </div>
      </div>

      {/* Audits table / cards */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-900/50 border border-border/80 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl max-w-md mx-auto w-full flex flex-col items-center gap-4">
          <AlertCircle className="h-10 w-10 text-muted" />
          <div>
            <h4 className="font-bold text-sm">No records found</h4>
            <p className="text-xs text-muted mt-1">Try adjusting your filters or run a new scan from the dashboard.</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition">
            Audit New Repo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAnalyses.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-xl border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-border flex items-center justify-center text-indigo-400 font-bold text-xs uppercase">
                  {item.repository.name.slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text flex items-center gap-1.5 flex-wrap">
                    <span>{item.repository.fullName}</span>
                    <span className="text-[9px] bg-slate-900 border border-border text-muted px-1.5 py-0.5 rounded uppercase">
                      {item.repository.visibility}
                    </span>
                  </h4>
                  <p className="text-xs text-muted mt-1">
                    Audited: {new Date(item.createdAt?._seconds ? item.createdAt._seconds * 1000 : item.createdAt).toLocaleDateString()} at {new Date(item.createdAt?._seconds ? item.createdAt._seconds * 1000 : item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-border/40 pt-2.5 sm:pt-0">
                <div className="flex flex-col items-start sm:items-end text-xs">
                  <span className="text-[10px] font-semibold text-muted uppercase">Score</span>
                  <span className="font-black text-indigo-400 text-sm">{item.scores?.overall || 0}/100</span>
                </div>

                <div className="flex flex-col items-start sm:items-end text-xs">
                  <span className="text-[10px] font-semibold text-muted uppercase">Deployment</span>
                  {item.status === 'completed' ? (
                    item.deployment?.ready ? (
                      <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded font-semibold">Ready</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-semibold">Checks Needed</span>
                    )
                  ) : (
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-semibold">Failed</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/analyses/${item.id}`}
                    className="p-2 text-muted hover:text-indigo-400 hover:bg-indigo-500/5 rounded-lg transition"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Link>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 text-muted hover:text-red-400 hover:bg-red-500/5 rounded-lg transition"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-border disabled:opacity-50 text-xs rounded-lg text-muted hover:text-text transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs text-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-border disabled:opacity-50 text-xs rounded-lg text-muted hover:text-text transition"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
