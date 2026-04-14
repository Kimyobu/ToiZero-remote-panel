import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, HardDrive, Cloud, CheckCircle } from 'lucide-react';
import api from '../api/client';

interface PDFViewerProps {
  taskId: string;
  manualUrl?: string;
}

type CacheStatus = 'checking' | 'local' | 'remote' | 'error';

export default function PDFViewer({ taskId, manualUrl }: PDFViewerProps) {
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('checking');
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup previous object URL
  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      setCacheStatus('checking');
      cleanupObjectUrl();

      try {
        // Step 1: Check if there's a locally cached PDF
        try {
          const existsRes = await api.get(`/local/pdf/${taskId}/exists`);
          if (existsRes.data.exists && !cancelled) {
            // Use the local cache via backend endpoint
            const localUrl = `${api.defaults.baseURL}/local/pdf/${taskId}`;
            setPdfSrc(localUrl);
            setCacheStatus('local');
            setIsLoading(false);
            return;
          }
        } catch {
          // Local check failed (TOI_LOCAL_PATH not configured) — fall through to remote
        }

        // Step 2: Load from remote TOI server
        if (!cancelled) {
          await loadFromRemote(taskId, manualUrl, cancelled);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('[PDF] Load error:', err);
          setError(err.response?.data?.error || err.message || 'Failed to load PDF');
          setIsLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      cleanupObjectUrl();
    };
  }, [taskId, manualUrl]);

  const loadFromRemote = async (tid: string, mUrl?: string, cancelled = false) => {
    setCacheStatus('remote');
    const streamUrl = mUrl
      ? `/pdf/stream/${tid}?url=${encodeURIComponent(mUrl)}`
      : `/pdf/stream/${tid}`;

    const response = await api.get(streamUrl, {
      responseType: 'blob',
      timeout: 45000,
    });

    if (cancelled) return;

    const blob = new Blob([response.data], { type: 'application/pdf' });

    // Create object URL for iframe
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;
    setPdfSrc(url);
    setIsLoading(false);

    // Step 3: Save to local workspace in background (non-blocking)
    saveToLocal(tid, blob);
  };

  const saveToLocal = async (tid: string, blob: Blob) => {
    try {
      setIsSavingLocal(true);
      const arrayBuffer = await blob.arrayBuffer();
      await api.post(`/local/pdf/${tid}`, arrayBuffer, {
        headers: { 'Content-Type': 'application/pdf' },
        timeout: 15000,
      });
      setCacheStatus('local');
    } catch (err) {
      // Silently fail — local save is best-effort
      console.warn('[PDF] Could not save to local workspace:', err);
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleForceRefresh = async () => {
    try {
      await api.delete(`/pdf/cache/${taskId}`);
    } catch {}
    // Clear local cache and reload from remote
    try {
      // Overwrite with fresh fetch — just re-trigger by clearing src
      setPdfSrc(null);
      setIsLoading(true);
      setError(null);
      setCacheStatus('checking');
      cleanupObjectUrl();
      await loadFromRemote(taskId, manualUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh PDF');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-toi-text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-toi-accent" />
        <span className="text-xs">
          {cacheStatus === 'checking' ? 'Checking local cache...' : 'Loading PDF from server...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-toi-red" />
        <div>
          <p className="text-sm font-medium text-toi-text mb-1">Failed to load PDF</p>
          <p className="text-xs text-toi-text-muted">{error}</p>
        </div>
        <button onClick={handleForceRefresh} className="btn-ghost">
          <RefreshCw className="w-3 h-3" />
          Retry & Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-toi-bg">
      {/* Cache status bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-toi-surface/80 border-b border-toi-border/50 shrink-0">
        <div className="flex items-center gap-1.5">
          {cacheStatus === 'local' ? (
            <>
              <HardDrive className="w-3 h-3 text-toi-green" />
              <span className="text-[10px] font-bold text-toi-green">LOCAL CACHE</span>
              <CheckCircle className="w-3 h-3 text-toi-green" />
            </>
          ) : (
            <>
              <Cloud className="w-3 h-3 text-toi-accent" />
              <span className="text-[10px] font-bold text-toi-accent">REMOTE</span>
              {isSavingLocal && (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-toi-muted" />
                  <span className="text-[10px] text-toi-muted">Saving to workspace...</span>
                </>
              )}
            </>
          )}
        </div>
        <button
          onClick={handleForceRefresh}
          className="p-0.5 text-toi-muted hover:text-toi-text transition-colors rounded"
          title="Force re-download from server"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* PDF Iframe */}
      {pdfSrc ? (
        <iframe
          src={`${pdfSrc}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full flex-1 border-none"
          title={`PDF Viewer - ${taskId}`}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-toi-accent" />
        </div>
      )}
    </div>
  );
}
