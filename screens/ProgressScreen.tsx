"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { theme } from "../theme"
import { getAllWorkouts } from "../services/workoutService"
import type { Workout } from "../models/Workout"
import { LineChart } from "react-native-chart-kit"
import { ChevronDown, ChevronUp, Award } from "lucide-react-native"

export default function ProgressScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)
  const [exerciseStats, setExerciseStats] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    volume: true,
    prs: true,
  })

  useEffect(() => {
    const loadWorkouts = async () => {
      const allWorkouts = await getAllWorkouts()
      setWorkouts(allWorkouts.filter((workout) => workout.isCompleted))

      // If we have workouts, extract exercises
      if (allWorkouts.length > 0) {
        // Get all unique exercises
        const exerciseMap = new Map()

        allWorkouts.forEach((workout) => {
          workout.exercises.forEach((exercise) => {
            if (!exerciseMap.has(exercise.exerciseId)) {
              exerciseMap.set(exercise.exerciseId, {
                id: exercise.exerciseId,
                name: exercise.exercise.name,
              })
            }
          })
        })

        // If no exercise is selected, select the first one
        if (!selectedExercise && exerciseMap.size > 0) {
          setSelectedExercise(Array.from(exerciseMap.values())[0].id)
        }

        // Generate exercise stats for the selected exercise
        if (selectedExercise) {
          generateExerciseStats(allWorkouts, selectedExercise)
        }
      }
    }

    loadWorkouts()
  }, [selectedExercise])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const generateExerciseStats = (workouts: Workout[], exerciseId: string) => {
    // Filter to workouts that include this exercise
    const relevantWorkouts = workouts
      .filter((workout) => workout.exercises.some((exercise) => exercise.exerciseId === exerciseId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Extract data for each workout
    const stats = relevantWorkouts
      .map((workout) => {
        const exercise = workout.exercises.find((e) => e.exerciseId === exerciseId)
        if (!exercise) return null

        // Calculate volume (sum of weight * reps for all sets)
        const volume = exercise.sets.reduce((total, set) => {
          return total + set.weight * set.reps
        }, 0)

        // Find max weight
        const maxWeight = Math.max(...exercise.sets.map((set) => set.weight))

        // Calculate estimated 1RM using Epley formula: weight * (1 + reps/30)
        const maxSet = exercise.sets.reduce(
          (max, set) => {
            const e1rm = set.weight * (1 + set.reps / 30)
            return e1rm > max.e1rm ? { e1rm, weight: set.weight, reps: set.reps } : max
          },
          { e1rm: 0, weight: 0, reps: 0 },
        )

        return {
          date: new Date(workout.date),
          formattedDate: new Date(workout.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          volume,
          maxWeight,
          e1rm: maxSet.e1rm,
          bestSet: `${maxSet.weight} × ${maxSet.reps}`,
        }
      })
      .filter((stat) => stat !== null)

    setExerciseStats(stats as any[])
  }

  // Determine if there's a new PR
  const calculatePRs = () => {
    if (exerciseStats.length < 2) return []

    const prs = []
    const latestStats = exerciseStats[exerciseStats.length - 1]
    const previousBest = {
      volume: 0,
      maxWeight: 0,
      e1rm: 0,
    }

    // Find previous bests
    for (let i = 0; i < exerciseStats.length - 1; i++) {
      const stat = exerciseStats[i]
      previousBest.volume = Math.max(previousBest.volume, stat.volume)
      previousBest.maxWeight = Math.max(previousBest.maxWeight, stat.maxWeight)
      previousBest.e1rm = Math.max(previousBest.e1rm, stat.e1rm)
    }

    // Check if latest stats are PRs
    if (latestStats.volume > previousBest.volume) {
      prs.push({
        type: "Volume",
        value: `${latestStats.volume.toLocaleString()} lbs`,
        improvement: `+${(latestStats.volume - previousBest.volume).toLocaleString()} lbs`,
      })
    }

    if (latestStats.maxWeight > previousBest.maxWeight) {
      prs.push({
        type: "Max Weight",
        value: `${latestStats.maxWeight} lbs`,
        improvement: `+${latestStats.maxWeight - previousBest.maxWeight} lbs`,
      })
    }

    if (latestStats.e1rm > previousBest.e1rm) {
      prs.push({
        type: "Est. 1RM",
        value: `${Math.round(latestStats.e1rm)} lbs`,
        improvement: `+${Math.round(latestStats.e1rm - previousBest.e1rm)} lbs`,
      })
    }

    return prs
  }

  const prs = exerciseStats.length >= 2 ? calculatePRs() : []

  const chartData = {
    labels: exerciseStats.map((stat) => stat.formattedDate),
    datasets: [
      {
        data: exerciseStats.map((stat) => Math.round(stat.e1rm)),
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
    legend: ["Estimated 1RM"],
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Exercise Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.sectionTitle}>Select Exercise</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exercisesScroll}>
            {workouts
              .flatMap((workout) => workout.exercises)
              .filter((exercise, index, self) => index === self.findIndex((e) => e.exerciseId === exercise.exerciseId))
              .map((exercise) => (
                <TouchableOpacity
                  key={exercise.exerciseId}
                  style={[styles.exerciseChip, selectedExercise === exercise.exerciseId && styles.exerciseChipSelected]}
                  onPress={() => setSelectedExercise(exercise.exerciseId)}
                >
                  <Text
                    style={[
                      styles.exerciseChipText,
                      selectedExercise === exercise.exerciseId && styles.exerciseChipTextSelected,
                    ]}
                  >
                    {exercise.exercise.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Performance Overview */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("overview")}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            {expandedSections.overview ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.overview && (
            <>
              {exerciseStats.length > 1 ? (
                <View style={styles.chartContainer}>
                  <LineChart
                    data={chartData}
                    width={350}
                    height={220}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      decimalPlaces: 0,
                      color: (opacity = 1) => theme.colors.primary,
                      labelColor: (opacity = 1) => theme.colors.textSecondary,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: theme.colors.primary,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              ) : (
                <Text style={styles.noDataText}>Not enough data to display chart. Complete more workouts.</Text>
              )}
            </>
          )}
        </View>

        {/* Volume Tracking */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("volume")}>
            <Text style={styles.sectionTitle}>Volume Tracking</Text>
            {expandedSections.volume ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.volume && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>DATE</Text>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>VOLUME</Text>
                <Text style={[styles.tableHeaderText, { flex: 3 }]}>BEST SET</Text>
              </View>

              {exerciseStats.map((stat, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{stat.formattedDate}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{stat.volume.toLocaleString()} lbs</Text>
                  <Text style={[styles.tableCell, { flex: 3 }]}>{stat.bestSet}</Text>
                </View>
              ))}

              {exerciseStats.length === 0 && (
                <Text style={styles.noDataText}>No workout data available for this exercise.</Text>
              )}
            </View>
          )}
        </View>

        {/* Personal Records */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("prs")}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            {expandedSections.prs ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.prs && (
            <View style={styles.prContainer}>
              {prs.length > 0 ? (
                prs.map((pr, index) => (
                  <View key={index} style={styles.prCard}>
                    <Award stroke={theme.colors.primary} size={24} />
                    <View style={styles.prContent}>
                      <Text style={styles.prType}>{pr.type} PR</Text>
                      <Text style={styles.prValue}>{pr.value}</Text>
                      <Text style={styles.prImprovement}>{pr.improvement}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>
                  {exerciseStats.length < 2
                    ? "Complete more workouts to track PRs."
                    : "No new personal records in your latest workout."}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  selectorContainer: {
    marginBottom: theme.spacing.lg,
  },
  exercisesScroll: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  exerciseChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  exerciseChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  exerciseChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  exerciseChipTextSelected: {
    color: theme.colors.white,
  },
  sectionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: (expandedSections) => (expandedSections ? 1 : 0),
    borderBottomColor: theme.colors.surfaceLight,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chartContainer: {
    padding: theme.spacing.sm,
    alignItems: "center",
  },
  chart: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  tableContainer: {
    padding: theme.spacing.md,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tableHeaderText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  tableCell: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    textAlign: "center",
    padding: theme.spacing.md,
  },
  prContainer: {
    padding: theme.spacing.md,
  },
  prCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  prContent: {
    marginLeft: theme.spacing.md,
  },
  prType: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  prValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: 2,
  },
  prImprovement: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
})

