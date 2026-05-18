import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      { device: 'A', phase: 'ack',     duration: 40,  label: 'ACK Received ✓',        color: PHASE_COLORS.ack     },
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
      { device: 'A', phase: 'collision',duration: 60,  label: '💥 COLLISION!', color: PHASE_COLORS.collision },
      { device: 'A', phase: 'backoff',  duration: 100, label: 'Backoff ×2',    color: PHASE_COLORS.backoff   },
      { device: 'A', phase: 'tx',       duration: 110, label: 'DATA TX (retry)', color: PHASE_COLORS.tx      },
      { device: 'B', phase: 'difs',     duration: 50,  label: 'DIFS',         color: PHASE_COLORS.difs      },
      { device: 'B', phase: 'backoff',  duration: 40,  label: 'Backoff (2)',   color: PHASE_COLORS.backoff   },
      { device: 'B', phase: 'collision',duration: 60,  label: '💥 COLLISION!', color: PHASE_COLORS.collision },
      { device: 'B', phase: 'backoff',  duration: 140, label: 'Backoff ×2',    color: PHASE_COLORS.backoff   },
      { device: 'B', phase: 'tx',       duration: 100, label: 'DATA TX (retry)', color: PHASE_COLORS.tx      },
    ];
  }
  return [
    { device: 'A', phase: 'difs',    duration: 50,  label: 'DIFS',          color: PHASE_COLORS.difs    },
    { device: 'A', phase: 'tx',      duration: 40,  label: 'RTS →',         color: '#0ea5e9'             },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'ack',     duration: 40,  label: '← CTS',         color: '#a855f7'             },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'tx',      duration: 120, label: 'DATA TX',       color: PHASE_COLORS.tx      },
    { device: 'A', phase: 'sifs',    duration: 25,  label: 'SIFS',          color: PHASE_COLORS.sifs    },
    { device: 'A', phase: 'ack',     duration: 40,  label: 'ACK ✓',         color: PHASE_COLORS.ack     },
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
    const allEvents = events;
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-slate-400 w-16 flex-shrink-0">{label}</span>
        <div className="flex-1 h-10 bg-surface-900/70 rounded-lg overflow-hidden relative flex">
          {devEvents.map((ev, i) => {
            // find global event index
            const globalIdx = allEvents.indexOf(ev);
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
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">CSMA/CA Medium Access Timeline</h3>
        <div className="flex gap-1.5">
          <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={play} disabled={isPlaying} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {isPlaying ? 'Playing…' : 'Animate'}
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['normal', 'collision', 'rtscts'] as const).map(s => (
          <button key={s} onClick={() => { setScenario(s); reset(); }}
            className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
              scenario === s ? 'bg-band5/20 border-band5/50 text-band5' : 'border-slate-700 text-slate-500'}`}>
            {s === 'normal' ? '✅ Normal' : s === 'collision' ? '💥 Collision' : '🛡️ RTS/CTS'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {renderRow(deviceA, '📱 Device A', 'A')}
        {renderRow(deviceB, '💻 Device B', 'B')}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PHASE_COLORS).filter(([k]) => k !== 'idle').map(([phase, color]) => (
          <div key={phase} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-slate-500 capitalize">{phase}</span>
          </div>
        ))}
      </div>

      <ModeContent
        content={{
          kid: '🚦 Wi-Fi works like a polite conversation — you LISTEN before you talk, wait a bit (DIFS), then count down a random number before sending. This way, devices don\'t all shout at the same time!',
          enthusiast: 'CSMA/CA means "Listen first, then wait, then transmit." Each device picks a random backoff slot, decrementing only when the channel is free. First to reach zero wins the channel. Collisions are avoided (not detected) unlike Ethernet\'s CSMA/CD.',
          pro: 'DCF mechanism: Clear Channel Assessment (CCA) → DIFS (802.11ax AIFS) → random backoff [0, CW] → countdown while medium idle → transmit. CW doubles on retry (BEB: Binary Exponential Backoff). SIFS (16µs) precedes ACK. No ACK after DIFS+backoff → assume collision → retry up to retry limit (dot11ShortRetryLimit=7).',
        }}
        className="text-sm text-slate-400 leading-relaxed"
      />
    </div>
  );
}

// ─── IFS Timing Windows ───────────────────────────────────────────────────────
const IFS_DATA = [
  { name: 'SIFS',  us: 16,  color: '#f59e0b', icon: '⚡',
    kid: 'The SHORTEST wait — used only for the quick "Got it!" reply (ACK) right after receiving a frame.',
    enthusiast: 'Shortest IFS (16µs) — used for ACK, Block ACK, CTS responses. Highest priority access.',
    pro: 'SIFS = 16µs (802.11a/n/ac/ax @ 5GHz). Slot time = 9µs. CCA + PHY preamble detection must complete within SIFS. Used for: ACK, BA, CTS, CF-End, 2nd frame in burst.' },
  { name: 'PIFS',  us: 25,  color: '#a855f7', icon: '🔒',
    kid: 'A medium-short wait used by the access point to grab the channel for special timed (PCF) transmissions.',
    enthusiast: 'PCF IFS (25µs) — used by the AP in Point Coordination Function mode to reserve channel access.',
    pro: 'PIFS = SIFS + 1 slot (25µs). Used by CF-Pollable STAs under PCF / HCCA (HCF Controlled Channel Access) for scheduled TXOP delivery in QoS traffic.' },
  { name: 'DIFS',  us: 34,  color: '#06b6d4', icon: '🚦',
    kid: 'The standard wait time before any device tries to send data — like counting to 3 before speaking in class.',
    enthusiast: 'DCF IFS (34µs) — the normal wait before transmitting data. Most traffic uses this + random backoff.',
    pro: 'DIFS = SIFS + 2×slot (34µs). Used for all DCF data frames. After DIFS, device enters random backoff [0, CW-1] slots. CWmin=15 (802.11ax), CWmax=1023.' },
  { name: 'AIFS',  us: 43,  color: '#10b981', icon: '📊',
    kid: 'A customizable wait time used for QoS — voice packets get a short AIFS, background downloads get a longer one.',
    enthusiast: 'Arbitration IFS — Wi-Fi 6 QoS priority. Voice/Video get shorter AIFS than Best-Effort or Background.',
    pro: 'AIFS[AC] = SIFS + AIFSN[AC]×slot. AIFSN: Voice=2, Video=2, BE=3, BK=7. EDCA replaces DCF, enabling 4-class QoS (WMM: AC_VO, AC_VI, AC_BE, AC_BK). Lower AIFSN + smaller CW = statistical priority.' },
  { name: 'EIFS',  us: 360, color: '#ef4444', icon: '⚠️',
    kid: 'The LONGEST wait — used after detecting a corrupted/garbled frame, giving time for the sender to clean up.',
    enthusiast: 'Extended IFS (360µs) — triggered when a device hears a bad frame it cannot decode, to avoid interfering with an ongoing transmission.',
    pro: 'EIFS = SIFS + ACK transmission time + DIFS. Used when CCA detects a frame but FCS fails — prevents STA from transmitting during what may be an ongoing exchange. Duration ≈ 360µs (802.11a).' },
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
            {ifs.icon} {ifs.name} = {ifs.us}µs
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
    { label: 'A & C both idle', desc: { kid: 'Device A and Device C are both waiting to talk to the AP. They cannot hear each other — there\'s a wall between them!', enthusiast: 'Device A and C are out of each other\'s radio range but both in AP range — the classic hidden node scenario.', pro: 'STAs A and C are within AP range but outside each other\'s CCA range (>~150m apart or obstructed). Neither can detect the other\'s carrier.' } },
    { label: 'A & C transmit simultaneously', desc: { kid: 'Both A and C shout at the AP at the same time — because they couldn\'t hear each other to know the channel was busy!', enthusiast: 'Both devices pass CCA (channel appears idle) and transmit simultaneously, causing a collision at the AP.', pro: 'Both STAs perform CCA → DIFS → backoff. Since neither can hear the other, both backoff timers expire simultaneously. Frames collide at AP. FCS fails. No ACK sent.' } },
    { label: '💥 Collision at AP!', desc: { kid: 'The AP hears a garbled mess. Nobody gets their message through — wasted airtime!', enthusiast: 'AP receives two overlapping signals = undecodable collision. No ACK is sent. Both A and C wait, then retry with doubled backoff.', pro: 'AP detects energy but FCS fails (corrupted). EIFS triggered on AP. Both STAs timeout waiting for ACK → retry limit exhausted → exponential CW growth reduces throughput dramatically.' } },
  ];

  const SOLUTION_STEPS = [
    { label: 'A sends RTS → AP', desc: { kid: 'Before sending data, Device A politely raises its hand: "Hey AP, can I talk? I need 50ms!" The AP hears this announcement.', enthusiast: 'A sends a small RTS (Request to Send) frame to the AP, reserving airtime. C cannot hear A, but will hear the AP\'s reply.', pro: 'STA A sends DIFS + backoff → RTS (20B: FC, Duration, RA=AP, TA=A, FCS). Duration field = time needed for DATA+SIFS+ACK.' } },
    { label: 'AP broadcasts CTS → ALL', desc: { kid: 'The AP shouts "QUIET everyone! I\'m talking to Device A for 50ms!" NOW Device C can hear this and stays quiet.', enthusiast: 'AP replies with CTS. C hears it, sets its NAV (virtual carrier sense) timer, and stays quiet for the reserved duration.', pro: 'AP → CTS (14B, RA=A, Duration=DATA+SIFS+ACK). All STAs hearing CTS (including C) update NAV timer. Virtual carrier sense prevents C from transmitting.' } },
    { label: '✅ A transmits safely', desc: { kid: 'Now A can send its full message without anyone interrupting — the AP replies with ACK and everyone\'s happy!', enthusiast: 'A transmits data, AP sends ACK. C waits silently with NAV active. No collision!', pro: 'Protected exchange: RTS→CTS→DATA→ACK. Overhead: ~110µs extra. Tradeoff: RTS/CTS only beneficial for large frames (MPDU > dot11RTSThreshold, typically ≥ 500B for crowded networks).' } },
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
            {s === 'problem' ? '💥 The Problem' : '🛡️ RTS/CTS Fix'}
          </button>
        ))}
      </div>

      {/* Topology diagram */}
      <div className="bg-surface-900/70 rounded-xl p-4">
        <svg viewBox="0 0 500 160" className="w-full" style={{ maxHeight: 160 }}>
          {/* Range circles */}
          <circle cx="110" cy="80" r="90" fill="rgba(6,182,212,0.06)" stroke="rgba(6,182,212,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          <circle cx="390" cy="80" r="90" fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          <circle cx="250" cy="80" r="95" fill="rgba(168,85,247,0.06)" stroke="rgba(168,85,247,0.2)" strokeDasharray="6 3" strokeWidth="1" />
          {/* Blocked signal A→C */}
          <line x1="130" y1="80" x2="370" y2="80" stroke="#ef444440" strokeDasharray="4 3" strokeWidth="1.5" />
          <text x="250" y="68" textAnchor="middle" fill="#ef4444" fontSize="9" fontFamily="Inter">🚫 Cannot hear each other</text>
          {/* Nodes */}
          {[{ x: 110, y: 80, icon: '💻', label: 'Device A', color: '#06b6d4' },
            { x: 250, y: 80, icon: '📡', label: 'AP', color: '#a855f7' },
            { x: 390, y: 80, icon: '📱', label: 'Device C', color: '#10b981' }].map(n => (
            <g key={n.label} transform={`translate(${n.x},${n.y})`}>
              <circle r="22" fill={n.color + '15'} stroke={n.color + '60'} strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="13">{n.icon}</text>
              <text textAnchor="middle" y="33" fill="#94a3b8" fontSize="9" fontFamily="Inter">{n.label}</text>
            </g>
          ))}
          {/* Active frame indicator */}
          {scenario === 'problem' && step === 1 && (
            <>
              <motion.rect x="115" y="72" width="48" height="16" rx="4" fill="#ef444430" stroke="#ef4444" strokeWidth="1"
                animate={{ x: [115, 225] }} transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }} />
              <motion.rect x="385" y="72" width="48" height="16" rx="4" fill="#10b98130" stroke="#10b981" strokeWidth="1"
                animate={{ x: [385, 275] }} transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }} />
            </>
          )}
          {scenario === 'solution' && step >= 1 && (
            <motion.g>
              <text x="250" y="105" textAnchor="middle" fill="#a855f7" fontSize="8" fontFamily="JetBrains Mono">
                {step === 1 ? 'NAV = 0' : 'NAV Active (C silent)'}
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      {/* Steps */}
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

      {/* Detail panel */}
      <motion.div key={`${scenario}-${step}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`rounded-xl p-4 border text-sm text-slate-400 leading-relaxed ${
          scenario === 'problem' ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        {cur.desc[mode]}
      </motion.div>
    </div>
  );
}

// ─── Block ACK ────────────────────────────────────────────────────────────────
function BlockACKDemo() {
  const [mode3, setMode3] = useState<'legacy' | 'block'>('legacy');
  const frameCount = 8;

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">Frame Aggregation & Block ACK</h3>
        <div className="flex gap-1.5">
          {(['legacy', 'block'] as const).map(m => (
            <button key={m} onClick={() => setMode3(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                mode3 === m ? 'bg-band5/20 border-band5/40 text-band5' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {m === 'legacy' ? '📜 Legacy ACK' : '⚡ A-MPDU + Block ACK'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {mode3 === 'legacy' ? (
          // Legacy: individual frame + ACK per frame
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
                <div className="text-xs text-slate-600 ml-1">← overhead per frame</div>
              </motion.div>
            ))}
            <div className="text-xs text-red-400 font-semibold">
              ⚠️ {frameCount} × (SIFS 16µs + ACK 28µs) = {frameCount * 44}µs wasted just on overhead!
            </div>
          </div>
        ) : (
          // Block ACK: all frames in one A-MPDU, single Block ACK
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
              <span className="text-wired text-xs font-mono">SIFS</span>
              <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="h-10 px-3 rounded flex items-center text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                Block ACK
              </motion.div>
            </div>
            <div className="text-xs text-emerald-400 font-semibold">
              ✅ Just 1 × (SIFS + Block ACK) = 44µs total — {frameCount}× efficiency improvement!
            </div>
            <div className="text-xs text-slate-400">
              Block ACK bitmap: <span className="font-mono text-band24">11111111</span> — each bit = 1 frame received OK
            </div>
          </div>
        )}
      </div>

      <ModeContent content={{
        kid: mode3 === 'legacy' ? '📬 Old way: Send one letter, wait for "Got it!", send another letter, wait... VERY SLOW!'
          : '📦 New way: Pack 8 letters in one box, ship it all at once, one "Got it!" covers everything! SUPER FAST!',
        enthusiast: mode3 === 'legacy' ? 'Legacy ACK requires a full round-trip per frame — at high data rates, the ACK overhead consumes more airtime than the actual data!'
          : 'A-MPDU bundles up to 256 frames into one transmission. Block ACK uses a 256-bit bitmap to confirm which frames arrived — massive efficiency gain in Wi-Fi 5/6/7.',
        pro: mode3 === 'legacy' ? 'Immediate ACK policy: ACK sent after SIFS (16µs). At MCS11 (600 Mbps), a 1500B frame takes ~20µs to TX but ACK overhead = 44µs — 2× overhead!'
          : 'A-MPDU (Aggregated MPDU): max 64 sub-frames in 802.11n, up to 256 in 802.11ax. Block ACK (BA) uses 256-bit scoreboard bitmap for selective retransmission. Compressed Block ACK = 8B bitmap. Dramatically improves throughput at high MCS.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

export function Chapter3() {
  const { markComplete } = useApp();

  useEffect(() => {
    ['csmaca', 'ifs', 'nav', 'hidden', 'qos', 'powersave', 'aggregation', 'ack']
      .forEach(id => markComplete('ch3', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="How multiple devices share the wireless medium without chaos — CSMA/CA, IFS timing, the hidden node problem, RTS/CTS, and Block ACK aggregation." />
        <ModeBadge />
      </div>
      <CSMACATimeline />
      <IFSTimingDiagram />
      <HiddenNodeDemo />
      <BlockACKDemo />
    </div>
  );
}
