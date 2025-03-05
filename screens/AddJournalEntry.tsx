"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native"
import { theme } from "../theme"
import type { JournalEntry, MoodTag } from "../models/JournalEntry"
import { saveJournalEntry } from "../services/journalService"
import { getWorkoutById } from "../services/workoutService"
import type { Workout } from "../models/Workout"
import { v4 as uuidv4 } from "uuid"
import { Save, X } from "lucide-react-native"

// Available mood tags
const moodTags: MoodTag[] = [
  "motivated",
  "energetic",
  "focused",
  "tired",
  "sore",
  "stressed",
  "proud",
  "accomplished",
  "disappointed",
]

export default function AddJournalEntry({ route, navigation }: any) {
  const workoutId = route.params?.workoutId
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [content, setContent] = useState("")
  const [mood, setMood] = useState(7) // Default mood 7/10
  const [selectedTags, setSelectedTags] = useState<MoodTag[]>([])

  useEffect(() => {
    if (workoutId) {
      loadWorkout()
    }
  }, [workoutId])

  const loadWorkout = async () => {
    const workoutData = await getWorkoutById(workoutId)
    if (workoutData) {
      setWorkout(workoutData)

      // Pre-populate with some content if it's a workout journal
      setContent(`Today I completed a ${workoutData.name} workout. `)

      // Set some default tags based on workout
      if (workoutData.exercises.length > 0) {
        const allSetsCompleted = workoutData.exercises.every((exercise) =>
          exercise.sets.every((set) => set.isCompleted),
        )

        if (allSetsCompleted) {
          setSelectedTags(["accomplished"])
          setMood(8)
        }
      }
    }
  }

  const toggleTag = (tag: MoodTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSave = async () => {
    if (content.trim() === "") {
      Alert.alert("Error", "Please enter some content for your journal entry.")
      return
    }

    try {
      const newEntry: JournalEntry = {
        id: uuidv4(),
        date: new Date(),
        content,
        mood,
        tags: selectedTags,
        workoutId,
      }

      await saveJournalEntry(newEntry)

      // If this was from a workout completion, update the workout with the journal entry
      if (workout) {
        // This would be handled by the workout service
        // await updateWorkoutJournal(workoutId, newEntry.id);
      }

      navigation.goBack()
    } catch (error) {
      console.error("Error saving journal entry:", error)
      Alert.alert("Error", "Could not save journal entry. Please try again.")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <X stroke={theme.colors.textSecondary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workout ? "Workout Reflection" : "New Journal Entry"}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save stroke={theme.colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {workout && (
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>{workout.name}</Text>
            <Text style={styles.workoutDate}>
              {new Date(workout.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        )}

        {/* Mood Slider */}
        <View style={styles.moodContainer}>
          <Text style={styles.sectionTitle}>How do you feel?</Text>
          <View style={styles.moodSliderContainer}>
            <Text style={styles.moodEmoji}>😞</Text>
            <View style={styles.sliderContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.moodBubble,
                    mood === value && styles.moodBubbleSelected,
                    { backgroundColor: getMoodColor(value) },
                  ]}
                  onPress={() => setMood(value)}
                >
                  <Text style={styles.moodBubbleText}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.moodEmoji}>😁</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <Text style={styles.sectionTitle}>How would you describe it?</Text>
          <View style={styles.tagsList}>
            {moodTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipSelected]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagChipText, selectedTags.includes(tag) && styles.tagChipTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Journal Content */}
        <View style={styles.journalContainer}>
          <Text style={styles.sectionTitle}>Journal Entry</Text>
          <TextInput
            style={styles.journalInput}
            multiline
            placeholder="Write your thoughts here..."
            placeholderTextColor={theme.colors.textTertiary}
            value={content}
            onChangeText={setContent}
          />
        </View>
      </ScrollView>
    </View>
  )
}

// Helper function to get color based on mood value
const getMoodColor = (value: number): string => {
  if (value <= 3) return "#EF4444" // Red
  if (value <= 5) return "#F59E0B" // Amber
  if (value <= 7) return "#10B981" // Green
  return "#3B82F6" // Blue
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  cancelButton: {
    padding: theme.spacing.xs,
  },
  saveButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  workoutInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  workoutTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  workoutDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  moodContainer: {
    marginBottom: theme.spacing.lg,
  },
  moodSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moodEmoji: {
    fontSize: 24,
    marginHorizontal: theme.spacing.sm,
  },
  sliderContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.6,
  },
  moodBubbleSelected: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  moodBubbleText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  tagsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  tagChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tagChipTextSelected: {
    color: theme.colors.white,
  },
  journalContainer: {
    marginBottom: theme.spacing.xl,
  },
  journalInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    minHeight: 200,
    textAlignVertical: "top",
  },
})

