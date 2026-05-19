import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch9')!;
const TABS = ['Survey Types', 'Channel Planning', 'Coverage Design', 'Capacity Planning', 'Regulatory & DFS'] as const;
type Tab = typeof TABS[number];

// ─── Survey Types ─────────────────────────────────────────────────────────────

const SURVEYS = [
  { icon: '🚶', name: 'Manual Walkabout', badge: 'Pre-Deploy', bc: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    when: 'Quick coverage check before deployment', tools: 'Laptop indicator, phone signal bars',
    pros: ['Cheap, no software needed', 'Fast in small spaces'],
    cons: ['Inaccurate, relies on perception', 'No RF prediction or docs'],
    steps: ['Walk floor with laptop open', 'Note dead zones and strong areas', 'Mark on printed floor plan'] },
  { icon: '🖥️', name: 'Predictive (RF Modeling)', badge: 'Pre-Deploy', bc: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    when: 'Before deployment using blueprints', tools: 'Ekahau AI Pro, iBwave, AirMagnet',
    pros: ['Fast iteration, no physical presence', 'Professional AP placement reports'],
    cons: ['Only as good as the building model', 'Requires licensed software + operator'],
    steps: ['Import floor plan, set wall attenuation', 'Place virtual APs, run simulation', 'Tune until coverage targets are met'] },
  { icon: '📡', name: 'Active Survey', badge: 'Post-Deploy', bc: 'text-teal-400 bg-teal-500/15 border-teal-500/30',
    when: 'Walk with associated client post-deploy', tools: 'Ekahau Survey, AirMagnet, Wi-Fi Analyzer',
    pros: ['Real-world RSSI, SNR, throughput data', 'Reveals roaming and coverage holes'],
    cons: ['Slow — every point requires walking', 'All APs must be installed and powered'],
    steps: ['Associate client, open survey app', 'Walk at measured pace across floor', 'Export heatmaps of signal and data rate'] },
  { icon: '✅', name: 'Validation Survey', badge: 'Post-Deploy', bc: 'text-green-400 bg-green-500/15 border-green-500/30',
    when: 'Confirm design meets SLA requirements', tools: 'Active survey tools + acceptance criteria doc',
    pros: ['Confirms regulatory compliance', 'Formal documentation for handoff'],
    cons: ['Cannot cheaply fix design flaws now', 'Failures require costly remediation'],
    steps: ['Define pass/fail thresholds per SLA', 'Run active survey, compare to thresholds', 'Produce validation report for sign-off'] },
] as const;

function SurveyWorkflow() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SURVEYS.map((s, i) => (
          <motion.div key={s.name} layout className="glass-panel border-glow-amber cursor-pointer select-none"
            onClick={() => setExpanded(expanded === i ? null : i)} whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-bold text-white text-sm">{s.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.bc}`}>{s.badge}</span>
              </div>
              <p className="text-xs text-slate-400">{s.when}</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>{s.pros.map(p => <div key={p} className="text-green-400">+ {p}</div>)}</div>
                <div>{s.cons.map(c => <div key={c} className="text-red-400">− {c}</div>)}</div>
              </div>
              <p className="text-xs text-slate-500">Tools: {s.tools}</p>
            </div>
            <AnimatePresence>
              {expanded === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">3-Step Workflow</p>
                    {s.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">{idx + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      <div className="glass-panel p-4">
        <ModeContent content={{
          kid: 'Think of site surveys like checking every corner of your bedroom for Wi-Fi before your parents buy a router — walk around with a tablet and see where the signal drops!',
          enthusiast: 'Surveys progress from predictive modeling (guess with software) to active measurement (real-world data) to validation (prove compliance). Each phase has distinct goals and toolsets.',
          pro: 'CWDP mandates a pre-deployment predictive survey then an active validation. Use Ekahau or iBwave with accurate attenuation values — gypsum ≈ 3 dB, concrete ≈ 12–15 dB per wall.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Channel Planning ─────────────────────────────────────────────────────────

type BandTab = '2.4 GHz' | '5 GHz' | '6 GHz';

const BAND_MODE_CONTENT: Record<BandTab, { kid: string; enthusiast: string; pro: string }> = {
  '2.4 GHz': {
    kid: 'The 2.4 GHz band is a three-lane road — only channels 1, 6, and 11 don\'t crash into each other. Other channels cause traffic jams!',
    enthusiast: 'With only 3 non-overlapping channels, 2.4 GHz must use a 1/6/11 channel plan. Adjacent channels cause co-channel interference that significantly reduces throughput.',
    pro: 'Per 802.11-2020, each 20 MHz channel spans 22 MHz with sidelobes. Channels 1/6/11 are 25 MHz apart, meeting ETSI/FCC non-overlap requirements. Disable 2.4 GHz on high-density APs to eliminate CCI.',
  },
  '5 GHz': {
    kid: 'The 5 GHz band is a bigger highway with many more lanes. Some lanes need a radar check first — those are DFS channels.',
    enthusiast: '25 non-overlapping 20 MHz channels in the US allow far denser deployments than 2.4 GHz. DFS channels are usable but add latency when radar is detected.',
    pro: 'UNII-1 (5150–5250 MHz) is indoor-only, no DFS required. UNII-2A and UNII-2C require 60 s CAC and continuous radar monitoring per FCC Part 15.407. 80 MHz bonding leaves ~6 non-overlapping channels in the US.',
  },
  '6 GHz': {
    kid: 'The 6 GHz band is brand new — only Wi-Fi 6E and Wi-Fi 7 devices can use it. No old devices, no interference, super fast!',
    enthusiast: '6 GHz gives 1200 MHz of clean spectrum — more than 2.4 and 5 GHz combined. PSC channels are 80 MHz apart so 6E clients scan quickly without checking every channel.',
    pro: 'WFA mandates PSC support. Only Wi-Fi 6E/7 STAs associate — no legacy overhead, no DFS. 320 MHz channels available in Wi-Fi 7 (EHT). AFC governs standard-power outdoor 6 GHz APs per FCC rules.',
  },
};

function ChannelPlanVisualizer() {
  const [band, setBand] = useState<BandTab>('2.4 GHz');
  const bandBtns: Array<{ b: BandTab; cls: string }> = [
    { b: '2.4 GHz', cls: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' },
    { b: '5 GHz',   cls: 'bg-purple-500/20 border-purple-500/50 text-purple-300' },
    { b: '6 GHz',   cls: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' },
  ];

  const f24 = (f: number) => ((f - 2400) / 100) * 560;
  const f5  = (f: number) => ((f - 5150) / 700) * 560;
  const groups5 = [
    { label: 'UNII-1', s: 5150, e: 5250, color: '#06b6d4', note: 'Indoor', ch: '36 40 44 48' },
    { label: 'UNII-2A', s: 5250, e: 5350, color: '#eab308', note: 'DFS ⚠️', ch: '52 56 60 64' },
    { label: 'UNII-2C', s: 5470, e: 5725, color: '#f97316', note: 'DFS ⚠️', ch: '100–140' },
    { label: 'UNII-3', s: 5725, e: 5850, color: '#10b981', note: 'No DFS (US)', ch: '149–165' },
  ];
  const bonding = [
    { n: 59, w: '20 MHz', c: '#10b981' }, { n: 29, w: '40 MHz', c: '#06b6d4' },
    { n: 14, w: '80 MHz', c: '#a855f7' }, { n: 7,  w: '160 MHz', c: '#f59e0b' }, { n: 3, w: '320 MHz', c: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {bandBtns.map(({ b, cls }) => (
          <button key={b} onClick={() => setBand(b)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${band === b ? cls : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}>
            {b}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={band} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {band === '2.4 GHz' && (
            <div className="space-y-3">
              <div className="glass-panel p-4">
                <p className="text-xs text-amber-400 font-semibold mb-3">Frequency Domain — 2.4 GHz (2400–2500 MHz)</p>
                <svg viewBox="0 0 560 110" className="w-full" style={{ height: 110 }}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12,13].map(ch => {
                    const ctr = 2407 + ch * 5;
                    const x = f24(ctr - 11); const w = f24(ctr + 11) - x;
                    const hi = [1,6,11].includes(ch);
                    return (
                      <g key={ch}>
                        <rect x={x} y={hi ? 18 : 38} width={w} height={hi ? 58 : 38}
                          fill={hi ? '#10b98133' : '#47556933'} stroke={hi ? '#10b981' : '#475569'} strokeWidth={hi ? 1.5 : 0.5} rx={2} />
                        {(hi || ch % 3 === 0) && <text x={f24(ctr)} y={hi ? 14 : 35} textAnchor="middle" fontSize={hi ? 9 : 7} fill={hi ? '#10b981' : '#64748b'} fontWeight={hi ? 'bold' : 'normal'}>{ch}</text>}
                      </g>
                    );
                  })}
                  <line x1={0} y1={100} x2={560} y2={100} stroke="#334155" strokeWidth={1} />
                  {[2412,2437,2462].map(f => <text key={f} x={f24(f)} y={108} textAnchor="middle" fontSize={8} fill="#64748b">{f}</text>)}
                </svg>
                <p className="text-xs text-slate-500 mt-1 text-center">Only 3 non-overlapping 20 MHz channels in 2.4 GHz</p>
              </div>
              <div className="glass-panel p-4">
                <p className="text-xs text-green-400 font-semibold mb-2">Hexagonal Cell Pattern</p>
                <svg viewBox="0 0 360 90" className="w-full" style={{ height: 90 }}>
                  {[{x:60,l:'1',c:'#10b981'},{x:180,l:'6',c:'#06b6d4'},{x:300,l:'11',c:'#a855f7'}].map(cell => (
                    <g key={cell.l}>
                      <ellipse cx={cell.x} cy={45} rx={55} ry={36} fill={cell.c+'22'} stroke={cell.c} strokeWidth={1.5} />
                      <text x={cell.x} y={50} textAnchor="middle" fontSize={16} fontWeight="bold" fill={cell.c}>{cell.l}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}
          {band === '5 GHz' && (
            <div className="space-y-3">
              <div className="glass-panel p-4">
                <p className="text-xs text-purple-400 font-semibold mb-3">5 GHz Band Groups (5150–5850 MHz)</p>
                <svg viewBox="0 0 560 120" className="w-full" style={{ height: 120 }}>
                  {groups5.map(g => { const x = f5(g.s); const w = f5(g.e) - x; return (
                    <g key={g.label}>
                      <rect x={x} y={28} width={w} height={55} fill={g.color+'25'} stroke={g.color} strokeWidth={1.5} rx={3} />
                      <text x={x+w/2} y={20} textAnchor="middle" fontSize={9} fill={g.color} fontWeight="bold">{g.label}</text>
                      <text x={x+w/2} y={50} textAnchor="middle" fontSize={8} fill={g.color+'cc'}>{g.ch}</text>
                      <text x={x+w/2} y={66} textAnchor="middle" fontSize={8} fill="#94a3b8">{g.note}</text>
                    </g>
                  ); })}
                  <line x1={0} y1={110} x2={560} y2={110} stroke="#334155" strokeWidth={1} />
                  {[5150,5350,5470,5725,5850].map(f => <text key={f} x={f5(f)} y={118} textAnchor="middle" fontSize={7} fill="#64748b">{f}</text>)}
                </svg>
              </div>
              <p className="text-xs text-yellow-400">⚠️ DFS Required: <span className="text-slate-400">UNII-2A and UNII-2C require a 60 s Channel Availability Check before transmitting.</span></p>
            </div>
          )}
          {band === '6 GHz' && (
            <div className="space-y-3">
              <div className="glass-panel p-4">
                <p className="text-xs text-emerald-400 font-semibold mb-3">6 GHz Band (5925–7125 MHz) — 1200 MHz Total</p>
                <svg viewBox="0 0 560 90" className="w-full" style={{ height: 90 }}>
                  <rect x={10} y={15} width={540} height={50} fill="#10b98122" stroke="#10b981" strokeWidth={1.5} rx={4} />
                  <text x={280} y={37} textAnchor="middle" fontSize={11} fill="#10b981" fontWeight="bold">6 GHz — 1200 MHz Clean Spectrum</text>
                  <text x={280} y={53} textAnchor="middle" fontSize={9} fill="#94a3b8">PSC Channels: 5, 21, 37, 53, 69… (every 16th, spaced 80 MHz)</text>
                  <text x={20} y={82} fontSize={8} fill="#64748b">5925 MHz</text>
                  <text x={490} y={82} fontSize={8} fill="#64748b">7125 MHz</text>
                </svg>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {bonding.map(b => (
                  <div key={b.w} className="glass-panel p-3 text-center border" style={{ borderColor: b.c+'40' }}>
                    <p className="text-xl font-bold" style={{ color: b.c }}>{b.n}×</p>
                    <p className="text-xs text-slate-400 mt-1">{b.w}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {['No legacy devices','No DFS','Up to 7 × 320 MHz channels'].map(c => (
                  <span key={c} className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">{c}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="glass-panel p-4">
        <ModeContent content={BAND_MODE_CONTENT[band]} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Coverage Design ──────────────────────────────────────────────────────────

const AP_DEFS = [
  { id: 0, cx: 110, cy: 120, color: '#06b6d4', label: 'AP1' },
  { id: 1, cx: 320, cy: 100, color: '#a855f7', label: 'AP2' },
  { id: 2, cx: 520, cy: 240, color: '#10b981', label: 'AP3' },
] as const;

function CoverageSimulator() {
  const [enabled, setEnabled] = useState<boolean[]>([true, false, false]);
  const count = enabled.filter(Boolean).length;
  const stats = ['60%','85%','95%'];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {AP_DEFS.map((ap, i) => (
          <button key={ap.id} onClick={() => setEnabled(p => p.map((v, idx) => idx === i ? !v : v))}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={enabled[i] ? { background: ap.color+'25', borderColor: ap.color+'70', color: ap.color }
              : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }}>
            {enabled[i] ? '●' : '○'} {ap.label}
          </button>
        ))}
      </div>
      <div className="glass-panel p-2">
        <svg viewBox="0 0 640 360" className="w-full rounded-lg" style={{ background: '#0a0f1e' }}>
          {AP_DEFS.map((ap, i) => enabled[i] && (
            <g key={ap.id}>
              <circle cx={ap.cx} cy={ap.cy} r={180} fill={ap.color+'08'} stroke={ap.color+'20'} strokeWidth={1} />
              <circle cx={ap.cx} cy={ap.cy} r={120} fill={ap.color+'15'} stroke={ap.color+'50'} strokeWidth={1.5} strokeDasharray="4 2" />
            </g>
          ))}
          <rect x={20} y={20} width={600} height={320} fill="none" stroke="#334155" strokeWidth={2} />
          <line x1={220} y1={20} x2={220} y2={200} stroke="#475569" strokeWidth={1.5} />
          <line x1={420} y1={160} x2={420} y2={340} stroke="#475569" strokeWidth={1.5} />
          <line x1={20} y1={200} x2={220} y2={200} stroke="#475569" strokeWidth={1.5} />
          {AP_DEFS.map((ap, i) => enabled[i] && (
            <g key={ap.id}>
              <circle cx={ap.cx} cy={ap.cy} r={10} fill={ap.color} />
              <text x={ap.cx} y={ap.cy - 14} textAnchor="middle" fontSize={10} fill={ap.color} fontWeight="bold">{ap.label}</text>
            </g>
          ))}
          {!enabled.some(Boolean) && <text x={320} y={190} textAnchor="middle" fontSize={14} fill="#475569">Enable at least one AP</text>}
        </svg>
      </div>
      <div className="flex gap-4 flex-wrap text-xs text-slate-400">
        <span className="flex items-center gap-2"><span className="w-8 border border-dashed border-slate-400 rounded" />Primary (20 dB fade margin)</span>
        <span className="flex items-center gap-2"><span className="w-8 border border-slate-600 rounded" />Extended (cell edge ≈ −72 dBm)</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'APs Enabled', val: String(count), color: 'text-white' },
          { label: 'Est. Floor Coverage', val: count === 0 ? '0%' : stats[count - 1], color: 'text-amber-400' },
          { label: 'Roaming Overlap', val: count >= 2 ? '~20%' : 'None', color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="glass-panel p-3 text-center">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="glass-panel p-4">
        <ModeContent content={{
          kid: 'APs are like flashlights — overlap the beams so you can walk between lights without going dark. That\'s how roaming works!',
          enthusiast: 'A 20% cell overlap ensures seamless roaming. Too little causes dead zones at handoff; too much creates co-channel interference that hurts everyone\'s throughput.',
          pro: 'CWDP targets −67 dBm at cell edge for voice/video with 20% physical overlap and ≥15 dB SNR at all coverage points. Co-channel interference from overlapping same-channel cells is the primary capacity limiter — plan channels accordingly.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Capacity Planning ────────────────────────────────────────────────────────

type UsageProfile = 'Basic Browsing' | 'Video Streaming' | 'Video Conferencing' | 'Mixed Enterprise';
type BandConfig = '2.4 GHz only' | '2.4 + 5 GHz' | 'Tri-band (2.4+5+6 GHz)';
type Environment = 'Small Office' | 'Large Office' | 'Education' | 'High-Density Venue';

const USAGE_DATA: Record<UsageProfile, { max: number; mbps: number }> = {
  'Basic Browsing':     { max: 50, mbps: 5 },
  'Video Streaming':    { max: 25, mbps: 25 },
  'Video Conferencing': { max: 15, mbps: 10 },
  'Mixed Enterprise':   { max: 30, mbps: 15 },
};
const ENV_F: Record<Environment, number> = { 'Small Office': 1, 'Large Office': 0.85, 'Education': 0.7, 'High-Density Venue': 0.5 };
const BAND_M: Record<BandConfig, number> = { '2.4 GHz only': 1, '2.4 + 5 GHz': 1.6, 'Tri-band (2.4+5+6 GHz)': 2.2 };

function Select<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: T[]; onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value as T)}
        className="w-full bg-surface-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CapacityCalculator() {
  const [users, setUsers]     = useState<number>(100);
  const [profile, setProfile] = useState<UsageProfile>('Mixed Enterprise');
  const [bands, setBands]     = useState<BandConfig>('2.4 + 5 GHz');
  const [env, setEnv]         = useState<Environment>('Large Office');

  const baseMax = USAGE_DATA[profile].max;
  const maxPerAP = Math.round(baseMax * ENV_F[env] * BAND_M[bands]);
  const recommended = Math.ceil(users / maxPerAP);
  const tier = maxPerAP < 20 ? '2×2:2' : maxPerAP < 50 ? '4×4:4' : '8×8:8';
  const mbps = USAGE_DATA[profile].mbps;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-slate-400 font-medium">Total Users</label>
              <span className="text-sm font-bold text-white">{users}</span>
            </div>
            <input type="range" min={10} max={1000} step={10} value={users}
              onChange={e => setUsers(Number(e.target.value))} className="w-full accent-amber-500" />
          </div>
          <Select label="Usage Profile" value={profile} options={Object.keys(USAGE_DATA) as UsageProfile[]} onChange={setProfile} />
          <Select label="Bands Available" value={bands} options={Object.keys(BAND_M) as BandConfig[]} onChange={setBands} />
          <Select label="Environment" value={env} options={Object.keys(ENV_F) as Environment[]} onChange={setEnv} />
        </div>
        <div className="space-y-3">
          {[
            { label: 'Max Clients / AP', val: maxPerAP, unit: 'clients', color: 'text-cyan-400' },
            { label: 'Recommended APs',  val: recommended, unit: 'APs',    color: 'text-amber-400' },
            { label: 'Min Throughput / User', val: mbps, unit: 'Mbps',  color: 'text-purple-400' },
          ].map(s => (
            <motion.div key={s.label} layout className="glass-panel p-4 flex items-center justify-between border-glow-amber">
              <span className="text-xs text-slate-400">{s.label}</span>
              <span className={`text-2xl font-bold ${s.color}`}>{s.val} <span className="text-xs text-slate-500">{s.unit}</span></span>
            </motion.div>
          ))}
          <div className="glass-panel p-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Recommended AP Tier</span>
            <span className="text-sm font-bold text-green-400 font-mono">{tier}</span>
          </div>
          <div className="glass-panel p-3 text-xs font-mono text-slate-500 space-y-1">
            <p className="text-slate-300 font-semibold mb-1">Formula</p>
            <p>maxPerAP = {baseMax} × {ENV_F[env]} × {BAND_M[bands]} = {maxPerAP}</p>
            <p>APs = ⌈{users} ÷ {maxPerAP}⌉ = {recommended}</p>
          </div>
        </div>
      </div>
      <div className="glass-panel p-4 border border-blue-500/20 bg-blue-500/5">
        <p className="text-xs font-semibold text-blue-400 mb-1">Why not just max clients per AP?</p>
        <p className="text-xs text-slate-400 leading-relaxed">Wi-Fi is a shared medium. As more clients associate, airtime is divided between them — each waits for a clear channel. High client counts cause airtime contention: latency rises and effective throughput per device falls even when signal is strong.</p>
      </div>
      <div className="glass-panel p-4">
        <ModeContent content={{
          kid: 'Think of an AP like a teacher — one teacher helps 30 kids fine, but with 100 kids everyone waits. Add more APs (more teachers)!',
          enthusiast: 'Capacity planning prevents AP oversubscription. Usage profile sets per-client throughput; environment density adjusts for concurrent active devices vs total associated.',
          pro: 'CWDP uses concurrent user density (≠ total devices) and airtime utilization targets. High-density: target <20 clients per radio at 5/6 GHz. BSS Coloring and OFDMA (Wi-Fi 6+) improve spatial reuse and MU efficiency under load.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Regulatory & DFS ─────────────────────────────────────────────────────────

const REG_ROWS = [
  { domain: 'FCC (US)',    b24: '1–11', b5: 'UNII-1/2A/2C/3', eirp: '30 dBm', dfs: 'UNII-2A/2C', dc: 'text-yellow-400' },
  { domain: 'ETSI (EU)',   b24: '1–13', b5: 'UNII-1/2A/2C',   eirp: '23 dBm', dfs: 'UNII-2A/2C', dc: 'text-yellow-400' },
  { domain: 'MKK (Japan)', b24: '1–14', b5: 'UNII-1 only',    eirp: '20 dBm', dfs: 'All bands',  dc: 'text-red-400' },
  { domain: 'APAC',        b24: '1–13', b5: 'UNII-1/3',       eirp: '23–30 dBm', dfs: 'Varies', dc: 'text-orange-400' },
];
const DFS_STEPS = [
  { icon: '📡', label: 'AP Powers Up', detail: 'AP performs a 60-second Channel Availability Check (CAC) on the DFS channel before transmitting.' },
  { icon: '⚠️', label: 'Radar Detected', detail: 'AP stops transmitting immediately and broadcasts a Channel Switch Announcement (CSA) to all clients.' },
  { icon: '⏱️', label: 'Non-Occupancy Period', detail: 'AP waits 30 minutes before returning to the same DFS channel.' },
];

function RegulatoryTable() {
  const [step, setStep] = useState<number>(0);
  return (
    <div className="space-y-5">
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {['Domain','2.4 GHz Channels','5 GHz Bands','Max EIRP (5 GHz)','DFS Required'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-slate-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REG_ROWS.map((r, i) => (
                <tr key={r.domain} className={i % 2 === 0 ? 'bg-white/2' : ''}>
                  <td className="px-4 py-3 font-semibold text-white">{r.domain}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{r.b24}</td>
                  <td className="px-4 py-3 text-slate-300">{r.b5}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">{r.eirp}</td>
                  <td className={`px-4 py-3 font-semibold ${r.dc}`}>{r.dfs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">DFS Event Sequence</p>
          <div className="flex gap-1">
            {DFS_STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${step === i ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
            className="flex items-start gap-3">
            <span className="text-3xl">{DFS_STEPS[step].icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{DFS_STEPS[step].label}</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{DFS_STEPS[step].detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="glass-panel p-4 space-y-2">
        <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">TPC — Transmit Power Control</p>
        <p className="text-xs text-slate-400 leading-relaxed">TPC (802.11h) lets APs and clients negotiate reduced transmit power, minimizing interference with neighboring cells and satellite systems. Required alongside DFS in the ETSI regulatory domain.</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">Indoor: UNII-1 preferred</span>
          <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400">Outdoor: UNII-3 / AFC (6 GHz)</span>
        </div>
      </div>
      <div className="glass-panel p-4">
        <ModeContent content={{
          kid: 'Different countries have different Wi-Fi rules — like speed limits on roads. Japan has very strict rules; the US allows more channels and higher power!',
          enthusiast: 'Regulatory domains dictate legal channels and power. Always set the correct country code on your AP — wrong settings are illegal and cause interference. DFS lets Wi-Fi share spectrum with weather radar by detecting and vacating radar signals.',
          pro: 'FCC Part 15.407 governs US 5 GHz. DFS: 60 s CAC for UNII-2A/2C, 30-minute non-occupancy post-radar. TPC per 802.11h mandatory for ETSI. 6 GHz standard-power outdoor APs require AFC (FCC Part 15.407(k)). Incorrect country code settings create legal liability.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── AP Placement Best Practices ─────────────────────────────────────────────

const AP_PLACEMENT_RULES = [
  {
    title: 'Height & Mounting', color: '#06b6d4', icon: '📏',
    rules: [
      'Mount at 8–10 ft (2.5–3 m) for office environments — avoids multipath from floor, clears furniture obstruction',
      'Ceiling mount preferred: consistent pattern, central coverage, less body absorption',
      'Outdoor: 15–25 ft pole mount for maximum coverage radius, above human head height',
      'Avoid mounting flush against walls — creates asymmetric coverage',
    ],
  },
  {
    title: 'Coverage & Overlap', color: '#a855f7', icon: '🔄',
    rules: [
      '15–20% cell overlap for seamless roaming handoff (-67 dBm at overlap boundary for voice/video)',
      'Min. −67 dBm RSSI at worst coverage point for VoIP; −72 dBm for data only',
      'Target ≥ 20 dB SNR at cell edge for MCS 0 (BPSK 1/2)',
      'Co-channel separation: ≥ 19 dB SINR for OFDM reception; use non-overlapping channels (1/6/11 in 2.4 GHz)',
    ],
  },
  {
    title: 'Density & Capacity', color: '#10b981', icon: '👥',
    rules: [
      'High density (classrooms, conference rooms): 1 AP per 25–30 clients, reduce TX power to limit cell size',
      'Standard office: 1 AP per 2000–3000 sq ft at 2.4 GHz; 1 per 1000–1500 sq ft for 5 GHz',
      'Use lower TX power + more APs for capacity; higher power + fewer APs for coverage',
      'Collocated APs: minimum 19 dB separation to avoid co-channel interference',
    ],
  },
  {
    title: 'Obstructions & Material Loss', color: '#f59e0b', icon: '🧱',
    rules: [
      'Drywall: 3–5 dB per wall; Concrete/CMU: 12–15 dB; Steel door: 13–20 dB; Glass: 2–4 dB',
      'Place APs to minimize wall penetrations — inside offices instead of hallways when possible',
      'Elevator shafts, stairwells, bathrooms: dead zones requiring dedicated APs or distribution antennas',
      'Human body: 3–5 dB absorption in 2.4 GHz; crowds add 5–10 dB additional attenuation',
    ],
  },
  {
    title: 'Common Mistakes', color: '#ef4444', icon: '⚠️',
    rules: [
      'Hallway-only APs: under-serves offices on either side, causes multipath from parallel walls',
      'Maximum TX power always on: creates co-channel interference, forces clients to stay on distant APs (sticky client)',
      'All 2.4 GHz on same channel: co-channel interference kills capacity in multi-AP environments',
      'Ignoring 6 GHz: modern Wi-Fi 6E/7 clients benefit enormously from uncongested 6 GHz band',
    ],
  },
];

function APPlacementSection() {
  const [selected, setSelected] = useState(0);
  const rule = AP_PLACEMENT_RULES[selected];

  return (
    <div className="space-y-5 mt-6">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">AP Placement Best Practices</h3>
        <div className="flex gap-2 flex-wrap">
          {AP_PLACEMENT_RULES.map((r, i) => (
            <button key={r.title} onClick={() => setSelected(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected === i ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={selected === i ? { borderColor: r.color + '60', background: r.color + '15', color: r.color } : {}}>
              {r.icon} {r.title}
            </button>
          ))}
        </div>

        <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-2">
          {rule.rules.map((r, i) => (
            <div key={i} className="flex gap-3 items-start bg-surface-900/50 rounded-lg p-3">
              <span className="font-bold min-w-5 text-center text-xs" style={{ color: rule.color }}>{i + 1}</span>
              <p className="text-xs text-slate-300 leading-relaxed">{r}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'VoIP / Video target', val: '≥ −67 dBm', color: '#10b981' },
            { label: 'Data-only minimum', val: '≥ −72 dBm', color: '#f59e0b' },
            { label: 'Roaming overlap', val: '15–20%', color: '#06b6d4' },
          ].map(s => (
            <div key={s.label} className="bg-surface-900/60 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="font-bold text-sm font-mono mt-1" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chapter 9 ────────────────────────────────────────────────────────────────

const CH9_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Survey Types':      ['surveytype'],
  'Channel Planning':  ['plan24', 'plan5', 'plan6'],
  'Coverage Design':   ['coverage', 'applace'],
  'Capacity Planning': ['capacity'],
  'Regulatory & DFS':  ['regulatory'],
};

export function Chapter9() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Survey Types');

  useEffect(() => {
    CH9_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch9', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <ChapterHeader chapter={CHAPTER} description="CWDP-aligned WLAN design: site survey types, channel planning across all three bands, coverage and capacity design, and regulatory compliance." />
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${activeTab === tab
              ? 'border-wired text-wired'
              : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>
          {activeTab === 'Survey Types'      && <SurveyWorkflow />}
          {activeTab === 'Channel Planning'  && <ChannelPlanVisualizer />}
          {activeTab === 'Coverage Design'   && <><CoverageSimulator /><APPlacementSection /></>}
          {activeTab === 'Capacity Planning' && <CapacityCalculator />}
          {activeTab === 'Regulatory & DFS'  && <RegulatoryTable />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
