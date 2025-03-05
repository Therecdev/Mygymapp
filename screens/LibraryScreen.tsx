"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from "react-native"
import { theme } from "../theme"
import type { Exercise, MuscleGroup } from "../models/Exercise"
import { getAllExercises } from "../services/exerciseService"
import { BookMinus, BookPlus, ChevronRight, Search } from "lucide-react-native"

const muscleGroups: { label: string; value: MuscleGroup }[] = [
  { label: "Chest", value: "chest" },
  { label: "Back", value: "back" },
  { label: "Shoulders", value: "shoulders" },
  { label: "Biceps", value: "biceps" },
  { label: "Triceps", value: "triceps" },
  { label: "Legs", value: "quadriceps" },
  { label: "Abs", value: "abdominals" },
]

export default function LibraryScreen({ route, navigation }: any) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | "all">("all")
  const [searchText, setSearchText] = useState("")
  const onSelectExercise = route.params?.onSelectExercise

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    const allExercises = await getAllExercises()
    setExercises(allExercises)
    setFilteredExercises(allExercises)
  }

  const filterExercises = useCallback(async () => {
    let filtered = [...exercises]

    // Filter by muscle group if not 'all'
    if (selectedMuscleGroup !== "all") {
      filtered = filtered.filter(
        (exercise) =>
          exercise.primaryMuscleGroups.includes(selectedMuscleGroup) ||
          (exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.includes(selectedMuscleGroup)),
      )
    }

    // Filter by search text
    if (searchText.trim() !== "") {
      filtered = filtered.filter((exercise) => exercise.name.toLowerCase().includes(searchText.toLowerCase()))
    }

    setFilteredExercises(filtered)
  }, [exercises, selectedMuscleGroup, searchText])

  useEffect(() => {
    filterExercises()
  }, [filterExercises])

  const toggleBookmark = async (exercise: Exercise) => {
    const updatedExercise = { ...exercise, isBookmarked: !exercise.isBookmarked }

    // Update local state
    const updatedExercises = exercises.map((e) => (e.id === exercise.id ? updatedExercise : e))
    setExercises(updatedExercises)

    // Save to storage (this would be handled by the exercise service)
    // await toggleExerciseBookmark(exercise.id);
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search stroke={theme.colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises"
          placeholderTextColor={theme.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Muscle Group Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedMuscleGroup === "all" && styles.filterChipSelected]}
            onPress={() => setSelectedMuscleGroup("all")}
          >
            <Text style={[styles.filterChipText, selectedMuscleGroup === "all" && styles.filterChipTextSelected]}>
              All
            </Text>
          </TouchableOpacity>

          {muscleGroups.map((group) => (
            <TouchableOpacity
              key={group.value}
              style={[styles.filterChip, selectedMuscleGroup === group.value && styles.filterChipSelected]}
              onPress={() => setSelectedMuscleGroup(group.value)}
            >
              <Text
                style={[styles.filterChipText, selectedMuscleGroup === group.value && styles.filterChipTextSelected]}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => {
              if (onSelectExercise) {
                onSelectExercise(item)
                navigation.goBack()
              } else {
                navigation.navigate("ExerciseDetail", { exerciseId: item.id })
              }
            }}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <Text style={styles.exerciseMuscles}>
                {item.primaryMuscleGroups.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
              </Text>
            </View>
            <View style={styles.exerciseActions}>
              <TouchableOpacity style={styles.bookmarkButton} onPress={() => toggleBookmark(item)}>
                {item.isBookmarked ? (
                  <BookMinus stroke={theme.colors.primary} size={20} />
                ) : (
                  <BookPlus stroke={theme.colors.textSecondary} size={20} />
                )}
              </TouchableOpacity>
              <ChevronRight stroke={theme.colors.textSecondary} size={20} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No exercises found. Try adjusting your filters.</Text>
          </View>
        )}
      />

      {/* Add Custom Exercise Button */}
      {!onSelectExercise && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddExercise")}>
          <Text style={styles.addButtonText}>Add Custom Exercise</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: theme.spacing.md,
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
  exerciseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 4,
  },
  exerciseMuscles: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookmarkButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
})

