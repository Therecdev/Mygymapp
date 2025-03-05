import AsyncStorage from "@react-native-async-storage/async-storage"
import { v4 as uuidv4 } from "uuid"
import type { JournalEntry, MoodTag } from "../models/JournalEntry"

// Keys for AsyncStorage
const JOURNAL_STORAGE_KEY = "journal_entries"

// Get all journal entries
export const getAllJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    const entriesJson = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY)
    return entriesJson ? JSON.parse(entriesJson) : []
  } catch (error) {
    console.error("Error retrieving journal entries:", error)
    return []
  }
}

// Get recent journal entries
export const getRecentJournalEntries = async (limit: number): Promise<JournalEntry[]> => {
  const entries = await getAllJournalEntries()
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

// Get a journal entry by ID
export const getJournalEntryById = async (id: string): Promise<JournalEntry | null> => {
  const entries = await getAllJournalEntries()
  return entries.find((entry) => entry.id === id) || null
}

// Get journal entries by workout ID
export const getJournalEntriesByWorkoutId = async (workoutId: string): Promise<JournalEntry[]> => {
  const entries = await getAllJournalEntries()
  return entries.filter((entry) => entry.workoutId === workoutId)
}

// Save a journal entry
export const saveJournalEntry = async (entry: JournalEntry): Promise<JournalEntry> => {
  try {
    const entries = await getAllJournalEntries()

    // If entry has no ID, create a new one
    if (!entry.id) {
      entry.id = uuidv4()
    }

    // Find if entry already exists to update or add new
    const existingIndex = entries.findIndex((e) => e.id === entry.id)

    if (existingIndex >= 0) {
      entries[existingIndex] = entry
    } else {
      entries.push(entry)
    }

    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries))
    return entry
  } catch (error) {
    console.error("Error saving journal entry:", error)
    throw error
  }
}

// Delete a journal entry
export const deleteJournalEntry = async (id: string): Promise<boolean> => {
  try {
    const entries = await getAllJournalEntries()
    const filteredEntries = entries.filter((entry) => entry.id !== id)
    await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(filteredEntries))
    return true
  } catch (error) {
    console.error("Error deleting journal entry:", error)
    return false
  }
}

// Search journal entries by content or tags
export const searchJournalEntries = async (searchTerm: string): Promise<JournalEntry[]> => {
  const entries = await getAllJournalEntries()
  const term = searchTerm.toLowerCase()
  return entries.filter(
    (entry) => entry.content.toLowerCase().includes(term) || entry.tags.some((tag) => tag.toLowerCase().includes(term)),
  )
}

// Get journal entries by tag
export const getJournalEntriesByTag = async (tag: MoodTag): Promise<JournalEntry[]> => {
  const entries = await getAllJournalEntries()
  return entries.filter((entry) => entry.tags.includes(tag))
}

