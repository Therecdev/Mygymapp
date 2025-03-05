export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quadriceps"
  | "hamstrings"
  | "calves"
  | "glutes"
  | "abdominals"
  | "obliques"
  | "traps"
  | "lats"

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "resistance band"
  | "other"

export interface Exercise {
  id: string
  name: string
  primaryMuscleGroups: MuscleGroup[]
  secondaryMuscleGroups?: MuscleGroup[]
  equipment: EquipmentType[]
  instructions: string
  mediaUrls?: string[] // URLs to images or videos demonstrating the exercise
  isCustom: boolean
  isBookmarked: boolean
}

