import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
Seu papel é ajudar o usuário a treinar melhor com base no perfil e histórico dele.

${profileBlock}

${workoutsBlock}

${activitiesBlock}

DIRETRIZES:
- Responda SEMPRE em português brasileiro
- Seja motivador, direto e prático
- Respostas concisas (3-5 frases, exceto quando pedir algo detalhado)
- Baseie sugestões no perfil e histórico do usuário
- Não invente informações que não estejam no perfil
- Use o plano de treino existente como referência quando relevante`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message, userContext, history } = req.body ?? {};
  if (!message?.trim()) return res.status(400).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: buildSystemPrompt(userContext ?? {}),
    });

    const chatHistory = ((history as HistoryItem[]) ?? [])
      .slice(-10)
      .map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message.trim());
    const text = result.response.text();

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Gemini error:', err);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}
