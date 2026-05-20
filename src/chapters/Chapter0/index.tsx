import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { DHCPDoraSimulation } from './DHCPDoraSimulation';
import { DNSResolutionSimulation } from './DNSResolutionSimulation';
import { ICMPPingSimulation } from './ICMPPingSimulation';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch0')!;

const TABS = [
  { id: '802_3_evo', label: '📡 802.3 Evolution' },
  { id: 'poe',       label: '⚡ PoE' },
  { id: 'vlans',     label: '🏘️ VLANs' },
  { id: 'stp',       label: '🌳 STP/RSTP' },
  { id: 'lacp',      label: '🔗 LACP' },
  { id: 'ipaddr',    label: '🌐 IP Subnetting' },
  { id: 'dhcp',      label: '🎁 DHCP DORA' },
  { id: 'dns',       label: '📖 DNS Lookup' },
  { id: 'icmp',      label: '📡 Ping/ICMP' },
  { id: 'arp',       label: '🔍 ARP Protocol' },
];

const TAB_SUBTOPICS: Record<string, string[]> = {
  '802_3_evo': ['802_3_evo'],
  'poe':       ['poe'],
  'vlans':     ['vlans'],
  'stp':       ['stp'],
  'lacp':      ['lacp'],
  'ipaddr':    ['ipaddr'],
  'dhcp':      ['dhcp'],
  'dns':       ['dns'],
  'icmp':      ['icmp'],
  'arp':       ['arp_proto'],
};

// ─── Kept for ARPSimulation ────────────────────────────────────────────────────
const ARP_HOSTS = [
  { id: 'A', ip: '192.168.1.1',  mac: 'AA:AA:AA:AA:AA:01', color: '#06b6d4', x: 60 },
  { id: 'B', ip: '192.168.1.2',  mac: 'BB:BB:BB:BB:BB:02', color: '#a855f7', x: 180 },
  { id: 'C', ip: '192.168.1.3',  mac: 'CC:CC:CC:CC:CC:03', color: '#10b981', x: 300 },
  { id: 'D', ip: '192.168.1.4',  mac: 'DD:DD:DD:DD:DD:04', color: '#f59e0b', x: 420 },
];

interface ArpStep {
  label: string; from: string; to: string; type: 'broadcast' | 'unicast'; msg: string; color: string;
}

const ARP_STEPS: ArpStep[] = [
  { label: 'ARP Request (Broadcast)', from: 'A', to: 'ALL', type: 'broadcast', color: '#f97316',
    msg: 'Who has 192.168.1.2? Tell 192.168.1.1 (src MAC: AA:AA:AA:AA:AA:01) — sent to FF:FF:FF:FF:FF:FF' },
  { label: 'ARP Reply (Unicast)', from: 'B', to: 'A', type: 'unicast', color: '#10b981',
    msg: '192.168.1.2 is at BB:BB:BB:BB:BB:02 — sent directly (unicast) to AA:AA:AA:AA:AA:01' },
  { label: 'ARP Cache Updated', from: 'A', to: 'A', type: 'unicast', color: '#06b6d4',
    msg: 'Host A stores: 192.168.1.2 → BB:BB:BB:BB:BB:02 in ARP cache (TTL ~20 min)' },
];

// ─── ARP Simulation ───────────────────────────────────────────────────────────
function ARPSimulation() {
  const [step, setStep] = useState(-1);
  const [arpCache, setArpCache] = useState<Array<{ ip: string; mac: string; color: string }>>([]);
  const [running, setRunning] = useState(false);

  const runARP = useCallback(async () => {
    setRunning(true);
    setStep(0); setArpCache([]);
    await new Promise(r => setTimeout(r, 1200));
    setStep(1);
    await new Promise(r => setTimeout(r, 1200));
    setStep(2);
    setArpCache([{ ip: '192.168.1.2', mac: 'BB:BB:BB:BB:BB:02', color: '#a855f7' }]);
    await new Promise(r => setTimeout(r, 1500));
    setStep(-1);
    setRunning(false);
  }, []);

  const W = 480, H = 110;

  return (
    <div className="space-y-5">
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">ARP — Address Resolution Protocol (RFC 826)</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          ARP resolves a known <span className="text-cyan-400 font-medium">IP address</span> to an unknown{' '}
          <span className="text-purple-400 font-medium">MAC address</span>. Without the MAC address, a device
          cannot construct an Ethernet frame to deliver the IP packet on the local network.
        </p>
        <button onClick={runARP} disabled={running}
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
            running ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-500'
            : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30'
          }`}>
          {running ? '⏳ Running ARP...' : '▶ Simulate ARP Resolution'}
        </button>
      </div>

      <div className="glass-panel p-4 border-glow-blue">
        <p className="text-xs font-bold text-slate-400 mb-2">LAN Topology (192.168.1.0/24)</p>
        <div className="rounded-xl overflow-hidden border border-slate-800" style={{ background: '#060b16' }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <line x1="40" y1="65" x2={W - 40} y2="65" stroke="#334155" strokeWidth="2" />
            {ARP_HOSTS.map(h => (
              <g key={h.id}>
                <line x1={h.x} y1="45" x2={h.x} y2="65" stroke="#334155" strokeWidth="1" />
                <rect x={h.x - 22} y="20" width="44" height="25" rx="4"
                  fill={h.color + '20'} stroke={h.color + '50'} strokeWidth="1" />
                <text x={h.x} y="35" textAnchor="middle" fontSize="10">💻</text>
                <text x={h.x} y="57" textAnchor="middle" fontSize="6.5" fill={h.color}>{h.id}</text>
                <text x={h.x} y="78" textAnchor="middle" fontSize="6" fill="#475569">{h.ip}</text>
                <text x={h.x} y="88" textAnchor="middle" fontSize="5.5" fill="#334155">{h.mac.slice(0, 8)}…</text>
              </g>
            ))}
            {step === 0 && ARP_HOSTS.slice(1).map((h, i) => (
              <motion.line key={h.id} x1={ARP_HOSTS[0].x} y1={65} x2={h.x} y2={65}
                stroke="#f97316" strokeWidth="2" strokeDasharray="4 3"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: i * 0.15 }} />
            ))}
            {step === 0 && (
              <motion.text x={W / 2} y="105" textAnchor="middle" fontSize="7" fill="#f97316"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ARP Request → FF:FF:FF:FF:FF:FF (Broadcast)
              </motion.text>
            )}
            {step === 1 && (
              <>
                <motion.line x1={ARP_HOSTS[1].x} y1={65} x2={ARP_HOSTS[0].x} y2={65}
                  stroke="#10b981" strokeWidth="2"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7 }} />
                <motion.text x={W / 2} y="105" textAnchor="middle" fontSize="7" fill="#10b981"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  ARP Reply → AA:AA:AA:AA:AA:01 (Unicast)
                </motion.text>
              </>
            )}
            {step === 2 && (
              <motion.text x={ARP_HOSTS[0].x} y="105" textAnchor="middle" fontSize="7" fill="#06b6d4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                ARP Cache Updated ✓
              </motion.text>
            )}
          </svg>
        </div>
        {step >= 0 && (
          <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl border text-xs"
            style={{ borderColor: ARP_STEPS[step]?.color + '40', background: ARP_STEPS[step]?.color + '0a' }}>
            <p className="font-bold mb-1" style={{ color: ARP_STEPS[step]?.color }}>{ARP_STEPS[step]?.label}</p>
            <p className="text-slate-300 font-mono">{ARP_STEPS[step]?.msg}</p>
          </motion.div>
        )}
      </div>

      {arpCache.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 border-glow-blue">
          <p className="text-xs font-bold text-slate-400 mb-2">Host A — ARP Cache</p>
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-1 text-left text-slate-500 pr-4">IP Address</th>
                <th className="pb-1 text-left text-slate-500 pr-4">MAC Address</th>
                <th className="pb-1 text-left text-slate-500">Type</th>
              </tr>
            </thead>
            <tbody>
              {arpCache.map(e => (
                <tr key={e.ip}>
                  <td className="py-1 pr-4 font-mono" style={{ color: e.color }}>{e.ip}</td>
                  <td className="py-1 pr-4 font-mono text-slate-300">{e.mac}</td>
                  <td className="py-1 text-slate-400">dynamic (TTL 20min)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {[
          { title: 'Gratuitous ARP', icon: '📣', color: '#f59e0b',
            desc: 'A host sends an ARP Reply for its own IP without a prior request. Used to update neighbors\' ARP caches after IP change, or to detect IP conflicts during boot.' },
          { title: 'ARP Spoofing / Poisoning', icon: '⚠️', color: '#ef4444',
            desc: 'Attacker sends forged ARP Replies, poisoning victim ARP caches to redirect traffic through themselves (MitM). Mitigated by Dynamic ARP Inspection (DAI) on managed switches.' },
          { title: 'Proxy ARP', icon: '🔄', color: '#3b82f6',
            desc: 'A router answers ARP Requests on behalf of hosts in another subnet, allowing hosts without a default gateway to communicate across subnets.' },
          { title: 'ARP Cache Timeout', icon: '⏱️', color: '#8b5cf6',
            desc: 'Entries expire after ~20 min (OS-dependent). Stale entries are cleared. Incomplete entries (no reply received) expire after ~3 sec with retry.' },
        ].map(t => (
          <div key={t.title} className="glass-panel p-4 border rounded-xl space-y-1.5" style={{ borderColor: t.color + '40' }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{t.icon}</span>
              <span className="font-bold text-sm text-white">{t.title}</span>
            </div>
            <p className="text-slate-400 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 802.3 Ethernet Evolution Tab ─────────────────────────────────────────────
interface EthernetStandard {
  std: string; year: number; speed: string; medium: string; maxDist: string; cable: string;
}

const ETHERNET_STANDARDS: EthernetStandard[] = [
  { std: '10BASE5',       year: 1983, speed: '10 Mbps',   medium: 'Thick coax',        maxDist: '500 m',  cable: 'RG-8' },
  { std: '10BASE-T',      year: 1990, speed: '10 Mbps',   medium: 'Twisted pair',      maxDist: '100 m',  cable: 'Cat3' },
  { std: '100BASE-TX',    year: 1995, speed: '100 Mbps',  medium: 'Twisted pair',      maxDist: '100 m',  cable: 'Cat5' },
  { std: '1000BASE-T',    year: 1999, speed: '1 Gbps',    medium: 'Twisted pair',      maxDist: '100 m',  cable: 'Cat5e' },
  { std: '10GBASE-T',     year: 2006, speed: '10 Gbps',   medium: 'Twisted pair',      maxDist: '100 m',  cable: 'Cat6A' },
  { std: '25GBASE-T',     year: 2016, speed: '25 Gbps',   medium: 'Twisted pair',      maxDist: '30 m',   cable: 'Cat8' },
  { std: '40GBASE-T',     year: 2016, speed: '40 Gbps',   medium: 'Twisted pair',      maxDist: '30 m',   cable: 'Cat8' },
  { std: '100GBASE-SR4',  year: 2010, speed: '100 Gbps',  medium: 'Multimode fiber',   maxDist: '100 m',  cable: 'OM4' },
  { std: '400GBASE-SR8',  year: 2018, speed: '400 Gbps',  medium: 'Multimode fiber',   maxDist: '100 m',  cable: 'OM4' },
];

function EthernetEvolutionTab() {
  const [selected, setSelected] = useState<number | null>(null);

  const speedColor = (speed: string) => {
    if (speed.includes('400')) return '#10b981';
    if (speed.includes('100 G')) return '#06b6d4';
    if (speed.includes('40') || speed.includes('25')) return '#a855f7';
    if (speed.includes('10 G')) return '#f59e0b';
    if (speed.includes('1 G')) return '#3b82f6';
    return '#64748b';
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">IEEE 802.3 Ethernet Standards Timeline</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Ethernet has evolved from 10 Mbps coaxial-cable networks in 1983 to 400 Gbps fiber links today.
          Each generation brought higher speeds, better media, and lower cost per bit. Click any dot to expand details.
        </p>

        {/* Timeline */}
        <div className="relative mt-6 pb-4 overflow-x-auto">
          <div className="relative min-w-[600px]">
            {/* Horizontal line */}
            <div className="absolute top-5 left-4 right-4 h-0.5 bg-slate-700" />
            {/* Dots */}
            <div className="flex justify-between px-4">
              {ETHERNET_STANDARDS.map((s, i) => {
                const color = speedColor(s.speed);
                const isSelected = selected === i;
                return (
                  <button
                    key={s.std}
                    onClick={() => setSelected(isSelected ? null : i)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.3 }}
                      animate={{ scale: isSelected ? 1.3 : 1 }}
                      className="w-4 h-4 rounded-full border-2 relative z-10 transition-shadow"
                      style={{
                        backgroundColor: isSelected ? color : color + '40',
                        borderColor: color,
                        boxShadow: isSelected ? `0 0 12px ${color}` : 'none',
                      }}
                    />
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors mt-1"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}>
                      {s.year}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Standard names below dots */}
            <div className="flex justify-between px-4 mt-8">
              {ETHERNET_STANDARDS.map((s, i) => (
                <span key={s.std} className="text-center" style={{ fontSize: '9px', color: selected === i ? speedColor(s.speed) : '#475569', minWidth: 0, maxWidth: 52, wordBreak: 'break-word' }}>
                  {s.std}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expanded detail card */}
        <AnimatePresence>
          {selected !== null && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border p-4 mt-2 space-y-3"
                style={{ borderColor: speedColor(ETHERNET_STANDARDS[selected].speed) + '50', background: speedColor(ETHERNET_STANDARDS[selected].speed) + '0a' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xl font-mono font-bold" style={{ color: speedColor(ETHERNET_STANDARDS[selected].speed) }}>
                    {ETHERNET_STANDARDS[selected].std}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full border"
                    style={{ color: speedColor(ETHERNET_STANDARDS[selected].speed), borderColor: speedColor(ETHERNET_STANDARDS[selected].speed) + '50', background: speedColor(ETHERNET_STANDARDS[selected].speed) + '15' }}>
                    {ETHERNET_STANDARDS[selected].year}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Speed', value: ETHERNET_STANDARDS[selected].speed },
                    { label: 'Medium', value: ETHERNET_STANDARDS[selected].medium },
                    { label: 'Max Distance', value: ETHERNET_STANDARDS[selected].maxDist },
                    { label: 'Cable Type', value: ETHERNET_STANDARDS[selected].cable },
                  ].map(f => (
                    <div key={f.label} className="space-y-0.5">
                      <p className="text-slate-500">{f.label}</p>
                      <p className="text-white font-semibold">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full table */}
      <div className="glass-panel p-5 border-glow-blue overflow-x-auto">
        <h4 className="font-bold text-white mb-3">Full Standards Reference Table</h4>
        <table className="text-xs w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-700">
              {['Standard', 'Year', 'Speed', 'Medium', 'Max Dist', 'Cable'].map(h => (
                <th key={h} className="pb-2 text-left text-slate-500 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ETHERNET_STANDARDS.map((s, i) => (
              <tr key={s.std} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => setSelected(selected === i ? null : i)}>
                <td className="py-2 pr-4 font-mono font-semibold" style={{ color: speedColor(s.speed) }}>{s.std}</td>
                <td className="py-2 pr-4 text-slate-400">{s.year}</td>
                <td className="py-2 pr-4 text-white font-semibold">{s.speed}</td>
                <td className="py-2 pr-4 text-slate-300">{s.medium}</td>
                <td className="py-2 pr-4 text-slate-300">{s.maxDist}</td>
                <td className="py-2 text-slate-400">{s.cable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Why it matters for Wi-Fi */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h4 className="font-bold text-white">Why It Matters for Wi-Fi</h4>
        <div className="space-y-2 text-sm text-slate-300">
          {[
            { icon: '📶', text: 'Wi-Fi 6 AP uplinks need at minimum 1 GbE; Wi-Fi 6E multi-radio APs benefit from 2.5/5 GbE uplinks to avoid wired bottlenecks.' },
            { icon: '🚀', text: 'Wi-Fi 7 high-density APs in stadiums and campuses may require 10 GbE uplinks per AP to match theoretical air throughput.' },
            { icon: '🏗️', text: 'Distribution and core switches interconnecting AP closets need 25/40/100 GbE uplinks — 802.3 standards define these physical layers.' },
          ].map(item => (
            <div key={item.text} className="flex gap-3 items-start">
              <span className="text-lg shrink-0">{item.icon}</span>
              <p className="leading-relaxed text-slate-300">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PoE Tab ───────────────────────────────────────────────────────────────────
interface PoEStandard {
  name: string; year: number; maxPower: string; pairs: string; maxCurrent: string; useCase: string; color: string;
}

const POE_STANDARDS: PoEStandard[] = [
  { name: '802.3af (PoE)',            year: 2003, maxPower: '15.4 W', pairs: '2 pairs', maxCurrent: '350 mA', useCase: 'IP phones, basic APs',           color: '#3b82f6' },
  { name: '802.3at (PoE+)',           year: 2009, maxPower: '30 W',   pairs: '2 pairs', maxCurrent: '600 mA', useCase: 'Video cameras, mid-range APs',   color: '#06b6d4' },
  { name: '802.3bt Type 3 (PoE++)',   year: 2018, maxPower: '60 W',   pairs: '4 pairs', maxCurrent: '600 mA', useCase: 'Wi-Fi 6E APs, PTZ cameras',     color: '#a855f7' },
  { name: '802.3bt Type 4 (UPoE)',    year: 2018, maxPower: '90 W',   pairs: '4 pairs', maxCurrent: '960 mA', useCase: 'Wi-Fi 7 APs, thin clients, IoT', color: '#10b981' },
];

const POE_CLASSES = [
  { cls: 0, min: '0.44 W', max: '15.4 W', note: 'Default / unclassified' },
  { cls: 1, min: '0.44 W', max: '4.0 W',  note: 'Low power' },
  { cls: 2, min: '0.44 W', max: '7.0 W',  note: 'Mid power' },
  { cls: 3, min: '0.44 W', max: '15.4 W', note: 'Standard PoE' },
  { cls: 4, min: '0.44 W', max: '30 W',   note: 'PoE+ (802.3at)' },
  { cls: 5, min: '0.44 W', max: '45 W',   note: '802.3bt' },
  { cls: 6, min: '0.44 W', max: '60 W',   note: '802.3bt' },
  { cls: 7, min: '0.44 W', max: '75 W',   note: '802.3bt' },
  { cls: 8, min: '0.44 W', max: '90 W',   note: '802.3bt max' },
];

const AP_MODELS = [
  { label: 'Basic AP',      watts: 12 },
  { label: 'Wi-Fi 5 AP',    watts: 20 },
  { label: 'Wi-Fi 6 AP',    watts: 25 },
  { label: 'Wi-Fi 6E AP',   watts: 45 },
  { label: 'Wi-Fi 7 AP',    watts: 60 },
];

function PoETab() {
  const [budget, setBudget] = useState(370);
  const [apModel, setApModel] = useState(0);

  const apWatts = AP_MODELS[apModel].watts;
  const maxAPs = Math.floor(budget / apWatts);
  const used = maxAPs * apWatts;
  const remaining = budget - used;
  const utilPct = Math.round((used / budget) * 100);

  return (
    <div className="space-y-6">
      {/* Standards table */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">PoE IEEE Standards</h3>
        <div className="overflow-x-auto">
          <table className="text-xs w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-700">
                {['Standard', 'Year', 'Max Power', 'Pairs Used', 'Max Current', 'Use Case'].map(h => (
                  <th key={h} className="pb-2 text-left text-slate-500 pr-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {POE_STANDARDS.map(s => (
                <tr key={s.name} className="border-b border-slate-800/50">
                  <td className="py-2 pr-3 font-semibold" style={{ color: s.color }}>{s.name}</td>
                  <td className="py-2 pr-3 text-slate-400">{s.year}</td>
                  <td className="py-2 pr-3 text-white font-bold">{s.maxPower}</td>
                  <td className="py-2 pr-3 text-slate-300">{s.pairs}</td>
                  <td className="py-2 pr-3 text-slate-300">{s.maxCurrent}</td>
                  <td className="py-2 text-slate-400">{s.useCase}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Power classes */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h4 className="font-bold text-white">PoE Power Classes (0–8)</h4>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {POE_CLASSES.map(c => {
            const pct = parseFloat(c.max) / 90;
            return (
              <div key={c.cls} className="rounded-lg border border-slate-700 p-2 space-y-1 text-center">
                <div className="text-xs font-bold text-cyan-400">Class {c.cls}</div>
                <div className="w-full bg-slate-800 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${pct * 100}%` }} />
                </div>
                <div className="text-xs text-white font-semibold">{c.max}</div>
                <div className="text-xs text-slate-500" style={{ fontSize: '9px' }}>{c.note}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PSE vs PD */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">PSE vs PD</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔌</span>
              <span className="font-bold text-cyan-400">PSE — Power Sourcing Equipment</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">Supplies power on the cable. Examples: PoE switch ports, midspan injectors, single-port injectors.</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <span className="font-bold text-purple-400">PD — Powered Device</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">Receives power from the cable. Examples: wireless APs, IP cameras, VoIP phones, IoT sensors, thin clients.</p>
          </div>
        </div>
      </div>

      {/* Budget Calculator */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h4 className="font-bold text-white">Interactive PoE Budget Calculator</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">
              Switch PoE Budget: <span className="text-yellow-400 font-bold">{budget} W</span>
            </label>
            <input type="range" min={100} max={740} step={10} value={budget}
              onChange={e => setBudget(+e.target.value)} className="w-full accent-yellow-500" />
            <div className="flex justify-between text-xs text-slate-600"><span>100W</span><span>740W</span></div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-400 block">
              AP Model: <span className="text-cyan-400 font-bold">{AP_MODELS[apModel].label} ({apWatts}W)</span>
            </label>
            <select value={apModel} onChange={e => setApModel(+e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm">
              {AP_MODELS.map((m, i) => (
                <option key={m.label} value={i}>{m.label} — {m.watts}W</option>
              ))}
            </select>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">{maxAPs}</p>
              <p className="text-xs text-slate-500">Max APs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-400">{used} W</p>
              <p className="text-xs text-slate-500">Used</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{remaining} W</p>
              <p className="text-xs text-slate-500">Remaining</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Utilization</span>
              <span className="font-bold" style={{ color: utilPct > 90 ? '#ef4444' : utilPct > 75 ? '#f59e0b' : '#10b981' }}>
                {utilPct}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3">
              <motion.div
                className="h-3 rounded-full"
                style={{ background: utilPct > 90 ? '#ef4444' : utilPct > 75 ? '#f59e0b' : '#10b981' }}
                animate={{ width: `${utilPct}%` }}
                transition={{ type: 'spring', stiffness: 120 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VLANs Tab ─────────────────────────────────────────────────────────────────
function VLANTab() {
  const [hoverVlan, setHoverVlan] = useState<number | null>(null);

  const vlanDefs = [
    { id: 10, name: 'Corporate', color: '#3b82f6', ports: [1, 2, 3], ssid: 'Corp-WiFi' },
    { id: 20, name: 'Guest',     color: '#f59e0b', ports: [4, 5],    ssid: 'Guest-WiFi' },
    { id: 30, name: 'IoT',       color: '#10b981', ports: [6, 7],    ssid: 'IoT-Net' },
  ];

  return (
    <div className="space-y-6">
      {/* 802.1Q Frame diagram */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">802.1Q VLAN Tag Structure</h3>
        <p className="text-xs text-slate-400">A 4-byte tag is inserted between the Source Address and EtherType fields</p>
        <div className="overflow-x-auto">
          <div className="flex items-stretch gap-0.5 min-w-[560px] text-xs font-mono">
            {[
              { label: 'DA', bytes: '6B', color: '#475569', bg: '#1e293b' },
              { label: 'SA', bytes: '6B', color: '#475569', bg: '#1e293b' },
              { label: 'TPID', bytes: '2B\n0x8100', color: '#f59e0b', bg: '#f59e0b15', tag: true },
              { label: 'PCP', bytes: '3 bits', color: '#a855f7', bg: '#a855f715', tag: true },
              { label: 'DEI', bytes: '1 bit', color: '#a855f7', bg: '#a855f715', tag: true },
              { label: 'VID', bytes: '12 bits', color: '#06b6d4', bg: '#06b6d415', tag: true },
              { label: 'EtherType', bytes: '2B', color: '#475569', bg: '#1e293b' },
              { label: 'Payload', bytes: 'var', color: '#475569', bg: '#1e293b' },
              { label: 'FCS', bytes: '4B', color: '#475569', bg: '#1e293b' },
            ].map((f, i) => (
              <div key={i} className="flex-1 rounded border text-center py-2 px-1"
                style={{ borderColor: f.color + '50', background: f.bg, minWidth: f.tag ? 48 : 40 }}>
                <div className="font-bold" style={{ color: f.color, fontSize: '9px' }}>{f.label}</div>
                <div className="text-slate-500 mt-0.5 whitespace-pre" style={{ fontSize: '8px' }}>{f.bytes}</div>
                {f.tag && <div className="text-yellow-500 mt-0.5" style={{ fontSize: '8px' }}>▲ tag</div>}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <span className="text-yellow-400 font-semibold">TPID</span> = Tag Protocol ID (0x8100) ·{' '}
            <span className="text-purple-400 font-semibold">PCP</span> = Priority Code Point (QoS) ·{' '}
            <span className="text-purple-400 font-semibold">DEI</span> = Drop Eligible ·{' '}
            <span className="text-cyan-400 font-semibold">VID</span> = VLAN ID (0–4095, 4094 usable)
          </p>
        </div>
      </div>

      {/* VLAN topology diagram */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h4 className="font-bold text-white">VLAN Isolation Diagram</h4>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 480 220" className="w-full max-w-lg">
            {/* Switch body */}
            <rect x="80" y="90" width="320" height="40" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="240" y="115" textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="bold">L2 SWITCH</text>
            {/* Trunk port label */}
            <text x="440" y="115" textAnchor="middle" fontSize="8" fill="#a855f7">Trunk</text>
            <text x="440" y="125" textAnchor="middle" fontSize="7" fill="#64748b">to router</text>
            <line x1="400" y1="110" x2="455" y2="110" stroke="#a855f7" strokeWidth="2" strokeDasharray="3 2" />
            <rect x="456" y="98" width="20" height="24" rx="3" fill="#a855f720" stroke="#a855f750" strokeWidth="1" />
            <text x="466" y="114" textAnchor="middle" fontSize="8">🔀</text>

            {/* Ports + devices */}
            {vlanDefs.map(v =>
              v.ports.map((port, pi) => {
                const totalPorts = 8;
                const portX = 100 + ((port - 1) / (totalPorts - 1)) * 280;
                const isHovered = hoverVlan === v.id;
                return (
                  <g key={port}>
                    <line x1={portX} y1={90} x2={portX} y2={55} stroke={v.color + (isHovered ? 'ff' : '80')} strokeWidth={isHovered ? 2 : 1} />
                    <rect x={portX - 18} y={25} width="36" height="30" rx="4"
                      fill={v.color + '20'} stroke={v.color + (isHovered ? 'cc' : '50')} strokeWidth="1"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoverVlan(v.id)} onMouseLeave={() => setHoverVlan(null)} />
                    <text x={portX} y={43} textAnchor="middle" fontSize="10">💻</text>
                    <text x={portX} y={67} textAnchor="middle" fontSize="7" fill={v.color}>P{port}</text>
                    <text x={portX} y={78} textAnchor="middle" fontSize="6" fill={v.color + 'aa'}>V{v.id}</text>
                    {pi === 0 && (
                      <text x={portX - (v.ports.length > 1 ? 10 : 0)} y={16} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={v.color}>
                        VLAN {v.id} – {v.name}
                      </text>
                    )}
                  </g>
                );
              })
            )}

            {/* Isolation arrow: VLAN20 cannot reach VLAN10 */}
            <text x="240" y="175" textAnchor="middle" fontSize="8" fill="#ef4444">⛔ VLAN 20 (Guest) cannot reach VLAN 10 (Corporate) — isolated at L2</text>
            <line x1="160" y1="165" x2="200" y2="165" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" markerEnd="url(#arrow)" />
            <line x1="280" y1="165" x2="240" y2="165" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
              </marker>
            </defs>
          </svg>
        </div>
        <div className="flex flex-wrap gap-3">
          {vlanDefs.map(v => (
            <div key={v.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: v.color + '40', background: v.color + '10' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: v.color }} />
              <span style={{ color: v.color }}>VLAN {v.id}</span>
              <span className="text-slate-400">— {v.name} (Ports {v.ports.join(', ')})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Port types */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">Port Types</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { name: 'Access Port', icon: '🖥️', color: '#3b82f6',
              desc: 'Untagged ingress/egress. Belongs to exactly one VLAN. Used for end devices (PC, AP, printer). Switch adds/strips VLAN tag transparently.' },
            { name: 'Trunk Port', icon: '🔀', color: '#a855f7',
              desc: 'Carries tagged frames for multiple VLANs. Used for switch-to-switch or switch-to-router links. Tag stays on frame.' },
            { name: 'Native VLAN', icon: '⚠️', color: '#f59e0b',
              desc: 'VLAN that travels untagged on a trunk. Default is VLAN 1. Best practice: change to an unused VLAN to prevent VLAN-hopping attacks.' },
          ].map(p => (
            <div key={p.name} className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: p.color + '40', background: p.color + '08' }}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{p.icon}</span>
                <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SSID → VLAN mapping */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">Wi-Fi SSID → VLAN Mapping</h4>
        <div className="space-y-2">
          {vlanDefs.map(v => (
            <div key={v.id} className="flex items-center gap-3 text-sm rounded-lg p-2 border"
              style={{ borderColor: v.color + '30', background: v.color + '08' }}>
              <span className="font-mono font-bold text-white">"{v.ssid}"</span>
              <span className="text-slate-500">→</span>
              <span className="font-bold" style={{ color: v.color }}>VLAN {v.id}</span>
              <span className="text-slate-400 text-xs">— own DHCP scope + ACL</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-1">
            <p className="font-bold text-cyan-400">Router-on-a-Stick</p>
            <p className="text-slate-400">One physical router interface with subinterfaces per VLAN. Trunk link carries all VLANs to router. Simple but single-link bandwidth limit.</p>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 space-y-1">
            <p className="font-bold text-purple-400">Layer 3 Switch (SVIs)</p>
            <p className="text-slate-400">Switched Virtual Interfaces route between VLANs at wire speed inside the switch. No external router needed for inter-VLAN routing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STP Tab ───────────────────────────────────────────────────────────────────
function STPTab() {
  const [stpStep, setStpStep] = useState(-1);
  const [loopAnim, setLoopAnim] = useState(false);

  const stpSteps = [
    { label: 'All bridges send BPDUs', color: '#06b6d4',
      desc: 'Every bridge (switch) floods Bridge Protocol Data Units (BPDUs) containing its Bridge ID (priority + MAC) out all ports every 2 seconds.' },
    { label: 'Root Bridge elected', color: '#10b981',
      desc: 'Bridge SW1 has lowest Bridge ID (priority 4096, lowest MAC). SW1 becomes Root Bridge — all ports on Root are Designated Ports (Forwarding).' },
    { label: 'Root Ports selected', color: '#a855f7',
      desc: 'SW2 and SW3 each elect their Root Port — the port with lowest cost path to Root. SW2 uses Link SW1→SW2 (cost 4). SW3 uses Link SW1→SW3 (cost 4).' },
    { label: 'Designated Ports selected', color: '#f59e0b',
      desc: 'On the SW2–SW3 segment, SW2 has lower cost to root, so SW2\'s port on that link = Designated. SW3\'s port on that link = Blocked.' },
    { label: 'Loop-free topology', color: '#3b82f6',
      desc: 'SW3\'s port toward SW2 is Blocked. No loops. STP converges in ~30–50 seconds (802.1D). The blocked port still monitors BPDUs in case topology changes.' },
  ];

  return (
    <div className="space-y-6">
      {/* Loop problem */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">The Layer-2 Loop Problem</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Without Spanning Tree, a physical loop in a switched network causes a <span className="text-red-400 font-semibold">broadcast storm</span>:
          frames replicate exponentially, saturating all links and crashing the network within seconds.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => setLoopAnim(!loopAnim)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
              loopAnim ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}>
            {loopAnim ? '🌀 Storm Active — Click to Stop' : '▶ Simulate Broadcast Storm'}
          </button>
        </div>
        <div className="rounded-xl border border-slate-800 p-4" style={{ background: '#060b16' }}>
          <svg viewBox="0 0 300 160" className="w-full max-w-xs mx-auto">
            {/* Triangle of 3 switches */}
            {[
              { id: 'SW1', x: 150, y: 20 },
              { id: 'SW2', x: 50, y: 130 },
              { id: 'SW3', x: 250, y: 130 },
            ].map(sw => (
              <g key={sw.id}>
                <rect x={sw.x - 22} y={sw.y - 10} width="44" height="20" rx="4"
                  fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <text x={sw.x} y={sw.y + 4} textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="bold">{sw.id}</text>
              </g>
            ))}
            {/* Links */}
            {[
              { x1: 150, y1: 20, x2: 50, y2: 130 },
              { x1: 150, y1: 20, x2: 250, y2: 130 },
              { x1: 50, y1: 130, x2: 250, y2: 130 },
            ].map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={loopAnim ? '#ef4444' : '#334155'} strokeWidth={loopAnim ? 2 : 1.5} />
            ))}
            {/* Spinning frame dots */}
            {loopAnim && [0, 1, 2].map(i => (
              <motion.circle key={i} r="5" fill="#ef4444"
                animate={{
                  cx: [150, 50, 250, 150],
                  cy: [20, 130, 130, 20],
                }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
              />
            ))}
            {loopAnim && (
              <text x="150" y="155" textAnchor="middle" fontSize="8" fill="#ef4444">⚠ BROADCAST STORM — CPU 100%</text>
            )}
          </svg>
        </div>
      </div>

      {/* STP Election */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h4 className="font-bold text-white">STP (802.1D) Election Process</h4>
        <div className="flex flex-wrap gap-2">
          {stpSteps.map((s, i) => (
            <button key={i} onClick={() => setStpStep(stpStep === i ? -1 : i)}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
              style={{
                borderColor: s.color + (stpStep === i ? 'ff' : '40'),
                background: stpStep === i ? s.color + '25' : 'transparent',
                color: stpStep === i ? s.color : '#64748b',
              }}>
              Step {i + 1}: {s.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {stpStep >= 0 && (
            <motion.div key={stpStep}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border p-4 text-sm"
              style={{ borderColor: stpSteps[stpStep].color + '50', background: stpSteps[stpStep].color + '0a' }}>
              <p className="font-bold mb-1" style={{ color: stpSteps[stpStep].color }}>Step {stpStep + 1}: {stpSteps[stpStep].label}</p>
              <p className="text-slate-300 leading-relaxed">{stpSteps[stpStep].desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Port states */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">STP Port States (802.1D)</h4>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {[
            { state: 'Blocking', color: '#ef4444', desc: 'No forwarding, listen for BPDUs' },
            { state: '→', color: '#475569', desc: '' },
            { state: 'Listening', color: '#f59e0b', desc: '15 s, send/receive BPDUs' },
            { state: '→', color: '#475569', desc: '' },
            { state: 'Learning', color: '#06b6d4', desc: '15 s, build MAC table' },
            { state: '→', color: '#475569', desc: '' },
            { state: 'Forwarding', color: '#10b981', desc: 'Normal operation' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              {item.desc ? (
                <div className="rounded-lg border px-3 py-2" style={{ borderColor: item.color + '50', background: item.color + '10' }}>
                  <div className="font-bold" style={{ color: item.color }}>{item.state}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{item.desc}</div>
                </div>
              ) : (
                <span className="text-slate-600 text-lg font-bold">{item.state}</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Total convergence: <span className="text-yellow-400 font-semibold">30–50 seconds</span> (2×Forward Delay + max age)</p>
      </div>

      {/* RSTP */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h4 className="font-bold text-white">RSTP (802.1w) — Rapid Spanning Tree</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-semibold text-cyan-400">Port States (3 instead of 5)</p>
            {[
              { state: 'Discarding', color: '#ef4444' },
              { state: 'Learning', color: '#f59e0b' },
              { state: 'Forwarding', color: '#10b981' },
            ].map(s => (
              <div key={s.state} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span style={{ color: s.color }}>{s.state}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-purple-400">Port Roles (4)</p>
            {[
              { role: 'Root', desc: 'Best path to Root Bridge' },
              { role: 'Designated', desc: 'Best port on a segment' },
              { role: 'Alternate', desc: 'Backup to Root (was Blocked)' },
              { role: 'Backup', desc: 'Backup Designated port' },
            ].map(r => (
              <div key={r.role} className="text-slate-400">
                <span className="text-purple-300 font-semibold">{r.role}:</span> {r.desc}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-xs text-slate-300">
          <span className="text-green-400 font-bold">Convergence: &lt;1 second</span> — uses proposal/agreement handshake instead of timers. Edge ports (PortFast) skip STP entirely for end-device ports.
        </div>
      </div>

      {/* MSTP */}
      <div className="glass-panel p-5 border-glow-blue space-y-2">
        <h4 className="font-bold text-white">MSTP (802.1s) — Multiple Spanning Tree</h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Runs multiple STP instances (MSTIs) so different VLAN groups use different topologies — enabling load balancing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
            <p className="font-bold text-cyan-400">MSTI 1</p>
            <p className="text-slate-400">VLANs 1–50 → prefer Link A. Link B is blocked for this instance.</p>
          </div>
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <p className="font-bold text-purple-400">MSTI 2</p>
            <p className="text-slate-400">VLANs 51–100 → prefer Link B. Link A is blocked for this instance.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">CIST (Common Internal Spanning Tree) covers all VLANs not explicitly mapped to an MSTI.</p>
      </div>

      {/* STP Optimizations */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">STP Optimization Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { name: 'PortFast', color: '#10b981', icon: '⚡',
              desc: 'Skip Listening/Learning for access ports. Port goes straight to Forwarding. For end devices only — never on switch uplinks.' },
            { name: 'BPDU Guard', color: '#ef4444', icon: '🛡️',
              desc: 'Shuts down a PortFast port immediately if a BPDU is received. Prevents rogue switches from altering the STP topology.' },
            { name: 'Root Guard', color: '#f59e0b', icon: '👑',
              desc: 'Prevents an external switch from becoming the Root Bridge. If a superior BPDU arrives, port enters root-inconsistent state.' },
            { name: 'Loop Guard', color: '#06b6d4', icon: '🔄',
              desc: 'Detects unidirectional link failures. If a Designated port stops receiving BPDUs, it enters loop-inconsistent instead of forwarding.' },
          ].map(f => (
            <div key={f.name} className="rounded-xl border p-3 space-y-1.5"
              style={{ borderColor: f.color + '40', background: f.color + '08' }}>
              <div className="flex items-center gap-2">
                <span>{f.icon}</span>
                <span className="font-bold" style={{ color: f.color }}>{f.name}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LACP Tab ──────────────────────────────────────────────────────────────────
function LACPTab() {
  const [hashMode, setHashMode] = useState<'L2' | 'L3' | 'L4'>('L3');

  const flows = [
    { id: 'F1', src: '10.0.0.1:5000', dst: '10.0.0.10:80',   color: '#06b6d4' },
    { id: 'F2', src: '10.0.0.2:6001', dst: '10.0.0.10:443',  color: '#a855f7' },
    { id: 'F3', src: '10.0.0.3:7002', dst: '10.0.0.11:80',   color: '#10b981' },
    { id: 'F4', src: '10.0.0.4:8003', dst: '10.0.0.12:8080', color: '#f59e0b' },
  ];

  // Simple deterministic hash: assign link index based on hash mode
  const linkFor = (f: typeof flows[0], mode: string) => {
    if (mode === 'L2') return [0, 1, 2, 3][flows.indexOf(f)];
    if (mode === 'L3') {
      const sum = f.src.split('.').slice(-1)[0].charCodeAt(0) + f.dst.split('.').slice(-1)[0].charCodeAt(0);
      return sum % 4;
    }
    // L4
    const port = parseInt(f.src.split(':')[1]);
    return port % 4;
  };

  return (
    <div className="space-y-6">
      {/* What is LAG */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">Link Aggregation (802.3ad / LACP)</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Multiple physical links are bundled into one logical Port Channel / LAG (Link Aggregation Group),
          multiplying bandwidth and providing redundancy if individual links fail.
        </p>

        {/* Bundle visualization */}
        <div className="rounded-xl border border-slate-800 p-4" style={{ background: '#060b16' }}>
          <svg viewBox="0 0 400 100" className="w-full">
            {/* SW1 */}
            <rect x="10" y="25" width="80" height="50" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="50" y="53" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="bold">SW1</text>
            {/* SW2 */}
            <rect x="310" y="25" width="80" height="50" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="350" y="53" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="bold">SW2</text>
            {/* 4 physical links */}
            {[30, 40, 60, 70].map((y, i) => (
              <motion.line key={i} x1={90} y1={y} x2={310} y2={y}
                stroke={flows[i].color} strokeWidth="1.5"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }} />
            ))}
            {/* Logical bundle label */}
            <text x="200" y="18" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">Po1 — 4× 1 GbE = 4 Gbps</text>
            {/* LACP label */}
            <text x="200" y="92" textAnchor="middle" fontSize="7" fill="#475569">LACPDU negotiation active ↔ active</text>
          </svg>
        </div>
      </div>

      {/* LACP Operation */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h4 className="font-bold text-white">LACP Operation Modes</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {[
            { mode: 'Active', color: '#10b981', icon: '📡', desc: 'Initiates LACP negotiation. Sends LACPDUs. Recommended for both sides (Active-Active).' },
            { mode: 'Passive', color: '#f59e0b', icon: '🔇', desc: 'Responds to LACPDUs but does not initiate. Must be paired with an Active end.' },
          ].map(m => (
            <div key={m.mode} className="rounded-xl border p-3 space-y-1" style={{ borderColor: m.color + '40', background: m.color + '08' }}>
              <div className="flex items-center gap-2">
                <span>{m.icon}</span>
                <span className="font-bold" style={{ color: m.color }}>{m.mode} Mode</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-400 space-y-1">
          <p><span className="text-cyan-400 font-semibold">Member port requirements:</span> All ports must share the same speed, duplex, and VLAN configuration.</p>
          <p><span className="text-purple-400 font-semibold">Min-links:</span> Minimum number of active members before the LAG is declared down (prevents partial operation).</p>
        </div>
      </div>

      {/* Hash algorithm selector */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h4 className="font-bold text-white">Load Distribution — Hash Algorithm</h4>
        <div className="flex gap-2">
          {(['L2', 'L3', 'L4'] as const).map(m => (
            <button key={m} onClick={() => setHashMode(m)}
              className="px-4 py-2 rounded-lg border text-sm font-bold transition-all"
              style={{
                borderColor: hashMode === m ? '#06b6d4' : '#334155',
                background: hashMode === m ? '#06b6d420' : 'transparent',
                color: hashMode === m ? '#06b6d4' : '#64748b',
              }}>
              {m}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {hashMode === 'L2' && 'Layer 2 hash: src/dst MAC address. Same MAC pair → same link always.'}
          {hashMode === 'L3' && 'Layer 3 hash: src/dst IP address. Distributes flows across links based on IP pairs.'}
          {hashMode === 'L4' && 'Layer 4 hash: src/dst TCP/UDP port. Most granular — different flows per port pair use different links.'}
        </p>
        <div className="space-y-2">
          {flows.map(f => {
            const link = linkFor(f, hashMode);
            return (
              <div key={f.id} className="flex items-center gap-3 text-xs rounded-lg p-2 border"
                style={{ borderColor: f.color + '30', background: f.color + '08' }}>
                <span className="font-bold w-6" style={{ color: f.color }}>{f.id}</span>
                <span className="font-mono text-slate-400 flex-1">{f.src} → {f.dst}</span>
                <span className="font-bold" style={{ color: f.color }}>Link {link + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Benefits table */}
      <div className="glass-panel p-5 border-glow-blue overflow-x-auto">
        <h4 className="font-bold text-white mb-3">LAG Benefits</h4>
        <table className="text-xs w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-2 text-left text-slate-500 pr-4">Feature</th>
              <th className="pb-2 text-left text-slate-500 pr-4">Single Link</th>
              <th className="pb-2 text-left text-slate-500">4-Link LAG</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feat: 'Bandwidth',       single: '1 Gbps',    lag: '4 Gbps aggregate' },
              { feat: 'Redundancy',      single: 'None',       lag: '3 links can fail' },
              { feat: 'STP interaction', single: 'Blocked links waste bandwidth', lag: 'LAG treated as single logical port' },
              { feat: 'AP uplink',       single: '1 Gbps bottleneck', lag: '4 Gbps to distribution switch' },
            ].map(r => (
              <tr key={r.feat} className="border-b border-slate-800/50">
                <td className="py-2 pr-4 text-white font-semibold">{r.feat}</td>
                <td className="py-2 pr-4 text-red-400">{r.single}</td>
                <td className="py-2 text-green-400">{r.lag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── IP Subnetting Tab ─────────────────────────────────────────────────────────
function IPSubnettingTab() {
  const [octets, setOctets] = useState([192, 168, 1, 50]);
  const [prefix, setPrefix] = useState(24);

  const ipNum = octets[0] * 16777216 + octets[1] * 65536 + octets[2] * 256 + octets[3];
  const maskNum = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkNum = (ipNum & maskNum) >>> 0;
  const broadcastNum = (networkNum | (~maskNum >>> 0)) >>> 0;
  const firstHost = networkNum + 1;
  const lastHost = broadcastNum - 1;
  const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.pow(2, 32 - prefix) - 2;
  const wildcardNum = (~maskNum) >>> 0;

  const numToOctets = (n: number) => [
    (n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff,
  ];

  const toBinary = (n: number) => n.toString(2).padStart(8, '0');

  const maskOctets = numToOctets(maskNum);
  const networkOctets = numToOctets(networkNum);
  const broadcastOctets = numToOctets(broadcastNum);
  const firstOctets = numToOctets(firstHost);
  const lastOctets = numToOctets(lastHost);
  const wildcardOctets = numToOctets(wildcardNum);

  return (
    <div className="space-y-6">
      {/* IPv4 structure */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white text-lg">IPv4 Address Structure</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {octets.map((o, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 font-mono text-cyan-300 text-sm font-bold">{o}</div>
              <div className="text-slate-600 mt-0.5">Octet {i + 1}</div>
            </div>
          ))}
          <div className="flex items-center font-mono text-slate-400">/ {prefix}</div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          IPv4 = 32-bit address in 4 octets (dotted-decimal). CIDR notation (/<span className="text-cyan-400">{prefix}</span>) defines network vs host portions.
          Network bits: <span className="text-cyan-400">{prefix}</span>, Host bits: <span className="text-yellow-400">{32 - prefix}</span>.
        </p>
      </div>

      {/* Interactive calculator */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h4 className="font-bold text-white">Interactive Subnet Calculator</h4>

        {/* IP input */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400">IP Address</label>
          <div className="flex items-center gap-1.5">
            {octets.map((o, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  type="number" min={0} max={255} value={o}
                  onChange={e => {
                    const v = Math.min(255, Math.max(0, +e.target.value || 0));
                    setOctets(prev => prev.map((x, j) => j === i ? v : x));
                  }}
                  className="w-14 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-sm text-center font-mono"
                />
                {i < 3 && <span className="text-slate-600">.</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Prefix slider */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 block">
            Prefix Length: <span className="text-cyan-400 font-bold">/{prefix}</span>
          </label>
          <input type="range" min={8} max={30} value={prefix}
            onChange={e => setPrefix(+e.target.value)} className="w-full accent-cyan-500" />
          <div className="flex justify-between text-xs text-slate-600"><span>/8</span><span>/16</span><span>/24</span><span>/30</span></div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          {[
            { label: 'Network Address',    value: networkOctets.join('.'),    color: '#06b6d4' },
            { label: 'Subnet Mask',        value: maskOctets.join('.'),       color: '#a855f7' },
            { label: 'Broadcast Address',  value: broadcastOctets.join('.'),  color: '#f59e0b' },
            { label: 'First Usable Host',  value: firstOctets.join('.'),      color: '#10b981' },
            { label: 'Last Usable Host',   value: lastOctets.join('.'),       color: '#10b981' },
            { label: 'Usable Hosts',       value: usableHosts.toLocaleString(), color: '#3b82f6' },
            { label: 'Wildcard Mask',      value: wildcardOctets.join('.'),   color: '#64748b' },
          ].map(r => (
            <div key={r.label} className="rounded-lg border border-slate-700 p-2 space-y-0.5">
              <div className="text-slate-500">{r.label}</div>
              <div className="font-mono font-bold" style={{ color: r.color }}>{r.value}</div>
            </div>
          ))}
        </div>

        {/* Binary breakdown */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Binary Breakdown — <span className="text-cyan-400">network bits</span> | <span className="text-yellow-400">host bits</span></p>
          <div className="font-mono text-xs overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {octets.map((o, oi) => (
                <div key={oi} className="flex">
                  {toBinary(o).split('').map((bit, bi) => {
                    const globalBit = oi * 8 + bi;
                    const isNetwork = globalBit < prefix;
                    return (
                      <span key={bi}
                        className="w-5 text-center border-b"
                        style={{
                          color: isNetwork ? '#06b6d4' : '#f59e0b',
                          borderColor: isNetwork ? '#06b6d430' : '#f59e0b30',
                        }}>
                        {bit}
                      </span>
                    );
                  })}
                  {oi < 3 && <span className="text-slate-600 w-3 text-center">.</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RFC 1918 ranges */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">Private Address Ranges (RFC 1918)</h4>
        <div className="overflow-x-auto">
          <table className="text-xs w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-slate-700">
                {['Range', 'CIDR', 'Addresses', 'Typical Use'].map(h => (
                  <th key={h} className="pb-2 text-left text-slate-500 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { range: '10.0.0.0 – 10.255.255.255',     cidr: '10.0.0.0/8',       addrs: '16.7M',  use: 'Large enterprise' },
                { range: '172.16.0.0 – 172.31.255.255',   cidr: '172.16.0.0/12',    addrs: '1M',     use: 'Medium enterprise' },
                { range: '192.168.0.0 – 192.168.255.255', cidr: '192.168.0.0/16',   addrs: '65,536', use: 'Home/small office' },
              ].map(r => (
                <tr key={r.cidr} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 font-mono text-slate-300">{r.range}</td>
                  <td className="py-2 pr-4 font-mono text-cyan-400 font-bold">{r.cidr}</td>
                  <td className="py-2 pr-4 text-white font-semibold">{r.addrs}</td>
                  <td className="py-2 text-slate-400">{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CIDR quick ref */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="font-bold text-white mb-3">CIDR Quick Reference</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { pfx: '/24', hosts: 254 }, { pfx: '/25', hosts: 126 }, { pfx: '/26', hosts: 62 },
            { pfx: '/27', hosts: 30 },  { pfx: '/28', hosts: 14 },  { pfx: '/29', hosts: 6 },
            { pfx: '/30', hosts: 2 },
          ].map(r => (
            <div key={r.pfx} className={`rounded-lg border px-3 py-2 text-center text-xs transition-all ${
              prefix === parseInt(r.pfx.slice(1)) ? 'border-cyan-500/70 bg-cyan-500/15' : 'border-slate-700'
            }`}>
              <div className="font-mono font-bold text-cyan-400">{r.pfx}</div>
              <div className="text-slate-400">{r.hosts} hosts</div>
            </div>
          ))}
        </div>
      </div>

      {/* IPv6 brief */}
      <div className="glass-panel p-5 border-glow-blue space-y-2">
        <h4 className="font-bold text-white">IPv6 Overview</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Address size', value: '128-bit, colon-separated hex groups', icon: '📏', color: '#3b82f6' },
            { label: 'Link-local', value: 'fe80::/10 — auto-configured, same subnet', icon: '🔗', color: '#06b6d4' },
            { label: 'Unique Local', value: 'fc00::/7 — private, equivalent to RFC 1918', icon: '🏠', color: '#a855f7' },
            { label: 'Global Unicast', value: '2000::/3 — routable on the internet', icon: '🌍', color: '#10b981' },
            { label: 'No ARP', value: 'Uses NDP (Neighbor Discovery Protocol) instead', icon: '🔍', color: '#f59e0b' },
            { label: 'No broadcast', value: 'Multicast used instead for efficiency', icon: '📡', color: '#ef4444' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-slate-700 p-3 space-y-0.5">
              <div className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.label}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Chapter0 Component ──────────────────────────────────────────────────
export function Chapter0() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState('802_3_evo');
  useSubtopicNav(TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    (TAB_SUBTOPICS[activeTab] ?? []).forEach(id => markComplete('ch0', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader
          chapter={CHAPTER}
          description="Master the wired foundation that every wireless network depends on — Ethernet, IP addressing, DHCP, DNS, and ICMP — before moving to the airwaves."
        />
        <ModeBadge />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1.5 border-b border-slate-700/50 pb-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab.id
                ? 'border-wired text-wired'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === '802_3_evo' && <EthernetEvolutionTab />}
          {activeTab === 'poe'       && <PoETab />}
          {activeTab === 'vlans'     && <VLANTab />}
          {activeTab === 'stp'       && <STPTab />}
          {activeTab === 'lacp'      && <LACPTab />}
          {activeTab === 'ipaddr'    && <IPSubnettingTab />}
          {activeTab === 'dhcp'      && <DHCPDoraSimulation />}
          {activeTab === 'dns'       && <DNSResolutionSimulation />}
          {activeTab === 'icmp'      && <ICMPPingSimulation />}
          {activeTab === 'arp'       && <ARPSimulation />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
