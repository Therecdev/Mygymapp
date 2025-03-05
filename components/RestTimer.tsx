"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration } from "react-native"
import { theme } from "../theme"
import { Play, Pause, RotateCcw, X } from "lucide-react-native"

interface RestTimerProps {
  defaultTime?: number // in seconds
  onComplete?: () => void
  onClose?: () => void
}

export default function RestTimer({ defaultTime = 60, onComplete, onClose }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(defaultTime)
  const [isRunning, setIsRunning] = useState(true)
  const [presetTimes] = useState([30, 60, 90, 120, 180]) // in seconds

  const progressAnim = useRef(new Animated.Value(1)).current
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      startTimer()
    } else {
      stopTimer()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning])

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: timeRemaining / defaultTime,
      duration: 1000,
      useNativeDriver: false,
    }).start()

    // Check if timer completed
    if (timeRemaining === 0) {
      setIsRunning(false)
      Vibration.vibrate([0, 500, 200, 500]) // Vibrate twice
      if (onComplete) {
        onComplete()
      }
    }
  }, [timeRemaining, defaultTime, onComplete, progressAnim])

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const resetTimer = () => {
    setTimeRemaining(defaultTime)
    setIsRunning(true)
  }

  const setCustomTime = (seconds: number) => {
    setTimeRemaining(seconds)
    setIsRunning(true)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rest Timer</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X stroke={theme.colors.textSecondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setIsRunning(!isRunning)}>
          {isRunning ? (
            <Pause stroke={theme.colors.white} size={24} />
          ) : (
            <Play stroke={theme.colors.white} size={24} fill={theme.colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
          <RotateCcw stroke={theme.colors.white} size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>Quick Presets</Text>
        <View style={styles.presetButtons}>
          {presetTimes.map((time) => (
            <TouchableOpacity key={time} style={styles.presetButton} onPress={() => setCustomTime(time)}>
              <Text style={styles.presetButtonText}>{formatTime(time)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  timerText: {
    color: theme.colors.textPrimary,
    fontSize: 60,
    fontWeight: theme.typography.fontWeight.bold,
    fontFamily: "monospace",
    marginBottom: theme.spacing.md,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  controlButton: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
  },
  presetsContainer: {
    marginTop: theme.spacing.sm,
  },
  presetsTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  presetButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  presetButton: {
    backgroundColor: theme.colors.surfaceLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    minWidth: "30%",
    alignItems: "center",
  },
  presetButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
})

