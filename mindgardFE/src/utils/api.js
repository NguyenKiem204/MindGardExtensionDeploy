import axios from "axios";

let refreshTokenPromise = null;

export const authManager = {
  isAuthenticated: () => {
    return localStorage.getItem("accessToken") !== null;
  },

  shouldRefreshToken: () => {
    const expiresAt = localStorage.getItem("tokenExpiresAt");
    if (!expiresAt) return true;
    const remainingMs = parseInt(expiresAt) - Date.now();
    return remainingMs <= 2 * 60 * 1000;
  },

  ensureValidToken: async () => {
    if (authManager.shouldRefreshToken()) {
      return await authManager.refreshToken();
    }
    return authManager.getAccessToken();
  },

  getAccessToken: () => {
    return localStorage.getItem("accessToken");
  },

  setAccessToken: (token, expiresIn) => {
    localStorage.setItem("accessToken", token);
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem("tokenExpiresAt", expiresAt.toString());
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({ token: token });
    }
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiresAt");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("mindgard_auth");
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.remove(['token', 'auth_token', 'jwt']);
    }
    // Dispatch events so UI components know auth is cleared
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("mindgard_auth_cleared"));
      window.dispatchEvent(new CustomEvent("mindgard_auth_changed", { detail: { authenticated: false } }));
    }
  },

  refreshToken: async () => {
    if (refreshTokenPromise) {
      return refreshTokenPromise;
    }

    refreshTokenPromise = (async () => {
      try {
        const cachedStr = localStorage.getItem("mindgard_auth");
        const cached = cachedStr ? JSON.parse(cachedStr) : {};
        const rToken = localStorage.getItem("refreshToken") || cached?.refreshToken || "";

        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "https://kiemnv.shop/api"
          }/auth/refresh`,
          { refreshToken: rToken },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (response.data.success) {
          const data = response.data.data;
          const expiresInSec = data.expiresIn || Math.floor((new Date(data.expiresAt) - new Date()) / 1000);
          authManager.setAccessToken(data.accessToken, expiresInSec);
          
          // Update cached auth with new refresh token and user info
          const cachedStrUpdate = localStorage.getItem("mindgard_auth");
          const cachedUpdate = cachedStrUpdate ? JSON.parse(cachedStrUpdate) : {};
          localStorage.setItem("mindgard_auth", JSON.stringify({ ...cachedUpdate, ...data }));

          return data.accessToken;
        } else {
          throw new Error("Refresh token failed");
        }
      } catch (error) {
        authManager.clearTokens();
        throw error;
      } finally {
        refreshTokenPromise = null;
      }
    })();

    return refreshTokenPromise;
  },
};

export function initAuthAutoRefresh() {
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", async () => {
      if (
        document.visibilityState === "visible" &&
        authManager.isAuthenticated()
      ) {
        try {
          if (authManager.shouldRefreshToken()) {
            await authManager.refreshToken();
          }
        } catch {
          // ignore
        }
      }
    });
  }

  if (typeof window !== "undefined") {
    setInterval(async () => {
      if (!authManager.isAuthenticated()) return;
      if (authManager.shouldRefreshToken()) {
        try {
          await authManager.refreshToken();
        } catch {
          // ignore refresh token error
        }
      }
    }, 60 * 1000);
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://kiemnv.shop/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    if (authManager.isAuthenticated() && authManager.shouldRefreshToken()) {
      try {
        await authManager.ensureValidToken();
      } catch (error) {
      }
    }

    const accessToken = authManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      isRefreshing = true;
      try {
        const accessToken = await authManager.refreshToken();

        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Dispatch event để UI update
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("mindgard_auth_expired"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);


export default api;
