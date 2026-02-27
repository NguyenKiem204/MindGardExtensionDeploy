import { useEffect, useMemo, useRef } from "react";

// Ambient sound sources (royalty-free)
const AMBIENT = {
  rain: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5f6d8f5ca4.mp3?filename=rain-ambient-ambient-100915.mp3",
  snow: "https://cdn.pixabay.com/download/audio/2023/02/28/audio_daa1ee0b9b.mp3?filename=wind-blowing-140418.mp3",
  sunny:
    "https://cdn.pixabay.com/download/audio/2021/08/04/audio_4b9b9b4a52.mp3?filename=birds-singing-forest-ambience-7441.mp3",
};

export default function WeatherLayer({
  effect,
  ambientVolume = 0.5,
  ambientMuted = false,
}) {
  const audioRef = useRef(null);

  const effectName =
    effect === "snow" ? "snow" : effect === "sunny" ? "sunny" : "rain";
  const audioSrc = useMemo(() => AMBIENT[effectName], [effectName]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = Math.min(Math.max(ambientVolume, 0), 1);
    el.muted = !!ambientMuted;
    if (el.src !== audioSrc) {
      el.src = audioSrc;
      el.load();
      el.play().catch(() => {});
    }
  }, [audioSrc, ambientVolume, ambientMuted]);

  return (
    <>
      {/* Particle effects layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <StyleTag />
        {effectName === "rain" && <RainLayer />}
        {effectName === "snow" && <SnowLayer />}
        {effectName === "sunny" && <SunnyLayer />}
      </div>
      {/* Hidden ambient audio */}
      <audio ref={audioRef} autoPlay loop playsInline />
    </>
  );
}

function StyleTag() {
  return (
    <style>{`
      @keyframes rainFall { to { transform: translateY(110vh); opacity: .9; } }
      @keyframes snowFall { to { transform: translateY(105vh) translateX(var(--xDrift)) rotate(var(--rotation)); opacity: .95; } }
      @keyframes sunDrift { 0% { transform: translate(-10%, -10%) scale(1); } 50% { transform: translate(5%, 5%) scale(1.03); } 100% { transform: translate(-10%, -10%) scale(1); } }
    `}</style>
  );
}

function RainLayer() {
  const drops = new Array(140).fill(0).map((_, i) => i);
  return (
    <div>
      {drops.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 1.2 + Math.random() * 0.8;
        const height = 40 + Math.random() * 60;
        const width = 1;
        const opacity = 0.35 + Math.random() * 0.25;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-10vh",
              left: `${left}vw`,
              width,
              height,
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.15), rgba(255,255,255,0.6))",
              filter: "blur(0.2px)",
              opacity,
              animation: `rainFall ${duration}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

function SnowLayer() {
  const flakes = new Array(120).fill(0).map((_, i) => i);
  return (
    <div>
      {flakes.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = 8 + Math.random() * 12;
        const size = 1.5 + Math.random() * 4;
        const opacity = 0.4 + Math.random() * 0.6;
        const drift = Math.random() * 30 - 15 + "vw";
        const rotation = Math.random() * 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-10vh",
              left: `${left}vw`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              opacity,
              boxShadow: "0 0 6px rgba(255,255,255,0.8)",
              "--xDrift": drift,
              "--rotation": rotation + "deg",
              animation: `snowFall ${duration}s linear ${delay}s infinite`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function SunnyLayer() {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          top: "-20vh",
          left: "-20vw",
          width: "80vw",
          height: "80vh",
          background:
            "radial-gradient(circle at 30% 30%, rgba(255,255,200,0.25), rgba(255,255,200,0.05) 40%, transparent 60%)",
          filter: "blur(2px)",
          animation: "sunDrift 20s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.03) 60%)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
