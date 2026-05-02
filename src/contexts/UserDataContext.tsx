import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Workout, ExerciseSession, WorkoutActivity, ActiveWorkout } from '../types';
import { useAuth } from './AuthContext';
import { WorkoutGenerator } from '../utils/workoutGenerator';
import { resolveExerciseId, isLegacyAiExerciseId } from '../utils/exerciseIdResolver';

interface UserDataContextType {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  workouts: Workout[];
  setWorkouts: (w: Workout[]) => void;
  addWorkout: (w: Workout) => void;
  saveProfileAndWorkouts: (p: UserProfile, w: Workout[]) => void;
  exerciseLogs: Record<string, ExerciseSession[]>;
  setExerciseLog: (exerciseId: string, sessions: ExerciseSession[]) => void;
  dataLoading: boolean;
  workoutActivities: WorkoutActivity[];
  activeWorkout: ActiveWorkout | null;
  startWorkout: (workout: Workout) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  addActivity: (activity: WorkoutActivity) => void;
  removeActivity: (id: string) => void;
}

const UserDataContext = createContext<UserDataContextType>({} as UserDataContextType);

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [workouts, setWorkoutsState] = useState<Workout[]>([]);
  const workoutsRef = useRef<Workout[]>([]); // sempre aponta para o valor mais recente
  workoutsRef.current = workouts;
  const [exerciseLogs, setExerciseLogsState] = useState<Record<string, ExerciseSession[]>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [workoutActivities, setWorkoutActivitiesState] = useState<WorkoutActivity[]>([]);
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkout | null>(null);

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

        // Inicializa com treinos gerados APENAS aqui, após confirmar que Firebase está vazio
        if (loadedWorkouts.length === 0 && loadedProfile) {
          const generated = WorkoutGenerator.getWorkoutPlan(loadedProfile);
          loadedWorkouts = generated;
          setDoc(doc(db, 'users', uid, 'meta', 'workouts'), { list: generated })
            .catch(err => console.error('Erro ao inicializar treinos:', err));
        }

        // Migra IDs antigos de exercícios gerados pela IA (ai_ex_N_timestamp → IDs resolvidos)
        let needsMigration = false;
        const migrated = loadedWorkouts.map(workout => {
          if (!workout.id.startsWith('custom-ai-')) return workout;
          const newExercises = workout.exercises.map(ex => {
            if (!isLegacyAiExerciseId(ex.id)) return ex;
            const resolved = resolveExerciseId(ex.name, ex.id);
            if (resolved === ex.id) return ex;
            needsMigration = true;
            return { ...ex, id: resolved };
          });
          return { ...workout, exercises: newExercises };
        });
        if (needsMigration) {
          loadedWorkouts = migrated;
          setDoc(doc(db, 'users', uid, 'meta', 'workouts'), { list: migrated })
            .catch(err => console.error('Erro ao migrar IDs de exercícios:', err));
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

        const activitiesSnap = await getDoc(doc(db, 'users', uid, 'meta', 'activities'));
        if (activitiesSnap.exists() && activitiesSnap.data().list) {
          setWorkoutActivitiesState(activitiesSnap.data().list as WorkoutActivity[]);
        }

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

  const addWorkout = useCallback((workout: Workout) => {
    const updated = [...workoutsRef.current, workout];
    setWorkoutsState(updated);
    if (currentUser) persistWorkouts(updated, currentUser.uid);
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

  const startWorkout = useCallback((workout: { id: string; name: string; muscleGroups: string[]; exercises: { id: string }[] }) => {
    const active: ActiveWorkout = {
      id: `${workout.id}_${Date.now()}`,
      workoutId: workout.id,
      workoutName: workout.name,
      muscleGroups: workout.muscleGroups,
      startTime: new Date().toISOString(),
      exerciseIds: workout.exercises.map(e => e.id),
    };
    setActiveWorkoutState(active);
  }, []);

  const finishWorkout = useCallback(() => {
    if (!activeWorkout) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const completed = activeWorkout.exerciseIds.filter(id => {
      const history = exerciseLogs[id] ?? [];
      return history.some(s => s.date === todayStr && s.sets.some(st => st.completed));
    }).length;

    const activity: WorkoutActivity = {
      id: activeWorkout.id,
      workoutId: activeWorkout.workoutId,
      workoutName: activeWorkout.workoutName,
      muscleGroups: activeWorkout.muscleGroups,
      startTime: activeWorkout.startTime,
      endTime: new Date().toISOString(),
      duration: Math.max(1, Math.round((Date.now() - new Date(activeWorkout.startTime).getTime()) / 60000)),
      exercisesCompleted: completed,
      totalExercises: activeWorkout.exerciseIds.length,
    };

    const updated = [activity, ...workoutActivities];
    setWorkoutActivitiesState(updated);
    setActiveWorkoutState(null);

    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'meta', 'activities'), { list: updated })
        .catch(err => console.error('Erro ao salvar atividade:', err));
    }
  }, [activeWorkout, workoutActivities, exerciseLogs, currentUser]);

  const cancelWorkout = useCallback(() => {
    setActiveWorkoutState(null);
  }, []);

  const addActivity = useCallback((activity: WorkoutActivity) => {
    const updated = [activity, ...workoutActivities];
    setWorkoutActivitiesState(updated);
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'meta', 'activities'), { list: updated })
        .catch(err => console.error('Erro ao salvar atividade:', err));
    }
  }, [workoutActivities, currentUser]);

  const removeActivity = useCallback((id: string) => {
    const updated = workoutActivities.filter(a => a.id !== id);
    setWorkoutActivitiesState(updated);
    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'meta', 'activities'), { list: updated })
        .catch(err => console.error('Erro ao remover atividade:', err));
    }
  }, [workoutActivities, currentUser]);

  return (
    <UserDataContext.Provider value={{
      profile, setProfile, workouts, setWorkouts, addWorkout, saveProfileAndWorkouts,
      exerciseLogs, setExerciseLog, dataLoading,
      workoutActivities, activeWorkout, startWorkout, finishWorkout, cancelWorkout,
      addActivity, removeActivity,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
