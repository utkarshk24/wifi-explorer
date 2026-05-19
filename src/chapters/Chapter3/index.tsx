import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch3')!;

// ─── CSMA/CA Timeline Simulator ───────────────────────────────────────────────
type PhaseType = 'idle' | 'difs' | 'backoff' | 'tx' | 'sifs' | 'ack' | 'collision';

interface TimelineEvent {
  device: 'A' | 'B';
  phase: PhaseType;
  duration: number;
  label: string;
  color: string;
}

const PHASE_COLORS: Record<PhaseType, string> = {
  idle:      '#1e293b',
  difs:      '#0891b2',
  backoff:   '#a855f7',
  tx:        '#10b981',
  sifs:      '#f59e0b',
  ack:       '#22c55e',
  collision: '#ef4444',
};

function buildTimeline(scenario: 'normal' | 'collision' | 'rtscts'): TimelineEvent[] {
  if (scenario === 'normal') {
    return [
      { device: 'A', phase: 'idle',    duration: 40,  label: 'IDLE (channel busy)', color: PHASE_COLORS.idle    },
      { device: 'A', phase: 'difs',    duration: 50,  label: 'DIFS Wait',            color: PHASE_COLORS.difs    },
      { device: 'A', phase: 'backoff', duration: 60,  label: 'Random Backoff (3)',    color: PHASE_COLORS.backoff },
      { device: 'A', phase: 'tx',      duration: 120, label: 'DATA Frame TX',         color: PHASE_COLORS.tx      },
      { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',                  color: PHASE_COLORS.sifs    },
      { device: 'A', phase: 'ack',     duration: 40,  label: 'ACK Received',          color: PHASE_COLORS.ack     },
      { device: 'B', phase: 'idle',    duration: 80,  label: 'IDLE (A is transmitting)', color: PHASE_COLORS.idle },
      { device: 'B', phase: 'difs',    duration: 50,  label: 'DIFS Wait',             color: PHASE_COLORS.difs    },
      { device: 'B', phase: 'backoff', duration: 100, label: 'Random Backoff (5)',    color: PHASE_COLORS.backoff },
      { device: 'B', phase: 'tx',      duration: 110, label: 'DATA Frame TX',         color: PHASE_COLORS.tx      },
    ];
  }
  if (scenario === 'collision') {
    return [
      { device: 'A', phase: 'difs',     duration: 50,  label: 'DIFS',         color: PHASE_COLORS.difs      },
      { device: 'A', phase: 'backoff',  duration: 40,  label: 'Backoff (2)',   color: PHASE_COLORS.backoff   },
      { device: 'A', phase: 'collision',duration: 60,  label: 'COLLISION!',    color: PHASE_COLORS.collision },
      { device: 'A', phase: 'backoff',  duration: 100, label: 'Backoff x2',    color: PHASE_COLORS.backoff   },
      { device: 'A', phase: 'tx',       duration: 110, label: 'DATA TX (retry)', color: PHASE_COLORS.tx      },
      { device: 'B', phase: 'difs',     duration: 50,  label: 'DIFS',         color: PHASE_COLORS.difs      },
      { device: 'B', phase: 'backoff',  duration: 40,  label: 'Backoff (2)',   color: PHASE_COLORS.backoff   },
      { device: 'B', phase: 'collision',duration: 60,  label: 'COLLISION!',    color: PHASE_COLORS.collision },
      { device: 'B', phase: 'backoff',  duration: 140, label: 'Backoff x2',    color: PHASE_COLORS.backoff   },
      { device: 'B', phase: 'tx',       duration: 100, label: 'DATA TX (retry)', color: PHASE_COLORS.tx      },
    ];
  }
  return [
    { device: 'A', phase: 'difs',    duration: 50,  label: 'DIFS',          color: PHASE_COLORS.difs    },
    { device: 'A', phase: 'tx',      duration: 40,  label: 'RTS',           color: '#0ea5e9'             },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'ack',     duration: 40,  label: 'CTS',           color: '#a855f7'             },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'tx',      duration: 120, label: 'DATA TX',       color: PHASE_COLORS.tx      },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'ack',     duration: 40,  label: 'ACK',           color: PHASE_COLORS.ack     },
    { device: 'B', phase: 'idle',    duration: 115, label: 'NAV (from CTS)', color: '#1e3a5f'            },
    { device: 'B', phase: 'backoff', duration: 200, label: 'Deferred (NAV)', color: '#2d1b69'            },
  ];
}

function CSMACATimeline() {
  const { mode: _m } = useApp();
  const [scenario, setScenario] = useState<'normal' | 'collision' | 'rtscts'>('normal');
  const [played, setPlayed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const events = buildTimeline(scenario);
  const totalWidth = events.reduce((s, e) => s + e.duration, 0);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlayed(0);
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => {
    reset();
    setIsPlaying(true);
    let delay = 0;
    events.forEach((_, i) => {
      delay += events[i].duration * 8;
      timerRef.current = setTimeout(() => {
        setPlayed(i + 1);
        if (i === events.length - 1) setIsPlaying(false);
      }, delay);
    });
  }, [events, reset]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const deviceA = events.filter(e => e.device === 'A');
  const deviceB = events.filter(e => e.device === 'B');

  const renderRow = (devEvents: TimelineEvent[], label: string, devChar: 'A' | 'B') => {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 w-16 flex-shrink-0">{label}</span>
        <div className="flex-1 h-10 bg-surface-900/70 rounded-lg overflow-hidden relative flex">
          {devEvents.map((ev, i) => {
            const globalIdx = events.indexOf(ev);
            const show = globalIdx < played;
            const w = (ev.duration / totalWidth) * 100;
            return (
              <motion.div
                key={`${devChar}-${i}`}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: show ? 1 : 0, opacity: show ? 1 : 0 }}
                style={{ width: `${w}%`, background: ev.color, originX: 0 }}
                transition={{ duration: 0.3 }}
                className="h-full flex items-center justify-center overflow-hidden border-r border-slate-800/50"
                title={ev.label}
              >
                {w > 8 && <span className="text-xs font-semibold text-white/90 px-1 truncate" style={{ fontSize: '9px' }}>
                  {ev.label}
                </span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* CSMA/CA Flowchart */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">CSMA/CA — Full Collision Avoidance Flowchart</h3>
        <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
          <div className="flex flex-col items-center gap-0 min-w-[320px]">
            {[
              { label: 'Sense Medium (CCA)', color: '#06b6d4', shape: 'rect' },
              { label: 'Medium Busy?', color: '#f59e0b', shape: 'diamond' },
              { label: 'Wait + DIFS (34µs)', color: '#0891b2', shape: 'rect', note: 'yes → defer' },
              { label: 'Medium Idle?', color: '#f59e0b', shape: 'diamond' },
              { label: 'Random Backoff [0, CW-1] slots', color: '#a855f7', shape: 'rect', note: 'yes → backoff' },
              { label: 'Decrement backoff while idle; freeze if busy', color: '#7c3aed', shape: 'rect' },
              { label: 'Backoff = 0?', color: '#f59e0b', shape: 'diamond' },
              { label: 'TRANSMIT Frame', color: '#10b981', shape: 'rect', note: 'yes → send' },
              { label: 'Wait ACK (SIFS + ACK timeout)', color: '#0891b2', shape: 'rect' },
              { label: 'ACK Received?', color: '#f59e0b', shape: 'diamond' },
              { label: 'SUCCESS — frame delivered', color: '#22c55e', shape: 'rect', note: 'yes' },
              { label: 'Retry: double CW, repeat backoff', color: '#ef4444', shape: 'rect', note: 'no → retry' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                {i > 0 && <div className="w-0.5 h-5 bg-slate-600" />}
                {step.note && (
                  <div className="text-xs text-slate-500 mb-1">{step.note}</div>
                )}
                <div
                  className="px-4 py-2 text-xs font-semibold text-center max-w-xs w-full"
                  style={step.shape === 'diamond'
                    ? { background: step.color + '15', border: `1px solid ${step.color}50`, color: step.color, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', padding: '14px 32px', lineHeight: '1.2' }
                    : { background: step.color + '15', border: `1px solid ${step.color}50`, color: step.color, borderRadius: '8px' }}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <ModeContent
          content={{
            kid: 'Wi-Fi works like a polite conversation — you LISTEN before you talk, wait a bit (DIFS), then count down a random number before sending. This way, devices do not all shout at the same time!',
            enthusiast: 'CSMA/CA: Listen first, then wait, then transmit. Each device picks a random backoff slot, decrementing only when the channel is free. First to reach zero wins the channel. Collisions are avoided (not detected) unlike Ethernet CSMA/CD.',
            pro: 'DCF mechanism: CCA → DIFS → random backoff [0, CW] → countdown while medium idle → transmit. CW doubles on retry (BEB: Binary Exponential Backoff). SIFS (16µs) precedes ACK. No ACK after DIFS+backoff → assume collision → retry up to dot11ShortRetryLimit=7.',
          }}
          className="text-sm text-slate-400 leading-relaxed"
        />
      </div>

      {/* Timeline Simulator */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">CSMA/CA Medium Access Timeline</h3>
          <div className="flex gap-1.5">
            <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={play} disabled={isPlaying} className="btn-primary text-xs flex items-center gap-1">
              <Play size={12} fill="currentColor" /> {isPlaying ? 'Playing...' : 'Animate'}
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['normal', 'collision', 'rtscts'] as const).map(s => (
            <button key={s} onClick={() => { setScenario(s); reset(); }}
              className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                scenario === s ? 'bg-band5/20 border-band5/50 text-band5' : 'border-slate-700 text-slate-500'}`}>
              {s === 'normal' ? 'Normal' : s === 'collision' ? 'Collision' : 'RTS/CTS'}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {renderRow(deviceA, 'Device A', 'A')}
          {renderRow(deviceB, 'Device B', 'B')}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PHASE_COLORS).filter(([k]) => k !== 'idle').map(([phase, color]) => (
            <div key={phase} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-xs text-slate-500 capitalize">{phase}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── IFS Timing Windows ───────────────────────────────────────────────────────
const IFS_DATA = [
  { name: 'SIFS',  us: 16,  color: '#f59e0b', icon: 'S',
    kid: 'The SHORTEST wait — used only for the quick "Got it!" reply (ACK) right after receiving a frame.',
    enthusiast: 'Shortest IFS (16µs) — used for ACK, Block ACK, CTS responses. Highest priority access.',
    pro: 'SIFS = 16µs (802.11a/n/ac/ax @ 5GHz). Slot time = 9µs. CCA + PHY preamble detection must complete within SIFS. Used for: ACK, BA, CTS, CF-End, 2nd frame in burst.' },
  { name: 'PIFS',  us: 25,  color: '#a855f7', icon: 'P',
    kid: 'A medium-short wait used by the access point to grab the channel for special timed (PCF) transmissions.',
    enthusiast: 'PCF IFS (25µs) — used by the AP in Point Coordination Function mode to reserve channel access.',
    pro: 'PIFS = SIFS + 1 slot (25µs). Used by CF-Pollable STAs under PCF / HCCA for scheduled TXOP delivery in QoS traffic.' },
  { name: 'DIFS',  us: 34,  color: '#06b6d4', icon: 'D',
    kid: 'The standard wait time before any device tries to send data — like counting to 3 before speaking in class.',
    enthusiast: 'DCF IFS (34µs) — the normal wait before transmitting data. Most traffic uses this + random backoff.',
    pro: 'DIFS = SIFS + 2xSlot (34µs). Used for all DCF data frames. After DIFS, device enters random backoff [0, CW-1] slots. CWmin=15 (802.11ax), CWmax=1023.' },
  { name: 'AIFS',  us: 43,  color: '#10b981', icon: 'A',
    kid: 'A customizable wait time used for QoS — voice packets get a short AIFS, background downloads get a longer one.',
    enthusiast: 'Arbitration IFS — Wi-Fi 6 QoS priority. Voice/Video get shorter AIFS than Best-Effort or Background.',
    pro: 'AIFS[AC] = SIFS + AIFSN[AC]xSlot. AIFSN: Voice=2, Video=2, BE=3, BK=7. EDCA replaces DCF, enabling 4-class QoS (WMM: AC_VO, AC_VI, AC_BE, AC_BK).' },
  { name: 'EIFS',  us: 360, color: '#ef4444', icon: 'E',
    kid: 'The LONGEST wait — used after detecting a corrupted/garbled frame, giving time for the sender to clean up.',
    enthusiast: 'Extended IFS (360µs) — triggered when a device hears a bad frame it cannot decode, to avoid interfering with an ongoing transmission.',
    pro: 'EIFS = SIFS + ACK TX time + DIFS. Used when CCA detects a frame but FCS fails. Duration ~360µs (802.11a).' },
];

function IFSTimingDiagram() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const maxUs = 400;

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <h3 className="font-bold text-white">IFS Timing Windows Comparison</h3>
      <p className="text-xs text-slate-500">Click any bar to learn more. Shorter IFS = higher channel access priority.</p>
      <div className="space-y-3">
        {IFS_DATA.map(ifs => {
          const w = (ifs.us / maxUs) * 100;
          const isSelected = selected === ifs.name;
          return (
            <motion.div key={ifs.name} whileHover={{ x: 2 }} onClick={() => setSelected(isSelected ? null : ifs.name)}
              className="cursor-pointer">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono font-bold w-12 flex-shrink-0" style={{ color: ifs.color }}>{ifs.name}</span>
                <span className="text-xs text-slate-500 w-10 flex-shrink-0 text-right">{ifs.us}µs</span>
                <div className="flex-1 h-8 bg-surface-900/60 rounded-lg overflow-hidden">
                  <motion.div className="h-full rounded-lg flex items-center px-2"
                    style={{ background: ifs.color + '25', border: `1px solid ${ifs.color}50` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${w}%` }}
                    transition={{ duration: 0.5 }}>
                    <span className="text-xs font-bold" style={{ color: ifs.color }}>{ifs.icon} {ifs.name}</span>
                  </motion.div>
                </div>
              </div>
              <motion.div animate={{ height: isSelected ? 'auto' : 0, opacity: isSelected ? 1 : 0 }}
                initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden ml-28">
                <p className="text-xs text-slate-400 py-2 leading-relaxed">
                  {mode === 'kid' ? ifs.kid : mode === 'enthusiast' ? ifs.enthusiast : ifs.pro}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {IFS_DATA.map(ifs => (
          <span key={ifs.name} className="chip border text-xs" style={{ color: ifs.color, borderColor: ifs.color + '40', background: ifs.color + '10' }}>
            {ifs.name} = {ifs.us}µs
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Hidden Node & RTS/CTS ────────────────────────────────────────────────────
function HiddenNodeDemo() {
  const { mode } = useApp();
  const [scenario, setScenario] = useState<'problem' | 'solution'>('problem');
  const [step, setStep] = useState(0);

  const PROBLEM_STEPS = [
    { label: 'A & C both idle', desc: { kid: 'Device A and Device C are both waiting to talk to the AP. They cannot hear each other — there is a wall between them!', enthusiast: 'Device A and C are out of each other\'s radio range but both in AP range — the classic hidden node scenario.', pro: 'STAs A and C are within AP range but outside each other\'s CCA range (>~150m apart or obstructed). Neither can detect the other\'s carrier.' } },
    { label: 'A & C transmit simultaneously', desc: { kid: 'Both A and C shout at the AP at the same time — because they could not hear each other to know the channel was busy!', enthusiast: 'Both devices pass CCA (channel appears idle) and transmit simultaneously, causing a collision at the AP.', pro: 'Both STAs perform CCA → DIFS → backoff. Since neither can hear the other, both backoff timers expire simultaneously. Frames collide at AP. FCS fails. No ACK sent.' } },
    { label: 'Collision at AP!', desc: { kid: 'The AP hears a garbled mess. Nobody gets their message through — wasted airtime!', enthusiast: 'AP receives two overlapping signals = undecodable collision. No ACK is sent. Both A and C wait, then retry with doubled backoff.', pro: 'AP detects energy but FCS fails (corrupted). EIFS triggered on AP. Both STAs timeout waiting for ACK → retry limit exhausted → exponential CW growth reduces throughput dramatically.' } },
  ];

  const SOLUTION_STEPS = [
    { label: 'A sends RTS to AP', desc: { kid: 'Before sending data, Device A politely raises its hand: "Hey AP, can I talk? I need 50ms!" The AP hears this announcement.', enthusiast: 'A sends a small RTS (Request to Send) frame to the AP, reserving airtime. C cannot hear A, but will hear the AP reply.', pro: 'STA A sends DIFS + backoff → RTS (20B: FC, Duration, RA=AP, TA=A, FCS). Duration field = time needed for DATA+SIFS+ACK.' } },
    { label: 'AP broadcasts CTS to ALL', desc: { kid: 'The AP shouts "QUIET everyone! I am talking to Device A for 50ms!" NOW Device C can hear this and stays quiet.', enthusiast: 'AP replies with CTS. C hears it, sets its NAV (virtual carrier sense) timer, and stays quiet for the reserved duration.', pro: 'AP sends CTS (14B, RA=A, Duration=DATA+SIFS+ACK). All STAs hearing CTS (including C) update NAV timer. Virtual carrier sense prevents C from transmitting.' } },
    { label: 'A transmits safely', desc: { kid: 'Now A can send its full message without anyone interrupting — the AP replies with ACK and everyone is happy!', enthusiast: 'A transmits data, AP sends ACK. C waits silently with NAV active. No collision!', pro: 'Protected exchange: RTS→CTS→DATA→ACK. Overhead: ~110µs extra. Tradeoff: RTS/CTS only beneficial for large frames (MPDU > dot11RTSThreshold, typically >=500B for crowded networks).' } },
  ];

  const steps = scenario === 'problem' ? PROBLEM_STEPS : SOLUTION_STEPS;
  const cur = steps[Math.min(step, steps.length - 1)];

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <h3 className="font-bold text-white">Hidden Node Problem & RTS/CTS Solution</h3>
      <div className="flex gap-2">
        {(['problem', 'solution'] as const).map(s => (
          <button key={s} onClick={() => { setScenario(s); setStep(0); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              scenario === s
                ? s === 'problem' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {s === 'problem' ? 'The Problem' : 'RTS/CTS Fix'}
          </button>
        ))}
      </div>
      <div className="bg-surface-900/70 rounded-xl p-4">
        <svg viewBox="0 0 500 160" className="w-full" style={{ maxHeight: 160 }}>
          <circle cx="110" cy="80" r="90" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          <circle cx="390" cy="80" r="90" fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          <circle cx="250" cy="80" r="95" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          <line x1="130" y1="80" x2="370" y2="80" stroke="#ef444440" strokeDasharray="4 3" strokeWidth="1.5" />
          <text x="250" y="68" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="Inter">Cannot hear each other</text>
          {[{ x: 110, y: 80, icon: 'A', label: 'Device A', color: '#06b6d4' },
            { x: 250, y: 80, icon: 'AP', label: 'AP', color: '#a855f7' },
            { x: 390, y: 80, icon: 'C', label: 'Device C', color: '#10b981' }].map(n => (
            <g key={n.label} transform={`translate(${n.x},${n.y})`}>
              <circle r="22" fill={n.color + '15'} stroke={n.color + '60'} strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fill={n.color} fontSize="9" fontWeight="bold">{n.icon}</text>
              <text textAnchor="middle" y="33" fill="#94a3b8" fontSize="9" fontFamily="Inter">{n.label}</text>
            </g>
          ))}
          {scenario === 'problem' && step === 1 && (
            <>
              <motion.rect x="115" y="72" width="48" height="16" rx="4" fill="#ef444430" stroke="#ef4444" strokeWidth="1"
                animate={{ x: [115, 225] }} transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }} />
              <motion.rect x="385" y="72" width="48" height="16" rx="4" fill="#10b98130" stroke="#10b981" strokeWidth="1"
                animate={{ x: [385, 275] }} transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }} />
            </>
          )}
          {scenario === 'solution' && step >= 1 && (
            <text x="250" y="105" textAnchor="middle" fill="#a855f7" fontSize="8" fontFamily="monospace">
              {step === 1 ? 'NAV = 0' : 'NAV Active (C silent)'}
            </text>
          )}
        </svg>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              step === i ? (scenario === 'problem' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400')
                         : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {i + 1}. {s.label}
          </button>
        ))}
      </div>
      <motion.div key={`${scenario}-${step}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`rounded-xl p-4 border text-sm text-slate-400 leading-relaxed ${
          scenario === 'problem' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        {cur.desc[mode]}
      </motion.div>
    </div>
  );
}

// ─── NAV & Virtual Carrier Sense ─────────────────────────────────────────────
function NAVDemo() {
  const [step, setStep] = useState(0);
  const [navTimer, setNavTimer] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startNAV = () => {
    setNavTimer(100);
    setStep(2);
    intervalRef.current = setInterval(() => {
      setNavTimer(v => {
        if (v <= 0) {
          clearInterval(intervalRef.current!);
          setStep(3);
          return 0;
        }
        return v - 2;
      });
    }, 80);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const stations = ['B', 'C', 'D'];

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <h3 className="font-bold text-white">NAV — Network Allocation Vector & Virtual Carrier Sense</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Diagram */}
        <div className="bg-surface-900/70 rounded-xl p-4">
          <svg viewBox="0 0 340 200" className="w-full" style={{ maxHeight: 200 }}>
            {/* Station A → AP */}
            <g transform="translate(40,90)">
              <circle r="20" fill="#06b6d420" stroke="#06b6d4" strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fill="#06b6d4" fontSize="10" fontWeight="bold">A</text>
              <text textAnchor="middle" y="30" fill="#94a3b8" fontSize="8">Sender</text>
            </g>
            <g transform="translate(170,90)">
              <circle r="22" fill="#a855f720" stroke="#a855f7" strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fill="#a855f7" fontSize="10" fontWeight="bold">AP</text>
            </g>
            {/* RTS arrow */}
            {step >= 1 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <line x1="62" y1="85" x2="146" y2="85" stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
                <rect x="82" y="70" width="44" height="14" rx="4" fill="#06b6d420" stroke="#06b6d450" />
                <text x="104" y="80" textAnchor="middle" fill="#06b6d4" fontSize="8">RTS + Duration</text>
              </motion.g>
            )}
            <defs>
              <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#06b6d4" />
              </marker>
              <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#a855f7" />
              </marker>
            </defs>
            {/* Stations B, C, D */}
            {stations.map((sta, i) => {
              const y = 30 + i * 55;
              const navFill = step >= 2 ? navTimer / 100 : 0;
              return (
                <g key={sta} transform={`translate(300,${y})`}>
                  <circle r="18" fill="#f59e0b15" stroke="#f59e0b60" strokeWidth="1" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#f59e0b" fontSize="10" fontWeight="bold">{sta}</text>
                  {step >= 2 && (
                    <g transform="translate(-60,-5)">
                      <rect x="0" y="0" width="40" height="10" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                      <rect x="0" y="0" width={40 * navFill} height="10" rx="3" fill={navFill > 0.3 ? '#f59e0b' : '#ef4444'} />
                      <text x="20" y="8" textAnchor="middle" fill="white" fontSize="6">NAV</text>
                    </g>
                  )}
                  {step >= 1 && (
                    <motion.line
                      x1={170 - 300} y1={90 - y} x2={-18} y2="0"
                      stroke="#a855f750" strokeWidth="1" strokeDasharray="4 3"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    />
                  )}
                </g>
              );
            })}
            {/* AP CTS broadcast */}
            {step >= 1 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <circle cx="170" cy="90" r="110" fill="none" stroke="#a855f730" strokeWidth="1" strokeDasharray="6 3" />
                <text x="170" y="170" textAnchor="middle" fill="#a855f7" fontSize="7">CTS broadcast range</text>
              </motion.g>
            )}
          </svg>
        </div>

        {/* Controls & explanation */}
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <button onClick={() => setStep(1)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${step >= 1 ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-slate-700 text-slate-500'}`}>
              Step 1: Station A sends RTS with Duration field
            </button>
            <button onClick={startNAV}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left ${step >= 2 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-slate-700 text-slate-500'}`}>
              Step 2: Stations B/C/D set NAV timer = Duration (click to animate countdown)
            </button>
            {step === 3 && (
              <div className="px-3 py-2 rounded-lg text-xs font-semibold border bg-emerald-500/20 border-emerald-500/40 text-emerald-400">
                Step 3: NAV expired — medium free again
              </div>
            )}
          </div>
          {step >= 2 && (
            <div className="bg-surface-900/60 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">NAV Countdown:</p>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ width: `${navTimer}%`, background: navTimer > 30 ? '#f59e0b' : '#ef4444' }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{navTimer}% remaining — stations DEFER transmission</p>
            </div>
          )}
          <div className="bg-surface-900/60 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-300">Physical vs Virtual Carrier Sense</p>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex gap-2">
                <span className="text-cyan-400 font-semibold w-24 flex-shrink-0">Physical CS:</span>
                <span>CCA — radio actually detects RF energy above threshold on the channel</span>
              </div>
              <div className="flex gap-2">
                <span className="text-amber-400 font-semibold w-24 flex-shrink-0">Virtual CS:</span>
                <span>NAV timer — logical deferral based on Duration field in received frames (no RF sensing needed)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ModeContent content={{
        kid: 'NAV is like a "Do Not Disturb" timer. When a device hears another station say "I need the channel for 50ms", it sets a countdown — and nobody interrupts until the timer hits zero!',
        enthusiast: 'The NAV (Network Allocation Vector) is a virtual carrier sense mechanism. Stations that hear an RTS or CTS frame update their NAV with the Duration field value and defer transmission without needing to physically sense the channel. This is key to RTS/CTS protection.',
        pro: 'NAV is maintained per-STA as a countdown (microseconds). Updated from Duration field in: RTS, CTS, Data, CF-Poll. STA\'s medium-busy determination = CCA busy OR (NAV > 0). Virtual CS allows stations outside physical range of the transmitter (but within AP range) to still defer — solving the hidden node problem without requiring STA-STA range.',
      }} className="text-sm text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── QoS & WMM / EDCA ────────────────────────────────────────────────────────
const WMM_ACS = [
  { ac: 'AC_VO', name: 'Voice', aifsn: 2, cwMin: 3,  cwMax: 7,   txop: '1.504ms', color: '#ef4444', icon: 'VO', priority: 'Highest' },
  { ac: 'AC_VI', name: 'Video', aifsn: 2, cwMin: 7,  cwMax: 15,  txop: '3.008ms', color: '#f59e0b', icon: 'VI', priority: 'High'    },
  { ac: 'AC_BE', name: 'Best Effort', aifsn: 3, cwMin: 15, cwMax: 1023, txop: '0 (unlimited)', color: '#06b6d4', icon: 'BE', priority: 'Normal' },
  { ac: 'AC_BK', name: 'Background', aifsn: 7, cwMin: 15, cwMax: 1023, txop: '0 (unlimited)', color: '#64748b', icon: 'BK', priority: 'Lowest' },
];

function QoSWMMTab() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<string>('AC_VO');
  const sel = WMM_ACS.find(a => a.ac === selected)!;

  return (
    <div className="space-y-5">
      {/* Access Categories Table */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">WMM / EDCA — 4 Access Categories</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">AC</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Traffic Type</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">AIFSN</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">CWmin</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">CWmax</th>
                <th className="text-right py-2 px-3 text-slate-400 font-semibold">TXOP Limit</th>
                <th className="text-left py-2 px-3 text-slate-400 font-semibold">Priority</th>
              </tr>
            </thead>
            <tbody>
              {WMM_ACS.map(ac => (
                <tr key={ac.ac}
                  onClick={() => setSelected(ac.ac)}
                  className={`border-b border-slate-800 cursor-pointer transition-all ${selected === ac.ac ? 'opacity-100' : 'opacity-70 hover:opacity-90'}`}
                  style={selected === ac.ac ? { background: ac.color + '10' } : {}}>
                  <td className="py-2 px-3">
                    <span className="font-mono font-bold" style={{ color: ac.color }}>{ac.ac}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">{ac.name}</td>
                  <td className="py-2 px-3 text-right font-mono" style={{ color: ac.color }}>{ac.aifsn}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">{ac.cwMin}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">{ac.cwMax}</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">{ac.txop}</td>
                  <td className="py-2 px-3">
                    <span className="chip text-xs" style={{ color: ac.color, background: ac.color + '15', borderColor: ac.color + '30' }}>
                      {ac.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* EDCA Contention visualization */}
        <div className="bg-surface-900/70 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">EDCA Contention — Lower AIFS + Smaller CW = Statistical Priority</p>
          <div className="space-y-2">
            {WMM_ACS.map(ac => {
              const aifsWidth = (ac.aifsn / 8) * 30;
              const cwWidth = (Math.log2(ac.cwMax + 1) / 11) * 50;
              return (
                <div key={ac.ac} className="flex items-center gap-2">
                  <span className="text-xs font-mono w-14 flex-shrink-0" style={{ color: ac.color }}>{ac.ac}</span>
                  <div className="flex gap-1 items-center flex-1">
                    <div className="h-6 rounded text-xs flex items-center justify-center font-semibold flex-shrink-0"
                      style={{ width: `${Math.max(aifsWidth, 30)}px`, background: '#0891b220', border: '1px solid #0891b240', color: '#0891b2', fontSize: '9px' }}>
                      AIFS={ac.aifsn}
                    </div>
                    <div className="h-6 rounded text-xs flex items-center justify-center font-semibold"
                      style={{ width: `${cwWidth + 20}px`, background: ac.color + '20', border: `1px solid ${ac.color}40`, color: ac.color, fontSize: '9px' }}>
                      CW [0..{ac.cwMin}]
                    </div>
                    <div className="h-6 rounded text-xs flex items-center px-2 flex-shrink-0"
                      style={{ background: ac.color + '30', border: `1px solid ${ac.color}50`, color: ac.color, fontSize: '9px' }}>
                      TX
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border text-sm text-slate-400 leading-relaxed"
            style={{ borderColor: sel.color + '40', background: sel.color + '08' }}>
            <span className="font-bold" style={{ color: sel.color }}>{sel.ac} ({sel.name}): </span>
            {mode === 'kid'
              ? { AC_VO: 'Voice calls get to jump the line — they wait the shortest time (AIFS=2) and roll the smallest dice (CW 0-3) so they almost always win the channel first!',
                  AC_VI: 'Video streams get second priority — still pretty fast, but slightly behind voice calls.',
                  AC_BE: 'Normal web browsing waits in the regular line — fair share with everyone else.',
                  AC_BK: 'Background downloads (updates, backups) wait the longest — they get the leftover bandwidth so they do not slow down your video calls.' }[selected]
              : mode === 'enthusiast'
              ? { AC_VO: 'Voice traffic uses AIFSN=2 and CWmin=3 (7 possible slots). Tiny TXOP=1.5ms ensures packets are sent quickly. Used for VoIP, SIP calls.',
                  AC_VI: 'Video traffic uses AIFSN=2 and CWmin=7. TXOP=3ms allows bursting video frames. Used for streaming, video conferencing.',
                  AC_BE: 'Best Effort is the default class — same as old DCF. AIFSN=3, CWmin=15. No TXOP limit. Used for web, email.',
                  AC_BK: 'Background has highest AIFSN=7 and CWmin=15 — it statistically loses contention to all other ACs. Used for OS updates, file sync.' }[selected]
              : { AC_VO: 'AC_VO: AIFSN=2, CWmin=3, CWmax=7, TXOP=1.504ms. AIFS = 16 + 2x9 = 34µs. Contention window [0,3] → mean 1.5 slots = 13.5µs. Total pre-TX delay ~47.5µs. Used for G.711 (20ms frames), SIP.',
                  AC_VI: 'AC_VI: AIFSN=2, CWmin=7, CWmax=15, TXOP=3.008ms. AIFS=34µs, mean CW=4 slots. TXOP allows 2-3 video frames per burst. DSCP CS4/AF4x mapping.',
                  AC_BE: 'AC_BE: AIFSN=3, CWmin=15, CWmax=1023, TXOP=0. Equivalent to legacy DCF. AIFS=43µs. Initial CW [0,15] → doubles on collision up to 1023. DSCP CS0.',
                  AC_BK: 'AC_BK: AIFSN=7, CWmin=15, CWmax=1023, TXOP=0. AIFS=16+7x9=79µs. Guaranteed to lose to all other ACs statistically. Used for BE traffic marked down by policing. DSCP CS1.' }[selected]
            }
          </motion.div>
        </AnimatePresence>
      </div>

      {/* TXOP Bursting */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">TXOP Bursting — Transmit Opportunity</h3>
        <div className="bg-surface-900/70 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-3">With TXOP, a station that wins contention can send MULTIPLE frames within one TXOP window:</p>
          <div className="flex items-center gap-1 flex-wrap">
            <div className="h-8 px-3 rounded flex items-center text-xs font-semibold border" style={{ background: '#0891b220', borderColor: '#0891b240', color: '#0891b2' }}>
              DIFS+Backoff
            </div>
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-0.5">
                <div className="h-8 px-3 rounded flex items-center text-xs font-bold border" style={{ background: '#f59e0b20', borderColor: '#f59e0b50', color: '#f59e0b' }}>
                  Frame {n}
                </div>
                <div className="h-8 px-1 rounded flex items-center text-xs border" style={{ background: '#f59e0b15', borderColor: '#f59e0b30', color: '#f59e0b', fontSize: '9px' }}>
                  SIFS
                </div>
                {n < 3 && <div className="h-8 px-2 rounded flex items-center text-xs border" style={{ background: '#22c55e20', borderColor: '#22c55e40', color: '#22c55e', fontSize: '9px' }}>
                  ACK
                </div>}
              </div>
            ))}
            <div className="h-8 px-3 rounded flex items-center text-xs font-semibold border" style={{ background: '#22c55e20', borderColor: '#22c55e50', color: '#22c55e' }}>
              Final ACK
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="h-1 flex-1 rounded" style={{ background: 'linear-gradient(90deg, #f59e0b40, #f59e0b)' }} />
            <span className="text-xs text-amber-400 font-semibold">TXOP = 3.008ms (AC_VI)</span>
            <div className="h-1 flex-1 rounded" style={{ background: 'linear-gradient(90deg, #f59e0b, #f59e0b40)' }} />
          </div>
        </div>
        <ModeContent content={{
          kid: 'TXOP is like getting a "speaking turn" at school — once you win it, you can say multiple things without others interrupting until your time is up!',
          enthusiast: 'TXOP (Transmit Opportunity) allows a station that wins channel access to send multiple frames in a burst. The TXOP limit defines the maximum duration. This dramatically increases efficiency for high-priority traffic like video.',
          pro: 'TXOP = contiguous time interval during which a QSTA can transmit. Bounded by TXOP limit (units of 32µs). Frames within TXOP separated by SIFS. If remaining TXOP < next frame TX time, TXOP ends. AC_VO: 47 TUs, AC_VI: 94 TUs. TXOP=0 means unlimited (or one frame only depending on context).',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Power Save Modes ─────────────────────────────────────────────────────────
function PowerSaveTab() {
  const [psMode, setPsMode] = useState<'legacy' | 'uapsd' | 'twt'>('legacy');

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">Power Save Modes</h3>
        <div className="flex gap-2 flex-wrap">
          {([
            { id: 'legacy', label: 'Legacy PS-Poll', color: '#06b6d4' },
            { id: 'uapsd',  label: 'U-APSD',         color: '#a855f7' },
            { id: 'twt',    label: 'TWT (Wi-Fi 6)',   color: '#10b981' },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setPsMode(m.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all`}
              style={psMode === m.id ? { borderColor: m.color + '60', background: m.color + '15', color: m.color } : { borderColor: '#334155', color: '#64748b' }}>
              {m.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {psMode === 'legacy' && (
            <motion.div key="legacy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-400">Legacy PS-Poll: Client sleeps between DTIM beacons, wakes to check TIM, sends PS-Poll to retrieve buffered frames.</p>
              {/* Timeline */}
              <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
                <div className="min-w-[500px] space-y-2">
                  <div className="text-xs text-slate-500 mb-2">AP:</div>
                  <div className="flex items-center gap-1 h-8">
                    {['Beacon (TIM)', 'Buffer Frame', 'Beacon+DTIM', 'Buffer', 'Buffer', 'Beacon (TIM)'].map((label, i) => (
                      <div key={i} className={`h-full rounded flex items-center justify-center text-xs font-semibold border flex-shrink-0 px-2`}
                        style={label.includes('Beacon') ? { background: '#06b6d420', borderColor: '#06b6d450', color: '#06b6d4', minWidth: '80px' } : { background: '#f59e0b20', borderColor: '#f59e0b50', color: '#f59e0b', minWidth: '60px', fontSize: '9px' }}>
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-3 mb-2">Client:</div>
                  <div className="flex items-center gap-1 h-8">
                    {[
                      { label: 'SLEEP', color: '#1e293b', w: 80 },
                      { label: 'AWAKE (check TIM)', color: '#f59e0b20', border: '#f59e0b50', textColor: '#f59e0b', w: 110 },
                      { label: 'PS-Poll', color: '#a855f720', border: '#a855f750', textColor: '#a855f7', w: 60 },
                      { label: 'Receive Frame', color: '#10b98120', border: '#10b98150', textColor: '#10b981', w: 90 },
                      { label: 'SLEEP', color: '#1e293b', w: 80 },
                    ].map((s, i) => (
                      <div key={i} className="h-full rounded flex items-center justify-center text-xs font-semibold border flex-shrink-0"
                        style={{ width: s.w, background: s.color, borderColor: (s as { border?: string }).border || '#334155', color: (s as { textColor?: string }).textColor || '#475569', fontSize: '9px' }}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {psMode === 'uapsd' && (
            <motion.div key="uapsd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-400">U-APSD (Unscheduled APSD): Client sends a trigger frame to the AP, which immediately delivers all buffered frames. More efficient than PS-Poll.</p>
              <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
                <div className="min-w-[500px] space-y-2">
                  <div className="text-xs text-slate-500 mb-2">Client (STA):</div>
                  <div className="flex items-center gap-1 h-8">
                    {[
                      { label: 'SLEEP', color: '#1e293b', border: '#334155', textColor: '#475569', w: 80 },
                      { label: 'Trigger Frame (QoS Data null)', color: '#a855f720', border: '#a855f750', textColor: '#a855f7', w: 160 },
                      { label: 'Receive Burst', color: '#10b98120', border: '#10b98150', textColor: '#10b981', w: 100 },
                      { label: 'SLEEP', color: '#1e293b', border: '#334155', textColor: '#475569', w: 80 },
                    ].map((s, i) => (
                      <div key={i} className="h-full rounded flex items-center justify-center text-xs font-semibold border flex-shrink-0"
                        style={{ width: s.w, background: s.color, borderColor: s.border, color: s.textColor, fontSize: '9px' }}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 mb-2">AP:</div>
                  <div className="flex items-center gap-1 h-8">
                    {[
                      { label: 'Buffer frames', color: '#f59e0b20', border: '#f59e0b50', textColor: '#f59e0b', w: 100 },
                      { label: 'Deliver burst (SIFS sep.)', color: '#06b6d420', border: '#06b6d450', textColor: '#06b6d4', w: 160 },
                      { label: 'EOSP=1', color: '#22c55e20', border: '#22c55e50', textColor: '#22c55e', w: 70 },
                    ].map((s, i) => (
                      <div key={i} className="h-full rounded flex items-center justify-center text-xs font-semibold border flex-shrink-0"
                        style={{ width: s.w, background: s.color, borderColor: s.border, color: s.textColor, fontSize: '9px' }}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-emerald-400 font-semibold">Advantage: No need to wait for DTIM beacon. Client controls exactly when to retrieve frames.</div>
            </motion.div>
          )}
          {psMode === 'twt' && (
            <motion.div key="twt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <p className="text-xs text-slate-400">TWT (Target Wake Time, 802.11ax): Client and AP negotiate exact wake times. Client sleeps until its scheduled TWT session.</p>
              <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-xs text-slate-500 w-16">Client:</span>
                    {[
                      { label: 'DEEP SLEEP', color: '#0f172a', border: '#1e293b', textColor: '#334155', w: 100 },
                      { label: 'TWT Wake Window', color: '#10b98120', border: '#10b98150', textColor: '#10b981', w: 80 },
                      { label: 'DEEP SLEEP', color: '#0f172a', border: '#1e293b', textColor: '#334155', w: 100 },
                      { label: 'TWT Wake Window', color: '#10b98120', border: '#10b98150', textColor: '#10b981', w: 80 },
                      { label: 'DEEP SLEEP', color: '#0f172a', border: '#1e293b', textColor: '#334155', w: 80 },
                    ].map((s, i) => (
                      <div key={i} className="h-8 rounded flex items-center justify-center text-xs font-semibold border flex-shrink-0"
                        style={{ width: s.w, background: s.color, borderColor: s.border, color: s.textColor, fontSize: '9px' }}>
                        {s.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1 ml-16 items-center">
                    <div className="h-0.5 w-24 bg-slate-700" />
                    <span className="text-xs text-slate-500">TWT Interval</span>
                    <div className="h-0.5 w-24 bg-slate-700" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Individual TWT', desc: 'One-to-one agreement between AP and STA', color: '#10b981' },
                  { label: 'Broadcast TWT', desc: 'AP assigns same TWT schedule to a group of STAs', color: '#06b6d4' },
                  { label: 'Battery savings', desc: 'IoT devices can sleep for hours between TWT windows', color: '#a855f7' },
                ].map(item => (
                  <div key={item.label} className="rounded-lg p-3 border" style={{ borderColor: item.color + '40', background: item.color + '08' }}>
                    <p className="font-semibold mb-1" style={{ color: item.color }}>{item.label}</p>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ModeContent content={{
          kid: { legacy: 'Your phone sleeps and wakes up to check for messages only when the AP rings a "DTIM bell". Legacy PS-Poll is like checking your mailbox once per hour.', uapsd: 'U-APSD is smarter — your phone wakes up and says "Give me all my messages NOW!" and the AP delivers them all at once, then your phone sleeps again.', twt: 'TWT is like scheduling a meeting — your phone and the router agree "I will wake up at exactly 3pm every minute to check for messages." The phone sleeps deeply in between — huge battery savings!' }[psMode],
          enthusiast: { legacy: 'Legacy PS-Poll: Client sets PS=1 in frame, AP buffers frames. DTIM beacon (every 1-10 beacons) carries DTIM IE. Client wakes at DTIM, sends PS-Poll frame to retrieve one buffered frame at a time.', uapsd: 'U-APSD (Unscheduled Automatic Power Save Delivery): Client sends trigger frame (any uplink frame), AP delivers all buffered frames in burst ending with EOSP=1. More efficient than PS-Poll for bursty traffic.', twt: 'TWT (Target Wake Time, 802.11ax): Client and AP negotiate TWT parameters (wake time, interval, duration). Client can sleep between TWT sessions. Enables 10x battery improvement for IoT devices.' }[psMode],
          pro: { legacy: 'PS-Poll: Legacy 802.11 power management. STA sets AID bit in Beacon TIM IE triggers PS-Poll (FC.PwrMgmt=1). Each PS-Poll retrieves exactly one buffered MSDU. AP sends More Data=1 if queue non-empty. Inherently inefficient: 1 PS-Poll per frame, each requiring contention.', uapsd: 'U-APSD (802.11e): Service periods initiated by trigger frame. Delivery-enabled ACs defined in QoS Info field. AP delivers SP frames at SIFS intervals until EOSP=1 or Max SP Len reached. SP can span multiple frames per contention. Used by 802.11 phones (AC_VO + AC_VI delivery-enabled).', twt: 'TWT (802.11ax): TWT Element negotiated via Action frames. Individual TWT: unicast STA-AP; Broadcast TWT: group schedule in Beacon. TWT parameters: Target Wake Time (TSF), Nominal Min Wake Duration, TWT Wake Interval Mantissa/Exponent. HE STA can have up to 8 concurrent TWT agreements.' }[psMode],
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Aggregation (A-MSDU & A-MPDU) ───────────────────────────────────────────
function AggregationTab() {
  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">Frame Aggregation — A-MSDU vs A-MPDU</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* A-MSDU */}
          <div className="bg-surface-900/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="chip text-xs font-bold" style={{ background: '#06b6d420', color: '#06b6d4', borderColor: '#06b6d440' }}>A-MSDU</span>
              <span className="text-xs text-slate-400">Aggregate MAC SDU</span>
            </div>
            <div className="space-y-1.5">
              {/* Single MAC header */}
              <div className="h-8 rounded flex items-center justify-center text-xs font-bold border"
                style={{ background: '#06b6d420', borderColor: '#06b6d460', color: '#06b6d4' }}>
                Single MAC Header + QoS
              </div>
              {/* Subframes */}
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-1">
                  <div className="h-6 rounded flex items-center justify-center text-xs border px-1 flex-shrink-0"
                    style={{ background: '#1e3a5f', borderColor: '#2563eb50', color: '#93c5fd', fontSize: '9px', minWidth: '60px' }}>
                    DA/SA/Len
                  </div>
                  <div className="h-6 flex-1 rounded flex items-center justify-center text-xs border"
                    style={{ background: '#0c4a6e', borderColor: '#0369a150', color: '#7dd3fc', fontSize: '9px' }}>
                    MSDU {i} payload
                  </div>
                </div>
              ))}
              {/* Single FCS */}
              <div className="h-6 rounded flex items-center justify-center text-xs font-bold border"
                style={{ background: '#10b98120', borderColor: '#10b98140', color: '#10b981', fontSize: '9px' }}>
                Single FCS (covers all)
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex gap-2"><span className="text-slate-500 w-20">Max size:</span><span className="text-slate-300">7,935 bytes</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">Destination:</span><span className="text-slate-300">All same DA</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">FCS:</span><span className="text-slate-300">One for entire A-MSDU</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">Retry:</span><span className="text-slate-300 text-amber-400">All-or-nothing</span></div>
            </div>
          </div>

          {/* A-MPDU */}
          <div className="bg-surface-900/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="chip text-xs font-bold" style={{ background: '#a855f720', color: '#a855f7', borderColor: '#a855f740' }}>A-MPDU</span>
              <span className="text-xs text-slate-400">Aggregate MAC PDU</span>
            </div>
            <div className="space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-0.5">
                  <div className="flex gap-1">
                    <div className="h-6 rounded flex items-center justify-center text-xs border px-1 flex-shrink-0"
                      style={{ background: '#2d1b69', borderColor: '#7c3aed50', color: '#c4b5fd', fontSize: '9px', minWidth: '50px' }}>
                      Delimiter
                    </div>
                    <div className="h-6 flex-1 rounded flex items-center justify-center text-xs border"
                      style={{ background: '#1e1b4b', borderColor: '#4338ca50', color: '#a5b4fc', fontSize: '9px' }}>
                      MPDU {i} (own MAC hdr)
                    </div>
                    <div className="h-6 rounded flex items-center justify-center text-xs border px-1 flex-shrink-0"
                      style={{ background: '#10b98115', borderColor: '#10b98140', color: '#10b981', fontSize: '9px', minWidth: '36px' }}>
                      FCS
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex gap-2"><span className="text-slate-500 w-20">Max size:</span><span className="text-slate-300">65,535 bytes (HT), larger in VHT+</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">Destination:</span><span className="text-slate-300">Can vary per MPDU</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">FCS:</span><span className="text-slate-300">Each MPDU has own FCS</span></div>
              <div className="flex gap-2"><span className="text-slate-500 w-20">Retry:</span><span className="text-emerald-400">Selective (Block ACK bitmap)</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="rounded-lg p-3 border border-cyan-500/30 bg-cyan-500/05">
            <p className="font-semibold text-cyan-400 mb-1">A-MSDU Use Case</p>
            <p>Best for many small frames to the same destination (e.g. VoIP packets, DNS queries). Low overhead per subframe but entire aggregate must be retransmitted if FCS fails.</p>
          </div>
          <div className="rounded-lg p-3 border border-purple-500/30 bg-purple-500/05">
            <p className="font-semibold text-purple-400 mb-1">A-MPDU Use Case</p>
            <p>Best for large data transfers. Requires Block ACK session. Each MPDU can be individually retransmitted using the Block ACK bitmap. Dominant mode in 802.11n/ac/ax.</p>
          </div>
        </div>

        <ModeContent content={{
          kid: 'Aggregation is like packing your lunchbox — instead of making 8 trips to get 8 snacks one by one, you pack them all in one box and make ONE trip. A-MSDU: one big box. A-MPDU: a box with individually-wrapped snacks (so if one goes bad, others are still fine).',
          enthusiast: 'A-MSDU aggregates at the MAC SDU level (single header, all same DA) — efficient but fragile. A-MPDU aggregates at the MPDU level (each has its own header and FCS) — slightly more overhead but far more robust. A-MPDU + Block ACK is the dominant mode in 802.11n/ac/ax.',
          pro: 'A-MSDU: aggregate multiple MSDUs under one MAC header. Padding to 4-byte boundary between subframes. Max A-MSDU size: 3839B (basic), 7935B (extended). All subframes same RA/TA and TID. Single FCS — if error, entire A-MSDU discarded. A-MPDU: each subframe is a complete MPDU with MPDU delimiter (4B: reserved, MPDU length 14b, CRC 8b, EOD 8b). Selective retransmission via Block ACK scoreboard. Max A-MPDU length exponent (802.11ax): 2^(13+x) bytes where x is exponent (0-7).',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Block ACK (all 4 variants) ───────────────────────────────────────────────
function BlockACKTab() {
  const [variant, setVariant] = useState<'basic' | 'compressed' | 'multitid' | 'multista'>('basic');
  const [legacyMode, setLegacyMode] = useState<'legacy' | 'block'>('legacy');
  const frameCount = 8;

  const variants = [
    { id: 'basic',      label: 'Basic (Normal)', color: '#06b6d4' },
    { id: 'compressed', label: 'Compressed',     color: '#a855f7' },
    { id: 'multitid',   label: 'Multi-TID',      color: '#f59e0b' },
    { id: 'multista',   label: 'Multi-STA (GCR)', color: '#10b981' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Legacy vs Block ACK demo */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">Frame Aggregation & Block ACK Overview</h3>
          <div className="flex gap-1.5">
            {(['legacy', 'block'] as const).map(m => (
              <button key={m} onClick={() => setLegacyMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  legacyMode === m ? 'bg-band5/20 border-band5/40 text-band5' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                {m === 'legacy' ? 'Legacy ACK' : 'A-MPDU + Block ACK'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {legacyMode === 'legacy' ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Each frame requires its own SIFS + ACK round trip:</p>
              {Array.from({ length: frameCount }, (_, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-1">
                  <div className="h-7 rounded flex items-center justify-center text-xs font-bold bg-band5/20 border border-band5/40 text-band5" style={{ width: '10%' }}>
                    F{i+1}
                  </div>
                  <div className="h-7 rounded flex items-center justify-center" style={{ width: '3%', background: '#f59e0b20', border: '1px solid #f59e0b40', fontSize: '9px', color: '#f59e0b' }}>
                    S
                  </div>
                  <div className="h-7 rounded flex items-center justify-center text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" style={{ width: '5%' }}>
                    ACK
                  </div>
                  <div className="text-xs text-slate-600 ml-1">overhead per frame</div>
                </motion.div>
              ))}
              <div className="text-xs text-red-400 font-semibold">
                {frameCount} x (SIFS 16µs + ACK 28µs) = {frameCount * 44}µs wasted just on overhead!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">All frames packed into one A-MPDU, one Block ACK covers them all:</p>
              <div className="flex items-center gap-1 flex-wrap">
                <div className="flex gap-0.5">
                  {Array.from({ length: frameCount }, (_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: i * 0.04 }}
                      className="h-10 rounded flex items-center justify-center text-xs font-bold border"
                      style={{ width: 44, background: '#a855f720', borderColor: '#a855f750', color: '#a855f7' }}>
                      F{i+1}
                    </motion.div>
                  ))}
                </div>
                <span className="text-xs font-mono text-amber-400">SIFS</span>
                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                  className="h-10 px-3 rounded flex items-center text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                  Block ACK
                </motion.div>
              </div>
              <div className="text-xs text-emerald-400 font-semibold">
                Just 1 x (SIFS + Block ACK) = 44µs total — {frameCount}x efficiency improvement!
              </div>
              <div className="text-xs text-slate-400">
                Block ACK bitmap: <span className="font-mono text-cyan-400">11111111</span> — each bit = 1 frame received OK
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Block ACK Variants */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">Block ACK — 4 Variants</h3>
        <div className="flex gap-1.5 flex-wrap">
          {variants.map(v => (
            <button key={v.id} onClick={() => setVariant(v.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={variant === v.id ? { borderColor: v.color + '60', background: v.color + '15', color: v.color } : { borderColor: '#334155', color: '#64748b' }}>
              {v.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {variant === 'basic' && (
            <motion.div key="basic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-xs text-slate-400">Introduced in 802.11e. Requires explicit setup via ADDBA Request/Response. 64-frame window. Separate BAR + BA frames.</div>
              <div className="bg-surface-900/70 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <div className="h-7 px-2 rounded text-xs border flex items-center" style={{ background: '#06b6d420', borderColor: '#06b6d450', color: '#06b6d4', fontSize: '9px' }}>ADDBA Req</div>
                  <span className="text-slate-600 text-xs">{'→'}</span>
                  <div className="h-7 px-2 rounded text-xs border flex items-center" style={{ background: '#22c55e20', borderColor: '#22c55e50', color: '#22c55e', fontSize: '9px' }}>ADDBA Resp</div>
                  <span className="text-slate-500 text-xs ml-2">Session setup</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[1,2,3,4].map(i => <div key={i} className="h-7 px-3 rounded text-xs border flex items-center font-bold" style={{ background: '#06b6d420', borderColor: '#06b6d450', color: '#06b6d4' }}>MPDU{i}</div>)}
                  <span className="text-slate-600 text-xs">A-MPDU burst</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-7 px-2 rounded text-xs border flex items-center" style={{ background: '#a855f720', borderColor: '#a855f750', color: '#a855f7', fontSize: '9px' }}>BAR (Block ACK Request)</div>
                  <span className="text-slate-600 text-xs">{'→'}</span>
                  <div className="h-7 px-2 rounded text-xs border flex items-center" style={{ background: '#10b98120', borderColor: '#10b98150', color: '#10b981', fontSize: '9px' }}>BA (64-bit bitmap)</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">Bitmap: <span className="font-mono text-cyan-400">{'1111000011110000...'}</span> — 64 bits covering 64 MPDUs. Missing = request retransmit.</div>
            </motion.div>
          )}
          {variant === 'compressed' && (
            <motion.div key="compressed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-xs text-slate-400">Introduced in 802.11n. Same as Basic BA but the BAR/BA frames are shorter. BA bitmap is 8 bytes (64 bits) vs Basic's 128 bytes. More efficient frame overhead.</div>
              <div className="bg-surface-900/70 rounded-xl p-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg p-3 border border-slate-700 bg-slate-800/50">
                    <p className="font-semibold text-slate-300 mb-2">Basic BAR Frame</p>
                    {['FC (2B)', 'Duration (2B)', 'RA (6B)', 'TA (6B)', 'BAR Control (2B)', 'BAR Info (128B bitmap)', 'FCS (4B)'].map(f => (
                      <div key={f} className="text-xs text-slate-500 border-b border-slate-700/50 py-0.5">{f}</div>
                    ))}
                    <p className="text-red-400 font-semibold mt-2">Total: ~150B</p>
                  </div>
                  <div className="rounded-lg p-3 border border-purple-500/40 bg-purple-500/08">
                    <p className="font-semibold text-purple-400 mb-2">Compressed BAR Frame</p>
                    {['FC (2B)', 'Duration (2B)', 'RA (6B)', 'TA (6B)', 'BAR Control (2B)', 'BAR Info (8B bitmap)', 'FCS (4B)'].map(f => (
                      <div key={f} className="text-xs border-b border-slate-700/50 py-0.5" style={{ color: f.includes('8B') ? '#a855f7' : '#94a3b8' }}>{f}</div>
                    ))}
                    <p className="text-emerald-400 font-semibold mt-2">Total: ~30B (5x smaller!)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {variant === 'multitid' && (
            <motion.div key="multitid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-xs text-slate-400">Multi-TID Block ACK: One BA Request/Response covers multiple Traffic IDs (TIDs) simultaneously. Reduces management frame overhead when multiple QoS streams are active.</div>
              <div className="bg-surface-900/70 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-400 mb-2">Single Multi-TID BAR covers all active TIDs:</div>
                <div className="space-y-1.5">
                  {[
                    { tid: 'TID 0 (BE)', bitmap: '11111111', color: '#06b6d4' },
                    { tid: 'TID 4 (VI)', bitmap: '11101111', color: '#f59e0b' },
                    { tid: 'TID 6 (VO)', bitmap: '11111110', color: '#ef4444' },
                  ].map(t => (
                    <div key={t.tid} className="flex items-center gap-3">
                      <div className="rounded px-2 py-1 text-xs font-mono flex-shrink-0" style={{ background: t.color + '20', color: t.color, border: `1px solid ${t.color}40`, minWidth: '80px' }}>
                        {t.tid}
                      </div>
                      <div className="flex gap-0.5">
                        {t.bitmap.split('').map((bit, i) => (
                          <div key={i} className="w-6 h-6 rounded text-xs flex items-center justify-center font-mono font-bold border"
                            style={bit === '1' ? { background: t.color + '25', borderColor: t.color + '60', color: t.color } : { background: '#1e293b', borderColor: '#334155', color: '#475569' }}>
                            {bit}
                          </div>
                        ))}
                      </div>
                      {t.bitmap.includes('0') && <span className="text-xs text-amber-400">retry needed</span>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {variant === 'multista' && (
            <motion.div key="multista" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="text-xs text-slate-400">Multi-STA Block ACK (GCR — Group Cast with Retries): Introduced in 802.11aa. One BA frame acknowledges frames from multiple stations in a group. Used for multicast reliability.</div>
              <div className="bg-surface-900/70 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-400 mb-2">AP sends one Multi-STA BA covering multiple STAs:</div>
                <div className="flex items-start gap-4">
                  <div className="space-y-2 flex-1">
                    {['STA-1 (MAC: AA:..)', 'STA-2 (MAC: BB:..)', 'STA-3 (MAC: CC:..)'].map((sta, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="rounded px-2 py-1 text-xs font-mono flex-shrink-0" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140', minWidth: '110px', fontSize: '9px' }}>
                          {sta}
                        </div>
                        <div className="flex gap-0.5">
                          {[1,1,0,1,1,1,0,1].slice(0, 8 - i).map((bit, j) => (
                            <div key={j} className="w-5 h-5 rounded text-xs flex items-center justify-center font-mono font-bold border"
                              style={bit === 1 ? { background: '#10b98125', borderColor: '#10b98160', color: '#10b981' } : { background: '#1e293b', borderColor: '#334155', color: '#475569' }}>
                              {bit}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg p-3 border border-emerald-500/40 bg-emerald-500/08 text-xs text-slate-400 flex-shrink-0">
                    <p className="font-semibold text-emerald-400 mb-1">One BA frame</p>
                    <p>covers all 3 STAs</p>
                    <p className="text-emerald-400 mt-1">GCR multicast</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400">Variant</th>
                <th className="text-left py-2 px-3 text-slate-400">Standard</th>
                <th className="text-left py-2 px-3 text-slate-400">Bitmap Size</th>
                <th className="text-left py-2 px-3 text-slate-400">TIDs Covered</th>
                <th className="text-left py-2 px-3 text-slate-400">Use Case</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Basic', std: '802.11e', bitmap: '128 bytes', tids: '1', use: 'Legacy QoS devices', color: '#06b6d4' },
                { name: 'Compressed', std: '802.11n', bitmap: '8 bytes', tids: '1', use: 'Standard modern WiFi', color: '#a855f7' },
                { name: 'Multi-TID', std: '802.11n', bitmap: '8B x N TIDs', tids: 'Multiple', use: 'Multi-stream QoS', color: '#f59e0b' },
                { name: 'Multi-STA (GCR)', std: '802.11aa', bitmap: 'Per STA', tids: '1 per STA', use: 'Reliable multicast', color: '#10b981' },
              ].map(row => (
                <tr key={row.name} className="border-b border-slate-800">
                  <td className="py-2 px-3 font-semibold" style={{ color: row.color }}>{row.name}</td>
                  <td className="py-2 px-3 text-slate-400 font-mono">{row.std}</td>
                  <td className="py-2 px-3 text-slate-300">{row.bitmap}</td>
                  <td className="py-2 px-3 text-slate-300">{row.tids}</td>
                  <td className="py-2 px-3 text-slate-400">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ModeContent content={{
          kid: 'Block ACK is like a teacher checking homework — instead of checking each student one by one (slow!), she checks the whole class at once and says "Students 1, 2, 4, 5 are done. Student 3 needs to redo theirs!"',
          enthusiast: 'Block ACK allows a receiver to acknowledge a burst of frames with a single bitmap response. Each bit represents one MPDU — 1 = received, 0 = missing (retransmit). The 4 variants differ in bitmap size, how many TIDs they cover, and how many stations they address.',
          pro: 'Block ACK policy: Immediate (SIFS delay), Delayed (contention), No-ACK. BAR frame type bits: Multi-TID=1 sets BA-TID-Info to a list of TID+Bitmap pairs. GCR (Group Cast with Retries): 802.11aa Multi-STA BA contains STA Info fields (AID12 + BAInfo per STA) allowing AP to coordinate group retransmissions. Scoreboard cache maintained per TID per STA — selective retransmission only for missing MPDUs.',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Chapter 3 Main ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'contention',  label: 'Contention' },
  { id: 'nav',         label: 'NAV & Virtual CS' },
  { id: 'qos',         label: 'QoS & WMM' },
  { id: 'powersave',   label: 'Power Save' },
  { id: 'aggregation', label: 'Aggregation' },
  { id: 'blockack',    label: 'Block ACK' },
] as const;

type TabId = typeof TABS[number]['id'];

export function Chapter3() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('contention');

  useEffect(() => {
    ['csmaca', 'ifs', 'nav', 'hidden', 'qos', 'powersave', 'aggregation', 'ack']
      .forEach(id => markComplete('ch3', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="How multiple devices share the wireless medium without chaos — CSMA/CA, IFS timing, the hidden node problem, RTS/CTS, NAV, QoS/WMM, Power Save, Aggregation, and Block ACK." />
        <ModeBadge />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap border-b border-slate-800 pb-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-band5 text-band5 bg-band5/10'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'contention' && (
            <div className="space-y-5">
              <CSMACATimeline />
              <IFSTimingDiagram />
              <HiddenNodeDemo />
            </div>
          )}
          {activeTab === 'nav'         && <NAVDemo />}
          {activeTab === 'qos'         && <QoSWMMTab />}
          {activeTab === 'powersave'   && <PowerSaveTab />}
          {activeTab === 'aggregation' && <AggregationTab />}
          {activeTab === 'blockack'    && <BlockACKTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
