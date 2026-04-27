import React from 'react';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import { NotificationsNone, FitnessCenter, LocalFireDepartment, DirectionsRun, PlayArrow } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { useWorkoutStats } from '../../hooks/useWorkoutStats';
import { C } from '../../theme/tokens';
import { Workout } from '../../types';
import { getExerciseThumbnail } from '../../utils/exerciseImages';

// ─── Anel de progresso SVG com glow ──────────────────────────────────────────
const RingProgress: React.FC<{
  value: number; size: number; strokeWidth?: number;
  color?: string; trackColor?: string; children?: React.ReactNode;
}> = ({ value, size, strokeWidth = 11, color = C.green, trackColor = 'rgba(255,255,255,0.06)', children }) => {
  const r     = (size - strokeWidth) / 2;
  const cx    = size / 2;
  const cy    = size / 2;
  const circ  = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value, 100) / 100);
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block', filter: `drop-shadow(0 0 10px ${color}99)` }}
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      {children && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

// ─── Linha de stat com pill colorido ─────────────────────────────────────────
const StatLine: React.FC<{
  icon: React.ReactNode; label: string; value: string;
  pillColor: string; pillBg: string;
}> = ({ icon, label, value, pillColor, pillBg }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
    <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: pillBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 12px ${pillBg}` }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: 9.5, color: C.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', lineHeight: 1 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: C.textPri, fontWeight: 700, lineHeight: 1.35 }}>{value}</Typography>
    </Box>
  </Box>
);

// ─── Card de stat rápido com tint por tipo ────────────────────────────────────
const QuickStat: React.FC<{
  label: string; value: string; sub: string;
  accentColor: string; accentBg: string; accentBorder: string;
}> = ({ label, value, sub, accentColor, accentBg, accentBorder }) => (
  <Box sx={{ flex: 1, p: 1.8, borderRadius: '14px', background: `linear-gradient(160deg, ${accentBg} 0%, ${C.card} 100%)`, border: `1px solid ${accentBorder}` }}>
    <Typography sx={{ fontSize: 9.5, color: C.textMuted, fontWeight: 700, letterSpacing: 0.8, mb: 0.5, textTransform: 'uppercase' }}>{label}</Typography>
    <Typography sx={{ fontSize: 18, fontWeight: 800, color: accentColor, lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: 10, color: accentColor, fontWeight: 600, mt: 0.3, opacity: 0.65 }}>{sub}</Typography>
  </Box>
);

// ─── Faixa semanal ────────────────────────────────────────────────────────────
const WeekStrip: React.FC = () => {
  const { workoutActivities } = useUserData();
  const trained = new Set(workoutActivities.map(a => a.endTime.split('T')[0]));
  const today = new Date();
  const DAYS = ['D','S','T','Q','Q','S','S'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    return { key: d.toISOString().split('T')[0], abbr: DAYS[d.getDay()], num: d.getDate(), isToday: i === 6, done: trained.has(d.toISOString().split('T')[0]) };
  });
  return (
    <Box sx={{ display: 'flex', gap: 0.7 }}>
      {days.map(day => (
        <Box key={day.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
          <Box sx={{
            width: '100%', py: 1.1, borderRadius: '11px',
            background: day.done
              ? `linear-gradient(160deg, ${C.green}, ${C.greenDark})`
              : day.isToday ? C.greenDim : C.faint,
            border: `1px solid ${day.done ? C.green : day.isToday ? C.greenBorder : C.cardBorder}`,
            boxShadow: day.done ? `0 3px 14px rgba(74,222,128,0.45)` : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.1,
            transition: 'all 0.2s',
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: day.done ? '#000' : day.isToday ? C.green : C.textMuted }}>
              {day.num}
            </Typography>
            <Typography sx={{ fontSize: 8, fontWeight: 700, color: day.done ? 'rgba(0,0,0,0.55)' : day.isToday ? C.green : C.textMuted, textTransform: 'uppercase' }}>
              {day.abbr}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ─── InicioTab ────────────────────────────────────────────────────────────────
interface Props {
  onResetProfile: () => void;
  workouts: Workout[];
  onGoToTreinos: () => void;
}

export const InicioTab: React.FC<Props> = ({ onResetProfile, workouts, onGoToTreinos }) => {
  const { currentUser } = useAuth();
  const { workoutActivities, profile } = useUserData();
  const stats = useWorkoutStats('week');

  const firstName = (currentUser?.displayName ?? currentUser?.email?.split('@')[0] ?? 'Atleta').split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const todayStr      = new Date().toISOString().split('T')[0];
  const todayMin      = workoutActivities.filter(a => a.endTime.startsWith(todayStr)).reduce((s, a) => s + a.duration, 0);
  const goalMin       = profile?.trainingDuration ?? 60;
  const todayProgress = Math.min(100, Math.round((todayMin / Math.max(1, goalMin)) * 100));
  const todayCal      = Math.round(todayMin * 6.0 * (profile?.weight ?? 75) / 60);
  const goalCal       = Math.round(goalMin * 6.0 * (profile?.weight ?? 75) / 60);

  const nextWorkout = workouts[0];
  const thumbSrc    = nextWorkout ? getExerciseThumbnail(nextWorkout.muscleGroups ?? []) : '';

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 4, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: C.textPri, letterSpacing: -0.3 }}>Dashboard</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <IconButton size="small" sx={{ color: C.textSec, bgcolor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '12px', p: 0.8 }}>
            <NotificationsNone sx={{ fontSize: 20 }} />
          </IconButton>
          <Avatar src={currentUser?.photoURL ?? undefined} onClick={onResetProfile}
            sx={{ width: 38, height: 38, cursor: 'pointer', border: `2.5px solid ${C.green}`, boxShadow: `0 0 14px rgba(74,222,128,0.5)` }} />
        </Box>
      </Box>

      {/* ── Saudação ───────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Typography sx={{ fontSize: 23, fontWeight: 800, color: C.textPri, lineHeight: 1.2, letterSpacing: -0.3 }}>
          {greeting}, {firstName}! 👋
        </Typography>
        <Typography sx={{ fontSize: 13, color: C.textSec, mt: 0.4 }}>
          Vamos superar seus limites hoje.
        </Typography>
      </Box>

      {/* ── Resumo do dia ──────────────────────────────────────────────────── */}
      <Box sx={{
        mx: 2.5, mb: 2, p: 2.5, borderRadius: '20px',
        background: `linear-gradient(145deg, rgba(74,222,128,0.1) 0%, ${C.card} 55%)`,
        border: `1px solid rgba(74,222,128,0.2)`,
        boxShadow: `0 4px 30px rgba(74,222,128,0.08)`,
      }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.green, mb: 2, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Resumo do dia
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <RingProgress value={todayProgress} size={112}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: C.green, lineHeight: 1, letterSpacing: -0.5 }}>{todayProgress}%</Typography>
              <Typography sx={{ fontSize: 9, color: C.textSec, lineHeight: 1.4 }}>da meta</Typography>
            </Box>
          </RingProgress>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.6 }}>
            <StatLine
              icon={<LocalFireDepartment sx={{ fontSize: 15, color: C.orange }} />}
              label="Calorias" value={`${todayCal} / ${goalCal} kcal`}
              pillColor={C.orange} pillBg="rgba(249,115,22,0.18)"
            />
            <StatLine
              icon={<FitnessCenter sx={{ fontSize: 15, color: C.green }} />}
              label="Treino" value={`${todayMin} / ${goalMin} min`}
              pillColor={C.green} pillBg="rgba(74,222,128,0.18)"
            />
            <StatLine
              icon={<DirectionsRun sx={{ fontSize: 15, color: C.blue }} />}
              label="Passos" value="— / 10.000"
              pillColor={C.blue} pillBg="rgba(96,165,250,0.18)"
            />
          </Box>
        </Box>
      </Box>

      {/* ── Próximo treino ─────────────────────────────────────────────────── */}
      {nextWorkout && (
        <Box onClick={onGoToTreinos} sx={{
          mx: 2.5, mb: 2, p: 2.2, borderRadius: '20px',
          background: `linear-gradient(145deg, rgba(74,222,128,0.07) 0%, ${C.card} 70%)`,
          border: `1px solid rgba(74,222,128,0.18)`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { boxShadow: `0 4px 24px rgba(74,222,128,0.15)`, border: `1px solid ${C.greenBorder}` },
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Próximo treino</Typography>
            <Typography sx={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Hoje</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.textPri, mb: 0.3, letterSpacing: -0.2 }}>{nextWorkout.name}</Typography>
              <Typography sx={{ fontSize: 12, color: C.textSec }}>
                {nextWorkout.estimatedDuration} min · {nextWorkout.difficulty === 'beginner' ? 'Iniciante' : nextWorkout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Typography>
            </Box>
            <Box sx={{ ml: 2, width: 60, height: 60, borderRadius: '14px', overflow: 'hidden', bgcolor: '#2C2C2E', flexShrink: 0, boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}>
              <Box component="img" src={thumbSrc} alt={nextWorkout.name}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          </Box>
          <Box
            sx={{
              py: 1.3, borderRadius: '13px',
              background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 100%)`,
              boxShadow: `0 4px 20px rgba(74,222,128,0.45)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              '&:hover': { filter: 'brightness(1.1)' }, transition: 'all 0.15s',
            }}
          >
            <PlayArrow sx={{ fontSize: 18, color: '#000' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#000', letterSpacing: 0.2 }}>Começar agora</Typography>
          </Box>
        </Box>
      )}

      {/* ── Estatísticas rápidas ────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.textMuted, mb: 1.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Estatísticas rápidas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.2 }}>
          <QuickStat label="Peso" value={`${profile?.weight ?? '—'}`} sub="kg · perfil"
            accentColor={C.textPri} accentBg="rgba(255,255,255,0.04)" accentBorder={C.cardBorder} />
          <QuickStat label="Massa magra" value={`~${stats.leanMass}`} sub="kg · est."
            accentColor={C.blue} accentBg="rgba(96,165,250,0.1)" accentBorder="rgba(96,165,250,0.22)" />
          <QuickStat label="Gordura" value={`~${stats.estimatedFatPct}`} sub="% · est."
            accentColor={C.orange} accentBg={C.orangeDim} accentBorder="rgba(249,115,22,0.22)" />
        </Box>
      </Box>

      {/* ── Desafio semanal ─────────────────────────────────────────────────── */}
      <Box sx={{
        mx: 2.5, mb: 3.5, p: 2.5, borderRadius: '20px',
        background: `linear-gradient(145deg, rgba(74,222,128,0.07) 0%, ${C.card} 60%)`,
        border: `1px solid rgba(74,222,128,0.15)`,
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: C.textPri }}>Desafio semanal</Typography>
          <Box sx={{ px: 1.5, py: 0.4, borderRadius: '20px', bgcolor: stats.weeklyDone >= stats.weeklyGoal ? C.greenDim : C.faint, border: `1px solid ${stats.weeklyDone >= stats.weeklyGoal ? C.greenBorder : C.cardBorder}` }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: stats.weeklyDone >= stats.weeklyGoal ? C.green : C.textSec }}>
              {stats.weeklyDone} / {stats.weeklyGoal} treinos
            </Typography>
          </Box>
        </Box>
        <Box sx={{ height: 7, borderRadius: 4, bgcolor: C.faint, mb: 2.5, overflow: 'hidden' }}>
          <Box sx={{
            height: '100%', borderRadius: 4,
            background: `linear-gradient(90deg, ${C.greenDark}, ${C.green})`,
            width: `${Math.max(stats.weeklyProgress * 100, 2)}%`,
            boxShadow: `0 0 12px rgba(74,222,128,0.6)`,
            transition: 'width 0.8s ease',
          }} />
        </Box>
        <WeekStrip />
      </Box>
    </Box>
  );
};
