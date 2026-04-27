import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { FitnessCenter, ChevronRight, Logout, Settings, History, Straighten, MilitaryTech } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useUserData } from '../../contexts/UserDataContext';
import { useWorkoutStats, calcStreak, uniqueActiveDays } from '../../hooks/useWorkoutStats';
import { C } from '../../theme/tokens';

interface Props {
  onResetProfile: () => void;
  onGoToProgresso: () => void;
}

export const PerfilTab: React.FC<Props> = ({ onResetProfile, onGoToProgresso }) => {
  const { currentUser, logout } = useAuth();
  const { workoutActivities } = useUserData();
  const stats = useWorkoutStats('year');

  const displayName = currentUser?.displayName ?? currentUser?.email?.split('@')[0] ?? 'Atleta';

  // XP bar fill
  const xpFill = stats.xpToLevelUp > 0 ? Math.min(1, stats.xpCurrentLevel / stats.xpToLevelUp) : 1;

  // Streak e dias ativos calculados de workoutActivities
  const streak = calcStreak(workoutActivities);
  const activeDays = uniqueActiveDays(workoutActivities);

  const menuItems = [
    { icon: <Straighten sx={{ fontSize: 20 }} />,  label: 'Editar perfil',         action: onResetProfile,   danger: false },
    { icon: <History sx={{ fontSize: 20 }} />,     label: 'Histórico de treinos',  action: onGoToProgresso,  danger: false },
    { icon: <MilitaryTech sx={{ fontSize: 20 }} />,label: 'Recordes pessoais',     action: undefined,        danger: false },
    { icon: <Settings sx={{ fontSize: 20 }} />,    label: 'Configurações',         action: undefined,        danger: false },
    { icon: <Logout sx={{ fontSize: 20 }} />,      label: 'Sair',                  action: logout,           danger: true  },
  ];

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { display: 'none' } }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 4, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: C.textPri }}>Perfil</Typography>
        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '20px', bgcolor: C.greenDim, border: `1px solid ${C.greenBorder}` }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.green }}>Nível {stats.currentLevel} · {stats.currentLevelName}</Typography>
        </Box>
      </Box>

      {/* ── Avatar hero ────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar src={currentUser?.photoURL ?? undefined} sx={{ width: 72, height: 72, border: `3px solid ${C.green}`, boxShadow: `0 0 20px ${C.greenGlow}` }} />
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', bgcolor: C.green, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FitnessCenter sx={{ fontSize: 10, color: '#000' }} />
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.textPri, lineHeight: 1.2 }}>{displayName}</Typography>
          <Typography sx={{ fontSize: 12, color: C.textSec, mt: 0.3 }}>{currentUser?.email}</Typography>
          {/* XP bar */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.7 }}>
              <Typography sx={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: 0.5 }}>⚡ {stats.xpCurrentLevel} XP</Typography>
              {stats.xpToLevelUp > 0 && <Typography sx={{ fontSize: 10, color: C.textMuted }}>+{stats.xpToLevelUp} p/ próximo</Typography>}
            </Box>
            <Box sx={{ height: 7, borderRadius: 4, bgcolor: C.faint, overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
              <Box sx={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${C.greenDark}, ${C.green}, #86EFAC)`, width: `${xpFill * 100}%`, boxShadow: `0 0 14px rgba(74,222,128,0.7)`, transition: 'width 1s ease' }} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <Box sx={{ mx: 2.5, mb: 2.5, p: 2, borderRadius: '16px', bgcolor: C.card, border: `1px solid ${C.cardBorder}`, display: 'flex' }}>
        {[
          { label: 'Treinos',     value: String(workoutActivities.length) },
          { label: 'Dias ativos', value: String(activeDays) },
          { label: 'Sequência',   value: `${streak}${streak > 0 ? ' 🔥' : ''}` },
        ].map((s, i) => (
          <Box key={i} sx={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? `1px solid ${C.line}` : 'none', py: 0.5 }}>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 28, color: C.textPri, lineHeight: 1, letterSpacing: 1 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: 10, color: C.textSec, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── Conquistas ─────────────────────────────────────────────────────── */}
      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.textPri }}>Conquistas</Typography>
          <Typography sx={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
            {stats.achievements.filter(a => a.unlocked).length}/{stats.achievements.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.2, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
          {stats.achievements.map(ach => (
            <Box key={ach.id} sx={{
              flexShrink: 0, width: 82, p: 1.5, borderRadius: '16px', textAlign: 'center',
              background: ach.unlocked
                ? `linear-gradient(160deg, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0.05) 100%)`
                : C.card,
              border: `1px solid ${ach.unlocked ? 'rgba(74,222,128,0.35)' : C.cardBorder}`,
              boxShadow: ach.unlocked ? `0 4px 20px rgba(74,222,128,0.3)` : 'none',
              opacity: ach.unlocked ? 1 : 0.38,
              transition: 'all 0.2s',
            }}>
              <Typography sx={{ fontSize: 26, lineHeight: 1.3 }}>{ach.icon}</Typography>
              <Typography sx={{ fontSize: 9, color: ach.unlocked ? C.green : C.textMuted, fontWeight: 800, lineHeight: 1.3, mt: 0.5, letterSpacing: 0.3 }}>{ach.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Menu de opções ──────────────────────────────────────────────────── */}
      <Box sx={{ mx: 2.5, mb: 4, borderRadius: '16px', bgcolor: C.card, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
        {menuItems.map((item, i) => (
          <Box key={i} onClick={item.action}
            sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.8, borderBottom: i < menuItems.length - 1 ? `1px solid ${C.line}` : 'none', cursor: item.action ? 'pointer' : 'default', transition: 'background 0.15s', '&:hover': item.action ? { bgcolor: item.danger ? C.redDim : C.faint } : {} }}>
            <Box sx={{ color: item.danger ? C.red : C.textSec }}>{item.icon}</Box>
            <Typography sx={{ flex: 1, fontSize: 15, color: item.danger ? C.red : C.textPri, fontWeight: item.danger ? 600 : 400 }}>{item.label}</Typography>
            {!item.danger && item.action && <ChevronRight sx={{ fontSize: 18, color: C.textMuted }} />}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
