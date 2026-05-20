import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useSubtopicNav<T extends string>(
  tabMap: Record<T, string[]>,
  setTab: (tab: T) => void,
) {
  const { pendingSubtopic, setPendingSubtopic } = useApp();

  useEffect(() => {
    if (!pendingSubtopic) return;
    for (const [tab, ids] of Object.entries(tabMap) as [T, string[]][]) {
      if (ids.includes(pendingSubtopic)) {
        setTab(tab);
        setPendingSubtopic(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSubtopic]);
}
