"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { theme } from "../theme"
import { stoicQuotes } from "../data/stoicQuotes"
import { getRecentWorkouts } from "../services/workoutService"
import { Dumbbell, ChevronRight, TrendingUp } from "lucide-react-native"
import type { Workout } from "../models/Workout"

export default function DashboardScreen({ navigation }: any) {
  const [quote, setQuote] = useState({ text: "", author: "" })
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    // Set a random stoic quote
    const randomIndex = Math.floor(Math.random() * stoicQuotes.length)
    setQuote(stoicQuotes[randomIndex])

    // Load recent workouts
    const loadWorkouts = async () => {
      const workouts = await getRecentWorkouts(5)
      setRecentWorkouts(workouts)
    }

    loadWorkouts()
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stoic Quote Section */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>PR's</Text>
            </View>
          </View>
        </View>

        {/* Continue Workout */}
        <View style={styles.continueContainer}>
          <Text style={styles.sectionTitle}>Continue Workout</Text>
          <TouchableOpacity style={styles.continueWorkoutCard} onPress={() => navigation.navigate("Workout")}>
            <View style={styles.continueWorkoutCardContent}>
              <Dumbbell stroke={theme.colors.primary} size={24} />
              <View style={styles.continueWorkoutCardText}>
                <Text style={styles.continueWorkoutTitle}>Upper Body</Text>
                <Text style={styles.continueWorkoutSubtitle}>6 exercises • 45-60 minutes</Text>
              </View>
            </View>
            <ChevronRight stroke={theme.colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Recommended Workouts */}
        <View style={styles.recommendedContainer}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <View style={styles.recommendedCard}>
            <View style={styles.recommendedIconContainer}>
              <TrendingUp stroke={theme.colors.success} size={20} />
            </View>
            <View style={styles.recommendedTextContainer}>
              <Text style={styles.recommendedTitle}>Increase Bench Press</Text>
              <Text style={styles.recommendedDescription}>Based on your last 3 sessions, try 5x5 at 185 lbs</Text>
            </View>
          </View>
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
  quoteContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  quoteText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
    lineHeight: 24,
  },
  quoteAuthor: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    textAlign: "right",
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: "31%",
    alignItems: "center",
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  continueContainer: {
    marginBottom: theme.spacing.lg,
  },
  continueWorkoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  continueWorkoutCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  continueWorkoutCardText: {
    marginLeft: theme.spacing.md,
  },
  continueWorkoutTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  continueWorkoutSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
  recommendedContainer: {
    marginBottom: theme.spacing.lg,
  },
  recommendedCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },
  recommendedIconContainer: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  recommendedTextContainer: {
    flex: 1,
  },
  recommendedTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  recommendedDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
})

