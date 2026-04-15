export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  goal: 'muscle_gain' | 'fat_loss' | 'maintain';
  experience: 'beginner' | 'intermediate' | 'advanced';
  trainingDays: number;
  trainingDuration: number; // em minutos
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  instructions: string[];
  imageUrl?: string;
  sets?: number;
  reps?: string;
  rest?: number; // segundos
}

export interface WorkoutSession {
  id: string;
  userId: string;
  date: Date;
  exercises: Exercise[];
  duration: number;
  muscleGroups: string[];
  completed: boolean;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
}

export interface SetLog {
  weight: number;   // kg (0 = peso corporal)
  reps: number;
  completed: boolean;
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  date: string;     // ISO date string
  sets: SetLog[];
}

export interface WorkoutActivity {
  id: string;
  workoutId: string;
  workoutName: string;
  muscleGroups: string[];
  startTime: string;  // ISO string
  endTime: string;    // ISO string
  duration: number;   // minutos
  exercisesCompleted: number;
  totalExercises: number;
}

export interface ActiveWorkout {
  id: string;
  workoutId: string;
  workoutName: string;
  muscleGroups: string[];
  startTime: string;  // ISO string
  exerciseIds: string[];
}