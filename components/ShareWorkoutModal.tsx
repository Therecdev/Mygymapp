"use client"

import { useState } from "react"
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native"
import { theme } from "../theme"
import type { Workout } from "../models/Workout"
import { X, Share2, Copy, MessageCircle } from "lucide-react-native"
import * as Clipboard from "expo-clipboard"

interface ShareWorkoutModalProps {
  visible: boolean
  workout: Workout | null
  onClose: () => void
}

export default function ShareWorkoutModal({ visible, workout, onClose }: ShareWorkoutModalProps) {
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeWeights, setIncludeWeights] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  if (!workout) return null

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const generateShareText = () => {
    let text = `💪 My Workout: ${workout.name}\n`
    text += `📅 ${formatDate(workout.date)}\n\n`

    workout.exercises.forEach((exercise, index) => {
      text += `${index + 1}. ${exercise.exercise.name}\n`

      exercise.sets.forEach((set, setIndex) => {
        if (set.isCompleted) {
          if (includeWeights) {
            text += `   Set ${setIndex + 1}: ${set.reps} reps × ${set.weight} lbs\n`
          } else {
            text += `   Set ${setIndex + 1}: ${set.reps} reps\n`
          }
        }
      })

      if (includeNotes && exercise.notes) {
        text += `   Notes: ${exercise.notes}\n`
      }

      text += "\n"
    })

    if (workout.duration) {
      text += `⏱️ Duration: ${workout.duration} minutes\n`
    }

    if (includeNotes && workout.notes) {
      text += `📝 Workout Notes: ${workout.notes}\n`
    }

    text += "\nTracked with Stoic Strength 💪"

    return text
  }

  const handleShare = async () => {
    try {
      setIsSharing(true)
      const shareText = generateShareText()

      await Share.share({
        message: shareText,
        title: `${workout.name} Workout`,
      })
    } catch (error) {
      console.error("Error sharing workout:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      setIsSharing(true)
      const shareText = generateShareText()

      await Clipboard.setStringAsync(shareText)
      alert("Workout copied to clipboard!")
    } catch (error) {
      console.error("Error copying workout to clipboard:", error)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share Workout</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X stroke={theme.colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>

            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Preview:</Text>
              <ScrollView style={styles.previewScroll}>
                <Text style={styles.previewText}>{generateShareText()}</Text>
              </ScrollView>
            </View>

            <View style={styles.optionsContainer}>
              <Text style={styles.optionsTitle}>Options:</Text>

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Include Notes</Text>
                <Switch
                  value={includeNotes}
                  onValueChange={setIncludeNotes}
                  trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>Include Weights</Text>
                <Switch
                  value={includeWeights}
                  onValueChange={setIncludeWeights}
                  trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
                  thumbColor={theme.colors.white}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isSharing}>
              {isSharing ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <>
                  <Share2 stroke={theme.colors.white} size={20} />
                  <Text style={styles.shareButtonText}>Share Workout</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyToClipboard} disabled={isSharing}>
                <Copy stroke={theme.colors.textPrimary} size={20} />
                <Text style={styles.secondaryButtonText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleShare} disabled={isSharing}>
                <MessageCircle stroke={theme.colors.textPrimary} size={20} />
                <Text style={styles.secondaryButtonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    height: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  workoutName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  workoutDate: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.lg,
  },
  previewContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  previewTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  previewScroll: {
    maxHeight: 200,
  },
  previewText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  optionsTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  optionLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  shareButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  secondaryActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  secondaryButton: {
    alignItems: "center",
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
})

