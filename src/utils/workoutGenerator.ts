import { UserProfile, Exercise, Workout } from '../types';
import { exercisesDatabase } from '../data/exercises';

export class WorkoutGenerator {
  static generateWorkout(userProfile: UserProfile): Workout {
    const { trainingDays, trainingDuration, experience, goal } = userProfile;

    // Filtrar exercícios por nível de experiência
    const availableExercises = exercisesDatabase.filter(
      exercise => this.isExerciseSuitableForUser(exercise, userProfile)
    );

    // Determinar grupos musculares baseado nos dias de treino
    const muscleGroupSplit = this.getMuscleGroupSplit(trainingDays);

    // Gerar treino para o dia atual (rotativo)
    const todayMuscleGroups = muscleGroupSplit[0]; // Primeiro grupo por padrão

    // Selecionar exercícios para os grupos musculares do dia
    const selectedExercises = this.selectExercisesForMuscleGroups(
      todayMuscleGroups,
      availableExercises,
      trainingDuration
    );

    // Ajustar séries e repetições baseado no objetivo
    const adjustedExercises = selectedExercises.map(exercise =>
      this.adjustExerciseForGoal(exercise, goal, experience)
    );

    return {
      id: `workout-${Date.now()}`,
      name: `Treino ${todayMuscleGroups.join(' + ')}`,
      exercises: adjustedExercises,
      muscleGroups: todayMuscleGroups,
      difficulty: experience,
      estimatedDuration: trainingDuration
    };
  }

  private static isExerciseSuitableForUser(exercise: Exercise, userProfile: UserProfile): boolean {
    // Verificar nível de dificuldade
    if (userProfile.experience === 'beginner' && exercise.difficulty === 'advanced') {
      return false;
    }
    return true;
  }

  private static getMuscleGroupSplit(trainingDays: number): string[][] {
    switch (trainingDays) {
      case 1:
      case 2:
        return [['peitoral', 'costas', 'pernas', 'ombros', 'braços']]; // Full body
      case 3:
        return [
          ['peitoral', 'triceps'],
          ['costas', 'biceps'],
          ['pernas', 'ombros']
        ];
      case 4:
        return [
          ['peitoral', 'triceps'],
          ['costas', 'biceps'],
          ['pernas'],
          ['ombros', 'abdômen']
        ];
      case 5:
        return [
          ['peitoral'],
          ['costas'],
          ['pernas'],
          ['ombros'],
          ['braços'],
        ];
      case 6:
        return [
          ['peitoral'],
          ['costas'],
          ['pernas'],
          ['ombros'],
          ['braços'],
          ['abdômen'],
        ];
      default:
        return [['peitoral', 'costas', 'pernas']];
    }
  }

  private static selectExercisesForMuscleGroups(
    muscleGroups: string[],
    availableExercises: Exercise[],
    duration: number
  ): Exercise[] {
    const selected: Exercise[] = [];
    const exercisesPerGroup = Math.max(1, Math.floor(duration / 15 / muscleGroups.length));

    muscleGroups.forEach(group => {
      const groupExercises = availableExercises.filter(ex =>
        ex.muscleGroup.includes(group)
      );

      // Selecionar exercícios aleatórios do grupo
      const shuffled = [...groupExercises].sort(() => 0.5 - Math.random());
      selected.push(...shuffled.slice(0, exercisesPerGroup));
    });

    return selected;
  }

  private static adjustExerciseForGoal(
    exercise: Exercise,
    goal: UserProfile['goal'],
    experience: UserProfile['experience']
  ): Exercise {
    const adjusted = { ...exercise };

    switch (goal) {
      case 'muscle_gain':
        adjusted.sets = Math.max(3, exercise.sets || 3);
        adjusted.reps = experience === 'beginner' ? '8-12' : '6-10';
        adjusted.rest = 90;
        break;
      case 'fat_loss':
        adjusted.sets = Math.max(3, exercise.sets || 3);
        adjusted.reps = '12-20';
        adjusted.rest = 45;
        break;
      case 'maintain':
      default:
        // Manter valores padrão
        break;
    }

    return adjusted;
  }

  static getWorkoutPlan(userProfile: UserProfile): Workout[] {
    const { trainingDays } = userProfile;
    const muscleGroupSplits = this.getMuscleGroupSplit(trainingDays);

    return muscleGroupSplits.map((muscleGroups, index) => {
      const availableExercises = exercisesDatabase.filter(
        exercise => this.isExerciseSuitableForUser(exercise, userProfile)
      );

      const selectedExercises = this.selectExercisesForMuscleGroups(
        muscleGroups,
        availableExercises,
        userProfile.trainingDuration
      );

      const adjustedExercises = selectedExercises.map(exercise =>
        this.adjustExerciseForGoal(exercise, userProfile.goal, userProfile.experience)
      );

      return {
        id: `workout-day-${index + 1}`,
        name: `Dia ${index + 1} - ${muscleGroups.join(' + ')}`,
        exercises: adjustedExercises,
        muscleGroups,
        difficulty: userProfile.experience,
        estimatedDuration: userProfile.trainingDuration
      };
    });
  }
}