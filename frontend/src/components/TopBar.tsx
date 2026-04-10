import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Zap, RefreshCw, LogOut, Settings, Clock, 
  ToggleLeft, ToggleRight, Terminal, Loader2 
} from 'lucide-react';

export default function TopBar() {
  const { username, logout } = useAuthStore();
  const { fetchTasks, isLoadingList, lastRefreshed, tasks } = useTaskStore();
  const { 
    autoRefreshEnabled, autoRefreshInterval, toggleAutoRefresh, devMode, toggleDevMode 
  } = useSettingsStore();

  const [currentTime, setCurrentTime] = React.useState(new Date());

  // Update clock every second
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let totalScore = 0;
  let maxPossibleScore = 0;
  
  tasks.forEach(t => {
    totalScore += (t.score || 0);
    maxPossibleScore += (t.maxScore || 100);
  });

  const progress = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  
  let progressColor = 'bg-toi-yellow shadow-[0_0_8px_rgba(234,179,8,0.5)]'; // <= 60%
  if (progress === 100) {
    progressColor = 'bg-toi-green shadow-[0_0_8px_rgba(34,197,94,0.5)]'; // 100%
  } else if (progress > 60) {
    progressColor = 'bg-toi-red shadow-[0_0_8px_rgba(239,68,68,0.5)]'; // > 60%
  }

  const formatLastRefresh = () => {
    if (!lastRefreshed) return 'Never';
    const d = new Date(lastRefreshed);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-toi-surface/80 border-b border-toi-border glass shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-toi-accent to-blue-600 flex items-center justify-center shadow shadow-toi-accent/30">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-toi-text">ToiZero</span>
      </div>

      <div className="w-px h-4 bg-toi-border shrink-0" />

      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-24 h-1.5 bg-toi-border rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-toi-text-muted font-mono">{progress}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={totalScore > 0 ? "text-toi-text" : "text-toi-muted"}>{totalScore}</span>
            <span className="text-toi-muted/50">/</span>
            <span className="text-toi-muted">{maxPossibleScore}</span>
            <span className="text-toi-muted ml-2 text-[10px]">({tasks.length} tasks)</span>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Clock + Last refreshed */}
      <div className="flex items-center gap-3 mr-2 shrink-0 border-r border-toi-border pr-3">
        {lastRefreshed && (
          <div className="flex items-center gap-1 text-toi-muted/60 text-xs" title="Last auto-refresh">
            <RefreshCw className="w-2.5 h-2.5" />
            <span>{formatLastRefresh()}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-toi-accent text-xs font-mono font-bold w-16 justify-end">
          <Clock className="w-3 h-3 text-toi-accent/70" />
          <span>{currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Auto refresh toggle */}
      <button
        onClick={toggleAutoRefresh}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
          autoRefreshEnabled 
            ? 'text-toi-accent bg-toi-accent/10' 
            : 'text-toi-muted hover:text-toi-text'
        }`}
        title={`Auto refresh: ${autoRefreshEnabled ? `every ${autoRefreshInterval}s` : 'off'}`}
        id="auto-refresh-toggle"
      >
        {autoRefreshEnabled 
          ? <ToggleRight className="w-3.5 h-3.5" /> 
          : <ToggleLeft className="w-3.5 h-3.5" />
        }
        <span className="hidden sm:inline">Auto</span>
      </button>

      {/* Refresh button */}
      <button
        onClick={() => fetchTasks(true)}
        disabled={isLoadingList}
        className="text-toi-muted hover:text-toi-text transition-colors disabled:opacity-50 p-1 rounded-md hover:bg-toi-card"
        title="Refresh tasks"
        id="refresh-btn"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin-slow' : ''}`} />
      </button>

      {/* Dev mode */}
      <button
        onClick={toggleDevMode}
        className={`p-1 rounded-md transition-colors ${
          devMode ? 'text-toi-yellow bg-toi-yellow/10' : 'text-toi-muted hover:text-toi-text hover:bg-toi-card'
        }`}
        title="Toggle dev mode"
        id="dev-mode-toggle"
      >
        <Terminal className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-toi-border shrink-0" />

      {/* User info + logout */}
      <div className="flex items-center gap-2">
        {username && (
          <span className="text-xs text-toi-text-muted">
            {username}
          </span>
        )}
        <button
          onClick={logout}
          className="text-toi-muted hover:text-toi-red transition-colors p-1 rounded-md hover:bg-toi-red/10"
          title="Disconnect"
          id="logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
