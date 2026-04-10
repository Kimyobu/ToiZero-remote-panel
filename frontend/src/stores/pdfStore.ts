import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TaskPdfState {
  page: number;
  scale: number;
  rotation: number;
  scrollTop: number;
  scrollLeft: number;
}

interface PdfStore {
  states: Record<string, TaskPdfState>;
  setTaskState: (taskId: string, state: Partial<TaskPdfState>) => void;
  getTaskState: (taskId: string) => TaskPdfState | undefined;
}

export const usePdfStore = create<PdfStore>()(
  persist(
    (set, get) => ({
      states: {},
      setTaskState: (taskId, newState) => {
        set((state) => ({
          states: {
            ...state.states,
            [taskId]: {
              ...(state.states[taskId] || { page: 1, scale: 1.2, rotation: 0, scrollTop: 0, scrollLeft: 0 }),
              ...newState,
            },
          },
        }));
      },
      getTaskState: (taskId) => get().states[taskId],
    }),
    {
      name: 'toi-pdf-state',
    }
  )
);
