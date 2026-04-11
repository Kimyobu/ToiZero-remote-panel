import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useTaskStore } from './taskStore';

interface SubmissionState {
  isSubmitting: boolean;
  submittingTaskId: string | null;
  lastResult: any | null;
  socket: Socket | null;
  
  initSocket: () => void;
  setSubmitting: (taskId: string | null) => void;
}

export const useSubmissionStore = create<SubmissionState>((set, get) => ({
  isSubmitting: false,
  submittingTaskId: null,
  lastResult: null,
  socket: null,

  initSocket: () => {
    if (get().socket) return;

    const socket = io('http://localhost:3001');

    socket.on('submission:started', (data: { taskId: string }) => {
      console.log(`[Socket] Submission started for ${data.taskId}`);
      set({ isSubmitting: true, submittingTaskId: data.taskId, lastResult: null });
    });

    socket.on('submission:finished', (data: { taskId: string; success: boolean; score?: string }) => {
      console.log(`[Socket] Submission finished for ${data.taskId}`);
      set({ isSubmitting: false, submittingTaskId: null, lastResult: data });
      
      // Auto-refresh the task list to show updated scores
      useTaskStore.getState().fetchTasks(true);
    });

    set({ socket });
  },

  setSubmitting: (taskId) => {
    set({ isSubmitting: !!taskId, submittingTaskId: taskId });
  }
}));
