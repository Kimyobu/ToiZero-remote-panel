import React, { useEffect, useCallback, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import RightPanel from '../components/RightPanel';
import TopBar from '../components/TopBar';

export default function Dashboard() {
  const { fetchTasks, fetchLocalInfo, selectedTaskId, selectTask } = useTaskStore();
  const { autoRefreshEnabled, autoRefreshInterval } = useSettingsStore();
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

    // Ctrl+Enter — trigger submit
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('submit-btn')?.click();
    }

    // Escape — blur search
    if (e.key === 'Escape') {
      (document.activeElement as HTMLElement)?.blur();
    }
  }, []);

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
    <div className="flex flex-col h-screen bg-toi-bg overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="resize-handle" />
        <MainContent />
        <div className="resize-handle" />
        <RightPanel />
      </div>
    </div>
  );
}
