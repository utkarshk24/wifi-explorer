// ─── Audience Mode (kept for backward compat — always 'enthusiast') ──────────
export type AudienceMode = 'kid' | 'enthusiast' | 'pro';

export interface ModeLabels {
  kid: string;
  enthusiast: string;
  pro: string;
}

// ─── Curriculum / Chapter Types ───────────────────────────────────────────────
export type ChapterId =
  | 'ch16' | 'ch17' | 'ch18'
  | 'ch13' | 'ch14' | 'ch15'
  | 'ch0' | 'ch1' | 'ch2' | 'ch3' | 'ch4'
  | 'ch5' | 'ch6' | 'ch7' | 'ch8' | 'ch9' | 'ch10' | 'ch11' | 'ch12'
  | 'sandbox';

export interface SubTopic {
  id: string;
  label: string;
  completed: boolean;
}

export interface Chapter {
  id: ChapterId;
  number: number;
  title: string;
  subtitle: string;
  icon: string;
  color: 'wired' | 'band24' | 'band5' | 'band6' | 'multi';
  accentClass: string;      // Tailwind text color class
  borderClass: string;      // Tailwind border glow class
  bgClass: string;          // Tailwind bg class for badges
  subTopics: SubTopic[];
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface AppContextType {
  mode: AudienceMode;           // always 'enthusiast' — mode switching removed
  activeChapter: ChapterId;
  setActiveChapter: (c: ChapterId) => void;
  markComplete: (chapterId: ChapterId, subTopicId: string) => void; // no-op
  pendingSubtopic: string | null;
  setPendingSubtopic: (id: string | null) => void;
}

// ─── DHCP / DNS Animation Step Types ─────────────────────────────────────────
export interface AnimStep {
  id: string;
  label: string;
  from: 'client' | 'server' | 'switch' | 'dns' | 'internet';
  to:   'client' | 'server' | 'switch' | 'dns' | 'internet';
  color: string;           // hex
  emoji: string;
  content: ModeLabels;
  detail: ModeLabels;
}
