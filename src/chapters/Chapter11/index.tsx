import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch11')!;

const TABS = ['802.1X / EAP', 'CAPWAP & Tunnels', 'VxLAN', 'IPSec', 'EoGRE & Overlay'] as const;
type Tab = typeof TABS[number];

const CH11_TAB_SUBTOPICS: Record<Tab, string[]> = {
  '802.1X / EAP':    ['dot1x_flow', 'eap_methods', 'wpa3_ent'],
  'CAPWAP & Tunnels':['capwap', 'l2_tunnel', 'l3_tunnel'],
  'VxLAN':           ['vxlan'],
  'IPSec':           ['ipsec'],
  'EoGRE & Overlay': ['vxlan_ipsec', 'eogre'],
};

// ─── Shared helpers ───────────────────────────────────────────────────────────

type ActorKey = 'sup' | 'ap' | 'radius' | 'ctrl' | 'vtep1' | 'vtep2' | 'ike';

const ACTOR_X: Record<ActorKey, number> = {
  sup: 70, ap: 230, radius: 390, ctrl: 390, vtep1: 90, vtep2: 410, ike: 310,
};

interface LadderStep {
  from: ActorKey;
  to: ActorKey;
  label: string;
  sublabel?: string;
  color: string;
}

function useLadderAnim(steps: LadderStep[], onDone?: () => void) {
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reset = useCallback(() => { clearTimers(); setStep(-1); setPlaying(false); }, [clearTimers]);

  const play = useCallback(() => {
    reset();
    setPlaying(true);
    steps.forEach((_, i) => {
      const t = setTimeout(() => {
        setStep(i);
        if (i === steps.length - 1) { setPlaying(false); onDone?.(); }
      }, (i + 1) * 1100);
      timers.current.push(t);
    });
  }, [reset, steps, onDone]);

  useEffect(() => () => clearTimers(), [clearTimers]);
  return { step, playing, play, reset };
}

interface LadderSVGProps {
  actors: { key: ActorKey; label: string; icon: string; color: string }[];
  steps: LadderStep[];
  step: number;
  height?: number;
}

function LadderSVG({ actors, steps, step, height = 260 }: LadderSVGProps) {
  const rowGap = Math.min(36, (height - 70) / Math.max(steps.length, 1));
  return (
    <div className="bg-surface-900/70 rounded-xl overflow-hidden">
      <svg viewBox={`0 0 500 ${height}`} className="w-full" style={{ maxHeight: height }}>
        <defs>
          {['#06b6d4','#a855f7','#10b981','#f59e0b','#ef4444','#38bdf8'].map(c => (
            <marker key={c} id={`arr-${c.replace('#','')}`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* Timeline guide lines */}
        {actors.map(a => (
          <line key={a.key} x1={ACTOR_X[a.key]} y1={48} x2={ACTOR_X[a.key]} y2={height - 10}
            stroke="rgba(100,116,139,0.2)" strokeWidth="1" strokeDasharray="4 3" />
        ))}

        {/* Actor nodes */}
        {actors.map(a => (
          <g key={a.key} transform={`translate(${ACTOR_X[a.key]},28)`}>
            <circle r="20" fill="rgba(15,23,42,0.9)" stroke={a.color} strokeWidth="1.5" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="12">{a.icon}</text>
            <text textAnchor="middle" y="30" fill="#94a3b8" fontSize="7.5" fontFamily="Inter">{a.label}</text>
          </g>
        ))}

        {/* Animated steps */}
        {steps.slice(0, step + 1).map((s, i) => {
          const x1 = ACTOR_X[s.from];
          const x2 = ACTOR_X[s.to];
          const y = 70 + i * rowGap;
          const goRight = x2 > x1;
          const mx = (x1 + x2) / 2;
          const marker = `url(#arr-${s.color.replace('#','')})`;
          return (
            <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
              <line x1={goRight ? x1 + 22 : x1 - 22} y1={y} x2={goRight ? x2 - 22 : x2 + 22} y2={y}
                stroke={s.color} strokeWidth="1.5"
                markerEnd={goRight ? marker : undefined}
                markerStart={!goRight ? `url(#arr-${s.color.replace('#','')})` : undefined} />
              <text x={mx} y={y - 5} textAnchor="middle" fill={s.color} fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="600">
                {s.label}
              </text>
              {s.sublabel && (
                <text x={mx} y={y + 10} textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="Inter">{s.sublabel}</text>
              )}
              {/* Moving packet dot */}
              {i === step && (
                <motion.circle r="4" fill={s.color}
                  initial={{ cx: goRight ? x1 + 22 : x1 - 22, cy: y }}
                  animate={{ cx: goRight ? x2 - 22 : x2 + 22, cy: y }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }} />
              )}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── TAB 1: 802.1X / EAP ─────────────────────────────────────────────────────

const EAP_ACTORS = [
  { key: 'sup'    as ActorKey, label: 'Supplicant (STA)', icon: '💻', color: '#06b6d4' },
  { key: 'ap'     as ActorKey, label: 'Authenticator (AP)', icon: '📡', color: '#a855f7' },
  { key: 'radius' as ActorKey, label: 'Auth Server (RADIUS)', icon: '🏛️', color: '#f59e0b' },
];

const DOT1X_STEPS: LadderStep[] = [
  { from: 'sup',    to: 'ap',     label: 'EAPOL-Start',                sublabel: 'Supplicant initiates', color: '#06b6d4' },
  { from: 'ap',     to: 'sup',    label: 'EAP-Request / Identity',     sublabel: 'AP challenges client', color: '#a855f7' },
  { from: 'sup',    to: 'ap',     label: 'EAP-Response / Identity',    sublabel: 'user@realm', color: '#06b6d4' },
  { from: 'ap',     to: 'radius', label: 'RADIUS Access-Request',      sublabel: 'EAP-Message attr + NAS-IP', color: '#f59e0b' },
  { from: 'radius', to: 'ap',     label: 'RADIUS Access-Challenge',    sublabel: 'EAP-TLS: ServerHello+Cert / PEAP: TLS tunnel', color: '#f59e0b' },
  { from: 'ap',     to: 'sup',    label: 'EAP-Request (Method)',       sublabel: 'Begin TLS/PEAP/TTLS handshake', color: '#a855f7' },
  { from: 'sup',    to: 'ap',     label: 'EAP-Response (Credentials)', sublabel: 'TLS cert / MSCHAPv2 / password (tunneled)', color: '#06b6d4' },
  { from: 'ap',     to: 'radius', label: 'RADIUS Access-Request',      sublabel: 'Forwarded EAP-Response', color: '#f59e0b' },
  { from: 'radius', to: 'ap',     label: 'RADIUS Access-Accept + MSK', sublabel: 'PMK = MSK[0:32] delivered', color: '#10b981' },
  { from: 'ap',     to: 'sup',    label: 'EAP-Success',                sublabel: 'Controlled port AUTHORIZED', color: '#10b981' },
  { from: 'sup',    to: 'ap',     label: 'EAPOL-Key (ANonce →)',       sublabel: '4-Way Handshake begins', color: '#38bdf8' },
  { from: 'ap',     to: 'sup',    label: 'EAPOL-Key (← SNonce+MIC)',   sublabel: 'PTK derived both sides', color: '#38bdf8' },
  { from: 'sup',    to: 'ap',     label: 'EAPOL-Key (GTK+MIC →)',      sublabel: 'GTK installed', color: '#38bdf8' },
  { from: 'ap',     to: 'sup',    label: 'EAPOL-Key (← ACK)',          sublabel: '✅ CCMP/GCMP active', color: '#38bdf8' },
];

const EAP_METHODS = [
  {
    name: 'EAP-TLS', security: '⭐⭐⭐⭐⭐', color: '#10b981',
    auth: 'Mutual cert (client + server)',
    cred: 'X.509 certificates',
    tunnel: 'No inner tunnel — certs ARE the proof',
    use: 'High-security enterprise, smart cards, MDM',
    kid: '🏅 The gold standard! Both you AND the server show certificates — like two people proving their ID cards to each other simultaneously.',
    enthusiast: 'EAP-TLS uses mutual certificate authentication. Client needs a cert issued by the org\'s CA (deployed via MDM/SCEP). No passwords — strongest protection against credential theft.',
    pro: 'RFC 5216. TLS 1.2/1.3 handshake: ServerHello+Cert+CertRequest → ClientCert+ClientKeyExchange+CertVerify. MSK derived from TLS PRF. No inner method. Requires PKI infrastructure (CA, OCSP/CRL). TEAP (RFC 7170) adds inner auth for machine+user cert in one tunnel.',
  },
  {
    name: 'PEAP/MSCHAPv2', security: '⭐⭐⭐', color: '#06b6d4',
    auth: 'Server cert + password (inside TLS)',
    cred: 'Username + password',
    tunnel: 'Outer TLS (server cert) → inner MSCHAPv2',
    use: 'Most common enterprise, AD/LDAP integration',
    kid: '🔒 First the server shows its certificate (creates a safe tunnel), THEN your password travels inside that locked tunnel — no one can see your password!',
    enthusiast: 'PEAP creates a TLS tunnel using the server\'s certificate, then sends MSCHAPv2 credentials inside. Widely used because it only requires a server cert (not per-user certs). Works with Active Directory.',
    pro: 'PEAP v0/v1 (Cisco/MS). Outer: TLS ClientHello → ServerHello+Cert → ChangeCipherSpec. Inner: EAP-MSCHAPv2 (NT Hash of password). MSK = first 64B of TLS PRF output. Vulnerabilities: MS-CHAPv2 susceptible to offline dictionary attack if server cert not validated. PEAP+GTC: inner generic token for OTP/RSA SecurID.',
  },
  {
    name: 'EAP-TTLS', security: '⭐⭐⭐⭐', color: '#a855f7',
    auth: 'Server cert + any inner auth',
    cred: 'Password, PAP, CHAP, MSCHAPv2, or EAP',
    tunnel: 'Outer TLS (server cert) → inner PAP/CHAP/EAP',
    use: 'Linux/non-Windows clients, legacy systems',
    kid: '🔐 Like PEAP but more flexible! Once the secure tunnel is up, you can use almost ANY way to prove your identity inside it — password, OTP, or other methods.',
    enthusiast: 'EAP-TTLS is more flexible than PEAP — the inner auth can be PAP, CHAP, MSCHAPv2, or another EAP method. Common with Linux supplicants and systems using legacy auth backends.',
    pro: 'RFC 5281. Outer TLS tunnel identical to PEAP. AVP (Attribute-Value Pair) based inner auth using RADIUS-compatible attributes. Supports PAP (plain password in tunnel — secure since outer TLS), CHAP, MS-CHAP, MS-CHAPv2. Inner EAP possible (EAP-TTLS with inner EAP-MD5/GTC). Widely supported by FreeRADIUS, Cisco ISE, Aruba ClearPass.',
  },
  {
    name: 'EAP-FAST', security: '⭐⭐⭐⭐', color: '#f59e0b',
    auth: 'PAC (Protected Access Credential) + inner auth',
    cred: 'PAC file (pre-provisioned) + password/cert',
    tunnel: 'TLS tunnel via PAC (no server cert required)',
    use: 'Cisco environments, no PKI needed',
    kid: '🎫 EAP-FAST is like having a VIP backstage pass (PAC) instead of a certificate. Your device gets a special pass file from the RADIUS server, then uses it to create the secure tunnel!',
    enthusiast: 'Cisco\'s alternative to PEAP — uses a PAC (Protected Access Credential) to establish a TLS tunnel without needing server certificates. The PAC is provisioned in Phase 0 (automatically or manually). Simpler PKI requirements.',
    pro: 'RFC 4851. Phase 0 (PAC provisioning): automatic (anonymous TLS) or manual distribution of PAC file. PAC = opaque encrypted blob containing master key. Phase 1: TLS tunnel using PAC (TLS-PSK). Phase 2: inner EAP (GTC/MSCHAPv2) or certificate. Cisco proprietary → now standardized as TEAP (RFC 7170 = EAP-FAST successor with IETF blessing). Vulnerabilities: PAC theft; automatic PAC provisioning susceptible to MITM.',
  },
];

function EAPTab() {
  const { mode, markComplete } = useApp();
  const [selectedMethod, setSelectedMethod] = useState(EAP_METHODS[0]);
  const onDone = useCallback(() => markComplete('ch11', 'dot1x_flow'), [markComplete]);
  const { step, playing, play, reset } = useLadderAnim(DOT1X_STEPS, onDone);

  return (
    <div className="space-y-6">
      {/* 802.1X Full Flow */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">802.1X / EAP Full Authentication Flow</h3>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
            <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
              <Play size={12} fill="currentColor" /> {playing ? 'Running…' : 'Animate'}
            </button>
          </div>
        </div>
        <LadderSVG actors={EAP_ACTORS} steps={DOT1X_STEPS} step={step} height={280} />
        <AnimatePresence mode="wait">
          {step >= 0 && (
            <motion.div key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-panel p-3 border text-xs text-slate-400 leading-relaxed"
              style={{ borderColor: DOT1X_STEPS[step].color + '40' }}>
              <span className="font-bold" style={{ color: DOT1X_STEPS[step].color }}>
                Step {step + 1}/{DOT1X_STEPS.length}: {DOT1X_STEPS[step].label}
              </span>
              {DOT1X_STEPS[step].sublabel && <span className="ml-2 text-slate-500">— {DOT1X_STEPS[step].sublabel}</span>}
            </motion.div>
          )}
        </AnimatePresence>
        {step === DOT1X_STEPS.length - 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-panel p-3 border border-emerald-500/40 bg-emerald-500/10 text-center">
            <p className="text-emerald-400 font-bold text-sm">🔐 802.1X + 4-Way HS complete — CCMP/GCMP active, port AUTHORIZED</p>
            <ModeContent content={{
              kid: 'You\'re in! The Wi-Fi checked your ID, gave you your own secret key, and now all your data is locked so only you and the router can read it!',
              enthusiast: 'Full 802.1X flow: EAPOL identity → RADIUS EAP exchange → Access-Accept + MSK → PMK derived → 4-Way Handshake → PTK/GTK installed. Enterprise Wi-Fi complete.',
              pro: 'PMK = MSK[0:32] (256-bit). PTK = PRF-512(PMK, nonces, MACs). KCK[0:128], KEK[128:256], TK[256:384]. GTK wrapped in KEK (AES key wrap). PMKID cached for future association (PMKSA).',
            }} className="text-xs text-slate-400 mt-1" />
          </motion.div>
        )}
      </div>

      {/* EAP Methods */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <h3 className="font-bold text-white">EAP Methods Comparison</h3>
        <div className="flex gap-2 flex-wrap">
          {EAP_METHODS.map(m => (
            <button key={m.name} onClick={() => setSelectedMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedMethod.name === m.name ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={selectedMethod.name === m.name ? { borderColor: m.color + '60', background: m.color + '20', color: m.color } : {}}>
              {m.name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={selectedMethod.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[{ l: 'Security', v: selectedMethod.security }, { l: 'Auth Type', v: selectedMethod.auth },
                { l: 'Credentials', v: selectedMethod.cred }, { l: 'Use Case', v: selectedMethod.use }].map(f => (
                <div key={f.l} className="bg-surface-900/60 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">{f.l}</p>
                  <p className="text-xs font-semibold" style={{ color: selectedMethod.color }}>{f.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-900/60 rounded-xl p-3 border" style={{ borderColor: selectedMethod.color + '30' }}>
              <p className="text-xs text-slate-400 leading-relaxed">{selectedMethod[mode]}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* WPA3 Enterprise */}
      <div className="glass-panel p-5 border-glow-purple space-y-3">
        <h3 className="font-bold text-white">WPA3-Enterprise — Suite-B 192-bit</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[{ label: 'WPA2-Enterprise', cipher: 'CCMP-128 (AES)', pmf: 'Optional', eap: 'Any EAP', suite: '—', color: '#06b6d4' },
            { label: 'WPA3-Enterprise', cipher: 'GCMP-256 (AES-256)', pmf: 'Mandatory', eap: 'EAP-TLS (cert required)', suite: 'Suite-B 192-bit', color: '#10b981' }].map(r => (
            <div key={r.label} className="bg-surface-900/60 rounded-xl p-4 border" style={{ borderColor: r.color + '40' }}>
              <p className="font-bold text-sm mb-3" style={{ color: r.color }}>{r.label}</p>
              {[['Cipher', r.cipher], ['PMF', r.pmf], ['EAP Method', r.eap], ['Crypto Suite', r.suite]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-semibold text-slate-300">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <ModeContent content={{
          kid: '🛡️ WPA3-Enterprise is like changing from a padlock to a bank vault! It uses 256-bit encryption (twice as strong as WPA2) and requires BOTH sides to have digital certificates — perfect for government and military networks.',
          enthusiast: 'WPA3-Enterprise mandates GCMP-256, EAP-TLS with 384-bit elliptic curve certificates, and mandatory PMF. Suite-B 192-bit = NSA Commercial National Security Algorithm Suite — required for classified US government Wi-Fi.',
          pro: 'WPA3-Enterprise Suite-B-192: GCMP-256 (AEAD), ECDHE-384 for key agreement, ECDSA-384 for certificates, SHA-384 HMAC, SuiteB-192 AKM (suite selector 00-0F-AC:12). CNSA (Commercial National Security Algorithm): P-384, AES-256, SHA-384. PMF Required (MFPR bit set). EAP-TLS with P-384 or RSA-3072 minimum. GCMP-256 uses AES-GCM with 256-bit key, 128-bit auth tag.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── TAB 2: CAPWAP & Tunnels ──────────────────────────────────────────────────

const CAPWAP_ACTORS = [
  { key: 'ap'   as ActorKey, label: 'Lightweight AP', icon: '📡', color: '#06b6d4' },
  { key: 'ctrl' as ActorKey, label: 'WLC / Controller', icon: '🖥️', color: '#a855f7' },
];

const CAPWAP_STEPS: LadderStep[] = [
  { from: 'ap',   to: 'ctrl', label: 'Discovery Request',     sublabel: 'UDP 5246 — AP finds WLC', color: '#06b6d4' },
  { from: 'ctrl', to: 'ap',   label: 'Discovery Response',    sublabel: 'WLC announces capability', color: '#a855f7' },
  { from: 'ap',   to: 'ctrl', label: 'Join Request (DTLS)',   sublabel: 'DTLS handshake — mutual auth', color: '#06b6d4' },
  { from: 'ctrl', to: 'ap',   label: 'Join Response',         sublabel: 'AP provisioned: image, config', color: '#a855f7' },
  { from: 'ap',   to: 'ctrl', label: 'Config Status',         sublabel: 'AP reports local state', color: '#06b6d4' },
  { from: 'ctrl', to: 'ap',   label: 'Config Update (SSID/VLAN/Channel)', sublabel: 'AP configured remotely', color: '#a855f7' },
  { from: 'ap',   to: 'ctrl', label: '↑ Data (802.11 → CAPWAP encap)', sublabel: 'Client frames tunneled', color: '#10b981' },
  { from: 'ctrl', to: 'ap',   label: '↓ Data (CAPWAP decap → 802.11)', sublabel: 'Controller forwards to LAN', color: '#10b981' },
];

function TunnelDiagram({ type }: { type: 'l2' | 'l3' | 'capwap' }) {
  const configs = {
    l2: {
      title: 'L2 Tunnel (CAPWAP L2 / LWAPP)',
      color: '#06b6d4',
      layers: [
        { label: 'Client Frame (802.11)', color: '#06b6d4', bytes: '≥ 28B' },
        { label: 'CAPWAP Data Header', color: '#a855f7', bytes: '8B' },
        { label: 'UDP (4:4 / 5247)', color: '#f59e0b', bytes: '8B' },
        { label: 'IP (AP → WLC)', color: '#10b981', bytes: '20B' },
        { label: 'Outer Ethernet', color: '#ef4444', bytes: '14B' },
      ],
      desc: 'Client 802.11 frame wrapped in CAPWAP + UDP/IP. Layer 2 header preserved end-to-end. AP acts as L2 bridge — all client traffic forwarded to controller on the same VLAN/L2 domain. Simple but controller becomes L2 bottleneck.',
    },
    l3: {
      title: 'L3 Tunnel (CAPWAP L3 / IP Routing)',
      color: '#a855f7',
      layers: [
        { label: 'Client IP Packet', color: '#06b6d4', bytes: '≥ 20B' },
        { label: 'CAPWAP Data Header', color: '#a855f7', bytes: '8B' },
        { label: 'UDP (5247)', color: '#f59e0b', bytes: '8B' },
        { label: 'Outer IP (AP → WLC)', color: '#10b981', bytes: '20B' },
        { label: 'Outer Ethernet', color: '#ef4444', bytes: '14B' },
      ],
      desc: 'Client IP traffic tunneled at L3. AP and WLC can be in different subnets/VRFs — controller visible only via IP routing, not same L2 domain. Scalable for geographically distributed deployments. Client L2 header stripped at AP.',
    },
    capwap: {
      title: 'CAPWAP Control vs Data Channels',
      color: '#10b981',
      layers: [
        { label: 'CAPWAP Control Msg (DTLS)', color: '#10b981', bytes: 'Variable' },
        { label: 'DTLS (TLS over UDP)', color: '#38bdf8', bytes: 'Overhead' },
        { label: 'UDP 5246 (Control)', color: '#f59e0b', bytes: '8B' },
        { label: 'IP (AP → WLC)', color: '#a855f7', bytes: '20B' },
        { label: 'Ethernet', color: '#ef4444', bytes: '14B' },
      ],
      desc: 'CAPWAP has two channels: Control (UDP 5246, DTLS-encrypted) for AP management/config, and Data (UDP 5247, optional DTLS) for client traffic. Split MAC: management frames processed by controller, data frames by AP (local switching) or tunneled (central switching).',
    },
  };
  const cfg = configs[type];
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        {cfg.layers.map((l, i) => (
          <motion.div key={l.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border"
            style={{ borderColor: l.color + '40', background: l.color + '12' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
            <span className="text-xs font-semibold flex-1" style={{ color: l.color }}>{l.label}</span>
            <span className="text-xs text-slate-500 font-mono">{l.bytes}</span>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed bg-surface-900/50 rounded-xl p-3">{cfg.desc}</p>
    </div>
  );
}

function CAPWAPTab() {
  const { step, playing, play, reset } = useLadderAnim(CAPWAP_STEPS);
  const [tunnelType, setTunnelType] = useState<'capwap' | 'l2' | 'l3'>('capwap');

  return (
    <div className="space-y-6">
      {/* CAPWAP Ladder */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">CAPWAP — AP Join & Data Flow</h3>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
            <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
              <Play size={12} fill="currentColor" /> {playing ? 'Running…' : 'Animate'}
            </button>
          </div>
        </div>
        <LadderSVG actors={CAPWAP_ACTORS} steps={CAPWAP_STEPS} step={step} height={240} />
        <ModeContent content={{
          kid: '📡 CAPWAP is the language APs and controllers use! The AP "calls" the controller on startup, gets its settings (what channels/SSIDs to use), then forwards all client traffic to the controller for processing.',
          enthusiast: 'CAPWAP (RFC 5415/5416) uses DTLS-secured control channel (UDP 5246) for AP provisioning and config, and a data channel (UDP 5247) for tunneling 802.11 frames. The controller makes all roaming and policy decisions.',
          pro: 'CAPWAP Control: DTLS mutual auth (AP cert + WLC cert). State machine: Discovery → Join → Configure → Run. Keepalive every 30s. Data: WBID=1 (802.11). Split vs Local MAC: Split MAC = all mgmt frames go to WLC (beacons, probes, auth); Local MAC = AP processes mgmt, WLC gets data only. FlexConnect (Cisco) = local switching in WAN failure.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      {/* Tunnel Types */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Encapsulation: L2 vs L3 vs CAPWAP Control</h3>
        <div className="flex gap-2">
          {(['capwap', 'l2', 'l3'] as const).map(t => (
            <button key={t} onClick={() => setTunnelType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all uppercase ${
                tunnelType === t ? 'bg-band24/20 border-band24/50 text-band24' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {t === 'capwap' ? 'CAPWAP Control' : t === 'l2' ? 'L2 Tunnel' : 'L3 Tunnel'}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tunnelType} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TunnelDiagram type={tunnelType} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── TAB 3: VxLAN ────────────────────────────────────────────────────────────

const VXLAN_ACTORS = [
  { key: 'vtep1' as ActorKey, label: 'VTEP-1 (Origin)', icon: '🖥️', color: '#06b6d4' },
  { key: 'vtep2' as ActorKey, label: 'VTEP-2 (Remote)', icon: '🖥️', color: '#10b981' },
];

const VXLAN_STEPS: LadderStep[] = [
  { from: 'vtep1', to: 'vtep2', label: 'ARP / BUM → Multicast/Unicast Flood',  sublabel: 'VTEP1 learns VTEP2 via control plane', color: '#f59e0b' },
  { from: 'vtep2', to: 'vtep1', label: 'ARP Reply (unicast back)',               sublabel: 'MAC-to-VTEP mapping learned', color: '#10b981' },
  { from: 'vtep1', to: 'vtep2', label: 'VxLAN-encapsulated Data Frame',          sublabel: 'VNI + Inner Ethernet inside UDP/IP', color: '#06b6d4' },
  { from: 'vtep2', to: 'vtep1', label: 'VxLAN-encapsulated Reply',               sublabel: 'Decap → deliver to local VM', color: '#10b981' },
];

const VXLAN_HEADER = [
  { label: 'Outer Ethernet', note: 'VTEP-1 MAC → VTEP-2 MAC', color: '#ef4444', bytes: '14B' },
  { label: 'Outer IP',       note: 'VTEP-1 IP → VTEP-2 IP (routable)', color: '#f59e0b', bytes: '20B' },
  { label: 'Outer UDP',      note: 'Src: Ephemeral, Dst: 4789', color: '#a855f7', bytes: '8B' },
  { label: 'VxLAN Header',   note: 'VXLAN Flags (I=1) + 24-bit VNI', color: '#06b6d4', bytes: '8B' },
  { label: 'Inner Ethernet', note: 'Original VM src/dst MAC', color: '#38bdf8', bytes: '14B' },
  { label: 'Inner IP',       note: 'Original VM src/dst IP', color: '#10b981', bytes: '20B' },
  { label: 'Inner Payload',  note: 'TCP/UDP / Application data', color: '#64748b', bytes: 'Variable' },
];

function VxLANTab() {
  const [animating, setAnimating] = useState(false);
  const [encapStep, setEncapStep] = useState(0);
  const { step, playing, play, reset } = useLadderAnim(VXLAN_STEPS);

  const runEncap = () => {
    setAnimating(true);
    setEncapStep(0);
    VXLAN_HEADER.forEach((_, i) => {
      setTimeout(() => {
        setEncapStep(i + 1);
        if (i === VXLAN_HEADER.length - 1) setAnimating(false);
      }, (i + 1) * 400);
    });
  };

  return (
    <div className="space-y-6">
      {/* VxLAN VTEP Flow */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">VxLAN — VTEP-to-VTEP Packet Flow</h3>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
            <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
              <Play size={12} fill="currentColor" /> {playing ? 'Running…' : 'Animate'}
            </button>
          </div>
        </div>
        <LadderSVG actors={VXLAN_ACTORS} steps={VXLAN_STEPS} step={step} height={190} />
      </div>

      {/* Encapsulation stack */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">VxLAN Encapsulation Stack</h3>
          <button onClick={runEncap} disabled={animating}
            className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {animating ? 'Encapsulating…' : 'Show Encap'}
          </button>
        </div>
        <div className="space-y-1.5">
          {VXLAN_HEADER.map((h, i) => (
            <AnimatePresence key={h.label}>
              {encapStep > i && (
                <motion.div initial={{ opacity: 0, x: -16, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                  style={{ borderColor: h.color + '40', background: h.color + '10' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: h.color }} />
                  <div className="flex-1">
                    <span className="text-xs font-bold" style={{ color: h.color }}>{h.label}</span>
                    <span className="text-xs text-slate-500 ml-2">{h.note}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">{h.bytes}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        {encapStep === VXLAN_HEADER.length && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-400 text-center font-semibold">
            ⚡ Total overhead: ~50B per frame — jumbo frames (MTU 9000) recommended
          </motion.p>
        )}
        <ModeContent content={{
          kid: '📦 VxLAN wraps your data in multiple envelopes! The inner envelope is the original message from your VM. VxLAN adds a 24-bit VNI "apartment number" then puts it all inside a standard IP/UDP package that any router can deliver — like shipping a package internationally using standard postal service!',
          enthusiast: 'VxLAN (RFC 7348) encapsulates L2 frames in UDP/IP, enabling L2 segments to span L3 networks. The 24-bit VNI supports 16 million virtual segments vs VLAN\'s 4094. VTEPs (VTEP = VXLAN Tunnel Endpoint) handle encap/decap. EVPN (BGP) used for scalable MAC/IP distribution.',
          pro: 'RFC 7348 VxLAN: 8B header (Flags: 0x08 = I bit set + 24b VNI + reserved). UDP dst 4789 (IANA). Src port = hash(inner frame) for ECMP load balancing. VTEP = host NIC (distributed) or switch (hardware). Control plane options: multicast flood-and-learn (legacy), BGP EVPN (RFC 7432), OVSDB. EVPN Type-2 route = MAC/IP advertisement. MTU: 9000 for jumbo frames to avoid fragmentation. VxLAN-GPE (Generic Protocol Extension) adds NSH for service chaining.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── TAB 4: IPSec ────────────────────────────────────────────────────────────

const IKE_ACTORS = [
  { key: 'sup'  as ActorKey, label: 'Initiator', icon: '💻', color: '#06b6d4' },
  { key: 'ike'  as ActorKey, label: 'Responder', icon: '🏢', color: '#a855f7' },
];

const IKE_STEPS: LadderStep[] = [
  { from: 'sup', to: 'ike', label: 'IKE_SA_INIT (SAi1, KEi, Ni)',     sublabel: 'Phase 1: Propose cipher, DH public key, nonce', color: '#06b6d4' },
  { from: 'ike', to: 'sup', label: 'IKE_SA_INIT (SAr1, KEr, Nr)',     sublabel: 'Responder DH key + nonce → SKEYSEED derived', color: '#a855f7' },
  { from: 'sup', to: 'ike', label: 'IKE_AUTH (IDi, AUTH, SAi2, TSi)', sublabel: 'Phase 2: Identity + auth proof + IPSec SA proposal', color: '#06b6d4' },
  { from: 'ike', to: 'sup', label: 'IKE_AUTH (IDr, AUTH, SAr2, TSr)', sublabel: 'Responder auth + selected SA → IPSec tunnel UP', color: '#a855f7' },
  { from: 'sup', to: 'ike', label: 'ESP Tunnel Data (encrypted)',      sublabel: 'All traffic ESP-encrypted in tunnel mode', color: '#10b981' },
  { from: 'ike', to: 'sup', label: 'ESP Tunnel Data (encrypted)',      sublabel: 'Bidirectional — SPI identifies each SA', color: '#10b981' },
];

const ESP_HEADER = [
  { label: 'Outer IP',        note: 'Tunnel src → dst (public IPs)', color: '#ef4444', bytes: '20B' },
  { label: 'ESP Header',      note: 'SPI (32-bit) + Sequence Number (32-bit)', color: '#f59e0b', bytes: '8B' },
  { label: 'IV / Nonce',      note: 'AES-GCM: 12B nonce', color: '#a855f7', bytes: '12B' },
  { label: 'Inner IP',        note: 'Original src/dst (encrypted)', color: '#06b6d4', bytes: '20B' },
  { label: 'Inner Payload',   note: 'TCP/UDP + data (encrypted)', color: '#38bdf8', bytes: 'Variable' },
  { label: 'ESP Trailer',     note: 'Padding + pad length + next header', color: '#64748b', bytes: '2-255B' },
  { label: 'ESP Auth (ICV)',  note: 'AES-GCM: 16B integrity check value', color: '#10b981', bytes: '16B' },
];

function IPSecTab() {
  const [encapStep, setEncapStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const { step, playing, play, reset } = useLadderAnim(IKE_STEPS);

  const runEncap = () => {
    setAnimating(true); setEncapStep(0);
    ESP_HEADER.forEach((_, i) => {
      setTimeout(() => {
        setEncapStep(i + 1);
        if (i === ESP_HEADER.length - 1) setAnimating(false);
      }, (i + 1) * 400);
    });
  };

  return (
    <div className="space-y-6">
      {/* IKEv2 Ladder */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">IPSec — IKEv2 Negotiation + ESP Tunnel</h3>
          <div className="flex gap-2">
            <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1"><RotateCcw size={12} /> Reset</button>
            <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
              <Play size={12} fill="currentColor" /> {playing ? 'Running…' : 'Animate'}
            </button>
          </div>
        </div>
        <LadderSVG actors={IKE_ACTORS} steps={IKE_STEPS} step={step} height={210} />
        {step === IKE_STEPS.length - 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-panel p-3 border border-emerald-500/40 bg-emerald-500/10 text-center">
            <p className="text-emerald-400 font-bold text-sm">🔒 IPSec Tunnel established — all traffic ESP-encrypted</p>
          </motion.div>
        )}
        <ModeContent content={{
          kid: '🔐 IPSec is like building a secret tunnel between two buildings! First, both sides agree on a secret language (IKEv2 phase 1 and 2). Then ALL traffic through the tunnel is scrambled — even someone who intercepts the packets sees only gibberish!',
          enthusiast: 'IKEv2 (RFC 7296) sets up IPSec in 2 phases: Phase 1 (IKE_SA_INIT) negotiates algorithms and does Diffie-Hellman key exchange. Phase 2 (IKE_AUTH) authenticates both sides and creates the IPSec SA (Security Association) with an SPI. All traffic then flows as ESP (Encapsulating Security Payload).',
          pro: 'IKEv2: 4 messages (2 exchange pairs). SKEYSEED = PRF(Ni|Nr, g^ir). Child SA keys: SK_ei, SK_er, SK_ai, SK_ar. ESP Tunnel mode: inner IP wrapped + AES-GCM-256 (combined auth+encrypt). SPI = 32-bit index for SA lookup. Dead Peer Detection (RFC 3706). Split tunneling: TSi/TSr Traffic Selectors. MOBIKE (RFC 4555) for IP mobility. IKEv2 Auth methods: RSA-sig (certs), PSK, EAP (for remote access).',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      {/* ESP Encapsulation */}
      <div className="glass-panel p-5 border-glow-purple space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">ESP Tunnel Mode Encapsulation</h3>
          <button onClick={runEncap} disabled={animating}
            className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {animating ? 'Building…' : 'Show ESP'}
          </button>
        </div>
        <div className="space-y-1.5">
          {ESP_HEADER.map((h, i) => (
            <AnimatePresence key={h.label}>
              {encapStep > i && (
                <motion.div initial={{ opacity: 0, x: -16, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border"
                  style={{ borderColor: h.color + '40', background: h.color + '10' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: h.color }} />
                  <div className="flex-1">
                    <span className="text-xs font-bold" style={{ color: h.color }}>{h.label}</span>
                    <span className="text-xs text-slate-500 ml-2">{h.note}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{h.bytes}</span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        {encapStep === ESP_HEADER.length && (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ l: 'Encrypted', v: 'Inner IP + Payload', c: '#10b981' }, { l: 'Authenticated', v: 'ESP Hdr → Trailer', c: '#06b6d4' }, { l: 'Not Encrypted', v: 'Outer IP (routing only)', c: '#f59e0b' }].map(r => (
              <div key={r.l} className="bg-surface-900/60 rounded-lg p-2">
                <p className="text-xs text-slate-500">{r.l}</p>
                <p className="text-xs font-semibold" style={{ color: r.c }}>{r.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TAB 5: EoGRE & Overlay ──────────────────────────────────────────────────

const EOGRE_HEADER = [
  { label: 'Outer Ethernet',  note: 'AP → Gateway next-hop MAC', color: '#ef4444', bytes: '14B' },
  { label: 'Outer IP',        note: 'AP IP → Controller/Gateway IP', color: '#f59e0b', bytes: '20B' },
  { label: 'GRE Header',      note: 'Proto: 0x6558 (Transparent Ethernet), Key optional', color: '#a855f7', bytes: '4-16B' },
  { label: 'Inner Ethernet',  note: 'Original client 802.3 frame', color: '#06b6d4', bytes: '14B' },
  { label: 'Inner IP',        note: 'Client src/dst IP', color: '#38bdf8', bytes: '20B' },
  { label: 'Inner Payload',   note: 'Client application data', color: '#64748b', bytes: 'Variable' },
];

const VXLAN_IPSEC_HEADER = [
  { label: 'Outer Ethernet',  note: 'Physical underlay', color: '#ef4444', bytes: '14B' },
  { label: 'Outer IP (IPSec)',note: 'IPSec tunnel endpoints', color: '#f59e0b', bytes: '20B' },
  { label: 'ESP Header',      note: 'SPI + Seq — encrypts everything below', color: '#10b981', bytes: '8B' },
  { label: '▼ ENCRYPTED ▼',  note: 'Confidentiality boundary (AES-GCM)', color: '#10b981', bytes: '' },
  { label: 'Inner IP (VxLAN)',note: 'VTEP-to-VTEP overlay transport', color: '#a855f7', bytes: '20B' },
  { label: 'UDP (4789)',       note: 'VxLAN demux', color: '#8b5cf6', bytes: '8B' },
  { label: 'VxLAN Header',    note: '24-bit VNI', color: '#06b6d4', bytes: '8B' },
  { label: 'Inner Ethernet',  note: 'Original VM frame', color: '#38bdf8', bytes: '14B' },
  { label: 'Inner Payload',   note: 'VM application data', color: '#64748b', bytes: 'Variable' },
  { label: 'ESP ICV',         note: 'AES-GCM 16B auth tag', color: '#10b981', bytes: '16B' },
];

function EncapStack({ headers, title, animate }: { headers: typeof EOGRE_HEADER; title: string; animate: boolean }) {
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);

  const run = () => {
    if (running) return;
    setRunning(true); setShown(0);
    headers.forEach((_, i) => {
      setTimeout(() => {
        setShown(i + 1);
        if (i === headers.length - 1) setRunning(false);
      }, (i + 1) * 350);
    });
  };

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white text-sm">{title}</h3>
        {animate && (
          <button onClick={run} disabled={running}
            className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {running ? 'Building…' : 'Encapsulate'}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {headers.map((h, i) => (
          <AnimatePresence key={h.label + i}>
            {(!animate || shown > i) && (
              <motion.div initial={animate ? { opacity: 0, x: -12, height: 0 } : { opacity: 1 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${h.label.startsWith('▼') ? 'border-dashed' : ''}`}
                style={{ borderColor: h.color + '40', background: h.color + '10' }}>
                {!h.label.startsWith('▼') && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: h.color }} />}
                <div className="flex-1">
                  <span className="text-xs font-bold" style={{ color: h.color }}>{h.label}</span>
                  {h.note && <span className="text-xs text-slate-500 ml-2">{h.note}</span>}
                </div>
                {h.bytes && <span className="text-xs font-mono text-slate-500">{h.bytes}</span>}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
}

function EoGRETab() {
  return (
    <div className="space-y-6">
      {/* EoGRE */}
      <EncapStack headers={EOGRE_HEADER} title="EoGRE — Ethernet over GRE Encapsulation" animate={true} />
      <div className="glass-panel p-5 border-glow-purple space-y-3">
        <h3 className="font-bold text-white">EoGRE — How It Works in Enterprise WLAN</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[{ icon: '📡', t: 'AP Role', d: 'AP encapsulates client 802.11 frames into GRE + IP. Acts as GRE tunnel endpoint. No CAPWAP controller needed.' },
            { icon: '🌐', t: 'Gateway Role', d: 'GRE gateway (controller/anchor) decapsulates and forwards into LAN/VLAN. Can apply policy, ACL, and captive portal.' },
            { icon: '🎯', t: 'Use Cases', d: 'Guest Wi-Fi tunneling, hotspot offload, cloud-managed WLAN where L2 extension across L3 is needed without VxLAN complexity.' }].map(c => (
            <div key={c.t} className="bg-surface-900/60 rounded-xl p-3 border border-slate-700/50">
              <p className="text-lg mb-1">{c.icon}</p>
              <p className="text-xs font-bold text-white mb-1">{c.t}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
        <ModeContent content={{
          kid: '🚇 EoGRE is like a subway tunnel for Wi-Fi data! The AP puts your data on a subway train (GRE), which travels through any network underground (IP tunnel), and arrives at the controller\'s station. The controller then sends it to the right destination!',
          enthusiast: 'EoGRE (Ethernet over Generic Routing Encapsulation) tunnels Layer 2 Ethernet frames inside GRE (IP Protocol 47). Used for guest Wi-Fi forwarding — the AP tunnels guest traffic directly to a DMZ gateway without exposing the corporate LAN. Simpler than VxLAN but no built-in encryption.',
          pro: 'GRE (RFC 2784/2890): 4-byte header (Flags, Protocol Type=0x6558 for Transparent Ethernet Bridging). Optional: Key field (32-bit) for per-tunnel identification, Sequence Number, Checksum. AP-to-Gateway GRE: each SSID/VLAN gets its own GRE key or separate tunnel. RFC 2473 for IPv6. EoGRE in WLAN: Cisco CMX, Aruba AirWave use GRE-based guest anchoring. Cisco EWC (Embedded Wireless Controller) uses EoGRE for local-mode tunneling. Overhead: 24-38B vs VxLAN 50B. No built-in encryption → combine with IPSec for secure transport.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      {/* VxLAN over IPSec */}
      <EncapStack headers={VXLAN_IPSEC_HEADER} title="VxLAN over IPSec — Encrypted Overlay" animate={true} />
      <div className="glass-panel p-5 border-glow-purple">
        <ModeContent content={{
          kid: '🪆 VxLAN over IPSec is like a set of Russian dolls! Your data is inside a VxLAN box, which is inside an encrypted IPSec box. Even if someone steals the package, they can\'t open the outer IPSec lock — and even if they could, they\'d find another VxLAN box inside!',
          enthusiast: 'VxLAN over IPSec combines VxLAN\'s overlay networking with IPSec\'s encryption. VxLAN handles L2-over-L3 multi-tenancy (VNI); IPSec encrypts the VxLAN traffic so the underlay network (internet/WAN) can\'t see tenant data. Common in SD-WAN and multi-site data center interconnects.',
          pro: 'Implementation: IPSec in Transport mode over VTEP-to-VTEP VxLAN (encrypts UDP/VxLAN payload while outer IP is VTEP addresses) — or Tunnel mode (encapsulates entire VxLAN packet). Cisco ACI, VMware NSX-T use this for inter-site fabric encryption. IPSec overhead: ~72B (Outer IP 20 + ESP 8 + IV 12 + Trailer ~10 + ICV 16 + VxLAN 50) = ~110B total added to original frame. PMTU must account for combined overhead. EVPN BGP control plane unaffected (runs outside tunnel). Encryption: AES-256-GCM for both confidentiality and integrity.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      {/* Comparison table */}
      <div className="glass-panel p-5 border-glow-purple">
        <h3 className="font-bold text-white mb-4">Enterprise Tunnel Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Protocol', 'Layer', 'Encryption', 'Overhead', 'Use Case', 'Port/Proto'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { p: 'CAPWAP', l: 'L2/L3', enc: 'DTLS (ctrl)', ovh: '~12B', use: 'AP→WLC mgmt', proto: 'UDP 5246/5247', c: '#06b6d4' },
                { p: 'GRE', l: 'L2/L3', enc: '❌ None', ovh: '24-38B', use: 'Guest forwarding', proto: 'IP Proto 47', c: '#a855f7' },
                { p: 'EoGRE', l: 'L2', enc: '❌ None', ovh: '34-46B', use: 'WLAN guest anchor', proto: 'GRE + Eth', c: '#8b5cf6' },
                { p: 'VxLAN', l: 'L2 over L3', enc: '❌ None', ovh: '~50B', use: 'DC multi-tenant', proto: 'UDP 4789', c: '#f59e0b' },
                { p: 'IPSec/ESP', l: 'L3', enc: '✅ AES-GCM', ovh: '~60B', use: 'Site-to-site VPN', proto: 'ESP/UDP 4500', c: '#10b981' },
                { p: 'VxLAN/IPSec', l: 'L2 over L3+', enc: '✅ AES-GCM', ovh: '~110B', use: 'Encrypted overlay', proto: 'UDP+ESP', c: '#ef4444' },
              ].map(r => (
                <tr key={r.p} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-bold font-mono" style={{ color: r.c }}>{r.p}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.l}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.enc}</td>
                  <td className="py-1.5 px-2 font-mono text-slate-300">{r.ovh}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.use}</td>
                  <td className="py-1.5 px-2 font-mono text-slate-500">{r.proto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function Chapter11() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('802.1X / EAP');
  useSubtopicNav(CH11_TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    CH11_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch11', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Enterprise WLAN deep dive — 802.1X/EAP full authentication flows, CAPWAP tunneling, VxLAN overlays, IPSec encryption, and EoGRE for secure multi-tenant architectures." />
        <ModeBadge />
      </div>

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
          {activeTab === '802.1X / EAP'    && <EAPTab />}
          {activeTab === 'CAPWAP & Tunnels' && <CAPWAPTab />}
          {activeTab === 'VxLAN'            && <VxLANTab />}
          {activeTab === 'IPSec'            && <IPSecTab />}
          {activeTab === 'EoGRE & Overlay'  && <EoGRETab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
