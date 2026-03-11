import { useState } from "react";
import { Clock, RotateCcw, FastForward, Plus, X } from "lucide-react";

export default function TimerSettingsModal({
  isOpen,
  onClose,
  position = { x: 0, y: 0 },
  focusTime,
  breakTime,
  onFocusTimeChange,
  onBreakTimeChange,
  onComplete,
  onRestart,
  onAdd10Min,
  // New settings props
  timerSoundEnabled,
  onTimerSoundToggle,
  autoStartEnabled,
  onAutoStartToggle,
  hideSecondsEnabled,
  onHideSecondsToggle,
  notificationsEnabled,
  onNotificationsToggle,
  // Pro Mode props
  proModePlan,
}) {
  const [localFocusTime, setLocalFocusTime] = useState(focusTime);
  const [localBreakTime, setLocalBreakTime] = useState(breakTime);

  const handleSave = () => {
    const f = Math.max(1, Math.min(999, parseInt(localFocusTime) || focusTime));
    const b = Math.max(1, Math.min(999, parseInt(localBreakTime) || breakTime));
    onFocusTimeChange(f);
    onBreakTimeChange(b);
    onClose();
  };

  const handleCompleteTimer = () => {
    onComplete?.();
    onClose();
  };

  const handleRestartTimer = () => {
    onRestart?.();
    onClose();
  };

  const handleAddTime = () => {
    onAdd10Min?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all" onClick={onClose}>
      <div
        className="absolute bg-black/50 backdrop-blur-sm rounded-2xl w-64 p-4 shadow-2xl border border-white/10"
        style={{
          left: `${position.x}px`,
          top: `${position.y + 30}px`,
          transform: 'translateX(-100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/90" />
            <h2 className="text-sm font-semibold text-white">Pomodoro</h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Pro Mode indicator */}
        {proModePlan && (() => {
          const totalFocusSessions = proModePlan.sessions.filter(s => s.type === 'focus').length;
          const currentFocusIdx = proModePlan.sessions.slice(0, proModePlan.currentIndex + 1).filter(s => s.type === 'focus').length;
          return (
            <div className="mb-3 px-2.5 py-1.5 bg-orange-500/15 rounded-lg border border-orange-500/20 flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Pro Mode</span>
              <span className="text-[10px] text-white/50">•</span>
              <span className="text-[10px] text-white/70">Session {currentFocusIdx}/{totalFocusSessions}</span>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          <button
            onClick={handleCompleteTimer}
            className="w-full flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/50 rounded-xl text-white/90 transition-all border border-white/5"
          >
            <FastForward className="w-3 h-3" />
            <span className="text-xs font-medium">Complete</span>
          </button>

          <button
            onClick={handleRestartTimer}
            className="w-full flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/50 rounded-xl text-white/90 transition-all border border-white/5"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-xs font-medium">Restart</span>
          </button>

          <button
            onClick={handleAddTime}
            className="w-full flex items-center gap-2 px-3 py-2 bg-black/20 hover:bg-black/50 rounded-xl text-white/90 transition-all border border-white/5"
          >
            <Plus className="w-3 h-3" />
            <span className="text-xs font-medium">+10 min</span>
          </button>
        </div>

        {/* Duration Settings */}
        <div className="space-y-4 mb-5">
          {/* Focus Duration */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-xs font-medium">Focus</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLocalFocusTime(prev => Math.max(1, (parseInt(prev) || 0) - 1))}
                className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/50 flex items-center justify-center text-white transition-all border border-white/5"
              >
                -
              </button>
              <div className="flex items-center bg-black/30 rounded-lg px-2 py-1 border border-white/5 min-w-[54px] justify-center text-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={localFocusTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) setLocalFocusTime(val);
                  }}
                  className="bg-transparent text-white text-xs font-bold w-7 text-center outline-none"
                />
                <span className="text-white/30 text-[9px] ml-0.5 font-bold uppercase tracking-wider">m</span>
              </div>
              <button
                onClick={() => setLocalFocusTime(prev => Math.min(999, (parseInt(prev) || 0) + 1))}
                className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/50 flex items-center justify-center text-white transition-all border border-white/5"
              >
                +
              </button>
            </div>
          </div>

          {/* Break Duration */}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-xs font-medium">Break</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLocalBreakTime(prev => Math.max(1, (parseInt(prev) || 0) - 1))}
                className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/50 flex items-center justify-center text-white transition-all border border-white/5"
              >
                -
              </button>
              <div className="flex items-center bg-black/30 rounded-lg px-2 py-1 border border-white/5 min-w-[54px] justify-center text-center">
                <input
                  type="text"
                  inputMode="numeric"
                  value={localBreakTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) setLocalBreakTime(val);
                  }}
                  className="bg-transparent text-white text-xs font-bold w-7 text-center outline-none"
                />
                <span className="text-white/30 text-[9px] ml-0.5 font-bold uppercase tracking-wider">m</span>
              </div>
              <button
                onClick={() => setLocalBreakTime(prev => Math.min(999, (parseInt(prev) || 0) + 1))}
                className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/50 flex items-center justify-center text-white transition-all border border-white/5"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          {[
            { label: "Sound effects", value: timerSoundEnabled, setter: onTimerSoundToggle },
            { label: "Auto-start", value: autoStartEnabled, setter: onAutoStartToggle },
            { label: "Hide seconds", value: hideSecondsEnabled, setter: onHideSecondsToggle },
            { label: "Notifications", value: notificationsEnabled, setter: onNotificationsToggle }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-white/70 text-[11px] font-medium">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold tracking-widest ${item.value ? 'text-orange-400' : 'text-white/20'}`}>
                  {item.value ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={item.setter}
                  className={`w-9 h-4.5 rounded-full transition-all relative ${item.value ? 'bg-orange-500' : 'bg-black/30 border border-white/10'
                    }`}
                >
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-all ${item.value ? 'left-[1.25rem]' : 'left-0.5'
                    }`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full mt-5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/10"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}