import React, { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import SubmitPanel from './SubmitPanel';
import HistoryPanel from './HistoryPanel';
import NotesEditor from './NotesEditor';
import ActivityFeed from './ActivityFeed';
import DevConsole from './DevConsole';
import { Send, History, FileText, Activity, Terminal } from 'lucide-react';
import { useSettingsStore as useSettings } from '../stores/settingsStore';

const TABS = [
  { id: 'submit' as const, label: 'Submit', icon: Send },
  { id: 'history' as const, label: 'History', icon: History },
  { id: 'notes' as const, label: 'Notes', icon: FileText },
  { id: 'activity' as const, label: 'Activity', icon: Activity },
];

export default function RightPanel() {
  const { rightPanelTab, setRightPanelTab, devMode } = useSettingsStore();
  const { selectedTaskId } = useTaskStore();

  const tabs = devMode ? [...TABS, { id: 'dev' as const, label: 'Dev', icon: Terminal }] : TABS;

  return (
    <div className="flex flex-col bg-toi-surface border-l border-toi-border" style={{ width: 280, minWidth: 240 }}>
      {/* Tabs */}
      <div className="flex border-b border-toi-border shrink-0 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = rightPanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setRightPanelTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-2 text-xs whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive 
                  ? 'text-toi-accent border-toi-accent' 
                  : 'text-toi-text-muted border-transparent hover:text-toi-text hover:bg-toi-card'
              }`}
              id={`tab-${tab.id}`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {!selectedTaskId && rightPanelTab !== 'activity' && rightPanelTab !== 'dev' ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-toi-muted text-center px-4">
              Select a task to use this panel
            </p>
          </div>
        ) : (
          <>
            {rightPanelTab === 'submit' && <SubmitPanel />}
            {rightPanelTab === 'history' && <HistoryPanel />}
            {rightPanelTab === 'notes' && <NotesEditor />}
            {rightPanelTab === 'activity' && <ActivityFeed />}
            {rightPanelTab === 'dev' && <DevConsole />}
          </>
        )}
      </div>
    </div>
  );
}
