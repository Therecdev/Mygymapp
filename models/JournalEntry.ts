export type MoodTag =
  | "motivated"
  | "energetic"
  | "focused"
  | "tired"
  | "sore"
  | "stressed"
  | "proud"
  | "accomplished"
  | "disappointed"

export interface JournalEntry {
  id: string
  date: Date
  content: string
  mood: number // Scale of 1-10
  tags: MoodTag[]
  workoutId?: string // Optional link to a workout
}

