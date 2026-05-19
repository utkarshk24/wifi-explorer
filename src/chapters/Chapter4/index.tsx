import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch4')!;

// ─── Service Sets (BSS / ESS / IBSS / MBSS) ──────────────────────────────────
const SERVICE_SETS = [
  {
    id: 'bss', name: 'BSS', full: 'Basic Service Set', icon: 'BSS', color: '#06b6d4',
    kid: 'A BSS is one Wi-Fi family — one router (AP) and all the devices connected to it. Like one household!',
    enthusiast: 'A BSS is a single AP plus all its associated clients. The AP\'s MAC address is the BSSID (the unique "network name" at layer 2). Everything you connect to at home is a BSS.',
    pro: 'Infrastructure BSS: 1 AP (BSSID = AP MAC) + 0..n STAs. All data flows through AP (no direct STA-STA frames on-air). Each BSS has unique BSSID; multiple BSSIDs can share one SSID across APs for the same logical network.',
  },
  {
    id: 'ess', name: 'ESS', full: 'Extended Service Set', icon: 'ESS', color: '#a855f7',
    kid: 'An ESS is multiple Wi-Fi routers in a big building all sharing the SAME network name. You can walk from room to room without reconnecting!',
    enthusiast: 'An ESS connects multiple APs under the same SSID, linked by a wired backbone (distribution system). Your phone can roam seamlessly between APs as you move.',
    pro: 'ESS = multiple BSSs sharing same SSID, connected via DS (Distribution System — wired 802.3 backbone). 802.11r/k/v enable fast roaming. Each BSS has unique BSSID; ESSID (SSID) is common. L3 mobility handled by controller or PMKSA caching.',
  },
  {
    id: 'ibss', name: 'IBSS', full: 'Independent BSS (Ad-hoc)', icon: 'IBSS', color: '#f59e0b',
    kid: 'IBSS is two devices talking DIRECTLY to each other without any router — like whispering to a friend without going through the teacher!',
    enthusiast: 'IBSS (ad-hoc mode) lets devices connect peer-to-peer without an AP. Used for file sharing, gaming, or emergency comms — but range and performance are limited.',
    pro: 'IBSS: No AP — STAs form a peer mesh. Each STA can be IBSS master (generates beacons) or non-master. No DS — frames go directly between STAs. Limited to CSMA/CA DCF. Modern evolution: Wi-Fi Direct (P2P), NAN (Neighbor Awareness Networking), 802.11s mesh.',
  },
  {
    id: 'mbss', name: 'MBSS', full: 'Mesh BSS (802.11s)', icon: 'MBSS', color: '#10b981',
    kid: 'A Mesh BSS is like a web of routers that all talk to each other wirelessly — no cables needed! If one path is blocked, the data finds another way around.',
    enthusiast: 'MBSS (802.11s) creates a self-healing wireless mesh. Mesh Points forward traffic for each other, automatically finding the best path using the HWMP protocol.',
    pro: '802.11s Mesh BSS: Mesh Points (MPs) form a peer-to-peer wireless DS. Mesh AP (MAP) = MP + BSS function. Mesh Portal (MPP) = MP with DS/upstream gateway. HWMP (Hybrid Wireless Mesh Protocol) path selection. Airtime Link Metric (ALM). Mesh Peering Management (MPM) for secured peer establishment.',
  },
];

function ServiceSetsVisualization() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<string>('bss');
  const info = SERVICE_SETS.find(s => s.id === selected)!;

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-5">
      <h3 className="font-bold text-white">BSS / ESS / IBSS / MBSS — Network Topologies</h3>
      <div className="flex gap-2 flex-wrap">
        {SERVICE_SETS.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all`}
            style={selected === s.id ? { borderColor: s.color + '60', background: s.color + '15', color: s.color } : { borderColor: '#334155', color: '#64748b' }}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 600 200" className="w-full" style={{ maxHeight: 200 }}>
          <defs>
            <radialGradient id="ssGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={info.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={info.color} stopOpacity="0.01" />
            </radialGradient>
          </defs>

          {selected === 'bss' && (
            <>
              <circle cx="300" cy="100" r="130" fill="url(#ssGrad)" stroke={info.color + '30'} strokeWidth="1" strokeDasharray="8 4" />
              <g transform="translate(300,100)">
                <circle r="22" fill={info.color + '25'} stroke={info.color} strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="9" fontWeight="bold">AP</text>
                <text textAnchor="middle" y="33" fill={info.color} fontSize="9" fontFamily="Inter" fontWeight="600">BSSID</text>
              </g>
              {[{ x: 160, y: 60, label: 'Phone' }, { x: 440, y: 70, label: 'Laptop' }, { x: 200, y: 160, label: 'TV' }, { x: 420, y: 155, label: 'Tablet' }].map(c => (
                <g key={c.label} transform={`translate(${c.x},${c.y})`}>
                  <line x1="0" y1="0" x2={300 - c.x} y2={100 - c.y} stroke={info.color + '40'} strokeWidth="1" strokeDasharray="4 3" />
                  <circle r="16" fill={info.color + '15'} stroke={info.color + '60'} strokeWidth="1" />
                  <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="8">STA</text>
                  <text textAnchor="middle" y="25" fill="#94a3b8" fontSize="8" fontFamily="Inter">{c.label}</text>
                </g>
              ))}
              <text x="300" y="18" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">BSS — 1 AP + Clients (SSID: "HomeWifi")</text>
            </>
          )}

          {selected === 'ess' && (
            <>
              {[{ cx: 180, bssid: 'AP-1' }, { cx: 420, bssid: 'AP-2' }].map((ap, ai) => (
                <g key={ai}>
                  <circle cx={ap.cx} cy="100" r="110" fill="url(#ssGrad)" stroke={info.color + '30'} strokeWidth="1" strokeDasharray="6 3" />
                  <g transform={`translate(${ap.cx},100)`}>
                    <circle r="22" fill={info.color + '25'} stroke={info.color} strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="9" fontWeight="bold">{ap.bssid}</text>
                  </g>
                  {ai === 0
                    ? [{ x: 80, y: 65 }, { x: 90, y: 140 }].map((c, ci) => (
                        <g key={ci} transform={`translate(${c.x},${c.y})`}>
                          <line x1="0" y1="0" x2={180 - c.x} y2={100 - c.y} stroke={info.color + '35'} strokeWidth="1" strokeDasharray="4 3" />
                          <circle r="14" fill={info.color + '15'} stroke={info.color + '50'} strokeWidth="1" />
                          <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="8">STA</text>
                        </g>
                      ))
                    : [{ x: 510, y: 65 }, { x: 500, y: 140 }].map((c, ci) => (
                        <g key={ci} transform={`translate(${c.x},${c.y})`}>
                          <line x1="0" y1="0" x2={420 - c.x} y2={100 - c.y} stroke={info.color + '35'} strokeWidth="1" strokeDasharray="4 3" />
                          <circle r="14" fill={info.color + '15'} stroke={info.color + '50'} strokeWidth="1" />
                          <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="8">STA</text>
                        </g>
                      ))
                  }
                </g>
              ))}
              <rect x="195" y="93" width="115" height="14" rx="4" fill="#f59e0b20" stroke="#f59e0b50" strokeWidth="1" />
              <text x="252" y="102" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="Inter" fontWeight="600">DS (Switch)</text>
              <motion.g animate={{ x: [-90, 90, -90] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <g transform="translate(300,160)">
                  <circle r="14" fill="#10b98125" stroke="#10b98180" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#10b981" fontSize="8">Roam</text>
                </g>
              </motion.g>
              <text x="300" y="16" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">ESS — Same SSID "CorpWifi", Multiple APs</text>
            </>
          )}

          {selected === 'ibss' && (
            <>
              {[{ x: 180, y: 100, label: 'Device A' }, { x: 420, y: 100, label: 'Device B' }, { x: 300, y: 50, label: 'Device C' }].map((n, i, arr) => (
                <g key={n.label}>
                  {arr.slice(i + 1).map(n2 => (
                    <line key={n2.label} x1={n.x} y1={n.y} x2={n2.x} y2={n2.y}
                      stroke={info.color + '50'} strokeWidth="1.5" strokeDasharray="6 3" />
                  ))}
                  <g transform={`translate(${n.x},${n.y})`}>
                    <circle r="22" fill={info.color + '15'} stroke={info.color + '70'} strokeWidth="1.5" />
                    <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="9" fontWeight="bold">STA</text>
                    <text textAnchor="middle" y="33" fill="#94a3b8" fontSize="9" fontFamily="Inter">{n.label}</text>
                  </g>
                </g>
              ))}
              <text x="300" y="175" textAnchor="middle" fill={info.color} fontSize="9" fontFamily="Inter">No AP — direct peer-to-peer (Ad-hoc)</text>
              <text x="300" y="16" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">IBSS — Ad-hoc / Peer-to-Peer Mode</text>
            </>
          )}

          {selected === 'mbss' && (
            <>
              {/* Mesh topology */}
              {[{ x: 300, y: 40, label: 'MPP', sub: 'Portal/Gateway', role: 'Portal' },
                { x: 160, y: 110, label: 'MAP', sub: 'Mesh AP', role: 'AP' },
                { x: 440, y: 110, label: 'MP', sub: 'Mesh Point', role: 'Relay' },
                { x: 240, y: 170, label: 'MAP', sub: 'Mesh AP', role: 'AP' },
                { x: 380, y: 170, label: 'MP', sub: 'Mesh Point', role: 'Relay' }].map((n, i, arr) => (
                <g key={i}>
                  {arr.slice(i + 1).filter((_, j) => j < 2).map((n2, j) => (
                    <line key={j} x1={n.x} y1={n.y} x2={n2.x} y2={n2.y}
                      stroke={info.color + '40'} strokeWidth="1.5" strokeDasharray="5 3" />
                  ))}
                  <g transform={`translate(${n.x},${n.y})`}>
                    <circle r="22" fill={info.color + '15'} stroke={info.color + (n.role === 'Portal' ? 'cc' : '70')} strokeWidth={n.role === 'Portal' ? 2 : 1.5} />
                    <text textAnchor="middle" dominantBaseline="central" fill={info.color} fontSize="9" fontWeight="bold">{n.label}</text>
                    <text textAnchor="middle" y="33" fill="#94a3b8" fontSize="8" fontFamily="Inter">{n.sub}</text>
                  </g>
                </g>
              ))}
              <text x="300" y="195" textAnchor="middle" fill={info.color} fontSize="8" fontFamily="Inter">HWMP path selection — self-healing mesh</text>
              <text x="300" y="16" textAnchor="middle" fill={info.color} fontSize="10" fontFamily="Inter" fontWeight="600">MBSS (802.11s) — Wireless Mesh</text>
            </>
          )}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${selected}-${mode}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="rounded-xl p-4 border text-sm text-slate-400 leading-relaxed"
          style={{ borderColor: info.color + '30', background: info.color + '08' }}>
          <span className="font-bold mr-2" style={{ color: info.color }}>{info.full}:</span>
          {mode === 'kid' ? info.kid : mode === 'enthusiast' ? info.enthusiast : info.pro}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── 802.11 Association State Machine ─────────────────────────────────────────
type AssocState = 'unauthenticated' | 'authenticated' | 'associated';
const STATE_LABELS: Record<AssocState, { label: string; color: string; icon: string; desc: string }> = {
  unauthenticated: { label: 'Unauthenticated', color: '#ef4444', icon: 'S1', desc: 'Discovered AP, no credentials verified.' },
  authenticated:   { label: 'Authenticated',   color: '#f59e0b', icon: 'S2', desc: 'Identity confirmed. Not yet joined BSS.' },
  associated:      { label: 'Associated',       color: '#10b981', icon: 'S3', desc: 'Fully joined. Data frames can flow.' },
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
                <p className="text-2xl mb-1 font-bold" style={{ color: isActive ? info.color : '#64748b', fontSize: '18px' }}>{isDone && !isActive ? 'done' : info.icon}</p>
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
            ? ['Before you can enter the Wi-Fi club, the bouncer does not know you. You have not shown your ID yet!',
               'You showed your membership card and the bouncer said "OK, I know you!" — but you are still waiting in line.',
               'You are IN the club! You can dance (send data) freely now!'][curIdx]
            : mode === 'enthusiast'
            ? ['Device knows the AP exists (from beacons/probes) but has not verified credentials.',
               'Open System or SAE auth complete. AP added client to its auth list. Association required next.',
               'AID assigned, PTK/GTK installed. Full data service available.'][curIdx]
            : ['Class 1 frames only (probes, auth). State per 802.11-2020 Clause 11.3.3.',
               'Class 1+2 frames allowed. Open System: AP accepts any STA. SAE/WPA3: PMK derived.',
               'AID (1-2007) assigned by AP. Class 1/2/3 frames allowed. 802.1X port AUTHORIZED.'][curIdx]
          }
        </p>
      </motion.div>
      <button onClick={advance} className="btn-primary text-sm">
        {currentState === 'unauthenticated' ? 'Send Auth Request →'
         : currentState === 'authenticated' ? 'Send Association Request →'
         : 'Deauthenticate (Reset)'}
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
    label: 'Client detects weak RSSI', protocol: '', color: '#ef4444', icon: 'RSSI',
    desc: {
      kid: 'Your phone notices the Wi-Fi signal from AP-1 is getting really weak as you walk away.',
      enthusiast: 'Client\'s RSSI drops below roaming threshold (~-72 dBm). The device knows it needs a better AP.',
      pro: 'STA RSSI falls below dot11RSSIRoamThreshold or BSS-Transition-Query triggers. Client initiates neighbor discovery via 802.11k.',
    },
  },
  {
    label: '802.11k Neighbor Report', protocol: '802.11k', color: '#06b6d4', icon: '11k',
    desc: {
      kid: 'Your phone asks AP-1: "Who are your nearby Wi-Fi friends?" AP-1 gives a list of nearby routers.',
      enthusiast: 'The client asks the current AP for a Neighbor Report — a list of nearby APs with their channels. This saves time scanning manually.',
      pro: 'STA → AP-1: Action Frame (Neighbor Report Request). AP-1 → STA: Neighbor Report Response (BSSID, BSSID Info, Operating Class, Channel, PHY Type). Eliminates full band scan (~200ms saved).',
    },
  },
  {
    label: '802.11v BSS Transition', protocol: '802.11v', color: '#a855f7', icon: '11v',
    desc: {
      kid: 'AP-1 might say "Hey, AP-2 over there has a much better signal for you — you should move there!"',
      enthusiast: 'AP-1 can proactively suggest AP-2 via a BSS Transition Management Request — the network steers the client to the best AP.',
      pro: 'AP-1 → STA: BTM Request (Action Frame, Category 10, Action 7). Includes Candidate AP List, Disassociation Timer. STA replies with BTM Response (Accept/Reject/Defer). Reduces "sticky client" problem.',
    },
  },
  {
    label: '802.11r Fast Transition Auth', protocol: '802.11r', color: '#f59e0b', icon: '11r',
    desc: {
      kid: 'OLD roaming: Your phone had to fully re-do the secret handshake with the new router — took 300-500ms, calls dropped! NEW 802.11r: You pre-share the key info BEFORE moving — so the handover is instant (under 50ms)!',
      enthusiast: '802.11r (Fast BSS Transition) pre-authenticates to AP-2 WHILE still connected to AP-1. The full 4-way handshake is done before the roam — saving 200-400ms. Critical for voice calls and video.',
      pro: 'FT Protocol: STA derives R0KH/R1KH key hierarchy using PMK-R1 = KDF(PMK-R0, AP-1 R0KH-ID, AP-2 R1KH-ID, STA MAC). FT Initial Mobility Domain Association or FT-over-DS (FT Action frames via AP-1). Fast: Auth(FT) → Reassoc in <50ms vs 300-500ms legacy.',
    },
  },
  {
    label: 'Reassociation to AP-2', protocol: '', color: '#10b981', icon: 'Done',
    desc: {
      kid: 'Done! Your phone is now connected to the stronger AP-2! Your Netflix keeps playing, your video call never drops!',
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
            <Play size={12} fill="currentColor" /> {playing ? 'Roaming...' : 'Simulate Roam'}
          </button>
        </div>
      </div>
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 600 180" className="w-full" style={{ maxHeight: 180 }}>
          <rect x="10" y="10" width="580" height="160" rx="8" fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="1.5" />
          <line x1="305" y1="10" x2="305" y2="170" stroke="rgba(100,116,139,0.2)" strokeDasharray="6 4" strokeWidth="1" />
          <text x="160" y="175" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">Room A</text>
          <text x="448" y="175" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">Room B</text>
          <circle cx="130" cy="85" r="130" fill="rgba(6,182,212,0.05)" stroke="rgba(6,182,212,0.15)" strokeDasharray="8 4" strokeWidth="1" />
          <circle cx="470" cy="85" r="130" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.15)" strokeDasharray="8 4" strokeWidth="1" />
          {[0, 1, 2, 3].map(i => (
            <rect key={`a1-${i}`} x={45 + i * 8} y={150 - (i + 1) * 7} width="5" height={(i + 1) * 7}
              fill={signalAP1 > (i + 1) * 25 ? '#06b6d4' : '#1e293b'} rx="1" />
          ))}
          {[0, 1, 2, 3].map(i => (
            <rect key={`a2-${i}`} x={525 + i * 8} y={150 - (i + 1) * 7} width="5" height={(i + 1) * 7}
              fill={signalAP2 > (i + 1) * 25 ? '#10b981' : '#1e293b'} rx="1" />
          ))}
          <g transform="translate(130,85)">
            <circle r="24" fill={step >= 4 ? 'rgba(30,41,59,0.7)' : 'rgba(6,182,212,0.15)'} stroke={step >= 4 ? '#33415580' : '#06b6d4'} strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fill={step >= 4 ? '#334155' : '#06b6d4'} fontSize="9" fontWeight="bold">AP-1</text>
          </g>
          <g transform="translate(470,85)">
            <circle r="24" fill={step >= 4 ? 'rgba(16,185,129,0.15)' : 'rgba(30,41,59,0.7)'} stroke={step >= 4 ? '#10b981' : '#33415580'} strokeWidth={step >= 4 ? 2 : 1.5} />
            <text textAnchor="middle" dominantBaseline="central" fill={step >= 4 ? '#10b981' : '#475569'} fontSize="9" fontWeight="bold">AP-2</text>
          </g>
          <motion.line
            x1={deviceX} y1="85" x2={step < 4 ? 130 : 470} y2="85"
            stroke={step < 4 ? '#06b6d4' : '#10b981'} strokeWidth="1.5" strokeDasharray="5 3"
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
          <motion.g animate={{ x: deviceX - 120 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
            <g transform="translate(120,85)">
              <circle r="18" fill="rgba(168,85,247,0.2)" stroke="#a855f7" strokeWidth="2" />
              <text textAnchor="middle" dominantBaseline="central" fill="#a855f7" fontSize="9" fontWeight="bold">STA</text>
            </g>
          </motion.g>
          {curStep && curStep.protocol && (
            <motion.g key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <rect x="220" y="30" width="160" height="22" rx="6" fill={curStep.color + '20'} stroke={curStep.color + '50'} />
              <text x="300" y="44" textAnchor="middle" fill={curStep.color} fontSize="10" fontFamily="monospace" fontWeight="600">
                {curStep.protocol}
              </text>
            </motion.g>
          )}
        </svg>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ROAM_STEPS.map((s, i) => (
          <button key={i} onClick={() => !playing && setStep(i)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={step === i ? { borderColor: s.color + '60', background: s.color + '15', color: s.color }
              : step > i ? { borderColor: '#10b98150', background: '#10b98110', color: '#10b981' }
              : { borderColor: '#334155', color: '#64748b' }}>
            {s.icon} {s.protocol || `Step ${i+1}`}
            {step > i && <span>v</span>}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {curStep && (
          <motion.div key={`${step}-${mode}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border" style={{ borderColor: curStep.color + '40', background: curStep.color + '08' }}>
            <p className="text-xs font-bold mb-1" style={{ color: curStep.color }}>
              {curStep.label} {curStep.protocol && `(${curStep.protocol})`}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{curStep.desc[mode]}</p>
          </motion.div>
        )}
      </AnimatePresence>
      {step >= 4 && !playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-400">Seamless Roam Complete!</p>
          <ModeContent content={{
            kid: 'Your phone moved from AP-1 to AP-2 without you noticing — like a relay race where the baton was passed perfectly!',
            enthusiast: 'Total roaming time < 50ms with 802.11r. Without FT, the same transition would take 300-500ms — enough to drop a VoIP call.',
            pro: 'FT total: ~50ms (802.11r). Legacy PMKSA reassoc: 300-500ms. 802.11k eliminates scan time; 802.11v eliminates sticky client; 802.11r eliminates re-authentication delay. Together = "The Roaming Trifecta".',
          }} className="text-xs text-slate-400 mt-1" />
        </motion.div>
      )}
    </div>
  );
}

// ─── WLAN Architecture ────────────────────────────────────────────────────────
const ARCH_MODES = [
  {
    id: 'autonomous',
    title: 'Autonomous AP',
    subtitle: 'Standalone / Fat AP',
    color: '#06b6d4',
    icon: 'AP',
    desc: 'Each AP is a full self-contained router with its own configuration, auth, DHCP, and firewall. No controller required.',
    pros: ['No single point of failure', 'Simple to deploy for small scale', 'Fully operational offline', 'Lowest cost per AP'],
    cons: ['Hard to manage at scale (100+ APs)', 'Config changes require touching each AP', 'No centralized RF planning', 'Inconsistent policy enforcement'],
    examples: 'Home routers, small office APs (Ubiquiti UniFi standalone, TP-Link EAP solo)',
    kid: 'An autonomous AP is like a store that runs itself — the owner, cashier, and security guard are all the same person. Works great for one store, nightmare for 100 stores!',
    enthusiast: 'Each AP runs a full wireless stack independently. No controller dependency — the AP handles association, RADIUS proxy, DHCP, and routing. Great for SOHO but unmanageable at enterprise scale.',
    pro: 'Fat AP architecture: AP runs full 802.11 MAC, auth (802.1X), RADIUS client, DHCP server, and optionally routing. No CAPWAP tunnel — data plane local. RF management manual per-AP. Used in standalone deployments. Config via CLI/Web UI or vendor management tools (UniFi controller, Meraki Go).',
  },
  {
    id: 'controller',
    title: 'Controller-Based (WLC)',
    subtitle: 'Thin AP + Wireless LAN Controller',
    color: '#a855f7',
    icon: 'WLC',
    desc: 'Lightweight APs (LAPs) tunnel all traffic to a central Wireless LAN Controller (WLC) via CAPWAP. The WLC handles all management and policy.',
    pros: ['Central management of thousands of APs', 'Consistent policy enforcement', 'Centralized RF optimization', 'Fast roaming (controller holds keys)'],
    cons: ['WLC is a single point of failure', 'CAPWAP tunnel overhead', 'High upfront WLC cost', 'Latency for remote sites'],
    examples: 'Cisco Catalyst Center + 9000-series APs, Aruba Mobility Controller + IAP, Ruckus SmartZone',
    kid: 'Controller-based is like a franchise — each store (AP) does the cooking, but the head office (WLC) controls the menu, prices, and rules for all stores at once.',
    enthusiast: 'Thin APs form CAPWAP tunnels to a central WLC. The WLC handles authentication, RF management, roaming, and policy. Split-MAC: time-critical functions (ACK, beaconing) stay at AP; management at WLC.',
    pro: 'CAPWAP (RFC 5415): UDP 5246 (control), UDP 5247 (data). Split-MAC: AP handles real-time (PHY, CRC, ACK, beacons); WLC handles: auth, association, DHCP proxy, RADIUS, RF. DTLS encryption optional on data tunnel. Central key management enables sub-50ms roaming. FlexConnect for remote AP data-local forwarding.',
  },
  {
    id: 'cloud',
    title: 'Cloud-Managed',
    subtitle: 'Meraki / Aruba Central / Mist',
    color: '#10b981',
    icon: 'Cloud',
    desc: 'APs are configured and monitored entirely through a cloud dashboard. Zero-touch provisioning — plug in the AP and it self-configures from the cloud.',
    pros: ['Zero-touch provisioning', 'Global management from anywhere', 'Automatic firmware updates', 'AI-driven RF optimization (Mist/Aruba)'],
    cons: ['Cloud dependency — no internet = no management changes', 'Ongoing subscription cost', 'Data sovereignty concerns', 'Latency if cloud region far away'],
    examples: 'Cisco Meraki MR series, Aruba Central, Juniper Mist, Extreme Networks ExtremeCloud',
    kid: 'Cloud-managed is like a smart toy that knows how to set itself up — you just plug it in and it calls home to get its instructions. No IT person needed!',
    enthusiast: 'APs phone home to the vendor cloud over HTTPS. All config, firmware, and analytics managed from a web dashboard. Zero-touch: claim AP by serial number, push config. Data plane stays local; only management traverses cloud.',
    pro: 'AP → cloud: persistent HTTPS/WebSocket mgmt tunnel. Data plane local (not tunneled through cloud). Provisioning: AP retrieves config from cloud on boot (per serial-number claim). Meraki: dashboard.meraki.com. Mist: AI-driven marvis engine for anomaly detection. Certificate-based AP auth prevents rogue AP registration. Licensing: per-AP annual subscription.',
  },
];

function WLANArchitectureTab() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<string>('autonomous');
  const sel = ARCH_MODES.find(a => a.id === selected)!;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">WLAN Architecture — Three Deployment Models</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ARCH_MODES.map(arch => (
            <motion.div key={arch.id} onClick={() => setSelected(arch.id)}
              whileHover={{ scale: 1.01 }}
              className="rounded-xl p-4 border cursor-pointer transition-all"
              style={selected === arch.id
                ? { borderColor: arch.color + '60', background: arch.color + '12' }
                : { borderColor: '#334155', background: 'rgba(15,23,42,0.4)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                  style={{ background: arch.color + '20', color: arch.color, border: `1px solid ${arch.color}40` }}>
                  {arch.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{arch.title}</p>
                  <p className="text-xs text-slate-500">{arch.subtitle}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{arch.desc}</p>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border" style={{ borderColor: sel.color + '40', background: sel.color + '06' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-400 mb-2">Pros</p>
                <ul className="space-y-1">
                  {sel.pros.map(p => (
                    <li key={p} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">+</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-400 mb-2">Cons</p>
                <ul className="space-y-1">
                  {sel.cons.map(c => (
                    <li key={c} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-red-400 flex-shrink-0 mt-0.5">-</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Examples: </span>{sel.examples}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 leading-relaxed">
                {mode === 'kid' ? sel.kid : mode === 'enthusiast' ? sel.enthusiast : sel.pro}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Architecture diagram */}
        <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
          <svg viewBox="0 0 600 140" className="w-full" style={{ maxHeight: 140 }}>
            {/* Autonomous */}
            <g transform="translate(70,70)">
              <rect x="-50" y="-45" width="100" height="90" rx="8" fill="#06b6d420" stroke="#06b6d450" strokeWidth="1" />
              <text textAnchor="middle" y="-28" fill="#06b6d4" fontSize="8" fontWeight="bold">Autonomous</text>
              <rect x="-35" y="-20" width="70" height="20" rx="4" fill="#06b6d430" stroke="#06b6d460" strokeWidth="1" />
              <text textAnchor="middle" y="-6" fill="#06b6d4" fontSize="7">Full AP Stack</text>
              <rect x="-35" y="5" width="70" height="20" rx="4" fill="#06b6d420" stroke="#06b6d440" strokeWidth="1" />
              <text textAnchor="middle" y="19" fill="#94a3b8" fontSize="7">DHCP/Auth/RF</text>
              <text x="0" y="38" textAnchor="middle" fill="#94a3b8" fontSize="7">Self-contained</text>
            </g>

            {/* Controller-based */}
            <g transform="translate(300,70)">
              <rect x="-90" y="-45" width="180" height="90" rx="8" fill="#a855f720" stroke="#a855f750" strokeWidth="1" />
              <text textAnchor="middle" y="-28" fill="#a855f7" fontSize="8" fontWeight="bold">Controller-Based</text>
              <g transform="translate(-55,0)">
                <rect x="-25" y="-18" width="50" height="36" rx="4" fill="#a855f730" stroke="#a855f760" strokeWidth="1" />
                <text textAnchor="middle" y="-5" fill="#c4b5fd" fontSize="7">Thin AP</text>
                <text textAnchor="middle" y="8" fill="#94a3b8" fontSize="6">PHY+ACK</text>
              </g>
              <text textAnchor="middle" y="4" fill="#f59e0b" fontSize="8">CAPWAP</text>
              <line x1="-30" y1="0" x2="30" y2="0" stroke="#f59e0b" strokeDasharray="4 2" strokeWidth="1" />
              <g transform="translate(55,0)">
                <rect x="-25" y="-18" width="50" height="36" rx="4" fill="#7c3aed50" stroke="#7c3aed80" strokeWidth="1" />
                <text textAnchor="middle" y="-5" fill="#c4b5fd" fontSize="7">WLC</text>
                <text textAnchor="middle" y="8" fill="#94a3b8" fontSize="6">Mgmt/Auth</text>
              </g>
            </g>

            {/* Cloud */}
            <g transform="translate(530,70)">
              <rect x="-60" y="-45" width="120" height="90" rx="8" fill="#10b98120" stroke="#10b98150" strokeWidth="1" />
              <text textAnchor="middle" y="-28" fill="#10b981" fontSize="8" fontWeight="bold">Cloud-Managed</text>
              <rect x="-35" y="-20" width="70" height="20" rx="4" fill="#10b98130" stroke="#10b98160" strokeWidth="1" />
              <text textAnchor="middle" y="-6" fill="#10b981" fontSize="7">AP (local data)</text>
              <line x1="0" y1="2" x2="0" y2="12" stroke="#10b98160" strokeDasharray="3 2" strokeWidth="1" />
              <text textAnchor="middle" y="22" fill="#94a3b8" fontSize="7">HTTPS mgmt</text>
              <rect x="-35" y="26" width="70" height="14" rx="4" fill="#10b98120" stroke="#10b98140" strokeWidth="1" />
              <text textAnchor="middle" y="36" fill="#10b981" fontSize="7">Cloud Dashboard</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Scanning (Passive & Active) ──────────────────────────────────────────────
function ScanningTab() {
  const [scanMode, setScanMode] = useState<'passive' | 'active'>('passive');
  const [animStep, setAnimStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channels = [1, 6, 11, 36, 40, 44, 48];

  const startScan = () => {
    setAnimStep(-1);
    setPlaying(true);
    channels.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setAnimStep(i);
        if (i === channels.length - 1) setPlaying(false);
      }, (i + 1) * 500);
    });
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">802.11 Scanning — Finding Access Points</h3>
        <div className="flex gap-2">
          {([
            { id: 'passive', label: 'Passive Scanning', color: '#06b6d4' },
            { id: 'active',  label: 'Active Scanning',  color: '#a855f7' },
          ] as const).map(m => (
            <button key={m.id} onClick={() => { setScanMode(m.id); setAnimStep(-1); setPlaying(false); }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={scanMode === m.id ? { borderColor: m.color + '60', background: m.color + '15', color: m.color } : { borderColor: '#334155', color: '#64748b' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-900/70 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold" style={{ color: scanMode === 'passive' ? '#06b6d4' : '#a855f7' }}>
              {scanMode === 'passive' ? 'Passive: Listen for Beacons' : 'Active: Send Probe Requests'}
            </p>
            {/* Channel scan animation */}
            <div className="flex gap-1 flex-wrap">
              {channels.map((ch, i) => (
                <motion.div key={ch}
                  animate={animStep === i ? { scale: [1, 1.2, 1], backgroundColor: [scanMode === 'passive' ? '#06b6d4' : '#a855f7', '#ffffff', scanMode === 'passive' ? '#06b6d4' : '#a855f7'] } : {}}
                  className="rounded-lg text-xs font-bold border px-2 py-1.5 flex-shrink-0"
                  style={animStep >= i
                    ? { background: (scanMode === 'passive' ? '#06b6d4' : '#a855f7') + '25', borderColor: (scanMode === 'passive' ? '#06b6d4' : '#a855f7') + '60', color: scanMode === 'passive' ? '#06b6d4' : '#a855f7' }
                    : { background: '#1e293b', borderColor: '#334155', color: '#475569' }}>
                  ch{ch}
                </motion.div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={startScan} disabled={playing}
                className="btn-primary text-xs flex items-center gap-1">
                <Play size={10} fill="currentColor" /> {playing ? 'Scanning...' : 'Animate Scan'}
              </button>
              <button onClick={() => { setAnimStep(-1); setPlaying(false); }} className="btn-ghost text-xs flex items-center gap-1">
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            {animStep >= 0 && (
              <div className="text-xs text-slate-400">
                Scanning ch{channels[Math.min(animStep, channels.length - 1)]} — {scanMode === 'passive' ? 'listening for Beacons (100-250ms)' : 'sending Probe Request'}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {scanMode === 'passive' ? (
              <div className="space-y-2 text-xs text-slate-400">
                <div className="rounded-lg p-3 border border-cyan-500/30 bg-cyan-500/06 space-y-1.5">
                  <p className="font-semibold text-cyan-400">Passive Scanning Process</p>
                  {[
                    'Tune to channel 1',
                    'Listen for Beacon frames (102.4ms interval typical)',
                    'Extract: SSID, BSSID, capabilities, RSSI, channel, security',
                    'Wait 100-250ms per channel',
                    'Move to next channel',
                    'Repeat for all channels in band',
                  ].map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-cyan-400 flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="flex-1 rounded-lg p-2 border border-emerald-500/30 bg-emerald-500/06">
                    <p className="text-emerald-400 font-semibold">Pros</p>
                    <p>No transmission — stealth mode. Power efficient. Works on any channel.</p>
                  </div>
                  <div className="flex-1 rounded-lg p-2 border border-red-500/30 bg-red-500/06">
                    <p className="text-red-400 font-semibold">Cons</p>
                    <p>Slow — must wait for Beacon (up to 102.4ms per channel). Can miss APs.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-400">
                <div className="rounded-lg p-3 border border-purple-500/30 bg-purple-500/06 space-y-1.5">
                  <p className="font-semibold text-purple-400">Active Scanning Process</p>
                  {[
                    'Tune to channel',
                    'Send Probe Request (broadcast SSID="" or specific SSID)',
                    'Wait for Probe Response from all APs on channel',
                    'ProbeResponse = same as Beacon + STA capabilities',
                    'Min channel time: 5ms, Max: 20ms (if response received)',
                    'Move to next channel',
                  ].map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="flex-1 rounded-lg p-2 border border-emerald-500/30 bg-emerald-500/06">
                    <p className="text-emerald-400 font-semibold">Pros</p>
                    <p>Fast — 5-20ms per channel. Essential for fast roaming.</p>
                  </div>
                  <div className="flex-1 rounded-lg p-2 border border-red-500/30 bg-red-500/06">
                    <p className="text-red-400 font-semibold">Cons</p>
                    <p>Transmits — visible to other devices and Wi-Fi sniffers. Uses power.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400">Property</th>
                <th className="text-left py-2 px-3 text-cyan-400">Passive</th>
                <th className="text-left py-2 px-3 text-purple-400">Active</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Method', 'Listen for Beacons', 'Send Probe Requests'],
                ['Time per channel', '100-250ms', '5-20ms'],
                ['Transmits?', 'No', 'Yes'],
                ['Power use', 'Low', 'Higher'],
                ['Used for', 'Initial connection, IoT', 'Fast roaming, VoIP handsets'],
                ['Can find hidden SSIDs?', 'No', 'Only if SSID known'],
              ].map(([prop, passive, active]) => (
                <tr key={prop} className="border-b border-slate-800">
                  <td className="py-2 px-3 text-slate-400 font-semibold">{prop}</td>
                  <td className="py-2 px-3 text-slate-300">{passive}</td>
                  <td className="py-2 px-3 text-slate-300">{active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ModeContent content={{
          kid: 'Passive scanning is like sitting quietly and listening for someone to call your name. Active scanning is like walking around asking "Is anyone home?" — much faster but louder!',
          enthusiast: 'Passive scanning means waiting for APs to send their Beacon frames (every 102.4ms). Active scanning means broadcasting a Probe Request — APs respond immediately. Active is ~10x faster but reveals you to the network.',
          pro: 'Passive scan: STA listens on each channel for MinChannelTime (typically 10ms) and MaxChannelTime (typically 50-100ms). If no traffic detected, moves on early. Active scan: STA sends Probe Request (FC=0x0040, DA=FF:FF:FF:FF:FF:FF or unicast to BSSID). AP responds with Probe Response (same IEs as Beacon). ProbeDelay timer governs response window. 802.11ax: Reduced Neighbor Report in 6GHz avoids long scans.',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── PMF (802.11w) ────────────────────────────────────────────────────────────
function PMFTab() {
  const [attack, setAttack] = useState(false);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">PMF — Protected Management Frames (802.11w)</h3>

        {/* Before/After comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 border border-red-500/40 bg-red-500/06 space-y-3">
            <p className="font-semibold text-red-400 text-sm">Without PMF (Vulnerable)</p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>Management frames sent as plaintext. Attacker can forge:</p>
              <ul className="space-y-1 ml-3">
                {['Deauthentication frames (kick clients)', 'Disassociation frames (disconnect clients)', 'Action frames (channel switch announcements)', 'Fake Beacons (evil twin attacks)'].map(t => (
                  <li key={t} className="flex gap-2"><span className="text-red-400">-</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-900/70 rounded-lg p-3">
              <svg viewBox="0 0 240 80" className="w-full">
                <g transform="translate(30,40)">
                  <circle r="16" fill="#ef444420" stroke="#ef444480" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#ef4444" fontSize="8" fontWeight="bold">Attacker</text>
                </g>
                <g transform="translate(120,40)">
                  <circle r="16" fill="#a855f720" stroke="#a855f780" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#a855f7" fontSize="8" fontWeight="bold">STA</text>
                </g>
                <g transform="translate(210,40)">
                  <circle r="16" fill="#64748b20" stroke="#64748b60" strokeWidth="1.5" />
                  <text textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="8" fontWeight="bold">AP</text>
                </g>
                {attack && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x="50" y="32" width="60" height="16" rx="4" fill="#ef444430" stroke="#ef4444" strokeWidth="1" />
                    <text x="80" y="43" textAnchor="middle" fill="#ef4444" fontSize="7">Fake Deauth!</text>
                    <line x1="45" y1="40" x2="100" y2="40" stroke="#ef4444" strokeWidth="1" markerEnd="url(#arrowRed)" />
                  </motion.g>
                )}
                <defs>
                  <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                  </marker>
                </defs>
              </svg>
              <button onClick={() => setAttack(v => !v)}
                className="mt-2 px-3 py-1 rounded text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all w-full">
                {attack ? 'Attack Active - STA Disconnected!' : 'Simulate Deauth Attack'}
              </button>
            </div>
          </div>

          <div className="rounded-xl p-4 border border-emerald-500/40 bg-emerald-500/06 space-y-3">
            <p className="font-semibold text-emerald-400 text-sm">With PMF (Protected)</p>
            <div className="space-y-2 text-xs text-slate-400">
              <p>Management frames cryptographically protected using:</p>
              <ul className="space-y-1 ml-3">
                {['IGTK (Integrity Group Temporal Key) for broadcast mgmt', 'PTK for unicast management frames', 'SA Query: STA verifies AP identity before acting on mgmt', 'Unprotected deauth/disassoc → ignored'].map(t => (
                  <li key={t} className="flex gap-2"><span className="text-emerald-400">+</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-900/70 rounded-lg p-3 space-y-2 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">SA Query Procedure</p>
              <div className="space-y-1">
                {['AP sends Deauth/Disassoc', 'STA sends SA Query Request (with Transaction ID)', 'AP responds within SAQueryRetryTimeout', 'STA verifies response is from legitimate AP', 'Only then: STA acts on deauth'].map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-emerald-400">{i + 1}.</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PMF Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: 'Disabled', desc: 'No PMF. All management frames unprotected. Vulnerable to deauth attacks.', color: '#ef4444', req: 'Not recommended' },
            { name: 'Optional (MFP=1)', desc: 'PMF capable. Both protected and unprotected clients allowed. Mixed mode.', color: '#f59e0b', req: 'WPA2 networks' },
            { name: 'Required (MFP=2)', desc: 'PMF mandatory. Only PMF-capable clients can associate. Strongest protection.', color: '#10b981', req: 'Required for WPA3' },
          ].map(m => (
            <div key={m.name} className="rounded-lg p-3 border text-xs" style={{ borderColor: m.color + '40', background: m.color + '08' }}>
              <p className="font-semibold mb-1" style={{ color: m.color }}>{m.name}</p>
              <p className="text-slate-400 mb-2">{m.desc}</p>
              <span className="chip text-xs" style={{ color: m.color, background: m.color + '15', borderColor: m.color + '30' }}>{m.req}</span>
            </div>
          ))}
        </div>

        <ModeContent content={{
          kid: 'Without PMF, a bully can send fake "You are kicked out!" messages to your Wi-Fi device — and your device believes it! PMF puts a lock on those messages so only the real AP can send them.',
          enthusiast: 'PMF (802.11w) protects management frames like Deauth, Disassoc, and Action frames that were previously sent as plaintext. Without PMF, anyone nearby can forge a Deauthentication frame with any AP\'s MAC address and kick all clients off the network. WPA3 mandates PMF.',
          pro: 'PMF uses AES-128-CMAC for unicast management frame MIC (using PTK). Broadcast/multicast management frames use IGTK (Integrity Group Temporal Key) derived alongside GTK. SA Query (Action frame, Category 8): STA queries AP identity after receiving suspiciously-timed deauth. dot11RSNAMgmtFrameProtectionRequired=1 forces MFP. RSN capabilities bits [6:7]: 0=disabled, 1=capable (optional), 3=required.',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Hotspot 2.0 / 802.11u ────────────────────────────────────────────────────
function Hotspot20Tab() {
  const [flowStep, setFlowStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flowSteps = [
    { label: 'Client scans for APs', color: '#06b6d4', detail: 'Client finds APs advertising HS2.0 support via Interworking element in Beacon/Probe Response' },
    { label: 'ANQP Query (pre-association)', color: '#a855f7', detail: 'Client sends GAS (Generic Advertisement Service) Action frame with ANQP request — no association needed yet' },
    { label: 'AP returns ANQP Response', color: '#f59e0b', detail: 'AP returns: Venue Name, Network Auth Type, Roaming Consortium List, NAI Realm, 3GPP Cellular info, IP Address Type' },
    { label: 'Credential matching', color: '#10b981', detail: 'Client matches NAI Realm against stored credentials (SIM card, certificate, username/password)' },
    { label: 'Auto-connect (no user input)', color: '#22c55e', detail: 'Client automatically authenticates using EAP (SIM-based: EAP-SIM/AKA, cert-based: EAP-TLS, password: EAP-TTLS). No login page!' },
  ];

  const start = () => {
    setFlowStep(-1);
    setPlaying(true);
    flowSteps.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setFlowStep(i);
        if (i === flowSteps.length - 1) setPlaying(false);
      }, (i + 1) * 800);
    });
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">Hotspot 2.0 (802.11u) — Seamless Wi-Fi Discovery</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Hotspot 2.0 (Wi-Fi Alliance Passpoint) enables automatic, secure Wi-Fi connectivity without manual SSID selection or portal login.</p>

            {/* ANQP Fields */}
            <div className="bg-surface-900/70 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-300">ANQP Query Elements</p>
              {[
                { name: 'Venue Name', detail: 'Human-readable venue (e.g. "Terminal 3, JFK Airport")' },
                { name: 'Network Auth Type', detail: 'Indicates if captive portal, terms of use, or none' },
                { name: 'Roaming Consortium', detail: 'List of OI (Org Identifiers) — matched against device credentials' },
                { name: 'NAI Realm', detail: 'Domain names accepted (e.g. "carrier.com") + EAP methods' },
                { name: '3GPP Cellular', detail: 'MCC/MNC list for SIM-based auto-auth (carrier Wi-Fi offload)' },
                { name: 'IP Address Type', detail: 'IPv4/IPv6 availability — helps client choose best AP' },
              ].map(item => (
                <div key={item.name} className="flex gap-2 text-xs">
                  <span className="text-purple-400 font-semibold flex-shrink-0 w-36">{item.name}:</span>
                  <span className="text-slate-400">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={start} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
                <Play size={10} fill="currentColor" /> {playing ? 'Connecting...' : 'Simulate Auto-Connect'}
              </button>
              <button onClick={() => { setFlowStep(-1); setPlaying(false); }} className="btn-ghost text-xs flex items-center gap-1">
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <div className="space-y-2">
              {flowSteps.map((s, i) => (
                <motion.div key={i}
                  animate={{ opacity: flowStep >= i ? 1 : 0.3, x: flowStep === i ? 4 : 0 }}
                  className="flex items-start gap-3 rounded-lg p-2 border transition-all"
                  style={flowStep >= i ? { borderColor: s.color + '50', background: s.color + '08' } : { borderColor: '#334155', background: 'transparent' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={flowStep >= i ? { background: s.color + '20', color: s.color, border: `1px solid ${s.color}60` } : { background: '#1e293b', color: '#475569', border: '1px solid #334155' }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: flowStep >= i ? s.color : '#475569' }}>{s.label}</p>
                    {flowStep >= i && <p className="text-xs text-slate-400 mt-0.5">{s.detail}</p>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Airports', detail: 'Auto-connect to carrier Wi-Fi as soon as you land. No captive portal.', color: '#06b6d4' },
            { label: 'Hotels', detail: 'Phone connects automatically to hotel Wi-Fi using your carrier SIM credentials.', color: '#a855f7' },
            { label: 'Carrier Offload', detail: 'Mobile carriers offload 4G/5G traffic to Wi-Fi transparently — saves cellular spectrum.', color: '#10b981' },
          ].map(u => (
            <div key={u.label} className="rounded-lg p-3 border" style={{ borderColor: u.color + '40', background: u.color + '08' }}>
              <p className="font-semibold mb-1" style={{ color: u.color }}>{u.label}</p>
              <p className="text-slate-400">{u.detail}</p>
            </div>
          ))}
        </div>

        <ModeContent content={{
          kid: 'Hotspot 2.0 is like your phone having a VIP membership card — when you walk into any airport or hotel with Hotspot 2.0, your phone quietly shows its card and gets connected automatically. No typing passwords!',
          enthusiast: '802.11u enables pre-association network discovery. Before associating, a device can query the AP for venue info, accepted credentials, and roaming partners using ANQP. If the device has matching credentials (SIM, certificate, or account), it connects automatically with no user intervention.',
          pro: '802.11u: Interworking element in Beacon/Probe Response (bit 15 in RSN Capabilities). GAS (Generic Advertisement Service): encapsulated in Action frames, allows vendor-specific queries pre-association. ANQP (Access Network Query Protocol): uses GAS transport. Advertisement Protocol ID=0 for ANQP. Query/Response: Action frames category Public (4). Hotspot 2.0 Release 2+ adds OSU (Online Sign-Up) for credential provisioning.',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Mesh 802.11s ─────────────────────────────────────────────────────────────
function MeshTab() {
  const [selected, setSelected] = useState<string>('roles');

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">802.11s Wireless Mesh — Full Detail</h3>
        <div className="flex gap-1.5 flex-wrap">
          {[
            { id: 'roles', label: 'Mesh Roles' },
            { id: 'hwmp',  label: 'HWMP Protocol' },
            { id: 'metric', label: 'ALM Metric' },
            { id: 'peering', label: 'Mesh Peering' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSelected(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                selected === tab.id ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selected === 'roles' && (
            <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: 'MP (Mesh Point)', abbr: 'MP', color: '#10b981', desc: 'Basic mesh node. Participates in HWMP path selection and forwards mesh traffic. Has no BSS — cannot connect regular clients directly.', examples: 'Wireless backhaul node, relay point' },
                  { name: 'MAP (Mesh AP)', abbr: 'MAP', color: '#06b6d4', desc: 'Mesh Point that also runs a BSS — can serve regular 802.11 clients while participating in the mesh. Combines AP and mesh functions.', examples: 'Typical home mesh node (Eero, Google Wifi)' },
                  { name: 'MPP (Mesh Portal)', abbr: 'MPP', color: '#a855f7', desc: 'Mesh Point with uplink to the distribution system (wired or otherwise). Acts as the gateway between the mesh and the rest of the network. Must have at least one MPP.', examples: 'Root node connected to ISP router via Ethernet' },
                ].map(role => (
                  <div key={role.name} className="rounded-xl p-4 border" style={{ borderColor: role.color + '40', background: role.color + '08' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                        style={{ background: role.color + '25', color: role.color, border: `1px solid ${role.color}50` }}>
                        {role.abbr}
                      </div>
                      <p className="text-sm font-bold text-white">{role.name}</p>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{role.desc}</p>
                    <p className="text-xs text-slate-500"><span className="text-slate-400 font-semibold">Examples: </span>{role.examples}</p>
                  </div>
                ))}
              </div>
              {/* Topology SVG */}
              <div className="bg-surface-900/70 rounded-xl p-4">
                <svg viewBox="0 0 500 160" className="w-full" style={{ maxHeight: 160 }}>
                  {/* Internet/upstream */}
                  <rect x="10" y="60" width="60" height="40" rx="6" fill="#f59e0b20" stroke="#f59e0b50" strokeWidth="1" />
                  <text x="40" y="83" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">Internet</text>
                  {/* MPP */}
                  <line x1="70" y1="80" x2="130" y2="80" stroke="#a855f760" strokeWidth="2" />
                  <g transform="translate(155,80)">
                    <circle r="22" fill="#a855f720" stroke="#a855f7" strokeWidth="1.5" />
                    <text textAnchor="middle" y="-5" fill="#a855f7" fontSize="9" fontWeight="bold">MPP</text>
                    <text textAnchor="middle" y="8" fill="#94a3b8" fontSize="7">Portal</text>
                    <text textAnchor="middle" y="34" fill="#a855f7" fontSize="7">Gateway</text>
                  </g>
                  {/* Mesh links */}
                  <line x1="177" y1="68" x2="258" y2="45" stroke="#10b98150" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="177" y1="92" x2="258" y2="115" stroke="#10b98150" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="280" y1="40" x2="355" y2="55" stroke="#10b98150" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="280" y1="120" x2="355" y2="105" stroke="#10b98150" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="280" y1="40" x2="280" y2="120" stroke="#10b98130" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="375" y1="60" x2="455" y2="60" stroke="#06b6d450" strokeWidth="1.5" strokeDasharray="5 3" />
                  <line x1="375" y1="110" x2="455" y2="110" stroke="#06b6d450" strokeWidth="1.5" strokeDasharray="5 3" />
                  {/* MP nodes */}
                  {[{ x: 280, y: 40, label: 'MP' }, { x: 280, y: 120, label: 'MP' }].map((n, i) => (
                    <g key={i} transform={`translate(${n.x},${n.y})`}>
                      <circle r="18" fill="#10b98115" stroke="#10b98170" strokeWidth="1.5" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#10b981" fontSize="8" fontWeight="bold">{n.label}</text>
                    </g>
                  ))}
                  {/* MAP nodes */}
                  {[{ x: 375, y: 60 }, { x: 375, y: 110 }].map((n, i) => (
                    <g key={i} transform={`translate(${n.x},${n.y})`}>
                      <circle r="18" fill="#06b6d415" stroke="#06b6d470" strokeWidth="1.5" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#06b6d4" fontSize="8" fontWeight="bold">MAP</text>
                    </g>
                  ))}
                  {/* Client STAs */}
                  {[{ x: 460, y: 50 }, { x: 460, y: 70 }, { x: 460, y: 100 }, { x: 460, y: 120 }].map((n, i) => (
                    <g key={i} transform={`translate(${n.x},${n.y})`}>
                      <circle r="10" fill="#64748b20" stroke="#64748b50" strokeWidth="1" />
                      <text textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="6">STA</text>
                    </g>
                  ))}
                </svg>
              </div>
            </motion.div>
          )}

          {selected === 'hwmp' && (
            <motion.div key="hwmp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/06 space-y-3">
                  <p className="font-semibold text-emerald-400">Proactive Mode (Tree)</p>
                  <p className="text-xs text-slate-400">Root MP (usually MPP) periodically broadcasts path setup to all mesh nodes — like building a highway from the center out. All nodes learn paths to the root proactively.</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li className="flex gap-2"><span className="text-emerald-400">+</span>Low latency for root-bound traffic</li>
                    <li className="flex gap-2"><span className="text-emerald-400">+</span>No path discovery delay</li>
                    <li className="flex gap-2"><span className="text-red-400">-</span>Overhead from periodic broadcasts</li>
                  </ul>
                  <div className="text-xs text-slate-500 font-mono">PREQ (Path Request) → all nodes</div>
                </div>
                <div className="rounded-xl p-4 border border-cyan-500/30 bg-cyan-500/06 space-y-3">
                  <p className="font-semibold text-cyan-400">Reactive Mode (On-Demand)</p>
                  <p className="text-xs text-slate-400">Like AODV (Ad-hoc On-Demand Distance Vector). Path discovery triggered only when needed. Source broadcasts PREQ, destination replies with PREP.</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li className="flex gap-2"><span className="text-emerald-400">+</span>Efficient — no wasted broadcast overhead</li>
                    <li className="flex gap-2"><span className="text-emerald-400">+</span>Scales to many destinations</li>
                    <li className="flex gap-2"><span className="text-red-400">-</span>Initial path discovery delay (latency)</li>
                  </ul>
                  <div className="text-xs text-slate-500 font-mono">PREQ → broadcast → PREP ← destination</div>
                </div>
              </div>
              <div className="bg-surface-900/70 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-300">HWMP Frame Types</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { name: 'PREQ', full: 'Path Request', color: '#06b6d4', desc: 'Broadcast to find path to destination' },
                    { name: 'PREP', full: 'Path Reply', color: '#a855f7', desc: 'Unicast reply from destination' },
                    { name: 'PERR', full: 'Path Error', color: '#ef4444', desc: 'Notify of broken path/link failure' },
                    { name: 'RANN', full: 'Root Announcement', color: '#10b981', desc: 'Root MP announces itself proactively' },
                  ].map(f => (
                    <div key={f.name} className="rounded-lg p-2 border text-xs" style={{ borderColor: f.color + '40', background: f.color + '08' }}>
                      <p className="font-bold" style={{ color: f.color }}>{f.name}</p>
                      <p className="text-slate-400 text-xs">{f.full}</p>
                      <p className="text-slate-500 text-xs mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {selected === 'metric' && (
            <motion.div key="metric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="rounded-xl p-4 border border-amber-500/40 bg-amber-500/06 space-y-3">
                <p className="font-semibold text-amber-400">Airtime Link Metric (ALM)</p>
                <p className="text-xs text-slate-400">Unlike hop-count routing, ALM measures the estimated airtime cost to transmit a test frame over each link. Lower airtime = better path.</p>
                <div className="bg-surface-900/70 rounded-xl p-3 font-mono text-xs space-y-1">
                  <p className="text-amber-400">ALM = O + Bt/r</p>
                  <div className="space-y-0.5 text-slate-400">
                    <p>O = protocol overhead (802.11 header, SIFS, ACK)</p>
                    <p>Bt = test frame size in bits</p>
                    <p>r = data rate achievable on link (Mbps)</p>
                    <p className="text-slate-500 mt-2">Also accounts for: frame error rate, retransmissions, channel busy fraction</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {[
                  { path: 'Path A (2 hops, 5GHz 80MHz)', alm: '2.4ms', color: '#10b981', note: 'Best path — high rate, low error' },
                  { path: 'Path B (3 hops, 2.4GHz)', alm: '8.1ms', color: '#f59e0b', note: 'Higher airtime — more hops, lower rate' },
                  { path: 'Path C (2 hops, congested)', alm: '12.3ms', color: '#ef4444', note: 'Worst — channel congestion adds airtime' },
                ].map(p => (
                  <div key={p.path} className="rounded-lg p-3 border" style={{ borderColor: p.color + '40', background: p.color + '08' }}>
                    <p className="font-semibold" style={{ color: p.color }}>{p.path}</p>
                    <p className="text-white font-mono text-lg mt-1">{p.alm}</p>
                    <p className="text-slate-400 text-xs mt-1">{p.note}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {selected === 'peering' && (
            <motion.div key="peering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <p className="text-xs text-slate-400">Mesh Peering Management (MPM) establishes authenticated peer relationships between mesh neighbors before HWMP can route through them.</p>
              <div className="bg-surface-900/70 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-3">MPM Exchange (Authenticated Mesh Peering Exchange — AMPE):</p>
                <div className="space-y-2">
                  {[
                    { from: 'MP-A', to: 'MP-B', msg: 'Mesh Peering Open', color: '#06b6d4', detail: 'Initiates peering. Includes Mesh ID, local link ID, supported rates, security capabilities' },
                    { from: 'MP-B', to: 'MP-A', msg: 'Mesh Peering Confirm', color: '#a855f7', detail: 'Accepts. Includes peer link ID, local link ID, AMPE element (for SAE-authenticated peering)' },
                    { from: 'MP-A', to: 'MP-B', msg: 'Peering Established', color: '#10b981', detail: 'Both peers transition to ESTAB state. Can now route frames through this link.' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg p-3 border" style={{ borderColor: step.color + '40', background: step.color + '08' }}>
                      <div className="text-xs font-mono text-slate-400 flex-shrink-0 w-32">
                        {step.from} → {step.to}
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: step.color }}>{step.msg}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg p-3 border border-slate-700 bg-slate-800/40">
                  <p className="font-semibold text-slate-300 mb-1">Peering States</p>
                  {['IDLE', 'OPN_SNT', 'OPN_RCVD', 'CNF_RCVD', 'ESTAB', 'HOLDING'].map(s => (
                    <div key={s} className="text-xs text-slate-500 py-0.5 border-b border-slate-700/50">{s}</div>
                  ))}
                </div>
                <div className="rounded-lg p-3 border border-emerald-500/30 bg-emerald-500/06">
                  <p className="font-semibold text-emerald-400 mb-1">Security Options</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>Open: No auth (lab/dev only)</li>
                    <li>SAE: Simultaneous Auth of Equals (WPA3-style)</li>
                    <li>AMPE: Auth Mesh Peering Exchange (ECC key pair)</li>
                    <li>802.1X: RADIUS-based mesh auth</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ModeContent content={{
          kid: '802.11s mesh is like a web of helpers — if your message cannot reach the teacher directly, it gets passed along from person to person until it arrives. And if one path is blocked, it automatically finds another route!',
          enthusiast: '802.11s creates a self-organizing wireless mesh. Mesh Points automatically discover neighbors, establish peer links, and use HWMP (based on AODV) to find optimal paths using airtime as the metric — not just hop count. This enables self-healing networks where path failures are automatically rerouted.',
          pro: '802.11s: Mesh IEs in Beacon/Probe Response identify mesh nodes (Mesh ID, Mesh Config IE). HWMP encapsulated in Mesh Action frames. Path metric: Airtime Link Metric per 802.11-2020. AMPE (RFC 6747 style): SAE-based key establishment for mesh link encryption. Per-link PMK derived for each peer pair. MPDU format: Mesh Control field (Mesh Flags, TTL, Mesh Sequence Number, Address Extension) precedes upper layer payload.',
        }} className="text-sm text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Chapter 4 Main ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'servicesets',   label: 'Service Sets' },
  { id: 'architecture',  label: 'WLAN Architecture' },
  { id: 'statemachine',  label: 'State Machine' },
  { id: 'scanning',      label: 'Scanning' },
  { id: 'roaming',       label: 'Roaming' },
  { id: 'pmf',           label: 'PMF (802.11w)' },
  { id: 'hotspot',       label: 'Hotspot 2.0' },
  { id: 'mesh',          label: 'Mesh (802.11s)' },
] as const;

type TabId = typeof TABS[number]['id'];

export function Chapter4() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('servicesets');

  useEffect(() => {
    ['servicesets', 'architecture', 'statemachine', 'scanning', 'roaming', 'pmf', 'hotspot', 'mesh']
      .forEach(id => markComplete('ch4', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Network topologies, WLAN deployment architectures, scanning methods, the three-state association process, 802.11k/v/r roaming, PMF security, Hotspot 2.0, and 802.11s wireless mesh." />
        <ModeBadge />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 flex-wrap border-b border-slate-800 pb-0">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
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
          {activeTab === 'servicesets'  && <ServiceSetsVisualization />}
          {activeTab === 'architecture' && <WLANArchitectureTab />}
          {activeTab === 'statemachine' && <StateMachineDiagram />}
          {activeTab === 'scanning'     && <ScanningTab />}
          {activeTab === 'roaming'      && <RoamingSimulation />}
          {activeTab === 'pmf'          && <PMFTab />}
          {activeTab === 'hotspot'      && <Hotspot20Tab />}
          {activeTab === 'mesh'         && <MeshTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
