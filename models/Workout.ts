import type { Exercise } from "./Exercise"
import type { JournalEntry } from "./JournalEntry"

export interface WorkoutSet {
  id: string
  reps: number
  weight: number // In pounds or kg based on user preference
  rpe?: number // Rating of Perceived Exertion (1-10)
  isCompleted: boolean
  notes?: string
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  exercise: Exercise
  sets: WorkoutSet[]
  notes?: string
}

export interface Workout {
  id: string
  name: string
  date: Date
  exercises: ExerciseEntry[]
  duration?: number // In minutes
  notes?: string
  journal?: JournalEntry
  isCompleted: boolean
}

// Types for progression recommendations
export interface ProgressionRecommendation {
  exerciseId: string
  exerciseName: string
  suggestedSets: WorkoutSet[]
  reasoning: string
  difficulty: "easier" | "same" | "harder"
}

