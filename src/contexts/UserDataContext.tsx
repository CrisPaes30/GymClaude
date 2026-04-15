import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Workout, ExerciseSession } from '../types';
import { useAuth } from './AuthContext';

interface UserDataContextType {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  workouts: Workout[];
  setWorkouts: (w: Workout[]) => void;
  saveProfileAndWorkouts: (p: UserProfile, w: Workout[]) => void;
  exerciseLogs: Record<string, ExerciseSession[]>;
  setExerciseLog: (exerciseId: string, sessions: ExerciseSession[]) => void;
  dataLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType>({} as UserDataContextType);

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [workouts, setWorkoutsState] = useState<Workout[]>([]);
  const [exerciseLogs, setExerciseLogsState] = useState<Record<string, ExerciseSession[]>>({});
  const [dataLoading, setDataLoading] = useState(true);

  // ── Carrega dados do Firestore ao logar ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setProfileState(null);
      setWorkoutsState([]);
      setExerciseLogsState({});
      setDataLoading(false);
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      const uid = currentUser.uid;

      try {
        const profileSnap = await getDoc(doc(db, 'users', uid));
        let loadedProfile: UserProfile | null = null;
        if (profileSnap.exists() && profileSnap.data().profile) {
          loadedProfile = profileSnap.data().profile as UserProfile;
        } else {
          const lsProfile = localStorage.getItem('userProfile');
          if (lsProfile) loadedProfile = JSON.parse(lsProfile);
        }
        setProfileState(loadedProfile);

        const workoutsSnap = await getDoc(doc(db, 'users', uid, 'meta', 'workouts'));
        let loadedWorkouts: Workout[] = [];
        if (workoutsSnap.exists() && workoutsSnap.data().list) {
          loadedWorkouts = workoutsSnap.data().list as Workout[];
        } else {
          const lsWorkouts = localStorage.getItem(`workouts_${uid}`);
          if (lsWorkouts) loadedWorkouts = JSON.parse(lsWorkouts);
        }
        setWorkoutsState(loadedWorkouts);

        const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
        const logsMap: Record<string, ExerciseSession[]> = {};
        logsSnap.forEach(d => { logsMap[d.id] = d.data().sessions as ExerciseSession[]; });

        if (logsSnap.empty) {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('log_')) {
              try { logsMap[key.replace('log_', '')] = JSON.parse(localStorage.getItem(key) || '[]'); }
              catch { /* ignora */ }
            }
          });
        }
        setExerciseLogsState(logsMap);

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // ── Escreve no Firestore em background (sem bloquear UI) ─────────────────────
  const persistProfile = useCallback((p: UserProfile | null, uid: string) => {
    setDoc(doc(db, 'users', uid), { profile: p }, { merge: true })
      .catch(err => console.error('Erro ao salvar perfil:', err));
  }, []);

  const persistWorkouts = useCallback((w: Workout[], uid: string) => {
    setDoc(doc(db, 'users', uid, 'meta', 'workouts'), { list: w })
      .catch(err => console.error('Erro ao salvar treinos:', err));
  }, []);

  // ── Setters públicos ─────────────────────────────────────────────────────────
  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p);
    if (currentUser) persistProfile(p, currentUser.uid);
  }, [currentUser, persistProfile]);

  const setWorkouts = useCallback((w: Workout[]) => {
    setWorkoutsState(w);
    if (currentUser) persistWorkouts(w, currentUser.uid);
  }, [currentUser, persistWorkouts]);

  // ── Atualiza perfil + treinos em uma única renderização ──────────────────────
  const saveProfileAndWorkouts = useCallback((p: UserProfile, w: Workout[]) => {
    setProfileState(p);
    setWorkoutsState(w);
    if (currentUser) {
      persistProfile(p, currentUser.uid);
      persistWorkouts(w, currentUser.uid);
    }
  }, [currentUser, persistProfile, persistWorkouts]);

  const setExerciseLog = useCallback((exerciseId: string, sessions: ExerciseSession[]) => {
    setExerciseLogsState(prev => ({ ...prev, [exerciseId]: sessions }));
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'logs', exerciseId), { sessions })
        .catch(err => console.error('Erro ao salvar log:', err));
    }
  }, [currentUser]);

  return (
    <UserDataContext.Provider value={{ profile, setProfile, workouts, setWorkouts, saveProfileAndWorkouts, exerciseLogs, setExerciseLog, dataLoading }}>
      {children}
    </UserDataContext.Provider>
  );
};
