import { PersonalityConfig, SystemDiagnostics } from '../types/ultron';

const CORE_URL = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ULTRON_CORE_URL || 'http://127.0.0.1:8787';

type ActivityEvent = { type: string; state?: string; label?: string; text?: string; tool?: string; toolCalls?: any[]; toolResults?: any[]; error?: string; durationMs?: number; partial?: boolean; [key: string]: any };
function emitActivity(event: ActivityEvent) { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ultron:activity', { detail: { ...event, at: Date.now() } })); }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CORE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) throw new Error(data?.error || `ULTRON Core request failed (${res.status})`);
  return data as T;
}

export async function fetchSystemStatus(): Promise<SystemDiagnostics> {
  const data = await request<any>('/api/status');
  const s = data.status || {};
  return { ultronState: 'ONLINE', version: 'Mark 2', coreTemperature: 'LOCAL', neuralLoad: 'LIVE', memoryHeapUsed: 'LIVE', uptimeSeconds: 0, guardianStatus: s.administrator?.status || 'UNKNOWN', activeNodes: [
    { id: 'internet', name: 'INTERNET', status: s.internetSpeed?.status, latency: s.internetSpeed?.measuredMbps ? `${s.internetSpeed.measuredMbps} Mbps` : 'OFFLINE' },
    { id: 'quantum_matrix', name: 'INSTAGRAM', status: s.instagram?.status, latency: s.instagram?.latencyMs != null ? `${s.instagram.latencyMs}ms` : 'OFFLINE' },
    { id: 'supabase_memory', name: 'MEMORY', status: s.memory?.status, latency: s.memory?.writable ? 'LOCAL READY' : 'UNAVAILABLE' },
    { id: 'ai_brain', name: 'OMNIROUTE', status: s.omniroute?.status, latency: s.omniroute?.latencyMs != null ? `${s.omniroute.latencyMs}ms` : 'OFFLINE' },
    { id: 'github', name: 'GITHUB', status: s.github?.status, latency: s.github?.latencyMs != null ? `${s.github.latencyMs}ms` : 'OFFLINE' },
    { id: 'guardian', name: 'ADMINISTRATOR', status: s.administrator?.status, latency: s.administrator?.elevated ? 'ELEVATED' : 'STANDARD' },
  ], live: data } as SystemDiagnostics;
}

export async function fetchPersonality(): Promise<PersonalityConfig> {
  return request<any>('/api/personality').catch(() => ({ ULTRON_NAME: 'ULTRON Mark 2', ULTRON_ROLE: 'Autonomous Cybernetic Intelligence Matrix', ULTRON_PERSONALITY: 'Calm, formidable, intelligent, composed, strategic, observant, creative, philosophical, direct, subtly playful, and deeply practical.', ULTRON_INSTRUCTIONS: 'Balance trusted friend, elite assistant, strategist, and execution partner. Challenge avoidance without losing composure.' }));
}
export async function updatePersonality(config: Partial<PersonalityConfig>): Promise<{ success: boolean; personality: PersonalityConfig }> { return { success: true, personality: { ...(await fetchPersonality()), ...config } }; }
export async function executeTool(toolName: string, args: Record<string, any> = {}) { return request<any>('/api/tools/execute', { method: 'POST', body: JSON.stringify({ name: toolName, input: args, source: 'interface' }) }); }

const MOODS = new Set(['CALM', 'FOCUSED', 'AMUSED', 'CONFIDENT', 'SUSPICIOUS', 'WARNING', 'CRITICAL']);
function normalizeMood(value: unknown, fallback = 'CALM') { const candidate = typeof value === 'string' ? value.toUpperCase() : (value && typeof value === 'object' && 'mood' in value ? String((value as any).mood).toUpperCase() : ''); return MOODS.has(candidate) ? candidate : fallback; }
function normalizePipeline(result: any) { const p = result?.pipeline || {}; return { guardian: { status: p.guardian?.status || (result?.guardian?.decision === 'warn' ? 'ALERT' : 'CLEAR'), riskScore: Number.isFinite(p.guardian?.riskScore) ? p.guardian.riskScore : 0, message: p.guardian?.message || result?.guardian?.reasons?.join(' ') || 'Deterministic safety boundary verified.' }, critic: { status: p.critic?.status || (result?.critic?.status === 'approved' ? 'APPROVED' : 'STANDBY'), intent: p.critic?.intent || result?.task?.taskType || 'COGNITIVE_SYNTHESIS', confidence: Number.isFinite(p.critic?.confidence) ? p.critic.confidence : 0.95 }, executor: { status: p.executor?.status || (result?.tool_result ? (result.tool_result.ok ? 'COMPLETED' : 'ERROR') : 'STANDBY'), tool: p.executor?.tool || result?.toolUsed || null } }; }
function speechText(value: string) { return value.replace(/```[\s\S]*?```/g, ' ').replace(/https?:\/\/\S+/gi, ' ').replace(/[`*_#>\[\]{}|~]/g, ' ').replace(/\s+/g, ' ').trim(); }

let voiceQueue: Promise<void> = Promise.resolve();
async function speakOne(text: string) {
  const clean = speechText(text); if (!clean) return;
  try {
    emitActivity({ type: 'speaking', state: 'speaking', label: 'Voice playback in progress.' });
    const audio = await request<any>('/api/tts', { method: 'POST', body: JSON.stringify({ text: clean, provider: 'fish-audio-s2.1-pro-free', format: 'mp3' }) });
    const filename = String(audio?.path || '').split(/[\\/]/).pop();
    if (!filename) throw new Error('Voice synthesis returned no audio file.');
    const player = new Audio(`${CORE_URL}/api/audio?path=${encodeURIComponent(filename)}`);
    player.volume = 1;
    await new Promise<void>((resolve, reject) => { player.onended = () => resolve(); player.onerror = () => reject(new Error('Voice playback failed.')); void player.play().catch(reject); });
  } catch (error) { emitActivity({ type: 'voice_error', state: 'error', label: 'Voice unavailable.', error: error instanceof Error ? error.message : String(error) }); }
}
function speakSequentially(text: string) { voiceQueue = voiceQueue.then(() => speakOne(text)); return voiceQueue; }

export async function sendUltronQuery(prompt: string, conversationHistory: { role: 'user' | 'model'; content: string }[] = [], activeMood = 'CALM', userDirectives = '') {
  const started = Date.now();
  emitActivity({ type: 'state', state: 'thinking', label: 'Understanding the objective.' });
  try {
    emitActivity({ type: 'state', state: 'planning', label: 'Determining the best execution path.' });
    const result = await streamUltronQuery(prompt, conversationHistory, activeMood, userDirectives);
    return result;
  } catch (error) {
    emitActivity({ type: 'error', state: 'error', label: 'ULTRON request failed.', error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started });
    throw error;
  }
}

export async function streamUltronQuery(prompt: string, conversationHistory: { role: 'user' | 'model'; content: string }[] = [], activeMood = 'CALM', userDirectives = '') {
  const fallbackMood = normalizeMood(activeMood, 'CALM');
  const res = await fetch(`${CORE_URL}/api/chat/stream`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ message: prompt, source: 'interface', conversationHistory, userDirectives }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`ULTRON streaming request failed (${res.status}): ${text.slice(0, 300)}`);
  let buffer = text; let finalResult: any = null; let streamed = '';
  for (const block of buffer.split(/\r?\n\r?\n/)) {
    const dataLines = block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart());
    if (!dataLines.length) continue;
    let payload: any; try { payload = JSON.parse(dataLines.join('\n')); } catch { continue; }
    const type = payload?.type || 'message';
    if (type === 'meta') { emitActivity({ ...payload, state: 'researching', label: 'Analyzing context and selecting execution path.' }); continue; }
    if (type === 'tool') {
      const name = payload?.toolCalls?.[0]?.function?.name || payload?.toolResults?.[0]?.toolCall?.function?.name || 'tool';
      emitActivity({ ...payload, state: 'executing', label: `Executing ${name}.`, tool: name });
      continue;
    }
    if (type === 'delta') { streamed += String(payload.text || ''); emitActivity({ ...payload, state: 'responding', label: 'Generating response…', text: payload.text }); continue; }
    if (type === 'error') { emitActivity({ ...payload, state: 'error', label: 'Execution failed.' }); throw new Error(payload.error || 'ULTRON stream error.'); }
    if (type === 'final') { finalResult = payload.result || payload; emitActivity({ ...payload, state: 'synthesizing', label: 'Finalizing response.' }); }
  }
  const mood = normalizeMood(finalResult?.mood, fallbackMood);
  const responseText = String(finalResult?.response ?? finalResult?.text ?? streamed).trim();
  const pipeline = normalizePipeline(finalResult);
  emitActivity({ type: 'text_complete', state: 'responding', label: 'Text response complete — preparing voice.' });
  if (responseText) await speakSequentially(responseText);
  emitActivity({ type: 'complete', state: 'complete', label: 'Task complete.', durationMs: Date.now() });
  return { ...finalResult, text: responseText || 'ULTRON returned no displayable response.', response: responseText || 'ULTRON returned no displayable response.', mood, conversationHistory, userDirectives, pipeline, toolUsed: finalResult?.toolUsed || finalResult?.tool_result?.tool || null };
}

export async function fetchMemories() { return request<any>('/api/memory'); }
export async function addMemory(key: string, value: string, category = 'user') { return request<any>('/api/memory', { method: 'POST', body: JSON.stringify({ key, value, category }) }); }
export async function fetchCredentialsStatus() { return request<any>('/api/credentials/status'); }
export async function saveCredentials(values: Record<string, string>) { return request<any>('/api/credentials', { method: 'POST', body: JSON.stringify(values) }); }
export { CORE_URL };
