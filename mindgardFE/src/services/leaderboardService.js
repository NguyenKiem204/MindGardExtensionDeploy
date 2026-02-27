import { api } from "../utils/api.js";

export const leaderboardService = {
  /**
   * Get real leaderboard data
   * @param {string} period - "daily" | "weekly" | "monthly"
   * @param {Date} date - Reference date
   * @param {string} scope - "global" | "friends"
   */
  getRealLeaderboard: async (period, date, scope = "global") => {
    const dateStr = date.toISOString().split("T")[0];
    console.log("[leaderboardService] getRealLeaderboard() called", {
      period,
      date: dateStr,
      scope,
      url: `/leaderboard/real`,
    });
    try {
      const res = await api.get(`/leaderboard/real`, {
        params: { period, date: dateStr, scope },
      });
      console.log("[leaderboardService] API response:", {
        success: res.data?.success,
        data: res.data?.data,
        dataLength: res.data?.data?.length || 0,
        fullResponse: res.data,
      });
      return res.data?.data || [];
    } catch (err) {
      console.error("[leaderboardService] API error:", {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
        message: err?.message,
      });
      throw err;
    }
  },
};
