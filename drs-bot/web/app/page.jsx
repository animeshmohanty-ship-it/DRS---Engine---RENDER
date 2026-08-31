'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { loadCreatives, saveCreative, deleteCreative, uploadCreativeImage, newCreativeId } from '../lib/datalayer/creatives.js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { AuthScreens } from './authScreens.jsx';
import CreativeEditor from './creativeEditor.jsx';
import CarouselEditor from './carouselEditor.jsx';
import {
  Maximize2, Minimize2, Volume2, VolumeX, MessagesSquare, ChevronDown,
  BookOpen, X, Copy, Check, Mic, RefreshCw, Sparkles, Plus, Square, Zap, FileText, Send,
  MessageSquare, Download, ShieldCheck, LogOut, UserCheck, Users, ExternalLink, HelpCircle,
  Brain, Trash2, Play
} from 'lucide-react';

marked.setOptions({ gfm: true, breaks: true });

// Auth is gated behind an env flag so the app is never locked out mid-setup.
// Set NEXT_PUBLIC_AUTH_ENABLED=true on Render to turn on the login gate.
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
const ALLOWED_DOMAINS = ['recykal.com', 'retearn.in'];

const STAGES = [
  { num: 1, name: 'Setup', desc: 'Project context and setup' },
  { num: 2, name: 'Geography Intel', desc: 'Grounded admin & touchpoint data' },
  { num: 3, name: 'Market Intel', desc: 'Regulatory and economic opportunity' },
  { num: 4, name: 'Stakeholders', desc: 'Coalition map and alignment score' },
  { num: 5, name: 'Competitors', desc: 'Detailed competitor landscape and moat strategy' },
  { num: 6, name: 'Resistance', desc: 'Risk registry and fronts map' },
  { num: 7, name: 'Narrative & Alignment', desc: 'Core story, personas, and FAQs' },
  { num: 8, name: 'Blueprint', desc: 'Master Gantt timeline' },
  { num: 9, name: 'Execution', desc: '7 workstream SOPs and documents' },
  { num: 10, name: 'Launch Readiness', desc: 'T-Minus gate and Go/No-Go tracker' },
  { num: 11, name: 'GTM Launch & Funnel Execution', desc: 'Micro-scheduled branding, acquisition & engagement' },
  { num: 12, name: 'BTL Activation', desc: 'BTL reach and campaign calendar' },
  { num: 13, name: 'Reputation Management', desc: 'Crisis SLA and media response playbook' },
  { num: 14, name: 'KPIs', desc: 'North Star and KPI tree' },
  { num: 15, name: 'Knowledge Base', desc: 'Packaged reusable blueprint' }
];

const MATERIALS = ['Liquor', 'PET', 'Cans', 'MLP'];
const MODELS = ['End-to-End DRS (Scheme Operator)', 'RVM-only Provider to Retail', 'Tech Solutions'];

// DRS Business Unit POD — team roster + skills (for Orchestrator skill-based assignment).
const TEAM_MEMBERS = [
  { name: 'Alokesh Sinha', role: 'POD Lead', skills: ['Strategy', 'Leadership', 'Approvals', 'Oversight'] },
  { name: 'Akanksha', role: 'PR', skills: ['PR', 'Media', 'PR Agency', 'Website', 'Digital'] },
  { name: 'Vinod', role: 'Implementation', skills: ['Operational Execution', 'Team Leadership', 'Operations', 'Delivery'] },
  { name: 'Tarak', role: 'Video', skills: ['Video Production', 'Visual Content', 'Video', 'Creative', 'Design'] },
  { name: 'Siva', role: 'Data', skills: ['Lead Generation', 'Ad Management', 'Ads', 'Paid', 'Performance'] },
  { name: 'Sai Kiran', role: 'Data', skills: ['Research', 'Content', 'Data Analysis', 'Copywriting', 'Analytics'] },
  { name: 'Narendra', role: 'Social & Campaign', skills: ['Social Media', 'Campaign Management', 'Social', 'Campaigns'] },
  { name: 'Richard', role: 'Execution', skills: ['Field Operations', 'Tactical Execution', 'Field', 'Operations'] },
  { name: 'Yash', role: 'Events + Execution', skills: ['Event Management', 'On-ground Activation', 'Events', 'BTL', 'Activation'] },
];

// Token-overlap skill matcher: returns the best-fit member name for a task's required skills.
const _SKILL_STOP = new Set(['and', 'the', 'of', 'for', 'a', 'an', 'amp', 'to']);
const _tokenize = (s) => (String(s || '').toLowerCase().match(/[a-z]+/g) || []).filter((t) => !_SKILL_STOP.has(t));
const bestAssignee = (requiredSkills) => {
  const req = new Set((Array.isArray(requiredSkills) ? requiredSkills : [requiredSkills]).flatMap(_tokenize));
  if (!req.size) return null;
  let best = null, bestScore = 0;
  for (const m of TEAM_MEMBERS) {
    const mt = new Set(m.skills.flatMap(_tokenize));
    let score = 0;
    req.forEach((t) => { if (mt.has(t)) score++; });
    if (score > bestScore) { bestScore = score; best = m.name; }
  }
  return best;
};

// Strip markdown to clean prose for text-to-speech (so it never reads "asterisk").
const stripMarkdown = (s) => String(s || '')
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/__([^_]+)__/g, '$1')
  .replace(/_([^_]+)_/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/^#{1,6}\s*/gm, '')
  .replace(/^\s*[-*+]\s+/gm, '')
  .replace(/^\s*>\s?/gm, '')
  .replace(/[*_#`>]/g, '')
  .replace(/\n{2,}/g, '. ')
  .replace(/[ \t]+/g, ' ')
  .trim();

// Lightweight, CSP-safe markdown → HTML for the chat bubble (escape first, then whitelist tags).
// Full GitHub-flavored markdown → sanitized HTML (tables, lists, headings,
// code blocks, blockquotes). marked does the parsing; DOMPurify keeps it safe.
const renderMarkdown = (s) => {
  const src = String(s || '');
  let html;
  try { html = marked.parse(src); } catch { return src; }
  // DOMPurify needs a DOM — only available in the browser. On the server just
  // return marked's output (only our own static greeting renders at SSR time).
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
};

// Copy a message keeping its formatting: rich HTML (for Docs/Sheets/email) AND
// the markdown source (for editors). Falls back to plain text on older browsers.
const copyMessageFormatted = async (markdownText) => {
  const md = String(markdownText || '');
  try {
    const html = `<meta charset="utf-8">${renderMarkdown(md)}`;
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([md], { type: 'text/plain' }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(md);
    return true;
  } catch {
    try { await navigator.clipboard.writeText(md); return true; } catch { return false; }
  }
};

const PREDEFINED_STATES = {
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
    "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
    "Lakshadweep", "Puducherry"
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", 
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", 
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ]
};

const ALL_COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", 
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", 
  "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", 
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", 
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", 
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", 
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", 
  "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", 
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", 
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", 
  "Zimbabwe"
];

function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (typeof n !== 'number') return n;
  return n.toLocaleString('en-IN');
}

function Badge({ level }) {
  if (!level) return null;
  const cls = String(level).replace(/\s+/g, '-');
  return <span className={`badge ${cls}`}>{level}</span>;
}


const MODEL_OPTIONS = [
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Vertex AI)', icon: 'gemini' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Vertex AI)', icon: 'gemini' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (AI Studio)', icon: 'gemini' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (AI Studio)', icon: 'gemini' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (AI Studio)', icon: 'gemini' },
  { value: 'llama-3.3-70b', label: 'Groq Llama 3.3 (Fast)', icon: 'meta' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', icon: 'anthropic' }
];

const renderModelIcon = (type) => {
  if (type === 'gemini') {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginRight: '8px', flexShrink: 0}}><path d="M12 0C12 0 12 10.5 24 12C24 12 12 13.5 12 24C12 24 12 13.5 0 12C0 12 12 10.5 12 0Z" fill="url(#gemini-grad)"/><defs><linearGradient id="gemini-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4"/><stop offset="0.5" stopColor="#9B72CB"/><stop offset="1" stopColor="#D96570"/></linearGradient></defs></svg>;
  } else if (type === 'meta') {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginRight: '8px', flexShrink: 0}}><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17.5C8.96 17.5 6.5 15.04 6.5 12C6.5 8.96 8.96 6.5 12 6.5C15.04 6.5 17.5 8.96 17.5 12C17.5 15.04 15.04 17.5 12 17.5Z" fill="#0668E1"/></svg>;
  } else if (type === 'anthropic') {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginRight: '8px', flexShrink: 0}}><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="#D97757"/></svg>;
  }
  return null;
};

export default function App() {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 1 to 12
  const [gtmSubTab, setGtmSubTab] = useState('branding'); // 'branding' | 'acquisition' | 'engagement'
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('drs_selected_model') || 'gemini-3.1-pro-preview';
    }
    return 'gemini-2.5-flash';
  });

  useEffect(() => {
    localStorage.setItem('drs_selected_model', selectedModel);
  }, [selectedModel]);
  
  // Configuration State (Stage 1 Setup)
  const [projectId, setProjectId] = useState('');
  const [parentProjectId, setParentProjectId] = useState(null);
  const [parentProjectLabel, setParentProjectLabel] = useState(null);
  const [cascadedDemographics, setCascadedDemographics] = useState(null);
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Goa');
  const [model, setModel] = useState(MODELS[0]);
  const [selectedMaterials, setSelectedMaterials] = useState(['Liquor', 'PET', 'Cans', 'MLP']);
  const [objective, setObjective] = useState('Launch a working DRS and maximise container return rate.');
  const [operationsStatus, setOperationsStatus] = useState('Greenfield');
  const [projectStartMonth, setProjectStartMonth] = useState('October');
  const [projectStartYear, setProjectStartYear] = useState('2026');
  const [projectEndMonth, setProjectEndMonth] = useState('');
  const [projectEndYear, setProjectEndYear] = useState('');
  const [targetTimeline, setTargetTimeline] = useState('180 Days');
  const [selectedStages, setSelectedStages] = useState([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  const [selectedWorkstreams, setSelectedWorkstreams] = useState([1, 2, 3, 4, 5, 6, 7]);
  const [stagesDropdownOpen, setStagesDropdownOpen] = useState(false);
  const [workstreamsDropdownOpen, setWorkstreamsDropdownOpen] = useState(false);
  const stagesDropdownRef = useRef(null);
  const workstreamsDropdownRef = useRef(null);
  const [activePhaseTab, setActivePhaseTab] = useState('phase1');
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);
  const [customConstraints, setCustomConstraints] = useState('');
  
  const [countrySearch, setCountrySearch] = useState('India');
  const [stateSearch, setStateSearch] = useState('Goa');
  const [showCountryList, setShowCountryList] = useState(false);
  const [showStateList, setShowStateList] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [dynamicStates, setDynamicStates] = useState([]);

  useEffect(() => {
    setCountrySearch(country);
  }, [country]);

  useEffect(() => {
    setStateSearch(state);
  }, [state]);

  useEffect(() => {
    if (!projectEndMonth || !projectEndYear) {
      setTargetTimeline('365 Days');
      return;
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const startMIdx = months.indexOf(projectStartMonth);
    const endMIdx = months.indexOf(projectEndMonth);
    const startY = parseInt(projectStartYear) || 2026;
    const endY = parseInt(projectEndYear) || 2026;
    
    if (startMIdx === -1 || endMIdx === -1) {
      setTargetTimeline('365 Days');
      return;
    }
    
    const diffMonths = (endY - startY) * 12 + (endMIdx - startMIdx) + 1;
    if (diffMonths <= 0) {
      setTargetTimeline('365 Days');
      return;
    }
    
    setTargetTimeline(`${diffMonths * 30} Days`);
  }, [projectStartMonth, projectStartYear, projectEndMonth, projectEndYear]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (stagesDropdownRef.current && !stagesDropdownRef.current.contains(e.target)) {
        setStagesDropdownOpen(false);
      }
      if (workstreamsDropdownRef.current && !workstreamsDropdownRef.current.contains(e.target)) {
        setWorkstreamsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadStates = async () => {
      if (!country) {
        setDynamicStates([]);
        return;
      }
      if (PREDEFINED_STATES[country]) {
        setDynamicStates(PREDEFINED_STATES[country]);
        return;
      }
      
      setDynamicStates([]);
      try {
        const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: country })
        });
        const json = await res.json();
        if (json && !json.error && json.data?.states) {
          const names = json.data.states.map(s => s.name);
          setDynamicStates(names);
        }
      } catch (err) {
        console.warn('Failed to fetch states dynamically:', err);
      }
    };
    loadStates();
  }, [country]);
  
  // Generated Stages Cache for current project
  const [projectStages, setProjectStages] = useState({});
  // Live mirror of projectStages so sequential writes (e.g. Generate-All) merge
  // into the latest data instead of a stale closure snapshot (prevents stages vanishing).
  const projectStagesRef = useRef({});
  useEffect(() => { projectStagesRef.current = projectStages; }, [projectStages]);
  const [loading, setLoading] = useState({});
  const [abortControllers, setAbortControllers] = useState({});
  
  const cancelGeneration = (stageNum) => {
    if (abortControllers[stageNum]) {
      abortControllers[stageNum].abort();
      setAbortControllers(prev => {
        const next = { ...prev };
        delete next[stageNum];
        return next;
      });
    }
  };
  const [error, setError] = useState(null);
  const [gtmGeneratingStatus, setGtmGeneratingStatus] = useState(null);
  
  const geoSchema = projectStages?.stage2?.intel?.geoSchema || {
    level1: 'District',
    level2: 'Taluka',
    level3: 'Gram Panchayat'
  };

  const isNationalProject = state?.toLowerCase() === 'national';
  const level1Label = isNationalProject ? 'States / Provinces' : `${geoSchema.level2 || 'District'}s`;
  const level2Label = isNationalProject ? 'Districts / Counties' : `${geoSchema.level3 || 'Taluka'}s`;
  
  // Material/Taluka Filters
  const [materialFilter, setMaterialFilter] = useState('All');
  const [workstreamTab, setWorkstreamTab] = useState(1); // Stage 7 workstream tabs
  
  // PDF Report & Presentation slide states
  const [printingProject, setPrintingProject] = useState(null);
  const [presentationProject, setPresentationProject] = useState(null);
  const [presentationSlide, setPresentationSlide] = useState(0);
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const toggleAccordion = (id) => {
    setExpandedAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getProjectTitle = (p) => {
    if (!p) return '';
    const isNat = p.state?.toLowerCase() === 'national' || !p.state;
    return isNat ? `${p.country} DRS Roadmap` : `${p.country} - ${p.state} DRS Roadmap`;
  };
  
  // Copilot Panel State
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotImage, setCopilotImage] = useState(null); // { mimeType, data(base64), preview }
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: 'assistant', text: 'Hi! I am your DRS Copilot. I can help analyze figures, draft MoUs/notifications, or resolve blockers for the current stage.' }
  ]);
  
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [chatHistoryDropdownOpen, setChatHistoryDropdownOpen] = useState(false);
  const chatDropdownRef = useRef(null);

  // ---- Chat persistence (Supabase-backed, SHARED per scope) ----
  // Chats live in the `chats` table so they follow the project, not the browser:
  // any teammate who opens a project sees its conversations. Scope is the
  // project id, or 'GLOBAL' for the project-less "General" chat. localStorage is
  // kept only as an offline mirror / fallback when the cloud is unreachable.
  const getChatScope = (pid) => (pid && pid !== 'NEW_PROJECT_PLACEHOLDER') ? pid : 'GLOBAL';
  const CHAT_GREETING = 'Hi! I am your DRS Copilot. I can help analyze figures, draft MoUs/notifications, or resolve blockers for the current stage.';
  const makeThread = (text) => ({
    id: 'thread_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    title: 'New Chat',
    messages: [{ sender: 'assistant', text: text || CHAT_GREETING }],
  });
  const chatLoadToken = useRef(0);       // guards against out-of-order loads
  const deletedChatIds = useRef(new Set()); // never resurrect a deleted thread

  const readLocalChats = (scope) => {
    try {
      const raw = localStorage.getItem('drs_chats_' + scope);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed.filter(t => t && t.id && Array.isArray(t.messages)) : [];
    } catch { return []; }
  };
  const mirrorLocalChats = (scope, threads) => {
    try { localStorage.setItem('drs_chats_' + scope, JSON.stringify(threads)); } catch {}
  };

  const loadChatThreads = async (pid) => {
    const scope = getChatScope(pid);
    const token = ++chatLoadToken.current;
    let threads = [];
    let cloudOk = false;
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, messages, updated_at')
        .eq('scope', scope)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      cloudOk = true;
      threads = (data || []).map(r => ({
        id: r.id,
        title: r.title || 'New Chat',
        messages: (Array.isArray(r.messages) && r.messages.length) ? r.messages : [{ sender: 'assistant', text: CHAT_GREETING }],
      }));
    } catch (e) {
      threads = readLocalChats(scope); // offline / table not created yet
    }

    // One-time migration: lift any local-only conversations into the cloud.
    if (cloudOk) {
      const cloudIds = new Set(threads.map(t => t.id));
      const orphans = readLocalChats(scope).filter(t => t.messages.length > 1 && !cloudIds.has(t.id) && !deletedChatIds.current.has(t.id));
      if (orphans.length) {
        try {
          await supabase.from('chats').upsert(
            orphans.map(t => ({
              id: t.id, scope, title: t.title || 'New Chat', messages: t.messages,
              created_by: authUser?.id || null, updated_at: new Date().toISOString(),
            })),
            { onConflict: 'id' }
          );
          threads = [...orphans, ...threads];
        } catch (e) { /* keep local copy; retried on next load */ }
      }
    }

    if (token !== chatLoadToken.current) return; // superseded by a newer load
    if (threads.length === 0) threads = [makeThread()];
    setChatThreads(threads);
    setActiveThreadId(threads[0].id);
    setCopilotMessages(threads[0].messages);
    mirrorLocalChats(scope, threads);
  };

  useEffect(() => {
    loadChatThreads(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Debounced save of the active thread (skips greeting-only threads so we
  // never create empty rows).
  useEffect(() => {
    if (!activeThreadId || deletedChatIds.current.has(activeThreadId)) return;
    if (!Array.isArray(copilotMessages) || copilotMessages.length <= 1) return;
    const scope = getChatScope(projectId);
    const firstUser = copilotMessages.find(m => m.sender === 'user');
    const title = firstUser?.text
      ? firstUser.text.substring(0, 30) + (firstUser.text.length > 30 ? '…' : '')
      : 'New Chat';

    const timer = setTimeout(async () => {
      if (deletedChatIds.current.has(activeThreadId)) return;
      setChatThreads(prev => {
        const exists = prev.some(t => t.id === activeThreadId);
        const next = exists
          ? prev.map(t => (t.id === activeThreadId ? { ...t, title, messages: copilotMessages } : t))
          : [{ id: activeThreadId, title, messages: copilotMessages }, ...prev];
        mirrorLocalChats(scope, next);
        return next;
      });
      try {
        await supabase.from('chats').upsert({
          id: activeThreadId, scope, title, messages: copilotMessages,
          created_by: authUser?.id || null, updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (e) { /* mirrored locally; will sync on a later save */ }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilotMessages, projectId, activeThreadId]);

  const createNewThread = () => {
    // Not written to the cloud until it has a real message (avoids empty rows).
    const scope = getChatScope(projectId);
    const t = makeThread('Conversation reset. Ask me anything!');
    setChatThreads(prev => { const next = [t, ...prev]; mirrorLocalChats(scope, next); return next; });
    setActiveThreadId(t.id);
    setCopilotMessages(t.messages);
    setChatHistoryDropdownOpen(false);
  };

  const switchThread = (id) => {
    const thread = chatThreads.find(t => t.id === id);
    if (thread) {
      setActiveThreadId(thread.id);
      setCopilotMessages(thread.messages);
      setChatHistoryDropdownOpen(false);
    }
  };

  const deleteThread = async (id, e) => {
    e.stopPropagation();
    deletedChatIds.current.add(id);
    const scope = getChatScope(projectId);
    const remaining = chatThreads.filter(t => t.id !== id);
    const finalThreads = remaining.length ? remaining : [makeThread()];
    setChatThreads(finalThreads);
    mirrorLocalChats(scope, finalThreads);
    if (activeThreadId === id) {
      setActiveThreadId(finalThreads[0].id);
      setCopilotMessages(finalThreads[0].messages);
    }
    try { await supabase.from('chats').delete().eq('id', id); } catch (e) { /* local state already updated */ }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (chatDropdownRef.current && !chatDropdownRef.current.contains(e.target)) {
        setChatHistoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [copilotCollapsed, setCopilotCollapsed] = useState(false);
  const [copilotFullpage, setCopilotFullpage] = useState(false);
  const [knowledgeUploading, setKnowledgeUploading] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState(null);
  const [geoDeepBusy, setGeoDeepBusy] = useState(false);
  const [geoDeepStage, setGeoDeepStage] = useState('');
  const [gtmPhase, setGtmPhase] = useState('research');
  const [gtmBusy, setGtmBusy] = useState(false);
  const [gtmStage, setGtmStage] = useState('');
  const [gtmScenarioOverride, setGtmScenarioOverride] = useState('');
  // Touchpoint Collector (dedicated scraper tab) + Targeted-numbers state
  const [collectorQuery, setCollectorQuery] = useState('');
  const [collectorJob, setCollectorJob] = useState(null); // { status, count, label, offline }
  const [collectorRows, setCollectorRows] = useState(null); // collected outlets for the last query
  const [collectorLibrary, setCollectorLibrary] = useState([]); // [{city,category,count,state}]
  const [collectedCounts, setCollectedCounts] = useState({}); // {category: n} for the current state (Targeted view)
  // Social Intelligence tab
  const [socialPlatform, setSocialPlatform] = useState('meta_ads');
  const [socialQuery, setSocialQuery] = useState('');
  const [socialJob, setSocialJob] = useState(null); // { status, count, offline }
  const [socialRows, setSocialRows] = useState(null);
  const [socialLibrary, setSocialLibrary] = useState([]);
  const [socialCountry, setSocialCountry] = useState('in-en'); // ddgs region
  const [socialRecency, setSocialRecency] = useState('');       // ddgs timelimit: '' | d | w | m | y
  const [socialNiche, setSocialNiche] = useState('');           // niche (IG) / topic (LinkedIn) prepended to query
  // Creative Studio
  const [creativeFocus, setCreativeFocus] = useState('');
  const [creativeBusy, setCreativeBusy] = useState(false);
  const [creativeOutput, setCreativeOutput] = useState(null);
  const [creativeAssets, setCreativeAssets] = useState([]); // per-row / independent generated assets
  const [assetChannel, setAssetChannel] = useState('linkedin');
  const [assetFormat, setAssetFormat] = useState('social');
  const [assetHook, setAssetHook] = useState('');
  const [carouselTopic, setCarouselTopic] = useState('');
  const [carouselSlides, setCarouselSlides] = useState(6);
  const [carouselRatio, setCarouselRatio] = useState('1:1');
  const [carouselBusy, setCarouselBusy] = useState(false);
  const [creativeImages, setCreativeImages] = useState({}); // id -> { url | loading | error }
  const [creativeSaveState, setCreativeSaveState] = useState('idle'); // idle | saving | saved
  const [creativeLibLoading, setCreativeLibLoading] = useState(false);
  const creativeRefs = useRef({});
  const creativeScope = projectId || 'GLOBAL'; // project-scoped, or independent
  const creativeAssetsRef = useRef([]);
  useEffect(() => { creativeAssetsRef.current = creativeAssets; }, [creativeAssets]);

  // Map a persisted record <-> the in-memory asset shape the cards render.
  const recordToAsset = (r) => ({
    id: r.id, kind: r.kind || 'asset', channel: r.channel, format: r.format, hook: r.hook, objective: r.objective,
    title: r.title, content: r.content,
    headline: r.doc?.headline, sub: r.doc?.sub, cta: r.doc?.cta,
    hasVisual: r.doc?.hasVisual, visualBrief: r.doc?.visualBrief,
    doc: r.doc || {}, savedAt: r.updated_at,
  });
  const assetToRecord = (a, imageUrl) => ({
    id: a.id, kind: a.kind || 'asset', channel: a.channel || '', format: a.format || '', hook: a.hook || '',
    objective: a.objective || '', market: state ? `${state}, ${country}` : (country || 'India'),
    title: a.title || a.hook || 'Untitled', content: a.content || '',
    doc: { ...(a.doc || {}), headline: a.headline, sub: a.sub, cta: a.cta, hasVisual: a.hasVisual, visualBrief: a.visualBrief },
    image_url: imageUrl !== undefined ? imageUrl : (a.doc?.image_url || null),
    created_by: authUser?.id || null,
  });
  // Autosave one finished asset (optionally uploading a new background image first).
  const persistAsset = async (a, explicitImage) => {
    if (!a || a.loading || a.error) return;
    try {
      setCreativeSaveState('saving');
      const dataUrl = explicitImage !== undefined ? explicitImage : creativeImages[a.id]?.url;
      let imageUrl = a.doc?.image_url || null;
      if (dataUrl) imageUrl = await uploadCreativeImage(a.id, dataUrl);
      await saveCreative(creativeScope, assetToRecord(a, imageUrl));
      setCreativeSaveState('saved');
      setTimeout(() => setCreativeSaveState((s) => (s === 'saved' ? 'idle' : s)), 1600);
    } catch { setCreativeSaveState('idle'); }
  };
  const persistAssetById = (id, explicitImage) => persistAsset(creativeAssetsRef.current.find((x) => x.id === id), explicitImage);
  // Visual-editor doc change → update the asset + debounced autosave.
  const creativeSaveTimers = useRef({});
  const handleDocChange = (id, docVal) => {
    setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, doc: { ...(a.doc || {}), ...docVal } } : a)));
    setCreativeSaveState('saving');
    clearTimeout(creativeSaveTimers.current[id]);
    creativeSaveTimers.current[id] = setTimeout(() => {
      const a = creativeAssetsRef.current.find((x) => x.id === id);
      if (a) persistAsset(a);
    }, 800);
  };
  const removeCreative = async (id) => {
    setCreativeAssets((prev) => prev.filter((a) => a.id !== id));
    setCreativeImages((prev) => { const n = { ...prev }; delete n[id]; return n; });
    await deleteCreative(creativeScope, id);
  };

  // Fetch a scope's saved creatives, mapped to the asset shape + seeded image map.
  const loadedScopeRef = useRef(null);
  const loadScope = async (scope) => {
    const rows = await loadCreatives(scope);
    const imgs = {};
    rows.forEach((r) => { if (r.image_url) imgs[r.id] = { url: r.image_url, uploaded: true }; });
    return { assets: rows.map(recordToAsset), imgs };
  };
  // Load the current scope's library when Creative Studio opens or the scope changes.
  // Guarded so a fresh generate (which pre-marks the scope) isn't clobbered by a late load.
  useEffect(() => {
    if (activeTab !== 'creative') return;
    if (loadedScopeRef.current === creativeScope) return;
    loadedScopeRef.current = creativeScope;
    let cancelled = false;
    (async () => {
      setCreativeLibLoading(true);
      const { assets, imgs } = await loadScope(creativeScope);
      if (cancelled) return;
      setCreativeAssets(assets);
      setCreativeImages(imgs);
      setCreativeLibLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeTab, creativeScope]);
  const [welcomeDismissed, setWelcomeDismissed] = useState(true); // default hidden to avoid SSR flash
  useEffect(() => { try { setWelcomeDismissed(localStorage.getItem('drs_welcome_dismissed') === '1'); } catch {} }, []);
  const dismissWelcome = () => { setWelcomeDismissed(true); try { localStorage.setItem('drs_welcome_dismissed', '1'); } catch {} };

  // ---- Auth (Phase 1: Google login + Recykal domain + approval gate) ----
  const [authMode, setAuthMode] = useState(AUTH_ENABLED ? 'loading' : 'active'); // loading|login|pending|blocked|active
  const [authUser, setAuthUser] = useState(null);      // supabase auth user
  const [authProfile, setAuthProfile] = useState(null); // row from profiles

  const resolveAuth = async (session) => {
    const user = session?.user || null;
    setAuthUser(user);
    if (!user) { setAuthProfile(null); setAuthMode('login'); return; }
    const email = (user.email || '').toLowerCase();
    const domain = email.split('@')[1] || '';
    if (!ALLOWED_DOMAINS.includes(domain)) { setAuthMode('blocked'); return; }
    // Fetch profile (created by DB trigger on first sign-in)
    let profile = null;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      profile = data || null;
    } catch (e) { /* row may not exist yet */ }
    setAuthProfile(profile);
    const status = profile?.status || 'pending';
    if (status === 'active') setAuthMode('active');
    else if (status === 'revoked') setAuthMode('blocked');
    else setAuthMode('pending');
  };

  useEffect(() => {
    if (!AUTH_ENABLED) return;
    let sub = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      await resolveAuth(data?.session);
      sub = supabase.auth.onAuthStateChange((_e, session) => { resolveAuth(session); }).data?.subscription;
    })();
    return () => { if (sub) sub.unsubscribe(); };
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
  };
  const signOutUser = async () => { await supabase.auth.signOut(); setAuthMode('login'); setAuthUser(null); setAuthProfile(null); };

  const isAdmin = AUTH_ENABLED && authProfile?.role === 'admin';

  // ---- Admin dashboard (Phase 3) ----
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [adminProjects, setAdminProjects] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const loadAdmin = async () => {
    setAdminLoading(true);
    try {
      const { data: profs } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      const { data: projs } = await supabase.from('projects').select('id, country, state, created_by, updated_at');
      setAdminProfiles(profs || []);
      setAdminProjects(projs || []);
    } catch (e) { setError('Admin load failed: ' + e.message); }
    finally { setAdminLoading(false); }
  };
  const updateUserStatus = async (id, status) => {
    try { await supabase.from('profiles').update({ status }).eq('id', id); await loadAdmin(); }
    catch (e) { setError('Update failed: ' + e.message); }
  };
  const updateUserRole = async (id, role) => {
    try { await supabase.from('profiles').update({ role }).eq('id', id); await loadAdmin(); }
    catch (e) { setError('Update failed: ' + e.message); }
  };
  useEffect(() => { if (activeTab === 'admin' && isAdmin) loadAdmin(); /* eslint-disable-next-line */ }, [activeTab, isAdmin]);

  // ---- DRS Brain admin ----
  const [brainStatus, setBrainStatus] = useState(null);
  const [brainBusy, setBrainBusy] = useState(false);
  const [brainText, setBrainText] = useState('');
  const [brainSource, setBrainSource] = useState('');
  const [brainVisibility, setBrainVisibility] = useState('internal');
  const [brainSearchQuery, setBrainSearchQuery] = useState('');
  const [brainResults, setBrainResults] = useState(null);
  const [brainMsg, setBrainMsg] = useState('');

  const [brainSources, setBrainSources] = useState(null);
  const loadBrainStatus = async () => {
    try { const r = await fetch('/api/brain/status'); setBrainStatus(await r.json()); }
    catch (e) { setBrainStatus({ ok: false, error: e.message }); }
    try { const r = await fetch('/api/brain/sources'); const d = await r.json(); setBrainSources(d.ok ? (d.sources || []) : []); }
    catch { setBrainSources([]); }
  };
  const removeBrainSource = async (source) => {
    if (!window.confirm(`Remove "${source}" and all its facts from the Brain? This cannot be undone.`)) return;
    setBrainBusy(true);
    try {
      const r = await fetch('/api/brain/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source }) });
      const d = await r.json();
      setBrainMsg(d.ok ? `Removed "${source}" (${d.deleted} chunks).` : `Failed: ${d.error}`);
      loadBrainStatus();
    } catch (e) { setBrainMsg('Failed: ' + e.message); } finally { setBrainBusy(false); }
  };
  const addToBrain = async () => {
    if (!brainText.trim()) return;
    setBrainBusy(true); setBrainMsg('');
    try {
      const r = await fetch('/api/brain/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: brainText, source: brainSource || 'Manual add', origin: 'seed', tags: { scope: 'drs', visibility: brainVisibility } }) });
      const d = await r.json();
      setBrainMsg(d.ok ? `Added ${d.stored} chunk(s) to the Brain.` : (d.disabled ? 'Brain is disabled (set BRAIN_ENABLED + service key).' : `Failed: ${d.error}`));
      if (d.ok) { setBrainText(''); setBrainSource(''); loadBrainStatus(); }
    } catch (e) { setBrainMsg('Failed: ' + e.message); } finally { setBrainBusy(false); }
  };
  const runBrainVerify = async () => {
    setBrainBusy(true); setBrainMsg('Verifying a batch (grounding each fact)…');
    try {
      const r = await fetch('/api/brain/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 8 }) });
      const d = await r.json();
      setBrainMsg(d.ok ? `Processed ${d.processed}: ${d.promoted} verified, ${d.quarantined} quarantined, ${d.left} left as experience. Run again for the next batch.` : `Failed: ${d.error || 'disabled'}`);
      loadBrainStatus();
    } catch (e) { setBrainMsg('Failed: ' + e.message); } finally { setBrainBusy(false); }
  };
  const searchBrain = async () => {
    if (!brainSearchQuery.trim()) return;
    setBrainBusy(true); setBrainResults(null);
    try {
      const r = await fetch('/api/brain/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: brainSearchQuery }) });
      const d = await r.json();
      setBrainResults(d.ok ? (d.results || []) : []);
    } catch (e) { setBrainResults([]); } finally { setBrainBusy(false); }
  };
  useEffect(() => { if (activeTab === 'brain' && isAdmin) loadBrainStatus(); /* eslint-disable-next-line */ }, [activeTab, isAdmin]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const ttsAudioRef = useRef(null);

  // Speak text via Google TTS (same service account as Vertex). Used when Voice mode is on.
  const speak = async (text) => {
    const clean = stripMarkdown(text);
    if (!clean) return;
    try {
      if (ttsAudioRef.current) { try { ttsAudioRef.current.pause(); } catch {} ttsAudioRef.current = null; }
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: clean.slice(0, 4500) }) });
      const j = await res.json();
      if (!j.ok || !j.audioContent) return;
      const audio = new Audio('data:audio/mp3;base64,' + j.audioContent);
      ttsAudioRef.current = audio;
      audio.play().catch(() => {});
    } catch { /* ignore playback errors */ }
  };
  const stopSpeaking = () => { if (ttsAudioRef.current) { try { ttsAudioRef.current.pause(); } catch {} ttsAudioRef.current = null; } };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Collapse copilot by default on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setCopilotCollapsed(true);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotMessages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setCopilotQuery(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };

        rec.onerror = (e) => {
          console.error('Speech recognition error:', e.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setProjects(data.map(p => ({
          id: p.id,
          country: p.country,
          state: p.state,
          implementationModel: p.implementation_model,
          materials: p.materials,
          objective: p.objective,
          stages: p.stages || {},
          updatedAt: p.updated_at
        })));
        return;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }

    try {
      const stored = localStorage.getItem('drs_projects');
      if (stored) {
        setProjects(JSON.parse(stored));
      } else {
        setProjects([]);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setError('Generation for Campaign Plan was stopped.');
      } else {
        console.error(e);
        setError(`Planning failed: ${e.message}`);
      }
      setProjectStages(prev => { return prev; });
    }
  };

  const loadProject = (p) => {
    setProjectId(p.id);
    setCountry(p.country);
    setState(p.state);
    setModel(p.implementationModel || p.implementation_model || MODELS[0]);
    setSelectedMaterials(p.materials);
    setObjective(p.objective);
    setProjectStages(p.stages || {});
    
    const setupMeta = p.stages?.setup || {};
    setParentProjectId(setupMeta.parentId || null);
    setParentProjectLabel(setupMeta.parentLabel || null);
    setCascadedDemographics(setupMeta.cascadedDemographics || null);
    setOperationsStatus(setupMeta.operationsStatus || 'Greenfield');
    setProjectStartMonth(setupMeta.projectStartMonth || 'October');
    setProjectStartYear(setupMeta.projectStartYear || '2026');
    setProjectEndMonth(setupMeta.projectEndMonth || '');
    setProjectEndYear(setupMeta.projectEndYear || '');
    setTargetTimeline(setupMeta.targetTimeline || '180 Days');
    setSelectedStages((setupMeta.selectedStages || [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).filter((n) => n !== 2));
    setSelectedWorkstreams(setupMeta.selectedWorkstreams || [1, 2, 3, 4, 5, 6, 7]);
    setCustomConstraints(setupMeta.customConstraints || '');

    setResearchTab(3); setActiveTab('gtm'); // Jump to GTM Blueprint (first stage after Setup)
    setError(null);
  };

  const initNewProject = () => {
    setProjectId('NEW_PROJECT_PLACEHOLDER');
    setParentProjectId(null);
    setParentProjectLabel(null);
    setCascadedDemographics(null);
    setCountry('India');
    setCountrySearch('India');
    setState('Goa');
    setStateSearch('Goa');
    setModel(MODELS[0]);
    setSelectedMaterials(['Liquor', 'PET', 'Cans', 'MLP']);
    setObjective('Launch a working DRS and maximise container return rate.');
    setOperationsStatus('Greenfield');
    setProjectStartMonth('October');
    setProjectStartYear('2026');
    setProjectEndMonth('');
    setProjectEndYear('');
    setTargetTimeline('180 Days');
    setSelectedStages([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    setSelectedWorkstreams([1, 2, 3, 4, 5, 6, 7]);
    setCustomConstraints('');
    setProjectStages({});
    setActiveTab(1); // Go to Setup
    setError(null);
  };

  const initSubProject = (parentProj, subRegionName, demographics) => {
    setParentProjectId(parentProj.id);
    setParentProjectLabel(`${parentProj.state}, ${parentProj.country}`);
    setCountry(parentProj.country);
    setCountrySearch(parentProj.country);
    setState(subRegionName);
    setStateSearch(subRegionName);
    setModel(parentProj.implementationModel || parentProj.implementation_model || MODELS[0]);
    setSelectedMaterials(parentProj.materials || []);
    setObjective(`Regional sub-project for ${subRegionName} cascading from parent blueprint ${parentProj.id}`);
    setProjectStages({});
    setProjectId('NEW_PROJECT_PLACEHOLDER');

    const parentStage2 = parentProj.stages?.stage2;
    const parentIntel = parentStage2?.intel;
    const parentSummary = parentIntel?.stateSummary;
    const cascaded = {
      population: demographics?.population || null,
      subDivisions: demographics?.subDivisions || null,
      parentTotals: parentStage2 ? {
        universeTotal: parentStage2.touchpoints?.universeTotal || null,
        parentPopulation: parentSummary?.population?.value || null,
        parentSubDivisions: parentSummary?.talukasOrTehsils?.value || null,
        groups: parentStage2.touchpoints?.groups?.map(g => ({ group: g.group, total: g.total })) || []
      } : null
    };

    setCascadedDemographics(cascaded);
    setActiveTab(1); // Go to Setup
    setError(null);
    setCopilotMessages([{ sender: 'assistant', text: `Initiated sub-project for ${subRegionName} connected to parent ${parentProj.id}. Click 'Generate Stage 1 Roadmap' to run.` }]);
  };

  const saveProjectToStorage = async (updatedStages) => {
    let activeId = projectId;
    const isNewProject = !activeId || activeId === 'NEW_PROJECT_PLACEHOLDER';
    if (isNewProject) {
      const statePrefix = (state || 'GEN').substring(0, 3).trim().toUpperCase();
      activeId = `DRS-${statePrefix}-${Math.floor(100 + Math.random() * 900)}`;
      setProjectId(activeId);
    }

    const stagesWithParent = {
      ...updatedStages,
      setup: {
        ...(updatedStages.setup || {}),
        parentId: parentProjectId,
        parentLabel: parentProjectLabel,
        cascadedDemographics: cascadedDemographics,
        operationsStatus,
        projectStartMonth,
        projectStartYear,
        projectEndMonth,
        projectEndYear,
        targetTimeline,
        selectedStages,
        selectedWorkstreams,
        customConstraints
      }
    };

    const projectData = {
      id: activeId,
      country,
      state,
      implementation_model: model,
      materials: selectedMaterials,
      objective,
      stages: stagesWithParent,
      updated_at: new Date().toISOString()
    };
    // Stamp the creator on new projects only (preserve original owner on edits).
    if (isNewProject && authUser?.id) projectData.created_by = authUser.id;

    try {
      const { error } = await supabase
        .from('projects')
        .upsert(projectData, { onConflict: 'id' });
      
      if (error) throw error;
      
      fetchProjects();
      return;
    } catch (e) {
      console.warn('Supabase save failed, falling back to localStorage:', e);
    }

    try {
      const stored = localStorage.getItem('drs_projects');
      const list = stored ? JSON.parse(stored) : [];
      const existingIndex = list.findIndex((p) => p.id === activeId);

      const fallbackData = {
        id: activeId,
        country,
        state,
        implementationModel: model,
        materials: selectedMaterials,
        objective,
        stages: stagesWithParent,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex > -1) {
        list[existingIndex] = fallbackData;
      } else {
        list.push(fallbackData);
      }

      localStorage.setItem('drs_projects', JSON.stringify(list));
      setProjects(list);
    } catch (e) {
      console.error('Failed to save project to localStorage:', e);
    }
  };

  const updateStage2Intel = (path, value) => {
    const updatedStages = { ...projectStages };
    if (!updatedStages.stage2) return;
    
    let current = updatedStages.stage2;
    const keys = path.split('.');
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    // Parse numeric fields safely
    const numVal = value === '' ? null : (isNaN(Number(value)) ? value : Number(value));
    current[keys[keys.length - 1]] = numVal;
    
    setProjectStages(updatedStages);
    saveProjectToStorage(updatedStages);
  };

  const updateHierarchyRow = (districtName, key, value) => {
    const updatedStages = { ...projectStages };
    if (!updatedStages.stage2?.intel?.hierarchy) return;
    
    const hierarchy = updatedStages.stage2.intel.hierarchy;
    const row = hierarchy.find(item => item.district === districtName);
    if (row) {
      const numVal = value === '' ? null : (isNaN(Number(value)) ? value : Number(value));
      row[key] = numVal;
      setProjectStages(updatedStages);
      saveProjectToStorage(updatedStages);
    }
  };

  const deleteProject = async (id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase delete failed, falling back to localStorage:', e);
    }

    try {
      const stored = localStorage.getItem('drs_projects');
      if (stored) {
        const list = JSON.parse(stored);
        const updatedList = list.filter((p) => p.id !== id);
        localStorage.setItem('drs_projects', JSON.stringify(updatedList));
      }
      fetchProjects();
    } catch (e) {
      console.error('Failed to delete from localStorage:', e);
    }
  };

  const renderPrintValue = (val, depth = 0) => {
    if (val === null || val === undefined) return null;

    if (Array.isArray(val)) {
      if (val.length === 0) return <p className="muted">None</p>;
      
      const isArrayOfObjects = typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0]);
      
      if (isArrayOfObjects) {
        const headers = Object.keys(val[0]);
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', marginTop: '10px' }}>
            <thead>
              <tr style={{ background: '#f5f5f7', borderBottom: '2px solid var(--line)' }}>
                {headers.map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
                    {h.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {val.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                  {headers.map((h) => {
                    const cellVal = item[h];
                    return (
                      <td key={h} style={{ padding: '10px', fontSize: '13px', color: 'var(--ink)' }}>
                        {cellVal !== null && typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal || '')}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        return (
          <ul style={{ paddingLeft: '20px', margin: '8px 0', fontSize: '14px', lineHeight: '1.6' }}>
            {val.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{String(item)}</li>
            ))}
          </ul>
        );
      }
    }

    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return null;
      return (
        <div style={{ paddingLeft: depth > 0 ? '16px' : '0', borderLeft: depth > 0 ? '2px solid var(--line)' : 'none', marginTop: '10px' }}>
          {keys.map((k) => {
            const childVal = val[k];
            const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (str) => str.toUpperCase()).trim();
            const isSimple = typeof childVal !== 'object' || childVal === null;
            
            return (
              <div key={k} style={{ marginBottom: '14px' }}>
                <strong style={{ fontSize: '14px', color: '#0066cc', display: 'block', marginBottom: isSimple ? '4px' : '0' }}>{label}</strong>
                {isSimple ? (
                  <p style={{ fontSize: '14px', margin: 0, lineHeight: '1.5', color: 'var(--ink)' }}>{String(childVal)}</p>
                ) : (
                  renderPrintValue(childVal, depth + 1)
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '8px 0', color: 'var(--ink)' }}>{String(val)}</p>;
  };

  const printProjectReport = (p) => {
    setPrintingProject(p);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingProject(null), 1000);
    }, 600);
  };

  const openProjectPresentation = (p) => {
    setPresentationProject(p);
    setPresentationSlide(0);
  };

  const handleSetupSubmit = async () => {
    try {
      setLoading({ 1: true });
      await saveProjectToStorage(projectStages);
      setResearchTab(3); setActiveTab('gtm'); // Unlocked → open GTM Blueprint (first stage after Setup)
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading({ 1: false });
    }
  };

  // Market Research combined page: which sub-tab (stage 2-6) is showing + generate-all state.
  const [researchTab, setResearchTab] = useState(3);
  const [researchGenerating, setResearchGenerating] = useState(false);
  const [researchProgress, setResearchProgress] = useState('');
  const [planProgress, setPlanProgress] = useState('');

  // Signature of the current Setup brief. Stages are stamped with this at
  // generation time; if the brief later changes, the stamp no longer matches
  // and the stage is flagged stale (non-destructive — data is kept).
  const getBriefSignature = () => JSON.stringify({
    country,
    state,
    model,
    materials: [...selectedMaterials].sort(),
    objective,
    operationsStatus,
    projectStartMonth,
    projectStartYear,
    projectEndMonth,
    projectEndYear,
    targetTimeline,
    customConstraints,
  });

  const isStageStale = (n) => {
    const st = projectStages[`stage${n}`];
    return !!(st && st._brief && st._brief !== getBriefSignature());
  };

  // Multi-query Planning: generate the strategy+campaigns core (1 call), then the
  // DENSE content calendar one campaign at a time (loads progressively; no truncation).
  const generatePlan = async (baseInput) => {
    const controller = new AbortController();
    setAbortControllers(prev => ({ ...prev, 17: controller }));
    setPlanProgress('Generating strategy & campaigns…');
    setLoading(prev => ({ ...prev, 17: true }));
    const coreRes = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: 17, action: 'core', input: baseInput, projectData: projectStagesRef.current, model: selectedModel, projectId }),
      signal: controller.signal
    });
    const coreText = await coreRes.text();
    let core;
    try { core = JSON.parse(coreText); } catch { throw new Error('Plan core returned non-JSON'); }
    if (!coreRes.ok || !core.ok || !core.data) throw new Error(core.error || 'Plan core generation failed');

    // Seed stage17 with the core plan and an empty content calendar.
    const seeded = { ...projectStagesRef.current, stage17: { data: { ...core.data, contentCalendar: [] }, sources: core.sources, _brief: getBriefSignature() } };
    projectStagesRef.current = seeded;
    setProjectStages(seeded);
    await saveProjectToStorage(seeded);

    // Dense content, one campaign at a time.
    const camps = Array.isArray(core.data.campaignCalendar) ? core.data.campaignCalendar : [];
    for (let i = 0; i < camps.length; i++) {
      setPlanProgress(`Content calendar ${i + 1}/${camps.length}: ${camps[i].campaign || ''}…`);
      try {
        const cRes = await fetch('/api/generate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 18, action: 'content', input: { ...baseInput, targetCampaign: camps[i] }, projectData: projectStagesRef.current, model: selectedModel, projectId }),
          signal: controller.signal
        });
        const cText = await cRes.text();
        let cData;
        try { cData = JSON.parse(cText); } catch { continue; }
        const rows = cData.data?.contentCalendar || [];
        if (rows.length) {
          const prevS = projectStagesRef.current.stage17;
          const merged = { ...projectStagesRef.current, stage17: { ...prevS, data: { ...prevS.data, contentCalendar: [...(prevS.data.contentCalendar || []), ...rows] } } };
          projectStagesRef.current = merged;
          setProjectStages(merged);
          await saveProjectToStorage(merged);
        }
      } catch { /* skip a failed campaign, keep going */ }
    }
    setPlanProgress('Plan complete ✓');
    setTimeout(() => setPlanProgress(''), 2500);
    setLoading(prev => ({ ...prev, 17: false }));
  };

  const generateStage = async (stageNum) => {
    setError(null);
    const controller = new AbortController();
    setAbortControllers(prev => ({ ...prev, [stageNum]: controller }));
    setLoading(prev => ({ ...prev, [stageNum]: true }));
    try {
      const baseInput = {
        country,
        state,
        implementationModel: model,
        materials: selectedMaterials,
        objective,
        cascadedDemographics,
        operationsStatus,
        projectStartMonth,
        projectStartYear,
        projectEndMonth,
        projectEndYear,
        targetTimeline,
        selectedStages,
        selectedWorkstreams,
        customConstraints
      };

      // Planning uses a multi-query generation (core + per-campaign content).
      if (Number(stageNum) === 17) {
        await generatePlan(baseInput);
        return;
      }

      if (stageNum === 2) {
        // Step 1: Execute Demographics and Touchpoint Google search (Fast, ~4-5s)
        console.log('[Stage 2 Split] Initiating step 1: Search...');
        const searchRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 2,
            action: 'search',
            input: baseInput,
            projectData: projectStagesRef.current,
            model: selectedModel,
            projectId: projectId
          }),
          signal: controller.signal
        });
        const searchText = await searchRes.text();
        let searchData;
        try {
          searchData = JSON.parse(searchText);
        } catch (err) {
          throw new Error(`Search API returned non-JSON: ${searchText.substring(0, 50)}...`);
        }
        if (!searchRes.ok || !searchData.ok) throw new Error(searchData.error || 'Geographical research search failed');

        // Render intermediate numbers on screen instantly
        const newStagesPartial = { ...projectStagesRef.current };
        newStagesPartial.stage2 = {
          touchpoints: searchData.touchpoints,
          intel: {
            stateSummary: searchData.stateSummary,
            geoSchema: { level1: 'District', level2: 'Taluka', level3: 'Gram Panchayat' }
          },
          sources: searchData.sources
        };
        projectStagesRef.current = newStagesPartial;
        setProjectStages(newStagesPartial);

        // Step 2: Finalize compile (Fast compile, ~2s - NO search grounding)
        console.log('[Stage 2 Split] Initiating step 2: Finalize compile...');
        const finalizeRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 2,
            action: 'finalize',
            touchpoints: searchData.touchpoints,
            stateSummary: searchData.stateSummary,
            input: baseInput,
            projectData: projectStagesRef.current,
            model: selectedModel,
            projectId: projectId
          }),
          signal: controller.signal
        });
        const finalizeText = await finalizeRes.text();
        let finalizeData;
        try {
          finalizeData = JSON.parse(finalizeText);
        } catch (err) {
          throw new Error(`Finalize API returned non-JSON: ${finalizeText.substring(0, 50)}...`);
        }
        if (!finalizeRes.ok || !finalizeData.ok) throw new Error(finalizeData.error || 'Geographical finalization compile failed');

        const newStagesFinal = { ...projectStagesRef.current };
        newStagesFinal.stage2 = {
          touchpoints: finalizeData.touchpoints,
          intel: finalizeData.intel,
          sources: searchData.sources,
          _brief: getBriefSignature()
        };
        projectStagesRef.current = newStagesFinal;
        setProjectStages(newStagesFinal);
        await saveProjectToStorage(newStagesFinal);

      } else if (stageNum === 6) {
        // Step 1: Execute Resistance Google search on all 7 fronts (Fast, ~4-5s)
        console.log('[Stage 6 Split] Initiating step 1: Search...');
        const searchRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 6,
            action: 'search',
            input: baseInput,
            projectData: projectStagesRef.current,
            model: selectedModel,
            projectId: projectId
          }),
          signal: controller.signal
        });
        const searchText = await searchRes.text();
        let searchData;
        try {
          searchData = JSON.parse(searchText);
        } catch (err) {
          throw new Error(`Search API returned non-JSON: ${searchText.substring(0, 50)}...`);
        }
        if (!searchRes.ok || !searchData.ok) throw new Error(searchData.error || 'Resistance research search failed');

        // Step 2: Finalize compile risk register (Fast compile, ~2s - NO search grounding)
        console.log('[Stage 6 Split] Initiating step 2: Finalize compile...');
        const finalizeRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: 6,
            action: 'finalize',
            searchReport: searchData.searchReport,
            input: baseInput,
            projectData: projectStagesRef.current,
            model: selectedModel,
            projectId: projectId
          }),
          signal: controller.signal
        });
        const finalizeText = await finalizeRes.text();
        let finalizeData;
        try {
          finalizeData = JSON.parse(finalizeText);
        } catch (err) {
          throw new Error(`Finalize API returned non-JSON: ${finalizeText.substring(0, 50)}...`);
        }
        if (!finalizeRes.ok || !finalizeData.ok) throw new Error(finalizeData.error || 'Resistance finalization compile failed');

        const newStagesFinal = { ...projectStagesRef.current };
        newStagesFinal.stage6 = {
          data: finalizeData.data,
          sources: searchData.sources,
          _brief: getBriefSignature()
        };
        projectStagesRef.current = newStagesFinal;
        setProjectStages(newStagesFinal);
        await saveProjectToStorage(newStagesFinal);
      } else {
        // Standard single-call flow for all other stages
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: stageNum,
            input: baseInput,
            projectData: projectStagesRef.current,
            model: selectedModel,
            projectId: projectId
          }),
          signal: controller.signal
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          throw new Error(`API returned non-JSON: ${text.substring(0, 50)}...`);
        }
        if (!res.ok || !data.ok) throw new Error(data.error);

        const newStages = { ...projectStagesRef.current };
        newStages[`stage${stageNum}`] = { data: data.data, sources: data.sources, _brief: getBriefSignature() };
        projectStagesRef.current = newStages;
        setProjectStages(newStages);
        await saveProjectToStorage(newStages);
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setError(`Generation for Stage ${stageNum} was stopped.`);
      } else {
        setError(`Stage ${stageNum} Generation Failed: ${e.message}`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [stageNum]: false }));
    }
  };

  const generateStage11Funnel = async (funnel) => {
    setError(null);
    setGtmGeneratingStatus(funnel);
    
    try {
      // Ensure stage11 object exists
      let currentStages = { ...projectStagesRef.current };
      if (!currentStages.stage11) {
        currentStages.stage11 = { data: { branding: [], acquisition: [], engagement: [] }, sources: [] };
      }
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 11,
          action: funnel,
          input: {
            ...projectStages.setup,
            country,
            state,
            selectedMaterials,
            operationsStatus,
            projectStartMonth,
            projectStartYear,
            projectEndMonth,
            projectEndYear,
            targetTimeline,
            customConstraints,
            objective
          },
          projectData: currentStages,
          model: selectedModel,
          projectId: projectId
          }),
          signal: controller.signal
        });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || `Failed to generate ${funnel}`);
      
      const newFunnelData = data.data?.[funnel] || [];
      currentStages = {
        ...currentStages,
        stage11: {
          ...currentStages.stage11,
          data: {
            ...currentStages.stage11.data,
            [funnel]: newFunnelData
          },
          sources: [...new Set([...(currentStages.stage11.sources || []), ...(data.sources || [])])],
          _brief: getBriefSignature()
        }
      };
      projectStagesRef.current = currentStages;
      setProjectStages(currentStages);
      await saveProjectToStorage(currentStages);
    } catch (e) {
      setError(`Stage 11 (${funnel}) Generation Failed: ${e.message}`);
    } finally {
      setGtmGeneratingStatus(null);
    }
  };

  // ---- Project Knowledge (uploaded docs → the bot's "brain") ----
  const uploadKnowledge = async (file) => {
    if (!file) return;
    if (!/\.(pdf|md|markdown|txt|csv|tsv|json|log)$/i.test(file.name || '')) { setError('Supported files: PDF, Markdown (.md), text (.txt), CSV.'); return; }
    setKnowledgeUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      const doc = { id: `doc-${Date.now()}`, addedAt: new Date().toISOString(), ...data.doc };
      const base = projectStagesRef.current || {};
      const next = { ...base, knowledge: [ ...(base.knowledge || []), doc ] };
      projectStagesRef.current = next;
      setProjectStages(next);
      await saveProjectToStorage(next);
    } catch (e) {
      setError(`Document upload failed: ${e.message}`);
    } finally {
      setKnowledgeUploading(false);
    }
  };

  const removeKnowledge = async (id) => {
    const base = projectStagesRef.current || {};
    const next = { ...base, knowledge: (base.knowledge || []).filter(d => d.id !== id) };
    projectStagesRef.current = next;
    setProjectStages(next);
    await saveProjectToStorage(next);
  };

  const renderKnowledgePanel = (compact = false) => {
    const docs = (projectStages.knowledge) || [];
    return (
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: compact ? '10px 12px' : '14px 16px', background: compact ? 'var(--panel)' : '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: compact ? '12px' : '14px' }}>
            <BookOpen size={compact ? 15 : 17} style={{ color: 'var(--accent)' }} />
            Project Knowledge{docs.length ? ` (${docs.length})` : ''}
          </div>
          <label className="copilot-toggle-btn" style={{ cursor: knowledgeUploading ? 'wait' : 'pointer', opacity: knowledgeUploading ? 0.6 : 1, height: 30, padding: '0 12px' }}>
            {knowledgeUploading ? <><RefreshCw size={13} className="spin" /> Reading…</> : <><Plus size={14} /> Add file</>}
            <input type="file" accept=".pdf,.md,.markdown,.txt,.csv,.tsv,.json,.log,application/pdf,text/markdown,text/plain,text/csv" style={{ display: 'none' }} disabled={knowledgeUploading}
              onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) uploadKnowledge(f); e.target.value = ''; }} />
          </label>
        </div>
        {!compact && <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: '6px 0 0' }}>Upload tenders, regulations, reports, notes — PDF, Markdown (.md), text or CSV. Binny reads them and uses them as context in every stage it generates.</p>}
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {docs.length === 0 && <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontStyle: 'italic' }}>No documents added yet.</div>}
          {docs.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 6 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', overflow: 'hidden', minWidth: 0 }} title={d.filename}>
                <FileText size={14} style={{ flexShrink: 0, color: 'var(--ink-soft)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}{d.summarized ? ' · condensed' : ''}</span>
              </span>
              <span onClick={() => removeKnowledge(d.id)} title="Remove document" style={{ cursor: 'pointer', opacity: 0.5, display: 'inline-flex', flexShrink: 0 }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}>
                <X size={14} />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---- Deep Geography (multi-call Geo Intel enrichment) ----
  const persistDeep = async (deep) => {
    const base = projectStagesRef.current || {};
    const next = { ...base, stage2deep: { ...deep, generatedAt: new Date().toISOString() } };
    projectStagesRef.current = next;
    setProjectStages(next);
    await saveProjectToStorage(next);
  };
  const generateGeoDeep = async () => {
    setGeoDeepBusy(true); setError('');
    const input = { ...(projectStages.setup || {}), country, state, materials: selectedMaterials, selectedMaterials, implementationModel: model, operationsStatus };
    const deep = { ...((projectStagesRef.current || {}).stage2deep || {}) };
    const run = async (section, opts = {}) => {
      const res = await fetch('/api/geodeep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section, input, projectId, opts, model: selectedModel }) });
      const d = await res.json();
      return d.ok ? d.data : null;
    };
    try {
      setGeoDeepStage('economic'); const e = await run('economic'); if (e?.economicProfile) { deep.economicProfile = e.economicProfile; await persistDeep(deep); }
      setGeoDeepStage('income'); const inc = await run('income'); if (inc?.incomeClasses) { deep.incomeClasses = inc.incomeClasses; await persistDeep(deep); }
      setGeoDeepStage('priority'); const p = await run('priority', { limit: 12 }); if (p?.priorityUnits) { deep.priorityUnits = p.priorityUnits; await persistDeep(deep); }
      setGeoDeepStage('districts');
      let all = [];
      for (let b = 0; b < 3; b++) {
        const dd = await run('districts', { start: b * 18, size: 18 });
        if (!dd || !Array.isArray(dd.districts) || dd.districts.length === 0) break;
        all = [...all, ...dd.districts];
        deep.districts = all;
        await persistDeep(deep);
        if (dd.endOfList) break;
      }
    } catch (e) {
      setError('Deep geography failed: ' + e.message);
    } finally {
      setGeoDeepBusy(false); setGeoDeepStage('');
    }
  };

  const renderGeoDeep = () => {
    const deep = projectStages?.stage2deep;
    const lbl = (c) => c === 'Verified' ? { bg: '#E1F0EB', fg: '#0F6E56' } : c === 'Inferred' ? { bg: '#FAEEDA', fg: '#854F0B' } : { bg: '#F1EFE8', fg: '#5F5E5A' };
    const conf = (c) => { const s = lbl(c); return <span style={{ fontSize: 10, fontWeight: 600, background: s.bg, color: s.fg, padding: '1px 6px', borderRadius: 10 }}>{c || '—'}</span>; };
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Deep Geography &amp; Targeting</h2>
          <button className="copilot-toggle-btn" style={{ height: 32 }} onClick={generateGeoDeep} disabled={geoDeepBusy}>
            {geoDeepBusy ? <><RefreshCw size={13} className="spin" /> {geoDeepStage || 'Working'}…</> : <><Sparkles size={13} /> {deep ? 'Refresh' : 'Generate'} deep data</>}
          </button>
          {deep && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Brain-first · grounded fallback · adapts to the selected place</span>}
        </div>
        {!deep && !geoDeepBusy && <p className="sub" style={{ marginTop: 4 }}>District-level demographics, priority rollout ranking, income-class distribution and economic profile for {state || country}. Pulls verified facts from the DRS Brain where available, else grounded live.</p>}

        {deep?.economicProfile && (
          <div style={{ marginTop: 10 }}>
            <h3 style={{ margin: '8px 0 4px' }}>Economic profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              <div style={{ background: 'var(--grey-soft)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Per-capita income {deep.economicProfile.perCapitaIncome?.year ? `(${deep.economicProfile.perCapitaIncome.year})` : ''}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{deep.economicProfile.perCapitaIncome?.value || '—'}</div><div style={{ marginTop: 4 }}>{conf(deep.economicProfile.perCapitaIncome?.confidence)}</div></div>
              <div style={{ background: 'var(--grey-soft)', borderRadius: 8, padding: 12 }}><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>GSDP {deep.economicProfile.gsdp?.year ? `(${deep.economicProfile.gsdp.year})` : ''}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{deep.economicProfile.gsdp?.value || '—'}{deep.economicProfile.gsdp?.growthPct ? ` · ${deep.economicProfile.gsdp.growthPct}% growth` : ''}</div><div style={{ marginTop: 4 }}>{conf(deep.economicProfile.gsdp?.confidence)}</div></div>
            </div>
            {deep.economicProfile.notes && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{deep.economicProfile.notes}</p>}
          </div>
        )}

        {Array.isArray(deep?.priorityUnits) && deep.priorityUnits.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '8px 0 4px' }}>Priority rollout ranking</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '6px 8px' }}>#</th><th style={{ padding: '6px 8px' }}>Unit</th><th style={{ padding: '6px 8px' }}>Type</th><th style={{ padding: '6px 8px' }}>Population</th><th style={{ padding: '6px 8px' }}>Urban%</th><th style={{ padding: '6px 8px' }}>Why</th></tr></thead>
                <tbody>{deep.priorityUnits.map((u, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '6px 8px', fontWeight: 700 }}>{u.rank ?? i + 1}</td><td style={{ padding: '6px 8px' }}>{u.unit}</td><td style={{ padding: '6px 8px' }}>{u.type}</td><td style={{ padding: '6px 8px' }}>{u.population ?? '—'}</td><td style={{ padding: '6px 8px' }}>{u.urbanPct ?? '—'}</td><td style={{ padding: '6px 8px', color: 'var(--ink-soft)', fontSize: 12 }}>{u.rationale}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {Array.isArray(deep?.incomeClasses) && deep.incomeClasses.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '8px 0 4px' }}>Income-class distribution <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 400 }}>(deposit-claim likelihood)</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '6px 8px' }}>Class</th><th style={{ padding: '6px 8px' }}>Income range</th><th style={{ padding: '6px 8px' }}>% HH</th><th style={{ padding: '6px 8px' }}>Est. HH</th><th style={{ padding: '6px 8px' }}>Claim</th><th style={{ padding: '6px 8px' }}></th></tr></thead>
                <tbody>{deep.incomeClasses.map((c, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '6px 8px', fontWeight: 600 }}>{c.class}</td><td style={{ padding: '6px 8px' }}>{c.incomeRange}</td><td style={{ padding: '6px 8px' }}>{c.pctHouseholds ?? '—'}</td><td style={{ padding: '6px 8px' }}>{c.estHouseholds ?? '—'}</td><td style={{ padding: '6px 8px' }}>{c.depositClaimLikelihood || '—'}</td><td style={{ padding: '6px 8px' }}>{conf(c.confidence)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {Array.isArray(deep?.districts) && deep.districts.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <h3 style={{ margin: '8px 0 4px' }}>District intelligence <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 400 }}>({deep.districts.length} units, by population)</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
                <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '6px 8px' }}>Unit</th><th style={{ padding: '6px 8px' }}>Population</th><th style={{ padding: '6px 8px' }}>Households</th><th style={{ padding: '6px 8px' }}>Urban%</th><th style={{ padding: '6px 8px' }}>Literacy%</th><th style={{ padding: '6px 8px' }}>Sub-div</th><th style={{ padding: '6px 8px' }}>Local bodies</th><th style={{ padding: '6px 8px' }}></th></tr></thead>
                <tbody>{deep.districts.map((d, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '6px 8px', fontWeight: 600 }}>{d.name}</td><td style={{ padding: '6px 8px' }}>{d.population ?? '—'}</td><td style={{ padding: '6px 8px' }}>{d.households ?? '—'}</td><td style={{ padding: '6px 8px' }}>{d.urbanPct ?? '—'}</td><td style={{ padding: '6px 8px' }}>{d.literacyPct ?? '—'}</td><td style={{ padding: '6px 8px' }}>{d.level2Count ?? '—'}</td><td style={{ padding: '6px 8px' }}>{d.level3Count ?? '—'}</td><td style={{ padding: '6px 8px' }}>{conf(d.confidence)}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ================= GTM BLUEPRINT (Alokesh's DRS Formula) =================
  const gtmScenario = gtmScenarioOverride || (() => {
    const isIndia = (country || '').trim().toLowerCase() === 'india';
    const isNat = !state || /national|whole country/i.test(state);
    if (!isIndia) return 'International';
    return isNat ? 'National' : 'Regional';
  })();
  const persistGtm = async (gtm) => {
    const base = projectStagesRef.current || {};
    const next = { ...base, gtm: { ...gtm, scenario: gtmScenario, updatedAt: new Date().toISOString() } };
    projectStagesRef.current = next; setProjectStages(next); await saveProjectToStorage(next);
  };
  const gtmRun = async (section, opts = {}) => {
    const input = { ...(projectStages.setup || {}), country, state, materials: selectedMaterials, selectedMaterials, implementationModel: model, operationsStatus };
    const res = await fetch('/api/geodeep', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section, input, projectId, opts: { ...opts, scenario: gtmScenario }, model: selectedModel }) });
    const d = await res.json(); return d.ok ? d.data : null;
  };
  const generateGtmResearch = async () => {
    setGtmBusy(true); setError('');
    const gtm = { ...((projectStagesRef.current || {}).gtm || {}) }; gtm.research = { ...(gtm.research || {}) };
    try {
      setGtmStage('snapshot'); let r = await gtmRun('snapshot'); if (r?.snapshot) { gtm.research.snapshot = r.snapshot; await persistGtm(gtm); }
      // Districts: prefer the VERIFIED data layer (real sourced rows). Only fall
      // back to LLM generation if the table has nothing for this state yet.
      setGtmStage('districts');
      let usedVerified = false;
      try {
        const vres = await fetch('/api/geodata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'districts', country, state }) });
        const vj = await vres.json();
        if (vj?.ok && Array.isArray(vj.rows) && vj.rows.length) {
          gtm.research.districts = vj.rows.map((d) => ({
            name: d.district, population: d.population, households: d.households,
            urbanPct: d.urban_pct, literacyPct: d.literacy_pct, religions: d.religions,
            level2Count: d.level2_count, level3Count: d.level3_count,
            confidence: 'Verified', source: d.sources,
          }));
          gtm.research.districtsVerified = true;
          await persistGtm(gtm);
          usedVerified = true;
        }
      } catch { /* fall back to generation */ }
      if (!usedVerified) {
        gtm.research.districtsVerified = false;
        let all = []; for (let b = 0; b < 3; b++) { const dd = await gtmRun('districts', { start: b * 18, size: 18 }); if (!dd || !Array.isArray(dd.districts) || !dd.districts.length) break; all = [...all, ...dd.districts]; gtm.research.districts = all; await persistGtm(gtm); if (dd.endOfList) break; }
      }
      setGtmStage('priority'); r = await gtmRun('priority', { limit: 12 }); if (r?.priorityUnits) { gtm.research.priorityUnits = r.priorityUnits; await persistGtm(gtm); }
      setGtmStage('economic'); r = await gtmRun('economic'); if (r?.economicProfile) { gtm.research.economicProfile = r.economicProfile; await persistGtm(gtm); }
      setGtmStage('income'); r = await gtmRun('income'); if (r?.incomeClasses) { gtm.research.incomeClasses = r.incomeClasses; await persistGtm(gtm); }
      setGtmStage('context'); r = await gtmRun('context'); if (r?.context) { gtm.research.context = r.context; await persistGtm(gtm); }
    } catch (e) { setError('GTM Research failed: ' + e.message); } finally { setGtmBusy(false); setGtmStage(''); }
  };
  const generateGtmTargeted = async () => {
    setGtmBusy(true); setError('');
    const gtm = { ...((projectStagesRef.current || {}).gtm || {}) }; gtm.targeted = { ...(gtm.targeted || {}) };
    const cats = [['liquor', 'Liquor outlets'], ['horeca', 'HoReCa'], ['retail', 'Retail / supermarkets'], ['mrf', 'MRF / scrap dealers']];
    try {
      for (const [key, label] of cats) { setGtmStage(key); const r = await gtmRun('touchpoints', { category: key }); if (r?.touchpoints) { gtm.targeted[key] = { label, ...r.touchpoints }; await persistGtm(gtm); } }
    } catch (e) { setError('GTM Targeted failed: ' + e.message); } finally { setGtmBusy(false); setGtmStage(''); }
  };
  // Parse a natural query → { city, category } (e.g. "10 top restaurants in Shimla").
  const parseExtractQuery = (raw) => {
    const s = String(raw || '').trim();
    const CAT = [
      [/\b(restaurant|resturant|cafe|coffee|dining|eatery|eateries|food|hotel|bar|pub|horeca)\b/i, 'horeca'],
      [/\b(liquor|wine|alcohol|tasmac|beer|booze|off[- ]?licen[cs]e)\b/i, 'liquor'],
      [/\b(supermarket|grocery|groceries|kirana|retail|mart|departmental)\b/i, 'retail'],
      [/\b(scrap|recycl\w*|mrf|kabad\w*|junk|second[- ]?hand)\b/i, 'mrf'],
      [/\b(school|schools|college)\b/i, 'school'],
      [/\b(mall|malls)\b/i, 'mall'],
      [/\b(fuel|petrol|gas station|pump|filling station)\b/i, 'fuel'],
      [/\b(cinema|cinemas|theatre|theater|multiplex|movie)\b/i, 'cinema'],
    ];
    let category = null;
    for (const [re, c] of CAT) { if (re.test(s)) { category = c; break; } }
    let city = null;
    const m = s.match(/\b(?:in|at|near|for|around|of)\s+([a-z .&'-]+)\s*$/i);
    if (m) city = m[1].trim();
    if (!city) {
      city = s.replace(/\b(top|best|the|a|an|list|show|find|me|get|all|\d+|restaurants?|resturants?|cafes?|coffee|dining|eatery|eateries|food|hotels?|bars?|pubs?|liquor|wine|alcohol|shops?|stores?|outlets?|supermarkets?|grocery|groceries|kirana|retail|marts?|malls?|schools?|colleges?|fuel|petrol|pumps?|cinemas?|theatres?|theaters?|multiplex|scrap|recycl\w*|mrf|junk|in|at|near|for|around|of)\b/gi, '').replace(/[^a-z .&'-]/gi, ' ').replace(/\s+/g, ' ').trim();
    }
    if (!city) city = s;
    city = city.replace(/\b\w/g, (c) => c.toUpperCase());
    return { city, category };
  };
  // Live touchpoint extractor (free — OpenStreetMap via /api/extract, no worker).
  // Touchpoint Collector — general scraper. Parse the query, enqueue a job, poll.
  const runCollect = async () => {
    const raw = collectorQuery.trim();
    if (!raw) return;
    const parsed = parseExtractQuery(raw);
    const city = parsed.city || raw;
    // category: named DRS category if detected, else a slug from the leading words
    const cat = parsed.category
      || (raw.match(/^\s*(?:top\s+\d+\s+|best\s+|all\s+)?([a-z][a-z /&-]*?)\s+(?:in|at|near|for)\b/i)?.[1]?.trim().replace(/\s+/g, '-').toLowerCase())
      || 'general';
    setCollectorRows(null); setCollectorJob({ status: 'pending', count: 0, label: cat, offline: false }); setError('');
    try {
      const enq = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enqueue', city, category: cat, query: raw, state, country, total: 40 }) });
      const ej = await enq.json();
      if (!ej?.ok) { setError(ej?.error || 'Could not queue collection'); setCollectorJob(null); return; }
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const st = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', jobId: ej.jobId }) });
        const sj = await st.json();
        if (!sj?.ok || !sj.job) continue;
        setCollectorRows(sj.rows || []);
        const offline = sj.job.status === 'pending' && (sj.waitedMs || 0) > 25000;
        setCollectorJob({ status: sj.job.status, count: (sj.rows || []).length, label: cat, offline });
        if (sj.job.status === 'done' || sj.job.status === 'failed') { loadLibrary(); break; }
      }
    } catch (e) { setError('Collection error: ' + e.message); }
  };
  const loadLibrary = async () => {
    try {
      const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'library', country }) });
      const j = await r.json(); if (j?.ok) setCollectorLibrary(j.library || []);
    } catch { /* ignore */ }
  };
  const fetchCollectedCounts = async () => {
    if (!state) { setCollectedCounts({}); return; }
    try {
      const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'counts', country, state }) });
      const j = await r.json(); if (j?.ok) setCollectedCounts(j.byCategory || {});
    } catch { /* ignore */ }
  };
  // Social Intelligence — collect from a social platform (reuses the job queue).
  const runSocial = async () => {
    const q = socialQuery.trim();
    const isDiscovery = socialPlatform === 'instagram' || socialPlatform === 'linkedin';
    if (!q && !(isDiscovery && socialNiche)) return;
    setSocialRows(null); setSocialJob({ status: 'pending', count: 0, offline: false }); setError('');
    // Discovery platforms compose a targeted site:-search (niche/topic + text);
    // Meta Ad Library uses the raw query. Country + recency are REAL search filters.
    const terms = [isDiscovery ? socialNiche : '', q].filter(Boolean).join(' ');
    const query = socialPlatform === 'instagram' ? `site:instagram.com ${terms}`
      : socialPlatform === 'linkedin' ? `(site:linkedin.com/posts OR site:linkedin.com/pulse) ${terms}`
        : q;
    const region = isDiscovery ? socialCountry : null;
    const timelimit = isDiscovery ? (socialRecency || null) : null;
    try {
      const enq = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'enqueue', platform: socialPlatform, query, country, region, timelimit }) });
      const ej = await enq.json();
      if (!ej?.ok) { setError(ej?.error || 'Could not queue'); setSocialJob(null); return; }
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const st = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', jobId: ej.jobId }) });
        const sj = await st.json();
        if (!sj?.ok || !sj.job) continue;
        setSocialRows(sj.rows || []);
        const offline = sj.job.status === 'pending' && (sj.waitedMs || 0) > 25000;
        setSocialJob({ status: sj.job.status, count: (sj.rows || []).length, offline });
        if (sj.job.status === 'done' || sj.job.status === 'failed') { loadSocialLibrary(); break; }
      }
    } catch (e) { setError('Collection error: ' + e.message); }
  };
  const loadSocialLibrary = async () => {
    try {
      const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'social_library' }) });
      const j = await r.json(); if (j?.ok) setSocialLibrary(j.library || []);
    } catch { /* ignore */ }
  };
  useEffect(() => {
    if (activeTab === 'gtm' && gtmPhase === 'targeted') fetchCollectedCounts();
    if (activeTab === 'collector') loadLibrary();
    if (activeTab === 'social') loadSocialLibrary();
  }, [activeTab, gtmPhase, state]);
  const generateGtmNarrative = async () => {
    setGtmBusy(true); setError('');
    const gtm = { ...((projectStagesRef.current || {}).gtm || {}) };
    try { setGtmStage('narrative'); const r = await gtmRun('narrative'); if (r?.narrative) { gtm.narrative = r.narrative; await persistGtm(gtm); } }
    catch (e) { setError('GTM Narrative failed: ' + e.message); } finally { setGtmBusy(false); setGtmStage(''); }
  };
  const generateGtmAwareness = async () => {
    setGtmBusy(true); setError('');
    const gtm = { ...((projectStagesRef.current || {}).gtm || {}) };
    try { setGtmStage('awareness'); const r = await gtmRun('awareness'); if (r?.awareness) { gtm.awareness = r.awareness; await persistGtm(gtm); } }
    catch (e) { setError('GTM Awareness failed: ' + e.message); } finally { setGtmBusy(false); setGtmStage(''); }
  };

  const gtmConf = (c) => {
    const m = { Verified: ['#E6F1FB', '#0066CC'], Inferred: ['#FAEEDA', '#854F0B'], Assumption: ['#F1EFE8', '#5F5E5A'] };
    const [bg, fg] = m[c] || ['#F1EFE8', '#5F5E5A'];
    return <span style={{ fontSize: 10, fontWeight: 600, background: bg, color: fg, padding: '1px 6px', borderRadius: 10 }}>{c || '—'}</span>;
  };
  const gtmChan = (c) => c ? <span style={{ fontSize: 10, background: '#E6F1FB', color: '#185FA5', padding: '1px 6px', borderRadius: 10 }}>{c}</span> : null;

  const renderGtm = () => {
    const gtm = projectStages?.gtm || {};
    const R = gtm.research || {};
    const busyTag = gtmBusy ? <span style={{ fontSize: 11, color: 'var(--accent)' }}><span className="spinner" style={{ borderTopColor: 'var(--accent)', width: 11, height: 11, display: 'inline-block' }} /> {gtmStage || 'working'}…</span> : null;
    const phaseBtn = (key, label) => (
      <span onClick={() => setGtmPhase(key)} style={{ cursor: 'pointer', fontSize: 12.5, fontWeight: gtmPhase === key ? 600 : 500, background: gtmPhase === key ? 'var(--accent)' : 'var(--grey-soft)', color: gtmPhase === key ? '#fff' : 'var(--ink-soft)', padding: '6px 13px', borderRadius: 8 }}>{label}</span>
    );
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>GTM Blueprint</h3>
          <span style={{ fontSize: 12, background: '#E6F1FB', color: '#0066CC', padding: '2px 9px', borderRadius: 20 }}>{state ? `${state} · ${country}` : country || '—'}</span>
          <select value={gtmScenario} onChange={(e) => setGtmScenarioOverride(e.target.value)} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20, border: '1px solid var(--line)' }}>
            <option>Regional</option><option>National</option><option>International</option>
          </select>
          {busyTag}
        </div>
        <p className="sub" style={{ marginTop: 2, marginBottom: 12 }}>DRS Formula — {gtmScenario} scenario. Brain-first; each item tagged by confidence + channel.</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
          {phaseBtn('research', '1 · Research')}{phaseBtn('targeted', '2 · Targeted Research')}{phaseBtn('narrative', '3 · Narrative')}{phaseBtn('awareness', '4 · Awareness')}
        </div>

        {/* PHASE 1 · RESEARCH */}
        {gtmPhase === 'research' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={generateGtmResearch} disabled={gtmBusy}><Sparkles size={15} /> {R.snapshot ? 'Refresh' : 'Generate'} Research</button></div>

            {R.snapshot && (
              <div className="card"><h4 style={{ margin: '0 0 8px' }}>A · State Snapshot {gtmConf(R.snapshot.confidence)}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
                  {(R.snapshot._verified
                    ? [['Population', R.snapshot.population], ['Districts', R.snapshot.adminDivisions], ['Households', R.snapshot.households], ['Sub-divisions', R.snapshot.subDivisions], ['Blocks', R.snapshot.localBodies], ['Urban %', R.snapshot.urbanPct], ['Literacy %', R.snapshot.literacyPct]]
                    : [['Population', R.snapshot.population], ['Admin divisions', R.snapshot.adminDivisions], ['Urban local bodies', R.snapshot.urbanLocalBodies], ['Local bodies', R.snapshot.localBodies], ['Urban %', R.snapshot.urbanPct], ['Literacy %', R.snapshot.literacyPct]]
                  ).map(([l, v]) => (
                    <div key={l} style={{ background: 'var(--grey-soft)', borderRadius: 8, padding: '8px 10px' }}><div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>{l}</div><div style={{ fontSize: 15, fontWeight: 700 }}>{v ?? '—'}</div></div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(R.districts) && R.districts.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}><strong>B · District Intelligence</strong> <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>({R.districts.length} units)</span>{R.districtsVerified ? <span style={{ fontSize: 10.5, background: '#E6F1FB', color: '#0066CC', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>✓ Verified · Census / SHRUG / LGD</span> : <span style={{ fontSize: 10.5, background: '#FAEEDA', color: '#854F0B', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>LLM estimate — data layer empty for this state</span>}</div>
                <div style={{ overflowX: 'auto' }}>
                  {(() => {
                    // Religion columns adapt to the place's top-4 (same 4 for every row).
                    // Header names come from the first unit that returned them.
                    const relCols = ((R.districts.find(d => Array.isArray(d.religions) && d.religions.length) || {}).religions || []).slice(0, 4).map(r => r.name);
                    const relPct = (d, name) => {
                      const hit = Array.isArray(d.religions) ? d.religions.find(r => r.name === name) : null;
                      return hit && hit.pct != null && hit.pct !== '' ? `${hit.pct}%` : '—';
                    };
                    return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 620 + relCols.length * 70 }}>
                    <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '7px 10px' }}>Unit</th><th style={{ padding: '7px 10px' }}>Population</th><th style={{ padding: '7px 10px' }}>Households</th><th style={{ padding: '7px 10px' }}>Urban%</th><th style={{ padding: '7px 10px' }}>Literacy%</th>{relCols.map((n) => (<th key={n} style={{ padding: '7px 10px' }}>{n}%</th>))}<th style={{ padding: '7px 10px' }}>Sub-div</th><th style={{ padding: '7px 10px' }}>Local bodies</th></tr></thead>
                    <tbody>{R.districts.map((d, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '7px 10px', fontWeight: 600 }}>{d.name}</td><td style={{ padding: '7px 10px' }}>{d.population ?? '—'}</td><td style={{ padding: '7px 10px' }}>{d.households ?? '—'}</td><td style={{ padding: '7px 10px' }}>{d.urbanPct ?? '—'}</td><td style={{ padding: '7px 10px' }}>{d.literacyPct ?? '—'}</td>{relCols.map((n) => (<td key={n} style={{ padding: '7px 10px' }}>{relPct(d, n)}</td>))}<td style={{ padding: '7px 10px' }}>{d.level2Count ?? '—'}</td><td style={{ padding: '7px 10px' }}>{d.level3Count ?? '—'}</td></tr>))}</tbody>
                  </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* D · Priority Ranking — full width, with the strategy behind each placement */}
            {Array.isArray(R.priorityUnits) && R.priorityUnits.length > 0 && (
              <div className="card"><h4 style={{ margin: '0 0 3px' }}>D · Priority Ranking <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 400 }}>· recommended DRS rollout order</span></h4>
                <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '0 0 8px' }}>Ranked by population, urbanisation, commercial density &amp; tourism. Population is verified; the reason line is the AI's strategy for that exact placement.</p>
                {R.priorityUnits.slice(0, 12).map((u, i) => {
                  const reason = u.rationale
                    || [u.population ? `pop ${u.population}` : null, u.urbanPct != null ? `urban ${u.urbanPct}%` : null].filter(Boolean).join(' · ')
                    || 'ranked by overall DRS launch readiness';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                      <b style={{ color: 'var(--accent)', minWidth: 16, fontSize: 13 }}>{u.rank ?? i + 1}</b>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{u.unit}</span>
                          <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: 12 }}>{u.population ?? ''}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 2 }}>{reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {R.economicProfile && (
              <div className="card"><h4 style={{ margin: '0 0 8px' }}>E · Economic Profile {gtmConf(R.economicProfile.perCapitaIncome?.confidence)}</h4>
                <div style={{ fontSize: 12, lineHeight: 1.7 }}>PCI <b>{R.economicProfile.perCapitaIncome?.value ?? '—'}</b> ({R.economicProfile.perCapitaIncome?.year ?? '—'})<br />GSDP <b>{R.economicProfile.gsdp?.value ?? '—'}</b>{R.economicProfile.gsdp?.growthPct ? ` · ${R.economicProfile.gsdp.growthPct}% growth` : ''}</div>
                {R.economicProfile.notes && <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>{R.economicProfile.notes}</p>}
              </div>
            )}

            {Array.isArray(R.incomeClasses) && R.incomeClasses.length > 0 && (
              <div className="card"><h4 style={{ margin: '0 0 8px' }}>F · Income-Class Distribution <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 400 }}>(deposit-claim likelihood)</span></h4>
                <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}><thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '6px 9px' }}>Class</th><th style={{ padding: '6px 9px' }}>Range</th><th style={{ padding: '6px 9px' }}>% HH</th><th style={{ padding: '6px 9px' }}>Claim</th><th style={{ padding: '6px 9px' }}></th></tr></thead>
                  <tbody>{R.incomeClasses.map((c, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '6px 9px', fontWeight: 600 }}>{c.class}</td><td style={{ padding: '6px 9px' }}>{c.incomeRange}</td><td style={{ padding: '6px 9px' }}>{c.pctHouseholds ?? '—'}</td><td style={{ padding: '6px 9px' }}>{c.depositClaimLikelihood ?? '—'}</td><td style={{ padding: '6px 9px' }}>{gtmConf(c.confidence)}</td></tr>))}</tbody></table></div>
              </div>
            )}

            {R.context && (
              <div className="card"><h4 style={{ margin: '0 0 8px' }}>G · Context & Threats {gtmConf(R.context.confidence)}</h4>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}><b>Waste scenario:</b> {R.context.wasteScenario || '—'}</div>
                {Array.isArray(R.context.associations) && R.context.associations.length > 0 && <div style={{ fontSize: 12, marginTop: 6 }}><b>Associations:</b> {R.context.associations.join(', ')}</div>}
                {Array.isArray(R.context.threats) && R.context.threats.length > 0 && <div style={{ fontSize: 12, marginTop: 6 }}><b>DRS threats:</b> {R.context.threats.map(t => `${t.threat} (${t.type})`).join('; ')}</div>}
                {R.context.channelisation && <div style={{ fontSize: 12, marginTop: 6 }}><b>Channelisation:</b> {R.context.channelisation}</div>}
              </div>
            )}

            <div className="card" style={{ borderStyle: 'dashed', borderColor: '#6D5AE0' }}><h4 style={{ margin: '0 0 4px' }}>H · Human Workstreams</h4>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>Media agency · Events · Activation+Pilot · PR breakdown · Influencers — not auto-generated. <span style={{ fontSize: 10, background: '#EDEBFB', color: '#4A3C9E', padding: '1px 6px', borderRadius: 10 }}>🧑 Assign in Orchestrator</span></p>
            </div>
          </div>
        )}

        {/* PHASE 2 · TARGETED RESEARCH — the NUMBERS: estimated market total + real collected */}
        {gtmPhase === 'targeted' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={generateGtmTargeted} disabled={gtmBusy}><Sparkles size={15} /> {gtm.targeted ? 'Refresh' : 'Generate'} Touchpoint Numbers</button>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Estimated market totals + your real collected outlets, per category.</span>
              <button onClick={() => setActiveTab('collector')} style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>Collect real outlets → Touchpoint Collector</button>
            </div>
            {gtm.targeted && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
                {Object.entries(gtm.targeted).map(([k, t]) => {
                  const collected = collectedCounts[k] || 0;
                  return (
                    <div key={k} className="card"><h4 style={{ margin: '0 0 10px' }}>{t.label} {gtmConf(t.confidence)}</h4>
                      <div style={{ display: 'flex', gap: 18 }}>
                        <div><div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>Estimated total</div><div style={{ fontSize: 19, fontWeight: 700 }}>{t.estimatedCount ?? '—'}</div></div>
                        <div><div style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>Collected (real)</div><div style={{ fontSize: 19, fontWeight: 700, color: collected ? 'var(--accent)' : 'var(--ink-soft)' }}>{collected || '—'}</div></div>
                      </div>
                      {t.densityNote && <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.5 }}>{t.densityNote}</div>}
                    </div>
                  );
                })}
              </div>
            )}
            {!gtm.targeted && <p className="sub" style={{ fontSize: 12 }}>Generate to see estimated market totals per touchpoint category. Collect the real named outlets (name · phone · rating) in the <b>Touchpoint Collector</b> tab — the collected counts appear here automatically.</p>}
            <div className="card" style={{ borderStyle: 'dashed', borderColor: '#6D5AE0' }}><div style={{ fontSize: 12 }}><b>Retailer pain points</b> — field research. <span style={{ fontSize: 10, background: '#EDEBFB', color: '#4A3C9E', padding: '1px 6px', borderRadius: 10 }}>🧑 Orchestrator</span></div></div>
          </div>
        )}

        {/* PHASE 3 · NARRATIVE */}
        {gtmPhase === 'narrative' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div><button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={generateGtmNarrative} disabled={gtmBusy}><Sparkles size={15} /> {Array.isArray(gtm.narrative) && gtm.narrative.length ? 'Refresh' : 'Generate'} Narrative</button></div>
            {Array.isArray(gtm.narrative) && gtm.narrative.map((b, i) => (
              <div key={i} className="card"><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><strong style={{ fontSize: 12.5 }}>{i + 1} · {b.block}</strong><span style={{ marginLeft: 'auto' }}>{gtmChan(b.channel)}</span></div><div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{b.content}</div></div>
            ))}
          </div>
        )}

        {/* PHASE 4 · AWARENESS */}
        {gtmPhase === 'awareness' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={generateGtmAwareness} disabled={gtmBusy}><Sparkles size={15} /> {Array.isArray(gtm.awareness) && gtm.awareness.length ? 'Refresh' : 'Generate'} Awareness plan</button></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: 10 }}>
              {Array.isArray(gtm.awareness) && gtm.awareness.map((a, i) => (
                <div key={i} className="card"><div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>{a.theme}</div><div style={{ fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{a.content}</div><div style={{ marginTop: 6 }}>{gtmChan(a.channel)}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const exportCollectorCsv = () => {
    const rows = collectorRows || [];
    if (!rows.length) return;
    const cols = ['name', 'address', 'phone', 'rating', 'category', 'city'];
    const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const csv = [cols.join(',')].concat(rows.map((r) => cols.map((c) => esc(r[c])).join(','))).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `touchpoints_${(collectorQuery || 'export').replace(/[^a-z0-9]+/gi, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };
  const renderCollector = () => {
    const j = collectorJob;
    const busy = j && ['pending', 'running'].includes(j.status);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>Touchpoint Collector</h3>
          <span style={{ fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 20 }}>real named outlets · phone · rating</span>
        </div>
        <p className="sub" style={{ marginTop: 2, marginBottom: 14 }}>Collect real business data for any category, anywhere. Type what you want — e.g. "liquor shops in Coimbatore", "scrap dealers in Chennai", "electronics stores in Assam".</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <input value={collectorQuery} onChange={(e) => setCollectorQuery(e.target.value)} placeholder='e.g. "liquor shops in Coimbatore"' style={{ flex: 1, minWidth: 280, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }} onKeyDown={(e) => { if (e.key === 'Enter' && !busy) runCollect(); }} />
          <button className="btn" onClick={runCollect} disabled={!!busy || !collectorQuery.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{busy ? <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Collecting…</> : <><Sparkles size={15} /> Collect</>}</button>
        </div>
        {j && (
          <div style={{ marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: j.offline ? '#FAEEDA' : 'var(--accent-soft)', color: j.offline ? '#854F0B' : 'var(--accent)', padding: '9px 12px', borderRadius: 8 }}>
            {j.offline ? '⚠️ Collector agent is not running on your machine. Start it (python runner.py) and this resumes automatically.'
              : j.status === 'done' ? `✓ Done — ${j.count} outlets collected.`
                : j.status === 'failed' ? '⚠️ Collection failed — check the collector agent window.'
                  : <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Collecting… {j.count ? `${j.count} so far` : 'starting'}</>}
          </div>
        )}
        {Array.isArray(collectorRows) && collectorRows.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>Collected outlets</strong> <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>({collectorRows.length})</span>
              <button onClick={exportCollectorCsv} style={{ marginLeft: 'auto', fontSize: 12, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer' }}>⬇ Export CSV</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 620 }}>
                <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '7px 12px' }}>Name</th><th style={{ padding: '7px 12px' }}>Address</th><th style={{ padding: '7px 12px' }}>Phone</th><th style={{ padding: '7px 12px' }}>Rating</th></tr></thead>
                <tbody>{collectorRows.map((r, i) => (<tr key={i} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '7px 12px', fontWeight: 600 }}>{r.name}</td><td style={{ padding: '7px 12px', color: 'var(--ink-soft)' }}>{r.address || '—'}</td><td style={{ padding: '7px 12px' }}>{r.phone || '—'}</td><td style={{ padding: '7px 12px' }}>{r.rating ?? '—'}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><h4 style={{ margin: 0 }}>Collection Library</h4><span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>everything collected so far</span><button onClick={loadLibrary} style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Refresh</button></div>
          {collectorLibrary.length === 0 ? <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>Nothing collected yet — run a query above.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
              {collectorLibrary.map((l, i) => (<div key={i} style={{ background: 'var(--grey-soft)', borderRadius: 8, padding: '8px 11px' }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{l.city} · {l.category}</div><div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{l.count} outlets{l.state ? ` · ${l.state}` : ''}</div></div>))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSocial = () => {
    const j = socialJob;
    const busy = j && ['pending', 'running'].includes(j.status);
    const PLATFORMS = [
      { key: 'meta_ads', label: 'Meta Ad Library', hint: 'Competitor ads running on Facebook + Instagram (public, no login)', ready: true },
      { key: 'instagram', label: 'Instagram — Influencer Finder', hint: 'Find real public Instagram creators by location + theme (for your narrative)', ready: true },
      { key: 'linkedin', label: 'LinkedIn — Conversation Radar', hint: 'Find real public LinkedIn posts on a topic + place (who is saying what)', ready: true },
      { key: 'twitter', label: 'Twitter / X', hint: 'Conversation & sentiment', ready: false },
    ];
    const active = PLATFORMS.find((p) => p.key === socialPlatform) || PLATFORMS[0];
    const placeholder = socialPlatform === 'meta_ads' ? 'Advertiser or keyword — e.g. "Coca-Cola", "recycling", "Bisleri"'
      : socialPlatform === 'instagram' ? 'Location + theme — e.g. "sustainability Chennai" or "eco creator Kerala"'
        : socialPlatform === 'linkedin' ? 'Topic + place — e.g. "deposit return system Poland"'
          : 'Search…';
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: 'var(--accent)' }}>Social Intelligence</h3>
          <span style={{ fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 20 }}>competitor ads · influencers · stakeholders · sentiment</span>
        </div>
        <p className="sub" style={{ marginTop: 2, marginBottom: 14 }}>Public social intelligence — no login, no accounts. Competitor ads (Meta Ad Library), Instagram influencers by location, and who's posting about a topic on LinkedIn. Every result is a real, verifiable link.</p>
        {/* platform selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {PLATFORMS.map((p) => (
            <span key={p.key} onClick={() => p.ready && setSocialPlatform(p.key)} title={p.hint}
              style={{ cursor: p.ready ? 'pointer' : 'not-allowed', opacity: p.ready ? 1 : 0.5, fontSize: 12.5, fontWeight: socialPlatform === p.key ? 600 : 500, background: socialPlatform === p.key ? 'var(--accent)' : 'var(--grey-soft)', color: socialPlatform === p.key ? '#fff' : 'var(--ink-soft)', padding: '6px 13px', borderRadius: 8 }}>
              {p.label}{!p.ready && ' · soon'}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 8 }}>{active.hint}</div>
        {active.ready ? (
          <>
            {(socialPlatform === 'instagram' || socialPlatform === 'linkedin') && (() => {
              const COUNTRIES = [['in-en', 'India'], ['wt-wt', 'Global'], ['pl-pl', 'Poland'], ['gb-en', 'UK'], ['us-en', 'US'], ['de-de', 'Germany'], ['au-en', 'Australia'], ['sg-en', 'Singapore']];
              const RECENCY = [['', 'Any time'], ['d', 'Past 24h'], ['w', 'Past week'], ['m', 'Past month'], ['y', 'Past year']];
              const NICHES = ['sustainability', 'environment', 'climate', 'lifestyle', 'food', 'fashion', 'fitness', 'activism', 'local culture', 'travel'];
              const TOPICS = ['deposit return system', 'plastic waste', 'EPR', 'recycling policy', 'circular economy', 'packaging waste', 'waste management'];
              const opts = socialPlatform === 'linkedin' ? TOPICS : NICHES;
              const nLabel = socialPlatform === 'linkedin' ? 'Topic' : 'Niche';
              const selStyle = { fontSize: 12.5, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' };
              return (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <select value={socialCountry} onChange={(e) => setSocialCountry(e.target.value)} style={selStyle} title="Country">{COUNTRIES.map(([v, l]) => <option key={v} value={v}>🌍 {l}</option>)}</select>
                  <select value={socialRecency} onChange={(e) => setSocialRecency(e.target.value)} style={selStyle} title="Recency">{RECENCY.map(([v, l]) => <option key={v} value={v}>🕑 {l}</option>)}</select>
                  <select value={socialNiche} onChange={(e) => setSocialNiche(e.target.value)} style={selStyle} title={nLabel}><option value="">{nLabel}: any</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                </div>
              );
            })()}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <input value={socialQuery} onChange={(e) => setSocialQuery(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 280, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 14 }} onKeyDown={(e) => { if (e.key === 'Enter' && !busy) runSocial(); }} />
              <button className="btn" onClick={runSocial} disabled={!!busy || (!socialQuery.trim() && !((socialPlatform === 'instagram' || socialPlatform === 'linkedin') && socialNiche))} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{busy ? <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Collecting…</> : <><Sparkles size={15} /> Collect</>}</button>
            </div>
            {j && (
              <div style={{ marginBottom: 14, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, background: j.offline ? '#FAEEDA' : 'var(--accent-soft)', color: j.offline ? '#854F0B' : 'var(--accent)', padding: '9px 12px', borderRadius: 8 }}>
                {j.offline ? '⚠️ Collector agent is not running. Start it (python runner.py) and this resumes automatically.'
                  : j.status === 'done' ? `✓ Done — ${j.count} results.`
                    : j.status === 'failed' ? '⚠️ Collection failed — check the collector agent window.'
                      : <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Collecting… {j.count ? `${j.count} so far` : 'starting'}</>}
              </div>
            )}
            {Array.isArray(socialRows) && socialRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {socialRows.map((r, i) => (
                  <div key={i} className="card">
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 13.5 }}>{r.name || r.handle || 'Advertiser'}</strong>
                      {r.handle && r.handle !== r.name && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{r.handle}</span>}
                      {r.meta?.verified && <span style={{ fontSize: 10 }}>✔️</span>}
                      {r.meta?.followers != null && <span style={{ fontSize: 10.5, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 10 }}>{Number(r.meta.followers).toLocaleString('en-IN')} followers</span>}
                      {r.meta?.from_hashtag && <span style={{ fontSize: 10, color: 'var(--ink-faint)' }}>#{r.meta.from_hashtag}</span>}
                      {r.meta?.started && <span style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>· running since {r.meta.started}</span>}
                      {r.meta?.ad_count > 1 && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 10 }}>{r.meta.ad_count} ads use this creative</span>}
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)' }}>{socialPlatform === 'meta_ads' ? 'view creative ↗' : socialPlatform === 'linkedin' ? 'view post ↗' : 'view profile ↗'}</a>}
                    </div>
                    {r.snippet && <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 6, lineHeight: 1.5 }}>{r.snippet}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ borderStyle: 'dashed' }}><p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}><b>{active.label}</b> — coming in a later phase. {active.hint}.</p></div>
        )}
        {/* library */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><h4 style={{ margin: 0 }}>Collected so far</h4><button onClick={loadSocialLibrary} style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Refresh</button></div>
          {socialLibrary.length === 0 ? <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>Nothing collected yet.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
              {socialLibrary.map((l, i) => (<div key={i} style={{ background: 'var(--grey-soft)', borderRadius: 8, padding: '8px 11px' }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{l.platform}</div><div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{l.query ? `"${l.query}" · ` : ''}{l.count} records</div></div>))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ================= CREATIVE STUDIO =================
  // Run generation for one asset id, updating it in place (used by new create + retry).
  const runAssetGen = async (id, spec) => {
    setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: true, error: undefined } : a)));
    try {
      const gtm = projectStages?.gtm || {};
      const narrative = Array.isArray(gtm.narrative) ? gtm.narrative.map((b) => `${b.block}: ${b.content}`).join(' | ').slice(0, 600) : '';
      const res = await fetch('/api/creative', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: spec.channel || '', format: spec.format || '', hook: spec.hook || '', objective: spec.objective || '', market: state ? `${state}, ${country}` : country, narrative, model: selectedModel }),
      }).then((r) => r.json()).catch(() => null);
      setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: false, ...(res?.ok ? res.asset : { error: res?.error || 'Generation failed — please retry.' }) } : a)));
      if (res?.ok) persistAsset({ id, channel: spec.channel, format: spec.format, hook: spec.hook, objective: spec.objective, ...res.asset });
    } catch (e) {
      setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: false, error: e.message } : a)));
    }
  };
  // Generate ONE asset (from a plan row's Create button, or independent create).
  const generateAsset = async (spec) => {
    setActiveTab('creative');
    const id = 'a' + Date.now() + Math.floor(Math.random() * 1000);
    // If this scope's library isn't loaded yet, load it FIRST so the new asset
    // prepends onto the existing library instead of being wiped by a late load.
    if (loadedScopeRef.current !== creativeScope) {
      loadedScopeRef.current = creativeScope;
      setCreativeLibLoading(true);
      const { assets, imgs } = await loadScope(creativeScope);
      setCreativeImages(imgs);
      setCreativeAssets([{ id, loading: true, ...spec }, ...assets]);
      setCreativeLibLoading(false);
    } else {
      setCreativeAssets((prev) => [{ id, loading: true, ...spec }, ...prev]);
    }
    runAssetGen(id, spec);
  };
  const retryAsset = (a) => runAssetGen(a.id, { channel: a.channel, format: a.format, hook: a.hook, objective: a.objective });
  // Generate a full DRS carousel (multi-slide) and add it to the library.
  const generateCarousel = async () => {
    if (!carouselTopic.trim() || carouselBusy) return;
    setActiveTab('creative');
    setCarouselBusy(true);
    const id = 'c' + Date.now() + Math.floor(Math.random() * 1000);
    // ensure the scope's library is loaded so the new carousel prepends onto it
    if (loadedScopeRef.current !== creativeScope) {
      loadedScopeRef.current = creativeScope;
      const { assets, imgs } = await loadScope(creativeScope);
      setCreativeImages(imgs);
      setCreativeAssets([{ id, kind: 'carousel', channel: 'carousel', format: carouselRatio, hook: carouselTopic, loading: true }, ...assets]);
    } else {
      setCreativeAssets((prev) => [{ id, kind: 'carousel', channel: 'carousel', format: carouselRatio, hook: carouselTopic, loading: true }, ...prev]);
    }
    try {
      const gtm = projectStages?.gtm || {};
      const narrative = Array.isArray(gtm.narrative) ? gtm.narrative.map((b) => `${b.block}: ${b.content}`).join(' | ').slice(0, 600) : '';
      const res = await fetch('/api/carousel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: carouselTopic, slides: carouselSlides, market: state ? `${state}, ${country}` : (country || 'India'), narrative, model: selectedModel }),
      }).then((r) => r.json()).catch(() => null);
      if (res?.ok && res.carousel?.slides?.length) {
        const slides = res.carousel.slides.map((s, i) => ({ id: 's' + i + Math.random().toString(36).slice(2, 6), ...s }));
        const doc = { ratio: carouselRatio, slides, images: {} };
        const merged = { id, kind: 'carousel', channel: 'carousel', format: carouselRatio, hook: carouselTopic, title: res.carousel.title || carouselTopic, doc };
        setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: false, ...merged } : a)));
        persistAsset(merged);
      } else {
        setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: false, error: res?.error || 'Carousel generation failed — please retry.' } : a)));
      }
    } catch (e) {
      setCreativeAssets((prev) => prev.map((a) => (a.id === id ? { ...a, loading: false, error: e.message } : a)));
    }
    setCarouselBusy(false);
  };
  const generateCreative = async (focusOverride) => {
    setCreativeBusy(true); setError('');
    try {
      const gtm = projectStages?.gtm || {};
      const narrative = Array.isArray(gtm.narrative) ? gtm.narrative.map((b) => `${b.block}: ${b.content}`).join(' | ').slice(0, 800) : '';
      const res = await fetch('/api/creative', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: state ? `${state}, ${country}` : country,
          objective: objective || projectStages.setup?.objective || '',
          narrative,
          focus: (focusOverride ?? creativeFocus) || '',
          model: selectedModel,
        }),
      });
      const j = await res.json();
      if (j?.ok) setCreativeOutput(j.creative); else setError('Creative generation failed: ' + (j?.error || 'unknown'));
    } catch (e) { setError('Creative error: ' + e.message); } finally { setCreativeBusy(false); }
  };
  const renderCreative = () => {
    const B = { primary: '#005DFF', accent: '#1DC797', secondary: '#6E5CFA', alert: '#E74C3C', surface: '#F4F5F7', text: '#000000' };
    const c = creativeOutput || {};
    const Field = ({ label, children }) => (
      <div style={{ marginBottom: 6 }}><div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-soft)' }}>{label}</div><div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{children}</div></div>
    );
    const Visual = ({ v }) => v ? <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4, fontStyle: 'italic' }}>🎨 Visual: {v}</div> : null;

    const downloadCreative = async (id, label) => {
      const node = creativeRefs.current[id]; if (!node) return;
      try {
        const { toPng } = await import('html-to-image');
        const url = await toPng(node, { pixelRatio: 3.5, cacheBust: true });
        const a = document.createElement('a'); a.href = url; a.download = `recykal-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`; a.click();
      } catch (e) { setError('PNG export failed: ' + e.message); }
    };
    const cMarket = state ? `${state}, ${country}` : country;
    // Generate an AI background for a creative (falls back to gradient on failure).
    // Ambient scene only — never invents hardware (enforced server-side too).
    const genCreativeImage = async (id, brief, aspectRatio = '1:1') => {
      setCreativeImages((prev) => ({ ...prev, [id]: { loading: true } }));
      try {
        const res = await fetch('/api/creative-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: brief || `people returning empty beverage bottles and cans in ${cMarket}, clean street`, aspectRatio, market: cMarket }) }).then((r) => r.json()).catch(() => null);
        if (res?.ok && res.dataUrl) { setCreativeImages((prev) => ({ ...prev, [id]: { url: res.dataUrl } })); persistAssetById(id, res.dataUrl); }
        else setCreativeImages((prev) => ({ ...prev, [id]: { error: res?.error || 'failed' } }));
      } catch (e) { setCreativeImages((prev) => ({ ...prev, [id]: { error: e.message } })); }
    };
    // Use a REAL uploaded product/RVM photo directly as the background (no AI).
    const uploadProductPhoto = (id, file) => {
      if (!file) return;
      const r = new FileReader();
      r.onload = () => { setCreativeImages((prev) => ({ ...prev, [id]: { url: r.result, uploaded: true } })); persistAssetById(id, r.result); };
      r.readAsDataURL(file);
    };
    // A branded, on-brand ad creative rendered as real HTML → downloadable PNG.
    const CreativeCard = ({ id, w, h, grad, label, headline, sub, cta, brief }) => {
      const imgState = creativeImages[id] || {};
      const bg = imgState.url
        ? { backgroundImage: `linear-gradient(180deg, rgba(4,18,48,.32), rgba(4,14,40,.74)), url(${imgState.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: grad };
      return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 4 }}>{label}</div>
        <div ref={(el) => { creativeRefs.current[id] = el; }} style={{ width: w, height: h, ...bg, borderRadius: 14, position: 'relative', overflow: 'hidden', fontFamily: 'Poppins, sans-serif', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 22, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo-white.png" alt="Recykal" crossOrigin="anonymous" style={{ height: 26, width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,.25))' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div>
            <div style={{ fontSize: w > 300 ? 30 : 24, fontWeight: 800, lineHeight: 1.1, marginBottom: 8, textShadow: '0 1px 8px rgba(0,0,0,.15)' }}>{headline}</div>
            {sub && <div style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.4, opacity: .95 }}>{sub}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {cta && <span style={{ background: '#fff', color: B.primary, fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 30 }}>{cta}</span>}
            <span style={{ fontSize: 11, fontWeight: 500, opacity: .9 }}>recykal.com</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <button onClick={() => genCreativeImage(id, brief, w === h ? '1:1' : h > w ? '9:16' : '16:9')} disabled={imgState.loading} style={{ fontSize: 11.5, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>{imgState.loading ? '🖼️ generating…' : imgState.url && !imgState.uploaded ? '🖼️ regenerate' : '🖼️ AI scene'}</button>
          <label style={{ fontSize: 11.5, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }} title="Use a real product / RVM photo as the background">📷 Real photo<input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { uploadProductPhoto(id, e.target.files?.[0]); e.target.value = ''; }} /></label>
          {imgState.url && <button onClick={() => setCreativeImages((prev) => { const n = { ...prev }; delete n[id]; return n; })} style={{ fontSize: 11.5, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>✕ clear</button>}
          <button onClick={() => downloadCreative(id, label)} style={{ fontSize: 11.5, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>⬇ PNG</button>
        </div>
        {imgState.uploaded && <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 3 }}>using your uploaded photo</div>}
        {imgState.error && <div style={{ fontSize: 10, color: '#854F0B', marginTop: 3 }}>image gen unavailable — using gradient</div>}
      </div>
      );
    };
    const GRADS = [`linear-gradient(135deg, ${B.primary}, ${B.secondary})`, `linear-gradient(135deg, ${B.secondary}, ${B.accent})`, `linear-gradient(160deg, ${B.primary}, #0A5A4A)`, `linear-gradient(135deg, ${B.accent}, ${B.primary})`];
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
          <h3 style={{ margin: 0, color: B.primary }}>Creative Studio</h3>
          <span style={{ fontSize: 12, background: '#E6EFFF', color: B.primary, padding: '2px 9px', borderRadius: 20 }}>Recykal · brand-locked</span>
          {/* SCOPE indicator — where these creatives live */}
          <span title="Creatives are saved to this library" style={{ fontSize: 11.5, background: projectId ? '#EAFBF6' : '#F3F0FF', color: projectId ? '#0E9E7A' : B.secondary, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {projectId ? <>📁 {projectId}</> : <>🗂️ Independent · no project</>}
          </span>
          {/* SAVE state */}
          {creativeSaveState === 'saving' && <span style={{ fontSize: 11.5, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="spinner" style={{ width: 11, height: 11, display: 'inline-block' }} /> Saving…</span>}
          {creativeSaveState === 'saved' && <span style={{ fontSize: 11.5, color: B.accent, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Saved</span>}
        </div>
        <p className="sub" style={{ marginTop: 2, marginBottom: 12 }}>{projectId ? <>Everything you create here is saved to <b>{projectId}</b> and comes back when you reopen this project.</> : <>You're in the <b>Independent</b> library (no project selected). Open a project to see that project's creatives instead.</>} Content + on-brand creative, brand-locked, autosaved.</p>
        {/* brand strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14, fontSize: 11.5, color: 'var(--ink-soft)' }}>
          {Object.entries(B).map(([k, v]) => <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 13, height: 13, borderRadius: 3, background: v, border: '1px solid var(--line)' }} />{k}</span>)}
          <span>· Font <b style={{ fontFamily: 'Poppins, sans-serif' }}>Poppins</b> · "Sustainable Circularity"</span>
        </div>
        {/* INDEPENDENT CREATE — any asset, any format, any time */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>✨ Create any asset</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={assetChannel} onChange={(e) => setAssetChannel(e.target.value)} style={{ fontSize: 12.5, padding: '8px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' }}>{['PR', 'LinkedIn', 'Meta', 'Google', 'Email', 'WhatsApp', 'BTL', 'Social'].map((x) => <option key={x} value={x.toLowerCase()}>{x}</option>)}</select>
            <select value={assetFormat} onChange={(e) => setAssetFormat(e.target.value)} style={{ fontSize: 12.5, padding: '8px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' }}>{['op-ed', 'press release', 'blog', 'media pitch', 'email', 'whatsapp', 'booth', 'social'].map((x) => <option key={x} value={x}>{x}</option>)}</select>
            <input value={assetHook} onChange={(e) => setAssetHook(e.target.value)} placeholder="Hook / brief — what is this about?" style={{ flex: 1, minWidth: 220, padding: '8px 11px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} onKeyDown={(e) => { if (e.key === 'Enter' && assetHook.trim()) generateAsset({ channel: assetChannel, format: assetFormat, hook: assetHook, objective: '' }); }} />
            <button className="btn" onClick={() => generateAsset({ channel: assetChannel, format: assetFormat, hook: assetHook, objective: '' })} disabled={!assetHook.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: B.primary, borderColor: B.primary }}><Sparkles size={15} /> Create</button>
          </div>
        </div>
        {/* CAROUSEL MAKER — DRS green, multi-slide, AI-planned */}
        <div className="card" style={{ marginBottom: 14, border: '1px solid #049769' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🎠 Carousel maker <span style={{ fontSize: 10.5, background: '#E7F6F0', color: '#049769', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>DRS · green</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={carouselTopic} onChange={(e) => setCarouselTopic(e.target.value)} placeholder="Topic / brief — what's the carousel about?" style={{ flex: 1, minWidth: 240, padding: '8px 11px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} onKeyDown={(e) => { if (e.key === 'Enter') generateCarousel(); }} />
            <label style={{ fontSize: 11.5, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>slides
              <select value={carouselSlides} onChange={(e) => setCarouselSlides(Number(e.target.value))} style={{ fontSize: 12.5, padding: '8px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' }}>{[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            </label>
            <label style={{ fontSize: 11.5, color: 'var(--ink-soft)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>ratio
              <select value={carouselRatio} onChange={(e) => setCarouselRatio(e.target.value)} style={{ fontSize: 12.5, padding: '8px 9px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)' }}><option value="1:1">1:1 square</option><option value="4:5">4:5 portrait</option></select>
            </label>
            <button className="btn" onClick={generateCarousel} disabled={!carouselTopic.trim() || carouselBusy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#049769', borderColor: '#049769' }}>{carouselBusy ? <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Building…</> : <><Sparkles size={15} /> Generate carousel</>}</button>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 6 }}>AI plans each slide (cover → content → CTA), then you add AI/real images per slide and export a PDF or PNGs.</div>
        </div>
        {/* LIBRARY — everything saved in this scope (project or independent) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.02em', color: 'var(--ink)' }}>YOUR CREATIVES {creativeAssets.length > 0 && <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>({creativeAssets.length})</span>}</div>
          {creativeLibLoading && <span className="spinner" style={{ width: 12, height: 12, display: 'inline-block' }} />}
        </div>
        {!creativeLibLoading && creativeAssets.length === 0 && (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 12.5, padding: '20px 14px', borderStyle: 'dashed' }}>
            No creatives yet in {projectId ? <b>{projectId}</b> : <b>your Independent library</b>}. Use <b>✨ Create any asset</b> above, or hit <b>Create</b> on a plan row.
          </div>
        )}
        {creativeAssets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {creativeAssets.map((a) => (
              <div key={a.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10.5, background: '#E5EDED', color: B.primary, padding: '2px 8px', borderRadius: 10, fontWeight: 600, textTransform: 'uppercase' }}>{a.channel} · {a.format}</span>
                  {a.hook && <span style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{a.hook}</span>}
                  <button onClick={() => removeCreative(a.id)} title="Delete this creative" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 3, borderRadius: 6 }}><Trash2 size={14} /></button>
                </div>
                {a.loading ? <div style={{ fontSize: 12, color: 'var(--ink-soft)', display: 'flex', gap: 6, alignItems: 'center' }}><span className="spinner" style={{ width: 12, height: 12, display: 'inline-block' }} /> {a.kind === 'carousel' ? 'Building carousel…' : 'Writing…'}</div>
                  : a.error ? <div style={{ fontSize: 12, color: '#854F0B', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><span>⚠️ {a.error}</span>{a.kind !== 'carousel' && <button onClick={() => retryAsset(a)} style={{ fontSize: 11, fontWeight: 600, background: B.primary, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><RefreshCw size={12} /> Retry</button>}</div>
                    : a.kind === 'carousel' ? (
                      <CarouselEditor
                        id={a.id}
                        market={state ? `${state}, ${country}` : (country || 'India')}
                        model={selectedModel}
                        doc={a.doc}
                        onChange={(d) => handleDocChange(a.id, d)}
                        onError={(m) => setError(m)}
                      />
                    )
                    : (<>
                      {a.content && <div className="md-body" style={{ fontSize: 13, lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(a.content) }} />}
                      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <button onClick={() => { try { navigator.clipboard?.writeText(a.content || ''); } catch { } }} style={{ fontSize: 11, background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '5px 11px', cursor: 'pointer' }}>Copy text</button>
                      </div>
                      {a.hasVisual && a.headline && (
                        <CreativeEditor
                          id={a.id}
                          doc={a.doc && a.doc.el ? a.doc : undefined}
                          headline={a.headline} sub={a.sub} cta={a.cta}
                          imageUrl={creativeImages[a.id]?.url}
                          imgLoading={creativeImages[a.id]?.loading}
                          filename={a.title || a.hook || 'creative'}
                          onChange={(d) => handleDocChange(a.id, d)}
                          onGenImage={(ratio) => genCreativeImage(a.id, a.visualBrief, ratio)}
                          onUploadPhoto={(file) => uploadProductPhoto(a.id, file)}
                          onClearImage={() => { setCreativeImages((prev) => { const n = { ...prev }; delete n[a.id]; return n; }); persistAssetById(a.id, null); }}
                          onError={(m) => setError(m)}
                        />
                      )}
                    </>)}
              </div>
            ))}
          </div>
        )}
        {/* Quick all-channel pack */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <input value={creativeFocus} onChange={(e) => setCreativeFocus(e.target.value)} placeholder='Or generate a full all-channel pack — optional focus, e.g. "tourist beach clean-up drive"' style={{ flex: 1, minWidth: 300, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }} />
          <button className="btn" onClick={() => generateCreative()} disabled={creativeBusy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{creativeBusy ? <><span className="spinner" style={{ width: 13, height: 13, display: 'inline-block' }} /> Generating…</> : <><Sparkles size={15} /> {creativeOutput ? 'Regenerate' : 'All-channel'} pack</>}</button>
        </div>
        {!creativeOutput && !creativeBusy && <p className="sub" style={{ fontSize: 12 }}>Click Generate (or hit <b>Execute</b> on the Planning tab) to produce Meta, Google, LinkedIn, WhatsApp &amp; Email copy — brand-locked, spec-correct, with a visual brief per asset.</p>}
        {creativeOutput && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
            {c.meta_ads && (
              <div className="card"><h4 style={{ margin: '0 0 8px', color: B.secondary }}>Meta Ads</h4>
                {c.meta_ads.feed && <div style={{ marginBottom: 10 }}><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Feed 1:1</div><Field label="Primary text">{c.meta_ads.feed.primaryText}</Field><Field label="Headline">{c.meta_ads.feed.headline}</Field><Field label="Description">{c.meta_ads.feed.description}</Field><Field label="CTA">{c.meta_ads.feed.cta}</Field><Visual v={c.meta_ads.feed.visualBrief} /></div>}
                {c.meta_ads.story && <div><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Story 9:16</div><Field label="Primary text">{c.meta_ads.story.primaryText}</Field><Field label="Headline">{c.meta_ads.story.headline}</Field><Field label="CTA">{c.meta_ads.story.cta}</Field><Visual v={c.meta_ads.story.visualBrief} /></div>}
              </div>
            )}
            {c.google_ads && (
              <div className="card"><h4 style={{ margin: '0 0 8px', color: B.secondary }}>Google Ads</h4>
                {c.google_ads.search && <div style={{ marginBottom: 10 }}><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Search</div><Field label="Headlines">{(c.google_ads.search.headlines || []).map((h, i) => <div key={i}>• {h}</div>)}</Field><Field label="Descriptions">{(c.google_ads.search.descriptions || []).map((d, i) => <div key={i}>• {d}</div>)}</Field></div>}
                {c.google_ads.display && <div><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Responsive Display</div><Field label="Short headline">{c.google_ads.display.shortHeadline}</Field><Field label="Long headline">{c.google_ads.display.longHeadline}</Field><Field label="Description">{c.google_ads.display.description}</Field><Visual v={c.google_ads.display.visualBrief} /></div>}
              </div>
            )}
            {c.linkedin && (
              <div className="card"><h4 style={{ margin: '0 0 8px', color: B.secondary }}>LinkedIn</h4>
                {c.linkedin.post && <div style={{ marginBottom: 10 }}><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Organic post</div><Field label="Text">{c.linkedin.post.text}</Field><Field label="Hashtags">{(c.linkedin.post.hashtags || []).join('  ')}</Field></div>}
                {c.linkedin.ad && <div><div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Single-image ad</div><Field label="Intro">{c.linkedin.ad.introText}</Field><Field label="Headline">{c.linkedin.ad.headline}</Field><Field label="CTA">{c.linkedin.ad.cta}</Field><Visual v={c.linkedin.ad.visualBrief} /></div>}
              </div>
            )}
            {c.whatsapp && (
              <div className="card"><h4 style={{ margin: '0 0 8px', color: B.secondary }}>WhatsApp</h4><Field label="Message">{c.whatsapp.message}</Field><Field label="CTA">{c.whatsapp.cta}</Field><Visual v={c.whatsapp.visualBrief} /></div>
            )}
            {c.email && (
              <div className="card"><h4 style={{ margin: '0 0 8px', color: B.secondary }}>Email</h4><Field label="Subject">{c.email.subject}</Field><Field label="Preheader">{c.email.preheader}</Field><Field label="Body">{String(c.email.body || '').split('\n').map((p, i) => <p key={i} style={{ margin: '0 0 6px' }}>{p}</p>)}</Field><Field label="CTA">{c.email.cta}</Field><Visual v={c.email.visualBrief} /></div>
            )}
          </div>
        )}
        {creativeOutput && (
          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: '0 0 4px' }}>Ad Creatives <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 400 }}>· brand-locked · download as PNG</span></h4>
            <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '0 0 10px' }}>Rendered with the Recykal master logo, Poppins &amp; brand colors. Use <b>AI scene</b> for an on-brand background (never invents machines) or <b>Real photo</b> to drop in an actual product/RVM shot.</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {c.meta_ads?.feed && <CreativeCard id="mfeed" w={300} h={300} grad={GRADS[0]} label="Meta Feed 1:1" headline={c.meta_ads.feed.headline} sub={c.meta_ads.feed.primaryText} cta={c.meta_ads.feed.cta} brief={c.meta_ads.feed.visualBrief} />}
              {c.meta_ads?.story && <CreativeCard id="mstory" w={260} h={462} grad={GRADS[1]} label="Meta Story 9:16" headline={c.meta_ads.story.headline} sub={c.meta_ads.story.primaryText} cta={c.meta_ads.story.cta} brief={c.meta_ads.story.visualBrief} />}
              {c.linkedin?.ad && <CreativeCard id="li" w={360} h={200} grad={GRADS[2]} label="LinkedIn" headline={c.linkedin.ad.headline} sub={c.linkedin.ad.introText} cta={c.linkedin.ad.cta} brief={c.linkedin.ad.visualBrief} />}
              {c.google_ads?.display && <CreativeCard id="gd" w={300} h={250} grad={GRADS[3]} label="Google Display" headline={c.google_ads.display.longHeadline || c.google_ads.display.shortHeadline} sub={c.google_ads.display.description} cta="Learn more" brief={c.google_ads.display.visualBrief} />}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Runs a data-collection tool Binny requested, updating that chat message's
  // toolResult live (spinner → results) — reuses the same job queue as the tabs.
  const runChatTool = async (tool, msgId) => {
    const patch = (p) => setCopilotMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, toolResult: { ...(m.toolResult || {}), ...p } } : m)));
    try {
      // INSTANT: generate all-channel creative copy (Creative Studio) from chat.
      if (tool.tool === 'creative') {
        patch({ status: 'pending', kind: 'creative', label: tool.focus || 'all channels', count: 0 });
        const gtm = projectStages?.gtm || {};
        const narrative = Array.isArray(gtm.narrative) ? gtm.narrative.map((b) => `${b.block}: ${b.content}`).join(' | ').slice(0, 800) : '';
        const res = await fetch('/api/creative', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market: state ? `${state}, ${country}` : country, objective: objective || projectStages.setup?.objective || '', narrative, focus: tool.focus || '', model: selectedModel }),
        }).then((r) => r.json()).catch(() => null);
        if (!res?.ok) { patch({ status: 'error', msg: res?.error || 'Creative generation failed.' }); return; }
        setCreativeOutput(res.creative);
        const c = res.creative || {};
        const rows = [
          c.meta_ads?.feed && { name: 'Meta (feed)', snippet: `${c.meta_ads.feed.headline} — ${c.meta_ads.feed.primaryText}` },
          c.whatsapp && { name: 'WhatsApp', snippet: c.whatsapp.message },
          c.email && { name: 'Email', snippet: c.email.subject },
          c.linkedin?.post && { name: 'LinkedIn', snippet: String(c.linkedin.post.text || '').slice(0, 140) },
          c.google_ads?.search && { name: 'Google', snippet: (c.google_ads.search.headlines || []).join(' · ') },
        ].filter(Boolean);
        patch({ status: 'done', kind: 'creative', label: 'all channels', count: rows.length, rows, note: 'Full set is in the Creative Studio tab.' });
        return;
      }
      // INSTANT: verified district data — no queue, reads straight from the data layer.
      if (tool.tool === 'data') {
        const st = (tool.state || state || '').trim();
        patch({ status: 'pending', kind: 'data', label: st, count: 0 });
        const res = await fetch('/api/geodata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'districts', country, state: st }) }).then((r) => r.json()).catch(() => null);
        if (!res?.ok) { patch({ status: 'error', msg: res?.error || 'No verified data for that state.' }); return; }
        const rows = (res.rows || []).map((d) => ({
          name: d.district,
          snippet: `pop ${Number(d.population || 0).toLocaleString('en-IN')} · literacy ${d.literacy_pct ?? '—'}% · urban ${d.urban_pct ?? '—'}%` + (Array.isArray(d.religions) && d.religions.length ? ` · ${d.religions.map((r) => `${r.name} ${r.pct}%`).join(', ')}` : ''),
        }));
        patch({ status: rows.length ? 'done' : 'error', kind: 'data', label: st, count: rows.length, rows, msg: rows.length ? undefined : 'No verified data for that state.' });
        return;
      }
      let enqBody, kind, label;
      if (tool.tool === 'touchpoints') {
        const city = (tool.city || '').trim();
        const category = (tool.category || '').trim().toLowerCase();
        if (!city || !category) { patch({ status: 'error', msg: 'I need a city and a category.' }); return; }
        kind = 'touchpoints'; label = `${category} · ${city}`;
        enqBody = { action: 'enqueue', platform: 'google', city, category, state, country };
      } else if (tool.tool === 'social') {
        const platform = tool.platform || 'meta_ads';
        const raw = (tool.query || '').trim();
        if (!raw) { patch({ status: 'error', msg: 'I need something to search for.' }); return; }
        const region = tool.country || (platform !== 'meta_ads' ? 'in-en' : null);
        const query = platform === 'instagram' ? `site:instagram.com ${raw}`
          : platform === 'linkedin' ? `(site:linkedin.com/posts OR site:linkedin.com/pulse) ${raw}` : raw;
        kind = platform; label = raw;
        enqBody = { action: 'enqueue', platform, query, country, region, timelimit: null };
      } else { patch({ status: 'error', msg: 'Unknown tool.' }); return; }

      patch({ status: 'pending', kind, label, count: 0 });
      const enq = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(enqBody) }).then((r) => r.json()).catch(() => null);
      if (!enq?.ok) { patch({ status: 'error', msg: enq?.error || 'Could not start collection.' }); return; }
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const sj = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status', jobId: enq.jobId }) }).then((r) => r.json()).catch(() => null);
        if (!sj?.ok || !sj.job) continue;
        const rows = sj.rows || [];
        const offline = sj.job.status === 'pending' && (sj.waitedMs || 0) > 25000;
        patch({ status: sj.job.status, kind, label, count: rows.length, rows, offline });
        if (sj.job.status === 'done' || sj.job.status === 'failed') break;
      }
    } catch (e) { patch({ status: 'error', msg: e.message }); }
  };

  const handleCopilotSend = async () => {
    if (!copilotQuery.trim() && !copilotImage) return;
    const img = copilotImage;
    const userMsg = { sender: 'user', text: copilotQuery || (img ? '(image attached)' : ''), image: img?.preview };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotQuery(''); setCopilotImage(null);
    setCopilotLoading(true);

    try {
      const activeStageKey = activeTab === 'history' ? 'setup' : activeTab === 'orchestrator' ? 'stage17' : `stage${activeStageNum}`;
      const tabParam = activeTab === 'preplanning' ? 'preplanning' : activeTab === 'planning' ? 'planning' : activeTab === 'orchestrator' ? 'orchestrator' : activeTab === 'research' ? `research:${researchTab}` : (STAGES.find(s => s.num === activeTab)?.name || 'Setup');
      // Full-project bundle so Binny always has complete context (every stage), not just the open tab.
      const clip = (o, n) => { try { return o ? JSON.stringify(o).slice(0, n) : ''; } catch { return ''; } };
      const projectBundle = {
        setup: { country, state, implementationModel: model, operationsStatus, materials: selectedMaterials, objective: objective || projectStages.setup?.objective },
        marketIntel: clip(projectStages.stage3, 2500),
        stakeholders: clip(projectStages.stage4, 2500),
        competitors: clip(projectStages.stage5, 2000),
        resistance: clip(projectStages.stage6, 2000),
        gtm: clip(projectStages.gtm, 4500),
        campaignBrief: clip(projectStages.stage16, 3000),
        campaignPlan: clip(projectStages.stage17, 4500),
      };
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tab: tabParam,
          stateData: projectStages[activeStageKey] || { country, state, model, selectedMaterials, objective },
          projectBundle,
          query: userMsg.text,
          history: copilotMessages.slice(-6),
          model: selectedModel,
          knowledge: projectStages.knowledge || [],
          projectId: projectId || null,
          image: img ? { mimeType: img.mimeType, data: img.data } : null
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      // Co-author mode: robustly extract ::content-update:: (or legacy ::brief-update::)
      // proposals — brace-matched, tolerant of a missing ::end:: or trailing commas — and
      // strip the raw block from the reply even if the JSON can't be parsed.
      let display = data.text || '';
      const proposals = [];
      const tryParse = (s) => {
        for (const c of [s, s.replace(/,\s*([}\]])/g, '$1')]) { try { return JSON.parse(c); } catch {} }
        return null;
      };
      const cuts = [];
      const markerRe = /::(?:content-update|brief-update)::/g;
      let mk;
      while ((mk = markerRe.exec(display)) !== null) {
        const start = mk.index;
        const braceStart = display.indexOf('{', markerRe.lastIndex);
        let cutEnd, jsonStr = '';
        if (braceStart === -1) {
          cutEnd = display.length;
        } else {
          let depth = 0, end = -1;
          for (let k = braceStart; k < display.length; k++) {
            if (display[k] === '{') depth++;
            else if (display[k] === '}') { depth--; if (depth === 0) { end = k; break; } }
          }
          jsonStr = display.slice(braceStart, end === -1 ? display.length : end + 1);
          cutEnd = end === -1 ? display.length : end + 1;
          const em = display.indexOf('::end::', cutEnd);
          if (em !== -1 && em - cutEnd < 8) cutEnd = em + 7;
        }
        cuts.push([start, cutEnd]);
        markerRe.lastIndex = cutEnd;
        const p = tryParse(jsonStr);
        if (p) {
          if (p.section && p.content && !p.target) { p.target = p.section; p.op = 'set'; p.value = p.content; }
          if (p.target) proposals.push(p);
        }
      }
      // LIVE TOOL directive — Binny asks to run a data collection in-chat.
      let toolDirective = null;
      {
        const tm = /::tool::/g; let tk;
        while ((tk = tm.exec(display)) !== null) {
          const start = tk.index;
          const braceStart = display.indexOf('{', tm.lastIndex);
          if (braceStart === -1) { cuts.push([start, display.length]); break; }
          let depth = 0, end = -1;
          for (let k = braceStart; k < display.length; k++) { if (display[k] === '{') depth++; else if (display[k] === '}') { depth--; if (depth === 0) { end = k; break; } } }
          const jsonStr = display.slice(braceStart, end === -1 ? display.length : end + 1);
          let cutEnd = end === -1 ? display.length : end + 1;
          const em = display.indexOf('::end::', cutEnd); if (em !== -1 && em - cutEnd < 8) cutEnd = em + 7;
          cuts.push([start, cutEnd]); tm.lastIndex = cutEnd;
          const p = tryParse(jsonStr);
          if (p && p.tool && !toolDirective) toolDirective = p;
        }
      }
      for (const [s, e] of cuts.reverse()) display = display.slice(0, s) + display.slice(e);
      display = display.replace(/::end::/g, '').trim();
      const spokenText = display || (toolDirective ? 'On it…' : 'I have proposed changes below.');
      const msgSources = Array.isArray(data.sources) ? data.sources.filter(s => s && s.uri) : [];
      const msgId = 'm' + Date.now() + Math.floor(Math.random() * 1000);
      setCopilotMessages(prev => [...prev, { id: msgId, sender: 'assistant', text: spokenText, proposals: proposals.length ? proposals : undefined, tab: tabParam, sources: msgSources.length ? msgSources : undefined, tool: toolDirective || undefined }]);
      if (voiceMode) speak(spokenText);
      if (toolDirective) runChatTool(toolDirective, msgId);
    } catch (err) {
      setCopilotMessages(prev => [...prev, { sender: 'assistant', text: `Failed to fetch response: ${err.message}` }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // On the Market Research page the "active stage" is the selected sub-tab.
  // Pre-planning is stored internally as stage 16.
  const activeStageNum = activeTab === 'research' ? researchTab : activeTab === 'preplanning' ? 16 : activeTab === 'planning' ? 17 : activeTab;
  const activeStageData = projectStages[`stage${activeStageNum}`];

  // Edit a Campaign Brief field (Pre-planning) and persist.
  const updateBriefField = (key, value) => {
    setProjectStages((prev) => {
      const cur = prev.stage16 || { data: {} };
      const next = { ...prev, stage16: { ...cur, data: { ...cur.data, brief: { ...(cur.data?.brief || {}), [key]: value } } } };
      projectStagesRef.current = next;
      return next;
    });
  };
  const saveBrief = () => saveProjectToStorage(projectStagesRef.current);
  // Seed the Copilot with a section to refine, and open it.
  const discussBriefSection = (label) => {
    setCopilotCollapsed(false);
    setCopilotQuery(`Let's refine the "${label}" section of the Campaign Brief.`);
  };
  // Auto-open the Copilot on the Pre-planning / Planning pages (the editing surface).
  useEffect(() => { if (activeTab === 'preplanning' || activeTab === 'planning') setCopilotCollapsed(false); }, [activeTab]);
  const discussPlan = (label) => {
    setCopilotCollapsed(false);
    setCopilotQuery(`Let's refine the ${label} in the campaign plan.`);
  };

  // Generic co-author write-back: apply a Copilot proposal to the right section's data.
  const applyContentUpdate = (tab, p) => {
    setProjectStages((prev) => {
      const clone = { ...prev };
      const patch = (stageKey, arrKey) => {
        const st = clone[stageKey];
        if (!st?.data) return;
        let arr = Array.isArray(st.data[arrKey]) ? [...st.data[arrKey]] : [];
        if (p.op === 'add' && p.value) arr = [...arr, p.value];
        else if (p.op === 'remove' && Number.isInteger(p.index)) arr = arr.filter((_, i) => i !== p.index);
        else if (Number.isInteger(p.index)) arr = arr.map((r, i) => (i === p.index ? (p.field ? { ...r, [p.field]: p.value } : { ...r, ...(p.value || {}) }) : r));
        clone[stageKey] = { ...st, data: { ...st.data, [arrKey]: arr } };
      };
      if (tab === 'preplanning' && clone.stage16?.data) {
        clone.stage16 = { ...clone.stage16, data: { ...clone.stage16.data, brief: { ...(clone.stage16.data.brief || {}), [p.target]: p.value } } };
      } else if (tab === 'planning' && (p.target === 'campaignCalendar' || p.target === 'contentCalendar')) {
        patch('stage17', p.target);
      } else if (tab === 'orchestrator' && clone.stage17?.data?.contentCalendar && Number.isInteger(p.index)) {
        const cc = clone.stage17.data.contentCalendar.map((r, i) => (i === p.index ? { ...r, assignee: p.value } : r));
        clone.stage17 = { ...clone.stage17, data: { ...clone.stage17.data, contentCalendar: cc } };
      } else if (typeof tab === 'string' && tab.startsWith('research:')) {
        patch('stage' + tab.split(':')[1], p.target);
      }
      projectStagesRef.current = clone;
      return clone;
    });
    setTimeout(() => saveProjectToStorage(projectStagesRef.current), 0);
  };

  // Orchestrator: assign a team member to a planned task (index into stage17 content calendar).
  const updateAssignee = (idx, name) => {
    setProjectStages((prev) => {
      const s17 = prev.stage17;
      if (!s17?.data?.contentCalendar) return prev;
      const cc = s17.data.contentCalendar.map((t, i) => (i === idx ? { ...t, assignee: name } : t));
      const next = { ...prev, stage17: { ...s17, data: { ...s17.data, contentCalendar: cc } } };
      projectStagesRef.current = next;
      return next;
    });
    setTimeout(() => saveProjectToStorage(projectStagesRef.current), 0);
  };
  // Fill every unassigned task with its best skill-match.
  const autoAssignAll = () => {
    setProjectStages((prev) => {
      const s17 = prev.stage17;
      if (!s17?.data?.contentCalendar) return prev;
      const cc = s17.data.contentCalendar.map((t) => t.assignee ? t : { ...t, assignee: bestAssignee(t.requiredSkills) || '' });
      const next = { ...prev, stage17: { ...s17, data: { ...s17.data, contentCalendar: cc } } };
      projectStagesRef.current = next;
      return next;
    });
    setTimeout(() => saveProjectToStorage(projectStagesRef.current), 0);
  };

  // Export the plan to a formatted .xlsx (opens in Google Sheets / Excel).
  const [exporting, setExporting] = useState(false);
  const exportToSheets = async () => {
    const d = projectStagesRef.current.stage17?.data || {};
    const geo = state || country || 'project';
    const meta = {
      project: `${geo} — DRS Campaign Plan`,
      geography: geo,
      date: new Date().toLocaleDateString(),
      filename: `DRS-Plan-${String(geo).replace(/[^a-zA-Z0-9]+/g, '-')}`,
    };
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta, contentCalendar: d.contentCalendar || [], campaignCalendar: d.campaignCalendar || [], moments: d.moments || [] }),
      });
      if (!res.ok) throw new Error('server ' + res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = meta.filename + '.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // Generate all selected research stages (2-6) in dependency order (2 -> 6).
  const generateAllResearch = async () => {
    const toRun = [3, 4, 5, 6].filter((n) => selectedStages.includes(n));
    setResearchGenerating(true);
    try {
      for (const n of toRun) {
        setResearchTab(n);
        setResearchProgress(`Generating Stage ${n} — ${STAGES.find((s) => s.num === n)?.name}…`);
        await generateStage(n);
      }
      setResearchProgress('All research generated ✓');
    } finally {
      setResearchGenerating(false);
    }
  };

  if (AUTH_ENABLED && authMode !== 'active') {
    return (
      <AuthScreens
        mode={authMode}
        email={authUser?.email}
        onSignIn={signInWithGoogle}
        onSignOut={signOutUser}
      />
    );
  }

  return (
    <>
      <div className="dashboard">

      {/* Mobile Header (Only visible on small screens) */}
      <div className="mobile-header">
        <button className="mobile-hamburger" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
        <h1>DRS Bot</h1>
      </div>

      {/* 1. Left Sidebar Navigation */}
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>

        <div className="sidebar-header" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '20px 22px 16px',
          borderBottom: '1px solid var(--line)'
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>DRS Bot</h1>
            <p style={{ fontSize: '10px', color: 'var(--ink-soft)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roadmap Engine</p>
          </div>
        </div>
        
        <div className="sidebar-menu">
          <div className={`menu-item nav-teal ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <div className="badge-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" className="spin-slow" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <span>Project History</span>
          </div>

          <div className={`menu-item nav-amber ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
            <div className="badge-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={16} />
            </div>
            <span>Help &amp; Playbook</span>
          </div>

          {isAdmin && (
            <div className={`menu-item nav-violet ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <div className="badge-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={16} />
              </div>
              <span>Admin</span>
            </div>
          )}

          {isAdmin && (
            <div className={`menu-item nav-violet ${activeTab === 'brain' ? 'active' : ''}`} onClick={() => setActiveTab('brain')}>
              <div className="badge-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={16} />
              </div>
              <span>DRS Brain</span>
            </div>
          )}

          <div style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)' }}>ROADMAP FLOW</div>

          {(() => {
            const isSetupDone = projectId !== '';
            const renderStageItem = (s, indent = false) => {
              const isUnlocked = s.num === 1 || isSetupDone;
              const stale = isUnlocked && s.num !== 1 && isStageStale(s.num);
              return (
                <div
                  key={s.num}
                  className={`menu-item ${activeTab === s.num ? 'active' : ''} ${!isUnlocked ? 'disabled' : ''}`}
                  style={{ opacity: isUnlocked ? 1 : 0.5, pointerEvents: isUnlocked ? 'auto' : 'none', paddingLeft: indent ? '30px' : undefined }}
                  onClick={() => isUnlocked && setActiveTab(s.num)}
                >
                  <span className="badge-icon">{s.num}</span>
                  <span>{s.name}</span>
                  {stale && <span title="Out of date — Setup changed since this stage was generated. Regenerate to sync." style={{ marginLeft: 'auto', fontSize: '12px' }}>⚠️</span>}
                </div>
              );
            };

            const setupStage = STAGES.find((s) => s.num === 1);
            const researchStages = STAGES.filter((s) => [3, 4, 5, 6].includes(s.num) && selectedStages.includes(s.num));
            const laterStages = STAGES.filter((s) => s.num >= 7 && selectedStages.includes(s.num));
            const researchStale = isSetupDone && researchStages.some((s) => isStageStale(s.num));

            return (
              <>
                {setupStage && renderStageItem(setupStage)}

                {/* GTM BLUEPRINT — foundational research (scenario-aware Formula, Research→Awareness). Runs BEFORE Strategic Intelligence. */}
                <div
                  className={`menu-item ${activeTab === 'gtm' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                  style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                  onClick={() => isSetupDone && setActiveTab('gtm')}
                >
                  <span className="badge-icon">GT</span>
                  <span>GTM Blueprint</span>
                </div>

                {/* STRATEGIC INTELLIGENCE — builds on GTM (stages 3-6 as sub-tabs) */}
                {researchStages.length > 0 && (
                  <div
                    className={`menu-item ${activeTab === 'research' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                    style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                    onClick={() => isSetupDone && setActiveTab('research')}
                  >
                    <span className="badge-icon">SI</span>
                    <span>Strategic Intelligence</span>
                    {researchStale && <span title="A research stage is out of date — regenerate to sync." style={{ marginLeft: 'auto', fontSize: '12px' }}>⚠️</span>}
                  </div>
                )}

                {/* PRE-PLANNING — visible always, accessible once Setup is saved */}
                <div
                  className={`menu-item ${activeTab === 'preplanning' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                  style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                  onClick={() => isSetupDone && setActiveTab('preplanning')}
                >
                  <span className="badge-icon">PP</span>
                  <span>Pre-planning</span>
                  {isSetupDone && isStageStale(16) && <span title="Setup changed — regenerate brief" style={{ marginLeft: 'auto', fontSize: '12px' }}>⚠️</span>}
                </div>

                {/* PLANNING — visible always, accessible once Setup is saved */}
                <div
                  className={`menu-item ${activeTab === 'planning' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                  style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                  onClick={() => isSetupDone && setActiveTab('planning')}
                >
                  <span className="badge-icon">PL</span>
                  <span>Planning</span>
                  {isSetupDone && isStageStale(17) && <span title="Setup changed — regenerate plan" style={{ marginLeft: 'auto', fontSize: '12px' }}>⚠️</span>}
                </div>

                {/* ORCHESTRATOR — visible always, accessible once Setup is saved */}
                <div
                  className={`menu-item ${activeTab === 'orchestrator' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                  style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                  onClick={() => isSetupDone && setActiveTab('orchestrator')}
                >
                  <span className="badge-icon">OR</span>
                  <span>Orchestrator</span>
                </div>

                {/* ---- TOOLS: scope-aware, usable with OR without a project ---- */}
                <div style={{ padding: '12px 14px 6px', fontSize: '11px', fontWeight: 600, color: 'var(--ink-soft)', letterSpacing: '.02em' }}>TOOLS <span style={{ fontWeight: 400, opacity: .7 }}>· work with or without a project</span></div>

                {/* CREATIVE STUDIO — always accessible; project-scoped or independent */}
                <div
                  className={`menu-item ${activeTab === 'creative' ? 'active' : ''}`}
                  onClick={() => setActiveTab('creative')}
                >
                  <span className="badge-icon">CS</span>
                  <span>Creative Studio</span>
                </div>

                {/* TOUCHPOINT COLLECTOR — general scraper workspace (always accessible) */}
                <div
                  className={`menu-item ${activeTab === 'collector' ? 'active' : ''}`}
                  onClick={() => setActiveTab('collector')}
                >
                  <span className="badge-icon">TC</span>
                  <span>Touchpoint Collector</span>
                </div>

                {/* SOCIAL INTELLIGENCE — social platform intel (always accessible) */}
                <div
                  className={`menu-item ${activeTab === 'social' ? 'active' : ''}`}
                  onClick={() => setActiveTab('social')}
                >
                  <span className="badge-icon">SM</span>
                  <span>Social Intelligence</span>
                </div>

                {/* Stages 7-15 removed from the active flow for now (code + render blocks retained;
                    Narrative & BTL folded into Planning; revisit rest for Orchestration/Execution/Monitoring). */}
              </>
            );
          })()}
        </div>
        <div style={{ 
          padding: '16px 22px', 
          borderTop: '1px solid var(--line)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px' 
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '18px', height: '18px', objectFit: 'contain', opacity: 0.8 }} />
          <span className="muted" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--ink-soft)' }}>Powered by Recykal</span>
        </div>
        {AUTH_ENABLED && authUser && (
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {(authUser.email || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authProfile?.name || authUser.email}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{isAdmin ? 'Admin' : 'Member'}</div>
            </div>
            <button onClick={signOutUser} title="Sign out" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, border: '1px solid var(--line)', background: 'transparent', cursor: 'pointer', color: 'var(--ink-soft)', flexShrink: 0 }}>
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* 2. Main Workspace */}
      <div className="workspace">
        <div className="workspace-header">
          <h2>
            {activeTab === 'gtm' ? 'GTM Blueprint' : activeTab === 'brain' ? 'DRS Brain' : activeTab === 'help' ? 'Help & Playbook' : activeTab === 'admin' ? 'Admin Dashboard' : activeTab === 'history' ? 'Project History' : activeTab === 'research' ? 'Strategic Intelligence' : activeTab === 'preplanning' ? 'Pre-planning · Campaign Brief' : activeTab === 'planning' ? 'Planning · Campaign Plan' : activeTab === 'orchestrator' ? 'Orchestrator · Task Assignment' : activeTab === 'collector' ? 'Touchpoint Collector' : activeTab === 'social' ? 'Social Intelligence' : activeTab === 'creative' ? 'Creative Studio' : `Stage ${activeTab} · ${STAGES.find(s => s.num === activeTab)?.name}`}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {projectId && (
              <span className="muted" style={{ fontWeight: 600, marginRight: 8, display: 'inline-flex', alignItems: 'center' }}>
                {projectId} · {getProjectTitle({ country, state })}
                {parentProjectId && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      textDecoration: 'underline'
                    }}
                    onClick={() => {
                      const parentObj = projects.find(proj => proj.id === parentProjectId);
                      if (parentObj) loadProject(parentObj);
                    }}
                  >
                    ↳ Parent: {parentProjectId}
                  </span>
                )}
              </span>
            )}
            
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                style={{
                  background: 'var(--grey-soft)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  userSelect: 'none'
                }}
              >
                {(() => {
                  const active = MODEL_OPTIONS.find(m => m.value === selectedModel) || MODEL_OPTIONS[0];
                  return <>{renderModelIcon(active.icon)}{active.label}<ChevronDown size={14} style={{ marginLeft: 8, opacity: 0.6 }} /></>;
                })()}
              </div>
              
              {modelDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '220px',
                  overflow: 'hidden'
                }}>
                  {MODEL_OPTIONS.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => {
                        setSelectedModel(opt.value);
                        setModelDropdownOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        background: selectedModel === opt.value ? '#f1f5f9' : '#fff',
                        color: 'var(--ink)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = selectedModel === opt.value ? '#f1f5f9' : '#fff'}
                    >
                      {renderModelIcon(opt.icon)}
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {activeTab === 'planning' && (
              <button
                className="copilot-toggle-btn"
                style={{ background: '#009B60', borderColor: '#009B60', color: '#fff' }}
                title="Turn this plan into launch-ready, on-brand creative"
                onClick={() => { setActiveTab('creative'); if (!creativeOutput && !creativeBusy) generateCreative(); }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Play size={14} /> Execute</span>
              </button>
            )}
            {activeTab !== 'history' && activeTab !== 1 && activeTab !== 'orchestrator' && activeTab !== 'gtm' && activeTab !== 'creative' && (
              <button
                className={`copilot-toggle-btn ${loading[activeStageNum] ? 'danger' : ''}`}
                style={loading[activeStageNum] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }}
                onClick={() => loading[activeStageNum] ? cancelGeneration(activeStageNum) : generateStage(activeStageNum)}
              >
                {loading[activeStageNum] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> Regenerate Stage</span>}
              </button>
            )}
            <button className="copilot-toggle-btn" onClick={() => setCopilotCollapsed(!copilotCollapsed)}>
              {copilotCollapsed ? 'Show Copilot' : 'Hide Copilot'}
            </button>
          </div>
        </div>

        <div className="workspace-content">
          {error && <div className="err" style={{ marginBottom: 16 }}><b>Error:</b> {error}</div>}

          {activeTab !== 'history' && activeTab !== 1 && isStageStale(activeStageNum) && (
            <div className="err" style={{ marginBottom: 16, background: '#fff7ed', borderColor: '#fdba74', color: '#9a3412' }}>
              ⚠️ <b>Out of date:</b> your Setup has changed since this stage was generated. The data below reflects the old brief — click <b>Regenerate Stage</b> to sync it with the current Setup.
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'gtm' && renderGtm()}
          {activeTab === 'collector' && renderCollector()}
          {activeTab === 'social' && renderSocial()}
          {activeTab === 'creative' && renderCreative()}

          {activeTab === 'brain' && isAdmin && (() => {
            const s = brainStatus;
            const by = s?.byStatus || {};
            const tile = (label, val, color) => (
              <div style={{ background: 'var(--grey-soft)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--ink)' }}>{val}</div>
              </div>
            );
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Brain size={22} style={{ color: '#6D5AE0' }} />
                  <h3 style={{ margin: 0 }}>DRS Brain</h3>
                  <button className="copilot-toggle-btn" style={{ marginLeft: 'auto', height: 32 }} onClick={loadBrainStatus}><RefreshCw size={13} /> Refresh</button>
                </div>
                <p className="sub" style={{ marginTop: 4 }}>The bot's central memory. Add knowledge, verify it (grounded), and search what it knows. Uploads, generations, and Binny chats also feed it automatically.</p>

                {s && !s.enabled && (
                  <div style={{ margin: '14px 0', padding: '12px 16px', borderRadius: 10, background: '#FBEAEA', color: '#A32D2D', fontSize: 13 }}>
                    Brain is <b>disabled</b>. Set <code>BRAIN_ENABLED=true</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> on Render, then redeploy.
                  </div>
                )}
                {s && s.enabled && !s.connected && (
                  <div style={{ margin: '14px 0', padding: '12px 16px', borderRadius: 10, background: '#FAEEDA', color: '#854F0B', fontSize: 13 }}>
                    Enabled but not connected to Supabase — check the service key + that SQL_BRAIN.sql was run.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, margin: '16px 0 22px' }}>
                  {tile('Total facts', s?.total ?? '—')}
                  {tile('Verified', by.verified ?? '—', '#0F6E56')}
                  {tile('Experience', by.experience ?? '—', '#854F0B')}
                  {tile('Quarantined', by.quarantined ?? '—', '#A32D2D')}
                </div>

                {/* Contents — what's in the Brain */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} /><strong style={{ fontSize: 14 }}>What's in the Brain</strong>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-soft)' }}>{brainSources ? `${brainSources.length} source(s)` : ''}</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}>
                          <th style={{ padding: '9px 14px' }}>Source</th><th style={{ padding: '9px 10px' }}>Type</th><th style={{ padding: '9px 10px' }}>Facts</th><th style={{ padding: '9px 10px' }}>✅</th><th style={{ padding: '9px 10px' }}>⚠️</th><th style={{ padding: '9px 10px' }}>🚫</th><th style={{ padding: '9px 10px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(brainSources || []).map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '9px 14px', maxWidth: 320 }}>{s.source}</td>
                            <td style={{ padding: '9px 10px' }}><span style={{ fontSize: 11, background: 'var(--grey-soft)', padding: '1px 7px', borderRadius: 20 }}>{['upload','seed'].includes(s.origin) ? 'doc' : s.origin}</span></td>
                            <td style={{ padding: '9px 10px' }}>{s.total}</td>
                            <td style={{ padding: '9px 10px', color: '#0F6E56' }}>{s.verified}</td>
                            <td style={{ padding: '9px 10px', color: '#854F0B' }}>{s.experience}</td>
                            <td style={{ padding: '9px 10px', color: '#A32D2D' }}>{s.quarantined}</td>
                            <td style={{ padding: '9px 10px' }}><span onClick={() => removeBrainSource(s.source)} title="Remove from Brain" style={{ cursor: 'pointer', color: '#A32D2D', display: 'inline-flex' }}><Trash2 size={14} /></span></td>
                          </tr>
                        ))}
                        {brainSources && brainSources.length === 0 && <tr><td colSpan={7} style={{ padding: 18, textAlign: 'center', color: 'var(--ink-soft)' }}>The Brain is empty. Add knowledge below.</td></tr>}
                        {!brainSources && <tr><td colSpan={7} style={{ padding: 18, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading…</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add to Brain */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 8px' }}>Add knowledge</h4>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 10px' }}>Paste text to add directly to the central Brain. (For PDFs/files, upload via Project Knowledge — it also feeds the Brain.)</p>
                  <textarea value={brainText} onChange={(e) => setBrainText(e.target.value)} placeholder="Paste facts, notes, regulations, specs…" style={{ width: '100%', minHeight: 100, fontSize: 13 }} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                    <input value={brainSource} onChange={(e) => setBrainSource(e.target.value)} placeholder="Source (e.g. UK DRS regulation 2025)" style={{ flex: 1, minWidth: 180, fontSize: 13, height: 36 }} />
                    <select value={brainVisibility} onChange={(e) => setBrainVisibility(e.target.value)} style={{ fontSize: 13, height: 36, borderRadius: 6, border: '1px solid var(--line)', padding: '0 8px' }}>
                      <option value="internal">Internal only</option>
                      <option value="external">Shareable</option>
                    </select>
                    <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={addToBrain} disabled={brainBusy || !brainText.trim()}><Plus size={15} /> Add to Brain</button>
                  </div>
                </div>

                {/* Verify */}
                <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h4 style={{ margin: '0 0 4px' }}>Verify facts</h4>
                    <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>Runs the Verification Agent on a batch: grounds each unverified doc-fact and promotes the corroborated ones. Run repeatedly to clear the backlog.</p>
                  </div>
                  <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={runBrainVerify} disabled={brainBusy}><ShieldCheck size={15} /> Run verification</button>
                </div>

                {brainMsg && <div style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 8, background: 'var(--grey-soft)', fontSize: 13 }}>{brainMsg}</div>}

                {/* Search */}
                <div className="card">
                  <h4 style={{ margin: '0 0 8px' }}>Search the Brain</h4>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={brainSearchQuery} onChange={(e) => setBrainSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchBrain()} placeholder="e.g. Poland deposit value, Retearn RVM specs…" style={{ flex: 1, fontSize: 13, height: 38 }} />
                    <button className="btn" onClick={searchBrain} disabled={brainBusy}>Search</button>
                  </div>
                  {brainResults && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {brainResults.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>No matches.</div>}
                      {brainResults.map((r, i) => (
                        <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--panel)' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: r.status === 'verified' ? '#E1F0EB' : '#FAEEDA', color: r.status === 'verified' ? '#0F6E56' : '#854F0B' }}>{r.status}{r.confidence ? ' · ' + r.confidence : ''}</span>
                            {r.source && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{r.source}</span>}
                            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 'auto' }}>{Math.round((r.similarity || 0) * 100)}% match</span>
                          </div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{(r.content || '').slice(0, 300)}{(r.content || '').length > 300 ? '…' : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === 'help' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <HelpCircle size={22} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0 }}>The Complete Playbook</h3>
                <a href="/DRS-Bot-Playbook.pdf" download className="copilot-toggle-btn" style={{ marginLeft: 'auto', height: 32, textDecoration: 'none', color: 'var(--ink)' }}>
                  <Download size={14} /> Download PDF
                </a>
                <a href="/DRS-Bot-Playbook.pdf" target="_blank" rel="noreferrer" className="copilot-toggle-btn" style={{ height: 32, textDecoration: 'none', color: 'var(--ink)' }}>
                  <ExternalLink size={14} /> Open in tab
                </a>
              </div>
              <p className="sub" style={{ marginTop: 4 }}>New to the DRS bot? This manual explains every concept (Greenfield vs Brownfield, the implementation models, each stage) and walks you through building your first project. You can also just ask Binny "how do I use this?"</p>
              <div style={{ marginTop: 14, border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: 'var(--panel)' }}>
                <iframe src="/DRS-Bot-Playbook.pdf#view=FitH" title="DRS Bot Playbook" style={{ width: '100%', height: '78vh', border: 'none', display: 'block' }} />
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (() => {
            const projCount = (id) => adminProjects.filter(p => p.created_by === id).length;
            const pending = adminProfiles.filter(p => p.status === 'pending').length;
            const active = adminProfiles.filter(p => p.status === 'active').length;
            const statusPill = (s) => {
              const map = { active: ['#e6f5ee', '#0F6E56'], pending: ['#fdf0d5', '#854F0B'], revoked: ['#fbeaea', '#A32D2D'] };
              const [bg, fg] = map[s] || ['#eee', '#555'];
              return <span style={{ background: bg, color: fg, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>;
            };
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0 }}>Admin Dashboard</h3>
                  <button className="copilot-toggle-btn" style={{ marginLeft: 'auto', height: 32 }} onClick={loadAdmin}><RefreshCw size={13} className={adminLoading ? 'spin' : ''} /> Refresh</button>
                </div>
                <p className="sub" style={{ marginTop: 4 }}>Manage who has access, their roles, and what they've created.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, margin: '16px 0 22px' }}>
                  {[['Team members', adminProfiles.length], ['Active', active], ['Pending approval', pending], ['Projects', adminProjects.length]].map(([label, val]) => (
                    <div key={label} style={{ background: 'var(--grey-soft)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={16} /><strong style={{ fontSize: 14 }}>Access &amp; team</strong>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}>
                          <th style={{ padding: '10px 14px' }}>Member</th><th style={{ padding: '10px 14px' }}>Role</th><th style={{ padding: '10px 14px' }}>Status</th><th style={{ padding: '10px 14px' }}>Projects</th><th style={{ padding: '10px 14px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminProfiles.map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--line)', background: p.status === 'pending' ? '#fffaf0' : 'transparent' }}>
                            <td style={{ padding: '10px 14px' }}><div style={{ fontWeight: 600 }}>{p.name || '—'}</div><div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.email}</div></td>
                            <td style={{ padding: '10px 14px' }}>
                              <select value={p.role} onChange={(e) => updateUserRole(p.id, e.target.value)} disabled={p.id === authUser?.id} style={{ fontSize: 12, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--line)' }}>
                                <option value="member">member</option><option value="admin">admin</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px 14px' }}>{statusPill(p.status)}</td>
                            <td style={{ padding: '10px 14px' }}>{projCount(p.id)}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {p.status !== 'active' && <button className="btn" style={{ padding: '3px 12px', fontSize: 12, height: 28 }} onClick={() => updateUserStatus(p.id, 'active')}>Approve</button>}
                                {p.status === 'active' && p.id !== authUser?.id && <button onClick={() => updateUserStatus(p.id, 'revoked')} style={{ padding: '3px 12px', fontSize: 12, height: 28, borderRadius: 6, border: '1px solid var(--line)', background: 'transparent', color: '#A32D2D', cursor: 'pointer' }}>Revoke</button>}
                                {p.id === authUser?.id && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>you</span>}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {adminProfiles.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>{adminLoading ? 'Loading…' : 'No members yet.'}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: 18 }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}><strong style={{ fontSize: 14 }}>Recent projects &amp; who created them</strong></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
                      <thead><tr style={{ textAlign: 'left', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)' }}><th style={{ padding: '10px 14px' }}>Project</th><th style={{ padding: '10px 14px' }}>Created by</th><th style={{ padding: '10px 14px' }}>Updated</th></tr></thead>
                      <tbody>
                        {[...adminProjects].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')).slice(0, 15).map(pr => {
                          const owner = adminProfiles.find(u => u.id === pr.created_by);
                          return (
                            <tr key={pr.id} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '10px 14px' }}>{[pr.country, pr.state].filter(Boolean).join(' · ')} <span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{pr.id}</span></td>
                              <td style={{ padding: '10px 14px' }}>{owner ? (owner.name || owner.email) : <span style={{ color: 'var(--ink-soft)' }}>—</span>}</td>
                              <td style={{ padding: '10px 14px', color: 'var(--ink-soft)', fontSize: 12 }}>{pr.updated_at ? new Date(pr.updated_at).toLocaleDateString() : '—'}</td>
                            </tr>
                          );
                        })}
                        {adminProjects.length === 0 && <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-soft)' }}>No projects yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'history' && (
            <div>
              {!welcomeDismissed && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 18px', marginBottom: 20, borderRadius: 12, background: 'var(--accent)', color: '#fff' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: 15, marginBottom: 2 }}>New to the DRS bot?</div>
                    <div style={{ fontSize: 13, opacity: 0.92, lineHeight: 1.5 }}>The Playbook explains everything — Greenfield vs Brownfield, the models, every stage — and walks you through your first project. You can also just ask Binny "how do I use this?"</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button onClick={() => setActiveTab('help')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: 'var(--accent)', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <BookOpen size={15} /> Read the Playbook
                      </button>
                      <button onClick={dismissWelcome} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Got it, dismiss
                      </button>
                    </div>
                  </div>
                  <button onClick={dismissWelcome} title="Dismiss" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8, flexShrink: 0 }}>
                    <X size={18} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Active Projects</h3>
                <button className="btn" onClick={initNewProject}>+ Create New Project</button>
              </div>

              {projects.length === 0 ? (
                <p className="muted">No project blueprints found. Create a new one to begin.</p>
              ) : (
                <div className="grid two">
                  {(() => {
                    const rootProjects = projects.filter(p => !p.stages?.setup?.parentId || !projects.some(parent => parent.id === p.stages.setup.parentId));
                    return rootProjects.map((p) => {
                      const children = projects.filter(child => child.stages?.setup?.parentId === p.id);
                      return (
                        <div key={p.id} className="card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent)' }} onClick={() => loadProject(p)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong>{getProjectTitle(p)}</strong>
                              <div className="muted" style={{ fontSize: '11px', marginTop: 2 }}>ID: {p.id}</div>
                            </div>
                            <div style={{ position: 'relative' }}>
                              <button
                                className="btn ghost"
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '16px',
                                  borderRadius: '4px',
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--ink-soft)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === p.id ? null : p.id);
                                }}
                              >
                                ⋮
                              </button>
                              {openMenuId === p.id && (
                                <div
                                  className="dropdown-list"
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    width: '160px',
                                    zIndex: 100,
                                    background: '#ffffff',
                                    border: '1px solid var(--line)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div
                                    className="dropdown-item"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 7,
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      color: 'var(--ink)',
                                      borderBottom: '1px solid var(--line)'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      printProjectReport(p);
                                    }}
                                  >
                                    <FileText size={14} /> Export PDF Report
                                  </div>
                                  <div
                                    className="dropdown-item"
                                    style={{
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      color: 'var(--ink)',
                                      borderBottom: '1px solid var(--line)'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      openProjectPresentation(p);
                                    }}
                                  >
                                    📊 Present Pitch Deck
                                  </div>
                                  <div
                                    className="dropdown-item"
                                    style={{
                                      color: '#ef4444',
                                      padding: '8px 12px',
                                      fontSize: '13px',
                                      cursor: 'pointer',
                                      fontWeight: '600'
                                    }}
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      if (confirm(`Are you sure you want to delete the roadmap for "${p.state || 'this project'}"? This will delete all stages database records permanently.`)) {
                                        await deleteProject(p.id);
                                      }
                                    }}
                                  >
                                    Delete Project
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: '13px', marginTop: 8 }}>
                            <span className="phase p2 mr-2">{p.implementationModel.split(' ')[0]}</span>
                            <span className="phase p1">{p.materials.join(' · ')}</span>
                          </div>
                          <p style={{ fontSize: '13px', margin: '10px 0 0', color: 'var(--ink-soft)' }}>
                            Objective: {p.objective.slice(0, 80)}...
                          </p>
                          <div style={{ fontSize: '11px', marginTop: 12, textAlign: 'right', color: 'var(--ink-soft)' }}>
                            Last modified: {new Date(p.updatedAt).toLocaleDateString()}
                          </div>

                          {/* Accordion panel for Cascaded child projects */}
                          {children.length > 0 && (
                            <div 
                              style={{ 
                                marginTop: '16px', 
                                borderTop: '1px solid var(--line)', 
                                paddingTop: '12px' 
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div 
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  fontSize: '12px', 
                                  fontWeight: '600', 
                                  color: 'var(--accent)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => toggleAccordion(p.id)}
                              >
                                <span>↳ {children.length} Sub-Blueprints Generated</span>
                                <span>{expandedAccordions[p.id] ? '▲' : '▼'}</span>
                              </div>
                              
                              {expandedAccordions[p.id] && (
                                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {children.map(child => (
                                    <div 
                                      key={child.id}
                                      style={{ 
                                        background: '#f9f9fb', 
                                        padding: '10px', 
                                        borderRadius: '6px', 
                                        border: '1px solid var(--line)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => loadProject(child)}
                                    >
                                      <div>
                                        <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{getProjectTitle(child)}</strong>
                                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>ID: {child.id} | {child.materials.join(' · ')}</div>
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                          className="btn btn-sm ghost"
                                          style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid var(--line)' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            printProjectReport(child);
                                          }}
                                        >
                                          📄 PDF
                                        </button>
                                        <button
                                          className="btn btn-sm"
                                          style={{ padding: '3px 8px', fontSize: '11px' }}
                                          onClick={() => loadProject(child)}
                                        >
                                          Open
                                        </button>
                                        <button
                                          className="btn ghost"
                                          style={{ padding: '2px 6px', color: '#ef4444', border: 'none', background: 'none' }}
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete sub-blueprint for "${child.state}"?`)) {
                                              await deleteProject(child.id);
                                            }
                                          }}
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}

          {/* STAGE 1 SETUP */}
          {activeTab === 1 && (
            <div className="card">
              <h2>Setup Project Scope</h2>
              <p className="sub">Define geography and packaging materials.</p>
              
              <div className="grid two">
                <div style={{ position: 'relative' }}>
                  <label>Country</label>
                  <input
                    value={countrySearch}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setShowCountryList(true);
                    }}
                    onFocus={() => setShowCountryList(true)}
                    onBlur={() => setTimeout(() => setShowCountryList(false), 250)}
                    placeholder="Search country..."
                    autoComplete="off"
                  />
                  {showCountryList && (
                    <div className="dropdown-list">
                      {ALL_COUNTRIES
                        .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                        .map(c => (
                          <div
                            key={c}
                            className="dropdown-item"
                            onClick={() => {
                              setCountry(c);
                              setCountrySearch(c);
                              setShowCountryList(false);
                              const firstState = PREDEFINED_STATES[c]?.[0] || '';
                              setState(firstState);
                              setStateSearch(firstState);
                            }}
                          >
                            {c}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <label>State / Region</label>
                  <input
                    value={stateSearch}
                    onChange={(e) => {
                      setStateSearch(e.target.value);
                      setState(e.target.value);
                      if (dynamicStates.length > 0) {
                        setShowStateList(true);
                      }
                    }}
                    onFocus={() => {
                      if (dynamicStates.length > 0) {
                        setShowStateList(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowStateList(false), 250)}
                    placeholder="Search or type state/region..."
                    autoComplete="off"
                    disabled={!country}
                  />
                  {showStateList && country && dynamicStates.length > 0 && (
                    <div className="dropdown-list">
                      <div
                        className="dropdown-item"
                        style={{ fontWeight: 'bold', color: 'var(--accent)' }}
                        onClick={() => {
                          setState("National");
                          setStateSearch("National");
                          setShowStateList(false);
                        }}
                      >
                        -- Whole Country (National Level) --
                      </div>
                      {dynamicStates
                        .filter(s => s.toLowerCase().includes(stateSearch.toLowerCase()))
                        .map(s => (
                          <div
                            key={s}
                            className="dropdown-item"
                            onClick={() => {
                              setState(s);
                              setStateSearch(s);
                              setShowStateList(false);
                            }}
                          >
                            {s}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Implementation Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Materials</label>
                <div className="chips">
                  {MATERIALS.map((m) => (
                    <span
                      key={m}
                      className={`chip ${selectedMaterials.includes(m) ? 'on' : ''}`}
                      onClick={() => setSelectedMaterials(cur => cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m])}
                    >
                      {selectedMaterials.includes(m) ? '✓' : '+'} {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid two" style={{ marginTop: 16 }}>
                <div>
                  <label>Operations Status</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input type="radio" name="operationsStatus" value="Greenfield" checked={operationsStatus === 'Greenfield'} onChange={() => setOperationsStatus('Greenfield')} />
                      Greenfield (New Setup)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input type="radio" name="operationsStatus" value="Brownfield" checked={operationsStatus === 'Brownfield'} onChange={() => setOperationsStatus('Brownfield')} />
                      Brownfield (Expansion)
                    </label>
                  </div>
                </div>

                <div className="input-group">
                  <label className="mb-2 block text-xs">CALCULATED PROJECT DURATION</label>
                  <div className="card" style={{ padding: '12px 14px', background: 'var(--bg)', color: 'var(--accent)' }}>
                    {targetTimeline} {(!projectEndMonth || !projectEndYear) ? (targetTimeline === '365 Days' ? '(1-Year Rollout)' : '(Flexible Default)') : ''}
                  </div>
                </div>
              </div>

              <div className="grid two" style={{ marginTop: 16 }}>
                <div>
                  <label>Project Start Month</label>
                  <select value={projectStartMonth} onChange={(e) => setProjectStartMonth(e.target.value)}>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Project Start Year</label>
                  <select value={projectStartYear} onChange={(e) => setProjectStartYear(e.target.value)}>
                    {['2026', '2027', '2028'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid two" style={{ marginTop: 16 }}>
                <div>
                  <label>Project End Month (Optional)</label>
                  <select value={projectEndMonth} onChange={(e) => setProjectEndMonth(e.target.value)}>
                    <option value="">- Open / Continuous -</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Project End Year (Optional)</label>
                  <select value={projectEndYear} onChange={(e) => setProjectEndYear(e.target.value)}>
                    <option value="">- Open / Continuous -</option>
                    {['2026', '2027', '2028', '2029', '2030'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STAGES MULTI-SELECT DROPDOWN */}
              <div style={{ marginTop: 16, position: 'relative' }} ref={stagesDropdownRef}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Stages to Include</label>
                <div 
                  onClick={() => setStagesDropdownOpen(!stagesDropdownOpen)}
                  style={{ 
                    padding: '10px 14px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '8px', 
                    background: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#1e293b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>Select Stages to Generate ({selectedStages.length} Selected)</span>
                  <span style={{ transition: 'transform 0.2s', transform: stagesDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>

                {stagesDropdownOpen && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      zIndex: 999, 
                      background: '#ffffff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '8px', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                      maxHeight: '280px', 
                      overflowY: 'auto', 
                      padding: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => setSelectedStages([2, 3, 4, 5, 6, 7, 8, 9, 10, 11])}
                        style={{ fontSize: '12px', color: '#005DFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Select All
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedStages([])}
                        style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Clear All
                      </button>
                    </div>
                    {STAGES.filter(s => s.num !== 1 && s.num !== 2).map(s => {
                      const checked = selectedStages.includes(s.num);
                      return (
                        <div 
                          key={s.num}
                          onClick={() => {
                            if (checked) {
                              setSelectedStages(prev => prev.filter(x => x !== s.num));
                            } else {
                              setSelectedStages(prev => [...prev, s.num].sort((a,b) => a - b));
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: checked ? '#f0f7ff' : '#ffffff',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = checked ? '#e0f0ff' : '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = checked ? '#f0f7ff' : '#ffffff'}
                        >
                          <input 
                            type="checkbox" 
                            checked={checked}
                            readOnly
                            style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                          />
                          <span style={{ fontSize: '13px', color: checked ? '#005DFF' : '#334155', fontWeight: checked ? '600' : 'normal' }}>
                            {s.num}. {s.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedStages.map(sNum => {
                    const s = STAGES.find(st => st.num === sNum);
                    if (!s) return null;
                    return (
                      <span 
                        key={sNum}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '4px 10px', 
                          borderRadius: '16px', 
                          fontSize: '11px', 
                          background: '#f1f5f9', 
                          border: '1px solid #e2e8f0', 
                          color: '#475569',
                          fontWeight: '500'
                        }}
                      >
                        {s.num}. {s.name}
                        <button
                          type="button"
                          onClick={() => setSelectedStages(prev => prev.filter(x => x !== sNum))}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* WORKSTREAMS MULTI-SELECT DROPDOWN */}
              <div style={{ marginTop: 20, position: 'relative' }} ref={workstreamsDropdownRef}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '13px' }}>Active Execution Workstreams to Generate</label>
                <div 
                  onClick={() => setWorkstreamsDropdownOpen(!workstreamsDropdownOpen)}
                  style={{ 
                    padding: '10px 14px', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '8px', 
                    background: '#ffffff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#1e293b',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span>Select Active Workstreams ({selectedWorkstreams.length} Selected)</span>
                  <span style={{ transition: 'transform 0.2s', transform: workstreamsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>

                {workstreamsDropdownOpen && (
                  <div 
                    style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      right: 0, 
                      zIndex: 999, 
                      background: '#ffffff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '8px', 
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                      maxHeight: '280px', 
                      overflowY: 'auto', 
                      padding: '12px', 
                      marginTop: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                      <button 
                        type="button"
                        onClick={() => setSelectedWorkstreams([1, 2, 3, 4, 5, 6, 7])}
                        style={{ fontSize: '12px', color: '#6E5CFA', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Select All
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedWorkstreams([])}
                        style={{ fontSize: '12px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Clear All
                      </button>
                    </div>
                    {[
                      { id: 1, name: '1. Government & Regulatory' },
                      { id: 2, name: '2. Brand/Producer & Deposit' },
                      { id: 3, name: '3. Touchpoint Onboarding' },
                      { id: 4, name: '4. Infrastructure & RVM Deployment' },
                      { id: 5, name: '5. Consumer Awareness' },
                      { id: 6, name: '6. Operations & Collection' },
                      { id: 7, name: '7. Launch & Scale' }
                    ].map(w => {
                      const checked = selectedWorkstreams.includes(w.id);
                      return (
                        <div 
                          key={w.id}
                          onClick={() => {
                            if (checked) {
                              setSelectedWorkstreams(prev => prev.filter(x => x !== w.id));
                            } else {
                              setSelectedWorkstreams(prev => [...prev, w.id].sort((a,b) => a - b));
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: checked ? '#f3f0ff' : '#ffffff',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = checked ? '#e8e0ff' : '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = checked ? '#f3f0ff' : '#ffffff'}
                        >
                          <input 
                            type="checkbox" 
                            checked={checked}
                            readOnly
                            style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
                          />
                          <span style={{ fontSize: '13px', color: checked ? '#6E5CFA' : '#334155', fontWeight: checked ? '600' : 'normal' }}>
                            {w.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selectedWorkstreams.map(wId => {
                    const nameMap = {
                      1: 'G&R',
                      2: 'Brand/Deposit',
                      3: 'Onboarding',
                      4: 'Infrastructure',
                      5: 'Awareness',
                      6: 'Operations',
                      7: 'Launch'
                    };
                    return (
                      <span 
                        key={wId}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '4px 10px', 
                          borderRadius: '16px', 
                          fontSize: '11px', 
                          background: '#f3f0ff', 
                          border: '1px solid #e2d9fc', 
                          color: '#5b21b6',
                          fontWeight: '500'
                        }}
                      >
                        {nameMap[wId]}
                        <button
                          type="button"
                          onClick={() => setSelectedWorkstreams(prev => prev.filter(x => x !== wId))}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#b9a5f9', fontSize: '12px', fontWeight: 'bold' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#b9a5f9'}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Local Constraints / Weather Factors (Optional)</label>
                <textarea 
                  placeholder="e.g. Avoid construction during peak Monsoon (June-Sept); Volume spikes during tourist seasons (Dec-Jan)..."
                  value={customConstraints} 
                  onChange={(e) => setCustomConstraints(e.target.value)} 
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <label>Business Objective</label>
                <textarea value={objective} onChange={(e) => setObjective(e.target.value)} />
              </div>

              <div style={{ marginTop: 20 }}>
                {renderKnowledgePanel(false)}
              </div>

              <div style={{ marginTop: 24 }}>
                <button className="btn" onClick={handleSetupSubmit} disabled={loading[1] || !state || selectedMaterials.length === 0}>
                  {loading[1] ? 'Saving...' : 'Save & Unlock Roadmap →'}
                </button>
              </div>
            </div>
          )}

          {/* MARKET RESEARCH — combined page header: sub-tabs + Generate All Research */}
          {activeTab === 'research' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STAGES.filter((s) => [3, 4, 5, 6].includes(s.num) && selectedStages.includes(s.num)).map((s) => {
                    const has = !!projectStages[`stage${s.num}`];
                    const stale = isStageStale(s.num);
                    return (
                      <button
                        key={s.num}
                        onClick={() => setResearchTab(s.num)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          border: '1px solid var(--line)',
                          background: researchTab === s.num ? 'var(--accent)' : 'var(--grey-soft)',
                          color: researchTab === s.num ? '#fff' : 'var(--ink)',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <span>{s.num}. {s.name}</span>
                        {has && !stale && <span style={{ color: researchTab === s.num ? '#fff' : 'var(--green)' }}>✓</span>}
                        {stale && <span title="Out of date">⚠️</span>}
                      </button>
                    );
                  })}
                </div>
                <button className={`btn ${researchGenerating ? 'danger' : ''}`} style={researchGenerating ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => researchGenerating ? cancelGeneration(researchTab) : generateAllResearch()}>
                  {researchGenerating ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Zap size={14} /> Generate All Research</span>}
                </button>
              </div>
              {researchGenerating && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{researchProgress}</div>}
            </div>
          )}

          {/* GENERATION STATE WRAPPER FOR STAGES 2-15 (Bypassed for Stage 11) */}
          {(typeof activeTab === 'number' || activeTab === 'research' || activeTab === 'preplanning' || activeTab === 'planning') && activeStageNum > 1 && activeStageNum !== 11 && !activeStageData && (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h2>{activeTab === 'preplanning' ? 'Campaign Brief' : activeTab === 'planning' ? 'Campaign Plan' : STAGES.find((s) => s.num === activeStageNum)?.name || `Stage ${activeStageNum}`} is not yet generated</h2>
              <p className="sub">{activeTab === 'preplanning' ? 'The AI Director will synthesize your research into a SWOT and a first draft of the 7-section brief. You then edit and lock it.' : activeTab === 'planning' ? 'The AI will turn your locked brief into a 360° plan: moments, a campaign calendar, and a weekly content calendar (each row a task). Refine via the Copilot.' : 'The engine will pull real datasets and formulate the roadmap for this stage.'}</p>
              <button className={`btn ${loading[activeStageNum] ? 'danger' : ''}`} style={loading[activeStageNum] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => loading[activeStageNum] ? cancelGeneration(activeStageNum) : generateStage(activeStageNum)}>
                {loading[activeStageNum] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : (activeTab === 'preplanning' ? 'Draft the Campaign Brief' : activeTab === 'planning' ? 'Generate the Campaign Plan' : `Generate ${STAGES.find((s) => s.num === activeStageNum)?.name || 'Stage ' + activeStageNum}`)}
              </button>
              {loading[activeStageNum] && (
                <div className="muted" style={{ marginTop: 12 }}>
                  Querying search grounding databases & executing LLM structure checks. This can take ~20–45s.
                </div>
              )}
            </div>
          )}

          {/* PRE-PLANNING — Campaign Brief */}
          {activeTab === 'preplanning' && activeStageData && (() => {
            const swot = activeStageData.data?.swot || {};
            const brief = activeStageData.data?.brief || {};
            const briefSections = [
              ['situation', 'Situation / Why Now'],
              ['challenge', 'The Challenge'],
              ['objectives', 'Objectives & North Star'],
              ['audience', 'Target Audience'],
              ['ask', 'The Ask (single-minded proposition)'],
              ['scope', 'Scope — In / Out'],
              ['mandatories', 'Mandatories & Constraints'],
            ];
            const quad = [
              ['strengths', 'Strengths', 'var(--green)'],
              ['weaknesses', 'Weaknesses', '#b42318'],
              ['opportunities', 'Opportunities', 'var(--accent)'],
              ['threats', 'Threats', '#b54708'],
            ];
            return (
              <div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>How this works</span>
                  <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'var(--ink-soft)' }}>The AI Director authored this from your Strategic Intelligence. To change anything, <strong>discuss it with the Copilot</strong> (right) and approve the updates it proposes — tell it your real objectives, budget, and constraints. Hit <strong>💬 Discuss</strong> on any section to start.</p>
                </div>

                <div className="card">
                  <h2>SWOT — Strategic Snapshot</h2>
                  <p className="sub">Synthesized from Stages 2–6. Regenerate the brief to refresh it.</p>
                  <div className="grid two">
                    {quad.map(([key, label, color]) => (
                      <div key={key} style={{ borderLeft: `4px solid ${color}`, padding: '10px 14px', background: 'var(--grey-soft)', borderRadius: '0 8px 8px 0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color }}>{label}</span>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '13px' }}>
                          {(Array.isArray(swot[key]) ? swot[key] : []).map((it, i) => <li key={i} style={{ marginBottom: 4 }}>{it}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h2>Campaign Brief</h2>
                  <p className="sub">AI-authored — the contract downstream planning must obey. Change it only via the Copilot; fields marked <em>[Decision needed]</em> need your input there.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                    {briefSections.map(([key, label], idx) => (
                      <div key={key} style={{ padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--grey-soft)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--accent)' }}>{idx + 1}. {label}</span>
                          <button
                            onClick={() => discussBriefSection(label)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                          ><MessageSquare size={13} /> Discuss</button>
                        </div>
                        <p style={{ fontSize: '14px', margin: '8px 0 0', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {brief[key] || <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>Not yet drafted — ask the Copilot.</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className={`copilot-toggle-btn ${loading[16] ? 'danger' : ''}`} style={loading[16] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={() => loading[16] ? cancelGeneration(16) : generateStage(16)}>
                      {loading[16] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> Re-draft all from research</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* PLANNING — Campaign Plan */}
          {activeTab === 'planning' && activeStageData && (() => {
            const d = activeStageData.data || {};
            const moments = d.moments || [];
            const campaigns = d.campaignCalendar || [];
            const content = d.contentCalendar || [];
            const narrative = d.narrative || {};
            const entry = d.marketEntry || {};
            const funnel = d.funnelStrategy || {};
            const isEmpty = !moments.length && !campaigns.length && !content.length && !entry.posture;
            return (
              <div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>How this works</span>
                  <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'var(--ink-soft)' }}>The AI turned your locked brief into a 360° plan. Each <strong>Content Calendar</strong> row is an atomic task (with a suggested executor) that will flow into Orchestration. To change anything, discuss it with the Copilot.</p>
                  {planProgress && (
                    <div style={{ marginTop: 10, fontSize: '13px', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {loading[17] && <span className="spinner" />}{planProgress}
                    </div>
                  )}
                </div>

                {isEmpty && (
                  <div className="card" style={{ borderLeft: '4px solid #b54708', background: '#fff7ed' }}>
                    <h3 style={{ margin: 0, color: '#9a3412' }}>The plan came back empty</h3>
                    <p style={{ fontSize: '13px', color: '#9a3412', margin: '6px 0 12px' }}>The AI response was empty or got cut off (often when the timeline is long). Click Re-draft to try again — the plan is now capped to stay within limits.</p>
                    <button className={`btn ${loading[17] ? 'danger' : ''}`} style={loading[17] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : {}} onClick={() => loading[17] ? cancelGeneration(17) : generateStage(17)}>
                      {loading[17] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> Re-draft plan</span>}
                    </button>
                  </div>
                )}

                {moments.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Moments &amp; Seasonality</h2>
                      <button onClick={() => discussPlan('moments')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}><MessageSquare size={13} /> Discuss</button>
                    </div>
                    <p className="sub">Real festivals/seasons worth capitalizing on across the project timeline.</p>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead><tr><th>Moment</th><th>When</th><th>Why it matters</th><th>Angle</th></tr></thead>
                        <tbody>
                          {moments.map((m, i) => (
                            <tr key={i}><td><strong>{m.moment}</strong></td><td className="muted">{m.dates}</td><td className="muted">{m.why}</td><td>{m.angle}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(entry.posture || entry.targetSequencing?.length > 0) && (
                  <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Market-Entry Strategy {entry.operationsBasis && <span className="phase p1" style={{ marginLeft: 6, verticalAlign: 'middle' }}>{entry.operationsBasis}</span>}</h2>
                      <button onClick={() => discussPlan('market-entry strategy')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}><MessageSquare size={13} /> Discuss</button>
                    </div>
                    {entry.posture && (<div style={{ marginTop: 8 }}><span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Entry Posture</span><p style={{ fontSize: '14px', margin: '4px 0 0', color: 'var(--ink)' }}>{entry.posture}</p></div>)}
                    {entry.differentiation && (<div style={{ marginTop: 12, background: 'var(--grey-soft)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)' }}><span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>🎯 Our Wedge vs Incumbents</span><p style={{ fontSize: '14px', margin: '4px 0 0', fontWeight: 500, color: 'var(--ink)' }}>{entry.differentiation}</p></div>)}
                    {entry.targetSequencing?.length > 0 && (
                      <div style={{ overflowX: 'auto', marginTop: 12 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Target Sequencing — who we win first</span>
                        <table style={{ marginTop: 4 }}>
                          <thead><tr><th>Phase</th><th>Target</th><th>Why first</th><th>Secure</th></tr></thead>
                          <tbody>
                            {entry.targetSequencing.map((p, i) => (
                              <tr key={i}><td><span className="phase p2">{p.phase}</span></td><td><strong>{p.target}</strong></td><td className="muted">{p.why}</td><td className="muted">{p.secure}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {entry.implications && (<div style={{ marginTop: 12, background: '#fff7ed', padding: '10px 12px', borderRadius: 8, border: '1px solid #fdba74' }}><span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9a3412' }}>⚖️ Implications of {entry.operationsBasis || 'this'} entry</span><p style={{ fontSize: '13px', margin: '4px 0 0', color: '#9a3412' }}>{entry.implications}</p></div>)}
                  </div>
                )}

                {(funnel.branding || funnel.acquisition || funnel.engagement) && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Funnel Strategy</h2>
                      <button onClick={() => discussPlan('funnel strategy')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}><MessageSquare size={13} /> Discuss</button>
                    </div>
                    <p className="sub">Awareness → onboarding → loyalty, sequenced to serve the entry strategy above.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                      {[['branding', 'Branding', 'Awareness'], ['acquisition', 'Acquisition', 'Onboarding'], ['engagement', 'Engagement', 'Loyalty']].map(([key, label, sub]) => {
                        const f = funnel[key] || {};
                        return (
                          <div key={key} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '12px', background: 'var(--grey-soft)' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>{label} <span style={{ fontWeight: 400, color: 'var(--ink-soft)', fontSize: '11px' }}>· {sub}</span></div>
                            {f.objective && <p style={{ fontSize: '12px', margin: '8px 0 0', color: 'var(--ink)' }}><strong>Goal:</strong> {f.objective}</p>}
                            {f.channels && <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'var(--ink-soft)' }}><strong>Channels:</strong> {f.channels}</p>}
                            {f.keyMessage && <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'var(--ink)' }}><strong>Message:</strong> {f.keyMessage}</p>}
                            {f.kpi && <p style={{ fontSize: '12px', margin: '4px 0 0', color: 'var(--ink-soft)' }}><strong>KPI:</strong> {f.kpi}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(narrative.corePillars?.length > 0 || narrative.frictionPersonas?.length > 0) && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Narrative &amp; Messaging</h2>
                      <button onClick={() => discussPlan('narrative & messaging')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}><MessageSquare size={13} /> Discuss</button>
                    </div>
                    <p className="sub">The messaging that grounds every hook in the calendar below.</p>
                    {narrative.corePillars?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>Core Pillars</span>
                        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: '13px' }}>
                          {narrative.corePillars.map((p, i) => <li key={i} style={{ marginBottom: 4 }}>{p}</li>)}
                        </ul>
                      </div>
                    )}
                    {narrative.frictionPersonas?.length > 0 && (
                      <div style={{ overflowX: 'auto', marginTop: 12 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Friction Personas</span>
                        <table style={{ marginTop: 4 }}>
                          <thead><tr><th>Persona</th><th>Their Fear</th><th>Counter-message</th></tr></thead>
                          <tbody>
                            {narrative.frictionPersonas.map((p, i) => (
                              <tr key={i}><td><strong>{p.persona}</strong></td><td className="muted">{p.fear}</td><td>{p.counter}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {narrative.objectionKit?.length > 0 && (
                      <div style={{ overflowX: 'auto', marginTop: 12 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Objection Kit</span>
                        <table style={{ marginTop: 4 }}>
                          <thead><tr><th>Objection</th><th>Response</th></tr></thead>
                          <tbody>
                            {narrative.objectionKit.map((o, i) => (
                              <tr key={i}><td className="muted">{o.objection}</td><td>{o.response}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Omnichannel Campaign Matrix</h2>
                    <button onClick={() => discussPlan('campaign matrix')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}><Sparkles size={13} /> Discuss</button>
                  </div>
                  <p className="sub">Master campaigns and their granular, actionable deliverables flowing into Orchestration.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                    {campaigns.map((c, i) => {
                      const campaignTasks = content.filter(t => t.campaign === c.campaign);
                      return (
                        <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ background: 'var(--surface2)', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <h3 style={{ margin: 0, fontSize: '16px' }}>{c.campaign}</h3>
                              {c.funnel && <span className="phase p1">{c.funnel}</span>}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '13px' }}>
                              <div><strong className="muted">Window:</strong> {c.window}</div>
                              <div><strong className="muted">Objective:</strong> {c.objective}</div>
                              <div><strong className="muted">KPI:</strong> {c.kpi}</div>
                            </div>
                          </div>
                          
                          {campaignTasks.length > 0 ? (
                            <div style={{ overflowX: 'auto', padding: '0 16px 16px' }}>
                              <table style={{ marginTop: '16px' }}>
                                <thead>
                                  <tr>
                                    <th>Week</th>
                                    <th>Channel</th>
                                    <th>Format</th>
                                    <th>Hook</th>
                                    <th>Objective</th>
                                    <th>Executor</th>
                                    <th>Create</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {campaignTasks.map((t, idx) => (
                                    <tr key={idx}>
                                      <td className="muted">{t.week}</td>
                                      <td><span className="phase p1">{t.channel}</span></td>
                                      <td className="muted">{t.format}</td>
                                      <td>{t.hook}</td>
                                      <td className="muted">{t.objective}</td>
                                      <td><span className={`phase ${String(t.executor).includes('human') ? 'p3' : 'p2'}`}>{t.executor}</span></td>
                                      <td><button onClick={() => generateAsset({ channel: t.channel, format: t.format, hook: t.hook, objective: t.objective })} style={{ fontSize: 11, fontWeight: 600, background: '#009B60', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }} title="Generate this asset in Creative Studio">✨ Create</button></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic' }}>
                              No granular tasks assigned to this campaign yet.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <button className={`copilot-toggle-btn ${loading[17] ? 'danger' : ''}`} style={loading[17] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={() => loading[17] ? cancelGeneration(17) : generateStage(17)}>
                    {loading[17] ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Square size={14} /> Stop Generating</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles size={14} /> Re-draft plan from brief</span>}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ORCHESTRATOR — assign tasks to team by skill */}
          {activeTab === 'orchestrator' && (() => {
            const tasks = projectStages.stage17?.data?.contentCalendar || [];
            if (!tasks.length) {
              return (
                <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <h2>No tasks to assign yet</h2>
                  <p className="sub">Generate the <strong>Planning</strong> stage first — its content-calendar tasks flow here for team assignment.</p>
                  <button className="btn" onClick={() => setActiveTab('planning')}>Go to Planning</button>
                </div>
              );
            }
            const assignedCount = tasks.filter((t) => t.assignee).length;
            return (
              <div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>Task Assignment</span>
                      <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'var(--ink-soft)' }}>Every planned task, matched to the right person by skill. Defaults are auto-suggested from each member's skill set — change anyone via the dropdown. ({assignedCount}/{tasks.length} locked)</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={autoAssignAll}><Sparkles size={15} /> Auto-assign by skill</button>
                      <button className="copilot-toggle-btn" style={{ background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={exportToSheets} disabled={exporting}>
                        {exporting ? <><RefreshCw size={14} className="spin" /> Exporting…</> : <><Download size={14} /> Export to Sheets</>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2>Task Assignments</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead><tr><th>Task</th><th>Funnel</th><th>Skill Required</th><th>Assignee</th></tr></thead>
                      <tbody>
                        {tasks.map((t, i) => {
                          const req = t.requiredSkills || [];
                          const suggested = bestAssignee(req);
                          const current = t.assignee || suggested || '';
                          return (
                            <tr key={i}>
                              <td><strong>{t.hook || t.format || t.campaign}</strong><div className="muted" style={{ fontSize: '11px' }}>{t.week} · {t.channel}</div></td>
                              <td>{t.funnel && <span className="phase p1">{t.funnel}</span>}</td>
                              <td className="muted">{Array.isArray(req) ? req.join(', ') : req}</td>
                              <td>
                                <select value={current} onChange={(e) => updateAssignee(i, e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--surface, #fff)', color: 'var(--ink)', fontSize: '13px', minWidth: 160 }}>
                                  <option value="">— Unassigned —</option>
                                  {TEAM_MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name} · {m.role}</option>)}
                                </select>
                                {!t.assignee && suggested && <div className="muted" style={{ fontSize: '10px', marginTop: 2 }}>auto: skill match</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card">
                  <h3>Team — DRS Business Unit POD</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead><tr><th>Member</th><th>Role</th><th>Skills</th></tr></thead>
                      <tbody>
                        {TEAM_MEMBERS.map((m) => (
                          <tr key={m.name}><td><strong>{m.name}</strong></td><td className="muted">{m.role}</td><td className="muted">{m.skills.slice(0, 3).join(', ')}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 2 GEOGRAPHY INTEL */}
          {activeStageNum === 2 && activeStageData && (
            <div>
              <div className="card">
                <h2>Geography Summary</h2>
                <div className="grid four mt-4">
                  {/* Population Card */}
                  {(() => {
                    const src = activeStageData.intel?.stateSummary?.population?.source;
                    const srcTitle = activeStageData.intel?.stateSummary?.population?.sourceTitle;
                    return (
                      <div className="stat">
                        <div className="k">Population</div>
                        <div className="v">{fmt(activeStageData.intel?.stateSummary?.population?.value)}</div>
                        <Badge level={src ? 'Verified' : 'Grounded'} />
                        {src && (() => { try { return <a href={src} target="_blank" rel="noreferrer" title={srcTitle || src} style={{ fontSize: '10px', color: 'var(--accent)', display: 'block', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {new URL(src).hostname}</a>; } catch { return null; } })()}
                      </div>
                    );
                  })()}
                  {/* Districts Card */}
                  {(() => {
                    const src = activeStageData.intel?.stateSummary?.districts?.source;
                    const srcTitle = activeStageData.intel?.stateSummary?.districts?.sourceTitle;
                    return (
                      <div className="stat">
                        <div className="k">{level1Label}</div>
                        <div className="v">{fmt(activeStageData.intel?.stateSummary?.districts?.value)}</div>
                        <Badge level={src ? 'Verified' : 'Grounded'} />
                        {src && (() => { try { return <a href={src} target="_blank" rel="noreferrer" title={srcTitle || src} style={{ fontSize: '10px', color: 'var(--accent)', display: 'block', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {new URL(src).hostname}</a>; } catch { return null; } })()}
                      </div>
                    );
                  })()}
                  {/* Tehsils Card */}
                  {(() => {
                    const src = activeStageData.intel?.stateSummary?.talukasOrTehsils?.source;
                    const srcTitle = activeStageData.intel?.stateSummary?.talukasOrTehsils?.sourceTitle;
                    return (
                      <div className="stat">
                        <div className="k">{level2Label}</div>
                        <div className="v">{fmt(activeStageData.intel?.stateSummary?.talukasOrTehsils?.value)}</div>
                        <Badge level={src ? 'Verified' : 'Grounded'} />
                        {src && (() => { try { return <a href={src} target="_blank" rel="noreferrer" title={srcTitle || src} style={{ fontSize: '10px', color: 'var(--accent)', display: 'block', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {new URL(src).hostname}</a>; } catch { return null; } })()}
                      </div>
                    );
                  })()}
                  {/* Touchpoint Universe Card */}
                  {(() => {
                    const hasSources = activeStageData.touchpoints?.groups?.some(g => g.source);
                    const allSrcs = activeStageData.touchpoints?.groups?.filter(g => g.source).slice(0, 2) || [];
                    return (
                      <div className="stat">
                        <div className="k">Touchpoint Universe</div>
                        <div className="v">{fmt(activeStageData.touchpoints?.universeTotal)}</div>
                        <Badge level={hasSources ? 'Verified' : 'Grounded'} />
                        {allSrcs.map((g, i) => {
                          try { return <a key={i} href={g.source} target="_blank" rel="noreferrer" title={g.sourceTitle || g.source} style={{ fontSize: '10px', color: 'var(--accent)', display: 'block', marginTop: i === 0 ? '4px' : '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🔗 {new URL(g.source).hostname}</a>; }
                          catch { return null; }
                        })}
                      </div>
                    );
                  })()}
                </div>

                <h3 className="mt-4">Regulatory Context <Badge level="Grounded" /></h3>
                <p>{activeStageData.intel?.stateSummary?.regulatoryContext}</p>
              </div>

              <div className="card">
                <h2>Verified Touchpoints <Badge level={activeStageData.sources?.length > 0 ? 'Verified' : 'Grounded'} /></h2>
                <p className="sub">{activeStageData.touchpoints?.source ? `Sourced from ${activeStageData.touchpoints.source}` : 'Pulled live from OpenStreetMap'}</p>
                <table>
                  <thead>
                    <tr><th>Category Group</th><th>Subtype Breakdowns</th><th className="num">Count</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.touchpoints?.groups?.map((g) => {
                      return (
                        <tr key={g.group}>
                          <td><strong>{g.group}</strong></td>
                          <td className="muted">
                            {g.subtypes?.map(s => `${s.label}: ${s.count}`).join(' · ')}
                            {g.source && (() => {
                              try {
                                return <><br/><a href={g.source} target="_blank" rel="noreferrer" title={g.sourceTitle || g.source} style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 500 }}>🔗 {new URL(g.source).hostname} {g.sourceTitle ? `— ${g.sourceTitle}` : ''}</a></>;
                              } catch { return null; }
                            })()}
                          </td>
                          <td className="num"><strong>{fmt(g.total)}</strong></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>{isNationalProject ? geoSchema.level1 : geoSchema.level2} Hierarchy & Recommended Phase</h2>
                <table>
                  <thead>
                    <tr><th style={{ textTransform: 'uppercase' }}>{isNationalProject ? geoSchema.level1 : geoSchema.level2}</th><th>POPULATION</th><th style={{ textTransform: 'uppercase' }}>{isNationalProject ? geoSchema.level2 : geoSchema.level3}s</th><th>RECOMMENDED PHASE</th><th>RATIONALE</th><th style={{ textAlign: 'right' }}>ACTIONS</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.intel?.hierarchy?.map((h) => (
                      <tr key={h.district}>
                        <td><strong>{h.district}</strong></td>
                        <td>{fmt(h.population)} <Badge level={h.populationConfidence} /></td>
                        <td>{fmt(h.talukas)}</td>
                        <td><span className={`phase ${h.recommendedPhase === 'Phase 1' ? 'p1' : h.recommendedPhase === 'Phase 2' ? 'p2' : 'p3'}`}>{h.recommendedPhase}</span></td>
                        <td className="muted">{h.rationale}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-sm"
                            style={{ 
                              padding: '4px 10px', 
                              fontSize: '11px', 
                              background: 'var(--accent)', 
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const parentProj = {
                                id: projectId,
                                country: country,
                                state: state,
                                implementationModel: model,
                                materials: selectedMaterials,
                                objective: objective
                              };
                              // Pass the exact demographics for this region
                              initSubProject(parentProj, h.district, {
                                population: h.population,
                                subDivisions: h.talukas
                              });
                            }}
                          >
                            Launch Sub-Project
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>Rollout Sequence</h2>
                {activeStageData.intel?.rolloutSequence?.map((r, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <span className="phase p2 mr-2">{r.phase}</span>
                    <strong>{r.zones?.join(', ')}</strong>
                    <div className="muted">{r.rationale}</div>
                  </div>
                ))}
              </div>

              {renderGeoDeep()}
            </div>
          )}

          {/* STAGE 3 MARKET INTEL */}
          {activeStageNum === 3 && activeStageData && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className={`chip ${materialFilter === 'All' ? 'on' : ''}`} onClick={() => setMaterialFilter('All')}>All Materials</span>
                {selectedMaterials.map((m) => (
                  <span key={m} className={`chip ${materialFilter === m ? 'on' : ''}`} onClick={() => setMaterialFilter(m)}>{m}</span>
                ))}
              </div>

              <div className="grid two">
                {selectedMaterials
                  .filter((m) => materialFilter === 'All' || materialFilter === m)
                  .map((m) => {
                    const mData = activeStageData.data?.materials?.[m];
                    const score = activeStageData.data?.opportunityScores?.[m];
                    if (!mData) return null;
                    return (
                      <div key={m} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2>{m} Opportunity</h2>
                          <div className="stat" style={{ padding: '8px 12px' }}>
                            <div className="k" style={{ fontSize: '10px' }}>Score</div>
                            <div className="v" style={{ fontSize: '18px', color: 'var(--accent)' }}>{score}/100</div>
                          </div>
                        </div>
                        <div className="grid two mt-4" style={{ fontSize: '13px' }}>
                          <div><strong>Market Size:</strong> {mData.marketSize}</div>
                          <div><strong>Recovery Potential:</strong> {mData.recoveryOpportunity}</div>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <span className={`phase ${mData.regulatoryDriver === 'Strong' ? 'p1' : mData.regulatoryDriver === 'Medium' ? 'p2' : 'p3'}`}>
                            {mData.regulatoryDriver} Regulatory Driver
                          </span>
                        </div>
                        <p style={{ fontStyle: 'italic', fontSize: '13px', marginTop: 10 }}>"{mData.oneLineRead}"</p>

                        <h4 className="mt-4">A · Impact Case</h4>
                        <p className="muted">{mData.sections?.impactCase}</p>
                        
                        <h4>B · Policy & Regulatory</h4>
                        <p className="muted">{mData.sections?.policyRegulatory}</p>
                        
                        <h4>C · Benchmarks</h4>
                        <p className="muted">{mData.sections?.benchmarks}</p>

                        <h4>D · Business Case</h4>
                        <p className="muted">{mData.sections?.businessCase}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STAGE 4 STAKEHOLDERS */}
          {activeStageNum === 4 && activeStageData && (
            <div>
              {activeStageData.data?.executiveSummary && (
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>Executive Read</span>
                  <p style={{ fontSize: '14px', margin: '6px 0 0', color: 'var(--ink)' }}>{activeStageData.data.executiveSummary}</p>
                </div>
              )}

              <div className="card">
                <h2>Alignment Readiness Score</h2>
                <div className="grid four mt-4">
                  <div className="stat">
                    <div className="k">Overall Readiness</div>
                    <div className="v" style={{ color: 'var(--green)' }}>{activeStageData.data?.alignmentReadiness?.overall}/100</div>
                  </div>
                  {selectedMaterials.map((m) => (
                    <div key={m} className="stat">
                      <div className="k">{m} Alignment</div>
                      <div className="v">{activeStageData.data?.alignmentReadiness?.materials?.[m]}/100</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Coalition Stakeholders</h2>
                <table>
                  <thead>
                    <tr><th>Name</th><th>Category</th><th>Quadrant</th><th>Priority</th><th>Stance</th><th>Confidence</th><th>Instrument to Secure</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.data?.stakeholders?.map((s, i) => (
                      <tr key={i}>
                        <td><strong>{s.name}</strong></td>
                        <td className="muted">{s.category}</td>
                        <td className="muted">{s.powerInterestQuadrant}</td>
                        <td><span className="phase p3">{s.priority}</span></td>
                        <td><span className={`phase ${s.stance === 'Champion' ? 'p1' : s.stance === 'Blocker' ? 'p3' : 'p2'}`}>{s.stance}</span></td>
                        <td className="muted" style={{ fontSize: '11px' }}>{s.stanceEvidence?.confidence}</td>
                        <td className="muted">{s.whatToSecure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="mt-4" style={{ paddingLeft: '8px' }}>Stakeholder Playbook</h2>
              <div className="grid two">
                {activeStageData.data?.stakeholders?.map((s, i) => (
                  <div key={i} className="card" style={{ borderLeft: `4px solid ${s.stance === 'Champion' ? 'var(--green)' : s.stance === 'Blocker' ? '#b42318' : 'var(--accent)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{s.name}</h3>
                        <span className="muted" style={{ fontSize: '11px' }}>{s.category}{s.powerInterestQuadrant ? ` · ${s.powerInterestQuadrant}` : ''}</span>
                      </div>
                      <span className={`phase ${s.stance === 'Champion' ? 'p1' : s.stance === 'Blocker' ? 'p3' : 'p2'}`}>{s.stance}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                      {s.theirLossAversion && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Their Loss Aversion:</span>
                          <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--ink)' }}>{s.theirLossAversion}</p>
                        </div>
                      )}
                      {s.recykalLeverage && (
                        <div style={{ background: 'var(--grey-soft)', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', display: 'block' }}>🛡️ Recykal / Retearn Leverage:</span>
                          <p style={{ fontSize: '13px', margin: '4px 0 0', fontWeight: 500, color: 'var(--ink)' }}>{s.recykalLeverage}</p>
                        </div>
                      )}
                      {s.concession && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Concession Offered:</span>
                          <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--ink)' }}>{s.concession}</p>
                        </div>
                      )}
                      {s.stanceEvidence?.basis && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Evidence ({s.stanceEvidence?.confidence}):</span>
                          <p style={{ fontSize: '12px', margin: '4px 0 0', fontStyle: 'italic', color: 'var(--ink-soft)' }}>{s.stanceEvidence.basis}</p>
                        </div>
                      )}
                      {s.nextAction && (<div><span className="phase p2">Next: {s.nextAction}</span></div>)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid two">
                <div className="card">
                  <h3>Champions</h3>
                  <ul>
                    {activeStageData.data?.champions?.map((c, i) => <li key={i}><strong>{c}</strong></li>)}
                  </ul>
                </div>
                <div className="card">
                  <h3>Blockers</h3>
                  <ul>
                    {activeStageData.data?.blockers?.map((b, i) => <li key={i} style={{ color: '#b42318' }}><strong>{b}</strong></li>)}
                  </ul>
                </div>
              </div>

              {(activeStageData.data?.assumptions?.length > 0 || activeStageData.data?.dataGaps?.length > 0) && (
                <div className="grid two">
                  {activeStageData.data?.assumptions?.length > 0 && (
                    <div className="card">
                      <h3>Assumptions</h3>
                      <ul>{activeStageData.data.assumptions.map((a, i) => <li key={i} className="muted" style={{ fontSize: '13px' }}>{a}</li>)}</ul>
                    </div>
                  )}
                  {activeStageData.data?.dataGaps?.length > 0 && (
                    <div className="card">
                      <h3>Data Gaps — Verify via Primary Research</h3>
                      <ul>{activeStageData.data.dataGaps.map((d, i) => <li key={i} style={{ fontSize: '13px', color: '#b54708' }}>{d}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAGE 5 COMPETITORS */}
          {activeStageNum === 5 && activeStageData && (
            <div>
              {activeStageData.data?.positioningVerdict && (
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>Positioning Verdict</span>
                  <p style={{ fontSize: '14px', margin: '6px 0 0', color: 'var(--ink)' }}>{activeStageData.data.positioningVerdict}</p>
                </div>
              )}

              {activeStageData.data?.porterFiveForces && (
                <div className="card">
                  <h2>Porter's Five Forces — Market Structure</h2>
                  <p className="sub">The structural read of the market, derived from the competitor landscape below.</p>
                  <table>
                    <thead><tr><th>Force</th><th>Rating</th><th>Read</th></tr></thead>
                    <tbody>
                      {[
                        ['Competitive Rivalry', 'competitiveRivalry'],
                        ['Threat of New Entrants', 'threatOfNewEntrants'],
                        ['Supplier Power', 'supplierPower'],
                        ['Buyer Power', 'buyerPower'],
                        ['Threat of Substitutes', 'threatOfSubstitutes'],
                      ].map(([label, key]) => {
                        const f = activeStageData.data.porterFiveForces[key] || {};
                        return (
                          <tr key={key}>
                            <td><strong>{label}</strong></td>
                            <td><span className={`phase ${f.rating === 'High' ? 'p2' : f.rating === 'Medium' ? 'p1' : 'p3'}`}>{f.rating || '—'}</span></td>
                            <td className="muted">{f.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card">
                <h2>Competitor Landscape Comparison</h2>
                <p className="sub">Side-by-side comparison of active circular operators, waste-tech platforms, and DRS systems in {country}.</p>
                <table>
                  <thead>
                    <tr>
                      <th>Competitor</th>
                      <th>Segment Type</th>
                      <th>Presence</th>
                      <th>Return Rate</th>
                      <th>Core Technology Model</th>
                      <th className="num">Threat Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeStageData.data?.competitors?.map((c, i) => {
                      const share = typeof c.marketShare === 'object' && c.marketShare !== null
                        ? (c.marketShare.local || c.marketShare.global || '—')
                        : c.marketShare;
                      return (
                        <tr key={i}>
                          <td><strong>{c.name}</strong>{share ? <div className="muted" style={{ fontSize: '11px' }}>{share}</div> : null}</td>
                          <td>{c.type}</td>
                          <td className="muted">{c.presenceInMarket}</td>
                          <td className="muted">{c.returnRatePerformance}</td>
                          <td className="muted">{c.techCapability}</td>
                          <td className="num">
                            <span className={`phase ${c.threatLevel === 'High' ? 'p2' : c.threatLevel === 'Medium' ? 'p1' : 'p3'}`}>
                              {c.threatLevel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <h2 className="mt-4" style={{ paddingLeft: '8px' }}>Detailed Competitor Profiles & Moat Strategy</h2>
              <div className="grid two">
                {activeStageData.data?.competitors?.map((c, i) => (
                  <div key={i} className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{c.name}</h3>
                        <span className="muted" style={{ fontSize: '11px' }}>{c.type}{c.presenceInMarket ? ` · ${c.presenceInMarket}` : ''}</span>
                      </div>
                      <span className={`phase ${c.threatLevel === 'High' ? 'p2' : c.threatLevel === 'Medium' ? 'p1' : 'p3'}`}>
                        Threat: {c.threatLevel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {c.returnRatePerformance && c.returnRatePerformance !== 'n/a' && (
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Return Rate (their schemes):</span>
                          <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--ink)' }}>{c.returnRatePerformance}</p>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Strengths:</span>
                        <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--ink)' }}>{c.strengths}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Weaknesses:</span>
                        <p style={{ fontSize: '13px', margin: '4px 0 0', color: 'var(--ink)' }}>{c.weaknesses}</p>
                      </div>
                      <div style={{ background: 'var(--grey-soft)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', display: 'block' }}>🛡️ Recykal Moat Strategy:</span>
                        <p style={{ fontSize: '13px', margin: '4px 0 0', fontWeight: '500', color: 'var(--ink)' }}>{c.recykalMoatStrategy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {activeStageData.data?.benchmarkSchemes?.length > 0 && (
                <div className="card">
                  <h2>Domestic Benchmarks & Precedents ({country})</h2>
                  <p className="sub">In-country DRS schemes and precedents only — the relevant performance reference for {state || country}.</p>
                  <table>
                    <thead><tr><th>Scheme / Precedent</th><th>Location</th><th>Type</th><th>Return Rate</th><th>Lesson for Recykal</th></tr></thead>
                    <tbody>
                      {activeStageData.data.benchmarkSchemes.map((b, i) => (
                        <tr key={i}>
                          <td><strong>{b.scheme}</strong></td>
                          <td className="muted">{b.location}</td>
                          <td className="muted">{b.type}</td>
                          <td>{b.returnRate}</td>
                          <td className="muted">{b.lesson}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(activeStageData.data?.baselineNoDRS || activeStageData.data?.dataGaps?.length > 0) && (
                <div className="grid two">
                  {activeStageData.data?.baselineNoDRS && (
                    <div className="card">
                      <h3>No-DRS Baseline (The Floor)</h3>
                      <p style={{ fontSize: '13px', color: 'var(--ink)' }}>{activeStageData.data.baselineNoDRS}</p>
                    </div>
                  )}
                  {activeStageData.data?.dataGaps?.length > 0 && (
                    <div className="card">
                      <h3>Data Gaps — Verify</h3>
                      <ul>{activeStageData.data.dataGaps.map((d, i) => <li key={i} style={{ fontSize: '13px', color: '#b54708' }}>{d}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STAGE 6 RESISTANCE */}
          {activeStageNum === 6 && activeStageData && (
            <div>
              {activeStageData.data?.pestle && (
                <div className="card">
                  <h2>PESTLE — Macro Environment</h2>
                  <p className="sub">The macro forces behind the resistance register below.</p>
                  <table>
                    <thead><tr><th>Factor</th><th>Read for this geography</th></tr></thead>
                    <tbody>
                      {[
                        ['Political', 'political'],
                        ['Economic', 'economic'],
                        ['Social', 'social'],
                        ['Technological', 'technological'],
                        ['Legal', 'legal'],
                        ['Environmental', 'environmental'],
                      ].map(([label, key]) => (
                        <tr key={key}>
                          <td><strong>{label}</strong></td>
                          <td className="muted">{activeStageData.data.pestle[key]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="card">
                <h2>Resistance Index</h2>
                <div className="grid four mt-4">
                  <div className="stat animate-pulse">
                    <div className="k">Overall Index</div>
                    <div className="v" style={{ color: '#b42318' }}>{activeStageData.data?.resistanceIndex?.overall}/100</div>
                  </div>
                  {selectedMaterials.map((m) => (
                    <div key={m} className="stat">
                      <div className="k">{m} Index</div>
                      <div className="v">{activeStageData.data?.resistanceIndex?.materials?.[m]}/100</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>7 Fronts × Material Heat Map</h2>
                <div className="heatmap-grid">
                  <div className="heatmap-hdr">Front</div>
                  {selectedMaterials.map(m => <div key={m} className="heatmap-hdr">{m}</div>)}

                  {['Government / Regulatory', 'Retail / Trade', 'Consumer', 'Brand', 'Media', 'Political', 'Operational'].map((front) => (
                    <React.Fragment key={front}>
                      <div className="heatmap-lbl">{front}</div>
                      {selectedMaterials.map((material) => {
                        const item = activeStageData.data?.register?.find(r => r.front === front && (r.material === material || r.material === 'All'));
                        const severity = item ? item.severity : 'Low';
                        const cls = severity === 'High' ? 'high' : severity === 'Medium' ? 'medium' : 'low';
                        return (
                          <div key={material} className={`heatmap-cell ${cls}`}>
                            {severity}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Resistance Register</h2>
                <table>
                  <thead>
                    <tr><th>Front</th><th>Material</th><th>Root Cause</th><th>Severity</th><th>Mitigation</th><th>Owner</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.data?.register?.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.front}</strong></td>
                        <td className="muted">{r.material}</td>
                        <td className="muted">{r.rootCause}</td>
                        <td><span className={`phase ${r.severity === 'High' ? 'p3' : r.severity === 'Medium' ? 'p2' : 'p1'}`}>{r.severity}</span></td>
                        <td className="muted">{r.mitigation}</td>
                        <td className="muted">{r.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STAGE 7 NARRATIVE & ALIGNMENT */}
          {activeTab === 7 && activeStageData && (() => {
            const narrativeData = activeStageData.data || {};
            const corePillars = narrativeData.corePillars || {};
            const personas = narrativeData.frictionPersonas || [];
            const faqs = narrativeData.hostileObjectionKit || [];

            return (
              <div>
                <div className="card">
                  <h2>Narrative Core Pillars</h2>
                  <div className="grid three mt-4">
                    <div className="stat" style={{ borderLeft: '4px solid var(--accent)' }}>
                      <span className="lbl">The Burning Platform (Trigger)</span>
                      <p style={{ marginTop: '8px', fontSize: '15px' }}>{corePillars.triggerEvent || 'Pending'}</p>
                    </div>
                    <div className="stat" style={{ borderLeft: '4px solid var(--success)' }}>
                      <span className="lbl">Economic Anchor</span>
                      <p style={{ marginTop: '8px', fontSize: '15px' }}>{corePillars.economicAnchor || 'Pending'}</p>
                    </div>
                    <div className="stat" style={{ borderLeft: '4px solid var(--primary)' }}>
                      <span className="lbl">Political Win Headline</span>
                      <p style={{ marginTop: '8px', fontSize: '15px', fontWeight: 'bold' }}>"{corePillars.politicalWin || 'Pending'}"</p>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <h2>Friction Personas (Anti-Personas)</h2>
                  <table className="table" style={{ marginTop: '15px' }}>
                    <thead>
                      <tr>
                        <th>Hostile Persona</th>
                        <th>Core Fear (Loss Aversion)</th>
                        <th>Aggressive Counter-Narrative</th>
                        <th>Tactical Concession</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personas.map((p, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{p.personaName}</td>
                          <td className="muted">{p.coreFear}</td>
                          <td style={{ borderLeft: '2px solid var(--accent)' }}>{p.counterNarrative}</td>
                          <td style={{ color: 'var(--success)' }}>{p.concession}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <h2>Hostile Objection Kit (PR & Internal Reality)</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                    {faqs.map((f, i) => (
                      <div key={i} style={{ padding: '15px', background: 'var(--surface2)', borderRadius: '8px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: 'var(--danger)', fontSize: '16px' }}>
                          Hostile Query: "{f.hostileQuestion}"
                        </p>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ flex: 1, padding: '10px', background: '#fff', borderLeft: '3px solid var(--primary)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--primary)' }}>Public PR Answer</span>
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{f.publicAnswer}</p>
                          </div>
                          <div style={{ flex: 1, padding: '10px', background: '#fff', borderLeft: '3px solid var(--accent)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)' }}>Internal Reality</span>
                            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{f.internalReality}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 8 BLUEPRINT */}
          {activeTab === 8 && activeStageData && (() => {
            const activeWss = [
              { id: 2, name: 'Brand/Producer & Deposit', key: 'brandOnboarding' },
              { id: 3, name: 'Touchpoint Onboarding', key: 'touchpointOnboarding' },
              { id: 4, name: 'Infrastructure & RVM Deployment', key: 'infrastructure' },
              { id: 5, name: 'Consumer Awareness', key: 'consumerAwareness' },
              { id: 6, name: 'Operations & Collection', key: 'operations' },
              { id: 7, name: 'Launch & Scale', key: 'launchScale' }
            ].filter(w => selectedWorkstreams.includes(w.id));

            const activeSequence = activeStageData.data?.executionSequence || [];

            const activeObjectives = activeStageData.data?.workstreams?.filter(w => 
              selectedWorkstreams.includes(w.id)
            ) || [];

            return (
              <div>
                {activeStageData.data?.policyGates && (
                  <div className="card">
                    <h2>Asynchronous Pre-requisite Policy Gates</h2>
                    <p className="sub">Regulatory clearance streams that run in parallel outside the operational Gantt timeline</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                      {activeStageData.data.policyGates.map((gate, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'var(--grey-soft)', border: '1px solid var(--line)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                              {gate.gateId}
                            </span>
                            <span className="phase p2" style={{ fontSize: '11px', background: 'var(--amber-soft)', color: 'var(--amber)', border: '1px solid var(--amber)' }}>{gate.status}</span>
                          </div>
                          <strong style={{ fontSize: '14px', color: 'var(--ink)' }}>{gate.name}</strong>
                          <p style={{ fontSize: '12px', color: 'var(--ink-soft)', margin: 0, marginTop: '4px' }}>
                            <strong>Required For:</strong> {gate.requiredFor}
                          </p>
                          <span className="muted" style={{ fontSize: '11px', alignSelf: 'flex-start', marginTop: 'auto' }}>
                            ⏳ Est: {gate.estimatedRegulatoryTimeline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card">
                  <h2>Execution Sequence</h2>
                  <p className="sub">Phased Rollout Driven by Policy Gates</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    {activeSequence.map((seq, i) => (
                      <div key={i} style={{ borderLeft: '4px solid var(--accent)', padding: '16px 20px', background: 'var(--grey-soft)', borderRadius: '0 12px 12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--ink)' }}>{seq.phase}</h3>
                          <span style={{ fontSize: '11px', background: 'var(--amber-soft)', color: 'var(--amber)', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
                            🔒 Blocks On: {seq.blockingGate}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {seq.activeWorkstreams?.map((ws, wIdx) => (
                            <span key={wIdx} style={{ fontSize: '12px', background: 'var(--bg)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '20px', color: 'var(--ink)' }}>
                              {ws}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h2>Critical Path Alert</h2>
                  <div className="err" style={{ background: 'var(--amber-soft)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                    ⚠️ {activeStageData.data?.blueprintSummary?.criticalPathAlert}
                  </div>
                </div>

                <div className="card">
                  <h2>Workstream Objectives & Gates</h2>
                  <table>
                    <thead>
                      <tr><th>Workstream</th><th>Objective</th><th>Key Actions</th><th>Entry Gate (Required)</th><th>Exit Gate (Achieved)</th><th>Owner</th></tr>
                    </thead>
                    <tbody>
                      {activeObjectives.map((w) => (
                        <tr key={w.id}>
                          <td><strong>{w.name}</strong></td>
                          <td className="muted">{w.objective}</td>
                          <td className="muted">{w.keyActions}</td>
                          <td><span className="phase pre">{w.entryGate || w.dependencies || 'None'}</span></td>
                          <td><span className="phase launch">{w.exitGate || 'Completed'}</span></td>
                          <td className="muted">{w.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* STAGE 9 EXECUTION */}
          {activeTab === 9 && activeStageData && (() => {
            const activeWss = [
              { id: 1, name: model === 'Tech Solutions' ? '1. Government & Escrow' : '1. Government & Regulatory', key: 'regulatoryReadiness' },
              { id: 2, name: model === 'Tech Solutions' ? '2. Brand QR & API' : '2. Brand/Deposit', key: 'brandOnboarding' },
              { id: 3, name: model === 'Tech Solutions' ? '3. Merchant App Onboarding' : '3. Touchpoint Onboarding', key: 'touchpointOnboarding' },
              { id: 4, name: model === 'Tech Solutions' ? '4. IoT Hub & POS Integration' : '4. Infrastructure & RVM', key: 'infrastructure' },
              { id: 5, name: model === 'Tech Solutions' ? '5. Consumer Digital Campaign' : '5. Awareness', key: 'consumerAwareness' },
              { id: 6, name: model === 'Tech Solutions' ? '6. Clearinghouse & Ops' : '6. Operations', key: 'operations' },
              { id: 7, name: model === 'Tech Solutions' ? '7. System Go-Live' : '7. Launch', key: 'launchScale' }
            ].filter(w => selectedWorkstreams.includes(w.id));

            let columns = [];
            const setupMeta = projectStages.setup || {};
            const endM = setupMeta.projectEndMonth;
            const endY = setupMeta.projectEndYear;
            const startM = setupMeta.projectStartMonth || 'October';
            const startY = setupMeta.projectStartYear || '2026';
            
            if (endM && endY) {
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const startIdx = months.indexOf(startM);
              const endIdx = months.indexOf(endM);
              const sY = parseInt(startY) || 2026;
              const eY = parseInt(endY) || 2026;
              
              if (startIdx !== -1 && endIdx !== -1) {
                const diff = (eY - sY) * 12 + (endIdx - startIdx) + 1;
                if (diff > 0) {
                  let allMonths = [];
                  let currIdx = startIdx;
                  let currY = sY;
                  for (let i = 0; i < diff; i++) {
                    allMonths.push(`${months[currIdx].substring(0, 3)} ${currY}`);
                    currIdx++;
                    if (currIdx >= 12) {
                      currIdx = 0;
                      currY++;
                    }
                  }
                  
                  if (diff === 1) {
                    columns = [`Phase 1 (${allMonths[0]} W1-W2)`, `Phase 2 (${allMonths[0]} W3)`, `Phase 3 (${allMonths[0]} W4)`];
                  } else if (diff === 2) {
                    columns = [`Phase 1 (${allMonths[0]})`, `Phase 2 (${allMonths[1]} W1-W2)`, `Phase 3 (${allMonths[1]} W3-W4)`];
                  } else {
                    const groupSize = Math.floor(diff / 3);
                    const rem = diff % 3;
                    
                    const g1Size = groupSize + (rem > 0 ? 1 : 0);
                    const g2Size = groupSize + (rem > 1 ? 1 : 0);
                    const g3Size = groupSize;
                    
                    const g1 = allMonths.slice(0, g1Size);
                    const g2 = allMonths.slice(g1Size, g1Size + g2Size);
                    const g3 = allMonths.slice(g1Size + g2Size);
                    
                    const labelRange = (arr) => {
                      if (arr.length === 1) return arr[0];
                      return `${arr[0]} - ${arr[arr.length - 1]}`;
                    };
                    
                    columns = [
                      `Phase 1 (${labelRange(g1)})`,
                      `Phase 2 (${labelRange(g2)})`,
                      `Phase 3 (${labelRange(g3)})`
                    ];
                  }
                }
              }
            }
            
            if (columns.length === 0) {
              if (targetTimeline === '30 Days') {
                columns = ['Phase 1 (W1-W2)', 'Phase 2 (W3)', 'Phase 3 (W4)'];
              } else if (targetTimeline === '90 Days') {
                columns = ['Phase 1 (W1-W4)', 'Phase 2 (W5-W8)', 'Phase 3 (W9-W12)'];
              } else {
                columns = ['Phase 1 (Month 1-2)', 'Phase 2 (Month 3-4)', 'Phase 3 (Month 5-6)'];
              }
            }

            const events = [];
            activeWss.forEach(w => {
              const rawWsData = activeStageData.data?.[w.key];
              if (rawWsData) {
                ['phase1', 'phase2', 'phase3'].forEach((pKey, idx) => {
                  const phaseData = rawWsData[pKey] || (idx === 0 ? rawWsData : null);
                  if (phaseData) {
                    const timeLabel = columns[idx] || columns[columns.length - 1];
                    events.push({
                      workstreamId: w.id,
                      timeLabel: timeLabel,
                      title: phaseData.target?.substring(0, 32) || `${w.name} Task`,
                      target: phaseData.target || 'Execute workstream targets.',
                      actions: Array.isArray(phaseData.actions) ? phaseData.actions : [],
                      generatedDocs: phaseData.generatedDocs || { title: 'Default Template', doc: 'Template details.' }
                    });
                  }
                });
              }
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card">
                  <h2>Operational Calendar Board</h2>
                  <p className="sub">Chronological Weekly/Monthly Campaign Schedule by Active Workstream</p>
                  
                  <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${columns.length}, 1fr)`, gap: '1px', background: 'var(--line)', borderRadius: '12px', overflow: 'hidden', minWidth: '900px' }}>
                      <div style={{ background: 'var(--grey-soft)', padding: '12px', fontWeight: 'bold', fontSize: '12px', color: 'var(--ink-soft)' }}>
                        Workstream
                      </div>
                      {columns.map((col, idx) => (
                        <div key={idx} style={{ background: 'var(--grey-soft)', padding: '12px', fontWeight: 'bold', fontSize: '12px', color: 'var(--ink-soft)', textAlign: 'center' }}>
                          {col}
                        </div>
                      ))}

                      {activeWss.map(w => (
                        <React.Fragment key={w.id}>
                          <div style={{ background: 'var(--card-bg)', padding: '12px', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', borderRight: '1px solid var(--line)' }}>
                            {w.name}
                          </div>
                          {columns.map((col, idx) => {
                            const cellEvents = events.filter(e => 
                              e.workstreamId === w.id && 
                              (e.timeLabel === col || e.timeLabel?.toLowerCase().replace(' ', '') === col.toLowerCase().replace(' ', ''))
                            );

                            return (
                              <div key={idx} style={{ background: 'var(--card-bg)', padding: '8px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {cellEvents.map((evt, eIdx) => (
                                  <div 
                                    key={eIdx}
                                    style={{
                                      padding: '8px',
                                      background: selectedCalendarEvent === evt ? 'var(--accent-soft)' : 'var(--grey-soft)',
                                      border: selectedCalendarEvent === evt ? '1px solid var(--accent)' : '1px solid var(--line)',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      color: 'var(--ink)'
                                    }}
                                    onClick={() => setSelectedCalendarEvent(evt)}
                                    className="event-card-hover"
                                  >
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{evt.title}</div>
                                    <span className="muted" style={{ fontSize: '9px' }}>🎯 {evt.target?.substring(0, 30)}...</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedCalendarEvent && (() => {
                  const matchedWs = activeWss.find(w => w.id === selectedCalendarEvent.workstreamId);
                  return (
                    <div className="card animate-fade-in" style={{ border: '2px solid var(--accent)', borderRadius: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: '4px' }}>
                            {matchedWs?.name || 'Active Workstream'} · {selectedCalendarEvent.timeLabel}
                          </span>
                          <h2 style={{ margin: '8px 0 0' }}>{selectedCalendarEvent.title}</h2>
                        </div>
                        <button 
                          className="btn-text" 
                          onClick={() => setSelectedCalendarEvent(null)}
                          style={{ fontSize: '20px', padding: '0 8px', cursor: 'pointer', border: 'none', background: 'none' }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 'bold' }}>Target Milestone</label>
                        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--ink)', margin: '4px 0 16px' }}>
                          {selectedCalendarEvent.target}
                        </p>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 'bold' }}>Action Steps & SOP</label>
                        <ul style={{ paddingLeft: '20px', margin: '8px 0 20px', fontSize: '14px', lineHeight: '1.6' }}>
                          {Array.isArray(selectedCalendarEvent.actions) && selectedCalendarEvent.actions.length > 0 ? (
                            selectedCalendarEvent.actions.map((act, idx) => <li key={idx}>{act}</li>)
                          ) : (
                            <li>Execute local alignment, logistics deployment checks, and system validation checks.</li>
                          )}
                        </ul>
                      </div>

                      {selectedCalendarEvent.generatedDocs && (
                        <div className="mt-4">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              📄 Mapped Document Template: {selectedCalendarEvent.generatedDocs.title || 'Draft Document'}
                            </label>
                            <button
                              className="btn-text"
                              style={{ fontSize: '12px', padding: '2px 8px', border: '1px solid var(--accent)', borderRadius: '6px', cursor: 'pointer' }}
                              onClick={() => {
                                navigator.clipboard.writeText(selectedCalendarEvent.generatedDocs.doc || selectedCalendarEvent.generatedDocs.draftNotification || selectedCalendarEvent.generatedDocs.agreement || '');
                                alert('Document template copied to clipboard!');
                              }}
                            >
                              📋 Copy Template
                            </button>
                          </div>
                          <div className="doc-box" style={{ marginTop: '8px' }}>
                            {selectedCalendarEvent.generatedDocs.doc || selectedCalendarEvent.generatedDocs.draftNotification || selectedCalendarEvent.generatedDocs.agreement || selectedCalendarEvent.generatedDocs.sop || 'Document details pending.'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* STAGE 10 LAUNCH READINESS (T-MINUS GATE) */}
          {activeTab === 10 && activeStageData && (() => {
            const lrData = activeStageData.data || {};
            const tMinus = lrData.tMinusTracker || [];
            const blockers = lrData.cardinalRuleBlockers || [];
            const readinessScore = lrData.readinessScore || 0;
            const goNoGoStatus = lrData.goNoGoStatus || 'Pending';

            return (
              <div>
                <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ flex: 1, textAlign: 'center', padding: '20px', background: 'var(--surface2)', borderRadius: '8px' }}>
                    <p className="muted" style={{ margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Readiness Score</p>
                    <h1 style={{ margin: 0, fontSize: '42px', color: readinessScore >= 100 ? 'var(--green)' : 'var(--warning)' }}>{readinessScore}%</h1>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', padding: '20px', background: goNoGoStatus === 'GO' ? 'var(--green)' : 'var(--red)', borderRadius: '8px', color: '#fff' }}>
                    <p style={{ margin: '0 0 5px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)' }}>Cardinal Rule Gate</p>
                    <h1 style={{ margin: 0, fontSize: '42px' }}>{goNoGoStatus}</h1>
                  </div>
                </div>

                <div className="card">
                  <h2>T-Minus Countdown Tracker</h2>
                  <table className="table" style={{ marginTop: '15px' }}>
                    <thead>
                      <tr>
                        <th>T-Minus Phase</th>
                        <th>Milestone</th>
                        <th>Owner</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tMinus.map((t, i) => (
                        <tr key={i}>
                          <td><strong>{t.phase}</strong></td>
                          <td>{t.milestone}</td>
                          <td className="muted">{t.owner}</td>
                          <td><span className={`badge ${t.status === 'Completed' ? 'success' : 'warning'}`}>{t.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {blockers.length > 0 && (
                  <div className="card" style={{ border: '1px solid var(--red)' }}>
                    <h2 style={{ color: 'var(--red)' }}>Active Go/No-Go Blockers</h2>
                    <ul style={{ paddingLeft: '20px', color: 'var(--red)', marginTop: '10px' }}>
                      {blockers.map((b, i) => (
                        <li key={i} style={{ marginBottom: '10px' }}>
                          <strong>{b.issue}:</strong> {b.resolutionRequired}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          {/* STAGE 11 GTM LAUNCH & FUNNEL EXECUTION */}
          {activeTab === 11 && (() => {
            const stage11Data = activeStageData?.data || { branding: [], acquisition: [], engagement: [] };
            const list = stage11Data[gtmSubTab] || [];
            return (
              <div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)', background: 'var(--card-bg-subtle, #fafafa)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>GTM Launch & Funnel Execution</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                        This stage establishes a day-by-day micro-schedule for launching and executing the DRS in target subdivisions, divided into distinct marketing and operational funnels.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-tabs Selection */}
                <div className="flex gap-2" style={{ marginBottom: '16px' }}>
                  <button 
                    className={`btn ${gtmSubTab === 'branding' ? '' : 'btn-secondary'}`} 
                    style={{ flex: 1, padding: '10px', background: gtmSubTab === 'branding' ? 'var(--accent)' : 'var(--grey-soft)', color: gtmSubTab === 'branding' ? '#fff' : 'var(--ink)' }} 
                    onClick={() => setGtmSubTab('branding')}
                  >
                    Branding {gtmGeneratingStatus === 'branding' && <span className="spinner" style={{ width: '12px', height: '12px', marginLeft: '8px', borderWidth: '2px', display: 'inline-block' }}></span>}
                  </button>
                  <button 
                    className={`btn ${gtmSubTab === 'acquisition' ? '' : 'btn-secondary'}`} 
                    style={{ flex: 1, padding: '10px', background: gtmSubTab === 'acquisition' ? 'var(--accent)' : 'var(--grey-soft)', color: gtmSubTab === 'acquisition' ? '#fff' : 'var(--ink)' }} 
                    onClick={() => setGtmSubTab('acquisition')}
                  >
                    Acquisition {gtmGeneratingStatus === 'acquisition' && <span className="spinner" style={{ width: '12px', height: '12px', marginLeft: '8px', borderWidth: '2px', display: 'inline-block' }}></span>}
                  </button>
                  <button 
                    className={`btn ${gtmSubTab === 'engagement' ? '' : 'btn-secondary'}`} 
                    style={{ flex: 1, padding: '10px', background: gtmSubTab === 'engagement' ? 'var(--accent)' : 'var(--grey-soft)', color: gtmSubTab === 'engagement' ? '#fff' : 'var(--ink)' }} 
                    onClick={() => setGtmSubTab('engagement')}
                  >
                    Engagement {gtmGeneratingStatus === 'engagement' && <span className="spinner" style={{ width: '12px', height: '12px', marginLeft: '8px', borderWidth: '2px', display: 'inline-block' }}></span>}
                  </button>
                </div>

                <div className="card">
                  <h2 style={{ textTransform: 'capitalize', color: 'var(--accent)' }}>
                    {gtmSubTab} Operational Matrix
                  </h2>
                  <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                    <table style={{ minWidth: '900px', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '100px' }}>Phase</th>
                          <th style={{ width: '180px' }}>Objective</th>
                          <th style={{ width: '280px' }}>Activity</th>
                          <th style={{ width: '140px' }}>Channel</th>
                          <th style={{ width: '140px' }}>Target Audience</th>
                          <th style={{ width: '140px' }}>Success KPI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.length > 0 ? list.map((item, i) => (
                          <tr key={i}>
                            <td><strong>{item.phase}</strong></td>
                            <td><strong>{item.objective}</strong></td>
                            <td className="muted">{item.activity}</td>
                            <td><span className="phase p1">{item.channel}</span></td>
                            <td>{item.targetAudience}</td>
                            <td><strong style={{ color: 'var(--green)' }}>{item.successKpi}</strong></td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: '48px 32px' }}>
                              {gtmGeneratingStatus === gtmSubTab ? (
                                <span><div className="spinner" style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}></div> Generating {gtmSubTab} parameters...</span>
                              ) : (
                                <div>
                                  <p style={{ marginBottom: '16px' }}>No parameters generated yet for {gtmSubTab}.</p>
                                  <button className="btn" onClick={() => generateStage11Funnel(gtmSubTab)}>Generate {gtmSubTab} Strategy</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 12 BTL ACTIVATION */}
          {activeTab === 12 && activeStageData && (
            <div>
              <div className="card">
                <h2>BTL Engagement Reach Score</h2>
                <div className="grid two mt-4">
                  <div className="stat">
                    <div className="k">BTL Reach Score</div>
                    <div className="v" style={{ color: 'var(--green)' }}>{activeStageData.data?.btlReachScore?.overall}/100</div>
                  </div>
                  <div className="stat">
                    <div className="k">Mapped locations count</div>
                    <div className="v">{activeStageData.data?.locations?.length}</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Location Database</h2>
                <table>
                  <thead>
                    <tr><th>Location Name</th><th>Type</th><th>{isNationalProject ? geoSchema.level2 : geoSchema.level3}</th><th>Footfall Volume</th><th>Relevance</th><th>Priority Rollout</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.data?.locations?.map((l, i) => (
                      <tr key={i}>
                        <td><strong>{l.name}</strong></td>
                        <td className="muted">{l.type}</td>
                        <td>{l.taluka}</td>
                        <td className="muted">{l.footfall}</td>
                        <td><span className={`phase ${l.relevance === 'High' ? 'p1' : 'p2'}`}>{l.relevance}</span></td>
                        <td><span className="phase p2">{l.priorityRollout || l.status || 'Phase 1 - Immediate'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>BTL Activity Campaign Plan</h2>
                <table>
                  <thead>
                    <tr><th>Venue Type</th><th>Activity</th><th>Timeline</th><th>Reach Target</th><th>Budget</th><th>Permissions required</th></tr>
                  </thead>
                  <tbody>
                    {activeStageData.data?.btlActivities?.map((a, i) => (
                      <tr key={i}>
                        <td><strong>{a.venueType}</strong></td>
                        <td className="muted">{a.activity}</td>
                        <td>{a.calendar}</td>
                        <td><strong>{a.reach}</strong></td>
                        <td><strong>{a.budget}</strong></td>
                        <td className="muted">{a.permissions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STAGE 13 REPUTATION MANAGEMENT */}
          {activeTab === 13 && activeStageData && (() => {
            const repData = activeStageData.data || {};
            const thresholds = repData.slaThresholds || [];
            const playbook = repData.rapidResponseTemplates || [];

            return (
              <div>
                <div className="card">
                  <h2>Crisis SLA & Escalation Thresholds</h2>
                  <table className="table" style={{ marginTop: '15px' }}>
                    <thead>
                      <tr>
                        <th>Incident Type</th>
                        <th>SLA (Hours)</th>
                        <th>Escalation Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {thresholds.map((t, i) => (
                        <tr key={i}>
                          <td><strong>{t.incidentType}</strong></td>
                          <td><span className="badge warning">{t.slaHours}h Response</span></td>
                          <td className="muted">{t.escalationPath}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="card">
                  <h2>Rapid Response Playbook</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '15px' }}>
                    {playbook.map((p, i) => (
                      <div key={i} style={{ padding: '15px', background: 'var(--surface2)', borderRadius: '8px' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>Scenario: {p.scenario}</h3>
                        <p style={{ margin: '0 0 10px 0', fontStyle: 'italic', color: 'var(--muted)' }}>" {p.draftStatement} "</p>
                        <p style={{ margin: 0, fontSize: '12px' }}><strong>Channels:</strong> {p.channels.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 14 KPIS */}
          {activeTab === 14 && activeStageData && (() => {
            const kpisList = activeStageData.data?.kpis || [];
            const leadingKpis = kpisList.filter(k => k.type === 'Leading');
            const laggingKpis = kpisList.filter(k => k.type === 'Lagging');

            return (
              <div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'var(--card-bg-subtle, #fafafa)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>📝</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>SLA Performance Blueprint</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666' }}>
                        This framework establishes the target SLAs and threshold safeguards. It defines input readiness criteria (Leading Indicators) for setup, and output success targets (Lagging Indicators) to monitor once operations go live.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2>DRS Performance Index</h2>
                  <div className="grid two mt-4">
                    <div className="stat">
                      <div className="k">Target Performance Index Score</div>
                      <div className="v" style={{ color: 'var(--green)' }}>{activeStageData.data?.performanceIndex?.overall}/100</div>
                    </div>
                    <div className="stat">
                      <div className="k">Post-Launch Return Rate Target (Lagging)</div>
                      <div className="v" style={{ color: 'var(--primary)' }}>80%</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2 style={{ color: 'var(--primary)', marginBottom: '4px' }}>1. Operational Readiness Targets (Leading Indicators)</h2>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
                    Milestones and inputs that must be actively executed during the setup phase to guarantee a successful launch.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '1100px', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ minWidth: '160px' }}>KPI Name</th>
                          <th style={{ minWidth: '220px' }}>Definition</th>
                          <th style={{ minWidth: '180px' }}>Formula / Verification</th>
                          <th style={{ minWidth: '100px' }}>Cadence</th>
                          <th style={{ minWidth: '100px' }}>Target SLA</th>
                          <th style={{ minWidth: '110px' }}>Warning Limit</th>
                          <th style={{ minWidth: '110px' }}>Critical Limit</th>
                          <th style={{ minWidth: '240px' }}>Immediate Escalation Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadingKpis.length > 0 ? leadingKpis.map((k, i) => (
                          <tr key={i}>
                            <td><strong>{k.name}</strong></td>
                            <td className="muted">{k.definition}</td>
                            <td className="muted"><code>{k.formula}</code></td>
                            <td className="muted">{k.slate || k.cadence}</td>
                            <td><strong style={{ color: 'var(--green)' }}>{k.targetLevel}</strong></td>
                            <td><span className="phase p2">{k.warningThreshold}</span></td>
                            <td><span className="phase p3" style={{ background: '#ef4444', color: '#fff' }}>{k.criticalThreshold}</span></td>
                            <td className="muted"><em>{k.correctiveSOP}</em></td>
                          </tr>
                        )) : (
                          <tr><td colSpan="8" className="muted" style={{ textAlign: 'center' }}>No Leading KPIs generated.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card" style={{ marginTop: '24px' }}>
                  <h2 style={{ color: 'var(--green)', marginBottom: '4px' }}>2. Operational Success Targets (Lagging Indicators)</h2>
                  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#666' }}>
                    The target efficiency levels and outcomes we aim to achieve and sustain once the DRS goes live.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '1100px', width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ minWidth: '160px' }}>KPI Name</th>
                          <th style={{ minWidth: '220px' }}>Definition</th>
                          <th style={{ minWidth: '180px' }}>Formula / Calculation</th>
                          <th style={{ minWidth: '100px' }}>Cadence</th>
                          <th style={{ minWidth: '100px' }}>Target SLA</th>
                          <th style={{ minWidth: '110px' }}>Warning Limit</th>
                          <th style={{ minWidth: '110px' }}>Critical Limit</th>
                          <th style={{ minWidth: '240px' }}>Immediate Escalation Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laggingKpis.length > 0 ? laggingKpis.map((k, i) => (
                          <tr key={i}>
                            <td><strong>{k.name}</strong></td>
                            <td className="muted">{k.definition}</td>
                            <td className="muted"><code>{k.formula}</code></td>
                            <td className="muted">{k.slate || k.cadence}</td>
                            <td><strong style={{ color: 'var(--green)' }}>{k.targetLevel}</strong></td>
                            <td><span className="phase p2">{k.warningThreshold}</span></td>
                            <td><span className="phase p3" style={{ background: '#ef4444', color: '#fff' }}>{k.criticalThreshold}</span></td>
                            <td className="muted"><em>{k.correctiveSOP}</em></td>
                          </tr>
                        )) : (
                          <tr><td colSpan="8" className="muted" style={{ textAlign: 'center' }}>No Lagging KPIs generated.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STAGE 15 KNOWLEDGE BASE */}
          {activeTab === 15 && activeStageData && (
            <div>
              <div className="card">
                <h2>Blueprint Reusability Score</h2>
                <div className="grid two mt-4">
                  <div className="stat">
                    <div className="k">Reusability Score</div>
                    <div className="v" style={{ color: 'var(--green)' }}>{activeStageData.data?.blueprintCompleteness}/100</div>
                  </div>
                  <div className="stat">
                    <div className="k">Status</div>
                    <div className="v" style={{ color: 'var(--accent)' }}>Packaged & Reusable</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Reusable Geography Playbook</h2>
                
                <h3>A · Gathered Market Evidence</h3>
                <p className="muted">{activeStageData.data?.playbook?.evidence}</p>

                <h3>B · Core Launch Narrative</h3>
                <p className="muted">{activeStageData.data?.playbook?.narrative}</p>

                <h3>C · Key Lessons Learned</h3>
                <p className="muted">{activeStageData.data?.playbook?.lessons}</p>

                <h3>D · High Tourism Zone Best Practices</h3>
                <p className="muted">{activeStageData.data?.playbook?.bestPractices}</p>
              </div>

              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button className="btn" onClick={initNewProject}>Clone to Next Geography</button>
              </div>
            </div>
          )}

          {/* SOURCES FOOTER FOR GENERATED DATA */}
          {activeStageData && activeStageData.sources?.length > 0 && (
            <div className="card">
              <h3>Sources & Citations <span className="muted">· grounded via Google Search</span></h3>
              <ul className="sources">
                {activeStageData.sources.map((s, i) => (
                  <li key={i}><a href={s.uri} target="_blank" rel="noreferrer">{s.title}</a></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Copilot Mascot Toggle */}
      <button 
        className={`copilot-floating-btn ${!copilotCollapsed ? 'hidden' : ''}`}
        onClick={() => setCopilotCollapsed(false)}
      >
        <img src="/logo.png" alt="Copilot" />
      </button>

      {/* 3. Collapsible Right AI Copilot drawer */}
      <div className={`copilot-panel ${copilotFullpage ? 'fullpage' : copilotCollapsed ? 'collapsed' : ''}`}>
        <div className="copilot-header">
          <h3>AI Copilot ({activeTab === 'orchestrator' ? 'Task Orchestrator' : activeTab === 'preplanning' ? 'Campaign Brief Co-author' : activeTab === 'planning' ? 'Campaign Plan Co-author' : activeTab === 'research' ? (STAGES.find(s => s.num === researchTab)?.name || 'Strategic Intelligence') : (STAGES.find(s => s.num === activeTab)?.name || 'Setup')}){!projectId && <span style={{ marginLeft: 6, fontSize: '10px', fontWeight: 600, color: 'var(--accent)', background: 'var(--grey-soft)', padding: '2px 6px', borderRadius: 10, verticalAlign: 'middle' }}>GENERAL</span>}</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="icon-btn"
              title={copilotFullpage ? 'Dock Binny back to the side' : 'Expand Binny to full page'}
              aria-label={copilotFullpage ? 'Dock' : 'Full page'}
              onClick={() => setCopilotFullpage(v => !v)}
            >
              {copilotFullpage ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              className={`icon-btn ${voiceMode ? 'active' : ''}`}
              title={voiceMode ? 'Voice replies ON — Binny speaks' : 'Voice replies OFF'}
              aria-label="Toggle voice replies"
              onClick={() => { const nv = !voiceMode; setVoiceMode(nv); if (!nv) stopSpeaking(); }}
            >
              {voiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <div style={{ position: 'relative' }} ref={chatDropdownRef}>
              <button className="icon-btn" title="Chat history" aria-label="Chat history" onClick={() => setChatHistoryDropdownOpen(!chatHistoryDropdownOpen)}>
                <MessagesSquare size={16} />
              </button>
              {chatHistoryDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  width: '200px',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div 
                    onClick={createNewThread}
                    style={{
                      padding: '10px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--line)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} /><span>New Chat</span>
                  </div>
                  {chatThreads.map(t => (
                    <div 
                      key={t.id}
                      onClick={() => switchThread(t.id)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: activeThreadId === t.id ? '#f1f5f9' : '#fff',
                        color: activeThreadId === t.id ? 'var(--ink)' : 'var(--ink-soft)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = activeThreadId === t.id ? '#f1f5f9' : '#fff'}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {t.title}
                      </span>
                      <span
                        onClick={(e) => deleteThread(t.id, e)}
                        title="Delete Chat"
                        style={{ opacity: 0.45, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.45}
                      >
                        <X size={14} />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Close button for mobile bottom sheet */}
            <button 
              className="copilot-toggle-btn mobile-only-btn" 
              onClick={() => setCopilotCollapsed(true)}
            >
              Close
            </button>
          </div>
        </div>

        <div className="copilot-chat">
          {copilotMessages.map((msg, i) => {
            if (i === 0 && msg.sender === 'assistant') {
              return (
                <div key={i} className="mascot-container">
                  {/* Binny the Mascot SVG */}
                  <svg className="mascot-avatar" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Shadow */}
                    <ellipse cx="32" cy="58" rx="14" ry="3" fill="#cbd5e1" />
                    {/* Body (Recycling bin shape) */}
                    <path d="M16 16C16 13.7909 17.7909 12 20 12H44C46.2091 12 48 13.7909 48 16V44C48 48.4183 44.4183 52 40 52H24C19.5817 52 16 48.4183 16 44V16Z" fill="url(#bodyGrad)" />
                    {/* Lid / Top Cap */}
                    <rect x="18" y="8" width="28" height="4" rx="2" fill="#1d4ed8" />
                    {/* Recykal Boomerang Badge on Binny's stomach — logo only, no text */}
                    <circle cx="32" cy="38" r="9" fill="#1e3a8a" opacity="0.5" />
                    <image
                      href="/logo.png"
                      x="24"
                      y="30"
                      width="16"
                      height="16"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
                    />
                    {/* Visor Screen */}
                    <rect x="22" y="18" width="20" height="10" rx="4" fill="#0f172a" />
                    {/* Glowing LED Eyes (Interactive blink) */}
                    <ellipse className="mascot-eye" cx="28" cy="23" rx="2.5" ry="2.5" fill="#38bdf8" />
                    <ellipse className="mascot-eye" cx="36" cy="23" rx="2.5" ry="2.5" fill="#38bdf8" />
                    {/* Left static arm */}
                    <rect x="10" y="24" width="6" height="14" rx="3" fill="#3b82f6" />
                    {/* Right waving arm (Mascot-hand) */}
                    <g className="mascot-hand">
                      <rect x="48" y="24" width="6" height="14" rx="3" fill="#3b82f6" />
                      <circle cx="51" cy="20" r="3" fill="#1d4ed8" />
                    </g>
                    {/* Gradients */}
                    <defs>
                      <linearGradient id="bodyGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3b82f6" />
                        <stop offset="1" stopColor="#1d4ed8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Greeting Bubble */}
                  <div className="mascot-speech-bubble">
                    {msg.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className={`chat-message ${msg.sender === 'user' ? 'user' : 'assistant'}`}>
                {msg.image && <img src={msg.image} alt="attached" style={{ maxWidth: '160px', borderRadius: 8, marginBottom: 6, border: '1px solid var(--line)' }} />}
                <div className="md-body" style={{ lineHeight: 1.5, wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                {msg.tool && msg.toolResult && (() => {
                  const t = msg.toolResult;
                  const rows = Array.isArray(t.rows) ? t.rows : [];
                  return (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                      <div style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, color: (t.status === 'error' || t.offline) ? '#854F0B' : 'var(--accent)', marginBottom: rows.length ? 6 : 0 }}>
                        {t.offline ? '⚠️ Collector agent is not running — start it and ask me again.'
                          : t.status === 'error' ? `⚠️ ${t.msg || 'failed'}`
                            : t.status === 'failed' ? '⚠️ Collection failed — check the collector agent.'
                              : t.status === 'done' ? `✓ ${t.count} result${t.count === 1 ? '' : 's'}${t.label ? ` — ${t.label}` : ''}`
                                : <><span className="spinner" style={{ width: 11, height: 11, display: 'inline-block' }} /> Collecting {t.label || ''}…{t.count ? ` ${t.count} so far` : ''}</>}
                      </div>
                      {rows.slice(0, 10).map((r, ri) => (
                        <div key={ri} style={{ fontSize: 11.5, padding: '4px 0', borderTop: ri ? '1px solid var(--line)' : 'none' }}>
                          <b>{r.name || r.handle || '—'}</b>{r.phone ? ` · ${r.phone}` : ''}
                          {r.address ? <span style={{ color: 'var(--ink-soft)' }}> · {r.address}</span> : null}
                          {r.rating != null ? <span style={{ color: 'var(--ink-soft)' }}> · ⭐{r.rating}</span> : null}
                          {r.snippet ? <div style={{ color: 'var(--ink-soft)', marginTop: 2 }}>{String(r.snippet).slice(0, 160)}</div> : null}
                          {r.url ? <a href={r.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontSize: 10.5 }}>open ↗</a> : null}
                        </div>
                      ))}
                      {rows.length > 10 && <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 4 }}>…{rows.length - 10} more</div>}
                      {t.note && <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 6 }}>{t.note}{t.kind === 'creative' && <a onClick={() => setActiveTab('creative')} style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: 6 }}>Open Creative Studio →</a>}</div>}
                    </div>
                  );
                })()}
                {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', color: 'var(--ink-soft)', marginBottom: 4 }}>SOURCES ({msg.sources.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {msg.sources.slice(0, 6).map((s, si) => (
                        <a key={si} href={s.uri} target="_blank" rel="noreferrer" title={s.uri} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden' }}>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title || s.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {msg.sender === 'assistant' && msg.text && (
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      title="Copy — keeps tables and formatting"
                      onClick={async () => { const ok = await copyMessageFormatted(msg.text); if (ok) { setCopiedMsgIdx(i); setTimeout(() => setCopiedMsgIdx(c => c === i ? null : c), 1500); } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, padding: '3px 9px', fontSize: '11px', color: copiedMsgIdx === i ? 'var(--accent)' : 'var(--ink-soft)', cursor: 'pointer' }}
                    >
                      {copiedMsgIdx === i ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                  </div>
                )}
                {msg.proposals && msg.proposals.map((p, pi) => {
                  const applied = msg._applied && msg._applied[pi];
                  const label = `${p.op || 'set'} · ${p.target}${Number.isInteger(p.index) ? ` · row ${p.index + 1}` : ''}${p.field ? ` · ${p.field}` : ''}`;
                  const body = p.content ?? (typeof p.value === 'string' ? p.value : JSON.stringify(p.value));
                  return (
                    <div key={pi} style={{ marginTop: 8, padding: '10px', border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--accent-soft, #eef6f3)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>Proposed → {label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{body}</div>
                      {applied === true ? (
                        <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>✓ Applied</span>
                      ) : applied === 'rejected' ? (
                        <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>Dismissed</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => {
                              applyContentUpdate(msg.tab, p);
                              setCopilotMessages(prev => prev.map((mm, mi) => mi === i ? { ...mm, _applied: { ...(mm._applied || {}), [pi]: true } } : mm));
                            }}
                          >Apply</button>
                          <button
                            style={{ padding: '4px 12px', fontSize: '12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink-soft)' }}
                            onClick={() => setCopilotMessages(prev => prev.map((mm, mi) => mi === i ? { ...mm, _applied: { ...(mm._applied || {}), [pi]: 'rejected' } } : mm))}
                          >Dismiss</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {copilotLoading && (
            <div className="chat-message assistant">
              <span className="spinner" style={{ borderTopColor: 'var(--ink)' }} /> Thinking...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '10px 16px 0' }}>
          {renderKnowledgePanel(true)}
        </div>

        {copilotImage && (
          <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={copilotImage.preview} alt="attached" style={{ height: 40, borderRadius: 6, border: '1px solid var(--line)' }} />
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>image attached</span>
            <button onClick={() => setCopilotImage(null)} style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>remove</button>
          </div>
        )}
        <div className="copilot-input" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label className="btn" title="Attach an image (e.g. a competitor ad or creative)" style={{ padding: '10px', background: 'var(--grey-soft)', color: 'var(--ink)', border: '1px solid var(--line)', cursor: 'pointer', display: 'inline-flex' }}>
            <ExternalLink size={18} style={{ transform: 'rotate(45deg)' }} />
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = () => { const s = String(r.result || ''); setCopilotImage({ mimeType: f.type || 'image/png', data: s.split(',')[1] || '', preview: s }); };
              r.readAsDataURL(f); e.target.value = '';
            }} />
          </label>
          <button
            className={`btn ${isListening ? 'listening-pulsate' : ''}`}
            style={{ 
              padding: '10px', 
              background: isListening ? '#d92d20' : 'var(--grey-soft)', 
              color: isListening ? '#ffffff' : 'var(--ink)', 
              border: isListening ? '1px solid #d92d20' : '1px solid var(--line)',
              borderRadius: '8px', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              flexShrink: 0
            }}
            title={isListening ? 'Recording voice... Click to stop.' : 'Voice Input'}
            onClick={toggleListening}
          >
            {isListening ? (
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ffffff', borderRadius: '50%' }} />
            ) : (
              <Mic size={18} />
            )}
          </button>
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Ask copilot..."}
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCopilotSend()}
            disabled={copilotLoading}
            style={{ flex: 1, height: '40px' }}
          />
          <button className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', height: '40px' }} onClick={handleCopilotSend} disabled={copilotLoading || !copilotQuery.trim()}>
            <Send size={15} /> Send
          </button>
        </div>
      </div>
    </div>

      {/* Hidden Print Template */}
      {printingProject && (
        <div id="drs-print-template">
          <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '2px solid #0066cc', paddingBottom: 20 }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 8px', color: '#1d1d1f' }}>Recykal DRS Roadmap Blueprint</h1>
            <p style={{ fontSize: '16px', color: '#86868b', margin: 0 }}>
              Geography: <strong>{printingProject.state}, {printingProject.country}</strong> | Focus: {printingProject.materials.join(' · ')}
            </p>
            <p style={{ fontSize: '12px', color: '#86868b', marginTop: 6 }}>
              Objective: {printingProject.objective}
            </p>
          </div>

          {/* Render summary stats from Stage 2 */}
          {printingProject.stages?.stage2 && (
            <div className="print-page-break" style={{ marginBottom: 30 }}>
              <h2 style={{ color: '#0066cc', borderBottom: '1px solid #e5e5ea', paddingBottom: 8 }}>1. Geographic Summary</h2>
              <table style={{ width: '100%', marginBottom: 20 }}>
                <tbody>
                  <tr>
                    <td><strong>Population:</strong></td>
                    <td>{printingProject.stages.stage2.intel?.stateSummary?.population?.value || 'N/A'}</td>
                    <td><strong>Touchpoint Universe:</strong></td>
                    <td>{printingProject.stages.stage2.touchpoints?.universeTotal || 'N/A'} ({printingProject.stages.stage2.touchpoints?.badge || 'Estimated'})</td>
                  </tr>
                  <tr>
                    <td><strong>{printingProject.state === 'National' ? 'States / Provinces' : 'Districts'}:</strong></td>
                    <td>{printingProject.stages.stage2.intel?.stateSummary?.districts?.value || 'N/A'}</td>
                    <td><strong>{printingProject.state === 'National' ? 'Districts / Counties' : 'Talukas'}:</strong></td>
                    <td>{printingProject.stages.stage2.intel?.stateSummary?.talukasOrTehsils?.value || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>

              <h3>Regulatory Context</h3>
              <p style={{ fontSize: '14px', lineHeight: 1.5 }}>{printingProject.stages.stage2.intel?.stateSummary?.regulatoryContext}</p>
              
              <h3>Touchpoint Breakdown</h3>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Category</th>
                    <th style={{ textAlign: 'left' }}>Subtype</th>
                    <th style={{ textAlign: 'left' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(printingProject.stages.stage2.touchpoints?.groups || []).map((g, idx) => (
                    <React.Fragment key={idx}>
                      <tr>
                        <td colSpan="3" style={{ fontWeight: 'bold', background: '#f5f5f7', padding: '6px' }}>{g.group} (Total: {g.total})</td>
                      </tr>
                      {(g.subtypes || []).map((sub, sidx) => (
                        <tr key={sidx}>
                          <td></td>
                          <td>{sub.label}</td>
                          <td>{sub.count}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Render summaries for stages 3 to 10 */}
          {Object.keys(printingProject.stages || {}).filter(k => k !== 'stage2' && k !== 'setup').map((stageKey) => {
            const stageNum = stageKey.replace('stage', '');
            const stageData = printingProject.stages[stageKey]?.data;
            if (!stageData) return null;

            return (
              <div key={stageKey} className="print-page-break" style={{ marginBottom: 30 }}>
                <h2 style={{ color: '#0066cc', borderBottom: '1px solid #e5e5ea', paddingBottom: 8 }}>
                  Stage {stageNum} · {STAGES.find(s => String(s.num) === stageNum)?.name}
                </h2>
                
                {renderPrintValue(stageData)}
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Keynote Presentation Modal */}
      {presentationProject && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: '#0f172a', // Premium dark slate background for slide viewport
            color: '#1e293b',
            fontFamily: '"Outfit", "Inter", -apple-system, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            userSelect: 'none'
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
              setPresentationSlide(prev => Math.min(prev + 1, 5));
            } else if (e.key === 'ArrowLeft') {
              setPresentationSlide(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Escape') {
              setPresentationProject(null);
            }
          }}
          tabIndex="0"
          ref={(el) => el && el.focus()}
        >
          {/* Top Control Bar */}
          <div style={{ width: '100%', maxWidth: '1120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: '#005DFF', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.05em' }}>RECYKAL PITCH MODE</span>
              <strong style={{ fontSize: '15px', color: '#94a3b8' }}>{presentationProject.state} DRS proposal</strong>
            </div>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer' }}
              onClick={() => setPresentationProject(null)}
            >
              Exit Presentation (ESC)
            </button>
          </div>

          {/* 16:9 Widescreen Slide Canvas */}
          <div style={{
            width: '100%',
            maxWidth: '1120px',
            aspectRatio: '16/9',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 64px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Accent Gradient Border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #005DFF 0%, #6E5CFA 100%)' }} />

            {/* Slide Header (for Slide index > 0) */}
            {presentationSlide > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#005DFF', fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Sustainable Circularity</span>
                  <div style={{ height: '2px', width: '32px', background: '#005DFF', marginTop: '4px' }} />
                </div>
                <div>
                  <img src="/logo-dark.png" alt="Recykal Logo" style={{ height: '24px', width: 'auto', display: 'block' }} />
                </div>
              </div>
            )}

            {/* Slide Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: presentationSlide === 0 ? 'center' : 'flex-start' }}>
              
              {/* Slide 1: Cover Title (Matches Slide 1 of Template) */}
              {presentationSlide === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Left accent bar */}
                  <div style={{ position: 'absolute', left: '-32px', top: '0', bottom: '0', width: '6px', background: 'linear-gradient(180deg, #005DFF 0%, #6E5CFA 100%)', borderRadius: '4px' }} />
                  
                  <span style={{ color: '#005DFF', fontSize: '14px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Sustainable Circularity</span>
                  
                  <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', color: '#0f172a' }}>
                    Deposit Return System (DRS)
                  </h1>
                  <h2 style={{ fontSize: '24px', color: '#64748b', fontWeight: '500', margin: '0 0 32px' }}>
                    A Circular Economy Blueprint for <strong style={{ color: '#0f172a' }}>{presentationProject.state}, {presentationProject.country}</strong>
                  </h2>

                  <div style={{ display: 'flex', gap: '32px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Active Materials</span>
                      <strong style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>{presentationProject.materials.join(' · ')}</strong>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>DRS Objective</span>
                      <strong style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>Deposit Return & Recovery</strong>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>Brand Owner</span>
                      <img src="/logo-dark.png" alt="Recykal" style={{ height: '18px', width: 'auto', marginTop: '4px', alignSelf: 'flex-start' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 2: Geography & Scope (Matches Data Representation templates) */}
              {presentationSlide === 1 && (
                <div>
                  <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                    Geographic & Operational Scope
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', marginTop: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>REGIONAL POPULATION</span>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>{presentationProject.stages?.stage2?.intel?.stateSummary?.population?.value || 'N/A'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>TOUCHPOINTS UNIVERSE</span>
                        <div style={{ fontSize: '26px', fontWeight: '800', color: '#005DFF', marginTop: '8px' }}>{presentationProject.stages?.stage2?.touchpoints?.universeTotal || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', padding: '24px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                      <span style={{ color: '#005DFF', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>REGULATORY COMPLIANCE ENABLERS</span>
                      <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginTop: '10px', fontWeight: '500' }}>
                        {presentationProject.stages?.stage2?.intel?.stateSummary?.regulatoryContext || 'Regulatory framework compliance with waste management laws.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 3: Consumption & Flows (Matches Table representation templates) */}
              {presentationSlide === 2 && (
                <div>
                  <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.02em' }}>
                    Material Flow & Recovery Targets
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>Estimated annual packing footprint & commercial opportunity values</p>
                  
                  <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', background: '#f8fafc' }}>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>MATERIAL TYPE</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>TONS / YEAR</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>EST. UNITS / YEAR</th>
                          <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700' }}>OPPORTUNITY VALUE SCORE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(presentationProject.stages?.stage3?.data?.demandEstimation || [
                          { material: 'PET Bottles', tonsPerYear: '14,200', itemsPerYear: '42.6M', opportunityScore: 'High (0.91)' },
                          { material: 'Glass Bottles', tonsPerYear: '32,100', itemsPerYear: '64.2M', opportunityScore: 'Medium (0.75)' },
                          { material: 'Beverage Cans', tonsPerYear: '2,900', itemsPerYear: '14.5M', opportunityScore: 'High (0.88)' }
                        ]).slice(0, 3).map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '13px' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a' }}>{item.material}</td>
                            <td style={{ padding: '12px 16px' }}>{item.tonsPerYear} t</td>
                            <td style={{ padding: '12px 16px' }}>{item.itemsPerYear}</td>
                            <td style={{ padding: '12px 16px', color: '#005DFF', fontWeight: 'bold' }}>{item.opportunityScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Slide 4: Key Stakeholder Alignment */}
              {presentationSlide === 3 && (() => {
                const stage4Data = presentationProject.stages?.stage4?.data || {};
                const alignmentScore = stage4Data.alignmentReadiness?.overall || 82;
                const stakeholders = stage4Data.stakeholders || [];
                const isIndia = (presentationProject.country || '').toLowerCase() === 'india';
                
                // Get Champion & Risk stakeholders dynamically, fallback to localized defaults
                const championsList = stakeholders.filter(s => s.stance === 'Champion' || s.stance === 'Agreed');
                const risksList = stakeholders.filter(s => s.stance === 'Blocker' || s.stance === 'Neutral');
                
                const primaryChampion = championsList[0] || {
                  name: isIndia ? 'State Pollution Control Board (SPCB)' : 'Ministry of Environment & Regulatory Bodies',
                  stance: 'Champion',
                  role: 'Policy mandate enforcement and local NOC clearances'
                };
                const primaryRisk = risksList[0] || {
                  name: 'Retail & HORECA Union Associations',
                  stance: 'Neutral / Risk',
                  role: 'Concerns regarding logistics footprint and deposit handling fee structures'
                };
                
                const defaultNarrative = isIndia 
                  ? "High alignment from municipal bodies and SPCB, offset by retail logistics queries. Action blueprint active in Stage 6."
                  : `Strong regulatory mandate from ${presentationProject.country} regional bodies. Ongoing workshops active to address merchant handling fees.`;
                  
                return (
                  <div>
                    <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                      Stakeholder Alignment Map
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px' }}>
                      <div>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>OPERATIONAL ALIGNMENT INDEX</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                          <span style={{ fontSize: '56px', fontWeight: '900', color: '#005DFF', lineHeight: 1 }}>{alignmentScore}%</span>
                          <span style={{ fontSize: '18px', color: '#94a3b8', fontWeight: '600' }}>/ 100</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                          {stage4Data.engagementSequence ? `Outreach sequence: ${stage4Data.engagementSequence.slice(0, 3).join(' ➔ ')}. ` : ''}
                          {defaultNarrative}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>PRIMARY ENGAGEMENT DRIVERS</span>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a' }}>{primaryChampion.name}:</strong> {primaryChampion.stance || 'Champion'} ({primaryChampion.role || 'High readiness, high policy mandate influence'})
                        </div>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a' }}>{primaryRisk.name}:</strong> {primaryRisk.stance || 'Neutral/Risk'} ({primaryRisk.role || 'Logistical friction on deposit handling'})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Slide 5: Competitor Landscape & Moat (Matches Slide 15 Recykal colors split) */}
              {presentationSlide === 4 && (() => {
                const stage5Data = presentationProject.stages?.stage5?.data || {};
                const competitors = stage5Data.competitors || [];
                const isIndia = (presentationProject.country || '').toLowerCase() === 'india';
                const level3Name = presentationProject.stages?.stage2?.intel?.geoSchema?.level3 || (isIndia ? 'Panchayat' : 'Local Body');

                // Determine dynamic competitors or fallback locally based on geography
                const fallbackCompetitors = [
                  { name: 'Global DRS Operators (e.g. TOMRA)', type: 'Hardware-locked RVM giants', recykalMoatStrategy: 'Hardware-agnostic SaaS platform integration' },
                  { name: isIndia ? 'Digital Deposit-Scheme Platforms' : 'Regional Deposit Platforms', type: 'Software-led return tracking', recykalMoatStrategy: 'Real-time transaction tracing & tracking' },
                  { name: 'Social Offset Platforms', type: 'PR-led collection offset offsetting', recykalMoatStrategy: `Direct ${level3Name} logistics integrations` }
                ];
                
                const finalCompetitors = competitors.length > 0 ? competitors.slice(0, 3) : fallbackCompetitors;
                
                const payoutText = isIndia ? 'Instant UPI Payouts' : 'Instant Digital Wallet / SEPA Payouts';
                const hierarchyText = isIndia ? 'Gram Panchayat Network Moat' : `${level3Name} Integration Moat`;

                return (
                  <div>
                    <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                      Competitor Landscape & Moat Strategy
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>How Recykal establishes a unique technical and operational advantage</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ color: '#475569', fontSize: '16px', fontWeight: '700', margin: '0 0 12px' }}>Key Competitor Segments</h3>
                        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', lineHeight: 1.8, color: '#334155' }}>
                          {finalCompetitors.map((c, i) => (
                            <li key={i}><strong>{c.name}:</strong> {c.type || 'Waste compliance operator'}</li>
                          ))}
                        </ul>
                      </div>
                      {/* Standout primary brand color card */}
                      <div style={{ background: 'linear-gradient(135deg, #005DFF 0%, #6E5CFA 100%)', padding: '24px', borderRadius: '12px', color: '#ffffff', boxShadow: '0 8px 24px rgba(0,93,255,0.2)' }}>
                        <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '700', margin: '0 0 12px' }}>Recykal Moat Advantage</h3>
                        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>
                          <li><strong>Hardware-Agnostic SaaS:</strong> {finalCompetitors[0]?.recykalMoatStrategy || 'Integrates with local RVM hardware fabric'}</li>
                          <li><strong>{payoutText}:</strong> Beats physical token vouchers with direct digital payouts</li>
                          <li><strong>{hierarchyText}:</strong> {finalCompetitors[2]?.recykalMoatStrategy || `Blocks entrants by integrating directly with state local bodies`}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Slide 6: Milestones & KPIs (Matches Explaining a Process Temp 2) */}
              {presentationSlide === 5 && (() => {
                const isIndia = (presentationProject.country || '').toLowerCase() === 'india';
                const regulatoryTerm = isIndia ? 'SPCB Gazette clearances' : 'Government & S.I. clearances';
                
                return (
                  <div>
                    <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', letterSpacing: '-0.02em' }}>
                      Execution Roadmap Phases
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', position: 'relative', marginTop: '8px' }}>
                      {/* Connecting line */}
                      <div style={{ position: 'absolute', top: '35px', left: '15%', right: '15%', height: '2px', background: '#e2e8f0', zIndex: 1 }} />
                      
                      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 2, position: 'relative', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#005DFF', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 'bold', fontSize: '14px' }}>1</div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Pre-Launch</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                          Pilot selection, logistics sync, and {regulatoryTerm}
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 2, position: 'relative', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6E5CFA', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 'bold', fontSize: '14px' }}>2</div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Launch Window</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                          Deploy collection hubs and reverse logistics Reverse Vending tracking
                        </p>
                      </div>

                      <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 2, position: 'relative', textAlign: 'center' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontWeight: 'bold', fontSize: '14px' }}>3</div>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Post-Launch Scale</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                          Full commercial scale-out to secondary towns and packaging audits
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Slide Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>Private & Confidential · www.recykal.com</span>
              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>© 2026 Recykal, All rights reserved</span>
              <span style={{ color: '#005DFF', fontSize: '11px', fontWeight: '700' }}>Slide {presentationSlide + 1} of 6</span>
            </div>
          </div>

          {/* Bottom Footer Controls (Outside Slide Canvas) */}
          <div style={{ width: '100%', maxWidth: '1120px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ color: '#64748b', fontSize: '13px' }}>Use Left/Right arrows or spacebar to navigate</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                disabled={presentationSlide === 0}
                onClick={() => setPresentationSlide(prev => Math.max(prev - 1, 0))}
              >
                ◀ Previous
              </button>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8' }}>Slide {presentationSlide + 1} of 6</span>
              <button
                className="btn"
                style={{ background: '#005DFF', color: '#ffffff', padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                disabled={presentationSlide === 5}
                onClick={() => setPresentationSlide(prev => Math.min(prev + 1, 5))}
              >
                Next ▶
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


