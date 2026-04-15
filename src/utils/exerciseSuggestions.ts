import { Exercise } from '../types';

// Relações musculares: sinergistas (ajudam no movimento) e antagonistas (oposto)
const muscleRelationships: Record<string, { synergists: string[]; antagonists: string[] }> = {
  peitoral:       { synergists: ['triceps', 'ombros'],              antagonists: ['costas', 'biceps'] },
  costas:         { synergists: ['biceps', 'ombros', 'trapézio'],    antagonists: ['peitoral', 'triceps'] },
  quadriceps:     { synergists: ['glúteos', 'panturrilha'],          antagonists: ['isquiotibiais'] },
  glúteos:        { synergists: ['quadriceps', 'isquiotibiais'],     antagonists: [] },
  isquiotibiais:  { synergists: ['glúteos', 'panturrilha'],          antagonists: ['quadriceps'] },
  panturrilha:    { synergists: ['quadriceps', 'isquiotibiais'],     antagonists: [] },
  biceps:         { synergists: ['costas', 'braquiorradial'],        antagonists: ['triceps'] },
  triceps:        { synergists: ['peitoral', 'ombros'],              antagonists: ['biceps'] },
  ombros:         { synergists: ['trapézio', 'triceps'],             antagonists: [] },
  trapézio:       { synergists: ['ombros', 'costas'],                antagonists: [] },
  'abdômen':      { synergists: ['core', 'oblíquos'],               antagonists: [] },
  core:           { synergists: ['abdômen', 'oblíquos'],            antagonists: [] },
  oblíquos:       { synergists: ['abdômen', 'core'],                antagonists: [] },
  braquiorradial: { synergists: ['biceps'],                          antagonists: ['triceps'] },
};

/**
 * Retorna exercícios complementares ao exercício informado.
 * Prioridade:
 *   1. Mesmo grupo muscular mas ângulo diferente (ex: inclinado → plano → declinado)
 *   2. Músculos sinergistas (ex: peitoral → tríceps)
 *   3. Antagonista (equilíbrio muscular)
 */
export function getSuggestedExercises(
  current: Exercise,
  allExercises: Exercise[],
  alreadyInWorkout: string[],
  limit = 4,
): Exercise[] {
  const targetMuscles = current.muscleGroup;

  const scored = allExercises
    .filter(ex => ex.id !== current.id && !alreadyInWorkout.includes(ex.id))
    .map(ex => {
      let score = 0;

      // 1. Mesmo grupo muscular → alta pontuação
      const sameGroup = ex.muscleGroup.filter(m => targetMuscles.includes(m));
      score += sameGroup.length * 12;

      // Penaliza se os grupos são idênticos (queremos variedade de ângulo)
      const currentSorted = [...current.muscleGroup].sort().join(',');
      const exSorted = [...ex.muscleGroup].sort().join(',');
      if (currentSorted === exSorted) score -= 4;

      // 2. Sinergistas
      for (const muscle of targetMuscles) {
        const rel = muscleRelationships[muscle];
        if (rel) {
          const synMatch = ex.muscleGroup.filter(m => rel.synergists.includes(m));
          score += synMatch.length * 6;
        }
      }

      // 3. Antagonista → equilíbrio (pontuação baixa mas positiva)
      for (const muscle of targetMuscles) {
        const rel = muscleRelationships[muscle];
        if (rel) {
          const antMatch = ex.muscleGroup.filter(m => rel.antagonists.includes(m));
          score += antMatch.length * 2;
        }
      }

      // Bônus: mesmo nível de dificuldade
      if (ex.difficulty === current.difficulty) score += 1;

      return { exercise: ex, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.exercise);
}

/** Explica em texto por que o exercício foi sugerido */
export function getSuggestionReason(current: Exercise, suggested: Exercise): string {
  const same = suggested.muscleGroup.filter(m => current.muscleGroup.includes(m));
  if (same.length > 0) {
    return `Complementa ${same.join(' e ')} de ângulo diferente`;
  }
  // verifica sinergista
  for (const muscle of current.muscleGroup) {
    const rel = muscleRelationships[muscle];
    if (rel) {
      const syn = suggested.muscleGroup.filter(m => rel.synergists.includes(m));
      if (syn.length > 0) return `Músculo sinergista: ${syn.join(', ')}`;
      const ant = suggested.muscleGroup.filter(m => rel.antagonists.includes(m));
      if (ant.length > 0) return `Equilíbrio muscular (antagonista)`;
    }
  }
  return 'Exercício complementar recomendado';
}
