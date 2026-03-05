import { api } from "../utils/api.js";

export const soundService = {
    getMusic: async () => {
        // Nhạc có sẵn - hardcoded, không phụ thuộc backend
        return [
            {
                id: "serene-view",
                name: "Serene View",
                thumbnail: "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/443/443.mp3",
                type: "MP3",
                category: "Focus"
            },
            {
                id: "sweet-september",
                name: "Sweet September",
                thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/282/282.mp3",
                type: "MP3",
                category: "Focus"
            },
            {
                id: "curiosity",
                name: "Curiosity",
                thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/480/480.mp3",
                type: "MP3",
                category: "Deep"
            },
            {
                id: "sleepy-cat",
                name: "Sleepy Cat",
                thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/135/135.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "majestic",
                name: "Majestic",
                thumbnail: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/475/475.mp3",
                type: "MP3",
                category: "Positive"
            },
            {
                id: "pop-vibes",
                name: "Pop Vibes",
                thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&h=200&fit=crop",
                src: "https://assets.mixkit.co/music/695/695.mp3",
                type: "MP3",
                category: "Positive"
            }
        ];
    },

    getUserMusic: async () => {
        try {
            const res = await api.get("/sounds/all");
            return res.data?.data || [];
        } catch (error) {
            console.warn("Failed to fetch user sounds:", error);
            return [];
        }
    },

    uploadMusic: async (file, name) => {
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);

        const res = await api.post("/sounds/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return res.data?.data;
    },

    deleteUserMusic: async (id) => {
        await api.delete(`/sounds/${id}`);
    },

    getSoundscapes: async () => {
        return [];
    }
};
