import React, { useState, useMemo } from 'react';
import {
  Box, Typography, IconButton, InputBase,
  Chip, Dialog, DialogContent, Slide
} from '@mui/material';
import {
  Close, Search, Add, Check, Lightbulb
} from '@mui/icons-material';
import { Exercise } from '../types';
import { exercisesDatabase } from '../data/exercises';
import { getSuggestedExercises, getSuggestionReason } from '../utils/exerciseSuggestions';
import { getExerciseThumbnail } from '../utils/exerciseImages';

const ALL_GROUPS = [
  'peitoral', 'costas', 'quadriceps', 'glúteos', 'isquiotibiais',
  'ombros', 'biceps', 'triceps', 'abdômen', 'panturrilha', 'trapézio',
];

interface Props {
  currentExercises: Exercise[];
  onSave: (exercises: Exercise[]) => void;
  onClose: () => void;
}

export const WorkoutEditor: React.FC<Props> = ({ currentExercises, onSave, onClose }) => {
  const [selected, setSelected] = useState<Exercise[]>(currentExercises);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<Exercise | null>(null);

  const selectedIds = useMemo(() => new Set(selected.map(e => e.id)), [selected]);

  const filtered = useMemo(() => {
    return exercisesDatabase.filter(ex => {
      const matchSearch = !search.trim() ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.some(m => m.toLowerCase().includes(search.toLowerCase()));
      const matchGroup = !filterGroup || ex.muscleGroup.includes(filterGroup);
      return matchSearch && matchGroup;
    });
  }, [search, filterGroup]);

  const suggestions = useMemo(() => {
    if (!lastAdded) return [];
    return getSuggestedExercises(lastAdded, exercisesDatabase, Array.from(selectedIds), 4);
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

  return (
    <Dialog
      fullScreen
      open
      onClose={onClose}
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } as any, paper: { sx: { bgcolor: '#0C0C14' } } }}
    >
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* Header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2.5, pt: 3, pb: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <IconButton onClick={onClose} sx={{ color: '#8B8BA7' }}>
            <Close />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontFamily: '"Bebas Neue"', letterSpacing: 2, color: '#F0F0FF' }}>
              Editar Treino
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#8B8BA7' }}>
              {selected.length} exercício{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {/* Salvar */}
          <Box
            onClick={() => { onSave(selected); onClose(); }}
            sx={{
              px: 2.5, py: 1, borderRadius: 2.5, cursor: 'pointer',
              bgcolor: '#7B3FE4',
              '&:hover': { bgcolor: '#9D6FF0' },
              '&:active': { bgcolor: '#5A1FBF' },
              transition: 'background 0.2s'
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Salvar</Typography>
          </Box>
        </Box>

        {/* Search */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.2, bgcolor: '#13131F', borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <Search sx={{ fontSize: 18, color: '#8B8BA7' }} />
            <InputBase
              fullWidth autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar exercício..."
              sx={{ fontSize: 14, color: '#F0F0FF', '& input::placeholder': { color: '#6B6B87' } }}
            />
            {search && (
              <IconButton size="small" onClick={() => setSearch('')} sx={{ color: '#8B8BA7', p: 0.3 }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Filtros por grupo muscular */}
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
            <Chip
              label="Todos"
              size="small"
              onClick={() => setFilterGroup(null)}
              sx={{
                flexShrink: 0,
                bgcolor: !filterGroup ? '#7B3FE4' : '#13131F',
                color: !filterGroup ? '#fff' : '#8B8BA7',
                border: `1px solid ${!filterGroup ? '#7B3FE4' : 'rgba(255,255,255,0.06)'}`,
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}
            />
            {ALL_GROUPS.map(g => (
              <Chip
                key={g} label={g} size="small"
                onClick={() => setFilterGroup(filterGroup === g ? null : g)}
                sx={{
                  flexShrink: 0, textTransform: 'capitalize',
                  bgcolor: filterGroup === g ? '#7B3FE4' : '#13131F',
                  color: filterGroup === g ? '#fff' : '#8B8BA7',
                  border: `1px solid ${filterGroup === g ? '#7B3FE4' : 'rgba(255,255,255,0.06)'}`,
                  fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Sugestões inteligentes */}
        {lastAdded && suggestions.length > 0 && (
          <Box sx={{ mx: 2.5, mb: 1.5, p: 2, borderRadius: 2.5, bgcolor: 'rgba(123,63,228,0.1)', border: '1px solid rgba(123,63,228,0.25)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Lightbulb sx={{ fontSize: 16, color: '#F59E0B' }} />
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>
                Sugerido com base em "{lastAdded.name}"
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestions.map(ex => (
                <Box
                  key={ex.id}
                  onClick={() => toggle(ex)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.2, borderRadius: 2, cursor: 'pointer',
                    bgcolor: selectedIds.has(ex.id) ? 'rgba(123,63,228,0.2)' : '#13131F',
                    border: `1px solid ${selectedIds.has(ex.id) ? 'rgba(123,63,228,0.5)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <Box sx={{
                    width: 44, height: 38, borderRadius: 1.5, overflow: 'hidden',
                    bgcolor: '#1A1A2E', flexShrink: 0
                  }}>
                    <Box component="img" src={getExerciseThumbnail(ex.muscleGroup)} alt={ex.name}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#F0F0FF' }}>{ex.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#A57BF0' }}>
                      {getSuggestionReason(lastAdded, ex)}
                    </Typography>
                  </Box>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: selectedIds.has(ex.id) ? '#7B3FE4' : 'rgba(123,63,228,0.15)',
                    border: `1px solid ${selectedIds.has(ex.id) ? '#7B3FE4' : 'rgba(123,63,228,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selectedIds.has(ex.id)
                      ? <Check sx={{ fontSize: 15, color: '#fff' }} />
                      : <Add sx={{ fontSize: 15, color: '#9D6FF0' }} />
                    }
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Lista de exercícios */}
        <Box sx={{ flex: 1, overflowY: 'auto', '::-webkit-scrollbar': { width: 4 }, '::-webkit-scrollbar-thumb': { bgcolor: '#2A2A3E', borderRadius: 2 } }}>
          <Typography sx={{ px: 2.5, py: 1, fontSize: 11, color: '#8B8BA7', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>
            {filtered.length} exercícios
          </Typography>

          <Box sx={{ mx: 2.5, mb: 3, bgcolor: '#13131F', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {filtered.map((exercise, i) => {
              const isIn = selectedIds.has(exercise.id);
              return (
                <Box
                  key={exercise.id}
                  onClick={() => toggle(exercise)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 2, py: 1.5, cursor: 'pointer',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    bgcolor: isIn ? 'rgba(123,63,228,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: isIn ? 'rgba(123,63,228,0.15)' : 'rgba(255,255,255,0.03)' },
                  }}
                >
                  {/* Checkbox */}
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    bgcolor: isIn ? '#7B3FE4' : '#1A1A2E',
                    border: `1.5px solid ${isIn ? '#7B3FE4' : 'rgba(255,255,255,0.12)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isIn
                      ? <Check sx={{ fontSize: 15, color: '#fff' }} />
                      : <Add sx={{ fontSize: 15, color: '#8B8BA7' }} />
                    }
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 14, fontWeight: isIn ? 700 : 500,
                      color: isIn ? '#F0F0FF' : '#C0C0D8',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {exercise.name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#8B8BA7', mt: 0.2 }}>
                      {exercise.muscleGroup.slice(0, 2).join(' · ')}
                    </Typography>
                  </Box>

                  {/* Thumbnail */}
                  <Box sx={{ width: 56, height: 46, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0, bgcolor: '#1A1A2E' }}>
                    <Box component="img"
                      src={getExerciseThumbnail(exercise.muscleGroup)}
                      alt={exercise.name}
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
