import { useState } from "react";
import { Clock, RotateCcw, FastForward, Plus, X } from "lucide-react";

export default function TimerSettingsModal({ isOpen, onClose, position = { x: 0, y: 0 }, focusTime, breakTime, onFocusTimeChange, onBreakTimeChange }) {
  const [localFocusTime, setLocalFocusTime] = useState(focusTime);
  const [localBreakTime, setLocalBreakTime] = useState(breakTime);
  const [timerSoundEffects, setTimerSoundEffects] = useState(true);
  const [autoStartTimers, setAutoStartTimers] = useState(true);
  const [hideSeconds, setHideSeconds] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  const handleSave = () => {
    onFocusTimeChange(localFocusTime);
    onBreakTimeChange(localBreakTime);
    onClose();
  };

  const handleCompleteTimer = () => {
    // Logic to complete current timer
    console.log('Complete timer');
    onClose();
  };

  const handleRestartTimer = () => {
    // Logic to restart timer
    console.log('Restart timer');
    onClose();
  };

  const handleAddTime = () => {
    // Logic to add 10 minutes
    console.log('Add 10 minutes');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute bg-gray-900/95 backdrop-blur-sm rounded-xl w-60 p-3 shadow-2xl border border-gray-700/50"
        style={{
          left: `${position.x}px`,
          top: `${position.y + 30}px`,
          transform: 'translateX(-100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white" />
            <h2 className="text-sm font-semibold text-white">Pomodoro</h2>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5 mb-3">
          <button 
            onClick={handleCompleteTimer}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
          >
            <FastForward className="w-2.5 h-2.5" />
            <span className="text-xs font-medium">Complete</span>
          </button>
          
          <button 
            onClick={handleRestartTimer}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span className="text-xs font-medium">Restart</span>
          </button>
          
          <button 
            onClick={handleAddTime}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-white transition-colors"
          >
            <Plus className="w-2.5 h-2.5" />
            <span className="text-xs font-medium">+10 min</span>
          </button>
        </div>

        {/* Duration Settings */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Focus</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setLocalFocusTime(Math.max(1, localFocusTime - 1))}
                className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-xs"
              >
                -
              </button>
              <span className="text-white text-xs font-medium min-w-[2rem] text-center">
                {localFocusTime} min
              </span>
              <button 
                onClick={() => setLocalFocusTime(Math.min(60, localFocusTime + 1))}
                className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-xs"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Break</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setLocalBreakTime(Math.max(1, localBreakTime - 1))}
                className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-xs"
              >
                -
              </button>
              <span className="text-white text-xs font-medium min-w-[2rem] text-center">
                {localBreakTime} min
              </span>
              <button 
                onClick={() => setLocalBreakTime(Math.min(30, localBreakTime + 1))}
                className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Sound effects</span>
            <button
              onClick={() => setTimerSoundEffects(!timerSoundEffects)}
              className={`w-10 h-5 rounded-full transition-colors ${
                timerSoundEffects ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                timerSoundEffects ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Auto-start</span>
            <button
              onClick={() => setAutoStartTimers(!autoStartTimers)}
              className={`w-10 h-5 rounded-full transition-colors ${
                autoStartTimers ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                autoStartTimers ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Hide seconds</span>
            <button
              onClick={() => setHideSeconds(!hideSeconds)}
              className={`w-10 h-5 rounded-full transition-colors ${
                hideSeconds ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                hideSeconds ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">Notifications</span>
            <button
              onClick={() => setBrowserNotifications(!browserNotifications)}
              className={`w-10 h-5 rounded-full transition-colors ${
                browserNotifications ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                browserNotifications ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full mt-4 px-3 py-2 bg-orange-500 hover:bg-orange-600 rounded-md text-white text-xs font-medium transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}