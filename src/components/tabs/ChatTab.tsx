import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { SmartToy, Send, FitnessCenter, AccessTime, Check } from '@mui/icons-material';
import { useUserData } from '../../contexts/UserDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../theme/tokens';
import { Workout, Exercise } from '../../types';

const DAILY_LIMIT = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedWorkout {
  name: string;
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  exercises: Omit<Exercise, 'id'>[];
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  workout?: ParsedWorkout;
  isGenerating?: boolean;
}

// ─── Detecção de intenção de treino ───────────────────────────────────────────

function isWorkoutRequest(text: string): boolean {
  const t = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return (
    /\b(gera|gere|monta|monte|cria|crie|faz|faca|sugere|sugira|quero|preciso)\b/.test(t) &&
    /\btreino\b/.test(t)
  ) || /\b(me da|me de|cria|monta|gera)\b.*\btreino\b/.test(t)
    || /\btreino.*\b(para|pra)\b.*\b(mim|eu|hoje)\b/.test(t);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGreeting(profile: any): Message {
  if (!profile) return { role: 'ai', text: 'Olá! Sou o GymCoach, seu personal trainer de IA. Como posso te ajudar hoje?' };
  const goalText = profile.goal === 'muscle_gain' ? 'ganhar massa muscular'
    : profile.goal === 'fat_loss' ? 'perder gordura' : 'manter a forma';
  return {
    role: 'ai',
    text: `Olá! Sou o GymCoach, seu personal trainer de IA.\n\nSeu objetivo é ${goalText} e você treina ${profile.trainingDays}x por semana. Posso te ajudar com dicas, técnica, progressão ou montar um treino personalizado — é só pedir!`,
  };
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const TypingDots: React.FC<{ label?: string }> = ({ label }) => (
  <Box sx={{ display: 'flex', gap: 0.7, alignItems: 'center', px: 0.5, py: 0.3 }}>
    {[0, 1, 2].map(i => (
      <Box key={i} sx={{
        width: 7, height: 7, borderRadius: '50%', bgcolor: C.green,
        animation: 'gymDot 1.2s infinite ease-in-out',
        animationDelay: `${i * 0.18}s`,
        '@keyframes gymDot': {
          '0%, 80%, 100%': { opacity: 0.25, transform: 'scale(0.7)' },
          '40%': { opacity: 1, transform: 'scale(1)' },
        },
      }} />
    ))}
    {label && (
      <Typography sx={{ fontSize: 12, color: C.textMuted, ml: 0.5 }}>{label}</Typography>
    )}
  </Box>
);

const AiAvatar: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: `${size * 0.3}px`, flexShrink: 0,
    background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <SmartToy sx={{ fontSize: size * 0.58, color: '#000' }} />
  </Box>
);

const WorkoutSaveCard: React.FC<{ workout: ParsedWorkout; onSave: () => void }> = ({ workout, onSave }) => {
  const [saved, setSaved] = useState(false);

  const handleSave = () => { onSave(); setSaved(true); };

  const diffLabel = workout.difficulty === 'beginner' ? 'Iniciante'
    : workout.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado';
  const diffColor = workout.difficulty === 'beginner' ? C.green
    : workout.difficulty === 'intermediate' ? C.yellow : C.orange;

  const visible = workout.exercises.slice(0, 5);
  const extra = workout.exercises.length - 5;

  return (
    <Box sx={{ mt: 1.2, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.greenBorder}`, bgcolor: C.card }}>

      {/* Header */}
      <Box sx={{
        px: 2, py: 1.5,
        background: `linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,197,94,0.04))`,
        borderBottom: `1px solid ${C.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 19, letterSpacing: 1, color: C.textPri, lineHeight: 1, flex: 1, pr: 1 }}>
          {workout.name}
        </Typography>
        <Box sx={{ px: 1, py: 0.3, borderRadius: '6px', bgcolor: `${diffColor}22`, border: `1px solid ${diffColor}55`, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, color: diffColor, letterSpacing: 0.5 }}>{diffLabel}</Typography>
        </Box>
      </Box>

      {/* Stats + muscle groups */}
      <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 1.2, alignItems: 'center', borderBottom: `1px solid ${C.line}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AccessTime sx={{ fontSize: 13, color: C.textMuted }} />
          <Typography sx={{ fontSize: 12, color: C.textSec }}>{workout.estimatedDuration}min</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FitnessCenter sx={{ fontSize: 13, color: C.textMuted }} />
          <Typography sx={{ fontSize: 12, color: C.textSec }}>{workout.exercises.length} exercícios</Typography>
        </Box>
        {workout.muscleGroups.map(g => (
          <Box key={g} sx={{ px: 0.9, py: 0.2, borderRadius: '5px', bgcolor: C.greenDim, border: `1px solid ${C.greenBorder}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.green }}>{g}</Typography>
          </Box>
        ))}
      </Box>

      {/* Exercise list */}
      <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
        {visible.map((ex, i) => (
          <Box key={i} sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            py: 0.6, borderBottom: i < visible.length - 1 ? `1px solid ${C.line}` : 'none',
          }}>
            <Typography sx={{ fontSize: 12, color: C.textPri, fontWeight: 500, flex: 1, pr: 1 }}>{ex.name}</Typography>
            <Typography sx={{ fontSize: 11, color: C.textMuted, fontFamily: 'monospace', flexShrink: 0 }}>
              {ex.sets}×{ex.reps}
            </Typography>
          </Box>
        ))}
        {extra > 0 && (
          <Typography sx={{ fontSize: 11, color: C.textMuted, py: 0.5 }}>
            +{extra} exercício{extra > 1 ? 's' : ''}
          </Typography>
        )}
      </Box>

      {/* Save button */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box onClick={saved ? undefined : handleSave} sx={{
          py: 1, borderRadius: '10px', cursor: saved ? 'default' : 'pointer',
          background: saved ? C.greenDim : `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
          border: saved ? `1px solid ${C.greenBorder}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8,
          transition: 'all 0.2s',
          '&:hover': saved ? {} : { filter: 'brightness(1.1)' },
          '&:active': saved ? {} : { transform: 'scale(0.98)' },
        }}>
          {saved
            ? <Check sx={{ fontSize: 15, color: C.green }} />
            : <FitnessCenter sx={{ fontSize: 15, color: '#000' }} />}
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: saved ? C.green : '#000' }}>
            {saved ? 'Treino salvo! Veja na aba Treinos' : 'Salvar treino'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Sugestões rápidas ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Monta um treino de peito',
  'Cria treino de pernas',
  'Gera treino de costas e bíceps',
  'Como melhorar minha postura?',
];

// ─── Tab principal ────────────────────────────────────────────────────────────

export const ChatTab: React.FC = () => {
  const { profile, workouts, workoutActivities, addWorkout } = useUserData();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>(() => [buildGreeting(profile)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `treinaai_ai_${currentUser?.uid ?? 'anon'}_${today}`;
  const remaining = DAILY_LIMIT - dailyCount;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setDailyCount(stored ? parseInt(stored, 10) : 0);
  }, [storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const userContext = useMemo(() => ({
    profile,
    workouts: workouts.map(w => ({
      name: w.name,
      muscleGroups: w.muscleGroups,
      estimatedDuration: w.estimatedDuration,
      exercises: w.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, muscleGroup: e.muscleGroup })),
    })),
    recentActivities: [...workoutActivities]
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 7)
      .map(a => ({ workoutName: a.workoutName, duration: a.duration, date: a.endTime.split('T')[0] })),
  }), [profile, workouts, workoutActivities]);

  const handleSaveWorkout = useCallback((workout: ParsedWorkout) => {
    const ts = Date.now();
    const newWorkout: Workout = {
      id: `custom-ai-${ts}`,
      name: workout.name,
      muscleGroups: workout.muscleGroups,
      difficulty: workout.difficulty,
      estimatedDuration: workout.estimatedDuration,
      exercises: workout.exercises.map((ex, i) => ({
        ...(ex as Exercise),
        id: `ai_ex_${i}_${ts}`,
      })),
    };
    addWorkout(newWorkout);
  }, [addWorkout]);

  const consumeCredit = useCallback(() => {
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem(storageKey, String(newCount));
    return newCount;
  }, [dailyCount, storageKey]);

  // ── Geração de treino via endpoint dedicado ──────────────────────────────
  const generateWorkout = useCallback(async (text: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: text, profile }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const workout = data.workout as ParsedWorkout;
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Aqui está o treino personalizado que montei para você! Revise os exercícios e salve quando estiver pronto.`,
        workout,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Não consegui gerar o treino agora. Tente novamente em instantes!' }]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // ── Chat geral ───────────────────────────────────────────────────────────
  const sendChat = useCallback(async (text: string) => {
    setLoading(true);
    try {
      const history = messages.slice(1).slice(-10).map(m => ({ role: m.role, text: m.text }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, userContext }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Ops, tive um problema de conexão. Tente novamente!' }]);
    } finally {
      setLoading(false);
    }
  }, [messages, userContext]);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || remaining <= 0) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    if (!overrideText) setInput('');
    consumeCredit();

    if (isWorkoutRequest(text)) {
      await generateWorkout(text);
    } else {
      await sendChat(text);
    }
  }, [input, loading, remaining, consumeCredit, generateWorkout, sendChat]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const canSend = input.trim().length > 0 && !loading && remaining > 0;
  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, pt: 5, pb: 2, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '13px',
            background: `linear-gradient(135deg, ${C.greenDark}, ${C.green})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${C.greenGlow}`,
          }}>
            <SmartToy sx={{ fontSize: 23, color: '#000' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 9, color: C.textMuted, letterSpacing: 2.5, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1, mb: 0.3 }}>
              Personal Trainer
            </Typography>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 26, letterSpacing: 1.5, color: C.textPri, lineHeight: 1 }}>
              GymCoach IA
            </Typography>
          </Box>
        </Box>
        <Box sx={{
          px: 1.4, py: 0.6, borderRadius: '20px',
          bgcolor: remaining > 5 ? C.greenDim : remaining > 0 ? 'rgba(251,191,36,0.12)' : C.redDim,
          border: `1px solid ${remaining > 5 ? C.greenBorder : remaining > 0 ? 'rgba(251,191,36,0.3)' : C.redBorder}`,
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: remaining > 5 ? C.green : remaining > 0 ? C.yellow : C.red }}>
            {remaining}/{DAILY_LIMIT} hoje
          </Typography>
        </Box>
      </Box>

      {/* ── Mensagens ──────────────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: 'auto', px: 2.5, py: 2,
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        '::-webkit-scrollbar': { display: 'none' },
      }}>

        {/* Sugestões rápidas */}
        {showSuggestions && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 11, color: C.textMuted, mb: 1, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>
              Sugestões rápidas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
              {SUGGESTIONS.map(s => (
                <Box key={s} onClick={() => send(s)} sx={{
                  px: 1.5, py: 0.7, borderRadius: '20px', cursor: 'pointer',
                  bgcolor: C.cardHigh, border: `1px solid ${C.cardBorder}`,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: C.greenBorder, bgcolor: C.greenDim },
                  '&:active': { transform: 'scale(0.97)' },
                }}>
                  <Typography sx={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>{s}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {messages.map((msg, i) => (
          <Box key={i} sx={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-start',
            mb: 1.5,
          }}>
            {msg.role === 'ai' && <Box sx={{ mr: 1, mt: 0.3 }}><AiAvatar /></Box>}
            <Box sx={{ maxWidth: '85%' }}>
              <Box sx={{
                px: 2, py: 1.2,
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user' ? `linear-gradient(135deg, ${C.greenDark}, ${C.green})` : C.cardHigh,
                border: msg.role === 'ai' ? `1px solid ${C.cardBorder}` : 'none',
              }}>
                <Typography sx={{
                  fontSize: 14, lineHeight: 1.65,
                  color: msg.role === 'user' ? '#000' : C.textPri,
                  fontWeight: msg.role === 'user' ? 600 : 400,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </Typography>
              </Box>
              {msg.workout && (
                <WorkoutSaveCard
                  workout={msg.workout}
                  onSave={() => handleSaveWorkout(msg.workout!)}
                />
              )}
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ mr: 1, mt: 0.3 }}><AiAvatar /></Box>
            <Box sx={{ px: 2, py: 1.2, borderRadius: '4px 18px 18px 18px', bgcolor: C.cardHigh, border: `1px solid ${C.cardBorder}` }}>
              <TypingDots label={isWorkoutRequest(messages[messages.length - 1]?.text ?? '') ? 'Montando treino...' : undefined} />
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      {remaining <= 0 ? (
        <Box sx={{ px: 2.5, py: 2.5, borderTop: `1px solid ${C.line}`, flexShrink: 0, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            {`Limite diário atingido.\nVolte amanhã para mais ${DAILY_LIMIT} mensagens!`}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box
              component="input"
              ref={inputRef}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ou peça um treino..."
              disabled={loading}
              sx={{
                flex: 1, boxSizing: 'border-box',
                bgcolor: C.cardHigh, border: `1px solid ${C.cardBorder}`, borderRadius: '14px',
                color: C.textPri, fontSize: 14, px: 2, py: 1.4, outline: 'none',
                fontFamily: '"DM Sans", Roboto, sans-serif', transition: 'border-color 0.2s',
                '&::placeholder': { color: C.textMuted },
                '&:focus': { borderColor: C.greenBorder },
              }}
            />
            <Box onClick={canSend ? () => send() : undefined} sx={{
              width: 44, height: 44, borderRadius: '14px', flexShrink: 0,
              background: canSend ? `linear-gradient(135deg, ${C.greenDark}, ${C.green})` : C.cardHigh,
              border: `1px solid ${canSend ? 'transparent' : C.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'default', transition: 'all 0.2s',
              '&:hover': canSend ? { filter: 'brightness(1.1)' } : {},
              '&:active': canSend ? { transform: 'scale(0.94)' } : {},
            }}>
              <Send sx={{ fontSize: 17, color: canSend ? '#000' : C.textMuted }} />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
