import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserDataProvider, useUserData } from './contexts/UserDataContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { UserProfileForm } from './components/UserProfileForm';
import { UserProfile, Workout } from './types';
import { WorkoutGenerator } from './utils/workoutGenerator';


const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4ADE80', light: '#86EFAC', dark: '#22C55E' },
    secondary: { main: '#22C55E' },
    background: { default: '#0D0D0F', paper: '#161618' },
    text: { primary: '#FFFFFF', secondary: 'rgba(255,255,255,0.45)' },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: {
    fontFamily: '"DM Sans", "Roboto", sans-serif',
    h1: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 2 },
    h2: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 2 },
    h3: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 1.5 },
    h4: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 1.5 },
    h5: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: 1 },
    h6: { fontFamily: '"DM Sans", sans-serif', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiChip: {
      styleOverrides: { root: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 } },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 10,
        },
      },
    },
  },
});


const AppContent: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { profile, workouts, saveProfileAndWorkouts, dataLoading } = useUserData();
  const [editingProfile, setEditingProfile] = React.useState(false);

  if (authLoading || (currentUser && dataLoading)) {
    return (
      <Box sx={{ height: '100vh', bgcolor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: 64, height: 64 }}>
          <img src="/logo.jpg" alt="TreinaAI" style={{ width: '100%', height: '100%', borderRadius: 16 }} />
        </Box>
        <CircularProgress sx={{ color: '#4ADE80' }} size={28} />
      </Box>
    );
  }

  if (!currentUser) return <Login />;

  const handleProfileSave = (newProfile: UserProfile) => {
    // Sempre regenera os treinos da IA ao salvar o perfil.
    // Treinos personalizados (id começa com 'custom-') são preservados.
    const newGenerated = WorkoutGenerator.getWorkoutPlan(newProfile);
    const custom = workouts.filter((w: Workout) => w.id.startsWith('custom-'));
    saveProfileAndWorkouts(newProfile, [...newGenerated, ...custom]);
    setEditingProfile(false);
  };

  if (!profile || editingProfile) {
    return (
      <UserProfileForm
        initialProfile={profile ?? undefined}
        onComplete={handleProfileSave}
        onCancel={profile ? () => setEditingProfile(false) : undefined}
      />
    );
  }

  return (
    <Dashboard
      userProfile={profile}
      onResetProfile={() => setEditingProfile(true)}
    />
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserDataProvider>
          <AppContent />
        </UserDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
