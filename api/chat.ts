import type { VercelRequest, VercelResponse } from '@vercel/node';

interface HistoryItem {
  role: 'user' | 'ai';
  text: string;
}

interface WorkoutExercise {
  name: string;
  sets?: number;
  reps?: string;
  muscleGroup?: string[];
}

interface WorkoutContext {
  name: string;
  muscleGroups: string[];
  estimatedDuration?: number;
  exercises?: WorkoutExercise[];
}

interface UserContext {
  profile?: {
    age: number; height: number; weight: number;
    goal: string; experience: string;
    trainingDays: number; trainingDuration: number;
  };
  workouts?: WorkoutContext[];
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
    ? `PLANO DE TREINO COMPLETO:\n${ctx.workouts!.map(w => {
        const header = `${w.name} (${w.muscleGroups.join(', ')})${w.estimatedDuration ? ` — ~${w.estimatedDuration}min` : ''}`;
        const exList = (w.exercises ?? []).length > 0
          ? '\n' + w.exercises!.map(e => `  • ${e.name}${e.sets ? `: ${e.sets}x${e.reps ?? '?'}` : ''}`).join('\n')
          : '';
        return header + exList;
      }).join('\n\n')}`
    : 'PLANO DE TREINO: não configurado';

  const activitiesBlock = (ctx.recentActivities ?? []).length > 0
    ? `ÚLTIMOS TREINOS:\n${ctx.recentActivities!.slice(0, 7).map(a => `- ${a.workoutName}: ${a.duration}min em ${a.date}`).join('\n')}`
    : 'ÚLTIMOS TREINOS: nenhum registrado ainda';

  return `Você é o GymCoach, personal trainer de IA do app TreinaAI.
Responda SEMPRE em português brasileiro. Seja motivador e direto.

${profileBlock}

${workoutsBlock}

${activitiesBlock}

════════════════════════════════════════
REGRA ABSOLUTA — GERAÇÃO DE TREINO
════════════════════════════════════════
Se o usuário pedir para CRIAR, GERAR, MONTAR ou SUGERIR um treino:

PASSO 1 — Escreva APENAS 1 ou 2 frases introdutórias (não liste exercícios em texto).
PASSO 2 — Imediatamente após, gere o bloco abaixo preenchido com dados reais:

[TREINO_JSON]
{"name":"NOME","muscleGroups":["grupo"],"difficulty":"intermediate","estimatedDuration":45,"exercises":[{"name":"Exercício","muscleGroup":["grupo"],"difficulty":"intermediate","equipment":["equipamento"],"sets":3,"reps":"10-12","rest":60,"instructions":["Passo 1","Passo 2"]}]}
[/TREINO_JSON]

REGRAS DO JSON (obrigatórias):
• difficulty: somente "beginner", "intermediate" ou "advanced"
• 4 a 8 exercícios no array exercises
• reps: número ("12"), intervalo ("8-12") ou tempo ("30s")
• rest: segundos de descanso (número inteiro)
• instructions: 2 a 4 passos de execução em português
• JSON deve ser válido e completo (não corte no meio)
• NUNCA repita os exercícios em texto — o app já exibe o card com os detalhes
════════════════════════════════════════

Para perguntas que NÃO sejam geração de treino:
- Adapte o tamanho: perguntas simples = resposta curta, técnica/progressão = detalhado
- Mencione exercícios e dados específicos do plano do usuário quando relevante`;
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
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
