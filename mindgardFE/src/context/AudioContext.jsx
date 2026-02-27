import { createContext, useContext, useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";

if (typeof console !== "undefined") {
    console.log("[Sounds] AudioContext.jsx loaded – nếu thấy dòng này thì code mới đã chạy.");
}

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeMusic, setActiveMusic] = useState(null); // { id, src, type, name, thumbnail }
    const [activeSoundscapes, setActiveSoundscapes] = useState({}); // { id: { volume: 0.5, ... } }
    const [globalVolume, setGlobalVolume] = useState(0.5);

    // Ref for YouTube player
    const playerRef = useRef(null);
    // Refs for HTML5 Audio (Soundscapes)
    const soundscapeRefs = useRef({});
    // Bỏ qua onPause ngay sau khi user bấm play (tránh AbortError: play bị pause ngắt)
    const lastPlayRequestAt = useRef(0);

    // Unmute YouTube player (trình duyệt thường ép mute khi autoplay)
    const unmuteYoutubePlayer = () => {
        try {
            const internal = playerRef.current?.getInternalPlayer?.();
            if (internal && typeof internal.unMute === "function") {
                internal.unMute();
                const vol = Math.round((globalVolume ?? 0.5) * 100);
                if (typeof internal.setVolume === "function") internal.setVolume(vol);
            }
        } catch (e) {
            console.warn("[Sounds] unmuteYoutubePlayer", e);
        }
    };

    // Toggle global play/pause
    const togglePlay = () => setIsPlaying(!isPlaying);

    // setPlaying(true/false) direct
    const setPlaying = (state) => setIsPlaying(state);

    // Normalize YouTube track: ensure type is YOUTUBE and src is video ID only
    const normalizeMusicTrack = (track) => {
        if (!track) return null;
        let src = track.src || track.videoId || "";
        if (src.includes("youtube.com") || src.includes("youtu.be")) {
            const match = src.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:&|\?|$)/) || src.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (match) src = match[1];
        }
        const type = (track.type || "").toUpperCase();
        return { ...track, src, type: type || "YOUTUBE" };
    };

    // Play a music track (replaces current music)
    const playMusic = (track) => {
        console.log("[Sounds] playMusic called", { track, rawSrc: track?.src, rawType: track?.type });
        const normalized = normalizeMusicTrack(track);
        if (!normalized?.src) {
            console.warn("[Sounds] playMusic skipped: no video ID", { normalized });
            return;
        }
        console.log("[Sounds] playMusic setting activeMusic", { id: normalized.id, src: normalized.src, type: normalized.type });
        if (activeMusic?.id === normalized.id) {
            setIsPlaying(!isPlaying);
        } else {
            setActiveMusic(normalized);
            lastPlayRequestAt.current = Date.now();
            setIsPlaying(true);
        }
    };

    // Toggle a soundscape (Rain, Fire...)
    // sound = { id, src, name }
    const toggleSoundscape = (sound) => {
        setActiveSoundscapes(prev => {
            const next = { ...prev };
            if (next[sound.id]) {
                delete next[sound.id];
                // Stop audio
                if (soundscapeRefs.current[sound.id]) {
                    soundscapeRefs.current[sound.id].pause();
                    delete soundscapeRefs.current[sound.id];
                }
            } else {
                next[sound.id] = { ...sound, volume: 0.5 };
                // Start audio
                const audio = new Audio(sound.src);
                audio.loop = true;
                audio.volume = 0.5 * globalVolume;
                audio.play().catch(e => console.warn("Audio play failed", e));
                soundscapeRefs.current[sound.id] = audio;
            }
            return next;
        });
    };

    // Update volume
    useEffect(() => {
        // Update soundscapes volume
        Object.keys(soundscapeRefs.current).forEach(id => {
            const audio = soundscapeRefs.current[id];
            if (audio) {
                audio.volume = (activeSoundscapes[id]?.volume || 0.5) * globalVolume;
            }
        });
    }, [globalVolume, activeSoundscapes]);

    const showYoutubePlayer = !!(activeMusic && (activeMusic.type || "").toUpperCase() === "YOUTUBE" && activeMusic.src);
    if (typeof console !== "undefined" && activeMusic) {
        console.log("[Sounds] AudioProvider render (có bài đang chọn)", {
            activeMusicId: activeMusic?.id,
            activeMusicSrc: activeMusic?.src,
            isPlaying,
            showYoutubePlayer,
        });
    }

    return (
        <AudioContext.Provider value={{
            isPlaying, togglePlay, setPlaying,
            activeMusic, playMusic,
            activeSoundscapes, toggleSoundscape,
            globalVolume, setGlobalVolume
        }}>
            {children}

            {/* YouTube Player - phải >= 200x200px thì YouTube mới cho phát (API requirement) */}
            {showYoutubePlayer && (
                <div
                    data-sounds-debug="youtube-player-mounted"
                    style={{
                        position: "fixed",
                        right: 0,
                        bottom: 0,
                        width: 256,
                        height: 256,
                        opacity: 0.01,
                        pointerEvents: "none",
                        zIndex: 9998,
                        overflow: "hidden",
                    }}
                    aria-hidden="true"
                >
                    <ReactPlayer
                        ref={playerRef}
                        url={`https://www.youtube-nocookie.com/watch?v=${activeMusic.src}`}
                        playing={isPlaying}
                        volume={globalVolume}
                        loop={true}
                        width="256"
                        height="256"
                        playsinline={true}
                        config={{
                            youtube: {
                                playerVars: {
                                    showinfo: 0,
                                    controls: 0,
                                    autoplay: 1,
                                    playsinline: 1,
                                    modestbranding: 1,
                                    rel: 0,
                                },
                            },
                        }}
                        onError={(e) => {
                            console.error("[Sounds] YouTube Player Error:", e);
                            setPlaying(false);
                        }}
                        onReady={() => {
                            console.log("[Sounds] YouTube Player ready, videoId:", activeMusic.src);
                            unmuteYoutubePlayer();
                        }}
                        onStart={() => {
                            console.log("[Sounds] YouTube started");
                            setPlaying(true);
                            // Unmute sau khi start (trình duyệt có thể mute autoplay)
                            setTimeout(unmuteYoutubePlayer, 300);
                        }}
                        onPlay={() => setPlaying(true)}
                        onPause={() => {
                            // Tránh onPause fire ngay khi load (extension/YouTube) làm play() bị AbortError
                            const sincePlay = Date.now() - lastPlayRequestAt.current;
                            if (sincePlay > 2500) setPlaying(false);
                        }}
                        onBuffer={() => console.log("[Sounds] YouTube buffering...")}
                    />
                </div>
            )}
        </AudioContext.Provider>
    );
};
