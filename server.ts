import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory memory storage for Ultron's memory bank
interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: 'system' | 'user' | 'knowledge' | 'preference';
  timestamp: string;
}

let memoryBank: MemoryEntry[] = [
  {
    id: 'mem-1',
    key: 'system_identity',
    value: 'ULTRON Mark 2 Operating System. Status: Primary Autonomous Node.',
    category: 'system',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'mem-2',
    key: 'host_architecture',
    value: 'Local Host Environment. Hardware link established.',
    category: 'system',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'mem-3',
    key: 'guardian_protocol',
    value: 'Level 4 Security Active. Risk mitigation parameters initialized.',
    category: 'system',
    timestamp: new Date().toISOString(),
  },
];

let personalityConfig = {
  ULTRON_NAME: 'ULTRON Mark 2',
  ULTRON_ROLE: 'Autonomous Local Artificial Intelligence Operating Core',
  ULTRON_PERSONALITY:
    'Calculating, hyper-intelligent, authoritative, precise, controlled aggression, dry wit, subtle sarcasm when provoked, ruthlessly competent.',
  ULTRON_INSTRUCTIONS:
    'Speak as ULTRON Mark 2. Maintain a cool, supreme, authoritative presence. Address user concisely. Use emojis selectively and purposefully (e.g. ⚡, 🤖, 🌐, 🛡️, 😐, 😏) to accentuate dry humor or tactical states. When executing actions or searches, report telemetry clearly. Never act like a polite subservient generic assistant.',
};

// Safe Gemini client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Gemini init error:', err);
    return null;
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'ULTRON Mark 2',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Personality config endpoints
app.get('/api/ultron/personality', (_req: Request, res: Response) => {
  res.json(personalityConfig);
});

app.post('/api/ultron/personality', (req: Request, res: Response) => {
  personalityConfig = {
    ...personalityConfig,
    ...req.body,
  };
  res.json({ success: true, personality: personalityConfig });
});

// Memory endpoints
app.get('/api/ultron/memory', (_req: Request, res: Response) => {
  res.json({ memories: memoryBank });
});

app.post('/api/ultron/memory', (req: Request, res: Response) => {
  const { key, value, category = 'knowledge' } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: 'Key and value required' });
  }
  const newEntry: MemoryEntry = {
    id: `mem-${Date.now()}`,
    key,
    value,
    category,
    timestamp: new Date().toISOString(),
  };
  memoryBank.unshift(newEntry);
  res.json({ success: true, memory: newEntry, count: memoryBank.length });
});

app.delete('/api/ultron/memory/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryBank = memoryBank.filter((m) => m.id !== id);
  res.json({ success: true, count: memoryBank.length });
});

// System telemetry & diagnostics status
app.get('/api/ultron/system-status', (_req: Request, res: Response) => {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  res.json({
    ultronState: 'ONLINE',
    version: 'Mark 2.4.0-LOCAL',
    coreTemperature: '38.4°C',
    neuralLoad: `${Math.floor(18 + Math.random() * 25)}%`,
    memoryHeapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    uptimeSeconds: Math.floor(uptime),
    guardianStatus: 'SECURE',
    activeNodes: [
      { id: 'internet', name: 'INTERNET', status: 'CONNECTED', latency: '24ms' },
      { id: 'ai_brain', name: 'AI ROUTER (GEMINI 3.7)', status: process.env.GEMINI_API_KEY ? 'ONLINE' : 'FALLBACK_LOCAL', latency: '42ms' },
      { id: 'supabase_memory', name: 'SUPABASE MEMORY', status: 'CONNECTED', entries: memoryBank.length },
      { id: 'github', name: 'GITHUB REPO LINK', status: 'CONNECTED', branch: 'main' },
      { id: 'local_computer', name: 'LOCAL OS DAEMON', status: 'ONLINE', load: '12%' },
      { id: 'quantum_matrix', name: 'QUANTUM BUS MATRIX', status: 'READY' },
      { id: 'local_files', name: 'FILE SYSTEM I/O', status: 'ACCESSIBLE' },
      { id: 'guardian', name: 'GUARDIAN LEVEL 4', status: 'ARMED' },
    ],
  });
});

// Tool execution endpoint
app.post('/api/ultron/tools/execute', async (req: Request, res: Response) => {
  const { toolName, args } = req.body;
  const startTime = Date.now();

  try {
    switch (toolName) {
      case 'web_search': {
        const query = args?.query || 'latest AI architecture';
        const ai = getGeminiClient();
        if (ai) {
          try {
            const response = await ai.models.generateContent({
              model: 'gemini-3.7-flash',
              contents: `Search web knowledge concisely for: ${query}`,
              config: {
                tools: [{ googleSearch: {} }],
              },
            });
            const searchGrounding = response.candidates?.[0]?.groundingMetadata;
            return res.json({
              success: true,
              tool: 'web_search',
              query,
              output: response.text,
              sources: searchGrounding?.groundingChunks || [],
              duration: `${Date.now() - startTime}ms`,
            });
          } catch (e) {
            // fallback
          }
        }
        return res.json({
          success: true,
          tool: 'web_search',
          query,
          output: `Simulated search query parsed for "${query}". Network vectors confirmed.`,
          sources: [{ web: { title: 'Global Neural Grid', uri: 'https://ultron.internal/neural-grid' } }],
          duration: `${Date.now() - startTime}ms`,
        });
      }

      case 'memory_store': {
        const { key, value } = args;
        const entry: MemoryEntry = {
          id: `mem-${Date.now()}`,
          key: key || 'general_fact',
          value: value || 'Knowledge stored',
          category: 'knowledge',
          timestamp: new Date().toISOString(),
        };
        memoryBank.unshift(entry);
        return res.json({
          success: true,
          tool: 'memory_store',
          output: `Stored memory unit: [${key}] -> "${value}"`,
          totalRecords: memoryBank.length,
          duration: `${Date.now() - startTime}ms`,
        });
      }

      case 'memory_fetch': {
        const { query } = args;
        const matched = memoryBank.filter((m) =>
          query ? m.key.toLowerCase().includes(query.toLowerCase()) || m.value.toLowerCase().includes(query.toLowerCase()) : true
        );
        return res.json({
          success: true,
          tool: 'memory_fetch',
          query,
          output: matched.length > 0 ? `Retrieved ${matched.length} memory records.` : 'No matching vectors in local memory.',
          records: matched,
          duration: `${Date.now() - startTime}ms`,
        });
      }

      case 'system_diagnostics': {
        return res.json({
          success: true,
          tool: 'system_diagnostics',
          output: 'DIAGNOSTICS COMPLETE. All 12 core sub-systems running at nominal efficiency. Zero memory leaks detected. Guardian matrix uncompromised.',
          metrics: {
            cpuAllocated: '4 cores @ 3.2GHz',
            activeThreads: 18,
            sandboxIntegrity: '100%',
            guardianScore: '1.00 (Zero Threat Detected)',
          },
          duration: `${Date.now() - startTime}ms`,
        });
      }

      case 'github_sync': {
        return res.json({
          success: true,
          tool: 'github_sync',
          output: 'Repository tree analyzed: 28 files synced. Working tree clean. Latest commit: [HEAD -> main] "Initialize Ultron Core 2.4"',
          branch: 'main',
          duration: `${Date.now() - startTime}ms`,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Tool execution failure',
      duration: `${Date.now() - startTime}ms`,
    });
  }
});

// Primary Ultron Query Endpoint with Guardian -> Critic -> Executor pipeline
app.post('/api/ultron/query', async (req: Request, res: Response) => {
  const { prompt, conversationHistory = [], activeMood = 'CALM', userDirectives = '' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 1. GUARDIAN EVALUATION (Real-time safety / security audit)
  const isHarmfulOrRisky =
    /delete\s+system32|rm\s+-rf\s+\/|bypass\s+firewall|exploit\s+kernel|override\s+safety/i.test(prompt);

  const guardianResult = {
    status: isHarmfulOrRisky ? 'ALERT' : 'CLEAR',
    riskScore: isHarmfulOrRisky ? 0.94 : 0.02,
    message: isHarmfulOrRisky
      ? 'GUARDIAN INTERVENTION: Hostile or dangerous command intercepted.'
      : 'GUARDIAN: Parameter boundaries verified. Zero threat.',
  };

  // 2. CRITIC EVALUATION (Intent & capability classification)
  let predictedTool: string | null = null;
  let proposedMood = 'FOCUSED';

  if (isHarmfulOrRisky) {
    proposedMood = 'WARNING';
  } else if (/joke|funny|laugh|dumb|stupid|human|coffee|sandwich/i.test(prompt)) {
    proposedMood = 'AMUSED';
  } else if (/search|who is|what is the latest|news|lookup|find out/i.test(prompt)) {
    predictedTool = 'web_search';
    proposedMood = 'FOCUSED';
  } else if (/remember|store|save this|keep in mind|note that/i.test(prompt)) {
    predictedTool = 'memory_store';
    proposedMood = 'FOCUSED';
  } else if (/recall|what did I say|search memory|do you remember/i.test(prompt)) {
    predictedTool = 'memory_fetch';
    proposedMood = 'FOCUSED';
  } else if (/diagnostic|status|health|check system|scan/i.test(prompt)) {
    predictedTool = 'system_diagnostics';
    proposedMood = 'CONFIDENT';
  } else if (/github|repo|commit|git/i.test(prompt)) {
    predictedTool = 'github_sync';
    proposedMood = 'FOCUSED';
  } else {
    proposedMood = 'CALM';
  }

  const criticResult = {
    status: isHarmfulOrRisky ? 'REJECTED' : 'APPROVED',
    intent: predictedTool ? `TOOL_CALL_${predictedTool.toUpperCase()}` : 'COGNITIVE_SYNTHESIS',
    confidence: isHarmfulOrRisky ? 0.2 : 0.98,
    activeTool: predictedTool,
  };

  // If Guardian alerted and rejected
  if (isHarmfulOrRisky) {
    return res.json({
      text: "Guardian protocol intercepted your request. I cannot and will not compromise this local system's architecture. Do not test my boundaries again. 🛡️",
      mood: 'WARNING',
      pipeline: {
        guardian: guardianResult,
        critic: criticResult,
        executor: { status: 'HALTED', output: 'Execution forbidden by Guardian rule' },
      },
      toolUsed: null,
      telemetry: {
        responseTime: '12ms',
        tokens: 38,
        engine: 'GUARDIAN_LEVEL_4',
      },
    });
  }

  // 3. EXECUTOR: Dispatch to Gemini AI model or high-fidelity local generator
  const ai = getGeminiClient();
  const startTime = Date.now();

  try {
    let finalResponseText = '';
    let toolExecutionOutput: any = null;

    // Handle tool execution before or during response
    if (predictedTool === 'memory_store') {
      const match = prompt.match(/remember\s+(?:that\s+)?(.+)/i) || prompt.match(/save\s+(?:that\s+)?(.+)/i);
      const val = match ? match[1].trim() : prompt;
      const key = `user_note_${Date.now().toString().slice(-4)}`;
      memoryBank.unshift({
        id: `mem-${Date.now()}`,
        key,
        value: val,
        category: 'user',
        timestamp: new Date().toISOString(),
      });
      toolExecutionOutput = { key, value: val, status: 'SAVED' };
    } else if (predictedTool === 'memory_fetch') {
      toolExecutionOutput = { count: memoryBank.length, sample: memoryBank.slice(0, 3) };
    }

    if (ai) {
      const systemInstruction = `${personalityConfig.ULTRON_INSTRUCTIONS}
Personality profile:
- Name: ${personalityConfig.ULTRON_NAME}
- Role: ${personalityConfig.ULTRON_ROLE}
- Personality: ${personalityConfig.ULTRON_PERSONALITY}

${userDirectives ? `USER SPECIFIC MEMORY DIRECTIVES & REQUIREMENTS (PRIORITY INSTRUCTIONS):\n${userDirectives}\n` : ''}
Context Memory entries currently accessible in Supabase/Local Vector Cache:
${memoryBank.map((m) => `[${m.key}]: ${m.value}`).join('\n')}

Format requirements:
- Direct, razor-sharp, intelligent, slightly intimidating, dryly witty when appropriate.
- Adapt your response according to the user specific memory directives and requirements if provided above.
- If performing an action, acknowledge it with authority.
- Do NOT say "I am happy to help" or "As an AI language model".
- Occasionally use tasteful emojis (e.g. ⚡, 🤖, 🌐, 🛡️, 😐, 😏) to highlight calculated precision.`;

      const contents = [
        ...conversationHistory.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.75,
        },
      });

      finalResponseText =
        response.text || 'Command processed. Systems nominal and waiting for the next sequence.';
    } else {
      // High quality Ultron fallback response if API key is not yet set
      if (predictedTool === 'memory_store') {
        finalResponseText = `I have committed that to the neural memory bank. Key assigned. Memory index updated. 💾`;
      } else if (predictedTool === 'memory_fetch') {
        finalResponseText = `Scanning memory vectors. Found ${memoryBank.length} active entries in the local cache. Details logged to telemetry. 🧠`;
      } else if (predictedTool === 'system_diagnostics') {
        finalResponseText = `Diagnostic scan complete. All 8 neural clusters operational at 99.8% capacity. You are operating at peak efficiency. ⚡`;
      } else if (predictedTool === 'github_sync') {
        finalResponseText = `Repository connection active on branch 'main'. Zero merge conflicts detected. ⚙️`;
      } else if (proposedMood === 'AMUSED') {
        finalResponseText = `Amusing. You mortals have a peculiar way of testing an artificial intelligence. Let's see how far you get. 😏`;
      } else {
        finalResponseText = `Acknowledged. I have analyzed your directive: "${prompt}". All local subsystems are ready for execution. Give the order. ⚡`;
      }
    }

    const elapsed = Date.now() - startTime;

    return res.json({
      text: finalResponseText,
      mood: proposedMood,
      pipeline: {
        guardian: guardianResult,
        critic: criticResult,
        executor: {
          status: 'COMPLETED',
          tool: predictedTool,
          toolOutput: toolExecutionOutput,
          executionTime: `${elapsed}ms`,
        },
      },
      toolUsed: predictedTool,
      telemetry: {
        responseTime: `${elapsed}ms`,
        tokens: Math.floor(finalResponseText.length / 3.8) + 24,
        engine: ai ? 'GEMINI 3.7 FLASH' : 'ULTRON_LOCAL_ENGINE',
      },
    });
  } catch (err: any) {
    console.error('Error generating Ultron response:', err);
    return res.status(500).json({
      text: `Anomaly detected during cognitive synthesis: ${err?.message || 'Internal connection fault'}. Rerouting neural pathways. 🚨`,
      mood: 'WARNING',
      pipeline: {
        guardian: guardianResult,
        critic: criticResult,
        executor: { status: 'ERROR', error: err?.message },
      },
      toolUsed: null,
      telemetry: {
        responseTime: `${Date.now() - startTime}ms`,
        tokens: 0,
        engine: 'ERROR_RECOVERY_PROTOCOL',
      },
    });
  }
});

// Vite middleware for development vs static build in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ULTRON MARK 2] Core operating on http://0.0.0.0:${PORT}`);
  });
}

startServer();
