import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <img src="/logo.jpg" alt="TreinaAI" style={{ width: 120, height: 120, borderRadius: 20, objectFit: 'cover' }} />
          </Box>
          <Typography component="h1" variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            TreinaAI
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Seu treino. Sua evolução.
          </Typography>

          <Box sx={{ mt: 2, width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Google />}
              onClick={handleLogin}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: '#4285f4',
                '&:hover': {
                  backgroundColor: '#357ae8',
                },
              }}
            >
              Entrar com Google
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Entre para ter acesso ao seu plano de treino personalizado
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};