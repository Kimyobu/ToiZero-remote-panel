import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { RequestLog } from '../types';
import { Terminal, Trash2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function DevConsole() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/devlog');
      setLogs(res.data.logs);
    } catch {}
    setIsLoading(false);
  };

  const clearLogs = async () => {
    try {
      await api.delete('/devlog');
      setLogs([]);
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    const timer = setInterval(fetchLogs, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header shrink-0">
        <span className="panel-title text-toi-yellow">
          <Terminal className="w-3 h-3" />
          Dev Console
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchLogs}
            className="p-1 text-toi-muted hover:text-toi-text transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearLogs}
            className="p-1 text-toi-muted hover:text-toi-red transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 scrollable font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-toi-muted">
            No requests logged
          </div>
        ) : (
          logs.map((log, i) => {
            const time = new Date(log.timestamp).toLocaleTimeString('th-TH', {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const isOk = log.status !== null && log.status < 400;
            const isErr = log.status !== null && log.status >= 400;
            const StatusIcon = log.error ? XCircle : isOk ? CheckCircle : Clock;
            const statusColor = log.error || isErr ? 'text-toi-red' : isOk ? 'text-toi-green' : 'text-toi-yellow';

            return (
              <div key={i} className="px-3 py-1.5 border-b border-toi-border/30 hover:bg-toi-card/30">
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={`w-2.5 h-2.5 shrink-0 ${statusColor}`} />
                  <span className="text-toi-muted text-xs">{time}</span>
                  <span className={`font-bold text-xs ${
                    log.method === 'GET' ? 'text-toi-accent' :
                    log.method === 'POST' ? 'text-toi-green' :
                    'text-toi-yellow'
                  }`}>{log.method}</span>
                  <span className={`text-xs ${statusColor}`}>
                    {log.status ?? '—'}
                  </span>
                  <span className="text-toi-muted text-xs">{log.duration}ms</span>
                </div>
                <p className="text-toi-text-muted truncate pl-4 mt-0.5" title={log.url}>
                  {log.url}
                </p>
                {log.error && (
                  <p className="text-toi-red pl-4 text-xs mt-0.5">{log.error}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
