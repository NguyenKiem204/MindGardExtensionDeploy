import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";
import {
  showGoalCompleteCelebration,
  addCelebrationStyles,
} from "../utils/celebrations";

export default function DailyFocusGoal() {
  const [focusGoal, setFocusGoal] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState("");

  useEffect(() => {
    loadTodayGoal();
    addCelebrationStyles();
  }, []);

  async function loadTodayGoal() {
    const today = new Date().toISOString().split("T")[0];
    const data = await getLocal(["dailyFocus"]);

    if (data.dailyFocus?.date === today) {
      setFocusGoal(data.dailyFocus.text);
      setCompleted(data.dailyFocus.completed);
    } else {
      setIsEditing(true);
    }
  }

  async function saveGoal() {
    if (tempGoal.trim()) {
      const today = new Date().toISOString().split("T")[0];
      const newGoal = {
        date: today,
        text: tempGoal.trim(),
        completed: false,
      };

      setFocusGoal(tempGoal.trim());
      setCompleted(false);
      setIsEditing(false);
      await setLocal({ dailyFocus: newGoal });
    }
  }

  async function toggleCompleted() {
    const newCompleted = !completed;
    setCompleted(newCompleted);

    const today = new Date().toISOString().split("T")[0];
    await setLocal({
      dailyFocus: {
        date: today,
        text: focusGoal,
        completed: newCompleted,
      },
    });

    if (newCompleted) {
      // Show celebration
      showGoalCompleteCelebration();
    }
  }

  if (isEditing) {
    return (
      <div className="text-center mb-8">
        <div className="text-lg opacity-90 mb-4">
          What is your main focus today?
        </div>
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <input
            type="text"
            value={tempGoal}
            onChange={(e) => setTempGoal(e.target.value)}
            placeholder="Enter your focus goal..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && saveGoal()}
            autoFocus
          />
          <button
            onClick={saveGoal}
            className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Set Goal
          </button>
        </div>
      </div>
    );
  }

  if (!focusGoal) {
    return (
      <div className="text-center mb-8">
        <button
          onClick={() => setIsEditing(true)}
          className="text-lg opacity-90 hover:opacity-100 transition-opacity px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
        >
          Set your focus for today
        </button>
      </div>
    );
  }

  return (
    <div className="text-center mb-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-3 mb-4">
        <input
          type="checkbox"
          checked={completed}
          onChange={toggleCompleted}
          className="w-5 h-5 text-green-600 bg-white/10 border-white/20 rounded focus:ring-green-500"
        />
        <div
          className={`text-lg ${
            completed ? "line-through opacity-60" : "opacity-90"
          }`}
        >
          {focusGoal}
        </div>
      </div>
      {completed && (
        <div className="text-sm text-green-400 mb-2 goal-celebration">
          🎉 Great job! You completed your focus goal!
        </div>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
      >
        Edit goal
      </button>
    </div>
  );
}
