import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { Goal, GoalProgress, GoalType, GoalStatus } from "../models/Goal"

// Keys for AsyncStorage
const GOALS_STORAGE_KEY = "goals"
const GOAL_PROGRESS_STORAGE_KEY = "goal_progress"

// Get all goals
export const getAllGoals = async (): Promise<Goal[]> => {
  try {
    const goalsJson = await AsyncStorage.getItem(GOALS_STORAGE_KEY)
    return goalsJson ? JSON.parse(goalsJson) : []
  } catch (error) {
    console.error("Error retrieving goals:", error)
    return []
  }
}

// Get goals by status
export const getGoalsByStatus = async (status: GoalStatus): Promise<Goal[]> => {
  const goals = await getAllGoals()
  return goals.filter((goal) => goal.status === status)
}

// Get goals by type
export const getGoalsByType = async (type: GoalType): Promise<Goal[]> => {
  const goals = await getAllGoals()
  return goals.filter((goal) => goal.type === type)
}

// Get goal by ID
export const getGoalById = async (id: string): Promise<Goal | null> => {
  const goals = await getAllGoals()
  return goals.find((goal) => goal.id === id) || null
}

// Save a goal
export const saveGoal = async (goal: Goal): Promise<Goal> => {
  try {
    const goals = await getAllGoals()

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

    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
    return goal
  } catch (error) {
    console.error("Error saving goal:", error)
    throw error
  }
}

// Delete a goal
export const deleteGoal = async (id: string): Promise<boolean> => {
  try {
    const goals = await getAllGoals()
    const filteredGoals = goals.filter((goal) => goal.id !== id)
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(filteredGoals))

    // Also delete goal progress
    await deleteGoalProgress(id)

    return true
  } catch (error) {
    console.error("Error deleting goal:", error)
    return false
  }
}

// Update goal status
export const updateGoalStatus = async (id: string, status: GoalStatus): Promise<boolean> => {
  try {
    const goals = await getAllGoals()
    const goalIndex = goals.findIndex((g) => g.id === id)

    if (goalIndex >= 0) {
      goals[goalIndex].status = status
      goals[goalIndex].lastUpdated = new Date()
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
      return true
    }

    return false
  } catch (error) {
    console.error("Error updating goal status:", error)
    return false
  }
}

// Update goal progress
export const updateGoalProgress = async (id: string, value: number): Promise<boolean> => {
  try {
    const goals = await getAllGoals()
    const goalIndex = goals.findIndex((g) => g.id === id)

    if (goalIndex >= 0) {
      const goal = goals[goalIndex]
      goal.currentValue = value
      goal.lastUpdated = new Date()

      // Check if goal is completed
      if (goal.type === "body_measurement" && goal.measurementType === "weight") {
        // For weight goals, we want to decrease
        if (value <= goal.targetValue) {
          goal.status = "completed"
        }
      } else {
        // For other goals, we want to increase
        if (value >= goal.targetValue) {
          goal.status = "completed"
        }
      }

      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))

      // Add progress point
      await addGoalProgressPoint(id, value)

      return true
    }

    return false
  } catch (error) {
    console.error("Error updating goal progress:", error)
    return false
  }
}

// Get goal progress
export const getGoalProgress = async (goalId: string): Promise<GoalProgress[]> => {
  try {
    const progressJson = await AsyncStorage.getItem(`${GOAL_PROGRESS_STORAGE_KEY}_${goalId}`)
    return progressJson ? JSON.parse(progressJson) : []
  } catch (error) {
    console.error("Error retrieving goal progress:", error)
    return []
  }
}

// Add goal progress point
export const addGoalProgressPoint = async (goalId: string, value: number): Promise<boolean> => {
  try {
    const progress = await getGoalProgress(goalId)

    const newPoint: GoalProgress = {
      date: new Date(),
      value,
    }

    progress.push(newPoint)
    await AsyncStorage.setItem(`${GOAL_PROGRESS_STORAGE_KEY}_${goalId}`, JSON.stringify(progress))

    return true
  } catch (error) {
    console.error("Error adding goal progress point:", error)
    return false
  }
}

// Delete goal progress
export const deleteGoalProgress = async (goalId: string): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(`${GOAL_PROGRESS_STORAGE_KEY}_${goalId}`)
    return true
  } catch (error) {
    console.error("Error deleting goal progress:", error)
    return false
  }
}

// Check and update workout frequency goals
export const updateWorkoutFrequencyGoals = async (): Promise<void> => {
  try {
    const goals = await getGoalsByType("workout_frequency")
    const activeGoals = goals.filter((goal) => goal.status === "active")

    if (activeGoals.length === 0) return

    // Get workouts from the past week
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // This would be replaced with actual workout service call
    const workouts = await AsyncStorage.getItem("workouts")
    const parsedWorkouts = workouts ? JSON.parse(workouts) : []

    const recentWorkouts = parsedWorkouts.filter((workout: any) => {
      const workoutDate = new Date(workout.date)
      return workoutDate >= oneWeekAgo && workoutDate <= now && workout.isCompleted
    })

    const workoutCount = recentWorkouts.length

    // Update each active workout frequency goal
    for (const goal of activeGoals) {
      await updateGoalProgress(goal.id, workoutCount)
    }
  } catch (error) {
    console.error("Error updating workout frequency goals:", error)
  }
}

