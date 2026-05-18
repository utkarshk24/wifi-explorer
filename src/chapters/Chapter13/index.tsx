import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeContent, ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch13')!;
const TABS = ['Copper Media', 'Fiber Optics', 'Line Coding'] as const;
type Tab = typeof TABS[number];

const CH13_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Copper Media': ['copper_media'],
  'Fiber Optics': ['fiber_optics'],
  'Line Coding':  ['line_coding'],
};

// ─── Waveform generators ──────────────────────────────────────────────────────

const BITS = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1];

function manchesterPts(W: number, H: number): string {
  const mid = H / 2, amp = H * 0.37, bw = W / BITS.length;
  const pts: string[] = [];
  BITS.forEach((b, i) => {
    const x0 = i * bw, xm = x0 + bw / 2, x1 = (i + 1) * bw;
    if (b === 1) {
      pts.push(`${x0},${mid + amp}`, `${xm},${mid + amp}`, `${xm},${mid - amp}`, `${x1 - 0.5},${mid - amp}`);
    } else {
      pts.push(`${x0},${mid - amp}`, `${xm},${mid - amp}`, `${xm},${mid + amp}`, `${x1 - 0.5},${mid + amp}`);
    }
  });
  return pts.join(' ');
}

function pam5Pts(W: number, H: number): string {
  const map: Record<number, number> = { 0: -2, 1: -1, 2: 1, 3: 2 };
  const symbols = Array.from({ length: BITS.length / 2 }, (_, i) => map[BITS[i * 2] * 2 + BITS[i * 2 + 1]]);
  const mid = H / 2, scale = H * 0.17, sw = W / symbols.length;
  const pts: string[] = [];
  symbols.forEach((lvl, i) => {
    const x0 = i * sw + sw * 0.08, x1 = (i + 1) * sw - sw * 0.08;
    const y = mid - lvl * scale;
    if (i > 0) {
      const prevLvl = symbols[i - 1];
      const py = mid - prevLvl * scale;
      pts.push(`${x0},${py}`, `${x0},${y}`);
    }
    pts.push(`${x0},${y}`, `${x1},${y}`);
  });
  return pts.join(' ');
}

function pam16Pts(W: number, H: number): string {
  const symbols = Array.from({ length: BITS.length / 4 }, (_, i) => {
    const nibble = BITS[i * 4] * 8 + BITS[i * 4 + 1] * 4 + BITS[i * 4 + 2] * 2 + BITS[i * 4 + 3];
    return nibble - 7.5;
  });
  const mid = H / 2, scale = H * 0.044, sw = W / symbols.length;
  const pts: string[] = [];
  symbols.forEach((lvl, i) => {
    const x0 = i * sw + sw * 0.05, x1 = (i + 1) * sw - sw * 0.05;
    const y = mid - lvl * scale;
    if (i > 0) {
      const py = mid - symbols[i - 1] * scale;
      pts.push(`${x0},${py}`, `${x0},${y}`);
    }
    pts.push(`${x0},${y}`, `${x1},${y}`);
  });
  return pts.join(' ');
}

// ─── Tab 1: Copper Media ──────────────────────────────────────────────────────

const CAT_SPECS = [
  { cat: 'Cat5e', freq: 100, speed: '1 Gbps', reach: '100 m', next: '35.3', atten: '22.0', pairs: 4, awg: 24 },
  { cat: 'Cat6',  freq: 250, speed: '10 Gbps', reach: '55 m', next: '44.3', atten: '19.8', pairs: 4, awg: '23–24' },
  { cat: 'Cat6A', freq: 500, speed: '10 Gbps', reach: '100 m', next: '54.0', atten: '20.1', pairs: 4, awg: 23 },
  { cat: 'Cat8',  freq: 2000, speed: '40 Gbps', reach: '30 m', next: '62.0', atten: '40.5', pairs: 4, awg: 22 },
];

function CableSignalSim() {
  const [freq, setFreq] = useState(100);
  const [dist, setDist] = useState(50);
  const [cat, setCat] = useState<'Cat5e' | 'Cat6' | 'Cat6A'>('Cat6');

  const k = { Cat5e: 0.0220, Cat6: 0.0198, Cat6A: 0.0201 }[cat];
  const atten = +(k * Math.sqrt(freq) * (dist / 100) * 100).toFixed(1);
  const next = +(40 - 15 * Math.log10(freq / 100)).toFixed(1);
  const snr = +(next - atten).toFixed(1);

  const W = 460, H = 110;
  const signalAmp = Math.max(8, 44 * Math.exp(-atten / 30));
  const nextAmp = Math.max(2, 18 * Math.exp(-atten / 50));

  const signalPts = useMemo(() => {
    const cycles = Math.round(freq / 50);
    return Array.from({ length: 200 }, (_, i) => {
      const x = (i / 199) * W;
      const decay = Math.exp(-3 * i / 199);
      const y = 38 - signalAmp * decay * Math.sin((i / 199) * Math.PI * 2 * cycles);
      return `${x},${y}`;
    }).join(' ');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq, atten, signalAmp]);

  const nextPts = useMemo(() => {
    const cycles = Math.round(freq / 50);
    return Array.from({ length: 200 }, (_, i) => {
      const x = (i / 199) * W;
      const coupling = Math.exp(-8 * i / 199); // NEXT is strongest at near end
      const y = 82 - nextAmp * coupling * Math.sin((i / 199) * Math.PI * 2 * cycles + 0.4);
      return `${x},${y}`;
    }).join(' ');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq, nextAmp]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {(['Cat5e', 'Cat6', 'Cat6A'] as const).map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
              cat === c ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400">Frequency: <span className="text-amber-300 font-mono">{freq} MHz</span></label>
          <input type="range" min={1} max={500} value={freq} onChange={e => setFreq(+e.target.value)}
            className="w-full accent-amber-400 mt-1" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Cable Length: <span className="text-amber-300 font-mono">{dist} m</span></label>
          <input type="range" min={1} max={100} value={dist} onChange={e => setDist(+e.target.value)}
            className="w-full accent-amber-400 mt-1" />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="#1e293b" strokeWidth="1" />
          ))}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={W * f} y1={0} x2={W * f} y2={H} stroke="#1e293b" strokeWidth="1" />
          ))}
          {/* Labels */}
          <text x="6" y="12" fontSize="7" fill="#64748b">Pair 1 — Signal (TX)</text>
          <text x="6" y="75" fontSize="7" fill="#64748b">Pair 3 — NEXT Coupling</text>
          {/* Pair divider */}
          <line x1={0} y1={H * 0.52} x2={W} y2={H * 0.52} stroke="#334155" strokeWidth="0.5" strokeDasharray="4 4" />
          {/* Signal waveform */}
          <motion.polyline key={`sig-${freq}-${dist}-${cat}`} points={signalPts}
            fill="none" stroke="#06b6d4" strokeWidth="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
          {/* NEXT waveform */}
          <motion.polyline key={`nxt-${freq}-${dist}-${cat}`} points={nextPts}
            fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="3 1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} />
          {/* Legend */}
          <line x1={W - 80} y1="6" x2={W - 65} y2="6" stroke="#06b6d4" strokeWidth="1.5" />
          <text x={W - 62} y="9" fontSize="6.5" fill="#94a3b8">Signal</text>
          <line x1={W - 80} y1="14" x2={W - 65} y2="14" stroke="#f97316" strokeWidth="1" strokeDasharray="3 1" />
          <text x={W - 62} y="17" fontSize="6.5" fill="#94a3b8">NEXT</text>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Insertion Loss', val: `${atten} dB`, ok: atten < 20, warn: atten < 35, note: '≤ limit' },
          { label: 'NEXT',           val: `${next} dB`,  ok: next > 44,  warn: next > 35,  note: 'higher = better' },
          { label: 'Signal-to-NEXT', val: `${snr} dB`,   ok: snr > 10,   warn: snr > 0,   note: 'margin' },
        ].map(m => (
          <div key={m.label} className={`glass-panel p-3 border text-center rounded-xl ${
            m.ok ? 'border-emerald-500/30' : m.warn ? 'border-amber-500/30' : 'border-red-500/40'
          }`}>
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-xl font-mono font-bold mt-0.5 ${m.ok ? 'text-emerald-400' : m.warn ? 'text-amber-400' : 'text-red-400'}`}>{m.val}</p>
            <p className="text-xs text-slate-600 mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopperTab() {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">Twisted Pair Cable Specifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                {['Category', 'Bandwidth', 'Max Speed', 'Reach', 'NEXT@100MHz (dB)', 'Atten/100m (dB)', 'AWG'].map(h => (
                  <th key={h} className="pb-2 pr-4 text-left text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAT_SPECS.map(row => (
                <tr key={row.cat} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 font-bold text-amber-300">{row.cat}</td>
                  <td className="py-2 pr-4 font-mono text-slate-300">{row.freq} MHz</td>
                  <td className="py-2 pr-4 text-slate-300">{row.speed}</td>
                  <td className="py-2 pr-4 text-slate-300">{row.reach}</td>
                  <td className="py-2 pr-4 font-mono text-cyan-400">{row.next}</td>
                  <td className="py-2 pr-4 font-mono text-orange-400">{row.atten}</td>
                  <td className="py-2 pr-4 text-slate-400">{row.awg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">Interactive Signal Degradation Simulator</h3>
        <p className="text-xs text-slate-400">Adjust frequency and cable length to see how signal quality degrades and NEXT coupling changes.</p>
        <CableSignalSim />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { term: 'NEXT (Near-End Crosstalk)', color: '#f97316', icon: '📡',
            kid: 'Imagine two phone calls happening on wires sitting next to each other — NEXT is when one call\'s signal "leaks" into the other wire at the START of the cable, causing interference.',
            enthusiast: 'NEXT is interference caused by electromagnetic coupling between adjacent wire pairs measured at the transmitting end. It\'s worse at higher frequencies and shorter twists.',
            pro: 'NEXT (dB) = 10 log₁₀(P_signal/P_noise). Measured at the near end where signal is strongest. TIA-568-C.2 specifies minimum NEXT limits per category. A-NEXT = Alien NEXT from adjacent cables.' },
          { term: 'FEXT (Far-End Crosstalk)', color: '#a855f7', icon: '📶',
            kid: 'Like NEXT but the leakage happens at the FAR end of the cable — at the receiver side.',
            enthusiast: 'FEXT is crosstalk measured at the far end. Combined with cable attenuation, it\'s expressed as ELFEXT (Equal Level FEXT) = FEXT - attenuation.',
            pro: 'ELFEXT = FEXT_dB - Attenuation_dB. PS-ELFEXT (Power Sum ELFEXT) combines all pair combinations: -ELFEXT(i) = -10 log₁₀(Σ10^(-ELFEXTij/10)). Cat6A spec: PS-ELFEXT ≥ 23 dB @ 500 MHz.' },
        ].map(t => (
          <div key={t.term} className="glass-panel p-4 border rounded-xl space-y-2" style={{ borderColor: t.color + '40' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.icon}</span>
              <span className="font-bold text-sm text-white">{t.term}</span>
            </div>
            <ModeContent content={{ kid: t.kid, enthusiast: t.enthusiast, pro: t.pro }}
              className="text-xs text-slate-400 leading-relaxed" />
          </div>
        ))}
      </div>

      <div className="glass-panel p-4 border-glow-amber">
        <h4 className="font-bold text-sm text-white mb-2">Attenuation Formula</h4>
        <ModeContent content={{
          kid: 'The longer and faster the signal, the more it weakens. It\'s like shouting down a very long hallway — the further you go, the quieter it gets!',
          enthusiast: 'Attenuation increases with distance and frequency. Rule of thumb: if frequency doubles, attenuation increases by ~√2 (3 dB). Cat6 allows 19.8 dB/100m at 100 MHz.',
          pro: 'Attenuation (dB) ≈ k · √f · d/100\n\nWhere: k = cable constant (Cat6: 0.0198), f = frequency (MHz), d = length (m). Full model includes DC resistance, inductance, capacitance (RLCG). Skin effect dominates at high frequencies — current crowds to conductor surface, increasing resistance.'
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Tab 2: Fiber Optics ──────────────────────────────────────────────────────

const FIBER_TYPES = [
  { id: 'sm', name: 'Single-Mode (OS2)', core: 9, clad: 125, color: '#fbbf24', wavelength: '1310/1550 nm',
    source: 'Laser (VCSEL/FP)', reach: 'Up to 40+ km', bandwidth: 'Virtually unlimited', modes: 1,
    dispersion: 'Chromatic only', use: 'Long-haul, carrier, campus backbone',
    kid: 'Single-mode is like a laser pointer — the light travels in one perfectly straight line for MILES without getting fuzzy!',
    enthusiast: 'In single-mode, the core (9μm) is so narrow that only one light ray can propagate, eliminating modal dispersion. Lasers (not LEDs) are required. Used in data centers for runs over 300m and WANs.',
    pro: 'Core/clad: 9/125 μm. Numerical Aperture: 0.10–0.14. Chromatic dispersion: 17 ps/(nm·km) @ 1550nm, zero dispersion at 1310nm. Attenuation: 0.2 dB/km @ 1550nm. Standards: ITU-T G.652 (OS1), G.657 (OS2, bend-insensitive). Connectors: LC, SC, FC, MPO (for ribbon).' },
  { id: 'mmg', name: 'Multi-Mode OM3/OM4', core: 50, clad: 125, color: '#a78bfa', wavelength: '850/1300 nm',
    source: 'VCSEL (850nm)', reach: 'Up to 400m (OM4)', bandwidth: '4700 MHz·km (OM4)', modes: 100,
    dispersion: 'Modal + Chromatic', use: 'Data center, building backbone',
    kid: 'Multi-mode is like shining a flashlight in a tunnel — the light bounces around everywhere and gets blurry over distance.',
    enthusiast: 'Multi-mode fiber uses a wider 50μm core where many light rays travel at different angles (modes). Modal dispersion limits reach. OM3 (aqua): 300m at 10G. OM4 (violet): 400m at 10G. OM5 (lime): 300m at 100G SWDM4.',
    pro: 'Core/clad: 50/125 μm (OM3/4/5) or 62.5/125 μm (OM1/2). Numerical Aperture: 0.20–0.29. Modal bandwidth: 2000 MHz·km (OM3), 4700 MHz·km (OM4). EMB (Effective Modal Bandwidth) measured with launch condition. VCSEL (Vertical Cavity Surface Emitting Laser) = 850nm, low cost, direct modulation.' },
];

function FiberRayAnim({ type }: { type: typeof FIBER_TYPES[0] }) {
  const isSM = type.id === 'sm';
  const coreW = isSM ? 8 : 40;
  const W = 420, H = 80;
  const cladY = (H - 70) / 2, coreY = (H - coreW) / 2;
  const rays = isSM
    ? [{ angle: 0, color: '#fbbf24', phase: 0 }]
    : [
        { angle: 0, color: '#a78bfa', phase: 0 },
        { angle: 12, color: '#818cf8', phase: 0.3 },
        { angle: -12, color: '#c084fc', phase: 0.6 },
        { angle: 22, color: '#7c3aed', phase: 0.9 },
      ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg" style={{ background: '#0a0f1e' }}>
      {/* Cladding */}
      <rect x="10" y={cladY} width={W - 20} height={70} rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      {/* Core */}
      <rect x="10" y={coreY} width={W - 20} height={coreW} rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
      {/* Labels */}
      <text x="14" y={cladY + 10} fontSize="6" fill="#475569">Cladding {type.clad}μm</text>
      <text x="14" y={coreY + coreW / 2 + 3} fontSize="6" fill="#64748b">Core {type.core}μm</text>

      {/* Ray paths */}
      {rays.map((ray, ri) => {
        if (isSM) {
          return (
            <motion.line key={ri} x1={10} y1={H / 2} x2={W - 10} y2={H / 2}
              stroke={ray.color} strokeWidth="1.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: ray.phase, repeat: Infinity, repeatDelay: 0.8 }} />
          );
        }
        // Bouncing ray for MM
        const period = 120, yMid = H / 2, amp = (coreW / 2 - 4);
        const pts: string[] = [];
        for (let x = 10; x <= W - 10; x += 5) {
          const y = yMid + amp * Math.sin(((x - 10) / period) * Math.PI * 2 + ray.phase * Math.PI * 2 + ri * 0.7);
          pts.push(`${x},${y}`);
        }
        return (
          <motion.polyline key={ri} points={pts.join(' ')}
            fill="none" stroke={ray.color} strokeWidth="1" opacity="0.7"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.5 + ri * 0.2, delay: ray.phase, repeat: Infinity, repeatDelay: 0.5 }} />
        );
      })}

      {/* Pulse broadening indication for MM */}
      {!isSM && (
        <>
          <text x={W - 80} y={cladY + 10} fontSize="6" fill="#ef4444">← Modal Dispersion</text>
          <text x={W - 80} y={cladY + 18} fontSize="5.5" fill="#64748b">(pulse broadening)</text>
        </>
      )}
    </svg>
  );
}

function FiberTab() {
  const [selected, setSelected] = useState(FIBER_TYPES[0]);
  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {FIBER_TYPES.map(f => (
          <button key={f.id} onClick={() => setSelected(f)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              selected.id === f.id ? 'text-white scale-105' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            style={selected.id === f.id ? { borderColor: f.color + '60', background: f.color + '20', color: f.color } : {}}>
            {f.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 border space-y-4" style={{ borderColor: selected.color + '40' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { l: 'Core/Clad', v: `${selected.core}/${selected.clad} μm` },
              { l: 'Wavelength', v: selected.wavelength },
              { l: 'Light Source', v: selected.source },
              { l: 'Max Reach', v: selected.reach },
            ].map(m => (
              <div key={m.l} className="bg-surface-800 rounded-lg p-2.5 text-center">
                <p className="text-slate-500">{m.l}</p>
                <p className="font-mono font-bold text-white mt-0.5" style={{ color: selected.color }}>{m.v}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">Ray Propagation Simulation</p>
            <FiberRayAnim type={selected} />
            <p className="text-xs text-slate-600 mt-1 text-center">
              {selected.id === 'sm'
                ? 'Single ray propagates in a straight line — zero modal dispersion'
                : 'Multiple modes propagate at different angles, arriving at different times (modal dispersion)'}
            </p>
          </div>

          <ModeContent content={{ kid: selected.kid, enthusiast: selected.enthusiast, pro: selected.pro }}
            className="text-xs text-slate-400 leading-relaxed" />
        </motion.div>
      </AnimatePresence>

      <div className="glass-panel p-4 border-glow-amber space-y-3">
        <h4 className="font-bold text-sm text-white">Total Internal Reflection (TIR)</h4>
        <div className="flex gap-4 items-center">
          <svg viewBox="0 0 220 120" className="w-56 flex-shrink-0">
            {/* Core */}
            <rect x="10" y="40" width="200" height="40" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="2" />
            {/* Cladding above/below */}
            <rect x="10" y="10" width="200" height="30" fill="#1e293b" stroke="#334155" strokeWidth="0.5" rx="2" />
            <rect x="10" y="80" width="200" height="30" fill="#1e293b" stroke="#334155" strokeWidth="0.5" rx="2" />
            <text x="14" y="30" fontSize="7" fill="#64748b">Cladding (n₂=1.46)</text>
            <text x="14" y="62" fontSize="7" fill="#475569">Core (n₁=1.48)</text>
            {/* TIR ray */}
            <polyline points="10,80 60,40 120,80 180,40 210,58" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            {/* Angle labels */}
            <text x="56" y="38" fontSize="6.5" fill="#06b6d4">θ &lt; θc</text>
            {/* Reflected rays */}
            <line x1="60" y1="40" x2="80" y2="60" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" opacity="0.4" />
            <text x="82" y="68" fontSize="6" fill="#475569">refracted (evanescent)</text>
          </svg>
          <div className="text-xs text-slate-400 space-y-1.5">
            <p>When light hits the core-cladding boundary at an angle less than the <span className="text-amber-300 font-bold">critical angle (θc)</span>, it is totally reflected back.</p>
            <p className="font-mono bg-surface-800 p-1.5 rounded text-amber-200">sin(θc) = n₂ / n₁</p>
            <p>For n₁=1.48 (core), n₂=1.46 (clad): θc ≈ <span className="text-cyan-400">80.6°</span></p>
            <p className="text-slate-500">Numerical Aperture: NA = √(n₁² − n₂²)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Line Coding ───────────────────────────────────────────────────────

const ENCODINGS = [
  { id: 'manchester', name: 'Manchester', std: '10BASE-T', rate: '10 Mbps', baud: '20 MBd',
    color: '#06b6d4', genPts: manchesterPts,
    kid: 'Manchester is like a light switch — every bit has a flip in the middle! "On-then-off" = 0, "off-then-on" = 1. It\'s simple but uses double the bandwidth.',
    enthusiast: 'Manchester encoding uses a mid-bit transition for every bit. "1" = rising edge at midpoint, "0" = falling edge. It\'s self-clocking (no separate clock line) but requires 2× bandwidth of data rate: 10 Mbps needs 20 MHz signaling.',
    pro: 'IEEE 802.3 Clause 7 (10BASE-T). Differential Manchester (1 = no transition at start, 0 = transition at start). Guaranteed transitions every bit period for DC balance and clock recovery. Baud rate = 2 × bit rate. Spectral null at 0 Hz and at baud rate. DC-balanced = no transformer saturation.' },
  { id: 'pam5', name: 'PAM-5', std: '1000BASE-T', rate: '1 Gbps', baud: '125 MBd × 4 pairs',
    color: '#a855f7', genPts: pam5Pts,
    kid: 'Instead of just 0 and 1, PAM-5 uses 5 different voltage levels (-2,-1,0,+1,+2). Each "level" carries 2 bits at once — that\'s twice as efficient!',
    enthusiast: 'PAM-5 sends 2 bits per symbol using 5 voltage levels. On 4 pairs simultaneously at 125 Mbaud: 4 × 125M × 2 bits = 1 Gbps. The ±2 levels carry encoded data plus error correction (Trellis coding).',
    pro: 'IEEE 802.3 Clause 40 (1000BASE-T). Symbols: {-2,-1,0,+1,+2}. 4D Trellis Coded Modulation: 4 pairs treated as single 4D channel with rate-8/9 convolutional code. Dual-duplex on each pair using echo cancellation + NEXT cancellation. SNR requirement: ~22 dB. 125 MHz Nyquist bandwidth per pair.' },
  { id: 'pam16', name: 'PAM-16', std: '10GBASE-T', rate: '10 Gbps', baud: '800 MBd × 4 pairs',
    color: '#f59e0b', genPts: pam16Pts,
    kid: 'PAM-16 takes it further — 16 levels, 4 bits per symbol! It\'s incredibly efficient but needs VERY clean cables (Cat6A) because all 16 levels must be distinguishable.',
    enthusiast: 'PAM-16 encodes 4 bits per symbol. At 800 Mbaud per pair × 4 pairs = 12.8 Gbps raw, minus FEC overhead = 10 Gbps. Requires Cat6A at 500 MHz, tight SNR margins, and Tomlinson-Harashima Precoding for ISI compensation.',
    pro: 'IEEE 802.3 Clause 55 (10GBASE-T). LDPC (Low-Density Parity-Check) code: rate 2048/2057, t=10. THP (Tomlinson-Harashima Precoding) compensates ISI. DSQ128 constellation: 128 points in 4D space. Bandwidth: 400 MHz (Nyquist @ 800 MBd). SNR required: ≥30 dB. Latency: ~2.56μs (vs 0.1μs for 1G). Power: 5-10W per port.' },
];

function LineCodingTab() {
  const [enc, setEnc] = useState(ENCODINGS[0]);
  const W = 480, H = 90;

  const pts = useMemo(() => enc.genPts(W, H), [enc]);

  const symbolCount = enc.id === 'manchester' ? BITS.length : enc.id === 'pam5' ? BITS.length / 2 : BITS.length / 4;
  const levels = enc.id === 'manchester' ? 2 : enc.id === 'pam5' ? 5 : 16;
  const bitsPerSymbol = Math.log2(levels);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {ENCODINGS.map(e => (
          <button key={e.id} onClick={() => setEnc(e)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              enc.id === e.id ? 'text-white scale-105' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            style={enc.id === e.id ? { borderColor: e.color + '60', background: e.color + '20', color: e.color } : {}}>
            {e.name}
            <span className="font-mono text-xs opacity-70">({e.std})</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={enc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 border space-y-4" style={{ borderColor: enc.color + '40' }}>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 text-xs text-center">
            {[
              { l: 'Data Rate', v: enc.rate },
              { l: 'Baud Rate', v: enc.baud },
              { l: 'Bits/Symbol', v: bitsPerSymbol },
              { l: 'Voltage Levels', v: levels },
            ].map(m => (
              <div key={m.l} className="bg-surface-800 rounded-lg p-2">
                <p className="text-slate-500">{m.l}</p>
                <p className="font-bold mt-0.5" style={{ color: enc.color }}>{m.v}</p>
              </div>
            ))}
          </div>

          {/* Input bit display */}
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Input data (16 bits):</p>
            <div className="flex gap-px flex-wrap">
              {BITS.map((b, i) => (
                <span key={i} className={`w-7 h-6 flex items-center justify-center text-xs font-mono rounded font-bold ${
                  b ? 'bg-slate-700 text-cyan-300' : 'bg-slate-800 text-slate-400'
                }`}>{b}</span>
              ))}
              <span className="ml-2 text-xs text-slate-600 self-center">→ {symbolCount} symbols @ {bitsPerSymbol} bits/sym</span>
            </div>
          </div>

          {/* Oscilloscope */}
          <div className="rounded-xl overflow-hidden border border-slate-700" style={{ background: '#020713' }}>
            <div className="px-3 pt-2 flex items-center justify-between">
              <span className="text-xs font-mono" style={{ color: enc.color }}>{enc.name} Waveform — {enc.std}</span>
              <span className="text-xs font-mono text-slate-600">t →</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              {/* Oscilloscope grid */}
              {[1, 2, 3, 4].map(i => (
                <line key={`h${i}`} x1={0} y1={H * i / 5} x2={W} y2={H * i / 5}
                  stroke="#0f2040" strokeWidth="0.8" />
              ))}
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <line key={`v${i}`} x1={W * i / 8} y1={0} x2={W * i / 8} y2={H}
                  stroke="#0f2040" strokeWidth="0.8" />
              ))}
              {/* Center (0V) line */}
              <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#1e3a5f" strokeWidth="1" />
              {/* Voltage level guides for PAM */}
              {enc.id === 'pam5' && [-2, -1, 1, 2].map(lvl => (
                <line key={lvl} x1={0} y1={H / 2 - lvl * H * 0.17} x2={W}
                  y2={H / 2 - lvl * H * 0.17} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
              ))}
              {/* Waveform */}
              <motion.polyline key={enc.id} points={pts} fill="none"
                stroke={enc.color} strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeInOut' }} />
              {/* Bit labels on top */}
              {enc.id === 'manchester' && BITS.map((b, i) => (
                <text key={i} x={(i + 0.5) * W / BITS.length} y="8" textAnchor="middle"
                  fontSize="6.5" fill={b ? '#06b6d4' : '#64748b'} fontFamily="JetBrains Mono">{b}</text>
              ))}
            </svg>
          </div>

          <ModeContent content={{ kid: enc.kid, enthusiast: enc.enthusiast, pro: enc.pro }}
            className="text-xs text-slate-400 leading-relaxed" />
        </motion.div>
      </AnimatePresence>

      <div className="glass-panel p-4 border-glow-amber">
        <h4 className="font-bold text-sm text-white mb-2">Bandwidth Efficiency Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                {['Encoding', 'Standard', 'Bits/Symbol', 'Baud Rate', 'Signal BW', 'Cat Req.'].map(h => (
                  <th key={h} className="pb-2 pr-3 text-left text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { enc: 'Manchester', std: '10BASE-T', bps: 1, baud: '20 MHz', bw: '10 MHz', cat: 'Cat3+' },
                { enc: '4B5B+MLT-3', std: '100BASE-TX', bps: 1.6, baud: '31.25 MHz', bw: '31 MHz', cat: 'Cat5+' },
                { enc: 'PAM-5', std: '1000BASE-T', bps: 2, baud: '125 MHz × 4', bw: '125 MHz', cat: 'Cat5e+' },
                { enc: 'PAM-16', std: '10GBASE-T', bps: 4, baud: '800 MHz × 4', bw: '400 MHz', cat: 'Cat6A+' },
              ].map(r => (
                <tr key={r.enc} className="border-b border-slate-800/40">
                  <td className="py-1.5 pr-3 font-bold text-white">{r.enc}</td>
                  <td className="py-1.5 pr-3 font-mono text-amber-300">{r.std}</td>
                  <td className="py-1.5 pr-3 text-cyan-400">{r.bps}</td>
                  <td className="py-1.5 pr-3 font-mono text-slate-300">{r.baud}</td>
                  <td className="py-1.5 pr-3 text-slate-300">{r.bw}</td>
                  <td className="py-1.5 pr-3 text-slate-400">{r.cat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Main Chapter Component ───────────────────────────────────────────────────

export function Chapter13() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Copper Media');

  useEffect(() => {
    (CH13_TAB_SUBTOPICS[activeTab] ?? []).forEach(id => markComplete('ch13', id));
  }, [activeTab, markComplete]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ChapterHeader chapter={CHAPTER}
        description="Deep-dive into IEEE 802.3 physical layer: copper twisted-pair mechanics, fiber optics with total internal reflection, and the full line-coding evolution from Manchester to PAM-16." />

      <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'Copper Media' && <CopperTab />}
          {activeTab === 'Fiber Optics' && <FiberTab />}
          {activeTab === 'Line Coding'  && <LineCodingTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
