# Dot11Lab

An interactive, browser-based learning guide covering computer networking fundamentals, IEEE 802.3 Ethernet, and IEEE 802.11 Wi-Fi — from bits on a wire to Wi-Fi 7.

**Live demo:** https://utkarshk24.github.io/wifi-explorer/

Built with React, TypeScript, Tailwind CSS, and Framer Motion. No login. No paywall. Fully open source.

---

## Course Curriculum (20 Chapters)

### Part 1 — Networking Fundamentals

**Chapter 1 · Computer Networks & Devices**
Router, Switch, Hub, Bridge, Gateway, Access Point, Modem — OSI layer mapping, traffic animations, network type scope diagram (PAN / LAN / CAN / MAN / WAN), animated Internet packet-hop journey, Firewall ACL rule simulator, ARP request/reply animation with cache.

**Chapter 2 · OSI Reference Model**
All 7 layers in depth (Physical → Application) with protocol headers, PDU visuals, device lists, and a step-by-step encapsulation/decapsulation animation you can control forward and backward.

**Chapter 3 · TCP/IP Architecture** *(Forouzan-aligned)*
Forouzan 5-layer model vs OSI mapping, per-layer deep dive with real RFC header fields, animated TCP 3-way handshake (SYN → SYN-ACK → ACK → DATA → FIN), TCP state machine, and full HTTP GET data-flow from browser (L5) down to wire (L1).

---

### Part 2 — IEEE 802.3 Ethernet

**Chapter 4 · 802.3 Physical Layer & Signaling**
Copper media (Cat5e/6/6A), NEXT/FEXT/attenuation simulation with frequency and distance sliders; Single-mode vs multi-mode fibre ray animation; Line coding oscilloscope — Manchester, PAM-5 (1 Gbps), PAM-16 (10 Gbps).

**Chapter 5 · 802.3 MAC Sublayer & Framing**
Ethernet II vs 802.3 LLC/SNAP frame anatomy with clickable field inspector; MAC addressing (OUI, unicast/multicast/broadcast); Switch CAM table simulation with 4-port animated learning; CRC-32 FCS simulator with bit-error injection.

**Chapter 6 · 802.3 Medium Access & Collision Domains**
CSMA/CD with live collision and binary exponential backoff simulator; half-duplex hub vs full-duplex switch traffic comparison; 802.3x PAUSE frame flow control with buffer-level animation.

**Chapter 7 · IEEE 802.3 Wired Infrastructure**
Ethernet standards evolution, PoE classes (802.3af/at/bt), VLANs & 802.1Q trunking, STP/RSTP/MSTP, Link Aggregation (LACP), IP addressing & subnetting, DHCP DORA animation, DNS resolution animation, ICMP ping & traceroute.

---

### Part 3 — IEEE 802.11 Wi-Fi

**Chapter 8 · RF Fundamentals** *(CWNA)*
EM spectrum, RF wave properties, signal propagation (RADAR), Free Space Path Loss (Friis formula), Fresnel zones, multipath/fading, link budget, dB/dBm/EIRP/SNR math, 2.4/5/6 GHz channel plans.

**Chapter 9 · Physical Layer (PHY)**
Legacy PHY (FHSS/DSSS/HR-DSSS/ERP), OFDM subcarrier architecture, PPDU formats & preambles, guard intervals, modulation schemes (BPSK → 4096-QAM), MCS index tables (802.11n/ac/ax/be), channel bonding (20 → 320 MHz), STBC.

**Chapter 10 · MAC Layer Mechanics**
DCF & CSMA/CA, IFS timers (SIFS/PIFS/DIFS/AIFS/EIFS), NAV & virtual carrier sense, hidden node problem & RTS/CTS, QoS/WMM/EDCA/TXOP, power save modes (PS-Poll, U-APSD, TWT), A-MSDU & A-MPDU aggregation, Block ACK.

**Chapter 11 · Topology, Architecture & Mobility**
BSS/ESS/IBSS/MBSS service sets, autonomous/controller/cloud WLAN architectures, 802.11 authentication state machine, active vs passive scanning, 802.11k/v/r fast roaming, PMF (802.11w), Hotspot 2.0/Passpoint, 802.11s mesh.

**Chapter 12 · Frame Analysis** *(CWAP)*
MAC frame format, Frame Control field deep dive, all 14 management frame types, control frames, data/QoS-data subtypes, Information Elements catalog, beacon frame anatomy, frame sequence diagrams, power save & TWT frames.

**Chapter 13 · Wireless Security** *(CWSP)*
WLAN threats, WEP/TKIP vulnerabilities, WPA2 4-way & GTK handshake, WPA3-Personal SAE/OWE, 802.1X/EAP (PEAP/TLS/TTLS/FAST/SIM), RADIUS/AAA & PKI, WPA3-Enterprise CNSA Suite-B, WIDS/WIPS rogue AP detection, PMF deauth flood protection.

**Chapter 14 · IEEE 802.11 Protocol Deep Dive**
Every standard from the 1997 original to Wi-Fi 8 (802.11bn), plus all 13 key amendments: 802.11a/b/g/n/ac/ax/be, 802.11d/e/h/i/k/r/s/u/v/w/p/ad/ay.

**Chapter 15 · Antenna Theory & RF Design**
Antenna fundamentals & isotropic model, omnidirectional antennas (dipole/omni), directional antennas (patch/Yagi/sector), radiation patterns & polar diagrams, polarization & diversity, VSWR/return loss/impedance matching, beamforming & phased arrays.

**Chapter 16 · WLAN Design & Site Survey** *(CWDP)*
Site survey types & methodology, 2.4/5/6 GHz channel planning, coverage design & AP cell sizing, capacity planning calculator, regulatory domains/DFS/TPC, AP placement best practices.

**Chapter 17 · Troubleshooting & Analysis** *(CWAP)*
CWAP troubleshooting methodology, spectrum analysis (RSSI/SNR/NF), protocol analysis & PCAP workflow, PHY/MAC performance metrics, common WLAN issues, roaming & connectivity problems, security & rogue device analysis, vendor tools.

**Chapter 18 · Enterprise WLAN Architecture**
802.1X/EAP full authentication flow, EAP methods (TLS/PEAP/TTLS/FAST), WPA3-Enterprise Suite-B 192-bit, CAPWAP, L2/L3 tunneling, VxLAN (RFC 7348), IPSec IKEv2/ESP, VxLAN over IPSec, EoGRE.

**Chapter 19 · Site Survey & RF Planning**
Survey types (Passive/Active/Predictive/APoaS), pre-survey planning, Ekahau AI Pro workflow, iBwave predictive RF planning, NetSpot & free tools, AP placement simulator, heatmap interpretation (RSSI/SNR/Coverage), material attenuation models, post-survey validation.

**Chapter 20 · Network Sandbox**
Design and simulate your own Wi-Fi network topology.

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Deployment | GitHub Pages (GitHub Actions) |

## Run Locally

```bash
git clone https://github.com/utkarshk24/wifi-explorer.git
cd wifi-explorer
npm install
npm run dev
```

## License

MIT
