import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch1')!;

// ─── Wave Simulator ───────────────────────────────────────────────────────────
function WaveSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freq, setFreq]       = useState(2.4);
  const [amplitude, setAmplitude] = useState(50);
  const [obstacle, setObstacle]   = useState<'none' | 'wood' | 'concrete' | 'glass'>('none');
  const frameRef = useRef(0);
  const tRef     = useRef(0);
  const ATTENUATION = { none: 1, glass: 0.7, wood: 0.45, concrete: 0.2 };
  const freqColor = freq <= 2.45 ? '#06b6d4' : freq <= 5.9 ? '#a855f7' : '#10b981';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width; const H = canvas.height;
    const atten = ATTENUATION[obstacle];
    const draw = () => {
      tRef.current += 0.04;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(10,15,30,0.98)';
      ctx.fillRect(0, 0, W, H);
      if (obstacle !== 'none') {
        const wallColors = { wood: '#92400e', concrete: '#475569', glass: '#0ea5e9' };
        ctx.fillStyle = wallColors[obstacle] + '55';
        ctx.strokeStyle = wallColors[obstacle] + 'aa';
        ctx.lineWidth = 2;
        ctx.fillRect(W * 0.55 - 8, 0, 16, H);
        ctx.strokeRect(W * 0.55 - 8, 0, 16, H);
        ctx.fillStyle = wallColors[obstacle] + 'cc';
        ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(obstacle.toUpperCase(), W * 0.55, H - 10);
      }
      const cycles = freq / 0.8;
      ctx.beginPath(); ctx.lineWidth = 2.5;
      for (let x = 0; x < W; x++) {
        const wall = W * 0.55;
        const att = obstacle !== 'none' && x > wall ? atten : 1;
        const decay = obstacle !== 'none' && x > wall ? Math.exp(-(x - wall) / (W * 0.35)) : 1;
        const a = amplitude * att * (x / W < 0.55 ? 1 : decay);
        const y = H / 2 - a * Math.sin(cycles * 2 * Math.PI * (x / W) - tRef.current);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, freqColor);
      grad.addColorStop(obstacle !== 'none' ? 0.55 : 1, freqColor);
      if (obstacle !== 'none') grad.addColorStop(1, freqColor + '40');
      ctx.strokeStyle = grad; ctx.shadowColor = freqColor; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(20, H / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = freqColor; ctx.shadowColor = freqColor; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [freq, amplitude, obstacle, freqColor]);

  const bandLabel = freq <= 2.5 ? '2.4 GHz' : freq <= 6.0 ? '5 GHz' : '6 GHz';
  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">Interactive RF Wave Simulator</h3>
        <span className="text-xs px-3 py-1 rounded-full border" style={{ color: freqColor, borderColor: freqColor + '50', background: freqColor + '15' }}>
          {bandLabel} · {amplitude}% amp · {obstacle !== 'none' ? obstacle : 'open air'}
        </span>
      </div>
      <canvas ref={canvasRef} width={700} height={140} className="w-full rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Frequency: <span className="font-bold" style={{ color: freqColor }}>{freq.toFixed(1)} GHz</span></label>
          <input type="range" min="2.4" max="7.0" step="0.1" value={freq} onChange={e => setFreq(+e.target.value)} className="w-full accent-cyan-500" />
          <div className="flex justify-between text-xs text-slate-600 mt-0.5"><span>2.4</span><span>5</span><span>6E/7</span></div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Signal Strength: <span className="font-bold text-white">{amplitude}%</span></label>
          <input type="range" min="10" max="80" step="5" value={amplitude} onChange={e => setAmplitude(+e.target.value)} className="w-full accent-purple-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Wall Obstacle</label>
          <div className="grid grid-cols-2 gap-1">
            {(['none','glass','wood','concrete'] as const).map(o => (
              <button key={o} onClick={() => setObstacle(o)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${obstacle === o ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                {o === 'none' ? '✅ None' : o === 'glass' ? '🪟 Glass' : o === 'wood' ? '🌲 Wood' : '🧱 Concrete'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: RF Basics ─────────────────────────────────────────────────────────
function RFBasicsTab() {
  return (
    <div className="space-y-6">
      <WaveSimulator />

      {/* EM Spectrum */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">EM Spectrum & Wi-Fi Frequency Bands</h3>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1 min-w-max pb-2" style={{ minWidth: 560 }}>
            {[
              { label: 'AM Radio', f: '0.5 MHz', color: '#475569', h: 20 },
              { label: 'FM Radio', f: '100 MHz', color: '#64748b', h: 30 },
              { label: '2.4 GHz\n802.11b/g/n/ax', f: '2.4 GHz', color: '#06b6d4', h: 80 },
              { label: '5 GHz\n802.11a/n/ac/ax', f: '5 GHz', color: '#a855f7', h: 90 },
              { label: '6 GHz\n802.11ax/be', f: '6 GHz', color: '#10b981', h: 95 },
              { label: '60 GHz\n802.11ad/ay', f: '60 GHz', color: '#f59e0b', h: 70 },
              { label: 'Infrared', f: '300 GHz', color: '#ef4444', h: 50 },
              { label: 'Visible Light', f: '600 THz', color: '#ec4899', h: 40 },
            ].map((b, i) => (
              <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center gap-1" style={{ transformOrigin: 'bottom' }}>
                <div className="w-16 rounded-t-lg flex items-end justify-center pb-1"
                  style={{ height: b.h, background: b.color + '22', border: `1px solid ${b.color}50` }}>
                </div>
                <div className="text-center" style={{ width: 64 }}>
                  <div className="font-bold text-white whitespace-pre-wrap text-center leading-tight" style={{ fontSize: '7px', color: b.color }}>{b.label}</div>
                  <div className="text-slate-600 mt-0.5" style={{ fontSize: '7px' }}>{b.f}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            { band: '2.4 GHz', icon: '📶', color: '#06b6d4', props: ['83.5 MHz wide (2.400–2.4835 GHz)', '14 channels (22 MHz each)', 'Only 3 non-overlapping: 1, 6, 11', 'Used by 802.11b/g/n/ax (Wi-Fi 6)', 'Longer range, more wall penetration', 'Very congested (microwaves, BT, neighbors)'] },
            { band: '5 GHz', icon: '📡', color: '#a855f7', props: ['~500 MHz usable (UNII-1/2/2e/3)', '25 non-overlapping 20 MHz channels', 'DFS channels (5250–5725 MHz)', 'Used by 802.11a/n/ac/ax', 'Less congested, more channels', 'More path loss vs 2.4 GHz'] },
            { band: '6 GHz', icon: '🚀', color: '#10b981', props: ['1200 MHz wide (5.925–7.125 GHz)', '59 non-overlapping 20 MHz channels', '14 × 80 MHz or 7 × 160 MHz', 'Wi-Fi 6E and Wi-Fi 7 only', 'No legacy devices = clean band', 'Limited to indoor/low-power in many regions'] },
          ].map(b => (
            <div key={b.band} className="rounded-xl border border-slate-700 p-3" style={{ background: b.color + '08' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{b.icon}</span>
                <span className="font-bold text-sm" style={{ color: b.color }}>{b.band}</span>
              </div>
              {b.props.map(p => (
                <div key={p} className="flex gap-1.5 text-slate-400 mb-0.5">
                  <span style={{ color: b.color }}>›</span><span>{p}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* RF Wave Properties */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">RF Wave Properties — Amplitude, Frequency, Phase & Wavelength</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { prop: 'Amplitude (A)', icon: '↕', color: '#06b6d4', desc: 'Height of the wave. Represents signal power. Measured in Volts or dBm. Higher A = stronger signal = more range.' },
            { prop: 'Frequency (f)', icon: '〰', color: '#a855f7', desc: 'Cycles per second (Hz). 2.4 GHz = 2,400,000,000 cycles/sec. Higher f = more data capacity, less range.' },
            { prop: 'Phase (φ)', icon: '↻', color: '#10b981', desc: 'Offset in the cycle (0°–360°). OFDM subcarriers stay orthogonal by maintaining phase relationships. Phase shift = data encoding in QAM.' },
            { prop: 'Wavelength (λ)', icon: 'λ', color: '#f59e0b', desc: 'λ = c/f. 2.4 GHz → λ = 12.5 cm. 5 GHz → λ = 6 cm. 6 GHz → λ = 5 cm. Antenna length = λ/2 or λ/4.' },
          ].map(p => (
            <div key={p.prop} className="rounded-xl border border-slate-700 p-4" style={{ background: p.color + '08' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-2" style={{ background: p.color, color: '#000' }}>{p.icon}</div>
              <div className="font-bold text-white text-sm mb-1">{p.prop}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RADAR Signal Behaviors */}
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">Signal Behaviors — RADAR Mnemonic</h3>
        <p className="text-xs text-slate-400">When RF waves encounter objects they exhibit 5 behaviors — remember as <span className="text-amber-300 font-bold">R·A·D·A·R</span></p>
        <div className="grid sm:grid-cols-5 gap-3">
          {[
            { letter: 'R', name: 'Reflection', icon: '↩', color: '#ef4444', desc: 'Signal bounces off smooth, hard surfaces (metal walls, floors). Creates multipath — copies arrive at different times. Can be exploited with beamforming.' },
            { letter: 'A', name: 'Absorption', icon: '⬛', color: '#f97316', desc: 'Material converts RF energy to heat. Concrete: 10-20 dB/wall. Human body: 3-5 dB. Water-based materials absorb heavily at 2.4 GHz.' },
            { letter: 'D', name: 'Diffraction', icon: '⌒', color: '#eab308', desc: 'Signal bends around edges (walls, corners). Allows partial coverage around obstacles. Lower frequencies diffract more (2.4 GHz bends better than 5 GHz).' },
            { letter: 'A', name: 'Scattering', icon: '💥', color: '#22c55e', desc: 'Signal spreads in many directions when hitting rough or irregular surfaces (trees, gravel, furniture). Reduces signal strength in the intended direction.' },
            { letter: 'R', name: 'Refraction', icon: '↗', color: '#06b6d4', desc: 'Signal changes direction when passing through materials of different density. Less common indoors but affects signals passing through windows at angles.' },
          ].map(b => (
            <div key={b.name} className="rounded-xl border border-slate-700 p-3 text-center" style={{ background: b.color + '08' }}>
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl font-black" style={{ background: b.color, color: '#000' }}>{b.letter}</div>
              <div className="font-bold text-white text-sm mb-1">{b.name}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Propagation Math ──────────────────────────────────────────────────
function PropagationTab() {
  const [fspDist, setFspDist] = useState(50);
  const [fspFreq, setFspFreq] = useState(5);
  const [txPower, setTxPower] = useState(20);
  const [txGain, setTxGain] = useState(3);
  const [rxGain, setRxGain] = useState(3);
  const [cableLoss, setCableLoss] = useState(1);
  const [rxSens, setRxSens] = useState(-82);

  const fspl = 20 * Math.log10(fspDist) + 20 * Math.log10(fspFreq * 1e9) + 20 * Math.log10(4 * Math.PI / 3e8);
  const eirp = txPower + txGain - cableLoss;
  const rxPower = eirp - fspl + rxGain;
  const som = rxPower - rxSens;

  const fresnelR1 = (d: number, f: number) => Math.sqrt((3e8 * d) / (4 * f * 1e9));
  const fr1 = fresnelR1(fspDist, fspFreq);
  const clearance = fr1 * 0.6;

  return (
    <div className="space-y-6">
      {/* FSPL */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Free Space Path Loss (Friis Formula)</h3>
        <div className="font-mono text-sm text-center py-3 rounded-xl border border-slate-700 bg-surface-900/60">
          <span className="text-amber-300">FSPL (dB)</span> = 20·log₁₀(d) + 20·log₁₀(f) + 20·log₁₀(4π/c)
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400">Distance: <span className="font-bold text-white">{fspDist} m</span></label>
              <input type="range" min={1} max={500} value={fspDist} onChange={e => setFspDist(+e.target.value)} className="w-full accent-cyan-500 mt-1" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Frequency: <span className="font-bold text-white">{fspFreq} GHz</span></label>
              <input type="range" min={2} max={7} step={0.1} value={fspFreq} onChange={e => setFspFreq(+e.target.value)} className="w-full accent-purple-500 mt-1" />
            </div>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/05 p-4 flex flex-col justify-center items-center gap-2">
            <div className="text-4xl font-black text-cyan-400">{fspl.toFixed(1)} dB</div>
            <div className="text-xs text-slate-400">Free Space Path Loss</div>
            <div className="text-xs text-slate-500">At {fspDist}m, {fspFreq} GHz</div>
            <div className="text-xs text-amber-400 text-center">Every 2× distance adds +6 dB loss.<br/>Every 2× frequency adds +6 dB loss.</div>
          </div>
        </div>
      </div>

      {/* Fresnel Zones */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Fresnel Zones & 60% Clearance Rule</h3>
        <p className="text-xs text-slate-400">First Fresnel Zone radius: <span className="font-mono text-white">r₁ = √(λ·d/4)</span> for midpoint. 60% of r₁ must be clear of obstructions to avoid significant diffraction loss.</p>
        <div className="grid sm:grid-cols-2 gap-4 items-center">
          <div>
            <div className="text-sm text-slate-300 mb-2">At {fspDist}m link, {fspFreq} GHz:</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">1st Fresnel Zone radius (r₁)</span>
                <span className="font-bold text-white">{fr1.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Required clearance (60% r₁)</span>
                <span className="font-bold text-emerald-400">{clearance.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Wavelength λ</span>
                <span className="font-bold text-purple-400">{(3e8 / (fspFreq * 1e9) * 100).toFixed(1)} cm</span>
              </div>
            </div>
          </div>
          {/* Fresnel ellipse diagram */}
          <svg viewBox="0 0 300 100" className="w-full rounded-xl border border-slate-700 bg-slate-900/60">
            <line x1="20" y1="50" x2="280" y2="50" stroke="#334155" strokeWidth="1.5" />
            <ellipse cx="150" cy="50" rx="130" ry={Math.min(40, fr1 * 8)} fill="none" stroke="#06b6d440" strokeWidth="1" strokeDasharray="3 2" />
            <ellipse cx="150" cy="50" rx="130" ry={Math.min(24, clearance * 8)} fill="#06b6d408" stroke="#06b6d4" strokeWidth="1.5" />
            <circle cx="20" cy="50" r="5" fill="#a855f7" />
            <circle cx="280" cy="50" r="5" fill="#10b981" />
            <text x="150" y="18" textAnchor="middle" fill="#06b6d4" fontSize="8">60% Clearance = {clearance.toFixed(1)}m</text>
            <text x="20" y="72" textAnchor="middle" fill="#a855f7" fontSize="7">TX</text>
            <text x="280" y="72" textAnchor="middle" fill="#10b981" fontSize="7">RX</text>
          </svg>
        </div>
      </div>

      {/* Link Budget */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Link Budget & System Operating Margin (SOM)</h3>
        <div className="font-mono text-xs text-center py-2 rounded-xl border border-slate-700 bg-surface-900/60">
          Received Power = EIRP − FSPL + Rx Gain &nbsp;|&nbsp; SOM = Rx Power − Rx Sensitivity
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-3 text-xs">
            {[
              { label: 'TX Power', value: txPower, setter: setTxPower, min: 10, max: 30, color: '#06b6d4', unit: 'dBm' },
              { label: 'TX Antenna Gain', value: txGain, setter: setTxGain, min: 0, max: 20, color: '#a855f7', unit: 'dBi' },
              { label: 'Cable/Connector Loss', value: cableLoss, setter: setCableLoss, min: 0, max: 10, color: '#ef4444', unit: 'dB' },
              { label: 'RX Antenna Gain', value: rxGain, setter: setRxGain, min: 0, max: 20, color: '#10b981', unit: 'dBi' },
              { label: 'RX Sensitivity', value: rxSens, setter: setRxSens, min: -100, max: -60, color: '#f59e0b', unit: 'dBm' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-slate-400">{f.label}: <span className="font-bold" style={{ color: f.color }}>{f.value} {f.unit}</span></label>
                <input type="range" min={f.min} max={f.max} value={f.value} onChange={e => f.setter(+e.target.value)} className="w-full mt-0.5" style={{ accentColor: f.color }} />
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            {[
              { label: 'EIRP', value: `${eirp.toFixed(1)} dBm`, color: '#06b6d4', sub: `${txPower} + ${txGain} − ${cableLoss}` },
              { label: 'FSPL', value: `−${fspl.toFixed(1)} dB`, color: '#ef4444', sub: `at ${fspDist}m, ${fspFreq} GHz` },
              { label: 'Received Power', value: `${rxPower.toFixed(1)} dBm`, color: '#a855f7', sub: 'EIRP − FSPL + RxGain' },
              { label: 'RX Sensitivity', value: `${rxSens} dBm`, color: '#f59e0b', sub: 'minimum detectable' },
              { label: 'SOM', value: `${som.toFixed(1)} dB`, color: som >= 10 ? '#10b981' : som >= 0 ? '#f59e0b' : '#ef4444', sub: som >= 10 ? '✓ Good link' : som >= 0 ? '⚠ Marginal' : '✗ Link failure' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center rounded-lg border border-slate-700 px-3 py-2" style={{ background: r.color + '0a' }}>
                <div>
                  <div className="font-semibold text-white">{r.label}</div>
                  <div className="text-xs text-slate-500">{r.sub}</div>
                </div>
                <div className="font-black text-lg font-mono" style={{ color: r.color }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Multipath & Fading ────────────────────────────────────────────────
function MultipathTab() {
  const [showDelay, setShowDelay] = useState(false);
  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Multipath Propagation</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          In indoor environments, RF signals reach the receiver via multiple paths — direct line-of-sight (LOS),
          reflections from walls/floors/ceilings, and diffractions. These copies arrive at slightly different
          times and with different amplitudes, potentially causing <span className="text-red-400 font-medium">inter-symbol interference (ISI)</span>.
        </p>
        {/* Multipath diagram */}
        <svg viewBox="0 0 500 160" className="w-full rounded-xl border border-slate-700 bg-slate-900/60">
          {/* TX */}
          <rect x="20" y="65" width="40" height="30" rx="4" fill="#a855f720" stroke="#a855f7" strokeWidth="1.5" />
          <text x="40" y="84" textAnchor="middle" fill="#a855f7" fontSize="9" fontWeight="bold">TX</text>
          {/* RX */}
          <rect x="440" y="65" width="40" height="30" rx="4" fill="#10b98120" stroke="#10b981" strokeWidth="1.5" />
          <text x="460" y="84" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">RX</text>
          {/* Ceiling */}
          <rect x="0" y="0" width="500" height="15" fill="#334155" />
          {/* Floor */}
          <rect x="0" y="145" width="500" height="15" fill="#334155" />
          {/* Direct path */}
          <motion.line x1="60" y1="80" x2="440" y2="80" stroke="#06b6d4" strokeWidth="2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }} />
          <text x="250" y="75" textAnchor="middle" fill="#06b6d4" fontSize="8">LOS (direct)</text>
          {/* Ceiling reflection */}
          <motion.polyline points="60,80 250,20 440,80" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatDelay: 1 }} />
          <text x="250" y="16" textAnchor="middle" fill="#f59e0b" fontSize="7">ceiling reflection (+delay)</text>
          {/* Floor reflection */}
          <motion.polyline points="60,80 250,138 440,80" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.6, repeat: Infinity, repeatDelay: 1 }} />
          <text x="250" y="152" textAnchor="middle" fill="#ef4444" fontSize="7">floor reflection (+delay)</text>
        </svg>
        <button onClick={() => setShowDelay(d => !d)}
          className="px-4 py-2 rounded-lg text-xs border border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20">
          {showDelay ? '▲ Hide' : '▼ Show'} Delay Spread Impact
        </button>
        <AnimatePresence>
          {showDelay && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="rounded-xl border border-slate-700 p-4 space-y-2">
                  <div className="font-bold text-white">Delay Spread</div>
                  <p className="text-slate-400 leading-relaxed">The time difference between the first arriving path and last significant multipath copy. Indoor typical: 10–50 ns. If delay spread &gt; GI, ISI occurs.</p>
                  <div className="space-y-1">
                    {[
                      { env: 'Small room', ds: '< 15 ns', color: '#10b981' },
                      { env: 'Office/home', ds: '20–40 ns', color: '#f59e0b' },
                      { env: 'Large open area', ds: '40–100 ns', color: '#ef4444' },
                    ].map(r => (
                      <div key={r.env} className="flex justify-between">
                        <span className="text-slate-400">{r.env}</span>
                        <span className="font-mono font-bold" style={{ color: r.color }}>{r.ds}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 p-4 space-y-2">
                  <div className="font-bold text-white">OFDM as the Solution</div>
                  <p className="text-slate-400 leading-relaxed">OFDM uses long symbol periods (3.2 µs) and a Cyclic Prefix (GI) that is longer than the delay spread. The CP absorbs the ISI from multipath echoes.</p>
                  <div className="font-mono text-xs bg-surface-900/60 rounded-lg p-2 border border-slate-700">
                    <div>Symbol period: <span className="text-cyan-400">3.2 µs</span></div>
                    <div>GI (legacy): <span className="text-green-400">0.8 µs</span> (absorbs 50+ ns)</div>
                    <div>GI (ax long): <span className="text-purple-400">3.2 µs</span></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fading types */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Fading Types</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            { title: 'Large-Scale (Path Loss) Fading', color: '#06b6d4', desc: 'Signal power decreases with distance. Modeled by FSPL. Predictable, deterministic. Changes over tens/hundreds of meters.' },
            { title: 'Slow (Shadow) Fading', color: '#a855f7', desc: 'Large obstacles (buildings, hills) block signal. Changes slowly as user moves. Log-normal distribution. Standard deviation 5–12 dB.' },
            { title: 'Fast (Rayleigh) Fading', color: '#ef4444', desc: 'Rapid fluctuations from multipath constructive/destructive interference. Changes over fractions of a wavelength (cm scale). Rayleigh distribution.' },
            { title: 'Flat vs Frequency-Selective', color: '#f59e0b', desc: 'Flat fading: all frequencies affected equally (BW < coherence BW). Freq-selective: different frequencies fade differently. OFDM + cyclic prefix handles frequency-selective fading.' },
          ].map(f => (
            <div key={f.title} className="rounded-xl border border-slate-700 p-4" style={{ background: f.color + '08' }}>
              <div className="font-bold mb-1" style={{ color: f.color }}>{f.title}</div>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: dB Math ───────────────────────────────────────────────────────────
function DBMathTab() {
  const [mwValue, setMwValue] = useState(100);
  const dbmFromMw = 10 * Math.log10(mwValue);
  const mwFromDbm = Math.pow(10, dbmFromMw / 10);

  return (
    <div className="space-y-5">
      {/* Reference table */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">dB, dBm, dBi, dBd — The RF Power Toolkit</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {[
            { term: 'dB', color: '#06b6d4', def: 'Relative unit (ratio). 10·log₁₀(P₂/P₁). +3 dB = 2× power. +10 dB = 10× power. −3 dB = half power. −10 dB = 1/10 power.', example: 'AP TX: +20 dBm, Cable loss: −3 dB → 17 dBm at antenna' },
            { term: 'dBm', color: '#a855f7', def: 'Absolute power referenced to 1 mW. dBm = 10·log₁₀(P/1mW). 0 dBm = 1 mW. 30 dBm = 1 W. Negative values = sub-milliwatt.', example: 'Excellent signal: −50 dBm. Minimum: −82 dBm (MCS0)' },
            { term: 'dBi', color: '#10b981', def: 'Antenna gain vs ideal isotropic radiator. Isotropic = 0 dBi (theoretical, radiates equally in all directions). Real antennas focus energy → gain > 0 dBi.', example: 'Dipole: 2.15 dBi. Sector: 12 dBi. Yagi: 18 dBi' },
            { term: 'dBd', color: '#f59e0b', def: 'Antenna gain vs half-wave dipole. dBi = dBd + 2.15. Less common than dBi. Some manufacturers specify dBd to make gain look lower.', example: 'dBd = dBi − 2.15. A 5 dBd antenna = 7.15 dBi' },
            { term: 'EIRP', color: '#ef4444', def: 'Effective Isotropic Radiated Power. EIRP (dBm) = TX Power + Antenna Gain − Cable Loss. Regulatory body controls max EIRP per band.', example: '20 dBm TX + 6 dBi − 1 dB cable = 25 dBm EIRP' },
            { term: 'SNR / SINR', color: '#8b5cf6', def: 'Signal-to-Noise Ratio: Signal(dBm) − Noise Floor(dBm). SINR includes interference: S/(N+I). Higher SNR = higher MCS possible. < 10 dB = poor. > 25 dB = excellent.', example: '−55 dBm signal, −95 dBm noise → SNR = 40 dB' },
          ].map(t => (
            <div key={t.term} className="rounded-xl border border-slate-700 p-3" style={{ background: t.color + '08' }}>
              <div className="font-black text-lg mb-1" style={{ color: t.color }}>{t.term}</div>
              <p className="text-slate-300 mb-2 leading-relaxed">{t.def}</p>
              <div className="font-mono text-slate-500 bg-surface-900/60 rounded px-2 py-1">{t.example}</div>
            </div>
          ))}
        </div>
      </div>

      {/* dBm ↔ mW Calculator */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">dBm ↔ mW Converter</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs text-slate-400">TX Power: <span className="font-bold text-white">{mwValue} mW</span></label>
            <input type="range" min={1} max={1000} value={mwValue} onChange={e => setMwValue(+e.target.value)} className="w-full accent-cyan-500" />
            <div className="text-3xl font-black text-cyan-400 text-center">{dbmFromMw.toFixed(1)} dBm</div>
            <div className="text-xs text-center text-slate-500">{mwValue} mW = {dbmFromMw.toFixed(1)} dBm</div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-400 mb-2">Quick Reference</div>
            {[
              { dbm: -90, mw: '0.001 mW', label: 'Rx noise floor (802.11ax)' },
              { dbm: -80, mw: '0.01 mW', label: 'Minimum usable signal' },
              { dbm: -70, mw: '0.1 mW', label: 'Weak but functional' },
              { dbm: -50, mw: '10 µW', label: 'Good signal' },
              { dbm: 0, mw: '1 mW', label: '0 dBm reference' },
              { dbm: 20, mw: '100 mW', label: 'Typical AP TX power' },
              { dbm: 30, mw: '1 W', label: 'Max outdoor EIRP (typical)' },
            ].map(r => (
              <div key={r.dbm} className={`flex justify-between items-center rounded px-2 py-1 ${Math.abs(dbmFromMw - r.dbm) < 2 ? 'bg-cyan-500/10 border border-cyan-500/30' : ''}`}>
                <span className="font-mono text-white">{r.dbm} dBm</span>
                <span className="font-mono text-purple-400">{r.mw}</span>
                <span className="text-slate-500">{r.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs rounded-xl border border-slate-700 p-4 bg-surface-900/40">
          <div>
            <div className="font-bold text-amber-400 mb-1">Golden Rules</div>
            <div className="text-slate-400">+3 dB = 2× power</div>
            <div className="text-slate-400">+10 dB = 10× power</div>
            <div className="text-slate-400">−3 dB = ½ power</div>
          </div>
          <div>
            <div className="font-bold text-cyan-400 mb-1">Noise Floor</div>
            <div className="text-slate-400">= −174 + 10·log₁₀(BW)</div>
            <div className="text-slate-400">20 MHz: −101 dBm</div>
            <div className="text-slate-400">80 MHz: −95 dBm</div>
          </div>
          <div>
            <div className="font-bold text-green-400 mb-1">RSSI Ranges</div>
            <div className="text-slate-400">Excellent: ≥ −50 dBm</div>
            <div className="text-slate-400">Good: −50 to −70 dBm</div>
            <div className="text-slate-400">Poor: &lt; −80 dBm</div>
          </div>
        </div>
        <div className="text-xs text-slate-500 text-center">Verification: {mwValue} mW → {dbmFromMw.toFixed(2)} dBm → back: {mwFromDbm.toFixed(2)} mW</div>
      </div>
    </div>
  );
}

// ─── Tab 5: Channel Plans ─────────────────────────────────────────────────────
function ChannelPlansTab() {
  const [band, setBand] = useState<'2.4' | '5' | '6'>('2.4');

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['2.4', '5', '6'] as const).map(b => (
          <button key={b} onClick={() => setBand(b)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${band === b ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {b} GHz
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={band} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {band === '2.4' && (
            <div className="space-y-4">
              <div className="glass-panel p-5 border-glow-blue">
                <h3 className="font-bold text-white mb-3">2.4 GHz Channel Plan (IEEE 802.11b/g/n/ax)</h3>
                <p className="text-xs text-slate-400 mb-4">14 channels total (13 in EU, 11 in USA), each 22 MHz wide, spaced 5 MHz apart → heavy overlap. Only channels 1, 6, 11 are non-overlapping.</p>
                <div className="overflow-x-auto">
                  <div className="relative" style={{ minWidth: 560, height: 100 }}>
                    {Array.from({ length: 13 }, (_, i) => {
                      const ch = i + 1;
                      const isKey = [1, 6, 11].includes(ch);
                      const centerPct = (ch - 1) / 12;
                      return (
                        <div key={ch} className="absolute" style={{ left: `${centerPct * 80}%`, top: isKey ? 8 : 28, width: '24%' }}>
                          <div className={`rounded-t-lg border px-1 py-2 text-center text-xs font-bold transition-all`}
                            style={{
                              background: isKey ? '#06b6d420' : '#33415520',
                              borderColor: isKey ? '#06b6d4' : '#334155',
                              color: isKey ? '#06b6d4' : '#64748b',
                              height: isKey ? 60 : 40,
                            }}>
                            {ch}
                          </div>
                        </div>
                      );
                    })}
                    <div className="absolute bottom-0 left-0 right-0 text-xs text-slate-500 text-center">
                      Non-overlapping channels: <span className="text-cyan-400 font-bold">1, 6, 11</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                  {[
                    { ch: 'Ch 1', freq: '2.412 GHz', color: '#06b6d4' },
                    { ch: 'Ch 6', freq: '2.437 GHz', color: '#06b6d4' },
                    { ch: 'Ch 11', freq: '2.462 GHz', color: '#06b6d4' },
                  ].map(c => (
                    <div key={c.ch} className="rounded-xl border border-cyan-500/30 bg-cyan-500/05 p-3 text-center">
                      <div className="font-black text-lg" style={{ color: c.color }}>{c.ch}</div>
                      <div className="text-slate-400">{c.freq}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {band === '5' && (
            <div className="glass-panel p-5 border-glow-blue space-y-4">
              <h3 className="font-bold text-white">5 GHz Channel Plan (802.11a/n/ac/ax)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { name: 'UNII-1', range: '5.150–5.250 GHz', channels: 'Ch 36, 40, 44, 48', color: '#06b6d4', note: 'Indoor only (low power). No DFS required.', power: '50 mW' },
                  { name: 'UNII-2A', range: '5.250–5.350 GHz', channels: 'Ch 52, 56, 60, 64', color: '#a855f7', note: 'DFS required (radar co-existence). TDWR.', power: '250 mW' },
                  { name: 'UNII-2C (Extended)', range: '5.470–5.725 GHz', channels: 'Ch 100–144 (11 ch)', color: '#f59e0b', note: 'DFS + TPC required. Most channels here.', power: '250 mW' },
                  { name: 'UNII-3', range: '5.725–5.850 GHz', channels: 'Ch 149, 153, 157, 161, 165', color: '#10b981', note: 'Outdoor allowed. No DFS required.', power: '1 W' },
                ].map(u => (
                  <div key={u.name} className="rounded-xl border border-slate-700 p-3" style={{ background: u.color + '08' }}>
                    <div className="font-bold mb-1" style={{ color: u.color }}>{u.name}</div>
                    <div className="text-slate-300 text-xs mb-1">{u.range}</div>
                    <div className="font-mono text-slate-400 mb-1">{u.channels}</div>
                    <div className="text-slate-500">{u.note}</div>
                    <div className="text-slate-400 mt-1">Max EIRP: <span style={{ color: u.color }}>{u.power}</span></div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/05 p-4 text-xs space-y-1">
                <div className="font-bold text-amber-400">DFS — Dynamic Frequency Selection</div>
                <p className="text-slate-400">Required on UNII-2A and UNII-2C channels to avoid interference with radar systems. AP must listen for 60 seconds before transmitting, and must vacate the channel within 10 seconds if radar is detected. Channel switch announcement (CSA) notifies clients.</p>
              </div>
            </div>
          )}

          {band === '6' && (
            <div className="glass-panel p-5 border-glow-blue space-y-4">
              <h3 className="font-bold text-white">6 GHz Channel Plan (Wi-Fi 6E / Wi-Fi 7)</h3>
              <p className="text-xs text-slate-400">5.925–7.125 GHz — 1200 MHz of clean, new spectrum. No legacy devices allowed. Low Power Indoor (LPI) and Standard Power (SP) modes.</p>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/05 p-4">
                  <div className="font-bold text-emerald-400 mb-2">20 MHz channels</div>
                  <div className="text-white font-black text-2xl">59</div>
                  <div className="text-slate-400">Ch 1 to Ch 233 (odd numbers)</div>
                  <div className="text-slate-500 mt-1">Starting: 5.955 GHz step 20 MHz</div>
                </div>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/05 p-4">
                  <div className="font-bold text-cyan-400 mb-2">80 MHz channels</div>
                  <div className="text-white font-black text-2xl">14</div>
                  <div className="text-slate-400">PSC: 5, 21, 37, 53, 69, 85...</div>
                  <div className="text-slate-500 mt-1">Preferred Scanning Channels</div>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/05 p-4">
                  <div className="font-bold text-purple-400 mb-2">160/320 MHz</div>
                  <div className="text-white font-black text-2xl">7 / 3</div>
                  <div className="text-slate-400">160 MHz (Wi-Fi 6E) / 320 MHz (Wi-Fi 7)</div>
                  <div className="text-slate-500 mt-1">Massive throughput potential</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-700 p-3">
                  <div className="font-bold text-white mb-1">Why 6 GHz is special</div>
                  {['No legacy 802.11a/b/g/n/ac devices → clean spectrum', 'No DFS required (no radar systems)', 'Mandatory WPA3-only → improved security', 'AFC (Automated Frequency Coordination) for Standard Power outdoor', 'BSS Coloring helps spatial reuse', 'Wi-Fi 7 MLO uses 6 GHz as primary fast link'].map(p => (
                    <div key={p} className="flex gap-1.5 text-slate-400 mb-0.5"><span className="text-green-400">✓</span><span>{p}</span></div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-700 p-3">
                  <div className="font-bold text-white mb-1">PSC (Preferred Scanning Channels)</div>
                  <p className="text-slate-400 leading-relaxed">Wi-Fi 6E defines PSC channels (80 MHz) that devices scan first to speed up AP discovery. PSC channels: <span className="font-mono text-cyan-400">5, 21, 37, 53, 69, 85, 101, 117, 133, 149, 165, 181, 197, 213</span></p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const TABS = ['RF Basics', 'Propagation Math', 'Multipath & Fading', 'dB Math', 'Channel Plans'];

export function Chapter1() {
  const { markComplete } = useApp();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    ['spectrum','waves','propagation','fspl','fresnel','multipath','linkbudget','rfmath','channels']
      .forEach(id => markComplete('ch1', id));
  }, [markComplete]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Learn how radio waves carry your data through the air — the physics and math behind every Wi-Fi connection." />
        <ModeBadge />
      </div>

      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${tab === i ? 'border-band24 text-band24' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {tab === 0 && <RFBasicsTab />}
          {tab === 1 && <PropagationTab />}
          {tab === 2 && <MultipathTab />}
          {tab === 3 && <DBMathTab />}
          {tab === 4 && <ChannelPlansTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
