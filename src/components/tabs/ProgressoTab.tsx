import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { Add, FitnessCenter, LocalFireDepartment, DeleteForever, FitnessCenterOutlined } from '@mui/icons-material';
import { useUserData } from '../../contexts/UserDataContext';
import { useWorkoutStats, Period } from '../../hooks/useWorkoutStats';
import { WorkoutActivity } from '../../types';
import { C } from '../../theme/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtDur  = (min: number) => min < 60 ? `${min}min` : `${Math.floor(min/60)}h${min%60>0?` ${min%60}min`:''}`;


function groupByDate(acts: WorkoutActivity[]) {
  const today = new Date().toISOString().split('T')[0];
  const yest  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const map   = new Map<string, WorkoutActivity[]>();
  for (const a of acts) {
    const d     = a.endTime.split('T')[0];
    const label = d === today ? 'Hoje' : d === yest ? 'Ontem' : new Date(a.endTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(a);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Helpers de período ───────────────────────────────────────────────────────
function getPeriodBounds(period: Period): { currStart: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7; // Monday=0
    const curr = new Date(now); curr.setDate(now.getDate() - dow); curr.setHours(0,0,0,0);
    const prev = new Date(curr); prev.setDate(curr.getDate() - 7);
    return { currStart: curr, prevStart: prev, prevEnd: curr };
  }
  if (period === 'month') {
    const curr = new Date(now.getFullYear(), now.getMonth(), 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { currStart: curr, prevStart: prev, prevEnd: curr };
  }
  const curr = new Date(now.getFullYear(), 0, 1);
  const prev = new Date(now.getFullYear() - 1, 0, 1);
  return { currStart: curr, prevStart: prev, prevEnd: curr };
}

function pctChange(curr: number, prev: number): { value: number; positive: boolean } | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return { value: 100, positive: true };
  const v = Math.round(((curr - prev) / prev) * 100);
  return { value: Math.abs(v), positive: v >= 0 };
}

function computeMuscleStats(activities: WorkoutActivity[]): Array<{ name: string; percentage: number; color: string }> {
  const freq: Record<string, number> = {};
  activities.forEach(a => a.muscleGroups.forEach(m => { const k = m.toLowerCase().trim(); freq[k] = (freq[k] || 0) + 1; }));
  if (!Object.keys(freq).length) return [];
  const max = Math.max(...Object.values(freq));
  const COLORS: Record<string, string> = {
    'peitoral': '#4ADE80', 'costas': '#60A5FA',
    'quadriceps': '#F97316', 'pernas': '#F97316', 'isquiotibiais': '#F97316',
    'glúteos': '#FBBF24', 'panturrilha': '#FB923C',
    'ombros': '#A78BFA', 'trapézio': '#818CF8',
    'biceps': '#34D399', 'triceps': '#34D399', 'braquiorradial': '#34D399',
    'abdômen': '#F43F5E', 'core': '#F43F5E', 'oblíquos': '#F43F5E',
  };
  return Object.entries(freq).sort(([,a],[,b]) => b - a).slice(0, 6).map(([m, count]) => ({
    name: m.charAt(0).toUpperCase() + m.slice(1),
    percentage: Math.round((count / max) * 100),
    color: COLORS[m] ?? '#6B7280',
  }));
}

// ─── Diagrama corporal SVG ────────────────────────────────────────────────────
const BodyDiagram: React.FC<{ stats: Array<{ name: string; percentage: number; color: string }> }> = ({ stats }) => {
  const lookup = new Map(stats.map(s => [s.name.toLowerCase(), s]));
  const fill = (muscles: string[], opacity = 0.65) => {
    for (const m of muscles) {
      const s = lookup.get(m);
      if (s) {
        const alpha = Math.round(opacity * (s.percentage / 100) * 255).toString(16).padStart(2, '0');
        return `${s.color}${alpha}`;
      }
    }
    return 'rgba(255,255,255,0.05)';
  };
  const ghost = 'rgba(255,255,255,0.07)';
  const border = 'rgba(255,255,255,0.1)';

  const chest   = fill(['peitoral']);
  const shoulder = fill(['ombros', 'trapézio']);
  const arms    = fill(['biceps', 'triceps', 'braquiorradial']);
  const legs    = fill(['pernas', 'quadriceps', 'isquiotibiais', 'glúteos', 'panturrilha']);
  const core    = fill(['abdômen', 'core', 'oblíquos']);

  return (
    <svg width="84" height="148" viewBox="0 0 84 148" style={{ display: 'block' }}>
      {/* Head */}
      <circle cx="42" cy="11" r="10" fill={ghost} stroke={border} strokeWidth="1" />
      {/* Neck */}
      <rect x="38" y="21" width="8" height="5" fill={ghost} />
      {/* Shoulders */}
      <ellipse cx="18" cy="33" rx="9" ry="6" fill={shoulder} />
      <ellipse cx="66" cy="33" rx="9" ry="6" fill={shoulder} />
      {/* Left arm */}
      <rect x="10" y="33" width="12" height="42" rx="5" fill={arms} stroke={border} strokeWidth="0.5" />
      {/* Right arm */}
      <rect x="62" y="33" width="12" height="42" rx="5" fill={arms} stroke={border} strokeWidth="0.5" />
      {/* Torso base */}
      <rect x="24" y="26" width="36" height="52" rx="7" fill={ghost} stroke={border} strokeWidth="1" />
      {/* Left pec */}
      <rect x="26" y="28" width="14" height="21" rx="4" fill={chest} />
      {/* Right pec */}
      <rect x="44" y="28" width="14" height="21" rx="4" fill={chest} />
      {/* Core */}
      <rect x="26" y="51" width="32" height="25" rx="3" fill={core} />
      {/* Hips */}
      <rect x="20" y="77" width="44" height="11" rx="5" fill={ghost} stroke={border} strokeWidth="0.5" />
      {/* Left leg */}
      <rect x="22" y="86" width="17" height="60" rx="6" fill={legs} stroke={border} strokeWidth="0.5" />
      {/* Right leg */}
      <rect x="45" y="86" width="17" height="60" rx="6" fill={legs} stroke={border} strokeWidth="0.5" />
    </svg>
  );
};

// ─── Seção: Desempenho nos treinos ────────────────────────────────────────────
const DesempenhoSection: React.FC<{ period: Period }> = ({ period }) => {
  const { workoutActivities, profile } = useUserData();
  const weight = profile?.weight ?? 75;

  const { currStart, prevStart, prevEnd } = getPeriodBounds(period);
  const curr = workoutActivities.filter(a => new Date(a.endTime) >= currStart);
  const prev = workoutActivities.filter(a => { const t = new Date(a.endTime); return t >= prevStart && t < prevEnd; });

  const currCal  = curr.reduce((s, a) => s + Math.round(a.duration * 6 * weight / 60), 0);
  const prevCal  = prev.reduce((s, a) => s + Math.round(a.duration * 6 * weight / 60), 0);
  // Volume estimado: duração × carga média estimada por exercício
  const currVol  = curr.reduce((s, a) => s + Math.round(a.exercisesCompleted * a.duration * 1.8), 0);
  const prevVol  = prev.reduce((s, a) => s + Math.round(a.exercisesCompleted * a.duration * 1.8), 0);

  const periodLabel = period === 'week' ? 'esta semana' : period === 'month' ? 'este mês' : 'este ano';

  const cols = [
    { label: 'Treinos', value: String(curr.length), change: pctChange(curr.length, prev.length), icon: '💪', color: C.green },
    { label: 'Volume',  value: currVol > 0 ? `${(currVol/1000).toFixed(1)}t` : '—', change: pctChange(currVol, prevVol), icon: '📊', color: C.blue },
    { label: 'Calorias', value: currCal > 0 ? `${currCal}` : '—', change: pctChange(currCal, prevCal), icon: '🔥', color: C.orange },
  ];

  return (
    <Box sx={{ mx: 2.5, mb: 2, p: 2.5, borderRadius: '18px', bgcolor: C.card, border: `1px solid ${C.cardBorder}` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: C.textPri }}>Desempenho nos treinos</Typography>
      </Box>
      <Typography sx={{ fontSize: 11, color: C.textMuted, mb: 2 }}>
        Comparando {periodLabel} com o período anterior · <Box component="span" sx={{ color: C.orange }}>Estimativas*</Box>
      </Typography>

      <Box sx={{ display: 'flex', gap: 0 }}>
        {cols.map((col, i) => (
          <Box key={i} sx={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', px: 0.5 }}>
            <Typography sx={{ fontSize: 18, mb: 0.5 }}>{col.icon}</Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 26, color: col.color, lineHeight: 1, letterSpacing: 0.5 }}>{col.value}</Typography>
            <Typography sx={{ fontSize: 10, color: C.textSec, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mt: 0.2 }}>{col.label}</Typography>
            {col.change && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, mt: 0.6, px: 1, py: 0.2, borderRadius: '20px', bgcolor: col.change.positive ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.1)', border: `1px solid ${col.change.positive ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 800, color: col.change.positive ? C.green : C.red }}>
                  {col.change.positive ? '↑' : '↓'} {col.change.value}%
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${C.line}` }}>
        <Typography sx={{ fontSize: 10, color: C.textMuted, lineHeight: 1.6 }}>
          * Valores estimados com base nos treinos registrados. Calorias usam MET = 6 para musculação. Volume é uma aproximação e não representa carga real.
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Seção: Grupos musculares ─────────────────────────────────────────────────
const GruposMusculares: React.FC<{ activities: WorkoutActivity[] }> = ({ activities }) => {
  const stats = computeMuscleStats(activities);

  return (
    <Box sx={{ mx: 2.5, mb: 2, p: 2.5, borderRadius: '18px', bgcolor: C.card, border: `1px solid ${C.cardBorder}` }}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, color: C.textPri, mb: 0.5 }}>Grupos musculares</Typography>
      <Typography sx={{ fontSize: 11, color: C.textMuted, mb: 2 }}>
        Baseado nos treinos registrados · Frequência relativa
      </Typography>

      {stats.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: C.textMuted, textAlign: 'center', py: 2 }}>
          Registre treinos para ver a distribuição muscular
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Diagrama corporal */}
          <Box sx={{ flexShrink: 0 }}>
            <BodyDiagram stats={stats} />
          </Box>

          {/* Barras de grupos */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.2, pt: 0.5 }}>
            {stats.map(s => (
              <Box key={s.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0, boxShadow: `0 0 6px ${s.color}` }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{s.name}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.percentage}%</Typography>
                </Box>
                <Box sx={{ height: 5, borderRadius: 3, bgcolor: C.faint, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', borderRadius: 3, bgcolor: s.color, width: `${s.percentage}%`, boxShadow: `0 0 8px ${s.color}88`, transition: 'width 0.8s ease' }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ─── Card de métrica ──────────────────────────────────────────────────────────
const MetricCard: React.FC<{ icon: React.ReactNode; value: string; label: string; highlight?: boolean; accentBg?: string; accentBorder?: string }> = ({ icon, value, label, highlight, accentBg, accentBorder }) => (
  <Box sx={{
    flex: 1, p: 2, borderRadius: '16px', textAlign: 'center',
    background: accentBg ? `linear-gradient(160deg, ${accentBg} 0%, ${C.card} 100%)` : C.card,
    border: `1px solid ${accentBorder ?? (highlight ? C.greenBorder : C.cardBorder)}`,
    boxShadow: highlight ? `0 4px 24px rgba(74,222,128,0.25)` : 'none',
    transition: 'all 0.2s',
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.8 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: '10px', bgcolor: accentBg ? accentBg : C.faint, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: accentBg ? `0 0 12px ${accentBg}` : 'none' }}>{icon}</Box>
    </Box>
    <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 26, color: C.textPri, lineHeight: 1, letterSpacing: 1 }}>{value}</Typography>
    <Typography sx={{ fontSize: 10, color: C.textSec, mt: 0.3, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Typography>
  </Box>
);

// ─── Item de timeline ─────────────────────────────────────────────────────────
const TimelineItem: React.FC<{ activity: WorkoutActivity; isLast: boolean; onDelete: () => void }> = ({ activity, isLast, onDelete }) => {
  const [open, setOpen]           = useState(false);
  const [confirming, setConfirming] = useState(false);
  const progress = activity.totalExercises > 0 ? Math.round((activity.exercisesCompleted / activity.totalExercises) * 100) : 0;

  return (
    <Box sx={{ display: 'flex', gap: 0 }}>
      <Box sx={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, pt: 0.4 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: C.green, boxShadow: `0 0 8px ${C.greenGlow}` }} />
        {!isLast && <Box sx={{ width: '1.5px', flex: 1, minHeight: 20, bgcolor: C.line, mt: '4px' }} />}
      </Box>
      <Box onClick={() => { setOpen(v => !v); if (confirming) setConfirming(false); }} sx={{ flex: 1, pb: isLast ? 0 : 3, cursor: 'pointer' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.textPri, flex: 1, lineHeight: 1.25 }}>{activity.workoutName}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexShrink: 0, mt: 0.1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.green, fontFamily: 'monospace' }}>{fmtDur(activity.duration)}</Typography>
            <Typography sx={{ fontSize: 11, color: C.textMuted }}>{fmtTime(activity.endTime)}</Typography>
          </Box>
        </Box>
        {activity.muscleGroups.length > 0 && (
          <Typography sx={{ fontSize: 12, color: C.textSec, mt: 0.3 }}>
            {activity.muscleGroups.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(' · ')}
          </Typography>
        )}
        {open && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${C.line}` }} onClick={e => e.stopPropagation()}>
            {activity.totalExercises > 0 && (
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.7 }}>
                  <Typography sx={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>Exercícios</Typography>
                  <Typography sx={{ fontSize: 11, color: C.textSec, fontFamily: 'monospace' }}>{activity.exercisesCompleted}/{activity.totalExercises} — {progress}%</Typography>
                </Box>
                <Box sx={{ height: 3, borderRadius: 2, bgcolor: C.faint, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${C.green}, ${C.greenDark})`, width: `${Math.max(progress, 2)}%`, boxShadow: `0 0 6px ${C.greenGlow}`, transition: 'width 0.6s ease' }} />
                </Box>
              </Box>
            )}
            {!confirming
              ? <Box onClick={() => setConfirming(true)} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, cursor: 'pointer', opacity: 0.55, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s' }}>
                  <DeleteForever sx={{ fontSize: 13, color: C.red }} />
                  <Typography sx={{ fontSize: 11, color: C.red, fontWeight: 600 }}>Remover registro</Typography>
                </Box>
              : <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: '#FCA5A5', flex: 1 }}>Remover este registro?</Typography>
                  <Box onClick={onDelete} sx={{ px: 1.5, py: 0.5, borderRadius: '8px', cursor: 'pointer', bgcolor: C.red }}><Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Sim</Typography></Box>
                  <Box onClick={() => setConfirming(false)} sx={{ px: 1.5, py: 0.5, borderRadius: '8px', cursor: 'pointer', bgcolor: C.faint, border: `1px solid ${C.line}` }}><Typography sx={{ fontSize: 11, color: C.textSec }}>Não</Typography></Box>
                </Box>
            }
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Dialog de registro manual ────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.2)', backgroundColor: '#1E1E26',
  color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', colorScheme: 'dark' as any,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)',
  letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8,
};

type VoiceState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

const ManualDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { workouts, addActivity } = useUserData();
  const now = new Date();
  const [selId, setSelId] = useState('');
  const [name,  setName]  = useState('');
  const [date,  setDate]  = useState(now.toISOString().split('T')[0]);
  const [time,  setTime]  = useState(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
  const [dur,   setDur]   = useState('');
  const [done,  setDone]  = useState('');
  const [total, setTotal] = useState('');
  const [transcript, setTranscript] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState('');

  const sel   = workouts.find(w => w.id === selId);
  const wName = selId === '__custom__' ? name : (sel?.name ?? '');
  const valid = wName.trim().length > 0 && parseInt(dur) > 0;

  const save = () => {
    if (!valid) return;
    const start = new Date(`${date}T${time}`);
    const d = Math.max(1, parseInt(dur));
    const c = parseInt(done)  || 0;
    const t = parseInt(total) || c;
    addActivity({ id: `manual_${Date.now()}`, workoutId: selId || 'manual', workoutName: wName.trim(), muscleGroups: sel?.muscleGroups ?? [], startTime: start.toISOString(), endTime: new Date(start.getTime() + d * 60000).toISOString(), duration: d, exercisesCompleted: c, totalExercises: t });
    onClose();
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError('Seu navegador não suporta reconhecimento de voz. Use o Chrome.');
      setVoiceState('error');
      return;
    }
    setVoiceError('');
    setVoiceState('recording');
    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (e: any) => {
      const text: string = e.results[0][0].transcript;
      setTranscript(text);
      setVoiceState('processing');
      try {
        const res = await fetch('/api/parse-workout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text }),
        });
        if (!res.ok) throw new Error('Erro no servidor');
        const data = await res.json();
        if (data.workoutName && data.workoutName !== 'Treino') {
          setSelId('__custom__');
          setName(data.workoutName);
        }
        if (data.duration > 0) setDur(String(data.duration));
        if (data.exercisesDone > 0) setDone(String(data.exercisesDone));
        if (data.exercisesTotal > 0) setTotal(String(data.exercisesTotal));
        setVoiceState('done');
      } catch {
        setVoiceError('Erro ao processar o áudio. Tente novamente.');
        setVoiceState('error');
      }
    };

    recognition.onerror = (e: any) => {
      const msgs: Record<string, string> = {
        'not-allowed': 'Permissão de microfone negada.',
        'no-speech': 'Nenhuma fala detectada. Tente novamente.',
        'network': 'Erro de rede no reconhecimento de voz.',
      };
      setVoiceError(msgs[e.error] ?? 'Erro no reconhecimento de voz.');
      setVoiceState('error');
    };

    recognition.start();
  };

  const voiceBtnLabel = voiceState === 'recording' ? '🎤 Ouvindo...' : voiceState === 'processing' ? '⏳ Processando...' : voiceState === 'done' ? '🎤 Gravar novamente' : '🎤 Registrar por voz';
  const voiceBtnColor = voiceState === 'recording' ? '#EF4444' : voiceState === 'processing' ? '#F59E0B' : '#3B82F6';

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: '#0D0D0F', display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", Roboto, sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '44px 20px 20px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '8px 12px', fontSize: 16, lineHeight: 1 }}>←</button>
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 2, fontWeight: 700 }}>Registro Manual</div>
          <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, color: '#fff', letterSpacing: '1.5px', lineHeight: 1 }}>NOVO TREINO</div>
        </div>
      </div>

      {/* Campos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* Botão de voz */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={startVoice}
            disabled={voiceState === 'recording' || voiceState === 'processing'}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${voiceBtnColor}`,
              background: voiceState === 'recording' ? 'rgba(239,68,68,0.12)' : voiceState === 'processing' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
              color: voiceBtnColor, fontSize: 14, fontWeight: 700, cursor: voiceState === 'processing' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.3px', transition: 'all 0.2s',
            }}
          >{voiceBtnLabel}</button>
          {voiceState === 'recording' && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Fale: "Treino de peito, 45 minutos, fiz 8 dos 10 exercícios"</span>
            </div>
          )}
          {voiceState === 'done' && transcript && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
              <div style={{ fontSize: 10, color: '#4ADE80', letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Transcrição</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>"{transcript}"</div>
            </div>
          )}
          {(voiceState === 'error') && voiceError && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444' }}>{voiceError}</div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>ou preencha manualmente</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Treino */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Treino</label>
          <select value={selId} onChange={e => { setSelId(e.target.value); setName(''); }}
            style={{ ...inputStyle, appearance: 'auto' }}>
            <option value="">— Escolha um treino —</option>
            {workouts.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            <option value="__custom__">+ Nome personalizado</option>
          </select>
          {selId === '__custom__' && (
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex: Treino de Peito" style={{ ...inputStyle, marginTop: 10 }} />
          )}
        </div>

        {/* Quando */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Quando · Duração</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <input type="number" value={dur} onChange={e => setDur(e.target.value)}
            placeholder="Duração em minutos *" min={1} style={inputStyle} />
        </div>

        {/* Exercícios */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ ...labelStyle, display: 'inline' }}>Exercícios </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>opcional</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Concluídos</label>
              <input type="number" value={done} onChange={e => setDone(e.target.value)} placeholder="0" min={0} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, fontSize: 10 }}>Total</label>
              <input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="0" min={0} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Salvar */}
      <div style={{ padding: '16px 20px 40px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={save} disabled={!valid} style={{
          width: '100%', padding: '18px', borderRadius: 14, border: 'none',
          background: valid ? 'linear-gradient(135deg, #22C55E, #4ADE80)' : 'rgba(255,255,255,0.06)',
          color: valid ? '#000' : 'rgba(255,255,255,0.3)',
          fontSize: 15, fontWeight: 700, cursor: valid ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit', letterSpacing: '0.3px',
          boxShadow: valid ? '0 6px 24px rgba(74,222,128,0.35)' : 'none',
          transition: 'all 0.2s',
        }}>
          ✓ Salvar Registro
        </button>
      </div>
    </div>,
    document.body
  );
};

// ─── ProgressoTab ─────────────────────────────────────────────────────────────
export const ProgressoTab: React.FC = () => {
  const { removeActivity } = useUserData();
  const [period, setPeriod]   = useState<Period>('month');
  const [showManual, setShowManual] = useState(false);
  const stats = useWorkoutStats(period);

  const sorted = [...stats.filteredActivities].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
  const groups = groupByDate(sorted);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* Header */}
      <Box sx={{ px: 2.5, pt: 4, pb: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontSize: 9, color: C.textMuted, letterSpacing: 3, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Resultados</Typography>
          <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 38, letterSpacing: 2, color: C.textPri, lineHeight: 0.9 }}>Progresso</Typography>
        </Box>
        <Box onClick={() => setShowManual(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.6, py: 0.9, borderRadius: '12px', cursor: 'pointer', background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`, boxShadow: `0 4px 16px ${C.greenGlow}`, '&:hover': { filter: 'brightness(1.1)' }, transition: 'all 0.15s' }}>
          <Add sx={{ fontSize: 14, color: '#000' }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#000' }}>Registrar</Typography>
        </Box>
      </Box>

      {/* Filtro de período */}
      <Box sx={{ px: 2.5, mb: 2.5, display: 'flex', gap: 1 }}>
        {(['week','month','year'] as Period[]).map(p => {
          const label = p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano';
          const active = period === p;
          return (
            <Box key={p} onClick={() => setPeriod(p)} sx={{ px: 2, py: 0.8, borderRadius: '20px', cursor: 'pointer', bgcolor: active ? C.green : C.card, border: `1px solid ${active ? C.green : C.cardBorder}`, transition: 'all 0.2s' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: active ? '#000' : C.textSec }}>{label}</Typography>
            </Box>
          );
        })}
      </Box>

      {/* Métricas */}
      <Box sx={{ px: 2.5, mb: 3, display: 'flex', gap: 1.5 }}>
        <MetricCard icon={<FitnessCenter sx={{ fontSize: 16, color: C.green }} />} value={String(stats.trainingCount)} label="Treinos" highlight={stats.trainingCount > 0} accentBg="rgba(74,222,128,0.12)" accentBorder={C.greenBorder} />
        <MetricCard icon={<FitnessCenterOutlined sx={{ fontSize: 16, color: C.blue }} />} value={stats.volumeKg > 0 ? `${stats.volumeKg}` : '—'} label="Volume kg" accentBg="rgba(96,165,250,0.1)" accentBorder="rgba(96,165,250,0.2)" />
        <MetricCard icon={<LocalFireDepartment sx={{ fontSize: 16, color: C.orange }} />} value={stats.caloriesTotal > 0 ? `${stats.caloriesTotal}` : '—'} label="Calorias" accentBg={C.orangeDim} accentBorder="rgba(249,115,22,0.22)" />
      </Box>

      {/* Desempenho nos treinos */}
      <DesempenhoSection period={period} />

      {/* Grupos musculares */}
      <GruposMusculares activities={stats.filteredActivities} />

      {/* Label histórico */}
      <Box sx={{ px: 2.5, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: 10, color: C.textMuted, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}>Histórico</Typography>
        {stats.filteredActivities.length > 0 && (
          <Box sx={{ px: 1, py: 0.2, borderRadius: '6px', bgcolor: C.greenDim, border: `1px solid ${C.greenBorder}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.green }}>{stats.filteredActivities.length}</Typography>
          </Box>
        )}
      </Box>

      {/* Timeline ou empty state */}
      {sorted.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 4, pb: 8 }}>
          <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 20, color: C.textMuted, letterSpacing: 2 }}>Sem registros</Typography>
          <Typography sx={{ fontSize: 13, color: C.textSec, textAlign: 'center', lineHeight: 1.7 }}>Finalize um treino ou use o botão Registrar.</Typography>
          <Box onClick={() => setShowManual(true)} sx={{ px: 3, py: 1.4, borderRadius: '14px', background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`, boxShadow: `0 6px 20px ${C.greenGlow}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { filter: 'brightness(1.1)' } }}>
            <Add sx={{ fontSize: 17, color: '#000' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#000' }}>Registrar treino</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ px: 2.5, pb: 4 }}>
          {groups.map((group, gi) => (
            <Box key={gi}>
              <Typography sx={{ fontSize: 10, color: C.textMuted, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', mb: 2, mt: gi > 0 ? 3 : 0 }}>{group.label}</Typography>
              {group.items.map((a, ai) => (
                <TimelineItem key={a.id} activity={a} isLast={gi === groups.length - 1 && ai === group.items.length - 1} onDelete={() => removeActivity(a.id)} />
              ))}
            </Box>
          ))}
        </Box>
      )}

      {showManual && <ManualDialog onClose={() => setShowManual(false)} />}
    </Box>
  );
};
