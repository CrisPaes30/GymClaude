import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, InputBase, Chip } from '@mui/material';
import { PlayArrow, FitnessCenter, AccessTime, Edit, RestartAlt, DeleteForever, AddCircleOutlined, Check, MoreVert } from '@mui/icons-material';
import { C } from '../../theme/tokens';
import { Exercise, Workout, ActiveWorkout } from '../../types';
import { getExerciseThumbnail } from '../../utils/exerciseImages';
import { fetchExerciseThumbnail } from '../../utils/exerciseGif';

// ─── Item numerado de exercício ───────────────────────────────────────────────
const ExerciseItem: React.FC<{ exercise: Exercise; index: number; onClick: () => void }> = ({ exercise, index, onClick }) => {
  const fallback = getExerciseThumbnail(exercise.muscleGroup);
  const [imgSrc, setImgSrc] = useState(fallback);
  useEffect(() => {
    let cancelled = false;
    fetchExerciseThumbnail(exercise.id).then(url => { if (!cancelled && url) setImgSrc(url); });
    return () => { cancelled = true; };
  }, [exercise.id]);

  const isWarmup = index < 1 && exercise.difficulty === 'beginner';

  return (
    <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer', borderBottom: `1px solid ${C.line}`, transition: 'background 0.15s', '&:hover': { bgcolor: C.faint }, '&:active': { bgcolor: C.greenDim } }}>
      {/* Número */}
      <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: isWarmup ? C.orangeDim : C.greenDim, border: `1px solid ${isWarmup ? 'rgba(249,115,22,0.3)' : C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, color: isWarmup ? C.orange : C.green }}>{index + 1}</Typography>
      </Box>
      {/* Thumbnail */}
      <Box sx={{ width: 52, height: 46, borderRadius: '10px', overflow: 'hidden', flexShrink: 0, bgcolor: '#2C2C2E' }}>
        <Box component="img" src={imgSrc} alt={exercise.name}
          onError={() => setImgSrc(fallback)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.3s' }}
        />
      </Box>
      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.textPri, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.25 }}>{exercise.name}</Typography>
        <Typography sx={{ fontSize: 11, color: C.textSec, mt: 0.2 }}>
          {exercise.sets} séries · {exercise.reps} reps
        </Typography>
      </Box>
      <MoreVert sx={{ fontSize: 16, color: C.textMuted, flexShrink: 0 }} />
    </Box>
  );
};

// ─── TreinosTab ───────────────────────────────────────────────────────────────
interface Props {
  workouts: Workout[];
  activeDay: number;
  setActiveDay: (d: number) => void;
  elapsedSeconds: number;
  formatElapsed: (s: number) => string;
  activeWorkout: ActiveWorkout | null;
  isCurrentWorkoutActive: boolean;
  onStartWorkout: () => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  onSelectExercise: (ex: Exercise) => void;
  onEditDay: (i: number) => void;
  onResetDay: () => void;
  onDeleteWorkout: () => void;
  onCreateWorkout: () => void;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
  onConfirmReset: () => void;
  exerciseLogs: Record<string, any>;
}

export const TreinosTab: React.FC<Props> = ({
  workouts, activeDay, setActiveDay, elapsedSeconds, formatElapsed,
  activeWorkout, isCurrentWorkoutActive, onStartWorkout, onFinishWorkout,
  onCancelWorkout, onSelectExercise, onEditDay, onResetDay, onDeleteWorkout,
  onCreateWorkout, confirmReset, setConfirmReset, onConfirmReset, exerciseLogs,
}) => {
  const [search, setSearch] = useState('');
  const currentWorkout = workouts[activeDay];
  const isCustom = currentWorkout?.id?.startsWith('custom-');

  const filtered = currentWorkout
    ? search.trim()
      ? currentWorkout.exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase()) || ex.muscleGroup.some(m => m.toLowerCase().includes(search.toLowerCase())))
      : currentWorkout.exercises
    : [];

  // Progresso hoje
  const todayStr    = new Date().toISOString().split('T')[0];
  const completedEx = currentWorkout?.exercises.filter(ex => {
    const hist = exerciseLogs[ex.id] ?? [];
    return hist.some((s: any) => s.date === todayStr && s.sets.some((st: any) => st.completed));
  }).length ?? 0;
  const totalEx = currentWorkout?.exercises.length ?? 0;
  const progress = totalEx > 0 ? Math.round((completedEx / totalEx) * 100) : 0;

  if (!currentWorkout) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 4 }}>
        <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 24, color: C.textMuted, letterSpacing: 2 }}>Sem treinos</Typography>
        <Box onClick={onCreateWorkout} sx={{ px: 3, py: 1.4, borderRadius: '14px', background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#000' }}>Criar treino</Typography>
        </Box>
      </Box>
    );
  }

  const diffLabel = currentWorkout.difficulty === 'beginner' ? 'Iniciante' : currentWorkout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 3.5, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography sx={{ flex: 1, fontSize: 13, color: C.textSec, fontWeight: 600, letterSpacing: 0.5 }}>Treino</Typography>
          <IconButton size="small" onClick={() => setConfirmReset(true)}
            sx={{ color: C.textSec, bgcolor: C.faint, border: `1px solid ${C.line}`, borderRadius: '10px', '&:hover': { color: C.red, bgcolor: C.redDim } }}>
            {isCustom ? <DeleteForever fontSize="small" /> : <RestartAlt fontSize="small" />}
          </IconButton>
          <Box onClick={() => onEditDay(activeDay)} sx={{ display: 'flex', alignItems: 'center', gap: 0.7, px: 1.5, py: 0.7, borderRadius: '10px', cursor: 'pointer', bgcolor: C.faint, border: `1px solid ${C.line}`, '&:hover': { bgcolor: C.greenDim, borderColor: C.greenBorder }, transition: 'all 0.15s' }}>
            <Edit sx={{ fontSize: 14, color: C.textSec }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Editar</Typography>
          </Box>
        </Box>

        <Typography sx={{ fontSize: 22, fontWeight: 800, color: C.textPri, lineHeight: 1.2 }}>{currentWorkout.name}</Typography>
        <Typography sx={{ fontSize: 13, color: C.textSec, mt: 0.3 }}>{currentWorkout.estimatedDuration} min · {diffLabel}</Typography>
      </Box>

      {/* ── Confirmação reset/delete ────────────────────────────────────────── */}
      {confirmReset && (
        <Box sx={{ mx: 2.5, mb: 1.5, p: 1.8, borderRadius: '12px', bgcolor: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 13, color: '#FCA5A5', flex: 1 }}>{isCustom ? 'Excluir este treino?' : 'Restaurar treino original?'}</Typography>
          <Box onClick={onConfirmReset} sx={{ px: 2, py: 0.7, borderRadius: '8px', cursor: 'pointer', bgcolor: C.red }}><Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{isCustom ? 'Excluir' : 'Restaurar'}</Typography></Box>
          <Box onClick={() => setConfirmReset(false)} sx={{ px: 2, py: 0.7, borderRadius: '8px', cursor: 'pointer', bgcolor: C.faint }}><Typography sx={{ fontSize: 12, color: C.textSec }}>Cancelar</Typography></Box>
        </Box>
      )}

      {/* ── Seletor de dias ─────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
          <Box onClick={onCreateWorkout} sx={{ flexShrink: 0, px: 1.8, py: 0.8, borderRadius: '20px', border: `1.5px dashed ${C.greenBorder}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, '&:hover': { bgcolor: C.greenDim }, transition: 'all 0.15s' }}>
            <AddCircleOutlined sx={{ fontSize: 14, color: C.green }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.green }}>Novo</Typography>
          </Box>
          {workouts.map((w, i) => (
            <Box key={w.id} onClick={() => { setActiveDay(i); setSearch(''); }}
              sx={{ flexShrink: 0, px: 2, py: 0.8, borderRadius: '20px', cursor: 'pointer', bgcolor: i === activeDay ? C.green : C.card, border: `1px solid ${i === activeDay ? C.green : C.cardBorder}`, transition: 'all 0.2s' }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: i === activeDay ? '#000' : C.textSec, whiteSpace: 'nowrap' }}>Dia {i + 1}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Progress bar de hoje ────────────────────────────────────────────── */}
      {completedEx > 0 && (
        <Box sx={{ px: 2.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Progresso de hoje</Typography>
            <Typography sx={{ fontSize: 10, color: C.green, fontWeight: 700 }}>{completedEx}/{totalEx} · {progress}%</Typography>
          </Box>
          <Box sx={{ height: 4, borderRadius: 2, bgcolor: C.faint, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.greenDark}, ${C.green})`, width: `${Math.max(progress, 2)}%`, transition: 'width 0.8s ease' }} />
          </Box>
        </Box>
      )}

      {/* ── Busca ──────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, bgcolor: C.card, borderRadius: '14px', border: `1px solid ${C.cardBorder}` }}>
          <FitnessCenter sx={{ fontSize: 17, color: C.textMuted }} />
          <InputBase fullWidth value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercícios..."
            sx={{ fontSize: 14, color: C.textPri, '& input::placeholder': { color: C.textMuted } }}
          />
        </Box>
      </Box>

      {/* ── Chips info ─────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, mb: 1, display: 'flex', gap: 1 }}>
        <Chip icon={<FitnessCenter sx={{ fontSize: '13px !important', color: `${C.green} !important` }} />} label={`${currentWorkout.exercises.length} exercícios`} size="small"
          sx={{ bgcolor: C.greenDim, color: C.green, border: `1px solid ${C.greenBorder}`, fontSize: 11, height: 22 }} />
        <Chip icon={<AccessTime sx={{ fontSize: '13px !important' }} />} label={`${currentWorkout.estimatedDuration} min`} size="small"
          sx={{ bgcolor: C.faint, color: C.textSec, fontSize: 11, height: 22 }} />
      </Box>

      {/* ── Lista de exercícios ─────────────────────────────────────────────── */}
      <Box sx={{ mx: 2.5, mb: 1, bgcolor: C.card, borderRadius: '16px', border: `1px solid ${C.cardBorder}`, overflow: 'hidden', flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>
        {filtered.length === 0
          ? <Box sx={{ py: 5, textAlign: 'center' }}><Typography sx={{ color: C.textSec, fontSize: 14 }}>Nenhum exercício encontrado</Typography></Box>
          : filtered.map((ex, i) => <ExerciseItem key={ex.id} exercise={ex} index={i} onClick={() => onSelectExercise(ex)} />)
        }
      </Box>

      {/* ── Botão Iniciar / Finalizar ───────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 1.5, pb: 2.5, flexShrink: 0 }}>
        {isCurrentWorkoutActive ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 2, py: 1.2, borderRadius: '12px', bgcolor: C.greenDim, border: `1px solid ${C.greenBorder}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.green, animation: 'pulse 1.5s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                <Typography sx={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Em andamento</Typography>
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: 'monospace' }}>{formatElapsed(elapsedSeconds)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.2 }}>
              <Box onClick={onCancelWorkout} sx={{ flex: 1, py: 1.5, borderRadius: '14px', border: `1.5px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { bgcolor: C.redDim } }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.red }}>Cancelar</Typography>
              </Box>
              <Box onClick={onFinishWorkout} sx={{ flex: 2, py: 1.5, borderRadius: '14px', background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', boxShadow: `0 4px 18px ${C.greenGlow}`, '&:hover': { filter: 'brightness(1.08)' }, transition: 'all 0.15s' }}>
                <Check sx={{ fontSize: 18, color: '#000' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#000' }}>Finalizar Treino</Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box onClick={onStartWorkout} sx={{
            py: 1.8, borderRadius: '14px',
            background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.green} 60%, #86EFAC 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
            cursor: 'pointer',
            boxShadow: `0 6px 28px rgba(74,222,128,0.55), 0 0 0 1px rgba(74,222,128,0.3)`,
            '&:hover': { filter: 'brightness(1.1)', boxShadow: `0 8px 36px rgba(74,222,128,0.65)` },
            '&:active': { transform: 'scale(0.98)' },
            transition: 'all 0.18s',
          }}>
            <PlayArrow sx={{ fontSize: 24, color: '#000' }} />
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#000', letterSpacing: 0.2 }}>Iniciar Treino</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
