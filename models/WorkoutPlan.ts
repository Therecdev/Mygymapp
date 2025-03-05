export interface WorkoutPlan {
  id: string
  name: string
  description?: string
  startDate: Date
  endDate?: Date
  scheduledWorkouts: ScheduledWorkout[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ScheduledWorkout {
  id: string
  templateId: string
  templateName: string
  date: Date
  isCompleted: boolean
  completedWorkoutId?: string // Reference to the actual workout if completed
  notes?: string
}

export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

export interface RecurringSchedule {
  days: WeekDay[]
  templateId: string
  templateName: string
}

