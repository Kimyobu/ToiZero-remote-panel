import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { cookie, valid, validate } = useAuthStore();

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
