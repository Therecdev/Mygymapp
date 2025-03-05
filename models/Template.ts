import type { MuscleGroup } from "./Exercise"

export interface WorkoutTemplate {
  id: string
  name: string
  description?: string
  exercises: TemplateExerciseEntry[]
  targetMuscleGroups: MuscleGroup[]
  estimatedDuration?: number // in minutes
  difficulty: "beginner" | "intermediate" | "advanced"
  tags: string[]
  isDefault: boolean // Whether this is a built-in template or user-created
  createdAt: Date
  updatedAt: Date
}

export interface TemplateExerciseEntry {
  id: string
  exerciseId: string
  exerciseName: string
  setCount: number
  targetReps: number | [number, number] // Either a fixed number or a range [min, max]
  restSeconds?: number
  notes?: string
}

