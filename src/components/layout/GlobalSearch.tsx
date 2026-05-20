import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUpRight, Hash } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CHAPTERS } from '../../data/curriculum';
import type { ChapterId } from '../../types';

interface SearchResult {
  id: string;
  chapterId: ChapterId;
  chapterNumber: number;
  chapterTitle: string;
  chapterIcon: string;
  accentClass: string;
  label: string;
  type: 'chapter' | 'subtopic';
}

const SEARCH_INDEX: SearchResult[] = CHAPTERS.flatMap(ch => [
  {
    id: `${ch.id}-title`,
    chapterId: ch.id as ChapterId,
    chapterNumber: ch.number,
    chapterTitle: ch.title,
    chapterIcon: ch.icon,
    accentClass: ch.accentClass,
    label: `${ch.title} — ${ch.subtitle}`,
    type: 'chapter',
  },
  ...ch.subTopics.map(st => ({
    id: `${ch.id}-${st.id}`,
    chapterId: ch.id as ChapterId,
    chapterNumber: ch.number,
    chapterTitle: ch.title,
    chapterIcon: ch.icon,
    accentClass: ch.accentClass,
    label: st.label,
    type: 'subtopic' as const,
  })),
]);

function runSearch(query: string): SearchResult[] {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length >= 1);
  if (!tokens.length) return [];

  const scored = SEARCH_INDEX.map(item => {
    const hay = item.label.toLowerCase() + ' ' + item.chapterTitle.toLowerCase();
    let score = 0;
    for (const tok of tokens) {
      if (hay.includes(tok)) {
        score += item.type === 'chapter' ? 4 : 2;
        if (item.label.toLowerCase().startsWith(tok)) score += 3;
        if (item.chapterTitle.toLowerCase().includes(tok)) score += 1;
      }
    }
    return { item, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.chapterNumber - b.item.chapterNumber)
    .slice(0, 14)
    .map(({ item }) => item);
}

const QUICK_HINTS = ['OFDMA', 'WPA3', 'MIMO', 'DHCP', 'Beamforming', '802.11ax', 'MLO', 'STP', 'RADIUS', 'TWT'];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const { setActiveChapter, setPendingSubtopic } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length >= 1 ? runSearch(query) : [];

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const navigate = useCallback((result: SearchResult) => {
    if (result.type === 'subtopic') {
      // Extract subtopic id: result.id is `${chapterId}-${subtopicId}`
      const subtopicId = result.id.slice(result.chapterId.length + 1);
      setPendingSubtopic(subtopicId);
    }
    setActiveChapter(result.chapterId);
    setOpen(false);
  }, [setActiveChapter, setPendingSubtopic]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) navigate(results[activeIdx]);
  };

  return (
    <>
      {/* Trigger button in top bar */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-700/60 transition-all text-slate-400 hover:text-slate-200 group"
        aria-label="Open search"
      >
        <Search size={14} className="flex-shrink-0" />
        <span className="text-xs hidden sm:inline text-slate-500 group-hover:text-slate-300">Search topics…</span>
        <kbd className="hidden md:flex items-center px-1.5 py-0.5 rounded text-xs border border-slate-700 bg-slate-900/60 text-slate-600 font-mono group-hover:border-slate-600 group-hover:text-slate-500">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — solid dim, no blur so content behind is clearly suppressed */}
            <motion.div
              className="fixed inset-0 z-[60] bg-black/80"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />

            {/* Search panel — above backdrop, fully opaque */}
            <motion.div
              className="fixed inset-x-4 top-[4.5rem] z-[61] max-w-xl mx-auto"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="rounded-2xl border border-slate-600/70 bg-slate-900 shadow-2xl shadow-black/70 overflow-hidden ring-1 ring-white/5">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/60">
                  <Search size={16} className="text-slate-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search any topic, chapter, concept…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                    spellCheck={false}
                  />
                  {query ? (
                    <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                      <X size={14} />
                    </button>
                  ) : (
                    <kbd className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs border border-slate-700 bg-slate-800 text-slate-600 font-mono">Esc</kbd>
                  )}
                </div>

                {/* Results list */}
                {results.length > 0 ? (
                  <div className="max-h-[360px] overflow-y-auto">
                    {results.map((r, i) => (
                      <button
                        key={r.id}
                        onClick={() => navigate(r)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-slate-800 last:border-0 ${
                          activeIdx === i ? 'bg-slate-700' : 'hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-lg flex-shrink-0 leading-none">{r.chapterIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-xs font-bold ${r.accentClass}`}>Ch.{r.chapterNumber}</span>
                            <span className="text-xs text-slate-600">·</span>
                            <span className="text-xs text-slate-500 truncate">{r.chapterTitle}</span>
                            {r.type === 'subtopic' && (
                              <span className="ml-auto flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs border border-slate-700/60 bg-slate-800/60 text-slate-500">
                                <Hash size={9} />topic
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-200 truncate">{r.label}</p>
                        </div>
                        <ArrowUpRight size={13} className={`flex-shrink-0 transition-colors ${activeIdx === i ? 'text-slate-400' : 'text-slate-700'}`} />
                      </button>
                    ))}
                  </div>

                ) : query.trim().length >= 1 ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-slate-400 mb-1">No results for <span className="text-white font-medium">"{query}"</span></p>
                    <p className="text-xs text-slate-600">Try: MIMO, OFDMA, WPA3, beamforming, DHCP, 802.11ax…</p>
                  </div>

                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Quick jump</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_HINTS.map(hint => (
                        <button
                          key={hint}
                          onClick={() => setQuery(hint)}
                          className="px-2.5 py-1 rounded-lg text-xs border border-slate-700 bg-slate-800/60 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-700/60 transition-all"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 pt-1">Search across {SEARCH_INDEX.length} topics in {CHAPTERS.length} chapters</p>
                  </div>
                )}

                {/* Footer hint bar */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-800 bg-slate-900 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><kbd className="font-mono text-slate-500">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="font-mono text-slate-500">↵</kbd> open</span>
                  <span className="flex items-center gap-1"><kbd className="font-mono text-slate-500">Esc</kbd> close</span>
                  <span className="ml-auto">{results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : ''}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
