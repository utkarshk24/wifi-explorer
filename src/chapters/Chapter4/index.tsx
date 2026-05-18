import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch4')!;

// ─── Service Sets (BSS / ESS / IBSS) ─────────────────────────────────────────
const SERVICE_SETS = [
  {
    id: 'bss', name: 'BSS', full: 'Basic Service Set', icon: '🏠', color: '#06b6d4',
    kid: 'A BSS is one Wi-Fi family — one router (AP) and all the devices connected to it. Like one household!',
    enthusiast: 'A BSS is a single AP plus all its associated clients. The AP\'s MAC address is the BSSID (the unique "network name" at layer 2). Everything you connect to at home is a BSS.',
    pro: 'Infrastructure BSS: 1 AP (BSSID = AP MAC) + 0..n STAs. All data flows through AP (no direct STA-STA frames on-air). Each BSS has unique BSSID; multiple BSSIDs can share one SSID across APs for the same logical network.',
  },
  {
    id: 'ess', name: 'ESS', full: 'Extended Service Set', icon: '🏢', color: '#a855f7',
    kid: 'An ESS is multiple Wi-Fi routers in a big building all sharing the SAME network name. You can walk from room to room without reconnecting!',
    enthusiast: 'An ESS connects multiple APs under the same SSID, linked by a wired backbone (distribution system). Your phone can roam seamlessly between APs as you move.',
    pro: 'ESS = multiple BSSs sharing same SSID, connected via DS (Distribution System — wired 802.3 backbone). 802.11r/k/v enable fast roaming. Each BSS has unique BSSID; ESSID (SSID) is common. L3 mobility handled by controller or PMKSA caching.',
  },
  {
    id: 'ibss', name: 'IBSS', full: 'Independent BSS (Ad-hoc)', icon: '🤝', color: '#f59e0b',
    kid: 'IBSS is two devices talking DIRECTLY to each other without any router — like whispering to a friend without going through the teacher!',
    enthusiast: 'IBSS (ad-hoc mode) lets devices connect peer-to-peer without an AP. Used for file sharing, gaming, or emergency comms — but range and performance are limited.',
    pro: 'IBSS: No AP — STAs form a peer mesh. Each STA can be IBSS master (generates beacons) or non-master. No DS — frames go directly between STAs. Limited to CSMA/CA DCF. Modern evolution: Wi-Fi Direct (P2P), NAN (Neighbor Awareness Networking), 802.11s mesh.',
  },
];

function ServiceSetsVisualization() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<string>('bss');
  const info = SERVICE_SETS.find(s => s.id === selected)!;

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-5">
      <h3 className="font-bold text-white">BSS / ESS / IBSS — Network Topologies</h3>
      <div className="flex gap-2">
        {SERVICE_SETS.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              selected === s.id ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            style={selected === s.id ? { borderColor: s.color + '60', background: s.color + '15', color: s.color } : {}}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 600 200" className="w-full" style={{ maxHeight: 200 }}>
          <defs>
            <radialGradient id="bss1g" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={info.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={info.color} stopOpacity="0.01" />
            </radialGradient>
          </defs>

          {selected === 'bss' && (
            <>
              {/* BSS coverage circle */}
              <circle cx="300" cy="100" r="130" fill="url(#bss1g)" stroke={info.color + '30'} strokeWidth="1" strokeDasharray="8 4" />
              {/* AP */}
              <g transform="translate(300,100)">
                <circle r="22" fill={info.color + '25'} stroke={info.color} strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="14">📡</text>
                <text textAnchor="middle" y="33" fill={info.color} fontSize="9" fontFamily="Inter" fontWeight="600">AP (BSSID)</text>
              </g>
              {/* Clients */}
              {[{ x: 160, y: 60, label: 'Phone' }, { x: 440, y: 70, label: 'Laptop' }, { x: 200, y: 160, label: 'TV' }, { x: 420, y: 155, label: 'Tablet' }].map(c => (
                <g key={c.label} transform={`translate(${c.x},${c.y})`}>
                  <line x1="0" y1="0" x2={300 - c.x} y2={100 - c.y} stroke={info.color + '40'} strokeWidth="1" strokeDasharray="4 3" />
                  <circle r="16" fill={info.color + '15'} stroke={info.color + '60'} strokeWidth="1" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="10">💻</text>
                  <text textAnchor="middle" y="25" fill="#94a3b8" fontSize="8" fontFamily="Inter">{c.label}</text>
                </g>
              ))}
              <text x="300" y="18" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">BSS — 1 AP + Clients (SSID: "HomeWifi")</text>
            </>
          )}

          {selected === 'ess' && (
            <>
              {/* Two BSSs + wired backbone */}
              {[{ cx: 180, bssid: 'AA:BB:...:01' }, { cx: 420, bssid: 'AA:BB:...:02' }].map((ap, ai) => (
                <g key={ai}>
                  <circle cx={ap.cx} cy="100" r="110" fill="url(#bss1g)" stroke={info.color + '30'} strokeWidth="1" strokeDasharray="6 3" />
                  <g transform={`translate(${ap.cx},100)`}>
                    <circle r="22" fill={info.color + '25'} stroke={info.color} strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="14">📡</text>
                    <text textAnchor="middle" y="33" fill={info.color} fontSize="8" fontFamily="Inter">AP{ai + 1} ({ap.bssid})</text>
                  </g>
                  {/* clients */}
                  {ai === 0
                    ? [{ x: 80, y: 65 }, { x: 90, y: 140 }].map((c, ci) => (
                        <g key={ci} transform={`translate(${c.x},${c.y})`}>
                          <line x1="0" y1="0" x2={180 - c.x} y2={100 - c.y} stroke={info.color + '35'} strokeWidth="1" strokeDasharray="4 3" />
                          <circle r="14" fill={info.color + '15'} stroke={info.color + '50'} strokeWidth="1" />
                          <text textAnchor="middle" dominantBaseline="central" fontSize="10">📱</text>
                        </g>
                      ))
                    : [{ x: 510, y: 65 }, { x: 500, y: 140 }].map((c, ci) => (
                        <g key={ci} transform={`translate(${c.x},${c.y})`}>
                          <line x1="0" y1="0" x2={420 - c.x} y2={100 - c.y} stroke={info.color + '35'} strokeWidth="1" strokeDasharray="4 3" />
                          <circle r="14" fill={info.color + '15'} stroke={info.color + '50'} strokeWidth="1" />
                          <text textAnchor="middle" dominantBaseline="central" fontSize="10">💻</text>
                        </g>
                      ))
                  }
                </g>
              ))}
              {/* DS backbone */}
              <rect x="195" y="93" width="115" height="14" rx="4" fill="#f59e0b20" stroke="#f59e0b50" strokeWidth="1" />
              <text x="252" y="102" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Inter" fontWeight="600">DS (Switch)</text>
              {/* Roaming arrow */}
              <motion.g animate={{ x: [-90, 90, -90] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <g transform="translate(300,160)">
                  <circle r="14" fill="#10b98125" stroke="#10b98180" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="10">📲</text>
                  <text textAnchor="middle" y="22" fill="#10b981" fontSize="7" fontFamily="Inter">Roaming</text>
                </g>
              </motion.g>
              <text x="300" y="16" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">ESS — Same SSID "CorpWifi", Multiple APs</text>
            </>
          )}

          {selected === 'ibss' && (
            <>
              {[{ x: 180, y: 100, label: 'Device A', icon: '💻' }, { x: 420, y: 100, label: 'Device B', icon: '📱' }, { x: 300, y: 50, label: 'Device C', icon: '🖥️' }].map((n, i, arr) => (
                <g key={n.label}>
                  {arr.slice(i + 1).map(n2 => (
                    <line key={n2.label} x1={n.x} y1={n.y} x2={n2.x} y2={n2.y}
                      stroke={info.color + '50'} strokeWidth="1.5" strokeDasharray="6 3" />
                  ))}
                  <g transform={`translate(${n.x},${n.y})`}>
                    <circle r="22" fill={info.color + '15'} stroke={info.color + '70'} strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize="14">{n.icon}</text>
                    <text textAnchor="middle" y="33" fill="#94a3b8" fontSize="9" fontFamily="Inter">{n.label}</text>
                  </g>
                </g>
              ))}
              <text x="300" y="175" textAnchor="middle" fill={info.color} fontSize="9" fontFamily="Inter">No AP — direct peer-to-peer connections (Ad-hoc)</text>
              <text x="300" y="16" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">IBSS — Ad-hoc / Peer-to-Peer Mode</text>
            </>
          )}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${selected}-${mode}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-xl p-4 border text-sm text-slate-400 leading-relaxed"
          style={{ borderColor: info.color + '30', background: info.color + '08' }}>
          <span className="font-bold mr-2" style={{ color: info.color }}>{info.icon} {info.full}:</span>
          {mode === 'kid' ? info.kid : mode === 'enthusiast' ? info.enthusiast : info.pro}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── 802.11 Association State Machine ─────────────────────────────────────────
type AssocState = 'unauthenticated' | 'authenticated' | 'associated';
const STATE_LABELS: Record<AssocState, { label: string; color: string; icon: string; desc: string }> = {
  unauthenticated: { label: 'Unauthenticated', color: '#ef4444', icon: '🔒', desc: 'Discovered AP, no credentials verified.' },
  authenticated:   { label: 'Authenticated',   color: '#f59e0b', icon: '🔑', desc: 'Identity confirmed. Not yet joined BSS.' },
  associated:      { label: 'Associated',       color: '#10b981', icon: '✅', desc: 'Fully joined. Data frames can flow.' },
};

function StateMachineDiagram() {
  const { mode } = useApp();
  const [currentState, setCurrentState] = useState<AssocState>('unauthenticated');
  const advance = () => {
    if (currentState === 'unauthenticated') setCurrentState('authenticated');
    else if (currentState === 'authenticated') setCurrentState('associated');
    else setCurrentState('unauthenticated');
  };
  const stateList: AssocState[] = ['unauthenticated', 'authenticated', 'associated'];
  const curIdx = stateList.indexOf(currentState);

  return (
    <div className="glass-panel p-6 border-glow-purple space-y-5">
      <h3 className="font-bold text-white">802.11 Association State Machine</h3>
      <div className="flex items-center justify-between gap-2">
        {stateList.map((state, i) => {
          const info = STATE_LABELS[state];
          const isActive = currentState === state;
          const isDone = stateList.indexOf(currentState) > i;
          return (
            <div key={state} className="flex items-center gap-2 flex-1">
              <motion.div className="flex-1 rounded-xl p-4 border text-center transition-all cursor-pointer"
                animate={{ borderColor: isActive ? info.color + '80' : isDone ? '#10b98140' : '#33415580', background: isActive ? info.color + '15' : isDone ? '#10b98108' : 'rgba(15,23,42,0.6)', scale: isActive ? 1.03 : 1 }}
                onClick={() => setCurrentState(state)}>
                <p className="text-2xl mb-1">{isDone && !isActive ? '✅' : info.icon}</p>
                <p className="text-xs font-bold" style={{ color: isActive ? info.color : isDone ? '#10b981' : '#94a3b8' }}>State {i + 1}</p>
                <p className="text-xs font-semibold text-white mt-0.5 leading-tight">{info.label}</p>
              </motion.div>
              {i < 2 && <span className="text-slate-600 text-lg flex-shrink-0">→</span>}
            </div>
          );
        })}
      </div>
      <motion.div key={currentState} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-900/60 rounded-xl p-4 border"
        style={{ borderColor: STATE_LABELS[currentState].color + '40' }}>
        <p className="text-sm text-slate-400">
          {mode === 'kid'
            ? ['🚪 Before you can enter the Wi-Fi club, the bouncer doesn\'t know you. You haven\'t shown your ID yet!',
               '🪪 You showed your membership card and the bouncer said "OK, I know you!" — but you\'re still waiting in line.',
               '🎉 You\'re IN the club! You can dance (send data) freely now!'][curIdx]
            : mode === 'enthusiast'
            ? ['Device knows the AP exists (from beacons/probes) but hasn\'t verified credentials.',
               'Open System or SAE auth complete. AP added client to its auth list. Association required next.',
               'AID assigned, PTK/GTK installed. Full data service available.'][curIdx]
            : ['Class 1 frames only (probes, auth). State per 802.11-2020 Clause 11.3.3.',
               'Class 1+2 frames allowed. Open System: AP accepts any STA. SAE/WPA3: PMK derived.',
               'AID (1-2007) assigned by AP. Class 1/2/3 frames allowed. 802.1X port AUTHORIZED.'][curIdx]
          }
        </p>
      </motion.div>
      <button onClick={advance} className="btn-primary text-sm">
        {currentState === 'unauthenticated' ? '📨 Send Auth Request →'
         : currentState === 'authenticated' ? '📨 Send Association Request →'
         : '🔄 Deauthenticate (Reset)'}
      </button>
    </div>
  );
}

// ─── Roaming Simulation (802.11k/v/r) ─────────────────────────────────────────
interface RoamStep {
  label: string; protocol: string; color: string; icon: string;
  desc: Record<'kid' | 'enthusiast' | 'pro', string>;
}

const ROAM_STEPS: RoamStep[] = [
  {
    label: 'Client detects weak RSSI', protocol: '', color: '#ef4444', icon: '📉',
    desc: {
      kid: '📶 Your phone notices the Wi-Fi signal from AP-1 is getting really weak (like a fading radio station) as you walk away.',
      enthusiast: 'Client\'s RSSI drops below roaming threshold (~-72 dBm). The device knows it needs a better AP.',
      pro: 'STA RSSI falls below dot11RSSIRoamThreshold or BSS-Transition-Query triggers. Client initiates neighbor discovery via 802.11k.',
    },
  },
  {
    label: '802.11k Neighbor Report', protocol: '802.11k', color: '#06b6d4', icon: '📋',
    desc: {
      kid: '📋 Your phone asks AP-1: "Who are your nearby Wi-Fi friends?" AP-1 gives a list of nearby routers with their signal info — like a treasure map!',
      enthusiast: 'The client asks the current AP for a Neighbor Report — a list of nearby APs with their channels. This saves time scanning for APs manually.',
      pro: 'STA → AP-1: Action Frame (Neighbor Report Request). AP-1 → STA: Neighbor Report Response (Neighbor Report IEs: BSSID, BSSID Info, Operating Class, Channel, PHY Type). Eliminates full band scan (~200ms saved).',
    },
  },
  {
    label: '802.11v BSS Transition', protocol: '802.11v', color: '#a855f7', icon: '📡',
    desc: {
      kid: '💡 AP-1 might say "Hey, AP-2 over there has a much better signal for you — you should move there!" The AP is being helpful and pointing you to the best exit.',
      enthusiast: 'AP-1 can proactively suggest AP-2 via a BSS Transition Management Request — the network intelligence steers the client to the best AP.',
      pro: 'AP-1 → STA: BTM Request (Action Frame, Category 10, Action 7). Includes Candidate AP List, Disassociation Timer, BSS Termination Duration. STA replies with BTM Response (Accept/Reject/Defer). Reduces "sticky client" problem.',
    },
  },
  {
    label: '802.11r Fast Transition Auth', protocol: '802.11r', color: '#f59e0b', icon: '⚡',
    desc: {
      kid: '⚡ OLD roaming: Your phone had to fully re-do the secret handshake (4-way handshake) with the new router — took 300-500ms, calls dropped! NEW 802.11r: You pre-share the key info BEFORE moving — so the handover is instant (under 50ms)!',
      enthusiast: '802.11r (Fast BSS Transition) pre-authenticates to AP-2 WHILE still connected to AP-1. The full 4-way handshake is done before the roam — saving 200-400ms. Critical for voice calls and video.',
      pro: 'FT Protocol: STA derives R0KH/R1KH key hierarchy using PMK-R1 = KDF(PMK-R0, AP-1 R0KH-ID, AP-2 R1KH-ID, STA MAC). FT Initial Mobility Domain Association (FTAA) or FT-over-DS (FT Action frames via AP-1). Fast: Auth(FT) → Reassoc in <50ms vs 300-500ms legacy.',
    },
  },
  {
    label: '✅ Reassociation to AP-2', protocol: '', color: '#10b981', icon: '✅',
    desc: {
      kid: '🎉 Done! Your phone is now connected to the stronger AP-2! Your Netflix keeps playing, your video call never drops — you didn\'t even notice the switch!',
      enthusiast: 'Reassociation complete in <50ms. PTK already installed. Data resumes immediately on AP-2 with no interruption.',
      pro: 'FT Reassociation: STA → AP-2: Reassoc Request (FT IEs, RSNIE, SNonce). AP-2 → STA: Reassoc Response + PTK install. PMK-R1 derived at AP-2 via R0KH→R1KH. L2 handoff complete. L3: gratuitous ARP / 802.11v IP address continuity.',
    },
  },
];

function RoamingSimulation() {
  const { mode } = useApp();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [deviceX, setDeviceX] = useState(120);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1); setPlaying(false); setDeviceX(120);
  }, []);

  const play = useCallback(() => {
    reset();
    setPlaying(true);
    ROAM_STEPS.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setStep(i);
        // move device toward AP2 progressively
        setDeviceX(120 + (i / (ROAM_STEPS.length - 1)) * 360);
        if (i === ROAM_STEPS.length - 1) setPlaying(false);
      }, (i + 1) * 1600);
    });
  }, [reset]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const curStep = step >= 0 ? ROAM_STEPS[step] : null;
  const signalAP1 = Math.max(0, 100 - (deviceX - 100) * 0.4);
  const signalAP2 = Math.min(100, (deviceX - 100) * 0.35);

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-white">Roaming Simulation (802.11k/v/r)</h3>
          <p className="text-xs text-slate-500 mt-0.5">Watch seamless handoff between two APs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
          <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {playing ? 'Roaming…' : 'Simulate Roam'}
          </button>
        </div>
      </div>

      {/* Floor plan */}
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 600 180" className="w-full" style={{ maxHeight: 180 }}>
          {/* Room */}
          <rect x="10" y="10" width="580" height="160" rx="8" fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="1.5" />
          <line x1="305" y1="10" x2="305" y2="170" stroke="rgba(100,116,139,0.2)" strokeDasharray="6 4" strokeWidth="1" />
          <text x="160" y="175" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">Room A</text>
          <text x="448" y="175" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">Room B</text>

          {/* AP coverage zones */}
          <circle cx="130" cy="85" r="130" fill="rgba(6,182,212,0.05)" stroke="rgba(6,182,212,0.15)" strokeDasharray="8 4" strokeWidth="1" />
          <circle cx="470" cy="85" r="130" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.15)" strokeDasharray="8 4" strokeWidth="1" />

          {/* Signal strength bars */}
          {[0, 1, 2, 3].map(i => (
            <rect key={`a1-${i}`} x={45 + i * 8} y={150 - (i + 1) * 7} width="5" height={(i + 1) * 7}
              fill={signalAP1 > (i + 1) * 25 ? '#06b6d4' : '#1e293b'} rx="1" />
          ))}
          {[0, 1, 2, 3].map(i => (
            <rect key={`a2-${i}`} x={525 + i * 8} y={150 - (i + 1) * 7} width="5" height={(i + 1) * 7}
              fill={signalAP2 > (i + 1) * 25 ? '#10b981' : '#1e293b'} rx="1" />
          ))}

          {/* APs */}
          <g transform="translate(130,85)">
            <circle r="24" fill={step >= 4 ? 'rgba(30,41,59,0.7)' : 'rgba(6,182,212,0.15)'} stroke={step >= 4 ? '#33415580' : '#06b6d4'} strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="14">📡</text>
            <text textAnchor="middle" y="35" fill="#94a3b8" fontSize="8" fontFamily="Inter">AP-1</text>
          </g>
          <g transform="translate(470,85)">
            <circle r="24" fill={step >= 4 ? 'rgba(16,185,129,0.15)' : 'rgba(30,41,59,0.7)'} stroke={step >= 4 ? '#10b981' : '#33415580'} strokeWidth={step >= 4 ? 2 : 1.5} />
            <text textAnchor="middle" dominantBaseline="central" fontSize="14">📡</text>
            <text textAnchor="middle" y="35" fill="#94a3b8" fontSize="8" fontFamily="Inter">AP-2</text>
          </g>

          {/* Active link line */}
          <motion.line
            x1={deviceX} y1="85" x2={step < 4 ? 130 : 470} y2="85"
            stroke={step < 4 ? '#06b6d4' : '#10b981'} strokeWidth="1.5" strokeDasharray="5 3"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />

          {/* Moving device */}
          <motion.g animate={{ x: deviceX - 120 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
            <g transform="translate(120,85)">
              <circle r="18" fill="rgba(168,85,247,0.2)" stroke="#a855f7" strokeWidth="2" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12">📱</text>
            </g>
          </motion.g>

          {/* Protocol label */}
          {curStep && curStep.protocol && (
            <motion.g key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x="220" y="30" width="160" height="22" rx="6" fill={curStep.color + '20'} stroke={curStep.color + '50'} />
              <text x="300" y="44" textAnchor="middle" fill={curStep.color} fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
                {curStep.protocol}: {curStep.label.split(' ').slice(-2).join(' ')}
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      {/* Roam step pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ROAM_STEPS.map((s, i) => (
          <button key={i} onClick={() => !playing && setStep(i)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={step === i ? { borderColor: s.color + '60', background: s.color + '15', color: s.color }
              : step > i ? { borderColor: '#10b98150', background: '#10b98110', color: '#10b981' }
              : { borderColor: '#334155', color: '#64748b' }}>
            {s.icon} {s.protocol || `Step ${i+1}`}
            {step > i && <span>✓</span>}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {curStep && (
          <motion.div key={`${step}-${mode}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border" style={{ borderColor: curStep.color + '40', background: curStep.color + '08' }}>
            <p className="text-xs font-bold mb-1" style={{ color: curStep.color }}>
              {curStep.icon} {curStep.label} {curStep.protocol && `(${curStep.protocol})`}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{curStep.desc[mode]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step >= 4 && !playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-400">🏁 Seamless Roam Complete!</p>
          <ModeContent content={{
            kid: 'Your phone moved from AP-1 to AP-2 without you noticing — like a relay race where the baton was passed perfectly! 🏃',
            enthusiast: 'Total roaming time < 50ms with 802.11r. Without FT, the same transition would take 300-500ms — enough to drop a VoIP call.',
            pro: 'FT total: ~50ms (802.11r). Legacy PMKSA reassoc: 300-500ms. 802.11k eliminates scan time; 802.11v eliminates sticky client; 802.11r eliminates re-authentication delay. Together = "The Roaming Trifecta".',
          }} className="text-xs text-slate-400 mt-1" />
        </motion.div>
      )}
    </div>
  );
}

export function Chapter4() {
  const { markComplete } = useApp();

  useEffect(() => {
    ['servicesets', 'architecture', 'statemachine', 'scanning', 'roaming', 'pmf', 'hotspot', 'mesh']
      .forEach(id => markComplete('ch4', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Network topologies, the three-state association process, and how 802.11k/v/r work together for seamless roaming — the backbone of enterprise Wi-Fi." />
        <ModeBadge />
      </div>
      <ServiceSetsVisualization />
      <StateMachineDiagram />
      <RoamingSimulation />
    </div>
  );
}
