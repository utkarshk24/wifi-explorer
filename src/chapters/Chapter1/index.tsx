import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch1')!;

// ─── Wave Simulator ───────────────────────────────────────────────────────────
function WaveSimulator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freq, setFreq]       = useState(2.4);  // GHz
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
    const W = canvas.width;
    const H = canvas.height;
    const atten = ATTENUATION[obstacle];

    const draw = () => {
      tRef.current += 0.04;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = 'rgba(10,15,30,0.98)';
      ctx.fillRect(0, 0, W, H);

      // Obstacle wall
      if (obstacle !== 'none') {
        const wallColors = { wood: '#92400e', concrete: '#475569', glass: '#0ea5e9' };
        ctx.fillStyle = wallColors[obstacle] + '55';
        ctx.strokeStyle = wallColors[obstacle] + 'aa';
        ctx.lineWidth = 2;
        ctx.fillRect(W * 0.55 - 8, 0, 16, H);
        ctx.strokeRect(W * 0.55 - 8, 0, 16, H);
        ctx.fillStyle = wallColors[obstacle] + 'cc';
        ctx.font = '11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(obstacle.toUpperCase(), W * 0.55, H - 10);
      }

      // Wave
      const cycles = freq / 0.8;
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      for (let x = 0; x < W; x++) {
        const progress = x / W;
        const wall = W * 0.55;
        const att = obstacle !== 'none' && x > wall ? atten : 1;
        const decay = obstacle !== 'none' && x > wall ? Math.exp(-(x - wall) / (W * 0.35)) : 1;
        const a = amplitude * att * (progress < 0.55 ? 1 : decay);
        const y = H / 2 - a * Math.sin(cycles * 2 * Math.PI * progress - tRef.current);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, freqColor);
      grad.addColorStop(obstacle !== 'none' ? 0.55 : 1, freqColor);
      if (obstacle !== 'none') grad.addColorStop(1, freqColor + '40');
      ctx.strokeStyle = grad;
      ctx.shadowColor = freqColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Source dot
      ctx.beginPath();
      ctx.arc(20, H / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = freqColor;
      ctx.shadowColor = freqColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [freq, amplitude, obstacle, freqColor]);

  const bandLabel = freq <= 2.5 ? '2.4 GHz' : freq <= 6.0 ? '5 GHz' : '6 GHz';

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white text-base">Interactive RF Wave Simulator</h3>
        <span className="chip border text-xs" style={{ color: freqColor, borderColor: freqColor + '50', background: freqColor + '15' }}>
          {bandLabel} · Amplitude {amplitude}% · {obstacle !== 'none' ? obstacle + ' wall' : 'Open air'}
        </span>
      </div>
      <canvas ref={canvasRef} width={700} height={140} className="w-full rounded-lg" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Frequency: <span className="font-bold" style={{ color: freqColor }}>{freq.toFixed(1)} GHz</span>
          </label>
          <input type="range" min="2.4" max="7.0" step="0.1" value={freq}
            onChange={e => setFreq(+e.target.value)}
            className="w-full accent-cyan-500" />
          <div className="flex justify-between text-xs text-slate-600 mt-0.5">
            <span>2.4</span><span>5</span><span>6E/7</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Signal Strength: <span className="font-bold text-white">{amplitude}%</span>
          </label>
          <input type="range" min="10" max="80" step="5" value={amplitude}
            onChange={e => setAmplitude(+e.target.value)}
            className="w-full accent-purple-500" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Wall Obstacle</label>
          <div className="grid grid-cols-2 gap-1">
            {(['none', 'glass', 'wood', 'concrete'] as const).map(o => (
              <button key={o} onClick={() => setObstacle(o)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  obstacle === o ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                 : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                {o === 'none' ? '✅ None' : o === 'glass' ? '🪟 Glass' : o === 'wood' ? '🌲 Wood' : '🧱 Concrete'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ModeContent
        content={{
          kid: '📻 Higher frequency = shorter waves that carry MORE data but don\'t travel as far through walls! 2.4GHz is like a foghorn — goes far but is slow. 6GHz is like a flashlight — fast but walls block it easily!',
          enthusiast: '⚡ Higher frequencies (5/6 GHz) offer more bandwidth and less interference but suffer greater path loss through obstacles. Concrete can attenuate 6 GHz signals by 15-25 dB. 2.4 GHz penetrates walls better — useful for range, but the band is congested.',
          pro: '🔬 Free-space path loss: FSPL = 20log₁₀(d) + 20log₁₀(f) + 20log₁₀(4π/c). Concrete attenuation: ~10-20 dB per wall at 5 GHz. Glass: ~2-3 dB. Multipath from reflections creates constructive/destructive interference patterns affecting SNR non-linearly.',
        }}
        className="text-sm text-slate-400 leading-relaxed"
      />
    </div>
  );
}

// ─── RF Math Quick Reference ──────────────────────────────────────────────────
const RF_CONCEPTS = [
  {
    icon: '📶', title: 'dBm (Signal Power)',
    kid: 'A number that measures how loud your Wi-Fi signal is! -30 dBm is super loud. -90 dBm is almost a whisper.',
    enthusiast: 'dBm measures absolute signal power. -30 dBm is excellent, -70 dBm is usable, below -80 dBm connections drop.',
    pro: 'dBm = 10log₁₀(P/1mW). Typical AP TX power: +20 to +30 dBm. RSSI threshold for association: typically -82 dBm. MCS0 sensitivity ~-90 dBm; MCS11 ~-65 dBm.',
  },
  {
    icon: '📏', title: 'SNR (Signal-to-Noise Ratio)',
    kid: 'Imagine talking in a noisy cafeteria. SNR is how much LOUDER your voice is than the background noise. Higher = clearer!',
    enthusiast: 'SNR is the ratio of your signal to background RF noise. SNR > 25 dB supports high data rates. Low SNR = slow speeds and dropped connections.',
    pro: 'SNR = Signal(dBm) - Noise Floor(dBm). Typical noise floor: -95 to -100 dBm. Required SNR per MCS (802.11ax): MCS0=5dB, MCS7=20dB, MCS11=30dB. SINR adds interference: SINR = S/(N+I).',
  },
  {
    icon: '📡', title: 'Antenna Gain (dBi)',
    kid: 'A flashlight focuses light in one direction to reach further. Directional antennas focus radio waves the same way — more focused = more range in that direction!',
    enthusiast: 'Antenna gain measures how much an antenna focuses power in a specific direction vs. radiating equally in all directions. High-gain directional antennas cover longer distances; omni antennas cover 360° around an AP.',
    pro: 'Gain in dBi referenced to isotropic radiator. Omni dipole: 2.15 dBi typical. Sector antenna: 12-18 dBi. Patch/Yagi: 10-24 dBi. EIRP = TX Power(dBm) + Antenna Gain(dBi) - Cable Loss(dB). FCC Part 15 limits EIRP: 30 dBm (2.4 GHz), 23-36 dBm (5 GHz).',
  },
];

export function Chapter1() {
  const { mode, markComplete } = useApp();

  useEffect(() => {
    ['spectrum', 'waves', 'propagation', 'fspl', 'fresnel', 'multipath', 'linkbudget', 'rfmath', 'channels']
      .forEach(id => markComplete('ch1', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Learn how radio waves carry your data through the air — the physics and math behind every Wi-Fi connection." />
        <ModeBadge />
      </div>

      <WaveSimulator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RF_CONCEPTS.map(c => (
          <motion.div key={c.title} whileHover={{ y: -2 }} className="glass-panel p-4 border-glow-blue">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{c.icon}</span>
              <h3 className="font-bold text-white text-sm">{c.title}</h3>
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={`${c.title}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-xs text-slate-400 leading-relaxed">{c[mode]}</motion.p>
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
