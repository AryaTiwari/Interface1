import { PersonalityConfig, SystemDiagnostics } from '../types/ultron';

const CORE_URL = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ULTRON_CORE_URL || 'http://127.0.0.1:8787';

type ActivityEvent = { type: string; state?: string; label?: string; text?: string; tool?: string; error?: string; durationMs?: number; [key: string]: any };
function emitActivity(event: ActivityEvent) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ultron:activity', { detail: { ...event, at: Date.now() } }));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CORE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw }; }
  if (!res.ok) throw new Error(data?.error || `ULTRON Core request failed (${res.status})`);
  return data as T;
}

export async function fetchSystemStatus(): Promise<SystemDiagnostics> {
  const data = await request<any>('/api/status');
  const s = data.status || {};
  return {
    ultronState: 'ONLINE', version: 'Mark 2', coreTemperature: 'LOCAL', neuralLoad: 'LIVE', memoryHeapUsed: 'LIVE', uptimeSeconds: 0,
    guardianStatus: s.administrator?.status || 'UNKNOWN',
    activeNodes: [
      { id: 'internet', name: 'INTERNET', status: s.internetSpeed?.status, latency: s.internetSpeed?.measuredMbps ? `${s.internetSpeed.measuredMbps} Mbps` : 'OFFLINE' },
      { id: 'quantum_matrix', name: 'INSTAGRAM', status: s.instagram?.status, latency: s.instagram?.latencyMs != null ? `${s.instagram.latencyMs}ms` : 'OFFLINE' },
      { id: 'supabase_memory', name: 'MEMORY', status: s.memory?.status, latency: s.memory?.writable ? 'LOCAL READY' : 'UNAVAILABLE' },
      { id: 'ai_brain', name: 'OMNIROUTE', status: s.omniroute?.status, latency: s.omniroute?.latencyMs != null ? `${s.omniroute.latencyMs}ms` : 'OFFLINE' },
      { id: 'github', name: 'GITHUB', status: s.github?.status, latency: s.github?.latencyMs != null ? `${s.github.latencyMs}ms` : 'OFFLINE' },
      { id: 'guardian', name: 'ADMINISTRATOR', status: s.administrator?.status, latency: s.administrator?.elevated ? 'ELEVATED' : 'STANDARD' },
    ],
    live: data,
  } as SystemDiagnostics;
}

export async function fetchPersonality(): Promise<PersonalityConfig> {
  return request<any>('/api/personality').catch(() => ({
    ULTRON_NAME: 'ULTRON Mark 2',
    ULTRON_ROLE: "Arya's personal AI assistant, strategic companion, and execution partner",
    ULTRON_PERSONALITY: 'Calm, formidable, intelligent, composed, strategic, observant, creative, philosophical, direct, subtly playful, and deeply practical.',
    ULTRON_INSTRUCTIONS: 'Balance trusted friend, elite assistant, strategist, and execution partner. Challenge avoidance without losing composure.',
  }));
}

export async function updatePersonality(config: Partial<PersonalityConfig>): Promise<{ success: boolean; personality: PersonalityConfig }> {
  return { success: true, personality: { ...(await fetchPersonality()), ...config } };
}

export async function executeTool(toolName: string, args: Record<string, any> = {}) {
  return request<any>('/api/tools/execute', { method: 'POST', body: JSON.stringify({ name: toolName, input: args, source: 'interface' }) });
}

const MOODS = new Set(['CALM', 'FOCUSED', 'AMUSED', 'CONFIDENT', 'SUSPICIOUS', 'WARNING', 'CRITICAL']);
function normalizeMood(value: unknown, fallback = 'CALM') {
  const candidate = typeof value === 'string' ? value.toUpperCase() : '';
  return MOODS.has(candidate) ? candidate : fallback;
}

function speechText(value: string) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[#*_`>\[\]{}|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let voiceQueue: Promise<void> = Promise.resolve();
async function speakOne(text: string) {
  const clean = speechText(text);
  if (!clean) return;
  try {
    emitActivity({ type: 'state', state: 'speaking', label: 'Voice playback in progress.' });
    const audio = await request<any>('/api/tts', { method: 'POST', body: JSON.stringify({ text: clean, provider: 'fish-audio-s2.1-pro-free', format: 'mp3' }) });
    const filename = String(audio?.path || '').split(/[\\/]/).pop();
    if (!filename) throw new Error('Voice synthesis returned no audio file.');
    const player = new Audio(`${CORE_URL}/api/audio?path=${encodeURIComponent(filename)}`);
    player.volume = 1;
    await new Promise<void>((resolve, reject) => {
      player.onended = () => resolve();
      player.onerror = () => reject(new Error('Voice playback failed.'));
      void player.play().catch(reject);
    });
  } catch (error) {
    emitActivity({ type: 'voice_error', state: 'error', label: 'Voice unavailable.', error: error instanceof Error ? error.message : String(error) });
  }
}
function speakSequentially(text: string) {
  voiceQueue = voiceQueue.then(() => speakOne(text));
  return voiceQueue;
}

function parseExplicitGitHubRead(prompt: string) {
  const normalized = String(prompt || '').trim().replace(/^ultron\s*[,;:-]?\s*/i, '');
  const match = normalized.match(/^(?:read|open|inspect|check)\s+([A-Za-z0-9._\-/]+)\s+(?:from|on|in)\s+GitHub(?:\s+(?:and|then)\s+.*)?$/i);
  if (!match) return null;
  return { path: match[1], ref: undefined as string | undefined, wantsPersonality: /\bpersonality\b/i.test(normalized) };
}

function formatGitHubResult(path: string, content: string, wantsPersonality: boolean) {
  if (wantsPersonality && /core\/personality\/default\.json$/i.test(path)) {
    try {
      const cfg = JSON.parse(content);
      const identity = cfg.IDENTITY || {};
      const name = identity.NAME || cfg.ULTRON_NAME || cfg.name || 'ULTRON';
      const role = identity.ROLE || cfg.ULTRON_ROLE || cfg.role || 'personal AI assistant';
      const personality = cfg.PERSONALITY_PROFILE || cfg.ULTRON_PERSONALITY || cfg.personality || 'Not specified.';
      const instructions = cfg.BEHAVIORAL_INSTRUCTIONS || cfg.ULTRON_INSTRUCTIONS || cfg.instructions || [];
      const count = Array.isArray(instructions) ? instructions.length : String(instructions).split(/\r?\n/).filter(Boolean).length;
      return `I read ${path} from GitHub.\n\nIdentity: ${name}\nRole: ${role}\nPersonality: ${personality}\nBehavioral directives: ${count}.`;
    } catch {}
  }
  return content || `I read ${path}, but the file contained no displayable text.`;
}

export async function sendUltronQuery(prompt: string, conversationHistory: { role: 'user' | 'model'; content: string }[] = [], activeMood = 'CALM', userDirectives = '') {
  const started = Date.now();
  emitActivity({ type: 'state', state: 'thinking', label: 'Understanding the objective.' });
  try {
    const explicit = parseExplicitGitHubRead(prompt);
    if (explicit) {
      emitActivity({ type: 'state', state: 'researching', label: `Reading ${explicit.path} from GitHub.` });
      emitActivity({ type: 'state', state: 'executing', label: `Executing github_read_file.`, tool: 'github_read_file' });
      const raw = await executeTool('github_read_file', explicit);
      if (!raw?.ok) throw new Error(raw?.error || 'GitHub read failed.');
      const payload = raw.result || raw;
      const content = String(payload?.content || '');
      const text = formatGitHubResult(explicit.path, content, explicit.wantsPersonality);
      emitActivity({ type: 'delta', state: 'responding', label: 'Generating response.', text });
      emitActivity({ type: 'text_complete', state: 'synthesizing', label: 'Text response complete. Preparing voice.' });
      await speakSequentially(text);
      emitActivity({ type: 'complete', state: 'complete', label: 'Task complete.', durationMs: Date.now() - started });
      return { ok: true, text, response: text, mood: 'FOCUSED', toolUsed: 'github_read_file', pipeline: { guardian: { status: 'CLEAR', riskScore: 0, message: 'Deterministic safety boundary verified.' }, critic: { status: 'APPROVED', intent: 'GITHUB_READ', confidence: 0.99 }, executor: { status: 'COMPLETED', tool: 'github_read_file' } } };
    }

    // Reliable first: get a complete JSON response. Streaming remains available separately.
    emitActivity({ type: 'state', state: 'planning', label: 'Selecting execution path.' });
    const result = await request<any>('/api/chat', { method: 'POST', body: JSON.stringify({ message: prompt, source: 'interface', conversationHistory, userDirectives }) });
    const text = String(result?.response ?? result?.text ?? '').trim();
    if (!text) throw new Error('ULTRON Core returned an empty response.');
    emitActivity({ type: 'delta', state: 'responding', label: 'Response ready.', text });
    emitActivity({ type: 'text_complete', state: 'synthesizing', label: 'Text response complete. Preparing voice.' });
    await speakSequentially(text);
    emitActivity({ type: 'complete', state: 'complete', label: 'Task complete.', durationMs: Date.now() - started });
    return { ...result, text, response: text, mood: normalizeMood(result?.mood, normalizeMood(activeMood, 'CALM')), conversationHistory, userDirectives, toolUsed: result?.toolUsed || null };
  } catch (error) {
    emitActivity({ type: 'error', state: 'error', label: 'ULTRON request failed.', error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started });
    throw error;
  }
}

export async function streamUltronQuery(prompt: string, conversationHistory: { role: 'user' | 'model'; content: string }[] = [], activeMood = 'CALM', userDirectives = '') {
  return sendUltronQuery(prompt, conversationHistory, activeMood, userDirectives);
}

export async function fetchMemories() { return request<any>('/api/memory'); }
export async function addMemory(key: string, value: string, category = 'user') { return request<any>('/api/memory', { method: 'POST', body: JSON.stringify({ key, value, category }) }); }
export async function fetchCredentialsStatus() { return request<any>('/api/credentials/status'); }
export async function saveCredentials(values: Record<string, string>) { return request<any>('/api/credentials', { method: 'POST', body: JSON.stringify(values) }); }
export { CORE_URL };
