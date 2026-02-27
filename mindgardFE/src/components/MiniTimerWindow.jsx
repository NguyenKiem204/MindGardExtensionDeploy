import { useState, useEffect, useRef } from "react";
import { Play, Pause, X } from "lucide-react";

export default function MiniTimerWindow() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [taskInput, setTaskInput] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const intervalRef = useRef(null);

  // Sync with main window via chrome.storage
  useEffect(() => {
    const syncTimer = async () => {
      if (chrome?.storage?.session) {
        try {
          const data = await chrome.storage.session.get([
            'timerTimeLeft',
            'timerRunning',
            'timerFocusMode',
            'timerFocusDuration',
            'timerBreakDuration',
            'timerTaskInput',
            'timerBackgroundUrl'
          ]);
          
          if (data.timerTimeLeft !== undefined) setTimeLeft(data.timerTimeLeft);
          if (data.timerRunning !== undefined) setIsRunning(data.timerRunning);
          if (data.timerFocusMode !== undefined) setIsFocusMode(data.timerFocusMode);
          if (data.timerFocusDuration !== undefined) setFocusDuration(data.timerFocusDuration);
          if (data.timerBreakDuration !== undefined) setBreakDuration(data.timerBreakDuration);
          if (data.timerTaskInput !== undefined) setTaskInput(data.timerTaskInput || "");
          if (data.timerBackgroundUrl !== undefined) setBackgroundUrl(data.timerBackgroundUrl || "");
          
          // Also check localStorage for background
          try {
            const savedBg = localStorage.getItem('mindgard_background_url');
            if (savedBg) setBackgroundUrl(savedBg);
          } catch (e) {}
        } catch (e) {
          console.error('Error syncing timer:', e);
        }
      }
    };

    // Initial sync
    syncTimer();

    // Listen for changes
    if (chrome?.storage?.session?.onChanged) {
      const listener = (changes, areaName) => {
        if (areaName === 'session') {
          if (changes.timerTimeLeft) setTimeLeft(changes.timerTimeLeft.newValue);
          if (changes.timerRunning) setIsRunning(changes.timerRunning.newValue);
          if (changes.timerFocusMode) setIsFocusMode(changes.timerFocusMode.newValue);
          if (changes.timerFocusDuration) setFocusDuration(changes.timerFocusDuration.newValue);
          if (changes.timerBreakDuration) setBreakDuration(changes.timerBreakDuration.newValue);
          if (changes.timerTaskInput) setTaskInput(changes.timerTaskInput.newValue || "");
          if (changes.timerBackgroundUrl) setBackgroundUrl(changes.timerBackgroundUrl.newValue || "");
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            if (isFocusMode) {
              setIsFocusMode(false);
              return breakDuration * 60;
            } else {
              setIsFocusMode(true);
              return focusDuration * 60;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isFocusMode, focusDuration, breakDuration]);

  // Save state changes back to storage
  useEffect(() => {
    if (chrome?.storage?.session) {
      chrome.storage.session.set({
        timerTimeLeft: timeLeft,
        timerRunning: isRunning,
        timerFocusMode: isFocusMode,
        timerFocusDuration: focusDuration,
        timerBreakDuration: breakDuration,
        timerTaskInput: taskInput
      });
    }
  }, [timeLeft, isRunning, isFocusMode, focusDuration, breakDuration, taskInput]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = async () => {
    const newRunning = !isRunning;
    setIsRunning(newRunning);
    
    // Save to storage - main window will pick it up
    if (chrome?.storage?.session) {
      chrome.storage.session.set({ timerRunning: newRunning });
    }
  };

  const handleModeSwitch = () => {
    const newFocusMode = !isFocusMode;
    setIsFocusMode(newFocusMode);
    if (isFocusMode) {
      setTimeLeft(breakDuration * 60);
    } else {
      setTimeLeft(focusDuration * 60);
    }
    
    // Save to storage
    if (chrome?.storage?.session) {
      chrome.storage.session.set({
        timerFocusMode: newFocusMode,
        timerTimeLeft: newFocusMode ? focusDuration * 60 : breakDuration * 60
      });
    }
  };

  const handleClose = () => {
    if (window.chrome?.windows) {
      chrome.windows.getCurrent((window) => {
        chrome.windows.remove(window.id);
      });
    }
  };

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: backgroundUrl 
          ? `url(${backgroundUrl})` 
          : 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blurred background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400/30 via-blue-300/20 to-green-400/30 backdrop-blur-sm"></div>
      
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 py-12">
        {/* Mode Toggle - Top */}
        <div className="flex items-center gap-6 justify-center mb-8">
          <button
            onClick={handleModeSwitch}
            className={`text-2xl font-medium transition-colors ${
              isFocusMode ? 'text-white drop-shadow-lg' : 'text-white/50'
            }`}
          >
            FOCUS
          </button>
          <button
            onClick={handleModeSwitch}
            className={`text-2xl font-medium transition-colors ${
              !isFocusMode ? 'text-white drop-shadow-lg' : 'text-white/50'
            }`}
          >
            BREAK
          </button>
        </div>

        {/* Timer - Large and centered */}
        <div className="text-center mb-8">
          <div className="text-9xl font-bold text-white leading-none drop-shadow-2xl mb-6">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xl text-white drop-shadow-lg">
            {taskInput || "I will focus on..."}
          </div>
        </div>

        {/* Play Button - Circular, centered */}
        <button
          onClick={toggleTimer}
          className={`w-16 h-16 rounded-full text-white transition-all shadow-2xl flex items-center justify-center ${
            isRunning
              ? 'bg-blue-500 hover:bg-blue-600 scale-105'
              : 'bg-blue-500 hover:bg-blue-600 scale-100 hover:scale-105'
          }`}
        >
          {isRunning ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-1" />
          )}
        </button>
      </div>

      {/* Close button - top right corner */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 rounded-full p-2"
        title="Close"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
