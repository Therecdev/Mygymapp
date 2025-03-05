import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { Measurement, MeasurementGoal, MeasurementType } from "../models/Measurement"

// Keys for AsyncStorage
const MEASUREMENTS_STORAGE_KEY = "measurements"
const MEASUREMENT_GOALS_STORAGE_KEY = "measurement_goals"

// Get all measurements
export const getAllMeasurements = async (): Promise<Measurement[]> => {
  try {
    const measurementsJson = await AsyncStorage.getItem(MEASUREMENTS_STORAGE_KEY)
    return measurementsJson ? JSON.parse(measurementsJson) : []
  } catch (error) {
    console.error("Error retrieving measurements:", error)
    return []
  }
}

// Get measurements by type
export const getMeasurementsByType = async (type: MeasurementType): Promise<Measurement[]> => {
  const measurements = await getAllMeasurements()
  return measurements
    .filter((measurement) => measurement.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Get latest measurement by type
export const getLatestMeasurementByType = async (type: MeasurementType): Promise<Measurement | null> => {
  const measurements = await getMeasurementsByType(type)
  return measurements.length > 0 ? measurements[0] : null
}

// Get measurements in date range
export const getMeasurementsInDateRange = async (startDate: Date, endDate: Date): Promise<Measurement[]> => {
  const measurements = await getAllMeasurements()
  return measurements.filter((measurement) => {
    const measurementDate = new Date(measurement.date)
    return measurementDate >= startDate && measurementDate <= endDate
  })
}

// Save a measurement
export const saveMeasurement = async (measurement: Measurement): Promise<Measurement> => {
  try {
    const measurements = await getAllMeasurements()

    // If measurement has no ID, create a new one
    if (!measurement.id) {
      measurement.id = uuidv4()
    }

    // Find if measurement already exists to update or add new
    const existingIndex = measurements.findIndex((m) => m.id === measurement.id)

    if (existingIndex >= 0) {
      measurements[existingIndex] = measurement
    } else {
      measurements.push(measurement)
    }

    await AsyncStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(measurements))
    return measurement
  } catch (error) {
    console.error("Error saving measurement:", error)
    throw error
  }
}

// Delete a measurement
export const deleteMeasurement = async (id: string): Promise<boolean> => {
  try {
    const measurements = await getAllMeasurements()
    const filteredMeasurements = measurements.filter((measurement) => measurement.id !== id)
    await AsyncStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(filteredMeasurements))
    return true
  } catch (error) {
    console.error("Error deleting measurement:", error)
    return false
  }
}

// Get all measurement goals
export const getAllMeasurementGoals = async (): Promise<MeasurementGoal[]> => {
  try {
    const goalsJson = await AsyncStorage.getItem(MEASUREMENT_GOALS_STORAGE_KEY)
    return goalsJson ? JSON.parse(goalsJson) : []
  } catch (error) {
    console.error("Error retrieving measurement goals:", error)
    return []
  }
}

// Get measurement goals by type
export const getMeasurementGoalsByType = async (type: MeasurementType): Promise<MeasurementGoal[]> => {
  const goals = await getAllMeasurementGoals()
  return goals
    .filter((goal) => goal.measurementType === type)
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
}

// Save a measurement goal
export const saveMeasurementGoal = async (goal: MeasurementGoal): Promise<MeasurementGoal> => {
  try {
    const goals = await getAllMeasurementGoals()

    // If goal has no ID, create a new one
    if (!goal.id) {
      goal.id = uuidv4()
    }

    // Find if goal already exists to update or add new
    const existingIndex = goals.findIndex((g) => g.id === goal.id)

    if (existingIndex >= 0) {
      goals[existingIndex] = goal
    } else {
      goals.push(goal)
    }

    await AsyncStorage.setItem(MEASUREMENT_GOALS_STORAGE_KEY, JSON.stringify(goals))
    return goal
  } catch (error) {
    console.error("Error saving measurement goal:", error)
    throw error
  }
}

// Delete a measurement goal
export const deleteMeasurementGoal = async (id: string): Promise<boolean> => {
  try {
    const goals = await getAllMeasurementGoals()
    const filteredGoals = goals.filter((goal) => goal.id !== id)
    await AsyncStorage.setItem(MEASUREMENT_GOALS_STORAGE_KEY, JSON.stringify(filteredGoals))
    return true
  } catch (error) {
    console.error("Error deleting measurement goal:", error)
    return false
  }
}

// Check if a goal is completed
export const checkGoalCompletion = async (goalId: string): Promise<boolean> => {
  try {
    const goals = await getAllMeasurementGoals()
    const goal = goals.find((g) => g.id === goalId)

    if (!goal) {
      return false
    }

    const latestMeasurement = await getLatestMeasurementByType(goal.measurementType)

    if (!latestMeasurement) {
      return false
    }

    // Check if goal is reached based on the measurement type
    // For weight and body fat, we want to decrease
    if (goal.measurementType === "weight" || goal.measurementType === "bodyFat") {
      if (latestMeasurement.value <= goal.targetValue) {
        // Update goal as completed
        goal.completed = true
        await saveMeasurementGoal(goal)
        return true
      }
    } else {
      // For other measurements, we typically want to increase
      if (latestMeasurement.value >= goal.targetValue) {
        // Update goal as completed
        goal.completed = true
        await saveMeasurementGoal(goal)
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking goal completion:", error)
    return false
  }
}

