import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { UserProfileForm } from './components/UserProfileForm';
import { useLocalStorage } from './hooks/useLocalStorage';
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
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600 },
      },
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
  const { currentUser, loading } = useAuth();
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>('userProfile', null);

  if (loading) return null;
  if (!currentUser) return <Login />;
  if (!userProfile) return <UserProfileForm onComplete={(profile) => setUserProfile(profile)} />;

  return <Dashboard userProfile={userProfile} onResetProfile={() => setUserProfile(null)} />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
