"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { theme } from "../theme"
import { getAllWorkouts } from "../services/workoutService"
import { getMeasurementsByType } from "../services/measurementService"
import type { Workout } from "../models/Workout"
import type { Measurement } from "../models/Measurement"
import { LineChart, BarChart } from "react-native-chart-kit"
import { ChevronLeft, ChevronDown, ChevronUp, Calendar, Dumbbell, TrendingUp, Scale } from "lucide-react-native"

export default function AdvancedAnalyticsScreen({ navigation }: any) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [weightMeasurements, setWeightMeasurements] = useState<Measurement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    workoutFrequency: true,
    volumeProgress: true,
    weightProgress: true,
    muscleBalance: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load workouts
      const allWorkouts = await getAllWorkouts()
      const completedWorkouts = allWorkouts.filter((workout) => workout.isCompleted)
      setWorkouts(completedWorkouts)

      // Load weight measurements
      const weightData = await getMeasurementsByType("weight")
      setWeightMeasurements(weightData)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Calculate workout frequency by week
  const getWorkoutFrequencyData = () => {
    // Group workouts by week
    const now = new Date()
    const sixWeeksAgo = new Date()
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42) // 6 weeks ago

    const weeklyWorkouts: Record<string, number> = {}

    // Initialize all weeks with 0
    for (let i = 0; i < 6; i++) {
      const weekStart = new Date(sixWeeksAgo)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekLabel = `W${i + 1}`
      weeklyWorkouts[weekLabel] = 0
    }

    // Count workouts per week
    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date)
      if (workoutDate >= sixWeeksAgo && workoutDate <= now) {
        // Calculate which week this workout belongs to
        const daysSinceStart = Math.floor((workoutDate.getTime() - sixWeeksAgo.getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysSinceStart / 7)
        if (weekIndex >= 0 && weekIndex < 6) {
          const weekLabel = `W${weekIndex + 1}`
          weeklyWorkouts[weekLabel] = (weeklyWorkouts[weekLabel] || 0) + 1
        }
      }
    })

    return {
      labels: Object.keys(weeklyWorkouts),
      datasets: [
        {
          data: Object.values(weeklyWorkouts),
          color: () => theme.colors.primary,
        },
      ],
    }
  }

  // Calculate volume progress for a specific exercise
  const getVolumeProgressData = () => {
    // For simplicity, we'll track total workout volume over time
    const last10Workouts = [...workouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .reverse()

    const volumeData = last10Workouts.map((workout) => {
      // Calculate total volume (weight * reps) for the workout
      let totalVolume = 0
      workout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.isCompleted) {
            totalVolume += set.weight * set.reps
          }
        })
      })
      return totalVolume
    })

    const labels = last10Workouts.map((workout) => {
      const date = new Date(workout.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    return {
      labels,
      datasets: [
        {
          data: volumeData,
          color: () => theme.colors.primary,
          strokeWidth: 2,
        },
      ],
      legend: ["Total Volume"],
    }
  }

  // Calculate weight progress
  const getWeightProgressData = () => {
    if (weightMeasurements.length === 0) {
      return null
    }

    const last10Measurements = [...weightMeasurements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .reverse()

    const labels = last10Measurements.map((measurement) => {
      const date = new Date(measurement.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })

    const data = last10Measurements.map((measurement) => measurement.value)

    return {
      labels,
      datasets: [
        {
          data,
          color: () => theme.colors.info,
          strokeWidth: 2,
        },
      ],
      legend: ["Body Weight"],
    }
  }

  // Calculate muscle group balance
  const getMuscleBalanceData = () => {
    const muscleGroups: Record<string, number> = {
      Chest: 0,
      Back: 0,
      Shoulders: 0,
      Arms: 0,
      Legs: 0,
      Core: 0,
    }

    // Count sets per muscle group
    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const completedSets = exercise.sets.filter((set) => set.isCompleted).length

        if (completedSets === 0) return

        // Map exercise muscle groups to our simplified categories
        const primaryMuscle = exercise.exercise.primaryMuscleGroups[0]

        if (["chest"].includes(primaryMuscle)) {
          muscleGroups["Chest"] += completedSets
        } else if (["back", "lats", "traps"].includes(primaryMuscle)) {
          muscleGroups["Back"] += completedSets
        } else if (["shoulders"].includes(primaryMuscle)) {
          muscleGroups["Shoulders"] += completedSets
        } else if (["biceps", "triceps", "forearms"].includes(primaryMuscle)) {
          muscleGroups["Arms"] += completedSets
        } else if (["quadriceps", "hamstrings", "calves", "glutes"].includes(primaryMuscle)) {
          muscleGroups["Legs"] += completedSets
        } else if (["abdominals", "obliques"].includes(primaryMuscle)) {
          muscleGroups["Core"] += completedSets
        }
      })
    })

    return {
      labels: Object.keys(muscleGroups),
      datasets: [
        {
          data: Object.values(muscleGroups),
          color: (opacity = 1) => {
            // Generate different colors for each bar
            const colors = [
              theme.colors.primary,
              theme.colors.success,
              theme.colors.warning,
              theme.colors.info,
              theme.colors.error,
              theme.colors.primaryLight,
            ]
            return colors[Math.floor(Math.random() * colors.length)]
          },
        },
      ],
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Workout Frequency */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("workoutFrequency")}>
            <View style={styles.sectionTitleContainer}>
              <Calendar stroke={theme.colors.primary} size={20} />
              <Text style={styles.sectionTitle}>Workout Frequency</Text>
            </View>
            {expandedSections.workoutFrequency ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.workoutFrequency && (
            <View style={styles.chartContainer}>
              {workouts.length > 0 ? (
                <>
                  <Text style={styles.chartDescription}>Workouts per week over the last 6 weeks</Text>
                  <BarChart
                    data={getWorkoutFrequencyData()}
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
                      barPercentage: 0.7,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                  />
                </>
              ) : (
                <Text style={styles.noDataText}>
                  No workout data available. Complete workouts to see your frequency.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Volume Progress */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("volumeProgress")}>
            <View style={styles.sectionTitleContainer}>
              <Dumbbell stroke={theme.colors.primary} size={20} />
              <Text style={styles.sectionTitle}>Volume Progress</Text>
            </View>
            {expandedSections.volumeProgress ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.volumeProgress && (
            <View style={styles.chartContainer}>
              {workouts.length > 1 ? (
                <>
                  <Text style={styles.chartDescription}>Total workout volume over your last 10 workouts</Text>
                  <LineChart
                    data={getVolumeProgressData()}
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
                </>
              ) : (
                <Text style={styles.noDataText}>
                  Not enough workout data. Complete at least 2 workouts to see volume progress.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Weight Progress */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("weightProgress")}>
            <View style={styles.sectionTitleContainer}>
              <Scale stroke={theme.colors.primary} size={20} />
              <Text style={styles.sectionTitle}>Weight Progress</Text>
            </View>
            {expandedSections.weightProgress ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.weightProgress && (
            <View style={styles.chartContainer}>
              {weightMeasurements.length > 1 ? (
                <>
                  <Text style={styles.chartDescription}>Body weight measurements over time</Text>
                  <LineChart
                    data={getWeightProgressData()!}
                    width={350}
                    height={220}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      decimalPlaces: 1,
                      color: (opacity = 1) => theme.colors.info,
                      labelColor: (opacity = 1) => theme.colors.textSecondary,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: theme.colors.info,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </>
              ) : (
                <Text style={styles.noDataText}>
                  Not enough weight measurements. Add at least 2 weight measurements to see progress.
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Muscle Balance */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("muscleBalance")}>
            <View style={styles.sectionTitleContainer}>
              <TrendingUp stroke={theme.colors.primary} size={20} />
              <Text style={styles.sectionTitle}>Muscle Group Balance</Text>
            </View>
            {expandedSections.muscleBalance ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.muscleBalance && (
            <View style={styles.chartContainer}>
              {workouts.length > 0 ? (
                <>
                  <Text style={styles.chartDescription}>Distribution of sets across muscle groups</Text>
                  <BarChart
                    data={getMuscleBalanceData()}
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
                      barPercentage: 0.7,
                    }}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                  />
                </>
              ) : (
                <Text style={styles.noDataText}>
                  No workout data available. Complete workouts to see muscle group balance.
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
  backButton: {
    padding: theme.spacing.xs,
    width: 40,
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  chartContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
  },
  chartDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  chart: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    padding: theme.spacing.md,
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
})

