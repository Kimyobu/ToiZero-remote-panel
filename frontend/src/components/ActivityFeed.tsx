import React from 'react';
import { useTaskStore } from '../stores/taskStore';
import { Activity, FolderOpen, Send, RefreshCw } from 'lucide-react';

const ICON_MAP = {
  open: FolderOpen,
  submit: Send,
  refresh: RefreshCw,
};

const COLOR_MAP = {
  open: 'text-toi-accent',
  submit: 'text-toi-green',
  refresh: 'text-toi-muted',
};

export default function ActivityFeed() {
  const { activity } = useTaskStore();

  if (activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-24 gap-1 p-4">
        <Activity className="w-5 h-5 text-toi-muted" />
        <p className="text-xs text-toi-text-muted">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header shrink-0">
        <span className="panel-title">
          <Activity className="w-3 h-3" />
          Activity Feed
        </span>
        <span className="text-xs text-toi-muted">{activity.length} events</span>
      </div>

      <div className="flex-1 scrollable">
        {activity.map((entry, i) => {
          const Icon = ICON_MAP[entry.type] || Activity;
          const color = COLOR_MAP[entry.type] || 'text-toi-muted';
          const time = new Date(entry.timestamp).toLocaleTimeString('th-TH', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });

          return (
            <div
              key={i}
              className="flex items-start gap-2 px-3 py-2 border-b border-toi-border/50 hover:bg-toi-card/50 transition-colors animate-fade-in"
            >
              <Icon className={`w-3 h-3 shrink-0 mt-0.5 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-medium text-toi-text">{entry.taskId}</span>
                  <span className="text-xs text-toi-muted">{time}</span>
                </div>
                <p className="text-xs text-toi-text-muted capitalize">{entry.type}</p>
                {entry.detail && (
                  <p className="text-xs text-toi-muted truncate">{entry.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
