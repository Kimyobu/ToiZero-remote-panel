import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // seconds
  devMode: boolean;
  sidebarWidth: number;
  rightPanelTab: 'submit' | 'history' | 'notes' | 'activity' | 'dev';
  localPath: string | null;
  theme: 'dark' | 'light';
  mainContentView: 'pdf' | 'code' | 'split';
  mainContentSplitRatio: number; // percentage
  isSidebarOpen: boolean;

  toggleAutoRefresh: () => void;
  setAutoRefreshInterval: (n: number) => void;
  toggleDevMode: () => void;
  setSidebarWidth: (w: number) => void;
  setRightPanelTab: (tab: 'submit' | 'history' | 'notes' | 'activity' | 'dev') => void;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setMainContentView: (view: 'pdf' | 'code' | 'split') => void;
  setMainContentSplitRatio: (ratio: number) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      autoRefreshEnabled: false,
      autoRefreshInterval: 30,
      devMode: false,
      sidebarWidth: 260,
      rightPanelTab: 'submit',
      localPath: null,
      theme: 'dark', // default to dark theme
      mainContentView: 'pdf',
      mainContentSplitRatio: 50,
      isSidebarOpen: true,

      toggleAutoRefresh: () => set(s => ({ autoRefreshEnabled: !s.autoRefreshEnabled })),
      setAutoRefreshInterval: (n) => set({ autoRefreshInterval: n }),
      toggleDevMode: () => set(s => ({ devMode: !s.devMode })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(400, w)) }),
      setRightPanelTab: (tab: 'submit' | 'history' | 'notes' | 'activity' | 'dev') => set({ rightPanelTab: tab }),
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      setMainContentView: (view) => set({ mainContentView: view }),
      setMainContentSplitRatio: (ratio) => set({ mainContentSplitRatio: Math.max(10, Math.min(90, ratio)) }),
      toggleSidebar: () => set(s => ({ isSidebarOpen: !s.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    {
      name: 'toi-settings',
    }
  )
);
