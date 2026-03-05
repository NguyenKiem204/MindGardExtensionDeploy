import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

const AudioCtx = createContext();

export const useAudio = () => useContext(AudioCtx);

export const AudioProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMusic, setActiveMusic] = useState(null);
    const [activeSoundscapes, setActiveSoundscapes] = useState({});
    const [globalVolume, setGlobalVolume] = useState(0.5);

    const musicRef = useRef(new Audio());
    const soundscapeRefs = useRef({});

    // ── Setup music audio element ──
    useEffect(() => {
        const audio = musicRef.current;
        audio.loop = true;
        audio.volume = globalVolume;

        const onEnded = () => setIsPlaying(false);
        const onError = (e) => console.warn("[Sounds] Music playback error:", e);

        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);

        return () => {
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            audio.pause();
        };
    }, []);

    // ── Sync play/pause ──
    useEffect(() => {
        const audio = musicRef.current;
        if (!audio.src) return;

        if (isPlaying) {
            audio.play().catch(e => console.warn("[Sounds] Play failed:", e));
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    // ── Sync volume ──
    useEffect(() => {
        musicRef.current.volume = globalVolume;
    }, [globalVolume]);

    // ── Sync soundscape volumes ──
    useEffect(() => {
        Object.keys(soundscapeRefs.current).forEach(id => {
            const audio = soundscapeRefs.current[id];
            if (audio) {
                audio.volume = (activeSoundscapes[id]?.volume || 0.5) * globalVolume;
            }
        });
    }, [globalVolume, activeSoundscapes]);

    const togglePlay = () => setIsPlaying(prev => !prev);
    const setPlaying = (state) => setIsPlaying(state);

    const playMusic = useCallback((track) => {
        if (!track?.src) return;

        if (activeMusic?.id === track.id) {
            // Toggle play/pause if same track
            setIsPlaying(prev => !prev);
        } else {
            // Switch to new track
            const audio = musicRef.current;
            audio.pause();
            audio.src = track.src || track.srcUrl || "";
            audio.volume = globalVolume;
            audio.load();

            setActiveMusic(track);
            setIsPlaying(true);

            audio.play().catch(e => console.warn("[Sounds] Play failed:", e));
        }
    }, [activeMusic, globalVolume]);

    const toggleSoundscape = (sound) => {
        setActiveSoundscapes(prev => {
            const next = { ...prev };
            if (next[sound.id]) {
                delete next[sound.id];
                if (soundscapeRefs.current[sound.id]) {
                    soundscapeRefs.current[sound.id].pause();
                    delete soundscapeRefs.current[sound.id];
                }
            } else {
                next[sound.id] = { ...sound, volume: 0.5 };
                const audio = new Audio(sound.src);
                audio.loop = true;
                audio.volume = 0.5 * globalVolume;
                audio.play().catch(e => console.warn("Audio play failed", e));
                soundscapeRefs.current[sound.id] = audio;
            }
            return next;
        });
    };

    return (
        <AudioCtx.Provider value={{
            isPlaying, togglePlay, setPlaying,
            activeMusic, playMusic,
            activeSoundscapes, toggleSoundscape,
            globalVolume, setGlobalVolume
        }}>
            {children}
        </AudioCtx.Provider>
    );
};
