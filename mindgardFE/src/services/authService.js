import { api } from "../utils/api.js";

const STORAGE_KEY = "mindgard_auth";

const persistAuth = (authData) => {
  if (!authData) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
  if (authData.accessToken) {
    localStorage.setItem("accessToken", authData.accessToken);
  }
  if (authData.expiresIn) {
    const expiresAt = Date.now() + authData.expiresIn * 1000;
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());
  } else if (authData.expiresAt) {
    localStorage.setItem("tokenExpiresAt", new Date(authData.expiresAt).getTime().toString());
  }
  if (authData.refreshToken) {
    localStorage.setItem("refreshToken", authData.refreshToken);
  }
};

const loadAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to read auth cache", err);
    return null;
  }
};

const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("accessToken");
  localStorage.removeItem("tokenExpiresAt");
  localStorage.removeItem("refreshToken");
  // Dispatch event để các component biết auth đã clear
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mindgard_auth_cleared"));
    window.dispatchEvent(new CustomEvent("mindgard_auth_changed", { detail: { authenticated: false } }));
  }
};

const normalizeAuthResponse = (responseData) => {
  // Some endpoints wrap data under data, some don't
  return responseData?.data || responseData;
};

export const authService = {
  isAuthenticated: () => {
    const cached = loadAuth();
    if (!cached?.accessToken) return false;
    // Check token expiry
    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (expiresAt) {
      const remaining = parseInt(expiresAt) - Date.now();
      if (remaining <= 0) {
        // Token expired, clear auth
        clearAuth();
        return false;
      }
    }
    return true;
  },

  getCachedAuth: () => loadAuth(),

  getDisplayInfo: (fallbackName, fallbackType) => {
    const cached = loadAuth();
    if (!cached) return { name: fallbackName, type: fallbackType };
    return {
      name: cached?.user?.username || cached?.user?.email || fallbackName,
      type:
        (Array.isArray(cached?.user?.roles) && cached.user.roles.join(", ")) ||
        cached?.user?.roleName ||
        "Member",
    };
  },

  login: async ({ username, password }) => {
    const res = await api.post("/auth/login", { username, password });
    const authData = normalizeAuthResponse(res.data);
    persistAuth(authData);
    // Dispatch event để UI update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mindgard_auth_changed", { detail: { authenticated: true } }));
    }
    return authData;
  },

  register: async ({ username, email, password, firstName, lastName }) => {
    const res = await api.post("/auth/register", { username, email, password, firstName, lastName });
    const authData = normalizeAuthResponse(res.data);
    persistAuth(authData);
    // Dispatch event để UI update
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mindgard_auth_changed", { detail: { authenticated: true } }));
    }
    return authData;
  },

  refreshMe: async () => {
    // Pull latest user fields (level/xp/avatar/etc) after gameplay updates
    const res = await api.get("/auth/me");
    const payload = res.data?.data || res.data;
    const cached = loadAuth() || {};
    const next = {
      ...cached,
      user: payload,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  },

  logout: async () => {
    const cached = loadAuth();
    try {
      const refreshToken = cached?.refreshToken || localStorage.getItem("refreshToken");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (err) {
      // Swallow server errors but still clear local state
      console.warn("Logout request failed", err);
    } finally {
      clearAuth();
    }
  },

  clearAuth,
};
