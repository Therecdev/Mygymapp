export type MeasurementType =
  | "weight"
  | "bodyFat"
  | "chest"
  | "waist"
  | "hips"
  | "biceps"
  | "thighs"
  | "calves"
  | "shoulders"
  | "neck"
  | "custom"

export interface Measurement {
  id: string
  type: MeasurementType
  value: number
  unit: string
  date: Date
  notes?: string
  customName?: string // For custom measurement types
}

export interface MeasurementGoal {
  id: string
  measurementType: MeasurementType
  targetValue: number
  startValue: number
  startDate: Date
  targetDate: Date
  completed: boolean
  customName?: string // For custom measurement types
}

