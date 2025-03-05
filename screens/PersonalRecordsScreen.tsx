"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { theme } from "../theme"
import {
  getAllPersonalRecords,
  getPersonalRecordsByType,
  deletePersonalRecord,
} from "../services/personalRecordService"
import type { PersonalRecord } from "../models/PersonalRecord"
import { ChevronLeft, Award, Calendar, Dumbbell, TrendingUp, Clock, Trash2 } from "lucide-react-native"

export default function PersonalRecordsScreen({ navigation }: any) {
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [selectedType, setSelectedType] = useState<"weight" | "reps" | "volume" | "time" | "all">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  useEffect(() => {
    filterRecords()
  }, [selectedType])

  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const allRecords = await getAllPersonalRecords()
      setRecords(allRecords)
    } catch (error) {
      console.error("Error loading personal records:", error)
      Alert.alert("Error", "Could not load personal records.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterRecords = async () => {
    setIsLoading(true)
    try {
      if (selectedType === "all") {
        const allRecords = await getAllPersonalRecords()
        setRecords(allRecords)
      } else {
        const filteredRecords = await getPersonalRecordsByType(selectedType)
        setRecords(filteredRecords)
      }
    } catch (error) {
      console.error("Error filtering personal records:", error)
      Alert.alert("Error", "Could not filter personal records.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    Alert.alert("Delete Record", "Are you sure you want to delete this personal record?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePersonalRecord(id)
            loadRecords()
          } catch (error) {
            console.error("Error deleting personal record:", error)
            Alert.alert("Error", "Could not delete personal record.")
          }
        },
      },
    ])
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case "weight":
        return <Dumbbell stroke={theme.colors.primary} size={20} />
      case "reps":
        return <TrendingUp stroke={theme.colors.success} size={20} />
      case "volume":
        return <TrendingUp stroke={theme.colors.warning} size={20} />
      case "time":
        return <Clock stroke={theme.colors.info} size={20} />
      default:
        return <Award stroke={theme.colors.primary} size={20} />
    }
  }

  const getRecordTypeLabel = (type: string, value: number) => {
    switch (type) {
      case "weight":
        return `${value} lbs`
      case "reps":
        return `${value} reps`
      case "volume":
        return `${value} lbs total`
      case "time":
        const minutes = Math.floor(value / 60)
        const seconds = value % 60
        return `${minutes}:${seconds.toString().padStart(2, "0")}`
      default:
        return `${value}`
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTab, selectedType === "all" && styles.filterTabSelected]}
            onPress={() => setSelectedType("all")}
          >
            <Award stroke={selectedType === "all" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedType === "all" && styles.filterTabTextSelected]}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedType === "weight" && styles.filterTabSelected]}
            onPress={() => setSelectedType("weight")}
          >
            <Dumbbell stroke={selectedType === "weight" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedType === "weight" && styles.filterTabTextSelected]}>
              Weight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedType === "reps" && styles.filterTabSelected]}
            onPress={() => setSelectedType("reps")}
          >
            <TrendingUp stroke={selectedType === "reps" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedType === "reps" && styles.filterTabTextSelected]}>Reps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedType === "volume" && styles.filterTabSelected]}
            onPress={() => setSelectedType("volume")}
          >
            <TrendingUp
              stroke={selectedType === "volume" ? theme.colors.white : theme.colors.textSecondary}
              size={16}
            />
            <Text style={[styles.filterTabText, selectedType === "volume" && styles.filterTabTextSelected]}>
              Volume
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedType === "time" && styles.filterTabSelected]}
            onPress={() => setSelectedType("time")}
          >
            <Clock stroke={selectedType === "time" ? theme.colors.white : theme.colors.textSecondary} size={16} />
            <Text style={[styles.filterTabText, selectedType === "time" && styles.filterTabTextSelected]}>Time</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Records List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading personal records...</Text>
        </View>
      ) : (
        <ScrollView style={styles.recordsList}>
          {records.length > 0 ? (
            records.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordTypeContainer}>
                    {getRecordTypeIcon(record.type)}
                    <Text style={styles.recordType}>
                      {record.type.charAt(0).toUpperCase() + record.type.slice(1)} PR
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRecord(record.id)}>
                    <Trash2 stroke={theme.colors.error} size={18} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.exerciseName}>{record.exerciseName}</Text>
                <Text style={styles.recordValue}>{getRecordTypeLabel(record.type, record.value)}</Text>

                <View style={styles.recordFooter}>
                  <View style={styles.dateContainer}>
                    <Calendar stroke={theme.colors.textSecondary} size={14} />
                    <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                  </View>

                  {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Award stroke={theme.colors.textSecondary} size={48} />
              <Text style={styles.emptyText}>No personal records found. Complete workouts to set new records!</Text>
            </View>
          )}
        </ScrollView>
      )}
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
  recordsList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  recordCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  recordTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordType: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  exerciseName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  recordValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  recordFooter: {
    marginTop: theme.spacing.xs,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  recordNotes: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontStyle: "italic",
    marginTop: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.xs,
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
})

