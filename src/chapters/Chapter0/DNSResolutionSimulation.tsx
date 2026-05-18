import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModeContent } from '../../components/shared/ModeContent';
import type { AudienceMode } from '../../types';

interface DnsStep {
  id: string;
  from: string;
  to: string;
  query: string;
  response: string;
  color: string;
  icon: string;
  title: Record<AudienceMode, string>;
  detail: Record<AudienceMode, string>;
}

const DNS_STEPS: DnsStep[] = [
  {
    id: 'local-cache',
    from: 'browser', to: 'os-cache',
    query: 'google.com?', response: 'Not in cache',
    color: '#06b6d4', icon: '🔍',
    title: {
      kid:        '🔍 Check your memory first — "Did I visit this before?"',
      enthusiast: 'Browser/OS checks its local DNS cache before asking anyone else',
      pro:        'Resolver checks OS stub resolver cache (TTL-valid entries in /etc/hosts and system cache)',
    },
    detail: {
      kid:        'Before asking anyone for help, your computer checks its own memory: "Have I looked up this website before?" If yes, it uses the saved answer — super fast! If not, it has to ask around.',
      enthusiast: 'Your browser first checks its own mini-cache, then asks the operating system\'s DNS cache. These caches store recent lookups for a short time (called TTL). No luck here — google.com\'s answer has expired, so we continue.',
      pro:        'The stub resolver in the OS checks the local DNS cache. Each record has a TTL (Time-to-Live). If a matching A/AAAA record exists with TTL > 0, it\'s returned immediately. On cache miss, query forwarded to the configured recursive resolver (typically via DHCP Option 6).',
    },
  },
  {
    id: 'recursive',
    from: 'os-cache', to: 'recursive-resolver',
    query: 'google.com?', response: 'Let me find out...',
    color: '#a855f7', icon: '📡',
    title: {
      kid:        '📡 Ask your "Internet Library" — the resolver',
      enthusiast: 'Your request goes to your ISP or router\'s DNS resolver server',
      pro:        'Stub resolver queries the recursive resolver (ISP or 8.8.8.8) — initiates iterative lookup',
    },
    detail: {
      kid:        'Your computer asks the neighborhood "Internet Library" — a special computer called a DNS Resolver (usually run by your internet provider). This librarian is GREAT at finding addresses for any website in the world!',
      enthusiast: 'Your device\'s DNS query hits a recursive resolver — this is usually your ISP\'s DNS server or a public one like Google (8.8.8.8) or Cloudflare (1.1.1.1). This resolver is the workhorse: it knows how to ask the right questions to find any domain in the world.',
      pro:        'The recursive resolver receives a standard DNS query (UDP or TCP port 53) for "google.com" A record. If not in its cache, it begins an iterative resolution: query root name servers → get NS records for .com TLD → query TLD server → get NS records for google.com → query authoritative server.',
    },
  },
  {
    id: 'root',
    from: 'recursive-resolver', to: 'root-server',
    query: 'Who handles .com?', response: '.com → a.gtld-servers.net',
    color: '#f59e0b', icon: '🌍',
    title: {
      kid:        '🌍 Ask the "World Boss" — Root Servers know everything',
      enthusiast: 'The resolver asks a Root Server: "Who\'s in charge of .com domains?"',
      pro:        'Recursive resolver queries a Root Name Server (one of 13 clusters, e.g., a.root-servers.net) for the .com TLD NS delegation',
    },
    detail: {
      kid:        'The librarian goes to the "World Boss" — 13 giant computers around the world called Root Servers. They don\'t know google.com\'s address, but they know who is in charge of all ".com" websites. They point to the ".com office"!',
      enthusiast: 'Root servers are the top of the DNS hierarchy — there are 13 root server clusters worldwide. The resolver asks: "Who handles .com?" The root server responds: "Ask the .com TLD servers at a.gtld-servers.net!" It delegates to the next level.',
      pro:        'Root servers return NS (Name Server) records and glue A records for the .com TLD operator (Verisign). Response: "NS a.gtld-servers.net, NS b.gtld-servers.net" with glue records for their IPs. DNSSEC: Root Zone is signed; DS records for .com TLD are included.',
    },
  },
  {
    id: 'tld',
    from: 'root-server', to: 'tld-server',
    query: 'Who handles google.com?', response: 'google.com → ns1.google.com',
    color: '#10b981', icon: '🏢',
    title: {
      kid:        '🏢 The ".com Office" — Points to Google\'s own phone book',
      enthusiast: 'The TLD server for .com knows which servers Google registered to answer for them',
      pro:        'TLD (gTLD) server returns NS delegation records pointing to Google\'s authoritative name servers',
    },
    detail: {
      kid:        'The ".com Office" is like a giant phone directory just for ".com" websites. It doesn\'t know google.com\'s exact address either, but it knows which phone book GOOGLE uses! It points to Google\'s own address book.',
      enthusiast: 'The .com TLD server (run by Verisign) has a record for every .com domain registered. It looks up "google.com" and says: "Google has registered their own name servers: ns1.google.com, ns2.google.com — ask them!" One more hop to go!',
      pro:        'The gTLD server returns NS records for google.com: "ns1.google.com, ns2.google.com, ns3.google.com, ns4.google.com" with glue A records. These are the authoritative name servers (ANS) registered by Google via their domain registrar. The resolver now queries one of these.',
    },
  },
  {
    id: 'authoritative',
    from: 'tld-server', to: 'auth-server',
    query: 'What is google.com\'s IP?', response: '142.250.80.46',
    color: '#06b6d4', icon: '🎯',
    title: {
      kid:        '🎯 Google\'s own phone book gives the final answer!',
      enthusiast: 'Google\'s own DNS server gives the definitive IP address — 142.250.80.46!',
      pro:        'Authoritative Name Server returns the A record (IPv4) and/or AAAA record (IPv6) for google.com',
    },
    detail: {
      kid:        'Finally! Google\'s own phone book (their Authoritative DNS Server) looks up "google.com" and says "The address is 142.250.80.46!" This is the real home address for Google\'s website. Now your browser can knock on that door!',
      enthusiast: 'Google\'s authoritative DNS server (ns1.google.com) knows exactly where google.com lives. It returns the A record: 142.250.80.46. The entire lookup chain took maybe 20-100 milliseconds. Your browser now has the IP and can establish a TCP connection to google.com.',
      pro:        'The authoritative server returns SOA + A record: "google.com A 142.250.80.46 TTL=300" and optionally AAAA "2607:f8b0:4004:c1b::71" for IPv6. DNSSEC: RRSIG signature validates authenticity. The recursive resolver caches this response per TTL, returns it to the stub resolver which passes it to the application.',
    },
  },
];

// Node positions in SVG 700×220
const NODE_POS = {
  'browser':            { x: 60,  y: 110, label: 'Your Browser', icon: '🌐' },
  'os-cache':           { x: 160, y: 110, label: 'OS DNS Cache',  icon: '💾' },
  'recursive-resolver': { x: 280, y: 110, label: 'DNS Resolver',  icon: '📡' },
  'root-server':        { x: 420, y: 50,  label: 'Root Server',   icon: '🌍' },
  'tld-server':         { x: 560, y: 50,  label: '.com TLD',      icon: '🏢' },
  'auth-server':        { x: 640, y: 110, label: 'google.com NS', icon: '🎯' },
} as const;

type NodeId = keyof typeof NODE_POS;

export function DNSResolutionSimulation() {
  const { mode, markComplete } = useApp();
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [url, setUrl]               = useState('google.com');
  const [resolved, setResolved]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveStep(-1);
    setIsPlaying(false);
    setResolved(false);
  }, []);

  const runStep = useCallback((idx: number) => {
    if (idx >= DNS_STEPS.length) {
      setIsPlaying(false);
      setResolved(true);
      markComplete('ch0', 'dns');
      return;
    }
    setActiveStep(idx);
    timerRef.current = setTimeout(() => runStep(idx + 1), 1800);
  }, [markComplete]);

  const handlePlay = useCallback(() => {
    reset();
    setIsPlaying(true);
    timerRef.current = setTimeout(() => runStep(0), 300);
  }, [reset, runStep]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const currentStep = activeStep >= 0 && activeStep < DNS_STEPS.length ? DNS_STEPS[activeStep] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-wired">DNS</span> — The Internet Phonebook
          </h3>
          <ModeContent
            content={{
              kid:        'See how typing "google.com" magically finds the right address on the internet!',
              enthusiast: 'Watch the full DNS resolution chain that happens every time you type a website name.',
              pro:        'Full iterative DNS resolution: Stub → Recursive → Root → gTLD → Authoritative NS delegation chain.',
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
            {isPlaying ? 'Resolving…' : 'Resolve DNS'}
          </button>
        </div>
      </div>

      {/* Fake browser bar */}
      <div className="glass-panel px-4 py-2.5 flex items-center gap-3 border-glow-amber">
        <Globe size={16} className="text-slate-500 flex-shrink-0" />
        <div className="flex-1 flex items-center gap-2">
          <span className="text-slate-600 text-sm">https://</span>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none font-mono"
            placeholder="type a domain..."
          />
        </div>
        {resolved && (
          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-mono text-emerald-400"
          >
            → 142.250.80.46
          </motion.span>
        )}
      </div>

      {/* DNS Resolution flow SVG */}
      <div className="glass-panel p-4 border-glow-amber overflow-x-auto">
        <svg viewBox="0 0 700 175" className="w-full min-w-[500px]" style={{ maxHeight: 175 }}>
          <defs>
            <marker id="arrow-dns" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="rgba(245,158,11,0.7)" />
            </marker>
          </defs>

          {/* Connection lines */}
          {[
            { x1: 90, y1: 110, x2: 130, y2: 110 },
            { x1: 190, y1: 110, x2: 250, y2: 110 },
            { x1: 310, y1: 100, x2: 390, y2: 65 },
            { x1: 450, y1: 50, x2: 530, y2: 50 },
            { x1: 590, y1: 65, x2: 615, y2: 95 },
          ].map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="rgba(245,158,11,0.25)" strokeWidth="1.5" strokeDasharray="5 3"
              markerEnd="url(#arrow-dns)" />
          ))}

          {/* Nodes */}
          {(Object.entries(NODE_POS) as [NodeId, typeof NODE_POS[NodeId]][]).map(([key, node]) => {
            const isActive =
              currentStep !== null &&
              (currentStep.from === key || currentStep.to === key);
            return (
              <g key={key} transform={`translate(${node.x}, ${node.y})`}>
                <motion.circle
                  r="26"
                  fill={isActive ? 'rgba(245,158,11,0.15)' : 'rgba(15,23,42,0.8)'}
                  stroke={isActive ? '#f59e0b' : 'rgba(100,116,139,0.4)'}
                  strokeWidth={isActive ? 2 : 1.5}
                  animate={{ scale: isActive ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                />
                <text textAnchor="middle" dominantBaseline="central" fontSize="16">{node.icon}</text>
                <text textAnchor="middle" y="38" fill="#94a3b8" fontSize="8" fontFamily="Inter, sans-serif">
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* Travelling query label */}
          {currentStep && (
            <AnimatePresence mode="wait">
              <motion.g
                key={`q-${activeStep}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {(() => {
                  const from = NODE_POS[currentStep.from as NodeId];
                  const to   = NODE_POS[currentStep.to as NodeId];
                  const mx   = (from.x + to.x) / 2;
                  const my   = (from.y + to.y) / 2 - 16;
                  return (
                    <motion.text
                      x={mx} y={my}
                      textAnchor="middle"
                      fill={currentStep.color}
                      fontSize="7.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="600"
                      animate={{ y: [my - 2, my + 2, my - 2] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {currentStep.query}
                    </motion.text>
                  );
                })()}
              </motion.g>
            </AnimatePresence>
          )}
        </svg>
      </div>

      {/* Step pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {DNS_STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => !isPlaying && setActiveStep(i)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              activeStep === i
                ? 'border-opacity-60 text-white'
                : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
            } whitespace-nowrap flex-shrink-0`}
            style={activeStep === i ? { borderColor: step.color, background: step.color + '18', color: step.color } : {}}
          >
            <span>{step.icon}</span>
            <span>{i + 1}. {step.id.replace(/-/g, ' ')}</span>
            {activeStep > i && <span className="text-emerald-400">✓</span>}
          </button>
        ))}
      </div>

      {/* Step detail panel */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={`dns-${activeStep}-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="glass-panel p-5 border"
            style={{ borderColor: currentStep.color + '40' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: currentStep.color + '18', border: `1px solid ${currentStep.color}40` }}
              >
                {currentStep.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white text-sm">{currentStep.title[mode]}</h4>
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${activeStep}-detail-${mode}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-slate-400 leading-relaxed"
                  >
                    {currentStep.detail[mode]}
                  </motion.p>
                </AnimatePresence>
                {/* Query / Response tags */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="chip border text-xs" style={{ color: currentStep.color, borderColor: currentStep.color + '40', background: currentStep.color + '15' }}>
                    Query: {currentStep.query}
                  </span>
                  <span className="chip border border-slate-600 text-slate-400 bg-surface-600/40 text-xs">
                    Reply: {currentStep.response}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final resolution banner */}
      <AnimatePresence>
        {resolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3"
          >
            <span className="text-2xl">🌐</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">DNS Resolved! Connecting to {url}…</p>
              <ModeContent
                content={{
                  kid:        '"google.com" = House number 142.250.80.46 — your browser is knocking on Google\'s door right now! 🚪',
                  enthusiast: 'IP found (142.250.80.46). Your browser now opens a TCP connection → TLS handshake → HTTP request. You\'ll see google.com in milliseconds!',
                  pro:        'A record 142.250.80.46 cached for TTL=300s. TCP SYN → TCP SYNACK → TLS ClientHello → server cert validation → HTTP/2 ALPN negotiation. Full TTFB typically 30-100ms on a warm path.',
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
