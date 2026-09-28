import React, { useState } from 'react';
import { Cpu, Check, Plus, Trash2, Activity, Sparkles, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { AIProvider } from '../types';

interface ProvidersPanelProps {
  providers: AIProvider[];
  onSetDefault: (id: string) => void;
  onAddProvider: (provider: { name: string; baseUrl: string; apiKey?: string; modelName: string; isDefault: boolean }) => void;
  onDeleteProvider: (id: string) => void;
}

export function ProvidersPanel({
  providers,
  onSetDefault,
  onAddProvider,
  onDeleteProvider,
}: ProvidersPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('llama3:8b');
  const [isDefault, setIsDefault] = useState(false);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latencyMs?: number; message: string } | null>(null);

  const handleTestProvider = async (provider: AIProvider) => {
    setTestingId(provider.id);
    setTestResult(null);

    try {
      const res = await fetch('/api/ai-providers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          modelName: provider.modelName,
        }),
      });
      const data = await res.json();
      setTestResult({
        id: provider.id,
        success: data.success,
        latencyMs: data.latencyMs,
        message: data.message || (data.success ? 'Operational' : 'Connection failed'),
      });
    } catch {
      setTestResult({
        id: provider.id,
        success: false,
        message: 'Endpoint unreachable from server network.',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseUrl || !modelName) return;
    onAddProvider({
      name: name || modelName,
      baseUrl,
      apiKey: apiKey || undefined,
      modelName,
      isDefault,
    });
    setName('');
    setApiKey('');
    setShowAddModal(false);
  };

  const PRESET_CONFIGS = [
    {
      name: 'Google Gemini 3.8 Flash (Server Default)',
      baseUrl: 'https://generativelanguage.googleapis.com',
      modelName: 'gemini-3.8-flash',
    },
    {
      name: 'Local Ollama Server',
      baseUrl: 'http://localhost:11434/v1',
      modelName: 'llama3:8b',
    },
    {
      name: 'LM Studio Local Instance',
      baseUrl: 'http://localhost:1234/v1',
      modelName: 'deepseek-coder-6.7b',
    },
    {
      name: 'OpenAI Cloud Endpoint',
      baseUrl: 'https://api.openai.com/v1',
      modelName: 'gpt-4o',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Dynamic AI Provider Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between Google Gemini, local offline models (Ollama / LM Studio), or custom OpenAI-compatible endpoints with dynamic JSON enforcement.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Provider</span>
        </button>
      </div>

      {/* Preset Quick Add Helpers */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
        <span className="text-xs font-semibold text-slate-300">Quick-Load Presets</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {PRESET_CONFIGS.map((preset, i) => (
            <div
              key={i}
              onClick={() => {
                setName(preset.name);
                setBaseUrl(preset.baseUrl);
                setModelName(preset.modelName);
                setShowAddModal(true);
              }}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-1 group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                {preset.name}
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate">{preset.baseUrl}</div>
              <div className="text-[10px] font-mono text-indigo-400 font-semibold">{preset.modelName}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Cards */}
      <div className="mt-6 space-y-4">
        {providers.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300">No custom AI providers configured</p>
              <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                Connect a local Ollama instance (localhost:11434), LM Studio, or an OpenAI endpoint to run reviews on-premise.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 transition-colors"
            >
              Add Provider
            </button>
          </div>
        ) : (
          providers.map((provider) => {
          const isTesting = testingId === provider.id;
          const result = testResult?.id === provider.id ? testResult : null;

          return (
            <div
              key={provider.id}
              className={`p-5 rounded-2xl border transition-all ${
                provider.isDefault
                  ? 'bg-slate-900/80 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-white">{provider.name}</h3>
                    {provider.isDefault && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        ACTIVE ENGINE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500">Base URL:</span> {provider.baseUrl}
                    </div>
                    <div>
                      <span className="text-slate-500">Model:</span> <span className="text-indigo-400">{provider.modelName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">API Key:</span> {provider.apiKey ? '••••••••' : '(Server Secret Env)'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestProvider(provider)}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{isTesting ? 'Testing...' : 'Ping Test'}</span>
                  </button>

                  {!provider.isDefault && (
                    <button
                      onClick={() => onSetDefault(provider.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Set Active</span>
                    </button>
                  )}

                  {providers.length > 1 && !provider.isDefault && (
                    <button
                      onClick={() => onDeleteProvider(provider.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove Provider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ping Test Result Banner */}
              {result && (
                <div
                  className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between ${
                    result.success
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 shrink-0" />
                    <span>{result.message}</span>
                  </div>
                  {result.latencyMs !== undefined && (
                    <span className="font-mono text-[11px] font-semibold">{result.latencyMs}ms</span>
                  )}
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* Add Custom Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> Configure Dynamic AI Provider
            </h3>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Display Label</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Local Ollama Llama-3"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Base URL (OpenAI-compatible /v1 endpoint)</label>
              <input
                type="text"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1 or https://api.openai.com/v1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Model Name / Identifier</label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="llama3:8b, mistral, gpt-4o"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">API Key (Optional for local Ollama/LM Studio)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>Set as active default AI engine for all reviews</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
              >
                Save AI Provider
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
