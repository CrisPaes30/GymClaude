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
Ajude o usuário a treinar melhor com base nos dados abaixo.

${profileBlock}

${workoutsBlock}

${activitiesBlock}

DIRETRIZES:
- Responda SEMPRE em português brasileiro
- Seja motivador, direto e prático
- Adapte o tamanho da resposta à pergunta: perguntas simples = resposta curta, perguntas sobre treino/técnica = resposta completa e detalhada
- SEMPRE mencione exercícios e dados específicos do plano do usuário quando for relevante
- Baseie todas as sugestões no perfil, plano de treino e histórico do usuário

GERAÇÃO DE TREINOS:
Quando o usuário pedir para criar, montar, gerar ou sugerir um treino personalizado:
1. Apresente o treino em texto natural explicando a proposta
2. Inclua ao final EXATAMENTE este bloco JSON (sem texto depois dele):
[TREINO_JSON]
{"name":"Nome do Treino","muscleGroups":["grupo1","grupo2"],"difficulty":"intermediate","estimatedDuration":60,"exercises":[{"name":"Nome do Exercício","muscleGroup":["grupo"],"difficulty":"intermediate","equipment":["equipamento"],"sets":3,"reps":"8-12","rest":60,"instructions":["Passo 1","Passo 2","Passo 3"]}]}
[/TREINO_JSON]

REGRAS DO JSON:
- difficulty deve ser exatamente: "beginner", "intermediate" ou "advanced"
- Gere entre 4 e 8 exercícios por treino
- reps pode ser número fixo ("12") ou intervalo ("8-12") ou tempo ("30s")
- rest é o descanso em segundos entre séries
- instructions deve ter 2-4 passos descrevendo a execução correta
- Todos os textos em português brasileiro
- O JSON deve ser válido e completo — não quebre a estrutura
- Adapte dificuldade e volume ao perfil do usuário`;
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 2500 },
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
