import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CodeStore {
  codes: Record<string, string>; // taskId -> code
  languages: Record<string, string>; // taskId -> language ('cpp', 'python', etc.)
  
  setCode: (taskId: string, code: string) => void;
  setLanguage: (taskId: string, lang: string) => void;
  getCode: (taskId: string) => string;
  getLanguage: (taskId: string) => string;
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      codes: {},
      languages: {},
      
      setCode: (taskId, code) => set(state => ({
        codes: { ...state.codes, [taskId]: code }
      })),
      
      setLanguage: (taskId, lang) => set(state => ({
        languages: { ...state.languages, [taskId]: lang }
      })),
      
      getCode: (taskId) => get().codes[taskId] || '',
      
      getLanguage: (taskId) => get().languages[taskId] || 'cpp',
    }),
    {
      name: 'toi-codes',
    }
  )
);
