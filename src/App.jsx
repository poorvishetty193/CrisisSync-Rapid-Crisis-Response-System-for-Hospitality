import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Map as MapIcon, AlertTriangle, Users, MessageSquare, BarChart2, 
  Shield, Bell, Heart, Flame, AlertCircle, Wrench, Eye,
  Search, ChevronDown, Clock, Download, X, Loader2, Navigation,
  Send, Radio, AlertOctagon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// --- COLOR SYSTEM CONSTANTS ---
const COLORS = {
  bgBase: '#080a0f',
  surfacePrimary: '#0e1117',
  surfaceElevated: '#141920',
  surfaceHover: '#1a2130',
  borderDefault: '#1e2840',
  borderEmphasis: '#2a3550',
  accentRed: '#ef4444',
  accentBlue: '#3b82f6',
  textPrimary: '#f1f5f9',
  textSecondary: '#64748b',
  textMuted: '#334155',

  // Semantics
  CRITICAL: { text: '#ef4444', bg: '#1a0808', border: '#7f1d1d' },
  HIGH: { text: '#f97316', bg: '#1a0e08', border: '#3d2212' },
  MEDIUM: { text: '#eab308', bg: '#1a1608', border: '#3d3212' },
  LOW: { text: '#3b82f6', bg: '#08101a', border: '#122140' },
  RESOLVED: { text: '#22c55e', bg: '#081a0e', border: '#14532d' },
  INFO: { text: '#8b5cf6', bg: '#100a1a', border: '#281240' }
};

const ICON_MAP = {
  'Medical Emergency': Heart,
  'Fire Alarm': Flame,
  'Security Threat': Shield,
  'Guest Distress': AlertCircle,
  'Maintenance': Wrench,
  'Suspicious Activity': Eye
};

// --- REAL DISPATCHER MOCK DATA (8 Incidents) ---
const INITIAL_INCIDENTS = [
  {
    id: "INC-2024-0891",
    type: "Medical Emergency",
    floor: 7, room: "714", zone: "Guest Room",
    severity: "critical", status: "ON_SCENE",
    description: "Hskp - rm 714 NR x3. Mgr override used. Gst on bthrm flr, shallow breathing. DND was OFF. EMS notified 14:31.",
    reporter: "Housekeeping - S. Wongprasert",
    responder_id: "s1",
    created_at: "2026-05-07T14:31:07Z",
    source: "Staff Report → Manual",
    elapsed: 852, // 14m 12s
    guest: { name: "Yuki Tanaka", language: "ja", room: "714", checkin: "2026-05-05", nationality: "Japanese", flag: "🇯🇵" },
    timeline: [
      { time: "14:31:07", actor: "S. Wongprasert", type: "human", action: "Incident reported via staff app" },
      { time: "14:31:10", actor: "ARIA", type: "ai", action: "Auto-classified: Medical Emergency CRITICAL" },
      { time: "14:31:11", actor: "System", type: "system", action: "EMS auto-brief initiated via Twilio" },
      { time: "14:31:18", actor: "System", type: "system", action: "J. Chen dispatched — ETA 3 min" },
      { time: "14:35:02", actor: "J. Chen", type: "responder", action: "On scene. Guest conscious, responsive. EMS en route." }
    ],
    ai_triage: {
      classification: "Unconscious Guest — Medical Emergency",
      confidence: 0.97,
      severity: "critical",
      recommended_responders: ["Security Lead", "Certified First Aider"],
      immediate_actions: ["Do not move guest", "Maintain airway", "AED on standby", "Clear corridor F7"],
      escalate_911: true,
      escalation_reason: "Unresponsive guest, shallow breathing",
      guest_message: "Ms. Tanaka, our team is with you. Medical assistance is on the way.",
      staff_broadcast: "ALL STAFF: Medical emergency F7 R714. Keep corridor clear. EMS ETA ~8min.",
      estimated_resolution_minutes: 25,
      reasoning: "Guest found unresponsive by housekeeping. Severity of presentation (shallow breathing, NR) warrants immediate EMS."
    },
    evidence: [
      { type: "CCTV", label: "F7 Corridor Cam 3", time: "14:30:58", confidence: 0.91 },
      { type: "Audio", label: "F7 Corridor Mic", time: "14:31:02", confidence: 0.78 }
    ],
    guest_comms: [
      { sender: "system", text: "Emergency alert received from Room 714. Dispatching assistance now.", time: "14:31:11" },
      { sender: "operator", text: "Ms. Tanaka, our team is on the way to Room 714. You are not alone.", time: "14:31:45" },
      { sender: "guest", text: "すぐに来てください、体が動かない", translated: "Please come quickly, I can't move my body", time: "14:32:10" }
    ]
  },
  {
    id: "INC-2024-0892",
    type: "Fire Alarm",
    floor: 12, room: "1204", zone: "Guest Room",
    severity: "high", status: "DISPATCHED",
    description: "Sm det activated F12 R1204. Gst called F/D - says no smoke visible, poss steam. Unit dispatched to confirm. Gst asked if evac needed.",
    reporter: "IoT Smoke Sensor - 1204-A",
    responder_id: "s2",
    created_at: "2026-05-07T14:42:15Z",
    source: "IoT Sensor",
    elapsed: 192, // 3m 12s
    guest: { name: "John Doe", language: "en", room: "1204", checkin: "2026-05-04", nationality: "American", flag: "🇺🇸" },
    timeline: [
      { time: "14:42:15", actor: "System", type: "system", action: "Smoke detector F12 Room 1204 activated" },
      { time: "14:42:20", actor: "ARIA", type: "ai", action: "Auto-classified: Smoke Detector HIGH (conf: 0.88)" },
      { time: "14:42:30", actor: "System", type: "system", action: "M. Santos dispatched — ETA 2 min" }
    ],
    ai_triage: {
      classification: "Smoke Detector Activation",
      confidence: 0.88,
      severity: "high",
      recommended_responders: ["Fire Warden"],
      immediate_actions: ["Check fire panel", "Verify room status", "Prepare floor evacuation plan"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "We have detected an alarm in your room. A warden is on the way to verify.",
      staff_broadcast: "FIRE WARDENS: Smoke alarm active F12 R1204. Maria Santos responding.",
      estimated_resolution_minutes: 10,
      reasoning: "Sensor triggered but guest reports no visible smoke. High probability of false alarm (steam), but protocols mandate fast physical verification."
    },
    evidence: [
      { type: "CCTV", label: "F12 Ceiling Cam 1", time: "14:42:10", confidence: 0.85 }
    ],
    guest_comms: [
      { sender: "system", text: "We have detected an alarm signal. Our safety warden is responding.", time: "14:42:25" },
      { sender: "guest", text: "I hear the alarm, should we evacuate? I was just showering.", time: "14:43:01" }
    ]
  },
  {
    id: "INC-2024-0893",
    type: "Security Threat",
    floor: 3, room: "Lobby Bar", zone: "F&B Outlet",
    severity: "high", status: "EN_ROUTE",
    description: "Lobby bar - male gst refusing to leave, raised voice, knocked glass off table. Staff unable to de-escalate. Poss intoxicated.",
    reporter: "Panic Button - Bar 1",
    responder_id: "s3",
    created_at: "2026-05-07T14:38:22Z",
    source: "Panic Button",
    elapsed: 524, // 8m 44s
    guest: null,
    timeline: [
      { time: "14:38:22", actor: "Lobby Bar Button 1", type: "human", action: "Silent panic button pressed" },
      { time: "14:38:25", actor: "ARIA", type: "ai", action: "Auto-classified: Hostile Guest HIGH (conf: 0.92)" },
      { time: "14:38:35", actor: "System", type: "system", action: "David Kim dispatched — ETA 4 min" }
    ],
    ai_triage: {
      classification: "Hostile / Aggressive Person",
      confidence: 0.92,
      severity: "high",
      recommended_responders: ["Security Lead", "Duty Manager"],
      immediate_actions: ["Isolate lobby area", "Deploy security in pairs", "Engage local police if physical escalates"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "",
      staff_broadcast: "SECURITY: Intoxicated hostile guest Lobby Bar. Refusing to leave. David Kim responding.",
      estimated_resolution_minutes: 15,
      reasoning: "Guest throwing glassware represents active physical threat to staff and visitors. Security presence required to de-escalate."
    },
    evidence: [
      { type: "CCTV", label: "Lobby Bar Cam 4", time: "14:38:20", confidence: 0.94 }
    ],
    guest_comms: []
  },
  {
    id: "INC-2024-0894",
    type: "Guest Distress",
    floor: 9, room: "923", zone: "Guest Room",
    severity: "medium", status: "DISPATCHED",
    description: "Gst locked out rm 923. Called FD 3x. Getting agitated on phone - voice shaking. Said she has anxiety medication inside.",
    reporter: "Guest Phone - Front Desk",
    responder_id: "s4",
    created_at: "2026-05-07T14:41:00Z",
    source: "Guest Phone Call",
    elapsed: 315, // 5m 15s
    guest: { name: "Ahmad Al-Rashid", language: "ar", room: "923", checkin: "2026-05-06", nationality: "Saudi Arabian", flag: "🇸🇦" },
    timeline: [
      { time: "14:41:00", actor: "Front Desk Agent", type: "human", action: "Guest call received, lockout with anxiety reported" },
      { time: "14:41:05", actor: "ARIA", type: "ai", action: "Auto-classified: Emotional Distress MEDIUM" },
      { time: "14:41:15", actor: "System", type: "system", action: "Sarah Lee dispatched" }
    ],
    ai_triage: {
      classification: "Emotional Distress / Lockout",
      confidence: 0.81,
      severity: "medium",
      recommended_responders: ["Duty Manager", "First Aid"],
      immediate_actions: ["Dispatch master key", "Provide warm reassurance", "Assess physical symptoms"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "Mr. Al-Rashid, our Duty Manager is on the way to Room 923 with an override key. We will assist you shortly.",
      staff_broadcast: "STAFF: Guest in Room 923 highly distressed/locked out. Sarah Lee responding.",
      estimated_resolution_minutes: 12,
      reasoning: "Guest locked out and exhibiting panic attacks. Requires calm human reassurances along with standard door unlock override."
    },
    evidence: [],
    guest_comms: [
      { sender: "guest", text: "أنا محبوس بالخارج ولا أستطيع التنفس بشكل جيد", translated: "I am locked out and cannot breathe well", time: "14:41:02" },
      { sender: "system", text: "Mr. Al-Rashid, our Duty Manager is responding now. Please take deep, slow breaths.", time: "14:41:15" }
    ]
  },
  {
    id: "INC-2024-0895",
    type: "Suspicious Activity",
    floor: 2, room: "Corridor B", zone: "Staff Corridor",
    severity: "medium", status: "TRIAGED",
    description: "F2 corridor B - unidntfd male tailgating thru staff door behind laundry cart. No hotel ID visible. POI still on floor per cam.",
    reporter: "Housekeeping - S. Wongprasert",
    responder_id: null,
    created_at: "2026-05-07T14:45:10Z",
    source: "Staff Report",
    elapsed: 120, // 2m 0s
    guest: null,
    timeline: [
      { time: "14:45:10", actor: "S. Wongprasert", type: "human", action: "Reported tailgating and photography via Staff App" },
      { time: "14:45:15", actor: "ARIA", type: "ai", action: "Auto-classified: Secure Area Breach (conf: 0.54)" }
    ],
    ai_triage: {
      classification: "Unauthorized Access / Reconnaissance",
      confidence: 0.54,
      severity: "medium",
      recommended_responders: ["Security Lead"],
      immediate_actions: ["Verify corridor cameras", "Dispatch security sweeper", "Request ID upon encounter"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "",
      staff_broadcast: "SECURITY WARNING (Low Conf): Unidentified individual F2 Staff Corridor. Gray hoodie. Report if sighted.",
      estimated_resolution_minutes: 20,
      reasoning: "Housekeeping reports tailgating and photography. Lower confidence score due to ambiguous intent, but warrants security scan."
    },
    evidence: [
      { type: "CCTV", label: "F2 Staff Corridor Cam 2", time: "14:45:00", confidence: 0.72 }
    ],
    guest_comms: []
  },
  {
    id: "INC-2024-0896",
    type: "Maintenance",
    floor: 5, room: "512", zone: "Guest Room",
    severity: "low", status: "DETECTED",
    description: "Rm 512 ceiling dripping frm bthrm above. Gst put towels down. Has laptop on desk near drip. Asked for room move.",
    reporter: "Guest Call - Ext 512",
    responder_id: null,
    created_at: "2026-05-07T14:46:20Z",
    source: "Guest Phone Call",
    elapsed: 70, // 1m 10s
    guest: { name: "David Miller", language: "en", room: "512", checkin: "2026-05-03", nationality: "British", flag: "🇬🇧" },
    timeline: [
      { time: "14:46:20", actor: "Front Desk Agent", type: "human", action: "Guest call logged regarding leaking water" }
    ],
    ai_triage: {
      classification: "Water Leak / Plumbing Hazard",
      confidence: 0.91,
      severity: "low",
      recommended_responders: ["Plumbing Crew", "Housekeeping (Wet Vacuum)"],
      immediate_actions: ["Isolate main water valve F5", "Place warning signs", "Extract pooling water"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "We apologize for the issue. Our plumbing team has been dispatched.",
      staff_broadcast: "MAINTENANCE: Water leak near Room 512 corridor. Plumber requested. Place wet floor signs.",
      estimated_resolution_minutes: 45,
      reasoning: "Routine facility failure resulting in localized pooling. Low safety risk if slip signs are quickly posted."
    },
    evidence: [],
    guest_comms: []
  },
  {
    id: "INC-2024-0897",
    type: "Guest Distress",
    floor: 11, room: "1108", zone: "Guest Room",
    severity: "low", status: "RESOLVED",
    description: "Noise cmplnt F11 R1108 - gst reporting loud music nxt door. When staff arrived gst was verbally aggressive, threatened to call GM. Resolved - spoken to adj rm.",
    reporter: "Front Desk Agent",
    responder_id: "s1",
    created_at: "2026-05-07T13:50:00Z",
    source: "Staff Report",
    elapsed: 3360, // 56m
    guest: { name: "Amelia Dupont", language: "fr", room: "1108", checkin: "2026-05-01", nationality: "French", flag: "🇫🇷" },
    timeline: [
      { time: "13:50:00", actor: "Front Desk", type: "human", action: "Loud noise complaint registered" },
      { time: "13:52:00", actor: "J. Chen", type: "responder", action: "Dispatched to F11 Room 1108" },
      { time: "13:58:12", actor: "J. Chen", type: "responder", action: "Arrived, spoke to guests in 1110. Music lowered." },
      { time: "14:02:15", actor: "J. Chen", type: "responder", action: "Marked incident as resolved" }
    ],
    ai_triage: {
      classification: "Noise Disturbance",
      confidence: 0.95,
      severity: "low",
      recommended_responders: ["Security"],
      immediate_actions: ["Contact adjacent room", "Issue verbal warning", "Log in guest history"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "We have issued a warning to the adjoining room. Please contact us if noise persists.",
      staff_broadcast: "",
      estimated_resolution_minutes: 15,
      reasoning: "Standard sound complaint. Easily managed via verbal security warning."
    },
    evidence: [],
    guest_comms: [
      { sender: "guest", text: "La musique est trop forte à côté, je ne peux pas dormir !", translated: "The music is too loud next door, I can't sleep!", time: "13:50:02" },
      { sender: "system", text: "We have dispatched security to issue a warning. We apologize for the disturbance.", time: "13:52:10" }
    ]
  },
  {
    id: "INC-2024-0898",
    type: "Medical Emergency",
    floor: 1, room: "Spa Reception", zone: "Spa Outlet",
    severity: "critical", status: "DISPATCHED",
    description: "Spa reception - gst collapsed near check-in desk. Witnessed by 2 staff. No prior complaints. CPR not initiated, gst has pulse. AED on standby.",
    reporter: "Spa Attendant - K. Somchai",
    responder_id: "s1",
    created_at: "2026-05-07T14:43:00Z",
    source: "Staff Report",
    elapsed: 1380, // 23 minutes
    guest: { name: "Marcus Aurelius", language: "en", room: "108", checkin: "2026-05-02", nationality: "Italian", flag: "🇮🇹" },
    timeline: [
      { time: "14:43:00", actor: "K. Somchai", type: "human", action: "Collapse reported at spa" },
      { time: "14:43:10", actor: "ARIA", type: "ai", action: "Auto-classified: Medical Emergency CRITICAL" },
      { time: "14:43:30", actor: "System", type: "system", action: "J. Chen dispatched — ETA 4 min" }
    ],
    ai_triage: {
      classification: "Unconscious / Collapsed Guest",
      confidence: 0.94,
      severity: "critical",
      recommended_responders: ["Security Lead", "First Aider"],
      immediate_actions: ["AED on standby", "Monitor pulse and airway", "EMS on standby"],
      escalate_911: true,
      escalation_reason: "Sudden collapse of guest in public area.",
      guest_message: "Our first aid responders are arriving with medical kits. Please stay calm.",
      staff_broadcast: "EMERGENCY: Sudden collapse spa reception. James Chen responding. AED standby.",
      estimated_resolution_minutes: 20,
      reasoning: "Sudden collapse of guest warrants immediate cardiac monitoring and AED readiness."
    },
    evidence: [],
    guest_comms: []
  }
];

// --- REAL STAFF DATA (6 Responders) ---
const INITIAL_STAFF = [
  { id: "s1", name: "James Chen", initials: "JC", role: "Security Lead", floor: 7, status: "responding", certs: ["Security","First Aid"], certifications: ["Security","First Aid"], incidents: 2, incidents_count: 2, shiftStart: "08:00", shift: "08:00 - 20:00", note: "2 concurrent assignments" },
  { id: "s2", name: "Maria Santos", initials: "MS", role: "Fire Warden", floor: 12, status: "responding", certs: ["Fire Warden","First Aid","AED"], certifications: ["Fire Warden","First Aid","AED"], incidents: 1, incidents_count: 1, shift: "08:00 - 20:00" },
  { id: "s3", name: "David Kim", initials: "DK", role: "Security", floor: 3, status: "non_responsive", certs: ["Security"], certifications: ["Security"], incidents: 1, incidents_count: 1, note: "No response 4m 12s", shift: "07:00 - 19:00" },
  { id: "s4", name: "Sarah Lee", initials: "SL", role: "Front Desk Mgr", floor: 9, status: "responding", certs: ["First Aid"], certifications: ["First Aid"], incidents: 1, incidents_count: 1, shift: "14:00 - 22:00" },
  { id: "s5", name: "Michael Torres", initials: "MT", role: "Security", floor: 1, status: "available", certs: ["Security"], certifications: ["Security"], certExpired: "AED - expired 23d ago", cert_expiry: { "AED": "Expired 23 days ago" }, incidents: 0, incidents_count: 0, shift: "08:00 - 20:00" },
  { id: "s6", name: "Priya Nair", initials: "PN", role: "Duty Manager", floor: 6, status: "available", certs: ["First Aid","Fire Warden","AED"], certifications: ["First Aid","Fire Warden","AED"], incidents: 0, incidents_count: 0, shift: "09:00 - 18:00" },
];

const WEEKLY_DATA = [
  { day: 'MON', medical: 3, fire: 1, security: 4, distress: 2, maintenance: 5 },
  { day: 'TUE', medical: 1, fire: 0, security: 2, distress: 4, maintenance: 3 },
  { day: 'WED', medical: 4, fire: 2, security: 1, distress: 1, maintenance: 7 },
  { day: 'THU', medical: 2, fire: 0, security: 5, distress: 3, maintenance: 2 },
  { day: 'FRI', medical: 5, fire: 1, security: 3, distress: 6, maintenance: 4 },
  { day: 'SAT', medical: 3, fire: 3, security: 7, distress: 5, maintenance: 1 },
  { day: 'SUN', medical: 2, fire: 0, security: 2, distress: 2, maintenance: 3 },
];

const RESPONSE_TIME_DATA = [
  { day: 'MON', target: 4.0, actual: 3.8 },
  { day: 'TUE', target: 4.0, actual: 6.2 },  // bad day — show the variance
  { day: 'WED', target: 4.0, actual: 4.9 },
  { day: 'THU', target: 4.0, actual: 3.1 },
  { day: 'FRI', target: 4.0, actual: 5.7 },
  { day: 'SAT', target: 4.0, actual: 11.2 }, // Saturday spike
  { day: 'SUN', target: 4.0, actual: 3.3 },
];

const CHART_STYLE = {
  cartesianGrid: { stroke: '#1e2840', strokeDasharray: '3 3' },
  xAxis: { tick: { fill: '#475569', fontSize: 10, fontFamily: 'monospace' }, axisLine: { stroke: '#1e2840' }, tickLine: false },
  yAxis: { tick: { fill: '#475569', fontSize: 10, fontFamily: 'monospace' }, axisLine: false, tickLine: false },
  tooltip: {
    contentStyle: { background: '#0e1117', border: '1px solid #1e2840', borderRadius: '2px', fontFamily: 'monospace', fontSize: '11px' },
    labelStyle: { color: '#94a3b8' },
    itemStyle: { color: '#e2e8f0' }
  }
};

const TYPE_COLORS = {
  medical: '#ef4444',
  fire: '#f97316',
  security: '#8b5cf6',
  distress: '#f59e0b',
  maintenance: '#3b82f6'
};

const GUEST_COMMS = {
  "INC-2024-0891": [
    { sender: "system", text: "Emergency signal received from Room 714. Dispatching response team now.", time: "14:31:11" },
    { sender: "operator", text: "Ms. Tanaka, our team is on their way to you right now. You are not alone. Please stay on the line.", time: "14:31:44" },
    { sender: "guest", text: "助けてください、動けません", translated: "Please help me, I can't move", time: "14:32:09", lang: "ja" },
    { sender: "operator", text: "Help is 2 minutes away. Our team is coming up to Floor 7 right now. Can you unlock the door if you are able?", time: "14:32:22" },
  ],
  "INC-2024-0894": [
    { sender: "guest", text: "why isn't anyone coming it's been 10 minutes", time: "14:19:03", lang: "en" },
    { sender: "system", text: "Guest message received. Responder S. Lee is en route — ETA 2 min.", time: "14:19:04" },
    { sender: "operator", text: "Sarah is on her way up right now - she's at the elevator. Your medication is inside and we'll get you in as fast as possible.", time: "14:19:31" },
    { sender: "guest", text: "ok thank you please hurry", time: "14:19:44", lang: "en" },
  ],
};

const formatElapsed = (sec) => {
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `00:${m}:${s}`;
};

const isStale = (inc) => {
  return inc.elapsed > 600 && !['RESOLVED','CLOSED'].includes(inc.status);
};

const renderStatusPill = (status) => {
  const normalized = status.toUpperCase();
  let bg = '#1e2840';
  let text = '#475569';
  let border = '#334155';
  let pulse = false;

  if (normalized === 'DETECTED') { bg = '#1e2840'; text = '#475569'; border = '#334155'; }
  else if (normalized === 'TRIAGED') { bg = '#1a0d2e'; text = '#8b5cf6'; border = '#4c1d95'; }
  else if (normalized === 'DISPATCHED') { bg = '#0d1a2e'; text = '#3b82f6'; border = '#1e3a5f'; }
  else if (normalized === 'EN_ROUTE') { bg = '#1a1508'; text = '#f59e0b'; border = '#78350f'; }
  else if (normalized === 'ON_SCENE') { bg = '#1a0808'; text = '#ef4444'; border = '#7f1d1d'; pulse = true; }
  else if (normalized === 'RESOLVED') { bg = '#081a0e'; text = '#22c55e'; border = '#14532d'; }
  else if (normalized === 'CLOSED') { bg = '#111318'; text = '#334155'; border = '#1e2840'; }

  return (
    <span 
      style={{
        background: bg,
        color: text,
        borderColor: border,
        fontFamily: 'monospace',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.05em',
        padding: '2px 6px',
        border: '1px solid',
        borderRadius: '2px'
      }}
      className="inline-flex items-center gap-1 shrink-0"
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping shrink-0" />}
      {normalized}
    </span>
  );
};

const getCardBg = (sev) => {
  if (sev === 'critical') return '#130d0d';
  if (sev === 'high') return '#13100d';
  return '#0e1117';
};

export default function App() {
  const [view, setView] = useState('map');
  const [incidents, setIncidents] = useState(() => {
    return INITIAL_INCIDENTS.map(inc => {
      if (GUEST_COMMS[inc.id]) {
        return { ...inc, guest_comms: GUEST_COMMS[inc.id] };
      }
      return inc;
    });
  });
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [toasts, setToasts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [screenSize, setScreenSize] = useState('desktop');
  
  // Modals / Dropdowns / Selections
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [newIncidentModalOpen, setNewIncidentModalOpen] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [unassignedLoading, setUnassignedLoading] = useState(false);
  const [dispatchCompleteMsg, setDispatchCompleteMsg] = useState("");

  const [activeFloor, setActiveFloor] = useState(7);
  const [isMobileMapOpen, setIsMobileMapOpen] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState('s1');

  // Active conversations in Comms
  const [activeConvId, setActiveConvId] = useState("INC-2024-0891");
  const [commsTranslateOn, setCommsTranslateOn] = useState(false);
  const [commsInput, setCommsInput] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [staffCommsInput, setStaffCommsInput] = useState("");
  const [commsTab, setCommsTab] = useState('guest'); // 'guest' or 'staff' or 'assistant'

  const [staffMessages, setStaffMessages] = useState([
    { sender: "James Chen (s1)", text: "Hskp reported - rm 714 NR x3 knocks. I am proceeding there now with AED.", time: "14:31:55" },
    { sender: "Maria Santos (s2)", text: "Proceeding to F12 Room 1204 smoke alert. Will report status immediately.", time: "14:42:45" }
  ]);
  const [assistantMessages, setAssistantMessages] = useState([
    { sender: "ARIA AI", text: "System calibrated. I am ARIA, your operational safety copilot. Ask me anything regarding emergency protocols, guest safety, or roster status.", time: "14:30:00" }
  ]);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [commsMobileShowWorkspace, setCommsMobileShowWorkspace] = useState(false);
  const [respondersSubTab, setRespondersSubTab] = useState('roster');

  // Refs for simulations
  const timerRef = useRef(null);
  const advanceRef = useRef(null);
  const commsRef = useRef(null);
  const staffRef = useRef(null);
  const syncRef = useRef(0);
  const [syncTicks, setSyncTicks] = useState("0.0s");

  // Notification Alerts Initial Mock
  const [alerts, setAlerts] = useState([
    { id: 1, text: "911 Esc advised: Medical Emergency Room 714", time: "14:31:10", unread: true },
    { id: 2, text: "IoT Warning: Smoke detector F12 Room 1204 activated", time: "14:42:15", unread: true },
    { id: 3, text: "System Panic: Lobby Bar silent button triggered", time: "14:38:22", unread: true }
  ]);

  // Responsive Breakpoints Monitor
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setScreenSize('mobile');
      else if (w < 1280) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update Dynamic Document Title
  const activeCount = useMemo(() => incidents.filter(i => !['RESOLVED','CLOSED'].includes(i.status)).length, [incidents]);
  const criticalCount = useMemo(() => incidents.filter(i => i.severity === 'critical' && !['RESOLVED','CLOSED'].includes(i.status)).length, [incidents]);
  
  useEffect(() => {
    document.title = `CrisisSync · ${activeCount} Active · ${criticalCount} Critical`;
  }, [activeCount, criticalCount]);

  // Toast Dispatcher Helper
  const addToast = useCallback((title, body, type = 'INFO') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev.slice(-4), { id, title, body, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // API Call to Claude (w/ robust fallbacks)
  const callClaudeAPI = useCallback(async (systemPrompt, userPrompt, expectJson = false) => {
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || import.meta.env.VITE_CLAUDE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        throw new Error("API Key missing");
      }
      
      const isGemini = apiKey.startsWith("AIzaSy");
      if (isGemini) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              responseMimeType: expectJson ? "application/json" : "text/plain"
            }
          })
        });
        if (!response.ok) throw new Error(`Gemini failure ${response.status}`);
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        if (expectJson) {
          let cleaned = text.replace(/```(?:json)?/gi, '').trim();
          return JSON.parse(cleaned);
        }
        return text;
      } else {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-the-api-key-in-the-browser': 'true'
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
          })
        });
        if (!response.ok) throw new Error(`Claude failure ${response.status}`);
        const data = await response.json();
        const text = data.content[0].text;
        if (expectJson) {
          let cleaned = text.replace(/```(?:json)?/gi, '').trim();
          return JSON.parse(cleaned);
        }
        return text;
      }
    } catch (err) {
      console.warn("AI Live Call failed/unconfigured. Emulating realistic local agent feedback.", err);
      if (expectJson) return getMockTriageResponse(userPrompt);
      return getMockTextResponse(systemPrompt, userPrompt);
    }
  }, []);

  // --- MOCK LOCAL REASONING DATA GENERATOR ---
  function getMockTriageResponse(prompt) {
    const isMedical = prompt.toLowerCase().includes("medical") || prompt.toLowerCase().includes("chest") || prompt.toLowerCase().includes("collapse");
    const isFire = prompt.toLowerCase().includes("fire") || prompt.toLowerCase().includes("smoke") || prompt.toLowerCase().includes("sm det") || prompt.toLowerCase().includes("sm detector");
    const isSecurity = prompt.toLowerCase().includes("security") || prompt.toLowerCase().includes("poi") || prompt.toLowerCase().includes("bar");
    
    if (isMedical) {
      return {
        classification: "Cardiac/Anxiety Distress",
        confidence: 0.89,
        severity: "critical",
        recommended_responders: ["Security Lead", "Certified First Aider"],
        immediate_actions: ["Bring medical emergency pack to floor", "Secure room entry", "Coordinate with front desk for EMS standby"],
        escalate_911: true,
        escalation_reason: "High risk cardiovascular symptoms matching acute distress profile.",
        guest_message: "Emergency response team is dispatching to your room immediately. Please keep door unlocked if possible.",
        staff_broadcast: "ALL UNITS: Medical alert pool/room corridor. Clear emergency lift access.",
        estimated_resolution_minutes: 20,
        reasoning: "Chest tightness reported combined with history of acute anxiety warrants maximum medical standby protocols."
      };
    } else if (isFire) {
      return {
        classification: "Local Combustion Threat",
        confidence: 0.94,
        severity: "high",
        recommended_responders: ["Fire Warden", "Duty Manager"],
        immediate_actions: ["Confirm panel zone details", "Inspect ceiling space", "Verify adjoining room statuses"],
        escalate_911: false,
        escalation_reason: null,
        guest_message: "Sensor trigger active in your area. Our response warden has been dispatched to check.",
        staff_broadcast: "WARDENS: Active sensor F12. David Kim en route for confirmation.",
        estimated_resolution_minutes: 15,
        reasoning: "Elevated smoke count trigger detected by automated sensor. Protocols mandate immediate visual status report."
      };
    } else if (isSecurity) {
      return {
        classification: "Intrusive/Unauthorized Activity",
        confidence: 0.72,
        severity: "medium",
        recommended_responders: ["Security Patrol"],
        immediate_actions: ["Scan active floor CCTV feeds", "Deploy security sweep", "Politely request ID verification"],
        escalate_911: false,
        escalation_reason: null,
        guest_message: "",
        staff_broadcast: "ALERT: Suspicious filming activity reported on staff service lanes. Request patrol swept.",
        estimated_resolution_minutes: 25,
        reasoning: "Unidentified person photographing back-of-house corridors without credential badges."
      };
    }
    return {
      classification: "Standard Guest Issue",
      confidence: 0.91,
      severity: "low",
      recommended_responders: ["Duty Manager"],
      immediate_actions: ["Provide priority customer assistance", "Address immediate lockout/facility issue", "Log in dispatcher database"],
      escalate_911: false,
      escalation_reason: null,
      guest_message: "Our crew is responding to assist you right now.",
      staff_broadcast: "INFO: Lockout/distress reported. Sarah Lee responding.",
      estimated_resolution_minutes: 10,
      reasoning: "Localized incident reported. Standard staff assistance protocols are fully sufficient."
    };
  }

  function getMockTextResponse(sys, user) {
    return "ALL STAFF: Unconfirmed smoke report F12. Floor 12 guests to remain calm in rooms. Security to F12 immediately. Do not use elevators. FD team on standby.";
  }

  // Real-Time Simulation Interval Implementations
  useEffect(() => {
    // 1. Clock and sync sync timers
    timerRef.current = setInterval(() => {
      setCurrentTime(new Date());
      syncRef.current = (syncRef.current + 0.1) >= 9.9 ? 0 : parseFloat((syncRef.current + 0.1).toFixed(1));
      setSyncTicks(`${syncRef.current.toFixed(1)}s`);

      // Advance Elapsed Incident Timers
      setIncidents(prev => prev.map(inc => {
        if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return inc;
        return { ...inc, elapsed: inc.elapsed + 1 };
      }));
    }, 1000);

    // 2. Advance Incident State (Every 23 seconds)
    advanceRef.current = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return inc;
        if (Math.random() > 0.7) {
          if (inc.status === 'DETECTED') {
            return {
              ...inc,
              status: 'TRIAGED',
              timeline: [{ time: new Date().toLocaleTimeString([], { hour12: false }), actor: "ARIA", type: "ai", action: "State Advanced: Auto-Triaged" }, ...inc.timeline]
            };
          }
          if (inc.status === 'TRIAGED') {
            return {
              ...inc,
              status: 'DISPATCHED',
              responder_id: 's5',
              timeline: [{ time: new Date().toLocaleTimeString([], { hour12: false }), actor: "System", type: "system", action: "Auto-dispatched responder Michael Torres" }, ...inc.timeline]
            };
          }
          if (inc.status === 'DISPATCHED') {
            return {
              ...inc,
              status: 'EN_ROUTE',
              timeline: [{ time: new Date().toLocaleTimeString([], { hour12: false }), actor: "System", type: "system", action: "Responder reported en route" }, ...inc.timeline]
            };
          }
          if (inc.status === 'EN_ROUTE') {
            return {
              ...inc,
              status: 'ON_SCENE',
              timeline: [{ time: new Date().toLocaleTimeString([], { hour12: false }), actor: "System", type: "system", action: "Responder marked on scene" }, ...inc.timeline]
            };
          }
        }
        return inc;
      }));
    }, 23000);

    // 3. Guest Message Simulation (Every 31 seconds)
    commsRef.current = setInterval(() => {
      const activeGuestIncs = incidents.filter(i => i.guest && i.status !== 'RESOLVED' && i.status !== 'CLOSED');
      if (activeGuestIncs.length > 0 && Math.random() > 0.5) {
        const selected = activeGuestIncs[Math.floor(Math.random() * activeGuestIncs.length)];
        const mockMsgs = [
          { text: "Is there any update on this?", trans: "Is there any update on this?" },
          { text: "Please hurry up, we are waiting.", trans: "Please hurry up, we are waiting." },
          { text: "すぐに来てください、体が動かない", trans: "Please come quickly, I can't move my body" }
        ];
        const selectedMsg = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
        
        setIncidents(prev => prev.map(inc => {
          if (inc.id === selected.id) {
            const timeStr = new Date().toLocaleTimeString([], { hour12: false });
            addToast(`New Comms: ${inc.id}`, `Guest in Room ${inc.room} sent a message.`, 'INFO');
            return {
              ...inc,
              guest_comms: [
                ...inc.guest_comms,
                { sender: "guest", text: selectedMsg.text, translated: selectedMsg.trans, time: timeStr }
              ]
            };
          }
          return inc;
        }));
      }
    }, 31000);

    // 4. Staff GPS Position Updates (Every 8 seconds)
    staffRef.current = setInterval(() => {
      setStaff(prev => prev.map(s => {
        if (s.status === 'available' && Math.random() > 0.6) {
          const floors = [1, 2, 3, 5, 6, 7, 9, 11, 12];
          const newFloor = floors[Math.floor(Math.random() * floors.length)];
          return { ...s, floor: newFloor };
        }
        return s;
      }));
    }, 8000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(advanceRef.current);
      clearInterval(commsRef.current);
      clearInterval(staffRef.current);
    };
  }, [incidents, addToast]);

  // AI Comms Suggested Reply Generator
  const handleAiCommsDraft = async (incId) => {
    setAiDrafting(true);
    const inc = incidents.find(i => i.id === incId);
    if (!inc) return;
    const history = inc.guest_comms.map(m => `${m.sender}: ${m.text}`).join('\n');
    const sysPrompt = "You are ARIA, drafting an empathetic response to a distressed guest. Keep it under 20 words, reassure them, and output ONLY the raw response without any formatting or quotes.";
    const userPrompt = `Incident details: ${inc.type} - ${inc.description}\nHistory:\n${history}`;
    
    const suggestion = await callClaudeAPI(sysPrompt, userPrompt, false);
    setCommsInput("");
    let charIdx = 0;
    const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '').trim();
    const streamTimer = setInterval(() => {
      setCommsInput(prev => prev + cleanSuggestion.charAt(charIdx));
      charIdx++;
      if (charIdx >= cleanSuggestion.length) {
        clearInterval(streamTimer);
        setAiDrafting(false);
      }
    }, 40);
  };

  // Send message to guest
  const handleSendComms = (incId) => {
    if (!commsInput.trim()) return;
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incId) {
        return {
          ...inc,
          guest_comms: [
            ...inc.guest_comms,
            { sender: "operator", text: commsInput, time: new Date().toLocaleTimeString([], { hour12: false }) }
          ]
        };
      }
      return inc;
    }));
    setCommsInput("");
  };

  // Dispatch staff assignment
  const handleManualAssign = (incId, staffId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incId) {
        addToast("RESPONDER DISPATCHED", `${staff.find(s => s.id === staffId)?.name} assigned to ${incId}`, "SUCCESS");
        return {
          ...inc,
          responder_id: staffId,
          status: 'DISPATCHED',
          timeline: [
            { time: new Date().toLocaleTimeString([], { hour12: false }), actor: "Operator", type: "human", action: `Assigned responder: ${staff.find(s => s.id === staffId)?.name}` },
            ...inc.timeline
          ]
        };
      }
      return inc;
    }));
    setStaff(prev => prev.map(st => {
      if (st.id === staffId) {
        return { ...st, status: 'responding', incidents_count: st.incidents_count + 1 };
      }
      return st;
    }));
  };

  // Resolve Incident State Action
  const handleResolveIncident = (incId) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === incId) {
        addToast("INCIDENT RESOLVED", `${incId} has been successfully closed.`, "SUCCESS");
        return {
          ...inc,
          status: 'RESOLVED',
          timeline: [
            { time: new Date().toLocaleTimeString([], { hour12: false }), actor: "Operator", type: "human", action: "Marked as RESOLVED" },
            ...inc.timeline
          ]
        };
      }
      return inc;
    }));
  };

  const handleSendStaffMessage = () => {
    if (!staffCommsInput.trim()) return;
    const newMsg = {
      sender: "Operator HQ",
      text: staffCommsInput,
      time: new Date().toLocaleTimeString([], { hour12: false })
    };
    setStaffMessages(prev => [...prev, newMsg]);
    setStaffCommsInput("");
    addToast("STAFF UPDATE SENT", "Message dispatched to security channel.", "SUCCESS");
  };

  const handleSendAssistantMessage = async () => {
    if (!assistantInput.trim() || assistantLoading) return;
    const userText = assistantInput;
    const newMsg = {
      sender: "Operator HQ",
      text: userText,
      time: new Date().toLocaleTimeString([], { hour12: false })
    };
    setAssistantMessages(prev => [...prev, newMsg]);
    setAssistantInput("");
    setAssistantLoading(true);

    const sys = "You are ARIA, Chief Safety Officer AI for CrisisSync. Respond to the operator's safety, operational, or policy query concisely, operatively, and professionally under 80 words.";
    const responseText = await callClaudeAPI(sys, userText, false);

    setAssistantMessages(prev => [...prev, {
      sender: "ARIA AI",
      text: responseText,
      time: new Date().toLocaleTimeString([], { hour12: false })
    }]);
    setAssistantLoading(false);
  };

  // Auto-Dispatch AI Coordinator
  const handleAutoDispatch = async () => {
    setUnassignedLoading(true);
    setDispatchCompleteMsg("");
    const unassigned = incidents.filter(i => !i.responder_id && i.status !== 'RESOLVED' && i.status !== 'CLOSED');
    const available = staff.filter(s => s.status === 'available');

    if (unassigned.length === 0 || available.length === 0) {
      setTimeout(() => {
        addToast("DISPATCH SKIP", "No active unassigned incidents or responders available.", "INFO");
        setUnassignedLoading(false);
      }, 1000);
      return;
    }

    const sys = "You are ARIA, Chief Dispatch Coordinator. Match available responders to unassigned incidents. Return a clean JSON array of assignment objects only: [{\"incident_id\":\"...\",\"staff_id\":\"...\",\"reason\":\"...\"}]";
    const user = `Incidents: ${JSON.stringify(unassigned.map(i => ({ id: i.id, type: i.type, floor: i.floor, severity: i.severity })))}\nResponders: ${JSON.stringify(available.map(s => ({ id: s.id, name: s.name, role: s.role, floor: s.floor, certs: s.certifications })))}`;

    const assignments = await callClaudeAPI(sys, user, true);

    if (assignments && Array.isArray(assignments)) {
      assignments.forEach((asg, idx) => {
        setTimeout(() => {
          handleManualAssign(asg.incident_id, asg.staff_id);
        }, idx * 400); // 400ms staggering
      });

      setTimeout(() => {
        setDispatchCompleteMsg(`DISPATCH COMPLETE — ${assignments.length} assignments made successfully.`);
        setUnassignedLoading(false);
      }, assignments.length * 400 + 100);
    } else {
      setUnassignedLoading(false);
      addToast("DISPATCH ERROR", "Failed to parse AI dispatch scheme. Manual control recommended.", "CRITICAL");
    }
  };

  // Export CAD Incidents
  const [exporting, setExporting] = useState(false);
  const handleExportData = () => {
    setExporting(true);
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(incidents, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `CrisisSync_IncidentCAD_Export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setExporting(false);
      addToast("EXPORT SUCCESS", "Incident telemetry data package downloaded successfully.", "SUCCESS");
    }, 1200);
  };

  // Find active escalation recommended incident
  const escalationIncident = useMemo(() => {
    return incidents.find(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED' && i.ai_triage?.escalate_911);
  }, [incidents]);

  return (
    <div className="flex h-screen w-full bg-[#080a0f] text-[#f1f5f9] font-sans overflow-hidden select-none">
      <style>{`
        @keyframes criticalPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      {/* 911 SIREN ESCALATION BANNER */}
      {escalationIncident && (
        <div className="fixed top-0 left-0 right-0 h-10 bg-[#dc2626] z-50 flex items-center justify-between px-6 animate-pulse">
          <div className="flex items-center space-x-2 text-white font-mono text-xs font-bold tracking-widest">
            <AlertOctagon className="w-5 h-5 animate-spin" />
            <span>⚠ EMERGENCY SIREN ACTION RECOMMENDED · {escalationIncident.id} MAPPED TO 911 TRIGGER ({escalationIncident.ai_triage?.escalation_reason})</span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => { setSelectedIncidentId(escalationIncident.id); setView('incidents'); }} 
              className="bg-black/40 hover:bg-black/60 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-white border border-white/20 rounded-sm font-semibold transition"
            >
              VIEW INCIDENT
            </button>
            <button 
              onClick={() => {
                setIncidents(prev => prev.map(i => i.id === escalationIncident.id ? { ...i, ai_triage: { ...i.ai_triage, escalate_911: false } } : i));
              }}
              className="bg-white text-red-600 px-3 py-1 text-[10px] font-mono uppercase tracking-wider border border-transparent rounded-sm font-black hover:bg-red-50 transition"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR DESKTOP & TABLET --- */}
      <aside 
        style={{
          width: screenSize === 'tablet' ? '64px' : '220px',
          transition: 'width 0.2s ease',
          overflow: 'hidden'
        }} 
        className="bg-gradient-to-b from-[#080a0f] to-[#0a0d14] border-r border-[#1e2840] shrink-0 relative z-40 hidden md:flex flex-col"
      >
        {/* LOGO */}
        <div className="h-14 border-b border-[#1e2840] flex items-center px-4 space-x-2 shrink-0">
          <Shield className="w-6 h-6 text-[#ef4444]" />
          {screenSize !== 'tablet' && (
            <span className="text-sm font-black tracking-tighter">
              CRISIS<span style={{color:'#ef4444'}}>SYNC</span>
            </span>
          )}
        </div>
        
        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1">
          {[
            { id: 'map', icon: MapIcon, label: 'LIVE MAP' },
            { id: 'incidents', icon: AlertTriangle, label: 'INCIDENTS' },
            { id: 'responders', icon: Users, label: 'RESPONDERS' },
            { id: 'comms', icon: MessageSquare, label: 'COMMS' },
            { id: 'analytics', icon: BarChart2, label: 'ANALYTICS' }
          ].map(item => (
            <div 
              key={item.id}
              title={screenSize === 'tablet' ? item.label : ''} 
              onClick={() => setView(item.id)}
              style={{
                padding: screenSize === 'tablet' ? '12px 0' : '8px 16px',
                justifyContent: screenSize === 'tablet' ? 'center' : 'flex-start',
                cursor: 'pointer'
              }}
              className={`flex items-center space-x-3 transition-all ${
                view === item.id 
                  ? 'border-l-2 border-red-600 bg-[#1a0808] text-white' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#141920]'
              }`}
            >
              <item.icon size={20}/>
              {screenSize !== 'tablet' && <span className="text-xs font-semibold tracking-wider">{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-[#1e2840] space-y-2 shrink-0 font-mono">
          {screenSize !== 'tablet' ? (
            <>
              <div className="text-xs text-slate-300 font-bold tracking-wider text-center">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-[10px] text-slate-600 font-bold text-center tracking-widest uppercase">
                GRAND HYATT BKK
              </div>
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-green-500 font-black">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>SYS ONLINE</span>
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* --- MAIN CORE INTERFACE WRAPPER --- */}
      <div 
        className="flex-1 flex flex-col relative min-w-0"
        style={{ paddingBottom: screenSize === 'mobile' ? '56px' : '0px' }}
      >
        
        {/* --- DENSE HEADER (52px) --- */}
        <header className="h-[52px] bg-[#0e1117] border-b border-[#1e2840] flex items-center justify-between px-4 shrink-0 relative z-30 mt-0">
          
          {/* Breadcrumb Info */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-slate-500 tracking-widest font-black uppercase">OPS DASHBOARD</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-black tracking-widest uppercase">{view}</span>
          </div>

          {/* Center Stat Chips */}
          <div className="hidden lg:flex items-center">
            <div style={{ display: 'flex', gap: '1px', fontFamily: 'monospace' }}>
              <div 
                style={{ 
                  background: '#1a0808', 
                  border: '1px solid #3d1212', 
                  padding: '4px 12px', 
                  fontSize: '11px',
                  animation: criticalCount > 0 ? 'criticalPulse 2s ease-in-out infinite' : 'none'
                }}
              >
                <span style={{ color: '#ef4444' }}>●</span>
                <span style={{ color: '#ef4444', fontWeight: '700', margin: '0 4px' }}>{criticalCount}</span>
                <span style={{ color: '#7f1d1d' }}>CRITICAL</span>
              </div>
              <div style={{ background: '#141920', border: '1px solid #1e2840', padding: '4px 12px', fontSize: '11px' }}>
                <span style={{ color: '#f97316' }}>◆</span>
                <span style={{ color: '#f97316', fontWeight: '700', margin: '0 4px' }}>
                  {incidents.filter(i => !['RESOLVED','CLOSED'].includes(i.status)).length}
                </span>
                <span style={{ color: '#431407' }}>ACTIVE</span>
              </div>
              <div style={{ background: '#081a0e', border: '1px solid #14532d', padding: '4px 12px', fontSize: '11px' }}>
                <span style={{ color: '#22c55e' }}>✓</span>
                <span style={{ color: '#22c55e', fontWeight: '700', margin: '0 4px' }}>
                  {incidents.filter(i => ['RESOLVED','CLOSED'].includes(i.status)).length}
                </span>
                <span style={{ color: '#14532d' }}>RESOLVED</span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setBroadcastModalOpen(true)}
              className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold px-4 py-1.5 rounded-sm tracking-wide flex items-center space-x-1 transition shadow-lg shadow-red-900/10"
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">BROADCAST</span>
            </button>

            {/* BELL NOTIFICATIONS */}
            <div className="relative">
              <button 
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className="relative p-1.5 text-slate-400 hover:text-white transition"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>

              {showBellDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-[#141920] border border-[#2a3550] rounded-sm shadow-2xl z-50 p-2 font-mono">
                  <div className="text-[10px] uppercase font-black tracking-wider text-slate-500 pb-2 border-b border-[#1e2840] mb-2 px-1">
                    RECENT ALERTS
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {alerts.map(a => (
                      <div key={a.id} className="p-2 bg-[#0e1117] hover:bg-[#1a2130] rounded-sm border border-[#1e2840] transition">
                        <div className="text-[10px] text-slate-400 mb-0.5 font-medium">{a.text}</div>
                        <div className="text-[8px] text-slate-600 font-bold text-right">{a.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- VIEW CONTENT SPACE --- */}
        <div className="flex-1 relative overflow-hidden bg-[#080a0f]">
          
          {/* VIEW 1 — LIVE MAP */}
          {view === 'map' && (
            <div className="h-full flex flex-col lg:flex-row relative">
              
              {/* Floor Plan Canvas Panel */}
              {screenSize !== 'mobile' || isMobileMapOpen ? (
                <div className="w-full lg:w-[58%] h-full border-r border-[#1e2840] flex flex-col bg-[#080a0f]">
                  
                  {/* Floor selector tabs */}
                  <div className="h-10 border-b border-[#1e2840] bg-[#0e1117] flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center space-x-4">
                      {screenSize === 'mobile' && (
                        <button 
                          onClick={() => setIsMobileMapOpen(false)}
                          className="bg-[#141920] border border-[#1e2840] text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-sm"
                        >
                          ← LIST
                        </button>
                      )}
                      <div className="flex space-x-4">
                        {[1, 7, 12].map(f => (
                          <button 
                            key={f} 
                            onClick={() => setActiveFloor(f)}
                            className={`h-10 text-xs font-mono font-bold uppercase tracking-widest px-2 relative transition-all ${
                              activeFloor === f ? 'border-b-2 border-red-600 text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            FLOOR {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SVG Map Area */}
                  <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0d14]">
                    <svg viewBox="0 0 800 500" className="w-full max-w-3xl border border-[#1e2840] bg-[#0a0c10] shadow-2xl">
                      <defs>
                        <pattern id="hatch-pattern" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#1e2840" strokeWidth="1" />
                        </pattern>
                      </defs>

                      {/* Outer perimeter floor border */}
                      <rect x="20" y="20" width="760" height="460" rx="0" fill="none" stroke="#334155" strokeWidth="1.5" />

                      {/* Corridors */}
                      <rect x="30" y="198" width="740" height="8" fill="#0e1117" />
                      <rect x="280" y="30" width="24" height="440" fill="#0e1117" />

                      {/* North Side Rooms */}
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const rNum = activeFloor * 100 + (idx + 1);
                        const hasActiveInc = incidents.find(i => i.floor === activeFloor && i.room === rNum.toString() && i.status !== 'RESOLVED' && i.status !== 'CLOSED');
                        const isOccupied = idx % 2 === 1;
                        const rx = 100 + idx * 54;
                        const ry = 150;
                        
                        return (
                          <g key={`r-north-${idx}`}>
                            <rect 
                              x={rx} y={ry} width="52" height="38" 
                              fill={hasActiveInc ? '#1a0808' : isOccupied ? '#111318' : '#0a0c10'} 
                              stroke={hasActiveInc ? '#ef4444' : '#1e2840'} 
                              strokeWidth="0.5" 
                            />
                            <text x={rx + 26} y={ry + 22} fill={hasActiveInc ? '#ef4444' : '#475569'} fontSize="9" fontFamily="monospace" textAnchor="middle">
                              {rNum}
                            </text>
                          </g>
                        );
                      })}

                      {/* South Side Rooms */}
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const rNum = activeFloor * 100 + (11 + idx);
                        const hasActiveInc = incidents.find(i => i.floor === activeFloor && i.room === rNum.toString() && i.status !== 'RESOLVED' && i.status !== 'CLOSED');
                        const isOccupied = idx % 2 === 0;
                        const rx = 100 + idx * 54;
                        const ry = 206;

                        return (
                          <g key={`r-south-${idx}`}>
                            <rect 
                              x={rx} y={ry} width="52" height="38" 
                              fill={hasActiveInc ? '#1a0808' : isOccupied ? '#111318' : '#0a0c10'} 
                              stroke={hasActiveInc ? '#ef4444' : '#1e2840'} 
                              strokeWidth="0.5" 
                            />
                            <text x={rx + 26} y={ry + 22} fill={hasActiveInc ? '#ef4444' : '#475569'} fontSize="9" fontFamily="monospace" textAnchor="middle">
                              {rNum}
                            </text>
                          </g>
                        );
                      })}

                      {/* Service Areas */}
                      <rect x="30" y="30" width="60" height="110" fill="url(#hatch-pattern)" stroke="#1e2840" strokeWidth="0.5" />
                      <text x="60" y="90" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">SERVICE</text>

                      <rect x="650" y="30" width="120" height="110" fill="url(#hatch-pattern)" stroke="#1e2840" strokeWidth="0.5" />
                      <text x="710" y="90" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">BOH LAUNDRY</text>

                      {/* Elevators */}
                      <g>
                        <rect x="30" y="210" width="40" height="30" fill="#141920" stroke="#2a3550" />
                        <text x="50" y="228" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">▲▼ LIFT</text>
                      </g>

                      {/* Stairwells */}
                      <rect x="30" y="260" width="40" height="40" fill="url(#hatch-pattern)" stroke="#1e2840" strokeWidth="0.5" />
                      <text x="50" y="284" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">STAIRS</text>

                      {/* Compass Rose */}
                      <g transform="translate(50, 440)">
                        <circle r="15" fill="none" stroke="#334155" strokeWidth="0.5" />
                        <line x1="0" y1="-18" x2="0" y2="18" stroke="#475569" strokeWidth="1" />
                        <line x1="-18" y1="0" x2="18" y2="0" stroke="#475569" strokeWidth="1" />
                        <polygon points="0,-18 -4,-4 0,-8" fill="#ef4444" />
                        <polygon points="0,-18 4,-4 0,-8" fill="#334155" />
                        <text x="0" y="-22" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">N</text>
                      </g>

                      {/* Scale Bar */}
                      <g transform="translate(100, 450)">
                        <line x1="0" y1="0" x2="80" y2="0" stroke="#475569" strokeWidth="1.5" />
                        <line x1="0" y1="-3" x2="0" y2="3" stroke="#475569" strokeWidth="1.5" />
                        <line x1="40" y1="-3" x2="40" y2="3" stroke="#475569" strokeWidth="1.5" />
                        <line x1="80" y1="-3" x2="80" y2="3" stroke="#475569" strokeWidth="1.5" />
                        <text x="40" y="-6" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">~12m</text>
                      </g>

                      {/* South corridor label */}
                      <text x="400" y="475" fill="#334155" fontSize="8" fontFamily="monospace" textAnchor="middle">
                        SERVICE CORRIDOR B · SOUTH EDGE ACCESS
                      </text>

                      {/* Legend */}
                      <g transform="translate(560, 430)">
                        <rect x="0" y="0" width="8" height="8" fill="#111318" stroke="#1e2840" strokeWidth="0.5" />
                        <text x="14" y="8" fill="#475569" fontSize="8" fontFamily="monospace">Occupied</text>

                        <rect x="80" y="0" width="8" height="8" fill="#0a0c10" stroke="#1e2840" strokeWidth="0.5" />
                        <text x="94" y="8" fill="#475569" fontSize="8" fontFamily="monospace">Available</text>

                        <rect x="160" y="0" width="8" height="8" fill="#1a0808" stroke="#ef4444" strokeWidth="0.5" />
                        <text x="174" y="8" fill="#ef4444" fontSize="8" fontFamily="monospace">Incident</text>
                      </g>

                      {/* Active Pins */}
                      {incidents.filter(i => i.floor === activeFloor && i.status !== 'RESOLVED' && i.status !== 'CLOSED').map(inc => {
                        const rNum = parseInt(inc.room);
                        const isNorth = (rNum % 100) <= 10;
                        const idx = isNorth ? (rNum % 100) - 1 : (rNum % 100) - 11;
                        const cx = 100 + idx * 54 + 26;
                        const cy = isNorth ? 150 + 19 : 206 + 19;

                        return (
                          <g key={`pin-${inc.id}`} className="cursor-pointer" onClick={() => { setSelectedIncidentId(inc.id); setView('incidents'); }}>
                            <g transform={`translate(${cx}, ${cy})`}>
                              <line x1="-8" y1="0" x2="8" y2="0" stroke="#ef4444" strokeWidth="1"/>
                              <line x1="0" y1="-8" x2="0" y2="8" stroke="#ef4444" strokeWidth="1"/>
                              <circle r="3" fill="#ef4444"/>
                              <circle r="10" fill="none" stroke="#ef4444" strokeWidth="0.5" opacity="0.4">
                                <animate attributeName="r" values="6;14" dur="1.5s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite"/>
                              </circle>
                            </g>
                            <text x={cx} y={cy - 12} fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="bg-black/90 px-1 rounded-sm">
                              {inc.id}
                            </text>
                          </g>
                        );
                      })}

                      {/* Staff Dots */}
                      {staff.filter(s => s.floor === activeFloor && s.status !== 'Off Duty').map((s, i) => {
                        const cx = 160 + i * 110;
                        const cy = 202;
                        return (
                          <g key={`staff-dot-${s.id}`} transform={`translate(${cx}, ${cy})`}>
                            <circle r="5" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1"/>
                            <text fontSize="7" fill="#93c5fd" textAnchor="middle" dy="2.5" fontFamily="monospace">{s.initials}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              ) : (
                // Mobile List View (replacing map on mobile)
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#1e2840]">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-500">ACTIVE INCIDENTS</span>
                    <button 
                      onClick={() => setIsMobileMapOpen(true)}
                      className="bg-[#2563eb] text-white text-[10px] font-mono uppercase tracking-widest px-3 py-1 font-bold rounded-sm"
                    >
                      VIEW MAP
                    </button>
                  </div>
                  {incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').map(inc => {
                    const TypeIcon = ICON_MAP[inc.type] || AlertTriangle;
                    const severityColor = COLORS[inc.severity.toUpperCase()]?.text || "#fff";
                    return (
                      <div 
                        key={inc.id} 
                        onClick={() => { setSelectedIncidentId(inc.id); }}
                        style={{
                          borderLeft: `3px solid ${severityColor}`,
                          backgroundColor: getCardBg(inc.severity),
                          minHeight: '56px',
                          borderRadius: '0px'
                        }}
                        className="p-3 flex items-center justify-between cursor-pointer border-t border-b border-r border-[#1e2840]/30 relative"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: severityColor }}></span>
                            <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: severityColor }}>{inc.severity}</span>
                            <span className="font-mono text-[10px] text-slate-500">{inc.id}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-200 truncate">{inc.type}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{inc.description}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] text-slate-500">→</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Right Panel: Incident list & Staff strip */}
              {screenSize !== 'mobile' && (
                <div className="lg:w-[42%] h-full flex flex-col bg-[#0e1117] overflow-hidden">
                  
                  {/* Incidents Block */}
                  <div className="flex-1 flex flex-col min-h-0 border-b border-[#1e2840]">
                    <div className="h-10 px-4 bg-[#080a0f] border-b border-[#1e2840] flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-black">
                        ACTIVE INCIDENTS ({incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length})
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').map(inc => {
                        const TypeIcon = ICON_MAP[inc.type] || AlertTriangle;
                        const severityColor = COLORS[inc.severity.toUpperCase()]?.text || '#fff';
                        
                        return (
                          <div 
                            key={inc.id} 
                            onClick={() => { setSelectedIncidentId(inc.id); setView('incidents'); }}
                            style={{
                              borderLeft: `3px solid ${severityColor}`,
                              backgroundColor: getCardBg(inc.severity),
                              borderRadius: '0px',
                            }}
                            className="p-3 flex flex-col justify-between shrink-0 relative hover:brightness-110 cursor-pointer border-t border-b border-r border-[#1e2840]/30"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: severityColor }}></span>
                                <span className="font-mono text-[10px] font-bold uppercase" style={{ color: severityColor }}>
                                  {inc.severity.toUpperCase()}
                                </span>
                                <span className="font-mono text-[11px] text-slate-500 font-bold ml-1">{inc.id}</span>
                                {isStale(inc) && (
                                  <span style={{
                                    background: '#1a1000', border: '1px solid #78350f',
                                    color: '#f59e0b', fontSize: '9px', fontFamily: 'monospace',
                                    padding: '1px 4px', borderRadius: '1px'
                                  }}>STALE</span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-600">
                                {inc.created_at.split('T')[1].slice(0, 8)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mb-1.5">
                              <TypeIcon size={14} style={{ color: severityColor }} />
                              <span className="font-mono text-[11px] text-slate-300 uppercase">{inc.type}</span>
                              <span className="font-mono text-[10px] text-slate-500">·</span>
                              <span className="font-mono text-[10px] text-slate-500 font-bold">F{inc.floor} · RM {inc.room}</span>
                            </div>

                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono text-[10px] text-slate-400 truncate flex-1 mr-2">
                                {inc.description}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="w-5 h-5 rounded bg-[#141920] border border-[#2a3550] flex items-center justify-center text-[9px] font-mono text-white font-bold">
                                  {inc.responder_id ? staff.find(s => s.id === inc.responder_id)?.initials || "JC" : "—"}
                                </span>
                                {renderStatusPill(inc.status)}
                              </div>
                            </div>

                            <div className="border-t border-[#1e2840]/40 pt-1.5 flex justify-end">
                              <span className={`font-mono text-[11px] ${inc.elapsed > 240 ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                ⏱ {formatElapsed(inc.elapsed)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff on Duty Strip */}
                  <div className="h-44 flex flex-col shrink-0">
                    <div className="h-9 px-4 bg-[#080a0f] border-b border-[#1e2840] flex items-center">
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-black">
                        STAFF ON DUTY RAIL
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-[#0e1117] custom-scrollbar">
                      <table className="w-full text-left font-mono text-[10px] tracking-wide">
                        <tbody className="divide-y divide-[#1e2840]">
                          {staff.map(s => {
                            let statusDotColor = 'bg-slate-600';
                            if (s.status === 'available') statusDotColor = 'bg-green-500';
                            if (s.status === 'responding') statusDotColor = 'bg-orange-500';
                            if (s.status === 'non_responsive') statusDotColor = 'bg-yellow-500';

                            return (
                              <tr key={s.id} className="hover:bg-[#141920] transition duration-100">
                                <td className="p-2 pl-4">
                                  <div className="w-6 h-6 rounded-full bg-[#141920] border border-[#1e2840] flex items-center justify-center font-bold text-[9px] text-slate-300">
                                    {s.initials}
                                  </div>
                                </td>
                                <td className="p-2 font-bold text-slate-200">{s.name}</td>
                                <td className="p-2 text-slate-500">{s.role}</td>
                                <td className="p-2">
                                  <div className="flex items-center space-x-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`}></span>
                                    <span className="text-[9px] uppercase font-bold text-slate-400">{s.status.replace('_', ' ')}</span>
                                  </div>
                                </td>
                                <td className="p-2 text-slate-500">FLOOR {s.floor}</td>
                                <td className="p-2 pr-4 text-right text-slate-300 font-bold">
                                  {s.incidents > 0 ? `${s.incidents} ASG` : "IDLE"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2 — INCIDENTS TABLE & CAD */}
          {view === 'incidents' && (
            <div className="h-full flex flex-col p-4 lg:p-6 overflow-hidden relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="SEARCH INCIDENT TELEMETRY..." 
                      className="bg-[#141920] border border-[#1e2840] text-slate-200 placeholder-slate-600 text-xs font-mono px-3 py-1.5 rounded-sm w-64 pl-8 focus:outline-none focus:border-[#2a3550]"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button 
                    onClick={handleExportData}
                    disabled={exporting}
                    className="border border-[#1e2840] hover:bg-[#141920] text-slate-300 hover:text-white text-xs font-mono px-3 py-1.5 rounded-sm tracking-wider flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    {exporting ? (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{exporting ? 'EXPORTING...' : 'EXPORT'}</span>
                  </button>
                  <button 
                    onClick={() => setNewIncidentModalOpen(true)}
                    className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-mono px-4 py-1.5 rounded-sm font-bold tracking-wider transition"
                  >
                    NEW INCIDENT
                  </button>
                </div>
              </div>

              {/* Main Table wrapper */}
              <div className="flex-1 bg-[#0e1117] border border-[#1e2840] rounded-sm overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto custom-scrollbar">
                  {screenSize === 'mobile' ? (
                    <div className="flex-1 overflow-y-auto space-y-3 p-3">
                      {incidents.map(inc => {
                        const TypeIcon = ICON_MAP[inc.type] || AlertTriangle;
                        const severityColors = COLORS[inc.severity.toUpperCase()] || COLORS.LOW;
                        return (
                          <div 
                            key={inc.id} 
                            onClick={() => setSelectedIncidentId(inc.id)}
                            style={{
                              borderLeft: `3px solid ${severityColors.text}`,
                              backgroundColor: getCardBg(inc.severity)
                            }}
                            className="p-3 border border-[#1e2840]/30 flex flex-col space-y-2 cursor-pointer hover:brightness-110"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[10px] font-bold" style={{ color: severityColors.text }}>
                                {inc.id} · {inc.severity.toUpperCase()}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500">F{inc.floor} · RM {inc.room}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-200">{inc.type}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{inc.description}</div>
                            <div className="flex justify-between items-center pt-2 border-t border-[#1e2840]/20">
                              {renderStatusPill(inc.status)}
                              <span className="font-mono text-[10px] text-slate-500">⏱ {formatElapsed(inc.elapsed)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <table className="table-fixed w-full min-w-[900px] text-left font-mono text-xs">
                      <thead className="bg-[#080a0f] border-b border-[#1e2840] text-slate-600 text-[10px] uppercase tracking-widest font-black sticky top-0 z-10">
                        <tr className="h-9">
                          <th className="px-4 w-[100px]">ID</th>
                          <th className="px-4 w-[130px]">TYPE</th>
                          <th className="px-4 w-[80px]">LOCATION</th>
                          <th className="px-4 w-[90px]">SEVERITY</th>
                          <th className="px-4 w-[110px]">STATUS</th>
                          <th className="px-4 w-[100px]">CREATION</th>
                          <th className="px-4 w-[110px]">RESPONDER</th>
                          <th className="px-4 w-[80px]">ELAPSED</th>
                          <th className="px-4 w-[60px] text-center">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2840]">
                        {incidents.map((inc, i) => {
                          const isSelected = selectedIncidentId === inc.id;
                          const TypeIcon = ICON_MAP[inc.type] || AlertTriangle;
                          const severityColors = COLORS[inc.severity.toUpperCase()] || COLORS.LOW;
                          
                          return (
                            <tr 
                              key={inc.id} 
                              onClick={() => setSelectedIncidentId(inc.id)}
                              className={`h-11 transition-all cursor-pointer ${
                                i % 2 === 0 ? 'bg-[#0e1117]' : 'bg-[#141920]/40'
                              } ${
                                isSelected ? 'bg-[#1a0808] border-l-2 border-red-600' : 'hover:bg-[#1a2130]'
                              }`}
                            >
                              <td className="px-4 font-bold text-slate-300">{inc.id}</td>
                              <td className="px-4 font-sans font-bold text-slate-200">
                                <div className="flex items-center space-x-2">
                                  <TypeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: severityColors.text }} />
                                  <span className="truncate">{inc.type}</span>
                                </div>
                              </td>
                              <td className="px-4 text-slate-400">F{inc.floor} R{inc.room}</td>
                              <td className="px-4">
                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ color: severityColors.text, backgroundColor: severityColors.bg, border: `1px solid ${severityColors.border}` }}>
                                  {inc.severity}
                                </span>
                              </td>
                              <td className="px-4">
                                {renderStatusPill(inc.status)}
                              </td>
                              <td className="px-4 text-slate-500">{inc.created_at.split('T')[1].slice(0, 8)}</td>
                              <td className="px-4 text-slate-300 truncate font-bold">
                                {inc.responder_id ? staff.find(s => s.id === inc.responder_id)?.name : "UNASSIGNED"}
                              </td>
                              <td className={`px-4 font-bold ${inc.elapsed > 240 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                ⏱ {formatElapsed(inc.elapsed)}
                              </td>
                              <td className="px-4 text-center">
                                <button className="text-[#3b82f6] hover:text-white transition uppercase font-black text-[10px]">
                                  CAD
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Detail drawer on Desktop */}
              {selectedIncidentId && screenSize !== 'mobile' && (
                <div className="absolute top-0 right-0 w-[480px] h-full bg-[#111318] shadow-2xl border-l border-[#1e2840] z-50 flex flex-col">
                  <IncidentDetailPanelContent 
                    incId={selectedIncidentId} 
                    incidents={incidents} 
                    staff={staff}
                    onClose={() => setSelectedIncidentId(null)}
                    onUpdate={handleResolveIncident}
                    onAssign={handleManualAssign}
                    aiDrafting={aiDrafting}
                    commsInput={commsInput}
                    setCommsInput={setCommsInput}
                    onAiDraft={handleAiCommsDraft}
                    onSendComms={handleSendComms}
                    addToast={addToast}
                    screenSize={screenSize}
                  />
                </div>
              )}
            </div>
          )}

          {/* VIEW 3 — RESPONDERS ROSTER & BOARD */}
          {view === 'responders' && (
            <div className="h-full flex flex-col lg:flex-row p-4 lg:p-6 gap-6 overflow-hidden">
              
              {screenSize === 'mobile' && (
                <div className="flex border-b border-[#1e2840] shrink-0 mb-2">
                  {[
                    { id: 'roster', label: 'ROSTER' },
                    { id: 'dispatch', label: 'DISPATCH' },
                    { id: 'profile', label: 'PROFILE' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setRespondersSubTab(tab.id)}
                      className={`flex-1 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                        respondersSubTab === tab.id ? 'text-red-500 border-b-2 border-red-500 bg-[#1a0808]/30' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Col 1: Roster */}
              {(screenSize !== 'mobile' || respondersSubTab === 'roster') && (
                <div className="flex-1 lg:w-[40%] bg-[#0e1117] border border-[#1e2840] rounded-sm flex flex-col min-h-0">
                  <div className="h-10 px-4 bg-[#080a0f] border-b border-[#1e2840] flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-black">
                      STAFF ROSTER MANAGEMENT
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e2840] custom-scrollbar">
                    {staff.map(s => {
                      const activeAssigned = incidents.find(i => i.responder_id === s.id && !['RESOLVED','CLOSED'].includes(i.status));
                      const isSelected = selectedStaffId === s.id;
                      let dotColor = 'bg-slate-600';
                      if (s.status === 'available') dotColor = 'bg-green-500';
                      if (s.status === 'responding') dotColor = 'bg-orange-500';
                      if (s.status === 'non_responsive') dotColor = 'bg-yellow-500';

                      return (
                        <div 
                          key={s.id} 
                          onClick={() => {
                            setSelectedStaffId(s.id);
                            if (screenSize === 'mobile') setRespondersSubTab('profile');
                          }}
                          className={`p-4 flex justify-between items-center hover:bg-[#141920] cursor-pointer transition ${
                            isSelected ? 'bg-red-950/20 border-l-2 border-red-600' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#141920] border border-[#1e2840] flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                              {s.initials}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-200">{s.name}</div>
                              <div className="text-xs text-slate-500 font-mono">{s.role} · FLOOR {s.floor}</div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.certs.map(c => {
                                  const isExpired = s.certExpired?.includes(c);
                                  return (
                                    <span 
                                      key={c} 
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                                        isExpired ? 'bg-red-900/40 text-red-400 border border-red-900' : 'bg-[#141920] text-slate-300 border border-[#1e2840]'
                                      }`}
                                    >
                                      {c} {isExpired && " (EXPIRED)"}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-1.5">
                              <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">{s.status.replace('_', ' ')}</span>
                            </div>
                            {activeAssigned && (
                              <span className="text-[9px] font-mono text-red-500 font-black bg-red-900/10 border border-red-900 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                STRAIN · {activeAssigned.id}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Col 2: Dispatch Board */}
              {(screenSize !== 'mobile' || respondersSubTab === 'dispatch') && (
                <div className="flex-1 lg:w-[30%] bg-[#0e1117] border border-[#1e2840] rounded-sm flex flex-col min-h-0 relative">
                  <div className="h-10 px-4 bg-[#080a0f] border-b border-[#1e2840] flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-500 font-black">
                      DISPATCH BOARD
                    </span>
                    <button 
                      onClick={handleAutoDispatch}
                      disabled={unassignedLoading}
                      className="bg-[#2563eb] hover:bg-blue-700 text-white text-[10px] font-mono font-black px-3 py-1 rounded-sm uppercase tracking-wider flex items-center space-x-1"
                    >
                      {unassignedLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Navigation className="w-3 h-3" />
                      )}
                      <span>{unassignedLoading ? 'RUNNING...' : 'AUTO-DISPATCH'}</span>
                    </button>
                  </div>

                  {unassignedLoading && (
                    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center p-6 text-center animate-pulse">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2563eb] mb-4" />
                      <div className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                        ARIA AUTO-DISPATCH ACTIVE INSTRUCTIONS...
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {dispatchCompleteMsg && (
                      <div className="p-3 bg-green-950/20 border border-green-900 text-[#22c55e] text-xs font-mono uppercase rounded-sm mb-2">
                        {dispatchCompleteMsg}
                      </div>
                    )}

                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
                      UNASSIGNED INCIDENTS ({incidents.filter(i => !i.responder_id && !['RESOLVED','CLOSED'].includes(i.status)).length})
                    </div>

                    {incidents.filter(i => !i.responder_id && !['RESOLVED','CLOSED'].includes(i.status)).map(inc => {
                      const elapsedExceeded = inc.elapsed > 300;
                      return (
                        <div key={inc.id} className="p-3 bg-[#141920] border border-[#1e2840] rounded-sm relative">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono font-bold text-white">{inc.id}</span>
                            <span className="text-[9px] font-mono font-bold text-red-500 bg-red-900/10 px-1.5 py-0.5 rounded-sm">
                              {inc.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-300">{inc.type}</div>
                          <div className="text-xs text-slate-500 font-mono mt-1">FLOOR {inc.floor} · RM {inc.room}</div>
                          
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#1e2840]/40">
                            <span className={`text-[10px] font-mono font-bold ${elapsedExceeded ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                              ⏱ {formatElapsed(inc.elapsed)}
                            </span>
                            <select 
                              onChange={(e) => {
                                  if (e.target.value) {
                                    handleManualAssign(inc.id, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                              className="bg-[#0e1117] border border-[#1e2840] text-slate-300 text-[10px] font-mono rounded-sm px-2 py-1 focus:outline-none focus:border-[#2a3550] cursor-pointer"
                              defaultValue=""
                            >
                              <option value="" disabled>QUICK ASSIGN</option>
                              {staff.filter(s => s.status === 'available').map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Col 3: Staff Detail & History */}
              {(screenSize !== 'mobile' || respondersSubTab === 'profile') && (() => {
                const activeStaff = staff.find(s => s.id === selectedStaffId) || staff[0];
                return (
                  <div className="flex-1 lg:w-[30%] bg-[#0e1117] border border-[#1e2840] rounded-sm flex flex-col p-6 items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#141920] border-2 border-blue-600/30 flex items-center justify-center text-xl font-bold font-mono text-slate-200 mb-3 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
                      {activeStaff.initials}
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">{activeStaff.name}</h3>
                    <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">{activeStaff.role} · {activeStaff.id.toUpperCase()}</p>

                    <div className="w-full bg-[#080a0f] border border-[#1e2840] rounded-sm p-4 text-left space-y-2 mt-4 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">SHIFT:</span>
                        <span className="text-slate-300">08:00 - 20:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">HOURS ON DUTY:</span>
                        <span className="text-slate-300">6.8 hrs</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">BREAK STATUS:</span>
                        <span className="text-yellow-500 font-bold">DUE 15:30</span>
                      </div>
                    </div>

                    <div className="w-full border-t border-[#1e2840] mt-4 pt-4 text-left">
                      <div className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-widest mb-2">
                        ACTIVE INCIDENT WORK HISTORY
                      </div>
                      <div className="space-y-2">
                        {incidents.filter(i => i.responder_id === activeStaff.id).slice(0, 3).map(inc => (
                          <div key={inc.id} className="p-2 bg-[#141920] border border-[#1e2840] rounded-sm flex justify-between items-center font-mono text-[10px]">
                            <div>
                              <div className="font-bold text-slate-300">{inc.id}</div>
                              <div className="text-slate-500 truncate">{inc.type}</div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-green-500">{inc.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW 4 — COMMUNICATIONS CHANNELS */}
          {view === 'comms' && (
            <div className="h-full flex divide-x divide-[#1e2840] overflow-hidden">
              
              {/* Left Comms Panel: Conversation List */}
              {(!commsMobileShowWorkspace || screenSize !== 'mobile') && (
                <div className="w-full md:w-80 bg-[#0e1117] flex flex-col shrink-0 h-full">
                  <div className="h-10 border-b border-[#1e2840] flex items-center justify-around font-mono text-[10px] font-black tracking-widest uppercase">
                    <button 
                      onClick={() => setCommsTab('guest')}
                      className={`pb-1 flex items-center transition ${commsTab === 'guest' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      GUEST SOS
                    </button>
                    <button 
                      onClick={() => setCommsTab('staff')}
                      className={`pb-1 flex items-center transition ${commsTab === 'staff' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      STAFF CHANNEL
                    </button>
                    <button 
                      onClick={() => setCommsTab('assistant')}
                      className={`pb-1 flex items-center transition ${commsTab === 'assistant' ? 'text-red-500 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      AI CO-PILOT
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-[#1e2840]/30 custom-scrollbar">
                    {commsTab === 'guest' ? (
                      incidents.filter(i => i.guest).map(inc => {
                        const isSelected = activeConvId === inc.id;
                        const lastMsg = inc.guest_comms[inc.guest_comms.length - 1]?.text || "No active messages";
                        return (
                          <div 
                            key={inc.id}
                            onClick={() => {
                              setActiveConvId(inc.id);
                              if (screenSize === 'mobile') setCommsMobileShowWorkspace(true);
                            }}
                            className={`p-4 cursor-pointer transition relative ${
                              isSelected ? 'bg-[#1a0808] border-l-2 border-red-600' : 'hover:bg-[#141920]'
                            }`}
                          >
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-bold text-xs text-slate-200 font-mono">
                                RM {inc.room} · {inc.guest?.name} {inc.guest?.flag}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">LIVE</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{lastMsg}</div>
                          </div>
                        );
                      })
                    ) : commsTab === 'staff' ? (
                      <div 
                        onClick={() => { if (screenSize === 'mobile') setCommsMobileShowWorkspace(true); }}
                        className="p-4 space-y-3 font-mono text-xs cursor-pointer hover:bg-[#141920] transition"
                      >
                        <div className="text-slate-500 font-bold uppercase mb-2">ACTIVE OPERATIONAL CHANNELS</div>
                        <div className="p-3 bg-[#1a0808] border border-red-900 rounded-sm text-slate-200">
                          <div>#SECURITY-ALERT</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {staffMessages[staffMessages.length - 1]?.sender.split(' ')[0]}: "{staffMessages[staffMessages.length - 1]?.text}"
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => { if (screenSize === 'mobile') setCommsMobileShowWorkspace(true); }}
                        className="p-4 space-y-3 font-mono text-xs cursor-pointer hover:bg-[#141920] transition"
                      >
                        <div className="text-slate-500 font-bold uppercase mb-2">ARIA AI ASSISTANT SYSTEM</div>
                        <div className="p-3 bg-[#100a1a] border border-[#281240] rounded-sm text-slate-200">
                          <div>ARIA v2.5</div>
                          <div className="text-[10px] text-purple-400 mt-1">Status: Operational</div>
                          <div className="text-[9px] text-slate-500 mt-1">Ready to assist with triage & emergency protocols.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Right Comms Panel: Conversational Workspace */}
              {(commsMobileShowWorkspace || screenSize !== 'mobile') && (
                <div className="flex-1 flex flex-col h-full bg-[#080a0f]">
                  {commsTab === 'guest' ? (
                    <div className="flex-1 flex flex-col bg-[#080a0f] relative min-w-0 h-full">
                      {(() => {
                        const inc = incidents.find(i => i.id === activeConvId);
                        if (!inc) return <div className="m-auto text-xs font-mono text-slate-500">SELECT SECURE SOS CHANNEL</div>;
                        return (
                          <>
                            <div className="h-12 border-b border-[#1e2840] bg-[#0e1117] flex items-center justify-between px-4 shrink-0">
                              <div className="font-mono text-xs font-bold text-white flex items-center space-x-2">
                                {screenSize === 'mobile' && (
                                  <button 
                                    onClick={() => setCommsMobileShowWorkspace(false)}
                                    className="bg-[#141920] border border-[#1e2840] text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-sm mr-2"
                                  >
                                    ← BACK
                                  </button>
                                )}
                                <span>{inc.guest?.name} (ROOM {inc.room})</span>
                                <span className="hidden sm:inline text-[10px] text-slate-500 font-black">LANG: {inc.guest?.language.toUpperCase()} · CHECK-IN: {inc.guest?.checkin}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="hidden sm:inline text-[10px] font-mono text-slate-500 font-black">TRANSLATE GUEST COMMS</span>
                                <button 
                                  onClick={() => setCommsTranslateOn(!commsTranslateOn)}
                                  className={`w-9 h-4.5 rounded-full relative transition ${
                                    commsTranslateOn ? 'bg-[#2563eb]' : 'bg-[#1e2840]'
                                  }`}
                                >
                                  <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
                                    commsTranslateOn ? 'left-5' : 'left-0.5'
                                  }`}></span>
                                </button>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                              {inc.guest_comms.map((m, idx) => {
                                const isOp = m.sender === 'operator';
                                const isSys = m.sender === 'system';
                                return (
                                  <div key={idx} className={`flex ${isSys ? 'justify-center' : isOp ? 'justify-end' : 'justify-start'}`}>
                                    {isSys ? (
                                      <div className="bg-[#100a1a] border border-[#281240] text-[#8b5cf6] text-[10px] font-mono px-3 py-1 rounded-sm italic">
                                        {m.text}
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{
                                          background: isOp ? '#1a0808' : '#141920',
                                          border: isOp ? '1px solid #3d1212' : '1px solid #1e2840',
                                          padding: '8px 10px', fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0',
                                          borderRadius: isOp ? '8px 2px 2px 8px' : '2px 8px 8px 2px', maxWidth: '100%'
                                        }}>
                                          {m.text}
                                        </div>
                                        {!isOp && commsTranslateOn && m.translated && (
                                          <div style={{ color: '#334155', fontSize: '10px', fontStyle: 'italic', marginTop: '2px', paddingLeft: '2px' }}>
                                            [{m.lang?.toUpperCase() || "JA"} → EN] {m.translated}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="p-4 bg-[#0e1117] border-t border-[#1e2840] flex space-x-2 items-center shrink-0">
                              <button 
                                onClick={() => handleAiCommsDraft(inc.id)}
                                disabled={aiDrafting}
                                className="bg-purple-900/20 border border-purple-500/30 text-purple-400 text-[10px] font-mono font-black h-10 px-3 rounded-sm uppercase tracking-wider shrink-0 flex items-center space-x-1 hover:bg-purple-900/40 transition"
                              >
                                {aiDrafting ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <span>AI ASSIST ✦</span>
                                )}
                              </button>
                              <input 
                                type="text" 
                                value={commsInput}
                                onChange={(e) => setCommsInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendComms(inc.id); }}
                                placeholder={aiDrafting ? "ARIA is drafting..." : "TYPE SECURE EMERGENCY DISPATCH RESPONSE..."}
                                className="flex-1 bg-[#080a0f] border border-[#1e2840] text-slate-200 placeholder-slate-600 text-xs font-mono h-10 px-3 rounded-sm focus:outline-none focus:border-[#2a3550]"
                              />
                              <button 
                                onClick={() => handleSendComms(inc.id)}
                                className="bg-[#dc2626] text-white w-10 h-10 rounded-sm flex items-center justify-center shrink-0 hover:bg-[#b91c1c] transition"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : commsTab === 'staff' ? (
                    <div className="flex-1 flex flex-col bg-[#080a0f] relative min-w-0 h-full">
                      <div className="h-12 border-b border-[#1e2840] bg-[#0e1117] flex items-center justify-between px-6 shrink-0">
                        <div className="font-mono text-xs font-bold text-white flex items-center">
                          {screenSize === 'mobile' && (
                            <button 
                              onClick={() => setCommsMobileShowWorkspace(false)}
                              className="bg-[#141920] border border-[#1e2840] text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-sm mr-2"
                            >
                              ← BACK
                            </button>
                          )}
                          <span>#SECURITY-ALERT (6 STAFF ON-LINE)</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {staffMessages.map((m, idx) => (
                          <div key={idx} className="flex justify-start">
                            <div className="bg-[#141920] border border-[#1e2840] p-3 rounded-sm font-mono text-xs text-slate-200 max-w-[75%]">
                              <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">
                                {m.sender} · {m.time}
                              </div>
                              <div>{m.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-[#0e1117] border-t border-[#1e2840] flex space-x-2 items-center shrink-0">
                        <input 
                          type="text" 
                          value={staffCommsInput}
                          onChange={(e) => setStaffCommsInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSendStaffMessage(); }}
                          placeholder="TYPE BROADCAST TO ALL SECURITY STAFF..."
                          className="flex-1 bg-[#080a0f] border border-[#1e2840] text-slate-200 placeholder-slate-600 text-xs font-mono h-10 px-3 rounded-sm focus:outline-none focus:border-[#2a3550]"
                        />
                        <button 
                          onClick={handleSendStaffMessage}
                          className="bg-[#dc2626] text-white w-10 h-10 rounded-sm flex items-center justify-center shrink-0 hover:bg-[#b91c1c] transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col bg-[#080a0f] relative min-w-0 h-full">
                      <div className="h-12 border-b border-[#1e2840] bg-[#0e1117] flex items-center justify-between px-6 shrink-0">
                        <div className="font-mono text-xs font-bold text-purple-400 flex items-center">
                          {screenSize === 'mobile' && (
                            <button 
                              onClick={() => setCommsMobileShowWorkspace(false)}
                              className="bg-[#141920] border border-[#1e2840] text-slate-400 text-[10px] font-mono px-2 py-0.5 rounded-sm mr-2"
                            >
                              ← BACK
                            </button>
                          )}
                          <span>ARIA EMERGENCY AI CO-PILOT</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {assistantMessages.map((m, idx) => {
                          const isAi = m.sender === 'ARIA AI';
                          return (
                            <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                              <div style={{
                                background: isAi ? '#100a1a' : '#1a0808',
                                border: isAi ? '1px solid #281240' : '1px solid #3d1212',
                                padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', color: isAi ? '#c4b5fd' : '#f1f5f9',
                                borderRadius: '4px', maxWidth: '75%'
                              }}>
                                <div className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-1">
                                  {m.sender} · {m.time}
                                </div>
                                <div>{m.text}</div>
                              </div>
                            </div>
                          );
                        })}
                        {assistantLoading && (
                          <div className="flex justify-start">
                            <div className="bg-[#100a1a] border border-[#281240] p-3 rounded-sm font-mono text-xs text-purple-400 max-w-[70%] animate-pulse">
                              ARIA is analyzing query and crafting response...
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-[#0e1117] border-t border-[#1e2840] flex space-x-2 items-center shrink-0">
                        <input 
                          type="text" 
                          value={assistantInput}
                          onChange={(e) => setAssistantInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSendAssistantMessage(); }}
                          placeholder="ASK ARIA SECURITY ADVICE OR PROTOCOLS..."
                          className="flex-1 bg-[#080a0f] border border-[#1e2840] text-slate-200 placeholder-slate-600 text-xs font-mono h-10 px-3 rounded-sm focus:outline-none focus:border-[#2a3550]"
                          disabled={assistantLoading}
                        />
                        <button 
                          onClick={handleSendAssistantMessage}
                          disabled={assistantLoading}
                          className="bg-[#dc2626] text-white w-10 h-10 rounded-sm flex items-center justify-center shrink-0 hover:bg-[#b91c1c] transition disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 5 — ANALYTICS AND AI EXECUTIVE REPORT */}
          {view === 'analytics' && (
            <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
              
              {/* KPI metrics row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Avg Response Time", val: "3.8 min", delta: "▼ 11.6% vs yesterday", isGood: true },
                  { label: "Incidents Today", val: "23", delta: "▲ 9.5% vs yesterday", isGood: false },
                  { label: "Resolution Rate", val: "87.4%", delta: "▲ 3.9% vs yesterday", isGood: true },
                  { label: "Current Active", val: `${activeCount}`, delta: "LIVE ACTIVE COUNTER", isGood: true }
                ].map((k, idx) => (
                  <div key={idx} className="bg-[#0e1117] border border-[#1e2840] p-4 rounded-sm flex flex-col justify-between" style={{ borderRadius: 0 }}>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1">
                      {k.label}
                    </div>
                    <div className="text-xl font-bold text-slate-100">{k.val}</div>
                    <div className={`text-[9px] font-mono font-bold mt-2 ${k.isGood ? 'text-green-500' : 'text-red-500'}`}>
                      {k.delta}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bar Chart */}
                <div className="bg-[#0e1117] border border-[#1e2840] p-4 rounded-sm flex flex-col h-72">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-4">
                    INCIDENT VOLUME BY TYPE — LAST 7 DAYS
                  </span>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={WEEKLY_DATA}>
                        <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                        <XAxis dataKey="day" {...CHART_STYLE.xAxis} />
                        <YAxis {...CHART_STYLE.yAxis} />
                        <RTooltip {...CHART_STYLE.tooltip} />
                        <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                        <Bar dataKey="medical" fill={TYPE_COLORS.medical} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="fire" fill={TYPE_COLORS.fire} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="security" fill={TYPE_COLORS.security} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="distress" fill={TYPE_COLORS.distress} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="maintenance" fill={TYPE_COLORS.maintenance} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart */}
                <div className="bg-[#0e1117] border border-[#1e2840] p-4 rounded-sm flex flex-col h-72">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-4">
                    RESPONSE TIME TREND (TARGET vs ACTUAL)
                  </span>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={RESPONSE_TIME_DATA}>
                        <CartesianGrid {...CHART_STYLE.cartesianGrid} />
                        <XAxis dataKey="day" {...CHART_STYLE.xAxis} />
                        <YAxis {...CHART_STYLE.yAxis} />
                        <RTooltip {...CHART_STYLE.tooltip} />
                        <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="target" stroke="#334155" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Row 4 AI Report Builder */}
              <div className="bg-[#0e1117] border border-[#1e2840] p-6 rounded-sm">
                <div className="flex justify-between items-center pb-4 border-b border-[#1e2840] mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-300 font-black">
                      EXECUTIVE SUMMARY safety REPORT
                    </span>
                    <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950/20 border border-purple-900 px-2 py-0.5 rounded-sm">
                      AI-GENERATED
                    </span>
                  </div>
                  <button 
                    onClick={async () => {
                      const repDiv = document.getElementById("ai-report-box");
                      repDiv.innerHTML = "<div class='flex items-center space-x-1.5 py-4'><span class='w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse'></span><span class='w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse delay-75'></span><span class='w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse delay-150'></span></div>";
                      const textRep = await callClaudeAPI(
                        "You are a professional safety executive. Write a detailed 3-paragraph safety assessment on hotel operations based on analytics.",
                        "Generate safety executive operations analytics report.",
                        false
                      );
                      repDiv.innerHTML = `<div class="text-sm text-slate-300 leading-relaxed space-y-3 font-sans">${textRep.split('\n\n').map(p => `<p>${p}</p>`).join('')}</div>`;
                    }}
                    className="bg-purple-900/20 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold px-4 py-2 rounded-sm uppercase tracking-wider hover:bg-purple-900/40"
                  >
                    GENERATE REPORT
                  </button>
                </div>

                <div id="ai-report-box" className="p-4 bg-[#080a0f] border border-[#1e2840] rounded-sm min-h-[140px] flex items-center justify-center text-xs font-mono text-slate-500 uppercase tracking-widest">
                  CLICK GENERATE TO RUN REAL TIME AI CRITICAL TELEMETRY REPORT
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- FIXED SYSTEM FOOTER (Desktop only) --- */}
        <div style={{
          position: 'fixed', bottom: 0, left: screenSize === 'tablet' ? '64px' : '220px', right: 0, height: '20px', 
          background: '#080a0f', borderTop: '1px solid #1e2840',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: '24px', zIndex: 50
        }} className="hidden md:flex">
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e2840' }}>CRISISYNC v2.4.1</span>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e2840' }}>GRAND HYATT BKK · PROPERTY ID: GHB-044</span>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e2840' }}>LAST SYNC: <span id="sync-timer">0.0</span>s AGO</span>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#1e2840' }}>SESSION: OPS-MGR-01 · TLS 1.3</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }}/>
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#166534' }}>ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>

      {/* --- OVERLAY MODALS --- */}
      {broadcastModalOpen && (
        <BroadcastModal onClose={() => setBroadcastModalOpen(false)} addToast={addToast} staffCount={staff.length} callClaudeAPI={callClaudeAPI} />
      )}

      {newIncidentModalOpen && (
        <NewIncidentModal onClose={() => setNewIncidentModalOpen(false)} onSave={(inc) => setIncidents(prev => [inc, ...prev])} callClaudeAPI={callClaudeAPI} />
      )}

      {/* Mobile Sliding Bottom Sheet */}
      {screenSize === 'mobile' && selectedIncidentId && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: '85vh',
          background: '#0e1117',
          borderTop: '2px solid #1e2840',
          borderRadius: '12px 12px 0 0',
          zIndex: 200,
          overflowY: 'auto'
        }}>
          <div 
            onClick={() => setSelectedIncidentId(null)}
            style={{
              width: '36px', height: '4px', background: '#334155',
              borderRadius: '2px', margin: '12px auto 16px', cursor: 'pointer'
            }}
          />
          <IncidentDetailPanelContent 
            incId={selectedIncidentId} 
            incidents={incidents} 
            staff={staff}
            onClose={() => setSelectedIncidentId(null)}
            onUpdate={handleResolveIncident}
            onAssign={handleManualAssign}
            aiDrafting={aiDrafting}
            commsInput={commsInput}
            setCommsInput={setCommsInput}
            onAiDraft={handleAiCommsDraft}
            onSendComms={handleSendComms}
            addToast={addToast}
            screenSize={screenSize}
          />
        </div>
      )}

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR */}
      {screenSize === 'mobile' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '56px',
          background: '#0e1117', borderTop: '1px solid #1e2840',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          zIndex: 150, paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
          {[
            { id: 'map', icon: MapIcon, label: 'MAP' },
            { id: 'incidents', icon: AlertTriangle, label: 'INCIDENTS' },
            { id: 'responders', icon: Users, label: 'STAFF' },
            { id: 'comms', icon: MessageSquare, label: 'COMMS' },
            { id: 'analytics', icon: BarChart2, label: 'ANALYTICS' }
          ].map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-full transition-all ${
                  isActive ? 'text-red-500 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-[9px] font-mono tracking-wider mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TOAST SYSTEM CONTAINER */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => {
          let borderCol = 'border-blue-500';
          let bgCol = 'bg-[#0a0d1a]';
          let textColor = 'text-[#8b5cf6]';
          if (t.type === 'CRITICAL') { borderCol = 'border-red-600'; bgCol = 'bg-[#1a0808]'; textColor = 'text-[#ef4444]'; }
          if (t.type === 'WARNING') { borderCol = 'border-yellow-500'; bgCol = 'bg-[#1a1608]'; textColor = 'text-[#eab308]'; }
          if (t.type === 'SUCCESS') { borderCol = 'border-green-500'; bgCol = 'bg-[#081a0e]'; textColor = 'text-[#22c55e]'; }

          return (
            <div 
              key={t.id} 
              className={`p-3 rounded-sm shadow-2xl border-l-4 flex items-start space-x-3 pointer-events-auto transform transition-all duration-300 translate-x-0 ${bgCol} ${borderCol}`}
            >
              <AlertCircle className="w-5 h-5 shrink-0" style={{ color: textColor }} />
              <div className="flex-1 font-mono text-xs">
                <div className="font-bold uppercase tracking-wider text-slate-100">{t.title}</div>
                <div className="text-slate-400 mt-1">{t.body}</div>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                className="text-slate-500 hover:text-slate-300 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function IncidentDetailPanelContent({ 
  incId, incidents, staff, onClose, onUpdate, onAssign, 
  aiDrafting, commsInput, setCommsInput, onAiDraft, onSendComms, addToast, screenSize
}) {
  const [panelSectionOpen, setPanelSectionOpen] = useState({
    header: true, location: true, triage: true, timeline: true, evidence: true, responder: true, comms: true
  });

  const inc = incidents.find(i => i.id === incId);
  if (!inc) return null;

  const severityColors = COLORS[inc.severity.toUpperCase()] || COLORS.LOW;

  const toggleSection = (sec) => {
    setPanelSectionOpen(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const isResolved = inc.status === 'RESOLVED' || inc.status === 'CLOSED';

  return (
    <div className="flex flex-col h-full bg-[#111318]">
      <div 
        className="p-4 border-b flex justify-between items-start shrink-0"
        style={{ borderTop: `4px solid ${severityColors.text}`, backgroundColor: severityColors.bg }}
      >
        <div>
          <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase block mb-1">
            INCIDENT WORKSPACE
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-white">{inc.id}</span>
            <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm" style={{ color: severityColors.text, backgroundColor: severityColors.bg, border: `1px solid ${severityColors.border}` }}>
              {inc.severity}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        
        {/* Section 1: HEADER & OVERVIEW */}
        <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
          <button onClick={() => toggleSection('header')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
            <span>1. INCIDENT HEADER OVERVIEW</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.header ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.header && (
            <div className="p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-slate-500">TYPE:</span><span className="text-slate-200 font-bold">{inc.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">STATUS:</span><span className="text-slate-200 font-bold">{inc.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">INGEST SOURCE:</span><span className="text-slate-200">{inc.source}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">CREATION TIMESTAMP:</span><span className="text-slate-200">{inc.created_at.replace('T', ' ').slice(0, 19)}</span></div>
              <div className="pt-2 border-t border-[#1e2840]/50 text-slate-400 italic">
                "{inc.description}"
              </div>
            </div>
          )}
        </div>

        {/* Section 2: LOCATION */}
        <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
          <button onClick={() => toggleSection('location')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
            <span>2. SPATIAL GEOMETRY LOCATION</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.location ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.location && (
            <div className="p-3 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">FLOOR:</span> <span className="text-slate-200">{inc.floor}</span></div>
                <div><span className="text-slate-500">ZONE:</span> <span className="text-slate-200">{inc.zone}</span></div>
                <div><span className="text-slate-500">ROOM:</span> <span className="text-slate-200">{inc.room}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: AI TRIAGE */}
        <div className="border border-purple-900 bg-purple-950/10 rounded-sm">
          <button onClick={() => toggleSection('triage')} className="w-full px-3 py-2 flex items-center justify-between border-b border-purple-900 text-purple-400 font-mono text-[10px] font-black uppercase">
            <span>3. AUTOMATED AI TRIAGE INTELLIGENCE</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.triage ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.triage && (
            <div className="p-3">
              {(() => {
                if (inc.ai_status === 'triaging') {
                  return (
                    <div style={{ border: '1px solid #2d1a5e', background: '#0d0a1a', padding: '12px', fontFamily: 'monospace' }}>
                      <div style={{ color: '#7c3aed', fontSize: '10px', marginBottom: '8px' }}>ARIA · PROCESSING</div>
                      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)', animation: 'scan 1.2s ease-in-out infinite', marginBottom: '8px' }}/>
                      <div style={{ color: '#4c1d95', fontSize: '10px' }}>Analyzing incident parameters...</div>
                      <div style={{ height: '8px', background: '#1a1030', borderRadius: '1px', margin: '6px 0', width: '80%', animation: 'pulse 1.5s infinite' }}/>
                      <div style={{ height: '8px', background: '#1a1030', borderRadius: '1px', margin: '6px 0', width: '60%', animation: 'pulse 1.5s infinite 0.2s' }}/>
                    </div>
                  );
                } else if (inc.ai_triage) {
                  const confidence = inc.ai_triage.confidence || 0.85;
                  const confidenceColor = confidence >= 0.85 ? '#22c55e' : confidence >= 0.65 ? '#f59e0b' : '#ef4444';
                  const actions = inc.ai_triage.immediate_actions || [];
                  const escalate_911 = inc.ai_triage.escalate_911;
                  const escalation_reason = inc.ai_triage.escalation_reason || "Critical threat pattern detected";
                  const reasoning = inc.ai_triage.reasoning || "Standard operational response.";

                  return (
                    <div style={{ border: '1px solid #2d1a5e', background: '#0d0a1a', padding: '12px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#8b5cf6', fontSize: '10px' }}>ARIA · CLASSIFICATION</span>
                        <span style={{ color: '#4c1d95', fontSize: '10px' }}>{inc.created_at.split('T')[1].slice(0, 8)}</span>
                      </div>
                      <div style={{ color: '#c4b5fd', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>{inc.ai_triage.classification}</div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ color: '#6d28d9', fontSize: '9px', width: '60px' }}>CONFIDENCE</span>
                        <div style={{ flex: 1, height: '3px', background: '#1a1030' }}>
                          <div style={{ height: '100%', background: confidenceColor, width: `${confidence * 100}%`, transition: 'width 1s ease' }}/>
                        </div>
                        <span style={{ color: confidenceColor, fontSize: '10px', fontWeight: '700' }}>{(confidence * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div style={{ color: '#7c3aed', fontSize: '9px', marginBottom: '4px' }}>IMMEDIATE ACTIONS</div>
                      {actions.map((a, i) => (
                        <div key={i} style={{ color: '#a78bfa', fontSize: '10px', padding: '2px 0', borderBottom: '1px solid #1a1030' }}>
                          <span style={{ color: '#4c1d95', marginRight: '6px' }}>{i + 1}.</span>{a}
                        </div>
                      ))}
                      
                      {escalate_911 && (
                        <div style={{ background: '#1a0808', border: '1px solid #7f1d1d', padding: '6px 8px', marginTop: '8px', color: '#ef4444', fontSize: '10px', fontWeight: '700' }}>
                          ⚠ 911 ESCALATION RECOMMENDED · {escalation_reason}
                        </div>
                      )}
                      
                      <div style={{ color: '#4c1d95', fontSize: '9px', marginTop: '8px', fontStyle: 'italic', borderTop: '1px solid #1a1030', paddingTop: '6px' }}>
                        {reasoning}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div style={{ border: '1px solid #334155', background: '#0e1117', padding: '12px', fontFamily: 'monospace' }}>
                      <div style={{ color: '#475569', fontSize: '10px' }}>ARIA · OFFLINE · MANUAL REVIEW REQUIRED</div>
                      <div style={{ color: '#334155', fontSize: '9px', marginTop: '4px' }}>Triage engine unavailable. Assign severity and responders manually.</div>
                    </div>
                  );
                }
              })()}
            </div>
          )}
        </div>

        {/* Section 4: TIMELINE */}
        <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
          <button onClick={() => toggleSection('timeline')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
            <span>4. RESPONSE LIFECYCLE TIMELINE</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.timeline ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.timeline && (
            <div className="p-3 font-mono text-[10px] space-y-3">
              {inc.timeline.map((item, idx) => {
                let dotCol = 'bg-slate-500';
                if (item.type === 'ai') dotCol = 'bg-purple-500';
                if (item.type === 'human') dotCol = 'bg-blue-500';
                if (item.type === 'responder') dotCol = 'bg-green-500';

                return (
                  <div key={idx} className="flex space-x-3 relative">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotCol}`}></span>
                    <div>
                      <div className="text-slate-400 font-bold">{item.time} · {item.actor}</div>
                      <div className="text-slate-500">{item.action}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 5: EVIDENCE GALLERY */}
        <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
          <button onClick={() => toggleSection('evidence')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
            <span>5. REAL TIME TELEMETRY EVIDENCE</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.evidence ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.evidence && (
            <div className="p-3 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold">LIVE CAM FEED FRAME</span>
                  <svg viewBox="0 0 160 100" className="w-full h-24 rounded border border-[#1e2840] bg-[#080a0f]">
                    <rect width="160" height="100" fill="#080a0f" />
                    <line x1="10" y1="80" x2="150" y2="80" stroke="#1e2840" />
                    <circle cx="80" cy="50" r="10" fill="none" stroke="#2a3550" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="10" y="20" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="black" className="animate-pulse">● FEED SECURE</text>
                  </svg>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 font-bold">METRIC TELEMETRY</div>
                  {inc.evidence?.map((ev, i) => (
                    <div key={i} className="p-2 bg-[#141920] border border-[#1e2840] rounded-sm text-[10px]">
                      <div className="font-bold text-slate-300">{ev.label}</div>
                      <div className="text-slate-500">TIME: {ev.time}</div>
                      <div className="text-slate-500">CONF: {Math.round(ev.confidence * 100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 6: RESPONDER SPECIFICS */}
        <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
          <button onClick={() => toggleSection('responder')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
            <span>6. ASSIGNED RESPONDER DETAILS</span>
            <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.responder ? '' : '-rotate-90'}`} />
          </button>
          {panelSectionOpen.responder && (
            <div className="p-3 space-y-3 font-mono text-xs">
              {inc.responder_id ? (
                (() => {
                  const s = staff.find(st => st.id === inc.responder_id);
                  if (!s) return null;
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#141920] border border-[#1e2840] flex items-center justify-center font-bold text-[10px] text-slate-300">
                          {s.initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.role}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-3">
                  <div className="text-red-500 font-bold uppercase tracking-wider text-[11px]">
                    No Responder Dispatched
                  </div>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssign(inc.id, e.target.value);
                      }
                    }}
                    className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 text-xs rounded-sm p-2 focus:outline-none focus:border-[#2a3550] cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>SELECT FROM ROSTER...</option>
                    {staff.filter(s => s.status === 'available').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 7: GUEST COMMUNICATIONS CHAT */}
        {inc.guest && (
          <div className="border border-[#1e2840] bg-[#0e1117] rounded-sm">
            <button onClick={() => toggleSection('comms')} className="w-full px-3 py-2 flex items-center justify-between border-b border-[#1e2840] text-slate-400 font-mono text-[10px] font-black uppercase">
              <span>7. DIRECT SECURE SOS COMMS CHAT</span>
              <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${panelSectionOpen.comms ? '' : '-rotate-90'}`} />
            </button>
            {panelSectionOpen.comms && (
              <div className="p-3 space-y-3">
                <div className="h-40 overflow-y-auto space-y-2 border border-[#1e2840] bg-[#080a0f] p-2 rounded-sm custom-scrollbar">
                  {inc.guest_comms.map((m, idx) => {
                    const isOp = m.sender === 'operator';
                    const isSys = m.sender === 'system';
                    return (
                      <div key={idx} className={`flex ${isSys ? 'justify-center' : isOp ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded-sm font-mono text-[10px] max-w-[80%] ${
                          isSys 
                            ? 'bg-purple-950/20 text-purple-400 border border-purple-900/30 italic' 
                            : isOp 
                              ? 'bg-[#1a0808] border border-[#3d1212] text-[#f1f5f9]' 
                              : 'bg-[#141920] border border-[#1e2840] text-slate-200'
                        }`}>
                          <div className="text-[8px] text-slate-500 font-black tracking-widest uppercase mb-0.5">{m.sender}</div>
                          <div>{m.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => onAiDraft(inc.id)}
                    disabled={aiDrafting}
                    className="bg-purple-900/20 border border-purple-500/30 text-purple-400 text-[10px] font-mono font-black h-8 px-2 rounded-sm uppercase tracking-wider shrink-0 flex items-center"
                  >
                    AI DRAFT
                  </button>
                  <input 
                    type="text" 
                    value={commsInput}
                    onChange={(e) => setCommsInput(e.target.value)}
                    placeholder="TYPE DIRECT SOS RESPONSE..."
                    className="flex-1 bg-[#080a0f] border border-[#1e2840] text-slate-200 placeholder-slate-600 text-[10px] font-mono h-8 px-2 rounded-sm focus:outline-none focus:border-[#2a3550]"
                  />
                  <button 
                    onClick={() => onSendComms(inc.id)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-sm flex items-center justify-center shrink-0 hover:bg-red-700 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0e1117] border-t border-[#1e2840] space-y-3 shrink-0">
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={() => {
              if (window.confirm("CONFIRM SIREN ALARM POLICE DISPATCH REQUEST?")) {
                addToast("EMS AUTHORITIES DISPATCHED", "EMS and local security reinforcements triggered.", "CRITICAL");
              }
            }}
            disabled={isResolved}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-[10px] font-mono font-black py-2 rounded-sm transition uppercase disabled:opacity-50"
          >
            ESCALATE
          </button>
          <button 
            onClick={() => onUpdate(inc.id)}
            disabled={isResolved}
            className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-mono font-black py-2 rounded-sm transition uppercase disabled:opacity-50"
          >
            RESOLVE
          </button>
          <button 
            onClick={() => {
              addToast("CAD CLOSED", `CAD Incident ${inc.id} closed completely.`, "SUCCESS");
              onClose();
            }}
            className="bg-[#141920] hover:bg-[#1a2130] text-slate-400 py-2 rounded-sm text-[10px] font-mono font-black transition uppercase border border-[#1e2840]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function NewIncidentModal({ onClose, onSave, callClaudeAPI }) {
  const [type, setType] = useState('Medical Emergency');
  const [severity, setSeverity] = useState('Auto');
  const [floor, setFloor] = useState(1);
  const [room, setRoom] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const mockCreated = new Date().toISOString();
    const mockId = `INC-2024-0${Math.floor(898 + Math.random() * 100)}`;

    const sys = "You are ARIA, Chief Incident Safety Analyst. Return JSON ONLY matching schema exactly: {\"classification\":\"string\",\"confidence\":0.9,\"severity\":\"critical|high|medium|low\",\"recommended_responders\":[\"Security Lead\"],\"immediate_actions\":[\"Secure zone\"],\"escalate_911\":false,\"guest_message\":\"...\",\"reasoning\":\"...\"}";
    const userPrompt = `INCIDENT REPORT\nID: ${mockId}\nType: ${type}\nFloor: ${floor}\nRoom: ${room}\nDescription: ${desc}`;

    const triage = await callClaudeAPI(sys, userPrompt, true);

    const newItem = {
      id: mockId,
      type: type,
      floor: Number(floor),
      room: room,
      zone: "Guest Room",
      severity: severity === 'Auto' ? (triage.severity || 'medium') : severity.toLowerCase(),
      status: 'TRIAGED',
      description: desc,
      reporter: "Manual Operator CAD",
      responder_id: null,
      created_at: mockCreated,
      source: "Manual Entry Operator",
      elapsed: 0,
      guest: { name: "Guest User Override", language: "en", room: room, checkin: "2026-05-01", nationality: "International", flag: "🌐" },
      timeline: [
        { time: new Date().toLocaleTimeString([], { hour12: false }), actor: "Operator", type: "human", action: "CAD incident initiated manually." },
        { time: new Date().toLocaleTimeString([], { hour12: false }), actor: "ARIA", type: "ai", action: "Triage classification complete." }
      ],
      ai_triage: triage,
      evidence: [],
      guest_comms: [
        { sender: "system", text: triage.guest_message || "We are responding to assist you shortly.", time: new Date().toLocaleTimeString([], { hour12: false }) }
      ]
    };

    onSave(newItem);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0e1117] border border-[#2a3550] w-full max-w-lg rounded-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 bg-[#080a0f] border-b border-[#1e2840] flex justify-between items-center">
          <span className="text-xs font-black tracking-widest text-slate-300">REPORT NEW INCIDENT CAD</span>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block mb-1">TYPE:</span>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-2 focus:outline-none focus:border-[#2a3550]">
                {Object.keys(ICON_MAP).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">SEVERITY OVERRIDE:</span>
              <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-2 focus:outline-none focus:border-[#2a3550]">
                <option>Auto</option>
                <option>CRITICAL</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-500 block mb-1">FLOOR (1-20):</span>
              <input type="number" min="1" max="20" value={floor} onChange={e => setFloor(e.target.value)} className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-2 focus:outline-none focus:border-[#2a3550]" />
            </div>
            <div>
              <span className="text-slate-500 block mb-1">ROOM / AREA NUMBER:</span>
              <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 714" className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-2 focus:outline-none focus:border-[#2a3550]" />
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">RAW DESCRIPTION LOG:</span>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Type raw log details..." className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-2 h-24 resize-none focus:outline-none focus:border-[#2a3550]"></textarea>
          </div>
        </div>

        <div className="p-4 bg-[#080a0f] border-t border-[#1e2840] flex justify-end space-x-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white transition text-xs">
            CANCEL
          </button>
          <button 
            onClick={handleSubmit}
            disabled={submitting || !desc.trim()}
            className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-5 py-2 rounded-sm font-bold text-xs tracking-wider transition disabled:opacity-50 flex items-center space-x-1"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
            <span>{submitting ? 'TRIAGING...' : 'SUBMIT & TRIAGE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({ onClose, addToast, staffCount, callClaudeAPI }) {
  const [desc, setDesc] = useState('');
  const [preview, setPreview] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateAlert = async () => {
    setGenerating(true);
    const sys = "You are ARIA, Chief Communications Liaison. Generate a concise, highly professional emergency staff broadcast under 35 words. Output ONLY the raw broadcast string without formatting.";
    const resp = await callClaudeAPI(sys, desc, false);
    setPreview(resp.replace(/^["']|["']$/g, '').trim());
    setGenerating(false);
  };

  const handleSendBroadcast = () => {
    addToast("BROADCAST TRANSMITTED", `Emergency alert broadcast dispatched to all ${staffCount} on-duty responders.`, "CRITICAL");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-[#0e1117] border border-[#1e2840] border-t-2 border-t-[#ef4444] w-full max-w-lg rounded-sm shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 bg-[#130808] border-b border-[#1e2840] flex justify-between items-center">
          <span className="text-xs font-black tracking-widest text-[#ef4444] flex items-center gap-2">
            ⚠ EMERGENCY BROADCAST
          </span>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            [✕]
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <div className="text-slate-500 font-bold">RECIPIENTS: ALL ON-DUTY STAFF ({staffCount})  ·  PROPERTY-WIDE</div>
          
          <div>
            <span className="text-slate-400 block mb-1">SITUATION DESCRIPTION</span>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)}
              placeholder="Describe the situation in plain text..." 
              className="w-full bg-[#141920] border border-[#1e2840] text-slate-200 rounded-sm p-3 h-20 resize-none focus:outline-none focus:border-[#ef4444]"
            />
            <div className="flex justify-end mt-1">
              <button 
                onClick={handleGenerateAlert}
                disabled={generating || !desc.trim()}
                className="text-purple-400 hover:text-purple-300 font-bold"
              >
                [AI GENERATE]
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">GENERATED MESSAGE PREVIEW</span>
            <div className="bg-[#141920] border border-[#1e2840] p-3 rounded-sm font-mono text-xs min-h-[60px] text-slate-300">
              {generating ? (
                <span className="animate-pulse">Generating...</span>
              ) : preview ? (
                <>
                  <div>[BROADCAST · {new Date().toLocaleTimeString([], { hour12: false })}]</div>
                  <div className="mt-1">{preview}</div>
                  <div className="text-right text-[10px] text-slate-500 mt-2">{preview.split(/\s+/).filter(Boolean).length} words</div>
                </>
              ) : (
                <span className="text-slate-600">Pending input description...</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#080a0f] border-t border-[#1e2840] flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-white transition">
            [CANCEL]
          </button>
          <button 
            onClick={handleSendBroadcast}
            disabled={!preview.trim()}
            className="bg-[#ef4444] hover:bg-red-700 text-white px-6 py-2 rounded-sm font-bold tracking-widest uppercase transition disabled:opacity-50"
          >
            CONFIRM BROADCAST
          </button>
        </div>
      </div>
    </div>
  );
}
