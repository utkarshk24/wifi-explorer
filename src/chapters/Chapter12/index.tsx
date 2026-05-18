import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch12')!;

const TABS = ['Survey Types', 'Survey Tools', 'AP Placement', 'Heatmap & Analysis', 'Validation'] as const;
type Tab = typeof TABS[number];

const CH12_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Survey Types':       ['survey_types', 'pre_survey'],
  'Survey Tools':       ['tools_overview', 'ekahau', 'ibwave', 'netspot'],
  'AP Placement':       ['ap_placement', 'attenuation'],
  'Heatmap & Analysis': ['heatmap'],
  'Validation':         ['validation'],
};

// ─── Tab 1: Survey Types ──────────────────────────────────────────────────────

const SURVEY_TYPES = [
  {
    id: 'passive', name: 'Passive Survey', icon: '👂', color: '#06b6d4',
    desc: 'Listen-only mode — adapter scans all channels recording beacons, signal strength, and noise without associating to any AP.',
    when: 'Existing network assessment, pre-deployment baseline, interference hunting',
    tools: 'Ekahau Survey, AirMagnet, Acrylic Wi-Fi',
    duration: '1–4 hours per floor',
    deliverable: 'Channel utilization, RSSI/SNR coverage maps, interference report',
    kid: '👂 Passive survey is like walking through a building with a measuring tape for Wi-Fi! Your device just LISTENS to all the Wi-Fi signals around it without connecting, and maps how strong they are in every spot.',
    enthusiast: 'In passive mode, your survey adapter listens on each channel for a configurable dwell time (typically 100-500ms). It records every beacon, probe response, and data frame overhead. You build coverage maps by walking the space with GPS or click-mapped positions.',
    pro: 'Adapter in monitor mode (RFMON). Captures: SSID, BSSID, RSSI (per-antenna), noise floor, channel utilization, beacon interval, capabilities IEs, client counts. Requires calibrated adapter (known antenna gain). Walking speed: ≤1m/s, data point every 1-2m. 2.4/5/6 GHz requires multi-radio adapter or separate passes.',
  },
  {
    id: 'active', name: 'Active Survey', icon: '📡', color: '#a855f7',
    when: 'New deployment validation, throughput verification, VoIP readiness',
    desc: 'Associates to the network and performs real-time throughput tests, round-trip latency, and packet loss measurement at each survey point.',
    tools: 'Ekahau Survey (active mode), iPerf + mapping, AirMagnet Survey Pro',
    duration: '4–8 hours per floor',
    deliverable: 'Throughput maps, roaming delay analysis, voice MOS scores',
    kid: '📡 Active survey actually CONNECTS to the Wi-Fi and tests it! Like someone running full-speed on a treadmill at each spot in the building to see how fast the Wi-Fi really is there.',
    enthusiast: 'Active survey associates to an SSID and runs tests (iPerf, ping, TCP throughput) at each location. Captures actual application-level performance including roaming delays between APs. Essential for VoIP deployments where per-call MOS scores must be verified.',
    pro: 'Metrics captured: DL/UL TCP/UDP throughput (iPerf3), ICMP RTT, packet loss %, retry rate, roaming events (time + target AP). Voice readiness: MOS ≥ 3.6, jitter < 20ms, packet loss < 1%, roaming < 50ms (802.11r). Active survey requires test SSID or guest access to avoid production interference.',
  },
  {
    id: 'predictive', name: 'Predictive Survey', icon: '🖥️', color: '#10b981',
    when: 'Pre-construction planning, budgeting, new buildings, large campus RFPs',
    desc: 'Import CAD/PDF floor plan, assign wall materials, place virtual APs and simulate RF propagation using ray-tracing algorithms — all before setting foot on site.',
    tools: 'Ekahau AI Pro, iBwave Wi-Fi, AirMagnet Planner, CloudTrax',
    duration: '2–8 hours per floor (office work)',
    deliverable: 'AP count estimate, bill of materials, predicted coverage maps, capacity model',
    kid: '🖥️ Predictive survey is like using a video game to plan your Wi-Fi! You draw the building on a computer, tell it what the walls are made of, and it predicts where the Wi-Fi signal will be strong — before any real equipment is installed!',
    enthusiast: 'Upload a floor plan (CAD/PDF), set material attenuation values for each wall type, place virtual APs (with model-specific antenna patterns), and the software ray-traces signal propagation. Output: predicted RSSI, SNR, and throughput maps. Great for budget planning before deployment.',
    pro: 'Ray-tracing algorithms (Dominant Path Model or multi-wall models). Materials library: concrete 12-15 dB, drywall 3-5 dB, glass 2-4 dB, steel door 13-20 dB. AP model DB: vendor-specific radiation patterns (3D antenna files). Capacity planning: user count × average throughput / AP capacity. Accuracy: ±5-10 dBm vs real-world (materials, furniture, people not modeled). Must be validated with post-install survey.',
  },
  {
    id: 'apoaS', name: 'AP-on-a-Stick (APoaS)', icon: '🎯', color: '#f59e0b',
    when: 'Greenfield deployments, validating AP placement before cable runs, Coverage SLA verification',
    desc: 'Mount a real AP on a tripod at proposed installation heights, power via PoE injector, and conduct an active survey — validates real-world performance before drilling.',
    tools: 'Any AP + PoE injector + tripod + Ekahau/AirMagnet',
    duration: '30–60 min per AP position tested',
    deliverable: 'Confirmed AP placement with real-world validation, mounting height optimization',
    kid: '🎯 APoaS is like test-driving an AP before you screw it into the ceiling! You put it on a camera tripod at the height it will be mounted, then walk around testing — if the signal is great, you drill the hole there!',
    enthusiast: 'Place the actual AP model (or equivalent) at the exact proposed ceiling mount height on a tripod. Power with a PoE injector and generator/UPS if needed. Survey the coverage radius to confirm the predictive model. Adjust placement before cable infrastructure is committed.',
    pro: 'Critical for high-ceiling venues (warehouses 8-12m, arenas). AP mount height dramatically affects coverage cell size and overlap. APoaS validates: EIRP, actual antenna pattern at height, interference from metal racking/HVAC. Document: mount height, tilt angle, azimuth, observed RSSI at boundary. Compare to predictive model — typical 3-8 dB variance from obstructions and multipath.',
  },
];

const PRE_SURVEY_CHECKLIST = [
  { cat: '📋 Customer Requirements', items: ['Coverage SLA (RSSI ≥ ? dBm)', 'Minimum data rate (Mbps)', 'User density (users/1000 sq ft)', 'Application types (voice/video/IoT)', 'Security requirements (WPA3?)', 'Regulatory domain'] },
  { cat: '🗺️ Site Information', items: ['Building floor plans (CAD/PDF)', 'Construction materials list', 'Existing infrastructure (cable, conduit)', 'Power availability (PoE budget)', 'AES/UPS requirements', 'Plenum vs non-plenum spaces'] },
  { cat: '🔧 Equipment Needed', items: ['Survey laptop + license', 'Calibrated survey adapter', 'GPS module (outdoor) or click-map', '2.4/5/6 GHz tri-band adapter', 'Battery pack (4–8 hr)', 'Safety: hard hat, hi-vis vest'] },
  { cat: '📊 Deliverables Agreed', items: ['Coverage maps (RSSI/SNR/data rate)', 'Channel utilization report', 'AP placement drawings', 'Bill of Materials', 'Post-install validation plan', 'SLA compliance report'] },
];

function SurveyTypesTab() {
  const { mode } = useApp();
  const [selected, setSelected] = useState(SURVEY_TYPES[0]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const totalItems = PRE_SURVEY_CHECKLIST.reduce((s, c) => s + c.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Survey type selector */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Four Types of Wi-Fi Site Survey</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SURVEY_TYPES.map(t => (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`p-3 rounded-xl border text-center transition-all ${selected.id === t.id ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
              style={selected.id === t.id ? { borderColor: t.color + '60', background: t.color + '15' } : { borderColor: '#334155' }}>
              <div className="text-2xl mb-1">{t.icon}</div>
              <p className="text-xs font-bold" style={{ color: t.color }}>{t.name}</p>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {[{ l: 'Best For', v: selected.when }, { l: 'Tools', v: selected.tools },
                { l: 'Duration', v: selected.duration }, { l: 'Deliverable', v: selected.deliverable }].map(f => (
                <div key={f.l} className="bg-surface-900/60 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">{f.l}</p>
                  <p className="text-xs font-semibold text-slate-300">{f.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-900/60 rounded-xl p-3 border" style={{ borderColor: selected.color + '30' }}>
              <p className="text-xs text-slate-400 leading-relaxed">{selected[mode]}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Survey walk animation */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Survey Walk Animation</h3>
        <SurveyWalkAnim />
      </div>

      {/* Pre-survey checklist */}
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">Pre-Survey Checklist</h3>
          <span className="text-xs font-bold text-band24">{checkedItems.size}/{totalItems} complete</span>
        </div>
        <div className="w-full bg-surface-700 rounded-full h-1.5 mb-2">
          <motion.div className="h-1.5 rounded-full bg-band24" animate={{ width: `${(checkedItems.size / totalItems) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {PRE_SURVEY_CHECKLIST.map(cat => (
            <div key={cat.cat}>
              <p className="text-xs font-bold text-slate-300 mb-2">{cat.cat}</p>
              <div className="space-y-1.5">
                {cat.items.map(item => (
                  <button key={item} onClick={() => toggleCheck(item)}
                    className="w-full flex items-center gap-2 text-left hover:bg-surface-700/50 rounded-lg px-2 py-1 transition-colors">
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                      checkedItems.has(item) ? 'bg-band24 border-band24' : 'border-slate-600'}`}>
                      {checkedItems.has(item) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-xs transition-colors ${checkedItems.has(item) ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SurveyWalkAnim() {
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);

  // Survey path: zigzag across a room
  const path = [
    { x: 30, y: 60 }, { x: 90, y: 60 }, { x: 150, y: 60 }, { x: 210, y: 60 }, { x: 270, y: 60 }, { x: 330, y: 60 },
    { x: 330, y: 100 },
    { x: 270, y: 100 }, { x: 210, y: 100 }, { x: 150, y: 100 }, { x: 90, y: 100 }, { x: 30, y: 100 },
    { x: 30, y: 140 },
    { x: 90, y: 140 }, { x: 150, y: 140 }, { x: 210, y: 140 }, { x: 270, y: 140 }, { x: 330, y: 140 },
  ];

  const start = () => {
    if (running) return;
    setRunning(true); setPos(0);
    path.forEach((_, i) => {
      setTimeout(() => {
        setPos(i);
        if (i === path.length - 1) setRunning(false);
      }, i * 280);
    });
  };

  return (
    <div className="space-y-3">
      <button onClick={start} disabled={running}
        className="btn-primary text-xs">
        {running ? '🚶 Surveying…' : '▶ Start Survey Walk'}
      </button>
      <div className="bg-surface-900/70 rounded-xl overflow-hidden">
        <svg viewBox="0 0 380 200" className="w-full" style={{ maxHeight: 200 }}>
          {/* Room outline */}
          <rect x="10" y="10" width="360" height="180" rx="4" fill="rgba(15,23,42,0.6)" stroke="#334155" strokeWidth="1.5" />
          {/* AP icons */}
          {[{ x: 100, y: 30 }, { x: 280, y: 30 }].map((ap, i) => (
            <g key={i} transform={`translate(${ap.x},${ap.y})`}>
              <circle r="14" fill="#a855f720" stroke="#a855f7" strokeWidth="1.5" />
              <text textAnchor="middle" dominantBaseline="central" fontSize="10">📡</text>
              {/* Signal rings */}
              {[30, 55, 80].map(r => (
                <circle key={r} r={r} fill="none" stroke="#a855f715" strokeWidth="1" />
              ))}
            </g>
          ))}
          {/* Survey path dots */}
          {path.slice(0, pos + 1).map((p, i) => (
            <motion.circle key={i} cx={p.x} cy={p.y} r={i === pos ? 6 : 3}
              fill={i === pos ? '#06b6d4' : '#06b6d440'}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}>
              {i === pos && (
                <animate attributeName="r" values="6;9;6" dur="0.6s" repeatCount="indefinite" />
              )}
            </motion.circle>
          ))}
          {/* RSSI readings at each collected point */}
          {path.slice(0, pos).map((p, i) => {
            const rssi = -40 - Math.random() * 30;
            const color = rssi > -65 ? '#10b981' : rssi > -75 ? '#f59e0b' : '#ef4444';
            return (
              <text key={i} x={p.x} y={p.y - 8} textAnchor="middle" fontSize="6" fill={color} fontFamily="JetBrains Mono">
                {Math.round(rssi)}
              </text>
            );
          })}
          {/* Labels */}
          <text x="190" y="185" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">Survey path — {pos}/{path.length - 1} points collected</text>
        </svg>
      </div>
    </div>
  );
}

// ─── Tab 2: Survey Tools ──────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'Ekahau AI Pro', vendor: 'Ekahau (Ookla)', color: '#10b981', icon: '🟢', price: '~$5,000/yr',
    type: 'Professional', platform: 'Windows / macOS',
    strengths: ['AI-based AP placement suggestions', 'Real-time active + passive survey', 'Ekahau Sidekick hardware adapter', '3D floor plan support', 'Enterprise reporting', 'Automatic heatmap generation'],
    weaknesses: ['Expensive', 'Requires Sidekick for best results', 'Learning curve'],
    certifications: ['CWNA', 'CWDP', 'CWAP study tool'],
    kid: '🟢 Ekahau is the professional\'s favorite Wi-Fi survey tool! It\'s like a GPS for Wi-Fi — walk through a building and it automatically maps signal strength everywhere. The AI even suggests where to place your APs!',
    enthusiast: 'Ekahau AI Pro combines predictive planning (import floor plan → place virtual APs → simulate coverage) with real-world survey (walk with laptop + Sidekick adapter → auto-generate heatmaps). The Sidekick hardware adapter has calibrated antennas for accurate readings.',
    pro: 'Ekahau Sidekick: dual-band 802.11ax adapter, 2×2 MIMO, calibrated RSSI (±2 dBm), external GPS. AI Planner: ML model trained on millions of real surveys for AP placement optimization. Exports: PDF, CSV, AutoCAD DXF, Visio. RTLS integration for location tracking. Spectrum analysis via Sidekick 2. API for CI/CD integration.',
  },
  {
    name: 'iBwave Wi-Fi', vendor: 'iBwave (CommScope)', color: '#a855f7', icon: '🟣', price: '~$3,000-8,000/yr',
    type: 'Enterprise Predictive', platform: 'Windows',
    strengths: ['Industry-standard for carrier/DAS planning', '3D modeling with multi-floor', 'Vendor AP library (10,000+ models)', 'BIM/CAD integration', 'Capacity and coverage co-design'],
    weaknesses: ['Windows only', 'Complex UI', 'Primarily predictive (active survey limited)', 'Expensive'],
    certifications: ['iBwave Certified'],
    kid: '🟣 iBwave is like an architect\'s software for Wi-Fi! Instead of just walking around, you build a 3D model of the building and the software calculates exactly how the Wi-Fi will behave in every room — even on different floors!',
    enthusiast: 'iBwave specializes in indoor wireless design for complex venues — airports, hospitals, stadiums. It models multi-floor RF propagation in true 3D, handles in-building DAS (Distributed Antenna Systems) as well as Wi-Fi, and integrates with BIM (Building Information Modeling).',
    pro: 'iBwave propagation model: multi-wall + floor penetration. AP library: real 3D antenna patterns per model. Material database: 500+ pre-defined materials with attenuation coefficients. iBwave Level 1-3 certification program. Outputs: iBwave Design Report (IDR) — carrier-grade deliverable. Integrates with AutoCAD/Revit. Capacity planning: user density × per-user throughput / AP capacity with SINR model.',
  },
  {
    name: 'NetSpot', vendor: 'NetSpot LLC', color: '#f59e0b', icon: '🟡', price: 'Free / $149 / $499',
    type: 'SMB / Education', platform: 'macOS / Windows / Android',
    strengths: ['Free tier available', 'Easy to use', 'Import floor plan JPG/PDF', 'Passive + active survey', 'Good for small offices'],
    weaknesses: ['Limited enterprise features', 'No hardware adapter optimization', 'Basic reporting'],
    certifications: ['None — educational use'],
    kid: '🟡 NetSpot is the free (or cheap) version! Perfect for checking your home or small office Wi-Fi. Download it, take a photo of your floor plan, and walk around — it shows where the signal is weak!',
    enthusiast: 'NetSpot is the go-to tool for SMBs, consultants, and students. The free tier supports passive discovery mode. Paid tiers add active survey, data export, and floor plan overlay. Great for quick health checks and troubleshooting.',
    pro: 'NetSpot Pro: 100-zone limit per project, iPerf3 integration for active throughput testing, signal-to-noise ratio mapping, channel interference overlay, CSV export. Enterprise tier: unlimited zones, custom reporting, network comparison. macOS uses native Core WLAN; Windows uses Npcap for monitor mode.',
  },
  {
    name: 'AirMagnet Survey Pro', vendor: 'NetAlly (formerly Fluke)', color: '#ef4444', icon: '🔴', price: '~$4,000',
    type: 'Professional', platform: 'Windows',
    strengths: ['Long-established industry tool', 'Extensive compliance reports (HIPAA, PCI, DoD)', 'Integrated spectrum analysis', 'AirWISE expert system (auto-diagnosis)'],
    weaknesses: ['Aging UI', 'Windows only', 'Less AI features than Ekahau', 'Single-purchase model (good for capex)'],
    certifications: ['CWNA', 'CWDP', 'NetAlly certified'],
    kid: '🔴 AirMagnet is like the "old reliable" Wi-Fi tool — used by government and hospitals because it creates official reports proving the Wi-Fi meets strict rules (like HIPAA for hospital privacy).',
    enthusiast: 'AirMagnet Survey Pro is particularly strong in regulated industries. AirWISE is an expert system that automatically identifies problems (co-channel interference, rogue APs, low SNR zones) and suggests fixes. Compliance report templates for HIPAA, PCI-DSS, DoD 8100.2.',
    pro: 'Adapters: Cisco, Netgear, ALFA (802.11ax). Spectrum analysis: MetaGeek Wi-Spy integration. AirWISE rules engine: 200+ pre-defined tests. DoD WLAN policy compliance: checks channel power, encryption, authentication per DoD 8100.2/STIG. Survey types: passive, active (iPerf), VoIP (G.711/G.729 MOS), rogues, interference. AutoCAD DXF import/export.',
  },
  {
    name: 'Acrylic Wi-Fi Professional', vendor: 'Tarlogic', color: '#06b6d4', icon: '🔵', price: '~$199/yr',
    type: 'Professional (Windows)', platform: 'Windows only',
    strengths: ['Budget professional option', 'Real-time spectrum view', 'Passive + active survey', 'Good for MSPs'],
    weaknesses: ['Windows only', 'Smaller community', 'Less vendor support vs Ekahau'],
    certifications: ['None official'],
    kid: '🔵 Acrylic is a great mid-priced tool — not as fancy as Ekahau but way more powerful than free apps. Used by IT companies to survey many clients\' offices quickly.',
    enthusiast: 'Acrylic Wi-Fi Professional is a well-regarded Windows tool for professional surveys at a fraction of Ekahau\'s price. Good real-time visualization, passive scanning with monitor mode adapters, and floor plan overlay.',
    pro: 'Supports monitor mode via WinPcap/Npcap. Captures: all 802.11 frames in monitor mode. Heatmap: RSSI, SNR, channel utilization, data rate, PHY type. Spectrum view: requires compatible SDR adapter. Bluetooth scanning via separate Acrylic Bluetooth module. REST API for integration. Spanish vendor — EU GDPR compliant by design.',
  },
];

function SurveyToolsTab() {
  const { mode } = useApp();
  const [selected, setSelected] = useState(TOOLS[0]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {TOOLS.map(t => (
          <button key={t.name} onClick={() => setSelected(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              selected.name === t.name ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            style={selected.name === t.name ? { borderColor: t.color + '60', background: t.color + '20', color: t.color } : {}}>
            {t.icon} {t.name.split(' ')[0]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="glass-panel p-5 border space-y-4" style={{ borderColor: selected.color + '40' }}>
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="font-bold text-white text-lg">{selected.name}</p>
              <p className="text-xs text-slate-500">{selected.vendor} · {selected.platform} · {selected.type}</p>
            </div>
            <span className="px-2 py-1 rounded-lg text-xs font-bold border"
              style={{ color: selected.color, borderColor: selected.color + '50', background: selected.color + '15' }}>
              {selected.price}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-400 mb-2">✅ Strengths</p>
              <div className="space-y-1">
                {selected.strengths.map(s => <p key={s} className="text-xs text-slate-400">• {s}</p>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 mb-2">⚠️ Weaknesses</p>
              <div className="space-y-1">
                {selected.weaknesses.map(w => <p key={w} className="text-xs text-slate-400">• {w}</p>)}
              </div>
            </div>
          </div>

          <div className="bg-surface-900/60 rounded-xl p-3 border" style={{ borderColor: selected.color + '30' }}>
            <p className="text-xs text-slate-400 leading-relaxed">{selected[mode]}</p>
          </div>

          {selected.certifications[0] !== 'None' && (
            <div className="flex gap-2 flex-wrap">
              {selected.certifications.map(c => (
                <span key={c} className="px-2 py-0.5 rounded text-xs border border-amber-500/30 bg-amber-500/10 text-amber-400">{c}</span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick comparison */}
      <div className="glass-panel p-5 border-glow-blue">
        <h3 className="font-bold text-white mb-3">Tool Selection Guide</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Tool', 'Price', 'Best For', 'Active', 'Predictive', 'Compliance'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { t: 'Ekahau AI Pro', p: '$$$', b: 'Enterprise / CWNP', act: '✅', pred: '✅', comp: '✅' },
                { t: 'iBwave',        p: '$$$$',b: 'Carrier / DAS / 3D', act: '⚠️', pred: '✅', comp: '✅' },
                { t: 'AirMagnet',     p: '$$$', b: 'Regulated industries', act: '✅', pred: '⚠️', comp: '✅' },
                { t: 'Acrylic Pro',   p: '$',   b: 'MSP / mid-market',  act: '✅', pred: '❌', comp: '❌' },
                { t: 'NetSpot',       p: 'Free-$',b: 'SMB / students', act: '✅', pred: '⚠️', comp: '❌' },
              ].map(r => (
                <tr key={r.t} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-semibold text-slate-300">{r.t}</td>
                  <td className="py-1.5 px-2 text-amber-400 font-mono">{r.p}</td>
                  <td className="py-1.5 px-2 text-slate-400">{r.b}</td>
                  <td className="py-1.5 px-2 text-center">{r.act}</td>
                  <td className="py-1.5 px-2 text-center">{r.pred}</td>
                  <td className="py-1.5 px-2 text-center">{r.comp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: AP Placement Simulator ───────────────────────────────────────────

const COLS = 16;
const ROWS = 10;
const CELL = 34;

const WALL_CELLS = new Set<string>([
  // Outer walls (border)
  ...Array.from({ length: COLS }, (_, x) => `${x},0`),
  ...Array.from({ length: COLS }, (_, x) => `${x},${ROWS - 1}`),
  ...Array.from({ length: ROWS }, (_, y) => `0,${y}`),
  ...Array.from({ length: ROWS }, (_, y) => `${COLS - 1},${y}`),
  // Internal walls — vertical dividers
  ...Array.from({ length: 4 }, (_, y) => `5,${y + 1}`),
  ...Array.from({ length: 4 }, (_, y) => `5,${y + 5}`),
  ...Array.from({ length: 4 }, (_, y) => `10,${y + 1}`),
  ...Array.from({ length: 4 }, (_, y) => `10,${y + 5}`),
  // Horizontal dividers
  ...Array.from({ length: 4 }, (_, x) => `${x + 1},5`),
  ...Array.from({ length: 3 }, (_, x) => `${x + 6},5`),
  ...Array.from({ length: 4 }, (_, x) => `${x + 11},5`),
]);

const ROOM_LABELS = [
  { x: 2.5, y: 2.5, label: 'Conf A' },
  { x: 7.5, y: 2.5, label: 'Open Office' },
  { x: 12.5, y: 2.5, label: 'Conf B' },
  { x: 2.5, y: 7.5, label: 'Server' },
  { x: 7.5, y: 7.5, label: 'Open Office' },
  { x: 12.5, y: 7.5, label: 'Lobby' },
];

const WALL_MATERIALS = [
  { id: 'drywall', label: 'Drywall', loss: 3,  color: '#64748b' },
  { id: 'concrete',label: 'Concrete', loss: 14, color: '#94a3b8' },
  { id: 'glass',   label: 'Glass',   loss: 2,  color: '#38bdf8' },
  { id: 'metal',   label: 'Metal',   loss: 20, color: '#f59e0b' },
];

function computeRSSI(apList: {x:number,y:number}[], cx:number, cy:number, wallLoss: number): number {
  if (apList.length === 0) return -100;
  let best = -100;
  for (const ap of apList) {
    const dist = Math.sqrt((cx - ap.x) ** 2 + (cy - ap.y) ** 2);
    if (dist < 0.01) { best = -35; continue; }
    // Simplified: -35 dBm at 1 cell, drops with distance
    const pathLoss = 35 * Math.log10(dist + 1);
    // Wall crossing: count wall cells between ap and cell (simplified Manhattan check)
    const wallCrossings = Math.floor(Math.abs(cx - ap.x) / 5) + Math.floor(Math.abs(cy - ap.y) / 5);
    const rssi = -35 - pathLoss - wallCrossings * wallLoss;
    best = Math.max(best, rssi);
  }
  return best;
}

function rssiColor(rssi: number): string {
  if (rssi >= -65) return '#10b981cc';
  if (rssi >= -70) return '#84cc16cc';
  if (rssi >= -75) return '#f59e0bcc';
  if (rssi >= -82) return '#f97316cc';
  return '#ef4444cc';
}

function rssiLabel(rssi: number): string {
  if (rssi >= -65) return 'Excellent';
  if (rssi >= -70) return 'Good';
  if (rssi >= -75) return 'Fair';
  if (rssi >= -82) return 'Poor';
  return 'No signal';
}

function APPlacementTab() {
  const [aps, setAps] = useState<{x:number,y:number}[]>([]);
  const [material, setMaterial] = useState(WALL_MATERIALS[0]);
  const [hoverCell, setHoverCell] = useState<{x:number,y:number,rssi:number} | null>(null);

  const toggleAP = (x: number, y: number) => {
    if (WALL_CELLS.has(`${x},${y}`)) return;
    setAps(prev => {
      const idx = prev.findIndex(a => a.x === x && a.y === y);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= 6) return prev;
      return [...prev, { x, y }];
    });
  };

  const heatmap = useMemo(() => {
    const map: number[][] = [];
    for (let y = 0; y < ROWS; y++) {
      map[y] = [];
      for (let x = 0; x < COLS; x++) {
        if (WALL_CELLS.has(`${x},${y}`)) { map[y][x] = -100; continue; }
        map[y][x] = computeRSSI(aps, x, y, material.loss);
      }
    }
    return map;
  }, [aps, material]);

  const covered = useMemo(() => {
    let good = 0, total = 0;
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      if (WALL_CELLS.has(`${x},${y}`)) continue;
      total++;
      if (heatmap[y][x] >= -75) good++;
    }
    return total > 0 ? Math.round((good / total) * 100) : 0;
  }, [heatmap]);

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-white">Interactive AP Placement Simulator</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">📡 {aps.length}/6 APs placed</span>
            <span className="text-xs font-bold" style={{ color: covered >= 80 ? '#10b981' : covered >= 60 ? '#f59e0b' : '#ef4444' }}>
              {covered}% coverage ≥ -75 dBm
            </span>
            <button onClick={() => setAps([])} className="btn-ghost text-xs">Clear</button>
          </div>
        </div>

        {/* Wall material selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">Wall material:</span>
          {WALL_MATERIALS.map(m => (
            <button key={m.id} onClick={() => setMaterial(m)}
              className={`px-2 py-1 rounded text-xs font-bold border transition-all ${material.id === m.id ? 'text-white' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={material.id === m.id ? { borderColor: m.color + '60', background: m.color + '25', color: m.color } : {}}>
              {m.label} ({m.loss} dB)
            </button>
          ))}
        </div>

        {/* Floor plan grid */}
        <div className="overflow-x-auto">
          <svg width={COLS * CELL} height={ROWS * CELL} className="rounded-xl"
            style={{ maxWidth: '100%' }}>
            <rect width={COLS * CELL} height={ROWS * CELL} fill="rgba(10,15,30,0.95)" rx="8" />
            {/* Room labels */}
            {ROOM_LABELS.map(r => (
              <text key={r.label} x={r.x * CELL} y={r.y * CELL}
                textAnchor="middle" dominantBaseline="central"
                fill="#1e293b" fontSize="9" fontFamily="Inter" fontWeight="600" opacity="0.6">
                {r.label}
              </text>
            ))}
            {/* Cells */}
            {Array.from({ length: ROWS }, (_, y) =>
              Array.from({ length: COLS }, (_, x) => {
                const isWall = WALL_CELLS.has(`${x},${y}`);
                const isAP = aps.some(a => a.x === x && a.y === y);
                const rssi = heatmap[y]?.[x] ?? -100;
                return (
                  <g key={`${x},${y}`} transform={`translate(${x * CELL},${y * CELL})`}
                    onClick={() => toggleAP(x, y)}
                    onMouseEnter={() => !isWall && setHoverCell({ x, y, rssi })}
                    onMouseLeave={() => setHoverCell(null)}
                    style={{ cursor: isWall ? 'default' : 'pointer' }}>
                    <rect width={CELL - 1} height={CELL - 1} rx="2"
                      fill={isWall ? '#1e293b' : aps.length > 0 ? rssiColor(rssi) : '#1e293b30'}
                      stroke={isWall ? '#334155' : '#ffffff08'}
                      strokeWidth="0.5" />
                    {isWall && <rect width={CELL - 1} height={CELL - 1} rx="2" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />}
                    {isAP && (
                      <>
                        <circle cx={CELL / 2 - 0.5} cy={CELL / 2 - 0.5} r={CELL / 2 - 4}
                          fill="#a855f730" stroke="#a855f7" strokeWidth="1.5" />
                        <text x={CELL / 2 - 0.5} y={CELL / 2 + 1} textAnchor="middle"
                          dominantBaseline="central" fontSize="14">📡</text>
                      </>
                    )}
                  </g>
                );
              })
            )}
          </svg>
        </div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoverCell && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 text-xs px-3 py-2 rounded-lg border"
              style={{ borderColor: rssiColor(hoverCell.rssi).replace('cc', '60') }}>
              <span className="text-slate-400">Cell ({hoverCell.x}, {hoverCell.y})</span>
              <span className="font-bold font-mono" style={{ color: rssiColor(hoverCell.rssi).replace('cc', '') }}>
                RSSI: {Math.round(hoverCell.rssi)} dBm
              </span>
              <span className="font-semibold" style={{ color: rssiColor(hoverCell.rssi).replace('cc', '') }}>
                {rssiLabel(hoverCell.rssi)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RSSI legend */}
        <div className="flex gap-2 flex-wrap">
          {[{ l: '≥ -65 dBm', c: '#10b981', t: 'Excellent' }, { l: '-65 to -70', c: '#84cc16', t: 'Good' },
            { l: '-70 to -75', c: '#f59e0b', t: 'Fair' }, { l: '-75 to -82', c: '#f97316', t: 'Poor' },
            { l: '< -82 dBm', c: '#ef4444', t: 'No signal' }].map(r => (
            <div key={r.l} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ background: r.c }} />
              <span className="text-xs text-slate-400">{r.l} ({r.t})</span>
            </div>
          ))}
        </div>

        <ModeContent content={{
          kid: '🗺️ Click on the floor plan to place Wi-Fi routers (📡)! Watch how the colors show where the signal is strong (green = great!) and where it\'s weak (red = trouble). Try placing APs in different spots to cover the whole floor!',
          enthusiast: 'The simulator shows approximate signal strength (RSSI) based on distance and wall attenuation. Green zones (≥-65 dBm) are excellent for all applications. Yellow (-70 to -75) works for data but not VoIP. Red (<-82 dBm) means devices will disconnect. Aim for ≥80% green coverage.',
          pro: 'Simplified FSPL model: RSSI = -35 - 35log10(dist) - N×wallLoss. Real tools use ray-tracing (dominant path or multi-wall model). Target RSSI: voice ≥ -67 dBm, data ≥ -70 dBm, IoT ≥ -80 dBm. 15-20% overlap between APs required for seamless roaming (-67 dBm boundary). Rule of thumb: 1 AP per 2000-3000 sq ft (light use), per 1000 sq ft (high density).',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>

      {/* Material attenuation reference */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Material Attenuation Reference</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { mat: 'Drywall (single)', loss: '3–5 dB', freq: 'All bands', note: 'Standard office partition' },
            { mat: 'Glass (standard)', loss: '2–4 dB', freq: 'All bands', note: 'Office windows' },
            { mat: 'Glass (low-E coated)', loss: '10–30 dB', freq: '5/6 GHz worse', note: 'Energy-efficient — blocks Wi-Fi!' },
            { mat: 'Wood door', loss: '3–5 dB', freq: 'All bands', note: 'Interior doors' },
            { mat: 'Concrete (30cm)', loss: '12–18 dB', freq: 'Higher @ 5/6 GHz', note: 'Exterior/structural walls' },
            { mat: 'Brick (10cm)', loss: '6–12 dB', freq: 'Higher @ 5/6 GHz', note: 'Older construction' },
            { mat: 'Steel door / metal', loss: '15–25 dB', freq: 'Very high @ 6 GHz', note: 'Server room, fire doors' },
            { mat: 'Floor/ceiling (concrete)', loss: '15–25 dB', freq: 'Per floor', note: 'Multi-floor planning' },
            { mat: 'Human body', loss: '3–5 dB', freq: '2.4 GHz < 5 GHz', note: 'Crowd attenuation factor' },
            { mat: 'Elevator shaft (steel)', loss: '25–40 dB', freq: 'All bands', note: 'Near-Faraday cage' },
          ].map(m => (
            <div key={m.mat} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-900/50 border border-slate-800/50">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-300">{m.mat}</p>
                <p className="text-xs text-slate-500">{m.note}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-amber-400 font-mono">{m.loss}</p>
                <p className="text-xs text-slate-600">{m.freq}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4: Heatmap & Analysis ────────────────────────────────────────────────

const HEATMAP_SCENARIOS = [
  {
    id: 'good', name: 'Well Designed', icon: '✅', color: '#10b981',
    desc: 'APs properly spaced with 15-20% cell overlap. All areas ≥ -70 dBm. No dead zones.',
    apPositions: [{ x: 3, y: 3 }, { x: 8, y: 3 }, { x: 13, y: 3 }, { x: 3, y: 7 }, { x: 8, y: 7 }, { x: 13, y: 7 }],
  },
  {
    id: 'sparse', name: 'Under-deployed', icon: '⚠️', color: '#f59e0b',
    desc: 'Too few APs — large dead zones exist (red areas). Users experience drops near room edges.',
    apPositions: [{ x: 5, y: 5 }, { x: 11, y: 5 }],
  },
  {
    id: 'dense', name: 'Over-deployed (CCI)', icon: '🔴', color: '#ef4444',
    desc: 'Too many APs on same channel = Co-Channel Interference. High signal but terrible performance.',
    apPositions: [{ x: 2, y: 2 }, { x: 4, y: 4 }, { x: 6, y: 2 }, { x: 8, y: 4 }, { x: 10, y: 2 }, { x: 12, y: 4 }, { x: 14, y: 2 }],
  },
];

function HeatmapTab() {
  const [scenario, setScenario] = useState(HEATMAP_SCENARIOS[0]);

  const heatmap = useMemo(() => {
    const map: number[][] = [];
    for (let y = 0; y < ROWS; y++) {
      map[y] = [];
      for (let x = 0; x < COLS; x++) {
        if (WALL_CELLS.has(`${x},${y}`)) { map[y][x] = -100; continue; }
        map[y][x] = computeRSSI(scenario.apPositions, x, y, 5);
      }
    }
    return map;
  }, [scenario]);

  return (
    <div className="space-y-4">
      <div className="glass-panel p-5 border-glow-blue space-y-4">
        <h3 className="font-bold text-white">Heatmap Scenarios</h3>
        <div className="flex gap-2 flex-wrap">
          {HEATMAP_SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setScenario(s)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${scenario.id === s.id ? 'text-white scale-105' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              style={scenario.id === s.id ? { borderColor: s.color + '60', background: s.color + '20', color: s.color } : {}}>
              {s.icon} {s.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={scenario.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="overflow-x-auto">
              <svg width={COLS * CELL} height={ROWS * CELL} className="rounded-xl" style={{ maxWidth: '100%' }}>
                <rect width={COLS * CELL} height={ROWS * CELL} fill="rgba(10,15,30,0.95)" rx="8" />
                {Array.from({ length: ROWS }, (_, y) =>
                  Array.from({ length: COLS }, (_, x) => {
                    const isWall = WALL_CELLS.has(`${x},${y}`);
                    const isAP = scenario.apPositions.some(a => a.x === x && a.y === y);
                    const rssi = heatmap[y]?.[x] ?? -100;
                    return (
                      <g key={`${x},${y}`} transform={`translate(${x * CELL},${y * CELL})`}>
                        <rect width={CELL - 1} height={CELL - 1} rx="2"
                          fill={isWall ? '#0f172a' : rssiColor(rssi)}
                          stroke={isWall ? '#334155' : '#ffffff05'} strokeWidth="0.5" />
                        {isAP && (
                          <>
                            <circle cx={CELL / 2 - 0.5} cy={CELL / 2 - 0.5} r={CELL / 2 - 4}
                              fill="#00000060" stroke="#ffffff90" strokeWidth="1.5" />
                            <text x={CELL / 2 - 0.5} y={CELL / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize="14">📡</text>
                          </>
                        )}
                      </g>
                    );
                  })
                )}
              </svg>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed"
              style={{ borderLeft: `3px solid ${scenario.color}`, paddingLeft: '10px' }}>
              <span className="font-bold" style={{ color: scenario.color }}>{scenario.name}:</span> {scenario.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Heatmap interpretation guide */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Reading a Heatmap — KPI Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Metric', 'Excellent', 'Good', 'Fair', 'Poor'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { m: 'RSSI', ex: '≥ -65 dBm', g: '-65 to -70', f: '-70 to -75', p: '< -80 dBm' },
                { m: 'SNR', ex: '≥ 35 dB', g: '25–35 dB', f: '15–25 dB', p: '< 10 dB' },
                { m: 'Noise Floor', ex: '< -90 dBm', g: '-85 dBm', f: '-80 dBm', p: '> -75 dBm' },
                { m: 'Channel Util %', ex: '< 20%', g: '20–50%', f: '50–75%', p: '> 75%' },
                { m: 'Roaming Gap', ex: '≥ 15%', g: '10–15%', f: '5–10%', p: '< 5% overlap' },
                { m: 'VoIP MOS', ex: '≥ 4.0', g: '3.6–4.0', f: '3.0–3.6', p: '< 3.0' },
              ].map(r => (
                <tr key={r.m} className="border-b border-slate-800/40">
                  <td className="py-1.5 px-2 font-bold text-slate-300">{r.m}</td>
                  <td className="py-1.5 px-2 text-emerald-400 font-mono">{r.ex}</td>
                  <td className="py-1.5 px-2 text-green-400 font-mono">{r.g}</td>
                  <td className="py-1.5 px-2 text-amber-400 font-mono">{r.f}</td>
                  <td className="py-1.5 px-2 text-red-400 font-mono">{r.p}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ModeContent content={{
          kid: '🌈 A Wi-Fi heatmap is like a weather map for signal strength! Green = sunny (great signal), yellow = cloudy (ok), red = stormy (terrible). Your job is to place APs until the whole map is green!',
          enthusiast: 'Heatmaps visualize RSSI coverage but remember: high RSSI doesn\'t equal good performance if co-channel interference is high. Always check channel utilization and SNR maps alongside RSSI. A -60 dBm signal with -55 dBm noise = SNR 5 dB = poor performance.',
          pro: 'RSSI map alone is insufficient. Required maps: RSSI (coverage), SNR (quality), Channel Utilization (congestion), Data Rate (throughput potential), Roaming Transition map (handoff gaps). CCI threshold: two APs on same channel with RSSI within 20 dB = CCI = SINR degradation. OBSS/PD BSS Coloring (802.11ax) mitigates CCI in Wi-Fi 6 deployments.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Tab 5: Validation & Reports ──────────────────────────────────────────────

const VALIDATION_STEPS = [
  { step: 1, title: 'Post-Install Passive Survey', icon: '📡', color: '#06b6d4',
    tasks: ['Walk all survey areas at same speed/path as pre-survey', 'Verify RSSI ≥ design threshold everywhere', 'Check for dead zones and coverage gaps', 'Confirm no rogue APs added during install'] },
  { step: 2, title: 'Active Throughput Testing', icon: '⚡', color: '#a855f7',
    tasks: ['Run iPerf3 DL/UL tests at coverage boundary points', 'Verify minimum throughput SLA at -75 dBm', 'Test peak locations during load', 'VoIP: run G.711 MOS test, verify ≥ 3.6'] },
  { step: 3, title: 'Roaming Validation', icon: '🔄', color: '#10b981',
    tasks: ['Walk between AP cells while streaming video', 'Verify roaming time < 50ms (802.11r)', 'Check no packet loss during roam events', 'Validate BSS TM (802.11v) steering works'] },
  { step: 4, title: 'Security & Compliance Check', icon: '🔐', color: '#f59e0b',
    tasks: ['Verify WPA3/WPA2-Enterprise on all SSIDs', 'Confirm PMF (802.11w) enabled and required', 'Check for rogue/Evil Twin APs', 'Validate RADIUS server connectivity and failover'] },
  { step: 5, title: 'Channel Plan Verification', icon: '📻', color: '#ef4444',
    tasks: ['Confirm non-overlapping channel assignments', 'Check channel utilization < 50% peak', 'Verify power levels (not too high = CCI)', 'Validate DFS channels not causing drops'] },
  { step: 6, title: 'Report Generation', icon: '📋', color: '#8b5cf6',
    tasks: ['Export coverage maps (RSSI/SNR/Data Rate)', 'Document AP placement drawings (as-built)', 'Compile Bill of Materials (as-installed)', 'Write executive summary + SLA compliance statement'] },
];

function ValidationTab() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(1);

  const toggle = useCallback((key: string) => {
    setChecked(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const totalTasks = VALIDATION_STEPS.reduce((s, v) => s + v.tasks.length, 0);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="glass-panel p-4 border-glow-blue space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">Post-Survey Validation Checklist</h3>
          <span className="text-xs font-bold text-band24">{checked.size}/{totalTasks} tasks complete</span>
        </div>
        <div className="w-full bg-surface-700 rounded-full h-2">
          <motion.div className="h-2 rounded-full bg-band24"
            animate={{ width: `${(checked.size / totalTasks) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* Validation steps */}
      {VALIDATION_STEPS.map(v => (
        <motion.div key={v.step} layout className="glass-panel border overflow-hidden"
          style={{ borderColor: expanded === v.step ? v.color + '50' : '#1e293b' }}>
          <button className="w-full p-4 flex items-center gap-3 text-left"
            onClick={() => setExpanded(expanded === v.step ? null : v.step)}>
            <span className="text-xl flex-shrink-0">{v.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Step {v.step}</span>
                <span className="font-bold text-sm text-white">{v.title}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {v.tasks.map((_t, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${checked.has(`${v.step}-${i}`) ? '' : 'bg-slate-700'}`}
                    style={{ background: checked.has(`${v.step}-${i}`) ? v.color : undefined }} />
                ))}
                <span className="text-xs text-slate-500 ml-1">
                  {v.tasks.filter((_, i) => checked.has(`${v.step}-${i}`)).length}/{v.tasks.length}
                </span>
              </div>
            </div>
            <motion.span animate={{ rotate: expanded === v.step ? 180 : 0 }} className="text-slate-500">▼</motion.span>
          </button>
          <AnimatePresence>
            {expanded === v.step && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: v.color + '30' }}>
                {v.tasks.map((task, i) => {
                  const key = `${v.step}-${i}`;
                  return (
                    <button key={key} onClick={() => toggle(key)}
                      className="w-full flex items-center gap-2 text-left hover:bg-surface-700/40 rounded-lg px-2 py-1.5 transition-colors">
                      <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        checked.has(key) ? 'border-0' : 'border-slate-600'}`}
                        style={checked.has(key) ? { background: v.color } : {}}>
                        {checked.has(key) && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <span className={`text-xs transition-colors ${checked.has(key) ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{task}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Report structure */}
      <div className="glass-panel p-5 border-glow-blue space-y-3">
        <h3 className="font-bold text-white">Survey Report Structure</h3>
        <div className="space-y-2">
          {[
            { sec: '1. Executive Summary', items: 'Coverage SLA met/not met, AP count, key findings, recommendations' },
            { sec: '2. Survey Methodology', items: 'Survey type, tools used, adapter calibration, date/time, surveyor credentials' },
            { sec: '3. Coverage Maps', items: 'RSSI heatmap, SNR map, data rate map, channel utilization map' },
            { sec: '4. AP Placement Drawings', items: 'As-built floor plan with AP locations, mounting heights, channel/power assignments' },
            { sec: '5. Performance Results', items: 'Throughput test results, roaming delay log, VoIP MOS scores, failure zones' },
            { sec: '6. Security Audit', items: 'Encryption verification, rogue AP report, PMF compliance, RADIUS failover test' },
            { sec: '7. Bill of Materials', items: 'APs installed (model/serial), switches, PoE injectors, cable runs, accessories' },
            { sec: '8. Recommendations', items: 'Any gaps found, future capacity expansion, firmware update schedule' },
          ].map(r => (
            <div key={r.sec} className="bg-surface-900/60 rounded-lg p-3 border border-slate-800/50">
              <p className="text-xs font-bold text-slate-300 mb-1">{r.sec}</p>
              <p className="text-xs text-slate-500">{r.items}</p>
            </div>
          ))}
        </div>
        <ModeContent content={{
          kid: '📋 A site survey report is like a report card for Wi-Fi! It shows where the signal is strong, where it\'s weak, how fast the internet is everywhere, and what needs to be fixed. The customer uses it to know they got what they paid for!',
          enthusiast: 'A professional survey report should be comprehensive enough that another engineer could replicate the findings. Include raw data exports (CSV), not just screenshots. Comparison maps (before/after if upgrading) add great value. CWDP certification covers full survey report methodology.',
          pro: 'CWDP exam objectives: Customer requirements analysis, AHJ compliance, as-built documentation, phased site survey (pre/post). Deliverables per CWDP BoK: coverage maps at each design threshold, channel plan diagram, AP placement coordinates (relative to architectural features), PoE budget calculation, regulatory compliance statement. ISO/IEC 27001 environments require security evidence in report.',
        }} className="text-xs text-slate-400 leading-relaxed" />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function Chapter12() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Survey Types');

  useEffect(() => {
    CH12_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch12', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Professional Wi-Fi site survey methodology, tool selection (Ekahau, iBwave, NetSpot), interactive AP placement simulator, heatmap interpretation and post-survey validation." />
        <ModeBadge />
      </div>

      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-band24 text-band24' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Survey Types'       && <SurveyTypesTab />}
          {activeTab === 'Survey Tools'        && <SurveyToolsTab />}
          {activeTab === 'AP Placement'        && <APPlacementTab />}
          {activeTab === 'Heatmap & Analysis'  && <HeatmapTab />}
          {activeTab === 'Validation'          && <ValidationTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
