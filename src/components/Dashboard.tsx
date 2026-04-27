import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, IconButton, Chip,
  Dialog, DialogContent, Slide, TextField
} from '@mui/material';
import {
  ArrowBack, FitnessCenter, AccessTime, Repeat,
  Add, Check, EmojiEvents, Person,
  Home, ShowChart, SmartToy,
} from '@mui/icons-material';
import { useUserData } from '../contexts/UserDataContext';
import { WorkoutGenerator } from '../utils/workoutGenerator';
import { UserProfile, Exercise, Workout, SetLog, ExerciseSession } from '../types';
import { getExerciseImage } from '../utils/exerciseImages';
import { fetchExerciseGif } from '../utils/exerciseGif';
import { WorkoutEditor } from './WorkoutEditor';
import { CreateWorkoutDialog } from './CreateWorkoutDialog';
import { InicioTab }   from './tabs/InicioTab';
import { TreinosTab }  from './tabs/TreinosTab';
import { ProgressoTab } from './tabs/ProgressoTab';
import { PerfilTab }   from './tabs/PerfilTab';
import { ChatTab }     from './tabs/ChatTab';
import { C } from '../theme/tokens';

interface Props {
  userProfile: UserProfile;
  onResetProfile: () => void;
}

// ─── WeightLogger (mantido aqui — usado por ExerciseDetail) ──────────────────
const WL_C = {
  orange: '#4ADE80', orangeLight: '#22C55E',
  orangeDim: 'rgba(74,222,128,0.12)', orangeBorder: 'rgba(74,222,128,0.25)',
  card: C.card, cardBorder: C.cardBorder,
  textPri: C.textPri, textSec: C.textSec, textMuted: C.textMuted,
};

const WeightLogger: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const { exerciseLogs, setExerciseLog } = useUserData();
  const history: ExerciseSession[] = exerciseLogs[exercise.id] ?? [];
  const today = new Date().toISOString().split('T')[0];
  const todaySession = history.find(s => s.date === today);
  const defaultSets: SetLog[] = Array.from({ length: exercise.sets ?? 3 }, () => ({ weight: 0, reps: 0, completed: false }));
  const [sets, setSets] = useState<SetLog[]>(() => todaySession?.sets ?? defaultSets);
  const lastSession = history.filter(s => s.date !== today).at(-1);

  const updateSet = (i: number, field: 'weight' | 'reps', raw: string) => {
    const value = raw === '' ? 0 : field === 'weight' ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(value)) setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const toggleComplete = (i: number) => {
    setSets(prev => {
      const updated = prev.map((s, idx) => idx === i ? { ...s, completed: !s.completed } : s);
      const session: ExerciseSession = { exerciseId: exercise.id, exerciseName: exercise.name, date: today, sets: updated };
      setExerciseLog(exercise.id, [...history.filter(s => s.date !== today), session]);
      return updated;
    });
  };

  const completedCount = sets.filter(s => s.completed).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.5, flex: 1, fontWeight: 600 }}>Registrar Séries</Typography>
        {completedCount > 0 && (
          <Chip icon={<EmojiEvents sx={{ fontSize: '14px !important' }} />} label={`${completedCount}/${sets.length} concluídas`} size="small"
            sx={{ bgcolor: WL_C.orangeDim, color: WL_C.orange, fontSize: 11, border: `1px solid ${WL_C.orangeBorder}` }} />
        )}
      </Box>
      {lastSession && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: WL_C.orangeDim, border: `1px solid ${WL_C.orangeBorder}` }}>
          <Typography sx={{ fontSize: 11, color: WL_C.orange, mb: 0.5, fontWeight: 600 }}>Último treino ({lastSession.date})</Typography>
          <Typography sx={{ fontSize: 12, color: C.textSec }}>{lastSession.sets.map((s, i) => `S${i + 1}: ${s.weight}kg × ${s.reps}`).join('  ·  ')}</Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 0.5 }}>
        {['S', 'Peso (kg)', 'Reps', ''].map((h, i) => (
          <Typography key={i} sx={{ fontSize: 11, color: C.textMuted, fontWeight: 600, ...(i === 0 ? { width: 32, textAlign: 'center' } : i === 3 ? { width: 36 } : { flex: 1, textAlign: 'center' }) }}>{h}</Typography>
        ))}
      </Box>
      {sets.map((set, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, opacity: set.completed ? 0.55 : 1, transition: 'opacity 0.2s' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, bgcolor: set.completed ? WL_C.orangeDim : '#2C2C2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: set.completed ? WL_C.orange : C.textSec }}>{i + 1}</Typography>
          </Box>
          <TextField type="number" value={set.weight || ''} onChange={e => updateSet(i, 'weight', e.target.value)} placeholder="0" disabled={set.completed} size="small"
            sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: '#2C2C2E', borderRadius: 2, fontSize: 14 }, '& .MuiInputBase-input': { textAlign: 'center', color: C.textPri, py: 1 }, '& fieldset': { borderColor: C.cardBorder }, '& .MuiInputBase-root:hover fieldset': { borderColor: WL_C.orangeBorder } }}
            slotProps={{ htmlInput: { min: 0, step: 2.5 } }}
          />
          <TextField type="number" value={set.reps || ''} onChange={e => updateSet(i, 'reps', e.target.value)} placeholder={exercise.reps?.split('-')[0] ?? '0'} disabled={set.completed} size="small"
            sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: '#2C2C2E', borderRadius: 2, fontSize: 14 }, '& .MuiInputBase-input': { textAlign: 'center', color: C.textPri, py: 1 }, '& fieldset': { borderColor: C.cardBorder }, '& .MuiInputBase-root:hover fieldset': { borderColor: WL_C.orangeBorder } }}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <Box onClick={() => toggleComplete(i)} sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, cursor: 'pointer', bgcolor: set.completed ? WL_C.orange : '#2C2C2E', border: `1.5px solid ${set.completed ? WL_C.orange : C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', '&:hover': { bgcolor: set.completed ? WL_C.orangeLight : WL_C.orangeDim } }}>
            {set.completed ? <Check sx={{ fontSize: 18, color: '#000' }} /> : <Add sx={{ fontSize: 18, color: C.textSec }} />}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ─── ExerciseDetail dialog ────────────────────────────────────────────────────
const ExerciseDetail: React.FC<{ exercise: Exercise; onClose: () => void }> = ({ exercise, onClose }) => {
  const imgSrc = getExerciseImage(exercise.muscleGroup);
  const [gifUrl, setGifUrl]     = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(true);

  useEffect(() => {
    setGifUrl(null); setGifLoading(true);
    fetchExerciseGif(exercise.id).then(url => { setGifUrl(url); setGifLoading(false); });
  }, [exercise.id]);

  const diffLabel = exercise.difficulty === 'beginner' ? 'Fácil' : exercise.difficulty === 'intermediate' ? 'Médio' : 'Avançado';

  return (
    <Dialog fullScreen open onClose={onClose} slots={{ transition: Slide }} slotProps={{ transition: { direction: 'up' } as any, paper: { sx: { bgcolor: C.bg } } }}>
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        {/* Imagem/GIF de topo */}
        <Box sx={{ position: 'relative', width: '100%', height: 280, bgcolor: gifUrl ? '#0D0D0D' : 'transparent', overflow: 'hidden' }}>
          {gifUrl ? (
            <>
              <Box component="img" src={gifUrl} alt={exercise.name} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
              <Box sx={{ position: 'absolute', top: 16, right: 16, px: 1.2, py: 0.4, borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', border: `1px solid ${C.greenBorder}` }}>
                <Typography sx={{ fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: 1.5 }}>GIF AO VIVO</Typography>
              </Box>
            </>
          ) : (
            <>
              <Box component="img" src={imgSrc} alt={exercise.name}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', filter: gifLoading ? 'brightness(0.6)' : 'none', transition: 'filter 0.3s' }}
              />
              {gifLoading && (
                <Box sx={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.green, animation: 'gifPulse 1s infinite', '@keyframes gifPulse': { '0%,100%': { opacity: 0.3, transform: 'scale(0.8)' }, '50%': { opacity: 1, transform: 'scale(1.2)' } } }} />
                  <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Carregando demonstração…</Typography>
                </Box>
              )}
            </>
          )}
          <Box sx={{ position: 'absolute', inset: 0, background: gifUrl ? 'linear-gradient(to bottom, transparent 60%, rgba(13,13,15,0.95) 100%)' : 'linear-gradient(to bottom, rgba(13,13,15,0.1) 0%, rgba(13,13,15,0.97) 100%)' }} />
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: C.green, color: '#000' } }}>
            <ArrowBack />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, pt: 2, pb: 5 }}>
          <Typography variant="h4" sx={{ fontFamily: '"Bebas Neue"', letterSpacing: 1.5, color: C.textPri, mb: 1 }}>{exercise.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {exercise.muscleGroup.map(m => (
              <Chip key={m} label={m} size="small" sx={{ bgcolor: C.greenDim, color: C.green, border: `1px solid ${C.greenBorder}`, fontSize: 11, fontWeight: 600 }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: C.card, border: `1px solid ${C.cardBorder}` }}>
            {[
              { icon: <Repeat sx={{ fontSize: 18 }} />, label: `${exercise.sets} séries`, sub: `${exercise.reps} reps` },
              { icon: <AccessTime sx={{ fontSize: 18 }} />, label: `${exercise.rest}s`, sub: 'descanso' },
              { icon: <FitnessCenter sx={{ fontSize: 18 }} />, label: diffLabel, sub: 'nível' },
            ].map((stat, i) => (
              <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ color: C.green, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{stat.icon}</Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.textPri }}>{stat.label}</Typography>
                <Typography sx={{ fontSize: 11, color: C.textSec }}>{stat.sub}</Typography>
              </Box>
            ))}
          </Box>
          {exercise.equipment.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Equipamentos</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {exercise.equipment.map(eq => <Chip key={eq} label={eq} size="small" sx={{ bgcolor: '#2C2C2E', color: C.textSec, fontSize: 11 }} />)}
              </Box>
            </Box>
          )}
          <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1.5, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>Execução</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
            {exercise.instructions.map((step, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box sx={{ minWidth: 26, height: 26, borderRadius: '50%', bgcolor: C.greenDim, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.green }}>{i + 1}</Typography>
                </Box>
                <Typography sx={{ fontSize: 14, color: '#D1D1D6', pt: 0.3, lineHeight: 1.55 }}>{step}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: C.card, border: `1px solid ${C.cardBorder}` }}>
            <WeightLogger exercise={exercise} />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ─── Dashboard principal ──────────────────────────────────────────────────────
export const Dashboard: React.FC<Props> = ({ userProfile, onResetProfile }) => {
  const { workouts: savedWorkouts, setWorkouts: saveWorkouts, exerciseLogs, activeWorkout, startWorkout, finishWorkout, cancelWorkout } = useUserData();

  const generated = useMemo(() => WorkoutGenerator.getWorkoutPlan(userProfile), [userProfile]);
  const workouts: Workout[] = savedWorkouts.length > 0 ? savedWorkouts : generated;

  const setWorkouts = async (w: Workout[]) => { await saveWorkouts(w); };

  type Tab = 'inicio' | 'treinos' | 'progresso' | 'chat' | 'perfil';
  const [activeTab,       setActiveTab]       = useState<Tab>('inicio');
  const [activeDay,       setActiveDay]       = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingDay,      setEditingDay]      = useState<number | null>(null);
  const [confirmReset,    setConfirmReset]    = useState(false);
  const [creatingWorkout, setCreatingWorkout] = useState(false);

  const currentWorkout = workouts[activeDay];

  // ── Timer do treino ativo ──────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!activeWorkout) { setElapsedSeconds(0); return; }
    const update = () => setElapsedSeconds(Math.floor((Date.now() - new Date(activeWorkout.startTime).getTime()) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const isCurrentWorkoutActive = activeWorkout?.workoutId === currentWorkout?.id;

  const handleStartWorkout = () => { if (currentWorkout) startWorkout(currentWorkout); };
  const handleFinishWorkout = () => { finishWorkout(); setActiveTab('progresso'); };

  // ── Gestão de treinos ──────────────────────────────────────────────────────
  const saveWorkoutDay = (dayIndex: number, exercises: Exercise[]) => {
    setWorkouts(workouts.map((w: Workout, i: number) => i === dayIndex ? { ...w, exercises } : w));
  };

  const resetWorkoutDay = () => {
    const original = generated[activeDay];
    if (!original) return;
    setWorkouts(workouts.map((w: Workout, i: number) => i === activeDay ? { ...w, exercises: original.exercises } : w));
    setConfirmReset(false);
  };

  const deleteCustomWorkout = (workoutId: string) => {
    const updated = workouts.filter((w: Workout) => w.id !== workoutId);
    setWorkouts(updated);
    if (activeDay >= updated.length) setActiveDay(Math.max(0, updated.length - 1));
  };

  const handleConfirmReset = () => {
    if (currentWorkout?.id?.startsWith('custom-')) deleteCustomWorkout(currentWorkout.id);
    else resetWorkoutDay();
    setConfirmReset(false);
  };

  const addCustomWorkout = (workout: Workout) => { setWorkouts([...workouts, workout]); };

  // Inicializa plano no Firestore na primeira vez
  useEffect(() => {
    if (savedWorkouts.length === 0 && generated.length > 0) saveWorkouts(generated);
  }, [savedWorkouts.length, generated, saveWorkouts]);

  // ── Nav tabs ───────────────────────────────────────────────────────────────
  const navTabs = [
    { key: 'inicio',    icon: <Home sx={{ fontSize: 22 }} />,          label: 'Início'    },
    { key: 'treinos',   icon: <FitnessCenter sx={{ fontSize: 22 }} />, label: 'Treinos'   },
    { key: 'progresso', icon: <ShowChart sx={{ fontSize: 22 }} />,     label: 'Progresso' },
    { key: 'chat',      icon: <SmartToy sx={{ fontSize: 22 }} />,      label: 'IA'        },
    { key: 'perfil',    icon: <Person sx={{ fontSize: 22 }} />,        label: 'Perfil'    },
  ];

  return (
    <Box sx={{ height: '100vh', bgcolor: C.bg, maxWidth: 480, mx: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Conteúdo da tab ativa ────────────────────────────────────────── */}
      {activeTab === 'inicio' && (
        <InicioTab
          onResetProfile={onResetProfile}
          workouts={workouts}
          onGoToTreinos={() => setActiveTab('treinos')}
        />
      )}
      {activeTab === 'treinos' && (
        <TreinosTab
          workouts={workouts}
          activeDay={activeDay}
          setActiveDay={(d) => { setActiveDay(d); setConfirmReset(false); }}
          elapsedSeconds={elapsedSeconds}
          formatElapsed={formatElapsed}
          activeWorkout={activeWorkout}
          isCurrentWorkoutActive={isCurrentWorkoutActive}
          onStartWorkout={handleStartWorkout}
          onFinishWorkout={handleFinishWorkout}
          onCancelWorkout={cancelWorkout}
          onSelectExercise={setSelectedExercise}
          onEditDay={setEditingDay}
          onResetDay={resetWorkoutDay}
          onDeleteWorkout={() => currentWorkout && deleteCustomWorkout(currentWorkout.id)}
          onCreateWorkout={() => setCreatingWorkout(true)}
          confirmReset={confirmReset}
          setConfirmReset={setConfirmReset}
          onConfirmReset={handleConfirmReset}
          exerciseLogs={exerciseLogs}
        />
      )}
      {activeTab === 'progresso' && <ProgressoTab />}
      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'perfil' && (
        <PerfilTab
          onResetProfile={onResetProfile}
          onGoToProgresso={() => setActiveTab('progresso')}
        />
      )}

      {/* ── Barra de navegação inferior ──────────────────────────────────── */}
      <Box sx={{ flexShrink: 0, bgcolor: C.card, borderTop: `1px solid ${C.cardBorder}`, px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {navTabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Box key={tab.key}
              onClick={() => setActiveTab(tab.key as Tab)}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, cursor: 'pointer', flex: 1, py: 0.8, borderRadius: '16px', transition: 'all 0.2s',
                ...(isActive
                  ? { background: `linear-gradient(160deg, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.06) 100%)`, border: `1px solid rgba(74,222,128,0.2)` }
                  : { border: '1px solid transparent', '&:hover': { bgcolor: C.faint } })
              }}>
              <Box sx={{ color: isActive ? C.green : C.textMuted, filter: isActive ? `drop-shadow(0 0 6px ${C.green})` : 'none', transition: 'all 0.2s' }}>
                {tab.icon}
              </Box>
              <Typography sx={{ fontSize: 10, fontWeight: isActive ? 800 : 500, color: isActive ? C.green : C.textMuted, letterSpacing: 0.3 }}>
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* ── Dialogs globais ──────────────────────────────────────────────── */}
      {selectedExercise && <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
      {editingDay !== null && (
        <WorkoutEditor
          currentExercises={workouts[editingDay]?.exercises ?? []}
          onSave={exercises => saveWorkoutDay(editingDay, exercises)}
          onClose={() => setEditingDay(null)}
        />
      )}
      {creatingWorkout && (
        <CreateWorkoutDialog onSave={addCustomWorkout} onClose={() => setCreatingWorkout(false)} />
      )}
    </Box>
  );
};
