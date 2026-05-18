import { useState, useEffect } from 'react';
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
