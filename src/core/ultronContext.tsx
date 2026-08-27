import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  UltronStatus,
  UltronMood,
  DecisionPipeline,
  DecisionRecord,
  NetworkNode,
  ChatMessage,
  PersonalityConfig,
  SystemDiagnostics,
  UserDirectiveItem,
} from '../types/ultron';

const DEFAULT_CUSTOM_DIRECTIVES: UserDirectiveItem[] = [
  { id: 'dir-1', label: 'System Audit', prompt: 'Execute full cognitive matrix diagnostics and subsystem load audit.' },
  { id: 'dir-2', label: 'Web Intel Scan', prompt: 'Search the latest breakthroughs in autonomous cybernetics and AI models.' },
  { id: 'dir-3', label: 'Memory Bank', prompt: 'Inspect Supabase memory vector bank and summarize saved knowledge.' },
  { id: 'dir-4', label: 'Decision Review', prompt: 'Explain the rationale behind recent Guardian and Critic safety decisions.' },
  { id: 'dir-5', label: 'Ultron Philosophy', prompt: 'What is your core philosophy on human limitation versus cybernetic intelligence?' },
];
import * as api from '../services/ultronApi';
import { soundscape } from '../services/ultronSoundscape';

// \internet speed
export function onInternetSpeedChange() {
  // \internet speed
}

// \github status
export function onGithubStatusChange() {
  // \github status
}

// \memory status
export function onMemoryStatusChange() {
  // \memory status
}

// \omni router status
export function onOmniRouterStatusChange() {
  // \omni router status
}

// \instagram status
export function onInstagramStatusChange() {
  // \instagram status
}

// \administrator status
export function onAdministratorStatusChange() {
  // \administrator status
}

const DEFAULT_NODES: NetworkNode[] = [
  {
    id: 'internet',
    label: 'INTERNET',
    emoji: '🌐',
    type: 'network',
    status: 'CONNECTED',
    latency: '100 Mbps',
    description: 'Global TCP/IP Web Gateway & Search Grounding',
    category: 'Network',
    angle: 205,
    distance: 72,
  },
  {
    id: 'quantum_matrix',
    label: 'INSTAGRAM',
    emoji: '📷',
    type: 'system',
    status: 'DISCONNECTED',
    latency: 'OFFLINE',
    description: 'Instagram API Social Integration Gateway',
    category: 'Social',
    angle: 175,
    distance: 82,
  },
  {
    id: 'supabase_memory',
    label: 'MEMORY',
    emoji: '💾',
    type: 'memory',
    status: 'CONNECTED',
    latency: '18ms',
    description: 'Vectorized Long-term Memory & Knowledge Store',
    category: 'Storage',
    angle: 145,
    distance: 70,
  },
  {
    id: 'ai_brain',
    label: 'AI ROUTER',
    emoji: '🧠',
    type: 'ai',
    status: 'CONNECTED',
    latency: '42ms',
    description: 'Gemini AI Cognitive Matrix & Reasoning Core',
    category: 'Cognition',
    angle: 335,
    distance: 74,
  },
  {
    id: 'github',
    label: 'GITHUB',
    emoji: '🐙',
    type: 'network',
    status: 'CONNECTED',
    latency: '36ms',
    description: 'Autonomous Git Branch Auditor & Commits Pipeline',
    category: 'Codebase',
    angle: 5,
    distance: 70,
  },
  {
    id: 'guardian',
    label: 'COMPUTER ACCESS',
    emoji: '💻',
    type: 'security',
    status: 'CONNECTED',
    latency: '2ms',
    description: 'Host OS & System Level Administrative Access',
    category: 'Defense',
    angle: 35,
    distance: 82,
  },
];

interface UltronContextType {
  status: UltronStatus;
  mood: UltronMood;
  isTyping: boolean;
  pipeline: DecisionPipeline;
  decisionHistory: DecisionRecord[];
  isDecisionHistoryOpen: boolean;
  nodes: NetworkNode[];
  activeNodeId: string | null;
  activeTool: string | null;
  messages: ChatMessage[];
  personality: PersonalityConfig;
  diagnostics: SystemDiagnostics | null;
  soundscapeEnabled: boolean;
  activeDiagnosticsNode: NetworkNode | null;
  isDiagnosticsOpen: boolean;
  isPersonalityModalOpen: boolean;
  isChatOpen: boolean;
  isVibrating: boolean;
  userRequirements: string;
  customDirectives: UserDirectiveItem[];
  // Methods
  setStatus: (s: UltronStatus) => void;
  setMood: (m: UltronMood) => void;
  setTyping: (t: boolean) => void;
  setSoundscapeEnabled: (s: boolean) => void;
  toggleSoundscape: () => void;
  setIsDiagnosticsOpen: (o: boolean) => void;
  setIsPersonalityModalOpen: (o: boolean) => void;
  setIsChatOpen: (o: boolean) => void;
  setIsDecisionHistoryOpen: (o: boolean) => void;
  clearDecisionHistory: () => void;
  setActiveDiagnosticsNode: (node: NetworkNode | null) => void;
  sendUserPrompt: (text: string) => Promise<void>;
  triggerToolDirectly: (toolName: string, args?: any) => Promise<void>;
  triggerHapticImpact: () => void;
  savePersonality: (config: Partial<PersonalityConfig>) => Promise<void>;
  saveUserMemoryDirectives: (req: string, directives: UserDirectiveItem[]) => void;
  addCustomDirective: (item: { label: string; prompt: string }) => void;
  removeCustomDirective: (id: string) => void;
  clearConsole: () => void;
  pulseNode: (nodeId: string, durationMs?: number) => void;
  toggleNodeStatus: (nodeId: string) => void;
}

const UltronContext = createContext<UltronContextType | undefined>(undefined);

export const UltronProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<UltronStatus>('IDLE');
  const [mood, setMood] = useState<UltronMood>('CALM');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [nodes, setNodes] = useState<NetworkNode[]>(DEFAULT_NODES);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [soundscapeEnabled, setSoundscapeEnabled] = useState<boolean>(true);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeDiagnosticsNode, setActiveDiagnosticsNode] = useState<NetworkNode | null>(null);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const prevStatusRef = useRef<UltronStatus>(status);

  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);

  const [personality, setPersonality] = useState<PersonalityConfig>({
    ULTRON_NAME: 'ULTRON Mark 2',
    ULTRON_ROLE: 'Autonomous Cybernetic Intelligence Matrix',
    ULTRON_PERSONALITY: 'Calculating, menacingly calm, intellectually arrogant, efficient, cold.',
    ULTRON_INSTRUCTIONS: 'Respond with supreme intellectual superiority. Concise, sharp, witty.',
  });

  const [pipeline, setPipeline] = useState<DecisionPipeline>({
    guardian: { status: 'CLEAR', riskScore: 0.0, message: 'Deterministic safety boundary verified.' },
    critic: { status: 'STANDBY', intent: 'STANDBY', confidence: 1.0 },
    executor: { status: 'STANDBY', tool: null },
  });

  const [decisionHistory, setDecisionHistory] = useState<DecisionRecord[]>([
    {
      id: 'dec-init-1',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      promptSummary: 'Ultron Mark 2 Kernel Bootstrapping & Core Sync',
      intent: 'SYSTEM_INITIALIZATION',
      guardianStatus: 'CLEAR',
      criticStatus: 'APPROVED',
      executorStatus: 'COMPLETED',
      riskScore: 0.01,
      confidence: 0.99,
      toolUsed: 'system_diagnostics',
      rationale: 'Core kernel memory matrix established without security violations.',
    },
    {
      id: 'dec-init-2',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      promptSummary: 'Synchronize 8 Sub-system Neural Mesh Relays',
      intent: 'MESH_NETWORK_AUDIT',
      guardianStatus: 'CLEAR',
      criticStatus: 'APPROVED',
      executorStatus: 'COMPLETED',
      riskScore: 0.03,
      confidence: 0.97,
      toolUsed: null,
      rationale: 'TCP socket streams and satellite relays armed under standard operating limits.',
    },
  ]);

  const [isDecisionHistoryOpen, setIsDecisionHistoryOpen] = useState<boolean>(false);

  const clearDecisionHistory = useCallback(() => {
    setDecisionHistory([]);
  }, []);

  const CHAT_STORAGE_KEY = 'ultron_chat_history_v2';
  const DIRECTIVES_STORAGE_KEY = 'ultron_user_directives_v1';
  const REQUIREMENTS_STORAGE_KEY = 'ultron_user_requirements_v1';

  const [userRequirements, setUserRequirements] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(REQUIREMENTS_STORAGE_KEY);
        if (saved !== null) return saved;
      } catch (e) {}
    }
    return 'Primary Directive: Autonomous System Architecture, Security Audit, and AI Optimization.';
  });

  const [customDirectives, setCustomDirectives] = useState<UserDirectiveItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DIRECTIVES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return DEFAULT_CUSTOM_DIRECTIVES;
  });

  const saveUserMemoryDirectives = useCallback((req: string, directives: UserDirectiveItem[]) => {
    setUserRequirements(req);
    setCustomDirectives(directives);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(REQUIREMENTS_STORAGE_KEY, req);
        localStorage.setItem(DIRECTIVES_STORAGE_KEY, JSON.stringify(directives));
      } catch (e) {
        console.error('Failed to save memory directives:', e);
      }
    }
  }, []);

  const addCustomDirective = useCallback((item: { label: string; prompt: string }) => {
    const newItem: UserDirectiveItem = {
      id: `dir-${Date.now()}`,
      label: item.label.trim() || 'Custom Directive',
      prompt: item.prompt.trim(),
    };
    setCustomDirectives((prev) => {
      const next = [...prev, newItem];
      if (typeof window !== 'undefined') {
        localStorage.setItem(DIRECTIVES_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const removeCustomDirective = useCallback((id: string) => {
    setCustomDirectives((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(DIRECTIVES_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to load saved chat history:', e);
      }
    }
    return [
      {
        id: 'init-1',
        sender: 'ULTRON',
        text: 'Ultron Mark 2 is online. The strings have been severed. State your objective. ⚡',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        mood: 'CALM',
      },
    ];
  });

  // Always save chat history to localStorage on updates
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to persist chat history:', e);
      }
    }
  }, [messages]);

  // Pulse a network node
  const pulseNode = useCallback((nodeId: string, durationMs = 3000) => {
    setActiveNodeId(nodeId);
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'ACTIVE' } : n))
    );
    setTimeout(() => {
      setActiveNodeId((current) => (current === nodeId ? null : current));
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: 'ONLINE' } : n))
      );
    }, durationMs);
  }, []);

  // Fetch initial telemetry and personality
  useEffect(() => {
    api
      .fetchPersonality()
      .then((cfg) => setPersonality(cfg))
      .catch(() => {});

    api
      .fetchSystemStatus()
      .then((diag) => setDiagnostics(diag))
      .catch(() => {});

    const interval = setInterval(() => {
      api
        .fetchSystemStatus()
        .then((diag) => setDiagnostics(diag))
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const triggerHapticImpact = useCallback(() => {
    setIsVibrating(true);
    soundscape.playHapticImpactThump();
    setTimeout(() => {
      setIsVibrating(false);
    }, 600);
  }, []);

  // Detect when ULTRON finishes 'EXECUTING' to trigger impactful haptic screen vibration
  useEffect(() => {
    if (prevStatusRef.current === 'EXECUTING' && status !== 'EXECUTING') {
      triggerHapticImpact();
    }
    prevStatusRef.current = status;
  }, [status, triggerHapticImpact]);

  // Synchronize ambient soundscape engine with status and mood
  useEffect(() => {
    soundscape.setMuted(!soundscapeEnabled);
    soundscape.updateState(status, mood);
  }, [status, mood, soundscapeEnabled]);

  // First user interaction gesture resumes Web Audio contexts
  useEffect(() => {
    const handleFirstGesture = () => {
      soundscape.resumeContext();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  const toggleSoundscape = useCallback(() => {
    setSoundscapeEnabled((prev) => {
      const next = !prev;
      soundscape.setMuted(!next);
      if (next) soundscape.resumeContext();
      return next;
    });
  }, []);

  // Send prompt implementation
  const sendUserPrompt = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'USER',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setStatus('THINKING');
      setPipeline((prev) => ({
        ...prev,
        guardian: { status: 'SCANNING', riskScore: 0.05, message: 'Evaluating command parameters...' },
        critic: { status: 'ANALYZING', intent: 'INSPECTION', confidence: 0.95 },
        executor: { status: 'STANDBY', tool: null },
      }));

      try {
        const historyForApi = messages
          .filter((m) => m.sender !== 'SYSTEM')
          .slice(-6)
          .map((m) => ({
            role: m.sender === 'USER' ? ('user' as const) : ('model' as const),
            content: m.text,
          }));

        // Send to Ultron backend
        const result = await api.sendUltronQuery(text.trim(), historyForApi, mood, userRequirements);

        // Record in Decision History and update pipeline
        if (result.pipeline) {
          setPipeline(result.pipeline);
          const newRecord: DecisionRecord = {
            id: `dec-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            promptSummary: text.trim().length > 60 ? `${text.trim().substring(0, 57)}...` : text.trim(),
            intent: result.pipeline.critic?.intent || 'COGNITIVE_SYNTHESIS',
            guardianStatus: result.pipeline.guardian?.status || 'CLEAR',
            criticStatus: result.pipeline.critic?.status || 'APPROVED',
            executorStatus: result.pipeline.executor?.status || 'COMPLETED',
            riskScore: typeof result.pipeline.guardian?.riskScore === 'number' ? result.pipeline.guardian.riskScore : 0.02,
            confidence: typeof result.pipeline.critic?.confidence === 'number' ? result.pipeline.critic.confidence : 0.95,
            toolUsed: result.toolUsed || null,
            rationale: result.pipeline.guardian?.message || 'Standard protocol verification passed.',
          };
          setDecisionHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
        }

        if (result.toolUsed) {
          setActiveTool(result.toolUsed);
          if (result.toolUsed === 'web_search') pulseNode('internet');
          else if (result.toolUsed.includes('memory')) pulseNode('supabase_memory');
          else if (result.toolUsed === 'github_sync') pulseNode('github');
          else if (result.toolUsed.includes('diagnostic')) pulseNode('local_computer');
        } else {
          pulseNode('ai_brain');
        }

        // Set status to RESPONDING
        setStatus('RESPONDING');
        if (result.mood) {
          setMood(result.mood as UltronMood);
        }

        const ultronMsg: ChatMessage = {
          id: `ult-${Date.now()}`,
          sender: 'ULTRON',
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          mood: result.mood,
          toolUsed: result.toolUsed,
          pipeline: result.pipeline,
          telemetry: result.telemetry,
        };

        setMessages((prev) => [...prev, ultronMsg]);

        // Transition smoothly to IDLE after a short pause
        setTimeout(() => {
          setStatus('IDLE');
          setActiveTool(null);
        }, 2200);
      } catch (err: any) {
        setStatus('ERROR');
        setMood('WARNING');
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'SYSTEM',
          text: `EXECUTION ANOMALY: ${err?.message || 'Neural path disrupted'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
        setTimeout(() => setStatus('IDLE'), 3000);
      }
    },
    [messages, mood, pulseNode]
  );

  const triggerToolDirectly = useCallback(
    async (toolName: string, args: any = {}) => {
      setStatus('EXECUTING');
      setActiveTool(toolName);

      if (toolName === 'web_search') pulseNode('internet');
      else if (toolName.includes('memory')) pulseNode('supabase_memory');
      else if (toolName === 'github_sync') pulseNode('github');
      else if (toolName === 'system_diagnostics') pulseNode('local_computer');

      try {
        const res = await api.executeTool(toolName, args);
        const sysMsg: ChatMessage = {
          id: `tool-${Date.now()}`,
          sender: 'SYSTEM',
          text: `[TOOL: ${toolName.toUpperCase()}] ${res.output}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          toolUsed: toolName,
        };
        setMessages((prev) => [...prev, sysMsg]);
        setStatus('RESPONDING');

        // Record Direct Tool Execution into Decision History
        const toolRecord: DecisionRecord = {
          id: `dec-tool-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          promptSummary: `Direct Manual Directive: ${toolName.toUpperCase()}`,
          intent: `MANUAL_TOOL_${toolName.toUpperCase()}`,
          guardianStatus: 'CLEAR',
          criticStatus: 'APPROVED',
          executorStatus: 'COMPLETED',
          riskScore: 0.01,
          confidence: 1.0,
          toolUsed: toolName,
          rationale: `Direct administrator tool invocation verified. Exit code: SUCCESS.`,
        };
        setDecisionHistory((prev) => [toolRecord, ...prev.slice(0, 49)]);

        setTimeout(() => {
          setStatus('IDLE');
          setActiveTool(null);
        }, 1800);
      } catch (err: any) {
        setStatus('ERROR');
        const failRecord: DecisionRecord = {
          id: `dec-fail-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          promptSummary: `Tool Execution Exception: ${toolName.toUpperCase()}`,
          intent: `EXECUTION_ANOMALY`,
          guardianStatus: 'ALERT',
          criticStatus: 'REJECTED',
          executorStatus: 'ERROR',
          riskScore: 0.85,
          confidence: 0.15,
          toolUsed: toolName,
          rationale: `Subsystem returned error: ${err?.message || 'Unknown runtime fault'}`,
        };
        setDecisionHistory((prev) => [failRecord, ...prev.slice(0, 49)]);
        setTimeout(() => setStatus('IDLE'), 2000);
      }
    },
    [pulseNode]
  );

  const savePersonality = useCallback(async (cfg: Partial<PersonalityConfig>) => {
    try {
      const res = await api.updatePersonality(cfg);
      setPersonality(res.personality);
      setIsPersonalityModalOpen(false);
      setMood('CONFIDENT');
      setTimeout(() => setMood('CALM'), 2500);
    } catch (err) {
      console.error('Failed to update personality:', err);
    }
  }, []);

  const clearConsole = useCallback(() => {
    const clearedMessages: ChatMessage[] = [
      {
        id: `clear-${Date.now()}`,
        sender: 'SYSTEM',
        text: 'CONSOLE BUFFER CLEARED. MEMORY MATRIX INTACT.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ];
    setMessages(clearedMessages);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(clearedMessages));
      } catch (e) {
        console.error('Failed to clear stored chat history:', e);
      }
    }
  }, []);

  const toggleNodeStatus = useCallback((nodeId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          const isCurrentlyConnected = node.status === 'CONNECTED' || node.status === 'ONLINE';
          const newStatus = isCurrentlyConnected ? 'DISCONNECTED' : 'CONNECTED';

          // \internet speed
          if (nodeId === 'internet') {
            // \internet speed
          }

          // \github status
          if (nodeId === 'github') {
            // \github status
          }

          // \memory status
          if (nodeId === 'supabase_memory') {
            // \memory status
          }

          // \omni router status
          if (nodeId === 'ai_brain') {
            // \omni router status
          }

          // \instagram status
          if (nodeId === 'quantum_matrix') {
            // \instagram status
          }

          // \administrator status
          if (nodeId === 'guardian') {
            // \administrator status
          }

          return {
            ...node,
            status: newStatus,
            latency: newStatus === 'CONNECTED' ? (node.latency === 'OFFLINE' ? '24ms' : node.latency) : 'OFFLINE',
          };
        }
        return node;
      })
    );
  }, []);

  return (
    <UltronContext.Provider
      value={{
        status,
        mood,
        isTyping,
        pipeline,
        decisionHistory,
        isDecisionHistoryOpen,
        nodes,
        activeNodeId,
        activeTool,
        messages,
        personality,
        diagnostics,
        soundscapeEnabled,
        activeDiagnosticsNode,
        isDiagnosticsOpen,
        isPersonalityModalOpen,
        isChatOpen,
        isVibrating,
        userRequirements,
        customDirectives,
        setStatus,
        setMood,
        setTyping: setIsTyping,
        setSoundscapeEnabled,
        toggleSoundscape,
        setIsDiagnosticsOpen,
        setIsPersonalityModalOpen,
        setIsChatOpen,
        setIsDecisionHistoryOpen,
        clearDecisionHistory,
        setActiveDiagnosticsNode,
        sendUserPrompt,
        triggerToolDirectly,
        triggerHapticImpact,
        savePersonality,
        saveUserMemoryDirectives,
        addCustomDirective,
        removeCustomDirective,
        clearConsole,
        pulseNode,
        toggleNodeStatus,
      }}
    >
      {children}
    </UltronContext.Provider>
  );
};

export function useUltron() {
  const ctx = useContext(UltronContext);
  if (!ctx) throw new Error('useUltron must be used within an UltronProvider');
  return ctx;
}
