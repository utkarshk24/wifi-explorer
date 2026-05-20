import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ChapterId, AppContextType } from '../types';

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeChapter, setActiveChapter] = useState<ChapterId>('ch16');
  const [pendingSubtopic, setPendingSubtopic] = useState<string | null>(null);

  // no-op — progress tracking removed
  const markComplete = useCallback((_chapterId: ChapterId, _subTopicId: string) => {}, []);

  return (
    <AppContext.Provider value={{
      mode: 'enthusiast',
      activeChapter,
      setActiveChapter,
      markComplete,
      pendingSubtopic,
      setPendingSubtopic,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
