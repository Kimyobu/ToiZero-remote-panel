import React, { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { cookie, valid, validate } = useAuthStore();

  // Auto-validate on startup if cookie is stored
  useEffect(() => {
    if (cookie && !valid) {
      validate();
    }
  }, []);

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
