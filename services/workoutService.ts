import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { Workout, ProgressionRecommendation } from "../models/Workout"

// Keys for AsyncStorage
const WORKOUTS_STORAGE_KEY = "workouts"

// Get all workouts
export const getAllWorkouts = async (): Promise<Workout[]> => {
  try {
    const workoutsJson = await AsyncStorage.getItem(WORKOUTS_STORAGE_KEY)
    return workoutsJson ? JSON.parse(workoutsJson) : []
  } catch (error) {
    console.error("Error retrieving workouts:", error)
    return []
  }
}

// Get recent workouts
export const getRecentWorkouts = async (limit: number): Promise<Workout[]> => {
  const workouts = await getAllWorkouts()
  return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

// Get a workout by ID
export const getWorkoutById = async (id: string): Promise<Workout | null> => {
  const workouts = await getAllWorkouts()
  return workouts.find((workout) => workout.id === id) || null
}

// Save a workout
export const saveWorkout = async (workout: Workout): Promise<Workout> => {
  try {
    const workouts = await getAllWorkouts()

    // If workout has no ID, create a new one
    if (!workout.id) {
      workout.id = uuidv4()
    }

    // Find if workout already exists to update or add new
    const existingIndex = workouts.findIndex((w) => w.id === workout.id)

    if (existingIndex >= 0) {
      workouts[existingIndex] = workout
    } else {
      workouts.push(workout)
    }

    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(workouts))
    return workout
  } catch (error) {
    console.error("Error saving workout:", error)
    throw error
  }
}

// Delete a workout
export const deleteWorkout = async (id: string): Promise<boolean> => {
  try {
    const workouts = await getAllWorkouts()
    const filteredWorkouts = workouts.filter((workout) => workout.id !== id)
    await AsyncStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(filteredWorkouts))
    return true
  } catch (error) {
    console.error("Error deleting workout:", error)
    return false
  }
}

// Get progression recommendations for an exercise
export const getProgressionRecommendations = async (exerciseId: string): Promise<ProgressionRecommendation | null> => {
  try {
    // Get all workouts
    const workouts = await getAllWorkouts()

    // Find all completed workout entries that include this exercise
    const relevantWorkouts = workouts
      .filter((workout) => workout.isCompleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Extract exercise entries for the specified exercise
    const exerciseEntries = relevantWorkouts
      .map((workout) => workout.exercises.find((entry) => entry.exerciseId === exerciseId))
      .filter((entry) => entry !== undefined)

    // If we don't have enough data, return null
    if (exerciseEntries.length < 2) {
      return null
    }

    // Get the most recent exercise entry
    const latestEntry = exerciseEntries[0]!

    // Simple progression logic for demonstration
    // In a real app, this would be more sophisticated
    const latestSets = latestEntry.sets.filter((set) => set.isCompleted)
    const suggestedSets = latestSets.map((set) => {
      // Clone the set
      const newSet = { ...set, id: uuidv4(), isCompleted: false }

      // Simple progression: If all reps completed and RPE < 8, increase weight by 5%
      const allRepsCompleted = latestSets.every((s) => s.isCompleted)
      const averageRPE = latestSets.reduce((sum, s) => sum + (s.rpe || 0), 0) / latestSets.length

      if (allRepsCompleted && averageRPE < 8) {
        newSet.weight = Math.round((newSet.weight * 1.05) / 2.5) * 2.5 // Round to nearest 2.5
        return newSet
      }

      // If RPE was high but completed, keep the same weight
      if (allRepsCompleted && averageRPE >= 8) {
        return newSet
      }

      // If didn't complete all reps, reduce weight by 5%
      newSet.weight = Math.round((newSet.weight * 0.95) / 2.5) * 2.5 // Round to nearest 2.5
      return newSet
    })

    return {
      exerciseId,
      exerciseName: latestEntry.exercise.name,
      suggestedSets,
      reasoning: determineProgressionReasoning(latestSets, suggestedSets),
      difficulty: determineDifficulty(latestSets, suggestedSets),
    }
  } catch (error) {
    console.error("Error generating progression recommendations:", error)
    return null
  }
}

// Helper to generate reasoning for progression recommendation
const determineProgressionReasoning = (latestSets: any[], suggestedSets: any[]): string => {
  const weightDiff = suggestedSets[0].weight - latestSets[0].weight

  if (weightDiff > 0) {
    return `Based on your last workout's performance, we've increased the weight by ${weightDiff}lbs.`
  } else if (weightDiff < 0) {
    return `To ensure good form and progress, we've slightly reduced the weight by ${Math.abs(weightDiff)}lbs.`
  } else {
    return "Based on your last workout, we recommend maintaining the same weight to continue building strength."
  }
}

// Helper to determine difficulty change
const determineDifficulty = (latestSets: any[], suggestedSets: any[]): "easier" | "same" | "harder" => {
  const totalWeightDiff = suggestedSets.reduce((sum, set, index) => {
    return sum + (set.weight - latestSets[index].weight)
  }, 0)

  if (totalWeightDiff > 0) return "harder"
  if (totalWeightDiff < 0) return "easier"
  return "same"
}

// Add this export to your existing workoutService file
export const getActiveWorkout = async () => {
  const workouts = await getAllWorkouts();
  return workouts.find(workout => workout.isActive) || null;
};

