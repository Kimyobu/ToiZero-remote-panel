export interface Task {
  id: string;
  title: string;
  score: number | null;
  maxScore: number;
  status: 'solved' | 'attempted' | 'not_submitted';
  lastSubmission: string | null;
  pdfUrl: string | null;
  category: string;
  // augmented locally
  localFiles?: LocalFiles | null;
  notes?: string | null;
  submissions?: Submission[];
  csrfToken?: string | null;
}

export interface LocalFiles {
  pdf: string | null;
  solution: string | null;
  solutionExt: string | null;
  notes: string | null;
}

export interface Submission {
  id: string;
  timestamp: string;
  result: string;
  score: number | null;
  language?: string;
}

export interface TaskDetail extends Task {
  csrfToken: string | null;
  submissions: Submission[];
}

export interface AuthState {
  cookie: string | null;
  valid: boolean;
  username?: string;
}

export interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  duration: number;
  error?: string;
}

export interface LocalTaskInfo {
  taskId: string;
  hasNotes: boolean;
  hasSolution: boolean;
  hasPdf: boolean;
  solutionFile: string | null;
  solutionExt: string | null;
}

export interface ActivityEntry {
  type: 'open' | 'submit' | 'refresh';
  taskId: string;
  timestamp: string;
  detail?: string;
}
