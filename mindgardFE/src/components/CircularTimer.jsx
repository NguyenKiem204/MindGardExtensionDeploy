import { useEffect, useRef, useState } from "react";
import { getLocal } from "../utils/chromeStorage";
import { showSessionCompleteCelebration } from "../utils/celebrations";
import { pomodoroService } from "../services/pomodoroService";
import { authService } from "../services/authService";

export default function CircularTimer({ onStartFocus, onComplete, autoStart }) {
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
                const dateISO = new Date().toISOString();
                await pomodoroService.record({
                  dateISO,
                  durationMin: completedMin,
                  taskTitle: taskTitle || "Deep work",
                  isPartial: false, // Completed session
                });
                console.log(`[Pomodoro] Recorded completed session: ${completedMin} minutes`);
              } catch (e) {
                console.error("Failed to record completed session:", e);
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
      console.log("[Pomodoro] Started", {
        mode,
        startTime: startTimeRef.current,
        initialRemaining: initialRemainingRef.current,
        remaining,
      });
      if (mode === "work" && onStartFocus) onStartFocus();
    } else {
      console.log("[Pomodoro] start() called but already running");
    }
  }

  async function pause() {
    console.log("[Pomodoro] pause() called", {
      running,
      mode,
      hasStartTime: !!startTimeRef.current,
      hasInitialRemaining: !!initialRemainingRef.current,
      startTime: startTimeRef.current,
      initialRemaining: initialRemainingRef.current,
    });
    
    if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
      // Calculate elapsed time
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const elapsedMin = Math.floor(elapsedSec / 60);
      
      console.log(`[Pomodoro] Pause: elapsed=${elapsedMin} minutes (${elapsedSec} seconds), authenticated=${authService.isAuthenticated()}`);
      
      // Only record if >= 1 minute and user is authenticated
      if (elapsedMin >= 1 && authService.isAuthenticated()) {
        try {
          const dateISO = new Date().toISOString();
          console.log(`[Pomodoro] Calling API to record partial session: ${elapsedMin} minutes`);
          const result = await pomodoroService.record({
            dateISO,
            durationMin: elapsedMin,
            taskTitle: taskTitle || "Deep work",
            isPartial: true, // Mark as partial session
          });
          console.log(`[Pomodoro] Successfully recorded partial session:`, result);
        } catch (err) {
          console.error("[Pomodoro] Failed to record partial session:", {
            error: err,
            response: err?.response?.data,
            status: err?.response?.status,
          });
          setError("Failed to save session: " + (err?.response?.data?.message || err?.message || "Unknown error"));
        }
      } else {
        if (elapsedMin < 1) {
          console.log(`[Pomodoro] Skipped recording: ${elapsedMin} minutes (< 1 minute threshold)`);
        } else if (!authService.isAuthenticated()) {
          console.log(`[Pomodoro] Skipped recording: user not authenticated`);
        } else {
          console.log(`[Pomodoro] Conditions not met:`, {
            elapsedMin,
            isAuthenticated: authService.isAuthenticated(),
            condition1: elapsedMin >= 1,
            condition2: authService.isAuthenticated(),
          });
        }
      }
    } else {
      console.log(`[Pomodoro] Pause conditions not met:`, {
        running,
        mode,
        isWork: mode === "work",
        hasStartTime: !!startTimeRef.current,
        hasInitialRemaining: !!initialRemainingRef.current,
      });
    }
    setRunning(false);
    startTimeRef.current = null;
    initialRemainingRef.current = null;
  }

  async function reset() {
    // Record partial time if any
    if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const elapsedMin = Math.floor(elapsedSec / 60);
      
      console.log(`[Pomodoro] Reset: elapsed=${elapsedMin} minutes, authenticated=${authService.isAuthenticated()}`);
      
      if (elapsedMin >= 1 && authService.isAuthenticated()) {
        try {
          const dateISO = new Date().toISOString();
          console.log(`[Pomodoro] Calling API to record partial session on reset: ${elapsedMin} minutes`);
          const result = await pomodoroService.record({
            dateISO,
            durationMin: elapsedMin,
            taskTitle: taskTitle || "Deep work",
            isPartial: true, // Mark as partial session
          });
          console.log(`[Pomodoro] Successfully recorded partial session on reset:`, result);
        } catch (err) {
          console.error("[Pomodoro] Failed to record partial session on reset:", {
            error: err,
            response: err?.response?.data,
            status: err?.response?.status,
          });
          setError("Failed to save session: " + (err?.response?.data?.message || err?.message || "Unknown error"));
        }
      } else {
        if (elapsedMin < 1) {
          console.log(`[Pomodoro] Skipped recording on reset: ${elapsedMin} minutes (< 1 minute threshold)`);
        } else if (!authService.isAuthenticated()) {
          console.log(`[Pomodoro] Skipped recording on reset: user not authenticated`);
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

  // Calculate progress for circular progress bar
  const totalSeconds = mode === "work" ? workMin * 60 : breakMin * 60;
  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Mode Tabs */}
      <div className="flex mb-8">
        <button
          onClick={async () => {
            // Record partial time if switching from work mode while running
            if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
              const elapsedMs = Date.now() - startTimeRef.current;
              const elapsedSec = Math.floor(elapsedMs / 1000);
              const elapsedMin = Math.floor(elapsedSec / 60);
              if (elapsedMin >= 1) {
                try {
                  const dateISO = new Date().toISOString();
                  await pomodoroService.record({
                    dateISO,
                    durationMin: elapsedMin,
                    taskTitle: taskTitle || "Deep work",
                    isPartial: true, // Mark as partial session
                  });
                  console.log(`[Pomodoro] Recorded partial session on mode switch: ${elapsedMin} minutes`);
                } catch (err) {
                  console.error("Failed to record partial session:", err);
                }
              }
            }
            setMode("work");
            setRemaining(workMin * 60);
            setRunning(false);
            startTimeRef.current = null;
            initialRemainingRef.current = null;
          }}
          className={`px-6 py-2 rounded-l-lg border border-white/20 transition-colors ${
            mode === "work"
              ? "bg-white/20 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          FOCUS
        </button>
        <button
          onClick={async () => {
            // Record partial time if switching from work mode while running
            if (running && mode === "work" && startTimeRef.current && initialRemainingRef.current) {
              const elapsedMs = Date.now() - startTimeRef.current;
              const elapsedSec = Math.floor(elapsedMs / 1000);
              const elapsedMin = Math.floor(elapsedSec / 60);
              if (elapsedMin >= 1) {
                try {
                  const dateISO = new Date().toISOString();
                  await pomodoroService.record({
                    dateISO,
                    durationMin: elapsedMin,
                    taskTitle: taskTitle || "Deep work",
                    isPartial: true, // Mark as partial session
                  });
                  console.log(`[Pomodoro] Recorded partial session on mode switch: ${elapsedMin} minutes`);
                } catch (err) {
                  console.error("Failed to record partial session:", err);
                }
              }
            }
            setMode("break");
            setRemaining(breakMin * 60);
            setRunning(false);
            startTimeRef.current = null;
            initialRemainingRef.current = null;
          }}
          className={`px-6 py-2 rounded-r-lg border border-white/20 border-l-0 transition-colors ${
            mode === "break"
              ? "bg-white/20 text-white"
              : "bg-white/10 text-white/70 hover:bg-white/15"
          }`}
        >
          BREAK
        </button>
      </div>

      {/* Circular Timer */}
      <div className="relative mb-8">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Timer Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-light text-white mb-2">
            {mm}:{ss}
          </div>
          <div className="text-sm text-white/70 uppercase tracking-wider">
            {mode} mode
          </div>
        </div>
      </div>

      {/* Session Goal Input */}
      <div className="mb-8 w-full max-w-md">
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="I will focus on..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={start}
          disabled={running}
          className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg transition-colors font-medium"
        >
          {running ? "Running..." : "Start"}
        </button>
        <button
          onClick={pause}
          disabled={!running}
          className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white rounded-lg transition-colors font-medium"
        >
          Pause
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
        >
          Reset
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="mt-6 text-xs text-white/50 text-center">
        Press Space to start/pause, R to reset
      </div>
    </div>
  );
}
