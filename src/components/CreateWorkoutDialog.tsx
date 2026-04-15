import React, { useState, useMemo } from 'react';
import {
  Box, Typography, IconButton, InputBase,
  Chip, Dialog, DialogContent, Slide, TextField
} from '@mui/material';
import { Close, Search, Add, Check, Lightbulb, FitnessCenter } from '@mui/icons-material';
import { Exercise, Workout } from '../types';
import { exercisesDatabase } from '../data/exercises';
import { getSuggestedExercises, getSuggestionReason } from '../utils/exerciseSuggestions';
import { getExerciseThumbnail } from '../utils/exerciseImages';

const C = {
  orange: '#FF7A00',
  orangeDim: 'rgba(255,122,0,0.15)',
  orangeBorder: 'rgba(255,122,0,0.3)',
  bg: '#111111',
  card: '#1C1C1E',
  cardBorder: 'rgba(255,255,255,0.07)',
  textPri: '#FFFFFF',
  textSec: '#8E8E93',
  textMuted: '#48484A',
};

const ALL_GROUPS = [
  'peitoral', 'costas', 'quadriceps', 'glúteos', 'isquiotibiais',
  'ombros', 'biceps', 'triceps', 'abdômen', 'panturrilha', 'trapézio',
];

interface Props {
  onSave: (workout: Workout) => void;
  onClose: () => void;
}

export const CreateWorkoutDialog: React.FC<Props> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Exercise | null>(null);
  const [nameError, setNameError] = useState(false);

  const selectedIds = useMemo(() => new Set(selected.map(e => e.id)), [selected]);

  const filtered = useMemo(() => exercisesDatabase.filter(ex => {
    const matchSearch = !search.trim() ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.some(m => m.toLowerCase().includes(search.toLowerCase()));
    const matchGroup = !filterGroup || ex.muscleGroup.includes(filterGroup);
    return matchSearch && matchGroup;
  }), [search, filterGroup]);

  const suggestions = useMemo(() => {
    if (!lastAdded) return [];
    return getSuggestedExercises(lastAdded, exercisesDatabase, Array.from(selectedIds), 3);
  }, [lastAdded, selectedIds]);

  const toggle = (exercise: Exercise) => {
    if (selectedIds.has(exercise.id)) {
      setSelected(prev => prev.filter(e => e.id !== exercise.id));
      if (lastAdded?.id === exercise.id) setLastAdded(null);
    } else {
      setSelected(prev => [...prev, exercise]);
      setLastAdded(exercise);
    }
  };

  const handleSave = () => {
    if (!name.trim()) { setNameError(true); return; }
    if (selected.length === 0) return;

    const muscleGroups = selected.flatMap(e => e.muscleGroup).filter((m, i, arr) => arr.indexOf(m) === i);
    const estimatedDuration = selected.length * 8;

    const workout: Workout = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      exercises: selected,
      muscleGroups,
      difficulty: 'intermediate',
      estimatedDuration,
    };
    onSave(workout);
    onClose();
  };

  return (
    <Dialog
      fullScreen open onClose={onClose}
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } as any, paper: { sx: { bgcolor: C.bg } } }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, pt: 3, pb: 2, borderBottom: `1px solid ${C.cardBorder}` }}>
          <IconButton onClick={onClose} sx={{ color: C.textSec }}>
            <Close />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Bebas Neue"', fontSize: 22, letterSpacing: 2, color: C.textPri, lineHeight: 1 }}>
              Novo Treino
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.textSec }}>
              {selected.length} exercício{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box
            onClick={handleSave}
            sx={{
              px: 2.5, py: 1, borderRadius: 2.5, cursor: 'pointer',
              bgcolor: selected.length > 0 && name.trim() ? C.orange : '#2C2C2E',
              transition: 'background 0.2s',
              '&:hover': { bgcolor: selected.length > 0 && name.trim() ? '#FF9A33' : '#3A3A3C' },
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Salvar</Typography>
          </Box>
        </Box>

        {/* Nome do treino */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Nome do treino (ex: Braços Gigantes)"
            value={name}
            onChange={e => { setName(e.target.value); setNameError(false); }}
            error={nameError}
            helperText={nameError ? 'Dê um nome ao treino' : ''}
            sx={{
              '& .MuiInputBase-root': { bgcolor: C.card, borderRadius: 2, fontSize: 15, fontWeight: 600 },
              '& .MuiInputBase-input': { color: C.textPri, py: 1.4, px: 2 },
              '& .MuiInputBase-input::placeholder': { color: C.textMuted },
              '& fieldset': { borderColor: nameError ? '#FF4444' : C.cardBorder },
              '& .MuiInputBase-root:hover fieldset': { borderColor: C.orangeBorder },
              '& .MuiInputBase-root.Mui-focused fieldset': { borderColor: C.orange },
            }}
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
        </Box>

        {/* Search */}
        <Box sx={{ px: 2.5, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.cardBorder}` }}>
            <Search sx={{ fontSize: 18, color: C.textSec }} />
            <InputBase
              fullWidth value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar exercício..."
              sx={{ fontSize: 14, color: C.textPri, '& input::placeholder': { color: C.textMuted } }}
            />
            {search && (
              <IconButton size="small" onClick={() => setSearch('')} sx={{ color: C.textSec, p: 0.3 }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Filtros por grupo muscular */}
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
            <Chip label="Todos" size="small" onClick={() => setFilterGroup(null)}
              sx={{ flexShrink: 0, bgcolor: !filterGroup ? C.orange : C.card, color: !filterGroup ? '#fff' : C.textSec, border: `1px solid ${!filterGroup ? C.orange : C.cardBorder}`, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
            />
            {ALL_GROUPS.map(g => (
              <Chip key={g} label={g} size="small" onClick={() => setFilterGroup(filterGroup === g ? null : g)}
                sx={{ flexShrink: 0, textTransform: 'capitalize', bgcolor: filterGroup === g ? C.orange : C.card, color: filterGroup === g ? '#fff' : C.textSec, border: `1px solid ${filterGroup === g ? C.orange : C.cardBorder}`, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Sugestões */}
        {lastAdded && suggestions.length > 0 && (
          <Box sx={{ mx: 2.5, mb: 1.5, p: 2, borderRadius: 2.5, bgcolor: C.orangeDim, border: `1px solid ${C.orangeBorder}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Lightbulb sx={{ fontSize: 16, color: C.orange }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.orange }}>
                Sugerido com base em "{lastAdded.name}"
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestions.map(ex => (
                <Box key={ex.id} onClick={() => toggle(ex)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, borderRadius: 2, cursor: 'pointer', bgcolor: selectedIds.has(ex.id) ? C.orangeDim : C.card, border: `1px solid ${selectedIds.has(ex.id) ? C.orangeBorder : 'transparent'}`, transition: 'all 0.15s' }}>
                  <Box sx={{ width: 44, height: 38, borderRadius: 1.5, overflow: 'hidden', bgcolor: '#2C2C2E', flexShrink: 0 }}>
                    <Box component="img" src={getExerciseThumbnail(ex.muscleGroup)} alt={ex.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.textPri }}>{ex.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: C.orange }}>{getSuggestionReason(lastAdded, ex)}</Typography>
                  </Box>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, bgcolor: selectedIds.has(ex.id) ? C.orange : C.orangeDim, border: `1px solid ${selectedIds.has(ex.id) ? C.orange : C.orangeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedIds.has(ex.id) ? <Check sx={{ fontSize: 15, color: '#fff' }} /> : <Add sx={{ fontSize: 15, color: C.orange }} />}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Lista de exercícios */}
        <Box sx={{ flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { width: 4 }, '::-webkit-scrollbar-thumb': { bgcolor: '#2C2C2E', borderRadius: 2 } }}>
          <Typography sx={{ px: 2.5, py: 1, fontSize: 11, color: C.textSec, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
            {filtered.length} exercícios
          </Typography>
          <Box sx={{ mx: 2.5, mb: 3, bgcolor: C.card, borderRadius: 3, border: `1px solid ${C.cardBorder}`, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <FitnessCenter sx={{ fontSize: 32, color: C.textMuted }} />
                <Typography sx={{ color: C.textSec, fontSize: 14 }}>Nenhum exercício encontrado</Typography>
              </Box>
            ) : filtered.map((exercise, i) => {
              const isIn = selectedIds.has(exercise.id);
              return (
                <Box key={exercise.id} onClick={() => toggle(exercise)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, cursor: 'pointer', borderBottom: i < filtered.length - 1 ? `1px solid ${C.cardBorder}` : 'none', bgcolor: isIn ? C.orangeDim : 'transparent', transition: 'background 0.15s', '&:hover': { bgcolor: isIn ? 'rgba(255,122,0,0.2)' : 'rgba(255,255,255,0.03)' } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, bgcolor: isIn ? C.orange : '#2C2C2E', border: `1.5px solid ${isIn ? C.orange : C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                    {isIn ? <Check sx={{ fontSize: 15, color: '#fff' }} /> : <Add sx={{ fontSize: 15, color: C.textSec }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: isIn ? 700 : 500, color: isIn ? C.textPri : '#C0C0C8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exercise.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: C.textSec, mt: 0.2 }}>
                      {exercise.muscleGroup.slice(0, 2).join(' · ')}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 46, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0, bgcolor: '#2C2C2E' }}>
                    <Box component="img" src={getExerciseThumbnail(exercise.muscleGroup)} alt={exercise.name}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isIn ? 1 : 0.6 }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
