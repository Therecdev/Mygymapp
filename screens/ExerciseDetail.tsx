"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { theme } from "../theme"
import type { Exercise } from "../models/Exercise"
import { getExerciseById, toggleExerciseBookmark } from "../services/exerciseService"
import { getProgressionRecommendations } from "../services/workoutService"
import type { ProgressionRecommendation } from "../models/Workout"
import { BookMinus, BookPlus, ChevronLeft, Dumbbell, TrendingUp } from "lucide-react-native"

export default function ExerciseDetail({ route, navigation }: any) {
  const { exerciseId } = route.params
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [progression, setProgression] = useState<ProgressionRecommendation | null>(null)

  useEffect(() => {
    loadExercise()
  }, [])

  const loadExercise = async () => {
    const exerciseData = await getExerciseById(exerciseId)
    if (exerciseData) {
      setExercise(exerciseData)

      // Load progression data if available
      const progressionData = await getProgressionRecommendations(exerciseId)
      setProgression(progressionData)
    }
  }

  const handleToggleBookmark = async () => {
    if (exercise) {
      const updatedExercise = await toggleExerciseBookmark(exercise.id)
      if (updatedExercise) {
        setExercise(updatedExercise)
      }
    }
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading exercise...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <TouchableOpacity style={styles.bookmarkButton} onPress={handleToggleBookmark}>
          {exercise.isBookmarked ? (
            <BookMinus stroke={theme.colors.primary} size={24} />
          ) : (
            <BookPlus stroke={theme.colors.textSecondary} size={24} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Exercise Media */}
        {exercise.mediaUrls && exercise.mediaUrls.length > 0 ? (
          <Image source={{ uri: exercise.mediaUrls[0] }} style={styles.exerciseImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Dumbbell stroke={theme.colors.textSecondary} size={48} />
          </View>
        )}

        {/* Muscle Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle Groups</Text>
          <View style={styles.muscleGroupsContainer}>
            <View style={styles.muscleGroupColumn}>
              <Text style={styles.muscleGroupTitle}>Primary</Text>
              {exercise.primaryMuscleGroups.map((muscle) => (
                <Text key={muscle} style={styles.muscleGroupText}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              ))}
            </View>

            {exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.length > 0 && (
              <View style={styles.muscleGroupColumn}>
                <Text style={styles.muscleGroupTitle}>Secondary</Text>
                {exercise.secondaryMuscleGroups.map((muscle) => (
                  <Text key={muscle} style={styles.muscleGroupText}>
                    {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.equipmentContainer}>
            {exercise.equipment.map((item) => (
              <View key={item} style={styles.equipmentChip}>
                <Text style={styles.equipmentChipText}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionsText}>{exercise.instructions}</Text>
        </View>

        {/* Progression Recommendations */}
        {progression && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Progression Recommendations</Text>
            <View style={styles.progressionCard}>
              <View style={styles.progressionHeader}>
                <TrendingUp
                  stroke={
                    progression.difficulty === "harder"
                      ? theme.colors.success
                      : progression.difficulty === "easier"
                        ? theme.colors.error
                        : theme.colors.textSecondary
                  }
                  size={20}
                />
                <Text style={styles.progressionTitle}>
                  {progression.difficulty === "harder"
                    ? "Increase Weight"
                    : progression.difficulty === "easier"
                      ? "Decrease Weight"
                      : "Maintain Weight"}
                </Text>
              </View>

              <Text style={styles.progressionReasoning}>{progression.reasoning}</Text>

              <View style={styles.setsContainer}>
                <View style={styles.setHeader}>
                  <Text style={styles.setText}>SET</Text>
                  <Text style={styles.repText}>REPS</Text>
                  <Text style={styles.weightText}>WEIGHT</Text>
                </View>

                {progression.suggestedSets.map((set, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={styles.setNumber}>{index + 1}</Text>
                    <Text style={styles.repValue}>{set.reps}</Text>
                    <Text style={styles.weightValue}>{set.weight} lbs</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToWorkoutButton}
          onPress={() => navigation.navigate("Workout", { addExercise: exercise })}
        >
          <Text style={styles.addToWorkoutButtonText}>Add to Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
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
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  bookmarkButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    textAlign: "center",
    marginTop: theme.spacing.xl,
  },
  exerciseImage: {
    width: "100%",
    height: 200,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  muscleGroupsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  muscleGroupColumn: {
    flex: 1,
  },
  muscleGroupTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  muscleGroupText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.xs,
  },
  equipmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  equipmentChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  equipmentChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  instructionsText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
  },
  progressionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  progressionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  progressionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  progressionReasoning: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  setsContainer: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  setHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
    paddingBottom: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  setText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    width: 40,
  },
  repText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    width: 60,
  },
  weightText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  setRow: {
    flexDirection: "row",
    paddingVertical: theme.spacing.xs,
  },
  setNumber: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    width: 40,
  },
  repValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    width: 60,
  },
  weightValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  addToWorkoutButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  addToWorkoutButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
})

