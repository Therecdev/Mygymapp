import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { Exercise, MuscleGroup, EquipmentType } from "../models/Exercise"
import { defaultExercises } from "../data/defaultExercises"

// Keys for AsyncStorage
const EXERCISES_STORAGE_KEY = "exercises"
const EXERCISES_INITIALIZED_KEY = "exercises_initialized"

// Initialize default exercises if not already done
export const initializeExercises = async (): Promise<void> => {
  try {
    const initialized = await AsyncStorage.getItem(EXERCISES_INITIALIZED_KEY)

    if (!initialized) {
      await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(defaultExercises))
      await AsyncStorage.setItem(EXERCISES_INITIALIZED_KEY, "true")
    }
  } catch (error) {
    console.error("Error initializing exercises:", error)
  }
}

// Get all exercises
export const getAllExercises = async (): Promise<Exercise[]> => {
  try {
    // Ensure exercises are initialized
    await initializeExercises()

    const exercisesJson = await AsyncStorage.getItem(EXERCISES_STORAGE_KEY)
    return exercisesJson ? JSON.parse(exercisesJson) : []
  } catch (error) {
    console.error("Error retrieving exercises:", error)
    return []
  }
}

// Get exercise by ID
export const getExerciseById = async (id: string): Promise<Exercise | null> => {
  const exercises = await getAllExercises()
  return exercises.find((exercise) => exercise.id === id) || null
}

// Get exercises by muscle group
export const getExercisesByMuscleGroup = async (muscleGroup: MuscleGroup): Promise<Exercise[]> => {
  const exercises = await getAllExercises()
  return exercises.filter(
    (exercise) =>
      exercise.primaryMuscleGroups.includes(muscleGroup) ||
      (exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.includes(muscleGroup)),
  )
}

// Get exercises by equipment type
export const getExercisesByEquipment = async (equipment: EquipmentType): Promise<Exercise[]> => {
  const exercises = await getAllExercises()
  return exercises.filter((exercise) => exercise.equipment.includes(equipment))
}

// Search exercises by name
export const searchExercises = async (searchTerm: string): Promise<Exercise[]> => {
  const exercises = await getAllExercises()
  const term = searchTerm.toLowerCase()
  return exercises.filter((exercise) => exercise.name.toLowerCase().includes(term))
}

// Save an exercise (create or update)
export const saveExercise = async (exercise: Exercise): Promise<Exercise> => {
  try {
    const exercises = await getAllExercises()

    // If exercise has no ID, create a new one
    if (!exercise.id) {
      exercise.id = uuidv4()
      exercise.isCustom = true // Mark as custom exercise
    }

    // Find if exercise already exists to update or add new
    const existingIndex = exercises.findIndex((e) => e.id === exercise.id)

    if (existingIndex >= 0) {
      exercises[existingIndex] = exercise
    } else {
      exercises.push(exercise)
    }

    await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
    return exercise
  } catch (error) {
    console.error("Error saving exercise:", error)
    throw error
  }
}

// Delete an exercise
export const deleteExercise = async (id: string): Promise<boolean> => {
  try {
    const exercises = await getAllExercises()
    const exercise = exercises.find((e) => e.id === id)

    // Don't allow deletion of default exercises
    if (exercise && !exercise.isCustom) {
      return false
    }

    const filteredExercises = exercises.filter((exercise) => exercise.id !== id)
    await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(filteredExercises))
    return true
  } catch (error) {
    console.error("Error deleting exercise:", error)
    return false
  }
}

// Toggle bookmark status for an exercise
export const toggleExerciseBookmark = async (id: string): Promise<Exercise | null> => {
  try {
    const exercises = await getAllExercises()
    const exerciseIndex = exercises.findIndex((e) => e.id === id)

    if (exerciseIndex < 0) {
      return null
    }

    exercises[exerciseIndex].isBookmarked = !exercises[exerciseIndex].isBookmarked

    await AsyncStorage.setItem(EXERCISES_STORAGE_KEY, JSON.stringify(exercises))
    return exercises[exerciseIndex]
  } catch (error) {
    console.error("Error toggling exercise bookmark:", error)
    return null
  }
}

// Get bookmarked exercises
export const getBookmarkedExercises = async (): Promise<Exercise[]> => {
  const exercises = await getAllExercises()
  return exercises.filter((exercise) => exercise.isBookmarked)
}

