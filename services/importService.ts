import { v4 as uuidv4 } from "uuid"
import type { Workout, ExerciseEntry, WorkoutSet } from "../models/Workout"
import type { Exercise, MuscleGroup, EquipmentType } from "../models/Exercise"
import { saveWorkout } from "./workoutService"
import { saveExercise, getAllExercises } from "./exerciseService"
import * as FileSystem from "expo-file-system"
import * as DocumentPicker from "expo-document-picker"

// Map muscle groups from other apps to our app's format
const muscleGroupMap: Record<string, MuscleGroup> = {
  // Hevy mappings
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  quads: "quadriceps",
  hamstrings: "hamstrings",
  calves: "calves",
  glutes: "glutes",
  abs: "abdominals",
  core: "abdominals",
  obliques: "obliques",
  traps: "traps",
  lats: "lats",

  // Strong mappings
  pectorals: "chest",
  latissimus: "lats",
  deltoids: "shoulders",
  "biceps brachii": "biceps",
  "triceps brachii": "triceps",
  "quadriceps femoris": "quadriceps",
  "gluteus maximus": "glutes",
  gastrocnemius: "calves",
  "rectus abdominis": "abdominals",

  // Liftin' mappings
  pecs: "chest",
  delts: "shoulders",
  bis: "biceps",
  tris: "triceps",
  quads: "quadriceps",
  hams: "hamstrings",
  abs: "abdominals",
}

// Map equipment types from other apps to our app's format
const equipmentMap: Record<string, EquipmentType> = {
  // Common mappings
  barbell: "barbell",
  dumbbell: "dumbbell",
  kettlebell: "kettlebell",
  machine: "machine",
  cable: "cable",
  bodyweight: "bodyweight",
  band: "resistance band",
  "resistance band": "resistance band",
  "smith machine": "machine",
  "ez bar": "barbell",
  "trap bar": "barbell",
  suspension: "bodyweight",
}

// Pick a file to import
export const pickFileToImport = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "text/csv"],
      copyToCacheDirectory: true,
    })

    if (result.type === "success") {
      return result.uri
    }

    return null
  } catch (error) {
    console.error("Error picking file:", error)
    return null
  }
}

// Read file content
const readFileContent = async (uri: string): Promise<string> => {
  try {
    const content = await FileSystem.readAsStringAsync(uri)
    return content
  } catch (error) {
    console.error("Error reading file:", error)
    throw error
  }
}

// Detect which app the file is from
export const detectAppSource = async (fileUri: string): Promise<"hevy" | "strong" | "liftin" | "unknown"> => {
  try {
    const content = await readFileContent(fileUri)

    // Try to parse as JSON first
    try {
      const data = JSON.parse(content)

      // Check for Hevy-specific fields
      if (data.workouts && data.routines) {
        return "hevy"
      }

      // Check for Strong-specific fields
      if (data.exportedFromApp === "Strong" || (data.measurements && data.workouts)) {
        return "strong"
      }
    } catch (e) {
      // Not JSON, might be CSV
    }

    // Check for Liftin' CSV format
    if (content.includes("Liftin Workout History") || content.includes("Date,Exercise,Set,Weight,Reps,RPE")) {
      return "liftin"
    }

    return "unknown"
  } catch (error) {
    console.error("Error detecting app source:", error)
    return "unknown"
  }
}

// Import from Hevy
export const importFromHevy = async (
  fileUri: string,
): Promise<{
  workouts: Workout[]
  exercises: Exercise[]
}> => {
  try {
    const content = await readFileContent(fileUri)
    const data = JSON.parse(content)

    const existingExercises = await getAllExercises()
    const importedExercises: Exercise[] = []
    const importedWorkouts: Workout[] = []

    // Process exercises
    if (data.exercises) {
      for (const hevyExercise of data.exercises) {
        // Check if exercise already exists
        const existingExercise = existingExercises.find((e) => e.name.toLowerCase() === hevyExercise.name.toLowerCase())

        if (!existingExercise) {
          // Map muscle groups
          const primaryMuscleGroups: MuscleGroup[] = []
          const secondaryMuscleGroups: MuscleGroup[] = []

          if (hevyExercise.primaryMuscles) {
            for (const muscle of hevyExercise.primaryMuscles) {
              const mappedMuscle = muscleGroupMap[muscle.toLowerCase()]
              if (mappedMuscle && !primaryMuscleGroups.includes(mappedMuscle)) {
                primaryMuscleGroups.push(mappedMuscle)
              }
            }
          }

          if (hevyExercise.secondaryMuscles) {
            for (const muscle of hevyExercise.secondaryMuscles) {
              const mappedMuscle = muscleGroupMap[muscle.toLowerCase()]
              if (mappedMuscle && !secondaryMuscleGroups.includes(mappedMuscle)) {
                secondaryMuscleGroups.push(mappedMuscle)
              }
            }
          }

          // Map equipment
          const equipment: EquipmentType[] = []
          if (hevyExercise.equipment) {
            const mappedEquipment = equipmentMap[hevyExercise.equipment.toLowerCase()]
            if (mappedEquipment && !equipment.includes(mappedEquipment)) {
              equipment.push(mappedEquipment)
            }
          }

          // Create new exercise
          const newExercise: Exercise = {
            id: uuidv4(),
            name: hevyExercise.name,
            primaryMuscleGroups: primaryMuscleGroups.length > 0 ? primaryMuscleGroups : ["chest"], // Default to chest if no mapping
            secondaryMuscleGroups: secondaryMuscleGroups.length > 0 ? secondaryMuscleGroups : undefined,
            equipment: equipment.length > 0 ? equipment : ["barbell"], // Default to barbell if no mapping
            instructions: hevyExercise.instructions || "No instructions available.",
            isCustom: false,
            isBookmarked: false,
          }

          await saveExercise(newExercise)
          importedExercises.push(newExercise)
          existingExercises.push(newExercise)
        }
      }
    }

    // Process workouts
    if (data.workouts) {
      for (const hevyWorkout of data.workouts) {
        const exerciseEntries: ExerciseEntry[] = []

        // Process workout exercises
        if (hevyWorkout.exercises) {
          for (const hevyExerciseEntry of hevyWorkout.exercises) {
            // Find the corresponding exercise
            let exercise = existingExercises.find((e) => e.name.toLowerCase() === hevyExerciseEntry.name.toLowerCase())

            // If not found, create a placeholder
            if (!exercise) {
              exercise = {
                id: uuidv4(),
                name: hevyExerciseEntry.name,
                primaryMuscleGroups: ["chest"], // Default
                equipment: ["barbell"], // Default
                instructions: "No instructions available.",
                isCustom: true,
                isBookmarked: false,
              }

              await saveExercise(exercise)
              existingExercises.push(exercise)
              importedExercises.push(exercise)
            }

            // Process sets
            const sets: WorkoutSet[] = []
            if (hevyExerciseEntry.sets) {
              for (const hevySet of hevyExerciseEntry.sets) {
                sets.push({
                  id: uuidv4(),
                  reps: hevySet.reps || 0,
                  weight: hevySet.weight || 0,
                  rpe: hevySet.rpe,
                  isCompleted: true,
                  notes: hevySet.notes,
                })
              }
            }

            // Create exercise entry
            exerciseEntries.push({
              id: uuidv4(),
              exerciseId: exercise.id,
              exercise: exercise,
              sets: sets,
              notes: hevyExerciseEntry.notes,
            })
          }
        }

        // Create workout
        const workout: Workout = {
          id: uuidv4(),
          name: hevyWorkout.name || "Imported Workout",
          date: new Date(hevyWorkout.startTime || Date.now()),
          exercises: exerciseEntries,
          duration: hevyWorkout.duration ? Math.floor(hevyWorkout.duration / 60) : undefined,
          notes: hevyWorkout.notes,
          isCompleted: true,
        }

        await saveWorkout(workout)
        importedWorkouts.push(workout)
      }
    }

    return {
      workouts: importedWorkouts,
      exercises: importedExercises,
    }
  } catch (error) {
    console.error("Error importing from Hevy:", error)
    throw error
  }
}

// Import from Strong
export const importFromStrong = async (
  fileUri: string,
): Promise<{
  workouts: Workout[]
  exercises: Exercise[]
}> => {
  try {
    const content = await readFileContent(fileUri)
    const data = JSON.parse(content)

    const existingExercises = await getAllExercises()
    const importedExercises: Exercise[] = []
    const importedWorkouts: Workout[] = []

    // Process exercises
    if (data.exercises) {
      for (const strongExercise of data.exercises) {
        // Check if exercise already exists
        const existingExercise = existingExercises.find(
          (e) => e.name.toLowerCase() === strongExercise.name.toLowerCase(),
        )

        if (!existingExercise) {
          // Map muscle groups
          const primaryMuscleGroups: MuscleGroup[] = []
          const secondaryMuscleGroups: MuscleGroup[] = []

          if (strongExercise.primaryMuscles) {
            for (const muscle of strongExercise.primaryMuscles) {
              const mappedMuscle = muscleGroupMap[muscle.toLowerCase()]
              if (mappedMuscle && !primaryMuscleGroups.includes(mappedMuscle)) {
                primaryMuscleGroups.push(mappedMuscle)
              }
            }
          }

          if (strongExercise.secondaryMuscles) {
            for (const muscle of strongExercise.secondaryMuscles) {
              const mappedMuscle = muscleGroupMap[muscle.toLowerCase()]
              if (mappedMuscle && !secondaryMuscleGroups.includes(mappedMuscle)) {
                secondaryMuscleGroups.push(mappedMuscle)
              }
            }
          }

          // Map equipment
          const equipment: EquipmentType[] = []
          if (strongExercise.equipment) {
            const mappedEquipment = equipmentMap[strongExercise.equipment.toLowerCase()]
            if (mappedEquipment && !equipment.includes(mappedEquipment)) {
              equipment.push(mappedEquipment)
            }
          }

          // Create new exercise
          const newExercise: Exercise = {
            id: uuidv4(),
            name: strongExercise.name,
            primaryMuscleGroups: primaryMuscleGroups.length > 0 ? primaryMuscleGroups : ["chest"], // Default to chest if no mapping
            secondaryMuscleGroups: secondaryMuscleGroups.length > 0 ? secondaryMuscleGroups : undefined,
            equipment: equipment.length > 0 ? equipment : ["barbell"], // Default to barbell if no mapping
            instructions: strongExercise.notes || "No instructions available.",
            isCustom: false,
            isBookmarked: false,
          }

          await saveExercise(newExercise)
          importedExercises.push(newExercise)
          existingExercises.push(newExercise)
        }
      }
    }

    // Process workouts
    if (data.workouts) {
      for (const strongWorkout of data.workouts) {
        const exerciseEntries: ExerciseEntry[] = []

        // Process workout exercises
        if (strongWorkout.exercises) {
          for (const strongExerciseEntry of strongWorkout.exercises) {
            // Find the corresponding exercise
            let exercise = existingExercises.find(
              (e) => e.name.toLowerCase() === strongExerciseEntry.name.toLowerCase(),
            )

            // If not found, create a placeholder
            if (!exercise) {
              exercise = {
                id: uuidv4(),
                name: strongExerciseEntry.name,
                primaryMuscleGroups: ["chest"], // Default
                equipment: ["barbell"], // Default
                instructions: "No instructions available.",
                isCustom: true,
                isBookmarked: false,
              }

              await saveExercise(exercise)
              existingExercises.push(exercise)
              importedExercises.push(exercise)
            }

            // Process sets
            const sets: WorkoutSet[] = []
            if (strongExerciseEntry.sets) {
              for (const strongSet of strongExerciseEntry.sets) {
                sets.push({
                  id: uuidv4(),
                  reps: strongSet.reps || 0,
                  weight: strongSet.weight || 0,
                  rpe: strongSet.rpe,
                  isCompleted: true,
                  notes: strongSet.notes,
                })
              }
            }

            // Create exercise entry
            exerciseEntries.push({
              id: uuidv4(),
              exerciseId: exercise.id,
              exercise: exercise,
              sets: sets,
              notes: strongExerciseEntry.notes,
            })
          }
        }

        // Create workout
        const workout: Workout = {
          id: uuidv4(),
          name: strongWorkout.name || "Imported Workout",
          date: new Date(strongWorkout.date || Date.now()),
          exercises: exerciseEntries,
          duration: strongWorkout.duration,
          notes: strongWorkout.notes,
          isCompleted: true,
        }

        await saveWorkout(workout)
        importedWorkouts.push(workout)
      }
    }

    return {
      workouts: importedWorkouts,
      exercises: importedExercises,
    }
  } catch (error) {
    console.error("Error importing from Strong:", error)
    throw error
  }
}

// Import from Liftin'
export const importFromLiftin = async (
  fileUri: string,
): Promise<{
  workouts: Workout[]
  exercises: Exercise[]
}> => {
  try {
    const content = await readFileContent(fileUri)
    const lines = content.split("\n")

    const existingExercises = await getAllExercises()
    const importedExercises: Exercise[] = []
    const importedWorkouts: Record<string, Workout> = {}

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const columns = line.split(",")
      if (columns.length < 5) continue

      const date = columns[0]
      const exerciseName = columns[1]
      const setNumber = Number.parseInt(columns[2], 10)
      const weight = Number.parseFloat(columns[3])
      const reps = Number.parseInt(columns[4], 10)
      const rpe = columns.length > 5 ? Number.parseFloat(columns[5]) : undefined

      // Find or create exercise
      let exercise = existingExercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase())

      if (!exercise) {
        exercise = {
          id: uuidv4(),
          name: exerciseName,
          primaryMuscleGroups: ["chest"], // Default
          equipment: ["barbell"], // Default
          instructions: "No instructions available.",
          isCustom: true,
          isBookmarked: false,
        }

        await saveExercise(exercise)
        existingExercises.push(exercise)
        importedExercises.push(exercise)
      }

      // Create or update workout
      if (!importedWorkouts[date]) {
        importedWorkouts[date] = {
          id: uuidv4(),
          name: `Workout ${date}`,
          date: new Date(date),
          exercises: [],
          isCompleted: true,
        }
      }

      // Find or create exercise entry
      let exerciseEntry = importedWorkouts[date].exercises.find((e) => e.exerciseId === exercise!.id)

      if (!exerciseEntry) {
        exerciseEntry = {
          id: uuidv4(),
          exerciseId: exercise.id,
          exercise: exercise,
          sets: [],
        }
        importedWorkouts[date].exercises.push(exerciseEntry)
      }

      // Add set
      exerciseEntry.sets.push({
        id: uuidv4(),
        reps,
        weight,
        rpe,
        isCompleted: true,
      })
    }

    // Save workouts
    const workouts: Workout[] = []
    for (const date in importedWorkouts) {
      const workout = importedWorkouts[date]
      await saveWorkout(workout)
      workouts.push(workout)
    }

    return {
      workouts,
      exercises: importedExercises,
    }
  } catch (error) {
    console.error("Error importing from Liftin:", error)
    throw error
  }
}

// Main import function
export const importFromFile = async (
  fileUri: string,
): Promise<{
  workouts: Workout[]
  exercises: Exercise[]
  source: string
}> => {
  const source = await detectAppSource(fileUri)

  switch (source) {
    case "hevy":
      const hevyResult = await importFromHevy(fileUri)
      return { ...hevyResult, source: "Hevy" }

    case "strong":
      const strongResult = await importFromStrong(fileUri)
      return { ...strongResult, source: "Strong" }

    case "liftin":
      const liftinResult = await importFromLiftin(fileUri)
      return { ...liftinResult, source: "Liftin'" }

    default:
      throw new Error("Unsupported file format")
  }
}

