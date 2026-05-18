import { motion } from 'framer-motion';
import type { Chapter } from '../../types';

interface ChapterHeaderProps {
  chapter: Chapter;
  description: string;
}

export function ChapterHeader({ chapter, description }: ChapterHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl ${chapter.bgClass} ${chapter.borderClass}
                          flex items-center justify-center text-3xl flex-shrink-0`}>
          {chapter.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest ${chapter.accentClass}`}>
              Chapter {chapter.number}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-500">{chapter.subtitle}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{chapter.title}</h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
