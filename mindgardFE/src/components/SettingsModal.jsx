import { useState } from "react";
import { Clock, RotateCcw, FastForward, Plus, X } from "lucide-react";

export default function TimerSettingsModal({ isOpen, onClose, focusTime, breakTime, onFocusTimeChange, onBreakTimeChange }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4" onClick={onClose}>
      <div 
        className="bg-gray-900/95 backdrop-blur-sm rounded-xl w-80 p-6 shadow-2xl border border-gray-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Pomodoro</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
            </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <button 
            onClick={handleCompleteTimer}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            <FastForward className="w-4 h-4" />
            <span className="text-sm font-medium">Complete timer</span>
          </button>
          
          <button 
            onClick={handleRestartTimer}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Restart timer</span>
          </button>
          
          <button 
            onClick={handleAddTime}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add 10 minutes</span>
          </button>
          </div>

        {/* Duration Settings */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Focus</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLocalFocusTime(Math.max(1, localFocusTime - 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-sm"
              >
                -
              </button>
              <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                {localFocusTime} min
              </span>
              <button 
                onClick={() => setLocalFocusTime(Math.min(60, localFocusTime + 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-sm"
              >
                +
              </button>
        </div>
      </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Break</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLocalBreakTime(Math.max(1, localBreakTime - 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-sm"
              >
                -
              </button>
              <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                {localBreakTime} min
              </span>
              <button 
                onClick={() => setLocalBreakTime(Math.min(30, localBreakTime + 1))}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-white text-sm"
              >
                +
              </button>
          </div>
        </div>
      </div>

        {/* Toggle Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Timer sound effects</span>
            <button
              onClick={() => setTimerSoundEffects(!timerSoundEffects)}
              className={`w-12 h-6 rounded-full transition-colors ${
                timerSoundEffects ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                timerSoundEffects ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Auto-start timers</span>
            <button
              onClick={() => setAutoStartTimers(!autoStartTimers)}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoStartTimers ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                autoStartTimers ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Hide seconds</span>
            <button
              onClick={() => setHideSeconds(!hideSeconds)}
              className={`w-12 h-6 rounded-full transition-colors ${
                hideSeconds ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                hideSeconds ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium">Browser notifications</span>
            <button
              onClick={() => setBrowserNotifications(!browserNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                browserNotifications ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                browserNotifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
        </div>
      </div>

        {/* Save Button */}
          <button
          onClick={handleSave}
          className="w-full mt-6 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors"
          >
          Save Settings
          </button>
      </div>
    </div>
  );
}
