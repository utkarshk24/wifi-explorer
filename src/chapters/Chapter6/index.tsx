import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch6')!;

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

// ─── Security Evolution Timeline ─────────────────────────────────────────────
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

      {/* ── SVG Diagram ── */}
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

          {/* ── Row 0 · PWE Derivation (local, no packets) ── */}
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

          {/* ── Row 1 · Commit Exchange (simultaneous ↔) ── */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.g key="row1-lines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                {/* Client → AP */}
                <line x1={CL + 24} y1={R1y - 6} x2={AP - 24} y2={R1y - 6}
                  stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#sae-arr-c)" />
                {/* AP → Client */}
                <line x1={AP - 24} y1={R1y + 8} x2={CL + 24} y2={R1y + 8}
                  stroke="#06b6d4" strokeWidth="1.5" markerEnd="url(#sae-arr-c-lf)" />
                <text x={250} y={R1y - 13} textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold">SAE Commit (Auth seq=1) ↔ simultaneous</text>
                <text x={250} y={R1y + 20} textAnchor="middle" fill="#475569" fontSize="8">scalar + element (ECDH on P-256)</text>
              </motion.g>
            )}
          </AnimatePresence>
          {/* moving dots for commit */}
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

          {/* ── Row 2 · Confirm Exchange (simultaneous ↔) ── */}
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
          {/* moving dots for confirm */}
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

          {/* ── Row 3 · PMK Ready ── */}
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

      {/* ── Step cards ── */}
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

      {/* ── Description panel ── */}
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

      {/* ── Completion banner ── */}
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

export function Chapter6() {
  const { markComplete } = useApp();

  useEffect(() => {
    ['threats', 'legacy', 'wpa3', 'enterprise', 'radius', 'wpa3ent', 'wids', 'pmf_sec']
      .forEach(id => markComplete('ch6', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="From WEP's shattered 60-second crack to WPA3's quantum-resistant SAE — the complete Wi-Fi security story with 4-way handshake, SAE, and 802.1X enterprise auth." />
        <ModeBadge />
      </div>
      <SecurityEvolution />
      <FourWayHandshake />
      <WPA3SAE />
      <EnterpriseAuth />
    </div>
  );
}
