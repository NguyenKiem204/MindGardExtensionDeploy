import { api } from "../utils/api.js";

export const userService = {
  updateProfile: async (profile) => {
    const res = await api.put("/users/profile", profile);
    return res.data;
  },

  getStats: async () => {
    const res = await api.get("/stats");
    return res.data;
  },

  getFocusStats: async () => {
    const res = await api.get("/stats/focus");
    return res.data;
  },
};
