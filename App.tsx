import { StatusBar } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createStackNavigator } from "@react-navigation/stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Home, Dumbbell, BarChart3, Scroll, Settings, Calendar } from "lucide-react-native"

// Import screens
import DashboardScreen from "./screens/DashboardScreen"
import WorkoutScreen from "./screens/WorkoutScreen"
import ProgressScreen from "./screens/ProgressScreen"
import LibraryScreen from "./screens/LibraryScreen"
import JournalScreen from "./screens/JournalScreen"
import SettingsScreen from "./screens/SettingsScreen"
import ExerciseDetail from "./screens/ExerciseDetail"
import AddJournalEntry from "./screens/AddJournalEntry"
import LoginScreen from "./screens/LoginScreen"
import ImportScreen from "./screens/ImportScreen"
import TemplatesScreen from "./screens/TemplatesScreen"
import TemplateDetailScreen from "./screens/TemplateDetailScreen"
import CreateWorkoutPlanScreen from "./screens/CreateWorkoutPlanScreen"
import CalendarScreen from "./screens/CalendarScreen"
import MeasurementsScreen from "./screens/MeasurementsScreen"
import AdvancedAnalyticsScreen from "./screens/AdvancedAnalyticsScreen"
import PersonalRecordsScreen from "./screens/PersonalRecordsScreen"
import GoalsScreen from "./screens/GoalsScreen"

// Create navigators
const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

// Stack navigators for each tab
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
  </Stack.Navigator>
)

const WorkoutStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WorkoutMain" component={WorkoutScreen} />
  </Stack.Navigator>
)

const ProgressStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProgressMain" component={ProgressScreen} />
    <Stack.Screen name="AdvancedAnalytics" component={AdvancedAnalyticsScreen} />
    <Stack.Screen name="Measurements" component={MeasurementsScreen} />
    <Stack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
  </Stack.Navigator>
)

const LibraryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LibraryMain" component={LibraryScreen} />
    <Stack.Screen name="ExerciseDetail" component={ExerciseDetail} />
  </Stack.Navigator>
)

const JournalStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="JournalMain" component={JournalScreen} />
    <Stack.Screen name="AddJournalEntry" component={AddJournalEntry} />
  </Stack.Navigator>
)

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Import" component={ImportScreen} />
  </Stack.Navigator>
)

const TemplatesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TemplatesMain" component={TemplatesScreen} />
    <Stack.Screen name="TemplateDetail" component={TemplateDetailScreen} />
    <Stack.Screen name="CreateTemplate" component={CreateWorkoutPlanScreen} />
  </Stack.Navigator>
)

const CalendarStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CalendarMain" component={CalendarScreen} />
    <Stack.Screen name="CreateWorkoutPlan" component={CreateWorkoutPlanScreen} />
  </Stack.Navigator>
)

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: "#FFFFFF",
            tabBarInactiveTintColor: "#75757E",
            tabBarStyle: {
              backgroundColor: "#121212",
              borderTopWidth: 0,
              elevation: 0,
              height: 60,
              paddingBottom: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "500",
            },
            headerStyle: {
              backgroundColor: "#121212",
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTitleStyle: {
              color: "#FFFFFF",
              fontWeight: "600",
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardStack}
            options={{
              tabBarIcon: ({ color }) => <Home stroke={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Workout"
            component={WorkoutStack}
            options={{
              tabBarIcon: ({ color }) => <Dumbbell stroke={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Templates"
            component={TemplatesStack}
            options={{
              tabBarIcon: ({ color }) => <Scroll stroke={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarStack}
            options={{
              tabBarIcon: ({ color }) => <Calendar stroke={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Progress"
            component={ProgressStack}
            options={{
              tabBarIcon: ({ color }) => <BarChart3 stroke={color} size={22} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsStack}
            options={{
              tabBarIcon: ({ color }) => <Settings stroke={color} size={22} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

