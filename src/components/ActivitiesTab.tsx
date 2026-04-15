import React, { useState } from 'react';
import {
  Box, Typography, Chip, Dialog, DialogContent,
  Slide, IconButton, TextField, MenuItem,
} from '@mui/material';
import {
  FitnessCenter, AccessTime, EmojiEvents, LocalFireDepartment,
  DeleteForever, Add, ArrowBack, Check,
} from '@mui/icons-material';
import { useUserData } from '../contexts/UserDataContext';
import { WorkoutActivity } from '../types';

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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
  const actDate = isoString.split('T')[0];
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (actDate === todayStr) return `Hoje, ${timeStr}`;
  if (actDate === yesterdayStr) return `Ontem, ${timeStr}`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + `, ${timeStr}`;
}

function calcStreak(activities: WorkoutActivity[]): number {
  if (activities.length === 0) return 0;
  const activityDates = new Set(activities.map(a => a.endTime.split('T')[0]));
  let streak = 0;
  const current = new Date();
  while (true) {
    const dateStr = current.toISOString().split('T')[0];
    if (activityDates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Card de atividade ────────────────────────────────────────────────────────
const ActivityCard: React.FC<{ activity: WorkoutActivity; onDelete: () => void }> = ({ activity, onDelete }) => {
  const [confirming, setConfirming] = useState(false);

  const progress = activity.totalExercises > 0
    ? Math.round((activity.exercisesCompleted / activity.totalExercises) * 100)
    : 0;

  return (
    <Box sx={{
      mx: 2.5, mb: 2, p: 2.5, borderRadius: 3, bgcolor: C.card,
      border: `1px solid ${confirming ? 'rgba(255,68,68,0.35)' : C.cardBorder}`,
      position: 'relative', overflow: 'hidden', transition: 'border 0.2s',
    }}>
      {/* Linha decorativa */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
        bgcolor: confirming ? '#FF4444' : C.orange, borderRadius: '3px 0 0 3px', transition: 'background 0.2s',
      }} />

      <Box sx={{ pl: 0.5 }}>
        {/* Nome, data e botão delete */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: confirming ? '#FF8888' : C.orange, lineHeight: 1.2, flex: 1, mr: 1, transition: 'color 0.2s' }}>
            {activity.workoutName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Typography sx={{ fontSize: 11, color: C.textSec, mt: 0.2 }}>
              {formatDate(activity.endTime)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setConfirming(v => !v)}
              sx={{ color: confirming ? '#FF6666' : C.textMuted, p: 0.4, '&:hover': { color: '#FF6666', bgcolor: 'rgba(255,68,68,0.1)' } }}
            >
              <DeleteForever sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Confirmação de exclusão */}
        {confirming && (
          <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: '#FF8888', flex: 1 }}>
              Remover este registro?
            </Typography>
            <Box
              onClick={onDelete}
              sx={{ px: 1.5, py: 0.6, borderRadius: 2, cursor: 'pointer', bgcolor: '#FF4444', '&:hover': { bgcolor: '#FF6666' } }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Remover</Typography>
            </Box>
            <Box
              onClick={() => setConfirming(false)}
              sx={{ px: 1.5, py: 0.6, borderRadius: 2, cursor: 'pointer', bgcolor: '#2C2C2E', '&:hover': { bgcolor: '#3A3A3C' } }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: C.textSec }}>Cancelar</Typography>
            </Box>
          </Box>
        )}

        {/* Grupos musculares */}
        {activity.muscleGroups.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap', mb: 1.5 }}>
            {activity.muscleGroups.slice(0, 3).map(m => (
              <Chip key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} size="small"
                sx={{ bgcolor: C.orangeDim, color: C.orange, border: `1px solid ${C.orangeBorder}`, fontSize: 10, height: 20 }} />
            ))}
          </Box>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 2.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <AccessTime sx={{ fontSize: 14, color: C.textSec }} />
            <Typography sx={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>
              {formatDuration(activity.duration)}
            </Typography>
          </Box>
          {activity.totalExercises > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <FitnessCenter sx={{ fontSize: 14, color: C.textSec }} />
              <Typography sx={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>
                {activity.exercisesCompleted}/{activity.totalExercises} exercícios
              </Typography>
            </Box>
          )}
        </Box>

        {/* Barra de progresso */}
        {activity.totalExercises > 0 && (
          <>
            <Box sx={{ position: 'relative', height: 4, borderRadius: 2, bgcolor: '#2C2C2E' }}>
              <Box sx={{
                position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2,
                bgcolor: C.orange, width: `${Math.max(progress, 3)}%`, transition: 'width 0.6s ease',
              }} />
            </Box>
            <Typography sx={{ fontSize: 10, color: C.textMuted, mt: 0.5 }}>
              {progress}% concluído
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

// ─── Formulário de registro manual ───────────────────────────────────────────
const ManualWorkoutDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { workouts, addActivity } = useUserData();

  const nowDate = new Date();
  const defaultDate = nowDate.toISOString().split('T')[0];
  const defaultTime = `${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

  const [selectedId, setSelectedId] = useState('');
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [duration, setDuration] = useState('');
  const [exercisesCompleted, setExercisesCompleted] = useState('');
  const [totalExercises, setTotalExercises] = useState('');

  const selectedWorkout = workouts.find(w => w.id === selectedId);
  const workoutName = selectedId === '__custom__' ? customName : (selectedWorkout?.name ?? '');
  const muscleGroups = selectedWorkout?.muscleGroups ?? [];
  const isValid = workoutName.trim().length > 0 && duration.trim().length > 0 && parseInt(duration) > 0;

  const handleSave = () => {
    if (!isValid) return;
    const startDateTime = new Date(`${date}T${time}`);
    const dur = Math.max(1, parseInt(duration));
    const endDateTime = new Date(startDateTime.getTime() + dur * 60000);
    const completed = parseInt(exercisesCompleted) || 0;
    const total = parseInt(totalExercises) || completed;

    const activity: WorkoutActivity = {
      id: `manual_${Date.now()}`,
      workoutId: selectedId || 'manual',
      workoutName: workoutName.trim(),
      muscleGroups,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: dur,
      exercisesCompleted: completed,
      totalExercises: total,
    };

    addActivity(activity);
    onClose();
  };

  const fieldSx = {
    '& .MuiInputBase-root': { bgcolor: '#2C2C2E', borderRadius: 2, color: C.textPri, fontSize: 14 },
    '& fieldset': { borderColor: C.cardBorder },
    '& .MuiInputBase-root:hover fieldset': { borderColor: C.orangeBorder },
    '& .MuiInputBase-root.Mui-focused fieldset': { borderColor: C.orange },
    '& .MuiInputLabel-root': { color: C.textSec },
    '& .MuiInputLabel-root.Mui-focused': { color: C.orange },
    '& .MuiSelect-icon': { color: C.textSec },
    '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
    '& input[type="time"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
  };

  return (
    <Dialog
      fullScreen open onClose={onClose}
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } as any, paper: { sx: { bgcolor: C.bg } } }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', maxWidth: 480, mx: 'auto', width: '100%' }}>

        {/* Header */}
        <Box sx={{ px: 2.5, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${C.cardBorder}` }}>
          <IconButton onClick={onClose} size="small" sx={{ color: C.textSec, bgcolor: '#2C2C2E', '&:hover': { bgcolor: C.orangeDim, color: C.orange } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 11, color: C.textSec, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
              Registro Manual
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.textPri, lineHeight: 1.2 }}>
              Registrar Treino
            </Typography>
          </Box>
        </Box>

        {/* Formulário */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, pt: 3, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5, '::-webkit-scrollbar': { display: 'none' } }}>

          {/* Treino */}
          <Box>
            <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
              Treino
            </Typography>
            <TextField
              select fullWidth label="Selecionar treino" value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setCustomName(''); }}
              sx={fieldSx}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="" sx={{ color: C.textSec, fontSize: 14 }}>— Escolha um treino —</MenuItem>
              {workouts.map(w => (
                <MenuItem key={w.id} value={w.id} sx={{ fontSize: 14 }}>{w.name}</MenuItem>
              ))}
              <MenuItem value="__custom__" sx={{ fontSize: 14, color: C.orange }}>+ Nome personalizado</MenuItem>
            </TextField>
            {selectedId === '__custom__' && (
              <TextField
                fullWidth label="Nome do treino" value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Ex: Treino de Peito"
                sx={{ ...fieldSx, mt: 1.5 }}
              />
            )}
          </Box>

          {/* Data e Hora */}
          <Box>
            <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
              Data e hora
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                type="date" label="Data" value={date}
                onChange={e => setDate(e.target.value)}
                sx={{ ...fieldSx, flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="time" label="Hora" value={time}
                onChange={e => setTime(e.target.value)}
                sx={{ ...fieldSx, flex: 1 }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          </Box>

          {/* Duração */}
          <Box>
            <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
              Duração (minutos) *
            </Typography>
            <TextField
              type="number" fullWidth label="Duração em minutos" value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Ex: 60"
              sx={fieldSx}
              slotProps={{ htmlInput: { min: 1 } }}
            />
          </Box>

          {/* Exercícios (opcional) */}
          <Box>
            <Typography sx={{ fontSize: 11, color: C.textSec, mb: 1, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
              Exercícios <Box component="span" sx={{ color: C.textMuted, textTransform: 'none', letterSpacing: 0 }}>(opcional)</Box>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                type="number" label="Concluídos" value={exercisesCompleted}
                onChange={e => setExercisesCompleted(e.target.value)}
                placeholder="0"
                sx={{ ...fieldSx, flex: 1 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                type="number" label="Total" value={totalExercises}
                onChange={e => setTotalExercises(e.target.value)}
                placeholder="0"
                sx={{ ...fieldSx, flex: 1 }}
                slotProps={{ htmlInput: { min: 0 } }}
              />
            </Box>
          </Box>
        </Box>

        {/* Botão salvar */}
        <Box sx={{ px: 2.5, pb: 3, pt: 1.5, borderTop: `1px solid ${C.cardBorder}` }}>
          <Box
            onClick={handleSave}
            sx={{
              py: 1.8, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
              cursor: isValid ? 'pointer' : 'default',
              bgcolor: isValid ? C.orange : '#2C2C2E',
              boxShadow: isValid ? `0 4px 20px rgba(255,122,0,0.35)` : 'none',
              transition: 'all 0.2s',
              '&:hover': isValid ? { bgcolor: C.orangeLight } : {},
            }}
          >
            <Check sx={{ fontSize: 20, color: isValid ? '#fff' : C.textMuted }} />
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: isValid ? '#fff' : C.textMuted }}>
              Salvar Registro
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ─── Aba principal ────────────────────────────────────────────────────────────
export const ActivitiesTab: React.FC = () => {
  const { workoutActivities, removeActivity } = useUserData();
  const [showManual, setShowManual] = useState(false);

  const sorted = [...workoutActivities].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  const totalMinutes = workoutActivities.reduce((acc, a) => acc + a.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const streak = calcStreak(workoutActivities);

  const stats = [
    { icon: <FitnessCenter sx={{ fontSize: 20, color: C.orange }} />, value: String(workoutActivities.length), label: 'Treinos' },
    { icon: <AccessTime sx={{ fontSize: 20, color: C.orange }} />, value: totalHours > 0 ? `${totalHours}h` : `${totalMinutes}min`, label: 'Total' },
    { icon: <LocalFireDepartment sx={{ fontSize: 20, color: C.orange }} />, value: String(streak), label: 'Sequência' },
  ];

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* Header */}
      <Box sx={{ px: 2.5, pt: 4, pb: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 300, color: C.textPri, lineHeight: 1.1 }}>
            Suas{' '}
            <Box component="span" sx={{ fontFamily: '"Bebas Neue"', fontWeight: 400, fontSize: 34, letterSpacing: 1 }}>
              Atividades
            </Box>
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.textSec, mt: 0.5 }}>
            Histórico completo dos seus treinos
          </Typography>
        </Box>
        {/* Botão registrar manualmente */}
        <Box
          onClick={() => setShowManual(true)}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.8, py: 1, borderRadius: 2.5, cursor: 'pointer', bgcolor: C.orangeDim, border: `1px solid ${C.orangeBorder}`, flexShrink: 0, '&:hover': { bgcolor: 'rgba(255,122,0,0.25)' }, transition: 'background 0.15s' }}
        >
          <Add sx={{ fontSize: 16, color: C.orange }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.orange }}>Registrar</Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ px: 2.5, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {stats.map((s, i) => (
            <Box key={i} sx={{
              flex: 1, p: 2, borderRadius: 3, bgcolor: C.card,
              border: `1px solid ${C.cardBorder}`, textAlign: 'center',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>{s.icon}</Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.textSec, mt: 0.3, fontWeight: 500 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Label lista */}
      <Box sx={{ px: 2.5, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.textPri }}>Histórico</Typography>
        {workoutActivities.length > 0 && (
          <Chip label={`${workoutActivities.length}`} size="small"
            sx={{ bgcolor: C.orangeDim, color: C.orange, border: `1px solid ${C.orangeBorder}`, fontSize: 11, height: 20 }} />
        )}
      </Box>

      {/* Lista */}
      {sorted.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 3, pb: 6 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: C.orangeDim, border: `1px solid ${C.orangeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmojiEvents sx={{ fontSize: 36, color: C.orange }} />
          </Box>
          <Typography sx={{ fontSize: 17, fontWeight: 700, color: C.textPri, textAlign: 'center' }}>
            Nenhum treino registrado
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.textSec, textAlign: 'center', lineHeight: 1.6 }}>
            Inicie um treino na aba Treinos e finalize, ou use o botão{' '}
            <Box component="span" sx={{ color: C.orange, fontWeight: 600 }}>Registrar</Box>{' '}
            para adicionar manualmente.
          </Typography>
          <Box
            onClick={() => setShowManual(true)}
            sx={{ mt: 1, px: 3, py: 1.5, borderRadius: 3, bgcolor: C.orange, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: C.orangeLight }, transition: 'background 0.15s' }}
          >
            <Add sx={{ fontSize: 18, color: '#fff' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Registrar treino</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ pb: 3 }}>
          {sorted.map(activity => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onDelete={() => removeActivity(activity.id)}
            />
          ))}
        </Box>
      )}

      {/* Dialog de registro manual */}
      {showManual && <ManualWorkoutDialog onClose={() => setShowManual(false)} />}
    </Box>
  );
};
