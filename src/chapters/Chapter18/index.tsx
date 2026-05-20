import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch18')!;

// ─── TCP/IP Model Data (Forouzan-aligned, 5-layer) ───────────────────────────
const TCPIP_LAYERS = [
  {
    num: 5, name: 'Application', abbr: 'APP',
    osiMapping: 'OSI L5 + L6 + L7',
    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',
    pdus: 'Message',
    role: 'Provides services directly to end users. Combines OSI Session, Presentation, and Application.',
    protocols: ['HTTP/HTTPS', 'FTP/TFTP', 'SMTP/IMAP/POP3', 'DNS', 'DHCP', 'SSH', 'Telnet', 'SNMP', 'NTP', 'SIP'],
    details: [
      'HTTP/1.1 (RFC 7230): Text-based request/response. Persistent connections (keep-alive). Methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS.',
      'HTTP/2 (RFC 9113): Binary framing, multiplexing (multiple streams on one TCP conn), header compression (HPACK), server push.',
      'HTTP/3: Runs over QUIC (UDP-based), eliminates head-of-line blocking, faster handshake (0-RTT or 1-RTT).',
      'DNS (RFC 1035): Hierarchical, distributed. Query types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (nameserver), TXT. Recursive vs Iterative resolution.',
      'DHCP (RFC 2131): DORA — Discover (broadcast) → Offer (server unicast) → Request (client broadcast) → Acknowledge. Leases IP addresses dynamically.',
      'FTP (RFC 959): Dual-channel — Control port 21 (commands), Data port 20 (active) or ephemeral (passive). Sends credentials in plaintext (use SFTP/FTPS).',
      'SSH (RFC 4253): Encrypted replacement for Telnet/rlogin. Uses Diffie-Hellman for key exchange, AES for encryption, HMAC-SHA for integrity.',
      'SMTP (RFC 5321): Mail Transfer Agent to MTA communication. TLS upgrade via STARTTLS on port 587 or implicit TLS on port 465.',
    ],
  },
  {
    num: 4, name: 'Transport', abbr: 'TRANS',
    osiMapping: 'OSI L4',
    color: '#22c55e', bg: 'rgba(34,197,94,0.15)',
    pdus: 'Segment (TCP) / Datagram (UDP)',
    role: 'Process-to-process delivery. TCP guarantees reliability; UDP offers low overhead.',
    protocols: ['TCP', 'UDP', 'SCTP', 'DCCP', 'QUIC'],
    details: [
      'TCP 3-Way Handshake: Client sends SYN (ISN_c); Server replies SYN-ACK (ISN_s, ACK=ISN_c+1); Client sends ACK (ACK=ISN_s+1). Connection established.',
      'TCP 4-Way Teardown: Either side sends FIN → other ACKs → other sends FIN → first ACKs. TIME_WAIT state (2×MSL ≈ 4 min) to handle delayed duplicates.',
      'TCP Reliable Delivery: Sequence numbers track bytes (not segments). ACK acknowledges "next expected byte". Retransmission timer (RTO) based on RTT estimate.',
      'Flow Control: Receiver advertises receive window (rwnd) in each ACK. Sender cannot have more than rwnd unacknowledged bytes in flight.',
      'Congestion Control (TCP Reno/CUBIC): Slow Start (exponential cwnd growth until ssthresh), Congestion Avoidance (linear growth), Fast Retransmit (3 dup ACKs), Fast Recovery.',
      'Nagle\'s Algorithm: Combines small writes into one segment (reduces small-packet problem). Disabled with TCP_NODELAY socket option for interactive apps.',
      'UDP Header (only 8 bytes): Src Port(2B) + Dst Port(2B) + Length(2B) + Checksum(2B). Connectionless, unordered, unreliable. Checksum is optional in IPv4.',
      'QUIC (RFC 9000): Multiplexed streams over UDP. Built-in TLS 1.3. Stream-level flow control. No HOL blocking. Used by HTTP/3.',
    ],
  },
  {
    num: 3, name: 'Internet', abbr: 'INET',
    osiMapping: 'OSI L3',
    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',
    pdus: 'Datagram (Packet)',
    role: 'Internetwork delivery (hop-by-hop) using IP addresses. Best-effort, connectionless.',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'ICMPv6', 'ARP', 'RARP', 'IGMP', 'OSPF', 'BGP', 'RIP'],
    details: [
      'IPv4 Datagram: Version(4b) IHL(4b) DSCP(6b) ECN(2b) TotLen(16b) | ID(16b) Flags(3b) FragOff(13b) | TTL(8b) Protocol(8b) HdrChksum(16b) | SrcIP(32b) | DstIP(32b) | Options | Data.',
      'IPv4 Fragmentation: Router or host splits datagram if size > link MTU. Fields: ID (same for all frags), Flags (DF=don\'t fragment, MF=more frags), Fragment Offset (in 8-byte units).',
      'IPv6 (RFC 8200): Fixed 40-byte base header. No fragmentation at routers (hosts use PMTUD). No header checksum (Transport handles it). Extension headers are chained.',
      'CIDR & Subnetting: /N prefix length. Subnet mask = N ones followed by (32-N) zeros. Network address = IP & mask. Broadcast = IP | ~mask.',
      'ICMP (RFC 792): Error reporting (Type 3=Dest Unreachable, Type 11=TTL Exceeded, Type 5=Redirect) and diagnostics (Type 8/0=Echo Req/Reply for ping).',
      'ARP (RFC 826): Maps IPv4 → MAC on same LAN. Broadcast ARP Request "Who has 192.168.1.x?", Unicast ARP Reply "I have it, my MAC is XX:XX:XX:XX:XX:XX". Cached for 20 min.',
      'Routing Protocols: RIP (distance-vector, hop count metric, 15 max), OSPF (link-state, Dijkstra SPF, areas, cost metric), BGP (path-vector, AS-level, policy-based, internet backbone).',
      'NAT (RFC 3022): Translates private IPs (10/8, 172.16/12, 192.168/16) to public IP. PAT/NAPT multiplexes multiple hosts via port mapping. Complicates peer-to-peer.',
    ],
  },
  {
    num: 2, name: 'Data Link', abbr: 'DL',
    osiMapping: 'OSI L2',
    color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',
    pdus: 'Frame',
    role: 'Node-to-node delivery on a single network link. Framing, MAC addressing, error detection.',
    protocols: ['Ethernet 802.3', 'Wi-Fi 802.11', 'PPP', 'HDLC', 'Frame Relay', 'ATM', 'DOCSIS'],
    details: [
      'Ethernet II Frame: Preamble(7B 0xAA×7) SFD(1B 0xAB) DstMAC(6B) SrcMAC(6B) EtherType(2B) Payload(46-1500B) FCS(4B CRC-32).',
      'EtherType field: 0x0800=IPv4, 0x0806=ARP, 0x86DD=IPv6, 0x8100=VLAN (802.1Q), 0x8847=MPLS.',
      'MAC addresses: 48 bits. Unicast (I/G bit=0), Multicast (I/G bit=1), Broadcast (FF:FF:FF:FF:FF:FF). OUI is first 24 bits (IEEE-registered).',
      'PPP (RFC 1661): For WAN links (DSL, leased lines). HDLC-like framing + LCP (Link Control) + NCP (Network Control, e.g. IPCP for IP negotiation).',
      'CSMA/CD: Listen before transmit. If collision detected, jam signal sent, random backoff (binary exponential). Only relevant for half-duplex Ethernet.',
      'VLAN tagging (802.1Q): 4-byte insert after Src MAC: TPID(0x8100) + PCP(3b) + DEI(1b) + VID(12b). Up to 4094 VLANs. QinQ (0x88A8) for service provider tunneling.',
    ],
  },
  {
    num: 1, name: 'Physical', abbr: 'PHY',
    osiMapping: 'OSI L1',
    color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',
    pdus: 'Bits',
    role: 'Transmission of raw bits over a medium. Defines electrical, optical, and mechanical specifications.',
    protocols: ['IEEE 802.3 PHY', 'IEEE 802.11 PHY', 'DSL', 'Cable (DOCSIS)', 'USB', 'Bluetooth'],
    details: [
      'Twisted pair: UTP Cat5e (1G), Cat6 (10G to 55m), Cat6A (10G to 100m), Cat8 (40G to 30m). Pairs: 1-2 (TX), 3-6 (RX) in 100BASE-T; all 4 pairs used in 1000BASE-T with PAM-5.',
      'Fibre: SMF (single-mode, 1310/1550 nm, OS2, 40 km+), MMF (multi-mode, 850 nm, OM3/4/5, up to 400 m for 10G). Connectors: LC (small, preferred), SC, ST.',
      '10GBASE-T: 10 Gbps over Cat6A/Cat7, 100 m. Uses Tomlinson-Harashima Precoding (THP) and DSQ128 modulation.',
      'Wi-Fi PHY: 2.4 GHz — DSSS (802.11b 11 Mbps), OFDM (802.11g 54 Mbps, 802.11n 600 Mbps). 5/6 GHz — OFDM 802.11ac (3.5 Gbps VHT), 802.11ax (9.6 Gbps HE with OFDMA, MU-MIMO, BSS Colouring).',
      'Signal encoding: NRZ, Manchester (10BASE-T), MLT-3 (100BASE-TX), PAM-5 (1000BASE-T), PAM-4 (25/50/100G).',
      'TDR (Time Domain Reflectometry): Locates cable faults by measuring reflection time. Useful for cable length estimation and break location.',
    ],
  },
];

// ─── OSI↔TCP/IP Mapping ───────────────────────────────────────────────────────
const MODEL_COMPARE = [
  { osi: ['Application (7)', 'Presentation (6)', 'Session (5)'], tcpip: 'Application (5)', color: '#ef4444' },
  { osi: ['Transport (4)'], tcpip: 'Transport (4)', color: '#22c55e' },
  { osi: ['Network (3)'], tcpip: 'Internet (3)', color: '#3b82f6' },
  { osi: ['Data Link (2)'], tcpip: 'Data Link (2)', color: '#8b5cf6' },
  { osi: ['Physical (1)'], tcpip: 'Physical (1)', color: '#06b6d4' },
];

// ─── TCP Handshake Steps ──────────────────────────────────────────────────────
const TCP_HANDSHAKE_STEPS = [
  { from: 'client', to: 'server', label: 'SYN', flag: 'SYN=1, SEQ=1000', color: '#22c55e',
    desc: 'Client initiates connection. Sends SYN with its Initial Sequence Number (ISN=1000). Client → SYN_SENT state.' },
  { from: 'server', to: 'client', label: 'SYN-ACK', flag: 'SYN=1, ACK=1001, SEQ=5000', color: '#3b82f6',
    desc: 'Server acknowledges client ISN (ACK=1001 means "expecting byte 1001 next"). Sends its own ISN (5000). Server → SYN_RCVD state.' },
  { from: 'client', to: 'server', label: 'ACK', flag: 'ACK=5001, SEQ=1001', color: '#f97316',
    desc: 'Client acknowledges server ISN. Both sides → ESTABLISHED. Data transfer can begin. This ACK may carry data (piggybacking).' },
  { from: 'client', to: 'server', label: 'DATA', flag: 'SEQ=1001, LEN=500', color: '#8b5cf6',
    desc: 'Client sends data (e.g. HTTP GET). Sequence number tracks bytes sent. Server will ACK=1501.' },
  { from: 'server', to: 'client', label: 'ACK + DATA', flag: 'ACK=1501, SEQ=5001, LEN=1400', color: '#eab308',
    desc: 'Server acknowledges received data and sends response (e.g. HTTP 200 OK with body). Piggybacked ACK.' },
  { from: 'client', to: 'server', label: 'FIN', flag: 'FIN=1, SEQ=1501', color: '#ef4444',
    desc: 'Client initiates teardown. Sends FIN → FIN_WAIT_1 state. Half-close: client done sending but can still receive.' },
  { from: 'server', to: 'client', label: 'FIN-ACK', flag: 'FIN=1, ACK=1502', color: '#ef4444',
    desc: 'Server ACKs FIN and sends its own FIN. Client → TIME_WAIT (2×MSL). Connection fully closed after timeout.' },
];

// ─── Components ──────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="space-y-6">
      {/* Model comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">TCP/IP Model (Forouzan 5-Layer)</div>
          <div className="space-y-2">
            {[...TCPIP_LAYERS].reverse().map(l => (
              <motion.div
                key={l.num}
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 cursor-pointer"
                style={{ background: l.bg }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: l.color, color: '#000' }}>
                  {l.num}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm">{l.name}</div>
                  <div className="text-xs text-slate-400">{l.pdus}</div>
                </div>
                <div className="text-xs text-slate-500">{l.protocols.slice(0,2).join(', ')}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* OSI vs TCP/IP comparison */}
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">OSI ↔ TCP/IP Mapping</div>
          <div className="space-y-2">
            {MODEL_COMPARE.map((m, i) => (
              <div key={i} className="flex items-stretch gap-2">
                <div className="flex-1 rounded-xl border border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-xs text-slate-400 mb-1">OSI</div>
                  {m.osi.map(o => (
                    <div key={o} className="text-xs text-white">{o}</div>
                  ))}
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-0.5" style={{ background: m.color }} />
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                </div>
                <div className="flex-1 rounded-xl border border-white/10 p-3" style={{ background: m.color + '18' }}>
                  <div className="text-xs text-slate-400 mb-1">TCP/IP</div>
                  <div className="text-xs font-semibold" style={{ color: m.color }}>{m.tcpip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key differences */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: 'Designed By', osi: 'ISO (theoretical)', tcpip: 'DARPA (practical)', color: '#3b82f6' },
          { title: 'Layers', osi: '7 layers', tcpip: '4 or 5 layers', color: '#8b5cf6' },
          { title: 'Usage', osi: 'Reference/learning', tcpip: 'Real networks (Internet)', color: '#22c55e' },
          { title: 'Protocol fit', osi: 'Model → Protocols', tcpip: 'Protocols → Model', color: '#f97316' },
          { title: 'Transport', osi: 'Connection-oriented', tcpip: 'Both TCP & UDP', color: '#eab308' },
          { title: 'Status', osi: 'ISO 7498-1 standard', tcpip: 'De-facto internet standard', color: '#ef4444' },
        ].map(d => (
          <div key={d.title} className="rounded-xl border border-white/10 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs font-semibold mb-2" style={{ color: d.color }}>{d.title}</div>
            <div className="text-xs text-slate-400 mb-1">OSI: <span className="text-white">{d.osi}</span></div>
            <div className="text-xs text-slate-400">TCP/IP: <span className="text-white">{d.tcpip}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Layer Detail Tab ─────────────────────────────────────────────────────────
function LayerDetailTab({ layer }: { layer: typeof TCPIP_LAYERS[0] }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 p-6" style={{ background: layer.bg }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black"
            style={{ background: layer.color, color: '#000' }}>
            {layer.num}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">{layer.name} Layer</h3>
            <div className="text-sm text-slate-400">PDU: {layer.pdus} · Maps to: {layer.osiMapping}</div>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{layer.role}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          {layer.protocols.map(p => (
            <span key={p} className="text-xs px-2 py-1 rounded-full border"
              style={{ background: layer.color + '22', borderColor: layer.color + '44', color: layer.color }}>
              {p}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {layer.details.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
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
    </div>
  );
}

// ─── TCP Handshake Animation ──────────────────────────────────────────────────
function TCPHandshakeTab() {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setStep(s => {
          if (s >= TCP_HANDSHAKE_STEPS.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1400);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing]);

  const reset = () => { setPlaying(false); setStep(-1); };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-3 items-center">
        <button
          onClick={() => { if (step < 0) setStep(0); setPlaying(p => !p); }}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-black transition-all"
          style={{ background: playing ? '#ef4444' : '#22c55e' }}
        >
          {playing ? '⏸ Pause' : step < 0 ? '▶ Start' : '▶ Resume'}
        </button>
        <button onClick={reset} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white transition-all">
          ↺ Reset
        </button>
        <div className="text-xs text-slate-500 ml-2">Step {Math.max(0, step + 1)} / {TCP_HANDSHAKE_STEPS.length}</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline visualization */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 p-6 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {/* Endpoint headers */}
            <div className="flex justify-between mb-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl">💻</div>
                <div className="text-xs text-blue-400 font-semibold">CLIENT</div>
                <div className="text-xs text-slate-500">192.168.1.10</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">🖥</div>
                <div className="text-xs text-purple-400 font-semibold">SERVER</div>
                <div className="text-xs text-slate-500">93.184.216.34</div>
              </div>
            </div>

            {/* Vertical lines */}
            <div className="relative" style={{ minHeight: `${TCP_HANDSHAKE_STEPS.length * 60 + 20}px` }}>
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-500/20" />
              <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-purple-500/20" />

              {TCP_HANDSHAKE_STEPS.map((s, i) => {
                const isVisible = i <= step;
                const isCurrent = i === step;
                const toRight = s.from === 'client';
                const yPos = i * 60 + 10;

                return (
                  <AnimatePresence key={i}>
                    {isVisible && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute"
                        style={{
                          top: yPos,
                          left: '24px',
                          right: '24px',
                          transformOrigin: toRight ? 'left' : 'right',
                        }}
                      >
                        {/* Arrow line */}
                        <div className="flex items-center w-full relative">
                          <div className="flex-1 h-0.5 transition-all" style={{ background: s.color }} />
                          <div
                            className="text-xs font-bold px-2 py-0.5 rounded-lg absolute whitespace-nowrap"
                            style={{
                              left: '50%',
                              transform: 'translateX(-50%) translateY(-14px)',
                              background: s.color + '33',
                              color: s.color,
                              border: `1px solid ${s.color}55`,
                              boxShadow: isCurrent ? `0 0 8px ${s.color}66` : 'none',
                            }}
                          >
                            {s.label}
                          </div>
                        </div>
                        {/* Arrowhead */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-xs"
                          style={{
                            right: toRight ? 0 : undefined,
                            left: toRight ? undefined : 0,
                            color: s.color,
                          }}
                        >
                          {toRight ? '→' : '←'}
                        </div>
                        {/* Flags */}
                        <div
                          className="absolute whitespace-nowrap text-xs"
                          style={{
                            left: '50%',
                            transform: 'translateX(-50%) translateY(6px)',
                            color: '#6b7280',
                          }}
                        >
                          {s.flag}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step description */}
        <div>
          <AnimatePresence mode="wait">
            {step >= 0 ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 p-5 space-y-4"
                style={{ background: TCP_HANDSHAKE_STEPS[step].color + '18' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: TCP_HANDSHAKE_STEPS[step].color, color: '#000' }}>
                    {step + 1}
                  </div>
                  <div className="font-bold text-white">{TCP_HANDSHAKE_STEPS[step].label}</div>
                </div>
                <div className="font-mono text-xs px-3 py-2 rounded-lg border border-white/10"
                  style={{ background: 'rgba(0,0,0,0.4)', color: TCP_HANDSHAKE_STEPS[step].color }}>
                  {TCP_HANDSHAKE_STEPS[step].flag}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{TCP_HANDSHAKE_STEPS[step].desc}</p>
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-white/10 p-5 text-center text-slate-500 text-sm">
                Press Start to animate the TCP handshake
              </div>
            )}
          </AnimatePresence>

          {/* Steps list */}
          <div className="mt-4 space-y-1.5">
            {TCP_HANDSHAKE_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => { setPlaying(false); setStep(i); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all border ${
                  i <= step ? 'border-white/20' : 'border-white/5 opacity-50'
                }`}
                style={{ background: i === step ? s.color + '22' : 'rgba(255,255,255,0.03)' }}
              >
                <div className="w-5 h-5 rounded flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: i <= step ? s.color : '#374151', color: '#000' }}>
                  {i + 1}
                </div>
                <span style={{ color: i === step ? s.color : i < step ? '#9ca3af' : '#4b5563' }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TCP state machine summary */}
      <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="text-xs font-semibold text-slate-400 mb-3">TCP STATE TRANSITIONS (KEY STATES)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { state: 'LISTEN', desc: 'Server waiting for incoming SYN', color: '#3b82f6' },
            { state: 'SYN_SENT', desc: 'Client sent SYN, awaiting SYN-ACK', color: '#22c55e' },
            { state: 'ESTABLISHED', desc: 'Connection open, data flowing', color: '#f97316' },
            { state: 'TIME_WAIT', desc: '2×MSL wait after FIN-ACK. Prevents delayed duplicate confusion', color: '#ef4444' },
          ].map(s => (
            <div key={s.state} className="rounded-xl border border-white/10 p-3" style={{ background: s.color + '11' }}>
              <div className="text-xs font-mono font-bold mb-1" style={{ color: s.color }}>{s.state}</div>
              <div className="text-xs text-slate-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Data Flow Animation (HTTP Request Journey) ───────────────────────────────
function DataFlowTab() {
  const [step, setStep] = useState(0);

  const FLOW_STEPS = [
    {
      layer: 5, name: 'Application', color: '#ef4444',
      action: 'Chrome sends HTTP GET',
      pdu: 'GET /index.html HTTP/1.1\nHost: example.com\nAccept: text/html',
      desc: 'Your browser constructs an HTTP request message. No header added yet — this is the application message.',
    },
    {
      layer: 4, name: 'Transport', color: '#22c55e',
      action: 'TCP segments the data',
      pdu: '[TCP HDR: Src:51234→Dst:80, SEQ:1000, SYN ACK, Win:65535]\n[HTTP Data: GET /index.html...]',
      desc: 'Transport layer prepends TCP header. Source port (ephemeral, e.g. 51234), Destination port 80 (HTTP). Creates a Segment.',
    },
    {
      layer: 3, name: 'Internet (IP)', color: '#3b82f6',
      action: 'IP wraps the segment',
      pdu: '[IP HDR: Src:192.168.1.10 → Dst:93.184.216.34, TTL:64, Proto:TCP]\n[TCP HDR]\n[HTTP Data]',
      desc: 'Network layer prepends IP header with source (your private IP) and destination (example.com\'s public IP). Creates a Packet.',
    },
    {
      layer: 2, name: 'Data Link', color: '#8b5cf6',
      action: 'Ethernet frames the packet',
      pdu: '[Preamble][SFD][DstMAC: 00:11:22:33:44:55][SrcMAC: AA:BB:CC:DD:EE:FF][0x0800]\n[IP Packet]\n[FCS:0xABCD1234]',
      desc: 'Data Link layer wraps in an Ethernet frame. Destination MAC is your router\'s MAC (ARP-resolved). FCS appended for error detection.',
    },
    {
      layer: 1, name: 'Physical', color: '#06b6d4',
      action: 'Bits transmitted on wire',
      pdu: '10101010 10101010 10101011 [frame bits...] (NRZ/PAM-5/OFDM encoding)',
      desc: 'Physical layer converts the frame to electrical signals (UTP) or light pulses (fibre) or radio waves (Wi-Fi) and transmits.',
    },
  ];

  const current = FLOW_STEPS[step];

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400">Follow an HTTP GET request from browser to wire and back.</div>

      {/* Step tabs */}
      <div className="flex gap-2 flex-wrap">
        {FLOW_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              step === i ? 'border-white/30' : 'border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            style={{ background: step === i ? s.color + '22' : 'rgba(255,255,255,0.04)', color: step === i ? s.color : undefined }}
          >
            L{s.layer}: {s.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* PDU view */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 p-6 space-y-4"
            style={{ background: current.color + '15' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black"
                style={{ background: current.color, color: '#000' }}>
                {current.layer}
              </div>
              <div>
                <div className="font-bold text-white">{current.action}</div>
                <div className="text-xs text-slate-400">{current.name} Layer</div>
              </div>
            </div>
            <pre className="text-xs font-mono rounded-xl p-4 border border-white/10 whitespace-pre-wrap break-all leading-relaxed"
              style={{ background: 'rgba(0,0,0,0.5)', color: current.color }}>
              {current.pdu}
            </pre>
            <p className="text-sm text-slate-300 leading-relaxed">{current.desc}</p>
          </motion.div>
        </AnimatePresence>

        {/* Cumulative layers visual */}
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">PDU at layer {current.layer}</div>
          <div className="space-y-1.5">
            {FLOW_STEPS.map((s, i) => {
              const visible = i >= step;
              return (
                <motion.div
                  key={i}
                  animate={{ opacity: visible ? 1 : 0.2 }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                  style={{
                    background: visible ? s.color + '18' : 'rgba(255,255,255,0.02)',
                    borderColor: visible ? s.color + '44' : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: visible ? s.color : '#374151', color: '#000' }}>
                    {s.layer}
                  </div>
                  <div className="text-xs" style={{ color: visible ? s.color : '#4b5563' }}>
                    {i === 0 ? 'HTTP Data' :
                     i === 1 ? 'TCP Header | HTTP Data' :
                     i === 2 ? 'IP Header | TCP Header | HTTP Data' :
                     i === 3 ? 'Eth Header | IP | TCP | HTTP Data | FCS' :
                     'Preamble | Frame bits | ...'}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="text-xs font-semibold text-slate-400 mb-2">DECAPSULATION (Receiver)</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              At the destination, each layer strips its header and passes the payload up.
              L1 rebuilds the frame → L2 checks FCS, strips MAC headers → L3 checks IP dest, strips IP header →
              L4 reassembles segments, delivers to port 80 process → L5 web server reads HTTP GET and responds.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
          ← Up a Layer
        </button>
        <button onClick={() => setStep(s => Math.min(FLOW_STEPS.length - 1, s + 1))} disabled={step === FLOW_STEPS.length - 1}
          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
          style={{ background: step < FLOW_STEPS.length - 1 ? current.color : '#374151', color: '#000' }}>
          Down a Layer →
        </button>
      </div>
    </div>
  );
}

// ─── Main Chapter ─────────────────────────────────────────────────────────────
const TABS = ['TCP/IP Overview', 'Application Layer', 'Transport + Handshake', 'Internet Layer', 'Data Link & Physical', 'Data Flow'] as const;
type Tab = typeof TABS[number];

const CH18_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'TCP/IP Overview':       ['tcpip_overview'],
  'Application Layer':     ['app_layer'],
  'Transport + Handshake': ['transport_layer'],
  'Internet Layer':        ['internet_layer'],
  'Data Link & Physical':  ['net_access'],
  'Data Flow':             [],
};

export function Chapter18() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('TCP/IP Overview');
  useSubtopicNav(CH18_TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    CH18_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch18', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="The practical protocol suite powering the Internet — Forouzan's 5-layer model, TCP 3-way handshake animation, IP header anatomy, ARP, NAT, and a full HTTP request data flow." />
        <ModeBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-band6 text-band6' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'TCP/IP Overview'      && <OverviewTab />}
          {activeTab === 'Application Layer'    && <LayerDetailTab layer={TCPIP_LAYERS[0]} />}
          {activeTab === 'Transport + Handshake' && (
            <div className="space-y-8">
              <LayerDetailTab layer={TCPIP_LAYERS[1]} />
              <div className="border-t border-slate-700/50 pt-6">
                <div className="text-xs font-semibold text-band6 uppercase tracking-wider mb-4">TCP 3-Way Handshake & Teardown — Animation</div>
                <TCPHandshakeTab />
              </div>
            </div>
          )}
          {activeTab === 'Internet Layer'       && <LayerDetailTab layer={TCPIP_LAYERS[2]} />}
          {activeTab === 'Data Link & Physical'  && (
            <div className="space-y-8">
              <LayerDetailTab layer={TCPIP_LAYERS[3]} />
              <div className="border-t border-slate-700/50 pt-6">
                <LayerDetailTab layer={TCPIP_LAYERS[4]} />
              </div>
            </div>
          )}
          {activeTab === 'Data Flow'            && <DataFlowTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
