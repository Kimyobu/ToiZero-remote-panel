import React, { useState, useRef, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import api from '../api/client';
import { Upload, Loader2, CheckCircle, XCircle, FileCode, Zap, Eye } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.py', '.cpp', '.c', '.java', '.pas'];

interface SubmitResult {
  success: boolean;
  message: string;
  rawResponse?: string;
  status?: number;
}

export default function SubmitPanel() {
  const { selectedTaskId, taskDetail, addActivity, fetchTasks } = useTaskStore();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [localSolution, setLocalSolution] = useState<{content: string; filename: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Load local solution if available
  useEffect(() => {
    if (!selectedTaskId) return;
    setFile(null);
    setResult(null);
    setLocalSolution(null);

    api.get(`/local/solution/${selectedTaskId}`)
      .then(res => {
        if (res.data.content && res.data.filename) {
          setLocalSolution(res.data);
        }
      })
      .catch(() => {});
  }, [selectedTaskId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setResult({ success: false, message: `File type ${ext} not supported. Use: ${ALLOWED_EXTENSIONS.join(', ')}` });
      return;
    }
    setFile(f);
    setResult(null);
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleSubmit = async () => {
    if (!selectedTaskId || (!file && !localSolution)) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData();

      if (file) {
        formData.append('file', file);
      } else if (localSolution) {
        // Create file from local solution content
        const blob = new Blob([localSolution.content], { type: 'text/plain' });
        formData.append('file', blob, localSolution.filename);
      }

      const res = await api.post(`/submit/${selectedTaskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { success, message, rawResponse, status } = res.data;
      setResult({ success, message, rawResponse, status });

      if (success) {
        addActivity({ type: 'submit', taskId: selectedTaskId!, detail: message });
        // Refresh task after submit
        setTimeout(() => fetchTasks(true), 1500);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Submission failed';
      const raw = err.response?.data?.rawResponse;
      setResult({ success: false, message: msg, rawResponse: raw });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick submit from local
  const handleLocalSubmit = () => {
    if (localSolution && !file) {
      handleSubmit();
    }
  };

  if (!selectedTaskId) return null;

  const ext = file?.name.split('.').pop()?.toLowerCase() || localSolution?.filename.split('.').pop()?.toLowerCase();
  const langColor: Record<string, string> = { py: 'text-yellow-400', cpp: 'text-blue-400', c: 'text-cyan-400', java: 'text-orange-400' };

  return (
    <div className="flex flex-col h-full p-3 gap-3 scrollable">
      {/* Local solution quick submit */}
      {localSolution && !file && (
        <div className="card p-3 border-toi-accent/30 bg-toi-accent/5">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className={`w-3.5 h-3.5 ${langColor[localSolution.filename.split('.').pop() || ''] || 'text-toi-accent'}`} />
            <span className="text-xs font-medium text-toi-text">{localSolution.filename}</span>
            <span className="text-xs text-toi-muted ml-auto">local file</span>
          </div>
          <p className="text-xs text-toi-text-muted mb-2">
            Found local solution — submit directly?
          </p>
          <button
            onClick={handleLocalSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full justify-center disabled:opacity-50"
            id="submit-btn"
          >
            {isSubmitting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Quick Submit</>
            )}
          </button>
        </div>
      )}

      {/* File upload */}
      <div>
        <label className="text-xs text-toi-text-muted mb-1.5 block">Upload Solution File</label>
        <div
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            file 
              ? 'border-toi-accent/50 bg-toi-accent/5' 
              : 'border-toi-border hover:border-toi-accent/50 hover:bg-toi-card'
          }`}
          id="file-drop-zone"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileChange}
            id="file-input"
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileCode className={`w-4 h-4 ${langColor[ext || ''] || 'text-toi-accent'}`} />
              <div>
                <p className="text-xs font-medium text-toi-text">{file.name}</p>
                <p className="text-xs text-toi-muted">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ) : (
            <div>
              <Upload className="w-5 h-5 text-toi-muted mx-auto mb-1" />
              <p className="text-xs text-toi-text-muted">Drop file here or click</p>
              <p className="text-xs text-toi-muted mt-0.5">{ALLOWED_EXTENSIONS.join(' · ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit button */}
      {file && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn-primary justify-center disabled:opacity-50"
          id="submit-btn"
        >
          {isSubmitting ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
          ) : (
            <><Zap className="w-3.5 h-3.5" /> Submit (Ctrl+Enter)</>
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className={`card p-3 animate-fade-in ${
          result.success ? 'border-toi-green/30 bg-toi-green/5' : 'border-toi-red/30 bg-toi-red/5'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {result.success 
              ? <CheckCircle className="w-4 h-4 text-toi-green shrink-0" />
              : <XCircle className="w-4 h-4 text-toi-red shrink-0" />
            }
            <span className={`text-xs font-medium ${result.success ? 'text-toi-green' : 'text-toi-red'}`}>
              {result.success ? 'Submitted Successfully' : 'Submission Failed'}
            </span>
            {result.status && (
              <span className="text-xs text-toi-muted ml-auto font-mono">HTTP {result.status}</span>
            )}
          </div>
          <p className="text-xs text-toi-text-muted">{result.message}</p>

          {result.rawResponse && (
            <div className="mt-2">
              <button
                onClick={() => setShowRaw(v => !v)}
                className="flex items-center gap-1 text-xs text-toi-muted hover:text-toi-text"
              >
                <Eye className="w-3 h-3" />
                {showRaw ? 'Hide' : 'Show'} raw response
              </button>
              {showRaw && (
                <pre className="mt-1 p-2 bg-toi-bg rounded text-xs text-toi-text-muted overflow-x-auto max-h-32 font-mono">
                  {result.rawResponse}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Task info */}
      {taskDetail && (
        <div className="card p-2.5 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-toi-muted">Task</span>
            <span className="text-toi-text font-mono">{taskDetail.id}</span>
            <span className="text-toi-muted">Score</span>
            <span className="text-toi-text">
              {taskDetail.score !== null ? `${taskDetail.score}/${taskDetail.maxScore}` : '—'}
            </span>
            <span className="text-toi-muted">Status</span>
            <span className={
              taskDetail.status === 'solved' ? 'text-toi-green' :
              taskDetail.status === 'attempted' ? 'text-toi-yellow' : 'text-toi-muted'
            }>
              {taskDetail.status.replace('_', ' ')}
            </span>
            <span className="text-toi-muted">CSRF</span>
            <span className={taskDetail.csrfToken ? 'text-toi-green' : 'text-toi-red'}>
              {taskDetail.csrfToken ? '✓ found' : '✗ missing'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
