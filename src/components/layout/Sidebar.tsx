import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CHAPTERS } from '../../data/curriculum';
import type { ChapterId } from '../../types';

export function Sidebar() {
  const { activeChapter, setActiveChapter } = useApp();
  const [expanded, setExpanded] = useState<ChapterId | null>('ch16');

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-surface-800 border-r border-slate-700/50 h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-band24 to-band5 flex items-center justify-center text-lg shadow-neon-blue">
            📶
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Dot11Lab</h1>
            <p className="text-xs text-slate-500">IEEE 802.3 & 802.11 Engineering</p>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {CHAPTERS.map(ch => {
          const isActive = activeChapter === ch.id;
          const isExpanded = expanded === ch.id;

          return (
            <div key={ch.id} className="mb-0.5">
              <button
                onClick={() => {
                  setActiveChapter(ch.id);
                  setExpanded(isExpanded ? null : ch.id);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group ${
                  isActive
                    ? `${ch.bgClass} ${ch.accentClass} border border-current/20`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'
                }`}
              >
                <span className="text-base leading-none">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? ch.accentClass : ''}`}>
                    Ch.{ch.number} · {ch.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{ch.subtitle}</p>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 pl-3 border-l border-slate-700/50 mt-1 mb-2 space-y-0.5">
                      {ch.subTopics.map(st => (
                        <div key={st.id} className="flex items-center gap-2 py-0.5">
                          <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{st.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
