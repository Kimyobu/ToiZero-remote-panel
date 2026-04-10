import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskDetail, ActivityEntry, LocalTaskInfo } from '../types';
import api from '../api/client';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  taskDetail: TaskDetail | null;
  isLoadingList: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  lastRefreshed: string | null;
  localInfo: Record<string, LocalTaskInfo>;
  activity: ActivityEntry[];

  // Filters
  searchQuery: string;
  categoryFilter: string; // 'all' | 'A1' | 'A2' | 'A3'
  statusFilter: string;   // 'all' | 'solved' | 'attempted' | 'not_submitted'
  sortBy: string;         // 'id' | 'score' | 'status'
  sortDir: 'asc' | 'desc';

  // Actions
  fetchTasks: (forceRefresh?: boolean) => Promise<void>;
  selectTask: (taskId: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: string) => void;
  setStatusFilter: (s: string) => void;
  setSortBy: (col: string) => void;
  fetchLocalInfo: () => Promise<void>;
  addActivity: (entry: Omit<ActivityEntry, 'timestamp'>) => void;
  dismissError: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedTaskId: null,
      taskDetail: null,
      isLoadingList: false,
      isLoadingDetail: false,
      error: null,
      lastRefreshed: null,
      localInfo: {},
      activity: [],

      searchQuery: '',
      categoryFilter: 'all',
      statusFilter: 'all',
      sortBy: 'id',
      sortDir: 'asc',

      fetchTasks: async (forceRefresh = false) => {
        set({ isLoadingList: true, error: null });
        try {
          const res = await api.get('/tasks', {
            params: { refresh: forceRefresh ? 'true' : undefined },
          });
          const tasks: Task[] = res.data.tasks;
          
          // Merge local info if available
          const { localInfo } = get();
          const merged = tasks.map(t => ({
            ...t,
            localFiles: localInfo[t.id] ? {
              pdf: localInfo[t.id].hasPdf ? 'local' : null,
              solution: localInfo[t.id].solutionFile,
              solutionExt: localInfo[t.id].solutionExt,
              notes: localInfo[t.id].hasNotes ? 'local' : null,
            } : null,
          }));

          set({ 
            tasks: merged, 
            isLoadingList: false, 
            lastRefreshed: new Date().toISOString(),
          });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.error || err.message || 'Failed to fetch tasks',
            isLoadingList: false,
          });
        }
      },

      selectTask: async (taskId: string) => {
        const { selectedTaskId, addActivity, tasks } = get();
        if (selectedTaskId === taskId && get().taskDetail) return;

        set({ selectedTaskId: taskId, isLoadingDetail: true, error: null });
        addActivity({ type: 'open', taskId });

        try {
          const res = await api.get(`/tasks/${taskId}`);
          const taskDetail: TaskDetail = res.data.task;
          
          // CRITICAL FIX: If task detail couldn't find a score (Score —), 
          // fallback to the score we already have in the sidebar (taskList).
          // "ดึงข้อมูลเดียวกันมันก็ควรได้เหมือนกันสิ"
          if (taskDetail.score === null || taskDetail.status === 'not_submitted') {
            const listItem = tasks.find(t => t.id === taskId);
            if (listItem && (listItem.score !== null || listItem.status !== 'not_submitted')) {
              taskDetail.score = listItem.score;
              taskDetail.maxScore = listItem.maxScore;
              taskDetail.status = listItem.status;
            }
          }

          set({ taskDetail, isLoadingDetail: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.error || err.message || 'Failed to fetch task',
            isLoadingDetail: false,
          });
        }
      },

      setSearchQuery: (q) => set({ searchQuery: q }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setStatusFilter: (s) => set({ statusFilter: s }),
      setSortBy: (col) => {
        const { sortBy, sortDir } = get();
        if (col === sortBy) {
          set({ sortDir: sortDir === 'asc' ? 'desc' : 'asc' });
        } else {
          set({ sortBy: col, sortDir: 'asc' });
        }
      },

      fetchLocalInfo: async () => {
        try {
          const res = await api.get('/local/tasks');
          const info: Record<string, LocalTaskInfo> = {};
          for (const t of res.data.tasks) {
            info[t.taskId] = t;
          }
          set({ localInfo: info });
        } catch {
          // Local info is optional
        }
      },

      addActivity: (entry) => {
        const newEntry: ActivityEntry = {
          ...entry,
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          activity: [newEntry, ...state.activity].slice(0, 50),
        }));
      },

      dismissError: () => set({ error: null }),
    }),
    {
      name: 'toi-task-state',
      partialize: (state) => ({
        selectedTaskId: state.selectedTaskId,
        searchQuery: state.searchQuery,
        categoryFilter: state.categoryFilter,
        statusFilter: state.statusFilter,
      }),
    }
  )
);

// Derived selector: filtered + sorted tasks
export function useFilteredTasks() {
  const { tasks, searchQuery, categoryFilter, statusFilter, sortBy, sortDir } = useTaskStore();

  let filtered = tasks;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.id.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q)
    );
  }

  if (categoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === categoryFilter);
  }

  if (statusFilter === 'solved') {
    filtered = filtered.filter(t => t.score !== null && t.score >= t.maxScore);
  } else if (statusFilter === 'unsolved') {
    filtered = filtered.filter(t => t.score === null || t.score < t.maxScore);
  }

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'id') cmp = a.id.localeCompare(b.id);
    else if (sortBy === 'score') cmp = (a.score ?? -1) - (b.score ?? -1);
    else if (sortBy === 'status') {
      const isASolved = a.score !== null && a.score >= a.maxScore;
      const isBSolved = b.score !== null && b.score >= b.maxScore;
      if (isASolved === isBSolved) cmp = 0;
      else if (isASolved) cmp = -1;
      else cmp = 1;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  return filtered;
}
