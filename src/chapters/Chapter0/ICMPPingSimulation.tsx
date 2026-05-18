import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModeContent } from '../../components/shared/ModeContent';

interface PingResult {
  seq: number;
  sent: number;
  ttl: number;
  rtt: number;
  status: 'success' | 'timeout';
}

function simulatePing(seq: number): PingResult {
  const rtt = 12 + Math.random() * 35 + (seq === 2 ? 80 : 0); // spike on seq 2
  return { seq, sent: Date.now(), ttl: 55, rtt: Math.round(rtt * 10) / 10, status: seq === 4 ? 'timeout' : 'success' };
}

export function ICMPPingSimulation() {
  const { markComplete } = useApp();
  const [target, setTarget]      = useState('8.8.8.8');
  const [results, setResults]    = useState<PingResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [packetDir, setPacketDir] = useState<'out' | 'in' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef   = useRef(0);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
    setIsRunning(false);
    setPacketDir(null);
    seqRef.current = 0;
  }, []);

  const sendPing = useCallback(() => {
    if (seqRef.current >= 5) {
      setIsRunning(false);
      setPacketDir(null);
      markComplete('ch0', 'icmp');
      return;
    }
    const seq = ++seqRef.current;
    setPacketDir('out');
    timerRef.current = setTimeout(() => {
      setPacketDir('in');
      const result = simulatePing(seq);
      timerRef.current = setTimeout(() => {
        setResults(r => [...r, result]);
        setPacketDir(null);
        timerRef.current = setTimeout(sendPing, 600);
      }, 500);
    }, 700);
  }, [markComplete]);

  const handlePlay = useCallback(() => {
    reset();
    setIsRunning(true);
    timerRef.current = setTimeout(sendPing, 300);
  }, [reset, sendPing]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const avgRtt = results.filter(r => r.status === 'success').reduce((s, r, _, a) => s + r.rtt / a.length, 0);
  const lost = results.filter(r => r.status === 'timeout').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-wired">ICMP</span> — Ping & Network Diagnostics
          </h3>
          <ModeContent
            content={{
              kid:        'Send a "Marco Polo!" shout across the internet and see how fast the echo comes back!',
              enthusiast: 'Ping tests if a remote host is reachable and measures round-trip latency in milliseconds.',
              pro:        'ICMP Echo Request (Type 8 Code 0) → ICMP Echo Reply (Type 0 Code 0). Measures RTT; TTL decrements at each hop for loop prevention.',
            }}
            className="text-sm text-slate-400 mt-0.5"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handlePlay} disabled={isRunning} className="btn-primary flex items-center gap-1.5 text-sm">
            <Play size={14} fill="currentColor" />
            {isRunning ? 'Pinging…' : 'Ping!'}
          </button>
        </div>
      </div>

      {/* Target input */}
      <div className="glass-panel px-4 py-2.5 flex items-center gap-3 border-glow-amber">
        <span className="text-slate-500 font-mono text-sm">$</span>
        <span className="text-wired font-mono text-sm">ping</span>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          className="flex-1 bg-transparent font-mono text-sm text-white outline-none"
          placeholder="8.8.8.8"
        />
        {results.length > 0 && (
          <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
            {results.length}/5 pkts
          </span>
        )}
      </div>

      {/* Visual ping animation */}
      <div className="glass-panel p-5 border-glow-amber">
        <svg viewBox="0 0 500 100" className="w-full" style={{ maxHeight: 100 }}>
          {/* Path line */}
          <line x1="60" y1="50" x2="440" y2="50" stroke="rgba(245,158,11,0.2)" strokeWidth="2" strokeDasharray="8 4" />

          {/* Your device */}
          <g transform="translate(60,50)">
            <circle r="24" fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="16">💻</text>
            <text textAnchor="middle" y="36" fill="#94a3b8" fontSize="8" fontFamily="Inter">You</text>
          </g>

          {/* Remote host */}
          <g transform="translate(440,50)">
            <circle r="24" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.5)" strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="16">🖥️</text>
            <text textAnchor="middle" y="36" fill="#94a3b8" fontSize="8" fontFamily="Inter">{target}</text>
          </g>

          {/* Animated packet */}
          <AnimatePresence>
            {packetDir === 'out' && (
              <motion.g
                key="out"
                initial={{ x: 85, opacity: 1 }}
                animate={{ x: 415, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: 'easeInOut' }}
              >
                <rect x="-22" y="-10" width="44" height="20" rx="4"
                  fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fill="#06b6d4" fontSize="7"
                  fontFamily="JetBrains Mono" fontWeight="700">ECHO REQ</text>
              </motion.g>
            )}
            {packetDir === 'in' && (
              <motion.g
                key="in"
                initial={{ x: 415, opacity: 1 }}
                animate={{ x: 85, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <rect x="-22" y="-10" width="44" height="20" rx="4"
                  fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fill="#10b981" fontSize="7"
                  fontFamily="JetBrains Mono" fontWeight="700">ECHO REP</text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Terminal-style results */}
      <div className="glass-panel p-4 font-mono text-xs border-glow-amber">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700/50">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="text-slate-500 ml-2">terminal</span>
        </div>
        <p className="text-slate-500 mb-1">PING {target} 64 bytes of data:</p>
        <div className="space-y-0.5 min-h-[80px]">
          {results.map(r => (
            <motion.div
              key={r.seq}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${r.status === 'timeout' ? 'text-red-400' : 'text-emerald-400'}`}
            >
              {r.status === 'timeout'
                ? `Request timeout for icmp_seq ${r.seq}`
                : `64 bytes from ${target}: icmp_seq=${r.seq} ttl=${r.ttl} time=${r.rtt} ms`
              }
            </motion.div>
          ))}
          {isRunning && (
            <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-slate-400">
              ▊
            </motion.span>
          )}
        </div>
        {results.length >= 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-2 border-t border-slate-700/50 text-slate-300">
            <p className="text-slate-400">--- {target} ping statistics ---</p>
            <p>5 packets transmitted, {5 - lost} received, {Math.round(lost / 5 * 100)}% packet loss</p>
            {results.filter(r => r.status === 'success').length > 0 && (
              <p className="text-emerald-400">round-trip min/avg/max = {Math.min(...results.filter(r => r.status === 'success').map(r => r.rtt))}/{Math.round(avgRtt * 10) / 10}/{Math.max(...results.filter(r => r.status === 'success').map(r => r.rtt))} ms</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Mode explanation */}
      <div className="glass-panel p-4 border-glow-amber">
        <ModeContent
          content={{
            kid:        '🏓 Ping is like playing Marco Polo! You shout "Marco!" (Echo Request) and wait for the echo "Polo!" (Echo Reply) to come back. The time it takes is called latency — the faster, the better! If no reply comes, that computer might be asleep or too far away.',
            enthusiast: '⚡ Ping uses ICMP packets to check if a host is reachable and measures the round-trip time (RTT) in milliseconds. Lower is better — under 20ms is great for gaming, under 100ms is fine for browsing. Packet loss (like seq 4 here) means some data is being dropped somewhere along the route.',
            pro:        '🔬 ICMP Echo Request carries: Type=8, Code=0, Identifier (process ID), Sequence Number, and a data payload. Each router hop decrements the IP TTL field by 1; at TTL=0 the packet is discarded and an ICMP Time Exceeded (Type 11, Code 0) is sent back — this is how traceroute maps the network path. Note: many enterprise firewalls block ICMP, making ping unreliable as a liveness test.',
          }}
          className="text-sm text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}
