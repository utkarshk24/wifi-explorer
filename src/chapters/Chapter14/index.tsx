import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeContent, ModeBadge } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch14')!;
const TABS = ['Frame Anatomy', 'MAC Addressing', 'Error Detection'] as const;
type Tab = typeof TABS[number];

const CH14_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Frame Anatomy':  ['eth_frame'],
  'MAC Addressing': ['eth_mac'],
  'Error Detection':['eth_fcs'],
};

// ─── Tab 1: Frame Anatomy ─────────────────────────────────────────────────────

interface FrameField {
  id: string;
  label: string;
  bytes: number;
  color: string;
  hex: string;
  desc: string;
  kid: string;
  enthusiast: string;
  pro: string;
}

const ETH_II_FIELDS: FrameField[] = [
  { id: 'preamble', label: 'Preamble', bytes: 7, color: '#475569',
    hex: 'AA AA AA AA AA AA AA',
    desc: '7 bytes of alternating 1/0 bits for clock synchronisation',
    kid: 'Like a drum roll before a performance — it wakes up the receiver and says "data is coming!"',
    enthusiast: '7 bytes of 0xAA (10101010) that allow the NIC to synchronise its clock to the incoming bit stream via PLL.',
    pro: '56-bit pattern: 0xAAAAAAAAAAAAAA. Used by the PHY layer (not passed to MAC). Manchester-encoded, provides 5.6μs for PLL lock-in at 10 Mbps. In 100BASE-TX and above, the preamble shrinks in significance as clock recovery is done differently.' },
  { id: 'sfd', label: 'SFD', bytes: 1, color: '#64748b',
    hex: 'AB',
    desc: 'Start Frame Delimiter — marks the end of preamble and start of frame',
    kid: 'This is the "GO!" signal — after the drum roll, the SFD says the real data starts NOW.',
    enthusiast: '0xAB (10101011) — the last byte of the preamble with the last two bits changed to 11. Signals "this is the actual start of the frame."',
    pro: 'Pattern: 0xAB. The MAC sees SFD as the handoff point from PHY to MAC layer processing. In Gigabit Ethernet, GMII carries SFD on a dedicated signal.' },
  { id: 'dst', label: 'Dst MAC', bytes: 6, color: '#2563eb',
    hex: 'FF:FF:FF:FF:FF:FF',
    desc: 'Destination MAC address (48-bit)',
    kid: 'The "To:" address on the envelope — which device should receive this data?',
    enthusiast: '6 bytes. Bit 0 of byte 0: 0=unicast, 1=multicast. All 1s = broadcast (FF:FF:FF:FF:FF:FF). Switches filter frames based on this field.',
    pro: 'OUI (3B, IEEE-assigned) + NIC-specific (3B). Bit 40 (LSB of byte 0) = I/G (Individual/Group). Bit 41 = U/L (Universal/Locally administered). Multicast range: 01:00:5E:xx:xx:xx (IPv4), 33:33:xx:xx:xx:xx (IPv6).' },
  { id: 'src', label: 'Src MAC', bytes: 6, color: '#0891b2',
    hex: 'AA:BB:CC:11:22:33',
    desc: 'Source MAC address (48-bit)',
    kid: 'The "From:" address — which device sent this?',
    enthusiast: 'Always a unicast address (bit 0 = 0). Switches learn this to populate their CAM tables.',
    pro: 'Source MAC must always be unicast (I/G bit = 0). MAC learning: switch records SourceMAC→port in Content Addressable Memory (CAM/FIB). CAM TTL typically 300 seconds (configurable).' },
  { id: 'type', label: 'EtherType', bytes: 2, color: '#7c3aed',
    hex: '0x0800',
    desc: 'Protocol type (≥0x0600). Common: 0x0800=IPv4, 0x0806=ARP, 0x86DD=IPv6, 0x8100=802.1Q',
    kid: 'Like a label saying what\'s inside the envelope — "this is an IPv4 packet" or "this is an ARP request".',
    enthusiast: 'Values ≥ 0x0600 (1536) identify the protocol. Values ≤ 0x05DC (1500) indicate IEEE 802.3 format (the value is the payload length).',
    pro: 'Defined in IEEE 802.3 Clause 3.2.6. Full registry: IANA/IEEE. Key types: 0x0800 IPv4, 0x0806 ARP, 0x8100 802.1Q VLAN, 0x88CC LLDP, 0x8842 MACSEC, 0x86DD IPv6, 0x88E5 802.1AE, 0x8809 LACP.' },
  { id: 'payload', label: 'Payload', bytes: 46, color: '#065f46',
    hex: '... (46–1500 bytes) ...',
    desc: 'Upper-layer data (IPv4/IPv6/ARP/etc). Min 46 bytes to ensure minimum frame size of 64 bytes.',
    kid: 'The actual message in the envelope! Could be a web page, video stream, anything digital.',
    enthusiast: 'Minimum 46 bytes (padded with 0x00 if shorter) to ensure 64-byte minimum frame for CSMA/CD collision detection. Maximum 1500 bytes (1518 total with VLAN tag).',
    pro: 'MTU = 1500 bytes (RFC 894). Jumbo frames: up to 9216 bytes (non-standard, switch/NIC support required). Minimum frame 64 bytes: prevents false collision detection — at 10 Mbps, a 64-byte frame takes 51.2μs to transmit, longer than the worst-case 2× propagation delay.' },
  { id: 'fcs', label: 'FCS', bytes: 4, color: '#7f1d1d',
    hex: 'CRC-32',
    desc: 'Frame Check Sequence — CRC-32 over Dst+Src+Type+Payload',
    kid: 'A mathematical fingerprint of the whole frame. If any bit got flipped during transit, the fingerprint won\'t match and the frame is discarded.',
    enthusiast: 'CRC-32 computed over all fields except preamble/SFD and FCS itself. Receiver recomputes CRC and compares. Any mismatch = frame dropped silently (no retransmit at L2).',
    pro: 'Polynomial: x³²+x²⁶+x²³+x²²+x¹⁶+x¹²+x¹¹+x¹⁰+x⁸+x⁷+x⁵+x⁴+x²+x+1 (0x04C11DB7). Pre-/post-conditioning applied. Detects: all 1-bit errors, all 2-bit errors, all bursts ≤32 bits, 99.9997% of longer bursts.' },
];

const LLC_SNAP_FIELD: FrameField = {
  id: 'llcsnap', label: 'LLC/SNAP', bytes: 8, color: '#4a1d96',
  hex: 'AA AA 03 | 00 00 00 | 08 00',
  desc: '802.2 LLC (3B: DSAP/SSAP/Control) + SNAP (5B: OUI+Protocol)',
  kid: 'In 802.3 frames, there\'s an extra "sub-envelope" that says what kind of data is inside using older SAP codes.',
  enthusiast: 'LLC header: DSAP=0xAA, SSAP=0xAA, Control=0x03 (UI frame). SNAP extension: 3-byte OUI (0x000000) + 2-byte EtherType. Used to carry Ethernet protocols in 802.2 context.',
  pro: 'IEEE 802.2 LLC Type 1 (connectionless). DSAP/SSAP=0xAA flags SNAP extension. SNAP OUI identifies organization; PID (Protocol ID) = EtherType. Used in bridging (802.1D), FDDI, Token Ring, and older 802.11 MSDU encapsulation (RFC 1042). Modern Ethernet uses Ethernet II exclusively.',
};

function FrameField({ field, selected, onClick }: {
  field: FrameField; selected: boolean; onClick: () => void;
}) {
  const widthMap: Record<string, string> = {
    preamble: '13%', sfd: '3%', dst: '11%', src: '11%', type: '5%',
    llcsnap: '12%', payload: '44%', fcs: '5%',
  };
  const w = widthMap[field.id] ?? '10%';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="flex-shrink-0 border-r border-slate-900 last:border-r-0 transition-all relative"
      style={{ width: w, background: selected ? field.color : field.color + '40' }}>
      <div className="py-2 px-1 text-center">
        <p className="text-xs font-bold text-white truncate" style={{ fontSize: '10px' }}>{field.label}</p>
        <p className="font-mono text-slate-300" style={{ fontSize: '8px' }}>{field.bytes}B</p>
      </div>
      {selected && (
        <motion.div layoutId="field-indicator"
          className="absolute inset-0 border-2 border-white rounded-sm pointer-events-none"
          transition={{ duration: 0.15 }} />
      )}
    </motion.button>
  );
}

function FrameAnatomyTab() {
  const [frameType, setFrameType] = useState<'ethernet2' | 'ieee8023'>('ethernet2');
  const [selectedField, setSelectedField] = useState<FrameField>(ETH_II_FIELDS[4]);

  const fields = frameType === 'ethernet2'
    ? ETH_II_FIELDS
    : [
        ...ETH_II_FIELDS.slice(0, 4),
        { ...ETH_II_FIELDS[4], id: 'length', label: 'Length', hex: '0x0064', color: '#5b21b6',
          desc: 'Payload length (≤0x05DC = 1500) identifying IEEE 802.3 format',
          kid: 'Instead of "what type", this says "how many bytes": the number helps identify 802.3 format.',
          enthusiast: 'Values ≤ 1500 (0x05DC) = IEEE 802.3 frame. Value = length of payload field. Used by older SAP-based protocols.',
          pro: 'Length/Type disambiguation: if value ≥ 0x0600 (1536), it\'s an EtherType. If ≤ 0x05DC (1500), it\'s the length. Values 1501–1535 are undefined (should never appear). Critical for protocol demux.' },
        LLC_SNAP_FIELD,
        ETH_II_FIELDS[5],
        ETH_II_FIELDS[6],
      ];

  return (
    <div className="space-y-5">
      {/* Frame type toggle */}
      <div className="flex gap-2">
        {([['ethernet2', 'Ethernet II (DIX)'], ['ieee8023', 'IEEE 802.3 + LLC/SNAP']] as const).map(([t, label]) => (
          <button key={t} onClick={() => { setFrameType(t); setSelectedField(fields[4]); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              frameType === t ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}>{label}</button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">
          {frameType === 'ethernet2' ? 'EtherType ≥ 0x0600 → protocol ID' : 'Length ≤ 0x05DC + LLC/SNAP header'}
        </span>
      </div>

      {/* Frame layout */}
      <div className="rounded-xl overflow-hidden border border-slate-800">
        <div className="flex w-full">
          {fields.map(f => (
            <FrameField key={f.id} field={f} selected={selectedField.id === f.id}
              onClick={() => setSelectedField(f)} />
          ))}
        </div>
      </div>

      {/* Selected field detail */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedField.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 border rounded-xl space-y-3"
          style={{ borderColor: selectedField.color + '60' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-bold text-white text-base">{selectedField.label}</span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: selectedField.color + '25', color: selectedField.color }}>{selectedField.bytes} byte{selectedField.bytes > 1 ? 's' : ''}</span>
            </div>
            <code className="text-xs font-mono text-slate-300 bg-surface-800 px-2 py-1 rounded">{selectedField.hex}</code>
          </div>
          <p className="text-xs text-slate-400 italic">{selectedField.desc}</p>
          <ModeContent content={{ kid: selectedField.kid, enthusiast: selectedField.enthusiast, pro: selectedField.pro }}
            className="text-xs text-slate-300 leading-relaxed" />
        </motion.div>
      </AnimatePresence>

      {/* Key distinction callout */}
      <div className="glass-panel p-4 border-glow-amber">
        <h4 className="font-bold text-sm text-white mb-2">Ethernet II vs 802.3 — Key Distinction</h4>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-amber-300">Ethernet II (DIX — Digital/Intel/Xerox)</p>
            <p className="text-slate-400">Type field ≥ <span className="font-mono text-white">0x0600</span> (1536)</p>
            <p className="text-slate-400">Directly identifies upper-layer protocol</p>
            <p className="text-slate-400 font-mono">0x0800 IPv4 · 0x0806 ARP · 0x86DD IPv6</p>
            <p className="text-emerald-400">→ Used by 99%+ of modern traffic</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-purple-300">IEEE 802.3 + LLC/SNAP</p>
            <p className="text-slate-400">Length field ≤ <span className="font-mono text-white">0x05DC</span> (1500)</p>
            <p className="text-slate-400">Requires 802.2 LLC/SNAP for protocol ID</p>
            <p className="text-slate-400 font-mono">DSAP=0xAA, SSAP=0xAA, Ctrl=0x03</p>
            <p className="text-amber-400">→ Legacy, still used in STP BPDUs, SNAP bridging</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Tab 2: MAC Addressing & CAM Table ────────────────────────────────────────

interface SwitchPort { id: number; x: number; y: number; host: string; mac: string; color: string; }

const PORTS: SwitchPort[] = [
  { id: 1, x: 60,  y: 120, host: 'PC-A', mac: 'AA:AA:AA:AA:AA:01', color: '#06b6d4' },
  { id: 2, x: 60,  y: 240, host: 'PC-B', mac: 'BB:BB:BB:BB:BB:02', color: '#a855f7' },
  { id: 3, x: 380, y: 120, host: 'PC-C', mac: 'CC:CC:CC:CC:CC:03', color: '#10b981' },
  { id: 4, x: 380, y: 240, host: 'PC-D', mac: 'DD:DD:DD:DD:DD:04', color: '#f59e0b' },
];

interface CamEntry { mac: string; port: number; ttl: number; }
interface PacketAnim { id: string; fromPort: number; toPort: number; color: string; label: string; flood: boolean; }

function SwitchCAMSim() {
  const [cam, setCam] = useState<CamEntry[]>([]);
  const [packets, setPackets] = useState<PacketAnim[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  const SCENARIOS: Array<{ from: number; to: number; dstMac: string; label: string }> = [
    { from: 1, to: 2, dstMac: 'BB:BB:BB:BB:BB:02', label: 'PC-A → PC-B (unknown dest)' },
    { from: 2, to: 1, dstMac: 'AA:AA:AA:AA:AA:01', label: 'PC-B → PC-A (now known)' },
    { from: 3, to: 4, dstMac: 'DD:DD:DD:DD:DD:04', label: 'PC-C → PC-D (unknown dest)' },
    { from: 4, to: 3, dstMac: 'CC:CC:CC:CC:CC:03', label: 'PC-D → PC-C (now known)' },
  ];

  const addPacket = useCallback((fromPort: number, toPort: number, color: string, label: string, flood: boolean) => {
    const id = Math.random().toString(36).slice(2);
    setPackets(p => [...p, { id, fromPort, toPort, color, label, flood }]);
    setTimeout(() => setPackets(p => p.filter(x => x.id !== id)), 1600);
  }, []);

  const runScenario = useCallback(() => {
    if (step >= SCENARIOS.length) { setCam([]); setLog([]); setStep(0); return; }
    const sc = SCENARIOS[step];
    const src = PORTS.find(p => p.id === sc.from)!;
    const dst = PORTS.find(p => p.id === sc.to)!;
    const knownDst = cam.find(e => e.mac === sc.dstMac);

    // Learn source MAC
    setCam(prev => {
      const existing = prev.find(e => e.mac === src.mac);
      if (existing) return prev;
      return [...prev, { mac: src.mac, port: src.id, ttl: 300 }];
    });

    const newLogs: string[] = [];
    newLogs.push(`▶ ${sc.label}`);
    newLogs.push(`  LEARN: ${src.mac.slice(-5)} → Port ${src.id}`);

    if (knownDst) {
      newLogs.push(`  FILTER: dest ${dst.mac.slice(-5)} known on Port ${dst.id} → unicast only`);
      addPacket(sc.from, sc.to, src.color, 'unicast', false);
    } else {
      newLogs.push(`  FLOOD: dest unknown → copy to all ports except Port ${sc.from}`);
      PORTS.filter(p => p.id !== sc.from).forEach(p => {
        addPacket(sc.from, p.id, src.color, 'flood', true);
      });
    }
    setLog(prev => [...newLogs, ...prev].slice(0, 12));
    setStep(s => s + 1);
  }, [step, cam, addPacket]);

  void 0; // layout constants removed

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button onClick={runScenario}
          className="px-4 py-2 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-all">
          {step >= SCENARIOS.length ? '↺ Reset' : `▶ Step ${step + 1}: ${SCENARIOS[step]?.label}`}
        </button>
        <button onClick={() => { setCam([]); setLog([]); setStep(0); setPackets([]); }}
          className="px-3 py-2 border border-slate-700 text-slate-500 rounded-lg text-xs hover:text-slate-300 transition-all">
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Switch Diagram */}
        <div className="glass-panel p-3 border-glow-amber">
          <p className="text-xs font-bold text-slate-400 mb-2">Network Topology</p>
          <div className="relative" style={{ height: '280px' }}>
            {/* Switch box in center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10
              bg-surface-700 border-2 border-amber-500/40 rounded-xl px-6 py-3 text-center">
              <p className="text-xs font-bold text-amber-300">🔀 Switch</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">4-port L2</p>
            </div>
            {/* Ports / Hosts */}
            {PORTS.map(port => {
              const isLeft = port.x < 200;
              return (
                <div key={port.id}
                  className="absolute flex items-center gap-1 text-xs font-bold"
                  style={{
                    left: isLeft ? '0' : undefined,
                    right: isLeft ? undefined : '0',
                    top: `${(port.y / 360) * 100}%`,
                    transform: 'translateY(-50%)',
                    flexDirection: isLeft ? 'row' : 'row-reverse',
                  }}>
                  <div className="w-12 h-8 rounded-lg border flex items-center justify-center text-sm"
                    style={{ background: port.color + '20', borderColor: port.color + '50', color: port.color }}>
                    💻
                  </div>
                  <div className={isLeft ? 'text-left' : 'text-right'}>
                    <p style={{ color: port.color }}>{port.host}</p>
                    <p className="font-mono text-slate-500" style={{ fontSize: '9px' }}>P{port.id}</p>
                  </div>
                </div>
              );
            })}
            {/* Animated packets */}
            {packets.map(pkt => {
              const from = PORTS.find(p => p.id === pkt.fromPort)!;
              const to = PORTS.find(p => p.id === pkt.toPort)!;
              const fromIsLeft = from.x < 200;
              const toIsLeft = to.x < 200;
              const startX = fromIsLeft ? '18%' : '82%';
              const endX = toIsLeft ? '18%' : '82%';
              const startY = `${(from.y / 360) * 100}%`;
              const endY = `${(to.y / 360) * 100}%`;
              return (
                <motion.div key={pkt.id}
                  className="absolute w-5 h-5 rounded-full flex items-center justify-center text-xs z-20"
                  style={{ background: pkt.color + '30', border: `1px solid ${pkt.color}`, left: startX, top: startY, transform: 'translate(-50%, -50%)' }}
                  animate={{ left: ['50%', '50%', endX], top: [startY, '50%', endY] }}
                  transition={{ duration: 1.4, times: [0, 0.4, 1], ease: 'easeInOut' }}>
                  📦
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CAM Table */}
        <div className="glass-panel p-3 border-glow-amber space-y-2">
          <p className="text-xs font-bold text-slate-400">CAM Table (Content Addressable Memory)</p>
          <div className="min-h-32">
            {cam.length === 0 ? (
              <p className="text-xs text-slate-600 italic mt-4">Table empty — click Step to simulate traffic</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="pb-1 text-left text-slate-500">MAC Address</th>
                    <th className="pb-1 text-left text-slate-500">Port</th>
                    <th className="pb-1 text-left text-slate-500">Host</th>
                    <th className="pb-1 text-left text-slate-500">TTL</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {cam.map(entry => {
                      const port = PORTS.find(p => p.id === entry.port)!;
                      return (
                        <motion.tr key={entry.mac}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="border-b border-slate-800/40">
                          <td className="py-1 font-mono pr-3" style={{ color: port.color, fontSize: '9px' }}>{entry.mac}</td>
                          <td className="py-1 font-bold text-white">P{entry.port}</td>
                          <td className="py-1 text-slate-300">{port.host}</td>
                          <td className="py-1 text-slate-500">300s</td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Activity log */}
          <div className="border-t border-slate-800 pt-2">
            <p className="text-xs font-bold text-slate-500 mb-1">Event Log</p>
            <div className="space-y-0.5">
              {log.slice(0, 8).map((l, i) => (
                <p key={i} className={`font-mono ${l.startsWith('▶') ? 'text-amber-300 font-bold' : 'text-slate-500'}`}
                  style={{ fontSize: '9px' }}>{l}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address type reference */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: 'Unicast', icon: '🎯', example: 'AA:BB:CC:11:22:33', bit: 'bit0=0',
            desc: 'One-to-one delivery. Bit 0 of byte 0 = 0. Switch delivers only to the specific port.', color: '#06b6d4' },
          { type: 'Multicast', icon: '📢', example: '01:00:5E:xx:xx:xx', bit: 'bit0=1',
            desc: 'One-to-many. Bit 0 = 1. L2 multicast for IPv4 or 33:33:xx for IPv6.', color: '#a855f7' },
          { type: 'Broadcast', icon: '📡', example: 'FF:FF:FF:FF:FF:FF', bit: 'all 1s',
            desc: 'One-to-all. Switch floods out ALL ports except the receiving port. Used by ARP, DHCP.', color: '#f59e0b' },
        ].map(t => (
          <div key={t.type} className="glass-panel p-3 rounded-xl border text-center space-y-1.5"
            style={{ borderColor: t.color + '40' }}>
            <span className="text-2xl">{t.icon}</span>
            <p className="font-bold text-xs" style={{ color: t.color }}>{t.type}</p>
            <code className="text-xs font-mono text-slate-400 block">{t.example}</code>
            <p className="text-xs text-slate-500">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MACAddressingTab() {
  return (
    <div className="space-y-5">
      {/* OUI breakdown */}
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">MAC Address Structure</h3>
        <div className="flex items-stretch gap-1 rounded-xl overflow-hidden text-xs font-mono">
          {[
            { label: 'OUI', sub: 'Byte 0', val: 'AA', bytes: '3 bytes', color: '#f59e0b', desc: 'Organizationally Unique ID — assigned by IEEE to manufacturer' },
            { label: '', sub: 'Byte 1', val: 'BB', bytes: '', color: '#d97706', desc: '' },
            { label: '', sub: 'Byte 2', val: 'CC', bytes: '', color: '#b45309', desc: '' },
            { label: 'NIC ID', sub: 'Byte 3', val: '11', bytes: '3 bytes', color: '#0891b2', desc: 'Manufacturer assigns per device — must be unique within OUI' },
            { label: '', sub: 'Byte 4', val: '22', bytes: '', color: '#0e7490', desc: '' },
            { label: '', sub: 'Byte 5', val: '33', bytes: '', color: '#155e75', desc: '' },
          ].map((b, i) => (
            <div key={i} className="flex-1 py-3 text-center border-r border-slate-900 last:border-r-0"
              style={{ background: b.color + '25' }}>
              <p className="font-bold text-base" style={{ color: b.color }}>{b.val}</p>
              <p className="text-slate-500 mt-0.5" style={{ fontSize: '8px' }}>{b.sub}</p>
              {b.label && <p className="font-bold mt-1" style={{ color: b.color, fontSize: '9px' }}>{b.label}</p>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: 'Bit 0 (I/G)', zero: 'Unicast (individual address)', one: 'Multicast/Broadcast', color: '#06b6d4' },
            { title: 'Bit 1 (U/L)', zero: 'Globally unique (IEEE-assigned OUI)', one: 'Locally administered (custom)', color: '#a855f7' },
          ].map(b => (
            <div key={b.title} className="bg-surface-800 rounded-xl p-3 text-xs">
              <p className="font-bold mb-1" style={{ color: b.color }}>{b.title} of Byte 0</p>
              <p className="text-slate-400"><span className="text-emerald-400 font-bold">0</span> = {b.zero}</p>
              <p className="text-slate-400 mt-0.5"><span className="text-orange-400 font-bold">1</span> = {b.one}</p>
            </div>
          ))}
        </div>
      </div>

      <SwitchCAMSim />
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Tab 3: Error Detection ────────────────────────────────────────────────────

function FCSSimulator() {
  const [corrupted, setCorrupted] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'transmit' | 'check' | 'result'>('idle');
  const [droppedCount, setDroppedCount] = useState(0);
  const [okCount, setOkCount] = useState(0);

  const frame = '45 00 00 3C 1A 2B 40 00 40 06 AA BB C0 A8 01 01 C0 A8 01 02';
  const goodFCS = '3A 1F 9D C2';
  const badFCS  = '3A 1F 9D XX';

  const transmit = useCallback(async () => {
    setRunning(true);
    setPhase('transmit');
    await new Promise(r => setTimeout(r, 1000));
    setPhase('check');
    await new Promise(r => setTimeout(r, 900));
    setPhase('result');
    await new Promise(r => setTimeout(r, 1200));
    if (corrupted) setDroppedCount(d => d + 1);
    else setOkCount(o => o + 1);
    setPhase('idle');
    setRunning(false);
  }, [corrupted]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={corrupted} onChange={e => setCorrupted(e.target.checked)}
            className="w-4 h-4 accent-red-500" />
          <span className="text-sm text-slate-300">Inject bit error during transit</span>
        </label>
        <button onClick={transmit} disabled={running}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            running ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-500'
            : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
          }`}>
          {running ? '⏳ Sending...' : '▶ Send Frame'}
        </button>
        <span className="ml-auto text-xs text-slate-500">
          <span className="text-emerald-400">✓ {okCount}</span> accepted · <span className="text-red-400">✗ {droppedCount}</span> dropped
        </span>
      </div>

      {/* Pipeline visual */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { label: 'Sender', icon: '💻', phase: 'transmit', color: '#06b6d4' },
          { label: 'Compute CRC', icon: '🧮', phase: 'transmit', color: '#a855f7' },
          { label: 'Wire', icon: corrupted ? '⚡' : '➡️', phase: 'transmit', color: corrupted ? '#ef4444' : '#64748b' },
          { label: 'Receiver', icon: '🖥️', phase: 'check', color: '#10b981' },
          { label: 'Check CRC', icon: '🔍', phase: 'check', color: '#f59e0b' },
          { label: phase === 'result' ? (corrupted ? 'DROPPED ✗' : 'ACCEPTED ✓') : 'Decision', icon: phase === 'result' ? (corrupted ? '🗑️' : '✅') : '❓', phase: 'result', color: phase === 'result' ? (corrupted ? '#ef4444' : '#10b981') : '#64748b' },
        ].map((node, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <div className="w-4 h-px bg-slate-700" />}
            <motion.div
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border"
              animate={{
                borderColor: phase === node.phase || (phase === 'check' && node.phase === 'transmit') ? node.color + '80' : '#1e293b',
                background: phase === node.phase || (phase === 'check' && node.phase === 'transmit') ? node.color + '15' : 'transparent',
              }}
              transition={{ duration: 0.3 }}>
              <span className="text-base">{node.icon}</span>
              <span className="text-slate-400" style={{ fontSize: '9px' }}>{node.label}</span>
            </motion.div>
          </div>
        ))}
      </div>

      {/* FCS comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3 space-y-1.5">
          <p className="text-xs font-bold text-slate-400">Sender computes CRC-32 over:</p>
          <code className="text-xs font-mono text-slate-300 block leading-relaxed">{frame}</code>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">FCS appended:</span>
            <code className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-1.5 rounded">{goodFCS}</code>
          </div>
        </div>
        <div className="glass-panel p-3 space-y-1.5">
          <p className="text-xs font-bold text-slate-400">Receiver recomputes CRC-32:</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Received FCS:</span>
            <code className={`font-mono text-xs px-1.5 rounded ${corrupted ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
              {corrupted ? badFCS : goodFCS}
            </code>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">Expected FCS:</span>
            <code className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-1.5 rounded">{goodFCS}</code>
          </div>
          <motion.div
            animate={{ opacity: phase === 'result' ? 1 : 0.3 }}
            className={`mt-2 p-2 rounded-lg text-xs font-bold text-center ${
              corrupted ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
            {corrupted ? '✗ CRC MISMATCH — Frame discarded silently' : '✓ CRC MATCH — Frame accepted'}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ErrorDetectionTab() {
  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-amber space-y-3">
        <h3 className="font-bold text-white">FCS / CRC-32 Simulator</h3>
        <ModeContent content={{
          kid: 'CRC is like a "magic number" calculated from the whole message. If any bit changed during sending, the magic number won\'t match at the other end — and the frame gets thrown away!',
          enthusiast: 'CRC-32 computes a 4-byte checksum over Dst+Src+Type+Payload. The receiver independently computes CRC over the received data. Mismatches are silently discarded — upper layers (TCP) handle retransmission.',
          pro: 'IEEE CRC-32 polynomial: 0x04C11DB7. The transmitter computes CRC with pre-conditioning (invert first 32 bits, append complement of CRC). Guaranteed error detection: all 1-bit, 2-bit errors; all odd-bit errors; all burst errors ≤ 32 bits; ~99.9997% of longer bursts.',
        }} className="text-xs text-slate-400 leading-relaxed" />
        <FCSSimulator />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { title: 'Runt Frames', icon: '🩻', color: '#ef4444', min: '< 64 bytes',
            kid: 'A runt frame is too small — like a letter with no message inside! Switches throw these away.',
            enthusiast: 'Runts are frames smaller than the 64-byte minimum (including FCS). Usually caused by collisions (in half-duplex) or NIC software bugs. Counted in interface error statistics.',
            pro: 'Minimum frame: 64 bytes (512 bit times at 10 Mbps = 51.2μs > round-trip collision domain). Frame < 64B with valid FCS = "runt." Frame < 64B with invalid FCS = "collision fragment" (most common). RMON MIB: etherStatsUndersizePkts.' },
          { title: 'Giant Frames', icon: '🐋', color: '#f59e0b', min: '> 1518 bytes',
            kid: 'A giant frame is too big — like trying to send a whole book in one envelope. Most switches drop these unless jumbo frames are enabled.',
            enthusiast: 'Frames exceeding 1518 bytes (1500B payload + 18B overhead). "Baby giants" up to 1522B are allowed for 802.1Q-tagged frames. Jumbo frames (up to 9216B) require switch support.',
            pro: 'Standard max: 1518B (1500B MTU + 14B L2 header + 4B FCS). With 802.1Q tag: 1522B. Jumbo frames: 9000–9216B, requires end-to-end support. RMON: etherStatsOversizePkts vs etherStatsFragments. MTU mismatch causes IP fragmentation or PMTUD black holes.' },
        ].map(t => (
          <div key={t.title} className="glass-panel p-4 border rounded-xl space-y-2"
            style={{ borderColor: t.color + '40' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{t.icon}</span>
              <div>
                <span className="font-bold text-sm text-white">{t.title}</span>
                <span className="ml-2 text-xs font-mono" style={{ color: t.color }}>{t.min}</span>
              </div>
            </div>
            <ModeContent content={{ kid: t.kid, enthusiast: t.enthusiast, pro: t.pro }}
              className="text-xs text-slate-400 leading-relaxed" />
          </div>
        ))}
      </div>
      <div className="flex justify-end"><ModeBadge /></div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function Chapter14() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Frame Anatomy');

  useEffect(() => {
    (CH14_TAB_SUBTOPICS[activeTab] ?? []).forEach(id => markComplete('ch14', id));
  }, [activeTab, markComplete]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ChapterHeader chapter={CHAPTER}
        description="Master IEEE 802.3 frame structure, the Ethernet II vs 802.3 LLC distinction, how switches learn MAC addresses into their CAM tables, and how CRC-32 catches transmission errors." />

      <div className="flex gap-1 mb-6 border-b border-slate-800 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>{t}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          {activeTab === 'Frame Anatomy'  && <FrameAnatomyTab />}
          {activeTab === 'MAC Addressing' && <MACAddressingTab />}
          {activeTab === 'Error Detection'&& <ErrorDetectionTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
