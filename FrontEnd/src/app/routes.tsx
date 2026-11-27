import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Capacitor } from "@capacitor/core";
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
import { AdminPage } from "../pages/AdminPage";
import { AuthPage } from "../pages/AuthPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LandingPage } from "../pages/LandingPage";
import { isAuthenticated, isAdmin, clearAuthSession } from "./authGuard";

/**
 * RootRoute component:
 * When running inside native mobile app (Capacitor.isNativePlatform() === true),
 * skips the marketing landing page and routes directly to /dashboard or /login.
 * In a normal web browser, renders the full marketing LandingPage.
 */
function RootRoute() {
  if (Capacitor.isNativePlatform()) {
    return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
  }
  return <LandingPage />;
}

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
 * Strict synchronous AdminRoute guard.
 * Requires valid authenticated session AND admin role.
 * If not authenticated, redirects to /login. If not admin, redirects to /dashboard.
 */
export function AdminRoute({ children }: { children?: React.ReactNode }) {
  if (!isAuthenticated()) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
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
  // Public Routes (skips landing in native mobile app)
  { path: "/", Component: RootRoute },
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

  // Dedicated /admin Route (Protected by AdminRoute)
  {
    path: "/admin",
    Component: () => (
      <AdminRoute>
        <RootLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, Component: AdminPage },
    ],
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
      {
        path: "admin",
        Component: () => (
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        ),
      },
      { path: "*", Component: NotFoundPage },
    ],
  },
  { path: "*", Component: NotFoundPage },
]);
