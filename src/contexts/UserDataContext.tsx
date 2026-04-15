import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Workout, ExerciseSession } from '../types';
import { useAuth } from './AuthContext';

interface UserDataContextType {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => Promise<void>;
  workouts: Workout[];
  setWorkouts: (w: Workout[]) => Promise<void>;
  exerciseLogs: Record<string, ExerciseSession[]>;
  setExerciseLog: (exerciseId: string, sessions: ExerciseSession[]) => Promise<void>;
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
        // Perfil
        const profileSnap = await getDoc(doc(db, 'users', uid));
        let loadedProfile: UserProfile | null = null;
        if (profileSnap.exists() && profileSnap.data().profile) {
          loadedProfile = profileSnap.data().profile as UserProfile;
        } else {
          // Migração: tenta ler do localStorage
          const lsProfile = localStorage.getItem('userProfile');
          if (lsProfile) {
            loadedProfile = JSON.parse(lsProfile);
          }
        }
        setProfileState(loadedProfile);

        // Treinos
        const workoutsSnap = await getDoc(doc(db, 'users', uid, 'meta', 'workouts'));
        let loadedWorkouts: Workout[] = [];
        if (workoutsSnap.exists() && workoutsSnap.data().list) {
          loadedWorkouts = workoutsSnap.data().list as Workout[];
        } else {
          // Migração: tenta ler do localStorage
          const lsWorkouts = localStorage.getItem(`workouts_${uid}`);
          if (lsWorkouts) {
            loadedWorkouts = JSON.parse(lsWorkouts);
          }
        }
        setWorkoutsState(loadedWorkouts);

        // Logs de exercícios
        const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
        const logsMap: Record<string, ExerciseSession[]> = {};
        logsSnap.forEach(d => {
          logsMap[d.id] = d.data().sessions as ExerciseSession[];
        });

        // Migração de logs do localStorage
        if (logsSnap.empty) {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('log_')) {
              const exerciseId = key.replace('log_', '');
              try {
                logsMap[exerciseId] = JSON.parse(localStorage.getItem(key) || '[]');
              } catch { /* ignora */ }
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

  // ── Setters com escrita no Firestore ────────────────────────────────────────
  const setProfile = useCallback(async (p: UserProfile | null) => {
    setProfileState(p);
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), { profile: p }, { merge: true });
  }, [currentUser]);

  const setWorkouts = useCallback(async (w: Workout[]) => {
    setWorkoutsState(w);
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'meta', 'workouts'), { list: w });
  }, [currentUser]);

  const setExerciseLog = useCallback(async (exerciseId: string, sessions: ExerciseSession[]) => {
    setExerciseLogsState(prev => ({ ...prev, [exerciseId]: sessions }));
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid, 'logs', exerciseId), { sessions });
  }, [currentUser]);

  return (
    <UserDataContext.Provider value={{ profile, setProfile, workouts, setWorkouts, exerciseLogs, setExerciseLog, dataLoading }}>
      {children}
    </UserDataContext.Provider>
  );
};
