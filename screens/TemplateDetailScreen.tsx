"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { theme } from "../theme"
import { getTemplateById, createWorkoutFromTemplate, deleteTemplate } from "../services/templateService"
import { saveWorkout } from "../services/workoutService"
import type { WorkoutTemplate } from "../models/Template"
import { ChevronLeft, Clock, Dumbbell, Play, Trash2, Edit } from "lucide-react-native"

export default function TemplateDetailScreen({ route, navigation }: any) {
  const { templateId } = route.params
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingWorkout, setIsStartingWorkout] = useState(false)

  useEffect(() => {
    loadTemplate()
  }, [])

  const loadTemplate = async () => {
    try {
      setIsLoading(true)
      const templateData = await getTemplateById(templateId)
      setTemplate(templateData)
    } catch (error) {
      console.error("Error loading template:", error)
      Alert.alert("Error", "Could not load template details.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartWorkout = async () => {
    if (!template) return

    try {
      setIsStartingWorkout(true)
      const workout = await createWorkoutFromTemplate(template.id)
      await saveWorkout(workout)
      navigation.navigate("Workout", { workoutId: workout.id })
    } catch (error) {
      console.error("Error starting workout from template:", error)
      Alert.alert("Error", "Could not start workout from template.")
    } finally {
      setIsStartingWorkout(false)
    }
  }

  const handleEditTemplate = () => {
    if (!template) return
    navigation.navigate("EditTemplate", { templateId: template.id })
  }

  const handleDeleteTemplate = async () => {
    if (!template) return

    Alert.alert("Delete Template", "Are you sure you want to delete this template? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const success = await deleteTemplate(template.id)
            if (success) {
              navigation.goBack()
            } else {
              Alert.alert("Error", "Could not delete this template. Default templates cannot be deleted.")
            }
          } catch (error) {
            console.error("Error deleting template:", error)
            Alert.alert("Error", "Could not delete template.")
          }
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading template...</Text>
      </View>
    )
  }

  if (!template) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Template not found.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{template.name}</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleEditTemplate} disabled={template.isDefault}>
          <Edit stroke={template.isDefault ? theme.colors.textTertiary : theme.colors.textPrimary} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Template Info */}
        <View style={styles.infoCard}>
          <View style={styles.difficultyRow}>
            <View
              style={[
                styles.difficultyBadge,
                template.difficulty === "beginner"
                  ? styles.beginnerBadge
                  : template.difficulty === "intermediate"
                    ? styles.intermediateBadge
                    : styles.advancedBadge,
              ]}
            >
              <Text style={styles.difficultyText}>
                {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
              </Text>
            </View>

            {template.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>

          {template.description && <Text style={styles.description}>{template.description}</Text>}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Dumbbell stroke={theme.colors.textSecondary} size={16} />
              <Text style={styles.statText}>{template.exercises.length} exercises</Text>
            </View>

            {template.estimatedDuration && (
              <View style={styles.statItem}>
                <Clock stroke={theme.colors.textSecondary} size={16} />
                <Text style={styles.statText}>{template.estimatedDuration} min</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Target Muscle Groups:</Text>
            <View style={styles.tagsList}>
              {template.targetMuscleGroups.map((muscle, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{muscle.charAt(0).toUpperCase() + muscle.slice(1)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesCard}>
          <Text style={styles.exercisesTitle}>Exercises</Text>

          {template.exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseNumberContainer}>
                  <Text style={styles.exerciseNumber}>{index + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseSets}>
                    {exercise.setCount} {exercise.setCount === 1 ? "set" : "sets"} ×{" "}
                    {Array.isArray(exercise.targetReps)
                      ? `${exercise.targetReps[0]}-${exercise.targetReps[1]}`
                      : exercise.targetReps}{" "}
                    reps
                  </Text>
                </View>
              </View>

              {exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}

              {exercise.restSeconds && (
                <View style={styles.restInfo}>
                  <Clock stroke={theme.colors.textTertiary} size={14} />
                  <Text style={styles.restText}>{exercise.restSeconds} sec rest</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout} disabled={isStartingWorkout}>
          {isStartingWorkout ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Play stroke={theme.colors.white} size={18} fill={theme.colors.white} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </>
          )}
        </TouchableOpacity>

        {!template.isDefault && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTemplate}>
            <Trash2 stroke={theme.colors.error} size={20} />
          </TouchableOpacity>
        )}
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
  headerButton: {
    padding: theme.spacing.xs,
    width: 40,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  difficultyRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
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
  defaultBadge: {
    backgroundColor: theme.colors.primary + "33", // 20% opacity
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  defaultText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  description: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
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
  tagsContainer: {
    marginBottom: theme.spacing.sm,
  },
  tagsTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  exercisesCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginTop: 0,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  exercisesTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  exerciseItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  exerciseNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  exerciseNumber: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  exerciseSets: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  exerciseNotes: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: "italic",
    marginBottom: theme.spacing.sm,
  },
  restInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  restText: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.fontSize.xs,
    marginLeft: theme.spacing.xs,
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  startButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
  },
  startButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  deleteButton: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
})

