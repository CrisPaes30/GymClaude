import type { VercelRequest, VercelResponse } from '@vercel/node';

function capitalize(s: string): string {
  return s.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function extractWorkoutName(text: string): string {
  let m = text.match(/treino de ([a-záéíóúâêîôûãõàç]+(?:\s+[a-záéíóúâêîôûãõàç]+)?)/);
  if (m) return capitalize('Treino de ' + m[1]);

  const keywords = ['leg day', 'cardio', 'funcional', 'crossfit', 'yoga', 'pilates', 'spinning'];
  for (const kw of keywords) {
    if (text.includes(kw)) return capitalize(kw);
  }

  const muscles = ['peito', 'costas', 'pernas', 'ombros', 'bíceps', 'tríceps', 'abdômen', 'glúteos', 'panturrilha'];
  for (const muscle of muscles) {
    if (text.includes(muscle)) return 'Treino de ' + capitalize(muscle);
  }

  return 'Treino';
}

function extractDuration(text: string): number {
  let m = text.match(/(\d+)\s*hora[s]?\s*e\s*meia/);
  if (m) return parseInt(m[1]) * 60 + 30;

  if (text.includes('uma hora e meia')) return 90;

  m = text.match(/(\d+)\s*hora[s]?/);
  if (m) return parseInt(m[1]) * 60;

  if (text.includes('uma hora')) return 60;
  if (text.includes('meia hora')) return 30;

  m = text.match(/(\d+)\s*min/);
  if (m) return parseInt(m[1]);

  return 0;
}

function extractExercisesDone(text: string): number {
  let m = text.match(/fiz\s*(\d+)\s*dos/);
  if (m) return parseInt(m[1]);

  m = text.match(/completei\s*(\d+)/);
  if (m) return parseInt(m[1]);

  m = text.match(/(\d+)\s*exerc[íi]cios?\s*(?:completos?|conclu[íi]dos?|feitos?)/);
  if (m) return parseInt(m[1]);

  m = text.match(/fiz\s*(\d+)\s*exerc/);
  if (m) return parseInt(m[1]);

  return 0;
}

function extractExercisesTotal(text: string): number {
  let m = text.match(/\d+\s*dos\s*(\d+)\s*exerc/);
  if (m) return parseInt(m[1]);

  m = text.match(/(\d+)\s*exerc[íi]cios?\s*(?:no\s*total)?$/);
  if (m) return parseInt(m[1]);

  m = text.match(/(\d+)\s*exerc/);
  if (m) return parseInt(m[1]);

  return 0;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { transcript } = req.body ?? {};
  if (!transcript || !transcript.trim()) {
    return res.status(400).end();
  }

  const text = transcript.toLowerCase().trim();

  res.status(200).json({
    workoutName: extractWorkoutName(text),
    duration: extractDuration(text),
    exercisesDone: extractExercisesDone(text),
    exercisesTotal: extractExercisesTotal(text),
  });
}
