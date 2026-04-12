import React, { useEffect, useState, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import PDFViewer from './PDFViewer';
import CodeEditor from './CodeEditor';
import { 
  FileQuestion, Link, X, ExternalLink, BookOpen, 
  FileCode, FileText, Columns, Square, Maximize2 
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export default function MainContent() {
  const { selectedTaskId, taskDetail, isLoadingDetail } = useTaskStore();
  const { 
    mainContentView, setMainContentView, 
    mainContentSplitRatio, setMainContentSplitRatio 
  } = useSettingsStore();

  const [manualUrl, setManualUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [appliedUrl, setAppliedUrl] = useState<string | undefined>();
  const isResizing = useRef(false);

  // Resize handler for split view
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const container = document.getElementById('main-content-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = (x / rect.width) * 100;
      setMainContentSplitRatio(ratio);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setMainContentSplitRatio]);

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

        {/* View Mode Controls */}
        <div className="flex items-center gap-1 bg-toi-card/50 rounded-lg p-0.5 border border-toi-border/50 ml-2">
          <button
            onClick={() => setMainContentView('pdf')}
            className={`p-1 rounded ${mainContentView === 'pdf' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
            title="PDF View"
          >
            <BookOpen className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMainContentView('split')}
            className={`p-1 rounded ${mainContentView === 'split' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
            title="Split View"
          >
            <Columns className="w-3 h-3" />
          </button>
          <button
            onClick={() => setMainContentView('code')}
            className={`p-1 rounded ${mainContentView === 'code' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
            title="Code View"
          >
            <FileCode className="w-3 h-3" />
          </button>
        </div>

        {/* External Links */}
        <div className="flex items-center gap-3 border-l border-toi-border ml-2 pl-4">
          <a
            href={`https://toi-coding.informatics.buu.ac.th/00-pre-toi/tasks/${selectedTaskId}/description`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-toi-muted hover:text-toi-text transition-colors flex items-center gap-1.5 group"
            title="Open Task Statement (Description)"
          >
            <BookOpen className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">Statement</span>
          </a>

          {taskDetail?.pdfUrl && (
            <a
              href={taskDetail.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-toi-muted hover:text-toi-text transition-colors flex items-center gap-1.5 group"
              title="Open Task PDF"
            >
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:inline">PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div id="main-content-container" className="flex-1 flex overflow-hidden relative">
        {isLoadingDetail ? (
          <div className="absolute inset-0 p-4 space-y-4 animate-pulse">
            <div className="h-8 bg-toi-surface rounded w-1/3" />
            <div className="flex-1 bg-toi-surface rounded-lg h-[80%]" />
            <div className="h-6 bg-toi-surface rounded w-2/3" />
          </div>
        ) : (
          <>
            {/* PDF Section */}
            {(mainContentView === 'pdf' || mainContentView === 'split') && (
              <div 
                className="h-full overflow-hidden"
                style={{ width: mainContentView === 'split' ? `${mainContentSplitRatio}%` : '100%' }}
              >
                <PDFViewer taskId={selectedTaskId} manualUrl={appliedUrl} />
              </div>
            )}

            {/* Resize Handle */}
            {mainContentView === 'split' && (
              <div 
                className="resize-handle active:bg-toi-accent" 
                onMouseDown={(e) => {
                  isResizing.current = true;
                  document.body.style.cursor = 'col-resize';
                  document.body.style.userSelect = 'none';
                }}
              />
            )}

            {/* Code Section */}
            {(mainContentView === 'code' || mainContentView === 'split') && (
              <div 
                className="h-full overflow-hidden"
                style={{ flex: mainContentView === 'split' ? '1 1 0%' : '1 1 0%', width: mainContentView === 'code' ? '100%' : 'auto' }}
              >
                <CodeEditor taskId={selectedTaskId} />
              </div>
            )}
          </>
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
