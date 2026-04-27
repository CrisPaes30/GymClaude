import { useMemo } from 'react';
import { useUserData } from '../contexts/UserDataContext';
import { WorkoutActivity } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function startOfWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - ((day + 6) % 7)); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1); d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(): Date {
  const d = new Date();
  d.setMonth(0, 1); d.setHours(0, 0, 0, 0);
  return d;
}

export function calcStreak(activities: WorkoutActivity[]): number {
  if (!activities.length) return 0;
  const dates = new Set(activities.map(a => a.endTime.split('T')[0]));
  let s = 0;
  const cur = new Date();
  while (dates.has(cur.toISOString().split('T')[0])) {
    s++;
    cur.setDate(cur.getDate() - 1);
  }
  return s;
}

export function uniqueActiveDays(activities: WorkoutActivity[]): number {
  return new Set(activities.map(a => a.endTime.split('T')[0])).size;
}

// ─── Level system ─────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: 'Iniciante',  minXP: 0    },
  { level: 2, name: 'Dedicado',   minXP: 500  },
  { level: 3, name: 'Atleta',     minXP: 1500 },
  { level: 4, name: 'Guerreiro',  minXP: 3000 },
  { level: 5, name: 'Elite',      minXP: 6000 },
];

// ─── Achievements ─────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  icon: string; // emoji
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export type Period = 'week' | 'month' | 'year';

export function useWorkoutStats(period: Period = 'month') {
  const { workoutActivities, exerciseLogs, profile } = useUserData();

  return useMemo(() => {
    const periodStart =
      period === 'week'  ? startOfWeek()  :
      period === 'month' ? startOfMonth() :
      startOfYear();
    const periodStartStr = periodStart.toISOString();

    const filtered = workoutActivities.filter(a => a.endTime >= periodStartStr);

    // ── Calories (MET-based estimate) ────────────────────────────────────────
    const weight = profile?.weight ?? 75;
    const caloriesTotal = filtered.reduce(
      (s, a) => s + Math.round(a.duration * 6.0 * weight / 60), 0
    );

    // ── Volume (sum completed sets weight × reps within period) ──────────────
    const periodStartDate = periodStart.toISOString().split('T')[0];
    const volumeKg = Object.values(exerciseLogs)
      .flatMap(sessions => sessions)
      .filter(s => s.date >= periodStartDate)
      .flatMap(s => s.sets)
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);

    // ── Streak & active days ─────────────────────────────────────────────────
    const streak     = calcStreak(workoutActivities);
    const activeDays = uniqueActiveDays(workoutActivities);

    // ── Body composition estimates ───────────────────────────────────────────
    const h = profile?.height ? profile.height / 100 : 1.75;
    const bmi = weight / (h * h);
    const estimatedFatPct =
      bmi < 22 ? 12 :
      bmi < 25 ? 16 :
      bmi < 28 ? 20 : 25;
    const leanMass = +(weight * (1 - estimatedFatPct / 100)).toFixed(1);

    // ── Weekly challenge ─────────────────────────────────────────────────────
    const weekStart = startOfWeek().toISOString();
    const weeklyDone  = workoutActivities.filter(a => a.endTime >= weekStart).length;
    const weeklyGoal  = profile?.trainingDays ?? 3;

    // ── XP / Level ───────────────────────────────────────────────────────────
    const totalXP =
      workoutActivities.length * 100 +
      streak * 50 +
      activeDays * 25;

    const currentLevelData = [...LEVELS].reverse().find(l => totalXP >= l.minXP) ?? LEVELS[0];
    const nextLevelData    = LEVELS.find(l => l.minXP > totalXP);
    const xpForNext        = nextLevelData ? nextLevelData.minXP - totalXP : 0;
    const xpCurrentLevel   = totalXP - currentLevelData.minXP;
    const xpToLevelUp      = nextLevelData ? nextLevelData.minXP - currentLevelData.minXP : 1;

    // ── Achievements ─────────────────────────────────────────────────────────
    const total = workoutActivities.length;
    const achievements: Achievement[] = [
      { id: 'first',    label: 'Primeiro passo', description: 'Completou o primeiro treino',     unlocked: total >= 1,  icon: '🥇' },
      { id: 'streak3',  label: 'Foco',            description: '3 dias seguidos de treino',       unlocked: streak >= 3, icon: '🎯' },
      { id: 'streak7',  label: 'Persistente',     description: '7 dias seguidos de treino',       unlocked: streak >= 7, icon: '🔥' },
      { id: 'ten',      label: '10 treinos',       description: 'Completou 10 treinos no total',   unlocked: total >= 10, icon: '💪' },
      { id: 'thirty',   label: 'Imparável',        description: 'Completou 30 treinos no total',   unlocked: total >= 30, icon: '⚡' },
      { id: 'weekly',   label: 'Meta da semana',   description: 'Cumpriu a meta semanal',          unlocked: weeklyDone >= weeklyGoal, icon: '🏆' },
    ];

    return {
      // Period stats
      filteredActivities: filtered,
      trainingCount: filtered.length,
      caloriesTotal,
      volumeKg: Math.round(volumeKg),
      // All-time
      streak,
      activeDays,
      totalWorkouts: total,
      // Body
      estimatedFatPct,
      leanMass,
      // Weekly
      weeklyDone,
      weeklyGoal,
      weeklyProgress: Math.min(1, weeklyDone / Math.max(1, weeklyGoal)),
      // XP / Level
      totalXP,
      currentLevel: currentLevelData.level,
      currentLevelName: currentLevelData.name,
      xpForNext,
      xpCurrentLevel,
      xpToLevelUp,
      // Achievements
      achievements,
    };
  }, [workoutActivities, exerciseLogs, profile, period]);
}
