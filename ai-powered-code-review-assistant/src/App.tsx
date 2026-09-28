import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { ReviewPanel } from './components/ReviewPanel';
import { ChatPanel } from './components/ChatPanel';
import { GeneratorsPanel } from './components/GeneratorsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ProvidersPanel } from './components/ProvidersPanel';
import { MonorepoInspector } from './components/MonorepoInspector';
import { ReviewModal } from './components/ReviewModal';
import { Project, FileItem, ReviewReport, ReviewIssue, AIProvider, ReviewMode } from './types';
import { RefreshCw, Plus, FolderGit2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'chat' | 'generators' | 'history' | 'providers' | 'monorepo'>('studio');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [checkedFileIds, setCheckedFileIds] = useState<string[]>([]);

  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [reviews, setReviews] = useState<ReviewReport[]>([]);
  const [currentReview, setCurrentReview] = useState<ReviewReport | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [inspectingReview, setInspectingReview] = useState<any | null>(null);

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Initial load
  useEffect(() => {
    // Load projects
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data: Project[]) => {
        setProjects(data);
        if (data.length > 0) {
          const first = data[0];
          setActiveProject(first);
          if (first.files.length > 0) {
            setSelectedFile(first.files[0]);
            setCheckedFileIds(first.files.map((f) => f.id));
          }
        }
      });

    // Load AI providers
    fetch('/api/ai-providers')
      .then((res) => res.json())
      .then((data: AIProvider[]) => setProviders(data));

    // Load review history
    fetch('/api/reviews/history')
      .then((res) => res.json())
      .then((data: { items: ReviewReport[] }) => {
        setReviews(data.items || []);
        if (data.items && data.items.length > 0) {
          setCurrentReview(data.items[0]);
        }
      });
  }, []);

  const handleSelectProject = (proj: Project) => {
    setActiveProject(proj);
    if (proj.files.length > 0) {
      setSelectedFile(proj.files[0]);
      setCheckedFileIds(proj.files.map((f) => f.id));
    } else {
      setSelectedFile(null);
      setCheckedFileIds([]);
    }
  };

  const handleToggleCheckFile = (fileId: string) => {
    setCheckedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  const handleToggleCheckAll = () => {
    if (!activeProject) return;
    if (checkedFileIds.length === activeProject.files.length) {
      setCheckedFileIds([]);
    } else {
      setCheckedFileIds(activeProject.files.map((f) => f.id));
    }
  };

  const handleUploadFiles = async (newFiles: Array<{ path: string; content: string; size?: number }>) => {
    if (!activeProject) return;

    try {
      const res = await fetch(`/api/projects/${activeProject.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: newFiles }),
      });
      const data = await res.json();
      if (data.project) {
        setProjects((prev) =>
          prev.map((p) => (p.id === activeProject.id ? data.project : p)),
        );
        setActiveProject(data.project);
        if (data.project.files.length > 0) {
          setSelectedFile(data.project.files[data.project.files.length - 1]);
          setCheckedFileIds(data.project.files.map((f: FileItem) => f.id));
        }
      }
    } catch (err) {
      console.error('Failed to upload files:', err);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    if (!activeProject) return;
    const updatedFiles = activeProject.files.filter((f) => f.id !== fileId);
    const updatedProj = { ...activeProject, files: updatedFiles };

    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProj : p)));
    setActiveProject(updatedProj);
    if (selectedFile?.id === fileId) {
      setSelectedFile(updatedFiles[0] || null);
    }

    fetch(`/api/projects/${activeProject.id}/files/${fileId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('Error deleting file on backend:', err));
  };

  const handleSaveFileContent = (fileId: string, newContent: string) => {
    if (!activeProject) return;
    const updatedFiles = activeProject.files.map((f) =>
      f.id === fileId ? { ...f, content: newContent, size: newContent.length } : f,
    );
    const updatedProj = { ...activeProject, files: updatedFiles };
    setProjects((prev) => prev.map((p) => (p.id === activeProject.id ? updatedProj : p)));
    setActiveProject(updatedProj);
    if (selectedFile?.id === fileId) {
      setSelectedFile({ ...selectedFile, content: newContent, size: newContent.length });
    }

    fetch(`/api/projects/${activeProject.id}/files/${fileId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    }).catch((err) => console.error('Error updating file on backend:', err));
  };

  const handleExecuteReview = async (
    mode: ReviewMode,
    scope: 'SINGLE_FILE' | 'SELECTED_FILES' | 'FULL_PROJECT',
  ) => {
    if (!activeProject) return;
    setIsReviewing(true);

    const targetIds =
      scope === 'SINGLE_FILE' && selectedFile
        ? [selectedFile.id]
        : scope === 'SELECTED_FILES'
        ? checkedFileIds
        : activeProject.files.map((f) => f.id);

    try {
      const res = await fetch('/api/reviews/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProject.id,
          mode,
          fileIds: targetIds,
        }),
      });

      if (!res.ok) {
        throw new Error(`Review request failed with status: ${res.status}`);
      }

      const newReview: ReviewReport = await res.json();
      if (newReview && Array.isArray(newReview.issuesJson)) {
        setCurrentReview(newReview);
        setReviews((prev) => [newReview, ...prev]);
      }
    } catch (err) {
      console.error('Review execution error:', err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleApplyFix = (issue: ReviewIssue) => {
    if (!activeProject || !issue.suggestedFix) return;

    // Find corresponding file
    const targetFile = activeProject.files.find(
      (f) => f.path === issue.file || f.path.endsWith(issue.file) || issue.file.endsWith(f.path),
    );

    if (targetFile) {
      const lines = targetFile.content.split('\n');
      if (issue.line > 0 && issue.line <= lines.length) {
        lines[issue.line - 1] = `// FIX APPLIED (${issue.rule}):\n${issue.suggestedFix}`;
        const newCode = lines.join('\n');
        handleSaveFileContent(targetFile.id, newCode);
      }
    }
  };

  const handleJumpToLine = (filePath: string, line: number) => {
    if (!activeProject) return;
    const file = activeProject.files.find(
      (f) => f.path === filePath || f.path.endsWith(filePath) || filePath.endsWith(f.path),
    );
    if (file) {
      setSelectedFile(file);
      setTimeout(() => {
        const el = document.getElementById(`line-${line}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDesc,
      }),
    });
    const created: Project = await res.json();
    setProjects((prev) => [created, ...prev]);
    setActiveProject(created);
    setSelectedFile(null);
    setCheckedFileIds([]);
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectModal(false);
  };

  const handleSetDefaultProvider = async (id: string) => {
    await fetch(`/api/ai-providers/${id}/default`, { method: 'PUT' });
    setProviders((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));
  };

  const handleAddProvider = async (p: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    modelName: string;
    isDefault: boolean;
  }) => {
    const res = await fetch('/api/ai-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    const created = await res.json();
    setProviders((prev) => {
      const updated = p.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : [...prev];
      return [...updated, created];
    });
  };

  const handleDeleteProvider = async (id: string) => {
    await fetch(`/api/ai-providers/${id}`, { method: 'DELETE' });
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  const activeProvider = providers.find((p) => p.isDefault) || providers[0] || null;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        onNewProject={() => setShowNewProjectModal(true)}
        activeProvider={activeProvider}
      />

      {/* Main Tab Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'studio' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left File Tree Sidebar */}
            <aside className="w-72 shrink-0">
              <FileTree
                files={activeProject?.files || []}
                selectedFileId={selectedFile?.id || null}
                onSelectFile={(f) => setSelectedFile(f)}
                checkedFileIds={checkedFileIds}
                onToggleCheckFile={handleToggleCheckFile}
                onToggleCheckAll={handleToggleCheckAll}
                onUploadFiles={handleUploadFiles}
                onDeleteFile={handleDeleteFile}
              />
            </aside>

            {/* Middle Code Viewer / Editor */}
            <main className="flex-1 flex">
              <CodeViewer
                file={selectedFile}
                issues={currentReview?.issuesJson || []}
                onSaveContent={handleSaveFileContent}
              />
            </main>

            {/* Right Review Panel */}
            <aside className="shrink-0">
              <ReviewPanel
                currentReview={currentReview}
                isReviewing={isReviewing}
                onExecuteReview={handleExecuteReview}
                selectedFileCount={checkedFileIds.length}
                onApplyFix={handleApplyFix}
                onJumpToLine={handleJumpToLine}
              />
            </aside>
          </div>
        )}

        {activeTab === 'chat' && <ChatPanel project={activeProject} />}

        {activeTab === 'generators' && <GeneratorsPanel project={activeProject} />}

        {activeTab === 'history' && (
          <HistoryPanel
            reviews={reviews}
            onSelectReview={(r) => setInspectingReview(r)}
          />
        )}

        {activeTab === 'providers' && (
          <ProvidersPanel
            providers={providers}
            onSetDefault={handleSetDefaultProvider}
            onAddProvider={handleAddProvider}
            onDeleteProvider={handleDeleteProvider}
          />
        )}

        {activeTab === 'monorepo' && <MonorepoInspector />}
      </div>

      {/* Review Detail Modal */}
      {inspectingReview && (
        <ReviewModal
          review={inspectingReview}
          onClose={() => setInspectingReview(null)}
        />
      )}

      {/* New Project Dialog */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <form
            onSubmit={handleCreateProject}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Create New Project Workspace</h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Project Name</label>
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Identity Microservice"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Description (Optional)</label>
              <textarea
                rows={3}
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="Brief summary of application purpose and architecture..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
