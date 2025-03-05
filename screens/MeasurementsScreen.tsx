"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native"
import { theme } from "../theme"
import { getMeasurementsByType, saveMeasurement, deleteMeasurement } from "../services/measurementService"
import type { Measurement, MeasurementType } from "../models/Measurement"
import { LineChart } from "react-native-chart-kit"
import { ChevronDown, ChevronUp, Plus, Trash2, Calendar } from "lucide-react-native"
import { v4 as uuidv4 } from "uuid"

// Measurement type options
const measurementTypes: { label: string; value: MeasurementType; unit: string }[] = [
  { label: "Weight", value: "weight", unit: "lbs" },
  { label: "Body Fat", value: "bodyFat", unit: "%" },
  { label: "Chest", value: "chest", unit: "in" },
  { label: "Waist", value: "waist", unit: "in" },
  { label: "Hips", value: "hips", unit: "in" },
  { label: "Biceps", value: "biceps", unit: "in" },
  { label: "Thighs", value: "thighs", unit: "in" },
  { label: "Calves", value: "calves", unit: "in" },
  { label: "Shoulders", value: "shoulders", unit: "in" },
  { label: "Neck", value: "neck", unit: "in" },
]

export default function MeasurementsScreen() {
  const [selectedType, setSelectedType] = useState<MeasurementType>("weight")
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [newValue, setNewValue] = useState("")
  const [expandedSections, setExpandedSections] = useState({
    chart: true,
    history: true,
    add: false,
  })
  const [isMetric, setIsMetric] = useState(false) // TODO: Get from settings

  useEffect(() => {
    loadMeasurements()
  }, [selectedType])

  const loadMeasurements = async () => {
    const typeMeasurements = await getMeasurementsByType(selectedType)
    setMeasurements(typeMeasurements)
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleAddMeasurement = async () => {
    if (!newValue || isNaN(Number.parseFloat(newValue))) {
      Alert.alert("Error", "Please enter a valid number.")
      return
    }

    const selectedTypeInfo = measurementTypes.find((type) => type.value === selectedType)
    if (!selectedTypeInfo) return

    const unit = isMetric
      ? selectedType === "weight"
        ? "kg"
        : selectedType === "bodyFat"
          ? "%"
          : "cm"
      : selectedTypeInfo.unit

    const newMeasurement: Measurement = {
      id: uuidv4(),
      type: selectedType,
      value: Number.parseFloat(newValue),
      unit,
      date: new Date(),
    }

    try {
      await saveMeasurement(newMeasurement)
      setNewValue("")
      loadMeasurements()
      setExpandedSections((prev) => ({
        ...prev,
        add: false,
        history: true,
      }))
    } catch (error) {
      console.error("Error adding measurement:", error)
      Alert.alert("Error", "Could not save measurement.")
    }
  }

  const handleDeleteMeasurement = async (id: string) => {
    Alert.alert("Delete Measurement", "Are you sure you want to delete this measurement?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMeasurement(id)
            loadMeasurements()
          } catch (error) {
            console.error("Error deleting measurement:", error)
            Alert.alert("Error", "Could not delete measurement.")
          }
        },
      },
    ])
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Prepare chart data
  const chartData = {
    labels: measurements
      .slice(0, 7)
      .reverse()
      .map((m) => {
        const date = new Date(m.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
    datasets: [
      {
        data: measurements
          .slice(0, 7)
          .reverse()
          .map((m) => m.value),
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
    legend: [selectedType.charAt(0).toUpperCase() + selectedType.slice(1)],
  }

  const selectedTypeInfo = measurementTypes.find((type) => type.value === selectedType)
  const unit = isMetric
    ? selectedType === "weight"
      ? "kg"
      : selectedType === "bodyFat"
        ? "%"
        : "cm"
    : selectedTypeInfo?.unit || ""

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Measurement Type Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.sectionTitle}>Measurement Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typesScroll}>
            contentContainerStyle={styles.typesScroll}>
            {measurementTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[styles.typeChip, selectedType === type.value && styles.typeChipSelected]}
                onPress={() => setSelectedType(type.value)}
              >
                <Text style={[styles.typeChipText, selectedType === type.value && styles.typeChipTextSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Chart Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("chart")}>
            <Text style={styles.sectionTitle}>Progress Chart</Text>
            {expandedSections.chart ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.chart && (
            <View style={styles.chartContainer}>
              {measurements.length > 1 ? (
                <LineChart
                  data={chartData}
                  width={350}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: selectedType === "bodyFat" ? 1 : 0,
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
              ) : (
                <Text style={styles.noDataText}>Not enough data to display chart. Add at least 2 measurements.</Text>
              )}
            </View>
          )}
        </View>

        {/* Add Measurement Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("add")}>
            <Text style={styles.sectionTitle}>Add Measurement</Text>
            {expandedSections.add ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.add && (
            <View style={styles.addContainer}>
              <Text style={styles.addLabel}>
                New {selectedTypeInfo?.label} ({unit})
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.valueInput}
                  value={newValue}
                  onChangeText={setNewValue}
                  placeholder={`Enter ${selectedTypeInfo?.label.toLowerCase()} value`}
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddMeasurement}>
                  <Plus stroke={theme.colors.white} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Measurement History Section */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection("history")}>
            <Text style={styles.sectionTitle}>Measurement History</Text>
            {expandedSections.history ? (
              <ChevronUp stroke={theme.colors.textSecondary} size={20} />
            ) : (
              <ChevronDown stroke={theme.colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>

          {expandedSections.history && (
            <View style={styles.historyContainer}>
              {measurements.length > 0 ? (
                measurements.map((measurement) => (
                  <View key={measurement.id} style={styles.measurementItem}>
                    <View style={styles.measurementInfo}>
                      <View style={styles.measurementDate}>
                        <Calendar stroke={theme.colors.textSecondary} size={14} />
                        <Text style={styles.dateText}>{formatDate(measurement.date)}</Text>
                      </View>
                      <Text style={styles.measurementValue}>
                        {measurement.value} {measurement.unit}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteMeasurement(measurement.id)}
                    >
                      <Trash2 stroke={theme.colors.error} size={18} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No measurements recorded yet. Add your first measurement.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Measurement FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setExpandedSections((prev) => ({
            ...prev,
            add: true,
          }))
          // Scroll to add section
        }}
      >
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
  selectorContainer: {
    padding: theme.spacing.md,
  },
  typesScroll: {
    paddingVertical: theme.spacing.sm,
  },
  typeChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  typeChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  typeChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  typeChipTextSelected: {
    color: theme.colors.white,
  },
  sectionContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chartContainer: {
    padding: theme.spacing.md,
    alignItems: "center",
  },
  chart: {
    marginVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  addContainer: {
    padding: theme.spacing.md,
  },
  addLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  valueInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginRight: theme.spacing.sm,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  historyContainer: {
    padding: theme.spacing.md,
  },
  measurementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceLight,
  },
  measurementInfo: {
    flex: 1,
  },
  measurementDate: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginLeft: theme.spacing.xs,
  },
  measurementValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    padding: theme.spacing.md,
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

