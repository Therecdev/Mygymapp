"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native"
import { theme } from "../theme"
import { Calendar as RNCalendar, type DateData } from "react-native-calendars"
import {
  getScheduledWorkoutsForDate,
  getScheduledWorkoutsForDateRange,
  startScheduledWorkout,
} from "../services/planningService"
import type { ScheduledWorkout } from "../models/WorkoutPlan"
import { Calendar, Clock, Play, Plus } from "lucide-react-native"

export default function CalendarScreen({ navigation }: any) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [markedDates, setMarkedDates] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingWorkout, setIsStartingWorkout] = useState(false)

  useEffect(() => {
    loadScheduledWorkouts()
  }, [])

  useEffect(() => {
    loadWorkoutsForDate(selectedDate)
  }, [selectedDate])

  const loadScheduledWorkouts = async () => {
    setIsLoading(true)
    try {
      // Get date range for current month
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      // Add buffer days for previous and next month
      startOfMonth.setDate(startOfMonth.getDate() - 7)
      endOfMonth.setDate(endOfMonth.getDate() + 7)

      const workouts = await getScheduledWorkoutsForDateRange(startOfMonth, endOfMonth)

      // Create marked dates object for calendar
      const marked: any = {}

      workouts.forEach((workout) => {
        const dateString = formatDateForCalendar(new Date(workout.date))

        if (!marked[dateString]) {
          marked[dateString] = {
            marked: true,
            dotColor: workout.isCompleted ? theme.colors.success : theme.colors.primary,
          }
        } else {
          // If there are multiple workouts on the same day
          marked[dateString].dots = [{ color: workout.isCompleted ? theme.colors.success : theme.colors.primary }]
        }
      })

      // Mark selected date
      const selectedDateString = formatDateForCalendar(selectedDate)
      marked[selectedDateString] = {
        ...marked[selectedDateString],
        selected: true,
        selectedColor: theme.colors.primary + "33", // 20% opacity
      }

      setMarkedDates(marked)
    } catch (error) {
      console.error("Error loading scheduled workouts:", error)
      Alert.alert("Error", "Could not load scheduled workouts.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadWorkoutsForDate = async (date: Date) => {
    try {
      const workouts = await getScheduledWorkoutsForDate(date)
      setScheduledWorkouts(workouts)

      // Update marked dates to highlight selected date
      const newMarkedDates = { ...markedDates }

      // Remove selected state from all dates
      Object.keys(newMarkedDates).forEach((dateString) => {
        if (newMarkedDates[dateString].selected) {
          const { selected, selectedColor, ...rest } = newMarkedDates[dateString]
          newMarkedDates[dateString] = rest
        }
      })

      // Mark new selected date
      const selectedDateString = formatDateForCalendar(date)
      newMarkedDates[selectedDateString] = {
        ...newMarkedDates[selectedDateString],
        selected: true,
        selectedColor: theme.colors.primary + "33", // 20% opacity
      }

      setMarkedDates(newMarkedDates)
    } catch (error) {
      console.error("Error loading workouts for date:", error)
    }
  }

  const formatDateForCalendar = (date: Date): string => {
    return date.toISOString().split("T")[0]
  }

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  const handleDateSelect = (date: DateData) => {
    const selectedDate = new Date(date.timestamp)
    setSelectedDate(selectedDate)
  }

  const handleStartWorkout = async (scheduledWorkoutId: string) => {
    try {
      setIsStartingWorkout(true)
      const workoutId = await startScheduledWorkout(scheduledWorkoutId)

      if (workoutId) {
        // Refresh the calendar data
        loadScheduledWorkouts()

        // Navigate to the workout screen
        navigation.navigate("Workout", { workoutId })
      } else {
        Alert.alert("Error", "Could not start the workout.")
      }
    } catch (error) {
      console.error("Error starting workout:", error)
      Alert.alert("Error", "Could not start the workout.")
    } finally {
      setIsStartingWorkout(false)
    }
  }

  const navigateToCreatePlan = () => {
    navigation.navigate("CreateWorkoutPlan")
  }

  return (
    <View style={styles.container}>
      {/* Calendar */}
      <RNCalendar
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.textSecondary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.white,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.textPrimary,
          textDisabledColor: theme.colors.textTertiary,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.white,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.textPrimary,
          indicatorColor: theme.colors.primary,
        }}
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        enableSwipeMonths={true}
      />

      {/* Selected Date Header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>{formatDateForDisplay(selectedDate)}</Text>
      </View>

      {/* Scheduled Workouts */}
      <ScrollView style={styles.workoutsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading workouts...</Text>
          </View>
        ) : scheduledWorkouts.length > 0 ? (
          scheduledWorkouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.templateName}</Text>
                <View style={styles.workoutTime}>
                  <Clock stroke={theme.colors.textSecondary} size={14} />
                  <Text style={styles.timeText}>
                    {new Date(workout.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                {workout.notes && <Text style={styles.workoutNotes}>{workout.notes}</Text>}
              </View>

              {workout.isCompleted ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => handleStartWorkout(workout.id)}
                  disabled={isStartingWorkout}
                >
                  {isStartingWorkout ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <>
                      <Play stroke={theme.colors.white} size={16} fill={theme.colors.white} />
                      <Text style={styles.startButtonText}>Start</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Calendar stroke={theme.colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No workouts scheduled for this day.</Text>
            <TouchableOpacity style={styles.createPlanButton} onPress={navigateToCreatePlan}>
              <Text style={styles.createPlanButtonText}>Create Workout Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Workout Plan FAB */}
      <TouchableOpacity style={styles.fab} onPress={navigateToCreatePlan}>
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
  dateHeader: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  dateText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  workoutsContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  workoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 4,
  },
  workoutTime: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  workoutNotes: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: "italic",
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  startButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  completedBadge: {
    backgroundColor: theme.colors.success + "33", // 20% opacity
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  completedText: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  createPlanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  createPlanButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.md,
  },
  fab: {
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

