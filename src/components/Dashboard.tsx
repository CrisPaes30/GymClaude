import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Avatar, IconButton, InputBase,
  Chip, Dialog, DialogContent, Slide, TextField
} from '@mui/material';
import {
  Search, ArrowBack, PlayArrow, FitnessCenter,
  AccessTime, Repeat, Close, Logout,
  Edit, Add, Check, EmojiEvents, BarChart,
  Explore, Person, History, NotificationsNone,
  StarOutlined, Share, ChevronRight, MoreVert,
  LocalFireDepartment, Timer
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { WorkoutGenerator } from '../utils/workoutGenerator';
import { UserProfile, Exercise, Workout, SetLog, ExerciseSession } from '../types';
import { getExerciseImage, getExerciseThumbnail } from '../utils/exerciseImages';
import { WorkoutEditor } from './WorkoutEditor';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ─── Cores ────────────────────────────────────────────────────────────────────
const C = {
  orange: '#FF7A00',
  orangeLight: '#FF9A33',
  orangeDim: 'rgba(255,122,0,0.15)',
  orangeBorder: 'rgba(255,122,0,0.3)',
  bg: '#111111',
  card: '#1C1C1E',
  cardBorder: 'rgba(255,255,255,0.07)',
  textPri: '#FFFFFF',
  textSec: '#8E8E93',
  textMuted: '#48484A',
};

interface Props {
  userProfile: UserProfile;
  onResetProfile: () => void;
}

const goalLabel: Record<UserProfile['goal'], string> = {
  muscle_gain: 'Hipertrofia',
  fat_loss: 'Definição',
  maintain: 'Manutenção',
};

// ─── Registro de peso por série ───────────────────────────────────────────────
const WeightLogger: React.FC<{ exercise: Exercise }> = ({ exercise }) => {
  const storageKey = `log_${exercise.id}`;
  const [history, setHistory] = useLocalStorage<ExerciseSession[]>(storageKey, []);

  const today = new Date().toISOString().split('T')[0];
  const todaySession = history.find(s => s.date === today);

  const defaultSets: SetLog[] = Array.from({ length: exercise.sets ?? 3 }, () => ({
    weight: 0, reps: 0, completed: false
  }));
  const [sets, setSets] = useState<SetLog[]>(() => todaySession?.sets ?? defaultSets);

  const lastSession = history.filter(s => s.date !== today).at(-1);

  const updateSet = (i: number, field: 'weight' | 'reps', value: number) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const toggleComplete = (i: number) => {
    setSets(prev => {
      const updated = prev.map((s, idx) => idx === i ? { ...s, completed: !s.completed } : s);
      const session: ExerciseSession = { exerciseId: exercise.id, exerciseName: exercise.name, date: today, sets: updated };
      const filtered = history.filter((s: ExerciseSession) => s.date !== today);
      setHistory([...filtered, session]);
      return updated;
    });
  };

  const completedCount = sets.filter(s => s.completed).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.5, flex: 1, fontWeight: 600 }}>
          Registrar Séries
        </Typography>
        {completedCount > 0 && (
          <Chip
            icon={<EmojiEvents sx={{ fontSize: '14px !important' }} />}
            label={`${completedCount}/${sets.length} concluídas`}
            size="small"
            sx={{ bgcolor: C.orangeDim, color: C.orange, fontSize: 11, border: `1px solid ${C.orangeBorder}` }}
          />
        )}
      </Box>

      {lastSession && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,122,0,0.06)', border: `1px solid ${C.orangeBorder}` }}>
          <Typography sx={{ fontSize: 11, color: C.orange, mb: 0.5, fontWeight: 600 }}>
            Último treino ({lastSession.date})
          </Typography>
          <Typography sx={{ fontSize: 12, color: C.textSec }}>
            {lastSession.sets.map((s, i) => `S${i + 1}: ${s.weight}kg × ${s.reps}`).join('  ·  ')}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 1, px: 0.5 }}>
        <Typography sx={{ fontSize: 11, color: C.textMuted, width: 32, textAlign: 'center', fontWeight: 600 }}>S</Typography>
        <Typography sx={{ fontSize: 11, color: C.textMuted, flex: 1, textAlign: 'center', fontWeight: 600 }}>Peso (kg)</Typography>
        <Typography sx={{ fontSize: 11, color: C.textMuted, flex: 1, textAlign: 'center', fontWeight: 600 }}>Reps</Typography>
        <Box sx={{ width: 36 }} />
      </Box>

      {sets.map((set, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, opacity: set.completed ? 0.55 : 1, transition: 'opacity 0.2s' }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, bgcolor: set.completed ? C.orangeDim : '#2C2C2E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: set.completed ? C.orange : C.textSec }}>{i + 1}</Typography>
          </Box>
          <TextField
            type="number" value={set.weight || ''} onChange={e => updateSet(i, 'weight', Number(e.target.value))}
            placeholder="0" disabled={set.completed} size="small"
            sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: '#2C2C2E', borderRadius: 2, fontSize: 14 }, '& .MuiInputBase-input': { textAlign: 'center', color: C.textPri, py: 1 }, '& fieldset': { borderColor: C.cardBorder }, '& .MuiInputBase-root:hover fieldset': { borderColor: C.orangeBorder } }}
            slotProps={{ htmlInput: { min: 0, step: 2.5 } }}
          />
          <TextField
            type="number" value={set.reps || ''} onChange={e => updateSet(i, 'reps', Number(e.target.value))}
            placeholder={exercise.reps?.split('-')[0] ?? '0'} disabled={set.completed} size="small"
            sx={{ flex: 1, '& .MuiInputBase-root': { bgcolor: '#2C2C2E', borderRadius: 2, fontSize: 14 }, '& .MuiInputBase-input': { textAlign: 'center', color: C.textPri, py: 1 }, '& fieldset': { borderColor: C.cardBorder }, '& .MuiInputBase-root:hover fieldset': { borderColor: C.orangeBorder } }}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <Box onClick={() => toggleComplete(i)} sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0, cursor: 'pointer', bgcolor: set.completed ? C.orange : '#2C2C2E', border: `1.5px solid ${set.completed ? C.orange : C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', '&:hover': { bgcolor: set.completed ? C.orangeLight : C.orangeDim } }}>
            {set.completed ? <Check sx={{ fontSize: 18, color: '#fff' }} /> : <Add sx={{ fontSize: 18, color: C.textSec }} />}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ─── Detalhe de exercício ─────────────────────────────────────────────────────
const ExerciseDetail: React.FC<{ exercise: Exercise; onClose: () => void }> = ({ exercise, onClose }) => {
  const imgSrc = getExerciseImage(exercise.muscleGroup);
  return (
    <Dialog fullScreen open onClose={onClose} slots={{ transition: Slide }} slotProps={{ transition: { direction: 'up' } as any, paper: { sx: { bgcolor: C.bg } } }}>
      <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
        <Box sx={{ position: 'relative', width: '100%', height: 260 }}>
          <Box component="img" src={imgSrc} alt={exercise.name} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(17,17,17,0.1) 0%, rgba(17,17,17,0.97) 100%)` }} />
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, left: 16, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(8px)', '&:hover': { bgcolor: C.orange } }}>
            <ArrowBack />
          </IconButton>
        </Box>
        <Box sx={{ px: 3, pt: 2, pb: 5 }}>
          <Typography variant="h4" sx={{ fontFamily: '"Bebas Neue"', letterSpacing: 1.5, color: C.textPri, mb: 1 }}>{exercise.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
            {exercise.muscleGroup.map(m => (
              <Chip key={m} label={m} size="small" sx={{ bgcolor: C.orangeDim, color: C.orange, border: `1px solid ${C.orangeBorder}`, fontSize: 11, fontWeight: 600 }} />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: C.card, border: `1px solid ${C.cardBorder}` }}>
            {[
              { icon: <Repeat sx={{ fontSize: 18 }} />, label: `${exercise.sets} séries`, sub: `${exercise.reps} reps` },
              { icon: <AccessTime sx={{ fontSize: 18 }} />, label: `${exercise.rest}s`, sub: 'descanso' },
              { icon: <FitnessCenter sx={{ fontSize: 18 }} />, label: exercise.difficulty === 'beginner' ? 'Fácil' : exercise.difficulty === 'intermediate' ? 'Médio' : 'Avançado', sub: 'nível' },
            ].map((stat, i) => (
              <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ color: C.orange, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{stat.icon}</Box>
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
                <Box sx={{ minWidth: 26, height: 26, borderRadius: '50%', bgcolor: C.orangeDim, border: `1px solid ${C.orangeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.orange }}>{i + 1}</Typography>
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

// ─── Item de exercício na lista ───────────────────────────────────────────────
const ExerciseRow: React.FC<{ exercise: Exercise; onClick: () => void }> = ({ exercise, onClick }) => (
  <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, cursor: 'pointer', borderBottom: `1px solid ${C.cardBorder}`, transition: 'background 0.15s', '&:hover': { bgcolor: 'rgba(255,122,0,0.06)' }, '&:active': { bgcolor: C.orangeDim } }}>
    <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: C.orangeDim, border: `1px solid ${C.orangeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <PlayArrow sx={{ fontSize: 18, color: C.orange, ml: '2px' }} />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.textPri, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exercise.name}</Typography>
      <Typography sx={{ fontSize: 12, color: C.textSec, mt: 0.2 }}>{exercise.muscleGroup.slice(0, 2).join(' · ')}</Typography>
    </Box>
    <Box sx={{ width: 60, height: 52, borderRadius: 2, overflow: 'hidden', flexShrink: 0, bgcolor: '#2C2C2E' }}>
      <Box component="img" src={getExerciseThumbnail(exercise.muscleGroup)} alt={exercise.name}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.parentElement!.style.background = `linear-gradient(135deg, ${C.orangeDim}, rgba(255,60,0,0.15))`; e.currentTarget.style.display = 'none'; }}
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </Box>
  </Box>
);

// ─── Faixa de datas ───────────────────────────────────────────────────────────
const DateStrip: React.FC = () => {
  const today = new Date();
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { day: d.getDate(), name: dayNames[d.getDay()], isToday: i === 0 };
  });
  return (
    <Box sx={{ px: 2.5, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ px: 2, py: 1.2, borderRadius: 3, bgcolor: C.orange, flexShrink: 0 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>
          {monthNames[today.getMonth()]}
        </Typography>
      </Box>
      {days.map((d, i) => (
        <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: d.isToday ? 700 : 500, color: d.isToday ? C.orange : i < 3 ? C.textPri : C.textSec, lineHeight: 1 }}>
            {d.day}
          </Typography>
          <Typography sx={{ fontSize: 10, color: d.isToday ? C.orange : C.textSec, fontWeight: 600, letterSpacing: 0.5 }}>
            {d.name}
          </Typography>
          <Box sx={{ width: 20, height: 2.5, borderRadius: 2, bgcolor: d.isToday ? C.orange : i < 3 ? 'rgba(255,122,0,0.4)' : 'transparent', transition: 'all 0.2s' }} />
        </Box>
      ))}
    </Box>
  );
};

// ─── Cabeçalho de seção ───────────────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box sx={{ px: 2.5, mb: 1.5 }}>
    <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.textPri, lineHeight: 1.2 }}>{title}</Typography>
    {subtitle && <Typography sx={{ fontSize: 13, color: C.textSec, mt: 0.3 }}>{subtitle}</Typography>}
  </Box>
);

// ─── Cores de gradiente por índice ────────────────────────────────────────────
const workoutGradients = [
  'linear-gradient(135deg, #2A1800 0%, #1C1C1E 100%)',
  'linear-gradient(135deg, #0A1F2A 0%, #1C1C1E 100%)',
  'linear-gradient(135deg, #1A0A2A 0%, #1C1C1E 100%)',
  'linear-gradient(135deg, #0A2A1A 0%, #1C1C1E 100%)',
  'linear-gradient(135deg, #2A0A0A 0%, #1C1C1E 100%)',
  'linear-gradient(135deg, #1A1A00 0%, #1C1C1E 100%)',
];

// ─── Dashboard principal ──────────────────────────────────────────────────────
export const Dashboard: React.FC<Props> = ({ userProfile, onResetProfile }) => {
  const { currentUser, logout } = useAuth();

  const generated = useMemo(() => WorkoutGenerator.getWorkoutPlan(userProfile), [userProfile]);
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(`workouts_${currentUser?.uid}`, generated);

  const [activeTab, setActiveTab] = useState<'treinos' | 'atividades' | 'explorar' | 'exercicios' | 'corpo'>('treinos');
  const [view, setView] = useState<'home' | 'workout_list'>('home');
  const [activeDay, setActiveDay] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  const currentWorkout = workouts[activeDay];

  const firstName = (currentUser?.displayName ?? currentUser?.email?.split('@')[0] ?? 'Atleta').split(' ')[0];

  const filteredExercises = useMemo(() => {
    if (!search.trim()) return currentWorkout?.exercises ?? [];
    const q = search.toLowerCase();
    return (currentWorkout?.exercises ?? []).filter(ex =>
      ex.name.toLowerCase().includes(q) || ex.muscleGroup.some(m => m.toLowerCase().includes(q))
    );
  }, [currentWorkout, search]);

  const saveWorkoutDay = (dayIndex: number, exercises: Exercise[]) => {
    setWorkouts(workouts.map((w: Workout, i: number) => i === dayIndex ? { ...w, exercises } : w));
  };

  // Calcula progresso do treino ativo hoje
  const todayProgress = useMemo(() => {
    const exercises = currentWorkout?.exercises ?? [];
    if (exercises.length === 0) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const completed = exercises.filter(ex => {
      try {
        const history = JSON.parse(localStorage.getItem(`log_${ex.id}`) || '[]') as ExerciseSession[];
        return history.some(s => s.date === todayStr && s.sets.some(st => st.completed));
      } catch { return false; }
    }).length;
    return Math.round((completed / exercises.length) * 100);
  }, [currentWorkout]);

  const maisOpcoes = [
    { icon: <History sx={{ fontSize: 20, color: C.orange }} />, label: 'Histórico de treinos' },
    { icon: <LocalFireDepartment sx={{ fontSize: 20, color: C.orange }} />, label: 'Fadiga Muscular' },
    { icon: <NotificationsNone sx={{ fontSize: 20, color: C.orange }} />, label: 'Lembretes e notificações' },
    { icon: <StarOutlined sx={{ fontSize: 20, color: C.orange }} />, label: 'Avaliar o Aplicativo' },
    { icon: <Share sx={{ fontSize: 20, color: C.orange }} />, label: 'Compartilhar GymClaude' },
  ];

  // ── View: Lista de exercícios de um treino ────────────────────────────────
  const WorkoutListView = () => (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconButton onClick={() => { setView('home'); setSearch(''); }} size="small" sx={{ color: C.textSec, bgcolor: '#2C2C2E', '&:hover': { bgcolor: C.orangeDim, color: C.orange } }}>
          <ArrowBack fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 11, color: C.textSec, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
            {goalLabel[userProfile.goal]}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.textPri, lineHeight: 1.2 }}>
            {currentWorkout?.name}
          </Typography>
        </Box>
        <Box onClick={() => setEditingDay(activeDay)} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.8, py: 1, borderRadius: 2, cursor: 'pointer', bgcolor: '#2C2C2E', '&:hover': { bgcolor: C.orangeDim }, transition: 'background 0.15s' }}>
          <Edit sx={{ fontSize: 15, color: C.textSec }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.textSec }}>Editar</Typography>
        </Box>
      </Box>

      {/* Seletor de dias */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
          {workouts.map((w, i) => (
            <Box key={w.id} onClick={() => { setActiveDay(i); setSearch(''); }}
              sx={{ flexShrink: 0, px: 2, py: 1, borderRadius: 3, cursor: 'pointer', bgcolor: i === activeDay ? C.orange : '#2C2C2E', border: `1px solid ${i === activeDay ? C.orange : C.cardBorder}`, transition: 'all 0.2s' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: i === activeDay ? '#fff' : C.textSec, whiteSpace: 'nowrap' }}>
                Dia {i + 1}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Barra de busca */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.cardBorder}` }}>
          <Search sx={{ fontSize: 20, color: C.textSec }} />
          <InputBase fullWidth value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar exercícios..."
            sx={{ fontSize: 14, color: C.textPri, '& input::placeholder': { color: C.textMuted } }}
          />
          {search && (
            <IconButton size="small" onClick={() => setSearch('')} sx={{ color: C.textSec, p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Chips de info */}
      {currentWorkout && (
        <Box sx={{ px: 2.5, mb: 2, display: 'flex', gap: 1 }}>
          <Chip icon={<FitnessCenter sx={{ fontSize: '14px !important' }} />} label={`${currentWorkout.exercises.length} exercícios`} size="small" sx={{ bgcolor: C.orangeDim, color: C.orange, border: `1px solid ${C.orangeBorder}`, fontSize: 11 }} />
          <Chip icon={<AccessTime sx={{ fontSize: '14px !important' }} />} label={`${currentWorkout.estimatedDuration} min`} size="small" sx={{ bgcolor: '#2C2C2E', color: C.textSec, fontSize: 11 }} />
        </Box>
      )}

      {/* Lista */}
      <Box sx={{ mx: 2.5, mb: 3, bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.cardBorder}`, overflow: 'hidden', flex: 1 }}>
        {filteredExercises.length === 0
          ? <Box sx={{ py: 5, textAlign: 'center' }}><Typography sx={{ color: C.textSec, fontSize: 14 }}>Nenhum exercício encontrado</Typography></Box>
          : filteredExercises.map(ex => <ExerciseRow key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />)
        }
      </Box>
    </Box>
  );

  // ── View: Home ────────────────────────────────────────────────────────────
  const HomeView = () => (
    <Box sx={{ flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* Header */}
      <Box sx={{ px: 2.5, pt: 4, pb: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 300, color: C.textPri, lineHeight: 1.1 }}>
            Olá, <Box component="span" sx={{ fontFamily: '"Bebas Neue"', fontWeight: 400, fontSize: 34, letterSpacing: 1 }}>{firstName}</Box>
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.textSec, mt: 0.5 }}>
            Prepare-se, hoje é dia de treino!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={logout} size="small" sx={{ color: C.textMuted, '&:hover': { color: C.textSec } }}>
            <Logout sx={{ fontSize: 18 }} />
          </IconButton>
          <Box onClick={onResetProfile} sx={{ cursor: 'pointer' }}>
            <Avatar src={currentUser?.photoURL ?? undefined} sx={{ width: 44, height: 44, border: `2.5px solid ${C.orange}` }} />
          </Box>
        </Box>
      </Box>

      {/* Faixa de datas */}
      <DateStrip />

      {/* ── Treino Personalizado ── */}
      <SectionHeader title="Treino Personalizado" subtitle="Tonifique seus músculos com uma rotina individualizada" />
      <Box sx={{ px: 2.5, mb: 3 }}>
        <Box
          onClick={() => { setActiveDay(0); setView('workout_list'); }}
          sx={{ position: 'relative', p: 2.5, borderRadius: 3, bgcolor: C.card, border: `1px solid ${C.cardBorder}`, cursor: 'pointer', overflow: 'hidden', '&:hover': { border: `1px solid ${C.orangeBorder}` }, transition: 'border 0.2s' }}
        >
          {/* Linha decorativa laranja */}
          <Box sx={{ position: 'absolute', bottom: -20, right: 70, width: 160, height: 160, borderRadius: '50%', border: `2px solid ${C.orange}`, opacity: 0.4, pointerEvents: 'none' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.orange }}>{workouts[0]?.name ?? 'Treino Personalizado'}</Typography>
                <MoreVert sx={{ fontSize: 18, color: C.textSec }} />
              </Box>
              <Typography sx={{ fontSize: 12, color: C.textSec, mb: 2 }}>
                {goalLabel[userProfile.goal]} · Balanceado
              </Typography>
              <Typography sx={{ fontSize: 12, color: C.orange, fontWeight: 600, mb: 0.8 }}>
                Progresso {todayProgress}%
              </Typography>
              <Box sx={{ position: 'relative', height: 4, borderRadius: 2, bgcolor: '#2C2C2E' }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2, bgcolor: C.orange, width: `${Math.max(todayProgress, 3)}%`, transition: 'width 0.8s ease' }} />
                <Box sx={{ position: 'absolute', top: '50%', left: `${Math.max(todayProgress, 3)}%`, transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', bgcolor: C.orange, border: '2px solid #111' }} />
              </Box>
            </Box>
            {/* Ícone haltere */}
            <Box sx={{ ml: 2, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FitnessCenter sx={{ fontSize: 64, color: C.textMuted, opacity: 0.6 }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Meus treinos ── */}
      <SectionHeader title="Meus treinos" subtitle="Crie suas próprias rotinas de treino" />
      <Box sx={{ px: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', '::-webkit-scrollbar': { display: 'none' }, pb: 0.5 }}>
          {workouts.map((w, i) => (
            <Box key={w.id}
              onClick={() => { setActiveDay(i); setView('workout_list'); }}
              sx={{ position: 'relative', flexShrink: 0, width: 160, height: 130, borderRadius: 3, overflow: 'hidden', cursor: 'pointer', background: workoutGradients[i % workoutGradients.length], border: `1px solid ${C.cardBorder}`, '&:hover': { border: `1px solid ${C.orangeBorder}` }, transition: 'border 0.2s' }}
            >
              {/* Imagem de fundo */}
              <Box component="img"
                src={`https://images.unsplash.com/photo-${['1581009146145-b5ef050c2e1e', '1526506118085-60ce8714f8c5', '1574680096145-d05b474e2155', '1541534741688-7927b9f5d8fa', '1571019614242-c5c5dee9f50b', '1534438327276-14e5300c3a48'][i % 6]}?w=200&h=150&fit=crop&q=80`}
                alt={w.name}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
              />
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 20%, rgba(17,17,17,0.85) 100%)' }} />
              <Box sx={{ position: 'absolute', top: 10, right: 10 }}>
                <MoreVert sx={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
              </Box>
              <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.textPri, lineHeight: 1.2 }}>
                  {w.muscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' + ')}
                </Typography>
                <Typography sx={{ fontSize: 11, color: C.textSec, mt: 0.3 }}>
                  Dia {i + 1}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Treino Imediato ── */}
      <SectionHeader title="Treino Imediato" subtitle="Um novo treino sempre baseado nas suas preferências" />
      <Box sx={{ px: 2.5, mb: 3 }}>
        <Box
          onClick={() => { setActiveDay(0); setView('workout_list'); }}
          sx={{ position: 'relative', p: 2.5, borderRadius: 3, bgcolor: C.card, border: `1px solid ${C.cardBorder}`, cursor: 'pointer', overflow: 'hidden', '&:hover': { border: `1px solid ${C.orangeBorder}` }, transition: 'border 0.2s' }}
        >
          <Box sx={{ position: 'absolute', bottom: -10, right: 60, width: 120, height: 120, borderRadius: '50%', border: `2px solid ${C.orange}`, opacity: 0.35, pointerEvents: 'none' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.orange, mb: 0.4 }}>Treino Imediato</Typography>
              <Typography sx={{ fontSize: 13, color: C.textSec, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Começar agora <ChevronRight sx={{ fontSize: 16 }} />
              </Typography>
            </Box>
            <Box sx={{ width: 80, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Timer sx={{ fontSize: 56, color: C.textMuted, opacity: 0.55 }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Mais opções ── */}
      <SectionHeader title="Mais opções" />
      <Box sx={{ px: 2.5, mb: 4 }}>
        <Box sx={{ bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
          {maisOpcoes.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.8, borderBottom: i < maisOpcoes.length - 1 ? `1px solid ${C.cardBorder}` : 'none', cursor: 'pointer', transition: 'background 0.15s', '&:hover': { bgcolor: 'rgba(255,122,0,0.05)' } }}>
              <Box sx={{ width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </Box>
              <Typography sx={{ fontSize: 15, color: C.textPri, flex: 1 }}>{item.label}</Typography>
              <ChevronRight sx={{ fontSize: 18, color: C.textMuted }} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );

  // ── Placeholder para outras abas ──────────────────────────────────────────
  const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: C.textSec, fontFamily: '"Bebas Neue"', letterSpacing: 2 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, color: C.textMuted }}>Em breve</Typography>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', bgcolor: C.bg, maxWidth: 480, mx: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Conteúdo principal */}
      {activeTab === 'treinos' ? (
        view === 'home' ? <HomeView /> : <WorkoutListView />
      ) : activeTab === 'atividades' ? (
        <PlaceholderTab title="Atividades" />
      ) : activeTab === 'explorar' ? (
        <PlaceholderTab title="Explorar" />
      ) : activeTab === 'exercicios' ? (
        <PlaceholderTab title="Exercícios" />
      ) : (
        <PlaceholderTab title="Corpo" />
      )}

      {/* Barra de navegação inferior */}
      <Box sx={{ flexShrink: 0, bgcolor: C.card, borderTop: `1px solid ${C.cardBorder}`, px: 1, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
        {[
          { key: 'treinos', icon: <FitnessCenter sx={{ fontSize: 22 }} />, label: 'Treinos' },
          { key: 'atividades', icon: <BarChart sx={{ fontSize: 22 }} />, label: 'Atividades' },
          { key: 'explorar', icon: <Explore sx={{ fontSize: 22 }} />, label: 'Explorar' },
          { key: 'exercicios', icon: <Repeat sx={{ fontSize: 22 }} />, label: 'Exercícios' },
          { key: 'corpo', icon: <Person sx={{ fontSize: 22 }} />, label: 'Corpo' },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Box key={tab.key} onClick={() => { setActiveTab(tab.key as any); if (tab.key === 'treinos') setView('home'); }}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3, cursor: 'pointer', px: 1, py: 0.5, borderRadius: 3, transition: 'all 0.2s', ...(isActive ? { bgcolor: C.orange } : { '&:hover': { bgcolor: 'rgba(255,122,0,0.1)' } }) }}>
              <Box sx={{ color: isActive ? '#fff' : C.textSec }}>
                {tab.icon}
              </Box>
              <Typography sx={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#fff' : C.textSec, letterSpacing: 0.3 }}>
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Dialog: detalhe + registro de peso */}
      {selectedExercise && (
        <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />
      )}

      {/* Dialog: editor de treino */}
      {editingDay !== null && (
        <WorkoutEditor
          currentExercises={workouts[editingDay]?.exercises ?? []}
          onSave={exercises => saveWorkoutDay(editingDay, exercises)}
          onClose={() => setEditingDay(null)}
        />
      )}
    </Box>
  );
};
