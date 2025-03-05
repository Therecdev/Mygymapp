export type GoalType = "workout_frequency" | "exercise_weight" | "exercise_volume" | "body_measurement" | "custom"

export type GoalStatus = "active" | "completed" | "failed" | "abandoned"

export interface Goal {
  id: string
  name: string
  description?: string
  type: GoalType
  targetValue: number
  currentValue: number
  startValue: number
  startDate: Date
  targetDate: Date
  status: GoalStatus

  // For specific goal types
  exerciseId?: string
  exerciseName?: string
  measurementType?: string
  workoutsPerWeek?: number

  // For tracking
  lastUpdated: Date
  notes?: string
}

export interface GoalProgress {
  date: Date
  value: number
}

