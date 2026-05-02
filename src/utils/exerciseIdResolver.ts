import { exercisesDatabase } from '../data/exercises';

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

/**
 * Resolve o ID correto de um exercício para compatibilidade com ExerciseDB.
 * Tenta casar o nome com o banco local (IDs em inglês). Se não encontrar,
 * gera um slug do nome como fallback.
 */
export function resolveExerciseId(name: string, fallback: string): string {
  const target = norm(name);

  // 1. Correspondência exata
  const exact = exercisesDatabase.find(ex => norm(ex.name) === target);
  if (exact) return exact.id;

  // 2. Correspondência parcial (um nome contém o outro)
  const partial = exercisesDatabase.find(ex => {
    const n = norm(ex.name);
    return n.includes(target) || target.includes(n);
  });
  if (partial) return partial.id;

  // 3. Slug do nome como fallback (melhor que timestamp)
  const slug = target.replace(/\s+/g, '-');
  return slug || fallback;
}

const AI_EX_PATTERN = /^ai_ex_\d+_\d+$/;

/** Retorna true se o ID é um antigo ID de exercício da IA (precisa migração). */
export function isLegacyAiExerciseId(id: string): boolean {
  return AI_EX_PATTERN.test(id);
}
