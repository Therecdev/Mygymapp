import type { Exercise } from "../models/Exercise"
import { v4 as uuidv4 } from "uuid"

export const defaultExercises: Exercise[] = [
  {
    id: uuidv4(),
    name: "Barbell Bench Press",
    primaryMuscleGroups: ["chest"],
    secondaryMuscleGroups: ["triceps", "shoulders"],
    equipment: ["barbell"],
    instructions:
      "Lie on a flat bench with feet flat on the floor. Grip the barbell slightly wider than shoulder-width. Lower the bar to your mid-chest, then press it back up to full arm extension.",
    mediaUrls: ["/bench-press.gif"],
    isCustom: false,
    isBookmarked: false,
  },
  {
    id: uuidv4(),
    name: "Squat",
    primaryMuscleGroups: ["quadriceps", "glutes"],
    secondaryMuscleGroups: ["hamstrings", "calves"],
    equipment: ["barbell"],
    instructions:
      "Stand with feet shoulder-width apart. Place the barbell on your upper back. Bend your knees and hips to lower your body, keeping your back straight. Return to starting position.",
    mediaUrls: ["/squat.gif"],
    isCustom: false,
    isBookmarked: false,
  },
  {
    id: uuidv4(),
    name: "Deadlift",
    primaryMuscleGroups: ["back", "hamstrings"],
    secondaryMuscleGroups: ["glutes", "traps", "forearms"],
    equipment: ["barbell"],
    instructions:
      "Stand with feet hip-width apart, barbell over mid-foot. Bend at hips and knees, grasp the bar. Keep your back flat, chest up, and lift the bar by extending your hips and knees.",
    mediaUrls: ["/deadlift.gif"],
    isCustom: false,
    isBookmarked: false,
  },
  {
    id: uuidv4(),
    name: "Pull-up",
    primaryMuscleGroups: ["back", "lats"],
    secondaryMuscleGroups: ["biceps", "shoulders"],
    equipment: ["bodyweight"],
    instructions:
      "Grip a pull-up bar with hands wider than shoulder-width. Hang with arms extended, then pull your body up until your chin clears the bar. Lower back down with control.",
    mediaUrls: ["/pull-up.gif"],
    isCustom: false,
    isBookmarked: false,
  },
  {
    id: uuidv4(),
    name: "Overhead Press",
    primaryMuscleGroups: ["shoulders"],
    secondaryMuscleGroups: ["triceps", "traps"],
    equipment: ["barbell", "dumbbell"],
    instructions:
      "Stand with feet shoulder-width apart. Hold the weight at shoulder level. Press the weight overhead until arms are fully extended. Lower back to shoulder level.",
    mediaUrls: ["/overhead-press.gif"],
    isCustom: false,
    isBookmarked: false,
  },
]

