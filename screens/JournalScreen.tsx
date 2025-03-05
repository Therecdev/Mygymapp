"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from "react-native"
import { theme } from "../theme"
import type { JournalEntry, MoodTag } from "../models/JournalEntry"
import { getAllJournalEntries, deleteJournalEntry } from "../services/journalService"
import { BookOpen, Clock, Plus, Tag, Trash2 } from "lucide-react-native"

export default function JournalScreen({ navigation }: any) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedTag, setSelectedTag] = useState<MoodTag | null>(null)

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadEntries()
    })

    return unsubscribe
  }, [navigation])

  const loadEntries = async () => {
    const allEntries = await getAllJournalEntries()
    setEntries(allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return "😁"
    if (mood >= 7) return "😊"
    if (mood >= 5) return "😐"
    if (mood >= 3) return "😕"
    return "😞"
  }

  const handleDeleteEntry = async (id: string) => {
    await deleteJournalEntry(id)
    loadEntries()
  }

  const filteredEntries = selectedTag ? entries.filter((entry) => entry.tags.includes(selectedTag)) : entries

  // Get all unique tags
  const allTags: MoodTag[] = Array.from(new Set(entries.flatMap((entry) => entry.tags))) as MoodTag[]

  return (
    <View style={styles.container}>
      {/* Tag Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Tag:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
          <TouchableOpacity
            style={[styles.tagChip, selectedTag === null && styles.tagChipSelected]}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={[styles.tagChipText, selectedTag === null && styles.tagChipTextSelected]}>All</Text>
          </TouchableOpacity>

          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTag === tag && styles.tagChipSelected]}
              onPress={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              <Text style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Journal Entries */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.entriesList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.entryCard}
            onPress={() => navigation.navigate("ViewJournalEntry", { entryId: item.id })}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryDateContainer}>
                <Clock stroke={theme.colors.textSecondary} size={16} />
                <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
              </View>
              <Text style={styles.entryMood}>
                {getMoodEmoji(item.mood)} {item.mood}/10
              </Text>
            </View>

            <Text style={styles.entryContent} numberOfLines={3}>
              {item.content}
            </Text>

            {item.tags.length > 0 && (
              <View style={styles.tagsRow}>
                <Tag stroke={theme.colors.textSecondary} size={14} />
                <Text style={styles.tagsList}>{item.tags.join(", ")}</Text>
              </View>
            )}

            <View style={styles.entryFooter}>
              {item.workoutId && (
                <TouchableOpacity
                  style={styles.workoutButton}
                  onPress={() => navigation.navigate("ViewWorkout", { workoutId: item.workoutId })}
                >
                  <BookOpen stroke={theme.colors.primary} size={16} />
                  <Text style={styles.workoutButtonText}>View Workout</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEntry(item.id)}>
                <Trash2 stroke={theme.colors.error} size={16} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No journal entries found. Add your first entry to start tracking your journey.
            </Text>
          </View>
        )}
      />

      {/* Add Entry Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddJournalEntry")}>
        <Plus stroke={theme.colors.white} size={24} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filterContainer: {
    padding: theme.spacing.md,
  },
  filterTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  tagsContainer: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  tagChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
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
  entriesList: {
    padding: theme.spacing.md,
  },
  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  entryDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  entryDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  entryMood: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  entryContent: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  tagsList: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  entryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
})

