import { RouterProvider } from "react-router";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { router } from "./routes";
import { ThemeProvider } from "../context/ThemeContext";
import { AppProvider } from "../context/AppContext";

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}