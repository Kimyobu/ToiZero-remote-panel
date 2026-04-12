import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSettingsStore } from '../stores/settingsStore';
import { useCodeStore } from '../stores/codeStore';
import api from '../api/client';
import { Loader2, Save, Send, Link, Link2Off, FileDown, Rocket, Sparkles } from 'lucide-react';
import { 
  PYTHON_SIGNATURES, CPP_SIGNATURES, 
  registerSignatureHelp, registerHoverProvider 
} from '../utils/monacoIntellisense';

const SNIPPETS_CPP = [
  {
    label: 'toi-template',
    kind: 27,
    documentation: 'Standard TOI/Competitive Programming Template',
    insertText: [
      '#include <bits/stdc++.h>',
      'using namespace std;',
      '',
      'void solve() {',
      '    ${1:// code here}',
      '}',
      '',
      'int main() {',
      '    ios_base::sync_with_stdio(false);',
      '    cin.tie(NULL);',
      '    ',
      '    int t = 1;',
      '    // cin >> t;',
      '    while (t--) {',
      '        solve();',
      '    }',
      '    return 0;',
      '}'
    ].join('\n'),
    insertTextRules: 4,
  },
  {
    label: 'binpow',
    kind: 27,
    documentation: 'Fast modular exponentiation (long long)',
    insertText: [
      'long long binpow(long long a, long long b, long long m) {',
      '    a %= m;',
      '    long long res = 1;',
      '    while (b > 0) {',
      '        if (b & 1) res = res * a % m;',
      '        a = a * a % m;',
      '        b >>= 1;',
      '    }',
      '    return res;',
      '}'
    ].join('\n'),
    insertTextRules: 4,
  },
  {
    label: 'fori',
    kind: 27,
    documentation: 'Standard for loop',
    insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}',
    insertTextRules: 4,
  }
];

const SNIPPETS_PYTHON = [
  {
    label: 'toi-template',
    kind: 27,
    documentation: 'Standard Python Competitive Programming Template',
    insertText: [
      'import sys',
      '# Increase recursion depth for deep DFS',
      'sys.setrecursionlimit(200000)',
      '',
      'def solve():',
      '    # Faster I/O',
      '    input = sys.stdin.readline',
      '    $0',
      '',
      'if __name__ == "__main__":',
      '    solve()'
    ].join('\n'),
    insertTextRules: 4,
  },
  {
    label: 'fastio',
    kind: 27,
    documentation: 'Fast I/O setup',
    insertText: 'import sys\ninput = sys.stdin.readline',
    insertTextRules: 4,
  },
  {
    label: 'read-int',
    kind: 27,
    documentation: 'Read one integer',
    insertText: 'n = int(input())',
    insertTextRules: 4,
  },
  {
    label: 'read-ints',
    kind: 27,
    documentation: 'Read multiple integers',
    insertText: '${1:a, b} = map(int, input().split())',
    insertTextRules: 4,
  },
  {
    label: 'read-list',
    kind: 27,
    documentation: 'Read space-separated integers into a list',
    insertText: 'a = list(map(int, input().split()))',
    insertTextRules: 4,
  },
  {
    label: 'bfs',
    kind: 27,
    documentation: 'Breadth-First Search Template',
    insertText: [
      'from collections import deque',
      '',
      'def bfs(start_node, graph):',
      '    visited = {start_node}',
      '    queue = deque([start_node])',
      '    ',
      '    while queue:',
      '        u = queue.popleft()',
      '        for v in graph[u]:',
      '            if v not in visited:',
      '                visited.add(v)',
      '                queue.append(v)'
    ].join('\n'),
    insertTextRules: 4,
  },
  {
    label: 'dsu',
    kind: 27,
    documentation: 'Disjoint Set Union (Union-Find) Class',
    insertText: [
      'class DSU:',
      '    def __init__(self, n):',
      '        self.parent = list(range(n + 1))',
      '        self.size = [1] * (n + 1)',
      '',
      '    def find(self, i):',
      '        if self.parent[i] == i:',
      '            return i',
      '        self.parent[i] = self.find(self.parent[i])',
      '        return self.parent[i]',
      '',
      '    def union(self, i, j):',
      '        root_i = self.find(i)',
      '        root_j = self.find(j)',
      '        if root_i != root_j:',
      '            if self.size[root_i] < self.size[root_j]:',
      '                root_i, root_j = root_j, root_i',
      '            self.parent[root_j] = root_i',
      '            self.size[root_i] += self.size[root_j]',
      '            return True',
      '        return False'
    ].join('\n'),
    insertTextRules: 4,
  }
];

interface CodeEditorProps {
  taskId: string;
}

const PYTHON_BUILTINS = [
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray', 'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip', '__import__'
];

const CPP_STL = [
  'vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set', 'queue', 'deque', 'stack', 'priority_queue', 'pair', 'tuple', 'list', 'forward_list', 'array', 'bitset', 'algorithm', 'iostream', 'iomanip', 'cmath', 'climits', 'cstdio', 'cstdlib', 'cstring', 'sort', 'stable_sort', 'partial_sort', 'nth_element', 'lower_bound', 'upper_bound', 'binary_search', 'equal_range', 'merge', 'inplace_merge', 'push_back', 'pop_back', 'size', 'empty', 'clear', 'insert', 'erase', 'begin', 'end', 'rbegin', 'rend', 'front', 'back', 'push', 'pop', 'top', 'make_pair', 'make_tuple', 'min', 'max', 'abs', 'swap', 'reverse', 'next_permutation', 'prev_permutation', 'accumulate', 'iota'
];

export default function CodeEditor({ taskId }: CodeEditorProps) {
  const { theme } = useSettingsStore();
  const { codes, setCode, languages, setLanguage } = useCodeStore();
  
  const [isLocalSyncing, setIsLocalSyncing] = useState(false);
  const [localFilename, setLocalFilename] = useState<string | null>(null);
  const [autoSaveLocal, setAutoSaveLocal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentCode = codes[taskId] || '';
  const currentLang = languages[taskId] || 'cpp';

  // Load from local on mount or task change
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const res = await api.get(`/local/solution/${taskId}`);
        if (res.data.content !== null) {
          // If web editor is empty, use local content
          if (!codes[taskId]) {
            setCode(taskId, res.data.content);
          }
          setLocalFilename(res.data.filename);
        } else {
          setLocalFilename(null);
        }
      } catch (err) {
        console.error('Failed to load local solution:', err);
      }
    };
    loadLocal();
  }, [taskId]);

  // Auto-save to local
  useEffect(() => {
    if (!autoSaveLocal || !localFilename) return;

    const timer = setTimeout(async () => {
      if (currentCode) {
        setIsSaving(true);
        try {
          await api.put(`/local/solution/${taskId}`, { 
            content: currentCode,
            language: currentLang 
          });
        } catch (err) {
          console.error('Auto-save failed:', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [currentCode, autoSaveLocal, localFilename, taskId, currentLang]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(taskId, value);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.put(`/local/solution/${taskId}`, { 
        content: currentCode,
        language: currentLang 
      });
      if (res.data.success) {
        setLocalFilename(res.data.filename);
      }
    } catch (err) {
      alert('Failed to save to disk');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadFromLocal = async () => {
    try {
      const res = await api.get(`/local/solution/${taskId}`);
      if (res.data.content !== null) {
        setCode(taskId, res.data.content);
        setLocalFilename(res.data.filename);
      }
    } catch (err) {
      alert('Failed to load from local file');
    }
  };

  // Listen for global save event (Ctrl+S from Dashboard)
  useEffect(() => {
    const handler = (e: any) => {
      handleManualSave();
    };
    window.addEventListener('toi:save-local', handler);
    return () => window.removeEventListener('toi:save-local', handler);
  }, [currentCode, currentLang, taskId]);

  const handleMount = (editor: any, monaco: any) => {
    // Register custom snippets & build-ins for C++
    monaco.languages.registerCompletionItemProvider('cpp', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...SNIPPETS_CPP.map(s => ({
            ...s,
            kind: monaco.languages.CompletionItemKind.Snippet,
            range
          })),
          ...CPP_STL.map(item => ({
            label: item,
            kind: CPP_SIGNATURES[item] ? monaco.languages.CompletionItemKind.Function : monaco.languages.CompletionItemKind.Class,
            insertText: item,
            detail: CPP_SIGNATURES[item]?.label || 'C++ Standard Library',
            documentation: CPP_SIGNATURES[item]?.documentation || '',
            range
          }))
        ];
        return { suggestions };
      }
    });

    // Register Signature Help & Hover for C++
    registerSignatureHelp(monaco, 'cpp', CPP_SIGNATURES);
    registerHoverProvider(monaco, 'cpp', CPP_SIGNATURES);

    // Register custom snippets & build-ins for Python
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [
          ...SNIPPETS_PYTHON.map(s => ({
            ...s,
            kind: monaco.languages.CompletionItemKind.Snippet,
            range
          })),
          ...PYTHON_BUILTINS.map(item => ({
            label: item,
            kind: PYTHON_SIGNATURES[item] ? monaco.languages.CompletionItemKind.Function : monaco.languages.CompletionItemKind.Keyword,
            insertText: item,
            detail: PYTHON_SIGNATURES[item]?.label || 'Python Built-in',
            documentation: PYTHON_SIGNATURES[item]?.documentation || '',
            range
          }))
        ];
        return { suggestions };
      }
    });

    // Register Signature Help & Hover for Python
    registerSignatureHelp(monaco, 'python', PYTHON_SIGNATURES);
    registerHoverProvider(monaco, 'python', PYTHON_SIGNATURES);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(taskId, e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-toi-bg border-l border-toi-border animate-fade-in">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-toi-surface border-b border-toi-border shrink-0">
        <div className="flex items-center gap-2">
          <select 
            value={currentLang}
            onChange={handleLanguageChange}
            className="bg-toi-card text-toi-text-muted text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border border-toi-border focus:outline-none focus:border-toi-accent"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
          </select>
          <span className="text-[10px] text-toi-muted/50 font-mono">|</span>
          <span className="text-[10px] text-toi-muted font-mono uppercase truncate max-w-[100px]" title={taskId}>
            {taskId}
          </span>
          {localFilename && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[10px] text-toi-green font-bold flex items-center gap-1">
                <Link className="w-2.5 h-2.5" />
                SYNCED: {localFilename}
              </span>
              {isSaving && <Loader2 className="w-2.5 h-2.5 text-toi-accent animate-spin" />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {localFilename ? (
            <>
              <button 
                onClick={() => setAutoSaveLocal(!autoSaveLocal)}
                className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all ${
                  autoSaveLocal ? 'bg-toi-green/10 text-toi-green' : 'bg-toi-red/10 text-toi-red'
                }`}
                title="Toggle Auto-save to Local File"
              >
                {autoSaveLocal ? <Sparkles className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}
                {autoSaveLocal ? 'LIVE' : 'AUTO-OFF'}
              </button>
              <button 
                onClick={handleLoadFromLocal}
                className="p-1 text-toi-muted hover:text-toi-text"
                title="Force Reload from Local"
              >
                <FileDown className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button 
              onClick={handleManualSave}
              className="text-[10px] font-bold text-toi-accent hover:underline flex items-center gap-1"
            >
              <Rocket className="w-3 h-3" />
              Setup Local File
            </button>
          )}

          <div className="w-px h-3 bg-toi-border mx-1" />

          <button 
            onClick={() => {
              // Trigger submit in RightPanel/SubmitPanel
              document.getElementById('submit-btn')?.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-toi-accent text-white rounded text-[10px] font-bold hover:bg-toi-accent-hover transition-all active:scale-95 shadow-lg shadow-toi-accent/20"
          >
            <Send className="w-3 h-3" />
            SUBMIT
          </button>
        </div>
      </div>

      {/* Editor Instance */}
      <div className="flex-1 min-h-0 bg-[#1e1e1e]">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          language={currentLang === 'cpp' ? 'cpp' : currentLang === 'python' ? 'python' : 'cpp'}
          value={currentCode}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            padding: { top: 10 },
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            contextmenu: true,
            roundedSelection: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
            parameterHints: {
              enabled: true
            },
            wordBasedSuggestions: 'allDocuments',
            formatOnPaste: true,
            formatOnType: true,
          }}
          onChange={handleEditorChange}
          onMount={handleMount}
          loading={<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 text-toi-accent animate-spin" /></div>}
        />
      </div>
    </div>
  );
}
