import { useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/chromeStorage";

export default function LinksModal() {
  const [links, setLinks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", url: "", icon: "🔗" });

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    const data = await getLocal(["quickLinks"]);
    if (data.quickLinks && Array.isArray(data.quickLinks)) {
      setLinks(data.quickLinks);
    } else {
      // Default links for first-time users
      const defaultLinks = [
        { id: "1", label: "Gmail", url: "https://gmail.com", icon: "📧" },
        { id: "2", label: "GitHub", url: "https://github.com", icon: "🐙" },
        { id: "3", label: "Notion", url: "https://notion.so", icon: "📝" },
        {
          id: "4",
          label: "Calendar",
          url: "https://calendar.google.com",
          icon: "📅",
        },
      ];
      setLinks(defaultLinks);
      await setLocal({ quickLinks: defaultLinks });
    }
  }

  async function saveLinks(newLinks) {
    setLinks(newLinks);
    await setLocal({ quickLinks: newLinks });
  }

  function addLink() {
    if (newLink.label.trim() && newLink.url.trim()) {
      const link = {
        id: Date.now().toString(),
        label: newLink.label.trim(),
        url: newLink.url.trim().startsWith("http")
          ? newLink.url.trim()
          : `https://${newLink.url.trim()}`,
        icon: newLink.icon,
      };
      const updatedLinks = [...links, link];
      saveLinks(updatedLinks);
      setNewLink({ label: "", url: "", icon: "🔗" });
      setShowAddForm(false);
    }
  }

  function deleteLink(id) {
    const updatedLinks = links.filter((link) => link.id !== id);
    saveLinks(updatedLinks);
  }

  function moveLink(fromIndex, toIndex) {
    const updatedLinks = [...links];
    const [movedLink] = updatedLinks.splice(fromIndex, 1);
    updatedLinks.splice(toIndex, 0, movedLink);
    saveLinks(updatedLinks);
  }

  const commonIcons = [
    "🔗",
    "📧",
    "🐙",
    "📝",
    "📅",
    "💼",
    "🎵",
    "📊",
    "🔍",
    "📱",
    "💻",
    "🌐",
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white">Quick Links</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            Add Link
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {/* Add Link Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Label (e.g., Gmail)"
              value={newLink.label}
              onChange={(e) =>
                setNewLink({ ...newLink, label: e.target.value })
              }
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="URL (e.g., gmail.com)"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
            />
            <div className="flex gap-2">
              <select
                value={newLink.icon}
                onChange={(e) =>
                  setNewLink({ ...newLink, icon: e.target.value })
                }
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                {commonIcons.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
              <button
                onClick={addLink}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {links.map((link, index) => (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all duration-200 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{link.icon}</div>
                <div className="text-sm font-medium truncate text-white">
                  {link.label}
                </div>
              </div>
            </a>

            {isEditing && (
              <div className="absolute -top-2 -right-2 flex gap-1">
                {index > 0 && (
                  <button
                    onClick={() => moveLink(index, index - 1)}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs"
                    title="Move up"
                  >
                    ↑
                  </button>
                )}
                {index < links.length - 1 && (
                  <button
                    onClick={() => moveLink(index, index + 1)}
                    className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs"
                    title="Move down"
                  >
                    ↓
                  </button>
                )}
                <button
                  onClick={() => deleteLink(link.id)}
                  className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {links.length === 0 && (
        <div className="text-center py-8 opacity-60 text-white">
          <div className="text-4xl mb-2">🔗</div>
          <div>No quick links yet</div>
          <div className="text-sm">Click "Add Link" to get started</div>
        </div>
      )}
    </div>
  );
}
