import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { WorkoutPlan, ScheduledWorkout, RecurringSchedule, WeekDay } from "../models/WorkoutPlan"
import { saveWorkout } from "./workoutService"
import { createWorkoutFromTemplate } from "./templateService"

// Keys for AsyncStorage
const WORKOUT_PLANS_STORAGE_KEY = "workout_plans"

// Get all workout plans
export const getAllWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  try {
    const plansJson = await AsyncStorage.getItem(WORKOUT_PLANS_STORAGE_KEY)
    return plansJson ? JSON.parse(plansJson) : []
  } catch (error) {
    console.error("Error retrieving workout plans:", error)
    return []
  }
}

// Get active workout plan
export const getActiveWorkoutPlan = async (): Promise<WorkoutPlan | null> => {
  const plans = await getAllWorkoutPlans()
  return plans.find((plan) => plan.isActive) || null
}

// Get workout plan by ID
export const getWorkoutPlanById = async (id: string): Promise<WorkoutPlan | null> => {
  const plans = await getAllWorkoutPlans()
  return plans.find((plan) => plan.id === id) || null
}

// Save a workout plan
export const saveWorkoutPlan = async (plan: WorkoutPlan): Promise<WorkoutPlan> => {
  try {
    const plans = await getAllWorkoutPlans()

    // If plan has no ID, create a new one
    if (!plan.id) {
      plan.id = uuidv4()
      plan.createdAt = new Date()
    }

    plan.updatedAt = new Date()

    // Find if plan already exists to update or add new
    const existingIndex = plans.findIndex((p) => p.id === plan.id)

    if (existingIndex >= 0) {
      plans[existingIndex] = plan
    } else {
      // If this is set as active, deactivate all other plans
      if (plan.isActive) {
        plans.forEach((p) => {
          if (p.id !== plan.id) {
            p.isActive = false
          }
        })
      }
      plans.push(plan)
    }

    await AsyncStorage.setItem(WORKOUT_PLANS_STORAGE_KEY, JSON.stringify(plans))
    return plan
  } catch (error) {
    console.error("Error saving workout plan:", error)
    throw error
  }
}

// Delete a workout plan
export const deleteWorkoutPlan = async (id: string): Promise<boolean> => {
  try {
    const plans = await getAllWorkoutPlans()
    const filteredPlans = plans.filter((plan) => plan.id !== id)
    await AsyncStorage.setItem(WORKOUT_PLANS_STORAGE_KEY, JSON.stringify(filteredPlans))
    return true
  } catch (error) {
    console.error("Error deleting workout plan:", error)
    return false
  }
}

// Get scheduled workouts for a date range
export const getScheduledWorkoutsForDateRange = async (startDate: Date, endDate: Date): Promise<ScheduledWorkout[]> => {
  const plans = await getAllWorkoutPlans()
  const scheduledWorkouts: ScheduledWorkout[] = []

  plans.forEach((plan) => {
    plan.scheduledWorkouts.forEach((workout) => {
      const workoutDate = new Date(workout.date)
      if (workoutDate >= startDate && workoutDate <= endDate) {
        scheduledWorkouts.push(workout)
      }
    })
  })

  return scheduledWorkouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// Get scheduled workouts for a specific date
export const getScheduledWorkoutsForDate = async (date: Date): Promise<ScheduledWorkout[]> => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return getScheduledWorkoutsForDateRange(startOfDay, endOfDay)
}

// Mark a scheduled workout as completed
export const completeScheduledWorkout = async (
  scheduledWorkoutId: string,
  actualWorkoutId: string,
): Promise<boolean> => {
  try {
    const plans = await getAllWorkoutPlans()
    let updated = false

    for (const plan of plans) {
      const workoutIndex = plan.scheduledWorkouts.findIndex((w) => w.id === scheduledWorkoutId)
      if (workoutIndex >= 0) {
        plan.scheduledWorkouts[workoutIndex].isCompleted = true
        plan.scheduledWorkouts[workoutIndex].completedWorkoutId = actualWorkoutId
        updated = true
        break
      }
    }

    if (updated) {
      await AsyncStorage.setItem(WORKOUT_PLANS_STORAGE_KEY, JSON.stringify(plans))
      return true
    }

    return false
  } catch (error) {
    console.error("Error completing scheduled workout:", error)
    return false
  }
}

// Create a new workout plan with recurring schedule
export const createRecurringWorkoutPlan = async (
  name: string,
  description: string | undefined,
  startDate: Date,
  endDate: Date | undefined,
  recurringSchedules: RecurringSchedule[],
): Promise<WorkoutPlan> => {
  try {
    // Generate all scheduled workouts based on recurring schedule
    const scheduledWorkouts: ScheduledWorkout[] = []

    // If no end date, default to 8 weeks from start
    const planEndDate = endDate || new Date(startDate.getTime() + 8 * 7 * 24 * 60 * 60 * 1000)

    // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
    const dayMap: Record<WeekDay, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    // Loop through each day from start to end
    const currentDate = new Date(startDate)
    while (currentDate <= planEndDate) {
      const dayOfWeek = currentDate.getDay()

      // Check if this day is in any of our recurring schedules
      for (const schedule of recurringSchedules) {
        const scheduleDays = schedule.days.map((day) => dayMap[day])

        if (scheduleDays.includes(dayOfWeek)) {
          // This day matches a scheduled day
          scheduledWorkouts.push({
            id: uuidv4(),
            templateId: schedule.templateId,
            templateName: schedule.templateName,
            date: new Date(currentDate),
            isCompleted: false,
          })
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Create the workout plan
    const newPlan: WorkoutPlan = {
      id: uuidv4(),
      name,
      description,
      startDate,
      endDate: planEndDate,
      scheduledWorkouts,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save the plan
    return saveWorkoutPlan(newPlan)
  } catch (error) {
    console.error("Error creating recurring workout plan:", error)
    throw error
  }
}

// Start a scheduled workout
export const startScheduledWorkout = async (scheduledWorkoutId: string): Promise<string | null> => {
  try {
    // Find the scheduled workout
    const plans = await getAllWorkoutPlans()
    let scheduledWorkout: ScheduledWorkout | null = null

    for (const plan of plans) {
      const workout = plan.scheduledWorkouts.find((w) => w.id === scheduledWorkoutId)
      if (workout) {
        scheduledWorkout = workout
        break
      }
    }

    if (!scheduledWorkout) {
      return null
    }

    // Create a workout from the template
    const workout = await createWorkoutFromTemplate(scheduledWorkout.templateId)

    // Add reference to the scheduled workout
    workout.notes = `Scheduled workout from plan: ${scheduledWorkout.templateName}`

    // Save the workout
    await saveWorkout(workout)

    // Mark the scheduled workout as completed
    await completeScheduledWorkout(scheduledWorkoutId, workout.id)

    return workout.id
  } catch (error) {
    console.error("Error starting scheduled workout:", error)
    return null
  }
}

