import { api } from "../utils/api.js";

export const userService = {
  updateProfile: async (profile) => {
    const res = await api.put("/users/profile", profile);
    return res.data;
  },
};
