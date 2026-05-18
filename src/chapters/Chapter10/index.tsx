import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ModeContent } from '../../components/shared/ModeContent';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch10')!;

const TABS = ['Methodology', 'Spectrum Analysis', 'Common Issues', 'Protocol Analysis', 'Performance KPIs'] as const;
type Tab = typeof TABS[number];

const STEPS = [
  {
    icon: '🎯',
    title: 'Define the Problem',
    summary: 'Gather symptoms, scope the issue, reproduce it.',
    checklist: [
      'Is it one user or many?',
      'When did it start? What changed?',
      'Is it site-wide or area-specific?',
      'Can you reproduce it consistently?',
    ],
  },
  {
    icon: '📊',
    title: 'Gather Information',
    summary: 'Collect RSSI, SNR, retry rate, association logs, event logs.',
    checklist: [
      'Pull RSSI and SNR from vendor dashboard',
      'Check RADIUS logs for auth events',
      'Review ARP tables for IP conflicts',
      'Export controller event logs',
    ],
  },
  {
    icon: '🔍',
    title: 'Analyze the Data',
    summary: 'Spectrum sweep, PCAP capture, vendor debug.',
    checklist: [
      'Run a spectrum sweep on affected channels',
      'Capture PCAP at AP or client',
      'Check for high retries or low MCS index',
      'Look for CCI or auth failures in frames',
    ],
  },
  {
    icon: '🎯',
    title: 'Identify the Root Cause',
    summary: 'PHY, MAC, Auth, or Config layer?',
    checklist: [
      'PHY: coverage gap, poor SNR?',
      'MAC: CCI, hidden node, beacon loss?',
      'Auth: RADIUS timeout, wrong PSK, expired cert?',
      'Config: VLAN mismatch, QoS misconfiguration?',
    ],
  },
  {
    icon: '✅',
    title: 'Implement & Verify',
    summary: 'Apply fix, retest, document. Monitor KPIs for 24–48 hours.',
    checklist: [
      'Apply the change in a maintenance window',
      'Retest with original client and location',
      'Monitor KPIs for 24–48 hours post-fix',
      'Document findings and close the ticket',
    ],
  },
];

function TroubleshootingSteps() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={i}
          className="glass-panel border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer"
          onClick={() => setExpanded(expanded === i ? null : i)}
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-sm font-bold text-purple-300">
              {i + 1}
            </div>
            <span className="text-lg">{step.icon}</span>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">{step.title}</p>
              <p className="text-xs text-slate-400">{step.summary}</p>
            </div>
            <motion.span
              animate={{ rotate: expanded === i ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-500 text-xs"
            >
              ▼
            </motion.span>
          </div>
          <AnimatePresence>
            {expanded === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <ul className="px-5 pb-4 space-y-1.5 border-t border-slate-700/50">
                  {step.checklist.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-300 pt-1.5">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
      <div className="glass-panel p-4 mt-4">
        <ModeContent
          content={{
            kid: 'Think of troubleshooting like detective work — gather clues, find the culprit, fix it!',
            enthusiast: 'Always follow a structured methodology. Jumping to solutions without gathering data wastes time and risks missing the real root cause.',
            pro: 'CWAP recommends a top-down or bottom-up OSI approach. Correlate spectrum, PCAP, and controller data before concluding root cause to avoid recurrence.',
          }}
          className="text-xs text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}

type Scenario = { rssi: number; snr: number; nf: number; label: string; description: string };

const SCENARIOS: Scenario[] = [
  { rssi: -42, snr: 38, nf: -80, label: 'Excellent', description: 'Ideal conditions. High MCS guaranteed.' },
  { rssi: -60, snr: 25, nf: -80, label: 'Good', description: 'Good performance. MCS 9–11 likely.' },
  { rssi: -72, snr: 12, nf: -78, label: 'Marginal', description: 'Expect MCS 3–5. Possible retries.' },
  { rssi: -83, snr: 4,  nf: -79, label: 'Poor', description: 'Very low MCS. High retry rate. Connectivity issues.' },
];

const SNR_TABLE = [
  { snr: '> 25 dB', mcs: '9–11', quality: 'Excellent' },
  { snr: '20–25 dB', mcs: '7–9', quality: 'Good' },
  { snr: '15–20 dB', mcs: '4–6', quality: 'Fair' },
  { snr: '10–15 dB', mcs: '1–3', quality: 'Marginal' },
  { snr: '< 10 dB', mcs: '0', quality: 'Poor' },
];

function rssiColor(v: number) { return v > -65 ? '#10b981' : v > -75 ? '#f59e0b' : '#ef4444'; }
function snrColor(v: number) { return v > 25 ? '#10b981' : v > 15 ? '#f59e0b' : '#ef4444'; }
function nfColor(v: number) { return v < -85 ? '#10b981' : v < -75 ? '#f59e0b' : '#ef4444'; }

function rssiPct(v: number) { return Math.max(0, Math.min(100, ((v - (-90)) / ((-30) - (-90))) * 100)); }
function snrPct(v: number) { return Math.max(0, Math.min(100, (v / 40) * 100)); }
function nfPct(v: number) { return Math.max(0, Math.min(100, ((v - (-95)) / ((-60) - (-95))) * 100)); }

function SpectrumDisplay() {
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);
  const s = SCENARIOS[scenarioIdx];

  const bars = [
    { label: 'RSSI', unit: 'dBm', value: s.rssi, pct: rssiPct(s.rssi), color: rssiColor(s.rssi) },
    { label: 'SNR', unit: 'dB', value: s.snr, pct: snrPct(s.snr), color: snrColor(s.snr) },
    { label: 'Noise Floor', unit: 'dBm', value: s.nf, pct: nfPct(s.nf), color: nfColor(s.nf) },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {SCENARIOS.map((sc, i) => (
          <button
            key={i}
            onClick={() => setScenarioIdx(i)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              scenarioIdx === i
                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>

      <div className="glass-panel p-5">
        <div className="flex items-end justify-around gap-6 h-44">
          {bars.map((bar) => (
            <div key={bar.label} className="flex flex-col items-center gap-2 flex-1">
              <p className="text-xs font-semibold text-white tabular-nums">{bar.value} {bar.unit}</p>
              <div className="relative w-full max-w-[60px] h-32 bg-slate-800 rounded-lg overflow-hidden">
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-lg"
                  style={{ background: bar.color + '40', borderTop: `2px solid ${bar.color}` }}
                  animate={{ height: `${bar.pct}%` }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <p className="text-xs text-slate-400 text-center">{bar.label}</p>
            </div>
          ))}
        </div>
        <motion.p
          key={scenarioIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm text-slate-300 font-medium"
        >
          {s.description}
        </motion.p>
      </div>

      <div className="glass-panel p-4">
        <p className="text-xs font-semibold text-slate-300 mb-3">SNR vs Expected MCS</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left pb-1.5">SNR Range</th>
              <th className="text-left pb-1.5">MCS Index</th>
              <th className="text-left pb-1.5">Quality</th>
            </tr>
          </thead>
          <tbody>
            {SNR_TABLE.map((row) => (
              <tr key={row.snr} className="border-b border-slate-800/50">
                <td className="py-1.5 text-slate-300 font-mono">{row.snr}</td>
                <td className="py-1.5 text-cyan-300 font-mono">{row.mcs}</td>
                <td className="py-1.5 text-slate-400">{row.quality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-panel p-4">
        <ModeContent
          content={{
            kid: 'Think of RSSI like how loud a friend\'s voice sounds. SNR is how clearly you can hear them over background noise.',
            enthusiast: 'RSSI alone is misleading — a -60 dBm signal with a -58 dBm noise floor is unusable. Always cross-reference SNR.',
            pro: 'Noise floor elevation is a primary indicator of non-Wi-Fi interference. A rising NF with stable RSSI collapses SNR and forces MCS fallback. Use a spectrum analyzer (e.g., Metageek Chanalyzer) to identify the source.',
          }}
          className="text-xs text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}

type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type IssueCategory = 'PHY' | 'MAC' | 'Auth' | 'Roaming' | 'Security' | 'Interference';

interface Issue {
  name: string;
  severity: Severity;
  category: IssueCategory;
  symptoms: string;
  rootCause: string;
  resolution: string;
  tool: string;
}

const ISSUES: Issue[] = [
  { name: 'Low Throughput / MCS Drift', severity: 'High', category: 'PHY', symptoms: 'Speeds drop during peak hours, clients far from AP', rootCause: 'Poor SNR forces lower MCS (0–3)', resolution: 'Move AP, increase AP density', tool: 'wlan.fc.retry == 1 and wlan_mgt.mcs' },
  { name: 'High Retry Rate', severity: 'High', category: 'MAC', symptoms: 'Packet loss, choppy audio, slow browsing', rootCause: 'Co-channel interference (CCI), hidden node', resolution: 'Channel replan, enable RTS/CTS', tool: 'wlan.fc.retry == 1' },
  { name: 'Sticky Client', severity: 'Medium', category: 'Roaming', symptoms: 'Client holds to distant AP despite closer one', rootCause: 'Client ignores BSS Transition Requests', resolution: 'Enable 802.11r/v, client-side aggressiveness', tool: 'Check BTM responses' },
  { name: 'Authentication Failure', severity: 'Critical', category: 'Auth', symptoms: 'Cannot connect, wrong password prompt loop', rootCause: 'Wrong PSK, RADIUS unreachable, cert expired', resolution: 'Check RADIUS logs, verify PSK, check cert', tool: 'eapol' },
  { name: 'IP Not Assigned', severity: 'High', category: 'Auth', symptoms: 'Connected to Wi-Fi but no internet', rootCause: 'DHCP scope exhausted, VLAN misconfiguration', resolution: 'Check DHCP pool, VLAN trunk, helper-address', tool: 'bootp' },
  { name: 'Coverage Hole', severity: 'Medium', category: 'PHY', symptoms: 'Dead zone in specific area', rootCause: 'AP placement, wall attenuation', resolution: 'Add AP or reposition, check antenna', tool: 'wlan.signal_dbm < -75' },
  { name: 'Deauth/Disassoc Flood', severity: 'Critical', category: 'Security', symptoms: 'Clients repeatedly disconnected', rootCause: 'Deauth attack, rogue AP', resolution: 'Enable PMF (802.11w), deploy WIPS', tool: 'wlan.fc.type_subtype == 0x0c' },
  { name: 'Co-Channel Interference', severity: 'High', category: 'Interference' as IssueCategory, symptoms: 'High retry rate across all clients', rootCause: 'AP neighbors on same channel', resolution: 'DCA (Dynamic Channel Assignment)', tool: 'Spectrum analyzer' },
  { name: 'Slow Roam', severity: 'Medium', category: 'Roaming', symptoms: '1–3 second pause when walking between APs', rootCause: '802.11r not enabled, no FT key caching', resolution: 'Enable 802.11r FT, tune probe response', tool: 'wlan.fc.type_subtype == 0x05' },
  { name: 'EAP Timeout', severity: 'High', category: 'Auth', symptoms: 'Connects, disconnects, reconnects loop', rootCause: 'RADIUS server latency > 1s', resolution: 'Check RADIUS server load, EAP timeout settings', tool: 'eapol timeouts' },
  { name: 'Beacon Loss', severity: 'Medium', category: 'MAC', symptoms: 'Intermittent disconnects, especially on VoIP', rootCause: 'AP overloaded, high beacon interval', resolution: 'Reduce BSS density, check AP CPU', tool: 'wlan.fc.type_subtype == 0x08' },
  { name: 'AP Reboot Loop', severity: 'Critical', category: 'PHY', symptoms: 'AP disappears from controller every few hours', rootCause: 'PoE insufficient, firmware bug', resolution: 'Check PoE budget (802.3at vs af), update FW', tool: 'Controller event logs' },
];

type FilterCategory = 'All' | IssueCategory;
const FILTERS: FilterCategory[] = ['All', 'PHY', 'MAC', 'Auth', 'Roaming', 'Security'];

const SEVERITY_COLORS: Record<Severity, string> = {
  Low: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  High: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
};

function IssuesBrowser() {
  const [filter, setFilter] = useState<FilterCategory>('All');
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = ISSUES.filter((iss) => filter === 'All' || iss.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelected(null); }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              filter === f
                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((iss) => {
          const globalIdx = ISSUES.indexOf(iss);
          const isOpen = selected === globalIdx;
          return (
            <motion.div
              key={globalIdx}
              className="glass-panel border border-slate-700/50 rounded-xl overflow-hidden cursor-pointer"
              onClick={() => setSelected(isOpen ? null : globalIdx)}
              layout
            >
              <div className="flex items-center gap-3 p-3">
                <span className={`px-1.5 py-0.5 rounded border text-xs font-bold ${SEVERITY_COLORS[iss.severity]}`}>
                  {iss.severity}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">[{iss.category}]</span>
                <p className="flex-1 text-sm font-medium text-white">{iss.name}</p>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="text-slate-500 text-xs">▼</motion.span>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden border-t border-slate-700/50"
                  >
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {[
                        { label: 'Symptoms', value: iss.symptoms },
                        { label: 'Root Cause', value: iss.rootCause },
                        { label: 'Resolution', value: iss.resolution },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-slate-500 mb-0.5">{label}</p>
                          <p className="text-slate-200">{value}</p>
                        </div>
                      ))}
                      <div>
                        <p className="text-slate-500 mb-0.5">Tool / Filter</p>
                        <code className="font-mono text-cyan-300 bg-slate-900/60 px-1.5 py-0.5 rounded text-xs">{iss.tool}</code>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No issues in this category.</p>
        )}
      </div>

      <div className="glass-panel p-4">
        <ModeContent
          content={{
            kid: 'Most Wi-Fi problems come from one of four things: too far away, too much interference, wrong password, or misconfigured settings.',
            enthusiast: 'Categorizing issues by OSI layer (PHY vs MAC vs Auth) helps narrow scope quickly. Start with the layer most likely based on symptoms.',
            pro: 'CWAP exam questions heavily test your ability to identify root cause from PCAP evidence. Retry frames pinpoint MAC-layer issues; EAPOL analysis reveals auth problems. Correlate frame captures with spectrum data for definitive diagnosis.',
          }}
          className="text-xs text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}

const WS_FILTERS = [
  { desc: 'Management frames', filter: 'wlan.fc.type == 0' },
  { desc: 'Control frames', filter: 'wlan.fc.type == 1' },
  { desc: 'Data frames', filter: 'wlan.fc.type == 2' },
  { desc: 'Retry frames', filter: 'wlan.fc.retry == 1' },
  { desc: 'Beacon frames', filter: 'wlan.fc.type_subtype == 0x08' },
  { desc: 'Probe requests', filter: 'wlan.fc.type_subtype == 0x04' },
  { desc: '4-way handshake', filter: 'eapol' },
  { desc: 'Specific client', filter: 'wlan.addr == AA:BB:CC:DD:EE:FF' },
  { desc: 'Deauth frames', filter: 'wlan.fc.type_subtype == 0x0c' },
  { desc: 'Low RSSI', filter: 'wlan.signal_dbm < -70' },
];

type FrameSeq = 'Association' | '4-Way Handshake' | 'Roaming (FT)';

interface Arrow { label: string; fromClient: boolean; y: number }

const FRAME_SEQUENCES: Record<FrameSeq, Arrow[]> = {
  'Association': [
    { label: 'Probe Req', fromClient: true, y: 40 },
    { label: 'Probe Resp', fromClient: false, y: 80 },
    { label: 'Auth Req', fromClient: true, y: 120 },
    { label: 'Auth Resp', fromClient: false, y: 160 },
    { label: 'Assoc Req', fromClient: true, y: 200 },
    { label: 'Assoc Resp', fromClient: false, y: 240 },
  ],
  '4-Way Handshake': [
    { label: 'EAPOL-Key 1', fromClient: false, y: 60 },
    { label: 'EAPOL-Key 2', fromClient: true, y: 110 },
    { label: 'EAPOL-Key 3', fromClient: false, y: 160 },
    { label: 'EAPOL-Key 4', fromClient: true, y: 210 },
  ],
  'Roaming (FT)': [
    { label: '(Re)Assoc Req + FT IE', fromClient: true, y: 80 },
    { label: '(Re)Assoc Resp + FT IE', fromClient: false, y: 150 },
    { label: 'Data resumed', fromClient: true, y: 220 },
  ],
};

function ProtocolGuide() {
  const [seq, setSeq] = useState<FrameSeq>('Association');
  const arrows = FRAME_SEQUENCES[seq];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-panel p-4 space-y-2">
          <p className="text-sm font-semibold text-white mb-3">Essential Wireshark Filters</p>
          {WS_FILTERS.map((row) => (
            <div key={row.filter} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5 border-b border-slate-800/60 last:border-0">
              <span className="text-xs text-slate-400 sm:w-36 shrink-0">{row.desc}</span>
              <code className="font-mono text-xs text-cyan-300 bg-slate-900/70 px-2 py-0.5 rounded">{row.filter}</code>
            </div>
          ))}
        </div>

        <div className="glass-panel p-4">
          <p className="text-sm font-semibold text-white mb-3">Frame Sequence Diagram</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(Object.keys(FRAME_SEQUENCES) as FrameSeq[]).map((s) => (
              <button
                key={s}
                onClick={() => setSeq(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  seq === s
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.svg
              key={seq}
              viewBox="0 0 420 280"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <line x1="80" y1="20" x2="80" y2="270" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 3" />
              <line x1="340" y1="20" x2="340" y2="270" stroke="#10b981" strokeWidth="2" strokeDasharray="4 3" />
              <text x="80" y="14" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">Client</text>
              <text x="340" y="14" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">AP</text>

              {arrows.map((arrow, i) => {
                const x1 = arrow.fromClient ? 90 : 330;
                const x2 = arrow.fromClient ? 330 : 90;
                const mx = (x1 + x2) / 2;
                return (
                  <motion.g
                    key={`${seq}-${i}`}
                    initial={{ opacity: 0, x: arrow.fromClient ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.25 }}
                  >
                    <line x1={x1} y1={arrow.y} x2={x2} y2={arrow.y} stroke="#94a3b8" strokeWidth="1.5"
                      markerEnd="url(#arrow)" />
                    <text x={mx} y={arrow.y - 5} textAnchor="middle" fill="#e2e8f0" fontSize="10">
                      {arrow.label}
                    </text>
                  </motion.g>
                );
              })}

              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
                </marker>
              </defs>
            </motion.svg>
          </AnimatePresence>
        </div>
      </div>

      <div className="glass-panel p-4">
        <ModeContent
          content={{
            kid: 'Wireshark is like a net that catches every message flying through the air. You can read what computers are saying to each other!',
            enthusiast: 'Protocol analysis lets you see exactly what is happening on the wire. Display filters narrow the capture to only the frames you care about — saving hours of debugging.',
            pro: 'For CWAP, master the 802.11 frame format: FC field (type/subtype/retry/PMF), HT/VHT/HE capabilities IEs, and EAPOL key exchange. In production, always capture on-channel using a monitor-mode NIC or the AP\'s built-in PCAP engine.',
          }}
          className="text-xs text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}

interface KPI {
  name: string;
  icon: string;
  unit: string;
  initial: number;
  spike: number;
  max: number;
  thresholds: [number, number];
  higherIsBetter: boolean;
}

const KPIS: KPI[] = [
  { name: 'Retry Rate', icon: '🔄', unit: '%', initial: 8, spike: 35, max: 100, thresholds: [10, 20], higherIsBetter: false },
  { name: 'Average MCS', icon: '📶', unit: '', initial: 9, spike: 3, max: 11, thresholds: [4, 7], higherIsBetter: true },
  { name: 'Channel Utilization', icon: '📡', unit: '%', initial: 35, spike: 78, max: 100, thresholds: [40, 70], higherIsBetter: false },
  { name: 'PHY Error Rate', icon: '⚠️', unit: '%', initial: 0.8, spike: 6, max: 15, thresholds: [2, 5], higherIsBetter: false },
  { name: 'Clients per AP', icon: '👥', unit: '', initial: 18, spike: 62, max: 100, thresholds: [25, 50], higherIsBetter: false },
  { name: 'Roam Success Rate', icon: '🔀', unit: '%', initial: 97, spike: 84, max: 100, thresholds: [90, 95], higherIsBetter: true },
];

function kpiStatus(kpi: KPI, value: number): { label: string; color: string } {
  const [warn, crit] = kpi.thresholds;
  if (kpi.higherIsBetter) {
    if (value > crit) return { label: 'Excellent', color: '#10b981' };
    if (value >= warn) return { label: 'Warning', color: '#f59e0b' };
    return { label: 'Critical', color: '#ef4444' };
  } else {
    if (value < warn) return { label: 'Excellent', color: '#10b981' };
    if (value <= crit) return { label: 'Warning', color: '#f59e0b' };
    return { label: 'Critical', color: '#ef4444' };
  }
}

function KPIDashboard() {
  const [spiked, setSpiked] = useState<boolean>(false);

  const values = KPIS.map((k) => (spiked ? k.spike : k.initial));

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        <button
          onClick={() => setSpiked(true)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
            spiked
              ? 'bg-red-500/30 border-red-400 text-red-200'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-red-500/50'
          }`}
        >
          ⚡ Simulate Load Spike
        </button>
        <button
          onClick={() => setSpiked(false)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
            !spiked
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-emerald-500/50'
          }`}
        >
          ↺ Reset
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {KPIS.map((kpi, i) => {
          const value = values[i];
          const { label, color } = kpiStatus(kpi, value);
          const pct = (value / kpi.max) * 100;

          return (
            <div key={kpi.name} className="glass-panel p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base">{kpi.icon}</span>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded border"
                  style={{ color, borderColor: color + '50', background: color + '15' }}
                >
                  {label}
                </span>
              </div>
              <p className="text-xs text-slate-400">{kpi.name}</p>
              <motion.p
                key={`${kpi.name}-${value}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xl font-bold tabular-nums"
                style={{ color }}
              >
                {value}{kpi.unit}
              </motion.p>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, type: 'spring', stiffness: 100, damping: 18 }}
                />
              </div>
              <p className="text-xs text-slate-600">
                warn &gt; {kpi.thresholds[0]}{kpi.unit} / crit &gt; {kpi.thresholds[1]}{kpi.unit}
              </p>
            </div>
          );
        })}
      </div>

      <div className="glass-panel p-4">
        <ModeContent
          content={{
            kid: 'These numbers tell you if your Wi-Fi is healthy or sick. Green means great, red means something needs fixing!',
            enthusiast: 'KPI dashboards give you a real-time health snapshot. Retry rate and channel utilization are the first indicators of a congested network.',
            pro: 'CWAP-aligned KPI targets: retry < 10%, channel utilization < 70%, SNR > 25 dB for VoIP (MOS > 4). Roam success < 95% warrants 802.11r/k/v audit. Correlate MCS distribution histograms with client density and AP placement reviews.',
          }}
          className="text-xs text-slate-400 leading-relaxed"
        />
      </div>
    </div>
  );
}

const CH10_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Methodology':       ['methodology'],
  'Spectrum Analysis': ['spectrum'],
  'Common Issues':     ['issues', 'roaming_ts', 'security_ts'],
  'Protocol Analysis': ['protocol'],
  'Performance KPIs':  ['metrics', 'tools'],
};

export function Chapter10() {
  const { markComplete } = useApp();
  const [tab, setTab] = useState<Tab>('Methodology');

  useEffect(() => {
    CH10_TAB_SUBTOPICS[tab].forEach(id => markComplete('ch10', id));
  }, [tab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <ChapterHeader chapter={CHAPTER} description="CWAP-aligned troubleshooting: spectrum analysis, protocol capture, common WLAN issues, performance KPIs and vendor tool workflows." />

      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              tab === t
                ? 'border-band5 text-band5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {tab === 'Methodology' && <TroubleshootingSteps />}
          {tab === 'Spectrum Analysis' && <SpectrumDisplay />}
          {tab === 'Common Issues' && <IssuesBrowser />}
          {tab === 'Protocol Analysis' && <ProtocolGuide />}
          {tab === 'Performance KPIs' && <KPIDashboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
