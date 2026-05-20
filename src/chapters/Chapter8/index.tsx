import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ModeContent } from '../../components/shared/ModeContent';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch8')!;

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Fundamentals', 'Antenna Types', 'Radiation Patterns', 'Polarization', 'Beamforming'] as const;
type Tab = typeof TABS[number];

// ─── Tab 1: Fundamentals ──────────────────────────────────────────────────────

const BASICS = [
  { label: 'Gain', unit: 'dBi / dBd', desc: 'How focused is the RF energy', color: '#06b6d4', icon: '📡' },
  { label: 'Beamwidth', unit: 'degrees', desc: 'Angular width at −3 dB points', color: '#a855f7', icon: '📐' },
  { label: 'VSWR', unit: 'ratio', desc: 'How well antenna is impedance matched (ideal = 1:1)', color: '#10b981', icon: '⚡' },
];

function FundamentalsTab() {
  const cx = 100, cy = 100, r = 55;
  const arrows = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI * 2) / 8;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, dx: Math.cos(a) * 18, dy: Math.sin(a) * 18 };
  });
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BASICS.map((c) => (
          <div key={c.label} className="glass-panel p-4 rounded-xl space-y-2">
            <div className="text-2xl">{c.icon}</div>
            <div className="font-bold text-white text-sm">{c.label}</div>
            <div className="text-xs font-mono" style={{ color: c.color }}>{c.unit}</div>
            <div className="text-xs text-slate-400">{c.desc}</div>
          </div>
        ))}
      </div>
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 200 200" className="w-36 h-36">
            <defs>
              <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#06b6d4" />
              </marker>
            </defs>
            <circle cx={cx} cy={cy} r={r} fill="rgba(6,182,212,0.08)" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="4" fill="#06b6d4" />
            {arrows.map((a, i) => (
              <line key={i} x1={a.x} y1={a.y} x2={a.x + a.dx} y2={a.y + a.dy}
                stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#arrowBlue)" />
            ))}
          </svg>
          <span className="text-xs text-slate-400">Isotropic Source (0 dBi)</span>
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-sm font-semibold text-white">Key Formula: EIRP</div>
          <div className="bg-surface-900 rounded-lg px-4 py-3 font-mono text-sm text-center">
            <span className="text-cyan-400">EIRP</span><span className="text-slate-300"> (dBm) = </span>
            <span className="text-purple-400">Tx Power</span><span className="text-slate-300"> (dBm) + </span>
            <span className="text-emerald-400">Antenna Gain</span><span className="text-slate-300"> (dBi) − </span>
            <span className="text-amber-400">Cable Loss</span><span className="text-slate-300"> (dB)</span>
          </div>
          <div className="text-xs text-slate-400">
            EIRP is the effective isotropic radiated power — the total power in the strongest beam direction.
            Regulators cap this value (e.g., FCC: 36 dBm EIRP on 5 GHz point-to-point).
          </div>
        </div>
      </div>
      <ModeContent content={{
        kid: 'An antenna is like a flashlight for radio waves. A bigger, more focused beam means the signal can travel farther in one direction — but it misses other directions!',
        enthusiast: 'Gain measures how much an antenna concentrates power relative to an isotropic radiator. Every +3 dBi doubles effective radiated power in the beam direction. VSWR below 2:1 ensures less than 10% reflected power loss.',
        pro: 'Antenna gain is a passive redistribution of power — no real amplification. EIRP budgets must comply with regional EIRP masks. VSWR > 2:1 causes significant mismatch loss (>10%) and potential PA damage. Return loss = −20·log₁₀(|Γ|) where Γ = (VSWR−1)/(VSWR+1).',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── Tab 2: Antenna Types ─────────────────────────────────────────────────────

const ANTENNA_TYPES = [
  { icon: '📡', name: 'Dipole', dbi: '2.15 dBi', bw: '360° H / 75° V', use: 'Indoor AP omni', desc: 'The reference half-wave dipole. Omnidirectional in azimuth with a slight vertical null. Foundation for most Wi-Fi antennas.', tradeoff: 'Low gain limits range; excellent for dense indoor coverage.' },
  { icon: '🔌', name: 'Rubber Duck', dbi: '2–5 dBi', bw: '360° omni', use: 'AP & device stub', desc: 'Electrically short whip antenna, often loaded with a coil. Common on consumer APs and USB adapters.', tradeoff: 'Compact and cheap but less efficient than a full dipole.' },
  { icon: '▣', name: 'Patch', dbi: '5–10 dBi', bw: '60–100°', use: 'Directional wall mount', desc: 'Flat microstrip antenna with moderate directional gain. Flush-mountable, weather-resistant.', tradeoff: 'Good for coverage in one direction; blind behind the element.' },
  { icon: '➡', name: 'Yagi', dbi: '10–20 dBi', bw: '15–30°', use: 'Long-range P2P', desc: 'Parasitic array with driven element, reflector, and multiple directors. High gain with narrow pencil beam.', tradeoff: 'Very narrow beam requires precise alignment; poor for mobility.' },
  { icon: '🌀', name: 'Sector', dbi: '10–17 dBi', bw: '60/90/120°', use: 'Outdoor hotspot', desc: 'Panel antenna covering a defined sector. Multiple sectors tile a full 360° cell. Standard in outdoor Wi-Fi and cellular.', tradeoff: 'Requires careful sector overlap design to avoid dead zones.' },
  { icon: '🔭', name: 'Dish / Parabolic', dbi: '20–35 dBi', bw: '< 5°', use: 'PTP bridge / backhaul', desc: 'Parabolic reflector focusing all energy into a near-parallel beam. Extreme gain for long-distance links.', tradeoff: 'Alignment critical to fractions of a degree; large form factor.' },
];

function AntennaGallery() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ANTENNA_TYPES.map((a, i) => (
          <button key={a.name} onClick={() => setSelected(selected === i ? null : i)}
            className={`glass-panel p-3 rounded-xl text-left transition-all border ${selected === i ? 'border-cyan-500' : 'border-transparent hover:border-slate-600'}`}>
            <div className="text-2xl mb-1">{a.icon}</div>
            <div className="text-sm font-bold text-white">{a.name}</div>
            <div className="text-xs text-band24">{a.dbi}</div>
            <div className="text-xs text-slate-400">{a.bw}</div>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-300">{a.use}</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected !== null && (
          <motion.div key={selected} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-panel p-4 rounded-xl border border-cyan-800 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{ANTENNA_TYPES[selected].icon}</span>
              <span className="font-bold text-white">{ANTENNA_TYPES[selected].name}</span>
              <span className="text-xs text-band24 font-mono">{ANTENNA_TYPES[selected].dbi}</span>
            </div>
            <p className="text-xs text-slate-300">{ANTENNA_TYPES[selected].desc}</p>
            <p className="text-xs text-amber-400">⚠ {ANTENNA_TYPES[selected].tradeoff}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <ModeContent content={{
        kid: 'Different antennas are like different flashlights — some spread light everywhere, some shoot a super-thin beam far away. Pick the right one for the job!',
        enthusiast: 'Higher gain = narrower beamwidth. A dipole spreads energy in all directions while a dish concentrates it into a tiny spot. The tradeoff is always gain vs. coverage angle.',
        pro: 'Antenna selection drives link budget. For PTP at 5 GHz, a 30 dBi dish yields significant fade margin. Sector arrays in outdoor deployments must balance EIRP compliance, co-channel interference, and capacity per sector.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── Tab 3: Radiation Patterns ────────────────────────────────────────────────

type PatternName = 'Isotropic' | 'Dipole (V)' | 'Patch' | 'Sector 120°' | 'Yagi';
const PATTERN_OPTIONS: PatternName[] = ['Isotropic', 'Dipole (V)', 'Patch', 'Sector 120°', 'Yagi'];
const PATTERN_META: Record<PatternName, { beamwidth: string; gain: string; color: string }> = {
  'Isotropic':   { beamwidth: '360°', gain: '0 dBi',    color: '#06b6d4' },
  'Dipole (V)':  { beamwidth: '75°',  gain: '2.15 dBi', color: '#a855f7' },
  'Patch':       { beamwidth: '90°',  gain: '7 dBi',    color: '#10b981' },
  'Sector 120°': { beamwidth: '120°', gain: '14 dBi',   color: '#f59e0b' },
  'Yagi':        { beamwidth: '20°',  gain: '15 dBi',   color: '#ef4444' },
};

function patternRadius(name: PatternName, theta: number): number {
  const R = 130;
  switch (name) {
    case 'Isotropic': return R;
    case 'Dipole (V)': return R * Math.abs(Math.cos(theta));
    case 'Patch': {
      const norm = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      return (norm <= Math.PI / 2 || norm >= (3 * Math.PI) / 2)
        ? R * Math.max(0, Math.cos(norm)) : R * 0.05;
    }
    case 'Sector 120°': {
      const dev = Math.min(((((theta * 180) / Math.PI) % 360) + 360) % 360, 360 - ((((theta * 180) / Math.PI) % 360) + 360) % 360);
      return dev <= 60 ? R * Math.cos((dev * Math.PI) / 120) : R * Math.max(0, 0.05 - (dev - 60) * 0.001);
    }
    case 'Yagi': return R * Math.pow(Math.max(0, Math.cos(theta)), 4);
    default: return R;
  }
}

function buildPatternPath(name: PatternName, cx: number, cy: number): string {
  const TAU = 2 * Math.PI;
  return Array.from({ length: 361 }, (_, i) => {
    const theta = (i / 360) * TAU;
    const r = patternRadius(name, theta);
    const x = (cx + r * Math.cos(theta - Math.PI / 2)).toFixed(2);
    const y = (cy + r * Math.sin(theta - Math.PI / 2)).toFixed(2);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ') + ' Z';
}

function RadiationPatternPlot() {
  const [pattern, setPattern] = useState<PatternName>('Isotropic');
  const cx = 200, cy = 200;
  const meta = PATTERN_META[pattern];
  const path = buildPatternPath(pattern, cx, cy);
  const DB_RINGS = [35, 70, 105, 140];
  const DB_LABELS = ['-18', '-12', '-6', '0'];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-slate-400">Pattern:</label>
        <select value={pattern} onChange={(e) => setPattern(e.target.value as PatternName)}
          className="bg-surface-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none">
          {PATTERN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-slate-400">3dB Beamwidth: <span className="text-white font-mono">{meta.beamwidth}</span></span>
        <span className="text-xs text-slate-400">Peak Gain: <span className="font-mono" style={{ color: meta.color }}>{meta.gain}</span></span>
      </div>
      <div className="glass-panel p-4 rounded-xl flex justify-center">
        <svg viewBox="0 0 400 400" className="w-full max-w-sm">
          {DB_RINGS.map((r, i) => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray={i < 3 ? '3,3' : ''} />
          ))}
          {DB_LABELS.map((db, i) => (
            <text key={db} x={cx + 4} y={cy - DB_RINGS[i] + 3} fill="#475569" fontSize="8">{db} dB</text>
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 * Math.PI) / 180 - Math.PI / 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + 145 * Math.cos(a)} y2={cy + 145 * Math.sin(a)} stroke="#1e293b" strokeWidth="1" />;
          })}
          {(['0°', '90°', '180°', '270°'] as const).map((label, i) => {
            const a = (i * 90 - 90) * Math.PI / 180;
            return <text key={label} x={cx + 155 * Math.cos(a) - 8} y={cy + 155 * Math.sin(a) + 4} fill="#94a3b8" fontSize="9" textAnchor="middle">{label}</text>;
          })}
          <AnimatePresence mode="wait">
            <motion.path key={pattern} d={path} fill={meta.color} fillOpacity={0.15} stroke={meta.color} strokeWidth="2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
          </AnimatePresence>
          <circle cx={cx} cy={cy} r="3" fill={meta.color} />
        </svg>
      </div>
      <ModeContent content={{
        kid: 'The polar diagram shows where the antenna sends its signal. A circle means it goes equally in all directions. A skinny shape means it shoots like a laser!',
        enthusiast: 'Polar plots show relative gain vs. angle. The -3 dB beamwidth is measured between the two angles where power drops to half. Side lobes waste energy in undesired directions.',
        pro: 'Radiation patterns are measured in the far field (Fraunhofer region, r > 2D²/λ). The E-plane and H-plane cuts characterize the full 3D pattern. Side-lobe level (SLL) and front-to-back ratio are key metrics for interference management.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── Tab 4: Polarization ──────────────────────────────────────────────────────

type PolType = 'Vertical' | 'Horizontal' | 'LHCP' | 'RHCP';
const POL_TYPES: PolType[] = ['Vertical', 'Horizontal', 'LHCP', 'RHCP'];
const MISMATCH_ROWS = [
  { tx: 'V → V',       loss: '0 dB',      note: 'Perfect match' },
  { tx: 'V → H',       loss: '~20–30 dB', note: 'Near total rejection' },
  { tx: 'V → RHCP',    loss: '~3 dB',     note: 'Half power lost' },
  { tx: 'RHCP → RHCP', loss: '0 dB',      note: 'Perfect match' },
];

function PolarizationDemo() {
  const [pol, setPol] = useState<PolType>('Vertical');
  const isLinear = pol === 'Vertical' || pol === 'Horizontal';
  const waveColor = pol === 'Vertical' ? '#06b6d4' : '#a855f7';
  const cpColor = pol === 'RHCP' ? '#10b981' : '#f59e0b';
  const waveD = pol === 'Vertical'
    ? 'M20,75 Q40,35 60,75 Q80,115 100,75 Q120,35 140,75 Q160,115 180,75 Q200,35 220,75 Q240,115 260,75 L280,75'
    : 'M20,75 Q40,55 60,75 Q80,95 100,75 Q120,55 140,75 Q160,95 180,75 Q200,55 220,75 Q240,95 260,75 L280,75';
  const arrowY1 = pol === 'Vertical' ? 55 : 70, arrowY2 = pol === 'Vertical' ? 95 : 80;
  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {POL_TYPES.map((p) => (
          <button key={p} onClick={() => setPol(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${pol === p ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-surface-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
            {p}
          </button>
        ))}
      </div>
      <div className="glass-panel p-4 rounded-xl flex justify-center">
        <svg viewBox="0 0 300 150" className="w-full max-w-xs h-32">
          <AnimatePresence mode="wait">
            {isLinear && (
              <motion.g key={pol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <defs>
                  <marker id={`arrL${pol}`} markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill={waveColor} />
                  </marker>
                </defs>
                <motion.path d={waveD} fill="none" stroke={waveColor} strokeWidth="2.5" strokeLinecap="round"
                  animate={{ pathLength: [0, 1], opacity: [0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                {[60, 100, 140, 180, 220].map((x) => (
                  <line key={x} x1={x} y1={arrowY1} x2={x} y2={arrowY2}
                    stroke={waveColor} strokeWidth="1.2" markerEnd={`url(#arrL${pol})`} opacity={0.6} />
                ))}
                <text x="150" y="140" textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {pol === 'Vertical' ? 'E-field vertical — same as upright dipole' : 'E-field horizontal — flat dipole or panel'}
                </text>
              </motion.g>
            )}
            {!isLinear && (
              <motion.g key={pol} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <defs>
                  <marker id={`arrCP${pol}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill={cpColor} />
                  </marker>
                </defs>
                <circle cx="150" cy="70" r="40" fill="none" stroke="#334155" strokeWidth="1" />
                <motion.g animate={{ rotate: pol === 'RHCP' ? 360 : -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '150px', originY: '70px' }}>
                  <line x1="150" y1="70" x2="150" y2="30" stroke={cpColor} strokeWidth="2.5" markerEnd={`url(#arrCP${pol})`} />
                </motion.g>
                <text x="150" y="140" textAnchor="middle" fill="#94a3b8" fontSize="9">
                  {pol === 'RHCP' ? 'Right-Hand Circular Polarization (clockwise)' : 'Left-Hand Circular Polarization (counter-CW)'}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="text-xs font-semibold text-white mb-2">Polarization Mismatch Loss</div>
        <table className="w-full text-xs">
          <thead><tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-1 pr-4">Tx → Rx</th><th className="text-left py-1 pr-4">Mismatch Loss</th><th className="text-left py-1">Notes</th>
          </tr></thead>
          <tbody>{MISMATCH_ROWS.map((row) => (
            <tr key={row.tx} className="border-b border-slate-800">
              <td className="py-1.5 pr-4 font-mono text-cyan-300">{row.tx}</td>
              <td className="py-1.5 pr-4 text-amber-400 font-mono">{row.loss}</td>
              <td className="py-1.5 text-slate-400">{row.note}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="text-xs font-semibold text-white">Diversity Types</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div><span className="text-cyan-400 font-semibold">Spatial:</span> Multiple antennas separated in space; avoids simultaneous fade.</div>
          <div><span className="text-purple-400 font-semibold">Polarization:</span> H+V antennas; uncorrelated paths even co-located.</div>
          <div><span className="text-emerald-400 font-semibold">Pattern:</span> Antennas with different radiation lobes; best path selected.</div>
        </div>
      </div>
      <ModeContent content={{
        kid: 'Polarization is the direction the radio wave wiggles. Two walkie-talkies work best when both antennas point the same way. Twist one sideways and you lose signal!',
        enthusiast: 'Circular polarization is used for satellite and outdoor links to tolerate rotation and multipath. RHCP → RHCP is a perfect match; RHCP → LHCP adds ~30 dB loss.',
        pro: 'Polarization diversity is standard in enterprise APs (dual-slant ±45° elements). XPD (cross-polar discrimination) targets > 15 dB for clean MIMO stream separation. LHCP/RHCP isolation enables frequency reuse on the same beam.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── Tab 5: Beamforming ───────────────────────────────────────────────────────

const BF_ELEMENTS = [50, 90, 130, 170];
const BF_APX = 80, BF_ENDX = 480;

function BeamformingVisualizer() {
  const [steering, setSteering] = useState<number>(0);
  const rad = (steering * Math.PI) / 180;
  const beamY = 140 + Math.tan(rad) * (BF_ENDX - BF_APX);
  const phases = BF_ELEMENTS.map((_, i) => i * 2 * Math.PI * 0.5 * Math.sin(rad));
  const sectorPath = (() => {
    const baseAngle = Math.atan2(beamY - 140, BF_ENDX - BF_APX);
    const ha = 20 * Math.PI / 180, len = 380;
    const p1x = BF_APX + len * Math.cos(baseAngle - ha), p1y = 140 + len * Math.sin(baseAngle - ha);
    const p2x = BF_APX + len * Math.cos(baseAngle + ha), p2y = 140 + len * Math.sin(baseAngle + ha);
    return `M${BF_APX},140 L${p1x.toFixed(1)},${p1y.toFixed(1)} L${p2x.toFixed(1)},${p2y.toFixed(1)} Z`;
  })();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-xs text-slate-400">Steering Angle:</label>
        <input type="range" min={-60} max={60} value={steering}
          onChange={(e) => setSteering(Number(e.target.value))} className="w-40 accent-cyan-500" />
        <span className="text-xs font-mono text-cyan-400">{steering > 0 ? '+' : ''}{steering}°</span>
      </div>
      <div className="glass-panel p-4 rounded-xl overflow-x-auto">
        <svg viewBox="0 0 560 280" className="w-full">
          <motion.path d={sectorPath} fill="rgba(6,182,212,0.12)" stroke="#06b6d4" strokeWidth="1.5"
            animate={{ d: sectorPath }} transition={{ duration: 0.15 }} />
          <motion.line x1={BF_APX} y1={140} x2={BF_ENDX} y2={beamY} stroke="#06b6d4" strokeWidth="2"
            strokeDasharray="6,3" animate={{ y2: beamY }} transition={{ duration: 0.15 }} />
          {BF_ELEMENTS.map((ey, i) => (
            <g key={i}>
              <rect x={BF_APX - 6} y={ey - 10} width="12" height="20" rx="2" fill="#1e293b" stroke="#06b6d4" strokeWidth="1.5" />
              <text x={BF_APX} y={ey + 25} textAnchor="middle" fill="#94a3b8" fontSize="8">φ{i}={phases[i].toFixed(2)}</text>
              <line x1={BF_APX + 6} y1={ey} x2={BF_APX + 40} y2={ey} stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
            </g>
          ))}
          <rect x={BF_APX - 14} y={110} width="14" height="60" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x={BF_APX - 6} y={185} textAnchor="middle" fill="#94a3b8" fontSize="8">AP</text>
          <text x={BF_ENDX - 10} y={beamY - 10} fill="#06b6d4" fontSize="10" fontWeight="bold">
            {steering > 0 ? '+' : ''}{steering}°
          </text>
        </svg>
      </div>
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="text-xs font-semibold text-white">Explicit vs. Implicit Beamforming</div>
        <table className="w-full text-xs">
          <thead><tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-1 pr-4">Type</th><th className="text-left py-1 pr-4">How It Works</th><th className="text-left py-1">Requirement</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-slate-800">
              <td className="py-1.5 pr-4 text-cyan-400 font-semibold">Explicit</td>
              <td className="py-1.5 pr-4 text-slate-300">Receiver sends channel feedback (CSI/NDP) to transmitter</td>
              <td className="py-1.5 text-slate-400">802.11ac/ax capable client; sounding frames</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-4 text-purple-400 font-semibold">Implicit</td>
              <td className="py-1.5 pr-4 text-slate-300">Transmitter estimates channel from received packets (assumes reciprocity)</td>
              <td className="py-1.5 text-slate-400">TDD systems; calibrated hardware; pre-802.11n legacy</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ModeContent content={{
        kid: 'Beamforming is like pointing a spotlight at the device you want to reach. The antenna uses math to steer the beam without moving any parts!',
        enthusiast: 'Phase shifts on each antenna element create constructive interference in the target direction and destructive in others. A 4-element array can steer ±60° with ~12 dBi array gain.',
        pro: 'Phased array steering uses complex weights w_i = exp(jφ_i) per element. Grating lobes appear when d > λ/2. 802.11ac/ax explicit BF uses NDP sounding + compressed V matrix feedback (Givens rotation). MU-MIMO requires simultaneous ZF precoding across clients.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── VSWR & Impedance Matching ───────────────────────────────────────────────

const VSWR_ROWS = [
  { vswr: 1.0,  rl: '∞',    refl: '0%',   note: 'Perfect match (ideal)', color: '#10b981' },
  { vswr: 1.5,  rl: '14 dB', refl: '4%',   note: 'Excellent — antenna spec target', color: '#10b981' },
  { vswr: 2.0,  rl: '9.5 dB', refl: '11%', note: 'Acceptable for most systems', color: '#f59e0b' },
  { vswr: 2.5,  rl: '7.4 dB', refl: '18%', note: 'Borderline — check cable/connector', color: '#f59e0b' },
  { vswr: 3.0,  rl: '6 dB',  refl: '25%', note: 'Poor — significant power reflected', color: '#ef4444' },
  { vswr: 5.0,  rl: '3.5 dB', refl: '44%', note: 'Very poor — almost half power lost', color: '#ef4444' },
];

function VSWRSection() {
  const [gamma, setGamma] = useState(0.2);
  const vswr = (1 + gamma) / (1 - gamma);
  const rl = -20 * Math.log10(gamma);
  const refl = (gamma * gamma * 100).toFixed(1);

  return (
    <div className="space-y-5 mt-6">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">VSWR, Return Loss & Impedance Matching</h3>
        <p className="text-xs text-slate-400">VSWR (Voltage Standing Wave Ratio) measures how well an antenna is matched to its feedline. A perfect match = 1:1; any mismatch reflects power back toward the transmitter.</p>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-surface-900/60 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-300">Key Formulas</p>
              {[
                { label: 'Reflection Coeff.', formula: 'Γ = (Z_L − Z_0) / (Z_L + Z_0)' },
                { label: 'VSWR', formula: 'VSWR = (1 + |Γ|) / (1 − |Γ|)' },
                { label: 'Return Loss', formula: 'RL = −20 log₁₀(|Γ|)  dB' },
                { label: 'Reflected Power', formula: 'P_refl = |Γ|² × P_forward' },
              ].map(f => (
                <div key={f.label} className="flex gap-2 items-start">
                  <span className="text-xs text-slate-500 min-w-24">{f.label}</span>
                  <code className="text-xs font-mono text-band24">{f.formula}</code>
                </div>
              ))}
            </div>
            <div className="bg-surface-900/60 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-300">Standard Impedances</p>
              {[
                { z: '50 Ω', use: 'Wi-Fi, RF equipment, coax (most common)' },
                { z: '75 Ω', use: 'Cable TV, video distribution' },
                { z: '300 Ω', use: 'Folded dipole, twin-lead' },
              ].map(r => (
                <div key={r.z} className="flex gap-2">
                  <span className="font-bold font-mono text-amber-400 min-w-16 text-xs">{r.z}</span>
                  <span className="text-xs text-slate-400">{r.use}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-surface-900/60 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-300">Interactive Calculator</p>
              <div>
                <label className="text-xs text-slate-400">|Γ| reflection coefficient: <span className="font-bold text-band24">{gamma.toFixed(2)}</span></label>
                <input type="range" min="0" max="0.8" step="0.01" value={gamma}
                  onChange={e => setGamma(+e.target.value)} className="w-full accent-cyan-400 mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'VSWR', v: `${vswr.toFixed(2)}:1`, color: vswr < 1.5 ? '#10b981' : vswr < 2.5 ? '#f59e0b' : '#ef4444' },
                  { k: 'Return Loss', v: `${rl.toFixed(1)} dB`, color: rl > 14 ? '#10b981' : rl > 7 ? '#f59e0b' : '#ef4444' },
                  { k: 'Reflected', v: `${refl}%`, color: +refl < 5 ? '#10b981' : +refl < 20 ? '#f59e0b' : '#ef4444' },
                ].map(f => (
                  <div key={f.k} className="bg-surface-800/60 rounded-lg p-2 text-center">
                    <p className="text-xs text-slate-500">{f.k}</p>
                    <p className="text-sm font-bold font-mono" style={{ color: f.color }}>{f.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['VSWR', 'Return Loss', 'Reflected Power', 'Assessment'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VSWR_ROWS.map(r => (
                <tr key={r.vswr} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-bold font-mono" style={{ color: r.color }}>{r.vswr.toFixed(1)}:1</td>
                  <td className="py-1.5 px-2 text-slate-300">{r.rl}</td>
                  <td className="py-1.5 px-2 text-slate-300">{r.refl}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-panel p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-xs font-bold text-amber-400 mb-2">Connector & Cable Loss for 802.11</p>
          <div className="grid sm:grid-cols-3 gap-2 text-xs text-slate-400">
            <div><span className="text-white font-semibold">SMA/RP-SMA:</span> Indoor AP antennas, low power ({'<'} 1W). Most common on SOHO gear.</div>
            <div><span className="text-white font-semibold">N-Type:</span> Outdoor APs, sector antennas. Weather-sealed, handles up to 500W.</div>
            <div><span className="text-white font-semibold">TNC:</span> Vibration-resistant for outdoor/mobile deployments.</div>
          </div>
        </div>

        <div className="bg-surface-900/60 rounded-xl p-4 space-y-1">
          <p className="text-xs font-bold text-slate-300">Typical Cable Loss (LMR-400 per 100ft)</p>
          <div className="flex gap-4 flex-wrap text-xs">
            {[{ f: '2.4 GHz', loss: '3.9 dB' }, { f: '5 GHz', loss: '5.6 dB' }, { f: '6 GHz', loss: '6.3 dB' }].map(c => (
              <span key={c.f}><span className="text-slate-400">{c.f}:</span> <span className="font-bold text-amber-400">{c.loss}</span></span>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Keep cable runs as short as possible — every dB of cable loss reduces your effective EIRP.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chapter8 Export ─────────────────────────────────────────────────────

const CH8_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Fundamentals':       ['antbasics'],
  'Antenna Types':      ['omni', 'directional'],
  'Radiation Patterns': ['patterns'],
  'Polarization':       ['polarization', 'vswr'],
  'Beamforming':        ['beamforming'],
};

export function Chapter8() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Fundamentals');
  useSubtopicNav(CH8_TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    CH8_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch8', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <ChapterHeader chapter={CHAPTER} description="Antenna gain, radiation patterns, polarization diversity and beamforming — the RF design layer beneath every 802.11 deployment." />
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${activeTab === tab ? 'border-band24 text-band24' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Fundamentals'       && <FundamentalsTab />}
          {activeTab === 'Antenna Types'      && <AntennaGallery />}
          {activeTab === 'Radiation Patterns' && <RadiationPatternPlot />}
          {activeTab === 'Polarization'       && <><PolarizationDemo /><VSWRSection /></>}
          {activeTab === 'Beamforming'        && <BeamformingVisualizer />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
