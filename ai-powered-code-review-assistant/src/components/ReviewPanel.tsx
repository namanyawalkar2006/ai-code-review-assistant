import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Play,
  RefreshCw,
  AlertTriangle,
  FileCode,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ReviewMode, ReviewReport, ReviewIssue, SeverityLevel } from '../types';

interface ReviewPanelProps {
  currentReview: ReviewReport | null;
  isReviewing: boolean;
  onExecuteReview: (mode: ReviewMode, scope: 'SINGLE_FILE' | 'SELECTED_FILES' | 'FULL_PROJECT') => void;
  selectedFileCount: number;
  onApplyFix?: (issue: ReviewIssue) => void;
  onJumpToLine?: (file: string, line: number) => void;
}

export function ReviewPanel({
  currentReview,
  isReviewing,
  onExecuteReview,
  selectedFileCount,
  onApplyFix,
  onJumpToLine,
}: ReviewPanelProps) {
  const [activeMode, setActiveMode] = useState<ReviewMode>('SECURITY');
  const [scope, setScope] = useState<'SINGLE_FILE' | 'SELECTED_FILES' | 'FULL_PROJECT'>('FULL_PROJECT');
  const [appliedFixes, setAppliedFixes] = useState<Record<number, boolean>>({});

  const handleApplyFix = (issue: ReviewIssue, index: number) => {
    if (onApplyFix) {
      onApplyFix(issue);
      setAppliedFixes((prev) => ({ ...prev, [index]: true }));
    }
  };

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
    <div className="w-96 flex flex-col h-full bg-slate-900/60 border-l border-slate-800 select-none">
      {/* Review Mode Selector */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Review Mode
          </span>
          <span className="text-[11px] text-slate-500 font-mono">3 Specialized Engines</span>
        </div>

        {/* 3 Mode buttons */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMode('SECURITY')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'SECURITY'
                ? 'bg-rose-600/90 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveMode('PERFORMANCE')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'PERFORMANCE'
                ? 'bg-amber-600/90 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Speed</span>
          </button>

          <button
            onClick={() => setActiveMode('CODE_QUALITY')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeMode === 'CODE_QUALITY'
                ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Quality</span>
          </button>
        </div>

        {/* Scope selector */}
        <div className="flex items-center justify-between pt-1">
          <label className="text-[11px] text-slate-400 font-medium">Scope:</label>
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setScope('SINGLE_FILE')}
              className={`px-2 py-0.5 rounded ${
                scope === 'SINGLE_FILE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Current
            </button>
            <button
              onClick={() => setScope('SELECTED_FILES')}
              className={`px-2 py-0.5 rounded ${
                scope === 'SELECTED_FILES' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Selected ({selectedFileCount})
            </button>
            <button
              onClick={() => setScope('FULL_PROJECT')}
              className={`px-2 py-0.5 rounded ${
                scope === 'FULL_PROJECT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Project
            </button>
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={() => onExecuteReview(activeMode, scope)}
          disabled={isReviewing}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-medium border border-indigo-500/30 transition-colors cursor-pointer"
        >
          {isReviewing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-200" />
              <span>Running {activeMode} Diagnostics...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute {activeMode} Review</span>
            </>
          )}
        </button>
      </div>

      {/* Review Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isReviewing ? (
          <div className="space-y-3 animate-pulse">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="h-3.5 bg-slate-800 rounded w-28"></div>
                <div className="h-4 bg-slate-800/80 rounded-full w-16"></div>
              </div>
              <div className="h-3 bg-slate-800/70 rounded w-full"></div>
              <div className="h-3 bg-slate-800/50 rounded w-4/5"></div>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3 bg-slate-800/60 rounded w-24"></div>
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-1/3"></div>
                <div className="h-2.5 bg-slate-800/60 rounded w-full"></div>
                <div className="h-10 bg-slate-950 rounded border border-slate-800/60"></div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-2/5"></div>
                <div className="h-2.5 bg-slate-800/60 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ) : currentReview ? (
          <>
            {/* Summary card */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Overall Severity</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getSeverityBadge(currentReview.severity)}`}>
                  {currentReview.severity}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentReview.summary}
              </p>
            </div>

            {/* Issues Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>Issues Identified</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                  {currentReview.issuesJson?.length || 0}
                </span>
              </div>

              {currentReview.issuesJson && currentReview.issuesJson.length > 0 ? (
                currentReview.issuesJson.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onJumpToLine && onJumpToLine(issue.file, issue.line)}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-400 hover:text-indigo-300 truncate"
                        title="Click to jump to line in code viewer"
                      >
                        <FileCode className="w-3 h-3 shrink-0" />
                        <span className="truncate">{issue.file}</span>
                        <span className="text-slate-500 font-bold">:{issue.line}</span>
                      </button>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-medium border ${getSeverityBadge(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200">
                      [{issue.rule}]
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      {issue.message}
                    </div>

                    {/* Suggested Fix code snippet */}
                    {issue.suggestedFix && (
                      <div className="pt-1 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>Suggested Fix</span>
                          <button
                            onClick={() => handleApplyFix(issue, idx)}
                            className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            {appliedFixes[idx] ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Applied</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                <span>Apply Fix</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                          <code>{issue.suggestedFix}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center text-xs text-emerald-300">
                  No critical defects discovered for this review mode. Clean code verified!
                </div>
              )}
            </div>

            {/* Strategic Recommendations */}
            {currentReview.recommendationsJson && currentReview.recommendationsJson.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Architectural Recommendations</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {currentReview.recommendationsJson.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400 font-bold shrink-0">•</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <CheckCircle2 className="w-5 h-5 stroke-[1.5] text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300">No Review Reports Generated</p>
              <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                Choose a mode (Security, Speed, or Quality) and click Execute Review to audit target code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
