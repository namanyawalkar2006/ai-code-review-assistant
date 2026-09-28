'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Play,
  UploadCloud,
  FileCode,
  Layers,
  Settings,
  MessageSquare,
  History,
  FileText,
  TestTube2,
  RefreshCw,
} from 'lucide-react';
import { CodeExplorer, FileItem } from '../../components/CodeExplorer';

const SAMPLE_FILES: FileItem[] = [
  {
    id: 'f-1',
    path: 'src/auth/auth.controller.ts',
    size: 1420,
    content: `import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  // CRITICAL VULNERABILITY: Hardcoded JWT secret and sensitive logs
  private JWT_SECRET = 'hardcoded_jwt_secret_key_12345';

  @Post('login')
  async login(@Body() body: any) {
    console.log('User attempted login with password:', body.password); // SEC-002: Credential leak

    // SQL Injection vulnerable string interpolation
    const query = \`SELECT * FROM users WHERE email = '\${body.email}' AND password = '\${body.password}'\`;

    if (body.email === 'admin@company.com') {
      const token = jwt.sign({ role: 'admin', email: body.email }, this.JWT_SECRET);
      return { token };
    }

    throw new UnauthorizedException();
  }
}`,
  },
  {
    id: 'f-2',
    path: 'src/services/payment.service.ts',
    size: 2150,
    content: `export class PaymentService {
  async processBatch(orders: any[]) {
    // PERFORMANCE BOTTLENECK: N+1 sequential blocking I/O loop
    const results = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      // Inefficient synchronous wait in loop
      const details = await this.fetchExternalLedgerSync(order.id);
      results.push(details);
    }
    return results;
  }

  private async fetchExternalLedgerSync(id: string) {
    // Simulating remote ledger latency
    return { id, processed: true };
  }
}`,
  },
  {
    id: 'f-3',
    path: 'src/utils/data-transformer.ts',
    size: 1890,
    content: `// CODE QUALITY ISSUES: Any types, cyclomatic complexity, lack of modularity
export function transformPayload(data: any): any {
  let res: any = {};
  if (data) {
    if (data.user) {
      if (data.user.profile) {
        if (data.user.profile.details) {
          res.name = data.user.profile.details.n;
          res.a = data.user.profile.details.age;
        }
      }
    }
  }
  return res;
}`,
  },
];

export default function DashboardPage() {
  const [files, setFiles] = useState<FileItem[]>(SAMPLE_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem>(SAMPLE_FILES[0]);
  const [checkedFileIds, setCheckedFileIds] = useState<string[]>([SAMPLE_FILES[0].id]);
  const [reviewMode, setReviewMode] = useState<'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY'>('SECURITY');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);

  const toggleCheckFile = (id: string) => {
    setCheckedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const triggerReview = async () => {
    setIsReviewing(true);
    setReviewResult(null);

    // Call API /api/reviews/run
    try {
      const response = await fetch('/api/reviews/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'sample-project-1',
          mode: reviewMode,
          scope: checkedFileIds.length === files.length ? 'FULL_PROJECT' : 'SELECTED_FILES',
          fileIds: checkedFileIds,
        }),
      });
      const data = await response.json();
      setReviewResult(data);
    } catch {
      // Mock review result if offline
      setReviewResult({
        summary: `Automated ${reviewMode} review completed. Critical vulnerabilities and optimization targets flagged.`,
        severity: 'CRITICAL',
        issuesJson: [
          {
            file: selectedFile.path,
            line: 7,
            rule: 'SEC-001-HARDCODED-SECRET',
            severity: 'Critical',
            message: 'Hardcoded JWT secret detected in controller source.',
            suggestedFix: 'process.env.JWT_SECRET',
          },
        ],
        recommendationsJson: [
          'Externalize credentials to .env secrets management.',
          'Replace raw SQL concatenations with parameterized ORM statements.',
        ],
      });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm leading-none">CodeReview Assistant</h1>
            <span className="text-[11px] text-slate-400">Workspace: Fintech Microservice</span>
          </div>
        </div>

        {/* Global Navigation */}
        <nav className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50 text-xs">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium">
            Studio
          </Link>
          <Link href="/dashboard/chat" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors">
            AI Chat
          </Link>
          <Link href="/dashboard/reviews" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors">
            History
          </Link>
          <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-colors">
            Providers
          </Link>
        </nav>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <aside className="w-72 border-r border-slate-800 bg-slate-900/40 flex flex-col">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>REPOSITORY EXPLORER</span>
            <span className="text-[11px] text-indigo-400">{checkedFileIds.length} Selected</span>
          </div>

          <CodeExplorer
            files={files}
            selectedFileId={selectedFile.id}
            onSelectFile={(f) => setSelectedFile(f)}
            checkedFileIds={checkedFileIds}
            onToggleCheckFile={toggleCheckFile}
          />
        </aside>

        {/* Middle: Code Viewer / Editor */}
        <main className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950">
          <div className="h-10 border-b border-slate-800 bg-slate-900/30 px-4 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300">{selectedFile.path}</span>
            <span className="text-slate-500 font-mono">{selectedFile.size} bytes</span>
          </div>

          <div className="flex-1 p-4 font-mono text-xs overflow-auto bg-slate-950 text-slate-200">
            <pre className="leading-relaxed">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </main>

        {/* Right Sidebar: AI Review Controller & Output */}
        <section className="w-96 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Audit Mode
            </div>
            <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-lg">
              <button
                onClick={() => setReviewMode('SECURITY')}
                className={`py-1.5 text-xs font-medium rounded ${
                  reviewMode === 'SECURITY' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setReviewMode('PERFORMANCE')}
                className={`py-1.5 text-xs font-medium rounded ${
                  reviewMode === 'PERFORMANCE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Performance
              </button>
              <button
                onClick={() => setReviewMode('CODE_QUALITY')}
                className={`py-1.5 text-xs font-medium rounded ${
                  reviewMode === 'CODE_QUALITY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quality
              </button>
            </div>

            <button
              onClick={triggerReview}
              disabled={isReviewing}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-medium shadow-md shadow-indigo-600/30 transition-all"
            >
              {isReviewing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing Codebase...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Execute {reviewMode} Review
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {reviewResult ? (
              <>
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Severity</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {reviewResult.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{reviewResult.summary}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-400">Detected Issues ({reviewResult.issuesJson?.length || 0})</div>
                  {reviewResult.issuesJson?.map((issue: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-mono text-indigo-400">{issue.file}:{issue.line}</div>
                      <div className="text-xs font-semibold text-slate-200">{issue.rule}</div>
                      <div className="text-xs text-slate-400">{issue.message}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mb-2 stroke-[1.5]" />
                Select review mode and click Execute to start AI code analysis.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
