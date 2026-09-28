import React from 'react';
import {
  Code2,
  Cpu,
  Layers,
  MessageSquare,
  Sparkles,
  History,
  Settings,
  FolderGit2,
  Plus,
  Server,
} from 'lucide-react';
import { Project, AIProvider } from '../types';

interface HeaderProps {
  activeTab: 'studio' | 'chat' | 'generators' | 'history' | 'providers' | 'monorepo';
  setActiveTab: (tab: 'studio' | 'chat' | 'generators' | 'history' | 'providers' | 'monorepo') => void;
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onNewProject: () => void;
  activeProvider: AIProvider | null;
}

export function Header({
  activeTab,
  setActiveTab,
  projects,
  activeProject,
  onSelectProject,
  onNewProject,
  activeProvider,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-indigo-400">
            <Code2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="font-semibold text-xs text-white tracking-tight flex items-center gap-1.5">
              CodeReview<span className="text-indigo-400">Assistant</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">v1.0</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Enterprise AI Code Auditor</div>
          </div>
        </div>

        {/* Project Selector dropdown */}
        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={activeProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((item) => item.id === e.target.value);
              if (p) onSelectProject(p);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.files.length} files)
              </option>
            ))}
          </select>

          <button
            onClick={onNewProject}
            title="Create New Project"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'studio'
              ? 'bg-slate-800 text-white border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Code Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-slate-800 text-white border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('generators')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'generators'
              ? 'bg-slate-800 text-white border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Bonus Generators</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Review History</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'providers'
              ? 'bg-slate-800 text-white border border-slate-700/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>AI Providers</span>
        </button>

        <button
          onClick={() => setActiveTab('monorepo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'monorepo'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Monorepo Specs</span>
        </button>
      </nav>

      {/* Provider Status Pill */}
      <div className="flex items-center gap-2">
        <div
          onClick={() => setActiveTab('providers')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 cursor-pointer hover:border-slate-700 transition-colors"
          title="Active AI Provider Engine"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-400">AI:</span>
          <span className="font-medium text-slate-200 truncate max-w-[130px]">
            {activeProvider ? activeProvider.modelName : 'gemini-3.8-flash'}
          </span>
        </div>
      </div>
    </header>
  );
}
