import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch17')!;

// ─── OSI Layer Data ───────────────────────────────────────────────────────────
const OSI_LAYERS = [
  {
    num: 7, name: 'Application', abbr: 'APP',
    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',
    pdus: 'Data (Message)',
    role: 'User-facing interface; provides network services directly to applications.',
    protocols: ['HTTP/HTTPS', 'FTP', 'SMTP/IMAP', 'DNS', 'DHCP', 'SSH', 'Telnet', 'SNMP'],
    devices: ['Application servers', 'Firewalls (L7)'],
    details: [
      'Defines the interface between the application and the network.',
      'HTTP uses port 80 (plain) and 443 (TLS). A GET request header looks like: GET /index.html HTTP/1.1\\nHost: example.com',
      'DNS translates human-readable names → IP addresses using a hierarchical distributed database.',
      'SMTP (port 25/587) sends mail; IMAP (port 143/993) retrieves from server; POP3 (port 110) downloads and deletes.',
      'No encapsulation header is added at this layer — data is passed as a message to Layer 6.',
    ],
    analogy: 'The receptionist at a company — understands what you need and routes the request.',
  },
  {
    num: 6, name: 'Presentation', abbr: 'PRES',
    color: '#f97316', bg: 'rgba(249,115,22,0.15)',
    pdus: 'Data (Encoded)',
    role: 'Translation, encryption, and compression of data between application formats.',
    protocols: ['TLS/SSL', 'ASCII', 'JPEG/PNG', 'MPEG', 'XDR', 'Base64'],
    devices: ['SSL accelerators', 'Gateways'],
    details: [
      'Translates between application data formats and network formats (e.g., EBCDIC ↔ ASCII).',
      'TLS/SSL provides confidentiality (AES encryption), integrity (HMAC), and authentication (X.509 certificates) at this layer.',
      'Compression reduces payload size before transmission: gzip in HTTP Content-Encoding.',
      'Serialisation formats (JSON, XML, Protocol Buffers) are Presentation-layer concerns.',
      'In practice, many modern stacks collapse L5/L6/L7 into the Application layer.',
    ],
    analogy: 'A translator/interpreter — converts messages into a format both sides understand.',
  },
  {
    num: 5, name: 'Session', abbr: 'SESS',
    color: '#eab308', bg: 'rgba(234,179,8,0.15)',
    pdus: 'Data (Session)',
    role: 'Establishes, manages, and terminates sessions (dialogues) between applications.',
    protocols: ['RPC', 'NetBIOS', 'SIP', 'SQL sessions', 'NFS', 'SMB'],
    devices: ['Session gateways', 'Load balancers'],
    details: [
      'Creates and manages logical sessions: full-duplex, half-duplex, or simplex communication.',
      'Synchronisation points (checkpoints) allow recovery after failure without restarting from scratch.',
      'Dialog control: determines whose turn it is to send (token management in half-duplex).',
      'SIP (Session Initiation Protocol) at L5 sets up and tears down VoIP/video calls.',
      'HTTP is technically stateless — sessions are emulated by cookies or tokens, which live at L7.',
    ],
    analogy: 'An air-traffic controller — orchestrates who speaks when and handles re-establishment after disruption.',
  },
  {
    num: 4, name: 'Transport', abbr: 'TRAN',
    color: '#22c55e', bg: 'rgba(34,197,94,0.15)',
    pdus: 'Segment (TCP) / Datagram (UDP)',
    role: 'End-to-end communication, reliability, flow control, and multiplexing via ports.',
    protocols: ['TCP', 'UDP', 'SCTP', 'DCCP'],
    devices: ['Firewalls (L4)', 'Load balancers'],
    details: [
      'Port numbers (0–65535) multiplex multiple services on one IP address. Well-known: 0–1023; Registered: 1024–49151; Ephemeral: 49152–65535.',
      'TCP (RFC 793): Connection-oriented. 3-way handshake: SYN → SYN-ACK → ACK. Provides ordered, reliable, full-duplex byte stream.',
      'TCP header: Src Port (16b), Dst Port (16b), Seq# (32b), Ack# (32b), Data Offset (4b), Flags (9b: URG/ACK/PSH/RST/SYN/FIN), Window (16b), Checksum (16b), Urgent Ptr (16b).',
      'Flow control via sliding window. Congestion control via slow-start, congestion avoidance, fast retransmit (Reno/CUBIC).',
      'UDP (RFC 768): Connectionless. Header: Src Port, Dst Port, Length, Checksum — only 8 bytes. Used for DNS, DHCP, streaming, gaming.',
      'SCTP: multi-homing, multi-streaming; used in telecom (SS7 over IP).',
    ],
    analogy: 'A courier service — ensures the parcel reaches the right door (port), handles receipts (ACKs), and retries lost packages.',
  },
  {
    num: 3, name: 'Network', abbr: 'NET',
    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',
    pdus: 'Packet',
    role: 'Logical addressing (IP) and routing between different networks.',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF', 'BGP', 'ARP*', 'MPLS'],
    devices: ['Routers', 'L3 switches', 'Firewalls (L3)'],
    details: [
      'IPv4 (RFC 791): 32-bit addresses in dotted-decimal. Header: Version(4b), IHL(4b), DSCP(6b), ECN(2b), Total Length(16b), ID(16b), Flags(3b), Fragment Offset(13b), TTL(8b), Protocol(8b), Header Checksum(16b), Src IP(32b), Dst IP(32b).',
      'Subnetting: CIDR notation /N means N bits for network. E.g. 192.168.1.0/24 → 256 addresses, 254 usable hosts.',
      'IPv6 (RFC 8200): 128-bit addresses (8 groups of 4 hex). Simplified header, no fragmentation at routers, built-in IPsec support, stateless autoconfiguration (SLAAC).',
      'Routing: Static (manual), Dynamic (OSPF uses Dijkstra\'s SPF; BGP uses path-vector for inter-AS routing).',
      'ICMP: Control messages — Echo Request/Reply (ping), Destination Unreachable, Time Exceeded (traceroute TTL expiry).',
      'TTL field prevents infinite routing loops. Each router decrements TTL by 1; drops if TTL=0 and sends ICMP Time Exceeded.',
    ],
    analogy: 'GPS navigation — chooses the best path between cities (networks) using logical addresses.',
  },
  {
    num: 2, name: 'Data Link', abbr: 'DL',
    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',
    pdus: 'Frame',
    role: 'Node-to-node delivery within a single network segment; MAC addressing and error detection.',
    protocols: ['Ethernet (802.3)', 'Wi-Fi (802.11)', 'PPP', 'HDLC', 'VLAN (802.1Q)'],
    devices: ['Switches', 'Bridges', 'NICs', 'APs'],
    details: [
      'Two sub-layers: LLC (Logical Link Control, 802.2) handles framing and error notification; MAC handles access control and hardware addressing.',
      'MAC address: 48-bit, written as hex (e.g., AA:BB:CC:DD:EE:FF). First 24 bits = OUI (manufacturer); last 24 bits = NIC-specific.',
      'Ethernet II frame: Preamble(7B) + SFD(1B) + Dst MAC(6B) + Src MAC(6B) + EtherType(2B) + Payload(46–1500B) + FCS(4B).',
      'FCS uses CRC-32 over Dst MAC through end of payload. Receiver recomputes and compares — drops frame if mismatch.',
      'VLAN tagging (802.1Q): inserts 4-byte tag after Src MAC — TPID(0x8100) + TCI (PCP 3b + DEI 1b + VID 12b, supporting 4094 VLANs).',
      'STP (802.1D) / RSTP (802.1w): prevents loops in switched networks by electing a root bridge and blocking redundant paths.',
    ],
    analogy: 'Street addresses in a neighborhood — identifies each house (NIC) on the same block (LAN segment).',
  },
  {
    num: 1, name: 'Physical', abbr: 'PHY',
    color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',
    pdus: 'Bits',
    role: 'Transmission of raw bits over a physical medium; defines electrical, optical, and mechanical specs.',
    protocols: ['IEEE 802.3 (Ethernet PHY)', '802.11 (Wi-Fi RF)', 'RS-232', 'USB', 'Bluetooth PHY', 'DSL'],
    devices: ['Hubs', 'Repeaters', 'Cables', 'Modems', 'Antennas'],
    details: [
      'Defines voltage levels, signal timing, connector pinouts, cable specs, and modulation schemes.',
      'Transmission media: UTP (Cat5e/6/6A), coax, single-mode fibre (SMF, 1310/1550 nm, 40 km+), multi-mode fibre (MMF, 850 nm, 550 m).',
      'Modulation: Baseband (digital pulses — Manchester encoding, NRZ) vs Broadband (analog carrier — QAM, OFDM).',
      '10BASE-T: 10 Mbps over Cat3 UTP, Manchester encoding. 1000BASE-T: 1 Gbps over Cat5e, PAM-5 on 4 pairs simultaneously. 10GBASE-SR: 10 Gbps over MMF.',
      'Wi-Fi PHY: 2.4 GHz uses DSSS (802.11b) or OFDM (802.11g/n). 5/6 GHz uses OFDM with 64/256/1024-QAM; 802.11ax adds OFDMA.',
      'Signal impairments: attenuation (dB/km), noise, dispersion (modal/chromatic in fibre), multipath fading (wireless).',
    ],
    analogy: 'The postal van on the road — physically moves the cargo without caring what\'s inside.',
  },
];

// ─── Encapsulation Steps ─────────────────────────────────────────────────────
const ENCAP_STEPS = [
  { layer: 7, label: 'Application creates message', header: '', trailer: '', color: '#ef4444' },
  { layer: 6, label: 'Presentation encodes/encrypts', header: 'PRES HDR', trailer: '', color: '#f97316' },
  { layer: 5, label: 'Session adds session info', header: 'SESS HDR', trailer: '', color: '#eab308' },
  { layer: 4, label: 'Transport adds TCP/UDP header', header: 'TCP/UDP', trailer: '', color: '#22c55e' },
  { layer: 3, label: 'Network adds IP header', header: 'IP HDR', trailer: '', color: '#3b82f6' },
  { layer: 2, label: 'Data Link adds frame header+trailer', header: 'MAC HDR', trailer: 'FCS', color: '#8b5cf6' },
  { layer: 1, label: 'Physical transmits bits', header: 'PRE+SFD', trailer: '', color: '#06b6d4' },
];

const LAYER_COLORS = ['#06b6d4','#8b5cf6','#3b82f6','#22c55e','#eab308','#f97316','#ef4444'];

// ─── Components ──────────────────────────────────────────────────────────────

function LayerCard({ layer, selected, onClick }: {
  layer: typeof OSI_LAYERS[0]; selected: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
        selected
          ? 'border-white/30 shadow-lg'
          : 'border-white/10 hover:border-white/20'
      }`}
      style={{ background: selected ? layer.bg : 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: layer.color, color: '#000' }}
      >
        {layer.num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white text-sm">{layer.name}</div>
        <div className="text-xs text-slate-400 truncate">{layer.pdus}</div>
      </div>
      <div
        className="text-xs font-mono px-2 py-0.5 rounded"
        style={{ background: layer.color + '33', color: layer.color }}
      >
        L{layer.num}
      </div>
    </motion.button>
  );
}

function OverviewTab() {
  const [selected, setSelected] = useState(OSI_LAYERS[0]);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Layer stack */}
      <div className="lg:col-span-2 space-y-2">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 px-1">
          Click a layer to explore
        </div>
        {OSI_LAYERS.map(l => (
          <LayerCard key={l.num} layer={l} selected={selected.num === l.num} onClick={() => setSelected(l)} />
        ))}
        {/* Arrows */}
        <div className="flex justify-center gap-12 mt-2 text-xs text-slate-500">
          <span>↑ Sender</span>
          <span>↓ Receiver</span>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.num}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-3 rounded-2xl border border-white/10 p-6 space-y-5"
          style={{ background: selected.bg }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
              style={{ background: selected.color, color: '#000' }}
            >
              {selected.num}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Layer {selected.num}: {selected.name}</h2>
              <p className="text-sm text-slate-400">PDU: <span className="text-white">{selected.pdus}</span></p>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">{selected.role}</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: selected.color }}>PROTOCOLS & STANDARDS</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.protocols.map(p => (
                  <span key={p} className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: selected.color }}>DEVICES</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.devices.map(d => (
                  <span key={d} className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold" style={{ color: selected.color }}>IN-DEPTH</div>
            {selected.details.map((d, i) => (
              <div key={i} className="flex gap-2 text-sm text-slate-300">
                <span style={{ color: selected.color }} className="mt-0.5 flex-shrink-0">›</span>
                <span className="leading-relaxed font-mono text-xs">{d}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <span className="text-xs font-semibold" style={{ color: selected.color }}>ANALOGY: </span>
            <span className="text-xs text-slate-300">{selected.analogy}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Layer Deep-Dive tabs (L1-2, L3-4, L5-7) ─────────────────────────────────

function LayerDeepDive({ layers }: { layers: typeof OSI_LAYERS }) {
  const [activeL, setActiveL] = useState(layers[0].num);
  const layer = layers.find(l => l.num === activeL)!;

  return (
    <div className="space-y-6">
      {/* Tab pills */}
      <div className="flex gap-2 flex-wrap">
        {layers.map(l => (
          <button
            key={l.num}
            onClick={() => setActiveL(l.num)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeL === l.num ? 'border-white/30 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
            style={{ background: activeL === l.num ? l.bg : 'rgba(255,255,255,0.04)' }}
          >
            L{l.num} — {l.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeL}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="rounded-2xl border border-white/10 p-6" style={{ background: layer.bg }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black"
                style={{ background: layer.color, color: '#000' }}>
                {layer.num}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Layer {layer.num}: {layer.name}</h3>
                <p className="text-sm text-slate-400">{layer.role}</p>
              </div>
            </div>

            {/* PDU visual */}
            <div className="mt-4">
              <div className="text-xs text-slate-400 mb-2">Protocol Data Unit (PDU)</div>
              <div className="flex items-center gap-1 flex-wrap">
                {layer.num === 1 && (
                  <div className="flex gap-0.5">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.6, delay: i * 0.05, repeat: Infinity }}
                        className="w-3 h-5 rounded-sm flex items-center justify-center text-[8px] font-mono"
                        style={{ background: Math.random() > 0.5 ? layer.color : '#374151', color: '#000' }}
                      >{i % 4 === 0 ? '1' : '0'}</motion.div>
                    ))}
                  </div>
                )}
                {layer.num === 2 && (
                  <div className="flex gap-1 flex-wrap">
                    {['Preamble 7B', 'SFD 1B', 'Dst MAC 6B', 'Src MAC 6B', 'Type 2B', 'Payload 46-1500B', 'FCS 4B'].map((f, i) => (
                      <div key={f} className="px-2 py-1 rounded text-xs font-mono border border-white/20"
                        style={{ background: i === 0 || i === 1 ? '#1f2937' : i === 6 ? '#374151' : layer.bg, color: i < 2 || i === 6 ? '#9ca3af' : layer.color }}>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {layer.num === 3 && (
                  <div className="flex gap-1 flex-wrap">
                    {['Ver 4b', 'IHL 4b', 'DSCP 6b', 'ECN 2b', 'Len 16b', 'ID 16b', 'Flags 3b', 'FragOff 13b', 'TTL 8b', 'Proto 8b', 'Chksum 16b', 'Src IP 32b', 'Dst IP 32b', 'Options', 'Payload'].map((f, i) => (
                      <div key={f} className="px-2 py-1 rounded text-xs font-mono border border-white/20"
                        style={{ background: i >= 11 && i <= 12 ? layer.bg : 'rgba(0,0,0,0.4)', color: i >= 11 ? layer.color : '#9ca3af' }}>
                        {f}
                      </div>
                    ))}
                  </div>
                )}
                {layer.num === 4 && (
                  <div className="space-y-2 w-full">
                    <div className="text-xs text-slate-400">TCP Header:</div>
                    <div className="flex gap-1 flex-wrap">
                      {['Src Port 16b', 'Dst Port 16b', 'Seq# 32b', 'Ack# 32b', 'Offset 4b', 'Flags 9b', 'Window 16b', 'Checksum 16b', 'Urgent 16b', 'Options', 'Data'].map((f, i) => (
                        <div key={f} className="px-2 py-1 rounded text-xs font-mono border border-white/20"
                          style={{ background: i < 2 ? layer.bg : 'rgba(0,0,0,0.4)', color: i < 2 ? layer.color : '#9ca3af' }}>
                          {f}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">UDP Header (only 8 bytes):</div>
                    <div className="flex gap-1 flex-wrap">
                      {['Src Port 16b', 'Dst Port 16b', 'Length 16b', 'Checksum 16b', 'Data'].map((f, i) => (
                        <div key={f} className="px-2 py-1 rounded text-xs font-mono border border-white/20"
                          style={{ background: i < 2 ? layer.bg : 'rgba(0,0,0,0.4)', color: i < 2 ? layer.color : '#9ca3af' }}>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(layer.num >= 5) && (
                  <div className="px-4 py-2 rounded text-sm font-mono border border-white/20"
                    style={{ background: layer.bg, color: layer.color }}>
                    {layer.pdus}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-3">
            {layer.details.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 rounded-xl border border-white/10 p-4"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: layer.color, color: '#000' }}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{d}</p>
              </motion.div>
            ))}
          </div>

          {/* Protocols grid */}
          <div className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: layer.color }}>KEY PROTOCOLS</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {layer.protocols.map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: layer.color }} />
                  {p}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Encapsulation Animation Tab ──────────────────────────────────────────────
function EncapsulationTab() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'encap' | 'decap'>('encap');
  const isEncap = mode === 'encap';

  const steps = isEncap ? ENCAP_STEPS : [...ENCAP_STEPS].reverse();
  const currentStep = steps[step];

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-3 items-center">
        <button
          onClick={() => { setMode('encap'); setStep(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === 'encap' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-white/10 text-slate-400'}`}
        >
          Encapsulation (Sender)
        </button>
        <button
          onClick={() => { setMode('decap'); setStep(0); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${mode === 'decap' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' : 'border-white/10 text-slate-400'}`}
        >
          Decapsulation (Receiver)
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Visual stack */}
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
            {isEncap ? 'Building the PDU (Layer 7 → 1)' : 'Stripping headers (Layer 1 → 7)'}
          </div>
          <div className="space-y-1.5">
            {[...ENCAP_STEPS].reverse().map((s, idx) => {
              const layerIdx = 6 - idx;
              const isActive = isEncap
                ? layerIdx <= step
                : layerIdx >= (6 - step);
              const isCurrent = isEncap
                ? layerIdx === step
                : layerIdx === (6 - step);

              return (
                <motion.div
                  key={s.layer}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0.25,
                    scale: isCurrent ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-all ${
                    isCurrent ? 'border-white/30' : 'border-white/5'
                  }`}
                  style={{ background: isActive ? s.color + '22' : 'rgba(255,255,255,0.02)' }}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: isActive ? s.color : '#374151', color: '#000' }}>
                    {s.layer}
                  </div>
                  {s.header && isActive && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="px-2 py-0.5 rounded text-xs font-mono border"
                      style={{ background: s.color + '44', borderColor: s.color + '66', color: s.color, transformOrigin: 'left' }}
                    >
                      {s.header}
                    </motion.div>
                  )}
                  <div className={`flex-1 h-5 rounded text-xs font-mono flex items-center px-2 border ${
                    isActive ? 'border-white/20' : 'border-white/5'
                  }`} style={{ background: 'rgba(0,0,0,0.4)', color: isActive ? '#e5e7eb' : '#4b5563' }}>
                    DATA
                  </div>
                  {s.trailer && isActive && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className="px-2 py-0.5 rounded text-xs font-mono border"
                      style={{ background: s.color + '44', borderColor: s.color + '66', color: s.color, transformOrigin: 'right' }}
                    >
                      {s.trailer}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Step info + controls */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${step}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-white/10 p-5 space-y-3"
              style={{ background: currentStep.color + '18' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                  style={{ background: currentStep.color, color: '#000' }}>
                  {currentStep.layer}
                </div>
                <div>
                  <div className="font-bold text-white">{OSI_LAYERS.find(l => l.num === currentStep.layer)?.name} Layer</div>
                  <div className="text-xs text-slate-400">{currentStep.label}</div>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {isEncap
                  ? currentStep.layer === 7 ? 'The application creates user data (e.g., an HTTP GET request). No header added yet — this is the raw message.'
                  : currentStep.layer === 6 ? 'Presentation layer encodes the data (e.g., encrypts with TLS). The Application Data is wrapped.'
                  : currentStep.layer === 5 ? 'Session layer adds session management info to track the dialog state.'
                  : currentStep.layer === 4 ? 'Transport layer prepends a TCP (or UDP) header with source/dest ports, sequence number, and flags. Creates a Segment.'
                  : currentStep.layer === 3 ? 'Network layer prepends an IP header with source and destination IP addresses. Creates a Packet.'
                  : currentStep.layer === 2 ? 'Data Link layer wraps the packet in a Frame: adds MAC header (src/dst MAC) at front and FCS trailer at back.'
                  : 'Physical layer converts the frame to bits (voltage pulses/light pulses) and transmits on the medium. Preamble + SFD prepended.'
                  : currentStep.layer === 1 ? 'Physical layer receives bits and reconstructs the frame. Removes preamble/SFD.'
                  : currentStep.layer === 2 ? 'Data Link checks FCS for errors. Removes MAC header and trailer. Passes packet upward.'
                  : currentStep.layer === 3 ? 'Network layer reads the IP destination. If we\'re the destination, removes IP header and passes segment up.'
                  : currentStep.layer === 4 ? 'Transport layer reads port number, reassembles segments if needed. Passes data to the correct process.'
                  : currentStep.layer === 5 ? 'Session layer re-establishes or continues the session. Removes session info.'
                  : currentStep.layer === 6 ? 'Presentation decrypts/decodes the data. Passes the raw message to the application.'
                  : 'Application layer receives the final message and delivers it to the program (e.g., browser renders the HTTP response).'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Step progress */}
          <div className="flex gap-1.5 items-center">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="h-2 flex-1 rounded-full transition-all"
                style={{ background: i <= step ? LAYER_COLORS[isEncap ? i : 6 - i] : '#374151' }}
              />
            ))}
          </div>

          {/* Prev / Next */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{ background: step < steps.length - 1 ? LAYER_COLORS[isEncap ? step + 1 : 5 - step] : '#374151', color: '#000' }}
            >
              Next →
            </button>
          </div>

          {/* Summary boxes */}
          <div className="rounded-xl border border-white/10 p-4 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-semibold text-slate-400">KEY TAKEAWAY</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Each layer adds its own header (and sometimes trailer) to create a new PDU.
              The receiver processes layers in reverse order — stripping each header and passing
              the payload up. This is called <span className="text-white font-semibold">Protocol Data Unit encapsulation</span>.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-center">
              {[['L7-5', 'Data/Message'], ['L4', 'Segment'], ['L3', 'Packet'], ['L2', 'Frame'], ['L1', 'Bits']].map(([l, pdu]) => (
                <div key={l} className="rounded px-1 py-1.5 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="font-mono text-slate-400">{l}</div>
                  <div className="text-white font-semibold">{pdu}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chapter ─────────────────────────────────────────────────────────────
const TABS = ['OSI Overview', 'Physical & Data Link', 'Network & Transport', 'Session–Application', 'Encapsulation'] as const;
type Tab = typeof TABS[number];

const CH17_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'OSI Overview':         ['osi_overview'],
  'Physical & Data Link': ['osi_l12'],
  'Network & Transport':  ['osi_l34'],
  'Session–Application':  ['osi_l567'],
  'Encapsulation':        ['osi_encap'],
};

export function Chapter17() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('OSI Overview');
  useSubtopicNav(CH17_TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    CH17_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch17', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="The 7-layer ISO/IEC 7498-1 framework — each layer's role, PDU types, protocols, header anatomy, and a step-by-step encapsulation/decapsulation animation." />
        <ModeBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-band5 text-band5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'OSI Overview'         && <OverviewTab />}
          {activeTab === 'Physical & Data Link'  && <LayerDeepDive layers={[OSI_LAYERS[6], OSI_LAYERS[5]]} />}
          {activeTab === 'Network & Transport'   && <LayerDeepDive layers={[OSI_LAYERS[4], OSI_LAYERS[3]]} />}
          {activeTab === 'Session–Application'   && <LayerDeepDive layers={[OSI_LAYERS[2], OSI_LAYERS[1], OSI_LAYERS[0]]} />}
          {activeTab === 'Encapsulation'         && <EncapsulationTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
