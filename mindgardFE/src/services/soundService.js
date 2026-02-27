import { api } from "../utils/api.js";

export const soundService = {
    getMusic: async () => {
        try {
            const res = await api.get("/sounds/music");
            return res.data?.data || [];
        } catch (error) {
            console.warn("Failed to fetch music from API, utilizing fallback data:", error);
            return [
                {
                    id: "lofi-girl",
                    name: "Lofi Girl 24/7",
                    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
                    src: "jfKfPfyJRdk",
                    type: "YOUTUBE",
                    category: "Focus"
                },
                {
                    id: "synthwave-boy",
                    name: "Synthwave Radio",
                    thumbnail: "https://i.ytimg.com/vi/MVPTGNGiI-4/hqdefault.jpg",
                    src: "MVPTGNGiI-4",
                    type: "YOUTUBE",
                    category: "Deep"
                },
                {
                    id: "piano-focus",
                    name: "Quiet Piano",
                    thumbnail: "https://i.ytimg.com/vi/t2a4lYc3h1E/hqdefault.jpg",
                    src: "t2a4lYc3h1E",
                    type: "YOUTUBE",
                    category: "Classical"
                },
                {
                    id: "dark-ambient",
                    name: "Dark Space Ambient",
                    thumbnail: "https://i.ytimg.com/vi/S_oMDVO-UAA/hqdefault.jpg",
                    src: "S_oMDVO-UAA",
                    type: "YOUTUBE",
                    category: "Deep"
                }
            ];
        }
    },

    getSoundscapes: async () => {
        // For now returning current hardcoded soundscapes (frontend side) if backend not fully ready for this part,
        // OR fetch from Backend if implemented. 
        // Plan: Fetch from default list matching what we had, or fetch from API if we implemented the endpoint.
        // The user's backend code I saw didn't implement 'getSoundscapes' hardcoded list, only 'getMusicList'.
        // So for Soundscapes, I will keep using the frontend list for now but structured properly, 
        // or adding an API endpoint later. The user asked for Music mostly.
        return [];
    }
};
