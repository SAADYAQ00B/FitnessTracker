import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { router } from "./routes";
import { ThemeProvider } from "../context/ThemeContext";
import { AppProvider } from "../context/AppContext";
import GlobalLoader from "../components/common/GlobalLoader";
import { ensurePermissionsAndChannel } from "../services/mobileNotificationService";

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    // Request notification permission and configure high-priority channels immediately on Android startup
    if (Capacitor.isNativePlatform()) {
      ensurePermissionsAndChannel().catch((err) => {
        console.warn("Failed to initialize notifications on startup:", err);
      });
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AppProvider>
          <GlobalLoader />
          <RouterProvider router={router} />
        </AppProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
