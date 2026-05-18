import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ChapterHeader } from '../../components/shared/ChapterHeader';
import { ModeBadge, ModeContent } from '../../components/shared/ModeContent';
import { CHAPTERS } from '../../data/curriculum';

const CHAPTER = CHAPTERS.find(c => c.id === 'ch7')!;

const TABS = ['Timeline', 'PHY Standards', 'Amendments'] as const;
type Tab = typeof TABS[number];

// ─── Protocol Data ────────────────────────────────────────────────────────────

interface Protocol {
  id: string;
  name: string;
  alias?: string;
  year: number;
  status: 'Ratified' | 'Deprecated' | 'Active' | 'Upcoming' | 'Incorporated';
  band: string;
  maxRate: string;
  phy: string;
  color: string;
  icon: string;
  keyFeatures: string[];
  kid: string;
  enthusiast: string;
  pro: string;
}

interface Amendment {
  id: string;
  name: string;
  title: string;
  year: number;
  category: 'Security' | 'QoS' | 'Mobility' | 'Spectrum' | 'Mesh' | 'Special';
  color: string;
  icon: string;
  status: 'Active' | 'Incorporated' | 'Deprecated' | 'Upcoming';
  summary: string;
  kid: string;
  enthusiast: string;
  pro: string;
  keyPoints: string[];
}

const PHY_STANDARDS: Protocol[] = [
  {
    id: 'dot11_legacy', name: '802.11', alias: 'Legacy (1997)', year: 1997,
    status: 'Deprecated', band: '2.4 GHz', maxRate: '2 Mbps', phy: 'FHSS / DSSS / IR',
    color: '#64748b', icon: '📻',
    keyFeatures: ['First Wi-Fi standard', 'FHSS or DSSS modulation', '2.4 GHz ISM band', 'Infrared option', 'CSMA/CA MAC', '20 MHz channels'],
    kid: '📻 The very first Wi-Fi! Super slow — only 2 Mbps. Like trying to stream video on a telegraph machine. It used radio waves that hop between channels (FHSS) or spread data wide (DSSS).',
    enthusiast: 'The original 802.11 standard (1997) supported 1 and 2 Mbps using FHSS (Frequency Hopping Spread Spectrum) or DSSS (Direct Sequence Spread Spectrum) in the 2.4 GHz band. Also defined an optional infrared PHY. CSMA/CA MAC layer is still used today.',
    pro: 'IEEE 802.11-1997: FHSS uses 79 × 1 MHz hops at 2.5 hops/sec (regulated). DSSS: 11-chip Barker sequence, DBPSK (1 Mbps) / DQPSK (2 Mbps), 22 MHz occupied BW. CCA threshold: -80 dBm. SIFS=10µs, DIFS=50µs, slot time=20µs. MAC: DCF (CSMA/CA) + optional PCF (polling). First commercial deployments by NCR/AT&T and Symbol Technologies.',
  },
  {
    id: 'dot11b', name: '802.11b', alias: 'Wi-Fi 1', year: 1999,
    status: 'Deprecated', band: '2.4 GHz', maxRate: '11 Mbps', phy: 'HR-DSSS / CCK',
    color: '#94a3b8', icon: '📡',
    keyFeatures: ['11 Mbps max rate', 'HR-DSSS with CCK', 'Backward compat with 802.11 DSSS', '3 non-overlapping channels (1/6/11)', 'Long PPDU preamble (144µs)', '5.5 and 11 Mbps added'],
    kid: '📡 802.11b was the first really popular Wi-Fi! Used in coffee shops and airports around 2000. Maximum 11 Mbps — about the speed of a slow USB stick. The grandfather of modern Wi-Fi!',
    enthusiast: '802.11b (1999) boosted speed to 11 Mbps using CCK (Complementary Code Keying) — a smarter way to encode data into the 2.4 GHz band. This became the first mass-market Wi-Fi standard, found in every laptop and coffee shop by 2002. Only 3 non-overlapping channels (1, 6, 11) cause interference problems in dense areas.',
    pro: 'IEEE 802.11b-1999: HR-DSSS PHY. Data rates: 1 Mbps (DBPSK), 2 Mbps (DQPSK), 5.5 Mbps (CCK-16), 11 Mbps (CCK-256). CCK: 8-chip complex spreading codes, 11 Msps, 22 MHz BW. Two preamble modes: Long (192µs) and Short (96µs). CCA: ED+CS, threshold -76 dBm. Slot time: 20µs. Max TX power: 30 dBm (US). Wi-Fi Alliance began WFA certification in 2000. WEP was the only security option — already broken by 2001.',
  },
  {
    id: 'dot11a', name: '802.11a', alias: 'Wi-Fi 2 (5 GHz)', year: 1999,
    status: 'Deprecated', band: '5 GHz', maxRate: '54 Mbps', phy: 'OFDM (52 subcarriers)',
    color: '#a855f7', icon: '🔮',
    keyFeatures: ['54 Mbps via OFDM', '5 GHz band — less congestion', '52 subcarriers (48 data + 4 pilot)', 'Non-overlapping channels in UNII-1/2/3', 'Short range vs 802.11b', 'BPSK/QPSK/16-QAM/64-QAM'],
    kid: '🔮 802.11a was faster than 802.11b (54 Mbps!) but worked on a different frequency (5 GHz) that doesn\'t travel through walls as well. Like a Ferrari on a short track — fast but limited range.',
    enthusiast: '802.11a (1999) introduced OFDM and moved to 5 GHz — a cleaner spectrum with more non-overlapping channels. 54 Mbps peak rate using 64-QAM. The 5 GHz band was underused at the time, giving excellent performance in enterprises. Cost and shorter range meant slower adoption vs 802.11b.',
    pro: 'IEEE 802.11a-1999: 5 GHz OFDM PHY. 64-point FFT, 52 subcarriers (48 data + 4 pilot), 312.5 kHz subcarrier spacing, 4µs symbol (3.2µs FFT + 0.8µs GI). Rates: 6/9/12/18/24/36/48/54 Mbps (BPSK→QPSK→16-QAM→64-QAM with R=1/2,2/3,3/4). 20 MHz channels in UNII-1 (5.15-5.25), UNII-2 (5.25-5.35), UNII-3 (5.725-5.825). SIFS=16µs, slot=9µs. Max EIRP: 40 mW (US UNII-1), 200 mW (UNII-3). DFS not yet required in original spec.',
  },
  {
    id: 'dot11g', name: '802.11g', alias: 'Wi-Fi 3', year: 2003,
    status: 'Deprecated', band: '2.4 GHz', maxRate: '54 Mbps', phy: 'OFDM + ERP-DSSS/CCK',
    color: '#06b6d4', icon: '🌊',
    keyFeatures: ['54 Mbps OFDM in 2.4 GHz', 'Backward compatible with 802.11b', 'ERP (Extended Rate PHY)', 'Protection mode with 802.11b clients', 'Same 3-channel limit as 802.11b', 'Mixed-mode penalty'],
    kid: '🌊 802.11g combined the best of both worlds — the speed of 802.11a (54 Mbps) but in the 2.4 GHz band that 802.11b used, so old devices still worked. BUT — if even ONE old 802.11b device joins, everyone slows down!',
    enthusiast: '802.11g (2003) brought OFDM to 2.4 GHz, achieving 54 Mbps while remaining backward-compatible with 802.11b. This massive deployment made it the dominant standard from 2003–2009. The catch: when any 802.11b device associates, the AP enables "protection mode" (RTS/CTS or CTS-to-self) which kills 50%+ of throughput.',
    pro: 'IEEE 802.11g-2003: ERP (Extended Rate PHY) PHY. Defines three sub-PHYs: ERP-OFDM (54 Mbps), ERP-DSSS/CCK (11 Mbps, backward compat), ERP-PBCC (optional). ERP-OFDM identical to 802.11a but in 2.4 GHz. Protection mechanism: CTS-to-self or RTS/CTS when HT/ERP-OFDM STAs coexist with non-ERP (802.11b) STAs. ERPInfo IE in beacons signals NonERP_Present bit. Protection adds 44-50µs overhead per frame, reducing throughput from ~22 Mbps effective to ~11 Mbps in mixed mode. Slot time: 9µs (short) or 20µs (long/non-ERP).',
  },
  {
    id: 'dot11n', name: '802.11n', alias: 'Wi-Fi 4', year: 2009,
    status: 'Active', band: '2.4 / 5 GHz', maxRate: '600 Mbps', phy: 'HT-OFDM (MIMO)',
    color: '#38bdf8', icon: '📶',
    keyFeatures: ['MIMO — up to 4×4 spatial streams', '40 MHz channel bonding', 'A-MPDU & A-MSDU aggregation', 'Short Guard Interval (400ns)', 'Block ACK (64 A-MPDU)', 'STBC & Transmit Beamforming'],
    kid: '📶 Wi-Fi 4 (802.11n) was revolutionary! It used MULTIPLE antennas (MIMO) to send several data streams at the same time — like adding extra lanes on a highway. Speed jumped to 600 Mbps!',
    enthusiast: '802.11n (2009) introduced MIMO (Multiple-Input Multiple-Output) — using multiple antennas to transmit several data streams simultaneously. Channel bonding (40 MHz) doubled bandwidth. Frame aggregation (A-MPDU) slashed overhead. These innovations together boosted real-world throughput 10× over 802.11g.',
    pro: 'IEEE 802.11n-2009 (HT = High Throughput): 256-point FFT (40 MHz), 56 data subcarriers per 20 MHz. MCS 0-76 for up to 4 spatial streams. MCS32 (BPSK, 1 stream, 40 MHz): 6 Mbps. MCS31 (64-QAM 5/6, 4×4): 300 Mbps per 20 MHz. 40 MHz: 600 Mbps. GI: 800ns (normal) / 400ns (short, +11% throughput). A-MPDU: max 64 KB (64 sub-frames). Block ACK: compressed BA with 64-bit bitmap. STBC adds diversity gain. LDPC optional FEC. HT-SIG preamble field: 2 symbols. SMPS (Spatial Multiplexing Power Save). Greenfield mode (no legacy protection) vs Mixed mode. TxBF via NDP/compressed BF report.',
  },
  {
    id: 'dot11ac', name: '802.11ac', alias: 'Wi-Fi 5', year: 2013,
    status: 'Active', band: '5 GHz only', maxRate: '3.5 Gbps (Wave 1) / 6.9 Gbps (Wave 2)', phy: 'VHT-OFDM',
    color: '#a855f7', icon: '🚀',
    keyFeatures: ['160 MHz channel bonding', '256-QAM modulation', 'DL MU-MIMO (4 streams)', 'Up to 8 spatial streams', 'Beamforming mandatory', '5 GHz only (no 2.4 GHz)'],
    kid: '🚀 Wi-Fi 5 was like upgrading from a 4-lane highway to an 8-lane superhighway! 256-QAM packs twice the data into each signal compared to 802.11n. The router could now beam signals directly at YOUR device — like a spotlight instead of a floodlight!',
    enthusiast: '802.11ac (Wi-Fi 5, 2013) moved exclusively to 5 GHz and introduced 256-QAM for higher spectral efficiency. Wave 1 added 80 MHz bonding; Wave 2 added 160 MHz and DL MU-MIMO (serve up to 4 clients simultaneously). The beamforming protocol became standardized, enabling targeted signal delivery.',
    pro: 'IEEE 802.11ac-2013 (VHT = Very High Throughput): 5 GHz only. Channel widths: 80, 80+80, 160 MHz. 64-point FFT per 20 MHz sub-channel. MCS 0-9 for up to 8 spatial streams. MCS9 80 MHz 8SS: 3.47 Gbps. 256-QAM (8 bpcs): requires SNR ≥ 30 dB. DL MU-MIMO: AP transmits to up to 4 STAs simultaneously via Null Data Packet sounding (NDPA→NDP), compressed BF feedback (V matrix), zero-forcing beamforming. VHT-SIG-A (2 sym) + VHT-SIG-B (1 sym) preamble. A-MPDU max 1MB. AMSDU max 11.4 KB. UL MU-MIMO not defined (added in 802.11ax). Preamble length: 32µs (SIFS → 20µs → VHT-SIG-B). TXOP durations extended.',
  },
  {
    id: 'dot11ax', name: '802.11ax', alias: 'Wi-Fi 6 / Wi-Fi 6E', year: 2021,
    status: 'Active', band: '2.4 / 5 / 6 GHz', maxRate: '9.6 Gbps', phy: 'HE-OFDMA',
    color: '#10b981', icon: '⚡',
    keyFeatures: ['OFDMA — multi-user per transmission', 'UL + DL MU-MIMO (8×8)', 'BSS Coloring (6-bit)', 'Target Wake Time (TWT)', '1024-QAM (Wi-Fi 6) / 4096-QAM', '6 GHz band (Wi-Fi 6E, 1200 MHz)'],
    kid: '⚡ Wi-Fi 6 was the first Wi-Fi to serve MANY devices at the same EXACT moment! Before, 10 devices would take turns. Now all 10 get data simultaneously! Perfect for smart homes and crowded stadiums.',
    enthusiast: 'Wi-Fi 6 (802.11ax, 2021) shifted focus from speed to efficiency. OFDMA (like cellular LTE) lets the AP split a single transmission into mini-slots for different users. BSS Coloring reduces unnecessary deferrals in dense environments. TWT lets IoT devices sleep precisely, saving 67% battery. Wi-Fi 6E extended this to the massive 6 GHz band.',
    pro: 'IEEE 802.11ax-2021 (HE = High Efficiency): 2048-FFT (80 MHz), 4× narrower subcarriers (78.125 kHz) vs 802.11ac. GI options: 0.8/1.6/3.2µs. RU sizes: 26/52/106/242/484/996 tones. MCS 0-11 (1024-QAM at MCS10/11). HE-MU PPDU: HE-SIG-A (2sym) + HE-SIG-B (variable) + HE-STF + HE-LTF + Data. Trigger Frame: AP allocates UL OFDMA RUs and MCS targets per STA. BSS Color: 6-bit field in HE-SIG-A, OBSS/PD adaptive threshold. TWT: individual or broadcast agreements, Restricted TWT (R-TWT) for latency-sensitive traffic. Spatial Reuse: OBSS/PD-based CCA adjustment. Wi-Fi 6E: 5.925–7.125 GHz, 1200 MHz, 59 × 20 MHz channels. PMF mandatory. WPA3 required for 6 GHz. 4096-QAM (MCS12/13) added in Wi-Fi 6 revision (Mandatory for Wi-Fi 7).',
  },
  {
    id: 'dot11be', name: '802.11be', alias: 'Wi-Fi 7', year: 2024,
    status: 'Ratified', band: '2.4 / 5 / 6 GHz (MLO)', maxRate: '46 Gbps', phy: 'EHT-OFDMA',
    color: '#f59e0b', icon: '🔥',
    keyFeatures: ['MLO — simultaneous multi-band', '320 MHz channels (6 GHz)', '4096-QAM (12 bits/symbol)', 'Preamble Puncturing', 'Multi-AP Coordination', '16 spatial streams'],
    kid: '🔥 Wi-Fi 7 is like having 3 superhighways running at the same time for your device! Your phone uses 2.4, 5, and 6 GHz all at once (MLO). If one road has traffic, data instantly moves to another. Speed: up to 46 Gbps!',
    enthusiast: 'Wi-Fi 7 (802.11be, 2024) introduces MLO — your device maintains active connections on all three bands simultaneously and the AP picks the best path for each packet. 320 MHz channels in 6 GHz and 4096-QAM squeeze out every last bit. Preamble Puncturing lets APs "skip" busy 20 MHz sub-channels in a wide bond without losing the whole channel.',
    pro: 'IEEE 802.11be-2024 (EHT = Extremely High Throughput): 16 spatial streams. 4096-QAM (MCS12/13): 12 bpcs, requires SNR ≥ 43 dB. 320 MHz BW (6 GHz only): 8192-FFT, 3920 data subcarriers. MLO modes: STR (Simultaneous TX/RX on different links), NSTR (non-simultaneous). AP MLD / non-AP MLD: common MAC address, per-link BSSID. TID-to-Link Mapping: traffic steering per application class. Preamble Puncturing: puncture bitmap in EHT-SIG allows disabling occupied 20 MHz chunks within 80/160/320 MHz bond. Multi-AP Coordination: CSMA/CA-based (r-TWT, TDMA) or distributed spatial reuse. Emergency Preparedness Communications (EPC). TSN (Time-Sensitive Networking) support via Triggered TXOP Sharing.',
  },
  {
    id: 'dot11bn', name: '802.11bn', alias: 'Wi-Fi 8 (upcoming)', year: 2028,
    status: 'Upcoming', band: '2.4 / 5 / 6 GHz', maxRate: '100+ Gbps (target)', phy: 'UHR (Ultra High Reliability)',
    color: '#ef4444', icon: '🌌',
    keyFeatures: ['Ultra High Reliability (UHR)', 'Coordinated multi-AP OFDMA', 'Distributed MIMO across APs', 'Sub-1ms latency target', 'AI/ML-driven resource management', 'Coexistence with Wi-Fi 7'],
    kid: '🌌 Wi-Fi 8 is the FUTURE! Scientists are designing it now (still years away). The goal: super-reliable Wi-Fi that works perfectly even in crowded places — like a VIP lane for your data that never gets blocked, even in a packed stadium!',
    enthusiast: 'Wi-Fi 8 (802.11bn, expected ~2028) is being designed for Ultra High Reliability — the ability to guarantee delivery in dense, interference-heavy environments. Key ideas: coordinated multi-AP transmissions (like cellular coordination), AI-driven spectrum management, and sub-millisecond latency for real-time industrial applications.',
    pro: 'IEEE 802.11bn (TIG-UHR, study group formed 2020): Target requirements — 100 Gbps aggregate throughput, <1ms latency, >5× improvement in reliability vs 802.11be. Key technical proposals: Joint Transmission (JT) CoMP across AP MLDs (Coordinated Multi-Point), Distributed MIMO via synchronized AP clusters, AI/ML channel prediction for proactive scheduling, coordinated OFDMA resource allocation across co-located APs, enhanced TSN for industry 4.0 applications. 802.11bn is expected to address limitations of 802.11be in ultra-dense deployments (>100 APs/1000m²). Study group ballot expected 2025, draft ratification target 2027-2028.',
  },
];

const AMENDMENTS: Amendment[] = [
  {
    id: 'dot11d', name: '802.11d', title: 'Regulatory Domain Extensions', year: 2001,
    category: 'Spectrum', color: '#f59e0b', icon: '🌍', status: 'Incorporated',
    summary: 'Allows APs to advertise country-specific regulatory constraints (allowed channels, max TX power) so devices can auto-configure for each country.',
    kid: '🌍 802.11d made Wi-Fi globally smart! Before it, a Wi-Fi device from the US might use channels that are ILLEGAL in Japan. With 802.11d, the router tells your device "Hey, you\'re in Japan — here are the allowed channels!"',
    enthusiast: '802.11d lets APs broadcast a "Country IE" containing the 3-letter country code, allowed channels, and max transmit power per channel. Devices use this to self-configure for local regulations. Critical for devices that travel internationally.',
    pro: 'IEEE 802.11d-2001: Defines the Country Element (IE 7): 3-char ISO 3166 country code + triplet sets (first channel, num channels, max power dBm). Channel/power constraints differ significantly: ETSI allows channels 1-13 at 20 dBm; FCC limits to 1-11 at 30 dBm EIRP; MKK (Japan) uses ch14 for 802.11b. STAs must parse Country IE and adjust to the most restrictive intersection of supported/regulatory channels. Incorporated into 802.11-2007 base standard. DFS (from 802.11h) complements 802.11d for 5 GHz.',
    keyPoints: ['Country IE (3-char code + channel/power triplets)', 'Auto-configure TX power per region', 'Channel restriction enforcement', 'Incorporated into 802.11-2007', 'Works with 802.11h for 5 GHz'],
  },
  {
    id: 'dot11e', name: '802.11e', title: 'QoS — WMM / EDCA', year: 2005,
    category: 'QoS', color: '#06b6d4', icon: '🎵', status: 'Incorporated',
    summary: 'Adds Quality of Service to Wi-Fi — prioritizing voice/video over bulk data using four access categories and TXOP burst windows.',
    kid: '🎵 Before 802.11e, Wi-Fi treated a Zoom call and a file download exactly the same. 802.11e created a VIP lane! Your video call gets priority access so it\'s smooth, while file downloads wait their turn.',
    enthusiast: '802.11e introduced EDCA (Enhanced Distributed Channel Access) — four traffic classes each with different backoff parameters. Voice (AC_VO) uses tiny backoff windows and short TXOP, data (AC_BE) waits longer. This made real-time voice/video reliable over Wi-Fi for the first time. Wi-Fi Multimedia (WMM) is the WFA certification for 802.11e interoperability.',
    pro: 'IEEE 802.11e-2005: EDCA replaces DCF. Four Access Categories: AC_VO (voice, AIFSN=2, CWmin=3, TXOP=1.504ms), AC_VI (video, AIFSN=2, CWmin=7, TXOP=3.008ms), AC_BE (best-effort, AIFSN=3, CWmin=15, TXOP=0), AC_BK (background, AIFSN=7, CWmin=15, TXOP=0). AIFS = SIFS + AIFSN × slot_time. AP can grant TXOP via HCF-CP (HCCA). A-MSDU aggregation defined here. EDCA parameter set in Beacon/Probe Response. 802.11p, 802.11r, 802.11ax all depend on 802.11e QoS. WMM = WFA name for 802.11e subset.',
    keyPoints: ['4 Access Categories (VO/VI/BE/BK)', 'EDCA replaces DCF', 'TXOP — burst transmission window', 'WMM = WFA certification subset', 'AIFSN controls access priority'],
  },
  {
    id: 'dot11h', name: '802.11h', title: 'DFS & TPC for 5 GHz', year: 2003,
    category: 'Spectrum', color: '#8b5cf6', icon: '📡', status: 'Incorporated',
    summary: 'Requires 5 GHz Wi-Fi devices to detect and avoid radar signals (DFS) and reduce transmit power dynamically (TPC) to coexist with licensed radar users.',
    kid: '📡 Airplanes and weather stations use 5 GHz radar. 802.11h forces Wi-Fi to LISTEN before it talks on certain channels — if radar is detected, the Wi-Fi router immediately switches channels so it doesn\'t interfere with critical systems!',
    enthusiast: 'DFS (Dynamic Frequency Selection): the AP monitors the channel for 60 seconds before transmitting, then switches away within 10 seconds if radar is detected. TPC (Transmit Power Control): APs reduce power to minimize interference with radar. Both are mandatory in most countries for UNII-2/2e channels.',
    pro: 'IEEE 802.11h-2003 (incorporated into 802.11-2007): DFS — Radar pulse detection: AP monitors for >3840 pulses/second at correct PRF before channel availability. Channel switching: Channel Switch Announcement IE broadcast 5 beacons before switch. STA passive scan channels until AP declares DFS clear. CAC (Channel Availability Check): 60s min monitoring before first use. ISM Quiet period after radar. TPC — Power Constraint IE, TPC Request/Response action frames. Regulatory compliance: FCC 15.407 (US), ETSI EN 301 893 (EU). UNII-2 (5.25-5.35 GHz) and UNII-2e (5.47-5.725 GHz) require DFS. UNII-1 (5.15-5.25 GHz) exempt in US.',
    keyPoints: ['DFS — 60s radar scan before TX', 'TPC — reduce power when near radar', 'Mandatory for UNII-2/2e (5 GHz)', 'Channel Switch Announcement IE', 'CAC period before each DFS channel use'],
  },
  {
    id: 'dot11i', name: '802.11i', title: 'RSN Security / WPA2', year: 2004,
    category: 'Security', color: '#ef4444', icon: '🔐', status: 'Incorporated',
    summary: 'Defines the Robust Security Network (RSN) — replacing broken WEP with AES-CCMP encryption, the 4-Way Handshake for key derivation, and 802.1X enterprise authentication.',
    kid: '🔐 802.11i was the Wi-Fi security revolution! The old lock (WEP) was cracked in 60 seconds. 802.11i created an unbreakable lock (WPA2/AES) where your password is NEVER sent over the air — only a clever proof that you know it!',
    enthusiast: '802.11i (2004) created WPA2 — the security standard most networks still use today. It replaced RC4/WEP with AES-CCMP (128-bit), introduced the 4-Way Handshake that lets both sides derive encryption keys without sending them over the air, and enabled 802.1X enterprise authentication with RADIUS servers.',
    pro: 'IEEE 802.11i-2004 (RSN = Robust Security Network): Defines: CCMP (AES-128 CCM mode, Counter+CBC-MAC, 8B MIC, 8B PN), TKIP (transitional, deprecated 2012). 4-Way Handshake: PMK → PTK derivation via PRF-512(PMK, "Pairwise key expansion", AA||SPA||ANonce||SNonce). GTK distributed in Message 3 (KEK-encrypted). RSNA IE (previously RSN IE): version, group cipher, pairwise ciphers, AKM suites (PSK=2, 802.1X=1). PMKSA caching. Pre-authentication for fast roaming (superceded by 802.11r). 802.1X port-based access control: EAP methods (PEAP/MSCHAPv2, EAP-TLS, EAP-TTLS). KRACK (2017) vulnerability: nonce reuse via retransmission — patched in OS updates. Incorporated into 802.11-2007 base standard.',
    keyPoints: ['AES-CCMP replaces WEP/RC4', '4-Way Handshake key derivation', '802.1X enterprise authentication', 'RSN IE in beacons/probe responses', 'PMKSA caching for roaming'],
  },
  {
    id: 'dot11k', name: '802.11k', title: 'Radio Resource Measurement', year: 2008,
    category: 'Mobility', color: '#10b981', icon: '📊', status: 'Incorporated',
    summary: 'Gives clients visibility into the RF environment — clients can request and share neighbor AP reports, channel load, and signal strength measurements to enable intelligent roaming decisions.',
    kid: '📊 802.11k gives your phone a Wi-Fi map! Instead of wandering blindly looking for a better AP, your device asks the current AP "which other APs are nearby and how strong are they?" — then picks the best one to roam to!',
    enthusiast: '802.11k allows an AP to provide its client with a list of neighboring APs (Neighbor Report), their signal strength, and channel occupancy. This means when your phone decides to roam, it already knows exactly where to go — no blind scanning required. Works together with 802.11r (fast roam) and 802.11v (AP steering).',
    pro: 'IEEE 802.11k-2008: Radio Measurement Request/Report action frames. Key measurements: Beacon Report (active/passive/table scan — AP RSSI, RCPI, RSNI per neighbor), Channel Load Report (CCA busy ratio), Noise Histogram, Frame Report, STA Statistics, Link Measurement. Neighbor Report: BSSID, BSSID Info (capability bits, mobility domain bit for 802.11r, HT/VHT caps), Operating Class, Channel Number, PHY type. Mobility Domain IE in Beacon signals 802.11r support. BTM (BSS Transition Management, 802.11v) uses Neighbor Report data for AP steering. 802.11k support is mandatory in WPA3 for 6 GHz.',
    keyPoints: ['Neighbor Report — AP list with RSSI', 'Channel Load Report', 'Beacon Measurement Request', 'Works with 802.11r/v for roaming suite', 'Mandatory in WPA3/Wi-Fi 6E'],
  },
  {
    id: 'dot11r', name: '802.11r', title: 'Fast BSS Transition (FT)', year: 2008,
    category: 'Mobility', color: '#f59e0b', icon: '⚡', status: 'Incorporated',
    summary: 'Reduces roaming handoff time from 200-400ms to <50ms by pre-authenticating with the target AP before disconnecting from the current one — essential for VoIP and video calls.',
    kid: '⚡ 802.11r is like a relay race baton pass — your phone hands the Wi-Fi connection to the next router while still talking to the old one, instead of stopping, dropping the call, and reconnecting. Voice calls stay smooth!',
    enthusiast: '802.11r cuts roaming time from 200-400ms (which drops VoIP calls) down to <50ms. The key trick: your device pre-negotiates security keys with the target AP (via the current AP) BEFORE disconnecting. When it switches, there\'s no need to redo the full 4-Way Handshake — just a 2-frame FT handshake.',
    pro: 'IEEE 802.11r-2008 (FT = Fast BSS Transition): Key hierarchy: R0KH (R0 key holder, usually RADIUS/AAA) derives PMK-R0 → R1KH (AP/controller) derives PMK-R1 → PMK-R1/STA → PTK. PMK-R1 pre-provisioned to target AP via DS (distribution system) or over-the-air. FT auth exchange (over-the-air): STA→Target AP: FT Auth Req (SNonce + RSNE + MDIE + FTIE); Target AP→STA: FT Auth Resp (ANonce + PMKR1Name + GTK). FT reassociation: 2 frames vs full 4-Way+EAPOL = <50ms handoff. MDIE (Mobility Domain IE): identifies FT domain, FT Capability bits. Over-DS variant: STA requests via current AP — avoids over-the-air. Requires 802.11k for Neighbor Reports. Compatible with PMF (802.11w). WPA3 compliance requires 802.11r support.',
    keyPoints: ['PMK-R0/R1 key hierarchy', 'Pre-auth before disconnect', '<50ms handoff vs 200-400ms without', 'Over-air or over-DS variants', 'Required for seamless VoIP roaming'],
  },
  {
    id: 'dot11s', name: '802.11s', title: 'Wi-Fi Mesh Networking', year: 2011,
    category: 'Mesh', color: '#8b5cf6', icon: '🕸️', status: 'Incorporated',
    summary: 'Defines an 802.11-native mesh — APs form self-healing, self-configuring mesh backhaul using HWMP (Hybrid Wireless Mesh Protocol) routing, enabling whole-home Wi-Fi systems.',
    kid: '🕸️ 802.11s is how whole-home Wi-Fi systems (like Google Nest or Eero) work! Multiple routers form a web — if one goes down, data automatically finds another path. No single point of failure!',
    enthusiast: '802.11s allows APs to wirelessly backhaul traffic to each other, forming a mesh where each AP is also a router. HWMP (Hybrid Wireless Mesh Protocol) combines on-demand routing (like AODV) with proactive tree-based routing. Used in commercial mesh systems like Google Wifi, Eero, and Ubiquiti.',
    pro: 'IEEE 802.11s-2011: Mesh Profile, Mesh Point (MP), Mesh AP (MAP), Mesh Gate (MG). HWMP routing: RREQ/RREP/RERR/RANN messages in Mesh Action frames. Proactive RANN (Root Announcement) from Mesh Gate + reactive PREQ on demand. Path selection metric: AIRTIME (bandwidth/load aware). 6-address MAC frame: RA, TA, DA, SA + Mesh Address Extension (4/6 address frames). Congestion Control: gate announcement + STA association steering. Security: AMPE (Authenticated Mesh Peering Exchange) based on SAE for mesh link authentication. Mesh Peering Management (MPM) protocol: Open/Confirm/Close FSM. Frame delivery: STA→MAP→MP→MG→DS. Implemented in Linux mac80211 (open80211s).',
    keyPoints: ['HWMP mesh routing protocol', 'Self-healing path selection', '6-address frame format', 'AMPE for secure mesh peering', 'Used in commercial mesh systems'],
  },
  {
    id: 'dot11u', name: '802.11u', title: 'Hotspot 2.0 / Passpoint', year: 2011,
    category: 'Mobility', color: '#06b6d4', icon: '🏨', status: 'Incorporated',
    summary: 'Enables automatic, seamless Wi-Fi access in public hotspots — your phone discovers, authenticates, and connects to carrier-grade Wi-Fi automatically without manual login.',
    kid: '🏨 802.11u is why your phone can automatically connect to carrier Wi-Fi in airports — no login page! Your phone and the hotspot talk behind the scenes to verify your phone plan, then connect securely without you doing anything.',
    enthusiast: '802.11u (Interworking with External Networks) defines how a device can query an AP\'s capabilities before associating — checking if the hotspot accepts your carrier credentials. This powers Passpoint (Hotspot 2.0 certification), allowing seamless handoff between cellular and Wi-Fi networks, like cellular offload at airports.',
    pro: 'IEEE 802.11u-2011: Interworking Element (IE 107): ANT (Access Network Type: 0=private, 1=guest, 4=carrier, 5=public), Internet bit, ASRA/ESR/UESA bits, Venue Info, HESSID. ANQP (Access Network Query Protocol): GAS (Generic Advertisement Service) frames — GAS Initial Request/Response. ANQP elements: Network Auth Type, Roaming Consortium, NAI Realm, 3GPP Cell Network, Domain Name. Hotspot 2.0 (HS2.0) Release 1-3: adds HS2.0 Indication IE, OSU (Online Sign-Up) for auto-provisioning. EAP-SIM/AKA/AKA\' for SIM-based authentication. HS2.0R3: identity federation, PKCE for OAuth. OpenRoaming alliance (ANQP-based) enables global roaming. Venue Name/URL, Operator Friendly Name IEs.',
    keyPoints: ['ANQP pre-association query', 'Carrier credential auto-auth', 'GAS protocol for network discovery', 'Passpoint/HS2.0 builds on 802.11u', 'EAP-SIM/AKA for SIM authentication'],
  },
  {
    id: 'dot11v', name: '802.11v', title: 'Wireless Network Management', year: 2011,
    category: 'Mobility', color: '#a855f7', icon: '🎯', status: 'Incorporated',
    summary: 'Adds AP-driven network management features — BSS Transition Management (AP can request/recommend a client roam to another AP), sleep scheduling, and proxy ARP offload.',
    kid: '🎯 802.11v gives the AP the ability to say "Hey phone, you\'re using a weak signal — please go connect to the AP around the corner, it\'s much better for you!" The AP gently steers devices to the best AP in the building.',
    enthusiast: '802.11v\'s most-used feature is BSS Transition Management (BTM): the AP can send your device a "suggestion" to roam, with a prioritized list of candidate APs. Your device can accept or reject it. This lets network controllers load-balance across APs and force sticky clients off congested APs. Also adds proxy ARP (AP responds to ARP for sleeping clients) to reduce broadcast overhead.',
    pro: 'IEEE 802.11v-2011: BTM (BSS Transition Management) Request/Response action frames. BTM Request: Preferred Candidate List (neighbor APs with BSSID, preference score, BSS Transition Candidate Entry), Disassociation Imminent bit (hard steering), Abridged bit (minimal info), BSS Termination Included. BTM Response: 0=Accept, 1=Reject (reason code), Target BSSID. WNM-Sleep Mode: extended sleep negotiation for power save. Proxy ARP: AP responds to ARP for associated STAs (reduces broadcast domain). TFS (Traffic Filtering Service): STA can delegate packet filtering to AP during sleep. WNM Notification: RSNA logging, vendor-specific. 802.11v + 802.11k + 802.11r = "WFA Voice-Enterprise" roaming suite. Mandatory in Wi-Fi 6 CERTIFIED.',
    keyPoints: ['BTM — AP requests client roam', 'Preferred candidate list', 'Load balancing across APs', 'Proxy ARP for sleeping clients', 'Part of 802.11k/v/r roaming suite'],
  },
  {
    id: 'dot11w', name: '802.11w', title: 'Protected Management Frames', year: 2009,
    category: 'Security', color: '#ef4444', icon: '🛡️', status: 'Incorporated',
    summary: 'Encrypts and integrity-protects management frames (Deauth, Disassoc, Action) preventing denial-of-service attacks that forged management frames to kick devices off networks.',
    kid: '🛡️ Before 802.11w, a hacker could send a fake "Goodbye!" message to kick you off Wi-Fi — like someone writing a fake eviction notice with your landlord\'s name. 802.11w signs all disconnection messages so only the real AP can kick you off!',
    enthusiast: '802.11w protects the most dangerous Wi-Fi attack: forged Deauthentication frames. Previously, anyone could send a fake "you\'re disconnected" message (Deauth) to any client. 802.11w adds cryptographic signatures to management frames so clients can verify the message is real. Mandatory for WPA3 and Wi-Fi 6E.',
    pro: 'IEEE 802.11w-2009 (PMF = Protected Management Frames): SA Query procedure: STA/AP can challenge if a disconnect was legitimate. Protection required for: Deauthentication, Disassociation, Action frames (except Spectrum Management). CCMP-protected unicast management: MIC in MMPDU (Management MIC IE for group). IGTK (Integrity Group Temporal Key): BIP (Broadcast Integrity Protocol, AES-128-CMAC, 8B MIC) for broadcast/multicast management. RSN Capabilities: Management Frame Protection Required (MFPR) bit 7, MFPC bit 6. RSNE negotiation: both sides must indicate PMF capability. SA Query with 6-byte random token. PMF Required = prevents downgrade to no-PMF. Mandatory in WPA3-Personal and WPA3-Enterprise. Mitigates Evil-Twin AP attacks. 802.11r FT+PMF interaction: FT protocol changes for IGTK distribution.',
    keyPoints: ['Protects Deauth/Disassoc frames', 'BIP for broadcast management', 'IGTK — integrity group temporal key', 'SA Query for disconnect validation', 'Mandatory in WPA3'],
  },
  {
    id: 'dot11p', name: '802.11p', title: 'V2X — Vehicular / WAVE', year: 2010,
    category: 'Special', color: '#f59e0b', icon: '🚗', status: 'Active',
    summary: 'Adapts 802.11a for vehicle-to-vehicle (V2V) and vehicle-to-infrastructure (V2I) communication at highway speeds — enabling collision warnings, traffic signal coordination, and autonomous driving assistance.',
    kid: '🚗 802.11p makes cars talk to each other! "I\'m braking!" "There\'s ice ahead!" Cars share safety alerts 10 times per second without needing to stop and connect to a router. Used in smart traffic lights and crash-avoidance systems.',
    enthusiast: '802.11p (DSRC — Dedicated Short-Range Communications) operates in the 5.850-5.925 GHz band and uses a modified version of 802.11a that works without the traditional association process. Messages broadcast at 10 Hz to all nearby vehicles. Being evaluated vs cellular C-V2X (LTE/5G). Slower but better latency for safety-critical proximity alerts.',
    pro: 'IEEE 802.11p-2010 / WAVE (Wireless Access in Vehicular Environments, IEEE 1609): 5.850-5.925 GHz (75 MHz, 7 × 10 MHz channels). PHY: OFDM based on 802.11a but 10 MHz channels (8µs symbol, 52 subcarriers, half-clocked). Rates: 3/4.5/6/9/12/18/24/27 Mbps. OCB (Outside the Context of a BSS): no association/authentication required. Basic Safety Message (BSM/CAM) at 100ms intervals: position, speed, heading, brake status. WSMP (WAVE Short Message Protocol, IEEE 1609.3). IEEE 1609.4: channel coordination (CCH/SCH, 50ms guard). Security: IEEE 1609.2 — ECDSA-256 certificates, CRL for revocation. Range: 300m–1km. Latency: <10ms. Competing with C-V2X (LTE-PC5/5G NR-V2X). US DOT mandated, then reversed DSRC mandate (2020). EU retains DSRC/ITS-G5 alongside C-V2X.',
    keyPoints: ['5.9 GHz DSRC band (75 MHz)', 'No association required (OCB mode)', 'Basic Safety Message at 10 Hz', 'V2V and V2I communication', 'Competes with cellular C-V2X (5G NR)'],
  },
  {
    id: 'dot11ad', name: '802.11ad', title: 'WiGig — 60 GHz (Gen 1)', year: 2012,
    category: 'Special', color: '#06b6d4', icon: '⚡', status: 'Active',
    summary: 'Uses the 60 GHz band for multi-gigabit wireless — up to 7 Gbps for short-range, line-of-sight connections like wireless docking stations and cable replacement within a room.',
    kid: '⚡ 802.11ad is Wi-Fi on steroids — up to 7 Gbps speed! The catch: 60 GHz signals are blocked by almost everything, even your own hand! It only works within the same room, line-of-sight. Perfect for wireless docking stations on your desk.',
    enthusiast: '802.11ad (WiGig) uses 60 GHz millimeter waves with enormous bandwidth — each channel is 2.16 GHz wide! But 60 GHz has terrible wall penetration (>30 dB) and even oxygen absorbs it (~15 dB/km). It\'s ideal for ultra-high-speed in-room transfers: docking stations, wireless VR, cable-free 4K display connections.',
    pro: 'IEEE 802.11ad-2012: 57.24-70.20 GHz band (varies by region), 2.16 GHz channels (channels 1-4). DMG (Directional Multi-Gigabit) PHY: SC (Single Carrier) and OFDM modes. SC modes: MCS 1 (BPSK, 385 Mbps) to MCS 12 (64-QAM 5/6, 4.620 Gbps). OFDM mode: MCS 13-24, peak 6.757 Gbps. BF (Beamforming): SLS (Sector Level Sweep) + BRP (Beam Refinement Protocol) — critical at 60 GHz due to narrow beam requirement. 60 GHz oxygen absorption: 15 dB/km (negligible <100m). Human body blockage: 20-30 dB. Typical range: 1-10m LOS. Quasi-omni and sector antenna patterns. Association via low-frequency 2.4/5 GHz band (FST — Fast Session Transfer). PBSS (Personal BSS) or infrastructure BSS. DMG OFDM: 512-FFT, 336 data subcarriers.',
    keyPoints: ['60 GHz — 2.16 GHz channels', 'Up to 6.757 Gbps (OFDM)', 'Line-of-sight, in-room only', 'Beamforming mandatory', 'Wireless docking / cable replacement'],
  },
  {
    id: 'dot11ay', name: '802.11ay', title: 'Enhanced WiGig — 60 GHz (Gen 2)', year: 2021,
    category: 'Special', color: '#10b981', icon: '🚀', status: 'Active',
    summary: 'Next-generation 60 GHz Wi-Fi with channel bonding (4 × 2.16 GHz = 8.64 GHz wide), MIMO, and improved beamforming — targeting 100+ Gbps for backhaul, AR/VR, and dense venue deployments.',
    kid: '🚀 802.11ay is the supercharged version of 802.11ad! By bonding 4 channels together and adding multiple antennas, it reaches 100+ Gbps — fast enough to download an entire 4K movie in under 2 seconds! Used for wireless stadium backhaul.',
    enthusiast: '802.11ay bonds up to 4 × 2.16 GHz channels (8.64 GHz total BW) and adds MIMO/MU-MIMO support at 60 GHz using phased-array antennas. This enables 100+ Gbps — targeting wireless fiber replacement, stadium backhaul, ISP last-mile, and low-latency AR/VR applications.',
    pro: 'IEEE 802.11ay-2021: EDMG (Enhanced DMG) PHY. Channel bonding: CB2 (4.32 GHz), CB4 (8.64 GHz). MIMO: up to 4 spatial streams. OFDM MCS: 13-21 for single channel, enhanced for bonded. Peak rate: 20-100+ Gbps depending on streams and bonding. Extended Golay-based sequences for channel estimation. EDMG SU/MU PPDU format. Spatial multiplexing + beamforming combination. Range extension techniques: MIMO diversity, NLoS reflection paths (60 GHz reflects off metal/glass). P2P backhaul: fixed point-to-point links at 100-300m with high-gain antennas. FST (Fast Session Transfer) to/from 2.4/5 GHz. Channel measurement and beam management: CID (Channel Improvement Direction). Applications: 8K video production, wireless ISP backhaul, cloud gaming headsets, factory automation.',
    keyPoints: ['8.64 GHz total bandwidth (CB4)', 'Up to 4 spatial streams', '100+ Gbps peak rate', 'Wireless backhaul / last-mile ISP', 'NLoS operation via reflections'],
  },
];

const CAT_COLORS: Record<string, string> = {
  Security: '#ef4444', QoS: '#06b6d4', Mobility: '#10b981',
  Spectrum: '#f59e0b', Mesh: '#8b5cf6', Special: '#a855f7',
};

const CH7_TAB_SUBTOPICS: Record<Tab, string[]> = {
  'Timeline':      ['dot11_legacy', 'dot11b', 'dot11a', 'dot11g', 'dot11n', 'dot11ac', 'dot11ax', 'dot11be', 'dot11bn'],
  'PHY Standards': ['dot11_legacy', 'dot11b', 'dot11a', 'dot11g', 'dot11n', 'dot11ac', 'dot11ax', 'dot11be', 'dot11bn'],
  'Amendments':    ['dot11d', 'dot11e', 'dot11h', 'dot11i', 'dot11k', 'dot11r', 'dot11s', 'dot11u', 'dot11v', 'dot11w', 'dot11p', 'dot11ad', 'dot11ay'],
};

// ─── Tab 1: Timeline ──────────────────────────────────────────────────────────

function MLOHighway() {
  const [interference, setInterference] = useState<null | '2.4' | '5' | '6'>(null);
  const BANDS = [
    { freq: '2.4 GHz', color: '#06b6d4', speed: '~600 Mbps', cars: 4 },
    { freq: '5 GHz',   color: '#a855f7', speed: '~2.4 Gbps', cars: 8 },
    { freq: '6 GHz',   color: '#10b981', speed: '~5.8 Gbps', cars: 12 },
  ];
  return (
    <div className="glass-panel p-5 border-glow-amber space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-white">Wi-Fi 7 MLO — Multi-Link Operation</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500">Spike interference:</span>
          {BANDS.map(b => (
            <button key={b.freq}
              onClick={() => setInterference(i => i === b.freq.split(' ')[0] ? null : b.freq.split(' ')[0] as '2.4' | '5' | '6')}
              className="px-2 py-1 rounded text-xs font-bold border transition-all"
              style={interference === b.freq.split(' ')[0]
                ? { background: '#ef444430', borderColor: '#ef4444', color: '#ef4444' }
                : { borderColor: b.color + '60', color: b.color, background: b.color + '15' }}>
              ⚡ {b.freq}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {BANDS.map(b => {
          const hasInterference = interference === b.freq.split(' ')[0];
          const active = b.cars - (hasInterference ? Math.floor(b.cars * 0.3) : 0);
          return (
            <div key={b.freq}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: b.color }} />
                <span className="text-xs font-semibold" style={{ color: b.color }}>{b.freq}</span>
                <span className="text-xs text-slate-500">{b.speed}</span>
                {hasInterference && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 font-semibold">
                    ⚠️ Preamble Puncturing active
                  </motion.span>
                )}
              </div>
              <div className="relative h-10 rounded-lg overflow-hidden"
                style={{ background: b.color + '10', border: `1px solid ${b.color}30` }}>
                {(() => {
                  const dur = hasInterference ? 3.5 : 2;
                  return Array.from({ length: active }).map((_, i) => (
                    <motion.div key={`${b.freq}-${i}`}
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-5 rounded flex items-center justify-center text-xs pointer-events-none"
                      style={{ background: b.color + '30', border: `1px solid ${b.color}60`, left: '-8%' }}
                      animate={{ left: ['-8%', '108%'] }}
                      transition={{ duration: dur, delay: i * (dur / active), repeat: Infinity, ease: 'linear', repeatDelay: 0 }}>
                      📦
                    </motion.div>
                  ));
                })()}
                {hasInterference && (
                  <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                    className="absolute right-8 top-0 bottom-0 w-14 rounded flex items-center justify-center"
                    style={{ background: '#ef444425', border: '1px solid #ef444460' }}>
                    <span className="text-xs font-bold text-red-400">PP</span>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ModeContent content={{
        kid: '🚗 Old Wi-Fi: one road, everyone takes turns! Wi-Fi 7 MLO: 3 separate highways at once — if one has a jam, data instantly shifts lanes. 46 Gbps max!',
        enthusiast: 'MLO maintains simultaneous connections on all 3 bands. Traffic is load-balanced. Preamble Puncturing skips busy 20 MHz sub-channels within a wide bond — zero interruption.',
        pro: '802.11be MLO: STR (Simultaneous TX/RX, different links) vs NSTR. AP MLD + non-AP MLD share MAC, per-link BSSID. TID-to-Link Mapping for per-class traffic steering. PP bitmap in EHT-SIG-A.',
      }} className="text-xs text-slate-400 leading-relaxed" />
    </div>
  );
}

function TimelineTab() {
  const { mode } = useApp();
  const ALL_STANDARDS = [
    { name: '802.11',  alias: 'Legacy',  year: 1997, speed: '2 Mbps',    band: '2.4 GHz', color: '#64748b', icon: '📻' },
    { name: '802.11b', alias: 'Wi-Fi 1', year: 1999, speed: '11 Mbps',   band: '2.4 GHz', color: '#94a3b8', icon: '📡' },
    { name: '802.11a', alias: 'Wi-Fi 2', year: 1999, speed: '54 Mbps',   band: '5 GHz',   color: '#a855f7', icon: '🔮' },
    { name: '802.11g', alias: 'Wi-Fi 3', year: 2003, speed: '54 Mbps',   band: '2.4 GHz', color: '#06b6d4', icon: '🌊' },
    { name: '802.11n', alias: 'Wi-Fi 4', year: 2009, speed: '600 Mbps',  band: '2.4/5',   color: '#38bdf8', icon: '📶' },
    { name: '802.11ac',alias: 'Wi-Fi 5', year: 2013, speed: '3.5 Gbps',  band: '5 GHz',   color: '#8b5cf6', icon: '🚀' },
    { name: '802.11ax',alias: 'Wi-Fi 6', year: 2021, speed: '9.6 Gbps',  band: '2.4/5/6', color: '#10b981', icon: '⚡' },
    { name: '802.11be',alias: 'Wi-Fi 7', year: 2024, speed: '46 Gbps',   band: '2.4/5/6', color: '#f59e0b', icon: '🔥' },
    { name: '802.11bn',alias: 'Wi-Fi 8', year: 2028, speed: '100+ Gbps', band: '2.4/5/6', color: '#ef4444', icon: '🌌' },
  ];
  const [selected, setSelected] = useState(ALL_STANDARDS[6]);
  const HIGHLIGHTS: Record<string, string[]> = {
    '802.11':   ['2 Mbps max', 'FHSS / DSSS / IR', '2.4 GHz ISM', 'CSMA/CA MAC'],
    '802.11b':  ['11 Mbps CCK', 'HR-DSSS', 'Channels 1/6/11', 'WEP security (broken)'],
    '802.11a':  ['54 Mbps OFDM', '5 GHz — 23 channels', 'Less congestion', 'UNII-1/2/3 bands'],
    '802.11g':  ['54 Mbps in 2.4 GHz', 'OFDM + ERP', 'b-compat (with penalty)', '3-channel limit'],
    '802.11n':  ['MIMO up to 4×4', '40 MHz bonding', 'A-MPDU aggregation', 'Block ACK'],
    '802.11ac': ['DL MU-MIMO', '80/160 MHz', '256-QAM', '5 GHz only'],
    '802.11ax': ['OFDMA (UL+DL)', '1024-QAM', 'BSS Coloring', 'TWT for IoT', 'Wi-Fi 6E: 6 GHz'],
    '802.11be': ['MLO — all 3 bands', '320 MHz (6 GHz)', '4096-QAM', 'Preamble Puncturing'],
    '802.11bn': ['Coordinated Multi-AP', 'AI-driven scheduling', 'Sub-1ms latency', '~2027 target'],
  };
  const desc: Record<string, Record<string, string>> = {
    '802.11':   { kid: '📻 The very first Wi-Fi — 2 Mbps, slower than a USB 1.0 stick!', enthusiast: 'Original 1997 standard, FHSS/DSSS in 2.4 GHz. Defined the CSMA/CA MAC we still use.', pro: 'FHSS: 79×1 MHz hops at 2.5 hps. DSSS: Barker 11-chip, DBPSK/DQPSK. CCA -80 dBm. SIFS 10µs.' },
    '802.11b':  { kid: '📡 The "boom" Wi-Fi — found in every café by 2002. 11 Mbps with CCK!', enthusiast: 'HR-DSSS/CCK boosted DSSS to 11 Mbps. First mass-market Wi-Fi — WFA certification launched.', pro: 'CCK: 8-chip codes, 11 Msps. Long/Short preamble (192/96µs). Slot 20µs. WEP only.' },
    '802.11a':  { kid: '🔮 Faster (54 Mbps) but shorter range — 5 GHz doesn\'t penetrate walls well.', enthusiast: 'First OFDM Wi-Fi — 52 subcarriers, 54 Mbps. 5 GHz had more clean channels but slower adoption.', pro: '64-FFT, 48 data + 4 pilot subcarriers, 312.5 kHz spacing. MCS: BPSK→64-QAM. SIFS 16µs, slot 9µs.' },
    '802.11g':  { kid: '🌊 54 Mbps in 2.4 GHz but old 802.11b devices slow it to a crawl!', enthusiast: 'ERP-OFDM: 54 Mbps in 2.4 GHz, backwards-compatible with b. Protection mode kills performance.', pro: 'ERP PHY: ERP-OFDM + ERP-DSSS/CCK. Protection: CTS-to-self or RTS/CTS. ERPInfo NonERP_Present bit.' },
    '802.11n':  { kid: '📶 Multiple antennas = multiple data lanes! 600 Mbps — real Wi-Fi era begins.', enthusiast: 'MIMO with 4×4 streams, 40 MHz bonding, A-MPDU — the first "modern" Wi-Fi standard.', pro: 'HT-OFDM, MCS 0-76, 256-FFT (40 MHz), 56 sub-carriers/20 MHz. GI 800/400ns. Block ACK 64-bitmap.' },
    '802.11ac': { kid: '🚀 3.5 Gbps Wi-Fi! The router can now aim signals at YOUR device specifically.', enthusiast: 'VHT: 256-QAM, 80/160 MHz, DL MU-MIMO to 4 clients. First time Wi-Fi exceeded wired FastEthernet.', pro: 'VHT-OFDM, MCS 0-9, 8 streams, NDPA/NDP/compressed BF feedback. A-MPDU 1MB. 5 GHz only.' },
    '802.11ax': { kid: '⚡ Wi-Fi 6: serves 10 devices simultaneously instead of taking turns. Stadium-grade!', enthusiast: 'OFDMA, 1024-QAM, BSS Coloring, TWT for IoT. Wi-Fi 6E adds 1200 MHz of clean 6 GHz spectrum.', pro: 'HE-OFDMA, 2048-FFT, 78.125 kHz sub-carriers, RU 26-996 tones. Trigger Frame for UL OFDMA. PMF mandatory.' },
    '802.11be': { kid: '🔥 Wi-Fi 7: 3 highways (bands) at once! 320 MHz channels. 46 Gbps. Future of Wi-Fi!', enthusiast: 'MLO, 4096-QAM, 320 MHz (6 GHz), Preamble Puncturing. First Wi-Fi to challenge fiber speeds.', pro: 'EHT-OFDMA, 8192-FFT (320 MHz), 4096-QAM MCS12/13. MLO STR/NSTR. TID-to-Link mapping. 16 SS.' },
    '802.11bn': { kid: '🌌 Wi-Fi 8 is still being designed — the goal: make Wi-Fi as reliable as a wire even in crowds.', enthusiast: 'UHR: Coordinated Multi-AP, AI/ML scheduling, sub-ms latency. Expected ~2027. Study group active.', pro: 'TIG-UHR: Joint Transmission CoMP across AP MLDs, Distributed MIMO. TSN-compatible. 100 Gbps target.' },
  };
  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 border-glow-green space-y-4">
        <h3 className="font-bold text-white">IEEE 802.11 Complete Timeline (1997–2028)</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {ALL_STANDARDS.map(s => (
            <button key={s.name} onClick={() => setSelected(s)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all min-w-[86px] text-center ${
                selected.name === s.name ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}
              style={selected.name === s.name ? { borderColor: s.color + '80', background: s.color + '15' } : { borderColor: '#334155' }}>
              <span className="text-xl">{s.icon}</span>
              <p className="text-xs font-bold" style={{ color: s.color }}>{s.alias}</p>
              <p className="text-xs font-mono text-slate-400">{s.name}</p>
              <p className="text-xs text-slate-500">{s.year}</p>
              <p className="text-xs font-semibold text-white">{s.speed}</p>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={selected.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              {[{ l: 'Standard', v: selected.name }, { l: 'Alias', v: selected.alias }, { l: 'Max Rate', v: selected.speed }, { l: 'Band', v: selected.band }, { l: 'Year', v: String(selected.year) }, { l: 'Status', v: selected.year >= 2027 ? 'Upcoming' : 'Ratified' }].map(f => (
                <div key={f.l} className="bg-surface-900/60 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">{f.l}</p>
                  <p className="text-sm font-bold font-mono" style={{ color: selected.color }}>{f.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-surface-900/60 rounded-xl p-4 border" style={{ borderColor: selected.color + '30' }}>
              <p className="text-xs font-bold mb-2" style={{ color: selected.color }}>Key Features</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(HIGHLIGHTS[selected.name] ?? []).map(f => (
                  <span key={f} className="px-2 py-0.5 rounded text-xs font-semibold border"
                    style={{ color: selected.color, borderColor: selected.color + '50', background: selected.color + '12' }}>{f}</span>
                ))}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{(desc[selected.name] ?? {})[mode] ?? ''}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <MLOHighway />
    </div>
  );
}

// ─── Tab 2: PHY Standards Deep Dive ──────────────────────────────────────────

function PHYStandardsTab() {
  const { mode } = useApp();
  const [expanded, setExpanded] = useState<string | null>('dot11ax');

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Click any standard to expand full technical specifications.</p>
      {PHY_STANDARDS.map(p => (
        <motion.div key={p.id} layout className="glass-panel border overflow-hidden"
          style={{ borderColor: expanded === p.id ? p.color + '50' : '#1e293b' }}>
          <button className="w-full p-4 flex items-center gap-4 text-left"
            onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            <span className="text-2xl flex-shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm font-mono" style={{ color: p.color }}>{p.name}</span>
                {p.alias && <span className="text-xs text-slate-400">{p.alias}</span>}
                <span className="px-1.5 py-0.5 rounded text-xs border"
                  style={{ color: p.color, borderColor: p.color + '40', background: p.color + '12' }}>{p.year}</span>
                <span className={`px-1.5 py-0.5 rounded text-xs border ${
                  p.status === 'Deprecated' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                  p.status === 'Upcoming' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                  'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>{p.status}</span>
              </div>
              <div className="flex gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-500">📡 {p.band}</span>
                <span className="text-xs font-semibold" style={{ color: p.color }}>⚡ {p.maxRate}</span>
                <span className="text-xs text-slate-500">🔧 {p.phy}</span>
              </div>
            </div>
            <motion.span animate={{ rotate: expanded === p.id ? 180 : 0 }} className="text-slate-500 flex-shrink-0">▼</motion.span>
          </button>

          <AnimatePresence>
            {expanded === p.id && (
              <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: p.color + '30' }}>
                <div className="flex flex-wrap gap-1.5">
                  {p.keyFeatures.map(f => (
                    <span key={f} className="px-2 py-0.5 rounded-full text-xs border"
                      style={{ color: p.color, borderColor: p.color + '40', background: p.color + '10' }}>{f}</span>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.p key={`${p.id}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-xs text-slate-400 leading-relaxed bg-surface-900/50 rounded-xl p-3">
                    {p[mode]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Tab 3: Amendments ────────────────────────────────────────────────────────

const AMENDMENT_CATEGORIES = ['All', 'Security', 'QoS', 'Mobility', 'Spectrum', 'Mesh', 'Special'] as const;

function AmendmentsTab() {
  const { mode } = useApp();
  const [filter, setFilter] = useState<typeof AMENDMENT_CATEGORIES[number]>('All');
  const [expanded, setExpanded] = useState<string | null>('dot11r');

  const filtered = filter === 'All' ? AMENDMENTS : AMENDMENTS.filter(a => a.category === filter);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {AMENDMENT_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === cat
                ? 'text-white border-white/30 bg-white/10'
                : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
            style={filter === cat && cat !== 'All' ? { borderColor: CAT_COLORS[cat] + '60', background: CAT_COLORS[cat] + '20', color: CAT_COLORS[cat] } : {}}>
            {cat === 'All' ? '📋 All' : cat === 'Security' ? '🔐 Security' : cat === 'QoS' ? '🎵 QoS' : cat === 'Mobility' ? '🔄 Mobility' : cat === 'Spectrum' ? '📻 Spectrum' : cat === 'Mesh' ? '🕸️ Mesh' : '🚗 Special'}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <motion.div key={a.id} layout className="glass-panel border overflow-hidden"
            style={{ borderColor: expanded === a.id ? a.color + '50' : '#1e293b' }}>
            <button className="w-full p-4 flex items-center gap-3 text-left"
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <span className="text-xl flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm font-mono" style={{ color: a.color }}>{a.name}</span>
                  <span className="text-xs text-slate-300 font-semibold">{a.title}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs border"
                    style={{ color: a.color, borderColor: a.color + '40', background: a.color + '12' }}>{a.year}</span>
                  <span className="px-1.5 py-0.5 rounded text-xs border"
                    style={{ color: CAT_COLORS[a.category], borderColor: CAT_COLORS[a.category] + '40', background: CAT_COLORS[a.category] + '12' }}>
                    {a.category}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs border ${
                    a.status === 'Deprecated' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                    a.status === 'Incorporated' ? 'text-slate-400 border-slate-600/30 bg-slate-600/10' :
                    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'}`}>{a.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{a.summary}</p>
              </div>
              <motion.span animate={{ rotate: expanded === a.id ? 180 : 0 }} className="text-slate-500 flex-shrink-0">▼</motion.span>
            </button>

            <AnimatePresence>
              {expanded === a.id && (
                <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: a.color + '30' }}>
                  <div className="flex flex-wrap gap-1.5">
                    {a.keyPoints.map(kp => (
                      <span key={kp} className="px-2 py-0.5 rounded-full text-xs border"
                        style={{ color: a.color, borderColor: a.color + '40', background: a.color + '10' }}>{kp}</span>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p key={`${a.id}-${mode}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-slate-400 leading-relaxed bg-surface-900/50 rounded-xl p-3">
                      {a[mode]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function Chapter7() {
  const { markComplete } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('Timeline');

  useEffect(() => {
    CH7_TAB_SUBTOPICS[activeTab].forEach(id => markComplete('ch7', id));
  }, [activeTab, markComplete]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ChapterHeader chapter={CHAPTER} description="Every IEEE 802.11 protocol from the 1997 original to Wi-Fi 8 — plus all 13 key amendments covering security, QoS, mobility, mesh, and special-purpose extensions." />
        <ModeBadge />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 border-b border-slate-700/50 overflow-x-auto pb-0">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-all ${
              activeTab === tab ? 'border-band6 text-band6' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {tab === 'Timeline' ? '📅 Timeline' : tab === 'PHY Standards' ? '📡 PHY Standards' : '📋 Amendments'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeTab === 'Timeline'      && <TimelineTab />}
          {activeTab === 'PHY Standards' && <PHYStandardsTab />}
          {activeTab === 'Amendments'    && <AmendmentsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
