import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { PersonalRecord, PRNotification } from "../models/PersonalRecord"
import type { Workout } from "../models/Workout"

// Keys for AsyncStorage
const PERSONAL_RECORDS_STORAGE_KEY = "personal_records"
const PR_NOTIFICATIONS_STORAGE_KEY = "pr_notifications"

// Get all personal records
export const getAllPersonalRecords = async (): Promise<PersonalRecord[]> => {
  try {
    const recordsJson = await AsyncStorage.getItem(PERSONAL_RECORDS_STORAGE_KEY)
    return recordsJson ? JSON.parse(recordsJson) : []
  } catch (error) {
    console.error("Error retrieving personal records:", error)
    return []
  }
}

// Get personal records by exercise ID
export const getPersonalRecordsByExercise = async (exerciseId: string): Promise<PersonalRecord[]> => {
  const records = await getAllPersonalRecords()
  return records.filter((record) => record.exerciseId === exerciseId)
}

// Get personal records by type
export const getPersonalRecordsByType = async (
  type: "weight" | "reps" | "volume" | "time",
): Promise<PersonalRecord[]> => {
  const records = await getAllPersonalRecords()
  return records.filter((record) => record.type === type)
}

// Save a personal record
export const savePersonalRecord = async (record: PersonalRecord): Promise<PersonalRecord> => {
  try {
    const records = await getAllPersonalRecords()

    // If record has no ID, create a new one
    if (!record.id) {
      record.id = uuidv4()
    }

    // Find if record already exists to update or add new
    const existingIndex = records.findIndex((r) => r.id === record.id)

    if (existingIndex >= 0) {
      records[existingIndex] = record
    } else {
      records.push(record)
    }

    await AsyncStorage.setItem(PERSONAL_RECORDS_STORAGE_KEY, JSON.stringify(records))
    return record
  } catch (error) {
    console.error("Error saving personal record:", error)
    throw error
  }
}

// Delete a personal record
export const deletePersonalRecord = async (id: string): Promise<boolean> => {
  try {
    const records = await getAllPersonalRecords()
    const filteredRecords = records.filter((record) => record.id !== id)
    await AsyncStorage.setItem(PERSONAL_RECORDS_STORAGE_KEY, JSON.stringify(filteredRecords))
    return true
  } catch (error) {
    console.error("Error deleting personal record:", error)
    return false
  }
}

// Get all PR notifications
export const getAllPRNotifications = async (): Promise<PRNotification[]> => {
  try {
    const notificationsJson = await AsyncStorage.getItem(PR_NOTIFICATIONS_STORAGE_KEY)
    return notificationsJson ? JSON.parse(notificationsJson) : []
  } catch (error) {
    console.error("Error retrieving PR notifications:", error)
    return []
  }
}

// Get unread PR notifications
export const getUnreadPRNotifications = async (): Promise<PRNotification[]> => {
  const notifications = await getAllPRNotifications()
  return notifications.filter((notification) => !notification.isRead)
}

// Mark PR notification as read
export const markPRNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const notifications = await getAllPRNotifications()
    const notificationIndex = notifications.findIndex((n) => n.id === id)

    if (notificationIndex >= 0) {
      notifications[notificationIndex].isRead = true
      await AsyncStorage.setItem(PR_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
      return true
    }

    return false
  } catch (error) {
    console.error("Error marking PR notification as read:", error)
    return false
  }
}

// Create a PR notification
export const createPRNotification = async (
  prId: string,
  exerciseName: string,
  improvement: string,
): Promise<PRNotification> => {
  try {
    const notifications = await getAllPRNotifications()

    const newNotification: PRNotification = {
      id: uuidv4(),
      prId,
      exerciseName,
      improvement,
      date: new Date(),
      isRead: false,
    }

    notifications.push(newNotification)
    await AsyncStorage.setItem(PR_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))

    return newNotification
  } catch (error) {
    console.error("Error creating PR notification:", error)
    throw error
  }
}

// Check for new personal records in a workout
export const checkForPersonalRecords = async (workout: Workout): Promise<PersonalRecord[]> => {
  try {
    const newPRs: PersonalRecord[] = []

    // Process each exercise in the workout
    for (const exercise of workout.exercises) {
      // Skip if no completed sets
      if (!exercise.sets.some((set) => set.isCompleted)) {
        continue
      }

      // Get existing PRs for this exercise
      const existingPRs = await getPersonalRecordsByExercise(exercise.exerciseId)

      // Check for weight PR (max weight in a single set)
      const maxWeightSet = [...exercise.sets].filter((set) => set.isCompleted).sort((a, b) => b.weight - a.weight)[0]

      if (maxWeightSet) {
        const weightPR = existingPRs.find((pr) => pr.type === "weight")

        if (!weightPR || maxWeightSet.weight > weightPR.value) {
          // New weight PR
          const newPR: PersonalRecord = {
            id: uuidv4(),
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.name,
            value: maxWeightSet.weight,
            type: "weight",
            date: new Date(workout.date),
            workoutId: workout.id,
            notes: `New weight PR: ${maxWeightSet.weight} lbs for ${maxWeightSet.reps} reps`,
          }

          await savePersonalRecord(newPR)

          // Create notification
          const improvement = weightPR
            ? `+${(maxWeightSet.weight - weightPR.value).toFixed(1)} lbs`
            : `${maxWeightSet.weight} lbs`
          await createPRNotification(newPR.id, exercise.exercise.name, improvement)

          newPRs.push(newPR)
        }
      }

      // Check for reps PR (max reps in a single set)
      const maxRepsSet = [...exercise.sets].filter((set) => set.isCompleted).sort((a, b) => b.reps - a.reps)[0]

      if (maxRepsSet) {
        const repsPR = existingPRs.find((pr) => pr.type === "reps")

        if (!repsPR || maxRepsSet.reps > repsPR.value) {
          // New reps PR
          const newPR: PersonalRecord = {
            id: uuidv4(),
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.name,
            value: maxRepsSet.reps,
            type: "reps",
            date: new Date(workout.date),
            workoutId: workout.id,
            notes: `New reps PR: ${maxRepsSet.reps} reps at ${maxRepsSet.weight} lbs`,
          }

          await savePersonalRecord(newPR)

          // Create notification
          const improvement = repsPR ? `+${maxRepsSet.reps - repsPR.value} reps` : `${maxRepsSet.reps} reps`
          await createPRNotification(newPR.id, exercise.exercise.name, improvement)

          newPRs.push(newPR)
        }
      }

      // Check for volume PR (total weight * reps across all sets)
      const totalVolume = exercise.sets
        .filter((set) => set.isCompleted)
        .reduce((sum, set) => sum + set.weight * set.reps, 0)

      if (totalVolume > 0) {
        const volumePR = existingPRs.find((pr) => pr.type === "volume")

        if (!volumePR || totalVolume > volumePR.value) {
          // New volume PR
          const newPR: PersonalRecord = {
            id: uuidv4(),
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exercise.name,
            value: totalVolume,
            type: "volume",
            date: new Date(workout.date),
            workoutId: workout.id,
            notes: `New volume PR: ${totalVolume} lbs total volume`,
          }

          await savePersonalRecord(newPR)

          // Create notification
          const improvement = volumePR ? `+${(totalVolume - volumePR.value).toFixed(1)} lbs` : `${totalVolume} lbs`
          await createPRNotification(newPR.id, exercise.exercise.name, improvement)

          newPRs.push(newPR)
        }
      }
    }

    return newPRs
  } catch (error) {
    console.error("Error checking for personal records:", error)
    return []
  }
}

