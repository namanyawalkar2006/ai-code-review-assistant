import React, { useState } from 'react';
import { Search, ShieldAlert, Zap, CheckCircle2, Eye, Calendar, Filter, FileCode } from 'lucide-react';
import { ReviewReport, ReviewMode, SeverityLevel } from '../types';

interface HistoryPanelProps {
  reviews: ReviewReport[];
  onSelectReview: (review: ReviewReport) => void;
}

export function HistoryPanel({ reviews, onSelectReview }: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = selectedMode === 'ALL' || r.mode === selectedMode;
    const matchesSeverity = selectedSeverity === 'ALL' || (r.severity && r.severity.toUpperCase() === selectedSeverity.toUpperCase());

    return matchesSearch && matchesMode && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = filteredReviews.slice((page - 1) * pageSize, page * pageSize);

  const getSeverityBadge = (sev: SeverityLevel | string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const getModeIcon = (mode: ReviewMode) => {
    switch (mode) {
      case 'SECURITY':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'PERFORMANCE':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Review Audit History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical logs of all security, performance, and code quality audits conducted.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search summary or project..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-52 font-sans"
            />
          </div>

          {/* Mode Filter */}
          <select
            value={selectedMode}
            onChange={(e) => {
              setSelectedMode(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Modes</option>
            <option value="SECURITY">Security</option>
            <option value="PERFORMANCE">Performance</option>
            <option value="CODE_QUALITY">Code Quality</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              setSelectedSeverity(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Audit Mode</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Issues Found</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {paginatedReviews.length > 0 ? (
                paginatedReviews.map((rev) => (
                  <tr
                    key={rev.id}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    onClick={() => onSelectReview(rev)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 font-medium text-slate-200">
                        {getModeIcon(rev.mode)}
                        <span>{rev.mode}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">{rev.projectName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(rev.severity)}`}>
                        {rev.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-400">
                      {rev.issuesJson?.length || 0} issues
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                      {rev.summary}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(rev.createdAt).toLocaleDateString()} {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReview(rev);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[11px]">View Report</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <Filter className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-300">No review audits on record</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                          Execute a security, performance, or quality review on any project to catalog structured reports and actionable diffs here.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/60">
          <span>Showing {paginatedReviews.length} of {filteredReviews.length} reviews</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
