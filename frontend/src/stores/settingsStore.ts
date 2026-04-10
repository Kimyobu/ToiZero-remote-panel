import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // seconds
  devMode: boolean;
  sidebarWidth: number;
  rightPanelTab: 'submit' | 'history' | 'notes' | 'activity' | 'dev';
  localPath: string | null;

  toggleAutoRefresh: () => void;
  setAutoRefreshInterval: (n: number) => void;
  toggleDevMode: () => void;
  setSidebarWidth: (w: number) => void;
  setRightPanelTab: (tab: 'submit' | 'history' | 'notes' | 'activity' | 'dev') => void;
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

      toggleAutoRefresh: () => set(s => ({ autoRefreshEnabled: !s.autoRefreshEnabled })),
      setAutoRefreshInterval: (n) => set({ autoRefreshInterval: n }),
      toggleDevMode: () => set(s => ({ devMode: !s.devMode })),
      setSidebarWidth: (w) => set({ sidebarWidth: Math.max(180, Math.min(400, w)) }),
      setRightPanelTab: (tab: 'submit' | 'history' | 'notes' | 'activity' | 'dev') => set({ rightPanelTab: tab }),
    }),
    {
      name: 'toi-settings',
    }
  )
);
