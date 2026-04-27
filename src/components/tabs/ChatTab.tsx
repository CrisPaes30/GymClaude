import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { SmartToy, Send } from '@mui/icons-material';
import { useUserData } from '../../contexts/UserDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { C } from '../../theme/tokens';

const DAILY_LIMIT = 20;

interface Message {
  role: 'user' | 'ai';
  text: string;
}

function buildGreeting(profile: any): Message {
  if (!profile) {
    return { role: 'ai', text: 'Olá! Sou o GymCoach, seu personal trainer de IA. Como posso te ajudar hoje?' };
  }
  const goalText = profile.goal === 'muscle_gain' ? 'ganhar massa muscular'
    : profile.goal === 'fat_loss' ? 'perder gordura'
    : 'manter a forma';
  return {
    role: 'ai',
    text: `Olá! Sou o GymCoach, seu personal trainer de IA. Vejo que seu objetivo é ${goalText} e você treina ${profile.trainingDays}x por semana. Estou aqui para te ajudar a evoluir. Pode me perguntar sobre técnica, progressão, dicas de treino ou qualquer dúvida!`,
  };
}

const TypingDots: React.FC = () => (
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

export const ChatTab: React.FC = () => {
  const { profile, workouts, workoutActivities } = useUserData();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>(() => [buildGreeting(profile)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const storageKey = `gymclaude_ai_${currentUser?.uid ?? 'anon'}_${today}`;
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
    workouts: workouts.map(w => ({ name: w.name, muscleGroups: w.muscleGroups })),
    recentActivities: [...workoutActivities]
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 7)
      .map(a => ({ workoutName: a.workoutName, duration: a.duration, date: a.endTime.split('T')[0] })),
  }), [profile, workouts, workoutActivities]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || remaining <= 0) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem(storageKey, String(newCount));

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
  }, [input, loading, remaining, dailyCount, messages, storageKey, userContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = input.trim().length > 0 && !loading && remaining > 0;

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
          <Typography sx={{
            fontSize: 11, fontWeight: 700,
            color: remaining > 5 ? C.green : remaining > 0 ? C.yellow : C.red,
          }}>
            {remaining}/{DAILY_LIMIT} hoje
          </Typography>
        </Box>
      </Box>

      {/* ── Mensagens ──────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2.5, '::-webkit-scrollbar': { display: 'none' } }}>
        {messages.map((msg, i) => (
          <Box key={i} sx={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            alignItems: 'flex-start',
            mb: 1.5,
          }}>
            {msg.role === 'ai' && (
              <Box sx={{ mr: 1, mt: 0.3 }}>
                <AiAvatar />
              </Box>
            )}
            <Box sx={{
              maxWidth: '78%',
              px: 2, py: 1.2,
              borderRadius: msg.role === 'user'
                ? '18px 18px 4px 18px'
                : '4px 18px 18px 18px',
              background: msg.role === 'user'
                ? `linear-gradient(135deg, ${C.greenDark}, ${C.green})`
                : C.cardHigh,
              border: msg.role === 'ai' ? `1px solid ${C.cardBorder}` : 'none',
            }}>
              <Typography sx={{
                fontSize: 14, lineHeight: 1.6,
                color: msg.role === 'user' ? '#000' : C.textPri,
                fontWeight: msg.role === 'user' ? 600 : 400,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Typing indicator */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ mr: 1, mt: 0.3 }}>
              <AiAvatar />
            </Box>
            <Box sx={{
              px: 2, py: 1.2, borderRadius: '4px 18px 18px 18px',
              bgcolor: C.cardHigh, border: `1px solid ${C.cardBorder}`,
            }}>
              <TypingDots />
            </Box>
          </Box>
        )}

        <div ref={bottomRef} />
      </Box>

      {/* ── Input ──────────────────────────────────────────────────────────── */}
      {remaining <= 0 ? (
        <Box sx={{
          px: 2.5, py: 2.5, borderTop: `1px solid ${C.line}`, flexShrink: 0,
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>
            Limite diário atingido.{'\n'}Volte amanhã para mais {DAILY_LIMIT} mensagens!
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          px: 2.5, py: 2, borderTop: `1px solid ${C.line}`, flexShrink: 0,
          display: 'flex', gap: 1.2, alignItems: 'center',
        }}>
          <Box
            component="input"
            ref={inputRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao GymCoach..."
            disabled={loading}
            sx={{
              flex: 1, boxSizing: 'border-box',
              bgcolor: C.cardHigh,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '14px',
              color: C.textPri,
              fontSize: 14,
              px: 2, py: 1.4,
              outline: 'none',
              fontFamily: '"DM Sans", Roboto, sans-serif',
              transition: 'border-color 0.2s',
              '&::placeholder': { color: C.textMuted },
              '&:focus': { borderColor: C.greenBorder },
            }}
          />
          <Box
            onClick={canSend ? send : undefined}
            sx={{
              width: 44, height: 44, borderRadius: '14px', flexShrink: 0,
              background: canSend
                ? `linear-gradient(135deg, ${C.greenDark}, ${C.green})`
                : C.cardHigh,
              border: `1px solid ${canSend ? 'transparent' : C.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'default',
              transition: 'all 0.2s',
              '&:hover': canSend ? { filter: 'brightness(1.1)' } : {},
              '&:active': canSend ? { transform: 'scale(0.94)' } : {},
            }}
          >
            <Send sx={{ fontSize: 17, color: canSend ? '#000' : C.textMuted }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
