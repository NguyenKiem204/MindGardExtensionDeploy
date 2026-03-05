import { useEffect, useMemo, useRef, useState } from "react";

const TRACKS = [
  {
    id: "lofi",
    name: "Lofi Chill",
    url: "https://cdn.pixabay.com/audio/2021/12/20/audio_0b0d5d6f26.mp3",
  },
  {
    id: "rain",
    name: "Rain Sounds",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5f6d8f5ca4.mp3?filename=rain-ambient-ambient-100915.mp3",
  },
  {
    id: "piano",
    name: "Piano Focus",
    url: "https://cdn.pixabay.com/download/audio/2021/09/30/audio_9f3b3d7a4f.mp3?filename=peaceful-piano-ambient-10770.mp3",
  },
];

export default function MusicPlayer() {
  const audioRef = useRef(null);
  const [currentId, setCurrentId] = useState(TRACKS[0].id);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const current = useMemo(
    () => TRACKS.find((t) => t.id === currentId) || TRACKS[0],
    [currentId]
  );

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (playing && audioRef.current) audioRef.current.play().catch(() => {});
  }, [currentId, playing]);

  return (
    <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
      <div className="font-semibold mb-2">Music Player</div>
      <audio ref={audioRef} src={current.url} />
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="bg-blue-600 rounded text-white px-3 py-1"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>
      <ul className="space-y-1">
        {TRACKS.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => {
                setCurrentId(t.id);
                setPlaying(true);
              }}
              className={`w-full text-left px-2 py-1 rounded ${
                t.id === currentId ? "bg-blue-600 text-white" : "bg-white/5"
              }`}
            >
              {t.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
