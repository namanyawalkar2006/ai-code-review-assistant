import Link from 'next/link';
import { ShieldAlert, Zap, CheckCircle2, ArrowRight, Code2, Bot, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">CodeReview<span className="text-indigo-400">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-md shadow-indigo-600/30"
            >
              Launch Assistant
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-8">
          <Bot className="w-3.5 h-3.5" /> Next-Generation Multi-Provider Code Review
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Automated Code Reviews with <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">Zero Hallucinations</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed">
          Plug in Google Gemini, OpenAI, or your local Ollama / LM Studio instances. Audit code for OWASP Top 10 vulnerabilities, runtime bottlenecks, and clean-code compliance with interactive explorer and contextual chat.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Open Live Workspace <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-6 py-3 rounded-xl font-medium transition-all"
          >
            Explore Architecture
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Security Audits</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detect hardcoded credentials, SQL/command injections, flawed auth gates, and OWASP Top 10 threats with line-accurate diff suggestions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Performance Optimization</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Pinpoint N+1 database queries, O(N^2) loops, memory leaks, and render bottlenecks with benchmark guidance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Code Quality & Clean Code</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enforce SOLID design principles, modularity, type safety, naming consistency, and documentation standards.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
