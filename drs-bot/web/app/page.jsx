'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

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
  const [selectedStages, setSelectedStages] = useState([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
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
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: 'assistant', text: 'Hi! I am your DRS Copilot. I can help analyze figures, draft MoUs/notifications, or resolve blockers for the current stage.' }
  ]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotCollapsed, setCopilotCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

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
    setSelectedStages(setupMeta.selectedStages || [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    setSelectedWorkstreams(setupMeta.selectedWorkstreams || [1, 2, 3, 4, 5, 6, 7]);
    setCustomConstraints(setupMeta.customConstraints || '');

    setResearchTab(2); setActiveTab('research'); // Jump to Market Research
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
    if (!activeId || activeId === 'NEW_PROJECT_PLACEHOLDER') {
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
      setResearchTab(2); setActiveTab('research'); // Unlocked → open Market Research
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading({ 1: false });
    }
  };

  // Market Research combined page: which sub-tab (stage 2-6) is showing + generate-all state.
  const [researchTab, setResearchTab] = useState(2);
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

  const handleCopilotSend = async () => {
    if (!copilotQuery.trim()) return;
    const userMsg = { sender: 'user', text: copilotQuery };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotQuery('');
    setCopilotLoading(true);

    try {
      const activeStageKey = activeTab === 'history' ? 'setup' : `stage${activeStageNum}`;
      const tabParam = activeTab === 'preplanning' ? 'preplanning' : activeTab === 'planning' ? 'planning' : (STAGES.find(s => s.num === activeTab)?.name || 'Setup');
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tab: tabParam,
          stateData: projectStages[activeStageKey] || { country, state, model, selectedMaterials, objective },
          query: userMsg.text,
          history: copilotMessages.slice(-6),
          model: selectedModel
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);

      // Co-author mode: parse ::brief-update:: proposals out of the reply.
      let display = data.text || '';
      const proposals = [];
      const re = /::brief-update::\s*([\s\S]*?)\s*::end::/g;
      let m;
      while ((m = re.exec(data.text || '')) !== null) {
        try { const p = JSON.parse(m[1].trim()); if (p.section && p.content) proposals.push(p); } catch {}
      }
      display = display.replace(re, '').trim();
      setCopilotMessages(prev => [...prev, { sender: 'assistant', text: display || 'I have proposed brief updates below.', proposals: proposals.length ? proposals : undefined }]);
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

  // Generate all selected research stages (2-6) in dependency order (2 -> 6).
  const generateAllResearch = async () => {
    const toRun = [2, 3, 4, 5, 6].filter((n) => selectedStages.includes(n));
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
          <div className={`menu-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <div className="badge-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" className="spin-slow" style={{ width: '16px', height: '16px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <span>Project History</span>
          </div>

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
            const researchStages = STAGES.filter((s) => [2, 3, 4, 5, 6].includes(s.num) && selectedStages.includes(s.num));
            const laterStages = STAGES.filter((s) => s.num >= 7 && selectedStages.includes(s.num));
            const researchStale = isSetupDone && researchStages.some((s) => isStageStale(s.num));

            return (
              <>
                {setupStage && renderStageItem(setupStage)}

                {/* MARKET RESEARCH — single combined page (stages 2-6 live inside as sub-tabs) */}
                {researchStages.length > 0 && (
                  <div
                    className={`menu-item ${activeTab === 'research' ? 'active' : ''} ${!isSetupDone ? 'disabled' : ''}`}
                    style={{ opacity: isSetupDone ? 1 : 0.5, pointerEvents: isSetupDone ? 'auto' : 'none' }}
                    onClick={() => isSetupDone && setActiveTab('research')}
                  >
                    <span className="badge-icon">MR</span>
                    <span>Market Research</span>
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
            {activeTab === 'history' ? 'Project History' : activeTab === 'research' ? 'Market Research' : activeTab === 'preplanning' ? 'Pre-planning · Campaign Brief' : activeTab === 'planning' ? 'Planning · Campaign Plan' : activeTab === 'orchestrator' ? 'Orchestrator · Task Assignment' : `Stage ${activeTab} · ${STAGES.find(s => s.num === activeTab)?.name}`}
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
                  return <>{renderModelIcon(active.icon)}{active.label} <span style={{marginLeft: '8px', fontSize: '10px'}}>?</span></>;
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
            {activeTab !== 'history' && activeTab !== 1 && activeTab !== 'orchestrator' && (
              <button
                className={`copilot-toggle-btn ${loading[activeStageNum] ? 'danger' : ''}`}
                style={loading[activeStageNum] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }}
                onClick={() => loading[activeStageNum] ? cancelGeneration(activeStageNum) : generateStage(activeStageNum)}
              >
                {loading[activeStageNum] ? <>🛑 Stop Generating</> : '🔄 Regenerate Stage'}
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
          {activeTab === 'history' && (
            <div>
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
                                    📄 Export PDF Report
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
                    {STAGES.filter(s => s.num !== 1).map(s => {
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
                  {STAGES.filter((s) => [2, 3, 4, 5, 6].includes(s.num) && selectedStages.includes(s.num)).map((s) => {
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
                  {researchGenerating ? <>🛑 Stop Generating</> : '⚡ Generate All Research'}
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
                {loading[activeStageNum] ? <>🛑 Stop Generating</> : (activeTab === 'preplanning' ? 'Draft the Campaign Brief' : activeTab === 'planning' ? 'Generate the Campaign Plan' : `Generate ${STAGES.find((s) => s.num === activeStageNum)?.name || 'Stage ' + activeStageNum}`)}
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
                  <p style={{ fontSize: '13px', margin: '6px 0 0', color: 'var(--ink-soft)' }}>The AI Director authored this from your Market Research. To change anything, <strong>discuss it with the Copilot</strong> (right) and approve the updates it proposes — tell it your real objectives, budget, and constraints. Hit <strong>💬 Discuss</strong> on any section to start.</p>
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
                            style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                          >💬 Discuss</button>
                        </div>
                        <p style={{ fontSize: '14px', margin: '8px 0 0', color: 'var(--ink)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {brief[key] || <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>Not yet drafted — ask the Copilot.</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <button className={`copilot-toggle-btn ${loading[16] ? 'danger' : ''}`} style={loading[16] ? {background: '#dc2626', borderColor: '#b91c1c', color: '#fff'} : { background: 'var(--grey-soft)', border: '1px solid var(--line)' }} onClick={() => loading[16] ? cancelGeneration(16) : generateStage(16)}>
                      {loading[16] ? <>🛑 Stop Generating</> : '✨ Re-draft all from research'}
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
                      {loading[17] ? <>🛑 Stop Generating</> : '✨ Re-draft plan'}
                    </button>
                  </div>
                )}

                {moments.length > 0 && (
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2>Moments &amp; Seasonality</h2>
                      <button onClick={() => discussPlan('moments')} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>💬 Discuss</button>
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
                      <button onClick={() => discussPlan('market-entry strategy')} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>💬 Discuss</button>
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
                      <button onClick={() => discussPlan('funnel strategy')} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>💬 Discuss</button>
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
                      <button onClick={() => discussPlan('narrative & messaging')} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>💬 Discuss</button>
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
                    <button onClick={() => discussPlan('campaign matrix')} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--accent)', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>✨ Discuss</button>
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
                    {loading[17] ? <>🛑 Stop Generating</> : '✨ Re-draft plan from brief'}
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
                    <button className="btn" onClick={autoAssignAll}>✨ Auto-assign by skill</button>
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
      <div className={`copilot-panel ${copilotCollapsed ? 'collapsed' : ''}`}>
        <div className="copilot-header">
          <h3>AI Copilot ({activeTab === 'preplanning' ? 'Campaign Brief Co-author' : activeTab === 'planning' ? 'Campaign Plan Co-author' : activeTab === 'research' ? (STAGES.find(s => s.num === researchTab)?.name || 'Market Research') : (STAGES.find(s => s.num === activeTab)?.name || 'Setup')})</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="copilot-toggle-btn" onClick={() => setCopilotMessages([{ sender: 'assistant', text: 'Conversation reset. Ask me anything!' }])}>
              Reset
            </button>
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
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                {msg.proposals && msg.proposals.map((p, pi) => {
                  const applied = msg._applied && msg._applied[pi];
                  return (
                    <div key={pi} style={{ marginTop: 8, padding: '10px', border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--accent-soft, #eef6f3)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>Proposed → {p.section}</div>
                      <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: 8 }}>{p.content}</div>
                      {applied ? (
                        <span style={{ fontSize: '12px', color: 'var(--green)', fontWeight: 600 }}>✓ Applied to brief</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => {
                              updateBriefField(p.section, p.content);
                              setTimeout(saveBrief, 0);
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

        <div className="copilot-input" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
              '🎙️'
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
          <button className="btn" style={{ padding: '8px 16px', height: '40px' }} onClick={handleCopilotSend} disabled={copilotLoading || !copilotQuery.trim()}>
            Send
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


