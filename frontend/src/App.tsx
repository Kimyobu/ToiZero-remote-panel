import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useSubmissionStore } from './stores/submissionStore';
import { useSettingsStore } from './stores/settingsStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { cookie, valid, validate } = useAuthStore();
  const initSocket = useSubmissionStore(s => s.initSocket);
  const theme = useSettingsStore(s => s.theme);

  // Sync theme to root element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initialize Socket.io
  useEffect(() => {
    initSocket();
  }, [initSocket]);

  // Auto-validate or sync on startup
  useEffect(() => {
    const initAuth = async () => {
      if (cookie && !valid) {
        await validate();
      } else if (!valid) {
        // Try to sync with existing session from backend (e.g. from VSCode)
        await useAuthStore.getState().syncLocalSession();
      }
    };
    initAuth();
  }, [cookie, valid, validate]);

  // Handle session expired
  useEffect(() => {
    const handler = () => {
      useAuthStore.setState({ valid: false });
    };
    window.addEventListener('toi:session-expired', handler);
    return () => window.removeEventListener('toi:session-expired', handler);
  }, []);

  if (!valid) {
    return <Login />;
  }

  return <Dashboard />;
}
