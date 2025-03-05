export interface PersonalRecord {
  id: string
  exerciseId: string
  exerciseName: string
  value: number // Weight, reps, or time depending on the type
  type: "weight" | "reps" | "volume" | "time" // Type of PR
  date: Date
  workoutId?: string
  notes?: string
}

export interface PRNotification {
  id: string
  prId: string
  exerciseName: string
  improvement: string // e.g., "+10 lbs"
  date: Date
  isRead: boolean
}

