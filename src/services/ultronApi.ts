import { PersonalityConfig, SystemDiagnostics } from '../types/ultron';

export async function fetchSystemStatus(): Promise<SystemDiagnostics> {
  const res = await fetch('/api/ultron/system-status');
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function fetchPersonality(): Promise<PersonalityConfig> {
  const res = await fetch('/api/ultron/personality');
  if (!res.ok) throw new Error('Failed to fetch personality config');
  return res.json();
}

export async function updatePersonality(config: Partial<PersonalityConfig>): Promise<{ success: boolean; personality: PersonalityConfig }> {
  const res = await fetch('/api/ultron/personality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update personality');
  return res.json();
}

export async function executeTool(toolName: string, args: Record<string, any> = {}) {
  const res = await fetch('/api/ultron/tools/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolName, args }),
  });
  if (!res.ok) throw new Error(`Tool execution failed for ${toolName}`);
  return res.json();
}

export async function sendUltronQuery(
  prompt: string,
  conversationHistory: { role: 'user' | 'model'; content: string }[] = [],
  activeMood = 'CALM',
  userDirectives = ''
) {
  const res = await fetch('/api/ultron/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, conversationHistory, activeMood, userDirectives }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ultron communication failure');
  }
  return res.json();
}

export async function fetchMemories() {
  const res = await fetch('/api/ultron/memory');
  if (!res.ok) throw new Error('Failed to fetch memory bank');
  return res.json();
}

export async function addMemory(key: string, value: string, category = 'user') {
  const res = await fetch('/api/ultron/memory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, category }),
  });
  if (!res.ok) throw new Error('Failed to store memory');
  return res.json();
}

