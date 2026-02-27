import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";

const TABS = [
  { id: "general", label: "General", icon: "⚙️" },
  { id: "focus", label: "Focus", icon: "🍅" },
  { id: "blocking", label: "AI Blocking", icon: "🛡️" },
  { id: "appearance", label: "Appearance", icon: "🎨" },
];

function OptionsApp() {
  const [activeTab, setActiveTab] = useState("general");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [aiBlockingEnabled, setAiBlockingEnabled] = useState(true);
  const [defaultEffect, setDefaultEffect] = useState("rain");
  const [background, setBackground] = useState("");
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [saved, setSaved] = useState(false);
  const [blockList, setBlockList] = useState("");
  const [allowList, setAllowList] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await (window.chrome?.storage?.local?.get?.([
          "geminiApiKey",
          "aiBlockingEnabled",
          "defaultEffect",
          "background",
          "workMin",
          "breakMin",
          "blockedDomains",
          "allowedDomains",
        ]) ?? Promise.resolve({}));
        setGeminiApiKey(data.geminiApiKey ?? "");
        setAiBlockingEnabled(data.aiBlockingEnabled ?? true);
        setDefaultEffect(data.defaultEffect ?? "rain");
        setBackground(data.background ?? "");
        setWorkMin(data.workMin ?? 25);
        setBreakMin(data.breakMin ?? 5);
        setBlockList(data.blockedDomains ?? "");
        setAllowList(data.allowedDomains ?? "");
      } catch {}
    }
    load();
  }, []);

  async function save() {
    setSaved(false);
    await (window.chrome?.storage?.local?.set?.({
      geminiApiKey,
      aiBlockingEnabled,
      defaultEffect,
      background,
      workMin,
      breakMin,
      blockedDomains: blockList,
      allowedDomains: allowList,
    }) ?? Promise.resolve());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const backgroundOptions = [
    { label: "No background (default)", value: "" },
    {
      label: "Minimal Gradient",
      value:
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop",
      group: "Minimal & Clean",
    },
    {
      label: "Soft Blue",
      value:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
      group: "Minimal & Clean",
    },
    {
      label: "Warm Gradient",
      value:
        "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1920&h=1080&fit=crop",
      group: "Minimal & Clean",
    },
    {
      label: "Forest",
      value:
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop",
      group: "Nature",
    },
    {
      label: "Mountain Lake",
      value:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
      group: "Nature",
    },
    {
      label: "Ocean Waves",
      value:
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop",
      group: "Nature",
    },
    {
      label: "Geometric",
      value:
        "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&h=1080&fit=crop",
      group: "Abstract",
    },
    {
      label: "Soft Patterns",
      value:
        "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1920&h=1080&fit=crop",
      group: "Abstract",
    },
    { label: "Custom URL...", value: "custom", group: "Custom" },
  ];

  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Default Weather Effect
                  </label>
                  <select
                    value={defaultEffect}
                    onChange={(e) => setDefaultEffect(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="rain">Rain</option>
                    <option value="snow">Snow</option>
                    <option value="sunny">Sunny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Background Image
                  </label>
                  <div className="space-y-2">
                    <select
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      {backgroundOptions.map((opt) =>
                        opt.group ? (
                          <optgroup key={opt.group} label={opt.group}>
                            <option value={opt.value}>{opt.label}</option>
                          </optgroup>
                        ) : (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        )
                      )}
                    </select>
                    {background === "custom" && (
                      <input
                        value=""
                        onChange={(e) => setBackground(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full border rounded px-3 py-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "focus":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pomodoro Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Work Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={workMin}
                    onChange={(e) => setWorkMin(Number(e.target.value) || 25)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={breakMin}
                    onChange={(e) => setBreakMin(Number(e.target.value) || 5)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "blocking":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                AI Content Blocking
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="ai"
                    type="checkbox"
                    checked={aiBlockingEnabled}
                    onChange={(e) => setAiBlockingEnabled(e.target.checked)}
                  />
                  <label htmlFor="ai">
                    Enable AI content classification & blocking
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gemini API Key
                  </label>
                  <input
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for AI blocking. Get free key at{" "}
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Blocked Domains (one per line)
                  </label>
                  <textarea
                    value={blockList}
                    onChange={(e) => setBlockList(e.target.value)}
                    rows={4}
                    placeholder="youtube.com&#10;facebook.com"
                    className="w-full border rounded px-3 py-2"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Allowed Domains (one per line)
                  </label>
                  <textarea
                    value={allowList}
                    onChange={(e) => setAllowList(e.target.value)}
                    rows={4}
                    placeholder="docs.google.com&#10;stackoverflow.com"
                    className="w-full border rounded px-3 py-2"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Appearance Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Background Style
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBackground("")}
                      className={`p-3 rounded-lg border transition-colors ${
                        background === ""
                          ? "bg-blue-500/20 border-blue-400"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-2xl mb-1">🌈</div>
                      <div className="text-sm">Default Gradient</div>
                    </button>
                    <button
                      onClick={() => setBackground("auto")}
                      className={`p-3 rounded-lg border transition-colors ${
                        background === "auto"
                          ? "bg-blue-500/20 border-blue-400"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-2xl mb-1">🔄</div>
                      <div className="text-sm">Daily Auto-Change</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Weather Effect
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["rain", "snow", "sunny"].map((effect) => (
                      <button
                        key={effect}
                        onClick={() => setDefaultEffect(effect)}
                        className={`p-3 rounded-lg border transition-colors ${
                          defaultEffect === effect
                            ? "bg-blue-500/20 border-blue-400"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="text-2xl mb-1">
                          {effect === "rain"
                            ? "🌧️"
                            : effect === "snow"
                            ? "❄️"
                            : "☀️"}
                        </div>
                        <div className="text-xs capitalize">{effect}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Focus Dashboard Settings</h1>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">{renderTabContent()}</div>

          {/* Save Button */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Settings are saved automatically to your browser
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                {saved && (
                  <span className="text-green-600 text-sm">Saved!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("options-root")).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
