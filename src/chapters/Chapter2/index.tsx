import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch2')!;

const TABS = ['Legacy PHY', 'OFDM & OFDMA', 'PPDU Formats', 'Guard Intervals', 'Modulation & MCS', 'Channel Bonding', 'STBC & Streams'] as const;
type Tab = typeof TABS[number];

// ─── Legacy PHY ──────────────────────────────────────────────────────────────
const LEGACY_PHYS = [
  {
    id: 'fhss', name: 'FHSS', full: 'Frequency-Hopping Spread Spectrum', std: '802.11 (1997)',
    maxRate: '2 Mbps', band: '2.4 GHz', color: '#06b6d4',
    kid: 'Jumps between 79 different channels 2.5x per second — hard to jam because it never stays in one place!',
    enthusiast: 'FHSS hops across 79 channels (1 MHz each) in 2.4 GHz using a pseudo-random sequence. Dwell time 20–400 ms. Immune to narrowband interference.',
    pro: 'FHSS: 79 channels, 2FSK/4FSK, 1/2 Mbps. Hopping pattern synchronized via Hop Index in beacon. Largely obsolete — replaced by DSSS due to regulatory issues with fast-hop patterns.',
    highlight: ['79 channels × 1 MHz', '2.5 hops/sec', 'GFSK modulation', '1–2 Mbps max'],
  },
  {
    id: 'dsss', name: 'DSSS', full: 'Direct Sequence Spread Spectrum', std: '802.11 (1997)',
    maxRate: '2 Mbps', band: '2.4 GHz', color: '#a855f7',
    kid: 'Spreads one message across 22 MHz using a secret code (Barker sequence) — like writing a message in big letters across an entire billboard.',
    enthusiast: 'DSSS spreads each bit using an 11-chip Barker sequence across 22 MHz. High processing gain (~10.4 dB) resists multipath. Used in 802.11 original at 1/2 Mbps.',
    pro: 'DSSS: 11-chip Barker code, 1 Msps chipping rate. DBPSK = 1 Mbps, DQPSK = 2 Mbps. Processing gain 10.4 dB. Center frequencies: Ch1=2412, Ch6=2437, Ch11=2462 MHz. 22 MHz occupied BW.',
    highlight: ['11-chip Barker code', '22 MHz bandwidth', 'DBPSK/DQPSK', '10.4 dB process gain'],
  },
  {
    id: 'hrdsss', name: 'HR-DSSS', full: 'High-Rate DSSS (802.11b)', std: '802.11b (1999)',
    maxRate: '11 Mbps', band: '2.4 GHz', color: '#10b981',
    kid: 'Like DSSS but with a smarter code (CCK) that can pack more data into each chip — bumping speeds from 2 Mbps all the way to 11 Mbps!',
    enthusiast: 'HR-DSSS adds CCK (Complementary Code Keying) on top of DSSS. 5.5 Mbps uses 4-bit CCK codewords; 11 Mbps uses 8-bit CCK. Backward compatible with DSSS.',
    pro: 'CCK: uses 64 codewords (8-chip, 8-bit). 5.5 Mbps: DQPSK + CCK4 (2 bits/symbol chip). 11 Mbps: DQPSK + CCK8 (4 bits/symbol chip). Optional PBCC encoding. Same 22 MHz BW as DSSS. Protection mechanisms (RTS/CTS, CTS-to-self) needed in mixed b/g networks.',
    highlight: ['CCK encoding', '5.5 & 11 Mbps', 'Backward-compatible', '22 MHz bandwidth'],
  },
  {
    id: 'erp', name: 'ERP-OFDM', full: 'Extended Rate PHY (802.11g)', std: '802.11g (2003)',
    maxRate: '54 Mbps', band: '2.4 GHz', color: '#f59e0b',
    kid: 'Brought the fast OFDM technology from 5 GHz (802.11a) down to the more common 2.4 GHz band — giving you 54 Mbps while still talking to old 802.11b devices!',
    enthusiast: '802.11g added OFDM to 2.4 GHz, achieving 54 Mbps. Must include ERP-DSSS/CCK and optional PBCC modes for backward compatibility with 802.11b clients.',
    pro: 'ERP: mandatory OFDM (54 Mbps), ERP-DSSS/CCK (11 Mbps b-compat), optional ERP-PBCC. Non-ERP STAs trigger protection (CTS-to-self or RTS/CTS). ERP-IE in beacon signals mixed-mode. Same OFDM subcarrier scheme as 802.11a: 52 subcarriers, 312.5 kHz spacing.',
    highlight: ['54 Mbps via OFDM', '2.4 GHz band', 'b/g backward compat', 'Protection modes'],
  },
];

function LegacyPHYTab() {
  const [selected, setSelected] = useState('dsss');
  const phy = LEGACY_PHYS.find(p => p.id === selected)!;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">IEEE 802.11 PHY Evolution Timeline</h3>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700" />
          <div className="flex justify-between relative">
            {[
              { year: '1997', std: 'Original', sub: 'FHSS/DSSS\n1–2 Mbps', color: '#06b6d4' },
              { year: '1999', std: '802.11b',  sub: 'HR-DSSS\n11 Mbps',  color: '#a855f7' },
              { year: '1999', std: '802.11a',  sub: 'OFDM 5GHz\n54 Mbps', color: '#10b981' },
              { year: '2003', std: '802.11g',  sub: 'ERP-OFDM\n54 Mbps',  color: '#f59e0b' },
              { year: '2009', std: '802.11n',  sub: 'HT-OFDM\n600 Mbps', color: '#ef4444' },
            ].map((item) => (
              <div key={item.std} className="flex flex-col items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 z-10" style={{ backgroundColor: item.color, borderColor: item.color }} />
                <div className="text-center">
                  <p className="text-xs font-bold text-white">{item.std}</p>
                  <p className="text-xs text-slate-500">{item.year}</p>
                  <p className="text-xs text-slate-400 whitespace-pre-line mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {LEGACY_PHYS.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected === p.id ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            style={selected === p.id ? { borderColor: p.color + '60', background: p.color + '15', color: p.color } : {}}>
            {p.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 space-y-4" style={{ borderColor: phy.color + '30' }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-white text-base">{phy.name} — {phy.full}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{phy.std} · {phy.band} · Max {phy.maxRate}</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold border" style={{ color: phy.color, borderColor: phy.color + '40', background: phy.color + '15' }}>
              {phy.maxRate}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {phy.highlight.map(h => (
              <div key={h} className="bg-surface-900/60 rounded-lg px-3 py-2 text-xs font-bold text-center" style={{ color: phy.color }}>
                {h}
              </div>
            ))}
          </div>
          <ModeContent content={{ kid: phy.kid, enthusiast: phy.enthusiast, pro: phy.pro }}
            className="text-xs text-slate-400 leading-relaxed" />
        </motion.div>
      </AnimatePresence>

      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-sm">Legacy vs. Modern at a Glance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['PHY', 'Std', 'Band', 'Modulation', 'Max Rate', 'BW'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { phy: 'FHSS',     std: '802.11',  band: '2.4 GHz', mod: 'GFSK',         rate: '2 Mbps',   bw: '1 MHz' },
                { phy: 'DSSS',     std: '802.11',  band: '2.4 GHz', mod: 'DBPSK/DQPSK',  rate: '2 Mbps',   bw: '22 MHz' },
                { phy: 'HR-DSSS',  std: '802.11b', band: '2.4 GHz', mod: 'CCK',           rate: '11 Mbps',  bw: '22 MHz' },
                { phy: 'OFDM',     std: '802.11a', band: '5 GHz',   mod: 'BPSK→64-QAM',  rate: '54 Mbps',  bw: '20 MHz' },
                { phy: 'ERP-OFDM', std: '802.11g', band: '2.4 GHz', mod: 'BPSK→64-QAM',  rate: '54 Mbps',  bw: '20 MHz' },
                { phy: 'HT-OFDM',  std: '802.11n', band: '2.4/5 GHz', mod: 'BPSK→64-QAM', rate: '600 Mbps', bw: '20/40 MHz' },
                { phy: 'VHT-OFDM', std: '802.11ac',band: '5 GHz',   mod: 'BPSK→256-QAM', rate: '6.9 Gbps', bw: '20–160 MHz' },
                { phy: 'HE-OFDMA', std: '802.11ax',band: '2.4/5/6 GHz', mod: 'BPSK→1024-QAM', rate: '9.6 Gbps', bw: '20–160 MHz' },
                { phy: 'EHT-OFDMA',std: '802.11be',band: '2.4/5/6 GHz', mod: 'BPSK→4096-QAM', rate: '46 Gbps', bw: '20–320 MHz' },
              ].map(r => (
                <tr key={r.phy} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-bold text-band24">{r.phy}</td>
                  <td className="py-1.5 px-2 text-slate-400 font-mono">{r.std}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.band}</td>
                  <td className="py-1.5 px-2 text-slate-300">{r.mod}</td>
                  <td className="py-1.5 px-2 font-bold text-emerald-400">{r.rate}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.bw}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── OFDM Visualizer (kept from original) ────────────────────────────────────
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase ${modMode === m ? 'bg-band24/20 border-band24/50 text-band24' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
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

// ─── PPDU Formats ─────────────────────────────────────────────────────────────
const PPDU_FORMATS = [
  {
    id: 'non-ht', name: 'Non-HT (Legacy)', std: '802.11a/g', color: '#6b7280',
    fields: [
      { name: 'L-STF', bits: '8 µs', color: '#374151', desc: 'Legacy Short Training Field — AGC, timing sync' },
      { name: 'L-LTF', bits: '8 µs', color: '#374151', desc: 'Legacy Long Training Field — channel estimation' },
      { name: 'L-SIG', bits: '4 µs', color: '#4b5563', desc: 'Signal field — Rate, Length (BPSK, R=1/2)' },
      { name: 'DATA',  bits: 'variable', color: '#374151', desc: 'PSDU payload + tail/pad bits' },
    ],
    total: '20 µs overhead',
    note: 'All clients (b/g/n/ac/ax) must decode L-SIG to set their NAV.',
  },
  {
    id: 'ht-mixed', name: 'HT-Mixed', std: '802.11n', color: '#06b6d4',
    fields: [
      { name: 'L-STF', bits: '8 µs', color: '#164e63', desc: 'Legacy preamble for non-HT detection' },
      { name: 'L-LTF', bits: '8 µs', color: '#164e63', desc: 'Legacy channel estimate' },
      { name: 'L-SIG', bits: '4 µs', color: '#0e7490', desc: 'Legacy signal (sets NAV for legacy STAs)' },
      { name: 'HT-SIG', bits: '8 µs', color: '#0891b2', desc: 'HT signal fields — MCS, BW, STBC, AMPDU' },
      { name: 'HT-STF', bits: '4 µs', color: '#06b6d4', desc: 'HT Short Training Field (for AGC restart)' },
      { name: 'HT-LTF×N', bits: '4N µs', color: '#22d3ee', desc: 'One per spatial stream — MIMO channel est.' },
      { name: 'DATA', bits: 'variable', color: '#0891b2', desc: 'PSDU payload' },
    ],
    total: '32 µs + 4N overhead',
    note: 'Legacy STAs read L-SIG, set NAV. HT STAs read HT-SIG for MIMO parameters.',
  },
  {
    id: 'vht', name: 'VHT', std: '802.11ac', color: '#a855f7',
    fields: [
      { name: 'L-STF', bits: '8 µs', color: '#581c87', desc: 'Legacy preamble' },
      { name: 'L-LTF', bits: '8 µs', color: '#6b21a8', desc: 'Legacy training' },
      { name: 'L-SIG', bits: '4 µs', color: '#7e22ce', desc: 'Legacy signal (NAV)' },
      { name: 'VHT-SIG-A', bits: '8 µs', color: '#9333ea', desc: '2×OFDM symbols — BW, STBC, Nss, beam' },
      { name: 'VHT-STF', bits: '4 µs', color: '#a855f7', desc: 'VHT short training (AGC)' },
      { name: 'VHT-LTF×N', bits: '4N µs', color: '#c084fc', desc: 'N = Nsts — per-stream channel est.' },
      { name: 'VHT-SIG-B', bits: '4 µs', color: '#a855f7', desc: 'Per-user info for MU-MIMO' },
      { name: 'DATA', bits: 'variable', color: '#9333ea', desc: 'PSDU' },
    ],
    total: '36 µs + 4N overhead',
    note: 'MU-MIMO: up to 4 users in DL; VHT-SIG-B carries per-user allocation.',
  },
  {
    id: 'he-su', name: 'HE SU', std: '802.11ax', color: '#10b981',
    fields: [
      { name: 'L-STF', bits: '8 µs', color: '#064e3b', desc: 'Legacy compat.' },
      { name: 'L-LTF', bits: '8 µs', color: '#065f46', desc: 'Legacy compat.' },
      { name: 'L-SIG', bits: '4 µs', color: '#047857', desc: 'Legacy NAV' },
      { name: 'RL-SIG', bits: '4 µs', color: '#059669', desc: 'Repeated L-SIG — identifies HE PPDU' },
      { name: 'HE-SIG-A', bits: '8 µs', color: '#10b981', desc: 'Spatial reuse, BSS Color, TXOP, MCS, SS' },
      { name: 'HE-STF', bits: '4 µs', color: '#34d399', desc: 'HE AGC' },
      { name: 'HE-LTF×N', bits: 'Nsts×4/8 µs', color: '#6ee7b7', desc: 'Per-stream, supports 1×/2×/4× LTF' },
      { name: 'DATA', bits: 'variable', color: '#10b981', desc: 'PSDU + PE field' },
    ],
    total: '40 µs + variable overhead',
    note: 'BSS Color (6-bit) in HE-SIG-A enables Spatial Reuse — STAs from other BSSs can transmit simultaneously.',
  },
];

function PPDUFormatsTab() {
  const [selected, setSelected] = useState('non-ht');
  const fmt = PPDU_FORMATS.find(f => f.id === selected)!;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">PPDU Frame Formats</h3>
        <p className="text-xs text-slate-400">A PPDU (Physical Layer Protocol Data Unit) = preamble + header + PSDU. The preamble evolves with each generation to carry more MIMO/MU parameters.</p>
        <div className="flex gap-2 flex-wrap">
          {PPDU_FORMATS.map(f => (
            <button key={f.id} onClick={() => setSelected(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected === f.id ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={selected === f.id ? { borderColor: f.color + '60', background: f.color + '15', color: f.color } : {}}>
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <h3 className="font-bold text-white">{fmt.name} — {fmt.std}</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ color: fmt.color, background: fmt.color + '20' }}>{fmt.total}</span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max gap-0.5 h-14 items-stretch">
              {fmt.fields.map((f, i) => (
                <motion.div key={f.name} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.06 }}
                  title={f.desc}
                  className="flex flex-col items-center justify-center rounded px-2 min-w-12 cursor-help"
                  style={{ background: f.color, flex: f.name === 'DATA' ? 3 : 1 }}>
                  <span className="text-white text-xs font-bold text-center leading-tight">{f.name}</span>
                  <span className="text-white/60 text-xs text-center">{f.bits}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {fmt.fields.map(f => (
              <div key={f.name} className="flex gap-3 items-start">
                <span className="text-xs font-bold min-w-20 font-mono" style={{ color: fmt.color }}>{f.name}</span>
                <span className="text-xs text-slate-400">{f.desc}</span>
              </div>
            ))}
          </div>

          <div className="bg-surface-900/60 rounded-xl p-3 border border-slate-700/40">
            <p className="text-xs text-amber-300 font-semibold mb-1">Key Note</p>
            <p className="text-xs text-slate-400">{fmt.note}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="glass-panel p-4 border-glow-blue">
        <h3 className="font-bold text-white text-sm mb-3">PPDU Format Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Format', 'Standard', 'Fields', 'Overhead', 'Key Feature'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PPDU_FORMATS.map(f => (
                <tr key={f.id} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-bold" style={{ color: f.color }}>{f.name}</td>
                  <td className="py-1.5 px-2 text-slate-400 font-mono">{f.std}</td>
                  <td className="py-1.5 px-2 text-slate-300">{f.fields.length} fields</td>
                  <td className="py-1.5 px-2 text-slate-400">{f.total}</td>
                  <td className="py-1.5 px-2 text-slate-400">{f.note.split('—')[0].trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Guard Intervals ──────────────────────────────────────────────────────────
const GI_OPTIONS = [
  {
    gi: 800, label: '800 ns', std: '802.11a/b/g/n/ac (legacy)', color: '#06b6d4',
    overhead: '20%', throughputGain: 'baseline',
    delaySupport: 'Up to 800 ns delay spread (outdoor, campus)',
    kid: 'The original safe gap — works in big open spaces and outdoors where signals can bounce a long way.',
    enthusiast: '800 ns GI is the legacy option. It adds a 0.8 µs guard before each 3.2 µs OFDM symbol, totalling a 4 µs symbol period. Good for high-delay-spread environments.',
    pro: '800 ns CP = 25% of 3.2 µs symbol duration. Handles delay spread ≤ 800 ns (~240 m extra path). Standard for all 802.11 OFDM. Symbol period: 3.2 µs useful + 0.8 µs CP = 4.0 µs.',
  },
  {
    gi: 400, label: '400 ns', std: '802.11n / 802.11ac (optional)', color: '#a855f7',
    overhead: '11%', throughputGain: '+11% vs 800ns',
    delaySupport: 'Up to 400 ns (indoor, office)',
    kid: 'A shorter gap for indoor use where signals bounce less far. 11% faster than the old gap!',
    enthusiast: '802.11n introduced optional 400 ns SGI. Reduces overhead from 20% to ~11%. 802.11n must negotiate SGI in HT capabilities.',
    pro: '400 ns CP: symbol period 3.2 + 0.4 = 3.6 µs. Only safe when RMS delay spread < 400 ns (~120 m). 802.11n: optional per MCS; 802.11ac: optional. Throughput gain: 3.6/4.0 = 11.1%.',
  },
  {
    gi: 1600, label: '1600 ns', std: '802.11ax (Wi-Fi 6)', color: '#10b981',
    overhead: 'varies', throughputGain: 'For long symbols (2×)',
    delaySupport: 'Up to 1600 ns (used with 2× LTF)',
    kid: 'A longer gap for Wi-Fi 6 when using extra-long symbols to carry more data in 6 GHz or outdoor contexts.',
    enthusiast: '802.11ax introduces multiple GI options with different LTF sizes. 1600 ns is used with 2× LTF sequences to improve OFDMA efficiency.',
    pro: '802.11ax: 3 GIs (0.8, 1.6, 3.2 µs) × 3 LTF sizes (1×, 2×, 4×). Symbol period with 3.2 µs useful data + 1.6 µs GI = 4.8 µs. Used for medium delay-spread environments with 2× LTF.',
  },
  {
    gi: 3200, label: '3200 ns', std: '802.11ax (Wi-Fi 6)', color: '#f59e0b',
    overhead: 'varies', throughputGain: 'Best for dense/outdoor',
    delaySupport: 'Up to 3200 ns (with 4× LTF, MU-MIMO)',
    kid: 'The biggest safety gap for Wi-Fi 6 — used when many devices share the channel to make sure nobody steps on each other.',
    enthusiast: '3.2 µs GI is used with 4× LTF in 802.11ax for high-delay environments or to improve MU-MIMO accuracy with extended channel training.',
    pro: '3.2 µs GI + 4× LTF: symbol period = 3.2 + 3.2 = 6.4 µs. Total preamble 12.8 µs longer than with 1× LTF + 0.8 GI. Needed in outdoor 802.11ax cells with >1 µs RMS delay spread.',
  },
];

function GuardIntervalTab() {
  const [selected, setSelected] = useState(800);
  const gi = GI_OPTIONS.find(g => g.gi === selected)!;
  const symbolDuration = 3.2;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Guard Interval — ISI Protection</h3>
        <p className="text-xs text-slate-400">The Guard Interval (GI) is a copy of the end of an OFDM symbol prepended as a Cyclic Prefix (CP). It absorbs multipath echoes so the receiver starts FFT on clean data only.</p>

        <div className="bg-surface-900/60 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-slate-300 mb-2">Why GI Matters</p>
          <div className="relative h-28">
            <svg width="100%" height="112" viewBox="0 0 600 112">
              {/* Time axis */}
              <line x1="20" y1="90" x2="580" y2="90" stroke="#475569" strokeWidth="1" />
              <text x="290" y="108" fill="#475569" fontSize="10" textAnchor="middle">Time →</text>
              {/* Symbol 1 */}
              <rect x="20" y="30" width="60" height="40" fill="#06b6d420" stroke="#06b6d4" strokeWidth="1" rx="3" />
              <text x="50" y="55" fill="#06b6d4" fontSize="9" textAnchor="middle">CP 800ns</text>
              <rect x="80" y="20" width="200" height="60" fill="#0891b220" stroke="#0891b2" strokeWidth="1" rx="3" />
              <text x="180" y="55" fill="#0891b2" fontSize="10" textAnchor="middle">Symbol Data (3.2 µs)</text>
              {/* Echo */}
              <rect x="50" y="10" width="200" height="14" fill="#ef444430" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,2" rx="2" />
              <text x="150" y="21" fill="#ef4444" fontSize="9" textAnchor="middle">Multipath Echo (delayed)</text>
              {/* Arrow */}
              <line x1="80" y1="5" x2="80" y2="95" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" />
              <text x="82" y="10" fill="#22c55e" fontSize="9">GI starts</text>
              <text x="82" y="100" fill="#22c55e" fontSize="9">FFT start</text>
              {/* Symbol 2 */}
              <rect x="280" y="30" width="60" height="40" fill="#06b6d420" stroke="#06b6d4" strokeWidth="1" rx="3" />
              <text x="310" y="55" fill="#06b6d4" fontSize="9" textAnchor="middle">CP</text>
              <rect x="340" y="20" width="200" height="60" fill="#0891b220" stroke="#0891b2" strokeWidth="1" rx="3" />
              <text x="440" y="55" fill="#0891b2" fontSize="10" textAnchor="middle">Symbol Data (3.2 µs)</text>
            </svg>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {GI_OPTIONS.map(g => (
            <button key={g.gi} onClick={() => setSelected(g.gi)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selected === g.gi ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={selected === g.gi ? { borderColor: g.color + '60', background: g.color + '15', color: g.color } : {}}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 space-y-4" style={{ borderColor: gi.color + '30' }}>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <h3 className="font-bold text-white">{gi.label} Guard Interval</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ color: gi.color, background: gi.color + '20' }}>{gi.std}</span>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex flex-1 h-10 rounded-lg overflow-hidden border border-slate-700/50">
              <div className="flex items-center justify-center text-xs font-bold text-white"
                style={{ width: `${(gi.gi / (symbolDuration * 1000 + gi.gi)) * 100}%`, background: gi.color + 'aa' }}>
                GI
              </div>
              <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-300 bg-slate-700/50">
                Data ({symbolDuration} µs)
              </div>
            </div>
            <span className="text-xs text-slate-400 min-w-16">
              {(symbolDuration * 1000 + gi.gi) / 1000} µs total
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { k: 'GI Duration', v: gi.label },
              { k: 'Symbol Total', v: `${(symbolDuration * 1000 + gi.gi) / 1000} µs` },
              { k: 'Max Delay Spread', v: gi.delaySupport.split(' (')[0] },
              { k: 'Overhead', v: `${Math.round(gi.gi / (symbolDuration * 1000 + gi.gi) * 100)}%` },
              { k: 'Throughput Gain', v: gi.throughputGain },
              { k: 'Environment', v: gi.delaySupport.split('(')[1]?.replace(')', '') ?? '—' },
            ].map(f => (
              <div key={f.k} className="bg-surface-900/60 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500">{f.k}</p>
                <p className="text-xs font-bold" style={{ color: gi.color }}>{f.v}</p>
              </div>
            ))}
          </div>

          <ModeContent content={{ kid: gi.kid, enthusiast: gi.enthusiast, pro: gi.pro }}
            className="text-xs text-slate-400 leading-relaxed" />
        </motion.div>
      </AnimatePresence>

      <div className="glass-panel p-4 border-glow-blue">
        <h3 className="font-bold text-white text-sm mb-3">GI Comparison Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['GI', 'Symbol Period', 'Overhead', 'Standard', 'Best For'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GI_OPTIONS.map(g => (
                <tr key={g.gi} className={`border-b border-slate-800/40 ${selected === g.gi ? 'bg-surface-700/30' : ''}`}>
                  <td className="py-1.5 px-2 font-bold font-mono" style={{ color: g.color }}>{g.label}</td>
                  <td className="py-1.5 px-2 text-slate-300">{(symbolDuration * 1000 + g.gi) / 1000} µs</td>
                  <td className="py-1.5 px-2 text-slate-400">{Math.round(g.gi / (symbolDuration * 1000 + g.gi) * 100)}%</td>
                  <td className="py-1.5 px-2 text-slate-400">{g.std.split(' (')[0]}</td>
                  <td className="py-1.5 px-2 text-slate-400">{g.delaySupport.split(' (')[1]?.replace(')', '') ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Constellation Diagram (kept from original) ───────────────────────────────
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

// ─── MCS Index Table (kept from original) ────────────────────────────────────
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

// ─── Channel Bonding (kept from original) ────────────────────────────────────
function ChannelBonding() {
  const [bonded, setBonded] = useState<20 | 40 | 80 | 160 | 320>(80);
  const channels = {
    20:  [{ label: 'CH 36' }],
    40:  [{ label: 'CH 36' }, { label: 'CH 40' }],
    80:  [{ label: 'CH 36' }, { label: 'CH 40' }, { label: 'CH 44' }, { label: 'CH 48' }],
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

// ─── STBC & Spatial Streams ───────────────────────────────────────────────────
const SPATIAL_CONFIGS = [
  { ss: 1, chains: 1, peakMbps: 600,  color: '#06b6d4', note: 'SISO — single spatial stream. Best range.' },
  { ss: 2, chains: 2, peakMbps: 1200, color: '#a855f7', note: '2×2 MIMO — 2× throughput, standard home AP.' },
  { ss: 3, chains: 3, peakMbps: 1800, color: '#10b981', note: '3×3 MIMO — common in enterprise APs.' },
  { ss: 4, chains: 4, peakMbps: 2400, color: '#f59e0b', note: '4×4 MIMO — max client chains (Wi-Fi 6).' },
  { ss: 8, chains: 8, peakMbps: 9607, color: '#ef4444', note: '8×8 MIMO — APs only (Wi-Fi 6/7), MU-MIMO.' },
];

function STBCSpatialTab() {
  const [mode, setMode] = useState<'stbc' | 'spatial'>('spatial');
  const [selectedSS, setSelectedSS] = useState(2);
  const cfg = SPATIAL_CONFIGS.find(s => s.ss === selectedSS)!;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['spatial', 'stbc'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${mode === m ? 'bg-band5/20 border-band5/50 text-band5' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {m === 'spatial' ? 'Spatial Streams' : 'STBC'}
          </button>
        ))}
      </div>

      {mode === 'spatial' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border-glow-blue space-y-4">
            <h3 className="font-bold text-white">MIMO — Spatial Stream Multiplexing</h3>
            <p className="text-xs text-slate-400">Multiple-Input Multiple-Output (MIMO) sends independent data streams over different antenna paths simultaneously. Each spatial stream is encoded separately and decoded at the receiver using channel knowledge.</p>

            <div className="flex gap-2 flex-wrap">
              {SPATIAL_CONFIGS.map(s => (
                <button key={s.ss} onClick={() => setSelectedSS(s.ss)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedSS === s.ss ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                  style={selectedSS === s.ss ? { borderColor: s.color + '60', background: s.color + '15', color: s.color } : {}}>
                  {s.ss}SS / {s.chains}×{s.chains}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={selectedSS} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-4">
                <div className="bg-surface-900/60 rounded-xl p-4 flex gap-6 items-center flex-wrap">
                  <svg width="200" height="120" viewBox="0 0 200 120" className="flex-shrink-0">
                    {Array.from({ length: Math.min(cfg.chains, 4) }).map((_, i) => {
                      const y = 15 + i * (90 / Math.min(cfg.chains, 4));
                      const color = cfg.color;
                      return (
                        <g key={i}>
                          <rect x="10" y={y} width="30" height="16" rx="3" fill={color + '30'} stroke={color} strokeWidth="1" />
                          <text x="25" y={y + 11} fill={color} fontSize="8" textAnchor="middle">TX{i+1}</text>
                          <motion.line x1="40" y1={y+8} x2="160" y2={y+8} stroke={color} strokeWidth="1.5"
                            strokeDasharray="4,3" opacity="0.7"
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity, repeatDelay: 1 }} />
                          <rect x="160" y={y} width="30" height="16" rx="3" fill={color + '30'} stroke={color} strokeWidth="1" />
                          <text x="175" y={y + 11} fill={color} fontSize="8" textAnchor="middle">RX{i+1}</text>
                        </g>
                      );
                    })}
                    <text x="100" y="112" fill="#64748b" fontSize="9" textAnchor="middle">{cfg.chains}×{cfg.chains} MIMO</text>
                  </svg>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { k: 'Spatial Streams', v: `${cfg.ss}` },
                        { k: 'Antenna Config', v: `${cfg.chains}×${cfg.chains}` },
                        { k: 'Peak Rate (Wi-Fi 6)', v: `${cfg.peakMbps >= 1000 ? (cfg.peakMbps/1000).toFixed(1) + ' Gbps' : cfg.peakMbps + ' Mbps'}` },
                        { k: 'Multiplier', v: `${cfg.ss}× vs SISO` },
                      ].map(f => (
                        <div key={f.k} className="bg-surface-800/60 rounded-lg px-2 py-1.5">
                          <p className="text-xs text-slate-500">{f.k}</p>
                          <p className="text-xs font-bold" style={{ color: cfg.color }}>{f.v}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">{cfg.note}</p>
                  </div>
                </div>

                <ModeContent content={{
                  kid: `${cfg.ss} spatial stream${cfg.ss > 1 ? 's' : ''} = ${cfg.ss} separate data lane${cfg.ss > 1 ? 's' : ''} through the air at the same time — like having ${cfg.ss} delivery truck${cfg.ss > 1 ? 's' : ''} instead of 1!`,
                  enthusiast: `${cfg.ss}SS MIMO: ${cfg.chains}×${cfg.chains} configuration. Each stream needs independent channel paths (spatial separation). ${cfg.ss > 2 ? 'Diminishing returns past 3SS for most clients.' : ''}`,
                  pro: `${cfg.ss}SS: requires ≥${cfg.ss} Tx chains at AP, ≥${cfg.ss} Rx chains at STA. Channel matrix H is ${cfg.chains}×${cfg.chains}. SVD decomposition yields min(Ntx,Nrx)=${cfg.chains} eigenmodes. Capacity: ${cfg.ss}× Shannon for uncorrelated H.`,
                }} className="text-xs text-slate-400 leading-relaxed" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="glass-panel p-5 border-glow-blue">
            <h3 className="font-bold text-white text-sm mb-3">SU-MIMO vs MU-MIMO</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  name: 'SU-MIMO', std: '802.11n/ac/ax', color: '#06b6d4',
                  desc: 'All spatial streams go to ONE client. Client must have ≥N receive chains. Common for large file transfers.',
                  bullets: ['802.11n: up to 4SS', '802.11ac: up to 8SS', 'Full antenna array for 1 user', 'Client needs matching chains'],
                },
                {
                  name: 'MU-MIMO', std: '802.11ac (DL) / 802.11ax (UL+DL)', color: '#a855f7',
                  desc: 'Spatial streams split across MULTIPLE clients simultaneously. Each client gets 1-4 streams. AP uses beamforming to separate users.',
                  bullets: ['802.11ac: DL only, 4 users', '802.11ax: UL+DL, 8 users', 'Beamforming required', 'Channel sounding needed'],
                },
              ].map(item => (
                <div key={item.name} className="bg-surface-900/60 rounded-xl p-4 border" style={{ borderColor: item.color + '30' }}>
                  <h4 className="font-bold text-sm mb-0.5" style={{ color: item.color }}>{item.name}</h4>
                  <p className="text-xs text-slate-500 mb-2">{item.std}</p>
                  <p className="text-xs text-slate-400 mb-2">{item.desc}</p>
                  <ul className="space-y-0.5">
                    {item.bullets.map(b => (
                      <li key={b} className="text-xs text-slate-400 flex gap-1.5 items-start">
                        <span style={{ color: item.color }}>▸</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'stbc' && (
        <div className="space-y-5">
          <div className="glass-panel p-5 border-glow-blue space-y-4">
            <h3 className="font-bold text-white">STBC — Space-Time Block Coding</h3>
            <p className="text-xs text-slate-400">STBC transmits the SAME data redundantly on multiple antennas using orthogonal codes (Alamouti scheme). Unlike spatial multiplexing, STBC increases diversity (range/reliability) rather than throughput.</p>

            <div className="bg-surface-900/60 rounded-xl p-4">
              <svg width="100%" height="160" viewBox="0 0 600 160">
                {/* Transmitter */}
                <rect x="10" y="50" width="60" height="60" rx="6" fill="#06b6d420" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="40" y="80" fill="#06b6d4" fontSize="10" textAnchor="middle" fontWeight="bold">TX</text>
                <text x="40" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">Encoder</text>
                {/* Antennas */}
                <line x1="70" y1="65" x2="100" y2="40" stroke="#06b6d4" strokeWidth="1.5" />
                <text x="105" y="38" fill="#06b6d4" fontSize="9">Ant 1</text>
                <line x1="70" y1="95" x2="100" y2="120" stroke="#a855f7" strokeWidth="1.5" />
                <text x="105" y="118" fill="#a855f7" fontSize="9">Ant 2</text>

                {/* Alamouti coding */}
                <rect x="160" y="25" width="80" height="30" rx="4" fill="#06b6d420" stroke="#06b6d4" strokeWidth="1" />
                <text x="200" y="40" fill="#06b6d4" fontSize="9" textAnchor="middle">t=0: S1, S2</text>
                <text x="200" y="52" fill="#64748b" fontSize="8" textAnchor="middle">slot 1</text>

                <rect x="160" y="105" width="80" height="30" rx="4" fill="#a855f720" stroke="#a855f7" strokeWidth="1" />
                <text x="200" y="120" fill="#a855f7" fontSize="9" textAnchor="middle">t=0: -S2*, S1*</text>
                <text x="200" y="132" fill="#64748b" fontSize="8" textAnchor="middle">slot 1</text>

                <text x="200" y="82" fill="#10b981" fontSize="9" textAnchor="middle" fontWeight="bold">Alamouti</text>
                <text x="200" y="93" fill="#64748b" fontSize="8" textAnchor="middle">2×1 STBC</text>

                {/* Paths */}
                <line x1="240" y1="40" x2="380" y2="80" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
                <line x1="240" y1="120" x2="380" y2="80" stroke="#a855f7" strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />

                {/* Receiver */}
                <rect x="380" y="50" width="60" height="60" rx="6" fill="#10b98120" stroke="#10b981" strokeWidth="1.5" />
                <text x="410" y="80" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="bold">RX</text>
                <text x="410" y="95" fill="#94a3b8" fontSize="9" textAnchor="middle">1 chain</text>

                {/* Result */}
                <rect x="470" y="55" width="110" height="50" rx="6" fill="#22c55e20" stroke="#22c55e" strokeWidth="1" />
                <line x1="440" y1="80" x2="470" y2="80" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr)" />
                <text x="525" y="77" fill="#22c55e" fontSize="9" textAnchor="middle" fontWeight="bold">Diversity Gain</text>
                <text x="525" y="90" fill="#94a3b8" fontSize="8" textAnchor="middle">2× antenna, 1× stream</text>
                <text x="525" y="101" fill="#94a3b8" fontSize="8" textAnchor="middle">Better range/SNR</text>
              </svg>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  name: 'STBC (Diversity)', color: '#10b981',
                  pros: ['Better range/coverage', 'Works with 1 receive chain', 'More robust link', 'No sounding needed'],
                  cons: ['No throughput increase', 'Half the spectrum efficiency (Alamouti)'],
                },
                {
                  name: 'Spatial Mux (Speed)', color: '#a855f7',
                  pros: ['N× throughput gain', 'Maximum data rate', 'Works with MU-MIMO'],
                  cons: ['Needs N receive chains', 'Weaker link at edges', 'Requires good SNR'],
                },
              ].map(item => (
                <div key={item.name} className="bg-surface-900/60 rounded-xl p-4 border" style={{ borderColor: item.color + '30' }}>
                  <h4 className="font-bold text-sm mb-2" style={{ color: item.color }}>{item.name}</h4>
                  <p className="text-xs text-emerald-400 font-semibold mb-1">Pros</p>
                  {item.pros.map(p => <p key={p} className="text-xs text-slate-400">+ {p}</p>)}
                  <p className="text-xs text-red-400 font-semibold mt-2 mb-1">Cons</p>
                  {item.cons.map(c => <p key={c} className="text-xs text-slate-400">− {c}</p>)}
                </div>
              ))}
            </div>

            <ModeContent content={{
              kid: 'STBC is like sending the same message twice by different routes — if one path is blocked, the other gets through! Spatial streams are like sending TWO DIFFERENT messages at the same time for double the speed.',
              enthusiast: 'STBC uses the Alamouti scheme: TX1 sends [S1, −S2*], TX2 sends [S2, S1*] in 2 time slots. A single-chain receiver can still recover both symbols. Trades throughput for reliability.',
              pro: 'Alamouti STBC: 2 Tx, 1 Rx. Diversity order = 2, coding gain = 0 dB (no coding gain vs MRC with 2 Rx chains). Rate = 1 (full-rate code). 802.11n: Nss=1, Nsts=2 for 2-stream STBC. STBC cap: Nsts ≤ 2×Nss. Cannot combine with spatial multiplexing on same stream.',
            }} className="text-xs text-slate-400 leading-relaxed" />
          </div>

          <div className="glass-panel p-4 border-glow-blue">
            <h3 className="font-bold text-white text-sm mb-3">Tx Beamforming (TxBF)</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  name: 'Implicit BF', color: '#06b6d4',
                  desc: 'AP estimates channel from uplink frames. No sounding. Less accurate. Used in 802.11n.',
                },
                {
                  name: 'Explicit BF', color: '#a855f7',
                  desc: 'Client sends Channel State Info (CSI) via NDP sounding. AP computes steering matrix V. 802.11ac/ax standard.',
                },
                {
                  name: 'MU-MIMO BF', color: '#10b981',
                  desc: 'AP sounds multiple clients, computes per-client steering to null interference between users. Requires NDP + NDPA.',
                },
              ].map(item => (
                <div key={item.name} className="bg-surface-900/60 rounded-xl p-3 border" style={{ borderColor: item.color + '30' }}>
                  <h4 className="font-bold text-xs mb-1" style={{ color: item.color }}>{item.name}</h4>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Chapter2 Component ──────────────────────────────────────────────────
export function Chapter2() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Legacy PHY');

  useEffect(() => {
    ['legacyphy', 'ofdm', 'ppdu', 'gi', 'modulation', 'mcs', 'bonding', 'stbc']
      .forEach(id => markComplete('ch2', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="How bits become radio waves — from the original 1997 FHSS/DSSS through HT/VHT/HE OFDM, PPDU formats, guard intervals, MCS tables, channel bonding, and MIMO/STBC." />
        <ModeBadge />
      </div>

      <div className="flex gap-1 flex-wrap border-b border-slate-700/50 pb-1">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-t-lg text-xs font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-band24 text-band24'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'Legacy PHY'     && <LegacyPHYTab />}
          {activeTab === 'OFDM & OFDMA'  && <OFDMVisualizer />}
          {activeTab === 'PPDU Formats'  && <PPDUFormatsTab />}
          {activeTab === 'Guard Intervals' && <GuardIntervalTab />}
          {activeTab === 'Modulation & MCS' && (
            <div className="space-y-6">
              <ConstellationDiagram />
              <MCSTable />
            </div>
          )}
          {activeTab === 'Channel Bonding' && <ChannelBonding />}
          {activeTab === 'STBC & Streams' && <STBCSpatialTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
