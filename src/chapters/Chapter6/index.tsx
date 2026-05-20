import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';
import { useSubtopicNav } from '../../hooks/useSubtopicNav';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch6')!;

const TABS = ['Threats', 'Legacy Security', '4-Way Handshake', 'WPA3 Personal', 'Enterprise Auth', 'RADIUS & PKI', 'WPA3 Enterprise', 'WIDS/WIPS', 'PMF & Deauth'] as const;
type Tab = typeof TABS[number];

const CH6_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Threats':          ['threats'],
  'Legacy Security':  ['legacy'],
  '4-Way Handshake':  ['handshake'],
  'WPA3 Personal':    ['wpa3'],
  'Enterprise Auth':  ['enterprise'],
  'RADIUS & PKI':     ['radius'],
  'WPA3 Enterprise':  ['wpa3ent'],
  'WIDS/WIPS':        ['wids'],
  'PMF & Deauth':     ['pmf_sec'],
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface HSStep {
  id: number;
  from: 'ap' | 'client';
  to:   'ap' | 'client';
  label: string;
  payload: string;
  color: string;
  icon: string;
  desc: { kid: string; enthusiast: string; pro: string };
}

// ─── 4-Way Handshake Data ─────────────────────────────────────────────────────
const HS_STEPS: HSStep[] = [
  {
    id: 1, from: 'ap', to: 'client',
    label: 'Message 1', payload: 'ANonce →',
    color: '#06b6d4', icon: '🎲',
    desc: {
      kid: '🎲 The AP rolls a random dice number (ANonce) and sends it to you — this is the AP\'s random secret ingredient for the secret recipe!',
      enthusiast: 'The AP sends a random number (ANonce) to your device. Combined with your device\'s own random number and the pre-shared password, this will generate a unique encryption key.',
      pro: 'EAPOL-Key Frame 1: AP sends ANonce (256-bit random value) to STA. Message is unprotected at this stage. STA can now begin PTK derivation: PTK = PRF-512(PMK, "Pairwise key expansion", Min(AA,SPA)||Max(AA,SPA)||Min(ANonce,SNonce)||Max(ANonce,SNonce)).',
    },
  },
  {
    id: 2, from: 'client', to: 'ap',
    label: 'Message 2', payload: '← SNonce + MIC',
    color: '#a855f7', icon: '🔐',
    desc: {
      kid: '🔐 You send back YOUR random number (SNonce) + a tiny fingerprint (MIC) that proves you know the password. The AP checks the fingerprint!',
      enthusiast: 'Your device generates its own random number (SNonce) and sends it back with a Message Integrity Check (MIC) — a cryptographic hash proving you know the Wi-Fi password.',
      pro: 'EAPOL-Key Frame 2: STA responds with SNonce, RSN IE (capabilities), and MIC computed over the entire EAPOL frame using KCK (Key Confirmation Key, first 128 bits of PTK). AP verifies MIC → confirms STA holds correct PMK → derives GTK and installs PTK.',
    },
  },
  {
    id: 3, from: 'ap', to: 'client',
    label: 'Message 3', payload: 'GTK + MIC →',
    color: '#f59e0b', icon: '📦',
    desc: {
      kid: '📦 The AP sends you the "group key" (GTK) — a shared TV remote everyone uses for group messages — locked in an encrypted box only you can open!',
      enthusiast: 'The AP sends the GTK (Group Temporal Key) — used for broadcast/multicast traffic — encrypted with the key derived from your password exchange. Another MIC verifies integrity.',
      pro: 'EAPOL-Key Frame 3: AP sends GTK (encrypted under KEK — Key Encryption Key, bits 128-255 of PTK), RSN IE, MIC. STA installs PTK (data confidentiality via CCMP/GCMP) and GTK. Request for PMF if PMF=required: IGTK also included.',
    },
  },
  {
    id: 4, from: 'client', to: 'ap',
    label: 'Message 4', payload: '← ACK + MIC',
    color: '#10b981', icon: '✅',
    desc: {
      kid: '✅ You say "Got it! Keys installed!" — Both you and the AP now have the same secret keys. All your data is now locked with REAL encryption!',
      enthusiast: 'Your device confirms it received and installed the GTK. From this moment, all data between your device and the AP is encrypted with the PTK. The handshake is complete!',
      pro: 'EAPOL-Key Frame 4: STA acknowledges GTK receipt with MIC. AP installs PTK and transitions port to AUTHORIZED state (802.1X port control). CCMP/GCMP cipher suite activated. RSC (Replay Sequence Counter) initialized to prevent replay attacks.',
    },
  },
];

const NODE_POS = {
  client: { x: 90,  y: 100, label: 'Your Device', icon: '💻' },
  ap:     { x: 410, y: 100, label: 'Access Point', icon: '📡' },
} as const;

// ─── FourWayHandshake Component ───────────────────────────────────────────────
function FourWayHandshake() {
  const { mode, markComplete } = useApp();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStep(-1);
    setPlaying(false);
  }, []);

  const play = useCallback(() => {
    reset();
    setPlaying(true);
    HS_STEPS.forEach((_, i) => {
      timerRef.current = setTimeout(() => {
        setStep(i);
        if (i === HS_STEPS.length - 1) {
          setPlaying(false);
          markComplete('ch6', 'handshake');
        }
      }, (i + 1) * 1600);
    });
  }, [reset, markComplete]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const currentStep = step >= 0 ? HS_STEPS[step] : null;

  return (
    <div className="glass-panel p-5 border-glow-green space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">WPA2 4-Way Handshake</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {playing ? 'Handshaking…' : 'Animate'}
          </button>
        </div>
      </div>

      {/* SVG diagram */}
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 500 200" className="w-full" style={{ maxHeight: 200 }}>
          {/* Timeline guide lines */}
          {Object.entries(NODE_POS).map(([key, n]) => (
            <line key={key} x1={n.x} y1={50} x2={n.x} y2={185}
              stroke="rgba(100,116,139,0.2)" strokeWidth="1" strokeDasharray="4 3" />
          ))}

          {/* Nodes */}
          {(Object.entries(NODE_POS) as [keyof typeof NODE_POS, typeof NODE_POS[keyof typeof NODE_POS]][]).map(([key, n]) => (
            <g key={key} transform={`translate(${n.x},${n.y - 60})`}>
              <circle r="22" fill="rgba(30,41,59,0.8)"
                stroke={key === 'client' ? '#06b6d4' : '#a855f7'}
                strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">{n.icon}</text>
              <text textAnchor="middle" y="32" fill="#94a3b8" fontSize="8" fontFamily="Inter">{n.label}</text>
            </g>
          ))}

          {/* Animated message arrows */}
          {HS_STEPS.slice(0, step + 1).map((s, i) => {
            const from = NODE_POS[s.from];
            const to   = NODE_POS[s.to];
            const y = 75 + i * 28;
            const going = from.x < to.x;
            return (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <line x1={from.x} y1={y} x2={to.x} y2={y}
                  stroke={s.color} strokeWidth="1.5" markerEnd={going ? `url(#arrow-${s.color.replace('#','')})` : undefined}
                  markerStart={!going ? `url(#barrow-${s.color.replace('#','')})` : undefined} />
                <text x={(from.x + to.x) / 2} y={y - 5} textAnchor="middle" fill={s.color} fontSize="8" fontFamily="JetBrains Mono" fontWeight="600">
                  {s.payload}
                </text>
                {/* Step dot */}
                <circle cx={going ? from.x + 8 : from.x - 8} cy={y} r="4" fill={s.color} />
                <text x={going ? from.x - 18 : from.x + 18} y={y + 3} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="Inter">M{i+1}</text>
              </motion.g>
            );
          })}
          {/* Arrow markers */}
          <defs>
            {HS_STEPS.map(s => (
              <marker key={s.color} id={`arrow-${s.color.replace('#','')}`} markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill={s.color} />
              </marker>
            ))}
          </defs>
        </svg>
      </div>

      {/* Step pills */}
      <div className="grid grid-cols-4 gap-2">
        {HS_STEPS.map((s, i) => (
          <button key={s.id} onClick={() => !playing && setStep(i)}
            className={`p-3 rounded-xl border text-center transition-all ${
              step === i ? 'border-opacity-60' : step > i ? 'border-slate-700 opacity-70' : 'border-slate-700/40 opacity-40'
            }`}
            style={step === i ? { borderColor: s.color + '80', background: s.color + '15' } : {}}>
            <p className="text-lg mb-1">{s.icon}</p>
            <p className="text-xs font-bold" style={{ color: step >= i ? s.color : '#475569' }}>{s.label}</p>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div key={`hs-${step}-${mode}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass-panel p-4 border" style={{ borderColor: currentStep.color + '40' }}>
            <p className="text-sm text-slate-400 leading-relaxed">{currentStep.desc[mode]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 3 && !playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10 text-center">
          <p className="text-emerald-400 font-bold text-sm">🔐 PTK + GTK Installed — All traffic is now encrypted!</p>
          <ModeContent
            content={{
              kid: 'Now every message between you and the router is locked in an unbreakable box! 🔒 Even if someone is listening, they just hear random numbers.',
              enthusiast: 'CCMP (AES-128) or GCMP (AES-256) is now active. Every data frame is encrypted and has an integrity check. Replay attacks are blocked by a sequence counter.',
              pro: 'CCMP: 128-bit AES CCM mode (Counter+CBC-MAC). GCMP: 256-bit AES GCM mode (WPA3). MIC=8B. Replay protection via PN (Packet Number). PTK lifespan governed by dot11RSNAConfigPMKLifetime.',
            }}
            className="text-xs text-slate-400 mt-1"
          />
        </motion.div>
      )}
    </div>
  );
}

// ─── Security Evolution Timeline ──────────────────────────────────────────────
const SEC_ERAS = [
  {
    name: 'WEP', year: '1997', icon: '💀', color: '#ef4444', status: 'Broken',
    cipher: 'RC4 (40/104-bit key)', integrity: 'CRC-32', authType: 'Open/Shared Key',
    kid: '💀 WEP was the first Wi-Fi lock, but it was like a lock made of cardboard — hackers could crack it in under 60 SECONDS with a laptop! It was completely broken by 2001.',
    enthusiast: 'WEP used RC4 stream cipher with a static key. The 24-bit IV (Initialization Vector) repeated every ~5000 frames in a busy network. FMS attack could crack it in <1 minute by capturing enough IVs.',
    pro: 'WEP: RC4 with 40-bit or 104-bit key + 24-bit IV. IV reuse + keystream reuse vulnerability. FMS/KoreK attacks exploit weak IV classes. CRC-32 integrity is linear — bit-flip attacks trivial. Deprecated IEEE 2004, removed 2005. aircrack-ng cracks WEP in <2 min.',
    attacks: ['IV reuse attack', 'FMS/KoreK key recovery', 'Bit-flip injection'],
  },
  {
    name: 'WPA', year: '2003', icon: '⚠️', color: '#f59e0b', status: 'Deprecated',
    cipher: 'TKIP (RC4 + per-packet key)', integrity: 'Michael MIC (8-byte)', authType: 'PSK or 802.1X',
    kid: '⚠️ WPA was a quick patch for WEP — it made new keys for every packet (TKIP). Better, but still had some cracks if someone was clever enough.',
    enthusiast: 'WPA was a quick fix using TKIP on existing WEP hardware. It added per-packet key mixing and a message integrity check (Michael MIC). But TKIP itself had weaknesses.',
    pro: 'WPA/TKIP: per-packet key via key mixing (TKIP RC4), Michael MIC (64-bit). Beck-Tews attack (2008) allows TKIP packet forgery in ~15 min. TKIP deprecated IEEE 2012. Hole196 attack possible on WPA-Enterprise.',
    attacks: ['TKIP Michael MIC forgery', 'Beck-Tews attack', 'Dictionary attacks on PSK'],
  },
  {
    name: 'WPA2', year: '2004', icon: '🔒', color: '#06b6d4', status: 'Widely Used',
    cipher: 'CCMP (AES-128)', integrity: 'CBC-MAC (8-byte MIC)', authType: 'PSK or 802.1X/EAP',
    kid: '🔒 WPA2 switched to a much stronger lock (AES encryption). This is what most home Wi-Fi uses today. It\'s strong, but a really obvious password can still be guessed!',
    enthusiast: 'WPA2 replaced RC4 with AES-CCMP — a massive improvement. KRACK (2017) found a flaw in the 4-way handshake, but most devices patched it. Weak passwords are still vulnerable to offline dictionary attacks.',
    pro: 'WPA2 CCMP: AES-128 CCM mode. KRACK (Key Reinstallation Attack, 2017) targets nonce reuse in 4-way handshake via retransmission. PMKID attack (hashcat) allows offline PSK cracking from a single frame. No forward secrecy.',
    attacks: ['KRACK nonce reuse', 'PMKID offline crack', 'PMKSA downgrade', 'EVIL-TWIN + handshake capture'],
  },
  {
    name: 'WPA3', year: '2018', icon: '🛡️', color: '#10b981', status: 'Current Standard',
    cipher: 'GCMP-256 (AES-256 GCM)', integrity: 'GHASH (16-byte MIC)', authType: 'SAE or 802.1X/Suite-B',
    kid: '🛡️ WPA3 is the newest, strongest Wi-Fi lock! Even if you use a weak password, WPA3 makes it impossible to guess offline. Each connection gets its own unique secret — like a different lock for each visitor!',
    enthusiast: 'WPA3 uses SAE (Dragonfly handshake) — even a simple password like "cat123" is protected against offline dictionary attacks. Also adds forward secrecy: capturing traffic today can\'t be decrypted later even if the password leaks.',
    pro: 'WPA3-Personal: SAE replaces PSK. Dragonfly key exchange (ECDH over P-256/P-384) prevents offline dictionary attack — each attempt requires active interaction. Forward secrecy via ephemeral key pairs. WPA3-Enterprise: GCMP-256, Suite-B-192, ECDHE. PMF (802.11w) mandatory in WPA3.',
    attacks: ['DragonBlood side-channel (patched)', 'Implementation bugs only'],
  },
];

function SecurityEvolution() {
  const { mode } = useApp();
  const [selected, setSelected] = useState(SEC_ERAS[2]); // WPA2 selected by default

  return (
    <div className="glass-panel p-5 border-glow-green space-y-5">
      <h3 className="font-bold text-white">Wi-Fi Security Evolution: WEP → WPA → WPA2 → WPA3</h3>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SEC_ERAS.map(era => (
          <button key={era.name} onClick={() => setSelected(era)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-all min-w-[90px] ${
              selected.name === era.name ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
            style={selected.name === era.name ? { borderColor: era.color + '70', background: era.color + '12' } : { borderColor: '#334155' }}>
            <span className="text-2xl">{era.icon}</span>
            <p className="text-xs font-bold" style={{ color: era.color }}>{era.name}</p>
            <p className="text-xs text-slate-500">{era.year}</p>
            <span className={`chip text-xs py-0 px-1.5 border ${era.status === 'Broken' ? 'text-red-400 border-red-500/30 bg-red-500/10' : era.status === 'Deprecated' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : era.status === 'Current Standard' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10'}`}>
              {era.status}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[{ l: 'Cipher', v: selected.cipher }, { l: 'Integrity', v: selected.integrity }, { l: 'Auth', v: selected.authType }].map(f => (
              <div key={f.l} className="bg-surface-900/60 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500">{f.l}</p>
                <p className="text-xs font-bold font-mono" style={{ color: selected.color }}>{f.v}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 border text-sm text-slate-400 leading-relaxed"
            style={{ borderColor: selected.color + '30', background: selected.color + '08' }}>
            {mode === 'kid' ? selected.kid : mode === 'enthusiast' ? selected.enthusiast : selected.pro}
          </div>
          {selected.attacks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-400 mb-1.5">⚔️ Known Attacks:</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.attacks.map(a => (
                  <span key={a} className="chip border border-red-500/30 bg-red-500/10 text-red-400 text-xs">{a}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── WPA3 SAE Handshake ───────────────────────────────────────────────────────
const SAE_STEPS = [
  {
    label: 'PWE Derivation', icon: '🧮', color: '#10b981',
    desc: {
      kid: '🧮 Both you and the AP take the password and run it through a super-secret math machine called "Hash-to-Curve". It creates a magical dot on a curved number line — this is the PWE!',
      enthusiast: 'Both sides independently run the password through a deterministic function to derive a shared "Password Element" (PWE) on an elliptic curve. This is the key insight of SAE.',
      pro: 'PWE = hash2curve(password, MAC_A, MAC_B) using Hunting-and-Pecking or SSWU algorithm on P-256/P-384. Constant-time to prevent timing side-channels (DragonBlood CVE patched in WPA3-Rev1).',
    },
  },
  {
    label: 'Commit Exchange', icon: '🔄', color: '#06b6d4',
    desc: {
      kid: '🔄 Both sides create a random secret number and do math with their PWE to create a "commitment". They BOTH send these commitments at the same time — simultaneous!',
      enthusiast: 'Both sides generate random scalars and points, combine them with the PWE, and exchange Commit frames simultaneously. This simultaneous exchange enables forward secrecy.',
      pro: 'STA and AP simultaneously exchange SAE Commit (Auth seq=1): scalar = rand + mask (mod r), element = PWE^(−rand). Anti-Clogging Token if AP under load. Bidirectional — both send without waiting.',
    },
  },
  {
    label: 'Confirm Exchange', icon: '✅', color: '#a855f7',
    desc: {
      kid: '✅ Both sides prove "I actually know the password!" by sending a cryptographic fingerprint. Nobody can fake this without knowing the real password!',
      enthusiast: 'Both sides send a Confirm frame — an HMAC hash that proves they derived the same PMK. If the confirms match, both parties are authenticated with no offline attack possible.',
      pro: 'SAE Confirm (Auth seq=2): HMAC-SHA256(KCK, cnt|scalar_own|element_own|scalar_peer|element_peer). Verify peer confirm. On match: PMK derived. SAE = Dragonfly IKE adapted for 802.11.',
    },
  },
  {
    label: 'PMK Ready → 4-Way HS', icon: '🚀', color: '#f59e0b',
    desc: {
      kid: '🚀 Both sides now have the SAME secret PMK key — but nobody can figure it out from the packets! Now the regular 4-way handshake runs to make the actual encryption key.',
      enthusiast: 'SAE completes with a shared PMK never transmitted over the air. Even recording every SAE packet can\'t crack the password offline. The 4-way handshake then derives PTK/GTK.',
      pro: 'PMK derived without transmission → forward secrecy (each SAE instance unique PMK). No offline dictionary attack possible — PWE derivation requires active interaction per attempt. 4-way handshake proceeds as WPA2. PMK lifetime = dot11RSNAConfigPMKLifetime.',
    },
  },
];

function WPA3SAE() {
  const { mode } = useApp();
  const [step, setStep] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [playing, setPlaying] = useState(false);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStep(-1);
    setPlaying(false);
  }, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    setStep(-1);
    setPlaying(true);
    timers.current = SAE_STEPS.map((_, i) =>
      setTimeout(() => {
        setStep(i);
        if (i === SAE_STEPS.length - 1) setPlaying(false);
      }, (i + 1) * 1800)
    );
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  const CL = 90, AP = 410;   // x positions
  const NY  = 36;             // node y-center
  const R0y = 95, R1y = 140, R2y = 185, R3y = 228; // row y values

  return (
    <div className="glass-panel p-5 border-glow-green space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">WPA3 — SAE (Dragonfly) Handshake</h3>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {playing ? 'Running…' : 'Animate SAE'}
          </button>
        </div>
      </div>

      {/* SVG Diagram */}
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 500 255" className="w-full" style={{ maxHeight: 255 }}>
          <defs>
            <marker id="sae-arr-c"    markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#06b6d4" /></marker>
            <marker id="sae-arr-p"    markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#a855f7" /></marker>
            <marker id="sae-arr-c-lf" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto"><path d="M7,0 L0,3.5 L7,7 Z" fill="#06b6d4" /></marker>
            <marker id="sae-arr-p-lf" markerWidth="7" markerHeight="7" refX="1" refY="3.5" orient="auto"><path d="M7,0 L0,3.5 L7,7 Z" fill="#a855f7" /></marker>
          </defs>

          {/* Timeline dashes */}
          <line x1={CL} y1={58} x2={CL} y2={248} stroke="#1e293b" strokeDasharray="4 3" strokeWidth="1.5" />
          <line x1={AP} y1={58} x2={AP} y2={248} stroke="#1e293b" strokeDasharray="4 3" strokeWidth="1.5" />

          {/* Nodes */}
          {([
            { x: CL, label: 'Client (STA)', icon: '💻', c: '#06b6d4' },
            { x: AP, label: 'Access Point', icon: '📡', c: '#10b981' },
          ] as const).map(n => (
            <g key={n.label} transform={`translate(${n.x},${NY})`}>
              <circle r="22" fill={n.c + '18'} stroke={n.c + '60'} strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="14">{n.icon}</text>
              <text textAnchor="middle" y="32" fill="#94a3b8" fontSize="8" fontFamily="Inter">{n.label}</text>
            </g>
          ))}

          {/* Row 0: PWE Derivation (local, no packets) */}
          <AnimatePresence>
            {step >= 0 && (
              <motion.g key="row0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <circle cx={CL} cy={R0y} r="15" fill="#10b98118" stroke="#10b98145" strokeWidth="1.2" />
                <text x={CL} y={R0y + 4} textAnchor="middle" fontSize="12">🧮</text>
                <circle cx={AP} cy={R0y} r="15" fill="#10b98118" stroke="#10b98145" strokeWidth="1.2" />
                <text x={AP} y={R0y + 4} textAnchor="middle" fontSize="12">🧮</text>
                <text x={250} y={R0y - 6} textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold">PWE derived locally (Hash-to-Curve)</text>
                <text x={250} y={R0y + 7} textAnchor="middle" fill="#475569" fontSize="8" fontStyle="italic">— no packets exchanged —</text>
              </motion.g>
            )}
          </AnimatePresence>

          {/* Row 1: Commit Exchange (simultaneous) */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.g key="row1-lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <line x1={CL + 24} y1={R1y - 6} x2={AP - 24} y2={R1y - 6}
                  stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#sae-arr-c)" />
                <line x1={AP - 24} y1={R1y + 8} x2={CL + 24} y2={R1y + 8}
                  stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#sae-arr-c-lf)" />
                <text x={250} y={R1y - 13} textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold">SAE Commit (Auth seq=1) ↔ simultaneous</text>
                <text x={250} y={R1y + 20} textAnchor="middle" fill="#475569" fontSize="8">scalar + element (ECDH on P-256)</text>
              </motion.g>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {step === 1 && (
              <motion.g key="row1-dots" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <motion.circle cy={R1y - 6} r="5" fill="#06b6d4"
                  initial={{ cx: CL + 24 }} animate={{ cx: AP - 24 }}
                  transition={{ duration: 0.65, ease: 'easeInOut' }} />
                <motion.circle cy={R1y + 8} r="5" fill="#06b6d4"
                  initial={{ cx: AP - 24 }} animate={{ cx: CL + 24 }}
                  transition={{ duration: 0.65, ease: 'easeInOut', delay: 0.08 }} />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Row 2: Confirm Exchange (simultaneous) */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.g key="row2-lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <line x1={CL + 24} y1={R2y - 6} x2={AP - 24} y2={R2y - 6}
                  stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#sae-arr-p)" />
                <line x1={AP - 24} y1={R2y + 8} x2={CL + 24} y2={R2y + 8}
                  stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#sae-arr-p-lf)" />
                <text x={250} y={R2y - 13} textAnchor="middle" fill="#a855f7" fontSize="8" fontWeight="bold">SAE Confirm (Auth seq=2) ↔ simultaneous</text>
                <text x={250} y={R2y + 20} textAnchor="middle" fill="#475569" fontSize="8">HMAC-SHA256 — proves password knowledge</text>
              </motion.g>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {step === 2 && (
              <motion.g key="row2-dots" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <motion.circle cy={R2y - 6} r="5" fill="#a855f7"
                  initial={{ cx: CL + 24 }} animate={{ cx: AP - 24 }}
                  transition={{ duration: 0.65, ease: 'easeInOut' }} />
                <motion.circle cy={R2y + 8} r="5" fill="#a855f7"
                  initial={{ cx: AP - 24 }} animate={{ cx: CL + 24 }}
                  transition={{ duration: 0.65, ease: 'easeInOut', delay: 0.08 }} />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Row 3: PMK Ready */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.g key="row3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <circle cx={CL} cy={R3y} r="15" fill="#f59e0b18" stroke="#f59e0b45" strokeWidth="1.2" />
                <text x={CL} y={R3y + 4} textAnchor="middle" fontSize="12">🔑</text>
                <circle cx={AP} cy={R3y} r="15" fill="#f59e0b18" stroke="#f59e0b45" strokeWidth="1.2" />
                <text x={AP} y={R3y + 4} textAnchor="middle" fontSize="12">🔑</text>
                <text x={250} y={R3y - 5} textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="bold">PMK ready — never transmitted ✓ Forward Secrecy</text>
                <text x={250} y={R3y + 8} textAnchor="middle" fill="#475569" fontSize="8">→ 4-Way Handshake begins next</text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SAE_STEPS.map((s, i) => (
          <button key={i} onClick={() => !playing && setStep(i)}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              step === i ? '' : step > i ? 'opacity-80' : 'opacity-40'
            }`}
            style={
              step === i
                ? { borderColor: s.color + '60', background: s.color + '15' }
                : step > i
                  ? { borderColor: '#10b98140' }
                  : { borderColor: '#334155' }
            }>
            <p className="text-xl mb-1">{step > i ? '✅' : s.icon}</p>
            <p className="text-xs font-bold" style={{ color: step >= i ? s.color : '#475569' }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Description panel */}
      <AnimatePresence mode="wait">
        {step >= 0 && (
          <motion.div
            key={`sae-${step}-${mode}`}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border"
            style={{ borderColor: SAE_STEPS[step].color + '40', background: SAE_STEPS[step].color + '08' }}>
            <p className="text-xs font-bold mb-1" style={{ color: SAE_STEPS[step].color }}>
              {SAE_STEPS[step].icon} {SAE_STEPS[step].label}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{SAE_STEPS[step].desc[mode]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion banner */}
      {step === 3 && !playing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel p-4 border border-emerald-500/40 bg-emerald-500/10 text-center">
          <p className="text-emerald-400 font-bold text-sm">🛡️ SAE Complete — PMK established with forward secrecy. 4-Way Handshake will derive PTK/GTK.</p>
          <ModeContent
            content={{
              kid: 'The Wi-Fi lock is set! Even if a spy recorded every message, they still can\'t figure out the password — because the real secret was never sent over the air!',
              enthusiast: 'Unlike WPA2-PSK, an attacker who captures all SAE frames cannot crack the password offline. Each new connection gets a fresh, unique PMK — perfect forward secrecy.',
              pro: 'SAE provides forward secrecy by deriving PMK from ephemeral scalars/elements. No offline dictionary attack possible: brute-force requires live interaction per guess (anti-clogging token rate-limits attempts). WPA3 mandates PMF (802.11w) alongside SAE.',
            }}
            className="text-xs text-slate-400 mt-2"
          />
        </motion.div>
      )}
    </div>
  );
}

// ─── 802.1X Enterprise Auth ───────────────────────────────────────────────────
function EnterpriseAuth() {
  const { mode } = useApp();
  const [activeStep, setActiveStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ENTERPRISE_STEPS = [
    {
      from: 'client', to: 'ap', label: '802.1X Start / EAPOL-Start', color: '#06b6d4', icon: '🤝',
      desc: {
        kid: '🤝 Your device knocks on the AP\'s door and says "I want to join! But I\'ll prove who I am through your security guard (RADIUS server)."',
        enthusiast: 'Client sends EAPOL-Start to the AP. The AP\'s port is in "Controlled Port" state — no data allowed yet, only EAP traffic passes.',
        pro: 'IEEE 802.1X port-based NAC. Supplicant (STA) sends EAPOL-Start. Authenticator (AP) port state: uncontrolled (EAP only). AP acts as passthrough proxy to Authentication Server (AS/RADIUS).',
      },
    },
    {
      from: 'ap', to: 'client', label: 'EAP-Request / Identity', color: '#a855f7', icon: '❓',
      desc: {
        kid: '❓ The security guard (AP) asks: "What\'s your name/username?"',
        enthusiast: 'AP sends EAP-Request/Identity — asking for the client\'s username. This begins the EAP conversation.',
        pro: 'AP → STA: EAPOL frame with EAP Code=1 (Request), Type=1 (Identity). Starts EAP state machine.',
      },
    },
    {
      from: 'client', to: 'ap', label: 'EAP-Response / Identity', color: '#a855f7', icon: '👤',
      desc: {
        kid: '👤 Your device replies with your username: "I\'m user@company.com!"',
        enthusiast: 'Client responds with its identity (username/cert subject). AP forwards to RADIUS server.',
        pro: 'STA → AP: EAP-Response/Identity (user@realm). AP encapsulates in RADIUS Access-Request and forwards to AS.',
      },
    },
    {
      from: 'ap', to: 'radius', label: 'RADIUS Access-Request + EAP', color: '#f59e0b', icon: '📤',
      desc: {
        kid: '📤 The AP forwards your identity to the big RADIUS authentication server in the company\'s secure room.',
        enthusiast: 'AP wraps the EAP message in RADIUS and sends it to the RADIUS server (AS). RADIUS runs on UDP 1812.',
        pro: 'RADIUS Access-Request: NAS-IP, NAS-Port, Calling-Station-Id (STA MAC), EAP-Message attribute. RADIUS shared secret (NAS-to-AS). EAP method negotiated: PEAP/MSCHAPv2, EAP-TLS, TTLS, etc.',
      },
    },
    {
      from: 'radius', to: 'ap', label: 'RADIUS Challenge + EAP-Method', color: '#f59e0b', icon: '🧩',
      desc: {
        kid: '🧩 The RADIUS server sends back a challenge: "Prove your identity — use your digital certificate or password!"',
        enthusiast: 'RADIUS issues a challenge (EAP-TLS: certificate request; PEAP: begin TLS tunnel for MSCHAPv2). Multiple round-trips may occur.',
        pro: 'RADIUS Access-Challenge → AP → STA. EAP-TLS: server sends TLS ServerHello + cert. PEAP: TLS tunnel established, inner MSCHAPv2 follows. EAP-TTLS: TLS tunnel + PAP/CHAP inside.',
      },
    },
    {
      from: 'radius', to: 'ap', label: 'RADIUS Access-Accept + MSK', color: '#10b981', icon: '✅',
      desc: {
        kid: '✅ "Identity confirmed! You\'re who you say you are!" The RADIUS server sends a secret Master Key to the AP.',
        enthusiast: 'RADIUS sends Access-Accept plus the MSK (Master Session Key) — this is used to derive the PMK for the WPA2/WPA3 4-way handshake.',
        pro: 'RADIUS Access-Accept includes EAP-Success + MS-MPPE-Recv-Key + MS-MPPE-Send-Key attributes containing first 64B of MSK. PMK = MSK[0:32]. AP and STA independently derive same PMK. 4-way handshake follows to derive PTK/GTK.',
      },
    },
    {
      from: 'ap', to: 'client', label: 'EAP-Success + 4-Way Handshake', color: '#10b981', icon: '🎉',
      desc: {
        kid: '🎉 The AP tells you "Welcome! You\'re authenticated!" and immediately starts the secret key exchange (4-way handshake) to encrypt your data.',
        enthusiast: '802.1X port opens. EAP-Success sent. 4-way handshake derives PTK/GTK. Full data access granted.',
        pro: 'EAP-Success sent to STA. Authenticator port transitioned to AUTHORIZED. 4-way handshake (PTK/GTK derivation) completes. Optionally: PMKSA cached (pmkid for roaming). Per-user VLAN assignment possible via RADIUS Tunnel-Pvt-Group-ID attribute.',
      },
    },
  ];

  const play = useCallback(() => {
    if (timerRef2.current) clearTimeout(timerRef2.current);
    setActiveStep(-1); setPlaying(true);
    ENTERPRISE_STEPS.forEach((_, i) => {
      timerRef2.current = setTimeout(() => {
        setActiveStep(i);
        if (i === ENTERPRISE_STEPS.length - 1) setPlaying(false);
      }, (i + 1) * 1400);
    });
  }, []);

  useEffect(() => () => { if (timerRef2.current) clearTimeout(timerRef2.current); }, []);

  const nodes = [
    { id: 'client', x: 80,  label: 'STA / Supplicant',  icon: '💻', color: '#06b6d4' },
    { id: 'ap',     x: 320, label: 'AP / Authenticator', icon: '📡', color: '#a855f7' },
    { id: 'radius', x: 560, label: 'RADIUS / Auth Server',icon: '🏛️', color: '#f59e0b' },
  ];

  return (
    <div className="glass-panel p-5 border-glow-green space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">802.1X Enterprise Authentication (EAP-TLS / PEAP)</h3>
        <div className="flex gap-2">
          <button onClick={() => { setActiveStep(-1); setPlaying(false); }} className="btn-ghost text-xs flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
          <button onClick={play} disabled={playing} className="btn-primary text-xs flex items-center gap-1">
            <Play size={12} fill="currentColor" /> {playing ? 'Authenticating…' : 'Animate'}
          </button>
        </div>
      </div>

      {/* Topology */}
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 640 160" className="w-full" style={{ maxHeight: 160 }}>
          {/* Timelines */}
          {nodes.map(n => (
            <line key={n.id} x1={n.x} y1={45} x2={n.x} y2={148} stroke="rgba(100,116,139,0.2)" strokeDasharray="4 3" strokeWidth="1" />
          ))}
          {/* Nodes */}
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x},25)`}>
              <circle r="20" fill={n.color + '15'} stroke={n.color + '60'} strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12">{n.icon}</text>
              <text textAnchor="middle" y="32" fill="#94a3b8" fontSize="8" fontFamily="Inter">{n.label}</text>
            </g>
          ))}
          {/* Step arrows */}
          {ENTERPRISE_STEPS.slice(0, activeStep + 1).map((s, i) => {
            const fromNode = nodes.find(n => n.id === s.from)!;
            const toNode   = nodes.find(n => n.id === s.to)!;
            const y = 60 + i * 13;
            return (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <line x1={fromNode.x} y1={y} x2={toNode.x} y2={y} stroke={s.color} strokeWidth="1.2" />
                <text x={(fromNode.x + toNode.x) / 2} y={y - 3} textAnchor="middle" fill={s.color} fontSize="7" fontFamily="JetBrains Mono">
                  {s.label.split(' ')[0]}
                </text>
                <polygon points={toNode.x > fromNode.x ? `${toNode.x - 6},${y - 3} ${toNode.x},${y} ${toNode.x - 6},${y + 3}` : `${toNode.x + 6},${y - 3} ${toNode.x},${y} ${toNode.x + 6},${y + 3}`} fill={s.color} />
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Step pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {ENTERPRISE_STEPS.map((s, i) => (
          <button key={i} onClick={() => !playing && setActiveStep(i)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
            style={activeStep === i ? { borderColor: s.color + '60', background: s.color + '15', color: s.color }
              : activeStep > i ? { borderColor: '#10b98140', color: '#10b981' }
              : { borderColor: '#334155', color: '#64748b' }}>
            {s.icon} {i + 1}{activeStep > i ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeStep >= 0 && (
          <motion.div key={`ent-${activeStep}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-xl p-4 border" style={{ borderColor: ENTERPRISE_STEPS[activeStep].color + '40', background: ENTERPRISE_STEPS[activeStep].color + '08' }}>
            <p className="text-xs font-bold mb-1" style={{ color: ENTERPRISE_STEPS[activeStep].color }}>
              {ENTERPRISE_STEPS[activeStep].icon} {ENTERPRISE_STEPS[activeStep].label}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{ENTERPRISE_STEPS[activeStep].desc[mode]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Threats Tab ──────────────────────────────────────────────────────────────
const THREAT_ITEMS = [
  {
    name: 'Evil Twin / Rogue AP',
    icon: '👹',
    severity: 'Critical',
    severityColor: '#ef4444',
    vector: 'Attacker broadcasts a cloned SSID with stronger signal to lure clients',
    impact: 'Full MITM — captures credentials, injects traffic, decrypts sessions',
    mitigation: 'WPA3-SAE (no offline crack), WIPS rogue detection, 802.1X mutual auth',
    content: {
      kid: '👹 Imagine a fake coffee shop Wi-Fi that looks exactly like the real one — but the owner is secretly reading all your messages! That\'s an Evil Twin attack.',
      enthusiast: 'Attacker sets up an AP with the same SSID and BSSID spoofing. Clients are deauth-ed from the real AP and connect to the fake one. All HTTP traffic is intercepted. HTTPS requires a separate downgrade attack.',
      pro: 'Evil Twin leverages IEEE 802.11 open auth — no mutual authentication in WPA2-PSK. Hostapd + dnsmasq + SSLstrip. EAP-TLS prevents this via server cert validation. WIPS detects SSID mismatch + wired-side correlation. HSTS/HSTS preload limits HTTP downgrade effectiveness.',
    },
  },
  {
    name: 'Deauth / Disassoc Flood',
    icon: '💥',
    severity: 'High',
    severityColor: '#f59e0b',
    vector: 'Inject spoofed deauth/disassoc frames with victim BSSID/STA addresses',
    impact: 'DoS — continuous client disconnections, forces reconnection storms',
    mitigation: 'PMF (802.11w) encrypts unicast mgmt frames; WPA3 mandates PMF',
    content: {
      kid: '💥 Imagine someone sending fake "FIRE!" alarms over and over — everybody keeps running out of the building! That\'s a deauth flood — fake disconnect messages.',
      enthusiast: 'Management frames (deauth/disassoc) were unprotected before 802.11w. An attacker spoofs the AP\'s MAC and sends deauth to all clients (broadcast). No authentication required for these frames in WPA2 without PMF.',
      pro: 'IEEE 802.11w (PMF) encrypts unicast deauth/disassoc using PTK (CCMP/GCMP). Broadcast deauth protected by IGTK + BIP (AES-128-CMAC). MDK3, aireplay-ng execute deauth floods. PMF negotiated via MFPC/MFPR bits in RSN IE. WPA3 mandates MFPR=1.',
    },
  },
  {
    name: 'PMKID Attack',
    icon: '🔓',
    severity: 'High',
    severityColor: '#f59e0b',
    vector: 'Capture a single EAPOL frame containing PMKID; run offline dictionary attack',
    impact: 'Offline PSK brute-force — no need to capture full 4-way handshake',
    mitigation: 'Use WPA3-SAE (no PMKID exposure), enforce strong passphrase policy',
    content: {
      kid: '🔓 Hackers found a shortcut — they only need ONE message from the Wi-Fi handshake to try guessing your password offline. Like getting a piece of a puzzle and solving it alone.',
      enthusiast: 'Discovered by Jens Steube (2018). PMKID = HMAC-SHA1-128(PMK, "PMK Name" || BSSID || client MAC) is included in EAPOL Message 1. Allows offline dictionary attack without capturing a full 4-way handshake.',
      pro: 'PMKID = HMAC-SHA1-128(PMK, "PMK Name"||AA||SPA). Derived from PMK which itself derives from passphrase via PBKDF2-SHA1 (4096 iterations). Hashcat mode 22000 attacks PMKID. hcxdumptool captures from a single frame. WPA3-SAE eliminates PMKID vulnerability.',
    },
  },
  {
    name: 'KRACK',
    icon: '🔑',
    severity: 'Critical',
    severityColor: '#ef4444',
    vector: 'CVE-2017-13077: force nonce reuse in 4-way handshake via retransmission',
    impact: 'Nonce reuse breaks CCMP/TKIP — decrypts traffic, replays packets',
    mitigation: 'Patch OS/firmware; WPA3-SAE forward secrecy limits KRACK exposure',
    content: {
      kid: '🔑 KRACK found a bug where the Wi-Fi handshake could be "rewound" like a video tape — making the same key get used twice. When you reuse keys, the encryption breaks!',
      enthusiast: 'Mathy Vanhoef (2017). By replaying handshake Message 3, the client reinstalls an already-used key + resets nonces. Nonce reuse in CCMP allows traffic decryption. Virtually all WPA2 devices were affected.',
      pro: 'Four-way handshake: Message 3 retransmission causes STA to reinstall PTK with zeroed PN (Packet Number). CCMP nonce reuse → keystream reuse → XOR plaintext recovery. GCMP is worse: nonce reuse leaks auth key. Patches enforce "install key once." WPA3-SAE per-session PMK limits blast radius.',
    },
  },
  {
    name: 'Dragonblood',
    icon: '🩸',
    severity: 'High',
    severityColor: '#f59e0b',
    vector: 'WPA3-SAE side-channel (timing/cache) leaks bits of password; DoS via commit flooding',
    impact: 'Partial password recovery via timing analysis; AP resource exhaustion',
    mitigation: 'WPA3-Rev1 patches (constant-time PWE); anti-clogging token rate-limits commits',
    content: {
      kid: '🩸 Even the newest WPA3 had a bug! Scientists found that by measuring how long the AP took to respond, they could guess letters of the password. Like guessing a code by listening to someone type.',
      enthusiast: 'Vanhoef & Ronen (2019). SAE\'s hash-to-curve (Hunting-and-Pecking) had timing variations based on password bits. Side-channel analysis recovers partial password info. Also: SAE commit flooding causes AP DoS.',
      pro: 'H&P algorithm: loop iterations vary by password → timing oracle. Cache-based side-channel via flush+reload. WPA3-Rev1 mandates constant-time SSWU (Simplified SWU) algorithm for P-256. Anti-clogging token (ACT): AP issues token before accepting commit, rate-limits state creation.',
    },
  },
  {
    name: 'Karma Attack',
    icon: '🎭',
    severity: 'High',
    severityColor: '#f59e0b',
    vector: 'Respond to any probe request with matching SSID — auto-connect clients',
    impact: 'Mass client capture — devices auto-connect to rogue AP on remembered SSIDs',
    mitigation: 'Disable auto-join for open networks; use randomized MAC probing; 802.1X',
    content: {
      kid: '🎭 Your phone remembers Wi-Fi networks. Karma tricks it: when your phone asks "Is my old Wi-Fi around?", the attacker\'s device says "YES! It\'s me!" — even though it\'s not!',
      enthusiast: 'Karma exploits 802.11 probe requests — devices actively probe for remembered SSIDs. A Karma-enabled rogue AP responds to any probe with a matching SSID, causing auto-connection.',
      pro: 'iOS/Android mitigations: randomized probe requests + null SSID probing. Still effective against legacy devices. Hostapd-wpe implements Karma. Combined with PEAP/GTC credential harvesting. Mitigation: PNL (Preferred Network List) management, 802.1X with server cert validation.',
    },
  },
  {
    name: 'Wardriving / RF Sniffing',
    icon: '📻',
    severity: 'Medium',
    severityColor: '#06b6d4',
    vector: 'Passive capture of 802.11 frames in monitor mode — no association needed',
    impact: 'Capture management frames, PMKID, partial handshakes for offline analysis',
    mitigation: 'WPA3 encryption; use VPN; avoid unencrypted protocols (HTTP, Telnet)',
    content: {
      kid: '📻 Wardriving is like having a super antenna in your car that can hear all nearby Wi-Fi conversations. Even if you can\'t understand them (encryption), you can record them for later.',
      enthusiast: 'Monitor mode captures all frames in the air including beacons, probes, handshakes. Tools: Wireshark, airodump-ng. PMKID can be extracted from captures for offline cracking. Passive — completely undetectable.',
      pro: 'Monitor mode (RFMON): driver bypasses association — captures all 802.11 frames on channel. hcxdumptool optimized for PMKID/EAPOL capture. WPA2 data frames encrypted (CCMP) but headers/management unencrypted. 2.4/5/6 GHz require separate captures. GPS correlation enables geolocation mapping.',
    },
  },
  {
    name: 'Rogue DHCP / DNS Spoofing',
    icon: '☠️',
    severity: 'High',
    severityColor: '#f59e0b',
    vector: 'After association, serve malicious DHCP offers with attacker DNS server IP',
    impact: 'Full DNS MITM — redirect all hostnames to attacker-controlled IPs',
    mitigation: 'DHCP snooping on switches; DNS-over-HTTPS/TLS; 802.1X identity enforcement',
    content: {
      kid: '☠️ After you connect, a hacker can pretend to be the network\'s "address book" (DNS). When you type "google.com", they send you to their fake website instead!',
      enthusiast: 'After connecting to a rogue AP, DHCP serves an attacker-controlled DNS. All hostname resolution goes through attacker. HTTPS with HSTS helps but doesn\'t cover all apps. Combined with SSLstrip on non-preloaded domains.',
      pro: 'Rogue DHCP: race condition — attacker responds faster than legitimate DHCP. Options 6 (DNS) + 3 (gateway) redirect all traffic. DNSmasq on attacker AP. DNSSEC validation by client prevents spoofing but rarely enforced. DoT/DoH bypasses if client ignores DHCP DNS. DHCP snooping on managed switches prevents on-LAN attacks.',
    },
  },
];

function ThreatsTab() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<number | null>(null);

  const severityOrder = ['Critical', 'High', 'Medium'];

  return (
    <div className="space-y-5">
      <ModeContent
        content={{
          kid: 'Wi-Fi has many different kinds of attackers trying to trick your device. Let\'s learn about each one and how to stay safe!',
          enthusiast: 'WLAN threats range from passive eavesdropping to active protocol attacks. Understanding attack vectors helps select appropriate mitigations.',
          pro: 'IEEE 802.11 management frame vulnerabilities, PSK offline attack surface, and protocol design weaknesses define the WLAN threat landscape. PMF, WPA3-SAE, and 802.1X mutual auth are primary mitigations.',
        }}
        className="text-sm text-slate-400"
      />

      {/* Severity legend */}
      <div className="flex gap-3 flex-wrap">
        {severityOrder.map(sev => {
          const color = sev === 'Critical' ? '#ef4444' : sev === 'High' ? '#f59e0b' : '#06b6d4';
          return (
            <div key={sev} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400">{sev}</span>
            </div>
          );
        })}
      </div>

      {/* Threat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THREAT_ITEMS.map((threat, idx) => (
          <motion.button
            key={threat.name}
            onClick={() => setSelected(selected === idx ? null : idx)}
            className="glass-panel p-4 border text-left transition-all hover:border-slate-600"
            style={selected === idx ? { borderColor: threat.severityColor + '60', background: threat.severityColor + '08' } : { borderColor: '#1e293b' }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{threat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{threat.name}</p>
                  <span className="chip text-xs px-1.5 py-0 border"
                    style={{ color: threat.severityColor, borderColor: threat.severityColor + '40', background: threat.severityColor + '10' }}>
                    {threat.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{threat.vector}</p>
              </div>
            </div>

            <AnimatePresence>
              {selected === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-red-500/10 rounded-lg p-2">
                        <p className="text-xs font-bold text-red-400 mb-0.5">Impact</p>
                        <p className="text-xs text-slate-400">{threat.impact}</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-2">
                        <p className="text-xs font-bold text-emerald-400 mb-0.5">Mitigation</p>
                        <p className="text-xs text-slate-400">{threat.mitigation}</p>
                      </div>
                    </div>
                    <div className="rounded-lg p-3" style={{ background: threat.severityColor + '08', border: `1px solid ${threat.severityColor}20` }}>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {mode === 'kid' ? threat.content.kid : mode === 'enthusiast' ? threat.content.enthusiast : threat.content.pro}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── RADIUS & PKI Tab ─────────────────────────────────────────────────────────
function RADIUSTab() {
  const { mode } = useApp();

  const RADIUS_MSGS = [
    { from: 0, to: 1, label: 'Access-Request', color: '#06b6d4', note: 'UDP 1812 — EAP-Message, NAS-IP, Calling-Station-Id' },
    { from: 1, to: 0, label: 'Access-Challenge', color: '#a855f7', note: 'EAP method negotiation, server cert (EAP-TLS)' },
    { from: 0, to: 1, label: 'Access-Request', color: '#06b6d4', note: 'Client credential response (cert or MSCHAPv2)' },
    { from: 1, to: 0, label: 'Access-Accept', color: '#10b981', note: 'MSK included via MS-MPPE-Recv/Send-Key attrs' },
  ];

  const radiusAttrs = [
    { num: 1,  name: 'User-Name',            desc: 'Username / identity string' },
    { num: 4,  name: 'NAS-IP-Address',       desc: 'AP/NAS IP sending the request' },
    { num: 6,  name: 'Service-Type',         desc: 'Framed=2 (PPP/802.1X)' },
    { num: 8,  name: 'Framed-IP-Address',    desc: 'IP to assign client (optional)' },
    { num: 30, name: 'Called-Station-Id',    desc: 'AP MAC:SSID (aa:bb:cc:dd:ee:ff:MyWifi)' },
    { num: 79, name: 'EAP-Message',          desc: 'Encapsulated EAP frame (fragmented if >253B)' },
    { num: 80, name: 'Message-Authenticator',desc: 'HMAC-MD5 over entire RADIUS packet — required with EAP' },
  ];

  const NODE_X = [100, 320, 540] as const;
  const NODE_LABELS = ['Supplicant\n(STA)', 'Authenticator\n(AP/NAS)', 'RADIUS Server\n(AS)'];
  const NODE_ICONS = ['💻', '📡', '🏛️'];
  const NODE_COLORS = ['#06b6d4', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-5">
      <ModeContent
        content={{
          kid: 'RADIUS is like a bouncer\'s boss — the AP (bouncer) checks with a central RADIUS server to decide if you\'re allowed in. The PKI certificates are like special unforgeable ID cards!',
          enthusiast: 'RADIUS (Remote Authentication Dial-In User Service) is the AAA server for 802.1X. It authenticates users, authorizes access, and can account for usage. PKI provides cryptographic identity via X.509 certificates.',
          pro: 'RFC 2865 RADIUS. UDP 1812 (auth), 1813 (acct). Shared secret between NAS and AS (HMAC-MD5 authenticator). EAP-Message attribute fragments EAP frames. Message-Authenticator (attr 80) mandatory with EAP per RFC 3579. PKI: X.509v3, TLS 1.3 preferred.',
        }}
        className="text-sm text-slate-400"
      />

      {/* 3-column ladder */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-4">RADIUS/AAA Message Flow</h4>
        <div className="bg-surface-900/70 rounded-xl overflow-hidden">
          <svg viewBox="0 0 640 200" className="w-full" style={{ maxHeight: 200 }}>
            {/* Timeline lines */}
            {NODE_X.map((x, i) => (
              <line key={i} x1={x} y1={45} x2={x} y2={190} stroke="rgba(100,116,139,0.2)" strokeDasharray="4 3" strokeWidth="1" />
            ))}
            {/* Nodes */}
            {NODE_X.map((x, i) => (
              <g key={i} transform={`translate(${x},25)`}>
                <circle r="19" fill={NODE_COLORS[i] + '18'} stroke={NODE_COLORS[i] + '60'} strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="11">{NODE_ICONS[i]}</text>
                {NODE_LABELS[i].split('\n').map((line, li) => (
                  <text key={li} textAnchor="middle" y={30 + li * 10} fill="#94a3b8" fontSize="7" fontFamily="Inter">{line}</text>
                ))}
              </g>
            ))}
            {/* Message arrows */}
            {RADIUS_MSGS.map((msg, i) => {
              const fromX = NODE_X[msg.from];
              const toX = msg.from === 0 ? NODE_X[1] : NODE_X[0];
              const y = 70 + i * 30;
              const goingRight = fromX < toX;
              return (
                <g key={i}>
                  <line x1={fromX} y1={y} x2={toX} y2={y} stroke={msg.color} strokeWidth="1.4" />
                  <polygon
                    points={goingRight
                      ? `${toX - 7},${y - 4} ${toX},${y} ${toX - 7},${y + 4}`
                      : `${toX + 7},${y - 4} ${toX},${y} ${toX + 7},${y + 4}`}
                    fill={msg.color}
                  />
                  <text x={(fromX + toX) / 2} y={y - 4} textAnchor="middle" fill={msg.color} fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="600">
                    {msg.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-3 space-y-1.5">
          {RADIUS_MSGS.map((msg, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="font-mono font-bold" style={{ color: msg.color }}>{msg.label}</span>
              <span className="text-slate-500">{msg.note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RADIUS Packet Structure */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">RADIUS Packet Structure</h4>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {[
            { label: 'Code', bytes: 1, color: '#06b6d4', note: '1=Req 2=Accept 3=Reject 11=Challenge' },
            { label: 'Identifier', bytes: 1, color: '#a855f7', note: 'Match request to response' },
            { label: 'Length', bytes: 2, color: '#8b5cf6', note: 'Total packet length (20–4096)' },
            { label: 'Authenticator', bytes: 16, color: '#f59e0b', note: 'Random (req) or MD5 hash (resp)' },
            { label: 'Attributes (TLV)', bytes: 0, color: '#10b981', note: 'Type(1B) + Length(1B) + Value' },
          ].map((f, i) => (
            <div key={i} className="flex-shrink-0 text-center rounded-lg px-2 py-1.5"
              style={{ background: f.color + '15', border: `1px solid ${f.color}40`, minWidth: f.bytes > 4 ? '120px' : f.bytes > 1 ? '70px' : '50px' }}>
              <p className="text-xs font-bold font-mono" style={{ color: f.color }}>{f.label}</p>
              {f.bytes > 0 && <p className="text-xs text-slate-500">{f.bytes}B</p>}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-1.5">
          <p className="text-xs font-bold text-slate-400 mb-1">Key Attributes</p>
          {radiusAttrs.map(attr => (
            <div key={attr.num} className="flex gap-2 text-xs items-start">
              <span className="font-mono text-cyan-400 w-6 text-right flex-shrink-0">{attr.num}</span>
              <span className="font-mono text-purple-400 flex-shrink-0 w-36">{attr.name}</span>
              <span className="text-slate-500">{attr.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PKI for 802.1X */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">PKI Chain for 802.1X</h4>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Root CA', icon: '🏛️', color: '#f59e0b', note: 'Self-signed trust anchor — offline/air-gapped' },
            { label: 'Intermediate CA', icon: '🔗', color: '#a855f7', note: 'Signs server and client certs — online CA' },
            { label: 'Server Certificate', icon: '📡', color: '#06b6d4', note: 'Installed on RADIUS server — CN/SAN validated by supplicant' },
            { label: 'Client Certificate', icon: '💻', color: '#10b981', note: 'Unique per user/device — EAP-TLS mutual auth' },
          ].map((level, i) => (
            <div key={i} className="flex items-start gap-3">
              {i > 0 && <div className="w-4 h-4 mt-0.5 ml-2 text-slate-600 text-xs">└</div>}
              <div className="flex-1 flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ background: level.color + '10', border: `1px solid ${level.color}30`, marginLeft: i * 16 }}>
                <span className="text-base">{level.icon}</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: level.color }}>{level.label}</p>
                  <p className="text-xs text-slate-500">{level.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ModeContent
          content={{
            kid: 'The PKI is like a chain of trust stamps: the Root CA is the king who certifies the prince (Intermediate CA), who certifies the knight (Server). Your device checks the whole chain!',
            enthusiast: 'Supplicant validates: (1) server cert CN/SAN matches expected RADIUS hostname, (2) cert signed by trusted CA, (3) cert not expired/revoked. Certificate pinning adds extra assurance against rogue RADIUS.',
            pro: 'EAP-TLS: mutual TLS 1.3 with client cert. Supplicant must validate server cert CN/SAN + CA chain + OCSP/CRL revocation. Certificate pinning via supplicant profile (hostapd subject-match). SCEP/EST for cert lifecycle automation. CRL/OCSP must be reachable during auth.',
          }}
          className="text-xs text-slate-400 mt-3"
        />
      </div>

      {/* RADIUS HA */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">RADIUS High Availability</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Primary RADIUS', icon: '🟢', note: 'Active — all auth requests' },
            { label: 'Failover', icon: '🔄', note: '30s timeout → dead server detection' },
            { label: 'Secondary RADIUS', icon: '🟡', note: 'Standby — takes over on primary failure' },
          ].map((item, i) => (
            <div key={i} className="bg-surface-900/60 rounded-xl p-3">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs font-bold text-white">{item.label}</p>
              <p className="text-xs text-slate-500 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {mode === 'pro'
            ? 'RADIUS retransmit: 3 retries × 10s = 30s dead detection. NAS marks server dead → failover. Dead server resurrection probe after 60s. ISE/ACS support RADIUS proxy for geo-distributed deployments. CoA (Change of Authorization, RFC 5176) allows dynamic policy updates post-auth.'
            : 'If the primary RADIUS server goes down, the AP detects this after ~30 seconds and switches to the secondary server automatically. Cisco ISE and Aruba ClearPass support active-active HA with load balancing.'}
        </p>
      </div>
    </div>
  );
}

// ─── WPA3 Enterprise Tab ──────────────────────────────────────────────────────
function WPA3EnterpriseTab() {

  const comparisonRows = [
    { label: 'Cipher',        wpa2: 'AES-128-CCMP',    wpa3: 'AES-128-GCMP',    wpa3_192: 'GCMP-256' },
    { label: 'Integrity',     wpa2: 'HMAC-SHA1',        wpa3: 'HMAC-SHA256',     wpa3_192: 'HMAC-SHA384' },
    { label: 'Key Exchange',  wpa2: 'RSA-2048',         wpa3: 'RSA-2048',        wpa3_192: 'P-384 / RSA-3072' },
    { label: 'EAP Methods',   wpa2: 'PEAP, EAP-TLS, TTLS, FAST, SIM', wpa3: 'EAP-TLS preferred', wpa3_192: 'EAP-TLS only' },
    { label: 'PMF (802.11w)', wpa2: 'Optional',         wpa3: 'Mandatory',       wpa3_192: 'Mandatory' },
    { label: 'AKM Suite',     wpa2: '00-0F-AC:1 / :3',  wpa3: '00-0F-AC:5',      wpa3_192: '00-0F-AC:12' },
  ];

  const suiteBItems = [
    { alg: 'ECDHE P-384',   purpose: 'Key agreement (ephemeral, forward secrecy)' },
    { alg: 'ECDSA P-384',   purpose: 'Digital signatures (cert authentication)' },
    { alg: 'SHA-384',       purpose: 'Hash / integrity (HMAC-SHA384)' },
    { alg: 'AES-256-GCM',  purpose: 'Authenticated encryption (GCMP-256)' },
  ];

  return (
    <div className="space-y-5">
      <ModeContent
        content={{
          kid: 'WPA3-Enterprise is like upgrading from a simple lock to a bank vault — it uses bigger keys and better math to protect company Wi-Fi networks!',
          enthusiast: 'WPA3-Enterprise 192-bit mode (CNSA Suite-B) uses government-grade cryptography: P-384 elliptic curves, AES-256-GCM, SHA-384. Designed for classified/sensitive environments.',
          pro: 'WPA3-Enterprise 192-bit: CNSA Suite B per NSA/CNSSP-15. AKM 00-0F-AC:12. EAP-TLS only (no PEAP/TTLS). GCMP-256 (AES-256 GCM). ECDHE/ECDSA P-384. SHA-384 HMAC. PMF mandatory (MFPR=1). IEEE 802.11-2020 Section 9.4.2.24.',
        }}
        className="text-sm text-slate-400"
      />

      {/* Comparison Table */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-4">WPA2 vs WPA3 vs WPA3-Enterprise 192-bit</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 text-slate-500 font-semibold"></th>
                <th className="py-2 px-3 text-center">
                  <span className="text-blue-400 font-bold">WPA2-Enterprise</span>
                </th>
                <th className="py-2 px-3 text-center">
                  <span className="text-emerald-400 font-bold">WPA3-Enterprise</span>
                </th>
                <th className="py-2 px-3 text-center">
                  <span className="text-purple-400 font-bold">WPA3-Ent 192-bit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-surface-900/40' : ''}>
                  <td className="py-2 px-3 text-slate-400 font-semibold">{row.label}</td>
                  <td className="py-2 px-3 text-center text-slate-400 font-mono">{row.wpa2}</td>
                  <td className="py-2 px-3 text-center text-slate-300 font-mono">{row.wpa3}</td>
                  <td className="py-2 px-3 text-center text-purple-300 font-mono font-bold">{row.wpa3_192}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suite-B-192 Breakdown */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">CNSA Suite-B-192 Algorithms</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suiteBItems.map((item, i) => {
            const colors = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981'];
            return (
              <div key={i} className="rounded-xl p-3" style={{ background: colors[i] + '10', border: `1px solid ${colors[i]}30` }}>
                <p className="text-xs font-bold font-mono mb-0.5" style={{ color: colors[i] }}>{item.alg}</p>
                <p className="text-xs text-slate-400">{item.purpose}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AKM Suites */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">AKM Suite OUIs</h4>
        <div className="space-y-2">
          {[
            { code: '00-0F-AC:1', label: 'WPA2-Enterprise (802.1X + AES-CCMP)', color: '#06b6d4' },
            { code: '00-0F-AC:5', label: 'WPA3-Personal (SAE)', color: '#10b981' },
            { code: '00-0F-AC:8', label: 'SAE (same as :5 in RSN IE)', color: '#10b981' },
            { code: '00-0F-AC:12', label: 'WPA3-Enterprise 192-bit (CNSA Suite-B)', color: '#a855f7' },
          ].map(akm => (
            <div key={akm.code} className="flex items-center gap-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: akm.color + '15', color: akm.color }}>{akm.code}</span>
              <span className="text-xs text-slate-400">{akm.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Requirements */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">Deployment Requirements</h4>
        <div className="space-y-2">
          {[
            { icon: '🏛️', req: 'PKI Infrastructure', detail: 'Root CA + Intermediate CA + cert management (SCEP/EST/ACME)' },
            { icon: '📋', req: 'Cert Lifecycle Management', detail: 'Enrollment, renewal, revocation (OCSP/CRL); short-lived certs recommended' },
            { icon: '💻', req: 'Supplicant Configuration', detail: 'MDM-pushed EAP-TLS profile: CA cert, client cert, server CN validation, disable fallback EAP methods' },
            { icon: '🔄', req: 'RADIUS HA', detail: 'Primary + secondary RADIUS; CoA support for dynamic policy; session accounting' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 items-start rounded-lg p-3 bg-surface-900/40">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-xs font-bold text-white">{item.req}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WIDS/WIPS Tab ────────────────────────────────────────────────────────────
function WIDSTab() {

  const rogueClasses = [
    { type: 'Interfering', icon: '📶', color: '#64748b', desc: 'Off-network AP causing co-channel interference — not a security threat but impacts performance' },
    { type: 'Rogue (Unauthorized)', icon: '⚠️', color: '#f59e0b', desc: 'Unauthorized AP connected to corporate network — data exfiltration risk' },
    { type: 'Malicious', icon: '🚨', color: '#ef4444', desc: 'Active attack tool — Evil Twin, Karma, deauth flood — immediate response required' },
  ];

  const vendors = [
    { name: 'Cisco WIPS', icon: '🔵', features: 'Dedicated 3600/3800 series sensors + CleanAir spectrum analysis. Monitors all channels simultaneously. >30 threat signatures.' },
    { name: 'Aruba RFProtect', icon: '🟠', features: 'Overlay WIPS sensors or dedicated monitor mode APs. Wired-side correlation via ARP table. Air Monitor (AM) role.' },
    { name: 'Juniper Mist AI', icon: '🟣', features: 'AI-driven anomaly detection. Cloud-managed. Marvis AI assistant. Dynamic packet capture on suspicious events.' },
  ];

  return (
    <div className="space-y-5">
      <ModeContent
        content={{
          kid: 'WIDS is like a security camera for Wi-Fi — it watches for bad guys. WIPS goes one step further and can actually kick bad guys out!',
          enthusiast: 'WIDS (Wireless Intrusion Detection System) detects threats; WIPS (Prevention System) actively contains them. Key functions: rogue AP detection, client classification, containment.',
          pro: 'WIDS/WIPS operates via dedicated RF sensors or time-sliced monitor mode APs. Detection: BSSID fingerprinting, wired-side ARP correlation, RSSI triangulation. Containment: targeted deauth (limited by PMF), RF jamming (illegal in many jurisdictions). Cisco standard: <30s detection time.',
        }}
        className="text-sm text-slate-400"
      />

      {/* WIDS vs WIPS */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            title: 'WIDS',
            subtitle: 'Detect Only',
            icon: '👁️',
            color: '#06b6d4',
            items: ['RF scanning for rogue APs', 'Client behavior analysis', 'Alert generation', 'Forensic logging', 'No active intervention'],
          },
          {
            title: 'WIPS',
            subtitle: 'Detect + Prevent',
            icon: '🛡️',
            color: '#10b981',
            items: ['All WIDS capabilities', 'Targeted deauth containment', 'Switch port shutdown (wired)', 'RF jamming (jurisdiction-dependent)', 'Automated response policies'],
          },
        ].map(sys => (
          <div key={sys.title} className="glass-panel p-4" style={{ borderColor: sys.color + '40' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{sys.icon}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: sys.color }}>{sys.title}</p>
                <p className="text-xs text-slate-500">{sys.subtitle}</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {sys.items.map(item => (
                <li key={item} className="text-xs text-slate-400 flex gap-1.5">
                  <span style={{ color: sys.color }}>•</span> {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Rogue AP Classification */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">Rogue AP Classification</h4>
        <div className="space-y-3">
          {rogueClasses.map(cls => (
            <div key={cls.type} className="flex gap-3 items-start rounded-xl p-3"
              style={{ background: cls.color + '10', border: `1px solid ${cls.color}30` }}>
              <span className="text-xl mt-0.5">{cls.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: cls.color }}>{cls.type}</p>
                <p className="text-xs text-slate-400 mt-0.5">{cls.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detection Methods */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">Detection Methods</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'RF Scanning', icon: '📡', desc: 'Dedicated sensors scan all channels. Time-sliced or concurrent scanning. Collects BSSID, SSID, RSSI, channel, security type.' },
            { title: 'BSSID Fingerprinting', icon: '🔍', desc: 'OUI lookup against known vendor list. Detect MAC spoofing via frame timing analysis. IE (Information Element) fingerprinting.' },
            { title: 'Wired-Side Correlation', icon: '🔗', desc: 'Match AP MAC from RF scan to ARP/MAC table on switches. If AP BSSID appears in wired ARP — it\'s connected to your network (rogue, not just interfering).' },
          ].map(method => (
            <div key={method.title} className="bg-surface-900/60 rounded-xl p-3">
              <p className="text-xl mb-1">{method.icon}</p>
              <p className="text-xs font-bold text-white mb-1">{method.title}</p>
              <p className="text-xs text-slate-500">{method.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">Key Metrics & Vendor Approaches</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { metric: '< 30s', label: 'Detection Time (Cisco standard)', color: '#10b981' },
            { metric: '15–20%', label: 'Recommended RF overlap for monitoring', color: '#06b6d4' },
          ].map(m => (
            <div key={m.metric} className="text-center rounded-xl p-3" style={{ background: m.color + '10', border: `1px solid ${m.color}30` }}>
              <p className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.metric}</p>
              <p className="text-xs text-slate-400 mt-1">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {vendors.map(v => (
            <div key={v.name} className="flex gap-3 items-start rounded-lg p-3 bg-surface-900/40">
              <span className="text-xl">{v.icon}</span>
              <div>
                <p className="text-xs font-bold text-white">{v.name}</p>
                <p className="text-xs text-slate-500">{v.features}</p>
              </div>
            </div>
          ))}
        </div>
        <ModeContent
          content={{
            kid: 'Think of WIPS vendors like different brands of security cameras — they all watch for bad guys but each has special features. Cisco is like the most popular brand in big companies!',
            enthusiast: 'Cisco CleanAir adds spectrum analysis to identify non-Wi-Fi interference (microwaves, Bluetooth, jammers). Aruba\'s wired-side correlation is particularly strong for rogue detection in campus networks.',
            pro: 'WIPS containment via deauth is limited by 802.11w PMF — protected clients cannot be deauth-ed by WIPS unless WIPS knows the IGTK (impossible externally). Switch-port shutdown via SNMP/NETCONF is reliable for wired-connected rogues. RF jamming requires FCC Part 15 exemption in US — generally illegal for non-government actors.',
          }}
          className="text-xs text-slate-400 mt-3"
        />
      </div>
    </div>
  );
}

// ─── PMF & Deauth Tab ─────────────────────────────────────────────────────────
function PMFTab() {
  const { mode } = useApp();
  const [showPMF, setShowPMF] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDemo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnimating(true);
    setCycleCount(0);
    let count = 0;
    const cycle = () => {
      count++;
      setCycleCount(count);
      if (count < 4) timerRef.current = setTimeout(cycle, 1400);
      else setAnimating(false);
    };
    timerRef.current = setTimeout(cycle, 600);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="space-y-5">
      <ModeContent
        content={{
          kid: 'Without protection, a hacker can send fake "DISCONNECT!" messages to kick everyone off Wi-Fi. PMF is like putting a seal on those messages so only real ones are accepted!',
          enthusiast: 'PMF (Protected Management Frames, 802.11w) encrypts unicast management frames using the PTK, preventing spoofed deauth attacks. WPA3 mandates PMF for all connections.',
          pro: 'IEEE 802.11w-2009 (merged into 802.11-2012). Unicast mgmt (deauth/disassoc/action): encrypted with CCMP/GCMP under PTK. Broadcast mgmt: IGTK + BIP (AES-128-CMAC). SA Query prevents key reinstall. PMF negotiated via MFPC/MFPR in RSN IE Capabilities field.',
        }}
        className="text-sm text-slate-400"
      />

      {/* Animated Demo */}
      <div className="glass-panel p-5 border-glow-blue">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h4 className="text-sm font-bold text-white">Deauth Flood Attack Demo</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPMF(false)}
              className={`px-3 py-1 text-xs rounded-lg border transition-all ${!showPMF ? 'border-red-500/60 bg-red-500/15 text-red-400' : 'border-slate-700 text-slate-500'}`}
            >
              Without PMF
            </button>
            <button
              onClick={() => setShowPMF(true)}
              className={`px-3 py-1 text-xs rounded-lg border transition-all ${showPMF ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400' : 'border-slate-700 text-slate-500'}`}
            >
              With PMF
            </button>
            <button onClick={runDemo} disabled={animating} className="btn-primary text-xs flex items-center gap-1">
              <Play size={11} fill="currentColor" /> Demo
            </button>
          </div>
        </div>

        <div className="bg-surface-900/70 rounded-xl p-4 min-h-[180px]">
          <svg viewBox="0 0 500 160" className="w-full" style={{ maxHeight: 160 }}>
            {/* Nodes */}
            {[
              { x: 80,  y: 40, icon: '💻', label: 'Client', color: '#06b6d4' },
              { x: 250, y: 40, icon: '📡', label: 'AP', color: showPMF ? '#10b981' : '#64748b' },
              { x: 420, y: 40, icon: '👾', label: 'Attacker', color: '#ef4444' },
            ].map((n, i) => (
              <g key={i} transform={`translate(${n.x},${n.y})`}>
                <circle r="20" fill={n.color + '18'} stroke={n.color + '50'} strokeWidth="1.5" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="13">{n.icon}</text>
                <text textAnchor="middle" y="32" fill="#94a3b8" fontSize="8" fontFamily="Inter">{n.label}</text>
              </g>
            ))}

            {/* Attack arrows */}
            {animating && !showPMF && (
              <>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 1.2, repeat: 3 }}>
                  <line x1={420} y1={40} x2={250} y2={40} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                  <text x={335} y={32} textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">Spoof deauth</text>
                </motion.g>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 0] }} transition={{ duration: 1.4, repeat: 3, delay: 0.4 }}>
                  <line x1={250} y1={40} x2={80} y2={40} stroke="#f59e0b" strokeWidth="1.5" />
                  <text x={165} y={32} textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">→ Deauth sent!</text>
                </motion.g>
              </>
            )}

            {/* PMF block */}
            {showPMF && animating && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                <line x1={420} y1={40} x2={290} y2={40} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}>
                  <circle cx={285} cy={40} r="14" fill="#10b98120" stroke="#10b98170" strokeWidth="1.5" />
                  <text x={285} y={44} textAnchor="middle" fontSize="14">🛡️</text>
                </motion.g>
                <text x={285} y={68} textAnchor="middle" fill="#10b981" fontSize="7.5" fontWeight="bold">PMF blocks!</text>
              </motion.g>
            )}

            {/* Status */}
            {cycleCount > 0 && (
              <motion.text
                x={250} y={140}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill={showPMF ? '#10b981' : '#ef4444'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {showPMF
                  ? '✓ Frame rejected — MIC verification failed (spoofed frame)'
                  : `Disconnect cycle ${cycleCount} — client forced to reconnect`}
              </motion.text>
            )}
          </svg>
        </div>
      </div>

      {/* PMF Protection Mechanism */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">PMF Protection Mechanisms</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              title: 'Unicast Frame Protection',
              icon: '🔐',
              color: '#06b6d4',
              items: [
                'Frames: Deauth, Disassoc, Action',
                'Encrypted with PTK (CCMP/GCMP)',
                'Replay protection via PN counter',
                'Attacker cannot spoof without PTK',
              ],
            },
            {
              title: 'Broadcast Frame Protection',
              icon: '📢',
              color: '#a855f7',
              items: [
                'IGTK (Integrity Group Temporal Key)',
                'BIP: AES-128-CMAC integrity',
                'MME (Management MIC Element) appended',
                'Group deauth frames integrity-protected',
              ],
            },
          ].map(sec => (
            <div key={sec.title} className="rounded-xl p-4" style={{ background: sec.color + '08', border: `1px solid ${sec.color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{sec.icon}</span>
                <p className="text-xs font-bold" style={{ color: sec.color }}>{sec.title}</p>
              </div>
              <ul className="space-y-1">
                {sec.items.map(item => (
                  <li key={item} className="text-xs text-slate-400 flex gap-1.5">
                    <span style={{ color: sec.color }}>▸</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* PMF Negotiation */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">PMF Negotiation (RSN IE Capabilities)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { mode: 'PMF Disabled', mfpc: 0, mfpr: 0, color: '#64748b', note: 'WPA2 default — no management frame protection' },
            { mode: 'PMF Optional', mfpc: 1, mfpr: 0, color: '#f59e0b', note: 'Mixed network — supports PMF but allows non-PMF clients' },
            { mode: 'PMF Required', mfpc: 1, mfpr: 1, color: '#10b981', note: 'WPA3 mandatory — only PMF-capable clients allowed' },
          ].map(opt => (
            <div key={opt.mode} className="text-center rounded-xl p-3" style={{ background: opt.color + '10', border: `1px solid ${opt.color}30` }}>
              <p className="text-xs font-bold mb-2" style={{ color: opt.color }}>{opt.mode}</p>
              <div className="flex gap-2 justify-center mb-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0f172a', color: opt.color }}>MFPC={opt.mfpc}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: '#0f172a', color: opt.color }}>MFPR={opt.mfpr}</span>
              </div>
              <p className="text-xs text-slate-500">{opt.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SA Query & Remaining Attack Surface */}
      <div className="glass-panel p-5 border-glow-blue">
        <h4 className="text-sm font-bold text-white mb-3">SA Query Procedure & Remaining Attack Surface</h4>
        <div className="space-y-3">
          <div className="rounded-xl p-3 bg-surface-900/60">
            <p className="text-xs font-bold text-cyan-400 mb-1">SA Query</p>
            <p className="text-xs text-slate-400">
              {mode === 'pro'
                ? 'SA Query (Security Association Query) detects key reinstallation attempts. If STA receives deauth/disassoc after PTK installed, sends SA-Query-Request to AP. AP responds with SA-Query-Response signed with current PTK. If no valid response — SA is considered compromised. Prevents KRACK-style reinstall attempts.'
                : 'SA Query is a handshake check: if your device receives a disconnect message after connecting, it sends a quick "Are you really the AP?" question. The AP must respond with a cryptographic proof — spoofed disconnect messages can\'t pass this test.'}
            </p>
          </div>
          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-bold text-amber-400 mb-1">Remaining Attack Surface (even with PMF)</p>
            <ul className="space-y-1">
              {[
                'Probe frames: not PMF-protected — SSID/capability probing still possible',
                'Beacon frames: not encrypted — SSID broadcast, capabilities visible',
                'Association/Authentication frames: not fully protected pre-PTK',
                'Physical layer: RF jamming, signal-level denial of service',
              ].map(item => (
                <li key={item} className="text-xs text-amber-300/80 flex gap-1.5">
                  <span className="text-amber-400">⚠</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ModeContent
          content={{
            kid: 'PMF is great, but it can\'t protect everything! Things like the Wi-Fi radio signals themselves can still be jammed, and some early messages before connection aren\'t protected yet.',
            enthusiast: 'PMF protects post-association management frames. Pre-association frames (probe, beacon, auth, assoc) remain unprotected. This limits PMF\'s ability to fully prevent deauth attacks at the earliest stage.',
            pro: 'WPA3 mandates PMF (MFPR=1) but cannot protect pre-association management. 802.11az (sensing) and future proposals aim to address beacon authentication. FILS (Fast Initial Link Setup, 802.11ai) provides some pre-assoc protection. OWE provides encrypted data for open networks but not management.',
          }}
          className="text-xs text-slate-400 mt-3"
        />
      </div>
    </div>
  );
}

// ─── Tab Icon Map ─────────────────────────────────────────────────────────────
const TAB_ICONS: Record<Tab, string> = {
  'Threats':          '⚔️',
  'Legacy Security':  '🔓',
  '4-Way Handshake':  '🤝',
  'WPA3 Personal':    '🛡️',
  'Enterprise Auth':  '🏢',
  'RADIUS & PKI':     '🏛️',
  'WPA3 Enterprise':  '🔒',
  'WIDS/WIPS':        '👁️',
  'PMF & Deauth':     '🛡️',
};

// ─── Main Export ──────────────────────────────────────────────────────────────
export function Chapter6() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Threats');
  useSubtopicNav(CH6_TAB_SUBTOPICS, setActiveTab);

  useEffect(() => {
    CH6_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch6', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="From WEP's shattered 60-second crack to WPA3's quantum-resistant SAE — the complete Wi-Fi security story with threats, 4-way handshake, SAE, 802.1X enterprise auth, RADIUS/PKI, WIDS/WIPS, and PMF protection." />
        <ModeBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {TAB_ICONS[tab]} {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Threats'          && <ThreatsTab />}
          {activeTab === 'Legacy Security'  && <SecurityEvolution />}
          {activeTab === '4-Way Handshake'  && <FourWayHandshake />}
          {activeTab === 'WPA3 Personal'    && <WPA3SAE />}
          {activeTab === 'Enterprise Auth'  && <EnterpriseAuth />}
          {activeTab === 'RADIUS & PKI'     && <RADIUSTab />}
          {activeTab === 'WPA3 Enterprise'  && <WPA3EnterpriseTab />}
          {activeTab === 'WIDS/WIPS'        && <WIDSTab />}
          {activeTab === 'PMF & Deauth'     && <PMFTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
