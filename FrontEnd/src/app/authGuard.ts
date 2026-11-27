/**
 * Synchronously checks if a JWT token exists, has 3 parts, and has not expired.
 */
export function isJwtValid(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode base64url payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    // Validate exp claim if present
    if (payload.exp && typeof payload.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowInSeconds) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronously checks if a user object exists in localStorage and is valid JSON.
 */
export function isUserValid(userStr: string | null): boolean {
  if (!userStr || typeof userStr !== "string") return false;
  try {
    const user = JSON.parse(userStr);
    return Boolean(user && typeof user === "object" && (user._id || user.id || user.email));
  } catch {
    return false;
  }
}

/**
 * Safely clears localStorage authentication data.
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch {}
}

/**
 * Synchronous authentication check for route guards.
 * Returns true only if both token and user exist, token is unexpired, and user is valid.
 */
export function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) return false;
    if (!isJwtValid(token) || !isUserValid(user)) {
      clearAuthSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronously checks if the currently logged-in user is an administrator.
 */
export function isAdmin(): boolean {
  if (!isAuthenticated()) return false;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === "admin") return true;
    }

    const token = localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.role === "admin") return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
