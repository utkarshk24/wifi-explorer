import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch5')!;

type FrameCategory = 'management' | 'control' | 'data';

interface FrameType {
  name: string;
  subtype: string;
  emoji: string;
  category: FrameCategory;
  description: Record<'kid' | 'enthusiast' | 'pro', string>;
  fields: { label: string; bytes: number; note?: string; color?: string }[];
}

const FRAMES: FrameType[] = [
  // ── Management ─────────────────────────────────────────────────────────────
  {
    name: 'Beacon', subtype: '0x08', emoji: '📻', category: 'management',
    description: {
      kid: '📻 The AP shouts "I am HERE!" every ~100ms. Like a lighthouse flashing its light for ships to find it!',
      enthusiast: 'Beacons broadcast the AP\'s presence, SSID, supported rates, and capabilities 10 times per second so nearby devices can discover the network.',
      pro: 'Mgmt subtype 0x08. Timestamp(8B), Beacon Interval(2B, 100TU=102.4ms), Capability Info(2B), SSID IE, Supported Rates IE, DS Param IE, RSN IE, HT/VHT/HE/EHT Cap IEs. Transmitted at lowest mandatory rate (1 or 6 Mbps).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Type=00 Sub=1000' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA (FF:FF:…)', bytes: 6, color: '#a855f7', note: 'Broadcast' },
      { label: 'SA (BSSID)', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'Timestamp', bytes: 8, color: '#f59e0b' },
      { label: 'Beacon Interval', bytes: 2, color: '#f59e0b', note: '100 TU' },
      { label: 'Capability', bytes: 2, color: '#10b981' },
      { label: 'IEs (SSID, Rates…)', bytes: 32, color: '#059669', note: 'Variable' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Probe Req', subtype: '0x04', emoji: '🔍', category: 'management',
    description: {
      kid: '🔍 Your phone shouts "Is anyone with Wi-Fi out there?" into the air. Any AP nearby will answer!',
      enthusiast: 'Your device sends Probe Requests when scanning for networks (active scan). It broadcasts or sends to a specific SSID and waits for Probe Responses.',
      pro: 'Mgmt subtype 0x04. STA → broadcast (or directed SSID). Contains: SSID IE (0 = wildcard probe), Supported Rates, HT/VHT/HE Cap. AP replies with Probe Response if SSID matches. Active scan vs passive (listen for Beacons only).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Sub=0100' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA (FF:FF:…)', bytes: 6, color: '#a855f7', note: 'Broadcast' },
      { label: 'SA (STA MAC)', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID (FF:FF:…)', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'SSID IE', bytes: 4, color: '#f59e0b', note: '0=wildcard' },
      { label: 'Supported Rates IE', bytes: 10, color: '#10b981' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Probe Resp', subtype: '0x05', emoji: '📢', category: 'management',
    description: {
      kid: '📢 An AP replies to your Probe Request: "YES! I\'m here and my name is HomeWifi!" — same info as a Beacon but sent directly to your device.',
      enthusiast: 'The AP replies to a Probe Request with its full capabilities. Your device collects these to decide which AP is best to join.',
      pro: 'Mgmt subtype 0x05. Unicast to requesting STA. Contains identical IEs to Beacon plus additional FT IE (if 802.11r capable). Used to populate STA scan cache for association decisions.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA (STA MAC)', bytes: 6, color: '#a855f7', note: 'Unicast to requester' },
      { label: 'SA (AP MAC)', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'Timestamp', bytes: 8, color: '#f59e0b' },
      { label: 'Capability', bytes: 2, color: '#10b981' },
      { label: 'IEs', bytes: 40, color: '#059669', note: 'SSID, Rates, RSN, HE Cap…' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Auth', subtype: '0x0B', emoji: '🔑', category: 'management',
    description: {
      kid: '🔑 The "Show Your ID" step — your device introduces itself to the AP. In modern Wi-Fi (WPA3), this is also where the secret handshake (SAE) begins!',
      enthusiast: 'Authentication frame exchanges happen before association. Open System auth is a 2-frame formality. WPA3-SAE uses Auth frames for its Dragonfly key exchange.',
      pro: 'Mgmt subtype 0x0B. Auth Algorithm (0=Open, 3=SAE), Transaction Seq, Status Code. Open: 2 frames. SAE: Commit(seq 1)→Commit(seq 1)→Confirm(seq 2)→Confirm(seq 2). 802.11r FT also uses Auth frames (Algorithm=2).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA', bytes: 6, color: '#a855f7' },
      { label: 'SA', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'Auth Algorithm', bytes: 2, color: '#f59e0b', note: '0=Open 3=SAE' },
      { label: 'Auth Seq', bytes: 2, color: '#f59e0b', note: '1 or 2' },
      { label: 'Status Code', bytes: 2, color: '#10b981', note: '0=Success' },
      { label: 'Challenge / SAE Commit', bytes: 16, color: '#059669', note: 'Variable' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Assoc Req', subtype: '0x00', emoji: '📝', category: 'management',
    description: {
      kid: '📝 After saying hi, your device formally applies for membership: "I\'d like to join your network! Here are my skills (capabilities)."',
      enthusiast: 'Association Request is the formal join request. The STA tells the AP exactly what features it supports (HT/VHT/HE capabilities, security methods, QoS options).',
      pro: 'Mgmt subtype 0x00. Contains: Capability Info, Listen Interval, SSID IE, Supported Rates, RSN IE, HT/VHT/HE Capability IEs, Extended Capabilities IE, TWT IE. AP responds with Assoc Response (AID or failure status).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA (AP)', bytes: 6, color: '#a855f7' },
      { label: 'SA (STA)', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'Capability Info', bytes: 2, color: '#f59e0b' },
      { label: 'Listen Interval', bytes: 2, color: '#f59e0b' },
      { label: 'SSID IE', bytes: 4, color: '#10b981' },
      { label: 'HE/VHT/HT Cap IEs', bytes: 28, color: '#059669', note: 'Variable' },
      { label: 'RSN IE', bytes: 24, color: '#ef4444' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Deauth', subtype: '0x0C', emoji: '🚪', category: 'management',
    description: {
      kid: '🚪 "You\'re kicked out of the Wi-Fi club!" — Deauth is a goodbye frame that instantly ends a connection. Hackers can fake these to disconnect you! (Protected Management Frames / WPA3 fixes this)',
      enthusiast: 'Deauthentication frames terminate a connection. Without PMF (Protected Management Frames), these can be spoofed by attackers to forcibly disconnect clients — the basis of deauth attacks.',
      pro: 'Mgmt subtype 0x0C. Reason Code field (2B) indicates why: RC 1=Unspecified, RC 2=Invalid auth, RC 7=BSS leaving. Without PMF (802.11w), unprotected — spoofable. With WPA3/PMF, deauth frames are encrypted + MIC protected via IGTK.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4' },
      { label: 'Duration', bytes: 2, color: '#0891b2' },
      { label: 'DA', bytes: 6, color: '#a855f7' },
      { label: 'SA', bytes: 6, color: '#8b5cf6' },
      { label: 'BSSID', bytes: 6, color: '#7c3aed' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'Reason Code', bytes: 2, color: '#ef4444', note: '1=Unspec 7=Leave' },
      { label: '[PMF MIC]', bytes: 16, color: '#10b981', note: 'WPA3 only' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  // ── Control ────────────────────────────────────────────────────────────────
  {
    name: 'RTS', subtype: '0xB', emoji: '🙋', category: 'control',
    description: {
      kid: '🙋 "I want to talk!" — A tiny 20-byte "permission to speak" frame. All other devices hear this and stay quiet.',
      enthusiast: '"Request To Send" — the sender asks permission before a large transmission. All devices set their NAV timer to stay quiet for the reserved duration.',
      pro: 'Control subtype 0xB. 20B frame: FC(2), Duration(2), RA=AP(6), TA=STA(6), FCS(4). Duration sets NAV on overhearing STAs. Only sent when MPDU > RTS Threshold (dot11RTSThreshold).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Type=01 Sub=1011' },
      { label: 'Duration', bytes: 2, color: '#f59e0b', note: 'Sets NAV' },
      { label: 'RA (AP)', bytes: 6, color: '#a855f7' },
      { label: 'TA (STA)', bytes: 6, color: '#8b5cf6' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'CTS', subtype: '0xC', emoji: '✋', category: 'control',
    description: {
      kid: '✋ "Clear to go!" — The AP tells everyone "QUIET please, I\'m about to receive from Device A." All other devices freeze!',
      enthusiast: '"Clear To Send" — the AP\'s response to RTS. Heard by all devices (including hidden nodes), triggering NAV timers to prevent collisions.',
      pro: 'Control subtype 0xC. 14B frame: FC(2), Duration(2), RA=requesting STA(6), FCS(4). Sent after SIFS from RTS receipt. CTS-to-Self: STA sends CTS to its own MAC address to protect channel (used in mixed 802.11b/g environments).',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Sub=1100' },
      { label: 'Duration', bytes: 2, color: '#f59e0b', note: 'NAV for all listeners' },
      { label: 'RA (STA that sent RTS)', bytes: 6, color: '#a855f7' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'ACK', subtype: '0xD', emoji: '✅', category: 'control',
    description: {
      kid: '✅ "Got it!" — A tiny 14-byte reply sent after every data frame. If the sender doesn\'t get an ACK after SIFS, it assumes the frame was lost and resends!',
      enthusiast: 'ACK is the Wi-Fi receipt — sent after SIFS (16µs) to confirm frame delivery. No ACK = retransmission. ACK frames are the #1 most transmitted frame type in any Wi-Fi network.',
      pro: 'Control subtype 0xD. 14B: FC(2), Duration(2), RA(6), FCS(4). Sent SIFS after data. Implicit ACK policy (IAC). In 802.11ax: Block ACK replaces per-MPDU ACK for A-MPDU bursts (256-bit bitmap). NDP (No-Data Packet) ACK possible.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#10b981', note: 'Sub=1101' },
      { label: 'Duration', bytes: 2, color: '#f59e0b' },
      { label: 'RA (sender\'s MAC)', bytes: 6, color: '#10b981' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'Block ACK', subtype: '0x9', emoji: '📊', category: 'control',
    description: {
      kid: '📊 Instead of saying "Got it!" 64 times after each piece of a big file, Block ACK says "Got pieces 1,2,3,5,6 — missed piece 4, resend that one!" All in one tiny reply!',
      enthusiast: 'Block ACK uses a bitmap to acknowledge multiple frames (A-MPDU) at once. Each bit = one frame received OK or not. Dramatically more efficient than per-frame ACKs.',
      pro: 'Control subtype 0x9. Compressed Block ACK bitmap: 8 bytes (64 bits, one per MPDU). Extended bitmap: 32 bytes (256 bits, 802.11ax). Multi-TID Block ACK in 802.11be. Block ACK Request (BAR, subtype 0x8) triggers BA; Immediate BA vs Delayed BA policies.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#10b981', note: 'Sub=1001' },
      { label: 'Duration', bytes: 2, color: '#f59e0b' },
      { label: 'RA', bytes: 6, color: '#10b981' },
      { label: 'TA', bytes: 6, color: '#059669' },
      { label: 'BA Control', bytes: 2, color: '#a855f7', note: 'TID, Compressed' },
      { label: 'BA Start Seq', bytes: 2, color: '#8b5cf6' },
      { label: 'BA Bitmap (64-256 bits)', bytes: 8, color: '#7c3aed', note: '1 bit/MPDU' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  // ── Data ──────────────────────────────────────────────────────────────────
  {
    name: 'Data', subtype: '0x0', emoji: '📦', category: 'data',
    description: {
      kid: '📦 The actual letter (data) you wanted to send — your cat video, webpage, or game update is inside this frame!',
      enthusiast: 'Data frames carry the actual payload. The MAC header has up to 4 addresses for routing data between the wireless and wired sides of the network.',
      pro: 'Data subtype 0x0. 4-address header (ToDS/FromDS bits). ToDS=1/FromDS=0: STA→AP. Addr1=RA(BSSID), Addr2=TA(STA), Addr3=DA(final dest). 4th address only in WDS/mesh (both bits set). QoS Data adds TID field. Payload encrypted via CCMP/GCMP.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'ToDS=1 FromDS=0' },
      { label: 'Duration', bytes: 2, color: '#f59e0b' },
      { label: 'Addr1 (RA/BSSID)', bytes: 6, color: '#10b981', note: 'Receiver' },
      { label: 'Addr2 (TA/STA)', bytes: 6, color: '#059669', note: 'Transmitter' },
      { label: 'Addr3 (DA)', bytes: 6, color: '#16a34a', note: 'Final Destination' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: '[Addr4 (SA)]', bytes: 6, color: '#15803d', note: 'WDS/Mesh only' },
      { label: '[QoS Ctrl]', bytes: 2, color: '#0284c7', note: 'TID, TXOP' },
      { label: 'MSDU / Encrypted Payload', bytes: 48, color: '#1e40af', note: '≤2304 bytes' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
  {
    name: 'QoS Data', subtype: '0x8', emoji: '🎵', category: 'data',
    description: {
      kid: '🎵 A special version of the data frame for important stuff like voice calls and video streams — these frames "cut the line" and get sent FIRST!',
      enthusiast: 'QoS Data frames carry a Traffic Identifier (TID) that maps to one of 4 WMM Access Categories: Voice, Video, Best Effort, Background. Higher priority = shorter wait times.',
      pro: 'Data subtype 0x8. Adds 2-byte QoS Control field: TID (4b), EOSP, ACK Policy (2b), TXOP Limit/Queue Size. TID 0-7 maps to WMM ACs: TID 6-7=AC_VO, TID 4-5=AC_VI, TID 0,3=AC_BE, TID 1-2=AC_BK. EDCA parameters per-AC define CW and AIFSN.',
    },
    fields: [
      { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Sub=1000' },
      { label: 'Duration', bytes: 2, color: '#f59e0b' },
      { label: 'Addr1', bytes: 6, color: '#10b981' },
      { label: 'Addr2', bytes: 6, color: '#059669' },
      { label: 'Addr3', bytes: 6, color: '#16a34a' },
      { label: 'Seq Ctrl', bytes: 2, color: '#475569' },
      { label: 'QoS Control', bytes: 2, color: '#0ea5e9', note: 'TID + EOSP + ACK Policy' },
      { label: 'Encrypted Payload', bytes: 48, color: '#1e40af' },
      { label: 'FCS', bytes: 4, color: '#334155' },
    ],
  },
];

const CAT_COLORS: Record<FrameCategory, string> = {
  management: '#06b6d4',
  control:    '#f59e0b',
  data:       '#10b981',
};

function PacketAnalyzer() {
  const { mode } = useApp();
  const [selected, setSelected] = useState<FrameType>(FRAMES[0]);
  const [expandedField, setExpandedField] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState<FrameCategory | 'all'>('all');
  const total = selected.fields.reduce((s, f) => s + f.bytes, 0);
  const filtered = filterCat === 'all' ? FRAMES : FRAMES.filter(f => f.category === filterCat);

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white flex items-center gap-2">
          🔬 Frame Analyzer
          <span className="text-xs font-normal text-slate-500">(12 frame types)</span>
        </h3>
        <div className="flex gap-1.5">
          {(['all', 'management', 'control', 'data'] as const).map(cat => (
            <button key={cat} onClick={() => setFilterCat(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all capitalize ${
                filterCat === cat
                  ? cat === 'all' ? 'bg-slate-500/20 border-slate-500/40 text-slate-300'
                    : `text-white border-current`
                  : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={filterCat === cat && cat !== 'all' ? { borderColor: CAT_COLORS[cat] + '60', background: CAT_COLORS[cat] + '15', color: CAT_COLORS[cat] } : {}}>
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Frame selector grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
        {filtered.map(f => {
          const catColor = CAT_COLORS[f.category];
          return (
            <button key={f.name} onClick={() => { setSelected(f); setExpandedField(null); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${
                selected.name === f.name ? 'text-white' : 'border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600'
              }`}
              style={selected.name === f.name ? { borderColor: catColor + '60', background: catColor + '15' } : {}}>
              <span className="text-lg">{f.emoji}</span>
              <span className="text-xs font-bold leading-tight" style={{ color: selected.name === f.name ? catColor : undefined }}>{f.name}</span>
              <span className="chip text-slate-600 text-xs capitalize py-0 px-1.5"
                style={selected.name === f.name ? { color: catColor, background: catColor + '15' } : {}}>
                {f.category.slice(0, 4)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Frame description */}
      <AnimatePresence mode="wait">
        <motion.div key={`${selected.name}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="text-sm text-slate-400 leading-relaxed bg-surface-900/50 rounded-lg p-3 border"
          style={{ borderColor: CAT_COLORS[selected.category] + '30' }}>
          <span className="font-bold mr-2" style={{ color: CAT_COLORS[selected.category] }}>
            {selected.emoji} {selected.name} (subtype {selected.subtype}):
          </span>
          {selected.description[mode]}
        </motion.div>
      </AnimatePresence>

      {/* Byte layout */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Frame byte structure ({total} bytes min) — click a field:</p>
        <div className="flex flex-wrap gap-0.5">
          {selected.fields.map((f, i) => {
            const w = Math.max((f.bytes / total) * 100, 4);
            return (
              <motion.button key={i} onClick={() => setExpandedField(expandedField === i ? null : i)}
                whileHover={{ y: -2 }} className="rounded border transition-all"
                style={{ width: `${w}%`, minWidth: 32, background: (f.color ?? '#475569') + '25', borderColor: (f.color ?? '#475569') + '60' }}>
                <div className="px-1 py-2">
                  <p className="font-bold truncate" style={{ color: f.color ?? '#94a3b8', fontSize: '9px' }}>{f.label}</p>
                  <p className="text-slate-500" style={{ fontSize: '8px' }}>{f.bytes}B</p>
                </div>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {expandedField !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-2 overflow-hidden">
              <div className="bg-surface-900/70 rounded-lg p-3 border"
                style={{ borderColor: (selected.fields[expandedField].color ?? '#475569') + '40' }}>
                <p className="text-xs font-bold" style={{ color: selected.fields[expandedField].color }}>
                  {selected.fields[expandedField].label} — {selected.fields[expandedField].bytes} bytes
                </p>
                {selected.fields[expandedField].note &&
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{selected.fields[expandedField].note}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Frame type legend */}
      <div className="flex gap-4 flex-wrap border-t border-slate-700/50 pt-3">
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-slate-500 capitalize">{cat} Frames</span>
            <span className="text-xs text-slate-600">({FRAMES.filter(f => f.category === cat).length} types)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TWT / Power Save Simulation ─────────────────────────────────────────────
function PowerSaveTWT() {
  const [mode4, setMode4] = useState<'legacy' | 'twt'>('legacy');

  const slots = Array.from({ length: 12 });
  const twtInterval = 4; // device wakes every 4 slots

  return (
    <div className="glass-panel p-5 border-glow-purple space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">Power Save Modes — TWT (Target Wake Time)</h3>
        <div className="flex gap-1.5">
          {(['legacy', 'twt'] as const).map(m => (
            <button key={m} onClick={() => setMode4(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                mode4 === m ? 'bg-band5/20 border-band5/40 text-band5' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
              {m === 'legacy' ? '📜 Legacy PS-Poll' : '⏰ Wi-Fi 6 TWT'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500">Timeline (each block = 100ms). 🔆 = Radio ON, 💤 = Asleep, 📦 = Data TX</p>
        {/* AP beacon row */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-16 flex-shrink-0">AP Beacon</span>
          <div className="flex gap-0.5 flex-1">
            {slots.map((_, i) => (
              <div key={i} className="flex-1 h-6 rounded flex items-center justify-center text-xs bg-wired/20 border border-wired/30 text-wired">
                📡
              </div>
            ))}
          </div>
        </div>

        {mode4 === 'legacy' ? (
          // Legacy: device must wake for every beacon to check for buffered data (DTIM)
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16 flex-shrink-0">Device Radio</span>
              <div className="flex gap-0.5 flex-1">
                {slots.map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className={`flex-1 h-6 rounded flex items-center justify-center text-xs ${
                      i % 2 === 1 ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-band5/20 border border-band5/30 text-band5'}`}>
                    {i % 2 === 1 ? '🔆' : '💤'}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="text-xs text-red-400">⚠️ Wakes up {slots.filter((_, i) => i % 2 === 1).length} times — radio ON 50% of the time even when idle</div>
          </>
        ) : (
          // TWT: device negotiates precise wake windows
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-16 flex-shrink-0">Device TWT</span>
              <div className="flex gap-0.5 flex-1">
                {slots.map((_, i) => {
                  const isWakeSlot = i % twtInterval === 0;
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className={`flex-1 h-6 rounded flex items-center justify-center text-xs ${
                        isWakeSlot ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-400' : 'bg-slate-800/60 border border-slate-700/30 text-slate-600'}`}>
                      {isWakeSlot ? '📦' : '💤'}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-emerald-400">
              ✅ Wakes only {slots.filter((_, i) => i % twtInterval === 0).length}× — radio ON just 25% of the time. Battery life 3-4× longer!
            </div>
            <div className="text-xs text-slate-500">IoT devices (sensors, cameras) can set TWT intervals of seconds or hours, saving enormous battery.</div>
          </>
        )}
      </div>

      <ModeContent content={{
        kid: mode4 === 'legacy' ? '😴 Old power save: Your phone\'s Wi-Fi radio wakes up every time the router beeps (every 100ms) to check for messages, even at 3am when you\'re asleep. Very draining!'
          : '⏰ TWT is like setting an alarm clock for your Wi-Fi! Your device tells the router: "Wake me up ONLY every 400ms to receive data." The radio sleeps deeply the rest of the time — much better for battery!',
        enthusiast: mode4 === 'legacy' ? 'Legacy PS-Poll: device wakes every beacon interval (100ms) to check Traffic Indication Map (TIM) for buffered frames. Radio stays on 50%+ of the time unnecessarily.'
          : 'TWT (Wi-Fi 6 IEEE 802.11ax): device negotiates exact wake times with AP. Only wakes when data is expected. Huge for IoT — a smart sensor can wake once per second instead of 10× per second.',
        pro: mode4 === 'legacy' ? 'Legacy Power Save: DTIM (Delivery Traffic Indication Map) in Beacon marks buffered unicast/mcast frames. STA wakes at DTIM interval, sends PS-Poll(subtype 0xA) to retrieve each buffered frame — inefficient for high-frequency polling.'
          : 'TWT (802.11ax, Section 26.8): Individual TWT Agreement (iTWT) for scheduled unicast. Broadcast TWT for group scheduling. Parameters: TWT Wake Interval (TWI), TWT Wake Duration, TWT Channel. AP sends TWT Setup Action Frame; STA responds with Accept/Reject/Alternate. Eliminates contention in IoT-dense deployments.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

export function Chapter5() {
  const { markComplete } = useApp();

  useEffect(() => {
    ['frameformat', 'fc', 'mgmt', 'control', 'data', 'ie', 'beacon', 'sequences', 'powersave']
      .forEach(id => markComplete('ch5', id));
  }, [markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Every byte of every Wi-Fi frame explained — 12 frame types across Management, Control, and Data categories, plus Wi-Fi 6 Target Wake Time." />
        <ModeBadge />
      </div>
      <PacketAnalyzer />
      <PowerSaveTWT />
    </div>
  );
}
