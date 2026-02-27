import { useEffect, useRef, useState } from "react";
import { getLocal } from "../utils/chromeStorage";
import { showSessionCompleteCelebration } from "../utils/celebrations";
import { pomodoroService } from "../services/pomodoroService";
import { authService } from "../services/authService";

export default function PomodoroTimer({ onStartFocus, onComplete }) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [remaining, setRemaining] = useState(25 * 60);
  const [mode, setMode] = useState("work"); // 'work' | 'break'
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const [taskTitle, setTaskTitle] = useState("Deep work");
  const [error, setError] = useState("");
  const startTimeRef = useRef(null); // Track when timer started
  const initialRemainingRef = useRef(null); // Track initial remaining time

  useEffect(() => {
    getLocal(["workMin", "breakMin"]).then((d) => {
      const wm = d.workMin ?? 25;
      const bm = d.breakMin ?? 5;
      setWorkMin(wm);
      setBreakMin(bm);
      setRemaining(wm * 60);
    });
    try {
      if (sessionStorage.getItem("autoStartPomodoro") === "1") {
        sessionStorage.removeItem("autoStartPomodoro");
        setTimeout(() => start(), 200);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          const completedMin = mode === "work" ? workMin : breakMin;
          if (mode === "work") {
            // Record to backend API (async, don't await)
            (async () => {
              try {
                if (authService.isAuthenticated()) {
                  const dateISO = new Date().toISOString();
                  await pomodoroService.record({
                    dateISO,
                    durationMin: completedMin,
                    taskTitle: taskTitle || "Deep work",
                    isPartial: false, // Completed session
                  });
                  console.log(`[PomodoroTimer] Recorded completed session: ${completedMin} minutes`);
                }
              } catch (e) {
                console.error("[PomodoroTimer] Failed to record completed session:", e);
              }
            })();
            // Also call onComplete callback for local storage
            if (onComplete) {
              try {
                onComplete({ durationMin: completedMin, taskTitle });
              } catch (e) {
                setError("Failed to save session: " + e.message);
              }
            }
          }
          setRunning(false);
          const nextMode = mode === "work" ? "break" : "work";
          setMode(nextMode);
          setRemaining((nextMode === "work" ? workMin : breakMin) * 60);

          // Show celebration for completed work session
          if (mode === "work") {
            showSessionCompleteCelebration();
          }

          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, workMin, breakMin, onComplete, taskTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (running) pause();
          else start();
          break;
        case "r":
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [running]);

  function start() {
    if (!running) {
      setError("");
      setRunning(true);
      startTimeRef.current = Date.now();
      initialRemainingRef.current = remaining;
      console.log("[PomodoroTimer] Started", {
        mode,
        startTime: startTimeRef.current,
        initialRemaining: initialRemainingRef.current,
        remaining,
      });
      if (mode === "work" && onStartFocus) onStartFocus();
    }
  }

  async function pause() {
    console.log("[PomodoroTimer] pause() called", {
      running,
      mode,
      hasStartTime: !!startTimeRef.current,
      hasInitialRemaining: !!initialRemainingRef.current,
    });
    
    if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
      // Calculate elapsed time
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const elapsedMin = Math.floor(elapsedSec / 60);
      
      console.log(`[PomodoroTimer] Pause: elapsed=${elapsedMin} minutes (${elapsedSec} seconds), authenticated=${authService.isAuthenticated()}`);
      
      // Only record if >= 1 minute and user is authenticated
      if (elapsedMin >= 1 && authService.isAuthenticated()) {
        try {
          const dateISO = new Date().toISOString();
          console.log(`[PomodoroTimer] Calling API to record partial session: ${elapsedMin} minutes`);
          const result = await pomodoroService.record({
            dateISO,
            durationMin: elapsedMin,
            taskTitle: taskTitle || "Deep work",
            isPartial: true,
          });
          console.log(`[PomodoroTimer] Successfully recorded partial session:`, result);
        } catch (err) {
          console.error("[PomodoroTimer] Failed to record partial session:", {
            error: err,
            response: err?.response?.data,
            status: err?.response?.status,
          });
          setError("Failed to save session: " + (err?.response?.data?.message || err?.message || "Unknown error"));
        }
      } else {
        if (elapsedMin < 1) {
          console.log(`[PomodoroTimer] Skipped recording: ${elapsedMin} minutes (< 1 minute threshold)`);
        } else if (!authService.isAuthenticated()) {
          console.log(`[PomodoroTimer] Skipped recording: user not authenticated`);
        }
      }
    }
    setRunning(false);
    startTimeRef.current = null;
    initialRemainingRef.current = null;
  }

  async function reset() {
    console.log("[PomodoroTimer] reset() called", {
      running,
      mode,
      hasStartTime: !!startTimeRef.current,
    });
    
    // Record partial time if any
    if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const elapsedMin = Math.floor(elapsedSec / 60);
      
      console.log(`[PomodoroTimer] Reset: elapsed=${elapsedMin} minutes, authenticated=${authService.isAuthenticated()}`);
      
      if (elapsedMin >= 1 && authService.isAuthenticated()) {
        try {
          const dateISO = new Date().toISOString();
          console.log(`[PomodoroTimer] Calling API to record partial session on reset: ${elapsedMin} minutes`);
          const result = await pomodoroService.record({
            dateISO,
            durationMin: elapsedMin,
            taskTitle: taskTitle || "Deep work",
            isPartial: true,
          });
          console.log(`[PomodoroTimer] Successfully recorded partial session on reset:`, result);
        } catch (err) {
          console.error("[PomodoroTimer] Failed to record partial session on reset:", {
            error: err,
            response: err?.response?.data,
            status: err?.response?.status,
          });
          setError("Failed to save session: " + (err?.response?.data?.message || err?.message || "Unknown error"));
        }
      }
    }
    
    setRunning(false);
    setMode("work");
    setRemaining(workMin * 60);
    setError("");
    startTimeRef.current = null;
    initialRemainingRef.current = null;
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between">
        <input
          className="text-black rounded px-3 py-2 bg-white/90"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="What are you working on?"
        />
        <span className="uppercase text-sm opacity-80">{mode} mode</span>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="text-center mt-6">
        <div className="text-6xl font-extrabold tracking-wider">
          {mm}:{ss}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={start}
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 transition-colors disabled:opacity-50"
            disabled={running}
          >
            {running ? "Running..." : "Start"}
          </button>
          <button
            onClick={pause}
            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded px-4 py-2 transition-colors disabled:opacity-50"
            disabled={!running}
          >
            Pause
          </button>
          <button
            onClick={reset}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded px-4 py-2 transition-colors"
          >
            Reset
          </button>
        </div>
        <div className="mt-2 text-xs opacity-60">
          Press Space to start/pause, R to reset
        </div>
      </div>
    </div>
  );
}
