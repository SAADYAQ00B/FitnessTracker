import { createBrowserRouter } from "react-router";
import { RootLayout } from "../components/layout/RootLayout";
import { OverviewPage } from "../pages/OverviewPage";
import { WorkoutsPage } from "../pages/WorkoutsPage";
import { NutritionPage } from "../pages/NutritionPage";
import { ProgressPage } from "../pages/ProgressPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";
import { RemindersPage } from "../pages/RemindersPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { HelpCenterPage } from "../pages/HelpCenterPage";
import { AuthPage } from "../pages/AuthPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LandingPage } from "../pages/LandingPage"; // Naya import

export const router = createBrowserRouter([
  // Public Routes
  { path: "/", Component: LandingPage }, 
  { path: "/login", Component: () => <AuthPage /> },
  { path: "/register", Component: () => <AuthPage register /> },
  
  // Protected Dashboard Routes
  {
    path: "/dashboard", // Dashboard ab '/dashboard' pe shift ho gaya hai
    Component: RootLayout,
    children: [
      { index: true, Component: OverviewPage },
      { path: "workouts", Component: WorkoutsPage },
      { path: "nutrition", Component: NutritionPage },
      { path: "progress", Component: ProgressPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "reminders", Component: RemindersPage },
      { path: "profile", Component: ProfilePage },
      { path: "settings", Component: SettingsPage },
      { path: "support", Component: HelpCenterPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);