import { api } from "../utils/api.js";

export const userService = {
  /**
   * Update current user's profile
   * @param {Object} profile - { firstName?, lastName?, avatarUrl?, bio? }
   */
  updateProfile: async (profile) => {
    const res = await api.put("/users/profile", profile);
    return res.data;
  },
};
