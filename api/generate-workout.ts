import type { VercelRequest, VercelResponse } from '@vercel/node';

interface UserProfile {
  age?: number; weight?: number; height?: number;
  goal?: string; experience?: string;
  trainingDays?: number; trainingDuration?: number;
}

const goalMap: Record<string, string> = {
  muscle_gain: 'ganho de massa muscular',
  fat_loss: 'perda de gordura',
  maintain: 'manutenção',
};
const expMap: Record<string, string> = {
  beginner: 'iniciante',
  intermediate: 'intermediário',
  advanced: 'avançado',
};

const responseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    muscleGroups: { type: 'array', items: { type: 'string' } },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
    estimatedDuration: { type: 'integer' },
    exercises: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          muscleGroup: { type: 'array', items: { type: 'string' } },
          difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          equipment: { type: 'array', items: { type: 'string' } },
          sets: { type: 'integer' },
          reps: { type: 'string' },
          rest: { type: 'integer' },
          instructions: { type: 'array', items: { type: 'string' }, maxItems: 2 },
        },
        required: ['name', 'muscleGroup', 'difficulty', 'equipment', 'sets', 'reps', 'rest', 'instructions'],
      },
      minItems: 4,
      maxItems: 6,
    },
  },
  required: ['name', 'muscleGroups', 'difficulty', 'estimatedDuration', 'exercises'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { request, profile } = req.body ?? {};
  if (!request?.trim()) return res.status(400).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[generate-workout] GEMINI_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const p = profile as UserProfile | undefined;
  const profileText = p
    ? `${p.age} anos, ${p.weight}kg, objetivo: ${goalMap[p.goal ?? ''] ?? p.goal}, nível: ${expMap[p.experience ?? ''] ?? p.experience}, ${p.trainingDays}x/semana, ${p.trainingDuration}min/sessão`
    : 'perfil não disponível';

  const prompt = `Personal trainer. Gere um treino de academia em português brasileiro.
Perfil: ${profileText}
Pedido: "${request.trim()}"
Gere 4 a 6 exercícios. Instructions: máximo 2 passos curtos por exercício. Adapte ao perfil.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('[generate-workout] Gemini error:', geminiRes.status, errBody);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason && finishReason !== 'STOP') {
      console.error('[generate-workout] Truncated response, finishReason:', finishReason);
      return res.status(500).json({ error: `Response truncated: ${finishReason}` });
    }

    const raw: string = candidate?.content?.parts?.[0]?.text ?? '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    const workout = JSON.parse(raw);
    return res.status(200).json({ workout });
  } catch (err: any) {
    console.error('[generate-workout] Error:', err?.message ?? err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
