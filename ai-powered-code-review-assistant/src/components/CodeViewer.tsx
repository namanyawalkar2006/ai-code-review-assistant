import React, { useState } from 'react';
import { Copy, Check, Edit3, Eye, FileCode, AlertCircle, ShieldAlert } from 'lucide-react';
import { FileItem, ReviewIssue } from '../types';

interface CodeViewerProps {
  file: FileItem | null;
  issues: ReviewIssue[];
  onSaveContent?: (fileId: string, newContent: string) => void;
  onJumpToLine?: (line: number) => void;
}

export function CodeViewer({ file, issues, onSaveContent }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState(file?.content || '');

  // Keep editedCode in sync when file changes
  React.useEffect(() => {
    setEditedCode(file?.content || '');
    setIsEditing(false);
  }, [file?.id, file?.content]);

  if (!file) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-950 select-none">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <FileCode className="w-6 h-6 stroke-[1.5]" />
        </div>
        <p className="text-sm font-medium text-slate-300">No file selected</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Select a file from the left explorer tree to inspect source code, line diagnostics, and inline fixes.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveContent) {
      onSaveContent(file.id, editedCode);
    }
    setIsEditing(false);
  };

  // Find issues that correspond to this specific file
  const fileIssues = issues.filter(
    (i) => i.file === file.path || file.path.endsWith(i.file) || i.file.endsWith(file.path),
  );

  const lines = (isEditing ? editedCode : file.content).split('\n');

  // Map line numbers to issues
  const lineIssueMap: Record<number, ReviewIssue[]> = {};
  fileIssues.forEach((issue) => {
    if (!lineIssueMap[issue.line]) {
      lineIssueMap[issue.line] = [];
    }
    lineIssueMap[issue.line].push(issue);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* File Header Bar */}
      <div className="h-10 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2 text-xs font-mono">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">{file.path}</span>
          <span className="text-slate-500 text-[11px]">({lines.length} lines)</span>

          {fileIssues.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-3 h-3" /> {fileIssues.length} issue{fileIssues.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              Save Changes
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
              title="Edit code in-place"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto font-mono text-xs text-slate-200">
        {isEditing ? (
          <textarea
            value={editedCode}
            onChange={(e) => setEditedCode(e.target.value)}
            className="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="py-2 min-w-max">
            {lines.map((lineText, index) => {
              const lineNum = index + 1;
              const hasIssue = Boolean(lineIssueMap[lineNum]);
              const issueForLine = lineIssueMap[lineNum]?.[0];

              return (
                <div
                  key={lineNum}
                  id={`line-${lineNum}`}
                  className={`flex items-start group px-4 py-0.5 transition-colors ${
                    hasIssue
                      ? 'bg-rose-950/30 border-l-2 border-rose-500'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Line Number */}
                  <span
                    className={`w-10 text-right pr-4 shrink-0 select-none text-[11px] ${
                      hasIssue ? 'text-rose-400 font-bold' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  >
                    {lineNum}
                  </span>

                  {/* Code Line */}
                  <span className="flex-1 whitespace-pre leading-relaxed select-text font-mono">
                    {lineText || ' '}
                  </span>

                  {/* Inline Issue Indicator Badge */}
                  {hasIssue && issueForLine && (
                    <div className="ml-4 shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span className="font-mono">[{issueForLine.rule}]</span>
                      <span className="hidden sm:inline truncate max-w-xs">{issueForLine.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
