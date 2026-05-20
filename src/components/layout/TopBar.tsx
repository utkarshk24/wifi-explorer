import { Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CHAPTERS } from '../../data/curriculum';
import { GlobalSearch } from './GlobalSearch';

interface TopBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export function TopBar({ sidebarOpen, setSidebarOpen }: TopBarProps) {
  const { activeChapter } = useApp();
  const chapter = CHAPTERS.find(c => c.id === activeChapter);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5
                        bg-surface-800/80 backdrop-blur-md border-b border-slate-700/50">
      {/* Mobile burger */}
      <button
        className="lg:hidden text-slate-400 hover:text-white transition-colors flex-shrink-0"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 text-sm hidden sm:inline">Wi-Fi Explorer</span>
          <span className="text-slate-700 hidden sm:inline">/</span>
          {chapter && (
            <span className={`text-sm font-semibold truncate ${chapter.accentClass}`}>
              Ch.{chapter.number} — {chapter.title}
            </span>
          )}
        </div>
      </div>

      {/* Global search */}
      <GlobalSearch />
    </header>
  );
}
