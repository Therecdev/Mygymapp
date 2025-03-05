import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Workout } from "../models/Workout"
import type { JournalEntry } from "../models/JournalEntry"

// This would be replaced with your actual API endpoints
const API_BASE_URL = "https://api.stoicstrength.com"

// Keys for AsyncStorage
const AUTH_TOKEN_KEY = "auth_token"
const LAST_SYNC_KEY = "last_sync"

// Get the authentication token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error("Error getting auth token:", error)
    return null
  }
}

// Set the authentication token
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch (error) {
    console.error("Error setting auth token:", error)
  }
}

// Clear the authentication token (logout)
export const clearAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY)
  } catch (error) {
    console.error("Error clearing auth token:", error)
  }
}

// Check if user is logged in
export const isLoggedIn = async (): Promise<boolean> => {
  const token = await getAuthToken()
  return token !== null
}

// Login user
export const login = async (email: string, password: string): Promise<boolean> => {
  try {
    // This would be a real API call in a production app
    // For now, we'll simulate a successful login
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (response.ok) {
      const data = await response.json()
      await setAuthToken(data.token)
      return true
    }

    return false
  } catch (error) {
    console.error("Error logging in:", error)
    return false
  }
}

// Register user
export const register = async (email: string, password: string, name: string): Promise<boolean> => {
  try {
    // This would be a real API call in a production app
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (response.ok) {
      const data = await response.json()
      await setAuthToken(data.token)
      return true
    }

    return false
  } catch (error) {
    console.error("Error registering:", error)
    return false
  }
}

// Logout user
export const logout = async (): Promise<void> => {
  await clearAuthToken()
}

// Upload data to cloud
export const uploadData = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken()
    if (!token) {
      return false
    }

    // Get all local data
    const workoutsJson = await AsyncStorage.getItem("workouts")
    const journalEntriesJson = await AsyncStorage.getItem("journal_entries")

    const workouts = workoutsJson ? JSON.parse(workoutsJson) : []
    const journalEntries = journalEntriesJson ? JSON.parse(journalEntriesJson) : []

    // This would be a real API call in a production app
    const response = await fetch(`${API_BASE_URL}/sync/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workouts,
        journalEntries,
        timestamp: new Date().toISOString(),
      }),
    })

    if (response.ok) {
      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
      return true
    }

    return false
  } catch (error) {
    console.error("Error uploading data:", error)
    return false
  }
}

// Download data from cloud
export const downloadData = async (): Promise<boolean> => {
  try {
    const token = await getAuthToken()
    if (!token) {
      return false
    }

    // Get last sync timestamp
    const lastSync = (await AsyncStorage.getItem(LAST_SYNC_KEY)) || "1970-01-01T00:00:00.000Z"

    // This would be a real API call in a production app
    const response = await fetch(`${API_BASE_URL}/sync/download?since=${lastSync}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()

      // Merge with local data (this would need a more sophisticated merge strategy in a real app)
      if (data.workouts && data.workouts.length > 0) {
        const workoutsJson = await AsyncStorage.getItem("workouts")
        const localWorkouts = workoutsJson ? JSON.parse(workoutsJson) : []

        // Simple merge strategy: replace local with remote if newer
        const mergedWorkouts = [...localWorkouts]
        data.workouts.forEach((remoteWorkout: Workout) => {
          const index = mergedWorkouts.findIndex((w) => w.id === remoteWorkout.id)
          if (index >= 0) {
            mergedWorkouts[index] = remoteWorkout
          } else {
            mergedWorkouts.push(remoteWorkout)
          }
        })

        await AsyncStorage.setItem("workouts", JSON.stringify(mergedWorkouts))
      }

      if (data.journalEntries && data.journalEntries.length > 0) {
        const entriesJson = await AsyncStorage.getItem("journal_entries")
        const localEntries = entriesJson ? JSON.parse(entriesJson) : []

        // Simple merge strategy: replace local with remote if newer
        const mergedEntries = [...localEntries]
        data.journalEntries.forEach((remoteEntry: JournalEntry) => {
          const index = mergedEntries.findIndex((e) => e.id === remoteEntry.id)
          if (index >= 0) {
            mergedEntries[index] = remoteEntry
          } else {
            mergedEntries.push(remoteEntry)
          }
        })

        await AsyncStorage.setItem("journal_entries", JSON.stringify(mergedEntries))
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
      return true
    }

    return false
  } catch (error) {
    console.error("Error downloading data:", error)
    return false
  }
}

// Sync data (both upload and download)
export const syncData = async (): Promise<boolean> => {
  const uploadSuccess = await uploadData()
  if (!uploadSuccess) {
    return false
  }

  const downloadSuccess = await downloadData()
  return downloadSuccess
}

