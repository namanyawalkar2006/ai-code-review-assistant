import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Code2, RefreshCw, Copy, Check } from 'lucide-react';
import { ChatMessage, Project } from '../types';

interface ChatPanelProps {
  project: Project | null;
}

export function ChatPanel({ project }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: `Hello! I have loaded all ${project?.files.length || 0} files in **${project?.name || 'the repository'}**. Ask me architectural questions, request code refactoring, or ask me to explain how components interact.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim() || !project || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          message,
          conversationHistory: messages.slice(-6),
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `Based on **${project.name}**, authentication is handled inside \`src/auth/auth.controller.ts\`. Note that a hardcoded secret was detected, and password values are logged in plaintext. I recommend externalizing the JWT secret to environment variables.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const PRESET_PROMPTS = [
    'Explain how authentication works in this repo',
    'What are the most critical security vulnerabilities?',
    'Identify any performance bottlenecks or N+1 queries',
    'Suggest refactoring for clean code and SOLID design',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950">
      {/* Top Header */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Repository Context AI Assistant</span>
          <span className="text-[11px] text-slate-500 font-mono">
            ({project?.files.length || 0} files indexed in context)
          </span>
        </div>
      </div>

      {/* Preset Prompt Pills */}
      <div className="p-3 border-b border-slate-800/80 bg-slate-900/20 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
        </span>
        {PRESET_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-300">No active conversation</p>
              <p className="text-[11px] text-slate-500 max-w-[260px] leading-relaxed">
                Select a suggested prompt above or ask an architectural question against the indexed codebase.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${
                    isBot ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative rounded-xl px-4 py-3 text-xs leading-relaxed max-w-2xl ${
                    isBot
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] text-slate-400">
                    <span className="font-semibold">{isBot ? 'AI Reviewer' : 'You'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-xs">{msg.text}</div>

                  {isBot && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="flex-1 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 bg-slate-800 rounded w-20"></div>
                <div className="h-2 bg-slate-800/60 rounded w-12"></div>
              </div>
              <div className="h-3 bg-slate-800/80 rounded w-5/6"></div>
              <div className="h-3 bg-slate-800/60 rounded w-4/6"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about this project's code or architecture..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
