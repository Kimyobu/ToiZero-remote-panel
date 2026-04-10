import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../api/client';

interface PDFViewerProps {
  taskId: string;
  manualUrl?: string;
}

export default function PDFViewer({ taskId, manualUrl }: PDFViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const streamUrl = manualUrl 
          ? `/pdf/stream/${taskId}?url=${encodeURIComponent(manualUrl)}`
          : `/pdf/stream/${taskId}`;

        // Fetch the PDF as a blob using our authenticated api client
        const response = await api.get(streamUrl, {
          responseType: 'blob',
          timeout: 45000,
        });

        if (cancelled) return;

        // Create a local URL for the PDF blob
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        setObjectUrl(url);
        setIsLoading(false);
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
    };
  }, [taskId, manualUrl]);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-toi-text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-toi-accent" />
        <span className="text-xs">Loading PDF...</span>
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
        <button
          onClick={async () => {
            try {
              await api.delete(`/pdf/cache/${taskId}`);
            } catch (e) {}
            window.location.reload();
          }}
          className="btn-ghost"
        >
          <RefreshCw className="w-3 h-3" />
          Retry & Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-toi-bg">
      {objectUrl ? (
        <iframe
          src={`${objectUrl}#toolbar=1&navpanes=0&scrollbar=1`}
          className="w-full h-full border-none"
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
