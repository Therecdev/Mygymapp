import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutTemplate } from "../models/Template"
import type { Workout, ExerciseEntry, WorkoutSet } from "../models/Workout"
import { getExerciseById } from "./exerciseService"
import { defaultTemplates } from "../data/defaultTemplates"

// Keys for AsyncStorage
const TEMPLATES_STORAGE_KEY = "workout_templates"
const TEMPLATES_INITIALIZED_KEY = "templates_initialized"

// Initialize default templates if not already done
export const initializeTemplates = async (): Promise<void> => {
  try {
    const initialized = await AsyncStorage.getItem(TEMPLATES_INITIALIZED_KEY)

    if (!initialized) {
      await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultTemplates))
      await AsyncStorage.setItem(TEMPLATES_INITIALIZED_KEY, "true")
    }
  } catch (error) {
    console.error("Error initializing templates:", error)
  }
}

// Get all templates
export const getAllTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    // Ensure templates are initialized
    await initializeTemplates()

    const templatesJson = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY)
    return templatesJson ? JSON.parse(templatesJson) : []
  } catch (error) {
    console.error("Error retrieving templates:", error)
    return []
  }
}

// Get template by ID
export const getTemplateById = async (id: string): Promise<WorkoutTemplate | null> => {
  const templates = await getAllTemplates()
  return templates.find((template) => template.id === id) || null
}

// Save a template (create or update)
export const saveTemplate = async (template: WorkoutTemplate): Promise<WorkoutTemplate> => {
  try {
    const templates = await getAllTemplates()

    // If template has no ID, create a new one
    if (!template.id) {
      template.id = uuidv4()
      template.createdAt = new Date()
    }

    template.updatedAt = new Date()

    // Find if template already exists to update or add new
    const existingIndex = templates.findIndex((t) => t.id === template.id)

    if (existingIndex >= 0) {
      templates[existingIndex] = template
    } else {
      templates.push(template)
    }

    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
    return template
  } catch (error) {
    console.error("Error saving template:", error)
    throw error
  }
}

// Delete a template
export const deleteTemplate = async (id: string): Promise<boolean> => {
  try {
    const templates = await getAllTemplates()

    // Don't allow deletion of default templates
    const template = templates.find((t) => t.id === id)
    if (template && template.isDefault) {
      return false
    }

    const filteredTemplates = templates.filter((template) => template.id !== id)
    await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filteredTemplates))
    return true
  } catch (error) {
    console.error("Error deleting template:", error)
    return false
  }
}

// Create a workout from a template
export const createWorkoutFromTemplate = async (templateId: string): Promise<Workout> => {
  try {
    const template = await getTemplateById(templateId)
    if (!template) {
      throw new Error("Template not found")
    }

    const exerciseEntries: ExerciseEntry[] = []

    // Process each exercise in the template
    for (const templateExercise of template.exercises) {
      const exercise = await getExerciseById(templateExercise.exerciseId)
      if (!exercise) {
        continue // Skip if exercise not found
      }

      // Create sets based on template
      const sets: WorkoutSet[] = []
      for (let i = 0; i < templateExercise.setCount; i++) {
        let targetReps: number
        if (Array.isArray(templateExercise.targetReps)) {
          // If it's a range, use the middle value
          targetReps = Math.round((templateExercise.targetReps[0] + templateExercise.targetReps[1]) / 2)
        } else {
          targetReps = templateExercise.targetReps
        }

        sets.push({
          id: uuidv4(),
          reps: targetReps,
          weight: 0, // User will fill this in
          isCompleted: false,
        })
      }

      // Create exercise entry
      exerciseEntries.push({
        id: uuidv4(),
        exerciseId: exercise.id,
        exercise,
        sets,
        notes: templateExercise.notes,
      })
    }

    // Create the workout
    const workout: Workout = {
      id: uuidv4(),
      name: template.name,
      date: new Date(),
      exercises: exerciseEntries,
      notes: `Created from template: ${template.name}`,
      isCompleted: false,
    }

    return workout
  } catch (error) {
    console.error("Error creating workout from template:", error)
    throw error
  }
}

// Get templates by muscle group
export const getTemplatesByMuscleGroup = async (muscleGroup: string): Promise<WorkoutTemplate[]> => {
  const templates = await getAllTemplates()
  return templates.filter((template) => template.targetMuscleGroups.includes(muscleGroup as any))
}

// Get templates by difficulty
export const getTemplatesByDifficulty = async (difficulty: string): Promise<WorkoutTemplate[]> => {
  const templates = await getAllTemplates()
  return templates.filter((template) => template.difficulty === difficulty)
}

// Search templates by name or description
export const searchTemplates = async (searchTerm: string): Promise<WorkoutTemplate[]> => {
  const templates = await getAllTemplates()
  const term = searchTerm.toLowerCase()
  return templates.filter(
    (template) =>
      template.name.toLowerCase().includes(term) ||
      (template.description && template.description.toLowerCase().includes(term)),
  )
}

