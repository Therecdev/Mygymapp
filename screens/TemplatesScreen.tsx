"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native"
import { theme } from "../theme"
import { getAllTemplates, createWorkoutFromTemplate } from "../services/templateService"
import { saveWorkout } from "../services/workoutService"
import type { WorkoutTemplate } from "../models/Template"
import type { MuscleGroup } from "../models/Exercise"
import { Search, Plus, Clock, Dumbbell } from "lucide-react-native"

// Difficulty options
const difficultyOptions = ["all", "beginner", "intermediate", "advanced"]

// Muscle group options for filtering
const muscleGroupOptions: { label: string; value: MuscleGroup | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Arms", value: "biceps" }, // We'll filter for both biceps and triceps
  { label: "Legs", value: "quadriceps" }, // We'll filter for all leg muscles
  { label: "Core", value: "abdominals" },
]

export default function TemplatesScreen({ navigation }: any) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<WorkoutTemplate[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | "all">("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [searchText, setSearchText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const allTemplates = await getAllTemplates()
      setTemplates(allTemplates)
      setFilteredTemplates(allTemplates)
    } catch (error) {
      console.error("Error loading templates:", error)
      Alert.alert("Error", "Could not load workout templates.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterTemplates = useCallback(() => {
    let filtered = [...templates]

    // Filter by muscle group
    if (selectedMuscleGroup !== "all") {
      filtered = filtered.filter((template) => template.targetMuscleGroups.includes(selectedMuscleGroup))
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((template) => template.difficulty === selectedDifficulty)
    }

    // Filter by search text
    if (searchText.trim() !== "") {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchText.toLowerCase())),
      )
    }

    setFilteredTemplates(filtered)
  }, [selectedMuscleGroup, selectedDifficulty, searchText, templates])

  useEffect(() => {
    filterTemplates()
  }, [filterTemplates])

  const handleStartWorkout = async (template: WorkoutTemplate) => {
    try {
      setIsLoading(true)
      const workout = await createWorkoutFromTemplate(template.id)
      await saveWorkout(workout)
      navigation.navigate("Workout", { workoutId: workout.id })
    } catch (error) {
      console.error("Error starting workout from template:", error)
      Alert.alert("Error", "Could not start workout from template.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity
      style={styles.templateCard}
      onPress={() => navigation.navigate("TemplateDetail", { templateId: item.id })}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateName}>{item.name}</Text>
        <View
          style={[
            styles.difficultyBadge,
            item.difficulty === "beginner"
              ? styles.beginnerBadge
              : item.difficulty === "intermediate"
                ? styles.intermediateBadge
                : styles.advancedBadge,
          ]}
        >
          <Text style={styles.difficultyText}>
            {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.templateDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.templateStats}>
        <View style={styles.statItem}>
          <Dumbbell stroke={theme.colors.textSecondary} size={16} />
          <Text style={styles.statText}>{item.exercises.length} exercises</Text>
        </View>

        {item.estimatedDuration && (
          <View style={styles.statItem}>
            <Clock stroke={theme.colors.textSecondary} size={16} />
            <Text style={styles.statText}>{item.estimatedDuration} min</Text>
          </View>
        )}
      </View>

      <View style={styles.templateTags}>
        {item.targetMuscleGroups.map((muscle, index) => (
          <View key={index} style={styles.tagChip}>
            <Text style={styles.tagText}>{muscle.charAt(0).toUpperCase() + muscle.slice(1)}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={() => handleStartWorkout(item)}>
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search stroke={theme.colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates"
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Muscle Group Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {muscleGroupOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterChip, selectedMuscleGroup === option.value && styles.filterChipSelected]}
              onPress={() => setSelectedMuscleGroup(option.value)}
            >
              <Text
                style={[styles.filterChipText, selectedMuscleGroup === option.value && styles.filterChipTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Difficulty Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {difficultyOptions.map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={[styles.filterChip, selectedDifficulty === difficulty && styles.filterChipSelected]}
              onPress={() => setSelectedDifficulty(difficulty)}
            >
              <Text style={[styles.filterChipText, selectedDifficulty === difficulty && styles.filterChipTextSelected]}>
                {difficulty === "all" ? "All Levels" : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Template List */}
      <FlatList
        data={filteredTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No templates found. Try adjusting your filters or create a new template.
            </Text>
          </View>
        )}
      />

      {/* Create Template Button */}
      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateTemplate")}>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    paddingVertical: theme.spacing.md,
  },
  filterContainer: {
    marginBottom: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterChipTextSelected: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  templateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  templateName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  beginnerBadge: {
    backgroundColor: theme.colors.success + "33", // 20% opacity
  },
  intermediateBadge: {
    backgroundColor: theme.colors.warning + "33", // 20% opacity
  },
  advancedBadge: {
    backgroundColor: theme.colors.error + "33", // 20% opacity
  },
  difficultyText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  templateDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  templateStats: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  statText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  templateTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.spacing.md,
  },
  tagChip: {
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  startButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
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
  createButton: {
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

