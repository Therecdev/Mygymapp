"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { theme } from "../theme"
import { getAllGoals, getGoalsByStatus, updateGoalStatus, deleteGoal } from "../services/goalService"
import type { Goal, GoalStatus } from "../models/Goal"
import {
  ChevronLeft,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  BarChart3,
} from "lucide-react-native"

export default function GoalsScreen({ navigation }: any) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | "all">("active")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGoals()
  }, [])

  useEffect(() => {
    filterGoals()
  }, [selectedStatus])

  const loadGoals = async () => {
    setIsLoading(true)
    try {
      const allGoals = await getAllGoals()
      setGoals(allGoals)
    } catch (error) {
      console.error("Error loading goals:", error)
      Alert.alert("Error", "Could not load goals.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterGoals = async () => {
    setIsLoading(true)
    try {
      if (selectedStatus === "all") {
        const allGoals = await getAllGoals()
        setGoals(allGoals)
      } else {
        const filteredGoals = await getGoalsByStatus(selectedStatus)
        setGoals(filteredGoals)
      }
    } catch (error) {
      console.error("Error filtering goals:", error)
      Alert.alert("Error", "Could not filter goals.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoal(id)
            loadGoals()
          } catch (error) {
            console.error("Error deleting goal:", error)
            Alert.alert("Error", "Could not delete goal.")
          }
        },
      },
    ])
  }

  const handleUpdateGoalStatus = async (id: string, status: GoalStatus) => {
    try {
      await updateGoalStatus(id, status)
      loadGoals()
    } catch (error) {
      console.error("Error updating goal status:", error)
      Alert.alert("Error", "Could not update goal status.")
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "workout_frequency":
        return <Clock stroke={theme.colors.primary} size={20} />
      case "exercise_weight":
        return <BarChart3 stroke={theme.colors.success} size={20} />
      case "exercise_volume":
        return <BarChart3 stroke={theme.colors.warning} size={20} />
      case "body_measurement":
        return <BarChart3 stroke={theme.colors.info} size={20} />
      default:
        return <Target stroke={theme.colors.primary} size={20} />
    }
  }

  const getGoalProgress = (goal: Goal) => {
    const progress = (goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue)
    return Math.min(Math.max(progress, 0), 1) * 100
  }

  const getGoalStatusColor = (status: GoalStatus) => {
    switch (status) {
      case "active":
        return theme.colors.primary
      case "completed":
        return theme.colors.success
      case "failed":
        return theme.colors.error
      case "abandoned":
        return theme.colors.textTertiary
      default:
        return theme.colors.textSecondary
    }
  }

  const getGoalStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case "active":
        return <Clock stroke={theme.colors.primary} size={16} />
      case "completed":
        return <CheckCircle stroke={theme.colors.success} size={16} />
      case "failed":
        return <XCircle stroke={theme.colors.error} size={16} />
      case "abandoned":
        return <XCircle stroke={theme.colors.textTertiary} size={16} />
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goals</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === "all" && styles.filterTabSelected]}
            onPress={() => setSelectedStatus("all")}
          >
            <Target stroke={selectedStatus === "all" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedStatus === "all" && styles.filterTabTextSelected]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === "active" && styles.filterTabSelected]}
            onPress={() => setSelectedStatus("active")}
          >
            <Clock stroke={selectedStatus === "active" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedStatus === "active" && styles.filterTabTextSelected]}>
              Active
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === "completed" && styles.filterTabSelected]}
            onPress={() => setSelectedStatus("completed")}
          >
            <CheckCircle
              stroke={selectedStatus === "completed" ? theme.colors.white : theme.colors.textSecondary}
              size={16}
            />
            <Text style={[styles.filterTabText, selectedStatus === "completed" && styles.filterTabTextSelected]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedStatus === "failed" && styles.filterTabSelected]}
            onPress={() => setSelectedStatus("failed")}
          >
            <XCircle stroke={selectedStatus === "failed" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedStatus === "failed" && styles.filterTabTextSelected]}>
              Failed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Goals List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading goals...</Text>
        </View>
      ) : (
        <ScrollView style={styles.goalsList}>
          {goals.length > 0 ? (
            goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => navigation.navigate("GoalDetail", { goalId: goal.id })}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalTypeContainer}>
                    {getGoalTypeIcon(goal.type)}
                    <Text style={styles.goalType}>
                      {goal.type
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: getGoalStatusColor(goal.status) + "33" }]}>
                    {getGoalStatusIcon(goal.status)}
                    <Text style={[styles.statusText, { color: getGoalStatusColor(goal.status) }]}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.goalName}>{goal.name}</Text>

                {goal.status === "active" && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${getGoalProgress(goal)}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {goal.currentValue} / {goal.targetValue} ({Math.round(getGoalProgress(goal))}%)
                    </Text>
                  </View>
                )}

                <View style={styles.goalFooter}>
                  <View style={styles.dateContainer}>
                    <Clock stroke={theme.colors.textSecondary} size={14} />
                    <Text style={styles.dateText}>Target: {formatDate(goal.targetDate)}</Text>
                  </View>

                  <View style={styles.goalActions}>
                    {goal.status === "active" && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.completeButton]}
                          onPress={() => handleUpdateGoalStatus(goal.id, "completed")}
                        >
                          <CheckCircle stroke={theme.colors.success} size={16} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.abandonButton]}
                          onPress={() => handleUpdateGoalStatus(goal.id, "abandoned")}
                        >
                          <XCircle stroke={theme.colors.textTertiary} size={16} />
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteGoal(goal.id)}>
                      <Trash2 stroke={theme.colors.error} size={16} />
                    </TouchableOpacity>

                    <ChevronRight stroke={theme.colors.textSecondary} size={16} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Target stroke={theme.colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>No goals found. Tap the + button to create a new goal.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Goal FAB */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("CreateGoal")}>
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
  filterContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: theme.spacing.md,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  filterTabSelected: {
    backgroundColor: theme.colors.primary,
  },
  filterTabText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  filterTabTextSelected: {
    color: theme.colors.white,
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
  goalsList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  goalTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goalType: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: 4,
  },
  goalName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    textAlign: "right",
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  goalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  completeButton: {
    backgroundColor: theme.colors.success + "22",
    borderRadius: theme.borderRadius.sm,
  },
  abandonButton: {
    backgroundColor: theme.colors.gray700 + "22",
    borderRadius: theme.borderRadius.sm,
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

