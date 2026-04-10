import React from 'react';
import { useTaskStore, useFilteredTasks } from '../stores/taskStore';
import { Search, X, ChevronUp, ChevronDown, FileCode, FileText, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['all', 'A1', 'A2', 'A3'];
const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'solved', label: 'Solved' },
  { value: 'unsolved', label: 'Unsolved' },
];

export default function Sidebar() {
  const { 
    selectedTaskId, selectTask, 
    searchQuery, setSearchQuery,
    categoryFilter, setCategoryFilter,
    statusFilter, setStatusFilter,
    isLoadingList,
  } = useTaskStore();

  const filtered = useFilteredTasks();

  // Calculate total scores
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  filtered.forEach(t => {
    totalScore += (t.score || 0);
    maxPossibleScore += (t.maxScore || 100);
  });

  return (
    <div className="flex flex-col bg-toi-surface border-r border-toi-border" style={{ width: 260, minWidth: 180, maxWidth: 400 }}>
      {/* Search */}
      <div className="p-2 border-b border-toi-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-toi-muted" />
          <input
            id="task-search-input"
            className="input pl-7 pr-6"
            placeholder="Search tasks... (Ctrl+K)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-toi-muted hover:text-toi-text"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`flex-1 text-[10px] py-1.5 rounded transition-all font-bold uppercase tracking-tighter ${
                categoryFilter === cat
                  ? 'bg-toi-accent text-white shadow-lg shadow-toi-accent/20'
                  : 'text-toi-text-muted hover:bg-toi-card hover:text-toi-text'
              }`}
              id={`category-filter-${cat}`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`flex-1 text-[10px] py-1.5 rounded transition-all font-bold uppercase tracking-tighter ${
                statusFilter === s.value
                  ? 'bg-toi-green/10 text-toi-green border border-toi-green/30'
                  : 'text-toi-text-muted hover:bg-toi-card border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-toi-text-muted px-0.5">
          <span>{filtered.length} tasks</span>
          <span className="flex items-center gap-1 font-mono">
            <span className={totalScore > 0 ? "text-toi-green" : "text-toi-muted"}>{totalScore}</span>
            <span className="text-toi-muted/50">/</span>
            <span>{maxPossibleScore}</span>
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 scrollable">
        {isLoadingList && filtered.length === 0 ? (
          <div className="py-2 space-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="px-3 py-2 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-toi-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-toi-border rounded w-1/4" />
                  <div className="h-2 bg-toi-border rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 px-4 text-center">
            <SlidersHorizontal className="w-8 h-8 text-toi-muted/30" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-toi-text block">No matching tasks</span>
              <span className="text-[10px] text-toi-text-muted">Try adjusting your search or filters</span>
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="btn-ghost py-1 px-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="py-1 animate-fade-in">
            {filtered.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onSelect={() => selectTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TaskRowProps {
  task: any;
  isSelected: boolean;
  onSelect: () => void;
}

function TaskRow({ task, isSelected, onSelect }: TaskRowProps) {
  let scoreColor = 'text-toi-muted';
  let dotColorClass = 'bg-toi-muted';

  if (task.score !== null) {
    if (task.score >= task.maxScore) {
      scoreColor = 'text-toi-green';
      dotColorClass = 'bg-toi-green shadow-[0_0_8px_rgba(34,197,94,0.5)]';
    } else if (task.score > 60) {
      scoreColor = 'text-toi-red';
      dotColorClass = 'bg-toi-red shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    } else if (task.score > 0 || task.status === 'attempted') {
      scoreColor = 'text-toi-yellow';
      dotColorClass = 'bg-toi-yellow shadow-[0_0_8px_rgba(234,179,8,0.5)]';
    }
  }

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors group
        ${isSelected 
          ? 'bg-toi-accent/15 border-r-2 border-toi-accent' 
          : 'hover:bg-toi-card border-r-2 border-transparent'
        }`}
      id={`task-row-${task.id}`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${dotColorClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-xs font-mono font-medium ${isSelected ? 'text-toi-accent' : 'text-toi-text'}`}>
            {task.id}
          </span>
          <span className={`text-xs font-mono ${scoreColor}`}>
            {task.score !== null ? `${task.score}/${task.maxScore}` : (task.status === 'not_submitted' ? '—' : `0/${task.maxScore}`)}
          </span>
        </div>
        {task.title && task.title !== task.id && (
          <p className="text-toi-text-muted text-xs truncate mt-0.5" title={task.title}>
            {task.title}
          </p>
        )}
        {/* Local file indicators */}
        {task.localFiles && (
          <div className="flex items-center gap-1 mt-0.5">
            {task.localFiles.solution && (
              <span title={`Has ${task.localFiles.solutionExt} solution`}>
                <FileCode className="w-2.5 h-2.5 text-toi-accent" />
              </span>
            )}
            {task.localFiles.notes && (
              <span title="Has notes">
                <FileText className="w-2.5 h-2.5 text-toi-text-muted" />
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
