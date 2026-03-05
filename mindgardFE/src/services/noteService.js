import { api } from "../utils/api.js";

export const noteService = {
    getNotes: async (page = 0, size = 50) => {
        try {
            const res = await api.get(`/notes?page=${page}&size=${size}&sort=pinned,desc&sort=updatedAt,desc`);
            return res.data?.data?.content || [];
        } catch (error) {
            console.warn("Failed to fetch notes:", error);
            return [];
        }
    },

    createNote: async (data) => {
        const res = await api.post("/notes", data);
        return res.data?.data;
    },

    updateNote: async (id, data) => {
        const res = await api.put(`/notes/${id}`, data);
        return res.data?.data;
    },

    deleteNote: async (id) => {
        await api.delete(`/notes/${id}`);
    },

    aiEnhance: async (title, content) => {
        const res = await api.post("/notes/ai-enhance", { title, content });
        return res.data?.data; // { summary, tags }
    }
};
