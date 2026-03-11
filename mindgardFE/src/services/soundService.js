import { api } from "../utils/api.js";

export const soundService = {
    getMusic: async () => {
        // Nhạc có sẵn - hardcoded, không phụ thuộc backend
        return [
            {
                id: "canon-in-d",
                name: "Canon in D - Pachelbel",
                thumbnail: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/canon-in-d-pachelbel-497279.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "river-flows-piano",
                name: "River Flows in You - Piano",
                thumbnail: "https://images.unsplash.com/photo-1552422535-c45813c61732?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/river-flows-in-you-piano-497277.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "beautiful-in-white-canon",
                name: "Beautiful in White x Canon in D - Piano Cover",
                thumbnail: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/beautiful-in-white-x-canon-in-d-piano-cover-by-riyandi-kusuma-497280.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "call-of-silence",
                name: "Call of Silence",
                thumbnail: "https://images.unsplash.com/photo-1552422535-c45813c61732?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/call-of-silence-497282.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "senbonzakura-violin",
                name: "Senbonzakura - Violin Cover by Lindsey Stirling",
                thumbnail: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/senbonzakura-violin-cover-by-lindsey-stirling-497283.mp3",
                type: "MP3",
                category: "Classical"
            },
            {
                id: "past-lives-lyrics",
                name: "Past Lives Lyrics",
                thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/past-lives-lyrics-497284.mp3",
                type: "MP3",
                category: "Focus"
            },
            {
                id: "past-lives-violin",
                name: "Past Lives - Violin Cover",
                thumbnail: "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?w=200&h=200&fit=crop",
                src: "https://pixabay.com/music/download/past-lives-violin-cover-497285.mp3",
                type: "MP3",
                category: "Classical"
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
