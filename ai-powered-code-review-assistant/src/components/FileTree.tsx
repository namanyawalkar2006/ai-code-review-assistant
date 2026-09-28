import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Upload,
  FileArchive,
  Plus,
  Trash2,
} from 'lucide-react';
import JSZip from 'jszip';
import { FileItem } from '../types';

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  fileItem?: FileItem;
  children: Record<string, TreeNode>;
}

interface FileTreeProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  checkedFileIds: string[];
  onToggleCheckFile: (fileId: string) => void;
  onToggleCheckAll: () => void;
  onUploadFiles: (uploaded: Array<{ path: string; content: string; size?: number }>) => void;
  onDeleteFile: (fileId: string) => void;
}

export function FileTree({
  files,
  selectedFileId,
  onSelectFile,
  checkedFileIds,
  onToggleCheckFile,
  onToggleCheckAll,
  onUploadFiles,
  onDeleteFile,
}: FileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Construct recursive tree
  const rootNode: TreeNode = { name: 'root', fullPath: '', isFile: false, children: {} };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = rootNode;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: currentPath,
          isFile: isLast,
          fileItem: isLast ? file : undefined,
          children: {},
        };
      }
      current = current.children[part];
    });
  });

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    const list: Array<{ path: string; content: string; size: number }> = [];
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const text = await file.text();
      list.push({
        path: file.webkitRelativePath || file.name,
        content: text,
        size: file.size,
      });
    }

    if (list.length > 0) onUploadFiles(list);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const extracted: Array<{ path: string; content: string; size: number }> = [];

      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('.DS_Store')) {
          const content = await zipEntry.async('string');
          extracted.push({
            path: relativePath,
            content,
            size: content.length,
          });
        }
      }

      if (extracted.length > 0) {
        onUploadFiles(extracted);
      }
    } catch (err) {
      console.error('ZIP extraction error:', err);
    }

    if (zipInputRef.current) zipInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const list: Array<{ path: string; content: string; size: number }> = [];
    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
          if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/')) {
            const content = await zipEntry.async('string');
            list.push({ path: relativePath, content, size: content.length });
          }
        }
      } else {
        const text = await file.text();
        list.push({ path: file.name, content: text, size: file.size });
      }
    }

    if (list.length > 0) onUploadFiles(list);
  };

  const handleCreateCustomFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;
    onUploadFiles([
      {
        path: newFilePath.trim(),
        content: newFileContent,
        size: newFileContent.length,
      },
    ]);
    setNewFilePath('');
    setNewFileContent('');
    setShowAddModal(false);
  };

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const childKeys = Object.keys(node.children).sort((a, b) => {
      const aIsFile = node.children[a].isFile;
      const bIsFile = node.children[b].isFile;
      if (aIsFile === bIsFile) return a.localeCompare(b);
      return aIsFile ? 1 : -1; // Folders first
    });

    return childKeys.map((key) => {
      const child = node.children[key];
      const isOpen = openFolders[child.fullPath] ?? true;
      const isSelected = child.fileItem?.id === selectedFileId;
      const isChecked = child.fileItem ? checkedFileIds.includes(child.fileItem.id) : false;

      if (child.isFile) {
        return (
          <div
            key={child.fullPath}
            onClick={() => child.fileItem && onSelectFile(child.fileItem)}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={`group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs cursor-pointer select-none transition-colors ${
              isSelected
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (child.fileItem) onToggleCheckFile(child.fileItem.id);
                }}
                className="text-slate-500 hover:text-indigo-400 focus:outline-none"
              >
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
              </button>
              <FileCode className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{child.name}</span>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-slate-500 font-mono">
                {child.fileItem ? `${child.fileItem.size}b` : ''}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (child.fileItem) onDeleteFile(child.fileItem.id);
                }}
                className="text-slate-500 hover:text-rose-400 p-0.5"
                title="Remove file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      }

      return (
        <div key={child.fullPath}>
          <div
            onClick={() => toggleFolder(child.fullPath)}
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer select-none"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400/90" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-400/90" />
            )}
            <span className="font-medium text-slate-300 truncate">{child.name}</span>
          </div>
          {isOpen && <div>{renderTree(child, depth + 1)}</div>}
        </div>
      );
    });
  };

  const allChecked = files.length > 0 && checkedFileIds.length === files.length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col h-full bg-slate-900/40 border-r border-slate-800 transition-all ${
        isDragging ? 'bg-indigo-950/40 border-indigo-500' : ''
      }`}
    >
      {/* Top Toolbar */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleCheckAll}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            title="Toggle Select All Files for Review"
          >
            {allChecked ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">
              Explorer ({checkedFileIds.length}/{files.length})
            </span>
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Files"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <input
            type="file"
            accept=".zip"
            ref={zipInputRef}
            onChange={handleZipUpload}
            className="hidden"
          />
          <button
            onClick={() => zipInputRef.current?.click()}
            title="Upload ZIP Repository"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FileArchive className="w-3.5 h-3.5 text-amber-400/90" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            title="Create Custom File"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Drag & Drop Hint */}
      {isDragging && (
        <div className="p-4 bg-indigo-600/10 border-b border-indigo-500/30 text-center text-xs text-indigo-300 font-medium animate-pulse">
          Drop files or ZIP to import into project
        </div>
      )}

      {/* Tree Content */}
      <div className="flex-1 p-2 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 space-y-3 flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-lg m-2 bg-slate-950/30">
            <div className="p-2.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              <Upload className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-300">No files uploaded yet.</p>
              <p className="text-[11px] text-slate-500 max-w-[210px] leading-relaxed">
                Drag &amp; drop a .zip or select files to begin analysis.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Select Files
              </button>
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
              >
                Upload .zip
              </button>
            </div>
          </div>
        ) : (
          renderTree(rootNode)
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between bg-slate-950/40">
        <span>Drag & drop files or ZIP</span>
        <span>{files.reduce((acc, f) => acc + f.size, 0).toLocaleString()} bytes</span>
      </div>

      {/* Add Custom File Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCustomFile}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-semibold text-white">Create New Code File</h3>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">File Path (e.g. src/auth/guard.ts)</label>
              <input
                type="text"
                required
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="src/controllers/api.controller.ts"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Initial Code / Snippet</label>
              <textarea
                rows={6}
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="// Enter code here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
