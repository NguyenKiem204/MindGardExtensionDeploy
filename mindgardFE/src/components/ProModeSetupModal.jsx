import { useState, useMemo } from "react";
import { X, Clock, Play, Zap } from "lucide-react";

const FOCUS_STYLES = [
  {
    id: "short",
    label: "Short Focus",
    desc: "25m focus / 5m break",
    focus: 25,
    break: 5,
  },
  {
    id: "medium",
    label: "Medium Focus",
    desc: "40m focus / 10m break",
    focus: 40,
    break: 10,
  },
  {
    id: "deep",
    label: "Deep Work",
    desc: "50m focus / 15m break",
    focus: 50,
    break: 15,
  },
];

const TIME_PRESETS = [
  { label: "1h", minutes: 60 },
  { label: "1.5h", minutes: 90 },
  { label: "2h", minutes: 120 },
  { label: "3h", minutes: 180 },
  { label: "4h", minutes: 240 },
];

/**
 * Build the session plan from totalMinutes + focusStyle.
 * Last session may be shorter if totalMinutes doesn't divide evenly.
 * The last item is always a focus session (no trailing break).
 */
function buildSessionPlan(totalMinutes, focusStyle) {
  const { focus, break: breakDuration } = focusStyle;
  const cycle = focus + breakDuration;
  const sessions = [];
  let remaining = totalMinutes;

  while (remaining > 0) {
    if (remaining >= cycle) {
      sessions.push({ type: "focus", duration: focus });
      sessions.push({ type: "break", duration: breakDuration });
      remaining -= cycle;
    } else if (remaining > 0) {
      const lastFocus = Math.min(remaining, focus);
      sessions.push({ type: "focus", duration: lastFocus });
      remaining -= lastFocus;
      if (remaining > 0) {
        const lastBreak = Math.min(remaining, breakDuration);
        sessions.push({ type: "break", duration: lastBreak });
        remaining -= lastBreak;
      }
    }
  }

  // Remove trailing break
  if (sessions.length > 0 && sessions[sessions.length - 1].type === "break") {
    sessions.pop();
  }

  return sessions;
}

export default function ProModeSetupModal({ isOpen, onClose, onStartPlan }) {
  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(0);
  const [selectedStyleId, setSelectedStyleId] = useState("short");

  const totalMinutes = hours * 60 + minutes;
  const selectedStyle = FOCUS_STYLES.find((s) => s.id === selectedStyleId);

  const sessionPlan = useMemo(() => {
    if (totalMinutes < 15 || !selectedStyle) return [];
    return buildSessionPlan(totalMinutes, selectedStyle);
  }, [totalMinutes, selectedStyleId]);

  const focusSessions = sessionPlan.filter((s) => s.type === "focus");
  const totalFocusMin = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalBreakMin = sessionPlan
    .filter((s) => s.type === "break")
    .reduce((sum, s) => sum + s.duration, 0);

  const handleStart = () => {
    if (sessionPlan.length === 0) return;
    onStartPlan({
      sessions: sessionPlan,
      focusStyle: selectedStyle,
      totalMinutes,
      currentIndex: 0,
    });
    onClose();
  };

  if (!isOpen) return null;

  const isValid = totalMinutes >= 15 && totalMinutes <= 720;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-start p-4" onClick={onClose}>
      <style>{`
        .pro-scrollbar::-webkit-scrollbar { width: 5px; }
        .pro-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        .pro-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .pro-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
      `}</style>
      <div
        className="bg-black/50 rounded-2xl w-full max-w-sm max-h-[70vh] overflow-hidden shadow-2xl mb-20 ml-4 border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-white">Pro Mode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 overflow-y-auto pro-scrollbar flex-1">
          {/* Total Time */}
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2.5">
              Tổng thời gian học
            </p>

            {/* Presets */}
            <div className="flex gap-1.5 mb-2.5">
              {TIME_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => {
                    setHours(Math.floor(preset.minutes / 60));
                    setMinutes(preset.minutes % 60);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${totalMinutes === preset.minutes
                      ? "bg-white/20 text-white"
                      : "bg-black/40 text-white/50 hover:bg-black/60 border border-white/5"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={hours}
                  onChange={(e) =>
                    setHours(Math.max(0, Math.min(12, parseInt(e.target.value) || 0)))
                  }
                  className="bg-transparent text-white text-sm font-bold w-8 text-center outline-none"
                />
                <span className="text-white/30 text-[10px]">giờ</span>
              </div>
              <span className="text-white/20">:</span>
              <div className="flex items-center gap-1.5 bg-black/40 rounded-xl px-3 py-2 border border-white/10">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                  }
                  className="bg-transparent text-white text-sm font-bold w-8 text-center outline-none"
                />
                <span className="text-white/30 text-[10px]">phút</span>
              </div>
              <span className="ml-auto text-xs text-white/40">{totalMinutes} phút</span>
            </div>

            {!isValid && totalMinutes > 0 && (
              <p className="text-red-400/80 text-[10px] mt-1.5">
                {totalMinutes < 15 ? "Tối thiểu 15 phút" : "Tối đa 12 giờ"}
              </p>
            )}
          </div>

          {/* Focus Style */}
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2.5">
              Kiểu tập trung
            </p>
            <div className="space-y-1.5">
              {FOCUS_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all border ${selectedStyleId === style.id
                      ? "bg-black/60 border-white/20"
                      : "bg-black/40 border-white/5 hover:bg-black/50"
                    }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-medium text-white">{style.label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{style.desc}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedStyleId === style.id
                        ? "border-amber-400 bg-amber-400"
                        : "border-white/20"
                      }`}
                  >
                    {selectedStyleId === style.id && (
                      <div className="w-1.5 h-1.5 bg-black rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Plan Preview */}
          {isValid && sessionPlan.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2.5">
                Kế hoạch
              </p>

              {/* Summary row */}
              <div className="flex items-center gap-3 mb-2.5 text-xs">
                <span className="text-white font-medium">{focusSessions.length} sessions</span>
                <span className="text-white/20">·</span>
                <span className="text-white/60">{totalFocusMin}m focus</span>
                <span className="text-white/20">·</span>
                <span className="text-white/60">{totalBreakMin}m break</span>
              </div>

              {/* Timeline */}
              <div className="space-y-1 max-h-36 overflow-y-auto pro-scrollbar pr-1">
                {sessionPlan.map((session, idx) => {
                  const focusIdx =
                    session.type === "focus"
                      ? sessionPlan.slice(0, idx + 1).filter((s) => s.type === "focus").length
                      : null;
                  const isShort =
                    session.type === "focus" && session.duration < selectedStyle.focus;

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5"
                    >
                      <span className="text-[11px] text-white/70">
                        {session.type === "focus" ? `Session ${focusIdx}` : "Break"}
                        {isShort && (
                          <span className="ml-1 text-[9px] text-white/30">(ngắn)</span>
                        )}
                      </span>
                      <span className={`text-[11px] font-medium ${session.type === "focus" ? "text-white/90" : "text-white/50"
                        }`}>
                        {session.duration}m
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleStart}
            disabled={!isValid || sessionPlan.length === 0}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${isValid && sessionPlan.length > 0
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
                : "bg-black/40 text-white/20 cursor-not-allowed"
              }`}
          >
            <Play className="w-3.5 h-3.5" />
            Bắt đầu ({focusSessions.length} sessions)
          </button>
        </div>
      </div>
    </div>
  );
}

export { buildSessionPlan, FOCUS_STYLES };
