import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import PDFViewer from './PDFViewer';
import { FileQuestion, Link, X, ExternalLink, BookOpen, FileCode } from 'lucide-react';

export default function MainContent() {
  const { selectedTaskId, taskDetail, isLoadingDetail } = useTaskStore();
  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [appliedUrl, setAppliedUrl] = useState<string | undefined>();

  // Reset manual URL when task changes
  useEffect(() => {
    setManualUrl('');
    setAppliedUrl(undefined);
    setShowUrlInput(false);
  }, [selectedTaskId]);

  if (!selectedTaskId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-toi-bg gap-4 p-8">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-toi-card border border-toi-border flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-toi-muted" />
          </div>
          <h2 className="text-sm font-semibold text-toi-text mb-1">Select a Task</h2>
          <p className="text-xs text-toi-text-muted">
            Choose a task from the sidebar to view the PDF and submit your solution
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <kbd className="kbd">Ctrl</kbd>
            <span className="text-toi-muted text-xs">+</span>
            <kbd className="kbd">K</kbd>
            <span className="text-xs text-toi-text-muted">to search</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-toi-bg">
      {/* Task header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-toi-surface border-b border-toi-border shrink-0">
        <span className="text-xs font-mono font-bold text-toi-accent">{selectedTaskId}</span>
        {taskDetail?.title && taskDetail.title !== selectedTaskId && (
          <>
            <span className="text-toi-border">·</span>
            <span className="text-xs text-toi-text truncate">{taskDetail.title}</span>
          </>
        )}
        {taskDetail && (
          <>
            <span className="text-toi-border">·</span>
            <StatusBadge status={taskDetail.status} score={taskDetail.score} maxScore={taskDetail.maxScore} />
          </>
        )}
        <div className="flex-1" />

        {/* URL Override */}
        {showUrlInput ? (
          <div className="flex items-center gap-1">
            <input
              className="input w-48 py-0.5 text-xs font-mono"
              placeholder="https://...pdf"
              value={manualUrl}
              onChange={e => setManualUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { setAppliedUrl(manualUrl || undefined); setShowUrlInput(false); }
                if (e.key === 'Escape') setShowUrlInput(false);
              }}
              autoFocus
            />
            <button
              className="btn-primary py-0.5"
              onClick={() => { setAppliedUrl(manualUrl || undefined); setShowUrlInput(false); }}
            >
              Apply
            </button>
            <button
              className="p-1 text-toi-muted hover:text-toi-text"
              onClick={() => { setShowUrlInput(false); setAppliedUrl(undefined); setManualUrl(''); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUrlInput(true)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              appliedUrl 
                ? 'text-toi-yellow' 
                : 'text-toi-muted hover:text-toi-text'
            }`}
            title="Override PDF URL"
          >
            <Link className="w-3 h-3" />
            {appliedUrl ? 'Custom URL' : 'Override URL'}
          </button>
        )}

        {taskDetail?.pdfUrl && (
          <a
            href={taskDetail.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-toi-muted hover:text-toi-text transition-colors"
            title="Open PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-5 h-5 border-2 border-toi-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-toi-text-muted">Loading task...</span>
          </div>
        ) : (
          <PDFViewer taskId={selectedTaskId} manualUrl={appliedUrl} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, score, maxScore }: { status: string; score: number | null; maxScore: number }) {
  const cls = {
    solved: 'badge-solved',
    attempted: 'badge-attempted',
    not_submitted: 'badge-not-submitted',
  }[status] || 'badge-not-submitted';

  const label = {
    solved: 'Solved',
    attempted: 'Attempted',
    not_submitted: 'Not submitted',
  }[status] || status;

  return (
    <span className={cls}>
      {score !== null ? `${score}/${maxScore}` : label}
    </span>
  );
}
