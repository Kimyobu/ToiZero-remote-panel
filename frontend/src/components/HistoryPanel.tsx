import React from 'react';
import { useTaskStore } from '../stores/taskStore';
import { Clock, CheckCircle, XCircle, Circle, ChevronRight } from 'lucide-react';

export default function HistoryPanel() {
  const { taskDetail, isLoadingDetail } = useTaskStore();

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center h-24 gap-2">
        <div className="w-4 h-4 border-2 border-toi-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const submissions = taskDetail?.submissions || [];

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-24 gap-1 p-4">
        <Clock className="w-5 h-5 text-toi-muted" />
        <p className="text-xs text-toi-text-muted text-center">No submissions yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <span className="panel-title">
          <Clock className="w-3 h-3" />
          Submission History
        </span>
        <span className="text-xs text-toi-muted">{submissions.length} total</span>
      </div>

      <div className="flex-1 scrollable">
        {submissions.map((sub, i) => {
          const isLatest = i === 0;
          const resultLower = sub.result.toLowerCase();
          const isAccepted = resultLower.includes('accept') || (sub.score !== null && sub.score === 100);
          const isWrong = resultLower.includes('wrong') || resultLower.includes('error') || resultLower.includes('tle') || resultLower.includes('mle');

          const statusColor = isAccepted ? 'text-toi-green' : isWrong ? 'text-toi-red' : 'text-toi-yellow';
          const StatusIcon = isAccepted ? CheckCircle : isWrong ? XCircle : Circle;

          return (
            <div
              key={sub.id}
              className={`flex items-start gap-2 px-3 py-2.5 border-b border-toi-border/50 transition-colors hover:bg-toi-card/50 ${
                isLatest ? 'bg-toi-accent/5' : ''
              }`}
            >
              <StatusIcon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${statusColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-medium ${statusColor}`}>
                    {sub.result}
                  </span>
                  {isLatest && (
                    <span className="badge bg-toi-accent/15 text-toi-accent border border-toi-accent/25 text-xs">
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-toi-muted text-xs">
                  <span>{sub.timestamp}</span>
                  {sub.score !== null && (
                    <>
                      <span>·</span>
                      <span className={statusColor}>{sub.score}/100</span>
                    </>
                  )}
                  {sub.language && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{sub.language}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
