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
    ? `Perfil do usuário: ${p.age} anos, ${p.weight}kg, ${p.height}cm, objetivo: ${goalMap[p.goal ?? ''] ?? p.goal ?? 'não informado'}, nível: ${expMap[p.experience ?? ''] ?? p.experience ?? 'não informado'}, treina ${p.trainingDays ?? '?'}x/semana, ${p.trainingDuration ?? '?'}min/sessão.`
    : 'Perfil do usuário: não disponível.';

  const prompt = `Você é um personal trainer especialista em musculação.
${profileText}
Pedido do usuário: "${request.trim()}"

Gere um treino completo de academia com 4 a 8 exercícios.
Adapte a dificuldade, volume e grupos musculares ao perfil e ao pedido.
Todos os textos em português brasileiro.
Responda SOMENTE com um JSON válido seguindo exatamente esta estrutura (sem texto fora do JSON):
{
  "name": "Nome do Treino",
  "muscleGroups": ["Peitoral", "Tríceps"],
  "difficulty": "intermediate",
  "estimatedDuration": 60,
  "exercises": [
    {
      "name": "Supino Reto com Barra",
      "muscleGroup": ["Peitoral"],
      "difficulty": "intermediate",
      "equipment": ["Barra", "Banco"],
      "sets": 4,
      "reps": "8-12",
      "rest": 90,
      "instructions": ["Deite no banco, segure a barra na largura dos ombros.", "Desça a barra até o peito de forma controlada.", "Empurre de volta à posição inicial expirando o ar."]
    }
  ]
}
difficulty deve ser exatamente: "beginner", "intermediate" ou "advanced".`;

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
            temperature: 0.8,
            maxOutputTokens: 4000,
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
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    const workout = JSON.parse(raw);
    return res.status(200).json({ workout });
  } catch (err: any) {
    console.error('[generate-workout] Error:', err?.message ?? err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
