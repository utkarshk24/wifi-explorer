import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeContent, ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch15')!;
const TABS = ['CSMA/CD Mechanics', 'Full-Duplex', 'Flow Control'] as const;
type Tab = typeof TABS[number];

const CH15_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'CSMA/CD Mechanics': ['csmacd'],
  'Full-Duplex':       ['fullduplex'],
  'Flow Control':      ['flowcontrol'],
};

// ─── Tab 1: CSMA/CD Simulation ────────────────────────────────────────────────

interface Station {
  id: string;
  label: string;
  x: number;
  color: string;
  backoff: number;
  transmitting: boolean;
  waiting: boolean;
}

type BusEvent = 'idle' | 'transmitting' | 'collision' | 'backoff';

function CSMACDSim() {
  const [stations, setStations] = useState<Station[]>([
    { id: 'A', label: 'Station A', x: 60,  color: '#06b6d4', backoff: 0, transmitting: false, waiting: false },
    { id: 'B', label: 'Station B', x: 180, color: '#a855f7', backoff: 0, transmitting: false, waiting: false },
    { id: 'C', label: 'Station C', x: 300, color: '#10b981', backoff: 0, transmitting: false, waiting: false },
    { id: 'D', label: 'Station D', x: 420, color: '#f59e0b', backoff: 0, transmitting: false, waiting: false },
  ]);
  const [busState, setBusState] = useState<BusEvent>('idle');
  const [collisionCount, setCollisionCount] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const addLog = useCallback((msg: string) => setLog(p => [msg, ...p].slice(0, 10)), []);

  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  const simulateCollision = useCallback((ids: string[]) => {
    addLog(`▶ ${ids.join(' & ')} sense carrier idle → begin transmit`);
    setStations(prev => prev.map(s => ({ ...s, transmitting: ids.includes(s.id) })));
    setBusState('transmitting');

    schedule(() => {
      addLog('⚡ COLLISION detected! Jam signal broadcast (32 bits)');
      setBusState('collision');
      setCollisionCount(c => c + 1);
      setStations(prev => prev.map(s => ({ ...s, transmitting: false })));

      schedule(() => {
        const newAttempt = attempt + 1;
        setAttempt(newAttempt);
        const slots = Math.pow(2, Math.min(newAttempt, 10));
        const backoffs = ids.map(id => ({
          id,
          bo: Math.floor(Math.random() * slots),
        }));
        addLog(`⏳ Binary Exponential Backoff — round ${newAttempt}, CW=[0,${slots - 1}]`);
        backoffs.forEach(b => addLog(`   ${b.id}: random backoff = ${b.bo} slot${b.bo !== 1 ? 's' : ''} (${(b.bo * 51.2).toFixed(0)} μs)`));

        setStations(prev => prev.map(s => {
          const bo = backoffs.find(b => b.id === s.id);
          return bo ? { ...s, backoff: bo.bo, waiting: true } : s;
        }));
        setBusState('backoff');

        schedule(() => {
          addLog('✓ Backoff complete — stations retry transmission');
          setBusState('idle');
          setStations(prev => prev.map(s => ({ ...s, backoff: 0, waiting: false })));
        }, 2500);
      }, 800);
    }, 700);
  }, [attempt, addLog, schedule]);

  const transmitSingle = useCallback((id: string) => {
    const active = stations.filter(s => s.transmitting);
    if (active.length > 0) {
      addLog(`⚡ ${id} senses busy medium → collision mid-transmission`);
      simulateCollision([active[0].id, id]);
      return;
    }
    addLog(`▶ ${id} senses idle → transmitting frame`);
    setStations(prev => prev.map(s => s.id === id ? { ...s, transmitting: true } : s));
    setBusState('transmitting');
    schedule(() => {
      addLog(`✓ ${id} frame transmitted successfully`);
      setStations(prev => prev.map(s => s.id === id ? { ...s, transmitting: false } : s));
      setBusState('idle');
    }, 1200);
  }, [stations, addLog, simulateCollision, schedule]);

  const forceCollision = useCallback(() => {
    if (busState !== 'idle') return;
    simulateCollision(['A', 'C']);
  }, [busState, simulateCollision]);

  const reset = useCallback(() => {
    clearTimers();
    setStations(s => s.map(st => ({ ...st, transmitting: false, waiting: false, backoff: 0 })));
    setBusState('idle');
    setCollisionCount(0);
    setAttempt(0);
    setLog([]);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const busColor = { idle: '#1e293b', transmitting: '#06b6d4', collision: '#ef4444', backoff: '#f59e0b' }[busState];
  const busLabel = { idle: 'Bus: IDLE', transmitting: 'TRANSMITTING', collision: '⚡ COLLISION', backoff: '⏳ BACKOFF' }[busState];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <button onClick={forceCollision} disabled={busState !== 'idle'}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            busState === 'idle' ? 'bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30' : 'opacity-40 cursor-not-allowed border-slate-700 text-slate-600'
          }`}>
          ⚡ Force Collision (A+C)
        </button>
        {stations.map(s => (
          <button key={s.id} onClick={() => transmitSingle(s.id)} disabled={busState !== 'idle'}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              busState === 'idle' ? 'hover:opacity-80' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ background: s.color + '20', borderColor: s.color + '50', color: s.color }}>
            {s.id} transmit
          </button>
        ))}
        <button onClick={reset} className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-500 hover:text-slate-300 ml-auto">↺ Reset</button>
      </div>

      {/* Bus diagram */}
      <div className="glass-panel p-4 border-glow-amber rounded-xl overflow-x-auto">
        <div className="relative" style={{ minWidth: '480px', height: '140px' }}>
          {/* Shared bus */}
          <motion.div className="absolute rounded-full h-3"
            style={{ left: '8%', right: '8%', top: '55px' }}
            animate={{ background: busColor, boxShadow: busState === 'collision' ? `0 0 12px ${busColor}` : 'none' }}
            transition={{ duration: 0.2 }}>
            <div className="absolute inset-x-4 top-0.5 flex items-center justify-center">
              <motion.span className="text-xs font-bold" style={{ fontSize: '9px' }}
                animate={{ color: busState === 'idle' ? '#475569' : '#ffffff' }}>
                {busLabel}
              </motion.span>
            </div>
          </motion.div>

          {/* Stations */}
          {stations.map(s => (
            <div key={s.id} className="absolute" style={{ left: `${(s.x / 480) * 100}%`, top: 0, transform: 'translateX(-50%)' }}>
              <motion.div className="w-16 h-10 rounded-xl border flex flex-col items-center justify-center text-center"
                animate={{
                  borderColor: s.transmitting ? s.color : s.waiting ? '#f59e0b50' : '#1e293b',
                  background: s.transmitting ? s.color + '20' : s.waiting ? '#f59e0b0a' : 'transparent',
                  scale: s.transmitting ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}>
                <span className="text-sm">💻</span>
                <span className="font-bold" style={{ fontSize: '9px', color: s.color }}>{s.label}</span>
              </motion.div>

              {/* Drop line to bus */}
              <motion.div className="w-px mx-auto" style={{ height: '10px' }}
                animate={{ background: s.transmitting ? s.color : '#334155' }} />

              {/* Backoff counter */}
              {s.waiting && s.backoff > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="bg-amber-500/20 border border-amber-500/40 rounded-full px-2 py-0.5"
                    style={{ whiteSpace: 'nowrap' }}>
                    <span className="font-mono text-amber-300 font-bold" style={{ fontSize: '9px' }}>
                      {s.backoff} slots
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Transmitted signal dot — travel clamped to bus endpoints */}
              {s.transmitting && (
                <motion.div className="absolute rounded-full w-3 h-3"
                  style={{ top: '40px', left: '50%', transform: 'translate(-50%, 0)', background: s.color }}
                  animate={{ x: [0, (440 - s.x), -(s.x - 40), 0] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Stats */}
        <div className="glass-panel p-4 border-glow-amber space-y-2">
          <h4 className="text-xs font-bold text-slate-400">Collision Statistics</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-800 rounded-lg p-2 text-center">
              <p className="text-slate-500">Collisions</p>
              <p className="text-xl font-bold text-red-400">{collisionCount}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-2 text-center">
              <p className="text-slate-500">Backoff Round</p>
              <p className="text-xl font-bold text-amber-400">{attempt}</p>
            </div>
            <div className="bg-surface-800 rounded-lg p-2 text-center col-span-2">
              <p className="text-slate-500">Contention Window</p>
              <p className="text-base font-mono font-bold text-cyan-400">
                {attempt === 0 ? '[0, 1]' : `[0, ${Math.pow(2, Math.min(attempt, 10)) - 1}]`}
              </p>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="glass-panel p-3 border-glow-amber">
          <p className="text-xs font-bold text-slate-400 mb-1.5">Event Log</p>
          <div className="space-y-0.5 overflow-hidden">
            {log.length === 0
              ? <p className="text-xs text-slate-600 italic">Click a button to start simulation</p>
              : log.map((l, i) => (
                <motion.p key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                  className={`font-mono ${l.startsWith('⚡') ? 'text-red-400' : l.startsWith('⏳') ? 'text-amber-400' : l.startsWith('✓') ? 'text-emerald-400' : l.startsWith('▶') ? 'text-cyan-300' : 'text-slate-500'}`}
                  style={{ fontSize: '9px' }}>{l}</motion.p>
              ))}
          </div>
        </div>
      </div>

      {/* Backoff algorithm detail */}
      <div className="glass-panel p-4 border-glow-amber">
        <h4 className="font-bold text-sm text-white mb-2">Truncated Binary Exponential Backoff</h4>
        <ModeContent content={{
          kid: 'When two devices crash into each other on the bus, they both wait a RANDOM amount of time before trying again. The random wait prevents them colliding again. After many collisions, the wait range DOUBLES — so after 10 tries, there are over 1000 possible wait times!',
          enthusiast: 'After collision #n, each station picks a random backoff in [0, 2ⁿ − 1] slot times (51.2μs each). n is capped at 10 (max 1023 slots). After 16 failed attempts, the frame is discarded and an error is reported to upper layers.',
          pro: 'k = min(attempt, 10). Backoff slots r ∈ [0, 2ᵏ − 1], uniform random. Slot time = 512 bit-times = 51.2μs @ 10Mbps (6.4μs @ 100Mbps). Jam signal = 32 bits. Max retransmit attempts = 16. After 16 fails: "excessive collision" error to upper layer. Collision domain bound: max propagation delay must be < 25.6μs (half slot time @ 10Mbps).',
        }} className="text-xs text-slate-400 leading-relaxed" />
        <div className="mt-3 overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-1 text-left text-slate-500 pr-4">Attempt</th>
                {Array.from({ length: 10 }, (_, i) => (
                  <th key={i} className="pb-1 text-center text-slate-500 pr-2">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 text-slate-400 pr-4">Max Slots</td>
                {Array.from({ length: 10 }, (_, i) => (
                  <td key={i} className="py-1 text-center font-mono pr-2"
                    style={{ color: i < 3 ? '#06b6d4' : i < 7 ? '#f59e0b' : '#ef4444' }}>
                    {Math.pow(2, i + 1) - 1}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1 text-slate-400 pr-4">Max μs</td>
                {Array.from({ length: 10 }, (_, i) => (
                  <td key={i} className="py-1 text-center font-mono pr-2 text-slate-500" style={{ fontSize: '9px' }}>
                    {((Math.pow(2, i + 1) - 1) * 51.2).toFixed(0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

function CSMACDTab() {
  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">CSMA/CD — Carrier Sense Multiple Access with Collision Detection</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: 'CS', title: 'Carrier Sense', icon: '👂', color: '#06b6d4',
              desc: 'Listen before transmitting. If the medium is busy, wait until idle.' },
            { step: 'MA', title: 'Multiple Access', icon: '🚦', color: '#a855f7',
              desc: 'All stations share the same medium (broadcast domain).' },
            { step: 'CD', title: 'Collision Detection', icon: '⚡', color: '#ef4444',
              desc: 'If your transmitted signal AND another signal are detected simultaneously — collision!' },
          ].map(s => (
            <div key={s.step} className="glass-panel p-3 rounded-xl border text-center space-y-1.5"
              style={{ borderColor: s.color + '40' }}>
              <span className="text-2xl">{s.icon}</span>
              <p className="font-mono font-bold text-xs" style={{ color: s.color }}>{s.step}</p>
              <p className="font-bold text-white text-xs">{s.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <CSMACDSim />
    </div>
  );
}

// ─── Tab 2: Full-Duplex & Micro-segmentation ──────────────────────────────────

function TrafficSim({ type }: { type: 'hub' | 'switch' }) {
  const [speed, setSpeed] = useState(3);
  const [packets, setPackets] = useState<Array<{ id: string; x: number; y: number; color: string; dropped: boolean }>>([]);
  const [dropped, setDropped] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b'];

  useEffect(() => {
    timer.current = setInterval(() => {
      const newPkt = {
        id: Math.random().toString(36).slice(2),
        x: Math.random() * 80 + 10,
        y: 80,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        dropped: type === 'hub' && speed > 4 && Math.random() > 0.4,
      };
      setPackets(prev => [...prev.slice(-12), newPkt]);
      if (newPkt.dropped) setDropped(d => d + 1);
      else setDelivered(d => d + 1);
    }, 1200 / speed);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [speed, type]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Traffic: <span className="text-white font-bold">{speed}x</span></label>
        <input type="range" min={1} max={8} value={speed} onChange={e => setSpeed(+e.target.value)}
          className={`flex-1 ${type === 'hub' ? 'accent-red-500' : 'accent-emerald-500'}`} />
      </div>

      <div className="relative rounded-xl overflow-hidden border h-32"
        style={{ background: '#080d1a', borderColor: type === 'hub' ? '#7f1d1d40' : '#14532d40' }}>
        {/* Device icons */}
        <div className="absolute top-2 left-4 text-xs text-slate-600">{type === 'hub' ? '🔀 Hub (shared)' : '⚡ Switch (segmented)'}</div>
        <div className="absolute bottom-2 left-4">
          <span className="text-xs text-slate-500">📦</span>
          <span className="font-mono text-xs ml-1" style={{ color: type === 'hub' && speed > 4 ? '#ef4444' : '#10b981' }}>
            {delivered} delivered · {dropped} dropped
          </span>
        </div>

        {/* Packets */}
        <AnimatePresence>
          {packets.map(pkt => (
            <motion.div key={pkt.id}
              className="absolute w-4 h-4 rounded-sm flex items-center justify-center text-xs"
              style={{ left: `${pkt.x}%`, background: pkt.color + '40', border: `1px solid ${pkt.color}60` }}
              initial={{ y: 80, opacity: 0.8 }}
              animate={{ y: pkt.dropped ? [80, 50, 90] : [80, 20, 10], opacity: pkt.dropped ? [0.8, 0.8, 0] : [0.8, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}>
              {pkt.dropped ? '✗' : ''}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Collision indicator for hub under load */}
        {type === 'hub' && speed > 5 && (
          <motion.div className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.4, repeat: Infinity }}>
            <span className="text-2xl">⚡</span>
          </motion.div>
        )}
      </div>

      {type === 'hub' && speed > 4 && (
        <p className="text-xs text-red-400">⚠ Collisions increasing under load — switch to Full-Duplex switch!</p>
      )}
    </div>
  );
}

function FullDuplexTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { type: 'hub' as const, title: 'Half-Duplex Hub', subtitle: 'Shared collision domain', color: '#ef4444',
            desc: 'All ports share one collision domain. CSMA/CD required. One transmission at a time. Efficiency degrades with more stations.' },
          { type: 'switch' as const, title: 'Full-Duplex Switch', subtitle: 'Micro-segmented', color: '#10b981',
            desc: 'Each port is a dedicated collision domain. Simultaneous TX+RX. No CSMA/CD needed. Wire-speed forwarding per port.' },
        ].map(s => (
          <div key={s.type} className="glass-panel p-4 border rounded-xl space-y-3"
            style={{ borderColor: s.color + '40' }}>
            <div>
              <span className="font-bold text-white">{s.title}</span>
              <span className="ml-2 text-xs" style={{ color: s.color }}>{s.subtitle}</span>
            </div>
            <p className="text-xs text-slate-400">{s.desc}</p>
            <TrafficSim type={s.type} />
          </div>
        ))}
      </div>

      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">TX/RX Pair Architecture</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold text-red-400 mb-2">Half-Duplex (Hub)</p>
            <svg viewBox="0 0 220 80" className="w-full">
              <rect x="10" y="30" width="60" height="20" rx="4" fill="#1e293b" stroke="#334155" />
              <text x="40" y="43" textAnchor="middle" fontSize="8" fill="#94a3b8">NIC A</text>
              <rect x="150" y="30" width="60" height="20" rx="4" fill="#1e293b" stroke="#334155" />
              <text x="180" y="43" textAnchor="middle" fontSize="8" fill="#94a3b8">NIC B</text>
              {/* Single shared wire */}
              <line x1="70" y1="40" x2="150" y2="40" stroke="#ef4444" strokeWidth="2" />
              <text x="110" y="35" textAnchor="middle" fontSize="7" fill="#ef4444">Shared TX/RX</text>
              <text x="110" y="55" textAnchor="middle" fontSize="7" fill="#475569">Cannot TX while RX</text>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400 mb-2">Full-Duplex (Switch)</p>
            <svg viewBox="0 0 220 80" className="w-full">
              <rect x="10" y="15" width="60" height="50" rx="4" fill="#1e293b" stroke="#334155" />
              <text x="40" y="43" textAnchor="middle" fontSize="8" fill="#94a3b8">NIC A</text>
              <rect x="150" y="15" width="60" height="50" rx="4" fill="#1e293b" stroke="#334155" />
              <text x="180" y="43" textAnchor="middle" fontSize="8" fill="#94a3b8">NIC B</text>
              {/* Dedicated TX pair */}
              <line x1="70" y1="28" x2="150" y2="28" stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#arr)" />
              <text x="110" y="24" textAnchor="middle" fontSize="6.5" fill="#06b6d4">TX pair (pins 1,2)</text>
              {/* Dedicated RX pair */}
              <line x1="150" y1="52" x2="70" y2="52" stroke="#10b981" strokeWidth="1.5" />
              <text x="110" y="62" textAnchor="middle" fontSize="6.5" fill="#10b981">RX pair (pins 3,6)</text>
              <text x="110" y="38" textAnchor="middle" fontSize="6.5" fill="#475569">Simultaneous</text>
            </svg>
          </div>
        </div>

        <ModeContent content={{
          kid: 'A hub is like a walkie-talkie — only ONE person can talk at a time or everyone hears noise. A switch is like a telephone — both people can talk AND listen at the same time!',
          enthusiast: 'Full-duplex dedicates the TX (transmit) and RX (receive) wire pairs. The switch port and NIC agree to not use CSMA/CD (IEEE 802.3 Auto-Negotiation disables it). Result: 2× theoretical bandwidth and no collisions.',
          pro: 'IEEE 802.3x Full Duplex mode. Auto-Negotiation (ANEG) via FLP bursts (Fast Link Pulses). Capability word bits: 6=10FD, 7=100FD, 8=100HD, 9=10HD, 11=100BASE-T4. CSMA/CD algorithm disabled in NIC when FDX negotiated. No minimum frame size constraint (but maintained for compatibility).',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Tab 3: Flow Control ──────────────────────────────────────────────────────

function FlowControlSim() {
  const [quanta, setQuanta] = useState(4);
  const [bufferLevel, setBufferLevel] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pauseRemaining, setPauseRemaining] = useState(0);
  const [rxRate, setRxRate] = useState(3);
  const [txRate] = useState(8);
  const [pauseCount, setPauseCount] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ paused: false, pauseRemaining: 0, bufferLevel: 0 });

  const addLog = useCallback((msg: string) => setLog(p => [msg, ...p].slice(0, 8)), []);

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setBufferLevel(0);
    setPaused(false);
    setPauseRemaining(0);
    setPauseCount(0);
    setLog([]);
    stateRef.current = { paused: false, pauseRemaining: 0, bufferLevel: 0 };
    setRunning(false);
    setTimeout(() => setRunning(true), 50);
  }, []);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      const s = stateRef.current;

      // Update pause countdown
      let newPaused = s.paused;
      let newPauseRemaining = s.pauseRemaining;
      if (s.paused) {
        newPauseRemaining = Math.max(0, s.pauseRemaining - 1);
        if (newPauseRemaining === 0) {
          newPaused = false;
          addLog('▶ RESUME — sender resumes transmitting');
        }
      }

      // Update buffer
      let newBuffer = s.bufferLevel;
      if (newPaused) {
        newBuffer = Math.max(0, s.bufferLevel - rxRate * 0.15);
      } else if (s.bufferLevel < 100) {
        newBuffer = Math.min(100, s.bufferLevel + (txRate - rxRate) * 0.1);
      }
      if (newBuffer >= 80 && s.bufferLevel < 80) {
        addLog(`⏸ PAUSE frame sent — buffer at ${newBuffer.toFixed(0)}% — quanta=${quanta * 512} bit-times`);
        newPaused = true;
        newPauseRemaining = quanta;
        setPauseCount(c => c + 1);
      }

      stateRef.current = { paused: newPaused, pauseRemaining: newPauseRemaining, bufferLevel: newBuffer };
      setPaused(newPaused);
      setPauseRemaining(newPauseRemaining);
      setBufferLevel(newBuffer);
    }, 200);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running, rxRate, txRate, quanta, addLog]);

  const bufferColor = bufferLevel > 80 ? '#ef4444' : bufferLevel > 60 ? '#f59e0b' : '#10b981';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-xs text-slate-400">Receiver processing rate: <span className="text-white font-bold">{rxRate}x</span></label>
          <input type="range" min={1} max={7} value={rxRate} onChange={e => { setRxRate(+e.target.value); reset(); }}
            className="w-full accent-cyan-500 mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-400">PAUSE quanta: <span className="text-amber-300 font-bold">{quanta}</span> ({quanta * 512} bit-times)</label>
          <input type="range" min={1} max={16} value={quanta} onChange={e => setQuanta(+e.target.value)}
            className="w-full accent-amber-500 mt-1" />
        </div>
      </div>
      <button onClick={reset} className="px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all">
        ↺ Reset Simulation
      </button>

      {/* Visual pipeline */}
      <div className="flex items-center gap-4 py-3 px-2">
        {/* Sender */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <motion.div className="w-16 h-12 rounded-xl border flex flex-col items-center justify-center"
            animate={{
              borderColor: paused ? '#f59e0b60' : '#06b6d460',
              background: paused ? '#f59e0b0a' : '#06b6d40a',
            }}>
            <span className="text-lg">💻</span>
            <span className="text-xs font-bold" style={{ color: paused ? '#f59e0b' : '#06b6d4', fontSize: '9px' }}>
              {paused ? 'PAUSED' : 'SENDING'}
            </span>
          </motion.div>
          <span className="text-xs text-slate-500">Sender</span>
        </div>

        {/* Wire + packets */}
        <div className="flex-1 relative overflow-hidden" style={{ height: '40px' }}>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700" />
          {/* Data packets — left=0 to right end */}
          {!paused && (
            <motion.div
              key={`pkt-${running}`}
              className="absolute w-6 h-5 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center"
              style={{ top: '50%', translateY: '-50%', left: 0 }}
              animate={{ left: ['0%', 'calc(100% - 24px)'] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear', repeatDelay: 0.1 }}>
              <span style={{ fontSize: '10px' }}>📦</span>
            </motion.div>
          )}
          {/* PAUSE frame going right-to-left */}
          {paused && pauseRemaining > 0 && (
            <motion.div
              key={`pause-${pauseCount}`}
              className="absolute w-14 h-5 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center"
              style={{ top: '50%', translateY: '-50%', right: 0 }}
              animate={{ right: ['0%', 'calc(100% - 56px)'] }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear', repeatDelay: 0.1 }}>
              <span className="font-mono font-bold text-amber-300" style={{ fontSize: '8px' }}>⏸ PAUSE</span>
            </motion.div>
          )}
        </div>

        {/* Receiver + buffer */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="relative">
            {/* Buffer bar — left of receiver box */}
            <div className="absolute right-full mr-2 flex flex-col items-center justify-end" style={{ height: '48px', bottom: 0 }}>
              <div className="w-5 bg-surface-800 rounded overflow-hidden" style={{ height: '40px' }}>
                <motion.div className="w-full absolute bottom-0 rounded"
                  style={{ background: bufferColor }}
                  animate={{ height: `${bufferLevel}%` }}
                  transition={{ duration: 0.2 }} />
              </div>
              <span className="font-mono text-center mt-0.5" style={{ fontSize: '8px', color: bufferColor }}>
                {bufferLevel.toFixed(0)}%
              </span>
            </div>
            <motion.div className="w-16 h-12 rounded-xl border flex flex-col items-center justify-center"
              animate={{ borderColor: bufferLevel > 80 ? '#ef444460' : '#10b98160' }}>
              <span className="text-lg">🖥️</span>
              <span className="font-bold text-emerald-400" style={{ fontSize: '9px' }}>RECV</span>
            </motion.div>
          </div>
          <span className="text-xs text-slate-500">Receiver</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-3 border-glow-amber">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Receiver Buffer</span>
            <span style={{ color: bufferColor }}>{bufferLevel.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-surface-700 rounded-full h-3 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: bufferColor }}
              animate={{ width: `${bufferLevel}%` }} transition={{ duration: 0.2 }} />
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-slate-500">TX rate: <span className="text-white">{txRate}x</span></span>
            <span className="text-slate-500">RX rate: <span className="text-white">{rxRate}x</span></span>
            <span className="text-amber-400">PAUSE frames: {pauseCount}</span>
          </div>
          {paused && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs font-bold text-amber-300 mt-1 text-center">
              ⏸ Sender paused ({pauseRemaining} quanta remaining)
            </motion.p>
          )}
        </div>
        <div className="glass-panel p-3 border-glow-amber">
          <p className="text-xs font-bold text-slate-400 mb-1.5">Event Log</p>
          {log.length === 0
            ? <p className="text-xs text-slate-600 italic">Watching for PAUSE events...</p>
            : log.map((l, i) => (
              <p key={i} className="font-mono text-amber-300" style={{ fontSize: '9px' }}>{l}</p>
            ))}
        </div>
      </div>
    </div>
  );
}

function FlowControlTab() {
  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">IEEE 802.3x Flow Control — PAUSE Frames</h3>
        <ModeContent content={{
          kid: 'Imagine you\'re pouring water into a cup that\'s almost full. Flow control is like the cup saying "STOP! I\'m almost full!" — the sender pauses until the cup has more room.',
          enthusiast: '802.3x flow control uses a special "PAUSE" frame (0x8808 EtherType, opcode 0x0001) sent from the overloaded receiver back to the sender. The sender pauses transmission for the specified time (quanta × 512 bit-times).',
          pro: 'MAC Control Frame: EtherType 0x8808, opcode 0x0001 (PAUSE). Destination: 01:80:C2:00:00:01 (PAUSE multicast). Pause time: 1 quanta = 512 bit-times = 51.2μs @ 10G. Range: 0–65535 quanta (0 = resume immediately). PAUSE=0 used as explicit resume. Asymmetric PAUSE: only one direction pauses. PFC (Priority-based Flow Control, 802.1Qbb) extends this per-priority for DCB/RDMA.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      <FlowControlSim />

      {/* PAUSE Frame anatomy */}
      <div className="glass-panel p-4 border-glow-amber space-y-3">
        <h4 className="font-bold text-sm text-white">PAUSE Frame Structure</h4>
        <div className="flex gap-px rounded-xl overflow-hidden text-xs font-mono">
          {[
            { label: 'Dst', val: '01:80:C2:00:00:01', color: '#475569', bytes: '6B' },
            { label: 'Src', val: 'Sender MAC', color: '#334155', bytes: '6B' },
            { label: 'EtherType', val: '0x8808', color: '#7c3aed', bytes: '2B' },
            { label: 'Opcode', val: '0x0001', color: '#1e40af', bytes: '2B' },
            { label: 'Pause Time', val: '0–65535 quanta', color: '#065f46', bytes: '2B' },
            { label: 'Pad', val: '0x00...', color: '#1c1917', bytes: '42B' },
            { label: 'FCS', val: 'CRC-32', color: '#7f1d1d', bytes: '4B' },
          ].map(f => (
            <div key={f.label} className="flex-1 py-2 px-1 text-center border-r border-slate-900 last:border-r-0"
              style={{ background: f.color + '30' }}>
              <p className="font-bold text-white truncate" style={{ fontSize: '8px' }}>{f.label}</p>
              <p className="text-slate-400 truncate" style={{ fontSize: '7px' }}>{f.val}</p>
              <p className="text-slate-600" style={{ fontSize: '7px' }}>{f.bytes}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Destination <code className="text-amber-300">01:80:C2:00:00:01</code> is a well-known IEEE 802.3x multicast —
          switches do NOT forward PAUSE frames (they are link-local). PFC (802.1Qbb) extends per-CoS priority pausing for RoCE/iSCSI.
        </p>
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Chapter15() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('CSMA/CD Mechanics');

  useEffect(() => {
    (CH15_TAB_SUBTOPICS[activeTab] ?? []).forEach(id => markComplete('ch15', id));
  }, [activeTab, markComplete]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ChapterHeader chapter={CHAPTER}
        description="Interactive deep-dive into Ethernet media access: simulate CSMA/CD collisions with binary exponential backoff, compare half-duplex hubs to full-duplex switched networks, and watch 802.3x PAUSE frames throttle an overloaded receiver." />

      <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'CSMA/CD Mechanics' && <CSMACDTab />}
          {activeTab === 'Full-Duplex'       && <FullDuplexTab />}
          {activeTab === 'Flow Control'      && <FlowControlTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
