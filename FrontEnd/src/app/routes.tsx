import { createBrowserRouter, Navigate, Outlet } from "react-router";
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
import { LandingPage } from "../pages/LandingPage";
import { isAuthenticated, clearAuthSession } from "./authGuard";

/**
 * Strict synchronous ProtectedRoute guard.
 * Validates token & user synchronously. If unauthenticated, clears storage and redirects to /login.
 * Ensures zero dashboard UI ever renders or flashes.
 */
export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  if (!isAuthenticated()) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

/**
 * PublicOnlyRoute guard for /login and /register.
 * If user is already authenticated, synchronously redirects to /dashboard.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Public Routes
  { path: "/", Component: LandingPage },
  {
    path: "/login",
    Component: () => (
      <PublicOnlyRoute>
        <AuthPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register",
    Component: () => (
      <PublicOnlyRoute>
        <AuthPage register />
      </PublicOnlyRoute>
    ),
  },

  // Protected Dashboard Routes
  {
    path: "/dashboard",
    Component: () => (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
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
  { path: "*", Component: NotFoundPage },
]);
