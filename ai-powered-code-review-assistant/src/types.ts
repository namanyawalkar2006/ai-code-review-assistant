export interface FileItem {
  id: string;
  path: string;
  content: string;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: FileItem[];
  updatedAt: string;
}

export type ReviewMode = 'SECURITY' | 'PERFORMANCE' | 'CODE_QUALITY';
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ReviewIssue {
  file: string;
  line: number;
  rule: string;
  severity: SeverityLevel;
  message: string;
  suggestedFix: string;
}

export interface ReviewReport {
  id: string;
  projectId: string;
  projectName: string;
  mode: ReviewMode;
  summary: string;
  severity: SeverityLevel;
  issuesJson: ReviewIssue[];
  recommendationsJson: string[];
  createdAt: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
  isDefault: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface MonorepoFile {
  path: string;
  category: string;
  description: string;
  content: string;
  size: number;
}
