import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { CHAPTERS } from './data/curriculum';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Chapter0 } from './chapters/Chapter0';
import { Chapter1 } from './chapters/Chapter1';
import { Chapter2 } from './chapters/Chapter2';
import { Chapter3 } from './chapters/Chapter3';
import { Chapter4 } from './chapters/Chapter4';
import { Chapter5 } from './chapters/Chapter5';
import { Chapter6 } from './chapters/Chapter6';
import { Chapter7  } from './chapters/Chapter7';
import { Chapter8  } from './chapters/Chapter8';
import { Chapter9  } from './chapters/Chapter9';
import { Chapter10 } from './chapters/Chapter10';
import { Chapter11 } from './chapters/Chapter11';
import { Chapter12 } from './chapters/Chapter12';
import { Chapter16 } from './chapters/Chapter16';
import { Chapter17 } from './chapters/Chapter17';
import { Chapter18 } from './chapters/Chapter18';
import { Chapter13 } from './chapters/Chapter13';
import { Chapter14 } from './chapters/Chapter14';
import { Chapter15 } from './chapters/Chapter15';
import { Sandbox   } from './chapters/Sandbox';

const CHAPTER_COMPONENTS = {
  ch0:     Chapter0,
  ch1:     Chapter1,
  ch2:     Chapter2,
  ch3:     Chapter3,
  ch4:     Chapter4,
  ch5:     Chapter5,
  ch6:     Chapter6,
  ch7:     Chapter7,
  ch8:     Chapter8,
  ch9:     Chapter9,
  ch10:    Chapter10,
  ch11:    Chapter11,
  ch12:    Chapter12,
  ch16:    Chapter16,
  ch17:    Chapter17,
  ch18:    Chapter18,
  ch13:    Chapter13,
  ch14:    Chapter14,
  ch15:    Chapter15,
  sandbox: Sandbox,
};

// Extend window type for gtag
declare global { interface Window { gtag?: (...args: unknown[]) => void } }

function AppShell() {
  const { activeChapter } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ActiveChapter = CHAPTER_COMPONENTS[activeChapter];

  // Fire a virtual page_view each time the user opens a chapter
  useEffect(() => {
    const chapter = CHAPTERS.find(c => c.id === activeChapter);
    const title = chapter
      ? `Ch.${chapter.number} — ${chapter.title}`
      : 'Sandbox';
    const path = `/${activeChapter}`;
    window.gtag?.('event', 'page_view', {
      page_title: title,
      page_path: path,
      page_location: window.location.origin + path,
    });
  }, [activeChapter]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900 dark">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <ActiveChapter />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
