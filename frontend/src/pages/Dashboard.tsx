import React, { useEffect, useCallback, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import RightPanel from '../components/RightPanel';
import TopBar from '../components/TopBar';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

export default function Dashboard() {
  const { fetchTasks, fetchLocalInfo, selectedTaskId, selectTask } = useTaskStore();
  const { 
    autoRefreshEnabled, autoRefreshInterval,
    isSidebarOpen, toggleSidebar,
    mainContentView, setMainContentView,
  } = useSettingsStore();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load
  useEffect(() => {
    fetchTasks();
    fetchLocalInfo();
    
    // Restore selected task if persisted
    if (selectedTaskId) {
      selectTask(selectedTaskId);
    }
  }, []);

  // Auto refresh
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    if (autoRefreshEnabled) {
      refreshTimer.current = setInterval(() => {
        fetchTasks(true);
      }, autoRefreshInterval * 1000);
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [autoRefreshEnabled, autoRefreshInterval]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K — focus search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      document.getElementById('task-search-input')?.focus();
    }

    // Ctrl+B — toggle sidebar
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }

    // Ctrl+\ — toggle split view
    if (e.ctrlKey && e.key === '\\') {
      e.preventDefault();
      setMainContentView(mainContentView === 'split' ? 'pdf' : 'split');
    }

    // Alt+1/2/3 — switch view modes
    if (e.altKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
      e.preventDefault();
      const modes: Record<string, 'pdf' | 'split' | 'code'> = { '1': 'pdf', '2': 'split', '3': 'code' };
      setMainContentView(modes[e.key]);
    }

    // Ctrl+S — trigger manual save to local
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('toi:save-local'));
    }

    // Ctrl+Enter — trigger submit
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('submit-btn')?.click();
    }

    // Escape — blur search
    if (e.key === 'Escape') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, [toggleSidebar, mainContentView, setMainContentView]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Session expired listener
  useEffect(() => {
    const handler = () => {
      // Handled in App.tsx via store
    };
    window.addEventListener('toi:session-expired', handler);
    return () => window.removeEventListener('toi:session-expired', handler);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-toi-bg overflow-hidden text-selection antialiased">
      <ErrorBoundary name="TopBar">
        <TopBar />
      </ErrorBoundary>
      
      <div className="flex flex-1 overflow-hidden relative selection:bg-toi-accent/30">
        {/* Sidebar - Conditional visibility */}
        <div className={`h-full overflow-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}>
          <div className="h-full flex flex-row">
            <ErrorBoundary name="Sidebar">
              <Sidebar />
            </ErrorBoundary>
            <div className="resize-handle hover:bg-toi-accent/40 active:bg-toi-accent/60 transition-colors" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-w-0 bg-toi-bg shadow-2xl shadow-black/20">
          <ErrorBoundary name="MainContent">
            <MainContent />
          </ErrorBoundary>
        </div>

        {/* Right Panel - Hidden on small mobile */}
        <div className="hidden lg:flex lg:flex-row h-full overflow-hidden flex-shrink-0">
          <div className="resize-handle hover:bg-toi-accent/40 active:bg-toi-accent/60 transition-colors" />
          <ErrorBoundary name="RightPanel">
            <RightPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
