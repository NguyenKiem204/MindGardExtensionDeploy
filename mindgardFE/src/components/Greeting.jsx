import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function Greeting() {
  const [userName, setUserName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    getLocal(["userName"]).then((data) => {
      if (data.userName) {
        setUserName(data.userName);
      } else {
        setIsEditing(true);
      }
    });
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function handleSaveName() {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setLocal({ userName: tempName.trim() });
      setIsEditing(false);
    }
  }

  function handleEdit() {
    setTempName(userName);
    setIsEditing(true);
  }

  if (isEditing) {
    return (
      <div className="text-center mb-4">
        <div className="text-lg opacity-90 mb-4">
          Welcome! What should we call you?
        </div>
        <div className="flex items-center justify-center gap-3">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Enter your name"
            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSaveName()}
            autoFocus
          />
          <button
            onClick={handleSaveName}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-4">
      <div className="text-lg opacity-90 mb-2">
        {getGreeting()}, {userName}
      </div>
      <button
        onClick={handleEdit}
        className="text-sm opacity-60 hover:opacity-100 transition-opacity"
      >
        Change name
      </button>
    </div>
  );
}
