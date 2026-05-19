import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge } from '../../components/shared/ModeContent';
import { DHCPDoraSimulation } from './DHCPDoraSimulation';
import { DNSResolutionSimulation } from './DNSResolutionSimulation';
import { ICMPPingSimulation } from './ICMPPingSimulation';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch0')!;

const TABS = [
  { id: 'overview', label: '📋 Overview' },
  { id: 'dhcp',     label: '🎁 DHCP DORA' },
  { id: 'dns',      label: '📖 DNS Lookup' },
  { id: 'icmp',     label: '📡 Ping / ICMP' },
  { id: 'arp',      label: '🔍 ARP Protocol' },
];

// ─── Concept Overview Cards ───────────────────────────────────────────────────
interface ConceptCard {
  icon: string;
  title: string;
  color: string;
  kid: string;
  enthusiast: string;
  pro: string;
}

const CONCEPTS: ConceptCard[] = [
  {
    icon: '🔌', title: 'Ethernet & PoE',
    color: '#f59e0b',
    kid: 'The magic wire that carries data AND electricity to Wi-Fi boxes (APs) at the same time!',
    enthusiast: 'PoE (Power over Ethernet) lets switches power APs and cameras over the same Cat6 cable — no power outlet needed. PoE++ delivers up to 90W.',
    pro: 'IEEE 802.3af (15.4W), 802.3at PoE+ (30W), 802.3bt PoE++ Type 3 (60W) / Type 4 (90W). Enterprise APs (Wi-Fi 6E/7) require 802.3bt for full radio operation.',
  },
  {
    icon: '🏘️', title: 'VLANs',
    color: '#f59e0b',
    kid: 'Imagine your school has one hallway but invisible walls split it into separate rooms. VLANs do that for networks!',
    enthusiast: 'VLANs separate different types of devices on the same physical switch — e.g., Guest Wi-Fi can\'t access corporate servers even through the same hardware.',
    pro: 'IEEE 802.1Q VLAN tagging (4-byte tag: TPID 0x8100, PCP, DEI, VID). Access ports strip tags; trunk ports carry tagged frames. AP SSIDs map to VLANs enabling Guest/Corp/IoT traffic isolation.',
  },
  {
    icon: '🏠', title: 'IP Addresses',
    color: '#06b6d4',
    kid: 'Every device on the internet has its own unique "home address" — like a house number — so messages can find the right destination!',
    enthusiast: 'An IP address (like 192.168.1.50) uniquely identifies your device on a network. IPv4 uses 32 bits (about 4 billion addresses), IPv6 uses 128 bits (340 undecillion — essentially unlimited).',
    pro: 'IPv4: 32-bit dotted-decimal, /CIDR notation (e.g. 192.168.1.0/24 = 256 hosts, 254 usable). IPv6: 128-bit colon-hex. Subnetting: host bits = 32 - prefix. Key classes: RFC1918 private ranges (10/8, 172.16/12, 192.168/16).',
  },
  {
    icon: '📡', title: 'DHCP',
    color: '#a855f7',
    kid: 'A smart robot (DHCP Server) that automatically hands out house numbers to every new device that arrives — no manual typing needed!',
    enthusiast: 'DHCP automatically assigns IP addresses to devices as they join a network. Without it, every phone, laptop, and smart TV would need manually configured IPs — total chaos!',
    pro: 'RFC 2131. Operates over UDP 67(server)/68(client). Allocates: IP (yiaddr), mask (Opt1), gateway (Opt3), DNS (Opt6), lease time (Opt51). Lease management via T1(50%)/T2(87.5%) renewal timers. Relay agents (RFC 3046) extend DHCP across L3 boundaries.',
  },
  {
    icon: '📖', title: 'DNS',
    color: '#06b6d4',
    kid: 'A giant phone book wizard that turns "google.com" into a real computer address number that the internet can understand!',
    enthusiast: 'DNS translates human-readable domain names (google.com) to machine-readable IPs (142.250.80.46). Without DNS, you\'d need to memorize the IP of every website.',
    pro: 'RFC 1034/1035. Hierarchical distributed database: Root → TLD (gTLD/ccTLD) → Authoritative NS. Record types: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), TXT (SPF/DKIM). DNSSEC adds RRSIG/DNSKEY/DS records for cryptographic validation.',
  },
  {
    icon: '🏓', title: 'ICMP',
    color: '#10b981',
    kid: 'The "Marco Polo" of the internet — you shout "Are you there?" and wait for an echo reply to measure how far away something is!',
    enthusiast: 'ICMP is the network\'s health-check protocol. "ping" uses it to test reachability and measure latency; "traceroute" uses it to map the path packets take across the internet.',
    pro: 'RFC 792. Encapsulated in IP (Protocol 1). Key types: Echo Request (T8/C0), Echo Reply (T0/C0), Destination Unreachable (T3), Time Exceeded (T11). traceroute exploits TTL expiration triggering T11 replies from intermediate hops to map L3 topology.',
  },
];

const TAB_SUBTOPICS: Record<string, string[]> = {
  overview: ['802_3_evo', 'poe', 'vlans', 'stp', 'lacp', 'ipaddr'],
};

// ─── ARP Component ────────────────────────────────────────────────────────────
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

export function Chapter0() {
  const { mode, markComplete } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

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
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONCEPTS.map(c => (
                <motion.div
                  key={c.title}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="glass-panel p-5"
                  style={{ borderColor: c.color + '30' }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{c.icon}</span>
                    <h3 className="font-bold text-white">{c.title}</h3>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${c.title}-${mode}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-slate-400 leading-relaxed"
                    >
                      {c[mode]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'dhcp' && <DHCPDoraSimulation />}
          {activeTab === 'dns'  && <DNSResolutionSimulation />}
          {activeTab === 'icmp' && <ICMPPingSimulation />}
          {activeTab === 'arp'  && <ARPSimulation />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
