import axios from "axios";

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
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("tokenExpiresAt");
  },

  refreshToken: async () => {
    try {
      console.log("[Auth] Calling /auth/refresh (cookie based) ...", {
        baseURL:
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
      });
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
        }/auth/refresh`,
        {},
        {
          withCredentials: true, 
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data.success) {
        const { accessToken, expiresAt } = response.data.data;
        console.log("[Auth] Refresh success", {
          expiresAt,
          hasToken: !!accessToken,
        });
        authManager.setAccessToken(
          accessToken,
          Math.floor((new Date(expiresAt) - new Date()) / 1000)
        );
        return accessToken;
      } else {
        console.warn("[Auth] Refresh response not success", response.data);
        throw new Error("Refresh token failed");
      }
    } catch (error) {
      console.error("[Auth] Refresh token error", {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      authManager.clearTokens();
      throw error;
    }
  },

  refreshTokenWithBody: async (refreshToken) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
        }/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data.success) {
        const { accessToken, expiresAt } = response.data.data;
        authManager.setAccessToken(
          accessToken,
          Math.floor((new Date(expiresAt) - new Date()) / 1000)
        );
        return accessToken;
      } else {
        throw new Error("Refresh token failed");
      }
    } catch (error) {
      authManager.clearTokens();
      throw error;
    }
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
            console.log("[Auth] visibilitychange -> refreshing token");
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
          console.log("[Auth] interval -> refreshing token");
          await authManager.refreshToken();
        } catch {
          // ignore refresh token error
        }
      }
    }, 60 * 1000);
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
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
        console.log(
          "[Auth] Access token near expiry; will rely on 401-triggered refresh if needed."
        );
        await authManager.ensureValidToken();
      } catch (error) {
        console.log(error);
      }
    }

    const accessToken = authManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.debug("[HTTP] Request", {
      url: config.url,
      hasAuth: !!accessToken,
    });

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
      console.warn("[HTTP] 401 detected; attempting refresh", {
        url: originalRequest.url,
      });
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
        console.log("[Auth] POST /auth/refresh (interceptor) ...");
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              ...api.defaults.headers,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        if (refreshResponse.data.success) {
          const { accessToken, expiresAt } = refreshResponse.data.data;
          const expiresIn = Math.floor(
            (new Date(expiresAt) - new Date()) / 1000
          );
          console.log("[Auth] Interceptor refresh success", {
            expiresAt,
            expiresIn,
          });
          authManager.setAccessToken(accessToken, expiresIn);
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          processQueue(null, accessToken);
          return api(originalRequest);
        } else {
          console.warn(
            "[Auth] Interceptor refresh not success",
            refreshResponse.data
          );
          authManager.clearTokens();
          processQueue(new Error("Refresh token failed"));
          // Dispatch event để UI update
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mindgard_auth_expired"));
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("[Auth] Interceptor refresh error", {
          status: refreshError?.response?.status,
          data: refreshError?.response?.data,
        });
        authManager.clearTokens();
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