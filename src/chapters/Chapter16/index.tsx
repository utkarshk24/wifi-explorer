import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch16')!;
const TABS = ['Network Devices', 'Network Types', 'Internet & Routing', 'Firewall'] as const;
type Tab = typeof TABS[number];

// ─── Tab 1: Network Devices ───────────────────────────────────────────────────

const DEVICES = [
  {
    id: 'modem', name: 'Modem', icon: '📡', layer: 'Layer 1 — Physical', layerNum: 1, color: '#64748b',
    short: 'MOdulator-DEModulator — converts digital ↔ analog signals for transmission over phone lines, cable, or fiber.',
    detail: [
      'DSL modem: digital data ↔ telephone line frequencies (ADSL up to 24 Mbps down)',
      'Cable modem: digital ↔ CATV coaxial (DOCSIS 3.1: up to 10 Gbps)',
      'ONT (Optical Network Terminal): fiber modem for GPON/XGS-PON',
      'No routing, switching, or MAC intelligence — raw signal conversion only',
    ],
    trafficDesc: 'Converts outgoing bits into a modulated analog waveform and demodulates incoming signals.',
    trafficType: 'signal',
  },
  {
    id: 'hub', name: 'Hub', icon: '🔄', layer: 'Layer 1 — Physical', layerNum: 1, color: '#94a3b8',
    short: 'Multi-port repeater. Receives a signal on one port and broadcasts it out ALL other ports — zero intelligence.',
    detail: [
      'All connected devices share ONE collision domain',
      'CSMA/CD required — only one device can transmit at a time',
      'No MAC address awareness — cannot filter traffic',
      '10 Mbps only; largely obsolete, replaced by switches',
    ],
    trafficDesc: 'Frame arrives on Port 1 → copied and broadcast to ALL other ports simultaneously.',
    trafficType: 'broadcast',
  },
  {
    id: 'bridge', name: 'Bridge', icon: '🌉', layer: 'Layer 2 — Data Link', layerNum: 2, color: '#0891b2',
    short: 'Connects two network segments. Learns MAC addresses on each side and filters frames — forwarding only when necessary.',
    detail: [
      'Splits one collision domain into two (each side is separate)',
      'Maintains a MAC address table per segment',
      'Frame from Segment A: if destination is on A, block; if on B, forward',
      'Transparent to upper layers — stations do not need to know it exists',
    ],
    trafficDesc: 'Frame from Segment A with Dst on Segment B → bridge forwards across; same-segment destinations are blocked.',
    trafficType: 'selective',
  },
  {
    id: 'switch', name: 'Switch', icon: '🔀', layer: 'Layer 2 — Data Link', layerNum: 2, color: '#06b6d4',
    short: 'Multi-port bridge with a CAM table. Delivers frames only to the correct port — each port is its own collision domain.',
    detail: [
      'CAM (Content Addressable Memory) table: MAC → Port mapping',
      'Store-and-forward or cut-through switching modes',
      'Full-duplex per port eliminates collisions entirely',
      'VLANs (802.1Q) allow logical segmentation of traffic',
    ],
    trafficDesc: 'Frame arrives → switch checks CAM table → forwards unicast only to correct port (unknown → flood all).',
    trafficType: 'unicast',
  },
  {
    id: 'router', name: 'Router', icon: '🔃', layer: 'Layer 3 — Network', layerNum: 3, color: '#a855f7',
    short: 'Routes IP packets between different networks using a routing table. The backbone of the Internet.',
    detail: [
      'Maintains routing table: destination network → next-hop / interface',
      'Each interface = different broadcast domain',
      'Protocols: static routes, RIP, OSPF, EIGRP, BGP',
      'Performs NAT, DHCP relay, ACL packet filtering',
    ],
    trafficDesc: 'Packet arrives on interface → router reads destination IP → consults routing table → forwards to correct interface/next-hop.',
    trafficType: 'routed',
  },
  {
    id: 'gateway', name: 'Gateway', icon: '🚪', layer: 'Layer 3–7 — Multi-layer', layerNum: 7, color: '#f59e0b',
    short: 'Protocol translator between incompatible networks or architectures (e.g., IPv4 ↔ IPv6, email gateway, VoIP gateway).',
    detail: [
      'Not just a router — performs protocol conversion at any layer',
      'Default gateway: router address used by hosts to reach external networks',
      'Email gateway: SMTP ↔ proprietary mail systems',
      'VoIP gateway: SIP/H.323 ↔ PSTN analog telephony',
    ],
    trafficDesc: 'Traffic from Network A in Protocol X → Gateway translates → Traffic to Network B in Protocol Y.',
    trafficType: 'translate',
  },
  {
    id: 'ap', name: 'Access Point', icon: '📶', layer: 'Layer 2 — Data Link', layerNum: 2, color: '#10b981',
    short: 'Bridges wireless 802.11 clients to the wired Ethernet network, creating a BSS (Basic Service Set).',
    detail: [
      'Operates in Infrastructure mode — clients associate to the AP',
      'SSID broadcast via Beacon frames every 102.4 ms',
      'WPA2/WPA3 authentication before data exchange',
      'The AP acts as a transparent L2 bridge between wireless and wired',
    ],
    trafficDesc: 'Wireless frame from Client → AP bridges to wired switch port → travels as Ethernet frame on LAN.',
    trafficType: 'wireless',
  },
];

function DeviceTrafficAnim({ device }: { device: typeof DEVICES[0] }) {
  const [active, setActive] = useState(false);
  const ports = device.id === 'hub' ? [1, 2, 3, 4] : device.id === 'switch' ? [1, 2, 3, 4] : [1, 2];
  const W = 320, H = 100;

  return (
    <div className="space-y-2">
      <button onClick={() => setActive(a => !a)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
          active ? 'border-slate-500 text-slate-300' : 'border-current/50 text-current hover:opacity-80'
        }`} style={{ color: device.color, borderColor: device.color + '60' }}>
        {active ? '⏸ Stop' : '▶ Simulate Traffic'}
      </button>

      <div className="rounded-xl overflow-hidden border border-slate-800" style={{ background: '#080d1a' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* Device box */}
          <rect x={W / 2 - 28} y={H / 2 - 18} width={56} height={36} rx="6"
            fill={device.color + '20'} stroke={device.color + '60'} strokeWidth="1.5" />
          <text x={W / 2} y={H / 2 - 4} textAnchor="middle" fontSize="14">{device.icon}</text>
          <text x={W / 2} y={H / 2 + 10} textAnchor="middle" fontSize="7" fill={device.color}>{device.name}</text>

          {/* Port lines */}
          {ports.map((p, i) => {
            const isLeft = i < ports.length / 2;
            const portX = isLeft ? 40 : W - 40;
            const portY = ports.length <= 2 ? H / 2 : (H / (ports.length - 1)) * i;
            const midX = W / 2 + (isLeft ? -28 : 28);
            return (
              <g key={p}>
                <line x1={portX} y1={portY} x2={midX} y2={H / 2} stroke="#334155" strokeWidth="1" />
                <circle cx={portX} cy={portY} r={6} fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <text x={portX} y={portY + 3} textAnchor="middle" fontSize="6" fill="#64748b">P{p}</text>
                {/* Animated packet */}
                {active && (
                  <motion.circle r={4} fill={device.color}
                    animate={device.trafficType === 'broadcast' && !isLeft
                      ? { cx: [midX, portX], cy: [H / 2, portY], opacity: [1, 0.8, 0] }
                      : i === 0
                      ? { cx: [portX, midX], cy: [portY, H / 2], opacity: [0.9, 1, 0.3] }
                      : device.trafficType === 'unicast' && i === 1
                      ? { cx: [midX, portX], cy: [H / 2, portY], opacity: [1, 0.9, 0] }
                      : { cx: [midX], cy: [H / 2], opacity: [0] }}
                    transition={{ duration: 1.2, delay: (isLeft ? 0 : 0.5) + i * 0.15, repeat: Infinity, ease: 'linear' }} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-slate-400 italic leading-relaxed">{device.trafficDesc}</p>
    </div>
  );
}

function NetworkDevicesTab() {
  const [selected, setSelected] = useState(DEVICES[3]);
  return (
    <div className="space-y-5">
      {/* OSI layer selector */}
      <div className="flex flex-wrap gap-2">
        {DEVICES.map(d => (
          <button key={d.id} onClick={() => setSelected(d)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              selected.id === d.id ? 'scale-105 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            style={selected.id === d.id ? { borderColor: d.color + '60', background: d.color + '20', color: d.color } : {}}>
            {d.icon} {d.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 border space-y-4" style={{ borderColor: selected.color + '40' }}>
          <div className="flex items-start gap-3">
            <span className="text-4xl">{selected.icon}</span>
            <div>
              <h3 className="font-bold text-white text-lg">{selected.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: selected.color + '20', color: selected.color }}>
                {selected.layer}
              </span>
              <p className="text-sm text-slate-300 mt-2">{selected.short}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2">Key Characteristics</p>
              <ul className="space-y-1.5">
                {selected.detail.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span style={{ color: selected.color }} className="mt-0.5 flex-shrink-0">▸</span>{d}
                  </li>
                ))}
              </ul>
            </div>
            <DeviceTrafficAnim device={selected} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* OSI layer map */}
      <div className="glass-panel p-4 border-glow-blue">
        <p className="text-xs font-bold text-slate-400 mb-3">Device → OSI Layer Mapping</p>
        <div className="flex gap-px rounded-xl overflow-hidden text-xs">
          {[
            { layer: 'L7 App', devices: ['Gateway'], color: '#ef4444' },
            { layer: 'L3 Net', devices: ['Router', 'Gateway'], color: '#a855f7' },
            { layer: 'L2 DL', devices: ['Switch', 'Bridge', 'AP'], color: '#06b6d4' },
            { layer: 'L1 Phy', devices: ['Hub', 'Modem'], color: '#64748b' },
          ].map(l => (
            <div key={l.layer} className="flex-1 p-2 text-center border-r border-slate-900 last:border-r-0"
              style={{ background: l.color + '15' }}>
              <p className="font-bold mb-1" style={{ color: l.color }}>{l.layer}</p>
              {l.devices.map(d => <p key={d} className="text-slate-400" style={{ fontSize: '10px' }}>{d}</p>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Network Types ─────────────────────────────────────────────────────

const NET_TYPES = [
  { id: 'pan', name: 'PAN', full: 'Personal Area Network', icon: '🤳', color: '#06b6d4', radius: 30,
    range: '< 10 m', speed: 'Up to 3 Gbps (BT 5.3)', tech: 'Bluetooth, USB, ZigBee, IR, NFC',
    examples: 'Smartphone + earbuds, laptop + mouse, smartwatch sync',
    desc: 'Connects devices within a person\'s personal workspace. Centered on an individual user, typically within arm\'s reach.' },
  { id: 'lan', name: 'LAN', full: 'Local Area Network', icon: '🏢', color: '#a855f7', radius: 60,
    range: '< 1 km', speed: '1 Gbps – 400 Gbps (Ethernet)', tech: 'Ethernet (802.3), Wi-Fi (802.11)',
    examples: 'Office floor, school lab, home network, data center rack',
    desc: 'Connects devices within a building or campus. Privately owned, high speed, low latency, low error rate.' },
  { id: 'can', name: 'CAN', full: 'Campus Area Network', icon: '🏫', color: '#10b981', radius: 90,
    range: '1 – 5 km', speed: '10 Gbps+ (fiber backbone)', tech: 'Fiber Ethernet, MPLS, Wi-Fi 6E',
    examples: 'University campus, corporate headquarters, hospital complex',
    desc: 'Interconnects multiple LANs within a geographically limited area like a university or corporate campus. Usually privately owned.' },
  { id: 'man', name: 'MAN', full: 'Metropolitan Area Network', icon: '🏙️', color: '#f59e0b', radius: 115,
    range: '5 – 50 km', speed: '10 – 100 Gbps', tech: 'Dark fiber, SONET/SDH, Metro Ethernet, WiMAX',
    examples: 'City-wide ISP network, cable TV network, smart city infrastructure',
    desc: 'Spans a city or metropolitan area. May be owned by a municipality or telecommunications company. Bridges LANs across a city.' },
  { id: 'wan', name: 'WAN', full: 'Wide Area Network', icon: '🌍', color: '#ef4444', radius: 138,
    range: '> 50 km (global)', speed: 'Variable (1 Mbps – 400 Gbps)', tech: 'MPLS, SD-WAN, Internet, satellite, undersea cables',
    examples: 'The Internet, corporate MPLS backbone, 4G/5G cellular',
    desc: 'Spans countries or continents. Leased from telecommunications providers. High latency compared to LAN. The Internet is the world\'s largest WAN.' },
];

function NetworkTypesTab() {
  const [selected, setSelected] = useState(NET_TYPES[1]);
  const W = 300, H = 300, cx = W / 2, cy = H / 2;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {NET_TYPES.map(n => (
          <button key={n.id} onClick={() => setSelected(n)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              selected.id === n.id ? 'scale-105 text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
            style={selected.id === n.id ? { borderColor: n.color + '60', background: n.color + '20', color: n.color } : {}}>
            {n.icon} {n.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Concentric scope diagram */}
        <div className="glass-panel p-4 border-glow-blue flex items-center justify-center">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs">
            {NET_TYPES.slice().reverse().map((n, _i) => (
              <g key={n.id}>
                <motion.circle cx={cx} cy={cy} r={n.radius}
                  fill={n.color + (selected.id === n.id ? '20' : '08')}
                  stroke={n.color + (selected.id === n.id ? 'cc' : '30')}
                  strokeWidth={selected.id === n.id ? 2 : 1}
                  strokeDasharray={selected.id === n.id ? 'none' : '4 3'}
                  animate={{ r: n.radius }}
                  transition={{ duration: 0.3 }} />
                <text x={cx + n.radius - 18} y={cy - 4} textAnchor="middle"
                  fontSize={selected.id === n.id ? '9' : '7'}
                  fill={selected.id === n.id ? n.color : n.color + '80'}
                  fontWeight={selected.id === n.id ? 'bold' : 'normal'}>
                  {n.name}
                </text>
              </g>
            ))}
            {/* Center dot (user) */}
            <circle cx={cx} cy={cy} r={8} fill="#06b6d4" />
            <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fill="white">👤</text>
          </svg>
        </div>

        {/* Selected type details */}
        <AnimatePresence mode="wait">
          <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="glass-panel p-5 border space-y-3" style={{ borderColor: selected.color + '50' }}>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <p className="font-bold text-white">{selected.name}</p>
                <p className="text-xs text-slate-400">{selected.full}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selected.desc}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { l: 'Range', v: selected.range },
                { l: 'Typical Speed', v: selected.speed },
              ].map(m => (
                <div key={m.l} className="bg-surface-800 rounded-lg p-2">
                  <p className="text-slate-500">{m.l}</p>
                  <p className="font-bold mt-0.5" style={{ color: selected.color }}>{m.v}</p>
                </div>
              ))}
            </div>
            <div className="text-xs space-y-1">
              <p className="text-slate-500 font-medium">Technologies</p>
              <p className="text-slate-300">{selected.tech}</p>
              <p className="text-slate-500 font-medium mt-2">Real-world Examples</p>
              <p className="text-slate-300">{selected.examples}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Comparison table */}
      <div className="glass-panel p-4 border-glow-blue overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              {['Type', 'Range', 'Speed', 'Ownership', 'Technology'].map(h => (
                <th key={h} className="pb-2 pr-4 text-left text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NET_TYPES.map(n => (
              <tr key={n.id} className="border-b border-slate-800/40 cursor-pointer" onClick={() => setSelected(n)}>
                <td className="py-1.5 pr-4 font-bold" style={{ color: n.color }}>{n.icon} {n.name}</td>
                <td className="py-1.5 pr-4 text-slate-300">{n.range}</td>
                <td className="py-1.5 pr-4 font-mono text-slate-300">{n.speed.split(' ')[0]}</td>
                <td className="py-1.5 pr-4 text-slate-400">{n.id === 'wan' ? 'Public/Leased' : n.id === 'man' ? 'Telecom' : 'Private'}</td>
                <td className="py-1.5 pr-4 text-slate-400">{n.tech.split(',')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3: Internet & Routing ────────────────────────────────────────────────

function InternetTab() {
  const [packetPos, setPacketPos] = useState(-1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const HOPS = [
    { label: 'Your PC', icon: '💻', color: '#06b6d4', detail: 'Generates HTTP request → DNS lookup → TCP connection → IP packet' },
    { label: 'Home Router', icon: '🔃', color: '#a855f7', detail: 'NAT: replaces private IP (192.168.x.x) with your public IP. Routes to ISP.' },
    { label: 'ISP (Tier 3)', icon: '🏢', color: '#10b981', detail: 'Local Internet Service Provider. Routes via BGP to upstream Tier 2 provider.' },
    { label: 'Tier 1 Backbone', icon: '🌐', color: '#f59e0b', detail: 'Global backbone carriers (AT&T, NTT, Cogent). Peer with each other settlement-free.' },
    { label: 'Dest. ISP', icon: '🏢', color: '#10b981', detail: 'Destination country/city ISP. Announces the server\'s IP prefix via BGP.' },
    { label: 'Web Server', icon: '🖥️', color: '#ef4444', detail: 'Receives IP packet → TCP → HTTP → sends back HTML/JSON response.' },
  ];

  const startAnimation = useCallback(() => {
    setPacketPos(0);
    if (timer.current) clearInterval(timer.current);
    let i = 0;
    timer.current = setInterval(() => {
      i++;
      if (i >= HOPS.length) { clearInterval(timer.current!); setPacketPos(-1); return; }
      setPacketPos(i);
    }, 900);
  }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">The Internet — What & How</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          The Internet is a global network of networks — billions of devices interconnected via TCP/IP. Conceptually, it is a{' '}
          <span className="text-cyan-400 font-medium">packet-switched network</span>: data is broken into packets,
          each independently routed across routers to the destination, then reassembled. No dedicated circuit is
          reserved (unlike the old telephone PSTN).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { l: 'Founded', v: '1969 (ARPANET)' },
            { l: 'Protocol', v: 'TCP/IP (RFC 791/793)' },
            { l: 'Addressing', v: 'IPv4 (32-bit) / IPv6 (128-bit)' },
            { l: 'Routing', v: 'BGP (Border Gateway Protocol)' },
          ].map(m => (
            <div key={m.l} className="bg-surface-800 rounded-lg p-2 text-center">
              <p className="text-slate-500">{m.l}</p>
              <p className="font-bold text-cyan-300 mt-0.5">{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Packet Journey */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Packet Journey: Your Browser → Web Server</h3>
          <button onClick={startAnimation}
            className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-lg text-xs font-bold hover:bg-cyan-500/30">
            ▶ Send Packet
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {HOPS.map((hop, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <motion.div
                className="flex flex-col items-center gap-1 p-2 rounded-xl border min-w-[70px]"
                animate={{
                  borderColor: packetPos === i ? hop.color + 'aa' : '#1e293b',
                  background: packetPos === i ? hop.color + '20' : 'transparent',
                  scale: packetPos === i ? 1.08 : 1,
                }}
                transition={{ duration: 0.25 }}>
                <span className="text-2xl">{hop.icon}</span>
                <p className="text-center font-bold leading-tight" style={{ fontSize: '9px', color: packetPos === i ? hop.color : '#94a3b8' }}>
                  {hop.label}
                </p>
              </motion.div>
              {i < HOPS.length - 1 && (
                <div className="relative w-6 flex-shrink-0">
                  <div className="h-px bg-slate-700 w-full" />
                  {packetPos === i && (
                    <motion.div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                      style={{ background: hop.color }}
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 0.8, ease: 'linear' }} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {packetPos >= 0 && (
          <motion.div key={packetPos} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg border text-xs" style={{ borderColor: HOPS[packetPos]?.color + '40', background: HOPS[packetPos]?.color + '0a' }}>
            <span className="font-bold" style={{ color: HOPS[packetPos]?.color }}>{HOPS[packetPos]?.label}: </span>
            <span className="text-slate-300">{HOPS[packetPos]?.detail}</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {[
          { title: 'Circuit Switching (PSTN)', icon: '📞', color: '#ef4444',
            points: ['Dedicated path reserved for duration of call', 'Guaranteed bandwidth, fixed latency', 'Inefficient — channel idle when no speech', 'Traditional telephone network'] },
          { title: 'Packet Switching (Internet)', icon: '📦', color: '#10b981',
            points: ['Data split into packets, each routed independently', 'No dedicated path — shares links with others', 'Efficient use of bandwidth (statistical multiplexing)', 'TCP handles reordering and retransmission'] },
        ].map(s => (
          <div key={s.title} className="glass-panel p-4 border rounded-xl space-y-2" style={{ borderColor: s.color + '40' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{s.icon}</span>
              <span className="font-bold text-white text-sm">{s.title}</span>
            </div>
            <ul className="space-y-1">
              {s.points.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <span style={{ color: s.color }} className="flex-shrink-0 mt-0.5">▸</span>{p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 4: Firewall ──────────────────────────────────────────────────────────

const FW_RULES = [
  { rule: 1, src: 'Any',         dst: '10.0.0.0/8', port: 'Any',  proto: 'Any', action: 'DENY',  color: '#ef4444' },
  { rule: 2, src: '203.0.113.0', dst: 'Any',         port: 'Any',  proto: 'Any', action: 'DENY',  color: '#ef4444' },
  { rule: 3, src: 'Any',         dst: '192.168.1.10', port: '443', proto: 'TCP', action: 'ALLOW', color: '#10b981' },
  { rule: 4, src: 'Any',         dst: '192.168.1.10', port: '80',  proto: 'TCP', action: 'ALLOW', color: '#10b981' },
  { rule: 5, src: 'Any',         dst: 'Any',          port: 'Any',  proto: 'Any', action: 'DENY',  color: '#ef4444' },
];

const TEST_PACKETS = [
  { src: '8.8.8.8', dst: '192.168.1.10', port: '443', proto: 'TCP', label: 'HTTPS request' },
  { src: '203.0.113.0', dst: '192.168.1.10', port: '80', proto: 'TCP', label: 'Blocked IP' },
  { src: '8.8.8.8', dst: '192.168.1.10', port: '22', proto: 'TCP', label: 'SSH (blocked)' },
  { src: '8.8.8.8', dst: '10.0.0.5', dst2: '10.0.0.5', port: '53', proto: 'UDP', label: 'Private dest' },
];

function FirewallTab() {
  const [testPkt, setTestPkt] = useState(TEST_PACKETS[0]);
  const [result, setResult] = useState<{ rule: typeof FW_RULES[0]; passed: boolean } | null>(null);

  const runTest = useCallback((pkt: typeof TEST_PACKETS[0]) => {
    setTestPkt(pkt);
    // Evaluate rules top-down
    for (const rule of FW_RULES) {
      const srcMatch = rule.src === 'Any' || pkt.src.startsWith(rule.src.replace('/0', '').split('/')[0]);
      const dstMatch = rule.dst === 'Any' || pkt.dst === rule.dst || (rule.dst.includes('/') && pkt.dst?.startsWith(rule.dst.split('/')[0].slice(0, -1)));
      const portMatch = rule.port === 'Any' || rule.port === pkt.port;
      const protoMatch = rule.proto === 'Any' || rule.proto === pkt.proto;
      if (srcMatch && dstMatch && portMatch && protoMatch) {
        setResult({ rule, passed: rule.action === 'ALLOW' });
        return;
      }
    }
    setResult({ rule: FW_RULES[4], passed: false });
  }, []);

  useEffect(() => { runTest(TEST_PACKETS[0]); }, [runTest]);

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Firewall — Network Security Perimeter</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          A firewall is a network security system that monitors and controls incoming/outgoing traffic based on pre-defined security rules.
          It establishes a barrier between trusted internal networks and untrusted external networks.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            { type: 'Packet Filter', desc: 'Stateless. Inspects each packet independently — IP, port, protocol.', color: '#06b6d4' },
            { type: 'Stateful', desc: 'Tracks connection state. Allows return traffic automatically.', color: '#a855f7' },
            { type: 'App Layer (WAF)', desc: 'Inspects HTTP, DNS, SMTP payload content. DPI.', color: '#10b981' },
            { type: 'NGFW', desc: 'Next-Gen: IPS, App-ID, user-ID, SSL inspection, threat intel.', color: '#f59e0b' },
          ].map(f => (
            <div key={f.type} className="bg-surface-800 rounded-xl p-3 border" style={{ borderColor: f.color + '30' }}>
              <p className="font-bold mb-1" style={{ color: f.color }}>{f.type}</p>
              <p className="text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ACL Simulator */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">ACL Rule Simulator</h3>
        <div className="flex flex-wrap gap-2">
          {TEST_PACKETS.map(p => (
            <button key={p.label} onClick={() => runTest(p)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                testPkt.label === p.label ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Packet info */}
        <div className="flex flex-wrap gap-3 text-xs font-mono">
          {[
            { l: 'Src IP', v: testPkt.src, c: '#06b6d4' },
            { l: 'Dst IP', v: testPkt.dst, c: '#a855f7' },
            { l: 'Dst Port', v: testPkt.port, c: '#10b981' },
            { l: 'Protocol', v: testPkt.proto, c: '#f59e0b' },
          ].map(f => (
            <div key={f.l} className="bg-surface-800 rounded-lg px-3 py-2">
              <span className="text-slate-500">{f.l}: </span>
              <span className="font-bold" style={{ color: f.c }}>{f.v}</span>
            </div>
          ))}
        </div>

        {/* Rules table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                {['#', 'Src IP', 'Dst IP', 'Port', 'Proto', 'Action', 'Match'].map(h => (
                  <th key={h} className="pb-2 pr-3 text-left text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FW_RULES.map(r => {
                const isMatch = result?.rule.rule === r.rule;
                return (
                  <motion.tr key={r.rule}
                    animate={{ background: isMatch ? r.color + '15' : 'transparent' }}
                    className="border-b border-slate-800/40">
                    <td className="py-1.5 pr-3 font-mono text-slate-500">{r.rule}</td>
                    <td className="py-1.5 pr-3 font-mono text-slate-300">{r.src}</td>
                    <td className="py-1.5 pr-3 font-mono text-slate-300">{r.dst}</td>
                    <td className="py-1.5 pr-3 font-mono text-slate-300">{r.port}</td>
                    <td className="py-1.5 pr-3 text-slate-300">{r.proto}</td>
                    <td className="py-1.5 pr-3 font-bold" style={{ color: r.color }}>{r.action}</td>
                    <td className="py-1.5">{isMatch && <span className="text-white font-bold">← MATCH</span>}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {result && (
          <motion.div key={testPkt.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl border font-bold text-sm text-center"
            style={{ borderColor: result.passed ? '#10b98150' : '#ef444450', background: result.passed ? '#10b98115' : '#ef444415', color: result.passed ? '#10b981' : '#ef4444' }}>
            {result.passed ? '✅ PACKET ALLOWED — matched Rule ' + result.rule.rule : '🚫 PACKET BLOCKED — matched Rule ' + result.rule.rule}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Chapter16() {
  const [activeTab, setActiveTab] = useState<Tab>('Network Devices');
  useApp(); // context available if needed

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ChapterHeader chapter={CHAPTER}
        description="Foundation of modern networking: understand every device in a network, how different network types are scoped, how the Internet routes packets globally, and how firewalls filter traffic." />
      <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>{t}</button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Network Devices'    && <NetworkDevicesTab />}
          {activeTab === 'Network Types'      && <NetworkTypesTab />}
          {activeTab === 'Internet & Routing' && <InternetTab />}
          {activeTab === 'Firewall'           && <FirewallTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
