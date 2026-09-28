import React from 'react';
import { X, ShieldAlert, Zap, CheckCircle2, FileCode } from 'lucide-react';
import { ReviewReport, SeverityLevel, ReviewIssue } from '../types';

interface ReviewModalProps {
  review: ReviewReport | null;
  onClose: () => void;
}

export function ReviewModal({ review, onClose }: ReviewModalProps) {
  if (!review) return null;

  const getSeverityBadge = (sev: SeverityLevel | string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSeverityBadge(review.severity)}`}>
              {review.severity}
            </span>
            <span className="font-semibold text-slate-100 text-sm">
              {review.projectName} — {review.mode} Audit
            </span>
            <span className="text-xs text-slate-500">
              {new Date(review.createdAt).toLocaleString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Executive Summary
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
              {review.summary}
            </div>
          </div>

          {/* Issues List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span>Detected Issues</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                {review.issuesJson?.length || 0}
              </span>
            </h4>
            <div className="space-y-3">
              {review.issuesJson?.map((issue: ReviewIssue, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{issue.file}</span>
                      <span className="text-slate-500 font-bold">: line {issue.line}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getSeverityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    [{issue.rule}] {issue.message}
                  </div>
                  {issue.suggestedFix && (
                    <div className="mt-2">
                      <div className="text-[11px] text-slate-400 font-medium mb-1">Suggested Fix:</div>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                        <code>{issue.suggestedFix}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Recommendations */}
          {review.recommendationsJson && review.recommendationsJson.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Strategic Recommendations
              </h4>
              <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                {review.recommendationsJson.map((rec: string, i: number) => (
                  <li key={i} className="leading-relaxed">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
