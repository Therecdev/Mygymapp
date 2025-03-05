"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { theme } from "../theme"
import { Plus, ChevronRight, Clock, Dumbbell, Calendar, MoreVertical, Share2, Timer, Award } from "lucide-react-native"
import { getActiveWorkout, getRecentWorkouts } from "../services/workoutService"
import type { Workout } from "../models/Workout"
import { formatDuration } from "../utils/timeUtils"
import RestTimerModal from "../components/RestTimerModal"
import ShareWorkoutModal from "../components/ShareWorkoutModal"
import { checkForPersonalRecords } from "../services/personalRecordService"
import type { ExerciseEntry, WorkoutSet } from "../models/Workout"
import type { Exercise } from "../models/Exercise"
import { getWorkoutById, saveWorkout } from "../services/workoutService"
import { getAllExercises } from "../services/exerciseService"
import { X, Check, ChevronDown, ChevronUp, Save } from "lucide-react-native"
import { v4 as uuidv4 } from "uuid"
import { TextInput } from "react-native"

export default function WorkoutScreen({ route, navigation }: any) {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [workoutToShare, setWorkoutToShare] = useState<Workout | null>(null)
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [timer, setTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [expandedExercises, setExpandedExercises] = useState<{ [key: string]: boolean }>({})
  const [currentRestTime, setCurrentRestTime] = useState(60) // Default 60 seconds

  useEffect(() => {
    loadWorkouts()

    // Add listener for when the screen comes into focus
    const unsubscribe = navigation.addListener("focus", () => {
      loadWorkouts()
    })

    return unsubscribe
  }, [navigation])

  const loadWorkouts = async () => {
    setIsLoading(true)
    try {
      const active = await getActiveWorkout()
      const recent = await getRecentWorkouts(5)

      setActiveWorkout(active)
      setRecentWorkouts(recent)
    } catch (error) {
      console.error("Error loading workouts:", error)
      Alert.alert("Error", "Could not load workouts.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load workout data
  useEffect(() => {
    const workoutId = route.params?.workoutId
    const loadData = async () => {
      try {
        // Load exercises first
        const allExercises = await getAllExercises()
        setExercises(allExercises)

        if (workoutId) {
          // Load existing workout
          const existingWorkout = await getWorkoutById(workoutId)
          if (existingWorkout) {
            setWorkout(existingWorkout)

            // Set all exercises as expanded initially
            const expanded = existingWorkout.exercises.reduce(
              (acc, exercise) => {
                acc[exercise.id] = true
                return acc
              },
              {} as { [key: string]: boolean },
            )

            setExpandedExercises(expanded)

            // Start timer if workout is not completed
            if (!existingWorkout.isCompleted) {
              setIsTimerRunning(true)
            }
          }
        } else {
          // Create a new workout
          const newWorkout: Workout = {
            id: uuidv4(),
            name: "New Workout",
            date: new Date(),
            exercises: [],
            isCompleted: false,
          }
          setWorkout(newWorkout)
          setIsTimerRunning(true)
        }
      } catch (error) {
        console.error("Error loading workout data:", error)
        Alert.alert("Error", "Could not load workout data.")
      }
    }

    loadData()

    // Set up timer interval
    const timerInterval = setInterval(() => {
      if (isTimerRunning) {
        setTimer((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timerInterval)
  }, [route.params?.workoutId, isTimerRunning])

  // Format timer to MM:SS
  const formatTimer = () => {
    const minutes = Math.floor(timer / 60)
    const seconds = timer % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Toggle exercise expanded state
  const toggleExerciseExpanded = (exerciseId: string) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }))
  }

  // Add a new exercise to the workout
  const addExercise = () => {
    navigation.navigate("ExerciseLibrary", {
      onSelectExercise: (exercise: Exercise) => {
        if (workout) {
          const newExerciseEntry: ExerciseEntry = {
            id: uuidv4(),
            exerciseId: exercise.id,
            exercise,
            sets: [
              {
                id: uuidv4(),
                reps: 8,
                weight: 0,
                isCompleted: false,
              },
            ],
          }

          const updatedWorkout = {
            ...workout,
            exercises: [...workout.exercises, newExerciseEntry],
          }

          setWorkout(updatedWorkout)

          // Expand the new exercise
          setExpandedExercises((prev) => ({
            ...prev,
            [newExerciseEntry.id]: true,
          }))

          // Save the updated workout
          saveWorkout(updatedWorkout)
        }
      },
    })
  }

  // Add a set to an exercise
  const addSet = (exerciseId: string) => {
    if (workout) {
      const updatedExercises = workout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          // Get the last set to copy its values
          const lastSet = exercise.sets[exercise.sets.length - 1]
          const newSet: WorkoutSet = {
            id: uuidv4(),
            reps: lastSet ? lastSet.reps : 8,
            weight: lastSet ? lastSet.weight : 0,
            isCompleted: false,
          }
          return {
            ...exercise,
            sets: [...exercise.sets, newSet],
          }
        }
        return exercise
      })

      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
      }

      setWorkout(updatedWorkout)
      saveWorkout(updatedWorkout)
    }
  }

  // Update a set's values
  const updateSet = (exerciseId: string, setId: string, field: "reps" | "weight", value: number) => {
    if (workout) {
      const updatedExercises = workout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          const updatedSets = exercise.sets.map((set) => {
            if (set.id === setId) {
              return {
                ...set,
                [field]: value,
              }
            }
            return set
          })
          return {
            ...exercise,
            sets: updatedSets,
          }
        }
        return exercise
      })

      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
      }

      setWorkout(updatedWorkout)
    }
  }

  // Toggle set completion
  const toggleSetCompletionWithRest = (exerciseId: string, setId: string) => {
    if (workout) {
      const updatedExercises = workout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          const updatedSets = exercise.sets.map((set) => {
            if (set.id === setId) {
              // If completing a set, show rest timer
              if (!set.isCompleted) {
                // Get rest time from exercise if available, or use default
                const exerciseEntry = exercise.sets.find((s) => s.id === setId)
                const restTime = exerciseEntry?.restSeconds || 60
                setCurrentRestTime(restTime)
                //setRestTimerVisible(true)
                setShowRestTimer(true)
              }
              return {
                ...set,
                isCompleted: !set.isCompleted,
              }
            }
            return set
          })
          return {
            ...exercise,
            sets: updatedSets,
          }
        }
        return exercise
      })

      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
      }

      setWorkout(updatedWorkout)
      saveWorkout(updatedWorkout)
    }
  }

  // Delete a set
  const deleteSet = (exerciseId: string, setId: string) => {
    if (workout) {
      const updatedExercises = workout.exercises.map((exercise) => {
        if (exercise.id === exerciseId) {
          // Ensure at least one set remains
          if (exercise.sets.length > 1) {
            return {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          }
        }
        return exercise
      })

      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
      }

      setWorkout(updatedWorkout)
      saveWorkout(updatedWorkout)
    }
  }

  // Complete the workout
  const completeWorkout = async () => {
    if (workout) {
      // Stop the timer
      setIsTimerRunning(false)

      // Update workout
      const updatedWorkout = {
        ...workout,
        isCompleted: true,
        duration: timer / 60, // Convert seconds to minutes
      }

      // Save the workout
      await saveWorkout(updatedWorkout)

      // Navigate to the journal entry screen to log thoughts
      navigation.navigate("AddJournalEntry", { workoutId: workout.id })
    }
  }

  const handleStartWorkout = () => {
    navigation.navigate("CreateWorkout")
  }

  const handleContinueWorkout = () => {
    if (activeWorkout) {
      navigation.navigate("WorkoutInProgress", { workoutId: activeWorkout.id })
    }
  }

  const handleViewWorkout = (workoutId: string) => {
    navigation.navigate("WorkoutDetail", { workoutId })
  }

  const handleOpenRestTimer = () => {
    setShowRestTimer(true)
  }

  const handleShareWorkout = (workout: Workout) => {
    setWorkoutToShare(workout)
    setShowShareModal(true)
    setShowOptionsMenu(null)
  }

  const handleCheckPRs = async (workout: Workout) => {
    try {
      const newPRs = await checkForPersonalRecords(workout)

      if (newPRs.length > 0) {
        Alert.alert("New Personal Records!", `You've set ${newPRs.length} new personal record(s) in this workout!`, [
          {
            text: "View PRs",
            onPress: () => navigation.navigate("PersonalRecords"),
          },
          {
            text: "OK",
            style: "cancel",
          },
        ])
      } else {
        Alert.alert("No New PRs", "Keep pushing! You'll break your records soon.")
      }
    } catch (error) {
      console.error("Error checking for PRs:", error)
    }

    setShowOptionsMenu(null)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const renderWorkoutCard = (workout: Workout, isRecent = false) => {
    return (
      <View key={workout.id} style={styles.workoutCard}>
        <TouchableOpacity style={styles.workoutCardContent} onPress={() => handleViewWorkout(workout.id)}>
          <View style={styles.workoutCardHeader}>
            <Text style={styles.workoutName}>{workout.name}</Text>

            {isRecent && (
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => setShowOptionsMenu(workout.id === showOptionsMenu ? null : workout.id)}
              >
                <MoreVertical stroke={theme.colors.textSecondary} size={20} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.workoutMeta}>
            <View style={styles.metaItem}>
              <Calendar stroke={theme.colors.textSecondary} size={16} />
              <Text style={styles.metaText}>{formatDate(workout.date)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Dumbbell stroke={theme.colors.textSecondary} size={16} />
              <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
            </View>

            {workout.duration > 0 && (
              <View style={styles.metaItem}>
                <Clock stroke={theme.colors.textSecondary} size={16} />
                <Text style={styles.metaText}>{formatDuration(workout.duration)}</Text>
              </View>
            )}
          </View>

          {isRecent && showOptionsMenu === workout.id && (
            <View style={styles.optionsMenu}>
              <TouchableOpacity style={styles.optionItem} onPress={() => handleShareWorkout(workout)}>
                <Share2 stroke={theme.colors.textPrimary} size={18} />
                <Text style={styles.optionText}>Share Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={() => handleCheckPRs(workout)}>
                <Award stroke={theme.colors.textPrimary} size={18} />
                <Text style={styles.optionText}>Check for PRs</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Workout</Text>
            <TouchableOpacity style={styles.timerButton} onPress={handleOpenRestTimer}>
              <Timer stroke={theme.colors.primary} size={20} />
              <Text style={styles.timerButtonText}>Rest Timer</Text>
            </TouchableOpacity>
          </View>

          {activeWorkout ? (
            <View>
              {renderWorkoutCard(activeWorkout)}

              <TouchableOpacity style={styles.continueButton} onPress={handleContinueWorkout}>
                <Text style={styles.continueButtonText}>Continue Workout</Text>
                <ChevronRight stroke={theme.colors.white} size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.startWorkoutButton} onPress={handleStartWorkout}>
              <Plus stroke={theme.colors.white} size={24} />
              <Text style={styles.startWorkoutText}>Start New Workout</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => navigation.navigate("WorkoutHistory")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => renderWorkoutCard(workout, true))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent workouts</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Templates")}>
              <Dumbbell stroke={theme.colors.primary} size={24} />
              <Text style={styles.quickActionText}>Workout Templates</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Calendar")}>
              <Calendar stroke={theme.colors.primary} size={24} />
              <Text style={styles.quickActionText}>Workout Calendar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("PersonalRecords")}>
              <Award stroke={theme.colors.primary} size={24} />
              <Text style={styles.quickActionText}>Personal Records</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("Goals")}>
              <Award stroke={theme.colors.primary} size={24} />
              <Text style={styles.quickActionText}>Goals</Text>
            </TouchableOpacity>
          </View>
        </View>

        {workout && (
          <View style={styles.section}>
            <View style={styles.header}>
              <TextInput
                style={styles.workoutName}
                value={workout.name}
                onChangeText={(text) => {
                  const updatedWorkout = { ...workout, name: text }
                  setWorkout(updatedWorkout)
                  saveWorkout(updatedWorkout)
                }}
                placeholder="Workout Name"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <View style={styles.timerContainer}>
                <Clock stroke={theme.colors.textSecondary} size={16} />
                <Text style={styles.timer}>{formatTimer()}</Text>
              </View>
            </View>

            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <TouchableOpacity style={styles.exerciseHeader} onPress={() => toggleExerciseExpanded(exercise.id)}>
                  <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                  {expandedExercises[exercise.id] ? (
                    <ChevronUp stroke={theme.colors.textSecondary} size={20} />
                  ) : (
                    <ChevronDown stroke={theme.colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>

                {expandedExercises[exercise.id] && (
                  <View style={styles.exerciseContent}>
                    <View style={styles.setHeader}>
                      <Text style={styles.setText}>SET</Text>
                      <Text style={styles.repText}>REPS</Text>
                      <Text style={styles.weightText}>WEIGHT</Text>
                      <Text style={styles.doneText}>DONE</Text>
                    </View>

                    {exercise.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <View style={styles.setNumberContainer}>
                          <Text style={styles.setNumber}>{index + 1}</Text>
                          <TouchableOpacity
                            onPress={() => deleteSet(exercise.id, set.id)}
                            style={styles.deleteSetButton}
                          >
                            <X stroke={theme.colors.textTertiary} size={14} />
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          style={styles.repInput}
                          value={set.reps.toString()}
                          onChangeText={(text) => {
                            const value = Number.parseInt(text) || 0
                            updateSet(exercise.id, set.id, "reps", value)
                          }}
                          onBlur={() => saveWorkout(workout)}
                          keyboardType="number-pad"
                        />
                        <TextInput
                          style={styles.weightInput}
                          value={set.weight.toString()}
                          onChangeText={(text) => {
                            const value = Number.parseInt(text) || 0
                            updateSet(exercise.id, set.id, "weight", value)
                          }}
                          onBlur={() => saveWorkout(workout)}
                          keyboardType="number-pad"
                        />
                        <TouchableOpacity
                          style={[styles.completedButton, set.isCompleted && styles.completedButtonActive]}
                          onPress={() => toggleSetCompletionWithRest(exercise.id, set.id)}
                        >
                          {set.isCompleted && <Check stroke={theme.colors.white} size={16} />}
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
                      <Plus stroke={theme.colors.primary} size={16} />
                      <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
              <Plus stroke={theme.colors.white} size={18} />
              <Text style={styles.addExerciseText}>Add Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <RestTimerModal visible={showRestTimer} onClose={() => setShowRestTimer(false)} />

      <ShareWorkoutModal visible={showShareModal} workout={workoutToShare} onClose={() => setShowShareModal(false)} />

      {workout && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.completeButton} onPress={completeWorkout}>
            <Save stroke={theme.colors.white} size={18} />
            <Text style={styles.completeButtonText}>Complete Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
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
  section: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  seeAllText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  workoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  workoutCardContent: {
    padding: theme.spacing.md,
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  workoutName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  workoutMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  metaText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  startWorkoutButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  startWorkoutText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginRight: theme.spacing.xs,
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: "48%",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  quickActionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  optionsButton: {
    padding: theme.spacing.xs,
  },
  optionsMenu: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  optionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.sm,
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  timerButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  workoutName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    flex: 1,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  timer: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100, // Leave space for the footer
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  exerciseName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  exerciseContent: {
    padding: theme.spacing.md,
  },
  setHeader: {
    flexDirection: "row",
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  setText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    width: 50,
  },
  repText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    width: 70,
    textAlign: "center",
  },
  weightText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
    textAlign: "center",
  },
  doneText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    width: 50,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  setNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
  },
  setNumber: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    width: 30,
  },
  deleteSetButton: {
    padding: 4,
  },
  repInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    padding: theme.spacing.sm,
    width: 70,
  },
  weightInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    padding: theme.spacing.sm,
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  completedButton: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  completedButtonActive: {
    backgroundColor: theme.colors.success,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  addSetText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  addExerciseButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  addExerciseText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  completeButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
  },
  completeButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
})

