import { useEffect, useMemo, useState } from "react";
import WeatherLayer from "./WeatherLayer";
import IconNav from "./IconNav";
import Modal from "./Modal";
import LinksModal from "./LinksModal";
import NotesModal from "./NotesModal";
import TimerSettingsModal from "./TimerSettingsModal";
import SoundsModal from "./SoundsModal";
import Greeting from "./Greeting";
import DailyQuote from "./DailyQuote";
import DailyFocusGoal from "./DailyFocusGoal";
import CircularTimer from "./CircularTimer";
import Onboarding from "./Onboarding";
import { getDailyBackground } from "../utils/backgroundService";

export default function FocusView() {
  const [viewMode, setViewMode] = useState("main"); // 'main' | 'focus'
  const [activeModal, setActiveModal] = useState(null);
  const [effect, setEffect] = useState("rain");
  const [background, setBackground] = useState("");
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const [ambientMuted, setAmbientMuted] = useState(false);
  const [now, setNow] = useState(new Date());
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (viewMode === "main") {
            startFocus();
          }
          break;
        case "Escape":
          if (viewMode === "focus") {
            exitFocus();
          } else if (activeModal) {
            handleCloseModal();
          }
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleOpenModal("settings");
          }
          break;
        case "l":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleOpenModal("links");
          }
          break;
        case "n":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleOpenModal("notes");
          }
          break;
        case "m":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleOpenModal("sounds");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [viewMode, activeModal]);

  useEffect(() => {
    (async () => {
      const d = await (window.chrome?.storage?.local?.get?.([
        "defaultEffect",
        "background",
        "workMin",
        "breakMin",
        "autoBackground",
      ]) ?? Promise.resolve({}));
      if (d.defaultEffect) setEffect(d.defaultEffect);
      if (d.workMin) setWorkMin(d.workMin);
      if (d.breakMin) setBreakMin(d.breakMin);

      // Handle background logic - Force Unsplash for now
      try {
        const dailyBg = await getDailyBackground();
        if (dailyBg) {
          setBackground(dailyBg);
          // Save preference for Unsplash
          window.chrome.storage.local.set({
            autoBackground: true,
            background: "", // Clear manual background
          });
        }
      } catch (error) {
        console.error("Failed to load daily background:", error);
        // Fallback to manual background if Unsplash fails
        if (d.background) {
          setBackground(d.background);
        }
      }
    })();
  }, []);

  const timeText = useMemo(() => {
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [now]);

  function startFocus() {
    setViewMode("focus");
    window.chrome.storage.session.set({ focusSessionActive: true });
    try {
      sessionStorage.setItem("autoStartPomodoro", "1");
    } catch {}
  }

  function exitFocus() {
    setViewMode("main");
    window.chrome.storage.session.set({ focusSessionActive: false });
  }

  function onComplete({ durationMin, taskTitle }) {
    const dateISO = new Date().toISOString();
    // Record session logic here if needed
    window.chrome.storage.session.set({ focusSessionActive: false });
  }

  function onStartFocus() {
    window.chrome.storage.session.set({ focusSessionActive: true });
  }

  function handleOpenModal(modalType) {
    if (modalType === "focus") {
      startFocus();
    } else {
      setActiveModal(modalType);
    }
  }

  function handleCloseModal() {
    setActiveModal(null);
  }

  return (
    <div
      className="min-h-screen relative text-white bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"
      style={{
        backgroundImage: background ? `url(${background})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <WeatherLayer
        effect={effect}
        ambientMuted={ambientMuted}
        ambientVolume={ambientVolume}
      />

      <div className="relative z-10 min-h-screen">
        {/* Icon Navigation */}
        <IconNav onOpenModal={handleOpenModal} viewMode={viewMode} />

        {/* Main Content */}
        <div className="transition-all duration-500 ease-in-out">
          {viewMode === "main" ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* Greeting */}
              <div className="animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-100">
                <Greeting />
              </div>

              {/* Large Clock */}
              <div className="text-8xl md:text-9xl font-light tracking-tight mb-8 drop-shadow-2xl animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-200">
                {timeText}
              </div>

              {/* Daily Focus Goal - Minimal */}
              <div className="mb-8 max-w-md w-full animate-in fade-in-0 slide-in-from-top-4 duration-700 delay-300">
                <DailyFocusGoal />
              </div>

              {/* Quote - Bottom Center */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
                <DailyQuote />
              </div>

              {/* Settings Icon - Bottom Left */}
              <button
                onClick={() => handleOpenModal("settings")}
                className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg animate-in fade-in-0 slide-in-from-left-4 duration-700 delay-500"
                title="Settings (Ctrl+S)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Keyboard Shortcuts Hint */}
              <div className="absolute bottom-6 right-6 text-xs text-white/50 animate-in fade-in-0 duration-1000 delay-1000">
                <div>Space: Start Focus</div>
                <div>Ctrl+S: Settings</div>
                <div>Ctrl+L: Links</div>
                <div>Ctrl+M: Sounds</div>
              </div>
            </div>
          ) : (
            /* Focus Mode */
            <div className="min-h-screen bg-black/30 backdrop-blur-sm animate-in fade-in-0 duration-500">
              {/* Focus Status Bar */}
              <div className="flex items-center justify-center pt-6 pb-4 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-100">
                <div className="px-4 py-2 bg-green-500/20 border border-green-400/50 rounded-full text-green-300 text-sm font-medium">
                  🟢 Focusing
                </div>
              </div>

              {/* Circular Timer */}
              <div className="animate-in fade-in-0 scale-in-95 duration-700 delay-200">
                <CircularTimer
                  onStartFocus={onStartFocus}
                  onComplete={onComplete}
                  autoStart={true}
                />
              </div>

              {/* Exit Focus Button */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
                <button
                  onClick={exitFocus}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-300 text-white hover:scale-105 hover:shadow-lg"
                >
                  Exit Focus
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <Modal
          isOpen={activeModal === "links"}
          onClose={handleCloseModal}
          title="Quick Links"
          size="lg"
        >
          <LinksModal />
        </Modal>

        <Modal
          isOpen={activeModal === "notes"}
          onClose={handleCloseModal}
          title="Quick Notes"
          size="md"
        >
          <NotesModal />
        </Modal>

        <Modal
          isOpen={activeModal === "sounds"}
          onClose={handleCloseModal}
          title="Sounds"
          size="lg"
        >
          <SoundsModal />
        </Modal>

        <Modal
          isOpen={activeModal === "settings"}
          onClose={handleCloseModal}
          title="Settings"
          size="lg"
        >
          <TimerSettingsModal />
        </Modal>

        <Modal
          isOpen={activeModal === "apps"}
          onClose={handleCloseModal}
          title="Apps & Widgets"
          size="lg"
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-medium mb-2">Apps & Widgets</h3>
            <p className="text-white/70">
              Coming soon! This will include weather, calendar, and other
              productivity widgets.
            </p>
          </div>
        </Modal>

        {/* Onboarding */}
        <Onboarding onComplete={() => window.location.reload()} />
      </div>
    </div>
  );
}
