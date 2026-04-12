import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Zap, RefreshCw, LogOut, Clock, 
  ToggleLeft, ToggleRight, Terminal, Loader2, Moon, Sun, PanelLeft, Layout, Columns, Monitor
} from 'lucide-react';
import { useSubmissionStore } from '../stores/submissionStore';

/**
 * Global submission indicator that reacts to any client's submission
 */
function SubmissionIndicator() {
  const { isSubmitting, submittingTaskId } = useSubmissionStore();

  if (!isSubmitting) return null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 bg-toi-accent/20 border border-toi-accent/30 rounded-full animate-pulse shrink-0">
      <Loader2 className="w-3 h-3 text-toi-accent animate-spin" />
      <span className="text-[10px] font-bold text-toi-accent uppercase tracking-wider">
        Submitting {submittingTaskId}
      </span>
    </div>
  );
}

/**
 * Isolated Clock component to prevent the entire TopBar from re-rendering every second.
 * This is a key performance optimization.
 */
function IsolatedClock() {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-toi-accent text-[11px] md:text-xs font-mono font-bold tabular-nums">
      <Clock className="w-3 h-3 text-toi-accent/50" />
      <span>{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
}

export default function TopBar() {
  const { username, logout } = useAuthStore();
  const { fetchTasks, isLoadingList, lastRefreshed, tasks } = useTaskStore();
  const { 
    autoRefreshEnabled, autoRefreshInterval, toggleAutoRefresh, 
    devMode, toggleDevMode, theme, toggleTheme,
    isSidebarOpen, toggleSidebar,
    mainContentView, setMainContentView
  } = useSettingsStore();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Listen for online/offline
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Memoize score calculations to prevent recalculating on every render
  const stats = React.useMemo(() => {
    let total = 0;
    let max = 0;
    tasks.forEach(t => {
      total += (t.score || 0);
      max += (t.maxScore || 100);
    });
    const progress = max > 0 ? Math.round((total / max) * 100) : 0;
    
    let color = 'bg-toi-red';
    let glow = 'shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    if (progress >= 80) {
      color = 'bg-toi-green';
      glow = 'shadow-[0_0_8px_rgba(34,197,94,0.4)]';
    } else if (progress >= 40) {
      color = 'bg-toi-yellow';
      glow = 'shadow-[0_0_8px_rgba(234,179,8,0.4)]';
    }
    
    return { total, max, progress, color, glow };
  }, [tasks]);

  const formatLastRefresh = () => {
    if (!lastRefreshed) return 'Never';
    const d = new Date(lastRefreshed);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-toi-surface/90 border-b border-toi-border glass shrink-0 z-50">
      {/* Logo + Sidebar Toggle */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded-md transition-all hover:bg-toi-card active:scale-95 ${isSidebarOpen ? 'text-toi-accent bg-toi-accent/5' : 'text-toi-muted'}`}
          title="Toggle Sidebar (Ctrl+B)"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="relative">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-toi-accent to-blue-600 flex items-center justify-center shadow shadow-toi-accent/30">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-toi-surface ${
              isOnline ? 'bg-toi-green animate-pulse' : 'bg-toi-red'
            }`} 
            title={isOnline ? 'Connected' : 'Offline'}
          />
        </div>
        <span className="text-xs font-bold text-toi-text hidden sm:inline tracking-tight">ToiZero</span>
      </div>

      <div className="w-px h-4 bg-toi-border/50 shrink-0" />

      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-16 md:w-24 h-1.5 bg-toi-border rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${stats.color} ${stats.glow}`}
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-[10px] md:text-xs text-toi-text-muted font-mono tabular-nums whitespace-nowrap">{stats.progress}%</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono tabular-nums">
            <span className={stats.total > 0 ? "text-toi-text" : "text-toi-muted"}>{stats.total}</span>
            <span className="text-toi-muted/30">/</span>
            <span className="text-toi-muted">{stats.max}</span>
          </div>
        </div>
      )}
      <div className="w-px h-4 bg-toi-border/50 shrink-0" />

      {/* View Mode Switcher */}
      <div className="flex items-center bg-toi-card/30 p-0.5 rounded-lg border border-toi-border/30 gap-0.5">
        <button
          onClick={() => setMainContentView('pdf')}
          className={`p-1 rounded transition-all flex items-center gap-1.5 px-2 ${mainContentView === 'pdf' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
          title="Statement Only (Alt+1)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden xl:inline">PDF</span>
        </button>
        <button
          onClick={() => setMainContentView('split')}
          className={`p-1 rounded transition-all flex items-center gap-1.5 px-2 ${mainContentView === 'split' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
          title="Split View (Alt+2 / Ctrl+\)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden xl:inline">SPLIT</span>
        </button>
        <button
          onClick={() => setMainContentView('code')}
          className={`p-1 rounded transition-all flex items-center gap-1.5 px-2 ${mainContentView === 'code' ? 'bg-toi-accent text-white shadow-sm' : 'text-toi-muted hover:text-toi-text'}`}
          title="Editor Only (Alt+3)"
        >
          <Layout className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden xl:inline">CODE</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Clock + Last refreshed */}
      <div className="flex items-center gap-3 mr-1 shrink-0">
        {lastRefreshed && (
          <div className="hidden lg:flex items-center gap-1 text-toi-muted/60 text-[10px]" title="Last sync">
            <RefreshCw className="w-2.5 h-2.5" />
            <span>{formatLastRefresh()}</span>
          </div>
        )}
        <IsolatedClock />
      </div>

      {/* Global Submission Status */}
      <SubmissionIndicator />

      <div className="w-px h-4 bg-toi-border shrink-0" />

      {/* Auto refresh toggle */}
      <button
        onClick={toggleAutoRefresh}
        className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md transition-all active:scale-95 ${
          autoRefreshEnabled 
            ? 'text-toi-accent bg-toi-accent/10' 
            : 'text-toi-muted hover:text-toi-text'
        }`}
        title={`Auto refresh: ${autoRefreshEnabled ? `${autoRefreshInterval}s` : 'Off'}`}
        id="auto-refresh-toggle"
      >
        {autoRefreshEnabled 
          ? <ToggleRight className="w-4 h-4" /> 
          : <ToggleLeft className="w-4 h-4" />
        }
        <span className="hidden xl:inline font-medium capitalize">Auto</span>
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

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="text-toi-muted hover:text-toi-text transition-colors p-1 rounded-md hover:bg-toi-card"
        title={`Toggle theme (Current: ${theme})`}
        id="theme-toggle-btn"
      >
        {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
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
