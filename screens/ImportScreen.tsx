"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native"
import { theme } from "../theme"
import { pickFileToImport, importFromFile } from "../services/importService"
import { ChevronLeft, FileUp, Check, AlertCircle } from "lucide-react-native"
import type { Workout } from "../models/Workout"
import type { Exercise } from "../models/Exercise"

export default function ImportScreen({ navigation }: any) {
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    workouts: Workout[]
    exercises: Exercise[]
    source: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const fileUri = await pickFileToImport()
      if (!fileUri) {
        setIsLoading(false)
        return
      }

      const result = await importFromFile(fileUri)
      setImportResult(result)
    } catch (error) {
      console.error("Import error:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = () => {
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Workouts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Import your workout history from other fitness apps. We currently support Hevy, Strong, and Liftin' app
          exports.
        </Text>

        <View style={styles.supportedAppsContainer}>
          <Text style={styles.supportedAppsTitle}>Supported Apps:</Text>
          <View style={styles.appsList}>
            <View style={styles.appItem}>
              <Text style={styles.appName}>Hevy</Text>
              <Text style={styles.appFormat}>(JSON)</Text>
            </View>
            <View style={styles.appItem}>
              <Text style={styles.appName}>Strong</Text>
              <Text style={styles.appFormat}>(JSON)</Text>
            </View>
            <View style={styles.appItem}>
              <Text style={styles.appName}>Liftin'</Text>
              <Text style={styles.appFormat}>(CSV)</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to export from other apps:</Text>

          <Text style={styles.appInstructionsTitle}>Hevy:</Text>
          <Text style={styles.instructionsText}>
            1. Go to Profile tab{"\n"}
            2. Tap on Settings (gear icon){"\n"}
            3. Scroll down and tap "Export Data"{"\n"}
            4. Choose "Export as JSON"
          </Text>

          <Text style={styles.appInstructionsTitle}>Strong:</Text>
          <Text style={styles.instructionsText}>
            1. Go to the History tab{"\n"}
            2. Tap on the three dots in the top right{"\n"}
            3. Select "Export"{"\n"}
            4. Choose "Export as JSON"
          </Text>

          <Text style={styles.appInstructionsTitle}>Liftin':</Text>
          <Text style={styles.instructionsText}>
            1. Go to Settings{"\n"}
            2. Tap on "Export Data"{"\n"}
            3. Choose "Export as CSV"
          </Text>
        </View>

        {!isLoading && !importResult && (
          <TouchableOpacity style={styles.importButton} onPress={handleImport}>
            <FileUp stroke={theme.colors.white} size={20} />
            <Text style={styles.importButtonText}>Select File to Import</Text>
          </TouchableOpacity>
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Importing your workouts...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <AlertCircle stroke={theme.colors.error} size={24} />
            <Text style={styles.errorText}>Error: {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleImport}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {importResult && (
          <View style={styles.successContainer}>
            <Check stroke={theme.colors.success} size={24} />
            <Text style={styles.successTitle}>Import Successful!</Text>
            <Text style={styles.successText}>Successfully imported from {importResult.source}:</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{importResult.workouts.length}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{importResult.exercises.length}</Text>
                <Text style={styles.statLabel}>New Exercises</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  description: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.lg,
  },
  supportedAppsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  supportedAppsTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  appsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  appItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  appName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  appFormat: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    marginLeft: theme.spacing.xs,
  },
  instructionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  instructionsTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  appInstructionsTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  instructionsText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  importButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  importButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  successContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.sm,
  },
  successText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    marginTop: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: theme.spacing.lg,
  },
  statItem: {
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
  doneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
  },
  doneButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
})

