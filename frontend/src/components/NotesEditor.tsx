import React, { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '../stores/taskStore';
import api from '../api/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Edit3, Eye, Save, Loader2, FileText, AlertCircle } from 'lucide-react';

export default function NotesEditor() {
  const { selectedTaskId } = useTaskStore();
  const [content, setContent] = useState('');
  const [original, setOriginal] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | null>(null);
  const autosaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes when task changes
  useEffect(() => {
    if (!selectedTaskId) return;
    setContent('');
    setOriginal('');
    setError(null);
    setIsLoading(true);
    setSaveStatus(null);

    api.get(`/local/notes/${selectedTaskId}`)
      .then(res => {
        setContent(res.data.content || '');
        setOriginal(res.data.content || '');
        setIsLoading(false);
      })
      .catch(err => {
        const msg = err.response?.data?.error || err.message;
        if (err.response?.status === 503) {
          setError('Local path not configured (set TOI_LOCAL_PATH in backend/.env)');
        } else {
          setError(msg);
        }
        setIsLoading(false);
      });
  }, [selectedTaskId]);

  // Autosave after 2s of inactivity
  const handleChange = (val: string) => {
    setContent(val);
    setSaveStatus('unsaved');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveNotes(val);
    }, 2000);
  };

  const saveNotes = useCallback(async (text: string) => {
    if (!selectedTaskId) return;
    setSaveStatus('saving');
    setIsSaving(true);
    try {
      await api.put(`/local/notes/${selectedTaskId}`, { content: text });
      setOriginal(text);
      setSaveStatus('saved');
    } catch (err: any) {
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTaskId]);

  const handleSave = () => saveNotes(content);

  const isDirty = content !== original;

  if (!selectedTaskId) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="panel-header shrink-0">
        <span className="panel-title">
          <FileText className="w-3 h-3" />
          Notes
          {selectedTaskId && <span className="text-toi-accent font-mono">{selectedTaskId}</span>}
        </span>
        <div className="flex items-center gap-1">
          {saveStatus === 'saved' && <span className="text-xs text-toi-green">saved</span>}
          {saveStatus === 'unsaved' && <span className="text-xs text-toi-yellow">unsaved</span>}
          {saveStatus === 'saving' && <Loader2 className="w-3 h-3 text-toi-muted animate-spin" />}

          <button
            onClick={() => setIsPreview(v => !v)}
            className={`p-1 rounded transition-colors ${isPreview ? 'text-toi-accent bg-toi-accent/10' : 'text-toi-muted hover:text-toi-text'}`}
            title={isPreview ? 'Edit' : 'Preview'}
          >
            {isPreview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          {isDirty && (
            <button onClick={handleSave} className="p-1 rounded text-toi-accent hover:bg-toi-accent/10 transition-colors">
              <Save className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-20 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-toi-muted" />
          </div>
        ) : error ? (
          <div className="p-3">
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-toi-red/10 border border-toi-red/20">
              <AlertCircle className="w-3.5 h-3.5 text-toi-red shrink-0 mt-0.5" />
              <p className="text-xs text-toi-red">{error}</p>
            </div>
          </div>
        ) : isPreview ? (
          <div className="p-3 scrollable h-full">
            {content ? (
              <div className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-toi-muted italic">No notes yet. Switch to edit mode to write.</p>
            )}
          </div>
        ) : (
          <textarea
            className="w-full h-full p-3 bg-transparent text-toi-text text-xs font-mono resize-none outline-none 
                       placeholder:text-toi-muted leading-relaxed scrollable"
            placeholder={`# Notes for ${selectedTaskId}\n\nWrite your notes here...\nSupports **markdown** syntax\n\nAutosaves after 2s`}
            value={content}
            onChange={e => handleChange(e.target.value)}
            spellCheck={false}
            id="notes-textarea"
          />
        )}
      </div>
    </div>
  );
}
