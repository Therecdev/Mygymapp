"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native"
import { theme } from "../theme"
import { createRecurringWorkoutPlan } from "../services/planningService"
import { getAllTemplates } from "../services/templateService"
import type { WorkoutTemplate } from "../models/Template"
import type { RecurringSchedule, WeekDay } from "../models/WorkoutPlan"
import { ChevronLeft, Calendar, Plus, Trash2, Check } from "lucide-react-native"
import DateTimePicker from "@react-native-community/datetimepicker"

export default function CreateWorkoutPlanScreen({ navigation }: any) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 28)), // Default to 4 weeks
  )
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [hasEndDate, setHasEndDate] = useState(true)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Days of the week
  const weekDays: { label: string; value: WeekDay }[] = [
    { label: "Monday", value: "monday" },
    { label: "Tuesday", value: "tuesday" },
    { label: "Wednesday", value: "wednesday" },
    { label: "Thursday", value: "thursday" },
    { label: "Friday", value: "friday" },
    { label: "Saturday", value: "saturday" },
    { label: "Sunday", value: "sunday" },
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const allTemplates = await getAllTemplates()
      setTemplates(allTemplates)
    } catch (error) {
      console.error("Error loading templates:", error)
      Alert.alert("Error", "Could not load workout templates.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSchedule = () => {
    if (templates.length === 0) {
      Alert.alert("No Templates", "Please create workout templates first.")
      return
    }

    // Add a new empty schedule
    setSchedules([
      ...schedules,
      {
        days: [],
        templateId: templates[0].id,
        templateName: templates[0].name,
      },
    ])
  }

  const handleRemoveSchedule = (index: number) => {
    const newSchedules = [...schedules]
    newSchedules.splice(index, 1)
    setSchedules(newSchedules)
  }

  const handleToggleDay = (scheduleIndex: number, day: WeekDay) => {
    const newSchedules = [...schedules]
    const schedule = newSchedules[scheduleIndex]

    if (schedule.days.includes(day)) {
      // Remove day
      schedule.days = schedule.days.filter((d) => d !== day)
    } else {
      // Add day
      schedule.days.push(day)
    }

    setSchedules(newSchedules)
  }

  const handleChangeTemplate = (scheduleIndex: number, templateId: string) => {
    const newSchedules = [...schedules]
    const template = templates.find((t) => t.id === templateId)

    if (template) {
      newSchedules[scheduleIndex].templateId = templateId
      newSchedules[scheduleIndex].templateName = template.name
      setSchedules(newSchedules)
    }
  }

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      setStartDate(selectedDate)

      // If end date is before start date, update it
      if (endDate && endDate < selectedDate) {
        setEndDate(new Date(selectedDate.getTime() + 28 * 24 * 60 * 60 * 1000)) // 4 weeks later
      }
    }
  }

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  const handleCreatePlan = async () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a plan name.")
      return
    }

    if (schedules.length === 0) {
      Alert.alert("Error", "Please add at least one workout schedule.")
      return
    }

    // Check if any schedule has no days selected
    const invalidSchedule = schedules.find((schedule) => schedule.days.length === 0)
    if (invalidSchedule) {
      Alert.alert("Error", "Please select at least one day for each workout schedule.")
      return
    }

    try {
      setIsSaving(true)

      await createRecurringWorkoutPlan(name, description, startDate, hasEndDate ? endDate : undefined, schedules)

      Alert.alert("Success", "Workout plan created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Calendar"),
        },
      ])
    } catch (error) {
      console.error("Error creating workout plan:", error)
      Alert.alert("Error", "Could not create workout plan.")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft stroke={theme.colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Plan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Plan Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter plan name"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter plan description"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>

          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
            <Calendar stroke={theme.colors.textSecondary} size={20} />
            <Text style={styles.datePickerText}>Start Date: {formatDate(startDate)}</Text>
          </TouchableOpacity>

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Set End Date</Text>
            <Switch
              value={hasEndDate}
              onValueChange={setHasEndDate}
              trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          {hasEndDate && (
            <>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
                <Calendar stroke={theme.colors.textSecondary} size={20} />
                <Text style={styles.datePickerText}>End Date: {formatDate(endDate!)}</Text>
              </TouchableOpacity>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              )}
            </>
          )}
        </View>

        {/* Workout Schedules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Workout Schedules</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSchedule}>
              <Plus stroke={theme.colors.white} size={16} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {schedules.length === 0 ? (
            <Text style={styles.emptyText}>No schedules added yet. Tap "Add" to create a workout schedule.</Text>
          ) : (
            schedules.map((schedule, index) => (
              <View key={index} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTitle}>Schedule {index + 1}</Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemoveSchedule(index)}>
                    <Trash2 stroke={theme.colors.error} size={18} />
                  </TouchableOpacity>
                </View>

                <View style={styles.templateSelector}>
                  <Text style={styles.templateLabel}>Workout Template:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.templateOptions}
                  >
                    {templates.map((template) => (
                      <TouchableOpacity
                        key={template.id}
                        style={[
                          styles.templateOption,
                          schedule.templateId === template.id && styles.templateOptionSelected,
                        ]}
                        onPress={() => handleChangeTemplate(index, template.id)}
                      >
                        <Text
                          style={[
                            styles.templateOptionText,
                            schedule.templateId === template.id && styles.templateOptionTextSelected,
                          ]}
                        >
                          {template.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={styles.daysLabel}>Select Days:</Text>
                <View style={styles.daysContainer}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[styles.dayOption, schedule.days.includes(day.value) && styles.dayOptionSelected]}
                      onPress={() => handleToggleDay(index, day.value)}
                    >
                      <Text
                        style={[
                          styles.dayOptionText,
                          schedule.days.includes(day.value) && styles.dayOptionTextSelected,
                        ]}
                      >
                        {day.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreatePlan} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <>
              <Check stroke={theme.colors.white} size={20} />
              <Text style={styles.createButtonText}>Create Plan</Text>
            </>
          )}
        </TouchableOpacity>
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
    padding: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  datePickerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginLeft: theme.spacing.sm,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  switchLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: "center",
    padding: theme.spacing.md,
  },
  scheduleCard: {
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  scheduleTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  templateSelector: {
    marginBottom: theme.spacing.md,
  },
  templateLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  templateOptions: {
    paddingVertical: theme.spacing.xs,
  },
  templateOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  templateOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  templateOptionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  templateOptionTextSelected: {
    color: theme.colors.white,
  },
  daysLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    minWidth: 45,
    alignItems: "center",
  },
  dayOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayOptionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  dayOptionTextSelected: {
    color: theme.colors.white,
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
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

