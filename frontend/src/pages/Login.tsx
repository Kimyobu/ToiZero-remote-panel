import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { KeyRound, Loader2, AlertCircle, Eye, EyeOff, ExternalLink, Zap } from 'lucide-react';

export default function Login() {
  const { setCookie, validate, login, isValidating, error } = useAuthStore();
  const [loginMode, setLoginMode] = useState<'cookie' | 'auto'>('auto');
  const [cookieInput, setCookieInput] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCookieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cookieInput.trim()) return;
    setCookie(cookieInput.trim());
    await validate();
  };

  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    await login(username, password);
  };

  return (
    <div className="min-h-screen bg-toi-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-toi-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-toi-accent to-blue-600 mb-4 shadow-lg shadow-toi-accent/25">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-toi-text">ToiZero Remote Panel</h1>
          <p className="text-toi-text-muted text-xs mt-1">Custom client for TOI Coding platform</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-xl shadow-black/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-toi-border bg-toi-card">
            <button
              onClick={() => setLoginMode('auto')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                loginMode === 'auto' ? 'text-toi-accent bg-toi-accent/5 border-b-2 border-toi-accent' : 'text-toi-muted hover:text-toi-text'
              }`}
            >
              Auto Login
            </button>
            <button
              onClick={() => setLoginMode('cookie')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                loginMode === 'cookie' ? 'text-toi-accent bg-toi-accent/5 border-b-2 border-toi-accent' : 'text-toi-muted hover:text-toi-text'
              }`}
            >
              Direct Cookie
            </button>
          </div>

          <div className="p-6">
            {loginMode === 'auto' ? (
              <form onSubmit={handleAutoLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-toi-text-muted">Username</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                    id="username-input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-toi-text-muted">Password</label>
                  <div className="relative">
                    <input
                      className="input pr-9"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      id="password-input"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-toi-muted hover:text-toi-text transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-toi-red/10 border border-toi-red/20 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-toi-red shrink-0 mt-0.5" />
                    <p className="text-toi-red text-xs">{error}</p>
                  </div>
                )}

                <button
                  id="login-btn"
                  type="submit"
                  disabled={isValidating || !username || !password}
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                >
                  {isValidating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</>
                  ) : (
                    <>Login to TOI Coding</>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCookieSubmit} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-toi-text-muted text-xs mb-2">
                    Paste your <code className="text-toi-accent">00-pre-toi_login</code> from browser cookies.
                  </p>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-toi-muted" />
                    <input
                      className="input pl-8 pr-9 font-mono"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Cookie value..."
                      value={cookieInput}
                      onChange={e => setCookieInput(e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-toi-muted hover:text-toi-text"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md bg-toi-red/10 border border-toi-red/20 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-toi-red shrink-0 mt-0.5" />
                    <p className="text-toi-red text-xs">{error}</p>
                  </div>
                )}

                <button
                  id="connect-btn"
                  type="submit"
                  disabled={isValidating || !cookieInput.trim()}
                  className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
                >
                  {isValidating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                  ) : (
                    <>Connect with Cookie</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="mt-4 flex flex-col gap-2">
          {loginMode === 'cookie' && (
            <div className="card p-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-toi-muted mb-1.5 px-0.5">Instructions</p>
              <ol className="text-xs text-toi-text-muted space-y-1 list-decimal list-inside px-0.5">
                <li>เปิด TOI Coding แล้ว Login</li>
                <li>กด F12 → Application → Cookies</li>
                <li>เลือก <code className="text-toi-accent">00-pre-toi_login</code> แล้ว copy Value</li>
              </ol>
            </div>
          )}
          <p className="text-center text-toi-muted text-[10px]">
            Your credentials and cookies are stored locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
