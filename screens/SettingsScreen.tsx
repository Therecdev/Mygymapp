"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from "react-native"
import { theme } from "../theme"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Cloud, FileUp, LogOut, Moon, Save, Trash2, Upload, User } from "lucide-react-native"

// Settings keys
const DARK_MODE_KEY = "dark_mode"
const UNITS_KEY = "units"
const CLOUD_SYNC_KEY = "cloud_sync"

export default function SettingsScreen({ navigation }: any) {
  const [darkMode, setDarkMode] = useState(true)
  const [useMetricUnits, setUseMetricUnits] = useState(false)
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const darkModeSetting = await AsyncStorage.getItem(DARK_MODE_KEY)
      const unitsSetting = await AsyncStorage.getItem(UNITS_KEY)
      const cloudSyncSetting = await AsyncStorage.getItem(CLOUD_SYNC_KEY)

      if (darkModeSetting !== null) {
        setDarkMode(darkModeSetting === "true")
      }

      if (unitsSetting !== null) {
        setUseMetricUnits(unitsSetting === "metric")
      }

      if (cloudSyncSetting !== null) {
        setCloudSyncEnabled(cloudSyncSetting === "true")
      }

      // Check if user is logged in (this would be handled by your auth service)
      // For now, we'll just simulate it
      setIsLoggedIn(cloudSyncEnabled)
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error)
    }
  }

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value)
    saveSetting(DARK_MODE_KEY, value.toString())
    // In a real app, you would apply the theme change here
  }

  const handleUnitsToggle = (value: boolean) => {
    setUseMetricUnits(value)
    saveSetting(UNITS_KEY, value ? "metric" : "imperial")
  }

  const handleCloudSyncToggle = (value: boolean) => {
    if (value && !isLoggedIn) {
      // If enabling cloud sync but not logged in, prompt to log in
      navigation.navigate("Login")
      return
    }

    setCloudSyncEnabled(value)
    saveSetting(CLOUD_SYNC_KEY, value.toString())
  }

  const handleSyncNow = async () => {
    if (!isLoggedIn) {
      Alert.alert("Not Logged In", "Please log in to sync your data.")
      return
    }

    Alert.alert(
      "Sync Data",
      "Do you want to upload your local data to the cloud or download cloud data to your device?",
      [
        {
          text: "Upload",
          onPress: () => {
            // This would call your cloud sync service to upload data
            Alert.alert("Success", "Your data has been uploaded to the cloud.")
          },
        },
        {
          text: "Download",
          onPress: () => {
            // This would call your cloud sync service to download data
            Alert.alert("Success", "Cloud data has been downloaded to your device.")
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
    )
  }

  const handleImportWorkouts = () => {
    navigation.navigate("Import")
  }

  const handleClearData = () => {
    Alert.alert("Clear All Data", "Are you sure you want to clear all your data? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear Data",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear all app data
            const keys = ["workouts", "exercises_initialized", "journal_entries"]
            await AsyncStorage.multiRemove(keys)

            Alert.alert("Success", "All data has been cleared.")
          } catch (error) {
            console.error("Error clearing data:", error)
            Alert.alert("Error", "Could not clear data. Please try again.")
          }
        },
      },
    ])
  }

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out? Your local data will be preserved.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log Out",
        onPress: () => {
          // This would call your auth service to log out
          setIsLoggedIn(false)
          setCloudSyncEnabled(false)
          saveSetting(CLOUD_SYNC_KEY, "false")
          Alert.alert("Success", "You have been logged out.")
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Moon stroke={theme.colors.textSecondary} size={20} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Save stroke={theme.colors.textSecondary} size={20} />
              <Text style={styles.settingText}>Use Metric Units (kg/cm)</Text>
            </View>
            <Switch
              value={useMetricUnits}
              onValueChange={handleUnitsToggle}
              trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.button} onPress={handleImportWorkouts}>
            <View style={styles.buttonContent}>
              <FileUp stroke={theme.colors.white} size={18} />
              <Text style={styles.buttonText}>Import from Other Apps</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearData}>
            <View style={styles.buttonContent}>
              <Trash2 stroke={theme.colors.white} size={18} />
              <Text style={styles.buttonText}>Clear All Data</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Sync</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Cloud stroke={theme.colors.textSecondary} size={20} />
              <Text style={styles.settingText}>Enable Cloud Sync</Text>
            </View>
            <Switch
              value={cloudSyncEnabled}
              onValueChange={handleCloudSyncToggle}
              trackColor={{ false: theme.colors.gray700, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !isLoggedIn && styles.buttonDisabled]}
            onPress={handleSyncNow}
            disabled={!isLoggedIn}
          >
            <View style={styles.buttonContent}>
              {isLoggedIn ? (
                <>
                  <Upload stroke={theme.colors.white} size={18} />
                  <Text style={styles.buttonText}>Sync Now</Text>
                </>
              ) : (
                <>
                  <User stroke={theme.colors.white} size={18} />
                  <Text style={styles.buttonText}>Log In to Enable Sync</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {isLoggedIn && (
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
              <View style={styles.buttonContent}>
                <LogOut stroke={theme.colors.white} size={18} />
                <Text style={styles.buttonText}>Log Out</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Stoic Strength v1.0.0</Text>
          <Text style={styles.aboutSubtext}>A minimalist workout tracker inspired by stoic philosophy.</Text>
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
  section: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    marginLeft: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.gray600,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  logoutButton: {
    backgroundColor: theme.colors.gray600,
    marginTop: theme.spacing.md,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing.sm,
  },
  aboutText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  aboutSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
})

