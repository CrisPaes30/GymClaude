const BASE = 'https://images.unsplash.com/photo';

export const muscleGroupImages: Record<string, string> = {
  peitoral:       `${BASE}-1571019614242-c5c5dee9f50b?w=400&h=280&fit=crop&q=80`,
  costas:         `${BASE}-1526506118085-60ce8714f8c5?w=400&h=280&fit=crop&q=80`,
  quadriceps:     `${BASE}-1574680096145-d05b474e2155?w=400&h=280&fit=crop&q=80`,
  pernas:         `${BASE}-1574680096145-d05b474e2155?w=400&h=280&fit=crop&q=80`,
  glúteos:        `${BASE}-1518611012118-696072aa579a?w=400&h=280&fit=crop&q=80`,
  isquiotibiais:  `${BASE}-1534367610401-9f5ed68180aa?w=400&h=280&fit=crop&q=80`,
  panturrilha:    `${BASE}-1490645935967-10de6ba17061?w=400&h=280&fit=crop&q=80`,
  ombros:         `${BASE}-1541534741688-7927b9f5d8fa?w=400&h=280&fit=crop&q=80`,
  trapézio:       `${BASE}-1534438327276-14e5300c3a48?w=400&h=280&fit=crop&q=80`,
  biceps:         `${BASE}-1581009146145-b5ef050c2e1e?w=400&h=280&fit=crop&q=80`,
  triceps:        `${BASE}-1530822847156-5df684ec5933?w=400&h=280&fit=crop&q=80`,
  'abdômen':      `${BASE}-1571945192952-b02b7aee5b55?w=400&h=280&fit=crop&q=80`,
  core:           `${BASE}-1583454110551-21f2fa2afe61?w=400&h=280&fit=crop&q=80`,
  oblíquos:       `${BASE}-1571945192952-b02b7aee5b55?w=400&h=280&fit=crop&q=80`,
  braquiorradial: `${BASE}-1581009146145-b5ef050c2e1e?w=400&h=280&fit=crop&q=80`,
};

const FALLBACK = `${BASE}-1534438327276-14e5300c3a48?w=400&h=280&fit=crop&q=80`;

export function getExerciseImage(muscleGroups: string[]): string {
  for (const group of muscleGroups) {
    if (muscleGroupImages[group]) return muscleGroupImages[group];
  }
  return FALLBACK;
}

// Thumbnail menor para lista
export function getExerciseThumbnail(muscleGroups: string[]): string {
  return getExerciseImage(muscleGroups).replace('w=400&h=280', 'w=120&h=120');
}
