import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserDataProvider, useUserData } from './contexts/UserDataContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { UserProfileForm } from './components/UserProfileForm';
import { UserProfile } from './types';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#FF7A00', light: '#FF9A33', dark: '#CC6200' },
    secondary: { main: '#FF4D00' },
    background: { default: '#111111', paper: '#1C1C1E' },
    text: { primary: '#FFFFFF', secondary: '#8E8E93' },
    divider: 'rgba(255,255,255,0.07)',
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
  const { profile, setProfile, dataLoading } = useUserData();
  const [editingProfile, setEditingProfile] = React.useState(false);

  if (authLoading || (currentUser && dataLoading)) {
    return (
      <Box sx={{ height: '100vh', bgcolor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ width: 64, height: 64 }}>
          <img src="/logo.svg" alt="GymClaude" style={{ width: '100%', height: '100%' }} />
        </Box>
        <CircularProgress sx={{ color: '#FF7A00' }} size={28} />
      </Box>
    );
  }

  if (!currentUser) return <Login />;

  if (!profile || editingProfile) {
    return (
      <UserProfileForm
        initialProfile={profile ?? undefined}
        onComplete={(p: UserProfile) => { setProfile(p); setEditingProfile(false); }}
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
