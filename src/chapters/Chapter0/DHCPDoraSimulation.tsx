import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModeContent } from '../../components/shared/ModeContent';
import type { AudienceMode } from '../../types';

// ─── Content definitions per mode ────────────────────────────────────────────

interface StepContent {
  name: string;
  emoji: string;
  packetLabel: string;
  color: string;         // hex for packet fill
  bgClass: string;
  borderClass: string;
  title: Record<AudienceMode, string>;
  detail: Record<AudienceMode, string>;
}

const STEPS: StepContent[] = [
  {
    name: 'DISCOVER',
    emoji: '📢',
    packetLabel: 'DISCOVER',
    color: '#06b6d4',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-500/40',
    title: {
      kid:        '📢 "Is anybody home?" — Your device shouts to the whole house',
      enthusiast: 'Step 1 of 4 — Your device broadcasts a "Who can give me an IP?" shout',
      pro:        'DHCP Discover — Client broadcasts (255.255.255.255) on UDP port 67, src IP 0.0.0.0',
    },
    detail: {
      kid:
        'Imagine you just moved into a new neighborhood and you don\'t have a house number yet. ' +
        'You stand in the street and yell: "HEY! Is there someone who can give me a mailbox number?" ' +
        'Everyone on the street can hear you — that\'s called a broadcast!',
      enthusiast:
        'When your laptop or phone joins a Wi-Fi network, it doesn\'t have an IP address yet. ' +
        'So it sends a broadcast packet to every device on the network saying ' +
        '"Hey, is there a DHCP server here? I need an IP address!" ' +
        'Your router or a dedicated server hears this shout.',
      pro:
        'The DHCP client (in state INIT) sends a DHCPDISCOVER broadcast. Source IP is 0.0.0.0 ' +
        '(no address assigned yet), destination 255.255.255.255. The frame includes the client\'s ' +
        'MAC address, a transaction ID (xid), and optional parameters like requested lease time and ' +
        'parameter request list (Option 55). Sent via UDP src:68 → dst:67.',
    },
  },
  {
    name: 'OFFER',
    emoji: '🎁',
    packetLabel: 'OFFER',
    color: '#a855f7',
    bgClass: 'bg-purple-500/15',
    borderClass: 'border-purple-500/40',
    title: {
      kid:        '🎁 "I can help!" — The ticket booth answers with a gift',
      enthusiast: 'Step 2 of 4 — The router replies: "Here, try this IP address!"',
      pro:        'DHCP Offer — Server unicasts (or broadcasts) a proposed IP binding to the client',
    },
    detail: {
      kid:
        'The neighborhood ticket booth manager heard your shout! They run up to you with a shiny ' +
        'envelope and say "Here, I\'ll give you house number 192.168.1.105! It\'s yours to keep for ' +
        '24 hours!" They also write down your unique name (MAC address) so nobody else gets that number.',
      enthusiast:
        'Your router\'s DHCP server heard the broadcast and picks an available IP from its address pool ' +
        '(e.g. 192.168.1.105). It sends back an Offer packet containing: the proposed IP, the subnet mask, ' +
        'the router\'s own IP (default gateway), DNS server addresses, and a lease duration (typically 24h). ' +
        'Multiple servers could offer, but your device picks the first one.',
      pro:
        'The server records a tentative binding for the client\'s MAC (chaddr) and responds with a ' +
        'DHCPOFFER. Key fields: yiaddr = proposed client IP, siaddr = server IP, lease time (Option 51), ' +
        'subnet mask (Option 1), router (Option 3), DNS (Option 6). Sent unicast to client MAC if ' +
        'client can receive unicast, otherwise broadcast. Transaction ID (xid) echoed for correlation.',
    },
  },
  {
    name: 'REQUEST',
    emoji: '✋',
    packetLabel: 'REQUEST',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/15',
    borderClass: 'border-amber-500/40',
    title: {
      kid:        '✋ "Yes please, I want that one!" — You accept the offer publicly',
      enthusiast: 'Step 3 of 4 — Your device broadcasts "I accept this IP, let everyone know!"',
      pro:        'DHCP Request — Client broadcasts acceptance of the offer (server selection)',
    },
    detail: {
      kid:
        'You look at the envelope and say "Yes! I want house number 192.168.1.105 please!" ' +
        'But you shout this to the whole street again — not just the ticket booth — so all the ' +
        'other ticket booths (other DHCP servers) know you chose one already and they should ' +
        'keep their numbers for someone else.',
      enthusiast:
        'Here\'s the clever part: even though the Offer was addressed to you, your device broadcasts ' +
        'the Request. Why? Because there might be multiple DHCP servers on the network. By broadcasting ' +
        '"I\'m accepting Server A\'s offer", all other servers hear it and know to release their ' +
        'tentative offers back to the pool. It\'s polite network etiquette!',
      pro:
        'The client (now in SELECTING state) broadcasts a DHCPREQUEST including Option 54 ' +
        '(Server Identifier = chosen server\'s IP) and Option 50 (Requested IP Address). ' +
        'Broadcasting here is intentional — it implicitly declines all other offers. ' +
        'Source IP remains 0.0.0.0 until fully acknowledged. The xid must match the offer.',
    },
  },
  {
    name: 'ACKNOWLEDGE',
    emoji: '✅',
    packetLabel: 'ACK',
    color: '#10b981',
    bgClass: 'bg-emerald-500/15',
    borderClass: 'border-emerald-500/40',
    title: {
      kid:        '✅ "Done! It\'s officially yours!" — Your mailbox number is confirmed!',
      enthusiast: 'Step 4 of 4 — The router confirms: "That IP is yours — setup complete!"',
      pro:        'DHCP ACK — Server confirms binding; client configures IP stack and starts lease timer',
    },
    detail: {
      kid:
        'The ticket booth manager stamps the envelope with a big green checkmark and shouts ' +
        '"Congratulations! House number 192.168.1.105 is OFFICIALLY yours for the next 24 hours!" ' +
        'Now you have your own mailbox number! You can send and receive letters (data packets) ' +
        'with everyone else on the internet!',
      enthusiast:
        'The DHCP server sends the final ACK (Acknowledge) confirming the IP is locked in for you. ' +
        'After receiving this, your device immediately configures its network adapter with the IP, ' +
        'subnet mask, default gateway, and DNS server addresses. You\'re online! Your device also ' +
        'sets a renewal timer (usually at 50% of lease time) to quietly refresh before it expires.',
      pro:
        'On receipt of DHCPACK, the client MUST perform ARP probing (SHOULD per RFC 2131) to verify ' +
        'no IP conflict exists. If clear, the client commits the binding: configures the interface IP, ' +
        'installs a host route, configures the default route via Option 3, and starts T1 (renewal, ' +
        '50% of lease) and T2 (rebind, 87.5% of lease) timers. A DHCPNAK from the server would force ' +
        'the client back to INIT state.',
    },
  },
];

// ─── Node layout (SVG coordinate space 600×180) ──────────────────────────────

const NODES = {
  client: { x: 80,  y: 90, label: 'Your Device', icon: '💻' },
  switch: { x: 300, y: 90, label: 'Network Switch', icon: '🔀' },
  server: { x: 520, y: 90, label: 'DHCP Server', icon: '🖥️' },
} as const;

type NodeKey = keyof typeof NODES;

interface PacketAnimation {
  from: NodeKey;
  to: NodeKey;
  label: string;
  color: string;
}

const STEP_ANIMATIONS: PacketAnimation[] = [
  { from: 'client', to: 'server', label: 'DISCOVER', color: '#06b6d4' },
  { from: 'server', to: 'client', label: 'OFFER',    color: '#a855f7' },
  { from: 'client', to: 'server', label: 'REQUEST',  color: '#f59e0b' },
  { from: 'server', to: 'client', label: 'ACK',      color: '#10b981' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function DHCPDoraSimulation() {
  const { mode, markComplete } = useApp();
  const [activeStep, setActiveStep]       = useState<number>(-1);
  const [isPlaying, setIsPlaying]         = useState(false);
  const [packetPos, setPacketPos]         = useState<{ x: number; y: number; visible: boolean; label: string; color: string }>({
    x: NODES.client.x, y: NODES.client.y, visible: false, label: '', color: '#06b6d4',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveStep(-1);
    setIsPlaying(false);
    setPacketPos({ x: NODES.client.x, y: NODES.client.y, visible: false, label: '', color: '#06b6d4' });
  }, []);

  const runStep = useCallback((stepIndex: number) => {
    if (stepIndex >= STEPS.length) {
      setIsPlaying(false);
      markComplete('ch0', 'dhcp');
      return;
    }
    setActiveStep(stepIndex);
    const anim = STEP_ANIMATIONS[stepIndex];
    const fromNode = NODES[anim.from];
    const toNode   = NODES[anim.to];

    setPacketPos({ x: fromNode.x, y: fromNode.y, visible: true, label: anim.label, color: anim.color });

    timerRef.current = setTimeout(() => {
      setPacketPos(p => ({ ...p, x: toNode.x, y: toNode.y }));
      timerRef.current = setTimeout(() => {
        setPacketPos(p => ({ ...p, visible: false }));
        timerRef.current = setTimeout(() => runStep(stepIndex + 1), 600);
      }, 900);
    }, 200);
  }, [markComplete]);

  const handlePlay = useCallback(() => {
    reset();
    setIsPlaying(true);
    timerRef.current = setTimeout(() => runStep(0), 300);
  }, [reset, runStep]);

  const handleStepClick = useCallback((idx: number) => {
    if (isPlaying) return;
    setActiveStep(idx);
  }, [isPlaying]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const currentStep = activeStep >= 0 ? STEPS[activeStep] : null;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-wired">DHCP</span> — The DORA Process
          </h3>
          <ModeContent
            content={{
              kid:        'Watch how your device gets its "house number" (IP address) in 4 magic steps!',
              enthusiast: 'See the 4-step handshake that assigns an IP address to every device that joins your network.',
              pro:        'RFC 2131 DORA sequence — Discover / Offer / Request / Acknowledge binding exchange over UDP 67/68.',
            }}
            className="text-sm text-slate-400 mt-0.5"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={handlePlay} disabled={isPlaying} className="btn-primary flex items-center gap-1.5 text-sm">
            <Play size={14} fill="currentColor" />
            {isPlaying ? 'Running…' : 'Play Animation'}
          </button>
        </div>
      </div>

      {/* ── Network Topology SVG ── */}
      <div className="glass-panel p-4 border-glow-amber overflow-hidden">
        <svg viewBox="0 0 600 180" className="w-full" style={{ maxHeight: 180 }}>
          {/* Grid background lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245,158,11,0.06)" strokeWidth="0.5" />
            </pattern>
            <filter id="glow-amber">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-packet">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="600" height="180" fill="url(#grid)" />

          {/* Ethernet cables */}
          {[
            { x1: NODES.client.x + 28, x2: NODES.switch.x - 28, y: 90 },
            { x1: NODES.switch.x + 28, x2: NODES.server.x - 28, y: 90 },
          ].map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y} x2={line.x2} y2={line.y}
              stroke="rgba(245,158,11,0.4)" strokeWidth="2" strokeDasharray="6 3" />
          ))}

          {/* Nodes */}
          {(Object.entries(NODES) as [NodeKey, typeof NODES[NodeKey]][]).map(([key, node]) => (
            <g key={key} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="28"
                fill={activeStep >= 0
                  ? (key === 'client' || key === 'server' ? 'rgba(245,158,11,0.12)' : 'rgba(30,41,59,0.8)')
                  : 'rgba(30,41,59,0.8)'}
                stroke={key === 'client' ? 'rgba(6,182,212,0.6)' : key === 'server' ? 'rgba(16,185,129,0.6)' : 'rgba(100,116,139,0.4)'}
                strokeWidth="1.5"
                filter="url(#glow-amber)"
              />
              <text textAnchor="middle" dominantBaseline="central" fontSize="18">{node.icon}</text>
              <text textAnchor="middle" y="42" fill="#94a3b8" fontSize="9" fontFamily="Inter, sans-serif">
                {node.label}
              </text>
              {/* IP label for client — show after step 3 */}
              {key === 'client' && activeStep >= 3 && (
                <motion.text textAnchor="middle" y="58" fill="#10b981" fontSize="8" fontFamily="JetBrains Mono, monospace"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  192.168.1.105/24
                </motion.text>
              )}
            </g>
          ))}

          {/* Animated packet */}
          <AnimatePresence>
            {packetPos.visible && (
              <motion.g
                key="packet"
                initial={{ x: packetPos.x, y: packetPos.y, scale: 0.5, opacity: 0 }}
                animate={{ x: packetPos.x, y: packetPos.y, scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                filter="url(#glow-packet)"
              >
                <rect x="-28" y="-13" width="56" height="26" rx="6"
                  fill={packetPos.color} fillOpacity="0.2"
                  stroke={packetPos.color} strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central"
                  fill={packetPos.color} fontSize="8" fontWeight="700"
                  fontFamily="JetBrains Mono, monospace">
                  {packetPos.label}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* ── Step selector pills ── */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.name}
            onClick={() => handleStepClick(i)}
            disabled={isPlaying}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
              activeStep === i
                ? `${step.bgClass} ${step.borderClass} shadow-lg`
                : 'border-slate-700/50 bg-surface-700/40 hover:border-slate-600'
            } ${isPlaying ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            {/* Step connector line */}
            {i < 3 && (
              <div className="hidden sm:block absolute right-0 top-1/2 translate-x-full -translate-y-1/2 w-2 z-10">
                <ChevronRight size={12} className="text-slate-600" />
              </div>
            )}
            <span className="text-xl">{step.emoji}</span>
            <span className="text-xs font-bold" style={{ color: activeStep === i ? step.color : '#94a3b8' }}>
              {step.name}
            </span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
              activeStep > i ? 'bg-emerald-500 border-emerald-500 text-white'
              : activeStep === i ? 'border-current' : 'border-slate-600 text-slate-600'
            }`} style={{ color: activeStep === i ? step.color : undefined }}>
              {activeStep > i ? '✓' : i + 1}
            </div>
          </button>
        ))}
      </div>

      {/* ── Step Detail Panel ── */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={`step-${activeStep}-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`glass-panel p-5 border ${currentStep.borderClass} ${currentStep.bgClass}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                              ${currentStep.bgClass} border ${currentStep.borderClass}`}>
                {currentStep.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm leading-snug mb-1">
                  {currentStep.title[mode]}
                </h4>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${activeStep}-${mode}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-slate-400 leading-relaxed"
                  >
                    {currentStep.detail[mode]}
                  </motion.p>
                </AnimatePresence>

                {/* Pro-mode packet fields */}
                {mode === 'pro' && activeStep >= 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 grid grid-cols-2 gap-1.5"
                  >
                    {getProFields(activeStep).map(f => (
                      <div key={f.k} className="bg-surface-900/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">{f.k}:</span>
                        <span className="text-xs font-semibold font-mono" style={{ color: currentStep.color }}>
                          {f.v}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Completion banner ── */}
      <AnimatePresence>
        {activeStep === 3 && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3"
          >
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">DORA Complete!</p>
              <ModeContent
                content={{
                  kid:        'Your device now has its very own house number (192.168.1.105) and can talk to the internet! 🏠',
                  enthusiast: 'IP binding confirmed. Your device is now fully configured with IP, gateway, and DNS server.',
                  pro:        'Client entered BOUND state. T1=43200s, T2=75600s. ARP probe passed. Interface configured: 192.168.1.105/24, GW: 192.168.1.1, DNS: 8.8.8.8.',
                }}
                className="text-xs text-slate-400 mt-0.5"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Pro-mode packet field helpers ───────────────────────────────────────────

function getProFields(step: number): { k: string; v: string }[] {
  const sets = [
    [
      { k: 'Op',    v: '1 (BOOTREQUEST)' },
      { k: 'src IP', v: '0.0.0.0' },
      { k: 'dst IP', v: '255.255.255.255' },
      { k: 'UDP',   v: '68 → 67' },
    ],
    [
      { k: 'Op',     v: '2 (BOOTREPLY)' },
      { k: 'yiaddr', v: '192.168.1.105' },
      { k: 'Opt 1',  v: '255.255.255.0 (mask)' },
      { k: 'Opt 3',  v: '192.168.1.1 (GW)' },
    ],
    [
      { k: 'Op',    v: '1 (BOOTREQUEST)' },
      { k: 'Opt 54', v: '192.168.1.1 (serverID)' },
      { k: 'Opt 50', v: '192.168.1.105 (reqIP)' },
      { k: 'src IP', v: '0.0.0.0 (pre-bound)' },
    ],
    [
      { k: 'Op',    v: '2 (BOOTREPLY)' },
      { k: 'yiaddr', v: '192.168.1.105 ✓' },
      { k: 'Opt 51', v: '86400s lease' },
      { k: 'State', v: 'BOUND → T1=43200s' },
    ],
  ];
  return sets[step] ?? [];
}
