import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch2')!;

// ─── Constellation Diagram ────────────────────────────────────────────────────
type ModType = 'BPSK' | 'QPSK' | '16-QAM' | '64-QAM' | '256-QAM' | '1024-QAM' | '4096-QAM';

const MOD_CONFIGS: Record<ModType, { grid: number; bitsPerSym: number; color: string; snrNeeded: string }> = {
  'BPSK':     { grid: 2,  bitsPerSym: 1,  color: '#06b6d4', snrNeeded: '5 dB'  },
  'QPSK':     { grid: 2,  bitsPerSym: 2,  color: '#38bdf8', snrNeeded: '10 dB' },
  '16-QAM':   { grid: 4,  bitsPerSym: 4,  color: '#a855f7', snrNeeded: '16 dB' },
  '64-QAM':   { grid: 8,  bitsPerSym: 6,  color: '#8b5cf6', snrNeeded: '22 dB' },
  '256-QAM':  { grid: 16, bitsPerSym: 8,  color: '#10b981', snrNeeded: '28 dB' },
  '1024-QAM': { grid: 32, bitsPerSym: 10, color: '#f59e0b', snrNeeded: '35 dB' },
  '4096-QAM': { grid: 64, bitsPerSym: 12, color: '#ef4444', snrNeeded: '43 dB' },
};

function ConstellationDiagram() {
  const [selected, setSelected] = useState<ModType>('QPSK');
  const [noiseLevel, setNoiseLevel] = useState(0);
  const cfg = MOD_CONFIGS[selected];
  const size = 240; const margin = 20; const inner = size - margin * 2;
  const gridN = Math.min(cfg.grid, 16);
  const step = inner / (gridN - 1 || 1);
  const points = [];
  for (let row = 0; row < gridN; row++)
    for (let col = 0; col < gridN; col++)
      points.push({
        x: margin + col * step + (Math.random() - 0.5) * noiseLevel * 4,
        y: margin + row * step + (Math.random() - 0.5) * noiseLevel * 4,
      });

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <h3 className="font-bold text-white">Modulation Constellation Diagram</h3>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MOD_CONFIGS) as ModType[]).map(m => (
          <button key={m} onClick={() => setSelected(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selected === m ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            style={selected === m ? { borderColor: MOD_CONFIGS[m].color, background: MOD_CONFIGS[m].color + '20', color: MOD_CONFIGS[m].color } : {}}>
            {m}
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-5 items-center">
        <svg width={size} height={size} className="flex-shrink-0 rounded-xl bg-slate-900/80 border border-slate-700/50">
          <line x1={margin} y1={size/2} x2={size-margin} y2={size/2} stroke="rgba(100,116,139,0.4)" strokeWidth="1" />
          <line x1={size/2} y1={margin} x2={size/2} y2={size-margin} stroke="rgba(100,116,139,0.4)" strokeWidth="1" />
          <text x={size-10} y={size/2+12} fill="#475569" fontSize="8" fontFamily="Inter">I</text>
          <text x={size/2+4} y={margin} fill="#475569" fontSize="8" fontFamily="Inter">Q</text>
          <AnimatePresence>
            {points.map((p, i) => (
              <motion.circle key={`${selected}-${i}`}
                initial={{ opacity: 0, r: 0 }} animate={{ opacity: 1, r: cfg.grid > 8 ? 1.5 : cfg.grid > 4 ? 2 : 3.5 }}
                exit={{ opacity: 0, r: 0 }} transition={{ duration: 0.3, delay: i * 0.001 }}
                cx={p.x} cy={p.y} fill={cfg.color} style={{ filter: `drop-shadow(0 0 3px ${cfg.color})` }} />
            ))}
          </AnimatePresence>
        </svg>
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[{ k: 'Modulation', v: selected }, { k: 'Bits/Symbol', v: `${cfg.bitsPerSym}` },
              { k: 'Symbols', v: `${gridN * gridN}` }, { k: 'Min SNR', v: cfg.snrNeeded }].map(f => (
              <div key={f.k} className="bg-surface-900/60 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500">{f.k}</p>
                <p className="text-sm font-bold font-mono" style={{ color: cfg.color }}>{f.v}</p>
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Noise: <span className="font-bold text-red-400">{noiseLevel === 0 ? 'None' : noiseLevel < 4 ? 'Low' : noiseLevel < 7 ? 'Medium' : 'High'}</span>
            </label>
            <input type="range" min="0" max="10" step="1" value={noiseLevel} onChange={e => setNoiseLevel(+e.target.value)} className="w-full accent-red-500" />
          </div>
          <ModeContent content={{
            kid: `${selected} = ${cfg.bitsPerSym} bits per dot. More dots = more data per flash, but noise can confuse them! 🎯`,
            enthusiast: `${selected} packs ${cfg.bitsPerSym} bits/symbol. ${cfg.bitsPerSym > 6 ? 'Needs excellent SNR — best for short range.' : 'Robust in noisy conditions.'}`,
            pro: `${selected}: ${cfg.bitsPerSym} bpcs, ≥${cfg.snrNeeded} SNR. EVM < ${cfg.bitsPerSym > 8 ? '−35' : '−25'} dB required.`,
          }} className="text-xs text-slate-400 leading-relaxed" />
        </div>
      </div>
    </div>
  );
}

// ─── OFDM vs DSSS Visualizer ──────────────────────────────────────────────────
function OFDMVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modMode, setModMode] = useState<'dsss' | 'ofdm' | 'ofdma'>('dsss');
  const frameRef = useRef(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width; const H = canvas.height;

    const draw = () => {
      tRef.current += 0.03;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(10,15,30,0.98)';
      ctx.fillRect(0, 0, W, H);

      if (modMode === 'dsss') {
        ctx.beginPath();
        for (let x = 0; x < W; x++) {
          const envelope = 0.7 + 0.3 * Math.sin(x / W * Math.PI);
          const chipping = Math.sin(x * 0.8 + tRef.current * 2) * 0.6 + Math.sin(x * 1.3 + tRef.current) * 0.3 + Math.sin(x * 0.2 + tRef.current * 0.5) * 0.4;
          const y = H / 2 - envelope * chipping * 55;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, '#06b6d466'); g.addColorStop(0.5, '#06b6d4'); g.addColorStop(1, '#06b6d466');
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('← 22 MHz DSSS Spread Spectrum (802.11b) →', W / 2, H - 8);

      } else if (modMode === 'ofdm') {
        const numCarriers = 52;
        const carrierColors = ['#06b6d4', '#0ea5e9', '#38bdf8', '#7dd3fc'];
        for (let k = 0; k < numCarriers; k++) {
          const cx = (k + 0.5) / numCarriers * W;
          const freq = (k + 1) * 0.15;
          const amp = 45 * (0.8 + 0.2 * Math.sin(k * 0.5));
          ctx.beginPath();
          for (let x = Math.max(0, cx - 20); x < Math.min(W, cx + 20); x++) {
            const dist = (x - cx) / 20;
            const sinc = dist === 0 ? 1 : Math.sin(Math.PI * dist * 2) / (Math.PI * dist * 2);
            const y = H / 2 - sinc * amp * Math.sin(freq * tRef.current + k);
            Math.abs(x - (Math.max(0, cx - 20))) < 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = carrierColors[k % carrierColors.length]; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
          ctx.stroke(); ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#94a3b8'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('← 52 Orthogonal Subcarriers (OFDM, 802.11a/g/n/ac/ax) →', W / 2, H - 8);

      } else {
        const users = [
          { id: 'User A', color: '#06b6d4', start: 0, end: 0.25 },
          { id: 'User B', color: '#a855f7', start: 0.25, end: 0.5 },
          { id: 'User C', color: '#10b981', start: 0.5, end: 0.75 },
          { id: 'User D', color: '#f59e0b', start: 0.75, end: 1.0 },
        ];
        users.forEach(u => {
          const x0 = u.start * W; const x1 = u.end * W;
          ctx.fillStyle = u.color + '18'; ctx.fillRect(x0, 20, x1 - x0, H - 40);
          ctx.strokeStyle = u.color + 'aa'; ctx.lineWidth = 1; ctx.strokeRect(x0, 20, x1 - x0, H - 40);
          const numSub = 13;
          for (let k = 0; k < numSub; k++) {
            const cx = x0 + (k + 0.5) / numSub * (x1 - x0);
            ctx.beginPath();
            for (let x = x0; x < x1; x++) {
              const dist = (x - cx) / ((x1 - x0) / numSub * 0.5);
              const sinc = Math.abs(dist) < 0.01 ? 1 : Math.sin(Math.PI * dist) / (Math.PI * dist);
              const y = H / 2 - sinc * 38 * Math.sin((k * 0.3 + u.start * 5) * tRef.current * 0.5 + k);
              Math.abs(x - x0) < 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = u.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.65; ctx.stroke(); ctx.globalAlpha = 1;
          }
          ctx.fillStyle = u.color; ctx.font = 'bold 9px Inter'; ctx.textAlign = 'center';
          ctx.fillText(u.id, (x0 + x1) / 2, H - 8);
        });
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [modMode]);

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">DSSS → OFDM → OFDMA Evolution</h3>
        <div className="flex gap-1.5">
          {(['dsss', 'ofdm', 'ofdma'] as const).map(m => (
            <button key={m} onClick={() => setModMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase ${
                modMode === m ? 'bg-band24/20 border-band24/50 text-band24' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} width={680} height={150} className="w-full rounded-lg" />
      <AnimatePresence mode="wait">
        <motion.div key={modMode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="grid sm:grid-cols-3 gap-3">
          {[
            { label: '802.11 Gen', value: modMode === 'dsss' ? '802.11b (1999)' : modMode === 'ofdm' ? '802.11a/g/n/ac' : '802.11ax / Wi-Fi 6' },
            { label: 'Technique',  value: modMode === 'dsss' ? 'Chipping / Spreading' : modMode === 'ofdm' ? '52 orthogonal sub-carriers' : 'Sub-carrier RU allocation' },
            { label: 'Key Benefit',value: modMode === 'dsss' ? 'Noise immunity' : modMode === 'ofdm' ? 'Multipath resilience' : 'Multiple simultaneous users' },
          ].map(f => (
            <div key={f.label} className="bg-surface-900/60 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500">{f.label}</p>
              <p className="text-xs font-bold text-band24">{f.value}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
      <ModeContent content={{
        kid: modMode === 'dsss' ? '📻 DSSS shouts one message LOUDLY across the whole band — cuts through noise, but only one person talks at a time!'
          : modMode === 'ofdm' ? '🎵 OFDM is like a choir — 52 singers each carry part of your data on a different note. If one gets blocked, the others carry on!'
          : '🎸 OFDMA lets 4 musicians play in DIFFERENT sections of the stage simultaneously — no waiting, everyone gets data at once!',
        enthusiast: modMode === 'dsss' ? 'DSSS spreads data using a chipping code across 22 MHz. Great noise immunity but inefficient spectrum use. Max 11 Mbps (802.11b).'
          : modMode === 'ofdm' ? 'OFDM splits the channel into 52 narrow subcarriers. Cyclic prefix handles multipath. Foundation of every Wi-Fi from 802.11a onward.'
          : 'OFDMA assigns groups of subcarriers (Resource Units) to different users simultaneously. Up to 9 users in a 20 MHz window — huge for crowded venues.',
        pro: modMode === 'dsss' ? 'DSSS: 11-chip Barker sequence, 1 Msps, DBPSK/DQPSK/CCK. Processing gain ~10.4 dB. Replaced by OFDM in 802.11a/g for better spectral efficiency.'
          : modMode === 'ofdm' ? 'OFDM: 64-point FFT, 52 data+pilot, 312.5 kHz spacing, 3.2µs FFT + 0.8µs GI = 4µs symbol. CP eliminates ISI for delay spreads < GI. 802.11ax: 256-FFT (20MHz), 0.8/1.6/3.2µs GI.'
          : '802.11ax OFDMA: 2048-FFT (80 MHz). RU sizes: 26/52/106/242/484/996 tones. DL+UL OFDMA via Trigger Frames. 4× efficiency gain over 802.11ac in dense deployments.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

// ─── MCS Index Table ──────────────────────────────────────────────────────────
const MCS_DATA = [
  { mcs: 0,  mod: 'BPSK',     cr: '1/2', rate20: 8.6,   rate40: 17.2,  rate80: 36.0,  color: '#06b6d4' },
  { mcs: 1,  mod: 'QPSK',     cr: '1/2', rate20: 17.2,  rate40: 34.4,  rate80: 72.1,  color: '#38bdf8' },
  { mcs: 2,  mod: 'QPSK',     cr: '3/4', rate20: 25.8,  rate40: 51.6,  rate80: 108.1, color: '#7dd3fc' },
  { mcs: 3,  mod: '16-QAM',   cr: '1/2', rate20: 34.4,  rate40: 68.8,  rate80: 144.1, color: '#a855f7' },
  { mcs: 4,  mod: '16-QAM',   cr: '3/4', rate20: 51.6,  rate40: 103.2, rate80: 216.2, color: '#8b5cf6' },
  { mcs: 5,  mod: '64-QAM',   cr: '2/3', rate20: 68.8,  rate40: 137.6, rate80: 288.2, color: '#7c3aed' },
  { mcs: 6,  mod: '64-QAM',   cr: '3/4', rate20: 77.4,  rate40: 154.9, rate80: 324.3, color: '#6d28d9' },
  { mcs: 7,  mod: '64-QAM',   cr: '5/6', rate20: 86.0,  rate40: 172.1, rate80: 360.3, color: '#5b21b6' },
  { mcs: 8,  mod: '256-QAM',  cr: '3/4', rate20: 103.2, rate40: 206.5, rate80: 432.4, color: '#10b981' },
  { mcs: 9,  mod: '256-QAM',  cr: '5/6', rate20: 114.7, rate40: 229.4, rate80: 480.4, color: '#059669' },
  { mcs: 10, mod: '1024-QAM', cr: '3/4', rate20: 129.0, rate40: 258.1, rate80: 540.4, color: '#f59e0b' },
  { mcs: 11, mod: '1024-QAM', cr: '5/6', rate20: 143.4, rate40: 286.8, rate80: 600.5, color: '#d97706' },
  { mcs: 12, mod: '4096-QAM', cr: '3/4', rate20: 154.9, rate40: 309.7, rate80: 650.0, color: '#ef4444' },
  { mcs: 13, mod: '4096-QAM', cr: '5/6', rate20: 172.1, rate40: 344.1, rate80: 720.6, color: '#dc2626' },
];

function MCSTable() {
  const [bw, setBw] = useState<'20' | '40' | '80'>('80');
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const maxRate = Math.max(...MCS_DATA.map(m => bw === '20' ? m.rate20 : bw === '40' ? m.rate40 : m.rate80));

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">MCS Index Table (802.11ax / Wi-Fi 6)</h3>
        <div className="flex gap-1">
          {(['20', '40', '80'] as const).map(w => (
            <button key={w} onClick={() => setBw(w)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${bw === w ? 'bg-band24/20 border-band24/50 text-band24' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {w} MHz
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500">1 spatial stream · 0.8µs GI — click a row for details</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700/50">
              {['MCS', 'Modulation', 'Code Rate', 'Data Rate', 'Bar'].map(h => (
                <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MCS_DATA.map(row => {
              const rate = bw === '20' ? row.rate20 : bw === '40' ? row.rate40 : row.rate80;
              return (
                <motion.tr key={row.mcs}
                  onClick={() => setHighlighted(highlighted === row.mcs ? null : row.mcs)}
                  whileHover={{ backgroundColor: row.color + '10' }}
                  className={`border-b border-slate-800/40 cursor-pointer ${highlighted === row.mcs ? 'bg-surface-600/40' : ''}`}>
                  <td className="py-1.5 px-2">
                    <span className="font-bold font-mono" style={{ color: row.color }}>MCS {row.mcs}</span>
                    {row.mcs >= 12 && <span className="ml-1 text-amber-400">🆕</span>}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-slate-300">{row.mod}</td>
                  <td className="py-1.5 px-2 text-slate-400">{row.cr}</td>
                  <td className="py-1.5 px-2 font-bold font-mono" style={{ color: row.color }}>{rate.toFixed(1)} Mbps</td>
                  <td className="py-1.5 px-2 w-32">
                    <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: row.color }}
                        initial={{ width: 0 }} animate={{ width: `${(rate / maxRate) * 100}%` }} transition={{ duration: 0.4 }} />
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AnimatePresence>
        {highlighted !== null && (() => {
          const row = MCS_DATA.find(r => r.mcs === highlighted)!;
          const rate = bw === '20' ? row.rate20 : bw === '40' ? row.rate40 : row.rate80;
          return (
            <motion.div key={highlighted} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="bg-surface-900/70 rounded-xl p-4 border overflow-hidden" style={{ borderColor: row.color + '40' }}>
              <p className="text-xs font-bold mb-1" style={{ color: row.color }}>MCS {row.mcs} — {row.mod}, R={row.cr}</p>
              <p className="text-xs text-slate-400">
                {bw} MHz: <span className="font-bold text-white">{rate.toFixed(1)} Mbps</span> per stream.
                {row.mcs >= 10 ? ' Needs SNR ≥ 35 dB — typically within 5-10m of AP.' : ''}
                {row.mcs >= 12 ? ' Wi-Fi 7 exclusive — 4096-QAM, 12 bits/symbol.' : ''}
              </p>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// ─── Channel Bonding ──────────────────────────────────────────────────────────
function ChannelBonding() {
  const [bonded, setBonded] = useState<20 | 40 | 80 | 160 | 320>(80);
  const channels = {
    20: [{ label: 'CH 36' }],
    40: [{ label: 'CH 36' }, { label: 'CH 40' }],
    80: [{ label: 'CH 36' }, { label: 'CH 40' }, { label: 'CH 44' }, { label: 'CH 48' }],
    160: Array.from({ length: 8 },  (_, i) => ({ label: `CH ${36 + i * 4}` })),
    320: Array.from({ length: 16 }, (_, i) => ({ label: `CH ${1 + i * 4}` })),
  };
  const throughput = { 20: '~150 Mbps', 40: '~300 Mbps', 80: '~867 Mbps', 160: '~1.7 Gbps', 320: '~5.8 Gbps' };

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">Channel Bonding Visualizer</h3>
        <div className="flex gap-1">
          {([20, 40, 80, 160, 320] as const).map(w => (
            <button key={w} onClick={() => setBonded(w)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${bonded === w ? 'bg-band24/20 border-band24/50 text-band24' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {w} MHz
            </button>
          ))}
        </div>
      </div>
      <div className="bg-surface-900/70 rounded-xl p-4 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {channels[bonded].map((ch, i) => (
            <motion.div key={ch.label} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center" style={{ width: `${bonded >= 160 ? 28 : bonded >= 80 ? 44 : 60}px` }}>
              <div className="w-full rounded-t-sm flex items-center justify-center"
                style={{ height: 56, background: `${i % 2 === 0 ? '#06b6d4' : '#0891b2'}22`, border: `1px solid ${i % 2 === 0 ? '#06b6d4' : '#0891b2'}60` }}>
                <span style={{ fontSize: bonded >= 160 ? '7px' : '9px' }} className="font-bold text-band24 text-center">
                  {bonded < 160 ? ch.label : ch.label.replace('CH ', '')}
                </span>
              </div>
              <div className="h-1 w-full" style={{ background: '#06b6d4' }} />
            </motion.div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm font-bold text-band24">{bonded} MHz → </span>
          <span className="text-sm font-bold text-emerald-400">{throughput[bonded]} peak</span>
          {bonded === 320 && <span className="ml-2 text-xs text-amber-400">(Wi-Fi 7 only 🆕)</span>}
        </div>
      </div>
      <ModeContent content={{
        kid: '🛣️ One lane vs. 16 highway lanes! More channels bonded = more lanes for your data!',
        enthusiast: 'Wider bonded channels = higher throughput. 320 MHz is Wi-Fi 7 exclusive in the 6 GHz band.',
        pro: 'Bonding: 802.11n(40)→ac(80/160)→be(320 MHz). Preamble Puncturing in 802.11be allows disabling occupied 20 MHz sub-channels via puncture bitmap in EHT-SIG.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

export function Chapter2() {
  const { markComplete } = useApp();

  useEffect(() => {
    ['legacyphy', 'ofdm', 'ppdu', 'gi', 'modulation', 'mcs', 'bonding', 'stbc']
      .forEach(id => markComplete('ch2', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="How bits become radio waves — modulation constellations, OFDM/OFDMA subcarrier math, MCS index tables, and channel bonding." />
        <ModeBadge />
      </div>
      <OFDMVisualizer />
      <ConstellationDiagram />
      <MCSTable />
      <ChannelBonding />
    </div>
  );
}
