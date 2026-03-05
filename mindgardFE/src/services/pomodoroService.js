import { api } from "../utils/api.js";

export const pomodoroService = {
  /**
   * Record a completed or partial pomodoro session
   * @param {Object} session - { dateISO: string, durationMin: number, taskTitle?: string }
   */
  record: async (session) => {
    const res = await api.post("/pomodoros/record", session);
    return res.data;
  },
};
