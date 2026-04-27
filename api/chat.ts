import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HistoryItem {
  role: 'user' | 'ai';
  text: string;
}

interface UserContext {
  profile?: {
    age: number; height: number; weight: number;
    goal: string; experience: string;
    trainingDays: number; trainingDuration: number;
  };
  workouts?: { name: string; muscleGroups: string[] }[];
  recentActivities?: { workoutName: string; duration: number; date: string }[];
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

function buildSystemPrompt(ctx: UserContext): string {
  const p = ctx.profile;
  const profileBlock = p
    ? `PERFIL:\n- Idade: ${p.age} anos | Peso: ${p.weight}kg | Altura: ${p.height}cm\n- Objetivo: ${goalMap[p.goal] ?? p.goal} | Nível: ${expMap[p.experience] ?? p.experience}\n- Treinos: ${p.trainingDays}x/semana, ${p.trainingDuration}min/sessão`
    : 'PERFIL: não disponível';

  const workoutsBlock = (ctx.workouts ?? []).length > 0
    ? `PLANO DE TREINO:\n${ctx.workouts!.map(w => `- ${w.name}${w.muscleGroups.length ? ` (${w.muscleGroups.join(', ')})` : ''}`).join('\n')}`
    : 'PLANO DE TREINO: não configurado';

  const activitiesBlock = (ctx.recentActivities ?? []).length > 0
    ? `ÚLTIMOS TREINOS:\n${ctx.recentActivities!.slice(0, 7).map(a => `- ${a.workoutName}: ${a.duration}min em ${a.date}`).join('\n')}`
    : 'ÚLTIMOS TREINOS: nenhum registrado ainda';

  return `Você é o GymCoach, personal trainer de IA do app GymClaude.
Ajude o usuário a treinar melhor com base nos dados abaixo.

${profileBlock}

${workoutsBlock}

${activitiesBlock}

DIRETRIZES:
- Responda SEMPRE em português brasileiro
- Seja motivador, direto e prático
- Respostas concisas (3-5 frases, exceto quando pedir algo detalhado)
- Baseie sugestões no perfil e histórico do usuário
- Não invente informações que não estejam no perfil`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, userContext, history } = req.body ?? {};
  if (!message?.trim()) return res.status(400).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[chat] GEMINI_API_KEY not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const systemPrompt = buildSystemPrompt(userContext ?? {});

    const contents = [
      ...((history as HistoryItem[]) ?? []).slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: [{ text: message.trim() }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('[chat] Gemini API error:', geminiRes.status, errBody);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    const data = await geminiRes.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não consegui responder. Tente novamente!';

    return res.status(200).json({ text });
  } catch (err: any) {
    console.error('[chat] Unexpected error:', err?.message ?? err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
