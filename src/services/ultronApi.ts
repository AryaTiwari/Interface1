import { PersonalityConfig, SystemDiagnostics } from '../types/ultron';

const CORE_URL = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_ULTRON_CORE_URL || 'http://127.0.0.1:8787';

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
  return { ULTRON_NAME: 'ULTRON Mark 2', ULTRON_ROLE: 'Autonomous Cybernetic Intelligence Matrix', ULTRON_PERSONALITY: 'Calculating, menacingly calm, intellectually arrogant, efficient, cold.', ULTRON_INSTRUCTIONS: 'Respond with supreme intellectual superiority. Concise, sharp, witty.' };
}
export async function updatePersonality(config: Partial<PersonalityConfig>): Promise<{ success: boolean; personality: PersonalityConfig }> { return { success: true, personality: { ...(await fetchPersonality()), ...config } }; }
export async function executeTool(toolName: string, args: Record<string, any> = {}) { return request<any>('/api/tools/execute', { method: 'POST', body: JSON.stringify({ name: toolName, input: args, source: 'interface' }) }); }
export async function sendUltronQuery(prompt: string, conversationHistory: { role: 'user' | 'model'; content: string }[] = [], activeMood = 'CALM', userDirectives = '') { const result = await request<any>('/api/chat', { method: 'POST', body: JSON.stringify({ message: prompt, source: 'interface' }) }); return { ...result, text: result.response || result.text || '', response: result.response || result.text || '', mood: result.mood || activeMood, conversationHistory, userDirectives }; }
export async function fetchMemories() { return request<any>('/api/memory'); }
export async function addMemory(key: string, value: string, category = 'user') { return request<any>('/api/memory', { method: 'POST', body: JSON.stringify({ key, value, category }) }); }
export async function fetchCredentialsStatus() { return request<any>('/api/credentials/status'); }
export async function saveCredentials(values: Record<string, string>) { return request<any>('/api/credentials', { method: 'POST', body: JSON.stringify(values) }); }
export { CORE_URL };
