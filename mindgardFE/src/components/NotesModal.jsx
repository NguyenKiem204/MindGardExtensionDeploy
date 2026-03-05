import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function NotesModal() {
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const data = await getLocal(["quickNotes"]);
    if (data.quickNotes) {
      setNotes(data.quickNotes);
    }
  }

  async function saveNotes() {
    await setLocal({ quickNotes: notes });
    setIsEditing(false);
  }

  function handleNotesChange(e) {
    setNotes(e.target.value);
    // Auto-save after 1 second of no typing
    clearTimeout(window.notesTimeout);
    window.notesTimeout = setTimeout(saveNotes, 1000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Quick Notes</h3>
        <div className="text-xs opacity-60 text-white">
          Auto-saves as you type
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          onFocus={() => setIsEditing(true)}
          placeholder="Jot down your thoughts, ideas, or quick notes here..."
          className="w-full h-64 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setNotes("");
              saveNotes();
            }}
            className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded transition-colors"
          >
            Clear
          </button>
          <button
            onClick={saveNotes}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
