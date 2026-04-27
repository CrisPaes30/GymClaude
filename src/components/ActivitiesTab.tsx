import React, { useState } from 'react';
import {
  Box, Typography, IconButton, TextField, MenuItem,
} from '@mui/material';
import {
  DeleteForever, Add, ArrowBack, Check,
  LocalFireDepartment, FitnessCenter, AccessTime,
} from '@mui/icons-material';
import { useUserData } from '../contexts/UserDataContext';
import { WorkoutActivity } from '../types';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  orange: '#FF7A00',
  orangeHot: '#FF4500',
  orangeLight: '#FFAA44',
  orangeGlow: 'rgba(255,122,0,0.28)',
  orangeDim: 'rgba(255,122,0,0.09)',
  orangeBorder: 'rgba(255,122,0,0.22)',
  bg: '#111111',
  panel: '#161618',
  line: 'rgba(255,255,255,0.07)',
  white: '#FFFFFF',
  sub: 'rgba(255,255,255,0.38)',
  muted: 'rgba(255,255,255,0.14)',
  faint: 'rgba(255,255,255,0.05)',
  red: '#EF4444',
  redDim: 'rgba(239,68,68,0.1)',
  redBorder: 'rgba(239,68,68,0.28)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const fmtDur = (min: number) => {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
};

function calcStreak(acts: WorkoutActivity[]): number {
  if (!acts.length) return 0;
  const dates = new Set(acts.map(a => a.endTime.split('T')[0]));
  let s = 0;
  const d = new Date();
  while (dates.has(d.toISOString().split('T')[0])) { s++; d.setDate(d.getDate() - 1); }
  return s;
}

function groupByDate(acts: WorkoutActivity[]) {
  const todayStr = new Date().toISOString().split('T')[0];
  const yestStr  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const map = new Map<string, WorkoutActivity[]>();
  for (const a of acts) {
    const d = a.endTime.split('T')[0];
    const label = d === todayStr ? 'Hoje'
      : d === yestStr ? 'Ontem'
      : new Date(a.endTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(a);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Tracker semanal ──────────────────────────────────────────────────────────
const WeekStrip: React.FC<{ activities: WorkoutActivity[] }> = ({ activities }) => {
  const trained = new Set(activities.map(a => a.endTime.split('T')[0]));
  const today = new Date();
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return {
      key: d.toISOString().split('T')[0],
      abbr: DAYS[d.getDay()].slice(0, 1),
      num: d.getDate(),
      isToday: i === 6,
      done: trained.has(d.toISOString().split('T')[0]),
    };
  });

  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 2.5, mb: 0 }}>
      {days.map(day => (
        <Box key={day.key} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          {/* Número do dia */}
          <Box sx={{
            width: '100%', py: 1.2, borderRadius: '12px',
            bgcolor: day.done ? T.orange : day.isToday ? T.orangeDim : T.faint,
            border: `1px solid ${day.done ? T.orange : day.isToday ? T.orangeBorder : T.line}`,
            boxShadow: day.done ? `0 2px 12px ${T.orangeGlow}` : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2,
            transition: 'all 0.2s',
          }}>
            <Typography sx={{
              fontSize: 14, fontWeight: 800, lineHeight: 1,
              color: day.done ? '#fff' : day.isToday ? T.orange : T.muted,
            }}>
              {day.num}
            </Typography>
            <Typography sx={{
              fontSize: 8, fontWeight: 700, letterSpacing: 0.3,
              color: day.done ? 'rgba(255,255,255,0.7)' : day.isToday ? T.orange : T.muted,
              textTransform: 'uppercase',
            }}>
              {day.abbr}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ─── Item de timeline ─────────────────────────────────────────────────────────
const TimelineItem: React.FC<{
  activity: WorkoutActivity;
  isLast: boolean;
  onDelete: () => void;
}> = ({ activity, isLast, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const progress = activity.totalExercises > 0
    ? Math.round((activity.exercisesCompleted / activity.totalExercises) * 100)
    : 0;

  return (
    <Box sx={{ display: 'flex', gap: 0 }}>
      {/* Linha + nó */}
      <Box sx={{ width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.4 }}>
        <Box sx={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0, zIndex: 1,
          bgcolor: T.orange, boxShadow: `0 0 10px ${T.orangeGlow}`,
        }} />
        {!isLast && (
          <Box sx={{ width: '1.5px', flex: 1, minHeight: 24, bgcolor: T.line, mt: '4px' }} />
        )}
      </Box>

      {/* Conteúdo */}
      <Box
        onClick={() => { setOpen(v => !v); if (confirming) setConfirming(false); }}
        sx={{ flex: 1, pb: isLast ? 0 : 3, cursor: 'pointer' }}
      >
        {/* Linha principal */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: T.white, lineHeight: 1.25, flex: 1 }}>
            {activity.workoutName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0, mt: 0.1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.orange, fontFamily: 'monospace' }}>
              {fmtDur(activity.duration)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: T.muted }}>
              {fmtTime(activity.endTime)}
            </Typography>
          </Box>
        </Box>

        {/* Grupos musculares */}
        {activity.muscleGroups.length > 0 && (
          <Typography sx={{ fontSize: 12, color: T.sub, mt: 0.3 }}>
            {activity.muscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' · ')}
          </Typography>
        )}

        {/* Detalhes expandidos */}
        {open && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${T.line}` }} onClick={e => e.stopPropagation()}>
            {activity.totalExercises > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography sx={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Exercícios
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: T.sub, fontFamily: 'monospace', fontWeight: 600 }}>
                    {activity.exercisesCompleted} / {activity.totalExercises} — {progress}%
                  </Typography>
                </Box>
                <Box sx={{ height: 2.5, borderRadius: 2, bgcolor: T.faint, overflow: 'hidden' }}>
                  <Box sx={{
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${T.orangeHot}, ${T.orangeLight})`,
                    width: `${Math.max(progress, 2)}%`,
                    boxShadow: `2px 0 8px ${T.orangeGlow}`,
                    transition: 'width 0.6s ease',
                  }} />
                </Box>
              </Box>
            )}

            {!confirming ? (
              <Box
                onClick={() => setConfirming(true)}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, cursor: 'pointer', opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s' }}
              >
                <DeleteForever sx={{ fontSize: 13, color: T.red }} />
                <Typography sx={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Remover registro</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: '#FCA5A5', flex: 1 }}>Remover este registro?</Typography>
                <Box onClick={onDelete} sx={{ px: 1.5, py: 0.5, borderRadius: '8px', cursor: 'pointer', bgcolor: T.red, '&:hover': { filter: 'brightness(1.15)' } }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Sim</Typography>
                </Box>
                <Box onClick={() => setConfirming(false)} sx={{ px: 1.5, py: 0.5, borderRadius: '8px', cursor: 'pointer', bgcolor: T.faint, border: `1px solid ${T.line}` }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, color: T.sub }}>Não</Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Tela de registro manual ──────────────────────────────────────────────────
const ManualWorkoutDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { workouts, addActivity } = useUserData();
  const now = new Date();

  const [selectedId, setSelectedId] = useState('');
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  const [duration, setDuration] = useState('');
  const [exDone, setExDone] = useState('');
  const [exTotal, setExTotal] = useState('');

  const sel = workouts.find(w => w.id === selectedId);
  const name = selectedId === '__custom__' ? customName : (sel?.name ?? '');
  const valid = name.trim().length > 0 && parseInt(duration) > 0;

  const save = () => {
    if (!valid) return;
    const start = new Date(`${date}T${time}`);
    const dur = Math.max(1, parseInt(duration));
    const done = parseInt(exDone) || 0;
    const total = parseInt(exTotal) || done;
    addActivity({
      id: `manual_${Date.now()}`,
      workoutId: selectedId || 'manual',
      workoutName: name.trim(),
      muscleGroups: sel?.muscleGroups ?? [],
      startTime: start.toISOString(),
      endTime: new Date(start.getTime() + dur * 60000).toISOString(),
      duration: dur,
      exercisesCompleted: done,
      totalExercises: total,
    });
    onClose();
  };

  const inputSx = {
    '& .MuiInputBase-root': { backgroundColor: '#2A2A2E', borderRadius: '12px', color: '#FFFFFF', fontSize: 15 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px' },
    '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,122,0,0.5)' },
    '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#FF7A00' },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#FF7A00' },
    '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.5)' },
    '& input[type="date"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
    '& input[type="time"]::-webkit-calendar-picker-indicator': { filter: 'invert(0.6)' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none' },
    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 1300,
      backgroundColor: '#111111',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 5, pb: 2.5, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <IconButton onClick={onClose} size="small" sx={{
          color: 'rgba(255,255,255,0.6)',
          backgroundColor: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          p: 0.9,
          '&:hover': { backgroundColor: 'rgba(255,122,0,0.15)', color: '#FF7A00', borderColor: 'rgba(255,122,0,0.4)' },
        }}>
          <ArrowBack sx={{ fontSize: 18 }} />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 2.5, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1, mb: 0.3 }}>
            Registro Manual
          </Typography>
          <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 28, letterSpacing: 1.5, color: '#FFFFFF', lineHeight: 1 }}>
            Novo Treino
          </Typography>
        </Box>
      </Box>

      <Box sx={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* Campos scrolláveis */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 3 }}>

        {/* Treino */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', mb: 1.5 }}>
            Treino
          </Typography>
          <TextField select fullWidth label="Selecionar treino" value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setCustomName(''); }}
            sx={inputSx}
            slotProps={{ inputLabel: { shrink: true } }}
          >
            <MenuItem value="" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>— Escolha um treino —</MenuItem>
            {workouts.map(w => <MenuItem key={w.id} value={w.id} sx={{ fontSize: 14 }}>{w.name}</MenuItem>)}
            <MenuItem value="__custom__" sx={{ fontSize: 13, color: '#FF7A00' }}>+ Nome personalizado</MenuItem>
          </TextField>
          {selectedId === '__custom__' && (
            <TextField fullWidth label="Nome do treino" value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Ex: Treino de Peito"
              sx={{ ...inputSx, mt: 1.5 }}
            />
          )}
        </Box>

        {/* Data, hora e duração */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', mb: 1.5 }}>
            Quando · Duração
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <TextField type="date" label="Data" value={date}
              onChange={e => setDate(e.target.value)}
              sx={{ ...inputSx, flex: 1 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField type="time" label="Hora" value={time}
              onChange={e => setTime(e.target.value)}
              sx={{ ...inputSx, flex: 1 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          <TextField type="number" fullWidth label="Duração em minutos *" value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="60"
            sx={inputSx}
            slotProps={{ htmlInput: { min: 1 } }}
          />
        </Box>

        {/* Exercícios (opcional) */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1.5 }}>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Exercícios
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
              opcional
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField type="number" label="Concluídos" value={exDone}
              onChange={e => setExDone(e.target.value)}
              placeholder="0"
              sx={{ ...inputSx, flex: 1 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField type="number" label="Total" value={exTotal}
              onChange={e => setExTotal(e.target.value)}
              placeholder="0"
              sx={{ ...inputSx, flex: 1 }}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
        </Box>

      </Box>

      {/* Botão salvar */}
      <Box sx={{ px: 2.5, pt: 2, pb: 4, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box onClick={save} sx={{
          py: 1.8, borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.2,
          cursor: valid ? 'pointer' : 'not-allowed',
          background: valid
            ? 'linear-gradient(135deg, #FF4500 0%, #FF7A00 50%, #FFAA44 100%)'
            : 'rgba(255,255,255,0.05)',
          boxShadow: valid ? '0 6px 28px rgba(255,122,0,0.35)' : 'none',
          border: `1px solid ${valid ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
          transition: 'all 0.2s',
          '&:hover': valid ? { filter: 'brightness(1.08)' } : {},
          '&:active': valid ? { transform: 'scale(0.98)' } : {},
        }}>
          <Check sx={{ fontSize: 18, color: valid ? '#fff' : 'rgba(255,255,255,0.25)' }} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: valid ? '#fff' : 'rgba(255,255,255,0.25)', letterSpacing: 0.3 }}>
            Salvar Registro
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Aba principal ────────────────────────────────────────────────────────────
export const ActivitiesTab: React.FC = () => {
  const { workoutActivities, removeActivity } = useUserData();
  const [showManual, setShowManual] = useState(false);

  const sorted = [...workoutActivities].sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  const totalMin  = workoutActivities.reduce((s, a) => s + a.duration, 0);
  const totalHStr = totalMin >= 60
    ? `${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? ` ${totalMin % 60}m` : ''}`
    : `${totalMin}min`;
  const streak  = calcStreak(workoutActivities);
  const groups  = groupByDate(sorted);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 4, pb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 9, color: T.muted, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
            Desempenho
          </Typography>
          <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 44, letterSpacing: 2, color: T.white, lineHeight: 0.88 }}>
            Atividades
          </Typography>
        </Box>
        <Box
          onClick={() => setShowManual(true)}
          sx={{
            mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.6,
            px: 1.6, py: 0.9, borderRadius: '12px', cursor: 'pointer',
            background: `linear-gradient(135deg, ${T.orangeHot}, ${T.orangeLight})`,
            boxShadow: `0 4px 18px ${T.orangeGlow}`,
            '&:hover': { filter: 'brightness(1.1)' },
            '&:active': { transform: 'scale(0.96)' },
            transition: 'all 0.15s',
          }}
        >
          <Add sx={{ fontSize: 14, color: '#fff' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: 0.2 }}>
            Registrar
          </Typography>
        </Box>
      </Box>

      {/* ── Tracker semanal ────────────────────────────────────────────────── */}
      <WeekStrip activities={workoutActivities} />

      {/* ── Bloco de stats editorial ────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 3, pb: 0 }}>

        {/* Linha divisora */}
        <Box sx={{ height: '1px', bgcolor: T.line, mb: 3 }} />

        {/* Streak em destaque (só mostra se > 0) */}
        {streak > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 3 }}>
            <Typography sx={{
              fontFamily: '"Bebas Neue"', fontSize: 80, color: T.orange,
              lineHeight: 0.82, letterSpacing: -2,
              textShadow: `0 0 40px ${T.orangeGlow}`,
            }}>
              {streak}
            </Typography>
            <Box sx={{ mb: 0.8, pb: 0.2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocalFireDepartment sx={{ fontSize: 14, color: T.orange }} />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {streak === 1 ? 'dia seguido' : 'dias seguidos'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: T.sub }}>Sequência atual</Typography>
            </Box>
          </Box>
        )}

        {/* Treinos + Tempo lado a lado */}
        <Box sx={{ display: 'flex', gap: 0, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
              <FitnessCenter sx={{ fontSize: 12, color: T.muted }} />
              <Typography sx={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Treinos
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 48, color: T.white, lineHeight: 0.9, letterSpacing: 1 }}>
              {workoutActivities.length}
            </Typography>
          </Box>
          <Box sx={{ width: '1px', bgcolor: T.line, mx: 3 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
              <AccessTime sx={{ fontSize: 12, color: T.muted }} />
              <Typography sx={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Tempo total
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 48, color: T.white, lineHeight: 0.9, letterSpacing: 1 }}>
              {workoutActivities.length === 0 ? '—' : totalHStr}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: '1px', bgcolor: T.line }} />
      </Box>

      {/* ── Timeline de atividades ─────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 4, pb: 8 }}>
          <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 22, color: T.muted, letterSpacing: 2 }}>
            Sem registros ainda
          </Typography>
          <Typography sx={{ fontSize: 13, color: T.sub, textAlign: 'center', lineHeight: 1.7 }}>
            Finalize um treino na aba Treinos ou use o botão Registrar para adicionar manualmente.
          </Typography>
          <Box onClick={() => setShowManual(true)} sx={{
            mt: 0.5, px: 3, py: 1.4, borderRadius: '14px',
            background: `linear-gradient(135deg, ${T.orangeHot}, ${T.orangeLight})`,
            boxShadow: `0 6px 22px ${T.orangeGlow}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
            '&:hover': { filter: 'brightness(1.1)' }, transition: 'all 0.15s',
          }}>
            <Add sx={{ fontSize: 17, color: '#fff' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Registrar treino</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2.5, pt: 3, pb: 4 }}>
          {groups.map((group, gi) => (
            <Box key={gi} sx={{ mb: gi < groups.length - 1 ? 1 : 0 }}>
              {/* Cabeçalho de data */}
              <Typography sx={{
                fontSize: 10, color: T.muted, fontWeight: 700,
                letterSpacing: 2, textTransform: 'uppercase',
                mb: 2, mt: gi > 0 ? 3 : 0,
              }}>
                {group.label}
              </Typography>

              {/* Itens de timeline */}
              {group.items.map((activity, ai) => {
                const isLast = gi === groups.length - 1 && ai === group.items.length - 1;
                return (
                  <TimelineItem
                    key={activity.id}
                    activity={activity}
                    isLast={isLast}
                    onDelete={() => removeActivity(activity.id)}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      )}

      {showManual && <ManualWorkoutDialog onClose={() => setShowManual(false)} />}
    </Box>
  );
};
