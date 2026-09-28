'use client';

import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, CheckSquare, Square } from 'lucide-react';

export interface FileItem {
  id: string;
  path: string;
  content: string;
  size: number;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFile: boolean;
  fileItem?: FileItem;
  children: Record<string, TreeNode>;
}

interface CodeExplorerProps {
  files: FileItem[];
  selectedFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  checkedFileIds: string[];
  onToggleCheckFile: (fileId: string) => void;
}

export function CodeExplorer({
  files,
  selectedFileId,
  onSelectFile,
  checkedFileIds,
  onToggleCheckFile,
}: CodeExplorerProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Build recursive tree
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

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const childKeys = Object.keys(node.children).sort((a, b) => {
      const aIsFile = node.children[a].isFile;
      const bIsFile = node.children[b].isFile;
      if (aIsFile === bIsFile) return a.localeCompare(b);
      return aIsFile ? 1 : -1; // Folders first
    });

    return childKeys.map((key) => {
      const child = node.children[key];
      const isOpen = openFolders[child.fullPath] ?? true; // Default open
      const isSelected = child.fileItem?.id === selectedFileId;
      const isChecked = child.fileItem ? checkedFileIds.includes(child.fileItem.id) : false;

      if (child.isFile) {
        return (
          <div
            key={child.fullPath}
            onClick={() => child.fileItem && onSelectFile(child.fileItem)}
            style={{ paddingLeft: `${depth * 14 + 12}px` }}
            className={`flex items-center gap-2 py-1.5 px-2 rounded-md text-xs cursor-pointer select-none transition-colors ${
              isSelected
                ? 'bg-indigo-600/20 text-indigo-300 font-medium'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
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
        );
      }

      return (
        <div key={child.fullPath}>
          <div
            onClick={() => toggleFolder(child.fullPath)}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
            className="flex items-center gap-1.5 py-1.5 px-2 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 cursor-pointer select-none"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400/80" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-400/80" />
            )}
            <span className="font-medium text-slate-300 truncate">{child.name}</span>
          </div>
          {isOpen && <div>{renderTree(child, depth + 1)}</div>}
        </div>
      );
    });
  };

  return (
    <div className="py-2 overflow-y-auto max-h-[calc(100vh-260px)]">
      {files.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">No files in repository</div>
      ) : (
        renderTree(rootNode)
      )}
    </div>
  );
}
