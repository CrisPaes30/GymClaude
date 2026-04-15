import React, { useState } from 'react';
import {
  Container, Paper, Typography, Button, Box,
  TextField, Select, MenuItem, FormControl, InputLabel, Slider, Grid
} from '@mui/material';
import { FitnessCenter } from '@mui/icons-material';
import { UserProfile } from '../types';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export const UserProfileForm: React.FC<Props> = ({ onComplete }) => {
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    height: 170,
    weight: 70,
    goal: 'muscle_gain',
    experience: 'beginner',
    trainingDays: 3,
    trainingDuration: 60,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(profile);
  };

  const update = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <FitnessCenter color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Configure seu Perfil</Typography>
          <Typography variant="body2" color="text.secondary">
            Vamos personalizar seu treino
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={4}>
              <TextField
                fullWidth label="Idade" type="number"
                value={profile.age}
                onChange={e => update('age', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 10, max: 100 } }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Altura (cm)" type="number"
                value={profile.height}
                onChange={e => update('height', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 100, max: 250 } }}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth label="Peso (kg)" type="number"
                value={profile.weight}
                onChange={e => update('weight', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 30, max: 300 } }}
              />
            </Grid>

            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Objetivo</InputLabel>
                <Select value={profile.goal} label="Objetivo" onChange={e => update('goal', e.target.value)}>
                  <MenuItem value="muscle_gain">Ganho de Massa</MenuItem>
                  <MenuItem value="fat_loss">Perda de Gordura</MenuItem>
                  <MenuItem value="maintain">Manutenção</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Experiência</InputLabel>
                <Select value={profile.experience} label="Experiência" onChange={e => update('experience', e.target.value)}>
                  <MenuItem value="beginner">Iniciante</MenuItem>
                  <MenuItem value="intermediate">Intermediário</MenuItem>
                  <MenuItem value="advanced">Avançado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={12}>
              <Typography gutterBottom>
                Dias de treino por semana: <strong>{profile.trainingDays}</strong>
              </Typography>
              <Slider
                value={profile.trainingDays} min={1} max={6} step={1}
                marks onChange={(_, v) => update('trainingDays', v)}
              />
            </Grid>

            <Grid size={12}>
              <Typography gutterBottom>
                Duração do treino: <strong>{profile.trainingDuration} min</strong>
              </Typography>
              <Slider
                value={profile.trainingDuration} min={30} max={120} step={15}
                marks onChange={(_, v) => update('trainingDuration', v)}
              />
            </Grid>
          </Grid>

          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}>
            Gerar Meu Plano de Treino
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};
