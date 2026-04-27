import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Map as MapIcon, AlertTriangle, Users, MessageSquare, BarChart2, 
  Shield, Bell, Heart, Flame, AlertCircle, Wrench, Eye,
  Search, Filter, ChevronDown, CheckCircle, Clock, Plus, Download,
  User, Award, List, Send, MapPin, X, Loader2, Navigation,
  MessageCircle, Activity, Thermometer, PhoneCall, Radio, Camera, Mic
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

// --- CONSTANTS & THEME ---
const COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  DETECTED: '#6b7280',
  TRIAGED: '#a855f7',
  DISPATCHED: '#3b82f6',
  EN_ROUTE: '#f97316',
  ON_SCENE: '#ef4444',
  RESOLVED: '#22c55e',
  CLOSED: '#4b5563'
};

const SEVERITY_ORDER = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };

const ICON_MAP = {
  'Medical Emergency': Heart,
  'Fire Alarm': Flame,
  'Security Threat': Shield,
  'Guest Distress': AlertCircle,
  'Maintenance': Wrench,
  'Suspicious Activity': Eye
};

// --- MOCK DATA ---
const INITIAL_INCIDENTS = [
  {
    id: 'INC-001', type: 'Medical Emergency', severity: 'CRITICAL', status: 'ON_SCENE',
    location: { floor: 7, room: '714', lat: 300, lng: 200 },
    description: 'Guest unresponsive, called by housekeeping', reportedAt: Date.now() - 14 * 60000,
    elapsed: 14 * 60,
    responderId: 'STF-001',
    ai_triage: { classification: 'Cardiac/Unresponsive', confidence: 0.98, severity: 'CRITICAL', recommended_responders: ['First Aid', 'Security'], immediate_actions: ['Secure area', 'Perform CPR', 'Call 911'], escalate_911: true, guest_message: 'Emergency teams are on scene.', reasoning: 'Unresponsive guest implies critical life threat requiring immediate medical intervention.' },
    timeline: [
      { state: 'DETECTED', actor: 'Housekeeping (Voice)', timestamp: Date.now() - 14 * 60000, note: 'Initial report' },
      { state: 'TRIAGED', actor: 'System AI', timestamp: Date.now() - 13.5 * 60000, note: 'Triage complete. 911 Escalation advised.' },
      { state: 'DISPATCHED', actor: 'System Auto', timestamp: Date.now() - 13 * 60000, note: 'Dispatched James Chen' },
      { state: 'ON_SCENE', actor: 'James Chen', timestamp: Date.now() - 9 * 60000, note: 'Arrived at room 714' }
    ],
    evidence: [{ type: 'audio', url: 'audio-1.mp3' }], guest_comms: []
  },
  {
    id: 'INC-002', type: 'Fire Alarm', severity: 'HIGH', status: 'DISPATCHED',
    location: { floor: 12, room: '1204', lat: 400, lng: 150 },
    description: 'Smoke detector triggered, no visible smoke confirmed', reportedAt: Date.now() - 3 * 60000,
    elapsed: 3 * 60,
    responderId: 'STF-002',
    ai_triage: { classification: 'Sensor Alert', confidence: 0.85, severity: 'HIGH', recommended_responders: ['Fire Warden'], immediate_actions: ['Check panel', 'Dispatch Warden', 'Prepare evac broadcast'], escalate_911: false, guest_message: 'We are investigating an alarm in your area. Please stand by.', reasoning: 'Detector triggered but no secondary confirmation of fire. High priority investigation.' },
    timeline: [
      { state: 'DETECTED', actor: 'IoT Sensor F12', timestamp: Date.now() - 3 * 60000, note: 'Smoke detector 1204-A triggered' },
      { state: 'DISPATCHED', actor: 'System Auto', timestamp: Date.now() - 2.5 * 60000, note: 'Dispatched Maria Santos' }
    ],
    evidence: [], guest_comms: []
  },
  {
    id: 'INC-003', type: 'Security Threat', severity: 'HIGH', status: 'EN_ROUTE',
    location: { floor: 3, room: 'Lobby Bar', lat: 500, lng: 300 },
    description: 'Aggressive intoxicated guest refusing to leave', reportedAt: Date.now() - 8 * 60000,
    elapsed: 8 * 60,
    responderId: 'STF-003',
    ai_triage: { classification: 'Hostile Individual', confidence: 0.92, severity: 'HIGH', recommended_responders: ['Security'], immediate_actions: ['Isolate guest', 'Deploy security duo', 'Monitor CCTV'], escalate_911: false, guest_message: '', reasoning: 'Aggressive behavior poses immediate risk to staff and other guests.' },
    timeline: [
      { state: 'DETECTED', actor: 'Bartender', timestamp: Date.now() - 8 * 60000, note: 'Panic button pressed' },
      { state: 'EN_ROUTE', actor: 'David Kim', timestamp: Date.now() - 2 * 60000, note: 'Responding from Ground floor' }
    ],
    evidence: [{ type: 'cctv', url: 'cam-3-bar.jpg' }], guest_comms: []
  },
  {
    id: 'INC-004', type: 'Guest Distress', severity: 'MEDIUM', status: 'DISPATCHED',
    location: { floor: 9, room: '923', lat: 200, lng: 100 },
    description: 'Guest locked out, highly distressed, possible panic attack', reportedAt: Date.now() - 5 * 60000,
    elapsed: 5 * 60,
    responderId: 'STF-004',
    ai_triage: { classification: 'Medical/Emotional Distress', confidence: 0.75, severity: 'MEDIUM', recommended_responders: ['First Aid', 'Duty Manager'], immediate_actions: ['Dispatch staff', 'Provide water', 'Calm guest'], escalate_911: false, guest_message: 'A manager is on the way to assist you with your door.', reasoning: 'Distress implies need for human de-escalation, no immediate life threat.' },
    timeline: [
      { state: 'DETECTED', actor: 'Guest App', timestamp: Date.now() - 5 * 60000, note: 'SOS feature used via App' }
    ],
    evidence: [], guest_comms: []
  },
  {
    id: 'INC-005', type: 'Suspicious Activity', severity: 'MEDIUM', status: 'TRIAGED',
    location: { floor: 2, room: 'Corridor B', lat: 350, lng: 400 },
    description: 'Unidentified person tailgating through staff door', reportedAt: Date.now() - 2 * 60000,
    elapsed: 2 * 60,
    responderId: null,
    ai_triage: { classification: 'Breach of Secure Area', confidence: 0.88, severity: 'MEDIUM', recommended_responders: ['Security'], immediate_actions: ['Review corridor cameras', 'Dispatch security sweep'], escalate_911: false, guest_message: '', reasoning: 'Unauthorized access detected in staff zone.' },
    timeline: [
      { state: 'DETECTED', actor: 'CCTV AI', timestamp: Date.now() - 2 * 60000, note: 'Tailgating pattern recognized' }
    ],
    evidence: [{ type: 'cctv', url: 'cam-2-door.jpg' }], guest_comms: []
  },
  {
    id: 'INC-006', type: 'Maintenance', severity: 'LOW', status: 'DETECTED',
    location: { floor: 5, room: '512', lat: 150, lng: 150 },
    description: 'Water leak from bathroom ceiling, guest complained', reportedAt: Date.now() - 1 * 60000,
    elapsed: 1 * 60,
    responderId: null,
    ai_triage: { classification: 'Facility Issue', confidence: 0.99, severity: 'LOW', recommended_responders: ['Maintenance'], immediate_actions: ['Dispatch plumber', 'Move guest'], escalate_911: false, guest_message: 'We apologize. Engineering is on the way to fix the leak.', reasoning: 'Standard property damage scenario.' },
    timeline: [
      { state: 'DETECTED', actor: 'Front Desk', timestamp: Date.now() - 1 * 60000, note: 'Guest call logged' }
    ],
    evidence: [], guest_comms: []
  },
  {
    id: 'INC-007', type: 'Guest Distress', severity: 'LOW', status: 'RESOLVED',
    location: { floor: 11, room: '1108', lat: 600, lng: 200 },
    description: 'Guest reporting noise complaint, becoming verbally aggressive', reportedAt: Date.now() - 45 * 60000,
    elapsed: 45 * 60,
    responderId: 'STF-001',
    ai_triage: { classification: 'Noise Complaint', confidence: 0.90, severity: 'LOW', recommended_responders: ['Security'], immediate_actions: ['Investigate noise', 'Warn offending room'], escalate_911: false, guest_message: '', reasoning: 'Routine noise issue.' },
    timeline: [
      { state: 'RESOLVED', actor: 'James Chen', timestamp: Date.now() - 10 * 60000, note: 'Noise reduced, guest calmed' }
    ],
    evidence: [], guest_comms: []
  },
  {
    id: 'INC-008', type: 'Medical Emergency', severity: 'CRITICAL', status: 'DISPATCHED',
    location: { floor: 1, room: 'Spa Reception', lat: 400, lng: 500 },
    description: 'Guest collapsed at spa entrance, CPR possibly required', reportedAt: Date.now() - 2 * 60000,
    elapsed: 2 * 60,
    responderId: 'STF-002',
    ai_triage: { classification: 'Cardiac Event', confidence: 0.96, severity: 'CRITICAL', recommended_responders: ['First Aid', 'AED Carrier'], immediate_actions: ['Bring AED', 'Start CPR', 'Call 911'], escalate_911: true, guest_message: 'Medical team dispatched.', reasoning: 'Collapse implies severe medical event.' },
    timeline: [
      { state: 'DETECTED', actor: 'Spa Staff', timestamp: Date.now() - 2 * 60000, note: 'Frantic call received' }
    ],
    evidence: [], guest_comms: []
  }
];

const INITIAL_STAFF = [
  { id: 'STF-001', name: 'James Chen', role: 'Security Lead', certs: ['Security', 'First Aid'], floor: 7, status: 'Responding', lastSeen: Date.now() - 10000 },
  { id: 'STF-002', name: 'Maria Santos', role: 'Fire Warden', certs: ['Fire Warden', 'First Aid', 'AED'], floor: 12, status: 'Responding', lastSeen: Date.now() - 5000 },
  { id: 'STF-003', name: 'David Kim', role: 'Security', certs: ['Security'], floor: 3, status: 'Responding', lastSeen: Date.now() - 15000 },
  { id: 'STF-004', name: 'Sarah Lee', role: 'Front Desk Mgr', certs: ['First Aid'], floor: 9, status: 'Responding', lastSeen: Date.now() - 8000 },
  { id: 'STF-005', name: 'Michael Torres', role: 'Security', certs: ['Security', 'AED'], floor: 1, status: 'Available', lastSeen: Date.now() - 2000 },
  { id: 'STF-006', name: 'Priya Nair', role: 'Duty Manager', certs: ['First Aid', 'Fire Warden', 'AED'], floor: 6, status: 'Available', lastSeen: Date.now() - 12000 }
];

const INITIAL_CONVERSATIONS = [
  { id: 'CONV-001', type: 'guest', name: 'Room 714', language: 'ja', initialMsg: '助けてください！', messages: [
    { sender: 'guest', text: '助けてください！', translated: 'Help me please!', time: Date.now() - 15*60000 },
    { sender: 'system', text: 'Emergency teams are on scene.', time: Date.now() - 14*60000 },
    { sender: 'guest', text: '彼は息をしていません', translated: 'He is not breathing.', time: Date.now() - 13*60000 }
  ]},
  { id: 'CONV-002', type: 'guest', name: 'Room 923', language: 'en', initialMsg: 'Where is help?!', messages: [
    { sender: 'guest', text: 'I am locked out and having a panic attack. Please hurry.', time: Date.now() - 5*60000 },
    { sender: 'system', text: 'A manager is on the way to assist you with your door. Please try to take slow breaths.', time: Date.now() - 4.5*60000 },
    { sender: 'guest', text: 'Where is help?!', time: Date.now() - 1*60000 }
  ]},
  { id: 'CONV-003', type: 'guest', name: 'Room 1204', language: 'en', initialMsg: 'Should we evacuate?', messages: [
    { sender: 'system', text: 'We are investigating an alarm in your area. Please stand by.', time: Date.now() - 3*60000 },
    { sender: 'guest', text: 'I hear the alarm, should we evacuate?', time: Date.now() - 1*60000 }
  ]},
  { id: 'CONV-004', type: 'staff', name: 'Staff Channel', initialMsg: 'All units hold.', messages: [
    { sender: 'system', text: 'Alert: Critical Medical Emergency at Spa Reception.', time: Date.now() - 2*60000 },
    { sender: 'operator', text: 'All units hold, Maria is responding to the Spa.', time: Date.now() - 1.5*60000 }
  ]}
];

const ANALYTICS_DATA = {
  incidentsByType: [
    { name: 'Medical', count: 12 }, { name: 'Fire', count: 3 }, 
    { name: 'Security', count: 18 }, { name: 'Distress', count: 24 }, 
    { name: 'Maintenance', count: 45 }
  ],
  responseTime: [
    { day: 'Mon', actual: 4.2, target: 4.0 }, { day: 'Tue', actual: 3.8, target: 4.0 },
    { day: 'Wed', actual: 5.1, target: 4.0 }, { day: 'Thu', actual: 4.5, target: 4.0 },
    { day: 'Fri', actual: 3.2, target: 4.0 }, { day: 'Sat', actual: 7.8, target: 4.0 },
    { day: 'Sun', actual: 4.1, target: 4.0 }
  ],
  severityDist: [
    { name: 'Critical', value: 5, color: COLORS.CRITICAL },
    { name: 'High', value: 15, color: COLORS.HIGH },
    { name: 'Medium', value: 35, color: COLORS.MEDIUM },
    { name: 'Low', value: 45, color: COLORS.LOW }
  ],
  floorDist: [
    { floor: 'F1', count: 20 }, { floor: 'F2', count: 8 }, { floor: 'F3', count: 15 },
    { floor: 'F4', count: 4 }, { floor: 'F5', count: 10 }, { floor: 'F6', count: 5 },
    { floor: 'F7', count: 12 }, { floor: 'F8', count: 3 }, { floor: 'F9', count: 9 },
    { floor: 'F10', count: 6 }, { floor: 'F11', count: 4 }, { floor: 'F12', count: 8 }
  ]
};

// --- HELPER APIs ---
const callGeminiAPI = async (systemPrompt, userPrompt, expectJson = false) => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: expectJson ? "application/json" : "text/plain"
        }
      })
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    if (expectJson) {
      try {
        let cleaned = text.replace(/```(?:json)?/gi, '').trim();
        return JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("JSON Parse Error:", parseErr, "Raw Text:", text);
        return { error: true, parsed: false };
      }
    }
    return text;
  } catch (error) {
    console.error("AI API Error:", error);
    if (expectJson) return { error: true, reason: error.message };
    return "Error connecting to AI service: " + error.message;
  }
};
const callClaudeAPI = callGeminiAPI;

const formatTimeElapsed = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
};

// --- MAIN COMPONENTS ---
export default function CrisisSync() {
  const [view, setView] = useState('map');
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [toasts, setToasts] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Modals & Panels State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [newIncidentModalOpen, setNewIncidentModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  
  // Real-time Simulation
  useEffect(() => {
    const secTimer = setInterval(() => {
      setCurrentTime(new Date());
      setIncidents(prev => prev.map(inc => {
        if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return inc;
        return { ...inc, elapsed: inc.elapsed + 1 };
      }));
    }, 1000);

    const advanceTimer = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (Math.random() > 0.8) {
          if (inc.status === 'DETECTED') return { ...inc, status: 'TRIAGED', timeline: [{ state: 'TRIAGED', actor: 'System Auto', timestamp: Date.now(), note: 'Advanced state' }, ...inc.timeline] };
          if (inc.status === 'DISPATCHED') return { ...inc, status: 'EN_ROUTE', timeline: [{ state: 'EN_ROUTE', actor: 'Responder Update', timestamp: Date.now(), note: 'Moving to location' }, ...inc.timeline] };
          if (inc.status === 'EN_ROUTE') return { ...inc, status: 'ON_SCENE', timeline: [{ state: 'ON_SCENE', actor: 'Responder Update', timestamp: Date.now(), note: 'Arrived at scene' }, ...inc.timeline] };
        }
        return inc;
      }));
    }, 20000);

    const incidentPool = [
      { type: 'Maintenance', sev: 'LOW', desc: 'Broken glass in corridor', f: 4, r: 'Corridor A' },
      { type: 'Guest Distress', sev: 'MEDIUM', desc: 'Lost child near pool', f: 1, r: 'Pool Area' },
      { type: 'Suspicious Activity', sev: 'MEDIUM', desc: 'Unattended baggage', f: 1, r: 'Lobby' }
    ];
    
    const creationTimer = setInterval(() => {
      if (Math.random() > 0.5) {
        const tpl = incidentPool[Math.floor(Math.random() * incidentPool.length)];
        const newInc = {
          id: `INC-${Math.floor(100 + Math.random() * 900)}`,
          type: tpl.type, severity: tpl.sev, status: 'DETECTED',
          location: { floor: tpl.f, room: tpl.r, lat: 200 + Math.random() * 400, lng: 100 + Math.random() * 300 },
          description: tpl.desc, reportedAt: Date.now(), elapsed: 0,
          responderId: null, timeline: [{ state: 'DETECTED', actor: 'System Auto', timestamp: Date.now(), note: 'Auto ingested' }], evidence: [], guest_comms: []
        };
        setIncidents(prev => [newInc, ...prev]);
        addToast(`New ${tpl.sev} incident reported`, tpl.sev === 'CRITICAL' || tpl.sev === 'HIGH' ? 'warning' : 'info');
      }
    }, 45000);

    return () => { clearInterval(secTimer); clearInterval(advanceTimer); clearInterval(creationTimer); };
  }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const updateIncidentStatus = (id, newStatus, actor = 'Operator', note = 'Status updated') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { 
          ...inc, 
          status: newStatus,
          timeline: [{ state: newStatus, actor, timestamp: Date.now(), note }, ...inc.timeline]
        };
      }
      return inc;
    }));
    addToast(`Incident ${id} marked as ${newStatus}`, 'success');
  };

  const assignResponder = (incidentId, staffId) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === incidentId ? { ...inc, responderId: staffId, status: 'DISPATCHED', timeline: [{ state: 'DISPATCHED', actor: 'Dispatcher', timestamp: Date.now(), note: `Dispatched ${staff.find(s=>s.id===staffId)?.name}` }, ...inc.timeline] } : inc
    ));
    setStaff(prev => prev.map(s => 
      s.id === staffId ? { ...s, status: 'Responding' } : s
    ));
    addToast(`Assigned staff to ${incidentId}`, 'success');
  };

  // --- DERIVED METRICS ---
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const activeCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

  const headerFlash = (criticalCount > 0 && Math.floor(currentTime.getTime() / 1000) % 2 === 0);

  return (
    <div className="flex h-screen w-full bg-[#0a0c10] text-gray-200 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[220px] bg-[#0d0f14] border-r border-[#1e2330] flex flex-col shrink-0 relative z-20">
        <div className="p-4 flex items-center space-x-3 border-b border-[#1e2330]">
          <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white">CrisisSync</span>
        </div>
        
        <nav className="flex-1 py-4 space-y-1">
          {[
            { id: 'map', icon: MapIcon, label: 'Live Map' },
            { id: 'incidents', icon: AlertTriangle, label: 'Incidents' },
            { id: 'responders', icon: Users, label: 'Responders' },
            { id: 'communications', icon: MessageSquare, label: 'Communications' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' }
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center px-4 py-3 space-x-3 text-sm font-medium transition-colors ${
                view === item.id 
                  ? 'bg-red-500/10 text-red-400 border-l-2 border-red-500' 
                  : 'text-gray-400 hover:bg-[#1a1d24] hover:text-gray-200 border-l-2 border-transparent'
              }`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1e2330] space-y-3 bg-[#0d0f14]">
          <div className="text-xl font-mono text-white text-center pb-2 border-b border-[#1e2330]/50 tracking-wider">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="text-xs text-gray-400 text-center font-medium">Grand Hyatt Bangkok</div>
          <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-green-500 bg-green-500/10 py-1.5 rounded-full border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* TOP HEADER */}
        <div className={`h-14 bg-[#0d0f14] border-b border-[#1e2330] flex items-center justify-between px-6 shrink-0 transition-colors duration-300 ${headerFlash ? 'bg-red-950/40' : ''}`}>
          <h1 className="text-lg font-semibold tracking-wide text-white uppercase">{view}</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <StatPill color="bg-red-500" label="CRITICAL" val={criticalCount} />
              <StatPill color="bg-orange-500" label="ACTIVE" val={activeCount} />
              <StatPill color="bg-green-500" label="RESOLVED TODAY" val={resolvedCount + 12} />
            </div>
            
            <div className="w-px h-6 bg-[#1e2330] mx-4" />

            <button onClick={() => setBroadcastModalOpen(true)} className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded font-bold text-xs tracking-wider transition-colors shadow-lg shadow-red-900/20">
              <Radio className="w-4 h-4" />
              <span>EMERGENCY BROADCAST</span>
            </button>
            
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d0f14]"></span>
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0c10]">
          {view === 'map' && <MapView incidents={incidents} staff={staff} onSelectIncident={setSelectedIncidentId} />}
          {view === 'incidents' && <IncidentsView incidents={incidents} staff={staff} onSelectIncident={setSelectedIncidentId} onNewIncident={() => setNewIncidentModalOpen(true)} />}
          {view === 'responders' && <RespondersView incidents={incidents} staff={staff} onAssign={assignResponder} addToast={addToast} setView={setView} />}
          {view === 'communications' && <CommunicationsView conversations={conversations} setConversations={setConversations} />}
          {view === 'analytics' && <AnalyticsView />}
        </div>
      </div>

      {/* TOAST SYSTEM */}
      <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2 pointer-events-none w-80">
        {toasts.map(t => (
          <div key={t.id} className={`p-4 rounded shadow-2xl border flex items-start space-x-3 bg-[#111318] pointer-events-auto shadow-black/50 transform transition-all duration-300 translate-x-0
            ${t.type === 'error' ? 'border-red-500' : t.type === 'warning' ? 'border-orange-500' : t.type === 'success' ? 'border-green-500' : 'border-blue-500'}`}>
            {t.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />}
            {t.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
            {t.type === 'info' && <Bell className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="text-sm font-medium text-gray-200">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* OVERLAYS */}
      {selectedIncidentId && (
        <IncidentDetailPanel 
          incident={incidents.find(i => i.id === selectedIncidentId)} 
          staff={staff}
          onClose={() => setSelectedIncidentId(null)}
          onUpdate={updateIncidentStatus}
          onAssign={assignResponder}
          addToast={addToast}
        />
      )}

      {broadcastModalOpen && (
        <BroadcastModal onClose={() => setBroadcastModalOpen(false)} addToast={addToast} staffCount={staff.length} />
      )}

      {newIncidentModalOpen && (
        <NewIncidentModal 
          onClose={() => setNewIncidentModalOpen(false)} 
          onSave={inc => { setIncidents([inc, ...incidents]); addToast('Incident created successfully', 'success'); }}
          staff={staff}
        />
      )}

    </div>
  );
}

// ===================== VIEWS =====================

function MapView({ incidents, staff, onSelectIncident }) {
  const [floor, setFloor] = useState(7);
  
  const activeInc = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').sort((a,b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const currentIncidents = activeInc.filter(i => i.location.floor === floor);
  
  return (
    <div className="h-full flex">
      {/* SVG Map Panel */}
      <div className="w-[60%] h-full border-r border-[#1e2330] relative flex flex-col bg-[#0a0c10]">
        <div className="p-4 flex items-center justify-between border-b border-[#1e2330] bg-[#111318]">
          <div className="flex space-x-2">
            {[1, 3, 7, 12].map(f => (
              <button key={f} onClick={() => setFloor(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${floor === f ? 'bg-blue-600 text-white' : 'bg-[#1a1d24] text-gray-400 hover:bg-[#222630]'}`}>
                Floor {f}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium text-gray-500">
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Incident</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>Staff</span>
          </div>
        </div>
        
        <div className="flex-1 relative p-6 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 800 600" className="w-[85%] h-[85%] max-w-4xl border border-[#1e2330]/50 rounded-lg bg-[#0e1015]">
            <rect x="0" y="0" width="800" height="600" fill="#0d0f14" />
            <rect x="40" y="250" width="720" height="100" fill="#151820" />
            <text x="400" y="305" fill="#4b5563" fontSize="24" fontWeight="bold" textAnchor="middle" letterSpacing="8">CORRIDOR - FLOOR {floor}</text>
            
            {/* Rooms Grid */}
            {Array.from({length: 10}).map((_, i) => (
              <g key={`top-${i}`}>
                <rect x={50 + i*70} y="50" width="60" height="200" fill="#111318" stroke="#1e2330" strokeWidth="2" />
                <text x={80 + i*70} y="150" fill="#4b5563" fontSize="14" textAnchor="middle" fontWeight="bold">{floor * 100 + i + 1}</text>
              </g>
            ))}
            {Array.from({length: 10}).map((_, i) => (
              <g key={`bot-${i}`}>
                <rect x={50 + i*70} y="350" width="60" height="200" fill="#111318" stroke="#1e2330" strokeWidth="2" />
                <text x={80 + i*70} y="450" fill="#4b5563" fontSize="14" textAnchor="middle" fontWeight="bold">{floor * 100 + 10 + i + 1}</text>
              </g>
            ))}

            <rect x="350" y="50" width="100" height="500" fill="#181a22" opacity="0.4" />
            <text x="400" y="280" fill="#6b7280" fontSize="12" textAnchor="middle">ELEVATOR LOBBY</text>

            {/* Incident Pins */}
            {currentIncidents.map(inc => {
              const Icon = ICON_MAP[inc.type] || AlertTriangle;
              return (
                <g key={inc.id} onClick={() => onSelectIncident(inc.id)} className="cursor-pointer">
                  <circle cx={inc.location.lat} cy={inc.location.lng} r="24" fill={COLORS[inc.severity]} opacity="0.2" className="animate-pulse" />
                  <circle cx={inc.location.lat} cy={inc.location.lng} r="8" fill={COLORS[inc.severity]} />
                </g>
              );
            })}

            {/* Staff Pins */}
            {staff.filter(s => s.floor === floor).map((s, i) => (
              <g key={s.id}>
                <circle cx={350 + i*30} cy={300} r="6" fill="#60a5fa" />
                <text x={350 + i*30} y={320} fill="#93c5fd" fontSize="10" textAnchor="middle">{s.name.split(' ').map(n=>n[0]).join('')}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Right List Panel */}
      <div className="w-[40%] flex flex-col relative h-full">
        {/* Active Incidents Block */}
        <div className="flex-1 flex flex-col min-h-[60%] border-b border-[#1e2330]">
          <div className="px-4 py-3 bg-[#111318] border-b border-[#1e2330] flex font-semibold text-sm justify-between">
            <span>ACTIVE INCIDENTS</span>
            <span className="text-gray-400">Sort: Severity</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0c10]">
            {activeInc.map(inc => (
              <div key={inc.id} className="bg-[#111318] border border-[#1e2330] rounded p-4 hover:border-gray-700 transition cursor-pointer" onClick={() => onSelectIncident(inc.id)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className="font-bold text-gray-200">{inc.type}</span>
                  </div>
                  <div className="text-xs font-mono text-gray-400 bg-[#1a1d24] px-2 py-1 rounded flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeElapsed(inc.elapsed)}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-3 space-y-1">
                  <div className="flex items-center"><MapPin className="w-3 h-3 mr-1.5 inline" /> F{inc.location.floor}, {inc.location.room}</div>
                  <div className="truncate">{inc.description}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <StatusPill status={inc.status} />
                  </div>
                  <div className="font-medium text-gray-300">
                    {inc.responderId ? staff.find(s=>s.id === inc.responderId)?.name : <span className="text-red-400">UNASSIGNED</span>}
                  </div>
                </div>
              </div>
            ))}
            {activeInc.length === 0 && <div className="text-center text-gray-500 py-10">No active incidents.</div>}
          </div>
        </div>

        {/* Staff on Duty Block */}
        <div className="shrink-0 h-[40%] flex flex-col">
          <div className="px-4 py-3 bg-[#111318] border-b border-[#1e2330] font-semibold text-sm">
            STAFF ON DUTY
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0c10] space-y-2">
             {staff.map(s => (
               <div key={s.id} className="flex items-center justify-between p-3 bg-[#111318] border border-[#1e2330] rounded">
                 <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1d24] flex items-center justify-center font-bold text-xs text-gray-300">
                      {s.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-200">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.role} &bull; F{s.floor}</div>
                    </div>
                 </div>
                 <div className={`text-xs font-semibold px-2 py-1 rounded ${s.status === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                   {s.status}
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentsView({ incidents, staff, onSelectIncident, onNewIncident }) {
  // Simple table 
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input type="text" placeholder="Search incidents..." className="bg-[#111318] border border-[#1e2330] rounded pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 w-64" />
          </div>
          <button className="flex items-center space-x-2 bg-[#111318] border border-[#1e2330] hover:bg-[#1a1d24] transition-colors rounded px-4 py-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Filter</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-[#111318] border border-[#1e2330] hover:bg-[#1a1d24] transition-colors rounded px-4 py-2 text-sm text-gray-300" onClick={() => {
            const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `crisisync-incidents-${new Date().toISOString().split('T')[0]}.json`; a.click();
          }}>
            <Download className="w-4 h-4" />
            <span>EXPORT</span>
          </button>
          <button onClick={onNewIncident} className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 transition-colors rounded px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-900/20">
            <Plus className="w-4 h-4" />
            <span>NEW INCIDENT</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#111318] border border-[#1e2330] rounded overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#161a22] border-b border-[#1e2330] text-gray-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Elapsed</th>
                <th className="px-6 py-4">Responder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {incidents.sort((a,b) => b.reportedAt - a.reportedAt).map(inc => (
                <tr key={inc.id} onClick={() => onSelectIncident(inc.id)} className="hover:bg-[#1a1d24] cursor-pointer transition-colors group">
                  <td className="px-6 py-4 font-mono text-gray-400">{inc.id}</td>
                  <td className="px-6 py-4 flex items-center space-x-2 font-medium text-gray-200">
                    {React.createElement(ICON_MAP[inc.type] || AlertTriangle, { className: 'w-4 h-4 text-gray-400 group-hover:text-white' })}
                    <span>{inc.type}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">F{inc.location.floor}, {inc.location.room}</td>
                  <td className="px-6 py-4"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-6 py-4"><StatusPill status={inc.status} /></td>
                  <td className="px-6 py-4 font-mono">{formatTimeElapsed(inc.elapsed)}</td>
                  <td className="px-6 py-4 text-gray-300">{inc.responderId ? staff.find(s=>s.id===inc.responderId)?.name : <span className="text-gray-600">-</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RespondersView({ incidents, staff, onAssign, addToast, setView }) {
  const [loading, setLoading] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id);
  const unassigned = incidents.filter(i => !i.responderId && i.status !== 'RESOLVED' && i.status !== 'CLOSED');

  const handleAutoDispatch = async () => {
    setLoading(true);
    const availableStaffStr = staff.filter(s => s.status === 'Available').map(s => `${s.id}: ${s.name} (${s.role}, Floor ${s.floor})`).join(', ');
    const promptsStr = unassigned.map(i => `${i.id}: ${i.type} on F${i.location.floor} (${i.severity})`).join('; ');
    
    if (!unassigned.length || !availableStaffStr) {
      addToast("No dispatch needed or no available staff", 'info');
      setLoading(false);
      return;
    }

    const sys = "You are a dispatcher. Match valid staff_id to incident_id based on role suitability and proximity. Return JSON array of objects: { incident_id: string, staff_id: string, reason: string }";
    const user = `Incidents: ${promptsStr}\nStaff: ${availableStaffStr}`;
    
    const res = await callClaudeAPI(sys, user, true);
    if (res && Array.isArray(res)) {
       res.forEach(assignment => {
         onAssign(assignment.incident_id, assignment.staff_id);
       });
       addToast(`Auto-dispatched ${res.length} incidents via AI`, 'success');
    } else {
       addToast(`AI Dispatch failed`, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex p-6 space-x-6">
      {/* Roster */}
      <div className="w-1/3 bg-[#111318] border border-[#1e2330] rounded flex flex-col">
        <div className="p-4 border-b border-[#1e2330] font-bold text-sm tracking-wide">STAFF ROSTER</div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e2330] p-2">
          {staff.map(s => (
            <div key={s.id} onClick={() => setSelectedStaffId(s.id)} className={`p-3 transition rounded cursor-pointer ${selectedStaffId === s.id ? 'bg-[#1a1d24] border-l-2 border-blue-500' : 'hover:bg-[#1a1d24] border-l-2 border-transparent'}`}>
              <div className="flex justify-between items-start">
                <div className="font-semibold">{s.name}</div>
                <div className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.status === 'Available' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{s.status}</div>
              </div>
              <div className="text-xs text-gray-400 mt-1">{s.role} &bull; Floor {s.floor}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {s.certs.map(c => <span key={c} className="text-[10px] bg-[#1e2330] text-gray-300 px-1.5 py-0.5 rounded border border-[#2a3040]">{c}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dispatch Center */}
      <div className="w-1/3 bg-[#111318] border border-[#1e2330] rounded flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="p-4 border-b border-[#1e2330] font-bold text-sm tracking-wide flex justify-between items-center">
          <span>DISPATCH CENTER</span>
          <button onClick={handleAutoDispatch} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 text-xs rounded font-bold transition flex items-center">
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Navigation className="w-3 h-3 mr-1" />}
            AUTO-DISPATCH
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {unassigned.length === 0 && <div className="text-gray-500 text-sm text-center mt-10">All active incidents have assigned responders.</div>}
          {unassigned.map(inc => (
            <div key={inc.id} className="border border-red-500/30 bg-red-500/5 rounded p-3">
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="font-bold text-gray-200">{inc.type}</div>
                <SeverityBadge severity={inc.severity} />
              </div>
              <div className="text-xs text-gray-400 mb-3">F{inc.location.floor}, {inc.location.room}</div>
              <select className="w-full bg-[#0a0c10] border border-[#1e2330] text-white text-xs p-2 rounded focus:outline-none focus:border-blue-500"
                 onChange={(e) => { if(e.target.value) onAssign(inc.id, e.target.value); e.target.value=""; }} defaultValue="">
                <option value="" disabled>Manual Assign...</option>
                {staff.filter(s => s.status === 'Available').map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Detail */}
      <div className="w-1/3 bg-[#111318] border border-[#1e2330] rounded flex flex-col items-center p-6 text-center">
        {(() => {
          const s = staff.find(st => st.id === selectedStaffId) || staff[0];
          if (!s) return null;
          const initials = s.name.split(' ').map(n=>n[0]).join('');
          const activeInc = incidents.find(i => i.responderId === s.id && i.status !== 'RESOLVED' && i.status !== 'CLOSED');
          return (
            <>
             <div className="w-20 h-20 rounded-full border-2 border-blue-500/50 bg-[#1a1d24] flex items-center justify-center text-2xl font-bold text-gray-400 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
               {initials}
             </div>
             <h2 className="text-xl font-bold text-white mb-1">{s.name}</h2>
             <p className="text-sm text-blue-400 font-medium mb-6">{s.role}</p>
             
             <div className="w-full bg-[#0a0c10] rounded border border-[#1e2330] p-4 text-left space-y-3">
               <div className="flex justify-between text-xs border-b border-[#1e2330] pb-2">
                 <span className="text-gray-500">Current Status</span>
                 <span className={`font-bold ${s.status === 'Available' ? 'text-green-400' : 'text-orange-400'}`}>
                   {s.status} {activeInc ? `- ${activeInc.id}` : ''}
                 </span>
               </div>
               <div className="flex justify-between text-xs border-b border-[#1e2330] pb-2">
                 <span className="text-gray-500">Last GPS Fix</span>
                 <span className="font-mono text-gray-300">Floor {s.floor} (Live)</span>
               </div>
               <div className="flex justify-between text-xs pb-1">
                 <span className="text-gray-500">Shift</span>
                 <span className="text-gray-300">08:00 - 20:00</span>
               </div>
             </div>

             <div className="mt-auto w-full">
               <button onClick={() => { addToast(`Opening secure channel with ${s.name}...`, 'info'); setView('communications'); }} className="w-full bg-[#1a1d24] hover:bg-[#222630] border border-[#1e2330] text-gray-300 rounded py-2 text-sm font-semibold transition flex items-center justify-center space-x-2">
                 <MessageCircle className="w-4 h-4" />
                 <span>DIRECT MESSAGE</span>
               </button>
             </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

function CommunicationsView({ conversations, setConversations }) {
  const [activeId, setActiveId] = useState(conversations[0]?.id);
  const [inputVal, setInputVal] = useState('');
  const [translate, setTranslate] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const activeConv = conversations.find(c => c.id === activeId);

  const handleSend = () => {
    if(!inputVal.trim()) return;
    const msg = { sender: 'operator', text: inputVal, time: Date.now() };
    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, msg]} : c));
    setInputVal('');
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    const history = activeConv.messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const sys = "You are drafting a professional reply for a hotel emergency operator to a guest or staff. Be concise, calm, and reassuring. Output ONLY the raw message text.";
    const res = await callClaudeAPI(sys, "Chat history:\n" + history + "\nDraft next response:");
    if (res && !res.error) setInputVal(res.replace(/"/g, '').trim());
    setAiLoading(false);
  };

  return (
    <div className="h-full flex divide-x divide-[#1e2330]">
      <div className="w-80 flex flex-col bg-[#111318]">
        <div className="p-4 border-b border-[#1e2330]">
          <input type="text" placeholder="Search chats..." className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-sm focus:border-red-500 outline-none" />
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#1e2330]/50">
          {conversations.map(c => (
            <div key={c.id} onClick={() => setActiveId(c.id)} className={`p-4 cursor-pointer transition-colors ${activeId === c.id ? 'bg-[#1a1d24] border-l-2 border-red-500' : 'hover:bg-[#151820] border-l-2 border-transparent'}`}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-sm text-gray-200 flex items-center">
                  {c.type === 'guest' ? <User className="w-3 h-3 mr-1.5" /> : <Shield className="w-3 h-3 mr-1.5" />}
                  {c.name}
                </span>
                <span className="text-[10px] text-gray-500 font-mono">{formatTimeElapsed(Math.floor((Date.now() - c.messages[c.messages.length-1].time)/1000))} ago</span>
              </div>
              <div className="text-xs text-gray-400 truncate tracking-wide">{c.initialMsg}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0a0c10] relative">
        {activeConv ? (
          <>
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#1e2330] bg-[#111318]">
              <div className="font-bold text-lg text-white">{activeConv.name} <span className="text-xs font-normal text-gray-500 ml-2">Secure Channel</span></div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-500 mr-2">TRANSLATE</span>
                <button onClick={() => setTranslate(!translate)} className={`w-10 h-5 rounded-full relative transition-colors ${translate ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${translate ? 'left-5' : 'left-0.5'}`}></span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConv.messages.map((m, i) => {
                const isGuest = m.sender === 'guest';
                const isOp = m.sender === 'operator';
                const isSys = m.sender === 'system';
                return (
                  <div key={i} className={`flex ${isSys ? 'justify-center' : isOp ? 'justify-end' : 'justify-start'}`}>
                    {isSys ? (
                      <div className="bg-[#1a1d24] text-gray-400 text-xs px-4 py-1.5 rounded-full border border-[#1e2330] italic">
                        {m.text}
                      </div>
                    ) : (
                      <div className={`max-w-[70%] rounded-xl p-3 shadow-md ${isOp ? 'bg-red-600 text-white rounded-br-sm' : 'bg-[#1a1d24] text-gray-200 border border-[#1e2330] rounded-bl-sm'}`}>
                        <div className="text-[10px] opacity-70 mb-1 tracking-wider uppercase">{m.sender}</div>
                        <div className="text-sm">{m.text}</div>
                        {isGuest && translate && m.translated && (
                          <div className="mt-2 text-xs text-yellow-400 italic font-medium border-t border-gray-700/50 pt-1">
                            [Translated: {m.translated}]
                          </div>
                        )}
                        <div className="text-[10px] opacity-50 mt-1 text-right mt-1.5">
                          {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-[#111318] border-t border-[#1e2330] flex space-x-3 items-end">
              <button onClick={handleAiAssist} disabled={aiLoading} className="h-10 px-3 bg-[#1e2330] hover:bg-[#2a3040] text-purple-400 rounded transition font-bold text-xs flex items-center shadow-inner">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>AI ASSIST</span>}
              </button>
              <textarea 
                value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder="Type message..." 
                className="flex-1 bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-sm text-white resize-none h-10 outline-none focus:border-red-500" 
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }}}
              />
              <button onClick={handleSend} className="h-10 w-10 bg-red-600 hover:bg-red-500 text-white rounded flex items-center justify-center transition shadow-lg">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="m-auto text-gray-500 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}

function AnalyticsView() {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    const sys = "You are an AI analyst. Generate a 3-paragraph executive safety report based on stats provided. No markdown headings, just paragraphs.";
    const user = JSON.stringify(ANALYTICS_DATA);
    const res = await callClaudeAPI(sys, user);
    if(res) setReport(res);
    setLoading(false);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'AVG RESPONSE', val: '4.2m', icon: Clock, c: 'text-blue-400' },
          { label: 'INCIDENTS TODAY', val: '24', icon: AlertTriangle, c: 'text-orange-400' },
          { label: 'RESOLUTION RATE', val: '92%', icon: CheckCircle, c: 'text-green-400' },
          { label: 'PEAK HOUR', val: '14:00', icon: Activity, c: 'text-purple-400' }
        ].map((k, i) => (
          <div key={i} className="bg-[#111318] border border-[#1e2330] rounded p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 font-bold mb-1">{k.label}</div>
              <div className="text-2xl font-bold text-white">{k.val}</div>
            </div>
            <div className={`p-3 rounded bg-[#1a1d24] ${k.c}`}><k.icon className="w-6 h-6" /></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 h-72">
        <div className="bg-[#111318] border border-[#1e2330] rounded p-4 flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase">Incidents by Type</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ANALYTICS_DATA.incidentsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <RTooltip cursor={{fill: '#1a1d24'}} contentStyle={{backgroundColor: '#111318', borderColor: '#1e2330', borderRadius: 4}} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-[#111318] border border-[#1e2330] rounded p-4 flex flex-col">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase">Response Time Trend (mins)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ANALYTICS_DATA.responseTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <RTooltip contentStyle={{backgroundColor: '#111318', borderColor: '#1e2330', borderRadius: 4}} />
              <Legend iconType="circle" wrapperStyle={{fontSize: 11}} />
              <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} dot={{r:4}} />
              <Line type="monotone" dataKey="target" stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 h-72">
        <div className="bg-[#111318] border border-[#1e2330] rounded p-4 flex flex-col relative">
          <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={ANALYTICS_DATA.severityDist} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                {ANALYTICS_DATA.severityDist.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <RTooltip contentStyle={{backgroundColor: '#111318', borderColor: '#1e2330', borderRadius: 4, color: '#fff'}} itemStyle={{color: '#fff'}} />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: 12, color: '#fff'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111318] border border-[#1e2330] rounded p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase">AI Incident Report</h3>
             <button onClick={generateReport} disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition flex items-center">
               {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <BarChart2 className="w-3 h-3 mr-1" />}
               GENERATE
             </button>
          </div>
          <div className="flex-1 bg-[#0a0c10] border border-[#1e2330] rounded p-4 overflow-y-auto text-sm text-gray-300 leading-relaxed custom-scrollbar">
            {report ? report.split('\n\n').map((p,i) => <p key={i} className="mb-3">{p}</p>) : <div className="h-full flex items-center justify-center text-gray-600">Click generate to run AI analysis</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== COMPONENTS =====================

function IncidentDetailPanel({ incident, staff, onClose, onUpdate, onAssign, addToast }) {
  if (!incident) return null;
  const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';

  return (
    <div className="absolute top-0 right-0 w-[480px] h-full bg-[#111318] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] border-l border-[#1e2330] flex flex-col z-40 transform transition-transform duration-300">
      
      {/* HEADER */}
      <div className={`p-4 border-b flex justify-between items-start ${incident.severity === 'CRITICAL' ? 'bg-red-900/20 border-red-900/50' : incident.severity === 'HIGH' ? 'bg-orange-900/20 border-orange-900/50' : 'bg-[#151820] border-[#1e2330]'}`}>
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="text-xl font-bold text-white">{incident.type}</span>
            <SeverityBadge severity={incident.severity} />
          </div>
          <div className="text-sm font-mono text-gray-400 flex items-center">
            {incident.id} &bull; F{incident.location.floor}, {incident.location.room}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white bg-[#0a0c10]/50 p-1 rounded-full"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto w-full inline-block">
        
        {/* AI TRIAGE BLOCK */}
        {incident.ai_triage && (
          <div className="m-4 rounded border border-purple-500/30 bg-purple-500/5 overflow-hidden">
            <div className="bg-purple-900/20 px-3 py-2 flex items-center justify-between border-b border-purple-500/20">
              <div className="flex items-center text-purple-300 text-xs font-bold font-mono tracking-wide">
                <CheckCircle className="w-3 h-3 mr-1.5" /> AI TRIAGE COMPLETE
              </div>
              <div className="text-[10px] text-purple-400">CONFIDENCE: {Math.round(incident.ai_triage.confidence * 100)}%</div>
            </div>
            
            {incident.ai_triage.escalate_911 && (
              <div className="bg-red-600 px-3 py-1.5 text-xs font-bold text-white tracking-widest text-center animate-pulse">
                ⚠ 911 ESCALATION RECOMMENDED ⚠
              </div>
            )}
            
            <div className="p-3 text-sm space-y-3">
              <div>
                <span className="text-gray-500 text-xs">Classification:</span> 
                <span className="ml-2 font-medium text-purple-300">{incident.ai_triage.classification}</span>
              </div>
              <div className="text-gray-300 text-xs italic">"{incident.ai_triage.reasoning}"</div>
              
              <div>
                <div className="text-gray-500 text-xs mb-1">Recommended Actions:</div>
                <ul className="list-disc pl-4 text-gray-300 text-xs space-y-1">
                  {incident.ai_triage.immediate_actions.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS */}
        <div className="px-5 py-2 space-y-4 text-sm">
          <div>
            <div className="text-xs text-gray-500 font-bold mb-1">DESCRIPTION</div>
            <div className="text-gray-200 bg-[#0a0c10] p-3 rounded border border-[#1e2330] leading-relaxed">
              {incident.description}
            </div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 font-bold mb-2">TIMELINE</div>
            <div className="space-y-4 pl-2">
              {incident.timeline.map((entry, i) => (
                <div key={i} className="relative flex items-start group">
                  <div className="absolute left-[-15px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-[#111318] z-10 group-first:bg-red-500 group-last:bg-gray-500"></div>
                  {i !== incident.timeline.length - 1 && <div className="absolute left-[-12px] top-3 w-px h-full bg-[#1e2330]"></div>}
                  <div className="flex-1 text-xs">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-gray-300 uppercase tracking-wide">{entry.state}</span>
                      <span className="text-gray-500 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-gray-400">{entry.actor}: {entry.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
             <div className="text-xs text-gray-500 font-bold mb-2">EVIDENCE</div>
             <div className="flex space-x-2">
               {incident.evidence.length === 0 ? <span className="text-xs text-gray-600 italic">No evidence attached</span> : 
                 incident.evidence.map((ev, i) => (
                   <div key={i} className="w-20 h-14 bg-[#1a1d24] border border-[#1e2330] rounded flex flex-col items-center justify-center text-gray-500 hover:text-white cursor-pointer hover:border-gray-500 transition">
                     {ev.type === 'cctv' ? <Camera className="w-4 h-4 mb-1" /> : <Mic className="w-4 h-4 mb-1" />}
                     <span className="text-[9px] uppercase">{ev.type}</span>
                   </div>
                 ))
               }
             </div>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 bg-[#0a0c10] border-t border-[#1e2330] flex flex-col space-y-3 shrink-0">
         <div className="flex justify-between items-center bg-[#111318] border border-[#1e2330] rounded p-2">
           <div className="text-xs font-bold text-gray-400 pl-2">ASSIGNED:</div>
           {incident.responderId ? (
             <div className="text-sm font-semibold text-white bg-[#1a1d24] px-3 py-1 rounded">
               {staff.find(s=>s.id===incident.responderId)?.name}
             </div>
           ) : (
             <select className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer outline-none focus:ring-2 focus:ring-blue-400"
               onChange={(e) => { if(e.target.value) onAssign(incident.id, e.target.value); e.target.value=""; }} defaultValue="">
               <option value="" disabled>DISPATCH...</option>
               {staff.filter(s => s.status === 'Available').map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
             </select>
           )}
         </div>
         
         <div className="flex space-x-2">
           <button onClick={() => onUpdate(incident.id, 'RESOLVED')} disabled={isResolved} className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2 rounded text-sm font-bold tracking-wide transition shadow">
             RESOLVE
           </button>
           <button onClick={() => addToast('Notified local authorities', 'info')} disabled={isResolved} className="flex-1 bg-[#1a1d24] hover:bg-red-900/50 border border-red-900 disabled:opacity-50 text-red-400 py-2 rounded text-sm font-bold tracking-wide transition">
             ESCALATE
           </button>
         </div>
      </div>
    </div>
  );
}

function NewIncidentModal({ onClose, onSave, staff }) {
  const [formData, setFormData] = useState({ type: 'Medical Emergency', floor: 1, room: '', desc: '', severity: 'Auto' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // AI Triage Call
    const sys = `You are an emergency triage AI. Respond ONLY with valid JSON structure: {"classification":"","confidence":0.0,"severity":"CRITICAL|HIGH|MEDIUM|LOW","recommended_responders":["role"],"immediate_actions":["act"],"escalate_911":false,"guest_message":"","reasoning":""}`;
    const user = `Triage incident: Type:${formData.type}, Floor:${formData.floor}, Room:${formData.room}, Desc:${formData.desc}`;
    
    let triage = await callClaudeAPI(sys, user, true);
    if (!triage || triage.error) {
      triage = { classification: 'Manual Entry', confidence: 0.5, severity: formData.severity === 'Auto' ? 'MEDIUM' : formData.severity, recommended_responders: [], immediate_actions: ['Investigate'], escalate_911: false, guest_message: '', reasoning: 'Triage fallback.' };
    }

    const newInc = {
      id: `INC-${Math.floor(100+Math.random()*900)}`,
      type: formData.type, severity: formData.severity !== 'Auto' ? formData.severity : triage.severity, status: 'TRIAGED',
      location: { floor: Number(formData.floor), room: formData.room, lat: 200+Math.random()*200, lng: 150+Math.random()*200 },
      description: formData.desc, reportedAt: Date.now(), elapsed: 0,
      responderId: null, ai_triage: triage,
      timeline: [
        { state: 'DETECTED', actor: 'Operator', timestamp: Date.now()-2000, note: 'Manual entry' },
        { state: 'TRIAGED', actor: 'System AI', timestamp: Date.now(), note: 'Analyzed on entry' }
      ], evidence: [], guest_comms: []
    };
    
    onSave(newInc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#111318] border border-[#1e2330] rounded-lg w-[500px] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#1e2330] bg-[#0d0f14] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" /> REPORT INCIDENT</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">TYPE</label>
              <select className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-white" value={formData.type} onChange={e=>setFormData({...formData, type:e.target.value})}>
                {Object.keys(ICON_MAP).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">SEVERITY OVERRIDE</label>
              <select className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-white" value={formData.severity} onChange={e=>setFormData({...formData, severity:e.target.value})}>
                 <option>Auto</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">FLOOR (1-20)</label>
              <input type="number" min="1" max="20" className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-white" value={formData.floor} onChange={e=>setFormData({...formData, floor:e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ROOM / AREA</label>
              <input type="text" className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-white" value={formData.room} onChange={e=>setFormData({...formData, room:e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">DESCRIPTION</label>
            <textarea className="w-full bg-[#0a0c10] border border-[#1e2330] rounded p-2 text-white h-24 resize-none" placeholder="Provide details..." value={formData.desc} onChange={e=>setFormData({...formData, desc:e.target.value})}></textarea>
          </div>
        </div>
        <div className="p-4 border-t border-[#1e2330] bg-[#0d0f14] flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-medium text-sm transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !formData.desc} className="bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:text-gray-400 text-white px-6 py-2 rounded font-bold text-sm tracking-wide flex items-center transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'AI TRIAGING...' : 'SUBMIT & TRIAGE'}
          </button>
        </div>
      </div>
    </div>
  );
}

function BroadcastModal({ onClose, addToast, staffCount }) {
  const [desc, setDesc] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!desc) return;
    setLoading(true);
    const sys = "You are a hotel emergency communications officer. Write a clear, calm, professional emergency broadcast message for hotel staff. Be concise, under 40 words, highly actionable. Output ONLY the raw message.";
    const res = await callClaudeAPI(sys, desc);
    if(res) setPreview(res.replace(/"/g, ''));
    setLoading(false);
  };

  const handleSend = () => {
    addToast(`Broadcast sent to ${staffCount} staff members.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-red-950/80 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-[#0a0c10] border-2 border-red-600 rounded-xl w-[600px] shadow-[0_0_50px_rgba(220,38,38,0.3)] flex flex-col overflow-hidden">
        <div className="p-5 bg-red-600 text-white flex justify-between items-center">
          <div>
             <h2 className="text-xl font-black tracking-widest flex items-center"><Radio className="w-6 h-6 mr-2 animate-pulse" /> EMERGENCY BROADCAST</h2>
             <div className="text-xs font-medium text-red-200 mt-1 uppercase">Message transmits to all {staffCount} on-duty staff instantly</div>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">1. Describe the Situation</label>
            <textarea className="w-full bg-[#111318] border border-[#1e2330] focus:border-red-500 outline-none rounded p-3 text-white h-24 resize-none text-sm" placeholder="e.g. Fire alarm in kitchen, need all staff to evacuate guests from dining area..." value={desc} onChange={e=>setDesc(e.target.value)}></textarea>
          </div>
          
          <button onClick={handleGenerate} disabled={loading || !desc} className="w-full bg-[#1a1d24] hover:bg-[#222630] border border-[#1e2330] text-purple-400 py-2.5 rounded font-bold text-xs tracking-widest flex justify-center items-center transition disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            AI GENERATE ALERT
          </button>

          {preview && (
            <div>
              <label className="block text-xs font-bold text-red-500 mb-2 border-t border-[#1e2330] pt-4 uppercase">2. Final Broadcast Preview</label>
              <textarea className="w-full bg-red-500/10 border-2 border-red-500/50 rounded p-4 text-red-100 h-24 resize-none text-base font-medium shadow-inner outline-none focus:border-red-500" value={preview} onChange={e=>setPreview(e.target.value)}></textarea>
              <div className="text-right text-[10px] text-gray-500 mt-1 font-mono uppercase">{preview.split(' ').length} words</div>
            </div>
          )}
        </div>
        <div className="p-4 bg-[#111318] border-t border-[#1e2330] flex justify-end space-x-3">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-400 hover:text-white font-bold text-sm tracking-wide transition">CANCEL</button>
          <button onClick={handleSend} disabled={!preview} className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white px-8 py-2.5 rounded shadow-[0_0_15px_rgba(220,38,38,0.5)] font-black text-sm tracking-widest transition">
            CONFIRM BROADCAST
          </button>
        </div>
      </div>
    </div>
  );
}

// --- UTILS ---

function SeverityBadge({ severity }) {
  let c = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  if (severity === 'CRITICAL') c = 'bg-red-500/20 text-red-400 border-red-500/50';
  if (severity === 'HIGH') c = 'bg-orange-500/20 text-orange-400 border-orange-500/50';
  if (severity === 'MEDIUM') c = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  if (severity === 'LOW') c = 'bg-blue-500/20 text-blue-400 border-blue-500/50';
  
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${c}`}>
      {severity}
    </span>
  );
}

function StatusPill({ status }) {
  let color = COLORS[status] || COLORS.DETECTED;
  const isPulsing = status === 'ON_SCENE';
  return (
    <div className="flex items-center space-x-1.5 bg-[#0a0c10] border border-[#1e2330] px-2 py-1 rounded text-[10px] font-bold text-gray-300">
      <div className="relative flex h-2 w-2">
        {isPulsing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{backgroundColor: color}}></span>}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{backgroundColor: color}}></span>
      </div>
      <span className="uppercase">{status.replace('_', ' ')}</span>
    </div>
  );
}

function StatPill({ color, label, val }) {
  return (
    <div className="flex flex-col bg-[#111318] border border-[#1e2330] rounded overflow-hidden">
      <div className="flex h-1 text-[10px]">
         <div className={`w-full ${color}`}></div>
      </div>
      <div className="flex items-center px-3 py-1 space-x-2">
         <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
         <span className="text-sm font-black text-white">{val}</span>
      </div>
    </div>
  );
}
