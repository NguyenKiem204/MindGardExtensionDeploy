import { api } from "../utils/api.js";

export const leaderboardService = {
  /**
   * Get real leaderboard data
   * @param {string} period - "daily" | "weekly" | "monthly"
   * @param {Date} date - Reference date
   * @param {string} scope - "global" | "friends"
   */
  getRealLeaderboard: async (period, date, scope = "global") => {
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    
    try {
      const res = await api.get(`/leaderboard/real`, {
        params: { period, date: dateStr, scope },
      });
      
      const responseData = res.data?.data || {};
      return {
        entries: responseData.entries || [],
        currentUser: responseData.currentUser || null,
      };
    } catch (err) {
      throw err;
    }
  },
};
