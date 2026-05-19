import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch5')!;

const TABS = ['MAC Frame Format', 'Frame Control', 'Frame Browser', 'IE Catalog', 'Sequences', 'Power Save'] as const;
type Tab = typeof TABS[number];

const CH5_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'MAC Frame Format': ['frameformat'],
  'Frame Control':    ['fc'],
  'Frame Browser':    ['mgmt', 'control', 'data', 'beacon'],
  'IE Catalog':       ['ie'],
  'Sequences':        ['sequences'],
  'Power Save':       ['powersave'],
};

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

// ─── PacketAnalyzer (unchanged) ───────────────────────────────────────────────

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

// ─── Tab: MAC Frame Format ────────────────────────────────────────────────────

const MAC_HEADER_FIELDS = [
  { label: 'FC', bytes: 2, color: '#06b6d4', note: 'Frame Control — type, subtype, flags' },
  { label: 'Duration/ID', bytes: 2, color: '#0891b2', note: 'NAV timer value or AID (power-save)' },
  { label: 'Addr1', bytes: 6, color: '#a855f7', note: 'Receiver Address (RA) — always present' },
  { label: 'Addr2', bytes: 6, color: '#8b5cf6', note: 'Transmitter Address (TA) — most frames' },
  { label: 'Addr3', bytes: 6, color: '#7c3aed', note: 'BSSID / SA / DA depending on ToDS/FromDS' },
  { label: 'Seq Ctrl', bytes: 2, color: '#475569', note: 'Fragment number (4b) + Sequence number (12b)' },
  { label: '[Addr4]', bytes: 6, color: '#4f46e5', note: 'Only in WDS/Mesh (ToDS=1 AND FromDS=1)' },
  { label: '[QoS Ctrl]', bytes: 2, color: '#0ea5e9', note: 'QoS Data frames only — TID, EOSP, ACK Policy' },
  { label: '[HT Ctrl]', bytes: 4, color: '#0284c7', note: 'HT/VHT/HE: link adaptation, sounding' },
  { label: 'Frame Body', bytes: 64, color: '#10b981', note: '0–7951 bytes of payload or IEs' },
  { label: 'FCS', bytes: 4, color: '#334155', note: 'CRC-32 over entire MAC header + body' },
];

const FRAME_TYPE_TABLE = [
  {
    type: '00', name: 'Management', color: '#06b6d4',
    subtypes: [
      { sub: '0000', name: 'Association Request' },
      { sub: '0001', name: 'Association Response' },
      { sub: '0010', name: 'Reassociation Request' },
      { sub: '0011', name: 'Reassociation Response' },
      { sub: '0100', name: 'Probe Request' },
      { sub: '0101', name: 'Probe Response' },
      { sub: '0110', name: 'Timing Advertisement' },
      { sub: '0111', name: 'Reserved' },
      { sub: '1000', name: 'Beacon' },
      { sub: '1001', name: 'ATIM' },
      { sub: '1010', name: 'Disassociation' },
      { sub: '1011', name: 'Authentication' },
      { sub: '1100', name: 'Deauthentication' },
      { sub: '1101', name: 'Action' },
      { sub: '1110', name: 'Action No Ack' },
      { sub: '1111', name: 'Reserved' },
    ],
  },
  {
    type: '01', name: 'Control', color: '#f59e0b',
    subtypes: [
      { sub: '0000', name: 'Reserved' },
      { sub: '0001', name: 'Reserved' },
      { sub: '0010', name: 'Trigger' },
      { sub: '0011', name: 'TACK' },
      { sub: '0100', name: 'Beamforming Report Poll' },
      { sub: '0101', name: 'VHT/HE NDP Announcement' },
      { sub: '0110', name: 'Control Frame Extension' },
      { sub: '0111', name: 'Control Wrapper' },
      { sub: '1000', name: 'Block ACK Request (BAR)' },
      { sub: '1001', name: 'Block ACK (BA)' },
      { sub: '1010', name: 'PS-Poll' },
      { sub: '1011', name: 'RTS' },
      { sub: '1100', name: 'CTS' },
      { sub: '1101', name: 'ACK' },
      { sub: '1110', name: 'CF-End' },
      { sub: '1111', name: 'CF-End + CF-Ack' },
    ],
  },
  {
    type: '10', name: 'Data', color: '#10b981',
    subtypes: [
      { sub: '0000', name: 'Data' },
      { sub: '0001', name: 'Reserved' },
      { sub: '0010', name: 'Reserved' },
      { sub: '0011', name: 'Reserved' },
      { sub: '0100', name: 'Null (no data)' },
      { sub: '0101', name: 'Reserved' },
      { sub: '0110', name: 'Reserved' },
      { sub: '0111', name: 'Reserved' },
      { sub: '1000', name: 'QoS Data' },
      { sub: '1001', name: 'QoS Data + CF-Ack' },
      { sub: '1010', name: 'QoS Data + CF-Poll' },
      { sub: '1011', name: 'QoS Data + CF-Ack + CF-Poll' },
      { sub: '1100', name: 'QoS Null' },
      { sub: '1101', name: 'Reserved' },
      { sub: '1110', name: 'QoS CF-Poll (no data)' },
      { sub: '1111', name: 'QoS CF-Ack + CF-Poll (no data)' },
    ],
  },
];

const TODS_FROMDS = [
  {
    toDS: 0, fromDS: 0, scenario: 'IBSS / Ad-hoc',
    addr1: 'DA (Destination Address)',
    addr2: 'SA (Source Address)',
    addr3: 'BSSID',
    addr4: '—',
    color: '#a855f7',
  },
  {
    toDS: 0, fromDS: 1, scenario: 'AP → STA (Downlink)',
    addr1: 'DA (Destination STA)',
    addr2: 'BSSID (AP MAC)',
    addr3: 'SA (Original Source)',
    addr4: '—',
    color: '#10b981',
  },
  {
    toDS: 1, fromDS: 0, scenario: 'STA → AP (Uplink)',
    addr1: 'BSSID (AP MAC)',
    addr2: 'SA (Source STA)',
    addr3: 'DA (Final Destination)',
    addr4: '—',
    color: '#06b6d4',
  },
  {
    toDS: 1, fromDS: 1, scenario: 'WDS / Mesh Bridge',
    addr1: 'RA (Receiver Address)',
    addr2: 'TA (Transmitter Address)',
    addr3: 'DA (Final Destination)',
    addr4: 'SA (Original Source)',
    color: '#f59e0b',
  },
];

function MACFrameFormatTab() {
  const [expandedField, setExpandedField] = useState<number | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>('00');
  const total = MAC_HEADER_FIELDS.reduce((s, f) => s + f.bytes, 0);

  return (
    <div className="space-y-6">
      {/* Header diagram */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">802.11 MAC Frame Header Structure</h3>
        <p className="text-xs text-slate-500">Click any field to see details. Optional fields appear only in specific frame types.</p>
        <div className="flex flex-wrap gap-0.5">
          {MAC_HEADER_FIELDS.map((f, i) => {
            const isOptional = f.label.startsWith('[');
            const w = Math.max((f.bytes / total) * 100, 3.5);
            return (
              <motion.button key={i} whileHover={{ y: -2 }} onClick={() => setExpandedField(expandedField === i ? null : i)}
                className="rounded border transition-all"
                style={{
                  width: `${w}%`, minWidth: 28,
                  background: (f.color) + (isOptional ? '15' : '25'),
                  borderColor: f.color + (isOptional ? '40' : '70'),
                  borderStyle: isOptional ? 'dashed' : 'solid',
                }}>
                <div className="px-1 py-2">
                  <p className="font-bold truncate" style={{ color: f.color, fontSize: '9px' }}>{f.label}</p>
                  <p className="text-slate-500" style={{ fontSize: '8px' }}>{f.bytes}B</p>
                </div>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {expandedField !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="bg-surface-900/70 rounded-lg p-3 border"
                style={{ borderColor: MAC_HEADER_FIELDS[expandedField].color + '40' }}>
                <p className="text-xs font-bold" style={{ color: MAC_HEADER_FIELDS[expandedField].color }}>
                  {MAC_HEADER_FIELDS[expandedField].label} — {MAC_HEADER_FIELDS[expandedField].bytes} bytes
                </p>
                <p className="text-xs text-slate-400 mt-1">{MAC_HEADER_FIELDS[expandedField].note}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex gap-4 text-xs text-slate-500 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-3 rounded border border-slate-500/70 bg-slate-500/25" />
            Mandatory field
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-6 h-3 rounded border border-dashed border-slate-500/40 bg-slate-500/15" />
            Optional field
          </span>
        </div>
      </div>

      {/* Frame type table */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Frame Type & Subtype Table</h3>
        <div className="space-y-3">
          {FRAME_TYPE_TABLE.map(ft => (
            <div key={ft.type} className="rounded-xl border overflow-hidden"
              style={{ borderColor: ft.color + '30' }}>
              <button onClick={() => setExpandedType(expandedType === ft.type ? null : ft.type)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all hover:bg-white/5"
                style={{ background: ft.color + '10' }}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: ft.color + '20', color: ft.color }}>
                    Type={ft.type}
                  </span>
                  <span className="font-bold text-sm" style={{ color: ft.color }}>{ft.name} Frames</span>
                  <span className="text-xs text-slate-500">16 subtypes</span>
                </div>
                <span className="text-slate-500 text-xs">{expandedType === ft.type ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {expandedType === ft.type && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-3">
                      {ft.subtypes.map(st => (
                        <div key={st.sub} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                          style={{ background: st.name === 'Reserved' ? '#1e293b' : ft.color + '10', border: `1px solid ${ft.color}${st.name === 'Reserved' ? '10' : '25'}` }}>
                          <span className="font-mono text-slate-600" style={{ fontSize: '9px' }}>{st.sub}</span>
                          <span className={st.name === 'Reserved' ? 'text-slate-700' : 'text-slate-400'} style={{ fontSize: '10px' }}>{st.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* ToDS / FromDS address table */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">ToDS / FromDS — Address Interpretation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TODS_FROMDS.map(row => (
            <div key={`${row.toDS}${row.fromDS}`} className="rounded-xl p-3 space-y-2 border"
              style={{ borderColor: row.color + '30', background: row.color + '08' }}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: row.color + '20', color: row.color }}>
                  ToDS={row.toDS} FromDS={row.fromDS}
                </span>
                <span className="text-xs font-semibold text-slate-300">{row.scenario}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[['Addr1', row.addr1], ['Addr2', row.addr2], ['Addr3', row.addr3], ['Addr4', row.addr4]].map(([label, val]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-slate-600" style={{ fontSize: '9px' }}>{label}</span>
                    <span className={val === '—' ? 'text-slate-700' : 'text-slate-400'} style={{ fontSize: '10px' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ModeContent content={{
          kid: '📬 Think of Addr1 as the mailbox you\'re delivering TO, Addr2 as the truck doing the delivery, and Addr3 as the final house that actually gets the letter. When going through a mesh (4-address), you also need to know where the letter originally came from!',
          enthusiast: 'The ToDS/FromDS bits tell every device how to interpret the 3 (or 4) address fields. In normal uplink traffic (STA→AP), ToDS=1 means "please forward this to the network." The AP uses Addr3 (DA) to route it out the Ethernet port.',
          pro: 'IEEE 802.11-2020 §9.3.3.1. The MAC DA/SA are not always in Addr1/Addr2 — they depend on ToDS/FromDS bits. Addr1 is always the immediate RA (Receiver Address), Addr2 is TA (Transmitter Address). In 4-address WDS/mesh frames, both ToDS and FromDS are set; A-MSDU destination/source are carried in the MSDU subframe headers.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Tab: Frame Control ───────────────────────────────────────────────────────

const FC_SUBFIELDS = [
  { label: 'Protocol\nVersion', bits: 2, color: '#64748b', desc: 'Always 0 for current 802.11. Non-zero values reserved for future protocol versions.' },
  { label: 'Type', bits: 2, color: '#06b6d4', desc: 'Frame type: 00=Management, 01=Control, 10=Data, 11=Extension (802.11ad/ay DMG/CDMG).' },
  { label: 'Subtype', bits: 4, color: '#0ea5e9', desc: 'Distinguishes specific frame functions within each type (e.g., Beacon=1000, Probe Req=0100 within Management).' },
  { label: 'To DS', bits: 1, color: '#10b981', desc: 'Set when a STA sends a frame destined for the distribution system (through the AP). Combined with FromDS determines address field meaning.' },
  { label: 'From DS', bits: 1, color: '#059669', desc: 'Set when the AP is forwarding a frame from the distribution system to a STA. Both=1 means WDS/Mesh 4-address frame.' },
  { label: 'More\nFrags', bits: 1, color: '#a855f7', desc: 'Set in all but the last fragment of a fragmented MSDU/MMPDU. Recipient uses this to reassemble fragments.' },
  { label: 'Retry', bits: 1, color: '#8b5cf6', desc: 'Set when this frame is a retransmission. Recipient uses this to detect and discard duplicates (via sequence number + Retry bit).' },
  { label: 'Pwr\nMgmt', bits: 1, color: '#f59e0b', desc: 'Power Management: when set, the STA will enter Power Save mode after this frame exchange. AP buffers frames for that STA.' },
  { label: 'More\nData', bits: 1, color: '#f97316', desc: 'Set by AP to inform a power-saving STA that there are more buffered frames waiting. STA should stay awake and send PS-Poll.' },
  { label: 'Protected', bits: 1, color: '#ef4444', desc: 'Protected Frame: set when the Frame Body is encrypted (CCMP, GCMP, TKIP, WEP). Also set for protected management frames (PMF/802.11w).' },
  { label: '+HTC/\nOrder', bits: 1, color: '#dc2626', desc: 'In QoS frames: indicates HT Control field (4B) is present (link adaptation, sounding). In non-QoS: frames must be delivered in order (legacy, rarely used).' },
];

function FrameControlTab() {
  const [selected, setSelected] = useState<number | null>(null);

  const totalBits = FC_SUBFIELDS.reduce((s, f) => s + f.bits, 0); // 16

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Frame Control Field — 16-bit Breakdown</h3>
        <p className="text-xs text-slate-500">Click any subfield to see its description.</p>

        {/* Bit diagram */}
        <div className="flex gap-0.5">
          {FC_SUBFIELDS.map((f, i) => {
            const w = (f.bits / totalBits) * 100;
            return (
              <motion.button key={i} whileHover={{ y: -2 }}
                onClick={() => setSelected(selected === i ? null : i)}
                className="rounded border transition-all text-center flex-shrink-0"
                style={{
                  width: `${w}%`,
                  minWidth: 24,
                  background: f.color + (selected === i ? '30' : '18'),
                  borderColor: f.color + (selected === i ? 'cc' : '50'),
                }}>
                <div className="px-0.5 py-2">
                  <p className="font-bold leading-tight" style={{ color: f.color, fontSize: '8px', whiteSpace: 'pre-line' }}>{f.label}</p>
                  <p className="text-slate-500 mt-0.5" style={{ fontSize: '7px' }}>{f.bits}b</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Bit positions */}
        <div className="flex gap-0.5 -mt-1">
          {(() => {
            const labels: React.JSX.Element[] = [];
            let bit = 0;
            FC_SUBFIELDS.forEach((f, i) => {
              const w = (f.bits / totalBits) * 100;
              labels.push(
                <div key={i} style={{ width: `${w}%`, minWidth: 24 }} className="text-center">
                  <span className="text-slate-700" style={{ fontSize: '7px' }}>{bit}–{bit + f.bits - 1}</span>
                </div>
              );
              bit += f.bits;
            });
            return labels;
          })()}
        </div>

        <AnimatePresence>
          {selected !== null && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="rounded-lg p-3 border" style={{ borderColor: FC_SUBFIELDS[selected].color + '40', background: FC_SUBFIELDS[selected].color + '10' }}>
                <p className="text-xs font-bold mb-1" style={{ color: FC_SUBFIELDS[selected].color }}>
                  {FC_SUBFIELDS[selected].label.replace('\n', ' ')} ({FC_SUBFIELDS[selected].bits} bit{FC_SUBFIELDS[selected].bits > 1 ? 's' : ''})
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">{FC_SUBFIELDS[selected].desc}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ToDS/FromDS combos */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">ToDS / FromDS Combinations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TODS_FROMDS.map(row => (
            <div key={`${row.toDS}${row.fromDS}`} className="rounded-xl p-3 space-y-2 border"
              style={{ borderColor: row.color + '30', background: row.color + '08' }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2 py-0.5 rounded font-bold"
                  style={{ background: row.color + '20', color: row.color }}>
                  ToDS={row.toDS} FromDS={row.fromDS}
                </span>
                <span className="text-xs font-semibold text-slate-300">{row.scenario}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {[['Addr1', row.addr1], ['Addr2', row.addr2], ['Addr3', row.addr3], ['Addr4', row.addr4]].map(([label, val]) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-slate-600" style={{ fontSize: '9px' }}>{label}</span>
                    <span className={val === '—' ? 'text-slate-700' : 'text-slate-400'} style={{ fontSize: '10px' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <ModeContent content={{
          kid: '🚦 The "To DS" and "From DS" bits are like arrows on a package: is this going TO the big internet (DS=1) or coming FROM it? Two arrows pointing both ways means it\'s hopping between two wireless bridges!',
          enthusiast: 'The ToDS and FromDS bits together define which side of the wireless-to-wired boundary each address field represents. This lets 802.11 MAC handle both access-point bridging and wireless mesh bridging with a single header format.',
          pro: '§9.3.3.1. ToDS/FromDS interpretation is frame-type specific. In Mgmt and Control frames, both bits are 0. The DS (Distribution System) is typically the wired Ethernet backbone. The 4-address (WDS) mode is used for 802.11s mesh and legacy WDS links; upper layers see normal DA/SA in the MSDU subframe.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Tab: IE Catalog ──────────────────────────────────────────────────────────

type IECategory = 'Mandatory' | 'Security' | 'QoS' | 'HT/VHT/HE' | '802.11u';

interface IEEntry {
  id: string;
  name: string;
  length: string;
  standard: string;
  use: string;
  category: IECategory;
  detail: string;
}

const IE_CATALOG: IEEntry[] = [
  {
    id: '0', name: 'SSID', length: '0–32 B', standard: '802.11',
    use: 'Network name (Service Set Identifier)',
    category: 'Mandatory',
    detail: 'Contains the SSID string (UTF-8). Zero-length SSID is a wildcard probe or a hidden-SSID beacon. Maximum 32 octets. Broadcast in Beacons, Probe Requests/Responses, and Association frames.',
  },
  {
    id: '1', name: 'Supported Rates', length: '≤8 B', standard: '802.11',
    use: 'Advertise mandatory/optional data rates',
    category: 'Mandatory',
    detail: 'Each byte encodes one rate: bit7=basic/mandatory, bits6-0=rate×500kbps. E.g., 0x8C=6 Mbps basic. Up to 8 rates here; additional rates go in IE 50 (Extended Supported Rates).',
  },
  {
    id: '3', name: 'DS Parameter Set', length: '1 B', standard: '802.11',
    use: 'Current channel number for 2.4 GHz',
    category: 'Mandatory',
    detail: 'Single byte with current channel number (1–14). Used by STAs receiving a beacon from an overlapping BSS to determine which channel the AP is on. Not required in 5/6 GHz (use HT/VHT/HE Operation IEs).',
  },
  {
    id: '5', name: 'TIM', length: 'Variable', standard: '802.11',
    use: 'Power-save buffered-frame bitmap',
    category: 'Mandatory',
    detail: 'Traffic Indication Map. Contains DTIM Count, DTIM Period, Bitmap Control, and Partial Virtual Bitmap. One bit per associated STA (AID). Set bit means the AP has buffered unicast frames waiting for that STA.',
  },
  {
    id: '7', name: 'Country', length: 'Variable', standard: '802.11d',
    use: 'Regulatory domain info (channels + power)',
    category: 'Mandatory',
    detail: '3-char country code + triplets of (First Channel, Number of Channels, Max TX Power dBm). Enables STAs to auto-configure channel and power per country regulations. Required for 5 GHz operation.',
  },
  {
    id: '11', name: 'QBSS Load', length: '5 B', standard: '802.11e',
    use: 'AP channel utilization and STA count',
    category: 'QoS',
    detail: 'Station Count (2B), Channel Utilization (1B, 0–255 = 0–100%), Available Admission Capacity (2B). Used by clients and controllers for load-based roaming decisions (802.11k/v BSS Transition).',
  },
  {
    id: '33', name: 'Power Capability', length: '2 B', standard: '802.11h',
    use: 'Min/Max transmit power of STA',
    category: 'Mandatory',
    detail: 'Minimum Capability (signed dBm) + Maximum Capability (signed dBm). Exchanged in Association Req/Resp to verify regulatory compliance. Required when operating in 5 GHz DFS channels.',
  },
  {
    id: '36', name: 'Supported Channels', length: 'Variable', standard: '802.11h',
    use: 'List of channels the STA can operate on',
    category: 'Mandatory',
    detail: 'Pairs of (First Channel Number, Number of Channels). Informs the AP of the STA\'s regulatory channel set. Required in Association Requests for 5 GHz regulatory compliance.',
  },
  {
    id: '45', name: 'HT Capabilities', length: '26 B', standard: '802.11n',
    use: 'MIMO, SGI, STBC, LDPC, channel width',
    category: 'HT/VHT/HE',
    detail: 'HT Capability Info (2B): LDPC, 40MHz, SGI-20/40, STBC Tx/Rx, HT-Greenfield. A-MPDU Parameters (1B): max A-MPDU length, density. Supported MCS Set (16B): one bit per MCS 0–76. Extended HT Cap (2B). Transmit Beamforming Cap (4B). ASEL Cap (1B).',
  },
  {
    id: '48', name: 'RSN', length: 'Variable', standard: '802.11i',
    use: 'WPA2/WPA3 security parameters',
    category: 'Security',
    detail: 'RSN Information Element (formerly WPA2 IE). Version(2B)=1. Group Cipher Suite (4B): CCMP-128 or GCMP. Pairwise Cipher Suite List. AKM Suite List: 00-0F-AC-2=PSK, -8=SAE, -5=802.1X, -18=OWE. RSN Capabilities: PMF capable/required bits, OCVC, PBAC.',
  },
  {
    id: '50', name: 'Extended Supported Rates', length: 'Variable', standard: '802.11g',
    use: 'Additional rates beyond IE 1\'s 8-rate limit',
    category: 'Mandatory',
    detail: 'Same format as IE 1 (Supported Rates). Used when more than 8 rates need to be advertised (e.g., 802.11g added 12, 18, 24, 36, 48, 54 Mbps OFDM rates on top of 802.11b rates).',
  },
  {
    id: '61', name: 'HT Operation', length: '22 B', standard: '802.11n',
    use: 'Primary channel, secondary channel offset',
    category: 'HT/VHT/HE',
    detail: 'Primary Channel (1B). HT Operation Info (5B): secondary channel offset (above/below/none), STA Channel Width, RIFS, HT Protection mode (0–3), non-GF STAs present, OBSS non-HT STAs present. Basic MCS Set (16B).',
  },
  {
    id: '74', name: 'Overlapping BSS Scan', length: '14 B', standard: '802.11n',
    use: '40 MHz coexistence parameters',
    category: 'HT/VHT/HE',
    detail: 'Parameters for OBSS scanning to avoid 40 MHz interference in 2.4 GHz: Scan Passive Dwell, Scan Active Dwell, Scan Interval, Passive Total per Channel, Active Total per Channel, Activity Threshold, Delay Factor.',
  },
  {
    id: '107', name: 'Interworking', length: '3–9 B', standard: '802.11u',
    use: 'Hotspot 2.0 / Passpoint ANQP pointer',
    category: '802.11u',
    detail: 'Access Network Type (4b): 0=Private, 2=Free Public, 3=Chargeable Public. Internet bit. ASRA (Additional Steps Required). Venue Info (optional 2B). HESSID (6B optional): Homogeneous ESS ID for Passpoint networks. Triggers GAS/ANQP queries.',
  },
  {
    id: '127', name: 'Extended Capabilities', length: 'Variable', standard: '802.11',
    use: 'Feature flags: BSS Transition, TWT, 80+80…',
    category: 'Mandatory',
    detail: 'Bitmask of optional 802.11 features. Notable bits: bit2=Extended Channel Switching, bit19=BSS Transition (802.11v), bit25=TDLS, bit34=Operating Mode Notification, bit46=TWT Requester/Responder, bit63=FILS, bit70=TWT Information Frame.',
  },
  {
    id: '191', name: 'VHT Capabilities', length: '12 B', standard: '802.11ac',
    use: '256-QAM, MU-MIMO, 80/160 MHz, STBC',
    category: 'HT/VHT/HE',
    detail: 'VHT Capability Info (4B): Max MPDU Length, Supported Channel Width Set (80/160/80+80), LDPC, SGI-80/160, TX/RX STBC, SU/MU Beamformer/Beamformee, Max Antenna, Link Adaptation. Supported VHT-MCS and NSS Set (8B): Rx/Tx MCS map per NSS 1–8.',
  },
  {
    id: '192', name: 'VHT Operation', length: '5 B', standard: '802.11ac',
    use: 'Channel width, center frequency segments',
    category: 'HT/VHT/HE',
    detail: 'VHT Operation Info (3B): Channel Width (0=20/40, 1=80, 2=160, 3=80+80), Channel Center Frequency Segment 0 (CCFS0), CCFS1. Basic VHT-MCS and NSS Set (2B).',
  },
  {
    id: '255+ext', name: 'HE / EHT Capabilities', length: 'Variable', standard: '802.11ax/be',
    use: 'Wi-Fi 6/7: OFDMA, MU-MIMO, TWT, 4096-QAM',
    category: 'HT/VHT/HE',
    detail: 'IE 255 with Extension ID 35 (HE Capabilities) and 36 (HE Operation) for 802.11ax. Extension ID 108 (EHT Capabilities) and 106 (EHT Operation) for 802.11be. HE MAC Cap: TWT Req/Resp, OFDMA-RA, Dynamic SMPS, Multi-TID BA, SRP-based SR. HE PHY Cap: punctured preamble, ≤4×HE-LTF, DCM, MU Beamformer. EHT adds 4096-QAM, MLO, Multi-link Element (IE 255 ext 107).',
  },
];

const IE_CATEGORIES: IECategory[] = ['Mandatory', 'Security', 'QoS', 'HT/VHT/HE', '802.11u'];

const CAT_IE_COLORS: Record<IECategory, string> = {
  'Mandatory':  '#06b6d4',
  'Security':   '#ef4444',
  'QoS':        '#f59e0b',
  'HT/VHT/HE': '#a855f7',
  '802.11u':    '#10b981',
};

function IECatalogTab() {
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<IECategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = IE_CATALOG.filter(ie => {
    const matchCat = filterCat === 'all' || ie.category === filterCat;
    const q = query.toLowerCase();
    const matchQ = !q || ie.name.toLowerCase().includes(q) || ie.id.includes(q) || ie.use.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div className="glass-panel p-5 border-glow-blue space-y-4">
      <h3 className="font-bold text-white">802.11 Information Elements (IE) Catalog</h3>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search by name, ID, or use…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-xs bg-surface-900/70 border border-slate-700/60 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFilterCat('all')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${filterCat === 'all' ? 'bg-slate-500/20 border-slate-500/40 text-slate-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            All
          </button>
          {IE_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilterCat(filterCat === cat ? 'all' : cat)}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all"
              style={filterCat === cat
                ? { borderColor: CAT_IE_COLORS[cat] + '60', background: CAT_IE_COLORS[cat] + '15', color: CAT_IE_COLORS[cat] }
                : { borderColor: '#334155', color: '#64748b' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* IE list */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-6">No IEs match your search.</p>
        )}
        {filtered.map(ie => {
          const color = CAT_IE_COLORS[ie.category];
          const isOpen = expandedId === ie.id;
          return (
            <div key={ie.id} className="rounded-xl border overflow-hidden transition-colors"
              style={{ borderColor: color + (isOpen ? '40' : '20'), background: color + (isOpen ? '0c' : '06') }}>
              <button onClick={() => setExpandedId(isOpen ? null : ie.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
                <span className="font-mono text-xs w-12 text-right flex-shrink-0 font-bold" style={{ color }}>
                  {ie.id}
                </span>
                <span className="font-semibold text-sm text-slate-200 flex-1">{ie.name}</span>
                <span className="text-xs text-slate-500 hidden sm:block flex-shrink-0 w-16 text-center">{ie.length}</span>
                <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ background: color + '15', color }}>
                  {ie.category}
                </span>
                <span className="text-slate-600 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-4 pb-3 pt-1 space-y-2 border-t" style={{ borderColor: color + '20' }}>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span><span className="text-slate-600">Length:</span> <span className="text-slate-300">{ie.length}</span></span>
                        <span><span className="text-slate-600">Standard:</span> <span className="text-slate-300">{ie.standard}</span></span>
                        <span><span className="text-slate-600">Use:</span> <span className="text-slate-300">{ie.use}</span></span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{ie.detail}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 text-center pt-1">{filtered.length} of {IE_CATALOG.length} IEs shown</p>
    </div>
  );
}

// ─── Tab: Frame Sequences ─────────────────────────────────────────────────────

interface SeqFrame {
  from: 'STA' | 'AP' | 'OldAP' | 'NewAP';
  to: 'STA' | 'AP' | 'OldAP' | 'NewAP';
  label: string;
  note?: string;
  color?: string;
}

interface Sequence {
  id: string;
  name: string;
  emoji: string;
  actors: string[];
  frames: SeqFrame[];
  summary: string;
}

const SEQUENCES: Sequence[] = [
  {
    id: 'open',
    name: 'Open System Auth + Association',
    emoji: '🔓',
    actors: ['STA', 'AP'],
    frames: [
      { from: 'STA', to: 'AP', label: 'Probe Request', note: 'Active scan — "Any APs out there?"', color: '#06b6d4' },
      { from: 'AP', to: 'STA', label: 'Probe Response', note: 'AP replies with full capabilities', color: '#06b6d4' },
      { from: 'STA', to: 'AP', label: 'Authentication (Open, seq=1)', note: 'Open System Auth request', color: '#10b981' },
      { from: 'AP', to: 'STA', label: 'Authentication (Open, seq=2)', note: 'Auth accepted (Status=0)', color: '#10b981' },
      { from: 'STA', to: 'AP', label: 'Association Request', note: 'STA sends capabilities + RSN IE', color: '#a855f7' },
      { from: 'AP', to: 'STA', label: 'Association Response', note: 'AP assigns AID, Status=0', color: '#a855f7' },
      { from: 'STA', to: 'AP', label: 'EAPOL Key (4-Way HS msg 1–4)', note: 'WPA2/3 key derivation follows', color: '#f59e0b' },
    ],
    summary: 'Basic infrastructure association: scan → auth → assoc → 4-Way Handshake. Authentication is a legacy formality in WPA2/3 — real auth happens in the 4-Way HS.',
  },
  {
    id: 'wpa2',
    name: 'WPA2 4-Way Handshake',
    emoji: '🔐',
    actors: ['STA', 'AP'],
    frames: [
      { from: 'AP', to: 'STA', label: 'EAPOL-Key msg 1/4', note: 'ANonce — AP sends random nonce', color: '#f59e0b' },
      { from: 'STA', to: 'AP', label: 'EAPOL-Key msg 2/4', note: 'SNonce + MIC — STA sends nonce, proves PMK possession', color: '#f59e0b' },
      { from: 'AP', to: 'STA', label: 'EAPOL-Key msg 3/4', note: 'GTK + MIC — AP sends Group Temporal Key', color: '#f59e0b' },
      { from: 'STA', to: 'AP', label: 'EAPOL-Key msg 4/4', note: 'ACK — STA confirms, both install PTK', color: '#f59e0b' },
      { from: 'STA', to: 'AP', label: 'QoS Data (encrypted)', note: 'Normal encrypted data flow begins', color: '#10b981' },
    ],
    summary: 'The 4-Way Handshake derives PTK (Pairwise Transient Key) from PMK + ANonce + SNonce. Both sides prove PMK knowledge via MIC. No PMK is ever sent over the air.',
  },
  {
    id: 'ft',
    name: 'Fast BSS Transition (802.11r)',
    emoji: '⚡',
    actors: ['STA', 'OldAP', 'NewAP'],
    frames: [
      { from: 'STA', to: 'OldAP', label: 'Action: FT Request', note: 'STA asks OldAP to pre-auth with NewAP', color: '#06b6d4' },
      { from: 'OldAP', to: 'STA', label: 'Action: FT Response', note: 'OldAP relays NewAP\'s R1KH + FT IEs', color: '#06b6d4' },
      { from: 'STA', to: 'NewAP', label: 'Authentication (FT, algo=2)', note: 'STA sends FT auth with MDIE + FTIE', color: '#a855f7' },
      { from: 'NewAP', to: 'STA', label: 'Authentication (FT, seq=2)', note: 'NewAP confirms FT auth', color: '#a855f7' },
      { from: 'STA', to: 'NewAP', label: 'Reassociation Request', note: 'Contains MDIE, FTIE, RSNIE', color: '#10b981' },
      { from: 'NewAP', to: 'STA', label: 'Reassociation Response', note: 'NewAP confirms — PTK already derived!', color: '#10b981' },
    ],
    summary: '802.11r FT reduces roaming latency from ~300ms to <50ms by pre-deriving keys with the target AP before the STA leaves the current AP. No 4-Way HS needed after reassociation.',
  },
  {
    id: 'pspoll',
    name: 'Power Save PS-Poll Data Retrieval',
    emoji: '💤',
    actors: ['STA', 'AP'],
    frames: [
      { from: 'AP', to: 'STA', label: 'Beacon (TIM bit set)', note: 'AP signals buffered frames in TIM bitmap', color: '#06b6d4' },
      { from: 'STA', to: 'AP', label: 'PS-Poll', note: 'STA wakes up and polls for buffered frame', color: '#f59e0b' },
      { from: 'AP', to: 'STA', label: 'Data + More Data=1', note: 'AP delivers buffered frame; More Data=1 means more waiting', color: '#10b981' },
      { from: 'STA', to: 'AP', label: 'ACK', note: 'STA acknowledges data frame', color: '#10b981' },
      { from: 'STA', to: 'AP', label: 'PS-Poll (again)', note: 'STA polls for next buffered frame', color: '#f59e0b' },
      { from: 'AP', to: 'STA', label: 'Data (last) + More Data=0', note: 'No more buffered frames', color: '#a855f7' },
      { from: 'STA', to: 'AP', label: 'ACK', note: 'STA goes back to sleep', color: '#a855f7' },
    ],
    summary: 'Legacy power save requires a PS-Poll round-trip for each buffered frame — inefficient. Wi-Fi 6 TWT replaces this with pre-scheduled wake windows, eliminating polling overhead.',
  },
];

const ACTOR_COLORS: Record<string, string> = {
  STA:   '#06b6d4',
  AP:    '#10b981',
  OldAP: '#f59e0b',
  NewAP: '#a855f7',
};

function FrameSequencesTab() {
  const [seqId, setSeqId] = useState<string>('open');
  const seq = SEQUENCES.find(s => s.id === seqId)!;

  return (
    <div className="space-y-5">
      {/* Sequence selector */}
      <div className="flex flex-wrap gap-2">
        {SEQUENCES.map(s => (
          <button key={s.id} onClick={() => setSeqId(s.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={seqId === s.id
              ? { borderColor: '#06b6d4' + '60', background: '#06b6d4' + '15', color: '#06b6d4' }
              : { borderColor: '#334155', color: '#64748b' }}>
            {s.emoji} {s.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={seqId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }} className="space-y-4">

          {/* Actor header */}
          <div className="glass-panel p-4 border-glow-blue">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{seq.emoji} {seq.name}</h3>
              <div className="flex gap-3">
                {seq.actors.map(actor => (
                  <div key={actor} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: ACTOR_COLORS[actor] }} />
                    <span className="text-xs font-semibold" style={{ color: ACTOR_COLORS[actor] }}>{actor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ladder diagram */}
            <div className="relative">
              {/* Actor columns */}
              <div className="flex justify-around mb-3">
                {seq.actors.map(actor => (
                  <div key={actor} className="flex flex-col items-center gap-1">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-bold border"
                      style={{ borderColor: ACTOR_COLORS[actor] + '50', background: ACTOR_COLORS[actor] + '15', color: ACTOR_COLORS[actor] }}>
                      {actor}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vertical lines */}
              <div className="flex justify-around absolute inset-x-0 top-10 bottom-0 pointer-events-none">
                {seq.actors.map(actor => (
                  <div key={actor} className="w-px" style={{ background: ACTOR_COLORS[actor] + '25' }} />
                ))}
              </div>

              {/* Frames */}
              <div className="space-y-2 pt-2">
                {seq.frames.map((frame, i) => {
                  const actors = seq.actors;
                  const fromIdx = actors.indexOf(frame.from);
                  const toIdx = actors.indexOf(frame.to);
                  const goRight = toIdx > fromIdx;
                  const leftPct = (Math.min(fromIdx, toIdx) / (actors.length - 1)) * 100;
                  const rightPct = (Math.max(fromIdx, toIdx) / (actors.length - 1)) * 100;

                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: goRight ? -10 : 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative h-10">
                      {/* Arrow line */}
                      <div className="absolute top-4 flex items-center"
                        style={{
                          left: `${leftPct}%`,
                          width: `${rightPct - leftPct}%`,
                        }}>
                        <div className="w-full h-px" style={{ background: frame.color ?? '#475569' }} />
                        {goRight ? (
                          <div className="w-0 h-0 -ml-px flex-shrink-0"
                            style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `6px solid ${frame.color ?? '#475569'}` }} />
                        ) : (
                          <div className="w-0 h-0 absolute left-0 flex-shrink-0"
                            style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `6px solid ${frame.color ?? '#475569'}` }} />
                        )}
                      </div>

                      {/* Label centered above the arrow */}
                      <div className="absolute -top-0 w-full flex justify-center pointer-events-none">
                        <div className="text-center px-1" style={{
                          marginLeft: `${leftPct}%`,
                          width: `${rightPct - leftPct}%`,
                        }}>
                          <p className="text-xs font-semibold truncate" style={{ color: frame.color ?? '#94a3b8', fontSize: '10px' }}>{frame.label}</p>
                          {frame.note && <p className="text-slate-600 truncate" style={{ fontSize: '8px' }}>{frame.note}</p>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="glass-panel p-4 border-glow-blue">
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-bold text-slate-300">Summary: </span>{seq.summary}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function tabLabel(tab: Tab): string {
  switch (tab) {
    case 'MAC Frame Format': return '🗂 MAC Frame';
    case 'Frame Control':    return '🎛 Frame Control';
    case 'Frame Browser':    return '🔬 Frame Browser';
    case 'IE Catalog':       return '📋 IE Catalog';
    case 'Sequences':        return '🔄 Sequences';
    case 'Power Save':       return '💤 Power Save';
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function Chapter5() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('MAC Frame Format');

  useEffect(() => {
    CH5_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch5', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Every byte of every Wi-Fi frame explained — MAC header anatomy, Frame Control deep dive, 12 frame types, 18+ IEs, frame sequence diagrams, and Wi-Fi 6 TWT power save." />
        <ModeBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-band6 text-band6' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'MAC Frame Format' && <MACFrameFormatTab />}
          {activeTab === 'Frame Control'    && <FrameControlTab />}
          {activeTab === 'Frame Browser'    && <PacketAnalyzer />}
          {activeTab === 'IE Catalog'       && <IECatalogTab />}
          {activeTab === 'Sequences'        && <FrameSequencesTab />}
          {activeTab === 'Power Save'       && <PowerSaveTWT />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
