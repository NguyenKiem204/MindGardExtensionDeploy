import { useEffect, useMemo, useState } from "react";
import PomodoroTimer from "./PomodoroTimer";
import WeatherLayer from "./WeatherLayer";
import MusicPlayer from "./MusicPlayer";
import TodoList from "./TodoList";
import Statistics from "./Statistics";
import {
  recordSession,
  readSessions,
  computeStreak,
  aggregateByWeekday,
} from "../utils/pomodoroStats";
import { getLocal } from "../utils/chromeStorage";

export default function Dashboard() {
  const [background, setBackground] = useState("");
  const [effect, setEffect] = useState("rain");
  const [sessions, setSessions] = useState([]);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [ambientMuted, setAmbientMuted] = useState(false);

  useEffect(() => {
    getLocal(["background", "defaultEffect"]).then((d) => {
      if (d.background) setBackground(d.background);
      if (d.defaultEffect) setEffect(d.defaultEffect);
    });
    readSessions().then(setSessions);
  }, []);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const weekdayTotals = useMemo(() => aggregateByWeekday(sessions), [sessions]);

  function onComplete({ durationMin, taskTitle }) {
    const dateISO = new Date().toISOString();
    recordSession({ dateISO, durationMin, taskTitle }).then(() =>
      readSessions().then(setSessions)
    );
    // mark focus session inactive in content scripts
    if (window.chrome?.storage?.session) {
      window.chrome.storage.session.set({ focusSessionActive: false });
    }
  }

  function onStartFocus() {
    if (window.chrome?.storage?.session) {
      window.chrome.storage.session.set({ focusSessionActive: true });
    }
  }

  return (
    <div
      className="min-h-screen relative text-white"
      style={{
        backgroundImage: background ? `url(${background})` : undefined,
        backgroundSize: "cover",
      }}
    >
      <WeatherLayer
        effect={effect}
        ambientVolume={ambientVolume}
        ambientMuted={ambientMuted}
      />
      <div className="relative z-10 min-h-screen backdrop-blur-[1px] bg-black/30">
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => (window.location.hash = "")}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Focus
              </button>
              <h1 className="text-2xl font-bold">Focus Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={effect}
                onChange={(e) => setEffect(e.target.value)}
                className="text-black rounded px-2 py-1"
              >
                <option value="rain">Rain</option>
                <option value="snow">Snow</option>
                <option value="sunny">Sunny</option>
              </select>
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded px-2 py-1">
                <button
                  onClick={() => setAmbientMuted((m) => !m)}
                  className="text-xs bg-white/20 rounded px-2 py-1"
                >
                  {ambientMuted ? "Unmute" : "Mute"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                />
              </div>
              <a
                href="options.html"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                target="_blank"
              >
                Settings
              </a>
            </div>
          </header>

          <main className="grid lg:grid-cols-3 gap-6 mt-8">
            <section className="lg:col-span-2">
              <PomodoroTimer
                onStartFocus={onStartFocus}
                onComplete={onComplete}
              />
              <div className="mt-6">
                <Statistics totals={weekdayTotals} streak={streak} />
              </div>
            </section>
            <aside className="space-y-6">
              <MusicPlayer />
              <TodoList />
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
