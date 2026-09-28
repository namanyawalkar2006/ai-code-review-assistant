import React, { useState, useEffect } from 'react';
import { Server, FileCode, Copy, Check, Download, Layers, ShieldCheck, Database, BookOpen } from 'lucide-react';
import { MonorepoFile } from '../types';

export function MonorepoInspector() {
  const [files, setFiles] = useState<MonorepoFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MonorepoFile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/monorepo/files')
      .then((res) => res.json())
      .then((data: MonorepoFile[]) => {
        const fileList = Array.isArray(data) ? data : [];
        setFiles(fileList);
        if (fileList.length > 0) setSelectedFile(fileList[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load monorepo files:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['ALL', ...Array.from(new Set(files.map((f) => f.category)))];

  const filteredFiles = files.filter(
    (f) => selectedCategory === 'ALL' || f.category === selectedCategory,
  );

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Database')) return <Database className="w-3.5 h-3.5 text-amber-400" />;
    if (cat.includes('Documentation')) return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    if (cat.includes('Backend')) return <Server className="w-3.5 h-3.5 text-rose-400" />;
    return <Layers className="w-3.5 h-3.5 text-sky-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            Monorepo Codebase & Architecture Inspector
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Explore the complete multi-file technical assessment submission: NestJS Backend, Next.js Frontend, Prisma PostgreSQL schema, and mandatory documentation.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-3 space-y-1.5 shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
            Submitted Artifacts ({filteredFiles.length})
          </div>

          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            return (
              <div
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`p-2.5 rounded-xl cursor-pointer text-xs transition-all space-y-1 ${
                  isSelected
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-mono font-medium truncate">
                  {getCategoryIcon(file.category)}
                  <span className="truncate">{file.path}</span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">
                  {file.description}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Right Code Viewer */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {selectedFile ? (
            <>
              {/* Header Bar */}
              <div className="h-10 border-b border-slate-800 bg-slate-900/60 px-4 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{selectedFile.path}</span>
                  <span className="text-slate-500 text-[11px]">({selectedFile.size.toLocaleString()} bytes)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-sans">
                    {selectedFile.category}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Content'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code Pre */}
              <div className="flex-1 p-5 overflow-auto font-mono text-xs text-slate-200 bg-slate-950">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  <code>{selectedFile.content}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select a monorepo file on the left to inspect its implementation.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
