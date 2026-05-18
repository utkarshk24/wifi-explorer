import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, RotateCcw } from 'lucide-react';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'sandbox')!;

type NodeType = 'switch' | 'dhcp' | 'ap' | 'client';

interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
}

const NODE_META: Record<NodeType, { icon: string; color: string; label: string }> = {
  switch: { icon: '🔀', color: '#f59e0b', label: 'L2 Switch' },
  dhcp:   { icon: '🖥️', color: '#06b6d4', label: 'DHCP Server' },
  ap:     { icon: '📡', color: '#a855f7', label: 'Access Point' },
  client: { icon: '💻', color: '#10b981', label: 'Wi-Fi Client' },
};

const DEFAULT_NODES: NetworkNode[] = [
  { id: '1', type: 'switch', label: 'Core Switch',  x: 300, y: 100 },
  { id: '2', type: 'dhcp',   label: 'DHCP Server',  x: 150, y: 220 },
  { id: '3', type: 'ap',     label: 'AP-1 (Wi-Fi 7)', x: 450, y: 220 },
  { id: '4', type: 'client', label: 'Laptop',        x: 350, y: 340 },
  { id: '5', type: 'client', label: 'Phone',         x: 550, y: 340 },
];

const DEFAULT_LINKS = [
  { from: '1', to: '2' },
  { from: '1', to: '3' },
  { from: '3', to: '4' },
  { from: '3', to: '5' },
];

export function Sandbox() {
  const [nodes, setNodes] = useState<NetworkNode[]>(DEFAULT_NODES);
  const [links] = useState(DEFAULT_LINKS);
  const [simRunning, setSimRunning] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);

  const addNode = (type: NodeType) => {
    const meta = NODE_META[type];
    setNodes(n => [...n, {
      id: String(Date.now()),
      type,
      label: meta.label,
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
    }]);
  };

  const removeNode = (id: string) => setNodes(n => n.filter(x => x.id !== id));

  const runSimulation = () => {
    setSimRunning(true);
    setSimLog([]);
    const steps = [
      '[0.0s] Network initialized. Topology: Switch → DHCP Server, AP(s), Clients.',
      '[0.1s] DHCP Server listening on UDP :67...',
      '[0.2s] Laptop broadcasts DHCP Discover (src 0.0.0.0 → 255.255.255.255)',
      '[0.3s] Phone broadcasts DHCP Discover',
      '[0.4s] DHCP Server → Laptop: OFFER 192.168.1.101 (lease 86400s)',
      '[0.5s] DHCP Server → Phone: OFFER 192.168.1.102 (lease 86400s)',
      '[0.6s] Laptop broadcasts DHCP Request (192.168.1.101)',
      '[0.7s] Phone broadcasts DHCP Request (192.168.1.102)',
      '[0.8s] DHCP Server → Laptop: ACK ✓ — IP: 192.168.1.101/24 GW: 192.168.1.1',
      '[0.9s] DHCP Server → Phone: ACK ✓ — IP: 192.168.1.102/24 GW: 192.168.1.1',
      '[1.0s] Laptop: ARP probe 192.168.1.101 — no conflict detected',
      '[1.1s] Laptop DNS: Querying 8.8.8.8 for google.com... → 142.250.80.46',
      '[1.2s] 🎉 All clients online! Network simulation complete.',
    ];
    steps.forEach((s, i) => {
      setTimeout(() => {
        setSimLog(l => [...l, s]);
        if (i === steps.length - 1) setSimRunning(false);
      }, i * 400);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Design and simulate your own end-to-end network. Add devices, connect them, and watch DHCP, DNS, and ARP run in real-time." />
        <ModeBadge />
      </div>

      {/* Toolbar */}
      <div className="glass-panel p-3 flex flex-wrap gap-2 items-center border-glow-green">
        <span className="text-xs text-slate-500 mr-1">Add:</span>
        {(Object.entries(NODE_META) as [NodeType, typeof NODE_META[NodeType]][]).map(([type, meta]) => (
          <button key={type} onClick={() => addNode(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
            style={{ borderColor: meta.color + '60', color: meta.color, background: meta.color + '15' }}>
            <Plus size={11} /> {meta.icon} {meta.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setNodes(DEFAULT_NODES); setSimLog([]); }} className="btn-ghost text-xs flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={runSimulation} disabled={simRunning} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {simRunning ? 'Simulating…' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {/* Canvas + Log */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Network canvas */}
        <div className="lg:col-span-2 glass-panel overflow-hidden border-glow-green" style={{ minHeight: 420 }}>
          <div className="p-2 border-b border-slate-700/50">
            <span className="text-xs text-slate-500">Network Topology Canvas</span>
          </div>
          <svg viewBox="0 0 700 400" className="w-full" style={{ height: 380 }}>
            <defs>
              <pattern id="sg" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="700" height="400" fill="url(#sg)" />

            {/* Links */}
            {links.map((l, i) => {
              const from = nodes.find(n => n.id === l.from);
              const to   = nodes.find(n => n.id === l.to);
              if (!from || !to) return null;
              const isWireless = (from.type === 'ap' && to.type === 'client') || (from.type === 'client' && to.type === 'ap');
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isWireless ? '#a855f7' : '#f59e0b'}
                  strokeWidth={isWireless ? 1.5 : 2}
                  strokeDasharray={isWireless ? '8 4' : 'none'}
                  opacity={0.5}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const meta = NODE_META[node.type];
              return (
                <motion.g
                  key={node.id}
                  whileHover={{ scale: 1.1 }}
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r="26" fill={`${meta.color}15`} stroke={`${meta.color}70`} strokeWidth="2" />
                  <text textAnchor="middle" dominantBaseline="central" fontSize="16">{meta.icon}</text>
                  <text textAnchor="middle" y="38" fill="#94a3b8" fontSize="9" fontFamily="Inter">{node.label}</text>
                  {/* IP labels for clients when sim run */}
                  {node.type === 'client' && simLog.length > 10 && (
                    <text textAnchor="middle" y="52" fill={meta.color} fontSize="8" fontFamily="JetBrains Mono">
                      {node.label === 'Laptop' ? '192.168.1.101' : '192.168.1.102'}
                    </text>
                  )}
                  {/* Remove button */}
                  <g transform="translate(20,-20)" onClick={() => removeNode(node.id)} style={{ cursor: 'pointer' }}>
                    <circle r="8" fill="#ef444430" stroke="#ef444470" />
                    <text textAnchor="middle" dominantBaseline="central" fill="#ef4444" fontSize="9">✕</text>
                  </g>
                </motion.g>
              );
            })}
          </svg>
        </div>

        {/* Simulation log */}
        <div className="glass-panel flex flex-col border-glow-green" style={{ minHeight: 420 }}>
          <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-semibold">Simulation Log</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1">
            {simLog.length === 0 ? (
              <p className="text-slate-600 text-center pt-8">Click "Run Simulation" to watch the network come alive...</p>
            ) : simLog.map((line, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`leading-snug ${
                  line.includes('✓') || line.includes('🎉') ? 'text-emerald-400'
                  : line.includes('OFFER') || line.includes('ACK') ? 'text-band24'
                  : line.includes('Discover') || line.includes('Request') ? 'text-purple-400'
                  : 'text-slate-400'}`}>
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
